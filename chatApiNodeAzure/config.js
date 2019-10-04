var fs = require('fs');

function readConfig() {
    var config = JSON.parse(fs.readFileSync('config.json'));
    if (config.live){
        config.storageTable = config.storageTableLive;
    }
    else{
        config.storageTable = config.storageTableDev;
    }
    return config;
}

module.exports = readConfig();