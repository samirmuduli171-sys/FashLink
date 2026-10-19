import cv2
import numpy as np


def extract_design_features(image_path: str) -> dict | None:
    img = cv2.imread(image_path)
    if img is None:
        return None

    img = cv2.resize(img, (512, 512))
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

    # Sharpness — clean, well-focused construction
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    sharpness = float(np.var(laplacian)) / 6000.0

    # Edge density — how defined the construction lines are
    edges = cv2.Canny(gray, 50, 150)
    edge_density = np.count_nonzero(edges) / edges.size

    # Symmetry — left vs mirrored right
    left = gray[:, :256]
    right = gray[:, 256:]
    right_flipped = np.fliplr(right)
    symmetry_diff = np.mean(np.abs(left.astype(float) - right_flipped.astype(float))) / 255.0
    symmetry = 1.0 - min(symmetry_diff, 1.0)

    # Composition balance — how centered the visual weight is
    ys, xs = np.nonzero(edges)
    if len(xs) > 0:
        center_x, center_y = xs.mean() / 512, ys.mean() / 512
        balance = 1.0 - (abs(center_x - 0.5) + abs(center_y - 0.5))
    else:
        balance = 0.5

    # Color richness — hue diversity (material/palette variety)
    hue_hist = cv2.calcHist([hsv], [0], None, [180], [0, 180])
    hue_hist = hue_hist / (hue_hist.sum() + 1e-8)
    color_diversity = float(-np.sum(hue_hist * np.log(hue_hist + 1e-8))) / np.log(180)

    # Texture variation — surface/material variety
    texture_variation = float(np.std(gray)) / 255.0

    # Palette cohesion — concentration in top-3 dominant hues
    sorted_hist = np.sort(hue_hist.flatten())[::-1]
    top3_concentration = float(np.sum(sorted_hist[:3]))

    # Silhouette complexity — contour count as a proxy for garment structure
    contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    contour_count = len(contours)

    return {
        "sharpness": max(0.0, min(sharpness, 1.0)),
        "edge_density": edge_density,
        "symmetry": symmetry,
        "balance": max(0.0, balance),
        "color_diversity": color_diversity,
        "texture_variation": texture_variation,
        "top3_concentration": top3_concentration,
        "contour_count": contour_count,
    }
