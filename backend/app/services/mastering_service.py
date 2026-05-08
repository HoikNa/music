import os
import shutil
import subprocess
import tempfile
from urllib.parse import urlparse

from app.config import settings


def _download_from_s3(audio_url: str, dest_path: str) -> None:
    import boto3

    parsed = urlparse(audio_url)
    bucket = parsed.netloc.split(".")[0]
    key = parsed.path.lstrip("/")
    boto3.client("s3", region_name=settings.aws_region).download_file(bucket, key, dest_path)


def _upload_to_s3(source_path: str, key: str) -> str:
    import boto3

    boto3.client("s3", region_name=settings.aws_region).upload_file(
        source_path,
        settings.s3_bucket,
        key,
        ExtraArgs={"ContentType": "audio/mpeg"},
    )
    return f"https://{settings.s3_bucket}.s3.{settings.aws_region}.amazonaws.com/{key}"


def master_audio(audio_url: str, user_id: str, target_lufs: float | None = None) -> dict:
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        return {
            "status": "failed",
            "provider": "ffmpeg",
            "audio_url": None,
            "message": "ffmpeg is not installed",
        }

    target = target_lufs if target_lufs is not None else settings.mastering_target_lufs
    input_tmp = tempfile.NamedTemporaryFile(suffix=".input", dir="/tmp", delete=False)
    output_tmp = tempfile.NamedTemporaryFile(suffix=".mp3", dir="/tmp", delete=False)
    input_tmp.close()
    output_tmp.close()

    try:
        _download_from_s3(audio_url, input_tmp.name)
        subprocess.run(
            [
                ffmpeg,
                "-y",
                "-i",
                input_tmp.name,
                "-af",
                f"loudnorm=I={target}:TP=-1.5:LRA=11",
                "-codec:a",
                "libmp3lame",
                "-b:a",
                "192k",
                output_tmp.name,
            ],
            check=True,
            capture_output=True,
            text=True,
        )
        key = f"mastered/{user_id}/{os.path.basename(output_tmp.name)}"
        return {
            "status": "succeeded",
            "provider": "ffmpeg",
            "audio_url": _upload_to_s3(output_tmp.name, key),
            "message": "Mastering completed",
        }
    except Exception as exc:
        return {
            "status": "failed",
            "provider": "ffmpeg",
            "audio_url": None,
            "message": str(exc),
        }
    finally:
        for path in (input_tmp.name, output_tmp.name):
            if os.path.exists(path):
                os.unlink(path)
