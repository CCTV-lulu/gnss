/**
 * Created by xiaopingfeng on 12/28/16.
 */
var env = process.argv[2] || process.env.NODE_ENV || 'development';

var config = require('./config')[env];

var fs = require("fs");
var express = require('express');
var app = express();
var server = require('http').Server(app);

var io = require('socket.io')(server);
var statInfo = {};
var amqp = require('amqp-connection-manager');
//var parser = require('../parser');
var parse = require('../canavprocess/realtime_process.js');
var StationConfig = require('../data/stationConfig.js');
var WarningInfo = require('../data/warningInfo.js');

var AllStationsConfig = {};

Date.prototype.Format = function (fmt) { //author: meizz
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

//function changeTimestamp(data) {
//
//
//    var receiveTime = data.time.replace(new RegExp('-', 'gm'), ',')
//        .replace(new RegExp(' ', 'gm'), ',')
//        .replace(new RegExp(':', 'gm'), ',');
//    var dateArr = receiveTime.split(',')
//    return Date.UTC(parseInt(dateArr[0]), parseInt(dateArr[1]) - 1, parseInt(dateArr[2]), parseInt(dateArr[3]), parseInt(dateArr[4]), parseInt(dateArr[5])) - 18000;
//}
function updataRb(stationName,data){
    upDataRbStatus[stationName] = false;
    StationConfig.findByStaId(stationName).then(function (result) {
        if(result.stationConfig.config.rb===false){
            StationConfig.setRb(stationName,data).then(function (result) {
                initStationOpt(result.staId)
            })
        }
    })

}

function saveStaInfo(data) {

    if (data.posR && data.posR.Lat == 0 && data.posR.Lon == 0) return 0;

    //var updated_at = changeTimestamp(data);
    var staInfoId = Math.random().toString(36).substr(2) + Date.parse(new Date());
    var staInfo = {
        _id: staInfoId,
        station_id: data.station_id,
        signal_type: data.signal_type || 0,
        //updated_at: updated_at,
        data: data
    };
    checkThreshold(data);
    if (!statInfo[data.station_id]) {
        statInfo[data.station_id] = []
    }
    statInfo[data.station_id].push(staInfo);
    if (statInfo[data.station_id].length > 300) {
        statInfo[data.station_id].shift()
    }
    if(upDataRbStatus[data.station_id] == true){
        var stats=[]
       Object.keys(data.posR).forEach(function(sys){
           stats.push(data.posR[sys].stat)
       })
        // console.log(stats)
       if(stats.length==4&&stats.indexOf(0)==-1){
           updataRb(data.station_id,data)
       }

    }

    //fs.stat("../station" + data.station_id, function (err, stat) {
    //    if (err == null) {
    //        if (stat.isDirectory()) {
    //            fs.readdir("../station" + data.station_id, function (err, files) {
    //                if (err) return console.log(err);
    //                //if (files.length > 5) {
    //                //    for (var n = 0; n < files.length - 5; n++) {
    //                //        fs.unlink("../station" + data.station_id + '/' + files[n], function (err) {
    //                //            if (err) throw err;
    //                //        })
    //                //    }
    //                //}
    //                //console.log(staInfo)
    //                writeFileSync(data, staInfo);
    //            })
    //        }
    //    } else if (err.code == 'ENOENT') {
    //        fs.mkdir("../station" + data.station_id, '0777', function (err) {
    //            if (err) return console.log(err);
    //            writeFileSync(data, staInfo);
    //        });
    //    } else {
    //        console.log('错误：' + err);
    //    }
    //});
}

function writeFileSync(data, staInfo) {
    var fileDate = new Date();
    var dir_name = fileDate.Format("yyyy-MM-dd-hh");
    dir_name = dir_name + '-' + parseInt(fileDate.getMinutes() / 10);
    fs.writeFileSync("../station" + data.station_id + "/" + dir_name, JSON.stringify(staInfo) + "@qAq@", {flag: 'a'});
    //console.log('save station success')
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

//io.on('connection', function (socket) {
//    var stationName = socket.handshake.query.station;
//    console.log(socket.handshake.query.station)
//    socket.on('disconnect', function () {
//        StationSocketStatus[stationName] = false
//    });
//    StationSocketStatus[stationName] = true;
//
//    socket.on('' + stationName, function (data) {
//        if (!StationSocketStatus[stationName]) {
//            StationSocketStatus[stationName] = true;
//        }
//        onMessage(data);
//    }, function (error) {
//        console.log(error)
//    });
//});


var upDataRbStatus={}
function update(stationName){
    upDataRbStatus[stationName] = true;
}



function setConfig( stationName){
      setTimeout(function(){
            update(stationName)
        },1000*60*60)
}

function initSockectServer() {

    io.on('connection', function (socket) {
        var stationName = socket.handshake.query.station;
        console.log(socket.handshake.query.station);
        socket.on('disconnect', function () {
            StationSocketStatus[stationName] = false
        });

        // setConfig(stationName)

        StationSocketStatus[stationName] = true;
        socket.on('' + stationName, function (data) {
            if (!StationSocketStatus[stationName]) {
                StationSocketStatus[stationName] = true;
            }
            onMessage(data);
        }, function (error) {
            console.log(error)
        });
    });
    server.listen(33666);
}
var faye;
function initSockectClinet(bayeux) {
    faye = bayeux;

}
function checkThreshold(StaData) {
    var thresholdInfo = getStationConfig(StaData.station_id)
    var threshold = thresholdInfo.threshold;
    var stationName=thresholdInfo.stationName;
    var data = StaData.posR
    if(threshold==undefined) return;
    Object.keys(data).forEach(function (sys) {
        if (threshold[sys]) {
            Object.keys(threshold[sys]).forEach(function (type) {

                if (data[sys][type] > threshold[sys][type] && threshold[sys][type] !==null) {
                    sendFaye(StaData.station_id, sys, type, threshold[sys][type], data[sys][type],stationName,StaData.time)
                }
            })
        }
    })
}

function sendFaye(station_id, sys, type, threshold, warningValue,stationName,time ) {
    var warningInfo = {
        happendTime: new Date(time),
        stationName: stationName,
        staId: station_id,
        sys:sys,
        warningContent:type,
        warningValue:warningValue,
        threshold:threshold


    };
    WarningInfo.create(warningInfo).then(function(){
        faye.getClient().publish('/channel/' + station_id, warningInfo)
    })

}


function changeStationConfig(staId, config) {
    AllStationsConfig[staId] = config;
}

function getStationConfig(staId) {

    if (AllStationsConfig[staId] !== undefined) {
        return AllStationsConfig[staId]
    }
    StationConfig.findByStaId(staId).then(function (result) {
        if (result.status) {
            AllStationsConfig[staId] = result.stationConfig
        }

    });

    return {config:0, threshold:{}}

}

// Handle an incomming message.
function onMessage(data) {

    var message = data;
    var buf = Buffer.from(message.data, 'base64');
    console.log('---------------------on mesaage')
    console.log(data.station)
    var optJson = getStationConfig([data.station]).config
    console.log('---------------------on mesaage end');
    console.log(optJson)
    console.log('------------------------------------')
    var results = parse.parser_pos(data.station, buf, optJson);
    //releaseCacheBuffer(message.station);
    results.forEach(function (sta_data) {
        try {
            sta_data.station_id = message.station;
            saveStaInfo(sta_data)

        } catch (err) {
            console.log(err.message);
        }
    });

}

var StationSocketStatus = {};


function getStatInfo(number, id) {
    if (number > 1) {
        if (statInfo[id] == undefined) {
            return []
        }
        return statInfo[id]
    } else {
        if (statInfo[id] == undefined) {
            return []
        }
        return statInfo[id][statInfo[id].length - 1] ? [statInfo[id][statInfo[id].length - 1]] : [];
    }

}
function initStationOpt(staId) {
    AllStationsConfig[staId] = undefined;

    parse.initStationPara(staId);
}
module.exports = {
    StationSocketStatus: StationSocketStatus,
    getStatInfo: getStatInfo,
    initSockectServer: initSockectServer,
    initSockectClinet: initSockectClinet,
    initStationOpt: initStationOpt,
    // setConfig:setConfig
};



