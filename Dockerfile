# Grace Biemans geb965

FROM node:latest

EXPOSE 8080

COPY package*.json ./

# WORKDIR /usr/src/app
WORKDIR /app

# RUN npm start
RUN npm init -y
RUN npm install express body-parser mongodb nodemon