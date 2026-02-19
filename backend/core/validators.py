# backend/core/validators.py
import re
import unicodedata
from typing import Iterable, List, Set
from .constants import (
    CATEGORIES_CHOICES, MAX_CATEGORIES_PER_PORTFOLIO,
    MAX_TAGS, MAX_TAG_LEN
)

_ALLOWED = set(CATEGORIES_CHOICES)
_non_alnum_space = re.compile(r"[^a-z0-9 ]+")

def _strip_accents(s: str) -> str:
    # Remove diacríticos (ação -> acao)
    return unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode("ascii")

def normalize_tags(raw: Iterable[str]) -> List[str]:
    """
    Normalização canônica:
    - lower()
    - remove acentos
    - troca tudo que não for [a-z0-9 ou espaço] por espaço
    - colapsa múltiplos espaços
    - trim, corta em MAX_TAG_LEN
    - deduplica mantendo ordem
    - limita a MAX_TAGS
    """
    seen: Set[str] = set()
    out: List[str] = []
    for t in raw or []:
        if t is None:
            continue
        t = str(t).lower().strip()
        t = _strip_accents(t)
        t = _non_alnum_space.sub(" ", t)
        t = re.sub(r"\s+", " ", t).strip()
        if not t:
            continue
        if len(t) > MAX_TAG_LEN:
            t = t[:MAX_TAG_LEN]
        if t not in seen:
            seen.add(t)
            out.append(t)
            if len(out) >= MAX_TAGS:
                break
    return out

def validate_categories(raw: Iterable[str]) -> List[str]:
    clean = []
    for c in (raw or []):
        c = str(c).strip().lower()
        if c and c in _ALLOWED:
            clean.append(c)
    # dedup preservando ordem
    dedup = []
    seen = set()
    for c in clean:
        if c not in seen:
            seen.add(c)
            dedup.append(c)
    return dedup[:MAX_CATEGORIES_PER_PORTFOLIO]
