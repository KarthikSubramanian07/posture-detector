import cv2
import numpy as np
from flask import Flask, request, jsonify
from get_depth import get_depth, get_feature
from flask_cors import CORS
import math
# Paths to images
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
@app.route('/api/get_metrics', methods=['GET'])
def compute_torsion_id():
    id = request.args.get('id')
    get_depth(id)
    get_feature(id, 1)
    get_feature(id, 2)
    get_feature(id, 18)
    depth_img = cv2.imread(f"../face/{id}_depth.png")
    face_mask = cv2.imread(f"../face/{id}_{1}_feature.png")
    neck_mask = cv2.imread(f"../face/{id}_{2}_feature.png")
    chest_mask = cv2.imread(f"../face/{id}_{18}_feature.png")
    metric_dict = {}
    metric_dict["chest_roll"], metric_dict["chest_pitch"] = compute_rolls(depth_img, chest_mask)
    metric_dict["neck_roll"], metric_dict["neck_pitch"] = compute_rolls(depth_img, neck_mask)
    metric_dict["face_roll"], metric_dict["face_pitch"] = compute_rolls(depth_img, face_mask)
    metric_dict["face_dist"] = compute_avg_dist(depth_img, face_mask)
    metric_dict["chest_dist"] = compute_avg_dist(depth_img, chest_mask)
    metric_dict["depth_diff"] = metric_dict["chest_dist"] - metric_dict["face_dist"]
    metric_dict["neck_area"] = compute_area(neck_mask)
    metric_dict["eye_strain"] = get_eye_strain(metric_dict["face_dist"])
    metric_dict["neck_strain"] = get_neck_strain(metric_dict["neck_pitch"], metric_dict["neck_roll"], metric_dict["neck_area"])
    metric_dict["posture"] = int(is_correct(metric_dict))
    return jsonify(metric_dict)

def compute_rolls(depth_img, depth_mask):
    print(depth_mask.shape)
    y, x = np.nonzero(depth_mask[:,:,0])
    z = depth_img.mean(axis = -1)[y,x]
    x = x.astype(np.float64)
    y = y.astype(np.float64)
    z = z.astype(np.float64)
    x = x - x.mean()
    y = y - y.mean()
    pts = np.stack((x, y, z), axis = 1)
    print(pts.shape)
    centered = pts - pts.mean(axis = 0)
    cov = np.cov(centered, rowvar=False)
    eigvals, eigvecs = np.linalg.eigh(cov)
    normal = eigvecs[:, np.argmin(eigvals)]
    normal /= np.linalg.norm(normal)

    nx, ny, nz = normal
    pitch = np.arctan2(ny, nz)*(180/math.pi)
    roll  = np.arctan2(nx, nz)*(180/math.pi)
    pitch = min(abs(pitch), abs(pitch+180), abs(pitch-180))
    roll = min(abs(roll), abs(roll+180), abs(pitch-180))
    return roll, pitch

def compute_avg_dist(depth_img, depth_mask):
    y, x = np.nonzero(depth_mask[:,:,0])
    z = depth_img.mean(axis = -1)[y,x]
    return z.mean()
def compute_area(depth_mask):
    return len(np.nonzero(depth_mask[:,:,0])[0])

def get_neck_strain(neck_pitch, neck_roll, neck_area):
    ans = neck_pitch + neck_roll - neck_area/2000
    return ans

def get_eye_strain(face_depth):
    ans = 10/(face_depth/5)
    return ans
def is_correct(metric_dict):
    if (metric_dict["eye_strain"] > 5):
        return False
    if (metric_dict["neck_strain"] > 5):
        return False
    if (metric_dict["chest_roll"] > 10 or metric_dict["chest_pitch"] > 10):
        return False
    return True
@app.after_request
def handle_options(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, X-Requested-With"

    return response
# Run
if __name__ == '__main__':
    app.run(host="0.0.0.0",port=5500, debug=True)