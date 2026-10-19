import statistics


def _clamp(v: float, lo: float = 40.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, v))


def _posture_score(feats: list[dict]) -> float:
    avg_shoulder_tilt = statistics.mean(f["shoulder_tilt"] for f in feats)
    avg_hip_tilt = statistics.mean(f["hip_tilt"] for f in feats)
    avg_spine = statistics.mean(f["spine_offset"] for f in feats)
    penalty = (avg_shoulder_tilt + avg_hip_tilt) * 50 + avg_spine * 50
    return round(_clamp(100 - penalty), 1)


def _stability_score(feats: list[dict]) -> float | None:
    if len(feats) < 3:
        return None
    hip_positions = [f["hip_center_x"] for f in feats]
    variance = statistics.pstdev(hip_positions)
    penalty = variance * 200
    return round(_clamp(100 - penalty), 1)


def _rhythm_score(feats: list[dict]) -> float | None:
    if len(feats) < 3:
        return None
    strides = [f["stride"] for f in feats]
    diffs = [abs(strides[i] - strides[i - 1]) for i in range(1, len(strides))]
    avg_jitter = statistics.mean(diffs) if diffs else 0
    penalty = avg_jitter * 150
    return round(_clamp(100 - penalty), 1)


def _stride_consistency_score(feats: list[dict]) -> float | None:
    if len(feats) < 3:
        return None
    strides = [f["stride"] for f in feats if f["stride"] > 0]
    if len(strides) < 2:
        return None
    variance = statistics.pstdev(strides)
    penalty = variance * 120
    return round(_clamp(100 - penalty), 1)


def _label(score: float) -> str:
    if score >= 85:
        return "excellent"
    elif score >= 70:
        return "good"
    elif score >= 55:
        return "developing"
    return "needs work"


def compute_rubric(feats: list[dict]) -> dict:
    posture = _posture_score(feats)
    stability = _stability_score(feats)
    rhythm = _rhythm_score(feats)
    stride_consistency = _stride_consistency_score(feats)

    scored = [s for s in [posture, stability, rhythm, stride_consistency] if s is not None]
    overall = round(sum(scored) / len(scored), 1)

    lines = [f"Posture: {posture}/100 — {_label(posture)}."]
    if stability is not None:
        lines.append(f"Stability: {stability}/100 — {_label(stability)}.")
    if rhythm is not None:
        lines.append(f"Rhythm: {rhythm}/100 — {_label(rhythm)}.")
    if stride_consistency is not None:
        lines.append(f"Stride consistency: {stride_consistency}/100 — {_label(stride_consistency)}.")

    return {
        "overall": overall,
        "posture": posture,
        "stability": stability,
        "rhythm": rhythm,
        "stride_consistency": stride_consistency,
        "breakdown_text": " ".join(lines),
    }
