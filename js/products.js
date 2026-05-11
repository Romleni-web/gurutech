/* ============================================
   GURUTECH - Product Data & Functions
   ============================================ */

const Products = {
  data: [],
  filtered: [],
  filters: {
    category: '',
    brand: [],
    minPrice: 0,
    maxPrice: 500000,
    rating: 0
  },
  sort: 'featured',

  // Load products from JSON
  async load() {
    try {
      const response = await fetch('data/products.json');
      this.data = await response.json();
      this.filtered = [...this.data];
      return this.data;
    } catch (err) {
      console.error('Failed to load products:', err);
      App.toast('Failed to load products', 'error');
      return [];
    }
  },

  // Get unique brands
  getBrands() {
    return [...new Set(this.data.map(p => p.brand))].sort();
  },

  // Get unique categories
  getCategories() {
    return [...new Set(this.data.map(p => p.category))].sort();
  },

  // Filter products
  applyFilters() {
    this.filtered = this.data.filter(product => {
      if (this.filters.category && product.category !== this.filters.category) return false;
      if (this.filters.brand.length > 0 && !this.filters.brand.includes(product.brand)) return false;
      if (product.price < this.filters.minPrice) return false;
      if (product.price > this.filters.maxPrice) return false;
      if (this.filters.rating > 0 && product.rating < this.filters.rating) return false;
      return true;
    });
    this.sortProducts();
  },

  // Sort products
  sortProducts() {
    switch (this.sort) {
      case 'price-low':
        this.filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        this.filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        this.filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        this.filtered.sort((a, b) => b.id - a.id);
        break;
      default:
        // featured - keep original order
        break;
    }
  },

  // Search products
  search(query) {
    if (!query.trim()) return this.data;
    const q = query.toLowerCase();
    return this.data.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  },

  // Get product by ID
  getById(id) {
    return this.data.find(p => p.id === parseInt(id));
  },

  // Get related products
  getRelated(product, limit = 4) {
    return this.data
      .filter(p => p.category === product.category && p.id !== product.id)
      .slice(0, limit);
  },

  // Render product card HTML
  renderCard(product) {
    const discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;
    const stockClass = product.stock > 10 ? 'in-stock' : product.stock > 0 ? 'low-stock' : 'out-of-stock';
    const stockText = product.stock > 10 ? 'In Stock' : product.stock > 0 ? `Only ${product.stock} left` : 'Out of Stock';

    return `
      <div class="product-card">
        <div class="product-card-img">
          ${discount > 0 ? `<span class="product-badge">-${discount}%</span>` : ''}
          <a href="product.html?id=${product.id}">
            <img src="${product.image}" alt="${product.name}" loading="lazy">
          </a>
        </div>
        <div class="product-card-body">
          <div class="product-brand">${product.brand}</div>
          <a href="product.html?id=${product.id}" class="product-name">${product.name}</a>
          <div class="product-rating">
            <span class="stars">${App.renderStars(product.rating)}</span>
            <span class="review-count">(${product.reviews})</span>
          </div>
          <div class="product-price">
            <span class="price-current">${App.formatPrice(product.price)}</span>
            ${product.oldPrice ? `<span class="price-old">${App.formatPrice(product.oldPrice)}</span>` : ''}
          </div>
          <div class="stock-status ${stockClass}">${stockText}</div>
          <button class="btn btn-primary btn-sm" onclick="Cart.add(${JSON.stringify(product).replace(/"/g, '&quot;')})" ${product.stock === 0 ? 'disabled' : ''}>
            ${product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    `;
  },

  // Render products grid
  renderGrid(containerId, products) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = products.map(p => this.renderCard(p)).join('');
  }
};
