/* ============================================
   GURUTECH - Email Service
   Order confirmations, notifications
   ============================================ */

const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    this.from = `"GURUTECH" <${process.env.SMTP_USER || 'noreply@gurutech.co.ke'}>`;
  }

  // Send order confirmation
  async sendOrderConfirmation(order, customer) {
    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding:12px;border-bottom:1px solid #eee">
          <img src="${item.image}" alt="${item.name}" style="width:60px;height:60px;object-fit:contain">
        </td>
        <td style="padding:12px;border-bottom:1px solid #eee">
          <strong>${item.name}</strong><br>
          <span style="color:#666">${item.brand}</span>
        </td>
        <td style="padding:12px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
        <td style="padding:12px;border-bottom:1px solid #eee;text-align:right">
          KES ${(item.price * item.quantity).toLocaleString()}
        </td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Order Confirmation - GURUTECH</title>
      </head>
      <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:0;background:#f5f5f5">
        <div style="max-width:600px;margin:0 auto;background:#fff">
          <div style="background:#111;color:#fff;padding:24px;text-align:center">
            <h1 style="margin:0;font-size:24px">GURUTECH</h1>
            <p style="margin:8px 0 0;color:#aaa">Order Confirmation</p>
          </div>

          <div style="padding:32px 24px">
            <h2 style="margin:0 0 8px">Thank you for your order!</h2>
            <p style="color:#666;margin:0 0 24px">Your order has been received and is being processed.</p>

            <div style="background:#f9f9f9;padding:16px;border-radius:4px;margin-bottom:24px">
              <p style="margin:0 0 4px"><strong>Order Number:</strong> #${order.number}</p>
              <p style="margin:0 0 4px"><strong>Date:</strong> ${new Date(order.date).toLocaleString('en-KE')}</p>
              <p style="margin:0"><strong>Payment:</strong> M-Pesa ✓</p>
            </div>

            <h3 style="font-size:16px;margin-bottom:16px">Order Items</h3>
            <table style="width:100%;border-collapse:collapse">
              <thead>
                <tr style="border-bottom:2px solid #111">
                  <th style="padding:12px;text-align:left">Product</th>
                  <th style="padding:12px;text-align:left">Details</th>
                  <th style="padding:12px;text-align:center">Qty</th>
                  <th style="padding:12px;text-align:right">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div style="margin-top:24px;padding-top:16px;border-top:2px solid #111">
              <div style="display:flex;justify-content:space-between;margin-bottom:8px">
                <span>Subtotal</span>
                <span>KES ${(order.total - (order.shipping || 0)).toLocaleString()}</span>
              </div>
              <div style="display:flex;justify-content:space-between;margin-bottom:8px">
                <span>Shipping</span>
                <span>${order.shipping === 0 ? 'FREE' : 'KES ' + order.shipping.toLocaleString()}</span>
              </div>
              <div style="display:flex;justify-content:space-between;font-weight:700;font-size:18px;margin-top:16px">
                <span>Total</span>
                <span>KES ${order.total.toLocaleString()}</span>
              </div>
            </div>

            <div style="margin-top:32px;padding:16px;background:#e8f5e9;border-radius:4px">
              <p style="margin:0;color:#2e7d32;font-weight:600">✓ Payment received via M-Pesa</p>
            </div>

            <div style="margin-top:32px;text-align:center">
              <p style="color:#666;font-size:14px">
                Questions? Contact us at <a href="mailto:info@gurutech.co.ke">info@gurutech.co.ke</a>
              </p>
            </div>
          </div>

          <div style="background:#f9f9f9;padding:24px;text-align:center;border-top:1px solid #eee">
            <p style="margin:0;color:#666;font-size:12px">
              © 2026 GURUTECH. All rights reserved.<br>
              Nairobi, Kenya
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: this.from,
        to: customer.email,
        subject: `Order Confirmation - #${order.number} | GURUTECH`,
        html
      });

      return { success: true, message: 'Email sent successfully' };
    } catch (error) {
      console.error('Email sending failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Send shipping notification
  async sendShippingNotification(order, trackingNumber) {
    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#111;color:#fff;padding:24px;text-align:center">
          <h1 style="margin:0">GURUTECH</h1>
          <p style="margin:8px 0 0;color:#aaa">Your order is on the way!</p>
        </div>
        <div style="padding:24px;background:#fff">
          <h2>Order #${order.number} Shipped</h2>
          <p>Your order has been shipped and is on its way to you.</p>
          <div style="background:#f9f9f9;padding:16px;border-radius:4px;margin:16px 0">
            <p style="margin:0"><strong>Tracking Number:</strong> ${trackingNumber}</p>
          </div>
          <p style="color:#666">Estimated delivery: 1-3 business days</p>
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: this.from,
        to: order.customer.email,
        subject: `Your order #${order.number} has shipped | GURUTECH`,
        html
      });

      return { success: true };
    } catch (error) {
      console.error('Shipping email failed:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = { EmailService };
