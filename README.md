# GURUTECH Backend

Complete Node.js/Express backend for GURUTECH Electronics Shop with advanced SEO, M-Pesa integration, and admin dashboard API.

## Features

### SEO (Advanced)
- **Structured Data**: Schema.org LocalBusiness, Product, Breadcrumb, FAQ, HowTo schemas
- **Dynamic Sitemap**: Auto-generated sitemap.xml with all products, categories, pages
- **Robots.txt**: Crawl directives, sitemap location, host declaration
- **Canonical Tags**: Self-referencing canonicals on every page
- **Hreflang**: en-ke and x-default language targeting
- **Open Graph & Twitter Cards**: Rich social sharing previews
- **Google Search Console**: Verification, URL inspection, analytics API
- **Internal Linking**: Breadcrumb schema, pagination meta tags
- **Meta Robots**: index/follow directives, max-snippet controls

### Payment
- **M-Pesa STK Push**: Full Daraja API v2 integration
- **Callback Handling**: Automatic payment confirmation
- **Status Query**: Check payment status by CheckoutRequestID

### Security
- Helmet.js security headers
- Rate limiting (API & auth)
- CORS configuration
- Content Security Policy
- HSTS enabled

### API Endpoints
```
GET  /api/products              - List products (with filters, sort, pagination)
GET  /api/products/:id          - Single product
GET  /api/products/categories/all - All categories
GET  /api/products/brands/all     - All brands
POST /api/products               - Create product (admin)
PUT  /api/products/:id           - Update product (admin)
DELETE /api/products/:id        - Delete product (admin)

GET  /api/orders                 - List orders
GET  /api/orders/:number         - Single order
POST /api/orders                 - Create order
PUT  /api/orders/:number/status  - Update status

POST /api/auth/login             - Login
POST /api/auth/register          - Register
GET  /api/auth/me                - Current user

POST /api/mpesa/stk-push         - Initiate M-Pesa payment
POST /api/mpesa/callback         - M-Pesa callback
GET  /api/mpesa/query-status/:id - Query payment status

GET  /api/admin/dashboard        - Dashboard stats
GET  /api/admin/sales-chart      - Sales chart data
GET  /api/admin/reports/sales    - Sales report

GET  /api/gsc/analytics          - GSC performance
GET  /api/gsc/top-queries        - Top search queries
GET  /api/gsc/top-pages          - Top pages
POST /api/gsc/submit-sitemap     - Submit sitemap to GSC
```

### SEO Endpoints
```
GET /robots.txt           - Crawl directives
GET /sitemap.xml          - Dynamic XML sitemap
GET /sitemap-index.xml    - Sitemap index
GET /google:token.html    - GSC verification
GET /BingSiteAuth.xml     - Bing verification
```

## Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your credentials
nano .env

# Seed products
npm run seed

# Start server
npm start

# Dev mode
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5000) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret |
| `MPESA_CONSUMER_KEY` | Safaricom Daraja consumer key |
| `MPESA_CONSUMER_SECRET` | Safaricom Daraja consumer secret |
| `MPESA_PASSKEY` | M-Pesa passkey |
| `MPESA_SHORTCODE` | Business shortcode |
| `GSC_VERIFICATION_TOKEN` | Google Search Console verification token |
| `SITE_URL` | Your domain (https://gurutech.co.ke) |

## Google Search Console Setup

1. Add your site to [Google Search Console](https://search.google.com/search-console)
2. Choose "URL prefix" and enter your domain
3. Select "HTML tag" verification method
4. Copy the `content` value from the meta tag
5. Add to `.env`: `GSC_VERIFICATION_TOKEN=your-token-here`
6. Deploy and visit `/google:token.html` to verify
7. Submit sitemap: `/sitemap.xml`

## M-Pesa Setup

1. Register at [Safaricom Developer Portal](https://developer.safaricom.co.ke)
2. Create an app and get Consumer Key/Secret
3. Get Passkey from your M-Pesa account
4. Set callback URL to `https://yourdomain.com/api/mpesa/callback`
5. Add all values to `.env`

## Deployment

### Railway/Render/Heroku
```bash
git push origin main
# Set environment variables in dashboard
```

### VPS (Ubuntu)
```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and setup
git clone <repo>
cd gurutech-backend
npm install
npm run seed

# Using PM2
npm install -g pm2
pm2 start server.js --name gurutech
pm2 startup
pm2 save

# Nginx reverse proxy
sudo apt install nginx
# Add config to /etc/nginx/sites-available/gurutech
sudo ln -s /etc/nginx/sites-available/gurutech /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## License
MIT
