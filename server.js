const express = require('express');
const app = express();
const port = 3001;

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use("/", express.static("public"));

app.get("/answers/wordle/", (req, res) => {
    res.sendFile(__dirname + "/public/answers/wordle.html");
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
