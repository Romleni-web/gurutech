/* ============================================
   GURUTECH API - Admin Routes
   Protected admin-only endpoints
   ============================================ */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Admin middleware
function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
}

// GET /api/admin/dashboard - Dashboard stats
router.get('/dashboard', requireAdmin, (req, res) => {
  // Mock stats - replace with real DB queries
  const stats = {
    revenue: {
      today: 45000,
      thisWeek: 312000,
      thisMonth: 1250000,
      total: 8500000
    },
    orders: {
      today: 5,
      thisWeek: 42,
      thisMonth: 168,
      total: 1250
    },
    customers: {
      newToday: 3,
      newThisWeek: 18,
      newThisMonth: 72,
      total: 450
    },
    products: {
      total: 16,
      lowStock: 4,
      outOfStock: 0
    }
  };

  res.json({ success: true, data: stats });
});

// GET /api/admin/sales-chart - Sales data for chart
router.get('/sales-chart', requireAdmin, (req, res) => {
  const salesData = [
    { day: 'Mon', sales: 45000, orders: 5 },
    { day: 'Tue', sales: 62000, orders: 7 },
    { day: 'Wed', sales: 38000, orders: 4 },
    { day: 'Thu', sales: 89000, orders: 9 },
    { day: 'Fri', sales: 54000, orders: 6 },
    { day: 'Sat', sales: 76000, orders: 8 },
    { day: 'Sun', sales: 91000, orders: 10 }
  ];

  res.json({ success: true, data: salesData });
});

// POST /api/admin/products/bulk-update - Bulk update products
router.post('/products/bulk-update', requireAdmin, (req, res) => {
  const { updates } = req.body;
  // Process bulk updates
  res.json({ success: true, message: `${updates?.length || 0} products updated` });
});

// POST /api/admin/orders/bulk-status - Bulk update order statuses
router.post('/orders/bulk-status', requireAdmin, (req, res) => {
  const { orderNumbers, status } = req.body;
  // Process bulk status updates
  res.json({ 
    success: true, 
    message: `${orderNumbers?.length || 0} orders updated to ${status}` 
  });
});

// GET /api/admin/reports/sales - Sales report
router.get('/reports/sales', requireAdmin, (req, res) => {
  const { startDate, endDate } = req.query;

  // Generate report based on date range
  const report = {
    period: { startDate, endDate },
    totalSales: 1250000,
    totalOrders: 168,
    averageOrderValue: 7440,
    topProducts: [
      { name: 'iPhone 15 Pro Max', sales: 15, revenue: 2773500 },
      { name: 'MacBook Pro 14" M3', sales: 8, revenue: 1279200 },
      { name: 'PlayStation 5', sales: 12, revenue: 838800 }
    ],
    salesByCategory: {
      phones: 450000,
      laptops: 320000,
      gaming: 280000,
      audio: 120000,
      others: 80000
    }
  };

  res.json({ success: true, data: report });
});

module.exports = router;
