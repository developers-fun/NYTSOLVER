const express = require('express');
const wordle = require("./api/wordle");
const connections = require("./api/connections");
const miniCrossword = require("./api/mini-crossword");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use("/api/wordle", wordle);
app.use("/api/connections", connections);
app.use("/api/mini-crossword", miniCrossword);

// Serve static files
app.use("/", express.static("public"));

// HTML routes
app.get("/answers/wordle/", (req, res) => {
    res.sendFile(__dirname + "/public/answers/wordle.html");
});

app.get("/answers/connections/", (req, res) => {
    res.sendFile(__dirname + "/public/answers/connections.html");
});

app.get("/answers/mini-crossword/", (req, res) => {
    res.sendFile(__dirname + "/public/answers/mini-crossword.html");
});

// For local development
if (process.env.NODE_ENV !== 'production') {
    const port = 3001;
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

// Export for Vercel
module.exports = app;
