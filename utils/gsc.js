/* ============================================
   GURUTECH - Google Search Console Integration
   Site Verification, URL Inspection, Analytics
   ============================================ */

const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

class GSCManager {
  constructor() {
    this.siteUrl = process.env.GSC_SITE_URL || 'https://gurutech.co.ke';
    this.scopes = ['https://www.googleapis.com/auth/webmasters.readonly'];
  }

  // Initialize Google Auth
  async authenticate() {
    try {
      // For production, use service account or OAuth2
      // This is a demo implementation
      const auth = new google.auth.GoogleAuth({
        scopes: this.scopes,
        // keyFile: path.join(__dirname, '../config/gsc-service-account.json')
      });

      this.client = google.webmasters({ version: 'v3', auth });
      return true;
    } catch (error) {
      console.error('GSC Authentication failed:', error.message);
      return false;
    }
  }

  // ============================================
  // SITE VERIFICATION
  // ============================================

  // Generate HTML meta tag for verification
  getVerificationMetaTag() {
    const token = process.env.GSC_VERIFICATION_TOKEN;
    if (!token) return null;

    return `<meta name="google-site-verification" content="${token}" />`;
  }

  // Generate verification file content
  getVerificationFileContent() {
    const token = process.env.GSC_VERIFICATION_TOKEN;
    if (!token) return null;

    return `google-site-verification: ${token}`;
  }

  // ============================================
  // URL INSPECTION & INDEXING
  // ============================================

  // Submit URL for indexing (requires Indexing API)
  async submitUrlForIndexing(url) {
    try {
      // Note: This requires Indexing API, separate from GSC API
      // For demo purposes, we log the request
      console.log(`URL submitted for indexing: ${url}`);
      return { success: true, url };
    } catch (error) {
      console.error('URL submission failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Get URL inspection data
  async inspectUrl(url) {
    try {
      if (!this.client) await this.authenticate();

      const response = await this.client.urlInspection.index.inspect({
        siteUrl: this.siteUrl,
        inspectionUrl: url
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error('URL inspection failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // SEARCH ANALYTICS
  // ============================================

  // Get search analytics data
  async getSearchAnalytics(startDate, endDate, dimensions = ['query']) {
    try {
      if (!this.client) await this.authenticate();

      const response = await this.client.searchanalytics.query({
        siteUrl: this.siteUrl,
        requestBody: {
          startDate,
          endDate,
          dimensions,
          rowLimit: 100
        }
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Search analytics failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Get top queries
  async getTopQueries(days = 30, limit = 20) {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return this.getSearchAnalytics(startDate, endDate, ['query']);
  }

  // Get top pages
  async getTopPages(days = 30, limit = 20) {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return this.getSearchAnalytics(startDate, endDate, ['page']);
  }

  // Get performance summary
  async getPerformanceSummary(days = 30) {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    try {
      if (!this.client) await this.authenticate();

      const response = await this.client.searchanalytics.query({
        siteUrl: this.siteUrl,
        requestBody: {
          startDate,
          endDate,
          dimensions: []
        }
      });

      const rows = response.data.rows || [];
      const summary = rows[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 };

      return {
        success: true,
        data: {
          clicks: summary.clicks || 0,
          impressions: summary.impressions || 0,
          ctr: summary.ctr || 0,
          position: summary.position || 0,
          period: { startDate, endDate }
        }
      };
    } catch (error) {
      console.error('Performance summary failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // SITEMAP MANAGEMENT
  // ============================================

  // Submit sitemap to GSC
  async submitSitemap(sitemapUrl = `${this.siteUrl}/sitemap.xml`) {
    try {
      if (!this.client) await this.authenticate();

      await this.client.sitemaps.submit({
        siteUrl: this.siteUrl,
        feedpath: sitemapUrl
      });

      return { success: true, message: 'Sitemap submitted successfully' };
    } catch (error) {
      console.error('Sitemap submission failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // List submitted sitemaps
  async listSitemaps() {
    try {
      if (!this.client) await this.authenticate();

      const response = await this.client.sitemaps.list({
        siteUrl: this.siteUrl
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error('List sitemaps failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // CRAWL ERRORS
  // ============================================

  // Get crawl errors
  async getCrawlErrors() {
    try {
      if (!this.client) await this.authenticate();

      // Note: Crawl errors API is limited in newer versions
      // This is a placeholder for the concept
      return { 
        success: true, 
        data: {
          message: 'Use GSC dashboard for detailed crawl error reports',
          url: `https://search.google.com/search-console?resource_id=${encodeURIComponent(this.siteUrl)}`
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Singleton instance
const gscManager = new GSCManager();

module.exports = {
  GSCManager,
  gscManager,

  // Quick helpers
  getVerificationMeta: () => gscManager.getVerificationMetaTag(),
  getVerificationFile: () => gscManager.getVerificationFileContent(),
  submitSitemap: () => gscManager.submitSitemap(),
  getPerformance: (days) => gscManager.getPerformanceSummary(days),
  getTopQueries: (days, limit) => gscManager.getTopQueries(days, limit),
  getTopPages: (days, limit) => gscManager.getTopPages(days, limit)
};
