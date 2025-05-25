const answerBox = document.getElementById("answerBox");

function formatConnections(data) {
    if (!data.groups || data.groups.length === 0) return "No data available";
    
    const grid = document.createElement('div');
    grid.className = 'connections-grid';
    
    data.groups.forEach(group => {
        const groupDiv = document.createElement('div');
        groupDiv.className = `connection-group level-${group.level}`;
        
        const category = document.createElement('div');
        category.className = 'connection-category';
        category.textContent = group.category;
        groupDiv.appendChild(category);
        
        group.members.forEach(word => {
            const wordDiv = document.createElement('div');
            wordDiv.className = 'connection-word';
            wordDiv.textContent = word;
            groupDiv.appendChild(wordDiv);
        });
        
        grid.appendChild(groupDiv);
    });
    
    return grid;
}

function fetchToday() {
    //Fetch res
    fetch("/api/connections")
        .then(response => response.json())
        .then(data => {
            if (data.today) {
                const formattedAnswer = formatConnections(data.today);
                answerBox.innerHTML = ''; // Clear existing content
                answerBox.appendChild(formattedAnswer);
            } else {
                answerBox.innerText = "No answer available";
            }
        })
        .catch(error => {
            console.error("Error fetching today's answer:", error);
            answerBox.innerText = "Error loading answer";
        });

        console.log("Fetching today's answer...");
}

document.addEventListener("DOMContentLoaded", fetchToday);