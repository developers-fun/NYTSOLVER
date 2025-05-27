const answerBox = document.getElementById("answerBox");
const hintBoxes = document.querySelectorAll('.hint-box');
const answerButton = document.getElementById("answer");

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function formatReadableDate(date) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    return `${month} ${day}`;
}

async function tomorrow() {
    const today = new Date();
    const tomorrowDate = new Date(today);
    tomorrowDate.setDate(today.getDate() + 1);
    window.location.href = window.location.href.split('?')[0] + '?date=' + await formatDate(tomorrowDate);
}

async function today() {
    const today = new Date();
    window.location.href = window.location.href.split('?')[0] + '?date=' + await formatDate(today);
}

async function yesterday() {
    const today = new Date();
    const yesterdayDate = new Date(today);
    yesterdayDate.setDate(today.getDate() - 1);
    window.location.href = window.location.href.split('?')[0] + '?date=' + await formatDate(yesterdayDate);
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
            
            // Update h1 text based on date
            const h1 = document.querySelector('.hero h1');
            const currentDate = new Date();
            // Parse the date string correctly by adding time component
            const selectedDate = new Date(date + 'T00:00:00');
            
            if (selectedDate.toDateString() === currentDate.toDateString()) {
                h1.textContent = "What is today's Wordle?";
            } else {
                h1.textContent = `Wordle answers ${formatReadableDate(selectedDate)}`;
            }
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

document.getElementById("tomorrow").addEventListener("click", tomorrow);
document.getElementById("yesterday").addEventListener("click", yesterday);
document.getElementById("today").addEventListener("click", today);
document.addEventListener("DOMContentLoaded", fetchToday);