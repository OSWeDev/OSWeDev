#!/usr/bin/make

SHELL = /bin/sh

USER_UID := $(shell id -u)
USER_GID := $(shell id -g)

APPLICATION_NAME ?= oswedev
DOCKER_USERNAME ?= wedev 

APPLICATION_IMG_NAME ?= ${DOCKER_USERNAME}/${APPLICATION_NAME}_img
CONTAINER_NAME ?= ${APPLICATION_NAME}_container

COMPOSE_FILE ?= docker compose -f docker-compose.base.yml -f docker-compose.dev.yml

COMPOSE_UP ?= APPLICATION_IMG_NAME=${APPLICATION_IMG_NAME} \
	CONTAINER_NAME=${CONTAINER_NAME} \
	USER_UID=${USER_UID} \
	${COMPOSE_FILE} up


.DEFAULT_GOAL:=help

##@ Build
# Force build while having a "directory" with same name of the command 
.PHONY: build
build: ## Build the docker app image 
	docker build --tag ${APPLICATION_IMG_NAME} ./ \
		--build-arg UID=${USER_UID} \
		--build-arg GID=${USER_GID} \
		--build-arg USER_NAME=${DOCKER_USERNAME}

##@ Push
push: ## Push the docker app image into the repository
	docker push ${APPLICATION_IMG_NAME}


##@ Run
up-d: ## Run the docker container as a background process 
	${COMPOSE_UP} -d

up: ## Run the docker container through cli (show logs)
	${COMPOSE_UP} 
 
restart: ## Restart the current docker container 
	${COMPOSE_FILE} restart


##@ Bash
bash: ## Exec the internal docker container through cli
	docker exec -it ${CONTAINER_NAME} /bin/bash


.PHONY: help
help: 
	@awk 'BEGIN {FS = ":.*##"; printf "Usage: make \033[36m<target>\033[0m\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)
