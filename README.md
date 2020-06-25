# vod
Video On-Demand (YouTube)

Prerequisites to run the application locally:

* Node version: V11.10.1
* Create C:\temp folder
* Run a local server (or container) of RabbitMQ that listens in port 5672 and 15672.
* Run a local server (or container) of PostgreSQL that listens in port 5432.
* npm scripts should run with bash:
`npm config set script-shell "C:\\Program Files\\git\\bin\\bash.exe"`
* Install ffmpeg: [Link to download FFMPEG](https://ffmpeg.org/download.html#build-windows)
* Install MP4Box and config the PATH environment variable or put the mp4box.exe inside C:\windows\system32: [Link to download MP4Box](https://www.videohelp.com/software/MP4Box)
* In the .env file in all packages, put the credentials to the AWS-S3 service.
