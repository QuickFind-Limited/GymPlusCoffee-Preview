"""Command line helpers for the clarification module."""

from __future__ import annotations

import argparse
from pathlib import Path

from .data_loader import load_clarification_dataset, write_compiled_dataset

def main() -> None:
    parser = argparse.ArgumentParser(description="Clarification dataset utilities")
    parser.add_argument(
        "--write", action="store_true", help="Write compiled dataset to disk"
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Optional output path for compiled dataset",
    )
    args = parser.parse_args()

    if args.write:
        path = write_compiled_dataset(output_path=args.output)
        print(f"Compiled dataset written to {path}")
    else:
        dataset = load_clarification_dataset()
        print(
            f"Loaded {len(dataset.clarifications)} clarifications from {dataset.source_csv}"
        )


if __name__ == "__main__":
    main()
