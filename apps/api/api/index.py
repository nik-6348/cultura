"""Vercel serverless entrypoint for the FastAPI app.

Vercel looks for an ASGI `app` variable in this file.
The `api/` directory is relative to the service root (apps/api/).
"""
import sys
from pathlib import Path

# Make `src` importable when Vercel runs from the service root (apps/api/)
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.main import app  # noqa: F401 — Vercel picks up `app` by name
