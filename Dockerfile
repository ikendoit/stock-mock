from node

WORKDIR /var

copy package*.json /var

RUN npm install 

RUN apt-get install vim

COPY . /var

WORKDIR /var

EXPOSE 80 443 8089

CMD ["node","index.js"]
