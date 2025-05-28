const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const SHEET_ID = '1OebxBxHM3HjEFhhjIEimsHDm2qtQ7g8EvbKW5v8s9o4';

const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

// ✅ שליפת משתמשים
app.get('/users', async (req, res) => {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'user!B2:D'
    });
    const rows = result.data.values || [];
    const users = rows.map(row => ({
      username: row[0],
      password: row[1],
      role: row[2] || 'user'
    }));
    res.json(users);
  } catch (err) {
    console.error('שגיאה בגישה ל-Google Sheets:', err.message);
    res.status(500).json({ error: "שגיאה בגישה ל-Google Sheets" });
  }
});

// ✅ שליפת היסטוריה לפי משתמש עם אינדקס שורה אמיתי
app.get('/history', async (req, res) => {
  const username = req.query.user;
  if (!username) return res.status(400).json({ error: "Missing user param" });

  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'history!A2:J'
    });

    const rows = result.data.values || [];
    const filtered = rows
      .map((row, i) => ({ rowIndex: i + 2, row }))
      .filter(item => item.row[0]?.trim().toLowerCase() === username.trim().toLowerCase());

    res.json(filtered);
  } catch (err) {
    console.error('שגיאה בשליפת היסטוריה:', err.message);
    res.status(500).json({ error: "שגיאה בגישה ל-Google Sheets" });
  }
});

// ✅ עדכון שורה לפי rowIndex אמיתי
app.patch('/tasks/:row', async (req, res) => {
  const row = Number(req.params.row);
  const { startTime, endTime, done, status } = req.body;

  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });
  const updates = [];

  if (startTime !== undefined) {
    updates.push({ range: `history!H${row}`, values: [[startTime]] });
    updates.push({ range: `history!F${row}`, values: [["TRUE"]] });
  }

  if (endTime !== undefined) {
    updates.push({ range: `history!I${row}`, values: [[endTime]] });
    updates.push({ range: `history!G${row}`, values: [["TRUE"]] });
  }

  if (status !== undefined) {
    updates.push({ range: `history!J${row}`, values: [[status]] });
  }

  try {
    for (const u of updates) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: u.range,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: u.values }
      });
    }
    res.json({ status: 'success' });
  } catch (err) {
    console.error('שגיאה בעדכון:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ הפעלת השרת
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ השרת פעיל על פורט ${PORT}`));
