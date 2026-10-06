"""Small, dependency-free TF-IDF + cosine similarity utilities."""

import math
import re
from collections import Counter

STOPWORDS = set(
    """a an and are as at be been but by can could did do does for from had has have he her his i if in into is it
    its me my no not of on or our she so such than that the their them then there these they this to too us was we
    were what when where which while who will with would you your yours about above after again against all am any
    because before being below between both down during each few further here how more most other out over own same
    should some through under until up very""".split()
)

_TOKEN = re.compile(r"[a-z0-9][a-z0-9+#.]*[a-z0-9+#]|[a-z0-9]")


def tokenize(text):
    return [t for t in _TOKEN.findall((text or "").lower()) if t not in STOPWORDS and len(t) > 1]


def _idf(docs_tokens):
    n = len(docs_tokens)
    df = Counter()
    for tokens in docs_tokens:
        df.update(set(tokens))
    return {term: math.log((1 + n) / (1 + count)) + 1 for term, count in df.items()}


def _vector(tokens, idf):
    tf = Counter(tokens)
    return {term: (1 + math.log(count)) * idf.get(term, 1.0) for term, count in tf.items()}


def _cosine(a, b):
    if not a or not b:
        return 0.0
    dot = sum(weight * b.get(term, 0.0) for term, weight in a.items())
    na = math.sqrt(sum(w * w for w in a.values()))
    nb = math.sqrt(sum(w * w for w in b.values()))
    return dot / (na * nb) if na and nb else 0.0


def similarity_to_many(query, documents):
    """Cosine similarity of `query` against each document, with IDF computed over the whole corpus."""
    q_tokens = tokenize(query)
    d_tokens = [tokenize(d) for d in documents]
    idf = _idf([q_tokens] + d_tokens)
    q_vec = _vector(q_tokens, idf)
    return [_cosine(q_vec, _vector(tokens, idf)) for tokens in d_tokens]


def similarity(a, b):
    return similarity_to_many(a, [b])[0]


def find_skills(text, skills):
    """Return (matched, missing) for a list of skill phrases, matched as whole words, case-insensitively."""
    haystack = (text or "").lower()
    matched, missing = [], []
    for skill in skills:
        s = skill.strip()
        if not s:
            continue
        pattern = r"(?<![a-z0-9])" + re.escape(s.lower()) + r"(?![a-z0-9])"
        (matched if re.search(pattern, haystack) else missing).append(s)
    return matched, missing
