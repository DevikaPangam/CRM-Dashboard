/**
 * CRM Server — Express application entry point
 * Serves the existing CRM frontend + authentication layer
 */

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { attachUser, requireLogin } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.ENVIRONMENT === 'production';

// ─── Security Headers ─────────────────────────────────────────────────────────

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",            // needed for Chart.js inline scripts
        'https://unpkg.com',          // Lucide icons
        'https://cdn.jsdelivr.net',   // Chart.js
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        'https://fonts.googleapis.com',
      ],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // needed for Chart.js CDN
}));

// ─── CORS ────────────────────────────────────────────────────────────────────

app.use(cors({
  origin: isProd ? false : true, // allow all in dev, disable in prod (same-origin)
  credentials: true,
}));

// ─── Body Parsing ─────────────────────────────────────────────────────────────

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Session ─────────────────────────────────────────────────────────────────

// SQLite-backed session store for durability across restarts
let sessionStore;
try {
  const SqliteStore = require('better-sqlite3-session-store')(session);
  const Database = require('better-sqlite3');
  const dbPath = path.resolve(__dirname, 'db', 'crm.db');
  const sessionDb = new Database(dbPath);
  sessionStore = new SqliteStore({
    client: sessionDb,
    expired: { clear: true, intervalMs: 15 * 60 * 1000 }
  });
} catch (e) {
  // Fallback: in-memory store (loses sessions on restart, fine for development)
  console.warn('⚠ SQLite session store unavailable, using in-memory store:', e.message);
  sessionStore = undefined;
}

app.use(session({
  name: 'crm_session',
  secret: process.env.SECRET_KEY || 'crm-dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    httpOnly: true,                  // Prevent JS access to cookie
    secure: isProd,                  // HTTPS only in production
    sameSite: isProd ? 'strict' : 'lax',
    maxAge: parseInt(process.env.SESSION_TIMEOUT || '3600', 10) * 1000,
  },
}));

// ─── Attach User to all Requests ──────────────────────────────────────────────

app.use(attachUser);

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Simple ping for health checks
app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), authenticated: !!req.user });
});

// ─── Static File Serving ──────────────────────────────────────────────────────

const publicDir = path.resolve(__dirname);

// Serve index.html directly — no login required
app.get('/login.html', (req, res) => {
  res.redirect('/index.html');
});

// Serve login.css and login.js without auth
app.use('/public', express.static(path.join(publicDir, 'public')));

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Serve all static CRM files
app.use(express.static(publicDir, {
  dotfiles: 'deny'
}));

// ─── Catch-all: Route Unknown Requests ────────────────────────────────────────

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, error: 'API endpoint not found.' });
  }
  res.redirect('/index.html');
});

// ─── Global Error Handler ─────────────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (req.path.startsWith('/api/')) {
    return res.status(500).json({
      success: false,
      error: isProd
        ? 'An internal error occurred. Please try again.'
        : err.message
    });
  }
  res.status(500).send(isProd
    ? '<h2>An error occurred. Please try again.</h2>'
    : `<pre>${err.stack}</pre>`
  );
});

// ─── Start Server ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  const env = process.env.ENVIRONMENT || 'development';
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  CorpBD CRM — Secure Multi-User Application');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Environment : ${env.toUpperCase()}`);
  console.log(`  URL         : http://localhost:${PORT}`);
  console.log(`  Login       : http://localhost:${PORT}/login.html`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  if (env === 'development') {
    console.log('  ⚠  Development mode — do not use in production without');
    console.log('     setting ENVIRONMENT=production in your .env file');
    console.log('');
  }
});

module.exports = app;
