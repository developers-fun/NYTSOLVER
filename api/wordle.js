const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const NodeCache = require('node-cache');
const db = require('../db'); // Assuming you have a db.js file for SQLite

// Initialize cache with 30 minute TTL
const cache = new NodeCache({ stdTTL: 30 * 60 });

// Sitemap endpoint for Wordle solutions
router.get('/sitemap', async (req, res) => {
    try {
        const urls = await db.generateSitemap();
        res.json({ urls });
    } catch (error) {
        console.error('Error generating Wordle sitemap:', error);
        res.status(500).json({ error: 'Failed to generate sitemap' });
    }
});

router.get('/', async (req, res) => {
    try {
        // Handle custom date query
        if (req.query.date) {
            const date = req.query.date;
            try {
                const dbWord = await db.getWordle(date);
                if (dbWord) {
                    return res.json({ today: dbWord });
                }
                
                // If not in database, try to fetch from NYT
                const response = await fetch(`https://www.nytimes.com/svc/wordle/v2/${date}.json`);
                if (!response.ok) {
                    return res.status(404).json({ error: 'No word found for the given date' });
                }
                
                const data = await response.json();
                if (!data.solution) {
                    return res.status(404).json({ error: 'No solution found for the given date' });
                }

                // Store in database for future use
                try {
                    await db.insertWordle(date, data.solution);
                    console.log(`Inserted wordle for date ${date}`);
                } catch (insertError) {
                    console.error('Error inserting wordle into database:', insertError);
                }

                return res.json({ today: data.solution });
            } catch (error) {
                console.error('Error handling custom date:', error);
                return res.status(500).json({ error: 'Failed to fetch word for the given date' });
            }
        }

        // Handle today's wordle
        // Try to get from cache first
        const cachedAnswer = cache.get('wordleAnswer');
        if (cachedAnswer) {
            console.log('Cache hit for wordle answer');
            return res.json({ today: cachedAnswer });
        }

        // Try to get today's wordle
        try {
            const todayWordle = await db.fetchNewWordle();
            cache.set('wordleAnswer', todayWordle);
            return res.json({ today: todayWordle });
        } catch (error) {
            console.error('Error fetching today\'s Wordle:', error);
            return res.status(500).json({ error: 'Failed to fetch today\'s answer' });
        }
    } catch (error) {
        console.error('Error fetching Wordle answer:', error);
        res.status(500).json({ error: 'Failed to fetch today\'s answer' });
    }
});

module.exports = router;    