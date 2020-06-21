var schedule = require('node-schedule');
var config = require('config');
var findRemove = require('find-remove');
var path = require('path');
var fs = require('fs')

const tempRetentionInDays = 2 * (24 * 60 * 60)

var tempFolder = path.join(config.TempStorage.path);
var rule = new schedule.RecurrenceRule();
rule.hour = 3
rule.minute = 0
rule.second = 0

schedule.scheduleJob(rule, function () {
    console.log("Clearing temp folders...");
    const exclusions = ["vod-cache", "uploads", "logs"]
    const isDirectory = folder => fs.lstatSync(folder).isDirectory()

    const getDirectories = folder =>
        fs.readdirSync(folder)
            .filter(folderName => !exclusions.includes(folderName))
            .map(folderName => path.join(folder, folderName)).filter(isDirectory)

    const videoDirectories = getDirectories(tempFolder);
    videoDirectories.forEach(folder => {
        if (fs.lstatSync(folder).birthtime.getDay() >= 2) {
            findRemove(folder, { age: { seconds: tempRetentionInDays }, files: "*.*" })
            fs.rmdir(folder, function () { console.log("Removed", folder) });
        }
    });

    findRemove(path.join(config.TempStorage.path, 'uploads'), { age: { seconds: tempRetentionInDays }, files: "*.*" })
    findRemove(path.join(config.TempStorage.path, 'vod-cache'), { age: { seconds: tempRetentionInDays  }, files: "*.*" })
})