from flask import Flask
from PIL import Image
import requests
import base64
import matplotlib.pyplot as plt
import torch
from torch import nn
import numpy as np
from transformers import pipeline, SegformerImageProcessor, SegformerForSemanticSegmentation

print(torch.__version__)
print(torch.torch.backends.mps.is_available())
print(torch.backends.mps.is_built())
app = Flask(__name__)

@app.route('/api/get_depth', methods=['GET'])
def get_depth():
    print("started")
    pipe = pipeline(task="depth-estimation", model="depth-anything/Depth-Anything-V2-Metric-Indoor-Base-hf", device = "mps")
    url = 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6'
    image = Image.open(requests.get(url, stream=True).raw)
    depth = pipe(image)["depth"]
    depth.show()
    return "completed"

@app.route('/api/get_face', methods=['GET'])
def get_feature():
    print("started")
    device = torch.device("mps")
    image_processor = SegformerImageProcessor.from_pretrained("jonathandinu/face-parsing")
    model = SegformerForSemanticSegmentation.from_pretrained("jonathandinu/face-parsing")
    model.to(device)

    # expects a PIL.Image or torch.Tensor
    url = "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6"
    image = Image.open(requests.get(url, stream=True).raw)

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
    labels_viz = (labels.cpu().numpy() == 18).astype(np.uint8)*255
    print(labels_viz)
    img = Image.fromarray(labels_viz, 'L')
    img.show()
    return "finished"
if __name__ == '__main__':
    app.run(port=5000, debug=True)