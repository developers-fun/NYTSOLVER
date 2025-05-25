const crosswordContainer = document.getElementById("crosswordContainer");

function createCrosswordGrid(data) {
    const grid = document.createElement('div');
    grid.className = 'crossword-grid';
    grid.style.gridTemplateColumns = `repeat(${data.size.cols}, 45px)`;

    // Create cells
    for (let i = 0; i < data.grid.length; i++) {
        const cell = document.createElement('div');
        cell.className = 'crossword-cell';
        
        const cellData = data.grid[i];
        
        if (!cellData || Object.keys(cellData).length === 0) {
            cell.classList.add('black');
        } else {
            cell.textContent = cellData.answer || '';
            if (cellData.label) {
                const number = document.createElement('span');
                number.className = 'number';
                number.textContent = cellData.label;
                cell.appendChild(number);
            }
        }
        
        grid.appendChild(cell);
    }

    return grid;
}

function createCluesList(clues, answers, direction) {
    const section = document.createElement('div');
    section.className = 'clue-section';

    const heading = document.createElement('h3');
    heading.textContent = direction;
    section.appendChild(heading);

    const list = document.createElement('ul');
    list.className = 'clue-list';

    clues.forEach((clue, index) => {
        const item = document.createElement('li');
        item.className = 'clue-item';

        const number = document.createElement('span');
        number.className = 'clue-number';
        number.textContent = `${index + 1}.`;

        const text = document.createElement('span');
        text.className = 'clue-text';
        text.textContent = clue;

        const answer = document.createElement('span');
        answer.className = 'answer-text';
        answer.textContent = answers[index];

        item.appendChild(number);
        item.appendChild(text);
        item.appendChild(answer);
        list.appendChild(item);
    });

    section.appendChild(list);
    return section;
}

function displayCrossword(data) {
    const container = document.createElement('div');
    container.className = 'crossword-container';

    // Create and append the grid
    const grid = createCrosswordGrid(data);
    container.appendChild(grid);

    // Create and append the clues
    const cluesContainer = document.createElement('div');
    cluesContainer.className = 'crossword-clues';

    const acrossClues = createCluesList(data.clues.across, data.answers.across, 'Across');
    const downClues = createCluesList(data.clues.down, data.answers.down, 'Down');

    cluesContainer.appendChild(acrossClues);
    cluesContainer.appendChild(downClues);
    container.appendChild(cluesContainer);

    return container;
}

function fetchToday() {
    fetch("/api/mini-crossword")
        .then(response => response.json())
        .then(data => {
            if (data.today) {
                const crossword = displayCrossword(data.today);
                crosswordContainer.innerHTML = '';
                crosswordContainer.appendChild(crossword);
            } else {
                crosswordContainer.innerHTML = '<p>No crossword available</p>';
            }
        })
        .catch(error => {
            console.error("Error fetching today's crossword:", error);
            crosswordContainer.innerHTML = '<p>Error loading crossword</p>';
        });
}

document.addEventListener("DOMContentLoaded", fetchToday); 