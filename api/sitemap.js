const express = require('express');
const db = require("../db")
const router = express.Router();

let cachedSitemap = null;
let sitemapCacheTime = null;

router.get("/", async (req, res) => {
    const currentTime = new Date().getTime();
    const cacheDuration = 5 * 60 * 60 * 1000; // 5 hours in milliseconds

    // Check if the cache is still valid
    if (cachedSitemap && sitemapCacheTime && (currentTime - sitemapCacheTime < cacheDuration)) {
        console.log('Serving cached sitemap');
        return res.type('application/xml').send(cachedSitemap);
    }

    try {
        console.log('Generating new sitemap');
        const urls = await db.generateSitemap();
        const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(entry => `  <url>
    <loc>${entry.url}</loc>
    <lastmod>2025-05-26</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
</urlset>`;

        // Cache the new sitemap and update the cache time
        cachedSitemap = xmlContent;
        console.log(xmlContent);
        sitemapCacheTime = currentTime;

        return res.type('application/xml').send(cachedSitemap);
    } catch (error) {
        console.error('Error generating sitemap:', error);
        return res.status(500).send('Error generating sitemap');
    }
});

// Export the router
module.exports = router;