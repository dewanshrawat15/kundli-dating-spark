from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut


def geocode_place(place_name: str) -> tuple[float, float] | None:
    """Return (latitude, longitude) for a place name, or None if not found."""
    try:
        geolocator = Nominatim(user_agent="kundli-dating/1.0")
        location = geolocator.geocode(place_name, timeout=10)
        if location:
            return float(location.latitude), float(location.longitude)
    except GeocoderTimedOut:
        pass
    return None
