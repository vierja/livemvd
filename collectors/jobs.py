import threading

from .cutcsa import info as cutcsa_info
from .persistence import save, create

SOURCES = [
    cutcsa_info
]


def run():
    create()
    print('Starting jobs')
    threads = []
    for source in SOURCES:
        for subsource in source():
            print('Starting thread: {}'.format(subsource))
            t = threading.Thread(
                None,
                subsource
            )
            t.start()
            threads.append(t)

    for thread in threads:
        thread.join()


if __name__ == '__main__':
    run()
