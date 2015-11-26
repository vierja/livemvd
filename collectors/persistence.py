import rethinkdb as r
import os

RDB_HOST =  os.environ.get('RDB_HOST') or 'localhost'
RDB_PORT = os.environ.get('RDB_PORT') or 28015
RDB_DB = 'livemvd'


def conn():
    return r.connect(host=RDB_HOST, port=RDB_PORT, db=RDB_DB)


def save(obj, table):
    res = r.table(table).insert(obj).run(conn())
    return res['inserted']

