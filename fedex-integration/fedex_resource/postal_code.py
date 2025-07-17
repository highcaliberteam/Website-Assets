import pgeocode


def get_state_data(postal_code: str) -> tuple:
    country = pgeocode.Nominatim('us')
    data = country.query_postal_code(postal_code)
    return data['state_code'], data['place_name']
