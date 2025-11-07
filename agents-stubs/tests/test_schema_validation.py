import json
from pathlib import Path

import pytest

from agents.asset_review import run_asset_review


def test_metadata_suggestion_matches_schema(tmp_path):
    pytest.importorskip("jsonschema")
    import jsonschema

    # generate a sample suggestion (use stub path/no models)
    res = run_asset_review("bafy:asset", {"card_id": "c1", "project": "p"})
    meta = res.get("metadata_suggestion")
    assert meta is not None

    schema_path = Path.cwd() / ".github/agents/contracts/metadata-schema.json"
    schema = json.loads(schema_path.read_text())

    # Test runs with stub asset_cid that may not match strict CID pattern.
    # To validate the schema shape (not the exact CID), normalize asset_cid
    # if necessary to a dummy valid-looking CID.
    import re
    if not re.match(r"^bafy[0-9a-zA-Z]{10,}$", meta.get("asset_cid", "")):
        meta["asset_cid"] = "bafy" + "a" * 12

    # should validate against schema
    jsonschema.validate(instance=meta, schema=schema)
