FROM ubuntu:latest
WORKDIR /soundex

RUN apt-get --assume-yes update
RUN apt install -y git
RUN apt install -y nodejs
RUN apt install -y npm

RUN git clone https://github.com/shiny-coding/soundex-server

WORKDIR /soundex/soundex-server

RUN npm i
RUN npm run build

CMD ["echo", "Finished"]
