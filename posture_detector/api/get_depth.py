from flask import Flask
from transformers import pipeline
from PIL import Image
import requests
import base64
import matplotlib.pyplot as plt
import torch
print(torch.__version__)
print(torch.torch.backends.mps.is_available())
print(torch.backends.mps.is_built())
app = Flask(__name__)

@app.route('/api/get_depth', methods=['GET'])
def get_depth():
    print("started")
    pipe = pipeline(task="depth-estimation", model="depth-anything/Depth-Anything-V2-Metric-Indoor-Base-hf", device = "mps")
    url = 'http://images.cocodataset.org/val2017/000000039769.jpg'
    image = Image.open(requests.get(url, stream=True).raw)
    depth = pipe(image)["depth"]
    depth.show()
    return "completed"
    
if __name__ == '__main__':
    app.run(port=5000, debug=True)