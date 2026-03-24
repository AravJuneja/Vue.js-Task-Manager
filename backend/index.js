require('dotenv').config()
const express = require('express')
const session = require('express-session')
const passport = require('passport')
const { Strategy: GoogleStrategy } = require('passport-google-oauth20')
const cors = require('cors')
const Database = require('better-sqlite3')

const db = new Database('tasks.db')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT,
    name TEXT
  );
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    title TEXT,
    done INTEGER DEFAULT 0
  );
`)

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
  const user = { id: profile.id, email: profile.emails[0].value, name: profile.displayName }
  db.prepare('INSERT OR IGNORE INTO users VALUES (@id, @email, @name)').run(user)
  done(null, user)
}))

passport.serializeUser((user, done) => done(null, user.id))
passport.deserializeUser((id, done) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
  done(null, user)
})

const app = express()
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }))
app.use(express.json())
app.use(session({ secret: process.env.SESSION_SECRET || 'secret', resave: false, saveUninitialized: false }))
app.use(passport.initialize())
app.use(passport.session())

const auth = (req, res, next) => req.user ? next() : res.status(401).json({ error: 'Unauthorized' })

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }))
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173'))
app.get('/auth/logout', (req, res) => { req.logout(() => res.json({ ok: true })) })
app.get('/auth/me', (req, res) => res.json(req.user || null))

app.get('/tasks', auth, (req, res) => {
  res.json(db.prepare('SELECT * FROM tasks WHERE user_id = ?').all(req.user.id))
})
app.post('/tasks', auth, (req, res) => {
  const { title } = req.body
  const result = db.prepare('INSERT INTO tasks (user_id, title) VALUES (?, ?)').run(req.user.id, title)
  res.json({ id: result.lastInsertRowid, user_id: req.user.id, title, done: 0 })
})
app.patch('/tasks/:id', auth, (req, res) => {
  const { title, done } = req.body
  db.prepare('UPDATE tasks SET title = COALESCE(?, title), done = COALESCE(?, done) WHERE id = ? AND user_id = ?')
    .run(title ?? null, done ?? null, req.params.id, req.user.id)
  res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id))
})
app.delete('/tasks/:id', auth, (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id)
  res.json({ ok: true })
})

app.listen(3000, () => console.log('Backend running on http://localhost:3000'))
