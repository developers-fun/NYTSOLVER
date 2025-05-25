const answerBox = document.getElementById("answerBox");

function fetchToday() {
    //Fetch res
    fetch("/api/wordle")
        .then(response => response.json())
        .then(data => {
            answerBox.innerText = data.today;
        })
        .catch(error => {
            console.error("Error fetching today's answer:", error);
            answerBox.innerText = "Error loading answer";
        });

        console.log("Fetching today's answer...");
}

document.addEventListener("DOMContentLoaded", fetchToday)