# ML Training Pipeline - Social Scheduler

Fine-Tuning eines lokalen LLM (Qwen2.5-7B-Instruct) fuer Social-Media-Content-Erstellung mit LoRA/QLoRA.

## Uebersicht

Diese Training-Pipeline ermoeglicht es, ein auf Social-Media-Marketing spezialisiertes Sprachmodell zu erstellen. Das fine-getunte Modell kann:

- Social-Media-Posts aus Stichworten generieren (Facebook, LinkedIn, Instagram, X/Twitter, Threads)
- Hashtags mit Kategorisierung (primary, secondary, trending, niche) erzeugen
- Content-Variationen fuer A/B-Tests erstellen
- Sentiment-Analysen von Posts durchfuehren
- Optimale Posting-Zeiten empfehlen
- Inhalte an eine Brand Voice anpassen

Das Modell wird mit QLoRA trainiert und anschliessend als GGUF-Datei fuer Ollama exportiert.

## Voraussetzungen

### Hardware

- NVIDIA GPU mit mindestens 8 GB VRAM (empfohlen: 12+ GB)
- 16 GB RAM (empfohlen: 32 GB)
- 30 GB freier Festplattenspeicher

### Software

- Python 3.10 oder hoeher
- NVIDIA CUDA Toolkit 11.8+ (fuer GPU-Training)
- Ollama (fuer den Betrieb des fertigen Modells)
- Git

### Optional

- Weights & Biases Account (fuer Experiment-Tracking)
- llama.cpp (fuer GGUF-Konvertierung, falls Unsloth nicht verfuegbar)

## Verzeichnisstruktur

```
training/
├── data/
│   ├── seed/                        # Seed-Trainingsdaten
│   │   └── social_media_examples.jsonl
│   ├── feedback/                    # Exportiertes User-Feedback
│   └── processed/                   # Verarbeitete Trainingsdaten
│       ├── train.jsonl
│       └── val.jsonl
├── scripts/
│   ├── prepare_data.py              # Datenaufbereitung
│   ├── train_lora.py                # LoRA/QLoRA Fine-Tuning
│   ├── export_gguf.py               # Export nach GGUF fuer Ollama
│   ├── evaluate.py                  # Modellevaluierung
│   └── export_feedback.py           # User-Feedback aus DB exportieren
├── configs/
│   └── training_config.yaml         # Trainings-Hyperparameter
├── output/                          # Trainings-Output (wird erstellt)
│   ├── lora_adapter/
│   ├── merged/
│   └── gguf/
├── Modelfile                        # Ollama Modelfile Template
├── requirements.txt                 # Python-Abhaengigkeiten
└── README.md                        # Diese Datei
```

## Schritt-fuer-Schritt-Anleitung

### 1. Abhaengigkeiten installieren

```bash
cd training/

# Virtuelle Umgebung erstellen (empfohlen)
python -m venv venv
source venv/bin/activate  # Linux/macOS
# oder: venv\Scripts\activate  # Windows

# Abhaengigkeiten installieren
pip install -r requirements.txt
```

Falls Unsloth Probleme macht, kann es separat installiert werden:

```bash
pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
```

### 2. Trainingsdaten vorbereiten

Die Pipeline nutzt zwei Datenquellen:

**a) Seed-Daten** (mitgeliefert in `data/seed/`):
30 handgeschriebene Beispiele in 5 Sprachen (DE/EN/FR/ES/PT) fuer 6 Aufgabentypen.

**b) User-Feedback** (optional, aus der App-Datenbank):
```bash
# Feedback aus der Datenbank exportieren
python scripts/export_feedback.py --database-url postgresql://user:pass@host/db

# Oder mit DATABASE_URL Umgebungsvariable
export DATABASE_URL=postgresql://user:pass@host:5432/social_scheduler
python scripts/export_feedback.py
```

**Daten aufbereiten:**
```bash
python scripts/prepare_data.py
```

Das Skript:
- Liest JSONL-Dateien aus `data/seed/` und `data/feedback/`
- Validiert das ChatML-Format
- Entfernt Duplikate
- Normalisiert Unicode
- Teilt in Train/Validation (90/10)
- Gibt Statistiken aus (Anzahl, Aufgabentypen, Sprachverteilung)

Output: `data/processed/train.jsonl` und `data/processed/val.jsonl`

### 3. Fine-Tuning durchfuehren

```bash
# Standard-Training mit Konfigurationsdatei
python scripts/train_lora.py

# Mit eigener Konfiguration
python scripts/train_lora.py --config configs/training_config.yaml

# Mit Weights & Biases Logging
python scripts/train_lora.py --wandb-project social-scheduler

# Alle Optionen anzeigen
python scripts/train_lora.py --help
```

Das Training verwendet:
- **Basismodell**: Qwen/Qwen2.5-7B-Instruct
- **Methode**: QLoRA (4-bit Quantisierung + LoRA Adapter)
- **Optimierung**: Unsloth fuer 2-5x Beschleunigung (Fallback auf Standard-PEFT)
- **VRAM-Verbrauch**: ca. 6-8 GB

Output: `output/lora_adapter/`

### 4. Nach GGUF exportieren

```bash
# Standard-Export
python scripts/export_gguf.py

# Mit eigenen Parametern
python scripts/export_gguf.py \
  --adapter-dir output/lora_adapter \
  --output-dir output/gguf \
  --model-name social-media-marketer \
  --quantization q4_k_m
```

Das Skript:
1. Merged den LoRA-Adapter mit dem Basismodell
2. Konvertiert nach GGUF (Q4_K_M Quantisierung)
3. Erstellt ein Ollama Modelfile

Output: `output/gguf/social-media-marketer-q4_k_m.gguf`

### 5. Ollama-Modell erstellen

```bash
# In das GGUF-Verzeichnis wechseln
cd output/gguf/

# Modell in Ollama registrieren
ollama create social-media-marketer -f Modelfile

# Oder das Template-Modelfile im training/-Verzeichnis nutzen
cd ../../
ollama create social-media-marketer -f Modelfile
```

### 6. Testen und evaluieren

```bash
# Interaktiv testen
ollama run social-media-marketer

# Automatische Evaluierung mit eingebauten Testfaellen
python scripts/evaluate.py --model-path social-media-marketer

# Mit eigenen Testfaellen
python scripts/evaluate.py \
  --model-path social-media-marketer \
  --test-file meine_tests.jsonl
```

Die Evaluierung prueft:
- JSON-Format-Konformitaet
- Sprachkonsistenz (antwortet das Modell in der richtigen Sprache?)
- Antwortlaenge
- Vorhandensein erwarteter JSON-Schluessel
- Generiert einen Qualitaetsbericht

### 7. Integration mit Social Scheduler

Nach erfolgreicher Erstellung des Ollama-Modells:

1. In der App unter Einstellungen das Modell auf `social-media-marketer` setzen
2. Sicherstellen, dass die Ollama-URL korrekt konfiguriert ist
3. Das Modell ist sofort einsatzbereit fuer alle AI-Funktionen

## Kontinuierliche Verbesserung mit User-Feedback

Der empfohlene Workflow fuer kontinuierliche Modellverbesserung:

```
1. Modell im Einsatz (Social Scheduler App)
        |
2. User gibt Feedback (Daumen hoch/runter, Bearbeitungen)
        |
3. Feedback exportieren:
   python scripts/export_feedback.py
        |
4. Daten aufbereiten:
   python scripts/prepare_data.py
        |
5. Modell nachtrainieren:
   python scripts/train_lora.py
        |
6. Exportieren und deployen:
   python scripts/export_gguf.py
   ollama create social-media-marketer -f Modelfile
        |
   Zurueck zu 1.
```

Besonders wertvoll sind **bearbeitete** Outputs (Rating: EDITED), da sie sowohl den urspruenglichen als auch den verbesserten Text enthalten.

## Fehlerbehebung

### VRAM-Probleme (Out of Memory)

Falls der GPU-Speicher nicht ausreicht:

```yaml
# In configs/training_config.yaml anpassen:
training:
  batch_size: 1                    # Von 2 auf 1 reduzieren
  gradient_accumulation_steps: 8   # Von 4 auf 8 erhoehen

model:
  max_seq_length: 2048             # Von 4096 auf 2048 reduzieren

lora:
  rank: 8                          # Von 16 auf 8 reduzieren
```

### CUDA-Fehler

```bash
# CUDA-Version pruefen
nvidia-smi
nvcc --version

# PyTorch mit korrekter CUDA-Version installieren
pip install torch --index-url https://download.pytorch.org/whl/cu118  # fuer CUDA 11.8
pip install torch --index-url https://download.pytorch.org/whl/cu121  # fuer CUDA 12.1
```

### bitsandbytes-Fehler unter macOS

bitsandbytes benoetigt eine NVIDIA GPU und funktioniert nicht auf Apple Silicon. Fuer Mac-Nutzer:

```bash
# Training auf einem Server/Cloud mit NVIDIA GPU durchfuehren
# Oder CPU-basiertes Training (sehr langsam, nicht empfohlen):
# In der Config: quantization: "none" setzen
```

### Unsloth-Installationsprobleme

```bash
# Falls pip install fehlschlaegt:
pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"

# Wenn Unsloth nicht verfuegbar ist, faellt das Training-Skript
# automatisch auf Standard-HuggingFace + PEFT zurueck.
```

### Ollama-Verbindungsprobleme

```bash
# Pruefen ob Ollama laeuft
ollama list

# Ollama starten
ollama serve

# Modell testen
curl http://localhost:11434/api/generate -d '{
  "model": "social-media-marketer",
  "prompt": "Erstelle einen LinkedIn-Post ueber KI.",
  "stream": false
}'
```

## Konfigurationsreferenz

Alle Trainingsparameter sind in `configs/training_config.yaml` definiert:

| Parameter | Standard | Beschreibung |
|-----------|----------|-------------|
| `model.base_model` | Qwen/Qwen2.5-7B-Instruct | Basis-Sprachmodell |
| `model.quantization` | 4bit | Quantisierung (4bit oder none) |
| `model.max_seq_length` | 4096 | Maximale Sequenzlaenge |
| `lora.rank` | 16 | LoRA-Rang (hoeher = mehr Kapazitaet) |
| `lora.alpha` | 16 | LoRA-Skalierungsfaktor |
| `lora.dropout` | 0 | Dropout-Rate |
| `training.epochs` | 3 | Anzahl Trainingsepochen |
| `training.batch_size` | 2 | Batch-Groesse pro GPU |
| `training.learning_rate` | 2e-4 | Lernrate |
| `training.lr_scheduler` | cosine | Lernraten-Scheduler |
| `data.train_split` | 0.9 | Anteil Trainingsdaten |
| `data.max_samples` | 0 | Maximale Beispiele (0 = alle) |
