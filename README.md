
# CSIR–SERC Recruitment Portal (Production Build)

Full‑stack monorepo with Next.js 14 (App Router) + MUI + TailwindCSS front‑end, Node/Express API with Prisma (MySQL), MinIO/S3 uploads, OCR (Tesseract), SMTP (Mailhog for dev), role‑based JWT, admin analytics, CSV/Excel exports, dynamic forms, and eligibility checks.

## Quick start
```bash
docker compose up -d
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
npm i
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run seed
npm run dev
```

## Push to GitHub
Use `scripts/push-to-github.sh` after setting `GIT_REMOTE` and `GIT_BRANCH`.
```
bash scripts/push-to-github.sh
```
