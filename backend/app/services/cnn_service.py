import torch
import torch.nn as nn
import os
import random

FEATURE_DIM = 4
SEQ_LEN = 8
WEIGHTS_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "models", "walk_cnn.pt")


class WalkQualityCNN(nn.Module):
    """1D CNN that reads a sequence of pose-feature vectors across time
    and scores walk stability/rhythm. Distinct from YOLO's spatial CNN —
    this one analyzes the temporal pattern across frames."""

    def __init__(self):
        super().__init__()
        self.conv1 = nn.Conv1d(FEATURE_DIM, 16, kernel_size=3, padding=1)
        self.conv2 = nn.Conv1d(16, 32, kernel_size=3, padding=1)
        self.pool = nn.AdaptiveAvgPool1d(1)
        self.fc = nn.Linear(32, 1)

    def forward(self, x):  # x: (batch, FEATURE_DIM, SEQ_LEN)
        x = torch.relu(self.conv1(x))
        x = torch.relu(self.conv2(x))
        x = self.pool(x).squeeze(-1)
        return torch.sigmoid(self.fc(x))  # 0-1


_model = None


def _synthetic_dataset(n=300):
    X, y = [], []
    for _ in range(n):
        instability = random.uniform(0, 1)
        seq = []
        for _ in range(SEQ_LEN):
            noise = 0.05 + instability * 0.5
            seq.append([
                abs(random.gauss(0, noise)),
                abs(random.gauss(0, noise)),
                abs(random.gauss(0, noise)),
                abs(random.gauss(0.3, noise)),
            ])
        X.append(seq)
        y.append(max(0.0, 1.0 - instability))
    return X, y


def _train_and_save():
    model = WalkQualityCNN()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.01)
    loss_fn = nn.MSELoss()

    X, y = _synthetic_dataset()
    X = torch.tensor(X, dtype=torch.float32).permute(0, 2, 1)
    y = torch.tensor(y, dtype=torch.float32).unsqueeze(1)

    for _ in range(40):
        optimizer.zero_grad()
        loss = loss_fn(model(X), y)
        loss.backward()
        optimizer.step()

    os.makedirs(os.path.dirname(WEIGHTS_PATH), exist_ok=True)
    torch.save(model.state_dict(), WEIGHTS_PATH)
    return model


def get_model():
    global _model
    if _model is not None:
        return _model
    model = WalkQualityCNN()
    if os.path.exists(WEIGHTS_PATH):
        model.load_state_dict(torch.load(WEIGHTS_PATH))
        _model = model
    else:
        _model = _train_and_save()
    _model.eval()
    return _model


def score_walk_sequence(feature_sequence: list[list[float]]) -> float:
    if not feature_sequence:
        return 50.0

    seq = feature_sequence[:SEQ_LEN]
    while len(seq) < SEQ_LEN:
        seq.append(seq[-1])

    model = get_model()
    x = torch.tensor([seq], dtype=torch.float32).permute(0, 2, 1)
    with torch.no_grad():
        pred = model(x).item()
    return round(pred * 100, 1)
