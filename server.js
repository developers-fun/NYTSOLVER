const express = require("express")
const path = require("path")

const PORT = 3000;
const app = express()

// API routes
app.use("/api/wordle", require("./api/wordle.js"))
app.use("/api/connections", require("./api/connections.js"))
app.use("/api/mini-crossword", require("./api/mini-crossword.js"))
app.use("/api/strands", require("./api/strands.js"))

// Static file routes for answers
app.get("/answers/wordle/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/answers/wordle.html"))
})
app.get("/answers/connections/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/answers/connections.html"))
})
app.get("/answers/mini-crossword/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/answers/mini-crossword.html"))
})
app.get("/answers/strands/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/answers/strands.html"))
})

// Static file routes for play
app.get("/play/wordle/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/play/wordle.html"))
})

app.get("/privacy/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/privacy.html"))
})

// Default static file serving
app.use("/", express.static("public"))

app.listen(PORT, () => {
    console.log("Server is running on website http://localhost:" + PORT)
})