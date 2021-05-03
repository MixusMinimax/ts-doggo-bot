FROM node:15-alpine

USER node

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app

COPY --chown=node:node package*.json ./

RUN npm install

COPY --chown=node:node . .

CMD [ "/usr/bin/bash", "-c", "echo $OWNER_TAG" ]