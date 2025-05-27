const express = require('express');
const wordle = require("./api/wordle");
const connections = require("./api/connections");
const sitemap = require("./api/sitemap");
const miniCrossword = require("./api/mini-crossword");
const strands = require("./api/strands");
const db = require('./db');
const compression = require('compression');
const app = express();

// Enable compression for all responses
app.use(compression());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cache control middleware for static files
const staticCacheControl = (req, res, next) => {
    res.set('Cache-Control', 'public, max-age=31536000'); // 1 year
    next();
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

// API routes
app.use("/api/wordle", wordle);
app.use("/api/connections", connections);
app.use("/api/mini-crossword", miniCrossword);
app.use("/api/strands", strands);
app.use("/sitemap/wordle-sitemap.xml", sitemap);

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

// For local development
if (process.env.NODE_ENV !== 'production') {
    const port = process.env.PORT || 3000;
    app.listen(port, async () => {
        console.log(`Server is running on port ${port}`);
        await initializeDailyTasks();
    });
} else {
    // For production, initialize tasks when the server starts
    initializeDailyTasks();
}

// Export for Vercel
module.exports = app;
