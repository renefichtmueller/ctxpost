#!/bin/bash
# ═══════════════════════════════════════════════════
# CtxPost — Deploy Script (Mac → Server)
# ═══════════════════════════════════════════════════
set -e

# Set DEPLOY_SERVER env var to override, e.g.: export DEPLOY_SERVER=root@your-server-ip
SERVER="${DEPLOY_SERVER:-root@your-server-ip}"
REMOTE_DIR="/opt/apps/ctxpost"
LOCAL_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "═══════════════════════════════════════════════════"
echo "  CtxPost — Deployment"
echo "═══════════════════════════════════════════════════"

# 1. Build
echo "▸ Building..."
cd "$LOCAL_DIR"
npm run build

# 2. Sync .next/standalone/.next (compiled app code)
echo "▸ Syncing .next to server..."
rsync -avz --delete \
  .next/standalone/.next/ \
  "$SERVER:$REMOTE_DIR/.next/standalone/.next/"

# 3. Sync public assets (non-destructive to preserve uploads)
echo "▸ Syncing public assets..."
rsync -avz --exclude='uploads/' \
  public/ \
  "$SERVER:$REMOTE_DIR/.next/standalone/public/"

# 4. Fix Prisma: copy correct index.js (with both platform targets) to root node_modules
echo "▸ Fixing Prisma platform targets..."
ssh "$SERVER" "
  cp $REMOTE_DIR/.next/standalone/node_modules/.prisma/client/index.js \
     $REMOTE_DIR/node_modules/.prisma/client/index.js
  echo '  ✓ Prisma index.js updated'
"

# 5. Restart PM2
echo "▸ Restarting ctxpost..."
ssh "$SERVER" "pm2 restart ctxpost --update-env"

# 6. Health check
echo "▸ Health check..."
sleep 4
HTTP_CODE=$(ssh "$SERVER" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3002")
if [ "$HTTP_CODE" = "200" ]; then
  echo "  ✓ App läuft (HTTP $HTTP_CODE)"
else
  echo "  ✗ App antwortet mit HTTP $HTTP_CODE"
  echo "  Logs: ssh $SERVER 'pm2 logs ctxpost --lines 20 --nostream'"
fi

echo ""
echo "═══════════════════════════════════════════════════"
echo "  Deploy fertig! https://ctxpost.context-x.org"
echo "═══════════════════════════════════════════════════"
