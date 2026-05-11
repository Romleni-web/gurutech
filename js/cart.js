/* ============================================
   GURUTECH - Cart State Management
   ============================================ */

const Cart = {
  items: JSON.parse(localStorage.getItem('gurutech_cart')) || [],

  // Add item to cart
  add(product, quantity = 1) {
    const existing = this.items.find(item => item.id === product.id);

    if (existing) {
      existing.quantity += quantity;
    } else {
      this.items.push({
        id: product.id,
        name: product.name,
        brand: product.brand,
        price: product.price,
        image: product.image,
        quantity: quantity,
        stock: product.stock
      });
    }

    this.save();
    App.updateCartCount();
    App.toast(`${product.name} added to cart`, 'success');
  },

  // Remove item from cart
  remove(id) {
    this.items = this.items.filter(item => item.id !== id);
    this.save();
    App.updateCartCount();
    this.renderCartPage?.();
  },

  // Update quantity
  updateQuantity(id, quantity) {
    const item = this.items.find(item => item.id === id);
    if (!item) return;

    if (quantity <= 0) {
      this.remove(id);
      return;
    }

    if (quantity > item.stock) {
      App.toast(`Only ${item.stock} items available`, 'error');
      return;
    }

    item.quantity = quantity;
    this.save();
    this.renderCartPage?.();
  },

  // Get total item count
  getCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  },

  // Get cart total
  getTotal() {
    return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  },

  // Get shipping cost
  getShipping() {
    const total = this.getTotal();
    return total >= 50000 ? 0 : 500;
  },

  // Clear cart
  clear() {
    this.items = [];
    this.save();
    App.updateCartCount();
  },

  // Save to localStorage
  save() {
    localStorage.setItem('gurutech_cart', JSON.stringify(this.items));
  },

  // Render cart page (called from cart.html)
  renderCartPage() {
    const container = document.getElementById('cart-items');
    const emptyState = document.getElementById('empty-cart');
    const cartContent = document.getElementById('cart-content');

    if (!container) return;

    if (this.items.length === 0) {
      if (emptyState) emptyState.classList.remove('hidden');
      if (cartContent) cartContent.classList.add('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    if (cartContent) cartContent.classList.remove('hidden');

    container.innerHTML = this.items.map(item => `
      <div class="cart-item" data-id="${item.id}">
        <img src="${item.image}" alt="${item.name}" loading="lazy">
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <p>${item.brand}</p>
        </div>
        <div class="cart-item-qty">
          <button onclick="Cart.updateQuantity(${item.id}, ${item.quantity - 1})">−</button>
          <span>${item.quantity}</span>
          <button onclick="Cart.updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
        </div>
        <div class="cart-item-price">${App.formatPrice(item.price * item.quantity)}</div>
        <button class="remove-btn" onclick="Cart.remove(${item.id})" aria-label="Remove item">×</button>
      </div>
    `).join('');

    // Update summary
    const subtotal = this.getTotal();
    const shipping = this.getShipping();
    const total = subtotal + shipping;

    document.getElementById('cart-subtotal').textContent = App.formatPrice(subtotal);
    document.getElementById('cart-shipping').textContent = shipping === 0 ? 'FREE' : App.formatPrice(shipping);
    document.getElementById('cart-total').textContent = App.formatPrice(total);
  }
};
