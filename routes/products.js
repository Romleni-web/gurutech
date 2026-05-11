const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

let products = [];
try {
  const dataPath = path.join(__dirname, '../gurutech/data/products.json');
  const raw = fs.readFileSync(dataPath, 'utf8');
  products = JSON.parse(raw);
} catch (err) {
  console.log('Products load error:', err.message);
  products = [];
}

router.get('/', (req, res) => {
  let result = [...products];
  if (req.query.search) {
    const q = req.query.search.toLowerCase();
    result = result.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }
  if (req.query.category) result = result.filter(p => p.category === req.query.category);
  if (req.query.brand) {
    const brands = req.query.brand.split(',');
    result = result.filter(p => brands.includes(p.brand));
  }
  if (req.query.minPrice) result = result.filter(p => p.price >= parseInt(req.query.minPrice));
  if (req.query.maxPrice) result = result.filter(p => p.price <= parseInt(req.query.maxPrice));
  if (req.query.rating) result = result.filter(p => p.rating >= parseFloat(req.query.rating));
  if (req.query.sort) {
    switch (req.query.sort) {
      case 'price-low': result.sort((a, b) => a.price - b.price); break;
      case 'price-high': result.sort((a, b) => b.price - a.price); break;
      case 'rating': result.sort((a, b) => b.rating - a.rating); break;
      case 'newest': result.sort((a, b) => b.id - a.id); break;
    }
  }
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const start = (page - 1) * limit;
  res.json({ success: true, data: result.slice(start, start + limit), meta: { total: result.length, page, limit, totalPages: Math.ceil(result.length / limit) } });
});

router.get('/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
  res.json({ success: true, data: product });
});

router.get('/categories/all', (req, res) => {
  res.json({ success: true, data: [...new Set(products.map(p => p.category))] });
});

router.get('/brands/all', (req, res) => {
  res.json({ success: true, data: [...new Set(products.map(p => p.brand))] });
});

router.post('/', (req, res) => {
  const newProduct = { id: Date.now(), ...req.body, rating: 0, reviews: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  products.push(newProduct);
  res.status(201).json({ success: true, data: newProduct });
});

router.put('/:id', (req, res) => {
  const index = products.findIndex(p => p.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ success: false, error: 'Product not found' });
  products[index] = { ...products[index], ...req.body, updatedAt: new Date().toISOString() };
  res.json({ success: true, data: products[index] });
});

router.delete('/:id', (req, res) => {
  const index = products.findIndex(p => p.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ success: false, error: 'Product not found' });
  products.splice(index, 1);
  res.json({ success: true, message: 'Product deleted' });
});

module.exports = router;
module.exports.products = products;