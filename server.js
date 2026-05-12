const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const { applySEOMiddleware } = require('./middleware/seo');
const { generateStructuredData } = require('./utils/seo');
const { generateSitemap } = require('./utils/sitemap');
const { gscManager } = require('./utils/gsc');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 5000;

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
      upgradeInsecureRequests: [],
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

app.get('/robots.txt', (req, res) => {
  const siteUrl = process.env.SITE_URL || 'https://gurutech.co.ke';
  res.type('text/plain');
  res.send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nDisallow: /checkout\nDisallow: /cart\nCrawl-delay: 1\nSitemap: ${siteUrl}/sitemap.xml\nHost: ${siteUrl}`);
});

app.get('/sitemap.xml', async (req, res) => {
  try {
    const sitemap = await generateSitemap();
    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=3600');
    res.send(sitemap);
  } catch (error) {
    res.status(500).send('Error');
  }
});

app.get('/sitemap-index.xml', async (req, res) => {
  const siteUrl = process.env.SITE_URL || 'https://gurutech.co.ke';
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

function generatePageHTML(options) {
  const { title, description, canonical, ogImage, structuredData, breadcrumb, noindex = false, bodyContent = '<div id="root"></div>' } = options;
  const siteUrl = process.env.SITE_URL || 'https://gurutech.co.ke';

  let meta = `<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title><meta name="description" content="${description}"><meta name="theme-color" content="#111111"><link rel="canonical" href="${canonical}"><link rel="alternate" hreflang="en-ke" href="${canonical}"><link rel="alternate" hreflang="x-default" href="${canonical}"><link rel="preconnect" href="https://images.unsplash.com"><link rel="dns-prefetch" href="https://images.unsplash.com">`;

  meta += `<meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:type" content="website"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${ogImage || siteUrl + '/assets/og-image.jpg'}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:site_name" content="GURUTECH"><meta property="og:locale" content="en_KE">`;

  meta += `<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${title}"><meta name="twitter:description" content="${description}"><meta name="twitter:image" content="${ogImage || siteUrl + '/assets/og-image.jpg'}"><meta name="twitter:site" content="@gurutech">`;

  if (noindex) meta += `<meta name="robots" content="noindex, nofollow">`;
  else meta += `<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">`;

  if (structuredData) meta += `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`;
  if (breadcrumb) meta += `<script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>`;

  return `<!DOCTYPE html><html lang="en"><head>${meta}<link rel="stylesheet" href="/css/styles.css"></head><body>${bodyContent}<script src="/js/app.js"></script></body></html>`;
}

app.get('/', (req, res) => {
  const siteUrl = process.env.SITE_URL || 'https://gurutech.co.ke';
  res.send(generatePageHTML({
    title: 'GURUTECH - Premium Electronics Store in Kenya | Laptops, Phones, Gaming',
    description: 'GURUTECH is Kenya\'s trusted electronics store. Buy laptops, phones, audio equipment, gaming consoles and more. Fast delivery, M-Pesa payments, quality guaranteed.',
    canonical: `${siteUrl}/`,
    structuredData: generateStructuredData('homepage')
  }));
});

app.get('/product/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    const siteUrl = process.env.SITE_URL || 'https://gurutech.co.ke';
    const products = require('./routes/products').products || [];
    const product = products.find(p => p.id === parseInt(productId));

    if (!product) {
      return res.status(404).send(generatePageHTML({
        title: 'Product Not Found - GURUTECH',
        description: 'The product you are looking for does not exist.',
        canonical: `${siteUrl}/404`,
        noindex: true
      }));
    }

    res.send(generatePageHTML({
      title: `${product.name} | ${product.brand} | GURUTECH Kenya`,
      description: `Buy ${product.name} at GURUTECH Kenya. ${product.brand} ${product.category}. Price: KES ${product.price.toLocaleString()}. ${product.stock > 0 ? 'In stock' : 'Out of stock'} - Fast delivery with M-Pesa.`,
      canonical: `${siteUrl}/product/${product.id}`,
      ogImage: product.image,
      structuredData: generateStructuredData('product', product),
      breadcrumb: {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": siteUrl },
          { "@type": "ListItem", "position": 2, "name": product.category.charAt(0).toUpperCase() + product.category.slice(1), "item": `${siteUrl}/category/${product.category}` },
          { "@type": "ListItem", "position": 3, "name": product.name, "item": `${siteUrl}/product/${product.id}` }
        ]
      }
    }));
  } catch (error) {
    res.status(500).send('Server error');
  }
});

app.get('/category/:category', (req, res) => {
  const category = req.params.category;
  const siteUrl = process.env.SITE_URL || 'https://gurutech.co.ke';
  const categoryName = category.charAt(0).toUpperCase() + category.slice(1);

  res.send(generatePageHTML({
    title: `${categoryName} - Buy ${categoryName} in Kenya | GURUTECH`,
    description: `Shop ${categoryName} at GURUTECH Kenya. Best prices on ${categoryName} from top brands. Fast delivery, M-Pesa payments, warranty included.`,
    canonical: `${siteUrl}/category/${category}`,
    structuredData: generateStructuredData('category', { category, categoryName }),
    breadcrumb: {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": siteUrl },
        { "@type": "ListItem", "position": 2, "name": categoryName, "item": `${siteUrl}/category/${category}` }
      ]
    }
  }));
});

app.get(['/cart', '/checkout', '/order-success', '/admin-login'], (req, res) => {
  const siteUrl = process.env.SITE_URL || 'https://gurutech.co.ke';
  const titles = { '/cart': 'Shopping Cart', '/checkout': 'Checkout', '/order-success': 'Order Confirmed', '/admin-login': 'Admin Login' };
  res.send(generatePageHTML({
    title: `${titles[req.path] || 'Page'} - GURUTECH`,
    description: `${titles[req.path]} at GURUTECH Kenya.`,
    canonical: `${siteUrl}${req.path}`,
    noindex: true
  }));
});

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

app.use(express.static(__dirname));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});

app.use((req, res) => {
  const siteUrl = process.env.SITE_URL || 'https://gurutech.co.ke';
  res.status(404).send(generatePageHTML({
    title: 'Page Not Found - GURUTECH',
    description: 'The page you are looking for does not exist.',
    canonical: `${siteUrl}/404`,
    noindex: true
  }));
});

app.listen(PORT, () => {
  console.log(`GURUTECH Backend on port ${PORT}`);
  console.log('SEO: /robots.txt, /sitemap.xml, /google:token.html');
});

module.exports = app;
