from typing import Optional


def calculate_points(
    pred_a: int, pred_b: int,
    real_a: int, real_b: int
) -> int:
    """
    +3 → exact score match
    +1 → correct outcome (win/draw/loss) but wrong score
     0 → wrong outcome
    """
    if pred_a == real_a and pred_b == real_b:
        return 3

    pred_outcome = _outcome(pred_a, pred_b)
    real_outcome = _outcome(real_a, real_b)

    return 1 if pred_outcome == real_outcome else 0


def _outcome(a: int, b: int) -> str:
    if a > b:
        return "A"
    if b > a:
        return "B"
    return "D"