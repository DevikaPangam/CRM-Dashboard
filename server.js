/**
 * ============================================================================
 * CorpBD CRM — Production Server (Supabase Native Architecture)
 * ============================================================================
 * Primary backend identity and database: Supabase Auth & PostgreSQL.
 * This server provides:
 * 1. Secure Server-Side Admin API bridge for privileged user provisioning (/api/admin/users)
 * 2. Static SPA hosting for production Vite bundle
 * 3. Security headers and health-check monitoring
 *
 * NOTE: Legacy SQLite/bcrypt authentication has been successfully decommissioned.
 */

require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const adminUsersRoutes = require('./routes/adminUsers');

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.ENVIRONMENT === 'production' || process.env.NODE_ENV === 'production';

// ─── Security Headers ─────────────────────────────────────────────────────────

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          'https://unpkg.com',
          'https://cdn.jsdelivr.net',
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com',
        ],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        connectSrc: ["'self'", 'https://*.supabase.co', 'wss://*.supabase.co'],
        frameSrc: ["'self'", 'https://*.streamlit.app'],
        objectSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// ─── CORS ────────────────────────────────────────────────────────────────────

app.use(
  cors({
    origin: isProd ? false : true,
    credentials: true,
  })
);

// ─── Body Parsing ─────────────────────────────────────────────────────────────

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── API Routes (Supabase Privileged Bridge) ──────────────────────────────────

// Privileged Administrator User Provisioning Endpoint
app.use('/api/admin/users', adminUsersRoutes);

// Health check endpoint
app.get('/api/ping', (req, res) => {
  res.json({
    status: 'ok',
    architecture: 'Supabase PostgreSQL + Supabase Auth',
    time: new Date().toISOString(),
    environment: isProd ? 'production' : 'development',
  });
});

// ─── Static File Serving (SPA Distribution) ───────────────────────────────────

const distDir = path.resolve(__dirname, 'dist');
const publicDir = path.resolve(__dirname);

// Prefer built production bundle if dist/ exists
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
}

app.use('/public', express.static(path.join(publicDir, 'public')));
app.use(express.static(publicDir, { dotfiles: 'deny' }));

// ─── Catch-all: Route Unknown Requests to SPA index.html ──────────────────────

app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, error: 'API endpoint not found.' });
  }

  if (fs.existsSync(path.join(distDir, 'index.html'))) {
    return res.sendFile(path.join(distDir, 'index.html'));
  }
  res.sendFile(path.join(publicDir, 'index.html'));
});

// ─── Global Error Handler ─────────────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  if (req.path.startsWith('/api/')) {
    return res.status(500).json({
      success: false,
      error: isProd ? 'An internal server error occurred.' : err.message,
    });
  }
  res.status(500).send('<h2>A server error occurred. Please try again.</h2>');
});

// ─── Start Server ─────────────────────────────────────────────────────────────

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  CorpBD CRM — Rajmudra Group Multi-Tenant Enterprise Application');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Architecture : Supabase Auth + PostgreSQL RLS + Realtime + Storage`);
    console.log(`  Environment  : ${isProd ? 'PRODUCTION' : 'DEVELOPMENT'}`);
    console.log(`  URL          : http://localhost:${PORT}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  });
}

module.exports = app;
