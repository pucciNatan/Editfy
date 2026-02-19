from typing import Iterable, Dict, Any, Tuple, Set, List

DEFAULT_WC = 0.6  # peso categorias
DEFAULT_WT = 0.4  # peso tags

def _to_set(xs: Iterable[str]) -> Set[str]:
    return set((x or "").strip().lower() for x in (xs or []) if str(x).strip())

def jaccard(a: Iterable[str], b: Iterable[str]) -> float:
    A, B = _to_set(a), _to_set(b)
    if not A and not B:
        return 0.0
    inter = len(A & B)
    union = len(A | B)
    return inter / union if union else 0.0

def score_categories(a_cats: Iterable[str], b_cats: Iterable[str]) -> float:
    return jaccard(a_cats, b_cats)

def score_tags(a_tags: Iterable[str], b_tags: Iterable[str]) -> float:
    return jaccard(a_tags, b_tags)

def combined_score(
    a_cats: Iterable[str], a_tags: Iterable[str],
    b_cats: Iterable[str], b_tags: Iterable[str],
    wc: float = DEFAULT_WC, wt: float = DEFAULT_WT
) -> float:
    sc = score_categories(a_cats, b_cats)
    st = score_tags(a_tags, b_tags)
    return wc * sc + wt * st

def build_editor_profile(portfolio, editor_videos_qs) -> Tuple[List[str], List[str]]:
    cats = list(portfolio.categories or [])
    # somar tags do portfolio + todas tags dos vídeos do editor
    tags = set(portfolio.tags or [])
    for v in editor_videos_qs:
        for t in (v.tags or []):
            tags.add(t)
    return (cats, sorted(tags))

def build_contractor_profile(portfolio, jobs_qs) -> Tuple[List[str], List[str]]:
    cats = list(portfolio.categories or [])
    tags = set(portfolio.tags or [])
    for j in jobs_qs:
        for t in (j.tags or []):
            tags.add(t)
    return (cats, sorted(tags))
