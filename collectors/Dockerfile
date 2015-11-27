FROM python:3.5

WORKDIR /
ADD requirements.txt /code/
RUN pip install -r /code/requirements.txt

ADD . /code
CMD python -m code.jobs
