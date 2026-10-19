import cv2
import numpy as np


def extract_sketch_features(image_path: str) -> list[float] | None:
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        return None

    img = cv2.resize(img, (512, 512))

    # Edge density: how much of the image is actual linework
    edges = cv2.Canny(img, 50, 150)
    edge_density = np.count_nonzero(edges) / edges.size

    # Line consistency: lower variance in edge gradient = cleaner, more confident strokes
    sobel_x = cv2.Sobel(img, cv2.CV_64F, 1, 0, ksize=3)
    sobel_y = cv2.Sobel(img, cv2.CV_64F, 0, 1, ksize=3)
    gradient_mag = np.sqrt(sobel_x**2 + sobel_y**2)
    line_variance = float(np.std(gradient_mag)) / 255.0

    # Symmetry: compare left half vs mirrored right half
    left = edges[:, :256]
    right = edges[:, 256:]
    right_flipped = np.fliplr(right)
    symmetry_diff = np.mean(np.abs(left.astype(float) - right_flipped.astype(float))) / 255.0
    symmetry_score = 1.0 - min(symmetry_diff, 1.0)

    # Composition balance: how centered the linework is (not all in one corner)
    ys, xs = np.nonzero(edges)
    if len(xs) > 0:
        center_x, center_y = xs.mean() / 512, ys.mean() / 512
        balance = 1.0 - (abs(center_x - 0.5) + abs(center_y - 0.5))
    else:
        balance = 0.5

    return [edge_density, line_variance, symmetry_score, balance]
