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


def compute_design_rubric(feats: dict) -> dict:
    craftsmanship = _clamp(
        100 * (0.6 * feats["sharpness"] + 0.4 * feats["edge_density"] * 3)
    )
    fit_proportions = _clamp(
        100 * (0.55 * feats["symmetry"] + 0.45 * feats["balance"])
    )
    material_selection = _clamp(
        100 * (0.5 * feats["color_diversity"] + 0.5 * feats["texture_variation"])
    )
    theme_cohesion = _clamp(100 * feats["top3_concentration"])

    # Functionality/wearability: score highest when contour count sits in a
    # "sensible garment" range — not near-blank, not chaotic noise.
    ideal_low, ideal_high = 25, 150
    cc = feats["contour_count"]
    if cc < ideal_low:
        wearability_raw = cc / ideal_low
    elif cc > ideal_high:
        wearability_raw = max(0.0, 1.0 - (cc - ideal_high) / ideal_high)
    else:
        wearability_raw = 1.0
    functionality_wearability = _clamp(100 * wearability_raw)

    scores = [craftsmanship, fit_proportions, material_selection, theme_cohesion, functionality_wearability]
    overall = round(sum(scores) / len(scores), 1)

    lines = [
        f"Craftsmanship and Construction: {round(craftsmanship, 1)}/100 — {_label(craftsmanship)}.",
        f"Fit and Proportions: {round(fit_proportions, 1)}/100 — {_label(fit_proportions)}.",
        f"Material Selection: {round(material_selection, 1)}/100 — {_label(material_selection)}.",
        f"Theme and Cohesion: {round(theme_cohesion, 1)}/100 — {_label(theme_cohesion)}.",
        f"Functionality and Wearability: {round(functionality_wearability, 1)}/100 — {_label(functionality_wearability)}.",
    ]

    return {
        "overall": overall,
        "breakdown_text": " ".join(lines),
    }
