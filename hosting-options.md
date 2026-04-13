# Hosting Options for 5 Grad Trivia

Budget target: under $20/month.

## Constraints

This app uses **SQLite** for the database and **local disk** for uploaded images. That means we need a hosting platform with **persistent storage** -- pure serverless (e.g. Vercel Functions, AWS Lambda) won't work without swapping to an external database and object storage.

Expected load: ~75-150 concurrent players during the party, with negligible traffic before and after.

## Recommended Options (Ranked by Ease of Deployment)

### 1. Railway -- ~$5/month (usage-based, top recommendation)

- **Deploy**: Connect a GitHub repo and push. That's it.
- **Persistent storage**: Volumes for SQLite and image uploads.
- **DX**: Excellent dashboard, logs, environment variable management.
- **Scaling**: Can handle party-scale traffic easily on the Hobby plan.
- **Link**: https://railway.app

### 2. Fly.io -- Free tier or ~$3-5/month

- **Deploy**: `fly launch` from the project directory, creates a Dockerfile-based deploy.
- **Persistent storage**: Fly Volumes for SQLite and images.
- **Scaling**: Can scale to zero when idle (saves money before/after the party).
- **Caveat**: Slightly more CLI-oriented setup than Railway.
- **Link**: https://fly.io

### 3. Render -- $7/month (Starter plan)

- **Deploy**: GitHub-connected, auto-deploys on push.
- **Persistent storage**: Persistent disks available on paid plans.
- **DX**: Clean dashboard, straightforward configuration.
- **Link**: https://render.com

### 4. DigitalOcean App Platform -- $5/month (Basic)

- **Deploy**: GitHub-connected or Docker-based.
- **Persistent storage**: Available on paid tiers.
- **Caveat**: Slightly more configuration than Railway/Render.
- **Link**: https://www.digitalocean.com/products/app-platform

### 5. VPS (DigitalOcean Droplet or Hetzner) -- $4-6/month

- **Deploy**: Docker Compose or PM2 on a small VPS.
- **Persistent storage**: Full disk access -- no restrictions.
- **Caveat**: You manage the server (updates, SSL via Caddy/nginx, process management). Most setup work but most control.
- **Hetzner**: $3.79/month for a 2-vCPU / 2GB ARM VPS -- best value.
- **DigitalOcean**: $4/month for the smallest Droplet.

## Deployment Checklist (When Ready)

1. **Environment variables**: Set `ADMIN_PASSWORD`, `NODE_ENV=production`, and any other secrets.
2. **SQLite path**: Ensure the database file is on persistent storage (not the ephemeral deploy filesystem).
3. **Image uploads path**: Same -- point to persistent storage.
4. **Build command**: `npm run build`
5. **Start command**: `npm start`
6. **Domain/SSL**: Most platforms above provide free SSL and a subdomain. Bring a custom domain if desired.
7. **Image processing**: Ensure `sharp` works in the deploy environment (it has native bindings -- Docker-based deploys handle this automatically).
8. **Backup**: Before the party, copy the SQLite file as a backup. After seeding questions and images, take a snapshot so you can reset if needed.

## Cost Summary

All options are well under the $20/month budget. For a one-time party event, the total cost will likely be under $10 even with a month of uptime. Railway and Fly.io both support tearing down the project after the party to stop billing entirely.
