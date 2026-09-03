const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 連線並自動建立 SQLite 資料庫檔案
const db = new sqlite3.Database('./scale.db', (err) => {
  if (err) {
    console.error('資料庫連線失敗:', err.message);
  } else {
    console.log('已成功連線至 SQLite 資料庫。');
  }
});

// 初始化資料表
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS dispatches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer TEXT NOT NULL,
      project TEXT NOT NULL,
      material TEXT NOT NULL,
      driver TEXT,
      plate TEXT NOT NULL,
      weight INTEGER NOT NULL,
      exit_time TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// 手機版路由入口
app.get('/m', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'view.html'));
});

// API: 取得所有車次紀錄
app.get('/api/dispatches', (req, res) => {
  const sql = 'SELECT * FROM dispatches ORDER BY id ASC';
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ data: rows });
  });
});

// API: 新增單筆車次紀錄
app.post('/api/dispatches', (req, res) => {
  const { customer, project, material, driver, plate, weight, exit_time } = req.body;
  if (!plate || !weight || !customer) {
    return res.status(400).json({ error: '客戶、車牌與重量為必填欄位。' });
  }

  const sql = `
    INSERT INTO dispatches (customer, project, material, driver, plate, weight, exit_time) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [customer, project, material, driver || '-', plate, Number(weight), exit_time || '-'];

  db.run(sql, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({
      message: '新增成功',
      data: { id: this.lastID, customer, project, material, driver, plate, weight: Number(weight), exit_time }
    });
  });
});

// API: 刪除單筆車次紀錄
app.delete('/api/dispatches/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM dispatches WHERE id = ?';
  db.run(sql, id, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: '刪除成功', changes: this.changes });
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=========================================`);
  console.log(`系統啟動成功！`);
  console.log(`電腦端管理網址: http://localhost:${PORT}`);
  console.log(`手機端唯讀網址: http://[你的電腦IP]:${PORT}/m`);
  console.log(`=========================================`);
});