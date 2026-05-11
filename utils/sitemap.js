const { create } = require('xmlbuilder2');

const mockProducts = [
  { id: 1, name: 'MacBook Pro 14\" M3', category: 'laptops', updatedAt: '2026-05-01' },
  { id: 2, name: 'Dell XPS 15', category: 'laptops', updatedAt: '2026-05-01' },
  { id: 3, name: 'iPhone 15 Pro Max', category: 'phones', updatedAt: '2026-05-02' },
  { id: 4, name: 'Samsung Galaxy S24 Ultra', category: 'phones', updatedAt: '2026-05-02' },
  { id: 5, name: 'Sony WH-1000XM5', category: 'audio', updatedAt: '2026-04-28' },
  { id: 6, name: 'AirPods Pro 2', category: 'audio', updatedAt: '2026-04-28' },
  { id: 7, name: 'PlayStation 5', category: 'gaming', updatedAt: '2026-05-03' },
  { id: 8, name: 'Xbox Series X', category: 'gaming', updatedAt: '2026-05-03' },
  { id: 9, name: 'iPad Pro 12.9\" M2', category: 'tablets', updatedAt: '2026-04-25' },
  { id: 10, name: 'Samsung Galaxy Tab S9 Ultra', category: 'tablets', updatedAt: '2026-04-25' },
  { id: 11, name: 'Canon EOS R6 Mark II', category: 'cameras', updatedAt: '2026-04-20' },
  { id: 12, name: 'Sony A7 IV', category: 'cameras', updatedAt: '2026-04-20' },
  { id: 13, name: 'LG 55\" OLED C4', category: 'tvs', updatedAt: '2026-04-15' },
  { id: 14, name: 'Samsung 65\" Neo QLED', category: 'tvs', updatedAt: '2026-04-15' },
  { id: 15, name: 'Logitech MX Master 3S', category: 'accessories', updatedAt: '2026-05-05' },
  { id: 16, name: 'Apple Watch Ultra 2', category: 'wearables', updatedAt: '2026-05-05' }
];

async function generateSitemap() {
  const siteUrl = process.env.SITE_URL || 'https://gurutech.co.ke';
  const today = new Date().toISOString().split('T')[0];

  const staticPages = [
    { url: '/', priority: 1.0, changefreq: 'daily', lastmod: today },
    { url: '/products', priority: 0.9, changefreq: 'daily', lastmod: today },
    { url: '/cart', priority: 0.3, changefreq: 'monthly', lastmod: today },
    { url: '/checkout', priority: 0.3, changefreq: 'monthly', lastmod: today },
    { url: '/order-success', priority: 0.2, changefreq: 'yearly', lastmod: today },
    { url: '/admin-login', priority: 0.1, changefreq: 'yearly', lastmod: today }
  ];

  const categories = ['laptops', 'phones', 'audio', 'gaming', 'tablets', 'cameras', 'tvs', 'accessories', 'wearables'];
  const categoryPages = categories.map(cat => ({ url: `/category/${cat}`, priority: 0.8, changefreq: 'weekly', lastmod: today }));
  const productPages = mockProducts.map(product => ({ url: `/product/${product.id}`, priority: 0.7, changefreq: 'weekly', lastmod: product.updatedAt || today }));
  const allUrls = [...staticPages, ...categoryPages, ...productPages];

  const root = create({ version: '1.0', encoding: 'UTF-8' }).ele('urlset', { xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9' });
  allUrls.forEach(({ url, priority, changefreq, lastmod }) => {
    const urlNode = root.ele('url');
    urlNode.ele('loc').txt(`${siteUrl}${url}`);
    urlNode.ele('lastmod').txt(lastmod);
    urlNode.ele('changefreq').txt(changefreq);
    urlNode.ele('priority').txt(priority.toFixed(1));
  });

  return root.end({ prettyPrint: true });
}

async function generateSitemapIndex() {
  const siteUrl = process.env.SITE_URL || 'https://gurutech.co.ke';
  const today = new Date().toISOString();
  const root = create({ version: '1.0', encoding: 'UTF-8' }).ele('sitemapindex', { xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9' });
  root.ele('sitemap').ele('loc').txt(`${siteUrl}/sitemap.xml`).up().ele('lastmod').txt(today);
  return root.end({ prettyPrint: true });
}

module.exports = { generateSitemap, generateSitemapIndex };
