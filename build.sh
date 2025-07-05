#!/bin/bash
set -e
docker build --no-cache -t registry.tuxito.be/doorbell-backend:latest ./backend/
docker build --no-cache -t registry.tuxito.be/doorbell-frontend:latest .
docker push registry.tuxito.be/doorbell-backend:latest
docker push registry.tuxito.be/doorbell-frontend:latest