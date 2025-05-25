const wordsList = document.getElementById('wordsList');
let currentWords = [];
let currentSort = 'longest'; // Default sort: longest to shortest

function displayWords(data) {
    wordsList.innerHTML = '';
    
    // Store the words for sorting
    currentWords = data.words;
    
    // Add note if we're showing yesterday's puzzle
    if (data.note) {
        const noteElement = document.createElement('div');
        noteElement.className = 'note';
        noteElement.textContent = data.note;
        wordsList.appendChild(noteElement);
    }
    
    // Add date
    const dateElement = document.createElement('div');
    dateElement.className = 'date';
    dateElement.textContent = `Puzzle from ${new Date(data.date).toLocaleDateString()}`;
    wordsList.appendChild(dateElement);

    // Add sorting controls
    const sortControls = document.createElement('div');
    sortControls.className = 'sort-controls';
    
    const sortLabel = document.createElement('span');
    sortLabel.textContent = 'Sort by: ';
    sortControls.appendChild(sortLabel);
    
    const longestButton = document.createElement('button');
    longestButton.textContent = 'Longest to Shortest';
    longestButton.className = currentSort === 'longest' ? 'active' : '';
    longestButton.onclick = () => sortWords('longest');
    sortControls.appendChild(longestButton);
    
    const shortestButton = document.createElement('button');
    shortestButton.textContent = 'Shortest to Longest';
    shortestButton.className = currentSort === 'shortest' ? 'active' : '';
    shortestButton.onclick = () => sortWords('shortest');
    sortControls.appendChild(shortestButton);
    
    wordsList.appendChild(sortControls);
    
    // Display words with current sort
    displaySortedWords();
}

function sortWords(sortType) {
    currentSort = sortType;
    displaySortedWords();
    
    // Update button states
    const buttons = document.querySelectorAll('.sort-controls button');
    buttons.forEach(button => {
        button.className = button.textContent.toLowerCase().includes(sortType) ? 'active' : '';
    });
}

function displaySortedWords() {
    // Remove existing word items
    const existingItems = document.querySelectorAll('.word-item');
    existingItems.forEach(item => item.remove());
    
    // Sort and display words
    const sortedWords = [...currentWords].sort((a, b) => {
        if (currentSort === 'longest') {
            return b.length - a.length;
        } else {
            return a.length - b.length;
        }
    });
    
    sortedWords.forEach(({ word, length }) => {
        const wordItem = document.createElement('div');
        wordItem.className = 'word-item';
        
        const wordText = document.createElement('span');
        wordText.className = 'word-text';
        wordText.textContent = word;
        
        const wordLength = document.createElement('span');
        wordLength.className = 'word-length';
        wordLength.textContent = `${length} letters`;
        
        wordItem.appendChild(wordText);
        wordItem.appendChild(wordLength);
        wordsList.appendChild(wordItem);
    });
}

function fetchToday() {
    fetch("/api/strands")
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.today && data.today.words) {
                displayWords(data.today);
            } else {
                wordsList.innerHTML = '<p>No words available</p>';
            }
        })
        .catch(error => {
            console.error("Error fetching today's Strands:", error);
            wordsList.innerHTML = `<p>Error loading words: ${error.message}</p>`;
        });
}

document.addEventListener("DOMContentLoaded", fetchToday); 