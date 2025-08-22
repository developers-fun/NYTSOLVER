const fetch = require('node-fetch');
const NodeCache = require('node-cache');

// Initialize cache with 6 hour TTL
const cache = new NodeCache({ stdTTL: 6 * 60 * 60 });

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', 'https://nytsolver.net, http://localhost:3000');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        // Try to get from cache first
        const cachedAnswer = cache.get('crosswordAnswer');
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
        const response = await fetch(`https://www.nytimes.com/svc/crosswords/v6/puzzle/mini/${dateString}.json`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data || !data.body || !data.body[0]) {
            throw new Error('Invalid puzzle data received');
        }

        const puzzle = data.body[0];
        
        // Validate puzzle data
        if (!puzzle.cells || !puzzle.dimensions || !puzzle.clues) {
            throw new Error('Missing required puzzle data');
        }

        // Format the crossword data
        const formattedAnswer = {
            grid: puzzle.cells,
            size: {
                rows: puzzle.dimensions.height,
                cols: puzzle.dimensions.width
            },
            clues: {
                across: (puzzle.clues.across || []).map(clue => clue.text || ''),
                down: (puzzle.clues.down || []).map(clue => clue.text || '')
            },
            answers: {
                across: (puzzle.clues.across || []).map(clue => clue.answer || ''),
                down: (puzzle.clues.down || []).map(clue => clue.answer || '')
            }
        };

        // Store in cache
        cache.set('crosswordAnswer', formattedAnswer);

        res.json({ today: formattedAnswer });
    } catch (error) {
        console.error('Error fetching Crossword answer:', error);
        console.error('Error details:', error.stack);
        res.status(500).json({ error: 'Failed to fetch today\'s answer.' });
    }
}; 