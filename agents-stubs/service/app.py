"""FastAPI service wrapper for agent stubs."""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import logging

from agents import asset_review as ar_mod
from agents import metadata_gen as mg_mod
from agents import mint_approval as ma_mod

app = FastAPI(title="MightyVerse Agent Stubs")

logger = logging.getLogger("agents_stubs")
logging.basicConfig(level=logging.INFO)


class AssetReviewRequest(BaseModel):
    asset_cid: Optional[str]
    manifest: Optional[Dict[str, Any]] = None


class MetadataGenRequest(BaseModel):
    metadata_suggestion: Dict[str, Any]
    depth_map_cid: Optional[str] = None
    ad_anchor_cid: Optional[str] = None


class MintApprovalRequest(BaseModel):
    manifest_cid: str
    card_id: str
    credits_required: Optional[int] = 0
    admin_signature: Optional[str] = None


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/asset-review")
def asset_review(req: AssetReviewRequest):
    logger.info("asset-review called: %s", req.asset_cid)
    try:
        res = ar_mod.run_asset_review(req.asset_cid or "", req.manifest)
        return res
    except Exception as e:
        logger.exception("asset-review failed")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/metadata-gen")
def metadata_gen(req: MetadataGenRequest):
    logger.info("metadata-gen called for card: %s", req.metadata_suggestion.get("card_id"))
    try:
        manifest = mg_mod.build_metadata(req.metadata_suggestion, req.depth_map_cid, req.ad_anchor_cid)
        return manifest
    except Exception as e:
        logger.exception("metadata-gen failed")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/mint-approval")
def mint_approval(req: MintApprovalRequest):
    logger.info("mint-approval called for card: %s", req.card_id)
    try:
        tx = ma_mod.prepare_mint(req.manifest_cid, req.card_id, credits_required=req.credits_required, admin_signature=req.admin_signature)
        return tx
    except Exception as e:
        logger.exception("mint-approval failed")
        raise HTTPException(status_code=500, detail=str(e))
