const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const NodeCache = require('node-cache');
const db = require('../db'); // Assuming you have a db.js file for SQLite

// Initialize cache with 30 minute TTL
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

        // Try to get from database first
        try {
            const dbWord = await db.getWordle(dateString);
            if (dbWord) {
                cache.set('wordleAnswer', dbWord);
                return res.json({ today: dbWord });
            }
        } catch (dbError) {
            console.error('Error checking database:', dbError);
            // Continue to fetch from NYT API if database check fails
        }

        // Fetch from NYT API
        const response = await fetch(`https://www.nytimes.com/svc/wordle/v2/${dateString}.json`);
        if (!response.ok) {
            throw new Error(`NYT API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        if (!data.solution) {
            throw new Error('No solution found in NYT API response');
        }

        // Store in cache
        cache.set('wordleAnswer', data.solution);

        // Store in database
        try {
            await db.insertWordle(dateString, data.solution);
            console.log(`Inserted wordle for date ${dateString}`);
        } catch (insertError) {
            console.error('Error inserting wordle into database:', insertError);
            // Continue even if database insert fails
        }

        // Return the answer
        res.json({ today: data.solution });
    } catch (error) {
        console.error('Error fetching Wordle answer:', error);
        res.status(500).json({ error: 'Failed to fetch today\'s answer' });
    }
});

module.exports = router;    