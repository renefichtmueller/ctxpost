#!/bin/bash
# ═══════════════════════════════════════════════════
# Autostart Setup für Social Scheduler
# Erstellt LaunchAgents für PM2 und Cloudflare Tunnel
# ═══════════════════════════════════════════════════

set -e

echo "═══ Autostart Setup ═══"
echo ""

# 1. PM2 Autostart
echo "▸ PM2 Autostart einrichten..."
sudo env PATH=$PATH:/opt/homebrew/Cellar/node/25.6.1/bin /opt/homebrew/lib/node_modules/pm2/bin/pm2 startup launchd -u renefichtmueller --hp /Users/renefichtmueller
pm2 save
echo "  ✓ PM2 startet automatisch beim Login"
echo ""

# 2. Cloudflare Tunnel als Service installieren
echo "▸ Cloudflare Tunnel Service einrichten..."
if [ -f ~/.cloudflared/config.yml ]; then
    # Create LaunchAgent for cloudflared
    cat > ~/Library/LaunchAgents/com.cloudflare.tunnel.plist << 'PLIST'
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
    <string>/Users/renefichtmueller/Desktop/Claude Code/social-scheduler/logs/cloudflared-out.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/renefichtmueller/Desktop/Claude Code/social-scheduler/logs/cloudflared-err.log</string>
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
