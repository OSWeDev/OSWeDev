#!/bin/bash

USER_UID=$(id -u):$(id -g)
USER_NAME=$USER
POSITIONAL=()
DEV_PARAM=""
ENV=""

# read the given prompt arguments
while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
        '--dev')
            ENV="development"
            shift # past argument
        ;;
        *) # unknown option
            POSITIONAL+=("$1") # save it in an array for later
            shift              # past argument
        ;;
    esac
done
set -- "${POSITIONAL[@]}" # restore positional parameters

# ./docker_build.sh
docker build --network host \
-t oswedev_server_img . \
--build-arg UID=$(id -u) \
--build-arg GID=$(id -g) \
--build-arg USER_NAME=$USER
