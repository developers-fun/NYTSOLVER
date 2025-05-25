const typing = document.getElementById("typing");

// Sample JSON data
const jsonData = {
    "texts": [
        "Wordle!",
        "Crosswords!",
        "Strands!",
        "Mini-Crosswords!"
    ]
};

let index = 0; // To keep track of the current text
let charIndex = 0; // To keep track of the current character
let isDeleting = false; // To track if we are deleting characters

function type() {
    if (index < jsonData.texts.length) {
        if (!isDeleting) {
            if (charIndex < jsonData.texts[index].length) {
                typing.textContent += jsonData.texts[index].charAt(charIndex);
                charIndex++;
                setTimeout(type, 100); // Adjust typing speed here
            } else {
                // Start deleting after a delay
                isDeleting = true;
                setTimeout(type, 1000); // Delay before starting to delete
            }
        } else {
            if (charIndex > 0) {
                typing.textContent = jsonData.texts[index].substring(0, charIndex - 1);
                charIndex--;
                setTimeout(type, 100); // Adjust deleting speed here
            } else {
                // Move to the next text
                isDeleting = false;
                index++;
                if (index >= jsonData.texts.length) {
                    index = 0; // Reset index to repeat
                }
                charIndex = 0;
                setTimeout(type, 500); // Delay before starting the next text
            }
        }
    }
}

// Start the typing animation
document.addEventListener("DOMContentLoaded", type);