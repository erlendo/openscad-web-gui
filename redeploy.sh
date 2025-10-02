#!/bin/bash

# Enkel automatisert bygg, commit, push og restart for personlig bruk
MSG=${1:-"Automatisk commit og push"}

git add .
git commit -m "$MSG"
git push

CID=$(docker ps -q --filter ancestor=openscad-web-ui)
if [ ! -z "$CID" ]; then
  echo "Stopper kjørende openscad-web-ui container: $CID"
  docker stop $CID
fi

echo "Bygger docker image..."
docker build -t openscad-web-ui .

echo "Starter container på port 8080..."
docker run -d -p 8080:80 openscad-web-ui
