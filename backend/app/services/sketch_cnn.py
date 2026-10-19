import torch
import torch.nn as nn
import os
import random

WEIGHTS_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "models", "sketch_net.pt")


class SketchQualityNet(nn.Module):
    """Small feedforward net that scores sketch technique quality from
    extracted visual features (edge density, line consistency, symmetry,
    composition balance). Separate model from the walk-analysis CNN."""

    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(4, 16)
        self.fc2 = nn.Linear(16, 8)
        self.fc3 = nn.Linear(8, 1)

    def forward(self, x):
        x = torch.relu(self.fc1(x))
        x = torch.relu(self.fc2(x))
        return torch.sigmoid(self.fc3(x))


_model = None


def _synthetic_dataset(n=400):
    X, y = [], []
    for _ in range(n):
        quality = random.uniform(0, 1)
        edge_density = 0.05 + quality * 0.15 + random.gauss(0, 0.03)
        line_variance = 0.6 - quality * 0.35 + random.gauss(0, 0.05)
        symmetry = 0.4 + quality * 0.5 + random.gauss(0, 0.05)
        balance = 0.5 + quality * 0.4 + random.gauss(0, 0.05)

        features = [
            max(0, min(1, edge_density)),
            max(0, min(1, line_variance)),
            max(0, min(1, symmetry)),
            max(0, min(1, balance)),
        ]
        X.append(features)
        y.append(quality)
    return X, y


def _train_and_save():
    model = SketchQualityNet()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.01)
    loss_fn = nn.MSELoss()

    X, y = _synthetic_dataset()
    X = torch.tensor(X, dtype=torch.float32)
    y = torch.tensor(y, dtype=torch.float32).unsqueeze(1)

    for _ in range(60):
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
    model = SketchQualityNet()
    if os.path.exists(WEIGHTS_PATH):
        model.load_state_dict(torch.load(WEIGHTS_PATH))
        _model = model
    else:
        _model = _train_and_save()
    _model.eval()
    return _model


def score_sketch(features: list[float]) -> float:
    model = get_model()
    x = torch.tensor([features], dtype=torch.float32)
    with torch.no_grad():
        pred = model(x).item()
    return round(pred * 100, 1)
