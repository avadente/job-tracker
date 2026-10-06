# Job Tracker

A small, self-hosted job application tracker: Flask + MySQL, with a table view, a drag-and-drop Kanban board, search/filter, follow-up reminders, and CSV export.

## Features

- Track company, role, posting URL, location/work mode, salary, contact, resume version, notes
- Statuses: wishlist → applied → screening → interview → offer (plus rejected / ghosted / withdrawn)
- **Table view** with sortable columns, and **Board view** — drag cards between columns to change status
- Follow-ups whose "next action date" is today or earlier are highlighted
- Summary stats (total, active, interviewing, offers, follow-ups due)
- One-click CSV export

## Setup (Ubuntu / WSL)

### 1. Install and start MySQL

```bash
sudo apt update
sudo apt install -y mysql-server
sudo systemctl enable --now mysql
```

### 2. Create the database and a dedicated user

```bash
sudo mysql < schema.sql
sudo mysql -e "CREATE USER IF NOT EXISTS 'jobtracker'@'localhost' IDENTIFIED BY 'pick-a-strong-password';
               GRANT ALL PRIVILEGES ON job_tracker.* TO 'jobtracker'@'localhost';"
```

### 3. Configure the app

```bash
cp .env.example .env
# edit .env and set DB_PASSWORD to the password you chose above
```

`.env` is git-ignored, so your password never gets committed.

### 4. Install dependencies and run

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Open <http://localhost:5000> (works from your Windows browser too when running under WSL).

## Using MySQL installed on Windows (app running in WSL)

If MySQL runs on Windows instead of inside WSL, WSL reaches it through the Windows host address, not `127.0.0.1`:

1. Find the address from WSL: `ip route show default | awk '{print $3}'` (e.g. `172.17.0.1`) and set it as `DB_HOST` in `.env`.
2. MySQL sees WSL connections as coming from a `172.x` address, so create the user for that host. In MySQL Shell, switch to SQL mode first (`\sql`, then `\connect root@localhost`):
   ```sql
   CREATE USER 'jobtracker'@'172.%' IDENTIFIED BY 'pick-a-strong-password';
   GRANT ALL PRIVILEGES ON job_tracker.* TO 'jobtracker'@'172.%';
   FLUSH PRIVILEGES;
   ```
3. Create the tables by running `schema.sql` (e.g. `\source` it in MySQL Shell, or open it in Workbench).

To edit `.env` from PowerShell: `notepad '\\wsl.localhost\Ubuntu\home\<you>\job-tracker\.env'`.

If the app stops connecting after a Windows restart, re-check the host address from step 1.

## Upgrading an existing database

If your database was created before a column was added, run the matching file in `migrations/` once (e.g. `\source migrations/001_add_deadline.sql` in MySQL Shell).

## Backups

Your data lives in MySQL, not in this repo. To back it up:

```bash
mkdir -p backups
mysqldump -u jobtracker -p job_tracker > backups/job_tracker-$(date +%F).sql
```

Restore with `mysql -u jobtracker -p job_tracker < backups/<file>.sql`. The `backups/` folder is git-ignored.

## API

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/applications` | List all applications |
| POST | `/api/applications` | Create (JSON body; `company` and `role` required) |
| PATCH | `/api/applications/<id>` | Update any subset of fields |
| DELETE | `/api/applications/<id>` | Delete |
| GET | `/export.csv` | Download everything as CSV |
