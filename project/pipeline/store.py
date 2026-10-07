import json
import os

STORE_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "flagged_transactions.json")


def _load() -> list:
    if not os.path.exists(STORE_PATH):
        return []
    with open(STORE_PATH, "r") as f:
        return json.load(f)


def _save(records: list):
    os.makedirs(os.path.dirname(STORE_PATH), exist_ok=True)
    with open(STORE_PATH, "w") as f:
        json.dump(records, f, indent=2)


def append_flagged(record: dict) -> dict:
    records = _load()
    record["id"] = len(records) + 1
    records.append(record)
    _save(records)
    return record


def get_all() -> list:
    return list(reversed(_load()))


def get_by_id(flagged_id: int) -> dict | None:
    for record in _load():
        if record["id"] == flagged_id:
            return record
    return None
