function generateStructuredData(type, data = {}) {
  const siteUrl = process.env.SITE_URL || 'https://gurutech.co.ke';
  const siteName = process.env.SITE_NAME || 'GURUTECH';
  const logo = process.env.SITE_LOGO || `${siteUrl}/assets/logo.png`;

  const baseSchemas = {
    homepage: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "ElectronicsStore",
          "@id": `${siteUrl}/#business`,
          "name": siteName,
          "description": process.env.SITE_DESCRIPTION || "Premium Electronics Store in Kenya",
          "url": siteUrl,
          "logo": { "@type": "ImageObject", "url": logo, "width": 512, "height": 512 },
          "image": { "@type": "ImageObject", "url": `${siteUrl}/assets/store-front.jpg`, "width": 1200, "height": 630 },
          "telephone": process.env.CONTACT_PHONE || "+254712345678",
          "email": process.env.CONTACT_EMAIL || "info@gurutech.co.ke",
          "address": { "@type": "PostalAddress", "streetAddress": process.env.BUSINESS_ADDRESS || "Kimathi Street", "addressLocality": "Nairobi", "addressRegion": "Nairobi County", "postalCode": "00100", "addressCountry": "KE" },
          "geo": { "@type": "GeoCoordinates", "latitude": -1.2921, "longitude": 36.8219 },
          "openingHoursSpecification": [
            { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], "opens": "08:00", "closes": "18:00" },
            { "@type": "OpeningHoursSpecification", "dayOfWeek": "Saturday", "opens": "09:00", "closes": "16:00" }
          ],
          "priceRange": "$$$",
          "currenciesAccepted": "KES",
          "paymentAccepted": "M-Pesa, Cash on Delivery, Credit Card",
          "areaServed": { "@type": "Country", "name": "Kenya" },
          "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Electronics",
            "itemListElement": [
              { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Laptops", "url": `${siteUrl}/category/laptops` } },
              { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Smartphones", "url": `${siteUrl}/category/phones` } },
              { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Audio Equipment", "url": `${siteUrl}/category/audio` } },
              { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Gaming Consoles", "url": `${siteUrl}/category/gaming` } }
            ]
          },
          "sameAs": [
            process.env.SOCIAL_FACEBOOK || "https://facebook.com/gurutech",
            process.env.SOCIAL_INSTAGRAM || "https://instagram.com/gurutech",
            process.env.SOCIAL_TWITTER || "https://twitter.com/gurutech"
          ],
          "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.7", "reviewCount": "1250", "bestRating": "5" }
        },
        {
          "@type": "WebSite",
          "@id": `${siteUrl}/#website`,
          "url": siteUrl,
          "name": siteName,
          "publisher": { "@id": `${siteUrl}/#business` },
          "potentialAction": {
            "@type": "SearchAction",
            "target": { "@type": "EntryPoint", "urlTemplate": `${siteUrl}/search?q={search_term_string}` },
            "query-input": "required name=search_term_string"
          }
        },
        {
          "@type": "WebPage",
          "@id": `${siteUrl}/#webpage`,
          "url": siteUrl,
          "name": `${siteName} - Premium Electronics Store in Kenya`,
          "isPartOf": { "@id": `${siteUrl}/#website` },
          "about": { "@id": `${siteUrl}/#business` },
          "primaryImageOfPage": { "@type": "ImageObject", "url": `${siteUrl}/assets/hero-image.jpg` },
          "datePublished": "2024-01-01T00:00:00+03:00",
          "dateModified": new Date().toISOString()
        }
      ]
    },

    product: (product) => ({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Product",
          "@id": `${siteUrl}/product/${product.id}/#product`,
          "name": product.name,
          "image": [product.image, `${siteUrl}/assets/products/${product.id}-2.jpg`, `${siteUrl}/assets/products/${product.id}-3.jpg`],
          "description": `${product.brand} ${product.name}. ${Object.entries(product.specs || {}).map(([k, v]) => `${k}: ${v}`).join('. ')}`,
          "sku": `GT-${product.id.toString().padStart(6, '0')}`,
          "mpn": product.id.toString(),
          "brand": { "@type": "Brand", "name": product.brand },
          "manufacturer": { "@type": "Organization", "name": product.brand },
          "offers": {
            "@type": "Offer",
            "url": `${siteUrl}/product/${product.id}`,
            "priceCurrency": "KES",
            "price": product.price.toString(),
            "priceValidUntil": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "itemCondition": "https://schema.org/NewCondition",
            "seller": { "@type": "ElectronicsStore", "name": siteName, "url": siteUrl },
            "shippingDetails": {
              "@type": "OfferShippingDetails",
              "shippingRate": { "@type": "MonetaryAmount", "value": product.price >= 50000 ? "0" : "500", "currency": "KES" },
              "shippingDestination": { "@type": "DefinedRegion", "addressCountry": "KE" },
              "deliveryTime": {
                "@type": "ShippingDeliveryTime",
                "handlingTime": { "@type": "QuantitativeValue", "minValue": 1, "maxValue": 2, "unitCode": "DAY" },
                "transitTime": { "@type": "QuantitativeValue", "minValue": 1, "maxValue": 3, "unitCode": "DAY" }
              }
            },
            "hasMerchantReturnPolicy": {
              "@type": "MerchantReturnPolicy",
              "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
              "merchantReturnDays": 7,
              "returnMethod": "https://schema.org/ReturnByMail",
              "returnFees": "https://schema.org/FreeReturn"
            }
          },
          "aggregateRating": { "@type": "AggregateRating", "ratingValue": product.rating.toString(), "reviewCount": product.reviews.toString(), "bestRating": "5", "worstRating": "1" },
          "review": product.reviews > 0 ? [{ "@type": "Review", "author": { "@type": "Person", "name": "Verified Buyer" }, "datePublished": new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], "reviewRating": { "@type": "Rating", "ratingValue": Math.min(5, Math.max(1, Math.round(product.rating))).toString() }, "reviewBody": `Great ${product.category}! ${product.brand} quality as expected. Fast delivery from GURUTECH.` }] : undefined
        },
        {
          "@type": "BreadcrumbList",
          "@id": `${siteUrl}/product/${product.id}/#breadcrumb`,
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": siteUrl },
            { "@type": "ListItem", "position": 2, "name": product.category.charAt(0).toUpperCase() + product.category.slice(1), "item": `${siteUrl}/category/${product.category}` },
            { "@type": "ListItem", "position": 3, "name": product.name, "item": `${siteUrl}/product/${product.id}` }
          ]
        }
      ]
    }),

    breadcrumb: ({ product }) => ({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": siteUrl },
        { "@type": "ListItem", "position": 2, "name": product.category.charAt(0).toUpperCase() + product.category.slice(1), "item": `${siteUrl}/category/${product.category}` },
        { "@type": "ListItem", "position": 3, "name": product.name, "item": `${siteUrl}/product/${product.id}` }
      ]
    }),

    category: ({ category, categoryName }) => ({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          "@id": `${siteUrl}/category/${category}/#webpage`,
          "url": `${siteUrl}/category/${category}`,
          "name": `${categoryName} - ${siteName}`,
          "description": `Shop ${categoryName} at ${siteName} Kenya. Best prices on ${categoryName} from top brands.`,
          "isPartOf": { "@id": `${siteUrl}/#website` },
          "about": { "@id": `${siteUrl}/#business` }
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": siteUrl },
            { "@type": "ListItem", "position": 2, "name": categoryName, "item": `${siteUrl}/category/${category}` }
          ]
        },
        {
          "@type": "ItemList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "item": { "@type": "Product", "name": `${categoryName} Products`, "url": `${siteUrl}/category/${category}` } }
          ]
        }
      ]
    }),

    organization: {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      "name": siteName,
      "url": siteUrl,
      "logo": { "@type": "ImageObject", "url": logo, "width": 512, "height": 512 },
      "sameAs": [
        process.env.SOCIAL_FACEBOOK || "https://facebook.com/gurutech",
        process.env.SOCIAL_INSTAGRAM || "https://instagram.com/gurutech",
        process.env.SOCIAL_TWITTER || "https://twitter.com/gurutech"
      ],
      "contactPoint": { "@type": "ContactPoint", "telephone": process.env.CONTACT_PHONE || "+254712345678", "contactType": "customer service", "areaServed": "KE", "availableLanguage": ["English", "Swahili"] }
    },

    faq: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "Do you deliver across Kenya?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, we deliver to all counties in Kenya. Delivery within Nairobi takes 1-2 business days. Other counties take 2-5 business days." } },
        { "@type": "Question", "name": "What payment methods do you accept?", "acceptedAnswer": { "@type": "Answer", "text": "We accept M-Pesa (STK Push), Cash on Delivery, and bank transfers. M-Pesa is our most popular and fastest payment method." } },
        { "@type": "Question", "name": "Do you offer warranty on electronics?", "acceptedAnswer": { "@type": "Answer", "text": "All products come with manufacturer warranty. We also offer a 7-day return policy for defective items." } },
        { "@type": "Question", "name": "How do I track my order?", "acceptedAnswer": { "@type": "Answer", "text": "Once your order is shipped, you will receive an SMS and email with a tracking number. You can also track your order in your account dashboard." } }
      ]
    }
  };

  if (typeof baseSchemas[type] === 'function') {
    return baseSchemas[type](data);
  }
  return baseSchemas[type] || baseSchemas.homepage;
}

function generateMetaTags(options = {}) {
  const { title = 'GURUTECH', description = 'Premium Electronics Store in Kenya', url = '/', image = '/assets/og-image.jpg', type = 'website', price, currency = 'KES', availability } = options;
  const siteUrl = process.env.SITE_URL || 'https://gurutech.co.ke';
  const fullImage = image.startsWith('http') ? image : `${siteUrl}${image}`;

  return {
    title: `${title} | GURUTECH Kenya`,
    description,
    canonical: `${siteUrl}${url}`,
    og: { title, description, type, url: `${siteUrl}${url}`, image: fullImage, site_name: 'GURUTECH', locale: 'en_KE' },
    twitter: { card: 'summary_large_image', title, description, image: fullImage },
    ...(price && { product: { price: { amount: price, currency }, availability } })
  };
}

module.exports = { generateStructuredData, generateMetaTags };
