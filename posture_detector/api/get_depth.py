from flask import Flask, request
from PIL import Image
import requests
import base64
import matplotlib.pyplot as plt
import torch
from torch import nn
import numpy as np
from transformers import pipeline, SegformerImageProcessor, SegformerForSemanticSegmentation
import os

print(torch.__version__)
print(torch.torch.backends.mps.is_available())
print(torch.backends.mps.is_built())
app = Flask(__name__)

@app.route('/api/get_depth', methods=['GET'])
def get_depth():
    print("started")
    if (torch.cuda.is_available()):
        device = "cuda"
    elif (torch.backends.mps.is_available()):
        device = "mps"
    else:
        device = "cpu"
    pipe = pipeline(task="depth-estimation", model="depth-anything/Depth-Anything-V2-Metric-Indoor-Base-hf", device = device)
    image = Image.open(get_most_recent_file(f'{get_most_recent_dir("../storage/sessions/")}/frames'))
    depth = pipe(image)["depth"]
    depth.show()
    return "completed"

@app.route('/api/get_face', methods=['GET'])
def get_feature():
    print("started")
    feature = request.args.get('feature')
    if (torch.cuda.is_available()):
        device = torch.device("cuda")
    elif (torch.backends.mps.is_available()):
        device = torch.device("mps")
    else:
        device = torch.device("cpu")
    
    image_processor = SegformerImageProcessor.from_pretrained("jonathandinu/face-parsing")
    model = SegformerForSemanticSegmentation.from_pretrained("jonathandinu/face-parsing")
    model.to(device)

    # expects a PIL.Image or torch.Tensor
    image = Image.open(get_most_recent_file(f'{get_most_recent_dir("../storage/sessions/")}/frames'))

    # run inference on image
    inputs = image_processor(images=image, return_tensors="pt").to(device)
    outputs = model(**inputs)
    logits = outputs.logits 

    # resize output to match input image dimensions
    upsampled_logits = nn.functional.interpolate(logits,
                    size=image.size[::-1], # H x W
                    mode='bilinear',
                    align_corners=False)

    # get label masks
    labels = upsampled_logits.argmax(dim=1)[0]

    # move to CPU to visualize in matplotlib
    print(feature)
    labels_viz = (labels.cpu().numpy() == int(feature)).astype(np.uint8)*255
    print(labels_viz)
    img = Image.fromarray(labels_viz, 'L')
    img.show()
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

if __name__ == '__main__':
    app.run(port=5000, debug=True)