#!/bin/bash

ENV=""
AS_ADMIN=false
POSITIONAL=()

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
if [[ $ENV == "dev" ]]; then
  if [[ $AS_ADMIN == true ]]; then
    docker exec -u 0 -it oswedev_server_container /bin/bash
  else
    docker exec -it oswedev_server_container /bin/bash
  fi
fi