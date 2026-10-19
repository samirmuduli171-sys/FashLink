def extract_features(keypoints_per_frame: list) -> list[dict]:
    features = []
    for kp in keypoints_per_frame:
        try:
            l_sh, r_sh = kp[5], kp[6]
            l_hip, r_hip = kp[11], kp[12]
            l_ank, r_ank = kp[15], kp[16]
        except IndexError:
            continue

        if any(p[0] == 0 and p[1] == 0 for p in [l_sh, r_sh, l_hip, r_hip]):
            continue

        shoulder_width = abs(l_sh[0] - r_sh[0]) or 1.0
        hip_width = abs(l_hip[0] - r_hip[0]) or 1.0

        shoulder_tilt = abs(l_sh[1] - r_sh[1]) / shoulder_width
        hip_tilt = abs(l_hip[1] - r_hip[1]) / hip_width
        hip_center_x = (l_hip[0] + r_hip[0]) / 2 / shoulder_width
        spine_offset = abs(
            (l_sh[0] + r_sh[0]) / 2 - (l_hip[0] + r_hip[0]) / 2
        ) / shoulder_width

        stride = 0.0
        if not (l_ank[0] == 0 and l_ank[1] == 0) and not (r_ank[0] == 0 and r_ank[1] == 0):
            stride = abs(l_ank[0] - r_ank[0]) / shoulder_width

        features.append({
            "shoulder_tilt": shoulder_tilt,
            "hip_tilt": hip_tilt,
            "spine_offset": spine_offset,
            "hip_center_x": hip_center_x,
            "stride": stride,
        })

    return features
