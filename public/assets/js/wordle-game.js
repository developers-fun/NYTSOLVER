function encodeWord(word) {
    // Convert the word to a Uint8Array
    const encoder = new TextEncoder();
    const bytes = encoder.encode(word);
    
    // Convert to base64
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary) + 'kycja';
}

async function redirectToGame() {
    try {
        const response = await fetch('/api/wordle?date=' + new Date().toISOString().split('T')[0]);
        const data = await response.json();
        
        if (data.today) {
            const encodedWord = encodeWord(data.today);
            window.location.href = `https://wordpuzzles.coldnova.xyz/game/?id=${encodedWord}`;
        }
    } catch (error) {
        console.error('Error loading game:', error);
        document.getElementById('attempts').textContent = 'Error loading game';
    }
}

document.addEventListener('DOMContentLoaded', redirectToGame);