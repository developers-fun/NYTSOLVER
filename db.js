const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fetch = require('node-fetch');
const fs = require('fs').promises;
const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database ' + err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

//rows: date, word

db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS wordles (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT, word TEXT)", (err) => {
    if (err) {
      console.error('Error creating table ' + err.message);
    } else {
      console.log('Table created or already exists.');
    }
  });
});

const insertWordle = async (date, word) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Check for existing wordle for the given date
      db.get("SELECT COUNT(*) as count FROM wordles WHERE date = ?", [date], (err, row) => {
        if (err) {
          console.error('Error checking for existing wordle ' + err.message);
          reject(err);
        } else if (row.count > 0) {
          console.log(`Wordle for date ${date} already exists. Skipping insert.`);
          resolve(); // Skip insertion if it already exists
        } else {
          // Proceed to insert if no existing entry
          db.run("INSERT INTO wordles (date, word) VALUES (?, ?)", [date, word], function (err) {
            if (err) {
              console.error('Error inserting wordle ' + err.message);
              reject(err);
            } else {
              console.log(`Inserted wordle with date ${date} and word ${word}`);
              resolve();
            }
          });
        }
      });
    });
  });
}

const getWordle = (date, callback) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.get("SELECT word FROM wordles WHERE date = ?", [date], (err, row) => {
        if (err) {
          console.error('Error retrieving wordle ' + err.message);
          if (callback) callback(err, null);
          reject(err);
        } else {
          if (row) {
            if (callback) callback(null, row.word);
            resolve(row.word);
          } else {
            if (callback) callback(null, null);
            resolve(null);
          }
        }
      });
    });
  });
}

const getAllWordles = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.all("SELECT date, word FROM wordles ORDER BY date DESC", [], (err, rows) => {
        if (err) {
          console.error('Error retrieving all wordles ' + err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  });
}

const generateSitemap = async () => {
  try {
    const wordles = await getAllWordles();
    const urls = wordles.map(wordle => ({
      url: `https://nytsolver.net/answers/wordle?date=${wordle.date}`,
      lastmod: wordle.date
    }));
    return urls;
  } catch (error) {
    console.error('Error generating sitemap:', error);
    throw error;
  }
}

const generateSitemapXML = async () => {
  try {
    const urls = await generateSitemap();
    const sitemapPath = path.join(__dirname, 'public', 'sitemap', 'wordle-sitemap.xml');
    
    // Create XML content
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(entry => `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
</urlset>`;

    // Write to file
    await fs.writeFile(sitemapPath, xmlContent, 'utf8');
    console.log('Sitemap XML file generated successfully');
    return true;
  } catch (error) {
    console.error('Error generating sitemap XML:', error);
    throw error;
  }
}

const checkAndCreateSitemap = async () => {
  try {
    const sitemapPath = path.join(__dirname, 'public', 'wordle-sitemap.xml');
    try {
      await fs.access(sitemapPath);
      console.log('Sitemap XML file exists');
    } catch (error) {
      console.log('Sitemap XML file not found, creating new one...');
      await generateSitemapXML();
    }
  } catch (error) {
    console.error('Error checking/creating sitemap:', error);
    throw error;
  }
}

const fetchNewWordle = async () => {
  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    // Check if we already have today's wordle
    const existingWordle = await getWordle(dateString);
    if (existingWordle) {
      console.log('Today\'s Wordle already exists in database');
      return existingWordle;
    }

    // Fetch from NYT API
    const response = await fetch(`https://www.nytimes.com/svc/wordle/v2/${dateString}.json`);
    if (!response.ok) {
      throw new Error(`NYT API responded with status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.solution) {
      throw new Error('No solution found in NYT API response');
    }

    // Store in database
    await insertWordle(dateString, data.solution);
    console.log(`Fetched and stored new Wordle for ${dateString}`);

    // Update sitemap after new wordle is added
    await generateSitemapXML();

    return data.solution;
  } catch (error) {
    console.error('Error fetching new Wordle:', error);
    throw error;
  }
}

// Schedule daily Wordle fetch
const scheduleDailyFetch = () => {
  // Run immediately on startup
  fetchNewWordle().catch(console.error);

  // Schedule to run at midnight every day
  const now = new Date();
  const night = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1, // tomorrow
    0, 0, 0 // midnight
  );
  const msToMidnight = night.getTime() - now.getTime();

  setTimeout(() => {
    fetchNewWordle().catch(console.error);
    // Schedule next run
    setInterval(() => {
      fetchNewWordle().catch(console.error);
    }, 24 * 60 * 60 * 1000); // 24 hours
  }, msToMidnight);
}

// Start the scheduler
scheduleDailyFetch();

module.exports = {
  insertWordle,
  getWordle,
  getAllWordles,
  generateSitemap,
  generateSitemapXML,
  checkAndCreateSitemap,
  fetchNewWordle
};