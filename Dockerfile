FROM alpine
WORKDIR /app
COPY . .
RUN apk add --update nodejs npm
RUN npm install
EXPOSE 8000
CMD ["node", "index.js"]
