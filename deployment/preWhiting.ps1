$originalPath = (Get-Location).Path
$path = Read-Host 'What is the path of your removable media?'

$path = $path.TrimEnd("\")

cd ..

#Build last version
docker build --tag vodnginxbase --file dockerfile.vod-nginx-base .
docker build --tag vodbase --file dockerfile.vod-base .
docker-compose build --parallel

#Tag the images
docker tag vod-nginx vodcontainerregistry.azurecr.io/vod-nginx:latest
docker tag vod-api vodcontainerregistry.azurecr.io/vod-api:latest
docker tag vod-web vodcontainerregistry.azurecr.io/vod-web:latest
docker tag vod-streaming vodcontainerregistry.azurecr.io/vod-streaming:latest
docker tag vod-encoder vodcontainerregistry.azurecr.io/vod-encoder:latest
docker tag vod-uploader vodcontainerregistry.azurecr.io/vod-uploader:latest
docker tag vod-thumbnailgen vodcontainerregistry.azurecr.io/vod-thumbnailgen:latest

#Save to path
docker save vodnginxbase:latest -o "$($path)\vodnginxbase.tar"
docker save vodcontainerregistry.azurecr.io/vod-api:latest -o "$($path)\vodapi.tar"
docker save vodcontainerregistry.azurecr.io/vod-web:latest -o "$($path)\vodweb.tar"
docker save vodcontainerregistry.azurecr.io/vod-streaming:latest -o "$($path)\vodstreaming.tar"
docker save vodcontainerregistry.azurecr.io/vod-uploader:latest -o "$($path)\voduploader.tar"
docker save vodcontainerregistry.azurecr.io/vod-encoder:latest -o "$($path)\vodencoder.tar"
docker save vodcontainerregistry.azurecr.io/vod-thumbnailgen:latest -o "$($path)\vodthumnailgen.tar"
docker save rabbitmq:3-management -o "$($path)\vodrabbitmq.tar"

#Change all tar file to txt files
cd $path
Dir *.tar | rename-item -newname { [io.path]::ChangeExtension($_.name, "txt") }

#Encode to Base64 all txt files
Dir *.txt | %{
    $fileContent = Get-Content $_.Name
    $fileContentBytes = [System.Text.Encoding]::UTF8.GetBytes($fileContent)
    $fileContentEncoded = [System.Convert]::ToBase64String($fileContentBytes)
    $fileContentEncoded | Set-Content ($_.Name)
}

#Copy all YAML files
cd $originalPath
cd .\kubernetes
Dir *.yaml | %{
    Copy-Item -Path $_.Name -Destination $path
}

#Copy nginx docker file and nginx.conf file
cd ..
Copy-Item -Path .\reverseproxy\nginx.conf.template -Destination $path
cd ..
Copy-Item -Path .\dockerfile.vod-nginx -Destination $path