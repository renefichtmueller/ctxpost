#!/usr/bin/env python3
"""
Data preparation script for Social Scheduler fine-tuning.
Reads JSONL files from data/seed/ and data/feedback/, validates ChatML format,
splits into train/validation sets, and outputs processed data.

Usage:
    python scripts/prepare_data.py
    python scripts/prepare_data.py --seed-dir data/seed --feedback-dir data/feedback
"""

import argparse
import hashlib
import json
import logging
import re
import sys
import unicodedata
from collections import Counter
from pathlib import Path
from typing import Any

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

# ─── Constants ────────────────────────────────────────────

VALID_ROLES = {"system", "user", "assistant"}

TASK_TYPE_KEYWORDS: dict[str, list[str]] = {
    "post_generation": ["social media post", "create a.*post", "keywords.*topic"],
    "hashtag_generation": ["hashtag", "generate hashtags", "hashtag expert"],
    "content_variations": ["variation", "A/B testing", "variant"],
    "sentiment_analysis": ["sentiment", "analyze.*sentiment", "engagement potential"],
    "best_times": ["posting times", "best time", "optimal.*time"],
    "brand_voice": ["brand voice", "brand style", "adapt.*brand"],
}

LANGUAGE_PATTERNS: dict[str, list[str]] = {
    "de": [r"\b(und|der|die|das|ist|fuer|mit|ein|eine|nicht|wir|auf)\b"],
    "en": [r"\b(the|and|is|for|with|that|this|are|was|not|you|your)\b"],
    "fr": [r"\b(les|des|une|est|pour|dans|qui|par|sur|avec|nous|vous)\b"],
    "es": [r"\b(los|las|una|por|para|con|del|que|como|mas|nuestro)\b"],
    "pt": [r"\b(uma|dos|das|para|com|por|nos|seu|nossa|mais|como)\b"],
}


# ─── Helpers ──────────────────────────────────────────────


def normalize_text(text: str) -> str:
    """Apply Unicode NFC normalization and clean whitespace."""
    text = unicodedata.normalize("NFC", text)
    # Collapse multiple whitespace (but preserve newlines structure)
    text = re.sub(r"[^\S\n]+", " ", text)
    # Collapse 3+ consecutive newlines into 2
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def detect_language(text: str) -> str:
    """Heuristic language detection based on word frequency."""
    text_lower = text.lower()
    scores: dict[str, int] = {}
    for lang, patterns in LANGUAGE_PATTERNS.items():
        count = 0
        for pattern in patterns:
            count += len(re.findall(pattern, text_lower))
        scores[lang] = count
    if not scores or max(scores.values()) == 0:
        return "unknown"
    return max(scores, key=lambda k: scores[k])


def detect_task_type(messages: list[dict[str, str]]) -> str:
    """Detect the task type from the system/user message content."""
    combined = " ".join(
        m.get("content", "") for m in messages if m["role"] in ("system", "user")
    ).lower()
    for task_type, keywords in TASK_TYPE_KEYWORDS.items():
        for kw in keywords:
            if re.search(kw, combined, re.IGNORECASE):
                return task_type
    return "unknown"


def content_hash(messages: list[dict[str, str]]) -> str:
    """Create a deduplication hash from user + assistant content."""
    parts = []
    for m in messages:
        if m["role"] in ("user", "assistant"):
            parts.append(m["content"].strip())
    return hashlib.sha256("|".join(parts).encode("utf-8")).hexdigest()[:16]


# ─── Validation ───────────────────────────────────────────


def validate_chatml(example: dict[str, Any], index: int, source: str) -> list[str]:
    """Validate a single ChatML example. Returns list of errors."""
    errors: list[str] = []

    if "messages" not in example:
        errors.append(f"[{source}:{index}] Missing 'messages' key")
        return errors

    messages = example["messages"]
    if not isinstance(messages, list):
        errors.append(f"[{source}:{index}] 'messages' is not a list")
        return errors

    if len(messages) < 2:
        errors.append(f"[{source}:{index}] Too few messages ({len(messages)}), need at least 2")
        return errors

    for i, msg in enumerate(messages):
        if not isinstance(msg, dict):
            errors.append(f"[{source}:{index}] Message {i} is not a dict")
            continue
        if "role" not in msg:
            errors.append(f"[{source}:{index}] Message {i} missing 'role'")
        elif msg["role"] not in VALID_ROLES:
            errors.append(f"[{source}:{index}] Message {i} invalid role: {msg['role']}")
        if "content" not in msg:
            errors.append(f"[{source}:{index}] Message {i} missing 'content'")
        elif not isinstance(msg["content"], str) or len(msg["content"].strip()) == 0:
            errors.append(f"[{source}:{index}] Message {i} has empty content")

    # Check that there is at least one assistant message
    has_assistant = any(m.get("role") == "assistant" for m in messages)
    if not has_assistant:
        errors.append(f"[{source}:{index}] No assistant message found")

    # Check assistant response minimum length
    for m in messages:
        if m.get("role") == "assistant" and len(m.get("content", "")) < 20:
            errors.append(
                f"[{source}:{index}] Assistant response too short "
                f"({len(m.get('content', ''))} chars)"
            )

    return errors


# ─── Loading ──────────────────────────────────────────────


def load_jsonl_dir(directory: Path, label: str) -> list[dict[str, Any]]:
    """Load all JSONL files from a directory."""
    examples: list[dict[str, Any]] = []
    if not directory.exists():
        logger.warning("Directory not found: %s", directory)
        return examples

    jsonl_files = sorted(directory.glob("*.jsonl"))
    if not jsonl_files:
        logger.info("No JSONL files found in %s", directory)
        return examples

    for filepath in jsonl_files:
        file_count = 0
        with open(filepath, encoding="utf-8") as f:
            for line_num, line in enumerate(f, start=1):
                line = line.strip()
                if not line:
                    continue
                try:
                    data = json.loads(line)
                    errors = validate_chatml(data, line_num, filepath.name)
                    if errors:
                        for err in errors:
                            logger.warning("Validation error: %s", err)
                        continue

                    # Normalize text in all messages
                    for msg in data["messages"]:
                        msg["content"] = normalize_text(msg["content"])

                    examples.append(data)
                    file_count += 1
                except json.JSONDecodeError as e:
                    logger.warning(
                        "JSON parse error in %s line %d: %s",
                        filepath.name,
                        line_num,
                        e,
                    )

        logger.info("  Loaded %d examples from %s", file_count, filepath.name)

    logger.info("Total from %s: %d examples", label, len(examples))
    return examples


# ─── Processing ───────────────────────────────────────────


def deduplicate(examples: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Remove duplicate examples based on content hash."""
    seen: set[str] = set()
    unique: list[dict[str, Any]] = []

    for ex in examples:
        h = content_hash(ex["messages"])
        if h not in seen:
            seen.add(h)
            unique.append(ex)

    removed = len(examples) - len(unique)
    if removed > 0:
        logger.info("Removed %d duplicates", removed)
    return unique


def split_data(
    examples: list[dict[str, Any]], train_ratio: float = 0.9, seed: int = 42
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Split data into train and validation sets deterministically."""
    import random

    rng = random.Random(seed)
    shuffled = list(examples)
    rng.shuffle(shuffled)
    split_idx = max(1, int(len(shuffled) * train_ratio))
    return shuffled[:split_idx], shuffled[split_idx:]


def compute_statistics(examples: list[dict[str, Any]]) -> dict[str, Any]:
    """Compute statistics about the dataset."""
    task_counter: Counter[str] = Counter()
    lang_counter: Counter[str] = Counter()

    for ex in examples:
        messages = ex["messages"]
        task_type = detect_task_type(messages)
        task_counter[task_type] += 1

        # Detect language from assistant response
        assistant_text = ""
        for m in messages:
            if m["role"] == "assistant":
                assistant_text = m["content"]
                break
        lang = detect_language(assistant_text)
        lang_counter[lang] += 1

    return {
        "total": len(examples),
        "task_types": dict(task_counter.most_common()),
        "languages": dict(lang_counter.most_common()),
    }


# ─── Main ─────────────────────────────────────────────────


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Prepare training data for Social Scheduler fine-tuning"
    )
    parser.add_argument(
        "--seed-dir",
        type=str,
        default="data/seed",
        help="Directory with seed JSONL files (default: data/seed)",
    )
    parser.add_argument(
        "--feedback-dir",
        type=str,
        default="data/feedback",
        help="Directory with feedback JSONL files (default: data/feedback)",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="data/processed",
        help="Output directory for processed data (default: data/processed)",
    )
    parser.add_argument(
        "--train-split",
        type=float,
        default=0.9,
        help="Train split ratio (default: 0.9)",
    )
    args = parser.parse_args()

    seed_dir = Path(args.seed_dir)
    feedback_dir = Path(args.feedback_dir)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 60)
    print("Social Scheduler - Training Data Preparation")
    print("=" * 60)

    # ── Load data ─────────────────────────────────────────
    all_examples: list[dict[str, Any]] = []

    logger.info("Loading seed data from %s ...", seed_dir)
    seed_data = load_jsonl_dir(seed_dir, "seed")
    all_examples.extend(seed_data)

    logger.info("Loading feedback data from %s ...", feedback_dir)
    feedback_data = load_jsonl_dir(feedback_dir, "feedback")
    all_examples.extend(feedback_data)

    if not all_examples:
        logger.error("No valid training examples found!")
        logger.info("Add JSONL files to %s or %s", seed_dir, feedback_dir)
        sys.exit(1)

    # ── Deduplicate ───────────────────────────────────────
    all_examples = deduplicate(all_examples)

    # ── Split ─────────────────────────────────────────────
    train_data, val_data = split_data(all_examples, train_ratio=args.train_split)

    # ── Statistics ────────────────────────────────────────
    stats = compute_statistics(all_examples)

    print()
    print(f"Total valid examples : {stats['total']}")
    print(f"  Train set          : {len(train_data)}")
    print(f"  Validation set     : {len(val_data)}")
    print()
    print("Per-task counts:")
    for task, count in stats["task_types"].items():
        print(f"  {task:25s} : {count}")
    print()
    print("Language distribution:")
    for lang, count in stats["languages"].items():
        print(f"  {lang:25s} : {count}")

    # ── Save ──────────────────────────────────────────────
    train_path = output_dir / "train.jsonl"
    val_path = output_dir / "val.jsonl"

    with open(train_path, "w", encoding="utf-8") as f:
        for ex in train_data:
            f.write(json.dumps(ex, ensure_ascii=False) + "\n")

    with open(val_path, "w", encoding="utf-8") as f:
        for ex in val_data:
            f.write(json.dumps(ex, ensure_ascii=False) + "\n")

    print()
    logger.info("Saved train data to %s (%d examples)", train_path, len(train_data))
    logger.info("Saved val data   to %s (%d examples)", val_path, len(val_data))
    print()
    print("Done! Next step: python scripts/train_lora.py")


if __name__ == "__main__":
    main()
