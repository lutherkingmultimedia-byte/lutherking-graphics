const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY || '';

module.exports = async function handler(request, response) {
  if (request.method !== 'GET') {
    response.status(405).json({ message: 'Method not allowed' });
    return;
  }

  if (!paystackSecretKey) {
    response.status(500).json({ message: 'Paystack secret key is missing on the server.' });
    return;
  }

  const reference = request.query?.reference;
  if (!reference) {
    response.status(400).json({ message: 'Payment reference is required.' });
    return;
  }

  const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: {
      Authorization: `Bearer ${paystackSecretKey}`
    }
  });

  const result = await paystackResponse.json();
  if (!paystackResponse.ok || !result.status) {
    response.status(502).json({ message: result.message || 'Paystack verification failed.' });
    return;
  }

  response.status(200).json({
    paid: result.data.status === 'success',
    status: result.data.status,
    amount: result.data.amount / 100,
    currency: result.data.currency,
    reference: result.data.reference
  });
};
