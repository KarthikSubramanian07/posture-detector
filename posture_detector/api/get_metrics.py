import cv2
import numpy as np
from flask import Flask, request, jsonify
from get_depth import get_depth, get_feature
from flask_cors import CORS
# Paths to images
app = Flask(__name__)
CORS(app)
@app.route('/api/get_metrics', methods=['GET'])
def compute_torsion_id():
    id = request.args.get('id')
    get_depth(id)
    get_feature(id, 1)
    get_feature(id, 18)
    depth_path = f"../face/{id}_depth.png"
    face_path = f"../face/{id}_{1}_feature.png"
    chest_path = f"../face/{id}_{18}_feature.png"
    return jsonify(compute_torsion_principal_axis(depth_path, face_path, chest_path))

def compute_torsion_principal_axis(depth_img_path, face_mask_path, chest_mask_path):
    # Load masks
    face_mask = cv2.imread(face_mask_path, cv2.IMREAD_GRAYSCALE)
    chest_mask = cv2.imread(chest_mask_path, cv2.IMREAD_GRAYSCALE)
    # Resize masks to match
    depth = cv2.imread(depth_img_path, cv2.IMREAD_GRAYSCALE).astype(np.float32)
    face_mask = cv2.resize(face_mask, (depth.shape[1], depth.shape[0]), interpolation=cv2.INTER_NEAREST)
    chest_mask = cv2.resize(chest_mask, (depth.shape[1], depth.shape[0]), interpolation=cv2.INTER_NEAREST)

    # Compute centers
    face_coords = np.column_stack(np.where(face_mask > 128))
    chest_coords = np.column_stack(np.where(chest_mask > 128))

    face_center = np.mean(face_coords, axis=0)
    chest_center = np.mean(chest_coords, axis=0)

    # Compute principal axes using PCA
    def principal_angle(coords):
        coords_centered = coords - np.mean(coords, axis=0)
        cov = np.cov(coords_centered.T)
        eigvals, eigvecs = np.linalg.eigh(cov)
        principal_vector = eigvecs[:, np.argmax(eigvals)]
        angle = np.degrees(np.arctan2(principal_vector[0], principal_vector[1]))
        return angle

    face_angle = principal_angle(face_coords)
    chest_angle = principal_angle(chest_coords)

    # Torsion = difference between chest and face rotation
    torsion_angle = 90 - abs(chest_angle - face_angle)

    # Depth differences
    depth = cv2.normalize(depth, None, 0, 1, cv2.NORM_MINMAX)
    face_depth = np.mean(depth[face_mask > 128])
    chest_depth = np.mean(depth[chest_mask > 128])
    depth_diff = abs(face_depth - chest_depth)

    return {
        "face_depth": float(face_depth),
        "chest_depth": float(chest_depth),
        "depth_diff": float(depth_diff),
        "torsion_angle": float(torsion_angle)
    }
@app.after_request
def handle_options(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, X-Requested-With"

    return response
# Run
if __name__ == '__main__':
    app.run(port=5000, debug=True)