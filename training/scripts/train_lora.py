#!/usr/bin/env python3
"""
LoRA / QLoRA Fine-Tuning Script for Social Scheduler.
Uses Unsloth + PEFT for efficient QLoRA fine-tuning of Qwen2.5-7B-Instruct
on social media content creation tasks.

Usage:
    python scripts/train_lora.py
    python scripts/train_lora.py --config configs/training_config.yaml
    python scripts/train_lora.py --wandb-project social-scheduler
"""

import argparse
import json
import logging
import sys
from pathlib import Path
from typing import Any

import torch
import yaml
from datasets import load_dataset, Dataset
from trl import SFTTrainer

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


# ─── Config ───────────────────────────────────────────────


def load_config(config_path: str) -> dict[str, Any]:
    """Load training configuration from YAML file."""
    path = Path(config_path)
    if not path.exists():
        logger.error("Config file not found: %s", config_path)
        sys.exit(1)
    with open(path, encoding="utf-8") as f:
        return yaml.safe_load(f)


# ─── Data Formatting ─────────────────────────────────────


def format_chatml(example: dict[str, Any]) -> str:
    """Format a training example as a ChatML string for tokenization."""
    messages = example.get("messages", [])
    formatted = ""
    for msg in messages:
        role = msg["role"]
        content = msg["content"]
        formatted += f"<|im_start|>{role}\n{content}<|im_end|>\n"
    return formatted


# ─── Main ─────────────────────────────────────────────────


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Fine-tune Qwen2.5 with QLoRA for social media content"
    )
    parser.add_argument(
        "--config",
        type=str,
        default="configs/training_config.yaml",
        help="Path to training config YAML (default: configs/training_config.yaml)",
    )
    parser.add_argument(
        "--data-dir",
        type=str,
        default="data/processed",
        help="Directory with train.jsonl and val.jsonl (default: data/processed)",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default=None,
        help="Override output directory from config",
    )
    parser.add_argument(
        "--wandb-project",
        type=str,
        default=None,
        help="Weights & Biases project name (enables W&B logging)",
    )
    args = parser.parse_args()

    config = load_config(args.config)
    model_cfg = config["model"]
    lora_cfg = config["lora"]
    train_cfg = config["training"]
    data_cfg = config.get("data", {})
    output_cfg = config["output"]

    output_dir = args.output_dir or output_cfg["output_dir"]
    data_dir = Path(args.data_dir)

    print("=" * 60)
    print("Social Scheduler - LoRA Fine-Tuning")
    print("=" * 60)
    print(f"  Base model     : {model_cfg['base_model']}")
    print(f"  Quantization   : {model_cfg.get('quantization', '4bit')}")
    print(f"  Max seq length : {model_cfg.get('max_seq_length', 4096)}")
    print(f"  LoRA rank      : {lora_cfg['rank']}")
    print(f"  LoRA alpha     : {lora_cfg['alpha']}")
    print(f"  Epochs         : {train_cfg['epochs']}")
    print(f"  Batch size     : {train_cfg['batch_size']}")
    print(f"  Learning rate  : {train_cfg['learning_rate']}")
    print(f"  Output dir     : {output_dir}")
    print("=" * 60)

    # ── GPU Check ─────────────────────────────────────────
    if torch.cuda.is_available():
        gpu_name = torch.cuda.get_device_name(0)
        gpu_mem = torch.cuda.get_device_properties(0).total_mem / 1024**3
        print(f"GPU: {gpu_name} ({gpu_mem:.1f} GB VRAM)")
    elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        print("GPU: Apple Silicon (MPS)")
    else:
        print("WARNING: No GPU detected. Training will be extremely slow.")
        print("Consider using a machine with an NVIDIA GPU (8+ GB VRAM).")

    # ── Load model with Unsloth ───────────────────────────
    max_seq_length = model_cfg.get("max_seq_length", 4096)
    use_4bit = model_cfg.get("quantization", "4bit") == "4bit"

    try:
        from unsloth import FastLanguageModel

        logger.info("Loading model with Unsloth (fast mode)...")
        model, tokenizer = FastLanguageModel.from_pretrained(
            model_name=model_cfg["base_model"],
            max_seq_length=max_seq_length,
            dtype=None,  # auto-detect
            load_in_4bit=use_4bit,
        )

        # Apply LoRA adapters via Unsloth
        logger.info("Applying LoRA adapters...")
        model = FastLanguageModel.get_peft_model(
            model,
            r=lora_cfg["rank"],
            lora_alpha=lora_cfg["alpha"],
            lora_dropout=lora_cfg.get("dropout", 0),
            target_modules=lora_cfg["target_modules"],
            bias="none",
            use_gradient_checkpointing="unsloth",
            random_state=42,
        )
        using_unsloth = True

    except ImportError:
        logger.warning("Unsloth not installed. Falling back to standard HuggingFace + PEFT.")
        logger.warning("Install Unsloth for 2-5x faster training: pip install unsloth")

        from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
        from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training

        # Quantization config
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=use_4bit,
            bnb_4bit_compute_dtype=torch.bfloat16,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_use_double_quant=True,
        )

        logger.info("Loading tokenizer...")
        tokenizer = AutoTokenizer.from_pretrained(
            model_cfg["base_model"],
            trust_remote_code=True,
        )
        tokenizer.pad_token = tokenizer.eos_token
        tokenizer.padding_side = "right"

        logger.info("Loading model with 4-bit quantization...")
        model = AutoModelForCausalLM.from_pretrained(
            model_cfg["base_model"],
            quantization_config=bnb_config,
            device_map="auto",
            trust_remote_code=True,
            torch_dtype=torch.bfloat16,
        )
        model = prepare_model_for_kbit_training(model)

        peft_config = LoraConfig(
            r=lora_cfg["rank"],
            lora_alpha=lora_cfg["alpha"],
            lora_dropout=lora_cfg.get("dropout", 0),
            target_modules=lora_cfg["target_modules"],
            bias="none",
            task_type="CAUSAL_LM",
        )
        model = get_peft_model(model, peft_config)
        using_unsloth = False

    # Print parameter counts
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total = sum(p.numel() for p in model.parameters())
    print(f"\nTrainable parameters: {trainable:,} / {total:,} ({100 * trainable / total:.2f}%)")

    # ── Load dataset ──────────────────────────────────────
    train_path = data_dir / "train.jsonl"
    val_path = data_dir / "val.jsonl"

    if not train_path.exists():
        logger.error("Training data not found at %s", train_path)
        logger.error("Run 'python scripts/prepare_data.py' first.")
        sys.exit(1)

    logger.info("Loading dataset from %s ...", data_dir)
    data_files: dict[str, str] = {"train": str(train_path)}
    if val_path.exists():
        data_files["test"] = str(val_path)

    dataset = load_dataset("json", data_files=data_files)

    # Apply max_samples limit if configured
    max_samples = data_cfg.get("max_samples", 0)
    if max_samples and max_samples > 0:
        if len(dataset["train"]) > max_samples:
            dataset["train"] = dataset["train"].select(range(max_samples))
            logger.info("Limited training data to %d samples", max_samples)

    print(f"Train examples : {len(dataset['train'])}")
    if "test" in dataset:
        print(f"Val examples   : {len(dataset['test'])}")

    # ── Formatting function ───────────────────────────────
    def formatting_func(example: dict[str, Any]) -> str:
        return format_chatml(example)

    # ── W&B setup ─────────────────────────────────────────
    report_to = "none"
    if args.wandb_project:
        try:
            import wandb

            wandb.init(project=args.wandb_project, config=config)
            report_to = "wandb"
            logger.info("Weights & Biases logging enabled: %s", args.wandb_project)
        except ImportError:
            logger.warning("wandb not installed. Skipping W&B logging.")

    # ── Training arguments ────────────────────────────────
    from transformers import TrainingArguments

    training_args = TrainingArguments(
        output_dir=output_dir,
        num_train_epochs=train_cfg["epochs"],
        per_device_train_batch_size=train_cfg["batch_size"],
        gradient_accumulation_steps=train_cfg["gradient_accumulation_steps"],
        learning_rate=train_cfg["learning_rate"],
        warmup_ratio=train_cfg["warmup_ratio"],
        weight_decay=train_cfg["weight_decay"],
        lr_scheduler_type=train_cfg.get("lr_scheduler", "cosine"),
        max_grad_norm=train_cfg.get("max_grad_norm", 0.3),
        fp16=not torch.cuda.is_bf16_supported() if torch.cuda.is_available() else False,
        bf16=torch.cuda.is_bf16_supported() if torch.cuda.is_available() else False,
        gradient_checkpointing=True,
        optim="paged_adamw_8bit",
        logging_steps=output_cfg.get("logging_steps", 10),
        save_steps=output_cfg.get("save_steps", 100),
        eval_strategy="steps" if "test" in dataset else "no",
        eval_steps=50 if "test" in dataset else None,
        save_total_limit=3,
        seed=42,
        report_to=report_to,
    )

    # ── Trainer ───────────────────────────────────────────
    trainer = SFTTrainer(
        model=model,
        args=training_args,
        train_dataset=dataset["train"],
        eval_dataset=dataset.get("test"),
        tokenizer=tokenizer,
        formatting_func=formatting_func,
        max_seq_length=max_seq_length,
        packing=False,
    )

    # ── Train ─────────────────────────────────────────────
    print("\nStarting training...")
    print("-" * 60)
    trainer_stats = trainer.train()

    # ── Save adapter ──────────────────────────────────────
    adapter_dir = Path(output_dir) / "lora_adapter"
    adapter_dir.mkdir(parents=True, exist_ok=True)

    logger.info("Saving LoRA adapter to %s ...", adapter_dir)
    model.save_pretrained(str(adapter_dir))
    tokenizer.save_pretrained(str(adapter_dir))

    # Save training metrics
    metrics_path = Path(output_dir) / "training_metrics.json"
    metrics = {
        "train_loss": trainer_stats.training_loss,
        "train_runtime_sec": trainer_stats.metrics.get("train_runtime", 0),
        "train_samples_per_second": trainer_stats.metrics.get(
            "train_samples_per_second", 0
        ),
        "total_steps": trainer_stats.global_step,
        "epochs": train_cfg["epochs"],
        "trainable_params": trainable,
        "total_params": total,
    }
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    print()
    print("=" * 60)
    print("Training complete!")
    print(f"  Final loss       : {trainer_stats.training_loss:.4f}")
    print(f"  Total steps      : {trainer_stats.global_step}")
    print(f"  LoRA adapter     : {adapter_dir}")
    print(f"  Training metrics : {metrics_path}")
    print()
    print("Next steps:")
    print("  1. python scripts/evaluate.py --model-path output/lora_adapter")
    print("  2. python scripts/export_gguf.py --adapter-dir output/lora_adapter")


if __name__ == "__main__":
    main()
