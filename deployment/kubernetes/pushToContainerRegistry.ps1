docker tag vod-nginx vodcontainerregistry.azurecr.io/vod-nginx:latest
docker push vodcontainerregistry.azurecr.io/vod-nginx:latest

docker tag vod-api vodcontainerregistry.azurecr.io/vod-api:latest
docker push vodcontainerregistry.azurecr.io/vod-api:latest

docker tag vod-web vodcontainerregistry.azurecr.io/vod-web:latest
docker push vodcontainerregistry.azurecr.io/vod-web:latest

docker tag vod-streaming vodcontainerregistry.azurecr.io/vod-streaming:latest
docker push vodcontainerregistry.azurecr.io/vod-streaming:latest

docker tag vod-encoder vodcontainerregistry.azurecr.io/vod-encoder:latest
docker push vodcontainerregistry.azurecr.io/vod-encoder:latest

docker tag vod-uploader vodcontainerregistry.azurecr.io/vod-uploader:latest
docker push vodcontainerregistry.azurecr.io/vod-uploader:latest

docker tag vod-thumbnailgen vodcontainerregistry.azurecr.io/vod-thumbnailgen:latest
docker push vodcontainerregistry.azurecr.io/vod-thumbnailgen:latest