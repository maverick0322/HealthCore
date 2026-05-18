from __future__ import annotations

import csv
import json
import re
import urllib.request
from collections import OrderedDict
from pathlib import Path


SEPOMEX_URL = "https://www.correosdemexico.gob.mx/datosabiertos/cp/cpdescarga.txt"
OUTPUT_PATH = (
    Path(__file__).resolve().parents[2]
    / "src"
    / "main"
    / "resources"
    / "reference"
    / "sepomex-postal-codes.json"
)


def normalize_text(value: str | None) -> str:
    if value is None:
        return ""
    compact = re.sub(r"\s+", " ", value.strip())
    return compact.title()


def read_rows() -> list[dict[str, str]]:
    with urllib.request.urlopen(SEPOMEX_URL) as response:
        raw_text = response.read().decode("latin-1")

    lines = raw_text.splitlines()
    reader = csv.DictReader(lines[1:], delimiter="|")
    return list(reader)


def build_snapshot(rows: list[dict[str, str]]) -> list[dict[str, object]]:
    grouped: OrderedDict[str, dict[str, object]] = OrderedDict()

    for row in rows:
        postal_code = str(row.get("d_codigo", "")).zfill(5)
        state = normalize_text(row.get("d_estado"))
        city = normalize_text(row.get("d_ciudad")) or normalize_text(row.get("D_mnpio"))
        municipality = normalize_text(row.get("D_mnpio"))
        colony = normalize_text(row.get("d_asenta"))

        if not postal_code.strip("0"):
            continue

        entry = grouped.get(postal_code)
        if entry is None:
            entry = {
                "postalCode": postal_code,
                "state": state,
                "city": city,
                "municipality": municipality,
                "colonies": [],
            }
            grouped[postal_code] = entry
        else:
            if (
                entry["state"] != state
                or entry["city"] != city
                or entry["municipality"] != municipality
            ):
                raise ValueError(
                    f"Conflicting metadata for postal code {postal_code}: {entry} vs {state}/{city}/{municipality}"
                )

        colonies: list[str] = entry["colonies"]  # type: ignore[assignment]
        if colony and colony not in colonies:
            colonies.append(colony)

    return list(grouped.values())


def main() -> None:
    rows = read_rows()
    snapshot = build_snapshot(rows)
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Generated {len(snapshot)} postal codes in {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
