Absolutely. Below is a **clean, Docker‑free production deployment** guide for the CSIR–SERC Recruitment Portal on an **Ubuntu server** using **systemd** services. It includes:

*   Local installation (Node.js, MySQL, Tesseract, MinIO, Nginx)
*   Environment setup
*   Build & Prisma migrations
*   **systemd unit files** for the **API** and **Web** apps (and optional MinIO/MailHog)
*   Reverse proxy with Nginx
*   Hardening & troubleshooting

> This guide assumes Ubuntu 22.04+ and sudo privileges.

***

## 0) Plan & ports

*   **Web (Next.js)**: `:3000` → proxied via Nginx to `https://yourdomain`
*   **API (Express)**: `:4000`
*   **MySQL**: `:3306` (native apt service)
*   **MinIO** (S3-compatible storage): `:9000` (API) and `:9001` (console)
*   **MailHog** (optional): `:1025` SMTP, `:8025` UI

> The web app calls API via `NEXT_PUBLIC_API_BASE=http://localhost:4000` (no public exposure needed).

***

## 1) Create an app user & base directories

```bash
sudo adduser --system --group --home /opt/serc serc
sudo mkdir -p /opt/serc/app /opt/serc/logs /etc/csir-serc
sudo chown -R serc:serc /opt/serc
```

***

## 2) Install system packages (Node, Nginx, MySQL, Tesseract)

```bash
# Update
sudo apt update && sudo apt upgrade -y

# Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs build-essential

# Nginx
sudo apt install -y nginx

# MySQL 8.0
sudo apt install -y mysql-server
sudo systemctl enable --now mysql

# Tesseract OCR (for document OCR)
sudo apt install -y tesseract-ocr tesseract-ocr-eng
```

> **Why these versions?** Node 18 LTS is widely supported by Next.js 14 & common libraries; Tesseract package provides the OCR CLI used by the API. Systemd-managed MySQL is the recommended native way on Ubuntu.

***

## 3) (Optional but recommended) Install **MinIO** natively

Your API expects S3/MinIO for uploads (Sharp compression + checksums + OCR). Install MinIO without Docker:

```bash
cd /usr/local/bin
sudo wget https://dl.min.io/server/minio/release/linux-amd64/minio -O minio
sudo chmod +x minio

# Data directories
sudo mkdir -p /var/lib/minio
sudo chown -R serc:serc /var/lib/minio
```

Create **MinIO systemd** (optional):

```ini
# /etc/systemd/system/minio.service
[Unit]
Description=MinIO Object Storage
After=network-online.target
Wants=network-online.target

[Service]
User=serc
Group=serc
ExecStart=/usr/local/bin/minio server /var/lib/minio --console-address ":9001"
Environment="MINIO_ROOT_USER=minioadmin"
Environment="MINIO_ROOT_PASSWORD=minioadmin"
Restart=always
RestartSec=5
WorkingDirectory=/var/lib/minio
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now minio
```

> Open the MinIO console at `http://SERVER_IP:9001`, **create bucket** `uploads` and set **public read policy** (Policy → `ReadOnly`). The API builds URLs with `S3_PUBLIC_URL=http://localhost:9000/uploads`, so public read is needed for direct downloads.

***

## 4) (Optional) Install **MailHog** natively (dev/test SMTP)

```bash
cd /usr/local/bin
sudo wget https://github.com/mailhog/MailHog/releases/download/v1.0.1/MailHog_linux_amd64 -O mailhog
sudo chmod +x mailhog
```

Create **mailhog systemd**:

```ini
# /etc/systemd/system/mailhog.service
[Unit]
Description=MailHog development SMTP
After=network.target

[Service]
ExecStart=/usr/local/bin/mailhog
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now mailhog
```

***

## 5) Pull the code and set ownership

```bash
sudo -u serc bash -c 'cd /opt/serc/app && git clone https://github.com/YOUR_ORG/csir-serc-recruitment.git src'
# Or unzip to /opt/serc/app/src if you used the ZIP
sudo chown -R serc:serc /opt/serc/app
```

> The production ZIP I provided has everything ready (Web, API, Prisma, systemd scripts).

***

## 6) Configure **environment files**

Create **API env**:

```ini
# /etc/csir-serc/api.env
PORT=4000
WEB_ORIGIN=http://localhost:3000
DATABASE_URL=mysql://serc_user:STRONG_PASSWORD@localhost:3306/serc_recruit
JWT_SECRET=CHANGE_ME
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_FROM="CSIR-SERC Recruitment <no-reply@serc.res.in>"
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_KEY=minioadmin
S3_SECRET=minioadmin
S3_BUCKET=uploads
S3_PUBLIC_URL=http://localhost:9000/uploads
```

Create **Web env**:

```ini
# /etc/csir-serc/web.env
NEXT_PUBLIC_API_BASE=http://localhost:4000
```

> Replace `DATABASE_URL` user/password with a secure DB user; configure SMTP to production host when you’re ready.

***

## 7) Prepare MySQL database

```bash
sudo mysql -e "CREATE DATABASE serc_recruit CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER 'serc_user'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD';"
sudo mysql -e "GRANT ALL PRIVILEGES ON serc_recruit.* TO 'serc_user'@'localhost'; FLUSH PRIVILEGES;"
```

***

## 8) Install Node dependencies, Prisma generate/migrate/seed

```bash
sudo -u serc bash -c 'cd /opt/serc/app/src && npm install'
sudo -u serc bash -c 'cd /opt/serc/app/src && npm run prisma:generate'
sudo -u serc bash -c 'cd /opt/serc/app/src && npm run prisma:migrate -- --name init'
sudo -u serc bash -c 'cd /opt/serc/app/src && npm run seed'
```

***

## 9) **Build** the apps for production

```bash
sudo -u serc bash -c 'cd /opt/serc/app/src && npm run build'
# This runs web build and api build per monorepo scripts
```

*   **API build output** → `/opt/serc/app/src/apps/api/build/index.js`
*   **Web build output** → `/opt/serc/app/src/apps/web/.next`

***

## 10) Create **systemd services** for API & Web

### 10.1 API service

```ini
# /etc/systemd/system/csir-serc-api.service
[Unit]
Description=CSIR-SERC Recruitment API
After=network.target mysql.service
Wants=mysql.service

[Service]
User=serc
Group=serc
WorkingDirectory=/opt/serc/app/src/apps/api
EnvironmentFile=/etc/csir-serc/api.env
ExecStart=/usr/bin/node /opt/serc/app/src/apps/api/build/index.js
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
# Hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full

[Install]
WantedBy=multi-user.target
```

### 10.2 Web service

```ini
# /etc/systemd/system/csir-serc-web.service
[Unit]
Description=CSIR-SERC Recruitment Web (Next.js)
After=network.target csir-serc-api.service
Wants=csir-serc-api.service

[Service]
User=serc
Group=serc
WorkingDirectory=/opt/serc/app/src/apps/web
EnvironmentFile=/etc/csir-serc/web.env
ExecStart=/usr/bin/node /opt/serc/app/src/apps/web/node_modules/next/dist/bin/next start -p 3000
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
# Hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full

[Install]
WantedBy=multi-user.target
```

Enable & start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now csir-serc-api csir-serc-web
sudo systemctl status csir-serc-api csir-serc-web --no-pager
```

***

## 11) Nginx reverse proxy

```nginx
# /etc/nginx/sites-available/recruitment
server {
  listen 80;
  server_name yourdomain.com;

  # Proxy Next.js web
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }

  # (Optional) Proxy API under /api if you prefer a single origin
  # location /api/ {
  #   proxy_pass http://127.0.0.1:4000/;
  #   proxy_set_header Host $host;
  #   proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  # }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/recruitment /etc/nginx/sites-enabled/recruitment
sudo nginx -t
sudo systemctl reload nginx
```

Add SSL:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

***

## 12) Health check & first login

*   Web: `http://yourdomain.com` (or server IP)
*   API health: `curl http://localhost:4000/health` → `{"ok":true}`
*   MinIO: `http://SERVER_IP:9001` (console) to confirm bucket/policy
*   Login with seeded admin: `admin@serc.res.in` (password set in seed script).

***

## 13) Operational tips

*   **Logs**: `journalctl -u csir-serc-web -f`, `journalctl -u csir-serc-api -f`, `journalctl -u minio -f`
*   **Restart on code updates**:
    ```bash
    sudo -u serc bash -c 'cd /opt/serc/app/src && git pull && npm install && npm run build'
    sudo systemctl restart csir-serc-api csir-serc-web
    ```
*   **Firewall**:
    ```bash
    sudo ufw allow 80,443/tcp
    sudo ufw enable
    ```

***

## 14) Optional production refinements

*   Set **API CORS origins** → in `/etc/csir-serc/api.env` `WEB_ORIGIN=https://yourdomain.com`
*   Restrict **Next.js** to listen on `127.0.0.1` (already proxied)
*   If you don’t want MinIO public read, change code to **signed URLs** or serve via API downloads.
*   Replace MailHog with your **official SMTP** host and TLS credentials.

***

## 15) Rollback & troubleshooting

*   **Systemd** not running? `sudo systemctl status csir-serc-api csir-serc-web` for error traces.
*   **Prisma migration** errors? Ensure `DATABASE_URL` user privileges and schema exist; rerun migrate.
*   **Sharp** issues? Ensure `build-essential` installed; Node 18 is recommended for prebuilt binaries.
*   **OCR fails**? Check Tesseract is present: `tesseract --version`.

***

## GitHub push (from server, if needed)

```bash
cd /opt/serc/app/src
export GIT_REMOTE=git@github.com:YOUR_ORG/csir-serc-recruitment.git
export GIT_BRANCH=main
bash scripts/push-to-github.sh
```

***

If you’d like, I can tailor the **Nginx TLS & security headers**, add **systemd hardening** (sandboxing), or script the whole setup as a **single bash installer** for Ubuntu. Also happy to wire **OIDC/SSO** (NextAuth) and add **Azure/NIC** deployment instructions. Want me to generate those next?
