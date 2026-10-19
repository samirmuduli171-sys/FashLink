from ultralytics import YOLO
import cv2
import os
import uuid
import subprocess
from app.services.pose_features import extract_features
from app.services.pose_rubric import compute_rubric

_model = None
OVERLAY_DIR = "uploads/overlays"
MAX_VIDEO_SECONDS = 8
FRAME_SKIP = 2  # process every 2nd-3rd frame for the overlay video


def get_model():
    global _model
    if _model is None:
        _model = YOLO("yolov8n-pose.pt")
    return _model


def _save_overlay_image(results) -> str | None:
    try:
        os.makedirs(OVERLAY_DIR, exist_ok=True)
        annotated = results[0].plot()
        filename = f"{uuid.uuid4().hex}.jpg"
        path = os.path.join(OVERLAY_DIR, filename)
        cv2.imwrite(path, annotated)
        return path
    except Exception:
        return None


def analyze_walk_image(image_path: str) -> tuple[float, str, str | None, str | None]:
    model = get_model()
    results = model(image_path, verbose=False)

    if not results or len(results[0].keypoints.xy) == 0:
        return 50.0, "No clear person detected in the image. Try a full-body, well-lit shot.", None, None

    feats = extract_features([results[0].keypoints.xy[0].tolist()])
    if not feats:
        return 55.0, "Some key body points weren't visible. A straight-on full-body shot works best.", None, None

    rubric = compute_rubric(feats)
    overlay_path = _save_overlay_image(results)

    report = (
        f"Pose analysis complete (single frame — upload a video for full gait analysis). "
        f"Overall: {rubric['overall']}/100. {rubric['breakdown_text']}"
    )
    return rubric["overall"], report, overlay_path, None


def analyze_walk_video(video_path: str) -> tuple[float, str, str | None, str | None]:
    model = get_model()
    cap = cv2.VideoCapture(video_path)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 24
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    if total_frames <= 0:
        cap.release()
        return 50.0, "Could not read the video file. Try a different format (mp4 recommended).", None, None

    # --- Pass 1: sample ~12 evenly-spaced frames for scoring + a few still overlays ---
    sample_count = min(12, total_frames)
    frame_indices = [int(i * total_frames / sample_count) for i in range(sample_count)]
    overlay_target_count = min(4, len(frame_indices))
    overlay_step = max(1, len(frame_indices) // overlay_target_count)
    overlay_indices = set(frame_indices[::overlay_step][:overlay_target_count])

    all_keypoints = []
    overlay_image_paths = []

    for idx in frame_indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        success, frame = cap.read()
        if not success:
            continue
        results = model(frame, verbose=False)
        if not results or len(results[0].keypoints.xy) == 0:
            continue
        all_keypoints.append(results[0].keypoints.xy[0].tolist())

        if idx in overlay_indices:
            p = _save_overlay_image(results)
            if p:
                overlay_image_paths.append(p)

    if not all_keypoints:
        cap.release()
        return 50.0, "No clear person detected across the walk. Try better lighting or a front-facing angle.", None, None

    feats = extract_features(all_keypoints)
    overlay_image_str = ",".join(overlay_image_paths) if overlay_image_paths else None

    if not feats:
        cap.release()
        return 55.0, "Body keypoints weren't clear enough across frames. Try a front-facing, well-lit walk.", overlay_image_str, None

    rubric = compute_rubric(feats)
    report = (
        f"Walk analyzed via YOLOv8 pose detection across {len(feats)} sampled frames, "
        f"scored on a 4-part rubric. Overall: {rubric['overall']}/100. "
        f"{rubric['breakdown_text']}"
    )

    # --- Pass 2: generate a full annotated overlay video (capped length, skipped frames) ---
    overlay_video_path = None
    try:
        os.makedirs(OVERLAY_DIR, exist_ok=True)
        max_frames = int(min(total_frames, MAX_VIDEO_SECONDS * fps))
        video_filename = f"{uuid.uuid4().hex}.mp4"
        video_path = os.path.join(OVERLAY_DIR, video_filename)

        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        writer = cv2.VideoWriter(video_path, fourcc, max(fps / FRAME_SKIP, 1), (width, height))

        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
        frame_num = 0
        while frame_num < max_frames:
            success, frame = cap.read()
            if not success:
                break
            if frame_num % FRAME_SKIP == 0:
                results = model(frame, verbose=False)
                annotated = results[0].plot() if results and len(results[0].keypoints.xy) > 0 else frame
                writer.write(annotated)
            frame_num += 1

        writer.release()

        # Convert to browser-compatible H.264 using ffmpeg (OpenCV's mp4v codec
        # often isn't playable in browsers).
        converted_filename = f"{uuid.uuid4().hex}.mp4"
        converted_path = os.path.join(OVERLAY_DIR, converted_filename)
        result = subprocess.run(
            [
                "ffmpeg", "-y", "-i", video_path,
                "-vcodec", "libx264", "-pix_fmt", "yuv420p",
                "-movflags", "+faststart",
                converted_path,
            ],
            capture_output=True,
        )
        if result.returncode == 0 and os.path.exists(converted_path):
            os.remove(video_path)
            overlay_video_path = converted_path
        else:
            overlay_video_path = video_path
    except Exception:
        overlay_video_path = None

    cap.release()
    return rubric["overall"], report, overlay_image_str, overlay_video_path
