const wordsList = document.getElementById('wordsList');
let currentWords = [];
let currentSort = 'longest'; // Default sort: longest to shortest
let currentPage = 1;
const wordsPerPage = 10;

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
    
    // Add pagination controls
    addPaginationControls();
}

function sortWords(sortType) {
    currentSort = sortType;
    currentPage = 1; // Reset to first page when sorting
    displaySortedWords();
    
    // Update button states
    const buttons = document.querySelectorAll('.sort-controls button');
    buttons.forEach(button => {
        button.className = button.textContent.toLowerCase().includes(sortType) ? 'active' : '';
    });
    
    // Update pagination controls
    addPaginationControls();
}

function displaySortedWords() {
    // Remove existing word items
    const existingItems = document.querySelectorAll('.word-item');
    existingItems.forEach(item => item.remove());
    
    // Sort words
    const sortedWords = [...currentWords].sort((a, b) => {
        if (currentSort === 'longest') {
            return b.length - a.length;
        } else {
            return a.length - b.length;
        }
    });
    
    // Calculate pagination
    const totalPages = Math.ceil(sortedWords.length / wordsPerPage);
    const startIndex = (currentPage - 1) * wordsPerPage;
    const endIndex = startIndex + wordsPerPage;
    const wordsToShow = sortedWords.slice(startIndex, endIndex);
    
    // Display words for current page
    wordsToShow.forEach(({ word, length }) => {
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
    
    // Add page info
    const pageInfo = document.createElement('div');
    pageInfo.className = 'page-info';
    pageInfo.textContent = `Showing ${startIndex + 1}-${Math.min(endIndex, sortedWords.length)} of ${sortedWords.length} words`;
    wordsList.appendChild(pageInfo);
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

function addPaginationControls() {
    // Remove existing pagination controls
    const existingPagination = document.querySelector('.pagination-controls');
    if (existingPagination) {
        existingPagination.remove();
    }
    
    const sortedWords = [...currentWords].sort((a, b) => {
        if (currentSort === 'longest') {
            return b.length - a.length;
        } else {
            return a.length - b.length;
        }
    });
    
    const totalPages = Math.ceil(sortedWords.length / wordsPerPage);
    
    if (totalPages <= 1) return; // Don't show pagination if only one page
    
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'pagination-controls';
    
    // Previous button
    const prevButton = document.createElement('button');
    prevButton.textContent = '← Previous';
    prevButton.disabled = currentPage === 1;
    prevButton.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            displaySortedWords();
            addPaginationControls();
        }
    };
    paginationContainer.appendChild(prevButton);
    
    // Page numbers with ellipsis for overflow
    const pageNumbers = document.createElement('div');
    pageNumbers.className = 'page-numbers';
    
    const maxVisiblePages = 7; // Show max 7 page numbers
    let startPage = 1;
    let endPage = totalPages;
    
    if (totalPages > maxVisiblePages) {
        if (currentPage <= 4) {
            endPage = maxVisiblePages - 1;
        } else if (currentPage >= totalPages - 3) {
            startPage = totalPages - maxVisiblePages + 2;
        } else {
            startPage = currentPage - 2;
            endPage = currentPage + 2;
        }
    }
    
    // First page
    if (startPage > 1) {
        const firstButton = document.createElement('button');
        firstButton.textContent = '1';
        firstButton.onclick = () => {
            currentPage = 1;
            displaySortedWords();
            addPaginationControls();
        };
        pageNumbers.appendChild(firstButton);
        
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'ellipsis';
            ellipsis.textContent = '...';
            pageNumbers.appendChild(ellipsis);
        }
    }
    
    // Visible page numbers
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.className = i === currentPage ? 'active' : '';
        pageButton.onclick = () => {
            currentPage = i;
            displaySortedWords();
            addPaginationControls();
        };
        pageNumbers.appendChild(pageButton);
    }
    
    // Last page
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'ellipsis';
            ellipsis.textContent = '...';
            pageNumbers.appendChild(ellipsis);
        }
        
        const lastButton = document.createElement('button');
        lastButton.textContent = totalPages;
        lastButton.onclick = () => {
            currentPage = totalPages;
            displaySortedWords();
            addPaginationControls();
        };
        pageNumbers.appendChild(lastButton);
    }
    
    paginationContainer.appendChild(pageNumbers);
    
    // Next button
    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next →';
    nextButton.disabled = currentPage === totalPages;
    nextButton.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            displaySortedWords();
            addPaginationControls();
        }
    };
    paginationContainer.appendChild(nextButton);
    
    wordsList.appendChild(paginationContainer);
}

document.addEventListener("DOMContentLoaded", fetchToday); 