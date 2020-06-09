docker save vodnginxbase:latest -o E:\vodnginxbase.tar.gz
docker save vodcontainerregistry.azurecr.io/vod-api:latest -o E:\vodapi.tar.gz
docker save vodcontainerregistry.azurecr.io/vod-web:latest -o E:\vodweb.tar.gz
docker save vodcontainerregistry.azurecr.io/vod-streaming:latest -o E:\vodstreaming.tar.gz
docker save vodcontainerregistry.azurecr.io/vod-uploader:latest -o E:\voduploader.tar.gz
docker save vodcontainerregistry.azurecr.io/vod-encoder:latest -o E:\vodencoder.tar.gz
docker save vodcontainerregistry.azurecr.io/vod-thumbnailgen:latest -o E:\vodthumnailgen.tar.gz
docker save rabbitmq:3-management -o E:\vodrabbitmq.tar.gz