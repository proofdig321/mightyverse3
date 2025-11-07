# Changelog

## Unreleased

- Add optional model integrations (MiDaS, SAM, CLIP, Whisper) with safe stubs
  when libraries are not installed.
- Asset-review now returns nested `depth_map` and `segmentation` objects with
  both `path` and `cid` fields when available.
- Add robust nft.storage pin helpers (`pin_json_with_retries`,
  `pin_file_with_retries`) that prefer SDKs and fall back to HTTP with
  retries.
- Pinning now logs durations and writes pending manifest entries on final
  failure; added `agents-stubs/cli_pin_retry.py` to help admins retry failed
  pins.
- Added tests for integrations, pinning, and model-presence simulation.
- Added `agents-stubs/requirements-ml.txt`, a setup script, and scheduled
  ML smoke workflow (manual/weekly) for optional verification.
