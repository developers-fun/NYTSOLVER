const sqlite3 = require('sqlite3').verbose();
const path = require('path');
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

const insertWordle = (date, word) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run("INSERT INTO wordles (date, word) VALUES (?, ?)", [date, word], function (err) {
        if (err) {
          console.error('Error inserting wordle ' + err.message);
          reject(err);
        } else {
          console.log(`Inserted wordle with date ${date} and word ${word}`);
          resolve();
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

module.exports = {
  insertWordle,
  getWordle
};