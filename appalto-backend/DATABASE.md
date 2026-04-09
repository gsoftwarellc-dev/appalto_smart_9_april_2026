# Database setup (MySQL – same for local and production)

The app uses **MySQL** for both local development and production so the stack stays the same and you get fewer environment-specific bugs.

## Local development

### 1. Create the database

Make sure MySQL is running, then create the database:

```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS appalto_smart CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

If your MySQL user has a password:

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS appalto_smart CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 2. Configure environment

Copy `.env.example` to `.env` if needed, then set:

- `DB_CONNECTION=mysql`
- `DB_DATABASE=appalto_smart`
- `DB_USERNAME=root` (or your MySQL user)
- `DB_PASSWORD=` (or your password)

### 3. Migrate and load data

**Option A – You have existing SQLite data** (e.g. `database/database.sqlite` from before):

```bash
php artisan migrate
php artisan app:import-sqlite-to-mysql
```

This keeps all existing users and data in MySQL.

**Option B – Fresh install** (no SQLite or you want demo data only):

```bash
php artisan migrate
php artisan db:seed
```

This creates the 3 demo users (admin, contractor, owner) and demo tenders/bids.

### 4. Run the backend

```bash
php artisan serve
```

---

## Production

Use the same MySQL setup:

1. Create a MySQL database (e.g. `appalto_smart`) on your server.
2. In production `.env`, set:
   - `DB_CONNECTION=mysql`
   - `DB_HOST=...`
   - `DB_DATABASE=appalto_smart`
   - `DB_USERNAME=...`
   - `DB_PASSWORD=...`
3. Run `php artisan migrate` (and optionally `db:seed` if you want demo data, or import from a backup).

---

## Demo login (after seeding)

| Role   | Email                  | Password    |
|--------|------------------------|-------------|
| Contractor | contractor@example.com | password123 |
| Admin      | admin@example.com      | password123 |
| Owner       | owner@example.com      | password123 |
