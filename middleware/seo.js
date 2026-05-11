const { generateStructuredData } = require('../utils/seo');
const { gscManager } = require('../utils/gsc');

class SEOMiddleware {
  constructor() {
    this.siteUrl = process.env.SITE_URL || 'https://gurutech.co.ke';
    this.siteName = process.env.SITE_NAME || 'GURUTECH';
  }

  attachMetaTags(req, res, next) {
    const originalSend = res.send.bind(res);
    res.send = (body) => {
      if (typeof body === 'string' && body.includes('<!DOCTYPE html>')) {
        const url = `${this.siteUrl}${req.originalUrl.split('?')[0]}`;
        if (!body.includes('rel="canonical"')) {
          body = body.replace('</head>', `  <link rel="canonical" href="${url}" />\n  </head>`);
        }
        const hreflang = this.generateHreflangTags(req.path);
        if (hreflang && !body.includes('rel="alternate"')) {
          body = body.replace('</head>', `${hreflang}\n  </head>`);
        }
        if ((req.path === '/' || req.path === '/index.html')) {
          const gscMeta = gscManager.getVerificationMetaTag();
          if (gscMeta && !body.includes('google-site-verification')) {
            body = body.replace('</head>', `  ${gscMeta}\n  </head>`);
          }
        }
        if (req.path.includes('/admin') || req.path.includes('/checkout')) {
          if (!body.includes('noindex')) {
            body = body.replace('</head>', `  <meta name="robots" content="noindex, nofollow">\n  </head>`);
          }
        }
      }
      return originalSend(body);
    };
    next();
  }

  generateHreflangTags(path) {
    const languages = [
      { code: 'en-ke', url: `${this.siteUrl}${path}` },
      { code: 'x-default', url: `${this.siteUrl}${path}` }
    ];
    return languages.map(lang => `<link rel="alternate" hreflang="${lang.code}" href="${lang.url}" />`).join('\n  ');
  }

  generateBreadcrumb(req) {
    const segments = req.path.split('/').filter(Boolean);
    const breadcrumb = [{ "@type": "ListItem", "position": 1, "name": "Home", "item": this.siteUrl }];
    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      breadcrumb.push({
        "@type": "ListItem",
        "position": index + 2,
        "name": this.formatBreadcrumbName(segment, req),
        "item": `${this.siteUrl}${currentPath}`
      });
    });
    return { "@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": breadcrumb };
  }

  formatBreadcrumbName(segment, req) {
    const names = {
      'products': 'All Products',
      'product': req.params?.id ? 'Product Details' : 'Products',
      'category': req.params?.category ? req.params.category.charAt(0).toUpperCase() + req.params.category.slice(1) : 'Categories',
      'cart': 'Shopping Cart',
      'checkout': 'Checkout',
      'admin-login': 'Admin Login',
      'admin-dashboard': 'Dashboard',
      'admin-orders': 'Orders',
      'admin-products': 'Products',
      'admin-customers': 'Customers'
    };
    return names[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
  }

  generateFAQSchema() {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "Do you deliver across Kenya?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, we deliver to all counties in Kenya. Delivery within Nairobi takes 1-2 business days. Other counties take 2-5 business days." } },
        { "@type": "Question", "name": "What payment methods do you accept?", "acceptedAnswer": { "@type": "Answer", "text": "We accept M-Pesa (STK Push), Cash on Delivery, and bank transfers. M-Pesa is our most popular and fastest payment method." } },
        { "@type": "Question", "name": "Do you offer warranty on electronics?", "acceptedAnswer": { "@type": "Answer", "text": "All products come with manufacturer warranty. We also offer a 7-day return policy for defective items." } },
        { "@type": "Question", "name": "How do I track my order?", "acceptedAnswer": { "@type": "Answer", "text": "Once your order is shipped, you will receive an SMS and email with a tracking number. You can also track your order in your account dashboard." } }
      ]
    };
  }

  generateHowToSchema() {
    return {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": "How to Order from GURUTECH",
      "description": "Step-by-step guide to ordering electronics from GURUTECH Kenya",
      "totalTime": "PT5M",
      "estimatedCost": { "@type": "MonetaryAmount", "currency": "KES", "value": "0" },
      "step": [
        { "@type": "HowToStep", "position": 1, "name": "Browse Products", "text": "Browse our catalog of laptops, phones, audio equipment, and gaming consoles.", "url": `${this.siteUrl}/products` },
        { "@type": "HowToStep", "position": 2, "name": "Add to Cart", "text": "Select your desired product and click 'Add to Cart'. You can add multiple items.", "url": `${this.siteUrl}/products` },
        { "@type": "HowToStep", "position": 3, "name": "Checkout", "text": "Proceed to checkout and fill in your delivery details.", "url": `${this.siteUrl}/checkout` },
        { "@type": "HowToStep", "position": 4, "name": "Pay with M-Pesa", "text": "Enter your M-Pesa number and confirm payment via STK Push.", "url": `${this.siteUrl}/checkout` },
        { "@type": "HowToStep", "position": 5, "name": "Receive Order", "text": "Your order will be delivered within 1-5 business days depending on your location.", "url": `${this.siteUrl}/order-success` }
      ]
    };
  }

  generateSocialMeta(options = {}) {
    const { title = this.siteName, description = 'Premium Electronics Store in Kenya', image = '/assets/og-image.jpg', url = '/' } = options;
    const fullUrl = `${this.siteUrl}${url}`;
    const fullImage = image.startsWith('http') ? image : `${this.siteUrl}${image}`;
    return {
      'og:title': title, 'og:description': description, 'og:type': 'website', 'og:url': fullUrl,
      'og:image': fullImage, 'og:image:width': '1200', 'og:image:height': '630', 'og:site_name': this.siteName, 'og:locale': 'en_KE',
      'twitter:card': 'summary_large_image', 'twitter:title': title, 'twitter:description': description, 'twitter:image': fullImage,
      description, 'theme-color': '#111111'
    };
  }

  generatePaginationMeta(currentPage, totalPages, baseUrl) {
    const tags = [];
    if (currentPage > 1) tags.push(`<link rel="prev" href="${baseUrl}?page=${currentPage - 1}" />`);
    if (currentPage < totalPages) tags.push(`<link rel="next" href="${baseUrl}?page=${currentPage + 1}" />`);
    return tags.join('\n');
  }

  generateAMPLink(canonicalUrl) {
    return `<link rel="amphtml" href="${canonicalUrl}?amp=1" />`;
  }

  generateResourceHints() {
    return [
      '<link rel="preconnect" href="https://images.unsplash.com" />',
      '<link rel="dns-prefetch" href="https://images.unsplash.com" />',
      '<link rel="preconnect" href="https://api.safaricom.co.ke" />',
      '<link rel="dns-prefetch" href="https://api.safaricom.co.ke" />'
    ].join('\n');
  }
}

const seoMiddleware = new SEOMiddleware();

function applySEOMiddleware(req, res, next) {
  return seoMiddleware.attachMetaTags(req, res, next);
}

module.exports = { SEOMiddleware, seoMiddleware, applySEOMiddleware };
