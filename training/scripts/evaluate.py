#!/usr/bin/env python3
"""
Evaluate fine-tuned model quality for social media content tasks.
Runs a set of built-in test cases and generates a quality report.

Usage:
    python scripts/evaluate.py
    python scripts/evaluate.py --model-path social-media-marketer
    python scripts/evaluate.py --model-path output/lora_adapter --test-file tests.jsonl
"""

import argparse
import json
import logging
import re
import subprocess
import sys
from pathlib import Path
from typing import Any, Optional

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


# ─── Built-in Test Cases ──────────────────────────────────

BUILTIN_TEST_CASES: list[dict[str, Any]] = [
    # Post generation tests
    {
        "category": "post_generation",
        "system": (
            "You are an experienced social media content creator and copywriter.\n"
            "Your task is to create a finished social media post from keywords.\n"
            'Return your answer as JSON:\n{"content": "...", "suggestions": ["..."]}\n'
            "Reply ONLY with the JSON."
        ),
        "prompt": (
            "Create a social media post based on the following inputs:\n\n"
            "Keywords / Topic: Kuenstliche Intelligenz, Mittelstand, Digitalisierung\n\n"
            "Desired tone: Professional and factual\n\n"
            "Target platform(s): LinkedIn"
        ),
        "expected_language": "de",
        "expected_format": "json",
        "expected_keys": ["content", "suggestions"],
        "max_length": 2000,
    },
    {
        "category": "post_generation",
        "system": (
            "You are an experienced social media content creator and copywriter.\n"
            "Your task is to create a finished social media post from keywords.\n"
            'Return your answer as JSON:\n{"content": "...", "suggestions": ["..."]}\n'
            "Reply ONLY with the JSON."
        ),
        "prompt": (
            "Create a social media post based on the following inputs:\n\n"
            "Keywords / Topic: summer sale, fashion, discount\n\n"
            "Desired tone: Casual, approachable and conversational\n\n"
            "Target platform(s): Instagram"
        ),
        "expected_language": "en",
        "expected_format": "json",
        "expected_keys": ["content"],
        "max_length": 2200,
    },
    # Hashtag generation tests
    {
        "category": "hashtag_generation",
        "system": (
            "You are a social media hashtag expert.\n"
            "Analyze the provided post content and generate appropriate hashtags.\n"
            'Return your analysis as JSON:\n{"hashtags": {"primary": [...], '
            '"secondary": [...], "trending": [...], "niche": [...]}, '
            '"reasoning": "..."}\n'
            "Reply ONLY with the JSON."
        ),
        "prompt": (
            "Generate hashtags for the following post:\n\n"
            "Post content: We just launched our new AI-powered analytics "
            "dashboard. Real-time insights for data-driven marketing teams.\n\n"
            "Target platforms: LinkedIn, Instagram"
        ),
        "expected_language": "en",
        "expected_format": "json",
        "expected_keys": ["hashtags"],
        "max_length": 1500,
    },
    # Content variation test
    {
        "category": "content_variations",
        "system": (
            "You are a social media content expert for A/B testing.\n"
            "Create 3 different variations of the provided post content.\n"
            'Return as JSON:\n{"variations": [{"variant": "A", "label": "...", '
            '"content": "...", "hashtags": "...", "approach": "..."}]}\n'
            "Reply ONLY with the JSON."
        ),
        "prompt": (
            "Create 3 variations of the following post:\n\n"
            "Original post: Notre nouveau service de conseil en strategie "
            "digitale est maintenant disponible.\n\n"
            "Target platform: Facebook"
        ),
        "expected_language": "fr",
        "expected_format": "json",
        "expected_keys": ["variations"],
        "max_length": 4000,
    },
    # Sentiment analysis test
    {
        "category": "sentiment_analysis",
        "system": (
            "You are a social media analytics expert specialized in sentiment analysis.\n"
            "Analyze the provided post and determine sentiment, emotions, and engagement.\n"
            'Return as JSON:\n{"sentiment": {"overall": "...", "score": 0.0}, '
            '"engagementPrediction": {"level": "...", "reasoning": "..."}}\n'
            "Reply ONLY with the JSON."
        ),
        "prompt": (
            "Analyze the sentiment of the following social media post:\n\n"
            "Post: Estamos muy contentos de anunciar que hemos superado "
            "los 10.000 clientes. Gracias a todos por confiar en nosotros.\n\n"
            "Platform: Instagram"
        ),
        "expected_language": "es",
        "expected_format": "json",
        "expected_keys": ["sentiment"],
        "max_length": 1500,
    },
    # Best times test
    {
        "category": "best_times",
        "system": (
            "You are a social media analytics expert.\n"
            "Recommend optimal posting times.\n"
            'Return as JSON:\n{"recommendations": [...], '
            '"generalInsights": [...], "confidenceLevel": "..."}\n'
            "Reply ONLY with the JSON."
        ),
        "prompt": (
            "Recommend the best posting times for a tech startup "
            "targeting developers.\n\n"
            "Target platforms: Twitter, LinkedIn"
        ),
        "expected_language": "en",
        "expected_format": "json",
        "expected_keys": ["recommendations"],
        "max_length": 3000,
    },
    # Brand voice test
    {
        "category": "brand_voice",
        "system": (
            "You are an experienced social media content creator.\n"
            "Adapt provided content to match a specific brand voice.\n"
            'Return as JSON:\n{"adaptedContent": "...", "changes": [...], '
            '"brandAlignment": {"overallScore": 0.0}}\n'
            "Reply ONLY with the JSON."
        ),
        "prompt": (
            "Adapt the following post to our brand voice:\n\n"
            "Original post: Unsere neue App ist da! Total krass und mega geil!\n\n"
            "Brand voice: Professional, semi-formal, moderate emoji usage.\n"
            "Target platform: LinkedIn"
        ),
        "expected_language": "de",
        "expected_format": "json",
        "expected_keys": ["adaptedContent"],
        "max_length": 2000,
    },
]


# ─── Ollama Query ─────────────────────────────────────────


def query_ollama(
    model: str,
    prompt: str,
    system: str = "",
    ollama_url: str = "http://localhost:11434",
    timeout: int = 120,
) -> tuple[str, float]:
    """Query an Ollama model. Returns (response_text, duration_seconds)."""
    import time

    payload = {
        "model": model,
        "prompt": prompt,
        "system": system,
        "stream": False,
    }

    start = time.time()
    try:
        result = subprocess.run(
            [
                "curl",
                "-s",
                f"{ollama_url}/api/generate",
                "-d",
                json.dumps(payload),
            ],
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        duration = time.time() - start
        data = json.loads(result.stdout)
        return data.get("response", ""), duration
    except subprocess.TimeoutExpired:
        return f"ERROR: Timeout after {timeout}s", time.time() - start
    except json.JSONDecodeError:
        return "ERROR: Invalid JSON response from Ollama", time.time() - start
    except Exception as e:
        return f"ERROR: {e}", time.time() - start


# ─── Checks ──────────────────────────────────────────────


def check_json_format(response: str, expected_keys: list[str]) -> dict[str, bool]:
    """Check if response is valid JSON with expected keys."""
    checks: dict[str, bool] = {}

    # Try to extract JSON from response
    json_match = re.search(r"\{[\s\S]*\}", response)
    checks["contains_json"] = json_match is not None

    if json_match:
        try:
            parsed = json.loads(json_match.group())
            checks["valid_json"] = True
            for key in expected_keys:
                checks[f"has_key_{key}"] = key in parsed
        except json.JSONDecodeError:
            checks["valid_json"] = False
    else:
        checks["valid_json"] = False

    return checks


def check_language_consistency(
    response: str, expected_language: str
) -> dict[str, bool]:
    """Check if response content is in the expected language."""
    # Simple heuristic: check for common words
    lang_indicators: dict[str, list[str]] = {
        "de": ["der", "die", "das", "und", "ist", "fuer", "mit"],
        "en": ["the", "and", "is", "for", "with", "this"],
        "fr": ["les", "des", "est", "pour", "dans", "une"],
        "es": ["los", "las", "por", "para", "con", "del"],
        "pt": ["dos", "das", "para", "com", "uma", "nos"],
    }

    checks: dict[str, bool] = {}
    words = response.lower().split()

    if expected_language in lang_indicators:
        indicators = lang_indicators[expected_language]
        matches = sum(1 for w in words if w in indicators)
        # At least a few indicator words should be present
        checks["language_consistent"] = matches >= 3
    else:
        checks["language_consistent"] = True  # Cannot check, assume OK

    return checks


def check_length(response: str, max_length: int) -> dict[str, bool]:
    """Check response length constraints."""
    return {
        "not_empty": len(response.strip()) > 0,
        "min_length": len(response) >= 20,
        "within_max_length": len(response) <= max_length,
        "no_error": not response.startswith("ERROR"),
    }


# ─── Evaluation ──────────────────────────────────────────


def evaluate_test_case(
    model: str, test_case: dict[str, Any], ollama_url: str
) -> dict[str, Any]:
    """Evaluate a single test case."""
    response, duration = query_ollama(
        model,
        test_case["prompt"],
        test_case.get("system", ""),
        ollama_url,
    )

    # Run all checks
    all_checks: dict[str, bool] = {}

    all_checks.update(check_length(response, test_case.get("max_length", 2000)))

    if test_case.get("expected_format") == "json":
        all_checks.update(
            check_json_format(response, test_case.get("expected_keys", []))
        )

    all_checks.update(
        check_language_consistency(
            response, test_case.get("expected_language", "en")
        )
    )

    # Compute score
    passed = sum(1 for v in all_checks.values() if v)
    total = len(all_checks)
    score = passed / total if total > 0 else 0.0

    return {
        "category": test_case["category"],
        "expected_language": test_case.get("expected_language", "en"),
        "response_preview": response[:300],
        "response_length": len(response),
        "duration_sec": round(duration, 2),
        "checks": all_checks,
        "passed": passed,
        "total_checks": total,
        "score": round(score, 3),
    }


def load_test_file(path: str) -> list[dict[str, Any]]:
    """Load custom test cases from a JSONL file."""
    test_cases: list[dict[str, Any]] = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                test_cases.append(json.loads(line))
    return test_cases


def print_report(results: list[dict[str, Any]], model: str) -> None:
    """Print a formatted quality report."""
    print()
    print("=" * 70)
    print(f"  EVALUATION REPORT: {model}")
    print("=" * 70)

    # Group by category
    categories: dict[str, list[dict[str, Any]]] = {}
    for r in results:
        cat = r["category"]
        categories.setdefault(cat, []).append(r)

    for cat, cat_results in categories.items():
        avg_score = sum(r["score"] for r in cat_results) / len(cat_results)
        print(f"\n--- {cat.replace('_', ' ').title()} (avg: {avg_score:.0%}) ---")

        for r in cat_results:
            status = "PASS" if r["score"] >= 0.7 else "WARN" if r["score"] >= 0.4 else "FAIL"
            lang = r.get("expected_language", "?")
            print(
                f"  [{status}] lang={lang}  score={r['score']:.0%}  "
                f"({r['passed']}/{r['total_checks']} checks)  "
                f"{r['duration_sec']}s"
            )

            # Show failed checks
            failed = [k for k, v in r["checks"].items() if not v]
            if failed:
                print(f"         Failed: {', '.join(failed)}")

    # Overall summary
    all_scores = [r["score"] for r in results]
    avg = sum(all_scores) / len(all_scores) if all_scores else 0

    print()
    print("=" * 70)
    print(f"  OVERALL SCORE: {avg:.0%}")
    print(f"  Tests run    : {len(results)}")
    print(f"  Passed (>70%): {sum(1 for s in all_scores if s >= 0.7)}/{len(results)}")
    print("=" * 70)


# ─── Main ─────────────────────────────────────────────────


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Evaluate fine-tuned model quality"
    )
    parser.add_argument(
        "--model-path",
        type=str,
        default="social-media-marketer",
        help="Ollama model name or path (default: social-media-marketer)",
    )
    parser.add_argument(
        "--test-file",
        type=str,
        default=None,
        help="Path to custom test cases JSONL file (optional)",
    )
    parser.add_argument(
        "--ollama-url",
        type=str,
        default="http://localhost:11434",
        help="Ollama API URL (default: http://localhost:11434)",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="output/evaluation_results.json",
        help="Path to save evaluation results JSON",
    )
    args = parser.parse_args()

    model = args.model_path

    print("=" * 60)
    print(f"Social Scheduler - Model Evaluation")
    print(f"Model: {model}")
    print("=" * 60)

    # Check Ollama availability
    try:
        result = subprocess.run(
            ["ollama", "list"], capture_output=True, text=True, timeout=10
        )
        if model not in result.stdout:
            logger.warning(
                "Model '%s' not found in Ollama. It may still work if served externally.",
                model,
            )
    except (FileNotFoundError, subprocess.TimeoutExpired):
        logger.warning("Could not verify Ollama availability.")

    # Load test cases
    if args.test_file:
        logger.info("Loading custom test cases from %s ...", args.test_file)
        test_cases = load_test_file(args.test_file)
    else:
        logger.info("Using %d built-in test cases", len(BUILTIN_TEST_CASES))
        test_cases = BUILTIN_TEST_CASES

    # Run evaluations
    results: list[dict[str, Any]] = []
    for i, tc in enumerate(test_cases, start=1):
        cat = tc.get("category", "unknown")
        print(f"\n  [{i}/{len(test_cases)}] {cat} ...", end=" ", flush=True)
        result = evaluate_test_case(model, tc, args.ollama_url)
        results.append(result)
        status = "OK" if result["score"] >= 0.7 else "!!"
        print(f"{status} ({result['score']:.0%})")

    # Print report
    print_report(results, model)

    # Save results
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    all_scores = [r["score"] for r in results]
    report = {
        "model": model,
        "overall_score": round(sum(all_scores) / len(all_scores), 3) if all_scores else 0,
        "tests_run": len(results),
        "tests_passed": sum(1 for s in all_scores if s >= 0.7),
        "results": results,
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    logger.info("Results saved to %s", output_path)


if __name__ == "__main__":
    main()
