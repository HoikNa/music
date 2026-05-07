"""실제 오디오 분석 — librosa 기반 5축 채점."""
import os
import tempfile
import time
from urllib.parse import urlparse

import boto3
import librosa
import numpy as np


def _download_from_s3(audio_url: str, dest_path: str) -> None:
    parsed = urlparse(audio_url)
    # https://{bucket}.s3.{region}.amazonaws.com/{key}
    bucket = parsed.netloc.split(".")[0]
    key = parsed.path.lstrip("/")
    boto3.client("s3").download_file(bucket, key, dest_path)


def _score_pitch(f0: np.ndarray, voiced_flag: np.ndarray) -> float:
    voiced = f0[voiced_flag]
    if len(voiced) < 20:
        return 14.0
    midi = librosa.hz_to_midi(voiced)
    deviation = np.abs(midi - np.round(midi))  # 0~0.5 semitone
    stable_ratio = float(np.mean(deviation < 0.25))
    return round(min(20.0, max(10.0, 10.0 + stable_ratio * 10.0)), 1)


def _score_rhythm(y: np.ndarray, sr: int) -> float:
    _, beats = librosa.beat.beat_track(y=y, sr=sr)
    if len(beats) < 4:
        return 14.0
    ibi = np.diff(beats.astype(float))
    cv = float(np.std(ibi) / (np.mean(ibi) + 1e-6))
    return round(min(20.0, max(10.0, 20.0 - cv * 15.0)), 1)


def _score_range(f0: np.ndarray, voiced_flag: np.ndarray) -> float:
    voiced = f0[voiced_flag]
    if len(voiced) < 20:
        return 14.0
    midi = librosa.hz_to_midi(voiced)
    semitone_range = float(np.percentile(midi, 95) - np.percentile(midi, 5))
    # 12 반음(1옥타브) → 12pt, 24 반음(2옥타브) → 18pt, 30+ → 20pt
    return round(min(20.0, max(10.0, 10.0 + semitone_range * 0.4)), 1)


def _score_dynamic(y: np.ndarray, sr: int) -> float:
    frame_len = int(sr * 0.05)
    hop = frame_len // 2
    rms = librosa.feature.rms(y=y, frame_length=frame_len, hop_length=hop)[0]
    rms_db = librosa.amplitude_to_db(rms + 1e-9)
    dyn_range = float(np.percentile(rms_db, 95) - np.percentile(rms_db, 5))
    # 10dB → 12pt, 20dB → 16pt, 30dB → 20pt
    return round(min(20.0, max(10.0, 10.0 + dyn_range * 0.35)), 1)


def _score_articulation(y: np.ndarray, sr: int) -> float:
    onset_env = librosa.onset.onset_strength(y=y, sr=sr)
    zcr = librosa.feature.zero_crossing_rate(y)[0]
    onset_var = float(np.std(onset_env) / (np.mean(onset_env) + 1e-6))
    zcr_mean = float(np.mean(zcr))
    combined = onset_var * 0.6 + min(1.0, zcr_mean * 20) * 0.4
    return round(min(20.0, max(10.0, 10.0 + combined * 8.0)), 1)


def analyze(audio_url: str) -> dict[str, float]:
    """
    S3 URL에서 오디오를 내려받아 5축 점수를 반환한다 (각 0~20).
    분석 실패 시 None을 반환하지 않고 예외를 그대로 올린다.
    """
    suffix = "." + audio_url.rsplit(".", 1)[-1] if "." in audio_url else ".mp3"
    tmp = tempfile.NamedTemporaryFile(suffix=suffix, dir="/tmp", delete=False)
    tmp.close()
    try:
        _download_from_s3(audio_url, tmp.name)
        t0 = time.time()

        duration = librosa.get_duration(path=tmp.name)
        # 90초 구간 — 너무 길면 전반부 건너뜀
        offset = max(0.0, (duration - 90.0) / 2.0)
        analysis_dur = min(90.0, duration)

        y, sr = librosa.load(
            tmp.name, sr=22050, offset=offset, duration=analysis_dur, mono=True
        )

        # pyin은 voiced/unvoiced를 더 정밀하게 분리
        f0, voiced_flag, _ = librosa.pyin(
            y,
            fmin=float(librosa.note_to_hz("C2")),
            fmax=float(librosa.note_to_hz("C7")),
            sr=sr,
            frame_length=2048,
        )

        scores = {
            "pitch": _score_pitch(f0, voiced_flag),
            "rhythm": _score_rhythm(y, sr),
            "range": _score_range(f0, voiced_flag),
            "dynamic": _score_dynamic(y, sr),
            "articulation": _score_articulation(y, sr),
            "_processing_sec": round(time.time() - t0),
        }
        return scores
    finally:
        os.unlink(tmp.name)
