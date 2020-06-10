# vod
VIdeo On-Demand (YouTube)

Prerequisites to use the application locally:

Create C:\temp folder

Run a local server(or container) of rabbitmq that listens in port 5672 and 15672.
Run a local server(or container) of postgresql that listens in port 5432.

npm scripts should run with bash so run the command: npm config set script-shell "C:\\Program Files\\git\\bin\\bash.exe"

Install ffmpeg and config the PATH environment variable
Install MP4BOX

In the .env file in all packages, put the credentials to the aws-s3 service.
