const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'pass',
  database: process.env.DB_NAME || 'bbapp',
  // RDS typically requires SSL
  ssl: { rejectUnauthorized: false }
});

// --- Seasons (static)
const seasons = [
  { season: 1, episodes: 7, summary: 'Walter White, a high-school chemistry teacher, partners with former student Jesse Pinkman to produce meth to secure his family’s future after a cancer diagnosis. The season shows Walt’s first steps into crime and the moral shockwaves that follow.' },
  { season: 2, episodes: 13, summary: 'Walt and Jesse’s operation grows more dangerous. The season explores consequences — plane tragedy looms across the storylines, and relationships and lies deepen.' },
  { season: 3, episodes: 13, summary: 'Walt becomes more deeply involved in the drug trade while trying to protect his family. The season introduces new criminal players and shows Walt’s morality eroding as stakes rise.' },
  { season: 4, episodes: 13, summary: 'A tense cat-and-mouse between Walt and Gus Fring culminates. Walt becomes strategic and ruthless, cementing his transformation into a criminal mastermind.' },
  { season: 5, episodes: 16, summary: 'Walt’s empire reaches its peak and then collapses. The final season resolves major storylines with high-stakes confrontations, consequences for all the major characters, and a final reckoning.' }
];

app.get('/api/health', (_, res) => res.json({ ok: true }));
app.get('/api/seasons', (_, res) => res.json(seasons));

// Questions
app.post('/api/questions', async (req, res) => {
  const { name, question } = req.body;
  if (!question || question.trim() === '') return res.status(400).send('Question required');
  try {
    const result = await pool.query(
      'INSERT INTO questions (name, question) VALUES ($1, $2) RETURNING id, name, question, created_at',
      [name || 'Anonymous', question]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Insert question error', err);
    res.status(500).send('Error saving question');
  }
});

app.get('/api/questions', async (_, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, question, created_at FROM questions ORDER BY created_at DESC LIMIT 50'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch questions error', err);
    res.status(500).send('Error fetching questions');
  }
});

// Answers
app.post('/api/answers', async (req, res) => {
  const { question_id, name, answer } = req.body;
  if (!question_id || !answer) return res.status(400).send('question_id & answer required');
  try {
    const result = await pool.query(
      'INSERT INTO answers (question_id, name, answer) VALUES ($1, $2, $3) RETURNING id, question_id, name, answer, created_at',
      [question_id, name || 'Anonymous', answer]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Insert answer error', err);
    res.status(500).send('Error saving answer');
  }
});

app.get('/api/answers/:question_id', async (req, res) => {
  try {
    const qid = req.params.question_id;
    const result = await pool.query(
      'SELECT id, question_id, name, answer, created_at FROM answers WHERE question_id=$1 ORDER BY created_at ASC',
      [qid]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch answers error', err);
    res.status(500).send('Error fetching answers');
  }
});

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => console.log(`backend running on port ${PORT}`));
