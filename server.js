const express = require('express');
const wordle = require("./api/wordle");
const connections = require("./api/connections");
const sitemap = require("./api/sitemap");
const miniCrossword = require("./api/mini-crossword");
const strands = require("./api/strands");
const db = require('./db');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const helmet = require('helmet');
const app = express();

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://yourdomain.com'] // Replace with your actual domain
        : '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    trustProxy: true // Trust the X-Forwarded-For header
});

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);

// Optimize compression
app.use(compression({
    level: 6, // Compression level (1-9, higher = better compression but slower)
    threshold: 1024, // Only compress responses larger than 1KB
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    }
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Cache control middleware for static files
const staticCacheControl = (req, res, next) => {
    res.set('Cache-Control', 'public, max-age=31536000'); // 1 year
    next();
};

// API response caching middleware
const apiCache = (duration) => {
    return (req, res, next) => {
        res.set('Cache-Control', `public, max-age=${duration}`);
        next();
    };
};

// Initialize daily tasks with error handling and retries
async function initializeDailyTasks() {
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
        try {
            console.log('Initializing daily tasks...');
            await db.fetchNewWordle();
            console.log('Initial Wordle fetch completed');
            break;
        } catch (error) {
            retryCount++;
            console.error(`Error during initialization (attempt ${retryCount}/${maxRetries}):`, error);
            if (retryCount === maxRetries) {
                console.error('Failed to initialize after maximum retries');
            } else {
                await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
            }
        }
    }
}

// API routes with caching
app.use("/api/wordle", apiCache(300), wordle); // Cache for 5 minutes
app.use("/api/connections", apiCache(300), connections);
app.use("/api/mini-crossword", apiCache(300), miniCrossword);
app.use("/api/strands", apiCache(300), strands);
app.use("/sitemap/wordle-sitemap.xml", apiCache(3600), sitemap); // Cache for 1 hour

// Serve static files with caching
app.use("/", staticCacheControl, express.static("public", {
    maxAge: '1y',
    etag: true,
    lastModified: true
}));

// HTML routes with caching
const htmlCacheControl = (req, res, next) => {
    res.set('Cache-Control', 'public, max-age=3600'); // 1 hour for HTML
    next();
};

app.get("/answers/wordle/", htmlCacheControl, (req, res) => {
    res.status(200).sendFile(__dirname + "/public/answers/wordle.html");
});

app.get("/answers/connections/", htmlCacheControl, (req, res) => {
    res.status(200).sendFile(__dirname + "/public/answers/connections.html");
});

app.get("/answers/mini-crossword/", htmlCacheControl, (req, res) => {
    res.status(200).sendFile(__dirname + "/public/answers/mini-crossword.html");
});

app.get("/answers/strands/", htmlCacheControl, (req, res) => {
    res.status(200).sendFile(__dirname + "/public/answers/strands.html");
});

app.get("/play/wordle/", htmlCacheControl, (req, res) => {
    res.status(200).sendFile(__dirname + "/public/play/wordle.html");
});

// Catch-all route for 404 errors
app.use((req, res) => {
    res.status(404).sendFile(__dirname + "/public/404.html");
});

// Initialize tasks when the server starts
initializeDailyTasks().catch(console.error);

app.listen(3001)