import os
import sys

# Set environment variables BEFORE any imports
os.environ["PYTORCH_ENABLE_MPS_FALLBACK"] = "1"
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

# Import torch FIRST before transformers
import torch
from torch import nn
import numpy as np
from PIL import Image

# CRITICAL FIX for PyTorch 2.9.0+: Patch torch.load BEFORE importing transformers
# This prevents the "Cannot copy out of meta tensor" error
_original_torch_load = torch.load

def _patched_torch_load(*args, **kwargs):
    # Force weights_only=False to prevent meta tensor issues
    if 'weights_only' not in kwargs:
        kwargs['weights_only'] = False
    return _original_torch_load(*args, **kwargs)

torch.load = _patched_torch_load

print("✓ PyTorch patches applied")
print(f"✓ PyTorch version: {torch.__version__}")

# NOW import transformers AFTER all patches are applied
from transformers import pipeline, SegformerImageProcessor, SegformerForSemanticSegmentation

print(torch.__version__)
print(torch.backends.mps.is_available())
print(torch.backends.mps.is_built())

# Global model cache to prevent reloading and meta tensor issues
_face_parsing_model = None
_face_parsing_processor = None

def get_depth(id):
    if (torch.cuda.is_available()):
        device = "cuda"
    elif (torch.backends.mps.is_available()):
        device = "mps"
    else:
        device = "cpu"

    # Create pipeline - transformers 4.45 should work without extra kwargs
    pipe = pipeline(
        task="depth-estimation",
        model="depth-anything/Depth-Anything-V2-Metric-Indoor-Base-hf",
        device=device
    )
    image = Image.open(get_most_recent_file(f'{get_most_recent_dir("../storage/sessions/")}/frames'))
    depth = pipe(image)["depth"]
    depth.save(f"../face/{id}_depth.png")
    return "completed"

def get_feature(id, feature):
    global _face_parsing_model, _face_parsing_processor

    device = torch.device("cpu")  # Force CPU to avoid device issues

    # Use cached model if available to avoid reloading issues
    if _face_parsing_model is None or _face_parsing_processor is None:
        print("Loading face parsing model for the first time...")

        _face_parsing_processor = SegformerImageProcessor.from_pretrained("jonathandinu/face-parsing")

        # Load model with transformers 4.45 - should work cleanly
        print("Loading face parsing model...")
        _face_parsing_model = SegformerForSemanticSegmentation.from_pretrained(
            "jonathandinu/face-parsing",
            torch_dtype=torch.float32
        )

        # Move to device and set to eval mode
        _face_parsing_model = _face_parsing_model.to(device)
        _face_parsing_model.eval()
        print(f"✓ Model loaded successfully on {device}")
    else:
        print("Using cached face parsing model")

    model = _face_parsing_model
    image_processor = _face_parsing_processor

    # expects a PIL.Image or torch.Tensor
    image = Image.open(get_most_recent_file(f'{get_most_recent_dir("../storage/sessions/")}/frames'))

    # run inference on image
    inputs = image_processor(images=image, return_tensors="pt").to(device)

    with torch.no_grad():  # Disable gradient computation for inference
        outputs = model(**inputs)
        logits = outputs.logits

    # resize output to match input image dimensions
    upsampled_logits = nn.functional.interpolate(logits,
                    size=image.size[::-1], # H x W
                    mode='bilinear',
                    align_corners=False)

    # get label masks
    labels = upsampled_logits.argmax(dim=1)[0]

    # Debug: Check what labels we're getting
    unique_labels = torch.unique(labels)
    print(f"Feature {feature}: Unique labels found in image: {unique_labels.tolist()}")

    # move to CPU to visualize in matplotlib
    print(feature)
    labels_viz = (labels.cpu().numpy() == int(feature)).astype(np.uint8)*255

    # Debug: Check if we found the feature
    feature_pixels = np.sum(labels_viz > 0)
    print(f"Feature {feature}: Found {feature_pixels} pixels")
    img = Image.fromarray(labels_viz, 'L')
    img.save(f"../face/{id}_{feature}_feature.png", "PNG")
    return "finished"

def get_most_recent_file(directory_path):

    if not os.path.isdir(directory_path):
        print(f"Error: Directory '{directory_path}' not found.")
        return None
    files = [os.path.join(directory_path, f) for f in os.listdir(directory_path) if os.path.isfile(os.path.join(directory_path, f))]
    if not files:
        print(f"No files found in directory '{directory_path}'.")
        return None

    most_recent_file = max(files, key=os.path.getmtime)
    return most_recent_file

def get_most_recent_dir(directory_path):

    if not os.path.isdir(directory_path):
        print(f"Error: Directory '{directory_path}' not found.")
        return None
    dirs = [os.path.join(directory_path, f) for f in os.listdir(directory_path) if os.path.isdir(os.path.join(directory_path, f))]
    if not dirs:
        print(f"No files found in directory '{directory_path}'.")
        return None

    most_recent_dir = max(dirs, key=os.path.getmtime)
    return most_recent_dir

