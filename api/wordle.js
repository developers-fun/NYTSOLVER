const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const NodeCache = require('node-cache');

// Initialize cache with 6 hour TTL
const cache = new NodeCache({ stdTTL: 30 * 60 });

router.get('/', async (req, res) => {
    try {
        // Try to get from cache first
        const cachedAnswer = cache.get('wordleAnswer');
        if (cachedAnswer) {
            return res.json({ today: cachedAnswer });
        }

        // Get today's date in YYYY-MM-DD format
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;

        // Fetch from NYT API
        const response = await fetch(`https://www.nytimes.com/svc/wordle/v2/${dateString}.json`);
        const data = await response.json();

        // Store in cache
        cache.set('wordleAnswer', data.solution);

        res.json({ today: data.solution });
    } catch (error) {
        console.error('Error fetching Wordle answer:', error);
        res.status(500).json({ error: 'Failed to fetch today\'s answer' });
    }
});

module.exports = router;    