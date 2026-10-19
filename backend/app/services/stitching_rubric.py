def _clamp(v: float, lo: float = 40.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, v))


def _label(score: float) -> str:
    if score >= 85:
        return "excellent"
    elif score >= 70:
        return "good"
    elif score >= 55:
        return "developing"
    return "needs work"


def compute_stitching_rubric(features: list[float]) -> dict:
    sharpness, line_straightness, uniformity, repetition = features

    stitch_precision = _clamp(100 * line_straightness)
    seam_sharpness = _clamp(100 * sharpness)
    fabric_consistency = _clamp(100 * uniformity)
    pattern_alignment = _clamp(100 * repetition)

    scores = [stitch_precision, seam_sharpness, fabric_consistency, pattern_alignment]
    overall = round(sum(scores) / len(scores), 1)

    lines = [
        f"Stitch Precision: {round(stitch_precision, 1)}/100 — {_label(stitch_precision)}.",
        f"Seam Sharpness: {round(seam_sharpness, 1)}/100 — {_label(seam_sharpness)}.",
        f"Fabric Consistency: {round(fabric_consistency, 1)}/100 — {_label(fabric_consistency)}.",
        f"Pattern Alignment: {round(pattern_alignment, 1)}/100 — {_label(pattern_alignment)}.",
    ]

    return {"overall": overall, "breakdown_text": " ".join(lines)}
