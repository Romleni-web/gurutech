const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const { applySEOMiddleware } = require('./middleware/seo');
const { generateSitemap } = require('./utils/sitemap');
const { gscManager } = require('./utils/gsc');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 5000;

// ============================================
// Security & Middleware
// ============================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https://via.placeholder.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "https://api.safaricom.co.ke", "https://sandbox.safaricom.co.ke"],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
    },
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }
}));

app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(applySEOMiddleware);

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests' }
});
app.use('/api/', apiLimiter);

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Too many auth attempts' }
});
app.use('/api/auth/', authLimiter);

// ============================================
// API Routes
// ============================================
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const authRoutes = require('./routes/auth');
const mpesaRoutes = require('./routes/mpesa');
const adminRoutes = require('./routes/admin');

app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/mpesa', mpesaRoutes);
app.use('/api/admin', adminRoutes);

// ============================================
// SEO Endpoints
// ============================================
app.get('/robots.txt', (req, res) => {
  const siteUrl = process.env.SITE_URL || 'https://gurutech-wmnh.onrender.com';
  res.type('text/plain');
  res.send([
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /api/',
    'Disallow: /checkout',
    'Disallow: /cart',
    'Crawl-delay: 1',
    `Sitemap: ${siteUrl}/sitemap.xml`,
    `Host: ${siteUrl}`
  ].join('\n'));
});

app.get('/sitemap.xml', async (req, res) => {
  try {
    const sitemap = await generateSitemap();
    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=3600');
    res.send(sitemap);
  } catch (error) {
    res.status(500).send('Error generating sitemap');
  }
});

app.get('/sitemap-index.xml', async (req, res) => {
  const siteUrl = process.env.SITE_URL || 'https://gurutech-wmnh.onrender.com';
  res.header('Content-Type', 'application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n<sitemap><loc>${siteUrl}/sitemap.xml</loc><lastmod>${new Date().toISOString()}</lastmod></sitemap>\n</sitemapindex>`);
});

app.get('/google:token.html', (req, res) => {
  const token = process.env.GSC_VERIFICATION_TOKEN;
  if (token) { res.type('text/plain'); res.send(`google-site-verification: ${token}`); }
  else { res.status(404).send('Not configured'); }
});

app.get('/BingSiteAuth.xml', (req, res) => {
  res.type('application/xml');
  res.send(`<?xml version="1.0"?>\n<users>\n<user>${process.env.BING_VERIFICATION_TOKEN || 'token'}</user>\n</users>`);
});

// ============================================
// GSC API Endpoints
// ============================================
app.post('/api/gsc/submit-sitemap', async (req, res) => {
  const result = await gscManager.submitSitemap();
  res.json(result);
});

app.get('/api/gsc/analytics', async (req, res) => {
  const result = await gscManager.getPerformanceSummary(parseInt(req.query.days) || 30);
  res.json(result);
});

app.get('/api/gsc/top-queries', async (req, res) => {
  const result = await gscManager.getTopQueries(parseInt(req.query.days) || 30, parseInt(req.query.limit) || 20);
  res.json(result);
});

app.get('/api/gsc/top-pages', async (req, res) => {
  const result = await gscManager.getTopPages(parseInt(req.query.days) || 30, parseInt(req.query.limit) || 20);
  res.json(result);
});

// ============================================
// Serve Static Files (CSS, JS, images, data)
// ============================================
app.use(express.static(path.join(__dirname)));

// ============================================
// HTML Page Routes — serve actual HTML files
// ============================================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/products', (req, res) => {
  res.sendFile(path.join(__dirname, 'products.html'));
});

app.get('/product', (req, res) => {
  res.sendFile(path.join(__dirname, 'product.html'));
});

app.get('/cart', (req, res) => {
  res.sendFile(path.join(__dirname, 'cart.html'));
});

app.get('/checkout', (req, res) => {
  res.sendFile(path.join(__dirname, 'checkout.html'));
});

app.get('/order-success', (req, res) => {
  res.sendFile(path.join(__dirname, 'order-success.html'));
});

app.get('/admin-login', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-login.html'));
});

app.get('/admin-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-dashboard.html'));
});

app.get('/admin-orders', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-orders.html'));
});

app.get('/admin-products', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-products.html'));
});

app.get('/admin-customers', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-customers.html'));
});

// ============================================
// Error Handlers
// ============================================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});

// 404 — serve 404.html
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '404.html'));
});

// ============================================
// Start Server
// ============================================
app.listen(PORT, () => {
  console.log(`GURUTECH running on port ${PORT}`);
  console.log(`SEO: /robots.txt, /sitemap.xml`);
});

module.exports = app;