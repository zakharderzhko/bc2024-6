FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

RUN npm install -g nodemon

COPY . .

EXPOSE 3000

CMD ["node", "index.js", "--host", "0.0.0.0", "--port", "3000", "--cache", "/app/cache"]
