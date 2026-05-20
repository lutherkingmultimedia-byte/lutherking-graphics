const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
loadEnvFile(path.join(root, '.env'));

const port = Number(process.env.PORT || 4173);
const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY || '';
const designerSubaccountCode = process.env.PAYSTACK_DESIGNER_SUBACCOUNT_CODE || '';
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, '');
    if (key && !process.env[key]) process.env[key] = value;
  }
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error('Request body too large'));
        request.destroy();
      }
    });
    request.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    request.on('error', reject);
  });
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function getOrigin(request) {
  return `http://${request.headers.host || `127.0.0.1:${port}`}`;
}

async function initializePaystack(request, response) {
  if (!paystackSecretKey) {
    sendJson(response, 500, { message: 'Paystack secret key is missing on the server.' });
    return;
  }

  const body = await readJson(request);
  const amount = Number(body.amount);
  const email = String(body.email || '').trim();
  const orderId = String(body.orderId || '').trim();

  if (!email || !orderId || !Number.isFinite(amount) || amount <= 0) {
    sendJson(response, 400, { message: 'Email, order ID, and amount are required.' });
    return;
  }

  const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${paystackSecretKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email,
      amount: Math.round(amount * 100),
      currency: 'GHS',
      callback_url: `${getOrigin(request)}/?payment=verify&order=${encodeURIComponent(orderId)}`,
      ...(designerSubaccountCode
        ? {
            subaccount: designerSubaccountCode,
            transaction_charge: Math.round(amount * 100 * 0.3)
          }
        : {}),
      metadata: {
        order_id: orderId,
        brand: 'LutherKing Graphics',
        owner_share: '30%',
        designer_share: designerSubaccountCode ? '70%' : 'not configured'
      }
    })
  });

  const result = await paystackResponse.json();
  if (!paystackResponse.ok || !result.status) {
    sendJson(response, 502, { message: result.message || 'Paystack initialization failed.' });
    return;
  }

  sendJson(response, 200, {
    authorizationUrl: result.data.authorization_url,
    reference: result.data.reference
  });
}

async function verifyPaystack(request, response) {
  if (!paystackSecretKey) {
    sendJson(response, 500, { message: 'Paystack secret key is missing on the server.' });
    return;
  }

  const url = new URL(request.url, getOrigin(request));
  const reference = url.searchParams.get('reference');
  if (!reference) {
    sendJson(response, 400, { message: 'Payment reference is required.' });
    return;
  }

  const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: {
      Authorization: `Bearer ${paystackSecretKey}`
    }
  });

  const result = await paystackResponse.json();
  if (!paystackResponse.ok || !result.status) {
    sendJson(response, 502, { message: result.message || 'Paystack verification failed.' });
    return;
  }

  sendJson(response, 200, {
    paid: result.data.status === 'success',
    status: result.data.status,
    amount: result.data.amount / 100,
    currency: result.data.currency,
    reference: result.data.reference
  });
}

http
  .createServer(async (request, response) => {
    try {
      if (request.url.startsWith('/api/paystack/initialize') && request.method === 'POST') {
        await initializePaystack(request, response);
        return;
      }

      if (request.url.startsWith('/api/paystack/verify') && request.method === 'GET') {
        await verifyPaystack(request, response);
        return;
      }
    } catch (error) {
      sendJson(response, 500, { message: error.message || 'Server error' });
      return;
    }

    let requestPath = decodeURIComponent(request.url.split('?')[0]);
    if (requestPath === '/') requestPath = '/index.html';

    let filePath = path.normalize(path.join(root, requestPath));
    if (!filePath.startsWith(root)) {
      response.writeHead(403);
      response.end('Forbidden');
      return;
    }

    if (!path.extname(filePath) && fs.existsSync(`${filePath}.html`)) {
      filePath = `${filePath}.html`;
    }

    fs.readFile(filePath, (error, data) => {
      if (error) {
        response.writeHead(404);
        response.end('Not found');
        return;
      }

      response.writeHead(200, {
        'Content-Type': types[path.extname(filePath)] || 'application/octet-stream'
      });
      response.end(data);
    });
  })
  .listen(port, '127.0.0.1', () => {
    console.log(`LutherKing Graphics site running at http://127.0.0.1:${port}`);
  });
