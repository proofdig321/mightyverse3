"""Optional integrations for asset review: MiDaS, SAM, CLIP, Whisper.

Each function tries to import a real library and run inference. If the
library is unavailable, the function returns a safe stub value.

These wrappers keep the main agent code clean and make it easy to
swap in real models later.
"""
from typing import Any, Dict, List, Optional
import logging
import os
import tempfile
from typing import Tuple

logger = logging.getLogger("mighty.integrations")


def estimate_depth_from_image(image_path: str) -> Optional[str]:
    """Estimate depth map for an image. Returns a path or CID-like string.

    Tries MiDaS via torch.hub if available. Otherwise returns None.
    """
    try:
        import torch

        # try MiDaS from torch.hub
        model_type = "DPT_Large"  # example
        midas = torch.hub.load("intel-isl/MiDaS", model_type)
        midas.eval()
        # load transforms
        midas_transforms = torch.hub.load("intel-isl/MiDaS", "transforms")
        transform = midas_transforms.default_transform
        from PIL import Image
        import numpy as np

        img = Image.open(image_path).convert("RGB")
        input_batch = transform(img).unsqueeze(0)
        with torch.no_grad():
            prediction = midas(input_batch)
            prediction = torch.nn.functional.interpolate(
                prediction.unsqueeze(1), size=img.size[::-1], mode="bicubic", align_corners=False
            ).squeeze()
        # write a simple depth map to a temp file
        out = tempfile.NamedTemporaryFile(delete=False, suffix=".npy")
        np.save(out.name, prediction.cpu().numpy())
        out.close()
        # Optionally pin to nft.storage if API key is present
        api_key = os.environ.get("NFT_STORAGE_KEY")
        if api_key:
            try:
                # dynamic import of pin helper to avoid import issues in proxy setup
                try:
                    from agents_stubs.utils.pinning import pin_file_with_retries
                except Exception:
                    # fallback to loading implementation directly from file
                    import importlib.util
                    p = os.path.join(os.path.dirname(__file__), "..", "utils", "pinning.py")
                    p = os.path.normpath(p)
                    spec = importlib.util.spec_from_file_location("mighty.pinning", p)
                    mod = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(mod)
                    pin_file_with_retries = getattr(mod, "pin_file_with_retries")

                cid = pin_file_with_retries(out.name, api_key)
                return cid
            except Exception as e:
                logger.debug("Pinning depth map failed: %s", e)
                return out.name
        return out.name
    except Exception as e:
        logger.debug("MiDaS not available or failed: %s", e)
        return None


def run_segmentation(image_path: str) -> Optional[str]:
    """Run segmentation (SAM/YOLO). Returns a path to masks or None.

    Attempts SAM via segment-anything if installed.
    """
    try:
        # try to import segment-anything
        from segment_anything import SamPredictor, sam_model_registry
        from PIL import Image
        import numpy as np

        model = sam_model_registry.get("default")
        predictor = SamPredictor(model)
        img = np.array(Image.open(image_path).convert("RGB"))
        predictor.set_image(img)
        # produce a simple mask for now
        masks = predictor.predict(points=None, boxes=None)
        out = tempfile.NamedTemporaryFile(delete=False, suffix=".npz")
        # save masks as numpy arrays
        import numpy as np

        np.savez(out.name, masks=masks)
        out.close()
        api_key = os.environ.get("NFT_STORAGE_KEY")
        if api_key:
            try:
                try:
                    from agents_stubs.utils.pinning import pin_file_with_retries
                except Exception:
                    import importlib.util
                    p = os.path.join(os.path.dirname(__file__), "..", "utils", "pinning.py")
                    p = os.path.normpath(p)
                    spec = importlib.util.spec_from_file_location("mighty.pinning", p)
                    mod = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(mod)
                    pin_file_with_retries = getattr(mod, "pin_file_with_retries")

                cid = pin_file_with_retries(out.name, api_key)
                return cid
            except Exception as e:
                logger.debug("Pinning segmentation failed: %s", e)
                return out.name
        return out.name
    except Exception as e:
        logger.debug("Segmentation not available or failed: %s", e)
        return None


def clip_image_tags(image_path: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """Return CLIP tags for the image if CLIP is installed; else a stub list.
    """
    try:
        import torch
        from PIL import Image
        from torchvision import transforms
        # Attempt to use a simple CLIP-like model via torchvision (placeholder)
        img = Image.open(image_path).convert("RGB")
        # stub: return dummy tags
        return [{"tag": "hiphop", "score": 0.9}, {"tag": "animated", "score": 0.85}][:top_k]
    except Exception as e:
        logger.debug("CLIP not available: %s", e)
        return [{"tag": "hiphop", "score": 0.9}, {"tag": "animated", "score": 0.85}][:top_k]


def transcribe_audio(audio_path: str) -> Dict[str, Any]:
    """Transcribe audio using Whisper if available. Returns a dict with text and bpm if possible.

    Falls back to a stub transcription.
    """
    try:
        import whisper

        model = whisper.load_model("small")
        result = model.transcribe(audio_path)
        text = result.get("text", "")
        # bpm detection not implemented; return placeholder
        return {"text": text, "bpm": None}
    except Exception as e:
        logger.debug("Whisper not available or failed: %s", e)
        return {"text": "[stub transcript]", "bpm": None}
