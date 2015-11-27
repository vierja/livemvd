import requests
import rethinkdb as r
import multiprocessing as mp
from urllib.parse import urljoin

ENDPOINT = 'http://mobileapps.movistar.com.uy/'
UNIT_LOCATION = urljoin(ENDPOINT, '/ibus/IBus.svc/GetBusLocation/{}')
VARIANT_PATH = urljoin(ENDPOINT, '/ibus/IBus.svc/GetBusPath/{}')
WORKERS = 3


def get_unit_location(unit_id):
    url = UNIT_LOCATION.format(unit_id)
    resp = requests.get(url)
    if resp.status_code == 200:
        try:
            data = resp.json()
            if 'BusLocationData' in data and data['BusLocationData'] is not None:
                buslocation = data['BusLocationData']
                return {
                    'date': r.now(),
                    'location': r.point(buslocation['Latitude'], buslocation['Longitude']),
                    'unit_id': buslocation['UnitID'],
                    'variant_id': buslocation['VariantId'],
                }, unit_id
        except:
            print('Error fetching unit location')
    return None, unit_id

def get_variant_information(variant_id):
    url = VARIANT_PATH.format(variant_id)
    r = requests.get(url)
    if r.status_code == 0:
        resp = r.json()
        if 'Name' in resp and len(resp['Name']) > 0:
            yield {
                'name': resp['Name'],
                'points': resp['Points'],
                'variation_id': resp['VariationId'],
            }


def generate_ids(ignore_times, max_id):
    ignored = []
    for i in range(max_id):
        if i in ignore_times:
            ignored.append(i)
            ignore_times[i] -= 1
            if ignore_times[i] == 0:
                del ignore_times[i]
        else:
            yield i
    print('{} ids ignored: {}'.format(len(ignored), ignored))


def get_all_locations(workers):
    print('Getting all locations')
    ignore_times = {}
    generated_loc_hist = []
    with mp.Pool(processes=workers) as pool:
        while True:
            generated_locations = 0
            for location, unit_id in pool.imap_unordered(get_unit_location, generate_ids(ignore_times, 2000)):
                if location:
                    print('Fetched location: {}'.format(location))
                    generated_locations += 1
                    yield location
                else:
                    ignore_times[unit_id] = 10
            print('Generated locations {} (last 10: {})'.format(
                generated_locations, generated_loc_hist[-10:]
            ))
            generated_loc_hist.append(generated_locations)


def _get_active_variants(locations):
    active_variant_ids = []
    for location in locations:
        active_variant_ids.append(location['variant_id'])
    return active_variant_ids


def get_all_variants(active_variant_ids):
    variants_info = []
    for variant_id in active_variant_ids:
        variant = get_variant_information(variant_id)
        if variant:
            variants_info.append(variant)
    return variants_info
