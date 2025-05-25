const express = require('express');
const today = require("./api/wordle");
const connections = require("./api/connections");
const app = express();
const port = 3001;

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use("/api/today", today);
app.use("/api/connections", connections);

app.use("/", express.static("public"));

app.get("/answers/wordle/", (req, res) => {
    res.sendFile(__dirname + "/public/answers/wordle.html");
});

app.get("/answers/connections/", (req, res) => {
    res.sendFile(__dirname + "/public/answers/connections.html");
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
