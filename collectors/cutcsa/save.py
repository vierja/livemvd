from .fetch import get_all_locations
from ..persistence import save
from retry import retry

WORKERS = 2

@retry(delay=1, backoff=2, max_delay=10)
def locations():
    try:
        for location in get_all_locations(WORKERS):
            save(location, 'cutcsa_locations')
    except Exception as e:
        print('Error with locations: {}'.format(e))
        import traceback
        traceback.print_exc()
        raise e


def info():
    return [
        locations
    ]
