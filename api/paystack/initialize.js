const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY || '';
const designerSubaccountCode = process.env.PAYSTACK_DESIGNER_SUBACCOUNT_CODE || '';

function getOrigin(request) {
  const proto = request.headers['x-forwarded-proto'] || 'https';
  return `${proto}://${request.headers.host}`;
}

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ message: 'Method not allowed' });
    return;
  }

  if (!paystackSecretKey) {
    response.status(500).json({ message: 'Paystack secret key is missing on the server.' });
    return;
  }

  const amount = Number(request.body?.amount);
  const email = String(request.body?.email || '').trim();
  const orderId = String(request.body?.orderId || '').trim();

  if (!email || !orderId || !Number.isFinite(amount) || amount <= 0) {
    response.status(400).json({ message: 'Email, order ID, and amount are required.' });
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
    response.status(502).json({ message: result.message || 'Paystack initialization failed.' });
    return;
  }

  response.status(200).json({
    authorizationUrl: result.data.authorization_url,
    reference: result.data.reference
  });
};
