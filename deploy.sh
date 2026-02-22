#!/bin/bash
# ═══════════════════════════════════════════════════
# Social Scheduler - Deployment Script
# Run this on the Mac Studio server
# ═══════════════════════════════════════════════════

set -e

PROJECT_DIR="/Users/renefichtmueller/Desktop/Claude Code/social-scheduler"
export PATH="/opt/homebrew/opt/postgresql@17/bin:/opt/homebrew/bin:$PATH"

echo "═══════════════════════════════════════════════════"
echo "  Social Scheduler - Deployment"
echo "═══════════════════════════════════════════════════"
echo ""

# 1. Ensure PostgreSQL is running
echo "▸ Checking PostgreSQL..."
if brew services list | grep -q "postgresql@17.*started"; then
    echo "  ✓ PostgreSQL is running"
else
    echo "  Starting PostgreSQL..."
    brew services start postgresql@17
    sleep 2
fi

# 2. Ensure database exists
echo "▸ Checking database..."
if psql -lqt | cut -d \| -f 1 | grep -qw social_scheduler; then
    echo "  ✓ Database social_scheduler exists"
else
    echo "  Creating database..."
    createdb social_scheduler
fi

# 3. Install dependencies if needed
echo "▸ Checking dependencies..."
cd "$PROJECT_DIR"
if [ ! -d "node_modules" ]; then
    echo "  Installing dependencies..."
    npm install
fi

# 4. Generate Prisma client & sync schema
echo "▸ Syncing database schema..."
npx prisma generate
npx prisma db push --skip-generate

# 5. Build Next.js
echo "▸ Building application..."
NODE_ENV=production npx next build

# 6. Copy static assets to standalone
echo "▸ Preparing standalone..."
cp -r .next/static .next/standalone/.next/static
# Use cp -r public/. (trailing dot) to merge contents into standalone/public/
# without creating a nested public/public/ directory
# This preserves runtime-generated files (uploaded images, etc.)
cp -r public/. .next/standalone/public/

# 7. Restart PM2
echo "▸ Restarting application..."
if pm2 list | grep -q "social-scheduler"; then
    pm2 restart social-scheduler
else
    pm2 start ecosystem.config.cjs
fi
pm2 save

# 8. Check nginx
echo "▸ Checking nginx..."
if brew services list | grep -q "nginx.*started"; then
    nginx -t && nginx -s reload
    echo "  ✓ Nginx reloaded"
else
    brew services start nginx
    echo "  ✓ Nginx started"
fi

# 9. Health check
echo ""
echo "▸ Health check..."
sleep 2
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$HTTP_CODE" = "200" ]; then
    echo "  ✓ App is responding (HTTP $HTTP_CODE)"
else
    echo "  ✗ App returned HTTP $HTTP_CODE"
    echo "  Check logs: pm2 logs social-scheduler"
fi

echo ""
echo "═══════════════════════════════════════════════════"
echo "  Deployment complete!"
echo "  Local:  http://localhost:3000"
echo "  Nginx:  http://localhost:8080"
echo ""
echo "  To setup Cloudflare Tunnel:"
echo "  1. cloudflared tunnel login"
echo "  2. cloudflared tunnel create social-scheduler"
echo "  3. cloudflared tunnel route dns social-scheduler scheduler.fichtmueller.org"
echo "  4. Copy tunnel ID and run:"
echo "     cloudflared tunnel --url http://localhost:8080 run social-scheduler"
echo "═══════════════════════════════════════════════════"
