const answerBox = document.getElementById("answerBox");
const hintBoxes = document.querySelectorAll('.hint-box');
const answerButton = document.getElementById("answer");

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getDateFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get('date');
    if (dateParam) {
        return dateParam;
    }
    return formatDate(new Date());
}

function updateUrl(date) {
    const url = new URL(window.location);
    url.searchParams.set('date', date);
    window.history.pushState({}, '', url);
}

function updateHints(hints) {
    hintBoxes.forEach((box, index) => {
        const content = box.querySelector('.hint-content');
        content.textContent = hints[index];
        
        box.addEventListener('click', () => {
            box.classList.toggle('active');
        });
    });
}

function fetchWordle(date) {
    fetch(`/api/wordle?date=${date}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            answerBox.innerText = data.today;
            if (data.hints) {
                updateHints(data.hints);
            }
            updateUrl(date);
        })
        .catch(error => {
            console.error("Error fetching wordle answer:", error);
            answerBox.innerText = "Error loading answer";
        });
}

// Add click handler for the answer button
answerButton.addEventListener('click', () => {
    answerButton.classList.toggle('active');
});

function fetchToday() {
    const date = getDateFromUrl();
    fetchWordle(date);
}

// Handle browser back/forward buttons
window.addEventListener('popstate', () => {
    fetchToday();
});

document.addEventListener("DOMContentLoaded", fetchToday);