/* ============================================
   GURUTECH API - M-Pesa STK Push Integration
   Daraja API v2
   ============================================ */

const express = require('express');
const router = express.Router();
const axios = require('axios');

// M-Pesa configuration
const MPESA_CONFIG = {
  consumerKey: process.env.MPESA_CONSUMER_KEY || 'test-key',
  consumerSecret: process.env.MPESA_CONSUMER_SECRET || 'test-secret',
  passkey: process.env.MPESA_PASSKEY || 'test-passkey',
  shortcode: process.env.MPESA_SHORTCODE || '174379',
  callbackUrl: process.env.MPESA_CALLBACK_URL || 'https://gurutech.co.ke/api/mpesa/callback',
  environment: process.env.MPESA_ENVIRONMENT || 'sandbox'
};

const BASE_URL = MPESA_CONFIG.environment === 'production' 
  ? 'https://api.safaricom.co.ke' 
  : 'https://sandbox.safaricom.co.ke';

// Get OAuth token
async function getAccessToken() {
  const auth = Buffer.from(`${MPESA_CONFIG.consumerKey}:${MPESA_CONFIG.consumerSecret}`).toString('base64');

  try {
    const response = await axios.get(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${auth}` }
    });
    return response.data.access_token;
  } catch (error) {
    console.error('M-Pesa token error:', error.response?.data || error.message);
    throw new Error('Failed to get M-Pesa access token');
  }
}

// Generate timestamp
function getTimestamp() {
  const date = new Date();
  return date.getFullYear() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0') +
    String(date.getHours()).padStart(2, '0') +
    String(date.getMinutes()).padStart(2, '0') +
    String(date.getSeconds()).padStart(2, '0');
}

// Generate password
function getPassword(timestamp) {
  const data = MPESA_CONFIG.shortcode + MPESA_CONFIG.passkey + timestamp;
  return Buffer.from(data).toString('base64');
}

// POST /api/mpesa/stk-push - Initiate STK Push
router.post('/stk-push', async (req, res) => {
  const { phoneNumber, amount, accountReference, transactionDesc } = req.body;

  if (!phoneNumber || !amount) {
    return res.status(400).json({ 
      success: false, 
      error: 'Phone number and amount are required' 
    });
  }

  // Format phone number
  let formattedPhone = phoneNumber.replace(/\D/g, '');
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '254' + formattedPhone.substring(1);
  }
  if (!formattedPhone.startsWith('254')) {
    formattedPhone = '254' + formattedPhone;
  }

  const timestamp = getTimestamp();
  const password = getPassword(timestamp);

  const payload = {
    BusinessShortCode: MPESA_CONFIG.shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.round(amount),
    PartyA: formattedPhone,
    PartyB: MPESA_CONFIG.shortcode,
    PhoneNumber: formattedPhone,
    CallBackURL: MPESA_CONFIG.callbackUrl,
    AccountReference: accountReference || 'GURUTECH',
    TransactionDesc: transactionDesc || 'Payment for electronics'
  };

  try {
    const accessToken = await getAccessToken();

    const response = await axios.post(
      `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      success: true,
      data: {
        checkoutRequestId: response.data.CheckoutRequestID,
        merchantRequestId: response.data.MerchantRequestID,
        responseCode: response.data.ResponseCode,
        responseDescription: response.data.ResponseDescription,
        customerMessage: response.data.CustomerMessage
      }
    });
  } catch (error) {
    console.error('STK Push error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to initiate M-Pesa payment',
      details: error.response?.data || error.message
    });
  }
});

// POST /api/mpesa/callback - M-Pesa callback
router.post('/callback', (req, res) => {
  const callbackData = req.body;

  console.log('M-Pesa Callback received:', JSON.stringify(callbackData, null, 2));

  // Process callback data
  const resultCode = callbackData?.Body?.stkCallback?.ResultCode;
  const resultDesc = callbackData?.Body?.stkCallback?.ResultDesc;
  const checkoutRequestId = callbackData?.Body?.stkCallback?.CheckoutRequestID;
  const merchantRequestId = callbackData?.Body?.stkCallback?.MerchantRequestID;

  if (resultCode === 0) {
    // Payment successful
    const callbackMetadata = callbackData?.Body?.stkCallback?.CallbackMetadata?.Item || [];
    const amount = callbackMetadata.find(i => i.Name === 'Amount')?.Value;
    const receiptNumber = callbackMetadata.find(i => i.Name === 'MpesaReceiptNumber')?.Value;
    const transactionDate = callbackMetadata.find(i => i.Name === 'TransactionDate')?.Value;
    const phoneNumber = callbackMetadata.find(i => i.Name === 'PhoneNumber')?.Value;

    console.log('Payment successful:', {
      receiptNumber,
      amount,
      phoneNumber,
      transactionDate
    });

    // TODO: Update order status in database
    // TODO: Send confirmation email/SMS

    res.json({ success: true, message: 'Callback processed' });
  } else {
    // Payment failed
    console.log('Payment failed:', resultDesc);
    res.json({ success: false, message: resultDesc });
  }
});

// GET /api/mpesa/query-status - Query payment status
router.get('/query-status/:checkoutRequestId', async (req, res) => {
  const { checkoutRequestId } = req.params;

  const timestamp = getTimestamp();
  const password = getPassword(timestamp);

  const payload = {
    BusinessShortCode: MPESA_CONFIG.shortcode,
    Password: password,
    Timestamp: timestamp,
    CheckoutRequestID: checkoutRequestId
  };

  try {
    const accessToken = await getAccessToken();

    const response = await axios.post(
      `${BASE_URL}/mpesa/stkpushquery/v1/query`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Query status error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to query payment status'
    });
  }
});

module.exports = router;
