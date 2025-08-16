const fetch = require('node-fetch');
const NodeCache = require('node-cache');

// Initialize cache with 6 hour TTL
const cache = new NodeCache({ stdTTL: 6 * 60 * 60 });

module.exports = async (req, res) => {
    // Security: Only allow requests from nytsolver.net
    const origin = req.headers.origin;
    const allowedOrigins = ['https://nytsolver.net', 'https://www.nytsolver.net', 'http://localhost:3000'];
    
    if (!origin || !allowedOrigins.includes(origin)) {
        return res.status(403).json({ error: 'Access denied. Only nytsolver.net is allowed.' });
    }
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', origin);
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
        const cachedAnswer = cache.get('connectionsAnswer');
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
        const response = await fetch(`https://www.nytimes.com/svc/connections/v1/${dateString}.json`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Format the connections data
        const formattedAnswer = {
            groups: Object.entries(data.groups).map(([category, info]) => ({
                category,
                level: info.level,
                members: info.members
            })),
            words: data.words || []
        };

        // Store in cache
        cache.set('connectionsAnswer', formattedAnswer);

        res.json({ today: formattedAnswer });
    } catch (error) {
        console.error('Error fetching Connections answer:', error);
        res.status(500).json({ error: 'Failed to fetch today\'s answer' });
    }
}; 