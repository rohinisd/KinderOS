# Database Backup Runbook

This project uses one shared Postgres database for all schools. A single backup covers every tenant.

## 1) One-time setup (GitHub Actions backup workflow)

1. Open your GitHub repository.
2. Go to `Settings` -> `Secrets and variables` -> `Actions`.
3. Add these repository secrets:
   - `BACKUP_DATABASE_URL`: production Postgres connection string.
   - `BACKUP_ENCRYPTION_PASSPHRASE`: strong random phrase (recommended).
4. Go to `Actions` tab and run `Scheduled Database Backups` once using `Run workflow`.

## 2) Schedule

- Workflow file: `.github/workflows/weekly-db-backup.yml`
- Daily: 02:30 UTC (08:00 IST), retained 14 days.
- Weekly: Sunday 02:45 UTC (08:15 IST), retained 60 days.
- Monthly: Day 1 at 03:00 UTC (08:30 IST), retained 90 days.
- You can also trigger manually from the Actions tab.

## 3) Output

- Artifact names:
  - `db-backup-daily-<run_id>`
  - `db-backup-weekly-<run_id>`
  - `db-backup-monthly-<run_id>`
  - `db-backup-manual-<run_id>`
- If encryption secret is set, output file is:
  - `kinderos-db-<cadence>-<timestamp>.sql.gz.enc`
- If encryption secret is not set, output file is:
  - `kinderos-db-<cadence>-<timestamp>.sql.gz`

## 4) Superadmin GUI for download

You can download backups directly from your app UI at `/admin/backups`.

To enable this page:

1. Create a GitHub fine-grained personal access token with:
   - Repository access: your project repo
   - Permission: Actions (read-only)
2. In Vercel project environment variables (Production), add:
   - `GITHUB_BACKUP_REPO` = `owner/repo`
   - `GITHUB_BACKUP_TOKEN` = `<token>`
3. Redeploy the app.

Then open `/admin/backups` as superadmin and click **Download**.

## 5) Restore (non-production first)

### Encrypted backup

1. Decrypt:
   - `openssl enc -d -aes-256-cbc -pbkdf2 -in backup.sql.gz.enc -out backup.sql.gz -pass env:BACKUP_ENCRYPTION_PASSPHRASE`
2. Decompress:
   - `gunzip backup.sql.gz`
3. Restore:
   - `psql "<TARGET_DATABASE_URL>" -f backup.sql`

### Unencrypted backup

1. Decompress:
   - `gunzip backup.sql.gz`
2. Restore:
   - `psql "<TARGET_DATABASE_URL>" -f backup.sql`

## 6) Monthly restore drill checklist

- Restore latest backup to a temporary database.
- Validate row counts for core tables: `schools`, `students`, `staff`, `fee_invoices`, `payments`.
- Spot-check recent records (fees, attendance, admissions).
- Record drill date and result in your ops notes.
