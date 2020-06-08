docker save vodnginxbase:latest -o C:\vodImages\vodnginxbase.tar
docker save vodcontainerregistry.azurecr.io/vod-api:latest -o C:\vodImages\vodapi.tar
docker save vodcontainerregistry.azurecr.io/vod-web:latest -o C:\vodImages\vodweb.tar
docker save vodcontainerregistry.azurecr.io/vod-streaming:latest -o C:\vodImages\vodstreaming.tar
docker save vodcontainerregistry.azurecr.io/vod-uploader:latest -o C:\vodImages\voduploader.tar
docker save vodcontainerregistry.azurecr.io/vod-encoder:latest -o C:\vodImages\vodencoder.tar
docker save vodcontainerregistry.azurecr.io/vod-thumbnailgen:latest -o C:\vodImages\vodthumnailgen.tar
docker save rabbitmq:3-management -o C:\vodImages\vodrabbitmq.tar