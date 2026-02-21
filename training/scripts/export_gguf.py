#!/usr/bin/env python3
"""
Export fine-tuned LoRA adapter to GGUF format for use with Ollama.
Merges the LoRA adapter with the base model and converts to GGUF (Q4_K_M).

Usage:
    python scripts/export_gguf.py
    python scripts/export_gguf.py --adapter-dir output/lora_adapter
    python scripts/export_gguf.py --adapter-dir output/lora_adapter --model-name my-model
"""

import argparse
import logging
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Optional

import torch

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


# ─── Constants ────────────────────────────────────────────

DEFAULT_BASE_MODEL = "Qwen/Qwen2.5-7B-Instruct"
DEFAULT_QUANTIZATION = "q4_k_m"
DEFAULT_MODEL_NAME = "social-media-marketer"


# ─── Merge ────────────────────────────────────────────────


def merge_lora_adapter(
    adapter_dir: Path,
    base_model: str,
    merged_dir: Path,
) -> Path:
    """Merge LoRA adapter weights into the base model."""
    logger.info("Loading base model: %s ...", base_model)

    try:
        from unsloth import FastLanguageModel

        logger.info("Using Unsloth for fast merging...")
        model, tokenizer = FastLanguageModel.from_pretrained(
            model_name=str(adapter_dir),
            max_seq_length=4096,
            dtype=torch.float16,
            load_in_4bit=False,
        )

        logger.info("Saving merged model to %s ...", merged_dir)
        merged_dir.mkdir(parents=True, exist_ok=True)
        model.save_pretrained_merged(
            str(merged_dir),
            tokenizer,
            save_method="merged_16bit",
        )
        logger.info("Merge complete (via Unsloth).")
        return merged_dir

    except (ImportError, Exception) as e:
        logger.info("Unsloth not available or failed (%s), using standard PEFT merge.", e)

    from transformers import AutoModelForCausalLM, AutoTokenizer
    from peft import PeftModel

    logger.info("Loading base model for merge: %s ...", base_model)
    base = AutoModelForCausalLM.from_pretrained(
        base_model,
        torch_dtype=torch.float16,
        device_map="cpu",
        trust_remote_code=True,
    )

    logger.info("Loading LoRA adapter from %s ...", adapter_dir)
    model = PeftModel.from_pretrained(base, str(adapter_dir))

    logger.info("Merging LoRA weights into base model...")
    model = model.merge_and_unload()

    logger.info("Saving merged model to %s ...", merged_dir)
    merged_dir.mkdir(parents=True, exist_ok=True)
    model.save_pretrained(str(merged_dir))

    tokenizer = AutoTokenizer.from_pretrained(str(adapter_dir))
    tokenizer.save_pretrained(str(merged_dir))

    logger.info("Merge complete.")
    return merged_dir


# ─── GGUF Conversion ─────────────────────────────────────


def find_convert_script() -> Optional[Path]:
    """Try to find the llama.cpp convert script."""
    search_paths = [
        Path.home() / "llama.cpp" / "convert_hf_to_gguf.py",
        Path("/opt/llama.cpp/convert_hf_to_gguf.py"),
        Path("./llama.cpp/convert_hf_to_gguf.py"),
    ]

    # Also check if it is on PATH
    if shutil.which("convert_hf_to_gguf.py"):
        return Path(shutil.which("convert_hf_to_gguf.py"))  # type: ignore[arg-type]

    for p in search_paths:
        if p.exists():
            return p

    return None


def convert_to_gguf(
    merged_dir: Path,
    output_dir: Path,
    model_name: str,
    quantization: str = DEFAULT_QUANTIZATION,
) -> Path:
    """Convert merged HuggingFace model to GGUF format."""
    output_dir.mkdir(parents=True, exist_ok=True)
    output_file = output_dir / f"{model_name}-{quantization}.gguf"

    logger.info("Converting to GGUF (%s quantization)...", quantization.upper())
    logger.info("Output file: %s", output_file)

    # Try Unsloth GGUF export first
    try:
        from unsloth import FastLanguageModel

        logger.info("Attempting GGUF export via Unsloth...")
        model, tokenizer = FastLanguageModel.from_pretrained(
            model_name=str(merged_dir),
            max_seq_length=4096,
            dtype=torch.float16,
            load_in_4bit=False,
        )
        model.save_pretrained_gguf(
            str(output_dir / model_name),
            tokenizer,
            quantization_method=quantization,
        )
        # Unsloth may name the file differently; find it
        gguf_files = list(output_dir.glob("*.gguf"))
        if gguf_files:
            actual = gguf_files[0]
            if actual != output_file:
                actual.rename(output_file)
            logger.info("GGUF export complete via Unsloth: %s", output_file)
            logger.info("File size: %.1f MB", output_file.stat().st_size / 1024 / 1024)
            return output_file
    except (ImportError, Exception) as e:
        logger.info("Unsloth GGUF export not available (%s), trying llama.cpp...", e)

    # Fallback: llama.cpp convert script
    convert_script = find_convert_script()
    if convert_script is None:
        logger.warning("llama.cpp convert script not found.")
        logger.warning("To convert to GGUF manually:")
        logger.warning("")
        logger.warning("  1. Clone llama.cpp:")
        logger.warning("     git clone https://github.com/ggerganov/llama.cpp ~/llama.cpp")
        logger.warning("     cd ~/llama.cpp && make")
        logger.warning("")
        logger.warning("  2. Run conversion:")
        logger.warning(
            "     python ~/llama.cpp/convert_hf_to_gguf.py %s "
            "--outfile %s --outtype %s",
            merged_dir,
            output_file,
            quantization,
        )
        return output_file

    logger.info("Using llama.cpp convert script: %s", convert_script)
    try:
        subprocess.run(
            [
                sys.executable,
                str(convert_script),
                str(merged_dir),
                "--outfile",
                str(output_file),
                "--outtype",
                quantization.replace("_", ""),
            ],
            check=True,
        )
        logger.info("GGUF export complete: %s", output_file)
        if output_file.exists():
            logger.info("File size: %.1f MB", output_file.stat().st_size / 1024 / 1024)
    except subprocess.CalledProcessError as e:
        logger.error("GGUF conversion failed: %s", e)

    return output_file


# ─── Ollama Modelfile ─────────────────────────────────────


def generate_modelfile(gguf_path: Path, model_name: str) -> Path:
    """Generate an Ollama Modelfile pointing to the GGUF file."""
    modelfile_path = gguf_path.parent / "Modelfile"

    content = f"""FROM {gguf_path.name}

PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER repeat_penalty 1.1

SYSTEM \"\"\"You are an experienced social media content creator and marketing expert.
You create engaging, authentic posts for various platforms (Facebook, LinkedIn, Instagram, Twitter/X, Threads).
You adapt your writing style based on the brand's voice, target audience, and platform requirements.
You are multilingual and can create content in German, English, French, Spanish, and Portuguese.
When asked to generate content, you always respond with well-structured JSON.\"\"\"
"""
    modelfile_path.write_text(content, encoding="utf-8")
    logger.info("Generated Modelfile at %s", modelfile_path)
    return modelfile_path


# ─── Main ─────────────────────────────────────────────────


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Export fine-tuned LoRA model to GGUF for Ollama"
    )
    parser.add_argument(
        "--adapter-dir",
        type=str,
        default="output/lora_adapter",
        help="Path to the LoRA adapter directory (default: output/lora_adapter)",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="output/gguf",
        help="Output directory for GGUF files (default: output/gguf)",
    )
    parser.add_argument(
        "--model-name",
        type=str,
        default=DEFAULT_MODEL_NAME,
        help=f"Name for the exported model (default: {DEFAULT_MODEL_NAME})",
    )
    parser.add_argument(
        "--base-model",
        type=str,
        default=DEFAULT_BASE_MODEL,
        help=f"Base model name (default: {DEFAULT_BASE_MODEL})",
    )
    parser.add_argument(
        "--quantization",
        type=str,
        default=DEFAULT_QUANTIZATION,
        help=f"GGUF quantization type (default: {DEFAULT_QUANTIZATION})",
    )
    parser.add_argument(
        "--skip-merge",
        action="store_true",
        help="Skip LoRA merge step (use if model is already merged)",
    )
    args = parser.parse_args()

    adapter_dir = Path(args.adapter_dir)
    output_dir = Path(args.output_dir)

    print("=" * 60)
    print("Social Scheduler - Export to GGUF")
    print("=" * 60)
    print(f"  Adapter dir    : {adapter_dir}")
    print(f"  Output dir     : {output_dir}")
    print(f"  Model name     : {args.model_name}")
    print(f"  Quantization   : {args.quantization.upper()}")
    print("=" * 60)

    if not adapter_dir.exists() and not args.skip_merge:
        logger.error("LoRA adapter not found at %s", adapter_dir)
        logger.error("Run 'python scripts/train_lora.py' first.")
        sys.exit(1)

    # Step 1: Merge LoRA adapter with base model
    merged_dir = output_dir.parent / "merged"
    if args.skip_merge:
        logger.info("Skipping merge step, using existing merged model at %s", merged_dir)
        if not merged_dir.exists():
            logger.error("Merged model directory not found: %s", merged_dir)
            sys.exit(1)
    else:
        merged_dir = merge_lora_adapter(adapter_dir, args.base_model, merged_dir)

    # Step 2: Convert to GGUF
    gguf_path = convert_to_gguf(
        merged_dir, output_dir, args.model_name, args.quantization
    )

    # Step 3: Generate Ollama Modelfile
    modelfile_path = generate_modelfile(gguf_path, args.model_name)

    # Step 4: Print instructions
    print()
    print("=" * 60)
    print("Export complete!")
    print("=" * 60)
    print()
    print("To create the Ollama model, run:")
    print()
    print(f"  cd {output_dir}")
    print(f"  ollama create {args.model_name} -f Modelfile")
    print()
    print("To test the model:")
    print()
    print(f"  ollama run {args.model_name}")
    print()
    print("To use in Social Scheduler:")
    print(f"  Set the model to '{args.model_name}' in your user settings.")


if __name__ == "__main__":
    main()
