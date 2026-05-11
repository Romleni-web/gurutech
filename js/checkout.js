/* ============================================
   GURUTECH - Checkout & M-Pesa STK Push
   ============================================ */

const Checkout = {
  orderData: null,
  stkPollingInterval: null,

  // Initialize checkout page
  init() {
    this.renderOrderSummary();
    this.initPaymentMethods();
    this.initFormValidation();
    this.initMpesastk();
  },

  // Render order summary in checkout
  renderOrderSummary() {
    const container = document.getElementById('checkout-items');
    const subtotalEl = document.getElementById('checkout-subtotal');
    const shippingEl = document.getElementById('checkout-shipping');
    const totalEl = document.getElementById('checkout-total');

    if (!container) return;

    const items = Cart.items;
    if (items.length === 0) {
      window.location.href = 'cart.html';
      return;
    }

    container.innerHTML = items.map(item => `
      <div class="order-item">
        <img src="${item.image}" alt="${item.name}">
        <div class="order-item-info">
          <h4>${item.name}</h4>
          <p>Qty: ${item.quantity} × ${App.formatPrice(item.price)}</p>
        </div>
      </div>
    `).join('');

    const subtotal = Cart.getTotal();
    const shipping = Cart.getShipping();
    const total = subtotal + shipping;

    if (subtotalEl) subtotalEl.textContent = App.formatPrice(subtotal);
    if (shippingEl) shippingEl.textContent = shipping === 0 ? 'FREE' : App.formatPrice(shipping);
    if (totalEl) totalEl.textContent = App.formatPrice(total);
  },

  // Initialize payment method selection
  initPaymentMethods() {
    const methods = document.querySelectorAll('.payment-method');
    methods.forEach(method => {
      method.addEventListener('click', () => {
        methods.forEach(m => m.classList.remove('active'));
        method.classList.add('active');
        method.querySelector('input').checked = true;

        // Show/hide M-Pesa section
        const mpesaSection = document.getElementById('mpesa-section');
        if (mpesaSection) {
          mpesaSection.style.display = method.dataset.method === 'mpesa' ? 'block' : 'none';
        }
      });
    });
  },

  // Initialize form validation
  initFormValidation() {
    const form = document.getElementById('checkout-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (this.validateForm()) {
        this.processOrder();
      }
    });

    // Real-time validation on blur
    form.querySelectorAll('input[required], select[required]').forEach(field => {
      field.addEventListener('blur', () => this.validateField(field));
    });
  },

  // Validate single field
  validateField(field) {
    const errorEl = field.parentElement.querySelector('.error-msg');
    let isValid = true;
    let message = '';

    if (!field.value.trim()) {
      isValid = false;
      message = 'This field is required';
    } else if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
      isValid = false;
      message = 'Please enter a valid email';
    } else if (field.id === 'phone' && !/^\+?254[0-9]{9}$/.test(field.value.replace(/\s/g, ''))) {
      isValid = false;
      message = 'Enter valid Kenyan phone (+254XXXXXXXXX)';
    }

    field.classList.toggle('error', !isValid);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.toggle('show', !isValid);
    }

    return isValid;
  },

  // Validate entire form
  validateForm() {
    const form = document.getElementById('checkout-form');
    const requiredFields = form.querySelectorAll('input[required], select[required]');
    let isValid = true;

    requiredFields.forEach(field => {
      if (!this.validateField(field)) isValid = false;
    });

    return isValid;
  },

  // Initialize M-Pesa STK Push
  initMpesastk() {
    const stkBtn = document.getElementById('stk-push-btn');
    if (!stkBtn) return;

    stkBtn.addEventListener('click', () => this.initiateStkPush());
  },

  // Initiate M-Pesa STK Push
  async initiateStkPush() {
    const phoneInput = document.getElementById('mpesa-phone');
    const statusEl = document.getElementById('stk-status');
    const stkBtn = document.getElementById('stk-push-btn');

    if (!phoneInput || !statusEl) return;

    let phone = phoneInput.value.trim().replace(/\s/g, '');

    // Validate phone
    if (!phone) {
      App.toast('Please enter your M-Pesa number', 'error');
      return;
    }

    // Format phone to +254...
    if (phone.startsWith('0')) phone = '+254' + phone.substring(1);
    if (phone.startsWith('254')) phone = '+' + phone;
    if (!phone.startsWith('+254')) {
      App.toast('Please enter a valid Kenyan phone number', 'error');
      return;
    }

    const amount = Cart.getTotal() + Cart.getShipping();

    // Disable button and show loading
    stkBtn.disabled = true;
    stkBtn.innerHTML = '<span class="stk-spinner"></span> Sending...';

    // Show pending status
    statusEl.className = 'stk-status pending show';
    statusEl.innerHTML = '<span class="stk-spinner"></span> STK Push sent to your phone. Please check your phone and enter your M-Pesa PIN...';

    // ============================================
    // REAL M-PESA STK PUSH INTEGRATION
    // ============================================
    // In production, replace the simulation below with actual API call:
    //
    // const response = await fetch('https://your-backend.com/api/mpesa/stk-push', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     phoneNumber: phone,
    //     amount: amount,
    //     accountReference: 'GURUTECH',
    //     transactionDesc: 'Payment for electronics'
    //   })
    // });
    // const result = await response.json();
    //
    // Required backend setup:
    // 1. Daraja API credentials (Consumer Key, Consumer Secret)
    // 2. Business Shortcode (Paybill/Till Number)
    // 3. Passkey (from Safaricom portal)
    // 4. Callback URL for transaction confirmation
    // ============================================

    // SIMULATION for demo purposes
    await this.simulateStkPush(phone, amount, statusEl, stkBtn);
  },

  // Simulate STK Push (replace with real API in production)
  async simulateStkPush(phone, amount, statusEl, stkBtn) {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 3000));

    // Simulate successful push (90% success rate for demo)
    const success = Math.random() > 0.1;

    if (success) {
      statusEl.className = 'stk-status success show';
      statusEl.innerHTML = '✓ M-Pesa PIN confirmed. Payment of ' + App.formatPrice(amount) + ' received successfully!';

      stkBtn.innerHTML = 'Payment Received ✓';
      stkBtn.style.background = '#2a7';

      // Store payment confirmation
      localStorage.setItem('mpesa_payment', JSON.stringify({
        phone: phone,
        amount: amount,
        status: 'completed',
        timestamp: new Date().toISOString()
      }));

      // Auto-submit order after short delay
      setTimeout(() => {
        this.completeOrder();
      }, 2000);
    } else {
      statusEl.className = 'stk-status error show';
      statusEl.innerHTML = '✗ Transaction failed. Please check your M-Pesa balance and try again.';

      stkBtn.disabled = false;
      stkBtn.innerHTML = 'Retry M-Pesa Payment';
    }
  },

  // Process order submission
  processOrder() {
    const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value || 'mpesa';

    if (paymentMethod === 'mpesa') {
      // Check if M-Pesa payment was completed
      const mpesaPayment = JSON.parse(localStorage.getItem('mpesa_payment') || 'null');
      if (!mpesaPayment || mpesaPayment.status !== 'completed') {
        App.toast('Please complete M-Pesa payment first', 'error');
        document.getElementById('mpesa-section')?.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    this.completeOrder();
  },

  // Complete order and redirect
  completeOrder() {
    const orderNumber = 'GT' + Date.now().toString().slice(-8);
    const orderData = {
      number: orderNumber,
      items: Cart.items,
      total: Cart.getTotal() + Cart.getShipping(),
      shipping: Cart.getShipping(),
      date: new Date().toISOString(),
      customer: {
        email: document.getElementById('email')?.value,
        phone: document.getElementById('phone')?.value,
        name: document.getElementById('fullName')?.value
      }
    };

    // Save order to localStorage (in production, send to backend)
    const orders = JSON.parse(localStorage.getItem('gurutech_orders') || '[]');
    orders.push(orderData);
    localStorage.setItem('gurutech_orders', JSON.stringify(orders));
    localStorage.setItem('last_order', JSON.stringify(orderData));

    // Clear cart
    Cart.clear();
    localStorage.removeItem('mpesa_payment');

    // Redirect to success page
    window.location.href = 'order-success.html';
  }
};
