#!/bin/bash

# set up the general cli source
source /home/node/.bashrc

# declare or print the env variable in script shell
printenv | sed 's/^\(.*\)$/export \1/g' > /home/node/oswedev/bin/docker-env.sh
