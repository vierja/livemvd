from .fetch import get_all_locations


def info():
    return [
        {
            'source': lambda: get_all_locations(5),
            'frequency': 0,
            'table': 'cutcsa_locations',
        }
    ]
