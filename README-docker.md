# OpenSCAD Web UI Docker

## Bygg og kjør container

```sh
docker build -t openscad-web-ui .
docker run -p 8080:80 openscad-web-ui
```

Appen er nå tilgjengelig på http://localhost:8080

## OpenSCAD CLI

OpenSCAD CLI er installert i containeren som `/usr/bin/openscad`.

## Oppdateringsrutine

For å holde containeren oppdatert med siste kode og avhengigheter:

1. Sett opp GitHub Actions eller annen CI til å bygge og pushe ny image automatisk ved endringer i repoet.
2. Alternativt, bruk en cron-jobb eller manuell `docker build` og `docker push`.

Eksempel på GitHub Actions workflow:

```yaml
name: Build and Push Docker image
on:
  push:
    branches: [ main ]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build Docker image
        run: docker build -t your-dockerhub-user/openscad-web-ui .
      - name: Login to DockerHub
        run: echo ${{ secrets.DOCKERHUB_TOKEN }} | docker login -u ${{ secrets.DOCKERHUB_USER }} --password-stdin
      - name: Push image
        run: docker push your-dockerhub-user/openscad-web-ui
```

Husk å legge inn DockerHub-bruker og token som secrets i repoet.
