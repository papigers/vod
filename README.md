# vod
Video On-Demand (YouTube)

Prerequisites to run the application locally:

* Create C:\temp folder
* Run a local server (or container) of RabbitMQ that listens in port 5672 and 15672.
* Run a local server (or container) of PostgreSQL that listens in port 5432.
* npm scripts should run with bash:
`npm config set script-shell "C:\\Program Files\\git\\bin\\bash.exe"`
* Install ffmpeg and config the PATH environment variable
* Install MP4Box
* In the .env file in all packages, put the credentials to the AWS-S3 service.
