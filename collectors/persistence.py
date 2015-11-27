import rethinkdb as r
import os
import time

RDB_HOST =  os.environ.get('RDB_HOST') or 'rethinkdb'
RDB_PORT = os.environ.get('RDB_PORT') or 28015
RDB_DB = 'livemvd'
RDB_TABLES = ['cutcsa_locations']


def conn(with_db=True):
    kwargs = {
        'host': RDB_HOST,
        'port': RDB_PORT,
    }
    if with_db:
        kwargs['db'] = RDB_DB

    return r.connect(**kwargs)


def create():
    print('Creating DB {} and tables {}'.format(RDB_DB, RDB_TABLES))
    time.sleep(5)
    res = r.db_create(RDB_DB).run(conn(with_db=False))
    print('Res: {}'.format(res))
    for table in RDB_TABLES:
        res = r.table_create(table).run(conn())
        print('Res: {}'.format(res))


def save(obj, table):
    res = r.table(table).insert(obj).run(conn())
    return res['inserted']
