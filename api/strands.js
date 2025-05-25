const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const NodeCache = require('node-cache');

// Initialize cache with 6 hour TTL
const cache = new NodeCache({ stdTTL: 6 * 60 * 60 });

router.get('/', async (req, res) => {
    try {
        // Try to get from cache first
        const cachedAnswer = cache.get('strandsAnswer');
        if (cachedAnswer) {
            return res.json({ today: cachedAnswer });
        }

        // Get today's date in YYYY-MM-DD format
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;

        // Try yesterday's date if today's fails
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayYear = yesterday.getFullYear();
        const yesterdayMonth = String(yesterday.getMonth() + 1).padStart(2, '0');
        const yesterdayDay = String(yesterday.getDate()).padStart(2, '0');
        const yesterdayString = `${yesterdayYear}-${yesterdayMonth}-${yesterdayDay}`;

        // Try both today and yesterday's dates
        const dates = [dateString, yesterdayString];
        let data = null;
        let usedDate = null;

        for (const date of dates) {
            const url = `https://www.nytimes.com/svc/strands/v2/${date}.json`;
            
            try {
                const response = await fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });
                
                if (response.ok) {
                    const responseData = await response.json();
                    
                    if (responseData && responseData.solutions && responseData.solutions.length > 0) {
                        data = responseData;
                        usedDate = date;
                        break;
                    }
                }
            } catch (error) {
                continue;
            }
        }

        if (!data) {
            return res.status(404).json({
                error: 'No Strands data available',
                message: 'Unable to find today\'s or yesterday\'s puzzle data'
            });
        }

        // Format the strands data
        const formattedAnswer = {
            words: data.solutions.map(word => ({
                word: word,
                length: word.length
            })).sort((a, b) => b.length - a.length),
            date: usedDate,
            note: usedDate === yesterdayString ? "Showing yesterday's puzzle as today's is not yet available" : undefined,
            themeWords: data.themeWords || [],
            spangram: data.spangram || null,
            clue: data.clue || null
        };

        // Store in cache
        cache.set('strandsAnswer', formattedAnswer);

        res.json({ today: formattedAnswer });
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to fetch today\'s answer',
            message: error.message
        });
    }
});

module.exports = router; 