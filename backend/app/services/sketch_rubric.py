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


def compute_sketch_rubric(features: list[float]) -> dict:
    edge_density, line_variance, symmetry, balance = features

    line_quality = _clamp(100 * (1.0 - min(line_variance, 1.0)))
    proportion_accuracy = _clamp(100 * symmetry)
    composition = _clamp(100 * balance)
    detail_rendering = _clamp(100 * min(edge_density * 6, 1.0))
    technical_confidence = _clamp(100 * (0.5 * (1.0 - min(line_variance, 1.0)) + 0.5 * symmetry))

    scores = [line_quality, proportion_accuracy, composition, detail_rendering, technical_confidence]
    overall = round(sum(scores) / len(scores), 1)

    lines = [
        f"Line Quality: {round(line_quality, 1)}/100 — {_label(line_quality)}.",
        f"Proportion Accuracy: {round(proportion_accuracy, 1)}/100 — {_label(proportion_accuracy)}.",
        f"Composition: {round(composition, 1)}/100 — {_label(composition)}.",
        f"Detail and Rendering: {round(detail_rendering, 1)}/100 — {_label(detail_rendering)}.",
        f"Technical Confidence: {round(technical_confidence, 1)}/100 — {_label(technical_confidence)}.",
    ]

    return {"overall": overall, "breakdown_text": " ".join(lines)}
