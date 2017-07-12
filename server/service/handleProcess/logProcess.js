var fs = require('fs');
var readLine = require('linebyline');

function handleLog(logResolvePath, cb) {
    var dataPath = logResolvePath.replace('/data/','followData');
    var allData = [];
    var rl = readLine(logResolvePath);
    rl.on('line', function (line, idx) {
        var send = line.replace(/" "/g, "").replace(/:/g, "");
        var sendInfo = send.split("'");
        if (sendInfo[0].indexOf('data') > -1) {
            var info = sendInfo[1];
            var data = Buffer.from(info, 'base64');
            allData.push(data)
        }
    });
    rl.on('end', function () {
        var buff = Buffer.concat(allData);
        fs.writeFile(dataPath, buff, function () {
            console.log('-------------------------------------------ok')
            process.send({status:'endOne'})
        });
    });

}

process.on('message',function(message){
    if(message === 'close'){
        return process.exit(0)
    }
    handleLog()
});



