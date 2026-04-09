# Appalto Smart – Production deployment (Hostinger)

**Live URL:** https://plum-cod-233835.hostingersite.com  

This guide moves the app from local to live **without losing any MySQL data or users**.

---

## Upload latest files to Hostinger (run from your Mac)

**The deploy script must be run on your computer** so your Hostinger SSH key is used. Automated runs from Cursor may not have access to your key, so files may not actually update on the server.

1. Open **Terminal** on your Mac.
2. Run:

```bash
cd "/Users/riyadulislamriyadh/Desktop/Appalto Smart"
./deploy-to-hostinger.sh
```

3. If prompted, enter your SSH password (or ensure your key `~/.ssh/hostinger_appalto` or `.deploy-keys/hostinger` is added in Hostinger SSH Access).
4. At the end, the script prints file dates on the server – if you see today’s date, the upload worked. In Hostinger File Manager, check `public_html/appalto-backend/public/` – `index.html` and `assets/*.js` should have today’s date.

---

## 1. Prepare on your machine

### 1.1 Export local MySQL (keep all data)

From your Mac/PC (where the app runs locally):

```bash
# Replace with your local DB name/user/password if different
mysqldump -u root -p appalto_smart > appalto_smart_backup.sql
```

Or if you use a socket / different host:

```bash
mysqldump -u root -p --single-transaction appalto_smart > appalto_smart_backup.sql
```

Keep `appalto_smart_backup.sql` safe – you’ll import it on Hostinger.

### 1.2 Build frontend for production

In the project root (where `package.json` and `appalto-backend/` live):

```bash
# Install deps if needed
npm ci

# Build React app (uses .env.production → plum-cod domain)
npm run build
```

This creates the `dist/` folder. The build uses `VITE_API_URL=https://plum-cod-233835.hostingersite.com/api` from `.env.production`.

### 1.3 Backend production env template

- The file `appalto-backend/.env.production.example` is the template for the server.
- On the server you’ll copy it to `.env` and set real `APP_KEY`, `DB_*`, and optional `GROQ_API_KEY`.

---

## 2. On Hostinger (hPanel)

1. **Create MySQL database**
   - hPanel → **Databases** → **MySQL Databases** → create database and user, note:
     - Database name  
     - Username  
     - Password  
     - Host (usually `localhost`)

2. **Import your data**
   - **phpMyAdmin** (or “Import” in hPanel): select the new database → **Import** → choose `appalto_smart_backup.sql` → Go.  
   - This brings over all users, tenders, bids, documents metadata, etc.

3. **SSH (if available)**
   - **Advanced** → **SSH Access** → enable and note host, user, port (e.g. 65002 for shared).

---

## 3. Upload files to Hostinger

Document root of the site must point to the **Laravel `public`** folder (see below). Two options:

### Option A: Upload via File Manager (no SSH)

1. **Backend**
   - Upload the whole `appalto-backend/` folder (except `node_modules` and `.env` if you prefer to create `.env` on the server).
   - On the server, create `.env` (copy from `appalto-backend/.env.production.example`), set `APP_KEY`, `DB_*`, `APP_URL`, `SANCTUM_STATEFUL_DOMAINS=plum-cod-233835.hostingersite.com`.

2. **Frontend**
   - Upload **contents** of `dist/` (index.html + assets/) **inside** `appalto-backend/public/` so that:
     - `public/index.html` → SPA
     - `public/api/` → Laravel API (via server rewrite, see below)

3. **Document root**
   - In hPanel → **Domains** / **Advanced** → set document root to:  
     `.../appalto-backend/public`  
   (exact path depends on where you uploaded `appalto-backend`).

4. **Laravel on server**
   - Run (via SSH or Hostinger’s “Run PHP script” / terminal if they offer it):
     - `composer install --no-dev`
     - `php artisan key:generate` (if APP_KEY is empty)
     - `php artisan storage:link`
   - If you didn’t import DB and prefer migrations: `php artisan migrate`.

### Option B: Deploy via SSH (recommended)

When you have SSH details, use the script below (or the same steps by hand):

- From your machine: build frontend (`npm run build`), then rsync/scp:
  - Laravel project (excluding vendor, .env, node_modules) to the server.
  - Contents of `dist/` into `appalto-backend/public/` on the server.
- On the server: create `.env` from `.env.production.example`, then:
  - `composer install --no-dev`
  - `php artisan key:generate`
  - `php artisan storage:link`
- Import `appalto_smart_backup.sql` into the Hostinger MySQL DB (same as in step 2 above).

---

## 4. Server configuration (Laravel in `public`)

- **Document root:** must be the `public` folder of Laravel (e.g. `.../public` or `.../appalto-backend/public`).
- **API:** Laravel routes are under `/api`. So:
  - `https://plum-cod-233835.hostingersite.com/` → serve `public/index.html` (React SPA).
  - `https://plum-cod-233835.hostingersite.com/api/*` → Laravel.

If the server doesn’t route `/api` to Laravel by default, add an `.htaccess` in `public/` (or equivalent) so that:

- Requests to `/api` (and below) are handled by Laravel (e.g. `index.php`).
- All other requests fall back to `index.html` (SPA).

Example `public/.htaccess` (Apache):

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    # API to Laravel
    RewriteCond %{REQUEST_URI} ^/api
    RewriteRule ^ index.php [L]
    # Static files
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^ index.html [L]
</IfModule>
```

(Laravel’s default `public/.htaccess` already sends non-files to `index.php`; the important part is that the document root is `public` and `/api` goes to Laravel.)

---

## 5. Checklist before go-live

- [ ] `.env` on server: `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL=https://plum-cod-233835.hostingersite.com`
- [ ] `.env`: correct `DB_*` for Hostinger MySQL
- [ ] `.env`: `SANCTUM_STATEFUL_DOMAINS=plum-cod-233835.hostingersite.com`
- [ ] MySQL data imported from `appalto_smart_backup.sql`
- [ ] `php artisan storage:link` run (so `/storage` works for uploads)
- [ ] Document root = Laravel `public` folder
- [ ] Frontend built with `npm run build` and contents of `dist/` in `public/`

---

## 6. After you provide SSH

Once you share SSH host, user, port, and (if needed) deploy path, a deploy script can:

1. Build the frontend (`npm run build`).
2. Rsync backend + `dist/` to the server.
3. Remind you to run on the server: `composer install --no-dev`, `php artisan key:generate`, `php artisan storage:link`, and to import the DB if not done yet.

This keeps your site at **https://plum-cod-233835.hostingersite.com** with **all MySQL data and users** preserved.
