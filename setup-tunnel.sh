#!/bin/bash
# ═══════════════════════════════════════════════════
# Social Scheduler - Cloudflare Tunnel Setup
# ═══════════════════════════════════════════════════
#
# Dieses Skript richtet einen permanenten Cloudflare
# Tunnel für sheduler.fichtmueller.org ein.
#
# Voraussetzung: Du musst bei Cloudflare eingeloggt
# sein und die Domain dort verwalten.
# ═══════════════════════════════════════════════════

set -e

TUNNEL_NAME="social-scheduler"
DOMAIN="sheduler.fichtmueller.org"
LOCAL_URL="http://localhost:8080"

echo ""
echo "═══════════════════════════════════════════════════"
echo "  Cloudflare Tunnel Setup für $DOMAIN"
echo "═══════════════════════════════════════════════════"
echo ""

# Step 1: Login
echo "▸ Schritt 1: Cloudflare Login"
echo "  Ein Browser-Fenster öffnet sich..."
cloudflared tunnel login
echo "  ✓ Login erfolgreich"
echo ""

# Step 2: Create tunnel
echo "▸ Schritt 2: Tunnel erstellen"
if cloudflared tunnel list | grep -q "$TUNNEL_NAME"; then
    echo "  Tunnel '$TUNNEL_NAME' existiert bereits"
    TUNNEL_ID=$(cloudflared tunnel list | grep "$TUNNEL_NAME" | awk '{print $1}')
else
    cloudflared tunnel create "$TUNNEL_NAME"
    TUNNEL_ID=$(cloudflared tunnel list | grep "$TUNNEL_NAME" | awk '{print $1}')
fi
echo "  ✓ Tunnel ID: $TUNNEL_ID"
echo ""

# Step 3: Configure tunnel
echo "▸ Schritt 3: Tunnel konfigurieren"
mkdir -p ~/.cloudflared
cat > ~/.cloudflared/config.yml << EOF
tunnel: $TUNNEL_ID
credentials-file: /Users/renefichtmueller/.cloudflared/$TUNNEL_ID.json

ingress:
  - hostname: $DOMAIN
    service: $LOCAL_URL
    originRequest:
      noTLSVerify: true
  - service: http_status:404
EOF
echo "  ✓ Config geschrieben: ~/.cloudflared/config.yml"
echo ""

# Step 4: Route DNS
echo "▸ Schritt 4: DNS Route einrichten"
echo "  WICHTIG: Falls du einen bestehenden A-Record für $DOMAIN hast,"
echo "  lösche diesen zuerst im Cloudflare Dashboard!"
echo ""
read -p "  DNS Route jetzt erstellen? (j/n): " CONFIRM
if [ "$CONFIRM" = "j" ] || [ "$CONFIRM" = "J" ]; then
    cloudflared tunnel route dns "$TUNNEL_NAME" "$DOMAIN" || echo "  (Route existiert möglicherweise bereits)"
    echo "  ✓ DNS Route erstellt"
fi
echo ""

# Step 5: Test tunnel
echo "▸ Schritt 5: Tunnel testen (Strg+C zum Beenden)"
echo "  Tunnel läuft... Prüfe https://$DOMAIN im Browser"
cloudflared tunnel run "$TUNNEL_NAME"
