#!/bin/bash
# ============================================================
# CtxPost – Image Generation Server Setup
# Apple Silicon (M1/M2/M3/M4) optimized
# ============================================================
# Usage:
#   chmod +x setup-image-server.sh
#   ./setup-image-server.sh [comfyui|sdwebui]
#
# Default: ComfyUI (recommended for Apple Silicon)
# ============================================================

set -e

MODE="${1:-comfyui}"
INSTALL_DIR="$HOME/ai-image-server"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m'

echo ""
echo -e "${PURPLE}${BOLD}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}${BOLD}║     CtxPost – AI Image Generation Server Setup       ║${NC}"
echo -e "${PURPLE}${BOLD}║              Apple Silicon Optimized                 ║${NC}"
echo -e "${PURPLE}${BOLD}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# ── Detect hardware ──────────────────────────────────────────
CHIP=$(sysctl -n machdep.cpu.brand_string 2>/dev/null || echo "Unknown")
RAM_GB=$(( $(sysctl -n hw.memsize 2>/dev/null || echo 0) / 1024 / 1024 / 1024 ))
MY_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "DEINE_IP")
echo -e "${CYAN}Hardware: ${BOLD}${CHIP}${NC} / ${BOLD}${RAM_GB} GB RAM${NC}"

if [[ "$CHIP" == *"Apple"* ]]; then
  echo -e "${GREEN}✓ Apple Silicon erkannt – MPS-Beschleunigung wird verwendet${NC}"
else
  echo -e "${YELLOW}⚠ Nicht-Apple-Chip – CPU-Modus wird verwendet (langsamer)${NC}"
fi

echo ""

# ── Check dependencies ───────────────────────────────────────
echo -e "${CYAN}${BOLD}Prüfe Abhängigkeiten...${NC}"

if ! command -v git &>/dev/null; then
  echo -e "${RED}✗ Git nicht gefunden. Installiere: xcode-select --install${NC}"
  exit 1
fi

if ! command -v python3 &>/dev/null; then
  echo -e "${RED}✗ Python3 nicht gefunden. Installiere: brew install python${NC}"
  exit 1
fi

echo -e "${GREEN}✓ git, python3 vorhanden${NC}"
PYTHON_VER=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
echo -e "${CYAN}Python Version: ${PYTHON_VER}${NC}"

echo ""

# ═══════════════════════════════════════════════════════════════
# ComfyUI Installation
# ═══════════════════════════════════════════════════════════════
install_comfyui() {
  echo -e "${BOLD}${CYAN}📦 Installiere ComfyUI...${NC}"
  echo ""

  COMFY_DIR="$INSTALL_DIR/ComfyUI"

  if [ -d "$COMFY_DIR" ]; then
    echo -e "${YELLOW}ComfyUI existiert bereits – führe Update durch...${NC}"
    cd "$COMFY_DIR" && git pull
  else
    mkdir -p "$INSTALL_DIR"
    cd "$INSTALL_DIR"
    echo -e "Klone ComfyUI Repository..."
    git clone https://github.com/comfyanonymous/ComfyUI.git
  fi

  cd "$COMFY_DIR"

  # Virtual environment
  echo ""
  echo -e "${CYAN}Erstelle Python Virtual Environment...${NC}"
  if [ ! -d "venv" ]; then
    python3 -m venv venv
  fi

  source venv/bin/activate
  pip3 install --upgrade pip wheel setuptools --quiet

  # PyTorch for Apple Silicon
  echo ""
  echo -e "${CYAN}Installiere PyTorch (Apple MPS Unterstützung)...${NC}"
  pip3 install torch torchvision torchaudio --quiet

  # ComfyUI requirements
  echo ""
  echo -e "${CYAN}Installiere ComfyUI Abhängigkeiten...${NC}"
  pip3 install -r requirements.txt --quiet

  # Download starter model
  echo ""
  echo -e "${CYAN}${BOLD}Suche nach Modell...${NC}"
  MODEL_DIR="$COMFY_DIR/models/checkpoints"
  mkdir -p "$MODEL_DIR"

  if ls "$MODEL_DIR"/*.safetensors 1>/dev/null 2>&1 || ls "$MODEL_DIR"/*.ckpt 1>/dev/null 2>&1; then
    echo -e "${GREEN}✓ Modell(e) bereits vorhanden:${NC}"
    ls "$MODEL_DIR"/ 2>/dev/null | head -5
  else
    echo -e "${YELLOW}Kein Modell gefunden. Lade SD Turbo (kleines, schnelles Modell)...${NC}"
    echo -e "${YELLOW}(ca. 1.7 GB – dauert je nach Verbindung 2-5 Minuten)${NC}"
    curl -L --progress-bar \
      -o "$MODEL_DIR/sd-turbo.safetensors" \
      "https://huggingface.co/stabilityai/sd-turbo/resolve/main/sd_turbo.safetensors" || {
        echo -e "${YELLOW}⚠ Download fehlgeschlagen. Bitte Modell manuell installieren.${NC}"
        echo -e "Empfehlung: https://huggingface.co/runwayml/stable-diffusion-v1-5"
        echo -e "Zielordner: $MODEL_DIR/"
      }
  fi

  # Create start script
  cat > "$COMFY_DIR/start.sh" << STARTSCRIPT
#!/bin/bash
cd "\$(dirname "\$0")"
source venv/bin/activate
export PYTORCH_ENABLE_MPS_FALLBACK=1
echo ""
echo "╔═══════════════════════════════════════════════╗"
echo "║  ComfyUI wird gestartet...                    ║"
echo "║  Lokal:    http://127.0.0.1:8188              ║"
echo "║  Netzwerk: http://${MY_IP}:8188              ║"
echo "╚═══════════════════════════════════════════════╝"
echo ""
python3 main.py --listen 0.0.0.0 --port 8188 --enable-cors-header "*"
STARTSCRIPT
  chmod +x "$COMFY_DIR/start.sh"

  deactivate

  echo ""
  echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}${BOLD}║         ✅ ComfyUI erfolgreich installiert!          ║${NC}"
  echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "  ${BOLD}Installiert in:${NC} $COMFY_DIR"
  echo -e ""
  echo -e "  ${BOLD}${YELLOW}▶ Server starten:${NC}"
  echo -e "  bash $COMFY_DIR/start.sh"
  echo ""
  echo -e "  ${BOLD}URLs nach dem Start:${NC}"
  echo -e "  • Lokal:    ${CYAN}http://127.0.0.1:8188${NC}"
  echo -e "  • Netzwerk: ${CYAN}http://${MY_IP}:8188${NC}"
  echo ""
  echo -e "  ${BOLD}${PURPLE}CtxPost konfigurieren:${NC}"
  echo -e "  Settings → AI Models → Bildgenerierung"
  echo -e "  URL eingeben: ${CYAN}http://${MY_IP}:8188${NC}"
  echo -e "  Provider wählen: ${BOLD}ComfyUI${NC}"
  echo ""
}

# ═══════════════════════════════════════════════════════════════
# Stable Diffusion WebUI Installation
# ═══════════════════════════════════════════════════════════════
install_sdwebui() {
  echo -e "${BOLD}${CYAN}📦 Installiere Stable Diffusion WebUI (AUTOMATIC1111)...${NC}"
  echo ""

  SD_DIR="$INSTALL_DIR/stable-diffusion-webui"

  if [ -d "$SD_DIR" ]; then
    echo -e "${YELLOW}SD WebUI existiert bereits – führe Update durch...${NC}"
    cd "$SD_DIR" && git pull
  else
    mkdir -p "$INSTALL_DIR"
    cd "$INSTALL_DIR"
    echo -e "Klone Stable Diffusion WebUI..."
    git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui.git
  fi

  cd "$SD_DIR"

  # Create start script for macOS/Apple Silicon
  cat > "$SD_DIR/start-mac.sh" << STARTSCRIPT
#!/bin/bash
cd "\$(dirname "\$0")"
export PYTORCH_ENABLE_MPS_FALLBACK=1
export COMMANDLINE_ARGS="--listen --port 7860 --api --cors-allow-origins=* --no-half"
echo ""
echo "╔═══════════════════════════════════════════════╗"
echo "║  Stable Diffusion WebUI wird gestartet...     ║"
echo "║  Lokal:    http://127.0.0.1:7860              ║"
echo "║  Netzwerk: http://${MY_IP}:7860              ║"
echo "║                                               ║"
echo "║  Erster Start: ~5-10 Min (Downloads)          ║"
echo "╚═══════════════════════════════════════════════╝"
echo ""
bash webui.sh
STARTSCRIPT
  chmod +x "$SD_DIR/start-mac.sh"

  echo ""
  echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}${BOLD}║     ✅ SD WebUI erfolgreich vorbereitet!            ║${NC}"
  echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "  ${BOLD}Installiert in:${NC} $SD_DIR"
  echo ""
  echo -e "  ${BOLD}${YELLOW}▶ Server starten:${NC}"
  echo -e "  bash $SD_DIR/start-mac.sh"
  echo ""
  echo -e "  ${YELLOW}⚠ Hinweis:${NC} Beim ersten Start werden Abhängigkeiten"
  echo -e "  und Modelle heruntergeladen (~5-10 Minuten)"
  echo ""
  echo -e "  ${BOLD}URLs nach dem Start:${NC}"
  echo -e "  • Lokal:    ${CYAN}http://127.0.0.1:7860${NC}"
  echo -e "  • Netzwerk: ${CYAN}http://${MY_IP}:7860${NC}"
  echo ""
  echo -e "  ${BOLD}${PURPLE}CtxPost konfigurieren:${NC}"
  echo -e "  Settings → AI Models → Bildgenerierung"
  echo -e "  URL eingeben: ${CYAN}http://${MY_IP}:7860${NC}"
  echo -e "  Provider wählen: ${BOLD}Stable Diffusion WebUI${NC}"
  echo ""
}

# ── Execute ──────────────────────────────────────────────────
case "$MODE" in
  comfyui)  install_comfyui ;;
  sdwebui)  install_sdwebui ;;
  *)
    echo -e "${RED}Unbekannter Modus: $MODE${NC}"
    echo "Verwendung: $0 [comfyui|sdwebui]"
    echo ""
    echo "  comfyui  – ComfyUI installieren (empfohlen)"
    echo "  sdwebui  – Stable Diffusion WebUI installieren"
    exit 1
    ;;
esac
