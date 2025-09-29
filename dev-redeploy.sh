#!/bin/bash

# Commit og push til git
MSG=${1:-"Automatisk commit og push"}
git add .
git commit -m "$MSG"
git push

# Finn og stopp kjørende container (hvis noen)
CID=$(docker ps -q --filter ancestor=openscad-web-ui)
if [ ! -z "$CID" ]; then
  echo "Stopper kjørende openscad-web-ui container: $CID"
  docker stop $CID
fi

# Bygg ny docker image

echo "Bygger docker image..."
docker build -t openscad-web-ui .

# Start container på nytt

echo "Starter container på port 8080..."
docker run -d -p 8080:80 openscad-web-ui
