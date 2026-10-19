import os
import uuid
from fastapi import UploadFile

UPLOAD_DIR = "uploads"

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/quicktime"}


def save_upload_file(file: UploadFile) -> tuple[str, str]:
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    if file.content_type in ALLOWED_IMAGE_TYPES:
        file_type = "image"
    elif file.content_type in ALLOWED_VIDEO_TYPES:
        file_type = "video"
    else:
        raise ValueError(f"Unsupported file type: {file.content_type}")

    ext = file.filename.split(".")[-1]
    unique_name = f"{uuid.uuid4().hex}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    with open(file_path, "wb") as f:
        f.write(file.file.read())

    return file_path, file_type
