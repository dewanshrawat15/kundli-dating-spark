"""
Vedic astrology computation using pyswisseph.

Computes:
  - Rashi (moon sign), Lagna (ascendant), Nakshatra
  - All 9 planet positions (Navagraha)
  - Manglik Dosha
  - Koot values for Ashtakoot Guna Milan

Reference system: Lahiri ayanamsa (standard in Indian Jyotish)
"""

from __future__ import annotations
import swisseph as swe
from datetime import datetime, date, time
from typing import Optional
from timezonefinder import TimezoneFinder
import pytz

# ── Constants ────────────────────────────────────────────────────────────────

RASHIS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
]

NAKSHATRAS = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
    "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
    "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishtha",
    "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
]

# Nakshatra → Gana (0-indexed)
NAKSHATRA_GANA = [
    "deva", "manushya", "rakshasa",  # 1-3
    "manushya", "manushya", "manushya",  # 4-6 (Rohini=manushya, Mrigashira=manushya, Ardra=manushya)
    "deva", "deva", "rakshasa",      # 7-9
    "rakshasa", "manushya", "manushya",  # 10-12
    "deva", "rakshasa", "deva",      # 13-15
    "rakshasa", "deva", "rakshasa",  # 16-18
    "rakshasa", "manushya", "manushya",  # 19-21
    "deva", "rakshasa", "rakshasa",  # 22-24
    "manushya", "deva", "deva",      # 25-27
]

# Nakshatra → Yoni (animal symbol) — index 0-26
NAKSHATRA_YONI = [
    "horse", "elephant", "goat", "serpent", "serpent", "dog",
    "cat", "goat", "cat", "rat", "rat", "cow",
    "buffalo", "tiger", "buffalo", "tiger", "deer", "deer",
    "dog", "monkey", "mongoose", "monkey", "lion", "horse",
    "lion", "cow", "elephant",
]

# Yoni compatibility table: compatible pairs score 4, same gender reduces, enemies 0
YONI_COMPATIBLE_PAIRS = {
    frozenset({"horse", "horse"}),
    frozenset({"elephant", "elephant"}),
    frozenset({"goat", "goat"}),
    frozenset({"serpent", "serpent"}),
    frozenset({"dog", "dog"}),
    frozenset({"cat", "cat"}),
    frozenset({"rat", "rat"}),
    frozenset({"cow", "cow"}),
    frozenset({"buffalo", "buffalo"}),
    frozenset({"tiger", "tiger"}),
    frozenset({"deer", "deer"}),
    frozenset({"monkey", "monkey"}),
    frozenset({"lion", "lion"}),
    frozenset({"mongoose", "mongoose"}),
}

# Rashi → Varna (0-indexed)
RASHI_VARNA = [
    "kshatriya",  # Aries
    "shudra",     # Taurus
    "shudra",     # Gemini
    "brahmin",    # Cancer
    "kshatriya",  # Leo
    "vaishya",    # Virgo
    "shudra",     # Libra
    "brahmin",    # Scorpio
    "kshatriya",  # Sagittarius
    "vaishya",    # Capricorn
    "shudra",     # Aquarius
    "brahmin",    # Pisces
]

VARNA_ORDER = {"brahmin": 4, "kshatriya": 3, "vaishya": 2, "shudra": 1}

# Nakshatra → Nadi (0-indexed): 0=aadi, 1=madhya, 2=antya
NAKSHATRA_NADI = [
    0, 1, 2, 0, 1, 2, 0, 1, 2,  # 1-9
    0, 1, 2, 0, 1, 2, 0, 1, 2,  # 10-18
    0, 1, 2, 0, 1, 2, 0, 1, 2,  # 19-27
]
NADI_NAMES = ["aadi", "madhya", "antya"]

# Rashi lords
RASHI_LORD = [
    "mars",    # Aries
    "venus",   # Taurus
    "mercury", # Gemini
    "moon",    # Cancer
    "sun",     # Leo
    "mercury", # Virgo
    "venus",   # Libra
    "mars",    # Scorpio
    "jupiter", # Sagittarius
    "saturn",  # Capricorn
    "saturn",  # Aquarius
    "jupiter", # Pisces
]

# Planetary friendship table (simplified: friend/neutral/enemy)
PLANET_FRIENDS = {
    "sun":     {"friends": ["moon", "mars", "jupiter"], "enemies": ["venus", "saturn"], "neutral": ["mercury"]},
    "moon":    {"friends": ["sun", "mercury"], "enemies": [], "neutral": ["mars", "jupiter", "venus", "saturn"]},
    "mars":    {"friends": ["sun", "moon", "jupiter"], "enemies": ["mercury"], "neutral": ["venus", "saturn"]},
    "mercury": {"friends": ["sun", "venus"], "enemies": ["moon"], "neutral": ["mars", "jupiter", "saturn"]},
    "jupiter": {"friends": ["sun", "moon", "mars"], "enemies": ["mercury", "venus"], "neutral": ["saturn"]},
    "venus":   {"friends": ["mercury", "saturn"], "enemies": ["sun", "moon"], "neutral": ["mars", "jupiter"]},
    "saturn":  {"friends": ["mercury", "venus"], "enemies": ["sun", "moon", "mars"], "neutral": ["jupiter"]},
}

# SwissEph planet IDs
SE_PLANETS = {
    "sun": swe.SUN,
    "moon": swe.MOON,
    "mars": swe.MARS,
    "mercury": swe.MERCURY,
    "jupiter": swe.JUPITER,
    "venus": swe.VENUS,
    "saturn": swe.SATURN,
    "rahu": swe.MEAN_NODE,  # North node (Rahu)
}


# ── Core computation ──────────────────────────────────────────────────────────

def compute_birth_chart(
    dob: date,
    tob: time,
    lat: float,
    lng: float,
) -> dict:
    """
    Compute a full Vedic birth chart for the given birth details.
    Returns a dict with all chart data needed for Ashtakoot matching.
    """
    swe.set_sid_mode(swe.SIDM_LAHIRI)  # Lahiri ayanamsa

    # Convert local birth time to Julian Day (UT)
    tz_name = _get_timezone(lat, lng)
    tz = pytz.timezone(tz_name)
    local_dt = tz.localize(datetime(dob.year, dob.month, dob.day, tob.hour, tob.minute, tob.second))
    utc_dt = local_dt.astimezone(pytz.utc)

    jd = swe.julday(utc_dt.year, utc_dt.month, utc_dt.day,
                    utc_dt.hour + utc_dt.minute / 60.0 + utc_dt.second / 3600.0)

    # Compute all planet positions (sidereal)
    positions = {}
    for name, planet_id in SE_PLANETS.items():
        flags = swe.FLG_SIDEREAL | swe.FLG_SPEED
        result, _ = swe.calc_ut(jd, planet_id, flags)
        lon = result[0] % 360
        rashi_idx = int(lon // 30)  # 0-indexed rashi
        degree_in_rashi = lon % 30
        house = _get_house(lon, jd, lat, lng)
        positions[name] = {
            "longitude": round(lon, 4),
            "rashi": rashi_idx + 1,  # 1-indexed
            "rashi_name": RASHIS[rashi_idx],
            "degree": round(degree_in_rashi, 4),
            "house": house,
        }

    # Ketu (South Node) = Rahu + 180°
    rahu_lon = positions["rahu"]["longitude"]
    ketu_lon = (rahu_lon + 180) % 360
    ketu_rashi_idx = int(ketu_lon // 30)
    positions["ketu"] = {
        "longitude": round(ketu_lon, 4),
        "rashi": ketu_rashi_idx + 1,
        "rashi_name": RASHIS[ketu_rashi_idx],
        "degree": round(ketu_lon % 30, 4),
        "house": _get_house(ketu_lon, jd, lat, lng),
    }

    # Ascendant (Lagna)
    cusps, ascmc = swe.houses_ex(jd, lat, lng, b"P", swe.FLG_SIDEREAL)
    lagna_lon = ascmc[0] % 360
    lagna_rashi_idx = int(lagna_lon // 30)

    # Moon sign (Rashi)
    moon_lon = positions["moon"]["longitude"]
    moon_rashi_idx = int(moon_lon // 30)

    # Nakshatra (from moon longitude)
    # Each nakshatra spans 360/27 ≈ 13.333°
    nakshatra_idx = int(moon_lon / (360 / 27))  # 0-indexed
    nakshatra_pada = int((moon_lon % (360 / 27)) / (360 / 108)) + 1  # 1–4

    # Manglik Dosha: Mars in houses 1, 4, 7, 8, or 12
    mars_house = positions["mars"]["house"]
    is_manglik = mars_house in (1, 4, 7, 8, 12)
    if mars_house in (1, 7, 8):
        manglik_intensity = "full"
    elif mars_house in (4, 12):
        manglik_intensity = "partial"
    else:
        manglik_intensity = "none"

    # Koot values
    nadi_idx = NAKSHATRA_NADI[nakshatra_idx]

    return {
        "rashi": moon_rashi_idx + 1,
        "rashi_name": RASHIS[moon_rashi_idx],
        "lagna": lagna_rashi_idx + 1,
        "lagna_name": RASHIS[lagna_rashi_idx],
        "nakshatra": nakshatra_idx + 1,
        "nakshatra_name": NAKSHATRAS[nakshatra_idx],
        "nakshatra_pada": nakshatra_pada,
        "gana": NAKSHATRA_GANA[nakshatra_idx],
        "yoni": NAKSHATRA_YONI[nakshatra_idx],
        "varna": RASHI_VARNA[moon_rashi_idx],
        "nadi": NADI_NAMES[nadi_idx],
        "bhakoot": moon_rashi_idx + 1,
        "is_manglik": is_manglik,
        "manglik_intensity": manglik_intensity,
        "planetary_positions": positions,
    }


def _get_timezone(lat: float, lng: float) -> str:
    tf = TimezoneFinder()
    tz = tf.timezone_at(lat=lat, lng=lng)
    return tz or "Asia/Kolkata"


def _get_house(longitude: float, jd: float, lat: float, lng: float) -> int:
    """Return house number (1–12) for a given sidereal longitude."""
    cusps, ascmc = swe.houses_ex(jd, lat, lng, b"P", swe.FLG_SIDEREAL)
    for i in range(12):
        start = cusps[i] % 360
        end = cusps[(i + 1) % 12] % 360
        lon = longitude % 360
        if start < end:
            if start <= lon < end:
                return i + 1
        else:  # wraps around 0°
            if lon >= start or lon < end:
                return i + 1
    return 1


# ── Ashtakoot Guna Milan ──────────────────────────────────────────────────────

def compute_ashtakoot(chart_a: dict, chart_b: dict) -> dict:
    """
    Compute all 8 Koot scores between two birth charts.
    Returns individual scores and total (max 36).
    """
    scores = {}

    # 1. Varna Koot (max 1) — bride's varna should be <= groom's varna
    varna_a = VARNA_ORDER.get(chart_a["varna"], 1)
    varna_b = VARNA_ORDER.get(chart_b["varna"], 1)
    scores["varna"] = 1 if varna_b >= varna_a else 0

    # 2. Vasya Koot (max 2)
    scores["vasya"] = _vasya_score(chart_a["rashi"], chart_b["rashi"])

    # 3. Tara Koot (max 3)
    scores["tara"] = _tara_score(chart_a["nakshatra"], chart_b["nakshatra"])

    # 4. Yoni Koot (max 4)
    scores["yoni"] = _yoni_score(chart_a["yoni"], chart_b["yoni"])

    # 5. Graha Maitri Koot (max 5) — friendship between rashi lords
    scores["graha_maitri"] = _graha_maitri_score(chart_a["rashi"], chart_b["rashi"])

    # 6. Gana Koot (max 6)
    scores["gana"] = _gana_score(chart_a["gana"], chart_b["gana"])

    # 7. Bhakoot Koot (max 7) — rashi distance
    scores["bhakoot"] = _bhakoot_score(chart_a["bhakoot"], chart_b["bhakoot"])

    # 8. Nadi Koot (max 8) — must be different nadi
    scores["nadi"] = 8 if chart_a["nadi"] != chart_b["nadi"] else 0

    scores["total"] = sum(scores[k] for k in ["varna", "vasya", "tara", "yoni", "graha_maitri", "gana", "bhakoot", "nadi"])
    return scores


def _vasya_score(rashi_a: int, rashi_b: int) -> int:
    # Vasya groups: same group = 2, one controls other = 1, else = 0
    VASYA_GROUPS = {
        "chatushpad": {1, 4, 9, 10},  # Aries, Cancer, Sag, Cap
        "manav": {2, 3, 6, 7, 11},   # Taurus, Gemini, Virgo, Libra, Aquarius
        "jalchar": {4, 8, 12},        # Cancer, Scorpio, Pisces (partial overlap)
        "vanchar": {5},               # Leo
        "keeta": {8},                 # Scorpio
    }
    # Simplified: same rashi = 2, rashis 2 apart = 1, else = 0
    diff = abs(rashi_a - rashi_b)
    diff = min(diff, 12 - diff)
    if diff == 0:
        return 2
    elif diff <= 2:
        return 1
    return 0


def _tara_score(nak_a: int, nak_b: int) -> int:
    # Count nakshatras from bride's to groom's (mod 9)
    # Taras 1,3,5,7 = favorable (score 3); 2,4,6,8,9 = unfavorable (score 0)
    count = ((nak_b - nak_a) % 27) + 1
    tara = ((count - 1) % 9) + 1
    return 3 if tara in (1, 3, 5, 7) else 0


def _yoni_score(yoni_a: str, yoni_b: str) -> int:
    pair = frozenset({yoni_a, yoni_b})
    if yoni_a == yoni_b:
        return 4
    if pair in YONI_COMPATIBLE_PAIRS:
        return 3
    # Enemy yoni pairs (simplified — hostile pairs)
    ENEMY_PAIRS = {
        frozenset({"horse", "buffalo"}),
        frozenset({"elephant", "lion"}),
        frozenset({"goat", "monkey"}),
        frozenset({"dog", "deer"}),
        frozenset({"serpent", "mongoose"}),
        frozenset({"cat", "rat"}),
        frozenset({"cow", "tiger"}),
    }
    if pair in ENEMY_PAIRS:
        return 0
    return 2


def _graha_maitri_score(rashi_a: int, rashi_b: int) -> int:
    lord_a = RASHI_LORD[rashi_a - 1]
    lord_b = RASHI_LORD[rashi_b - 1]
    if lord_a == lord_b:
        return 5
    a_to_b = _planet_relationship(lord_a, lord_b)
    b_to_a = _planet_relationship(lord_b, lord_a)
    score_map = {
        ("friend", "friend"): 5,
        ("friend", "neutral"): 4,
        ("neutral", "friend"): 4,
        ("neutral", "neutral"): 3,
        ("friend", "enemy"): 1,
        ("enemy", "friend"): 1,
        ("neutral", "enemy"): 0,
        ("enemy", "neutral"): 0,
        ("enemy", "enemy"): 0,
    }
    return score_map.get((a_to_b, b_to_a), 3)


def _planet_relationship(planet_a: str, planet_b: str) -> str:
    friends = PLANET_FRIENDS.get(planet_a, {})
    if planet_b in friends.get("friends", []):
        return "friend"
    if planet_b in friends.get("enemies", []):
        return "enemy"
    return "neutral"


def _gana_score(gana_a: str, gana_b: str) -> int:
    matrix = {
        ("deva", "deva"): 6,
        ("deva", "manushya"): 5,
        ("deva", "rakshasa"): 1,
        ("manushya", "deva"): 5,
        ("manushya", "manushya"): 6,
        ("manushya", "rakshasa"): 0,
        ("rakshasa", "deva"): 1,
        ("rakshasa", "manushya"): 0,
        ("rakshasa", "rakshasa"): 6,
    }
    return matrix.get((gana_a, gana_b), 0)


def _bhakoot_score(rashi_a: int, rashi_b: int) -> int:
    # Inauspicious distances: 6/8, 9/5, 12/2 (from rashi_a to rashi_b and vice versa)
    diff = ((rashi_b - rashi_a) % 12) or 12  # 1–12
    reverse = 12 - diff + 1 if diff != 1 else 12
    inauspicious = {(6, 8), (8, 6), (9, 5), (5, 9), (12, 2), (2, 12)}
    if (diff, reverse) in inauspicious or (reverse, diff) in inauspicious:
        return 0
    return 7
