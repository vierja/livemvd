import threading

from .cutcsa import info as cutcsa_info
from .persistence import save

SOURCES = [
    cutcsa_info
]


def start(source, frequency, table):
    print('Starting job for table: {}'.format(table))
    while True:
        for obj in source():
            save(obj, table)


def run():
    print('Starting jobs')
    threads = []
    for source in SOURCES:
        for subsources in source():
            print('Starting thread: {}'.format(subsources))
            t = threading.Thread(
                None,
                start,
                args=(
                    subsources['source'],
                    subsources['frequency'],
                    subsources['table']
                )
            )
            t.start()
            threads.append(t)

    for thread in threads:
        thread.join()


if __name__ == '__main__':
    run()
