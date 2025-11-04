const express = require('express'); 
const fetch = require('node-fetch');
const NodeCache = require('node-cache');

// Initialize cache with 60 minute TTL
const cache = new NodeCache({ stdTTL: 60 * 60 });

// Function to generate hints based on the word
function generateHints(word) {
    const hints = [];

    // Hint 1: Repeating letters
    const letterCount = {};
    for (const letter of word) {
        letterCount[letter] = (letterCount[letter] || 0) + 1;
    }
    const repeatingLetters = Object.keys(letterCount).filter(letter => letterCount[letter] > 1);
    hints.push(`Hint 1: ${repeatingLetters.length > 0 ? `Repeating letters: ${repeatingLetters.join(', ')}` : 'No repeating letters'}`);

    // Hint 2: Vowel count
    const vowels = word.match(/[aeiou]/gi) || [];
    hints.push(`Hint 2: Vowel count: ${vowels.length}`);

    // Hint 3: Consonant count
    const consonants = word.match(/[^aeiou]/gi) || [];
    hints.push(`Hint 3: Consonant count: ${consonants.length}`);

    // Hint 4: First letter
    hints.push(`Hint 4: First letter: ${word[0]}`);

    // Hint 5: Last letter
    hints.push(`Hint 5: Last letter: ${word[word.length - 1]}`);

    return hints;
}

module.exports = async (req, res) => {

    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', 'https://nytsolver.net, https://rememberyour.work, http://localhost:3000');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const date = req.query.date;

        const cacheKey = date || 'wordleToday';

        // Check cache
        const cached = cache.get(cacheKey);
        if (cached) {
            console.log('Cache hit');
            const hints = generateHints(cached);
            return res.json({ today: cached, hints });
        }

        // Use current date if no query provided
        const targetDate = date || new Date().toISOString().split('T')[0];

        // Fetch from NYT
        const response = await fetch(`https://www.nytimes.com/svc/wordle/v2/${targetDate}.json`);
        if (!response.ok) {
            return res.status(404).json({ error: 'No word found for the given date' });
        }

        const data = await response.json();
        if (!data.solution) {
            return res.status(404).json({ error: 'No solution found for the given date' });
        }

        // Store in cache
        cache.set(cacheKey, data.solution);

        const hints = generateHints(data.solution);
        return res.json({ today: data.solution, hints });

    } catch (error) {
        console.error('Error fetching Wordle answer:', error);
        res.status(500).json({ error: 'Failed to fetch Wordle answer' });
    }
};
