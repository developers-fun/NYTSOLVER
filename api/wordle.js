const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const NodeCache = require('node-cache');
const db = require('../db'); // Assuming you have a db.js file for SQLite

// Initialize cache with 30 minute TTL
const cache = new NodeCache({ stdTTL: 30 * 60 });

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
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        // Handle custom date query
        if (req.query.date) {
            const date = req.query.date;
            try {
                const dbWord = await db.getWordle(date);
                if (dbWord) {
                    const hints = generateHints(dbWord);
                    return res.json({ today: dbWord, hints });
                }
                
                // If not in database, try to fetch from NYT
                const response = await fetch(`https://www.nytimes.com/svc/wordle/v2/${date}.json`);
                if (!response.ok) {
                    return res.status(404).json({ error: 'No word found for the given date' });
                }
                
                const data = await response.json();
                if (!data.solution) {
                    return res.status(404).json({ error: 'No solution found for the given date' });
                }

                // Store in database for future use
                try {
                    await db.insertWordle(date, data.solution);
                    console.log(`Inserted wordle for date ${date}`);
                } catch (insertError) {
                    console.error('Error inserting wordle into database:', insertError);
                }

                const hints = generateHints(data.solution);
                return res.json({ today: data.solution, hints });
            } catch (error) {
                console.error('Error handling custom date:', error);
                return res.status(500).json({ error: 'Failed to fetch word for the given date' });
            }
        }

        // Handle today's wordle
        // Try to get from cache first
        const cachedAnswer = cache.get('wordleAnswer');
        if (cachedAnswer) {
            console.log('Cache hit for wordle answer');
            const hints = generateHints(cachedAnswer);
            return res.json({ today: cachedAnswer, hints });
        }

        // Try to get today's wordle
        try {
            const todayWordle = await db.fetchNewWordle();
            cache.set('wordleAnswer', todayWordle);

            // Generate hints
            const hints = generateHints(todayWordle);
            return res.json({ today: todayWordle, hints });
        } catch (error) {
            console.error('Error fetching today\'s Wordle:', error);
            return res.status(500).json({ error: 'Failed to fetch today\'s answer' });
        }
    } catch (error) {
        console.error('Error fetching Wordle answer:', error);
        res.status(500).json({ error: 'Failed to fetch today\'s answer' });
    }
};    