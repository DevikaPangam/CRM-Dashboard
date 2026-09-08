# CorpBD CRM — Secure Multi-User Browser Application

A full-featured Corporate Business Development CRM with:
- **Secure authentication** (bcrypt passwords, session management, account lockout)
- **Role-Based Access Control** (7 default roles, 10 modules, 8 action types)
- **Admin panel** for user, role, and permission management
- **Audit logging** for logins and administrative actions
- **Docker deployment** ready

---

## Quick Start (Windows)

### Option 1: One-Click Start (Recommended)

1. **Double-click** `start-crm.bat`
2. It will automatically install Node.js (if needed), install dependencies, seed the database, and open your browser
3. Login at `http://localhost:3000` with:
   - **User ID**: `devika.admin`
   - **Password**: `Admin@2026`

### Option 2: Manual Steps

**Prerequisites**: [Node.js 18+](https://nodejs.org/) must be installed.

```powershell
# 1. Open PowerShell in the CRM Dashboard folder
cd "C:\Users\DevikaPangam\Desktop\CRM Dashboard"

# 2. Install dependencies
npm install

# 3. Set up database and create demo users
npm run seed

# 4. Start the server
npm start
```

Open browser: `http://localhost:3000`

---

## Demo Login Credentials

| User ID | Password | Role | Access |
|---------|----------|------|--------|
| `devika.admin` | `Admin@2026` | Super Admin | Full access |
| `rahul.sharma` | `Demo@2026` | BD Manager | Team + Pipeline |
| `ananya.verma` | `Demo@2026` | BD Executive | Own records |
| `vikram.malhotra` | `Demo@2026` | BD Manager | Team + Pipeline |
| `board.viewer` | `Demo@2026` | Management Viewer | Read-only dashboard |

> ⚠️ **Change all passwords immediately in production.** New users with temporary passwords are prompted to change on first login.

---

## Creating New Users (Admin Only)

1. Log in as `devika.admin`
2. Click **Users & Permissions** tab in the navigation
3. Click **+ Create New User** button
4. Fill in: Name, User ID, Email, Department, Designation, Role
5. Set a temporary password — the user will be prompted to change it on first login
6. Configure module-level permissions if needed
7. Click **Save User**

---

## File Structure

```
CRM Dashboard/
├── server.js               ← Main Express server (NEW)
├── package.json            ← Node.js project config (NEW)
├── .env                    ← Environment variables (NEW)
├── start-crm.bat           ← One-click Windows startup (NEW)
├── Dockerfile              ← Docker image (NEW)
├── docker-compose.yml      ← Docker Compose (NEW)
│
├── db/
│   ├── database.js         ← Database abstraction (NEW)
│   ├── seed.js             ← Database seeder (NEW)
│   └── migrations/
│       └── 001_initial_schema.sql  ← Schema (NEW)
│
├── middleware/
│   └── auth.js             ← Auth middleware (NEW)
│
├── routes/
│   ├── auth.js             ← Login/logout/change-password (NEW)
│   └── admin.js            ← User & permission management API (NEW)
│
├── public/
│   ├── login.html          ← Login page (NEW)
│   ├── login.css           ← Login styles (NEW)
│   └── login.js            ← Login logic (NEW)
│
├── index.html              ← CRM app (MODIFIED — auth guard added)
├── app.js                  ← CRM controller (MODIFIED — auth methods added)
├── data.js                 ← Data store (UNCHANGED)
├── charts.js               ← Charts (UNCHANGED)
├── export.js               ← Exports (UNCHANGED)
└── style.css               ← Styles (UNCHANGED)
```

---

## API Reference

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Login with user_id + password |
| `/api/auth/logout` | POST | Logout and destroy session |
| `/api/auth/me` | GET | Get current authenticated user |
| `/api/auth/permissions` | GET | Get effective permissions map |
| `/api/auth/change-password` | POST | Change own password |

### Admin (Super Admin only)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/users` | GET | List all users |
| `/api/admin/users` | POST | Create user |
| `/api/admin/users/:id` | PUT | Update user |
| `/api/admin/users/:id` | DELETE | Deactivate user |
| `/api/admin/users/:id/reset-password` | POST | Admin password reset |
| `/api/admin/users/:id/unlock` | POST | Unlock locked account |
| `/api/admin/roles` | GET | List roles |
| `/api/admin/modules` | GET | List modules |
| `/api/admin/permissions/:userId` | GET | Get user permissions |
| `/api/admin/permissions/:userId` | PUT | Update user permissions |
| `/api/admin/login-history` | GET | Login audit log |
| `/api/admin/audit-log` | GET | Change audit log |
| `/api/admin/health` | GET | System health check |

---

## Production Deployment

### Using Docker

```bash
# 1. Copy and edit environment variables
cp .env.example .env
# Edit .env: set SECRET_KEY to a long random string

# 2. Build and start
docker-compose up -d

# 3. Check logs
docker-compose logs -f

# 4. Access at http://your-server-ip:3000
```

### On a VPS / Server (Ubuntu)

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone/copy your CRM files to the server
cd /opt/crm-app

# Install dependencies and seed
npm install
npm run seed

# Use PM2 for process management
npm install -g pm2
pm2 start server.js --name crm-app
pm2 startup  # Auto-start on reboot
pm2 save

# Setup NGINX reverse proxy (optional, for HTTPS)
sudo apt install nginx
# Configure nginx to proxy :80 -> :3000
```

### Cloudflare Tunnel (Free HTTPS, No Domain Required)

```bash
# Install cloudflared
winget install Cloudflare.cloudflared

# Start a tunnel (works from any network)
cloudflared tunnel --url http://localhost:3000
# Cloudflare provides a random .trycloudflare.com URL
```

---

## Security Notes

| Feature | Implementation |
|---------|----------------|
| Passwords | bcrypt hash, cost factor 12 |
| Sessions | httpOnly cookies, SQLite-backed |
| Account lockout | After 5 failed attempts, 30-minute lock |
| Rate limiting | 10 login attempts per 15 minutes per IP |
| Permission enforcement | Server-side on every API call |
| Audit logging | All logins and admin actions logged |
| Security headers | Helmet.js (CSP, XSS, HSTS, etc.) |
| Session timeout | 60 minutes idle timeout |

> ⚠️ For production, always set `ENVIRONMENT=production` and use a strong `SECRET_KEY` (min 32 random characters).

---

## Backup & Restore

```powershell
# Backup database
Copy-Item "db\crm.db" "db\crm_backup_$(Get-Date -Format 'yyyyMMdd').db"

# Restore database
Stop-Process -Name "node" -Force  # Stop server
Copy-Item "db\crm_backup_20260907.db" "db\crm.db"
# Restart server
```
