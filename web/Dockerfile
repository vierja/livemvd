FROM node:4.2

WORKDIR /code
ADD package.json /code/
RUN npm install 

EXPOSE 3000

ADD . /code
CMD node ./bin/www
