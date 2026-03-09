#!/bin/bash
# ═══════════════════════════════════════════════════
# Autostart Setup für Social Scheduler
# Erstellt LaunchAgents für PM2 und Cloudflare Tunnel
# ═══════════════════════════════════════════════════

set -e

# Resolve paths dynamically from current user
CURRENT_USER="$(whoami)"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
NODE_BIN="${NODE_BIN:-$(command -v node | xargs dirname)}"
PM2_BIN="${PM2_BIN:-$(command -v pm2 || echo /opt/homebrew/lib/node_modules/pm2/bin/pm2)}"

echo "═══ Autostart Setup ═══"
echo ""

# 1. PM2 Autostart
echo "▸ PM2 Autostart einrichten..."
sudo env PATH="$NODE_BIN:/opt/homebrew/bin:$PATH" "$PM2_BIN" startup launchd -u "$CURRENT_USER" --hp "$HOME"
pm2 save
echo "  ✓ PM2 startet automatisch beim Login"
echo ""

# 2. Cloudflare Tunnel als Service installieren
echo "▸ Cloudflare Tunnel Service einrichten..."
if [ -f ~/.cloudflared/config.yml ]; then
    LOG_DIR="$PROJECT_DIR/logs"
    mkdir -p "$LOG_DIR"

    cat > ~/Library/LaunchAgents/com.cloudflare.tunnel.plist << PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.cloudflare.tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/cloudflared</string>
        <string>tunnel</string>
        <string>run</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>${LOG_DIR}/cloudflared-out.log</string>
    <key>StandardErrorPath</key>
    <string>${LOG_DIR}/cloudflared-err.log</string>
</dict>
</plist>
PLIST
    launchctl load ~/Library/LaunchAgents/com.cloudflare.tunnel.plist
    echo "  ✓ Cloudflare Tunnel startet automatisch"
else
    echo "  ✗ Bitte zuerst setup-tunnel.sh ausführen!"
fi

echo ""
echo "═══ Fertig! ═══"
echo "Alle Services starten automatisch beim Systemstart."
echo ""
echo "Status prüfen:"
echo "  pm2 list"
echo "  brew services list"
echo "  launchctl list | grep cloudflare"
