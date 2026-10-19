import cv2
import numpy as np


def extract_stitching_features(image_path: str) -> list[float] | None:
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        return None

    img = cv2.resize(img, (512, 512))

    # Edge sharpness: strong, clean edges = neat stitching
    laplacian = cv2.Laplacian(img, cv2.CV_64F)
    sharpness = float(np.var(laplacian)) / 10000.0
    sharpness = min(sharpness, 1.0)

    # Line straightness: detect straight lines via Hough transform
    edges = cv2.Canny(img, 50, 150)
    lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=50, minLineLength=20, maxLineGap=5)
    line_count = len(lines) if lines is not None else 0
    line_straightness = min(line_count / 100.0, 1.0)

    # Texture uniformity: lower local variance spread = more even/consistent fabric work
    texture_std = float(np.std(img)) / 255.0
    uniformity = 1.0 - min(texture_std, 1.0)

    # Pattern repetition: autocorrelation-based regularity check
    f = np.fft.fft2(img)
    fshift = np.abs(np.fft.fftshift(f))
    fshift = fshift / (fshift.max() + 1e-8)
    repetition = float(np.mean(fshift > 0.3))

    return [sharpness, line_straightness, uniformity, repetition]
