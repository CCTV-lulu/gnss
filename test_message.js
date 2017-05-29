/**
 * Created by dell on 17-3-23.
 */
var readLine = require('linebyline');
var parser = require('./server/parser');

onMessage()
var arr = []
function onMessage() {
    var rl = readLine('./beijing-thu.log-2017-04-05');//读取字符串，逐行读取
    rl.on('line', function (line, idx) {
        var send = line.replace(/" "/g, "").replace(/:/g, "");
        var sendInfo = send.split("'");
        if (sendInfo[0].indexOf('fetched_at') > -1) {
            //console.log(sendInfo[1])
        }
        if ((sendInfo[0].indexOf('data') > -1)&& (idx < 100)) {
            var info = sendInfo[1];
            var buf = Buffer.from(info, 'base64');
            var cacheBuffers = getCacheBuffer('beijing-thu', buf);
            var buffLength = cacheBuffers.buffLength;
            var buffers = cacheBuffers.buffers;

            var bigBuff = new Buffer.concat(buffers);
            var results = parser.parse(2, bigBuff);
            releaseCacheBuffer('beijing-thu');
            results.forEach(function (sta_data) {
                try {
                   // console.log(sta_data)
                    console.log(sta_data.posR.dH)

                    sta_data.station_id = getStationId('beijing-thu', 2);
                    if (sta_data.posR && sta_data.posR.Lat == 0 && sta_data.posR.Lon == 0) return;
                    console.log(sta_data.posR.time)
                } catch (err) {
                    console.log(err.message);
                }
            })
        }
    });
    rl.on('end', function () {
        //fs.writeFile(dataPath, buff,function () {
        //    console.log('-------------------------------------------ok')
        //});
        console.log('-------------------------------------------ok')

    });

}
function getCacheBuffer(station, buf) {
    if (station in allBuffers) {
        allBuffers[station].length = (allBuffers[station].length || 0) + buf.length;
        allBuffers[station].buffers.push(buf)
    } else {
        allBuffers[station] = {};
        allBuffers[station].length = buf.length;
        allBuffers[station].buffers = [buf];
    }
    return {
        buffLength: allBuffers[station].length,
        buffers: allBuffers[station].buffers
    }
}

function releaseCacheBuffer(station) {
    allBuffers[station].length = 0;
    allBuffers[station].buffers = [];
}

var allBuffers = {};


function getStationId(station, station_id) {
    var stationIds = {
        'beijing-test': 3,
        'beijing-thu': 2,
        'guangzhou-dev': 0,
        'shanghai-dev': 1
    };
    return (stationIds[station] === undefined) ? (station_id || 0) : stationIds[station];
}
