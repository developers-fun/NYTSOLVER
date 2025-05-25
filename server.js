const express = require('express');
const wordle = require("./api/wordle");
const connections = require("./api/connections");
const miniCrossword = require("./api/mini-crossword");
const strands = require("./api/strands");
const db = require('./db');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize daily tasks
async function initializeDailyTasks() {
    try {
        console.log('Initializing daily tasks...');
        // Check and create sitemap if needed
        await db.checkAndCreateSitemap();
        // Fetch today's Wordle immediately
        await db.fetchNewWordle();
        console.log('Initial Wordle fetch completed');
    } catch (error) {
        console.error('Error during initialization:', error);
    }
}

// API routes
app.use("/api/wordle", wordle);
app.use("/api/connections", connections);
app.use("/api/mini-crossword", miniCrossword);
app.use("/api/strands", strands);

// Serve static files
app.use("/", express.static("public"));

// HTML routes
app.get("/answers/wordle/", (req, res) => {
    res.status(200).sendFile(__dirname + "/public/answers/wordle.html");
});

app.get("/answers/connections/", (req, res) => {
    res.status(200).sendFile(__dirname + "/public/answers/connections.html");
});

app.get("/answers/mini-crossword/", (req, res) => {
    res.status(200).sendFile(__dirname + "/public/answers/mini-crossword.html");
});

app.get("/answers/strands/", (req, res) => {
    res.status(200).sendFile(__dirname + "/public/answers/strands.html");
});

app.get("/play/wordle/", (req, res) => {
    res.status(200).sendFile(__dirname + "/public/play/wordle.html");
});

// For local development
if (process.env.NODE_ENV !== 'production') {
    const port = 3000;
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
