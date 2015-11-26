import requests
import rethinkdb as r
import multiprocessing as mp
from urllib.parse import urljoin

ENDPOINT = 'http://mobileapps.movistar.com.uy/'
UNIT_LOCATION = urljoin(ENDPOINT, '/ibus/IBus.svc/GetBusLocation/{}')
VARIANT_PATH = urljoin(ENDPOINT, '/ibus/IBus.svc/GetBusPath/{}')


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
                }
        except:
            print('Error fetching unit location')


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


def get_all_locations(workers):
    print('Getting all locations')
    with mp.Pool(processes=workers) as pool:
        for location in pool.imap_unordered(get_unit_location, range(2000)):
            if location:
                print('Fetched location: {}'.format(location))
                yield location


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
