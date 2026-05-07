import uuid
import boto3
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.config import settings
from app.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/uploads", tags=["uploads"])

ALLOWED_CONTENT_TYPES = {
    "audio/mpeg", "audio/wav", "audio/mp4", "audio/x-m4a", "audio/ogg", "audio/flac"
}
MAX_SIZE_BYTES = 50 * 1024 * 1024  # 50MB


class PresignedUrlRequest(BaseModel):
    filename: str
    content_type: str
    size_bytes: int = 0
    file_size_bytes: int = 0  # frontend alias

    @property
    def effective_size(self) -> int:
        return self.size_bytes or self.file_size_bytes


class PresignedUrlResponse(BaseModel):
    upload_url: str
    audio_url: str
    key: str


@router.post("/presign", response_model=PresignedUrlResponse)
@router.post("/presigned-url", response_model=PresignedUrlResponse)
def get_presigned_url(
    body: PresignedUrlRequest,
    current_user: User = Depends(get_current_user),
):
    if body.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported audio format")
    if body.effective_size <= 0:
        raise HTTPException(status_code=400, detail="File size must be greater than 0")
    if body.effective_size > MAX_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="File too large (max 50MB)")

    ext = body.filename.rsplit(".", 1)[-1] if "." in body.filename else "mp3"
    key = f"audio/{current_user.id}/{uuid.uuid4()}.{ext}"

    s3 = boto3.client("s3", region_name=settings.aws_region)
    upload_url = s3.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": settings.s3_bucket,
            "Key": key,
            "ContentType": body.content_type,
        },
        ExpiresIn=300,
    )

    audio_url = f"https://{settings.s3_bucket}.s3.{settings.aws_region}.amazonaws.com/{key}"
    return PresignedUrlResponse(upload_url=upload_url, audio_url=audio_url, key=key)


class VerifyUploadRequest(BaseModel):
    key: str


@router.post("/verify")
def verify_upload(
    body: VerifyUploadRequest,
    current_user: User = Depends(get_current_user),
):
    """클라이언트 업로드 완료 후 S3 HEAD로 실제 파일 존재·크기·타입 검증."""
    # key는 반드시 해당 사용자 소유여야 함
    if not body.key.startswith(f"audio/{current_user.id}/"):
        raise HTTPException(status_code=403, detail="Forbidden")

    s3 = boto3.client("s3", region_name=settings.aws_region)
    try:
        head = s3.head_object(Bucket=settings.s3_bucket, Key=body.key)
    except s3.exceptions.ClientError:
        raise HTTPException(status_code=404, detail="File not found in storage")
    except Exception:
        raise HTTPException(status_code=404, detail="File not found in storage")

    actual_size = head.get("ContentLength", 0)
    actual_type = head.get("ContentType", "")

    if actual_size <= 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
    if actual_size > MAX_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="File too large (max 50MB)")
    if actual_type not in ALLOWED_CONTENT_TYPES and not actual_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="Invalid audio content type")

    return {"verified": True, "size_bytes": actual_size, "content_type": actual_type}
