#!/usr/bin/env python3
"""
Export user feedback from the PostgreSQL database to ChatML training data.
Connects to the Social Scheduler database and converts positive / edited
feedback into JSONL format suitable for fine-tuning.

Usage:
    python scripts/export_feedback.py
    python scripts/export_feedback.py --database-url postgresql://user:pass@host/db
    python scripts/export_feedback.py --output-file data/feedback/feedback_export.jsonl
    python scripts/export_feedback.py --min-rating GOOD
"""

import argparse
import json
import logging
import os
import sys
from pathlib import Path
from typing import Any, Optional

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


# ─── System Prompts (matching src/lib/ai/prompts.ts) ──────

SYSTEM_PROMPTS: dict[str, str] = {
    "TEXT_GENERATION": (
        "You are an experienced social media content creator and copywriter.\n"
        "Your task is to create a finished social media post from keywords, topics "
        "or short sentences.\n\n"
        'Return your answer as JSON:\n{\n  "content": "The finished social media '
        'post text",\n  "suggestions": ["Alternative idea 1", "Alternative idea 2"]\n}\n\n'
        "Rules:\n"
        "- Create ONE finished, ready-to-publish post\n"
        "- The post should sound natural and authentic, not AI-generated\n"
        "- Adapt length and style to the target platform(s)\n"
        "- Include appropriate emojis if they fit the tone\n"
        "- Close with a call-to-action if appropriate\n\n"
        "Reply ONLY with the JSON, no additional explanations."
    ),
    "HASHTAG_GENERATION": (
        "You are a social media hashtag expert.\n"
        "Analyze the provided post content and generate appropriate hashtags.\n"
        "Categorize them into four groups and consider the target platform(s).\n\n"
        'Return your analysis as JSON:\n{\n  "hashtags": {\n'
        '    "primary": ["#Hashtag1"],\n    "secondary": ["#Hashtag2"],\n'
        '    "trending": ["#Hashtag3"],\n    "niche": ["#Hashtag4"]\n  },\n'
        '  "reasoning": "Brief explanation"\n}\n\n'
        "Reply ONLY with the JSON, no additional explanations."
    ),
    "CONTENT_VARIATION": (
        "You are a social media content expert for A/B testing.\n"
        "Create 3 different variations of the provided post content.\n"
        "Each variant should follow a different approach but convey the same core message.\n\n"
        'Return as JSON:\n{\n  "variations": [\n'
        '    {"variant": "A", "label": "Emotional Hook", "content": "...", '
        '"hashtags": "...", "approach": "..."}\n  ]\n}\n\n'
        "Reply ONLY with the JSON, no additional explanations."
    ),
    "BEST_TIMES": (
        "You are a social media analytics expert.\n"
        "Analyze the provided engagement data and recommend optimal posting times.\n"
        'Return as JSON:\n{\n  "recommendations": [...],\n'
        '  "generalInsights": [...],\n  "confidenceLevel": "high" | "medium" | "low"\n}\n\n'
        "Reply ONLY with the JSON, no additional explanations."
    ),
    "CONTENT_SUGGESTIONS": (
        "You are a social media content strategist.\n"
        "Analyze the provided post content and suggest improvements.\n"
        'Return as JSON:\n{\n  "suggestions": [\n'
        '    {"platform": "...", "improvedContent": "...", "reasoning": "...", '
        '"tips": ["..."]}\n  ]\n}\n\n'
        "Reply ONLY with the JSON, no additional explanations."
    ),
    "IMAGE_GENERATION": (
        "You are a creative director specializing in visual content.\n"
        "Generate image prompts for social media posts.\n"
        "Reply ONLY with the JSON, no additional explanations."
    ),
}


# ─── Database Export ──────────────────────────────────────


def export_from_database(
    database_url: str,
    min_rating: str = "GOOD",
    limit: int = 10000,
) -> list[dict[str, Any]]:
    """Connect to PostgreSQL and export AIFeedback records as ChatML examples."""
    try:
        import psycopg2
        import psycopg2.extras
    except ImportError:
        logger.error(
            "psycopg2 not installed. Run: pip install psycopg2-binary"
        )
        sys.exit(1)

    # Build rating filter
    if min_rating == "GOOD":
        rating_clause = "rating IN ('GOOD', 'EDITED')"
    elif min_rating == "EDITED":
        rating_clause = "rating = 'EDITED'"
    else:
        rating_clause = "rating IN ('GOOD', 'EDITED')"

    query = f"""
        SELECT
            id,
            "userId",
            "insightType",
            rating,
            "originalOutput",
            "editedOutput",
            "modelUsed",
            "inputContext",
            "createdAt"
        FROM "AIFeedback"
        WHERE {rating_clause}
        ORDER BY "createdAt" DESC
        LIMIT %s
    """

    examples: list[dict[str, Any]] = []

    try:
        logger.info("Connecting to database...")
        conn = psycopg2.connect(database_url)
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        logger.info("Querying AIFeedback table...")
        cur.execute(query, (limit,))
        rows = cur.fetchall()
        logger.info("Found %d feedback records", len(rows))

        for row in rows:
            example = convert_feedback_to_chatml(row)
            if example:
                examples.append(example)

        cur.close()
        conn.close()

    except psycopg2.OperationalError as e:
        logger.error("Database connection failed: %s", e)
        logger.error("Check your DATABASE_URL and ensure the database is accessible.")
        sys.exit(1)
    except psycopg2.ProgrammingError as e:
        logger.error("Query error: %s", e)
        logger.error("The AIFeedback table may not exist. Run Prisma migrations first.")
        sys.exit(1)

    return examples


def convert_feedback_to_chatml(row: dict[str, Any]) -> Optional[dict[str, Any]]:
    """Convert a single AIFeedback row into a ChatML training example."""
    insight_type = row.get("insightType", "")
    rating = row.get("rating", "")
    original_output = row.get("originalOutput", "")
    edited_output = row.get("editedOutput", "")
    input_context = row.get("inputContext")

    # Get the appropriate system prompt
    system_prompt = SYSTEM_PROMPTS.get(insight_type, "")
    if not system_prompt:
        logger.debug("Unknown insight type: %s, skipping", insight_type)
        return None

    # Build user message from input context
    user_message = ""
    if input_context and isinstance(input_context, dict):
        parts: list[str] = []

        # Text generation context
        if "keywords" in input_context:
            parts.append(f"Keywords / Topic: {input_context['keywords']}")
        if "tone" in input_context:
            parts.append(f"Desired tone: {input_context['tone']}")
        if "platforms" in input_context:
            platforms = input_context["platforms"]
            if isinstance(platforms, list):
                parts.append(f"Target platform(s): {', '.join(platforms)}")
            else:
                parts.append(f"Target platform(s): {platforms}")

        # Hashtag / variation context
        if "content" in input_context:
            parts.append(f"Post content: {input_context['content']}")
        if "postContent" in input_context:
            parts.append(f"Post content: {input_context['postContent']}")

        user_message = "\n\n".join(parts)
    elif input_context and isinstance(input_context, str):
        user_message = input_context

    if not user_message:
        logger.debug("No user message could be constructed, skipping")
        return None

    # Determine assistant response: use edited output if available (EDITED),
    # otherwise use original output (GOOD)
    if rating == "EDITED" and edited_output:
        assistant_response = edited_output
    elif original_output:
        assistant_response = original_output
    else:
        return None

    # Validate minimum content
    if len(assistant_response.strip()) < 20:
        return None

    return {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
            {"role": "assistant", "content": assistant_response},
        ],
    }


# ─── Main ─────────────────────────────────────────────────


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Export user feedback from the database for training"
    )
    parser.add_argument(
        "--database-url",
        type=str,
        default=None,
        help="PostgreSQL connection URL (default: DATABASE_URL env var)",
    )
    parser.add_argument(
        "--output-file",
        type=str,
        default="data/feedback/feedback_export.jsonl",
        help="Output JSONL file path (default: data/feedback/feedback_export.jsonl)",
    )
    parser.add_argument(
        "--min-rating",
        type=str,
        choices=["GOOD", "EDITED"],
        default="GOOD",
        help="Minimum rating to include: GOOD (includes EDITED too) or EDITED only",
    )
    args = parser.parse_args()

    # Resolve database URL
    database_url = args.database_url or os.environ.get("DATABASE_URL", "")

    if not database_url:
        # Try loading from .env file
        env_file = Path(__file__).parent.parent.parent / ".env"
        if env_file.exists():
            with open(env_file, encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("DATABASE_URL="):
                        database_url = line.split("=", 1)[1].strip().strip('"').strip("'")
                        break

    if not database_url:
        logger.error("No database URL provided.")
        logger.error("Set DATABASE_URL environment variable or use --database-url flag.")
        logger.error("Example: export DATABASE_URL=postgresql://user:pass@localhost:5432/social_scheduler")
        sys.exit(1)

    output_path = Path(args.output_file)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    print("=" * 60)
    print("Social Scheduler - Feedback Export")
    print("=" * 60)
    print(f"  Min rating   : {args.min_rating}")
    print(f"  Output file  : {output_path}")
    print("=" * 60)

    # Export from database
    examples = export_from_database(database_url, args.min_rating)

    if not examples:
        print()
        print("No feedback data found.")
        print()
        print("To generate feedback data:")
        print("  1. Use the Social Scheduler app to generate AI content")
        print("  2. Rate AI responses with thumbs up/down")
        print("  3. Edit AI suggestions (edited versions are especially valuable)")
        print("  4. Re-run this script to export the feedback")
        return

    # Write to JSONL
    with open(output_path, "w", encoding="utf-8") as f:
        for ex in examples:
            f.write(json.dumps(ex, ensure_ascii=False) + "\n")

    # Statistics
    print()
    print(f"Exported {len(examples)} feedback examples to {output_path}")
    print()
    print("Next step: python scripts/prepare_data.py")
    print("  This will merge the feedback data with seed data for training.")


if __name__ == "__main__":
    main()
