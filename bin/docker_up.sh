#!/bin/bash

export USER_UID=$(id -u):$(id -g)
export USER_NAME=$USER
POSITIONAL=()
ENV=""

base="-f ./docker-compose.base.yml"
scale=''

while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
        '--dev')
            ENV="dev"
            shift # past argument
        ;;
        *) # unknown option
            POSITIONAL+=("$1") # save it in an array for later
            shift              # past argument
        ;;
    esac
done
set -- "${POSITIONAL[@]}" # restore positional parameters

# ./docker_up.sh --dev
# if [[ $ENV == "dev" ]]; then
#     scale='--scale oswedev_server_container=1'
# fi

docker compose $base -f ./docker-compose.${ENV}.yml up -d $scale
