FROM node:14-slim as base
FROM base

# dockerfile for OSWEDEV

# get args from prompt inputs
ARG USER_NAME
ARG UID
ARG GID

# current user of docker cli is "node" 
# its may be good idea to add user from the actual cli
RUN groupadd -g $GID -o $USER_NAME
RUN useradd -m -u $UID -g $GID -o -s /bin/bash $USER_NAME

# Where will the app being installed in the container
ENV APP_PATH=/home/node/oswedev


# Install some usefull packages
# and free some space from /var and /tmp
RUN apt-get update \
    && apt upgrade -y \
    && apt-get install -y \
    wget \
    cron \
    nano \
    sudo \
    apt-transport-https \
    ca-certificates \
    git \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* 

# display to the user about the current docker user
RUN echo $USER_NAME

# define the workdire
WORKDIR ${APP_PATH}

# install package manager
RUN npm install -g ts-node npm

# create workdir directories
RUN mkdir var dist bin

# provide a file for docker env params 
# for some reason cron job does not 
# read the actual docker env params
RUN touch ./bin/docker-env.sh

# command line tha will be run on init
COPY ./bin/entrypoint.sh ./bin/entrypoint.sh

# copy the project
COPY ./src ./src

# RUN npm prune --production
COPY package.json tsconfig*.json ./

# Give execution rights on the specified files
RUN chmod ug+x ./bin/entrypoint.sh
RUN chmod ug+x ./bin/docker-env.sh

# Change the project owner and group to the current user
RUN chown -c -h -R --from=0:0 ${USER_NAME} ${APP_PATH}
RUN chgrp -c -h -R ${USER_NAME} ${APP_PATH}

# change the docker cli executant to the actual user
USER ${USER_NAME}
RUN npm install
RUN npm run build
