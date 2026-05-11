const express = require('express');
const router = express.Router();

let orders = [];

router.get('/', (req, res) => {
  let result = [...orders];
  if (req.query.status) result = result.filter(o => (o.status || 'completed') === req.query.status);
  if (req.query.search) {
    const q = req.query.search.toLowerCase();
    result = result.filter(o => o.number.toLowerCase().includes(q) || (o.customer?.name && o.customer.name.toLowerCase().includes(q)) || (o.customer?.email && o.customer.email.toLowerCase().includes(q)));
  }
  result.sort((a, b) => new Date(b.date) - new Date(a.date));
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const start = (page - 1) * limit;
  res.json({ success: true, data: result.slice(start, start + limit), meta: { total: result.length, page, limit, totalPages: Math.ceil(result.length / limit) } });
});

router.get('/:number', (req, res) => {
  const order = orders.find(o => o.number === req.params.number);
  if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
  res.json({ success: true, data: order });
});

router.post('/', (req, res) => {
  const orderNumber = 'GT' + Date.now().toString().slice(-8);
  const newOrder = { number: orderNumber, ...req.body, status: 'pending', paymentStatus: 'pending', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  orders.unshift(newOrder);
  res.status(201).json({ success: true, data: newOrder });
});

router.put('/:number/status', (req, res) => {
  const order = orders.find(o => o.number === req.params.number);
  if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
  order.status = req.body.status || order.status;
  order.paymentStatus = req.body.paymentStatus || order.paymentStatus;
  order.updatedAt = new Date().toISOString();
  res.json({ success: true, data: order });
});

router.delete('/:number', (req, res) => {
  const index = orders.findIndex(o => o.number === req.params.number);
  if (index === -1) return res.status(404).json({ success: false, error: 'Order not found' });
  orders.splice(index, 1);
  res.json({ success: true, message: 'Order deleted' });
});

router.get('/stats/overview', (req, res) => {
  res.json({ success: true, data: { total: orders.length, totalRevenue: orders.reduce((s, o) => s + (o.total || 0), 0), byStatus: { completed: orders.filter(o => (o.status || 'completed') === 'completed').length, pending: orders.filter(o => (o.status || 'completed') === 'pending').length, processing: orders.filter(o => (o.status || 'completed') === 'processing').length, cancelled: orders.filter(o => (o.status || 'completed') === 'cancelled').length } } });
});

module.exports = router;