var fs = require('fs');
var path = require('path');
var StationSocketStatus = require('../config/messagequeue');
var json2csv = require('json2csv');
var rimraf = require('rimraf');
var iconv = require('iconv-lite');

var CSVPath = './public/csv';
var FILEPATH = '/csv';






var encryption = require('../utilities/cripto'),
    UserStationId = require('../data/userStationId'),
    StationStatus = require('../data/stationStatus'),
    StaThreshold = require('../data/staThreshold'),
    Station = require('../data/station'),

    StationConfig = require('../data/stationConfig'),
    UserStationInfo = require('../data/userStationInfo'),
    WarningInfo = require('../data/warningInfo.js'),
    UsersData = require('../data/usersData');


function checkUserStationId(userStationId, userStationInfo) {
    var defer = Promise.defer();
    Station.find({name: userStationId[userStationInfo[0][0]], staId: userStationId[userStationInfo[1][0]]})
        .then(function (station) {
            if (!station) {
                userStationId[userStationInfo[0][0]] = userStationInfo[0][1];
                userStationId[userStationInfo[1][0]] = userStationInfo[1][1];
                userStationId.save(function (err, userStationId) {
                    defer.resolve(userStationId)
                })
            } else {
                return defer.resolve(userStationId)
            }
        });
    return defer.promise;
}
function getUserStationId(req, res) {
    UserStationId.findStaIdByName(req.user.username, function (err, userStationId) {
        if (err) {
            return res.send({status: false, message: 'getUserStationId error  '})
        }
        Station.all().then(function (stations) {
            if (stations[0] == null) {
                var station = {
                    userStation: {userName: req.user.username},
                    allStation: []
                };
                return res.send(station)
            }
            var username, stationid;
            for (var i = 0; i < stations.length; i++) {
                if (stations[i].staId == req.user.station) {
                    username = stations[i].name;
                    stationid = stations[i].staId;
                    break;
                }
            }
            var stationInfo = [
                ['staName', username],
                ['staId', stationid]
            ]
            checkUserStationId(userStationId, stationInfo)
                .then(function (userStationId) {
                    var startBaseStationInfo = [
                        ['startBaseStation', username],
                        ['startStaId', stationid]
                    ];
                    checkUserStationId(userStationId, startBaseStationInfo)
                        .then(function (userStationId) {
                            if (req.user.roles.length == 1) {
                                var userStation = JSON.parse(JSON.stringify(userStationId));
                                userStation.name = username
                                var station = {
                                    userStation: userStation,//普通用户发一个，管理员都发
                                    allStation: []
                                };

                                res.send(station)
                            }
                            else {
                                var station = {
                                    userStation: userStationId,//普通用户发一个，管理员都发
                                    allStation: stations
                                };
                                res.send(station)
                            }
                        })

                })


        })
    })
}
//往前端返回基站和基站名，下拉框数据来源
function updateStaId(req, res) {
    var condition = {
        userName: req.body.userName
    };
    var data = {
        staName: req.body.staName,
        staId: req.body.staId,
        signalType: req.body.signalType,
        signalTypeId: req.body.signalTypeId,
        startBaseStation: req.body.startBaseStation,
        startStaId: req.body.startStaId
    };
    UserStationId.update(condition, data, function (err, update_data) {
        if (err) {
            return res.send({status: false, message: 'updateStaId error'})
        }
        if (update_data.ok == 1) {
            res.send({status: true});
        } else {
            res.send({status: false, message: 'updateStaId false , value is 0'})
        }
    })
}

function getStations(req, res) {
    Station.all().then(function (stations) {
        res.send(stations)
    }, function (error) {
        res.send({
            status: 400,
            message: error
        });
    })
}
function createStation(req, res) {
    var station = req.query;
    Station.create(station).then(function (data) {
        res.send(data)
    }, function () {
        res.send({
            status: 400,
            message: 'creat station error'
        });
    })
}

function getUserStaThreshold(req, res) {
    StaThreshold.findStaThresholdByName(req.body.userName, req.body.staName).then(function (staThreshold) {
        var resStaThreshold = {
            userName: staThreshold.userName,
            staName: staThreshold.staName,
            staThreshold: staThreshold.staThreshold || {}
        };
        res.send(resStaThreshold)
    }, function (error) {
        res.send({
            status: 400,
            message: error
        });
    })
}




function getUserStationInfo(req, res) {

    if (req.user.roles.includes('admin')) {
        Station.all().then(function (allStations) {
            return res.send({allStations: allStations})
        });
    } else {
        UserStationInfo.findStaIdByName(req.user.username, function (err, userStationInfo) {
            if (err) {
                return res.send({status: false, message: '拉取信息失败'})
            }
            return res.send({userStationInfo: userStationInfo})
        })
    }

}


function deleteStation(req, res) {
    Station.deleteByName(req.body.name).then(function (result) {
        UserStationInfo.deleteByStationName(req.body.name).then(function (results) {
            UsersData.deleteUserStationList(req.body.name).then(function (results) {
                StationConfig.deleteByStaName(req.body.name).then(function () {
                    StationSocketStatus.initStationOpt(req.body.staId)
                    res.send({status: true})
                });
            })
        })
    }, function (error) {
        res.send({
            status: 400,
            message: error
        });
    })
}
function addStation(req, res) {
    var newStation = {name: req.body.name, staId: req.body.staId};
    Station.create(newStation).then(function (result) {
        if (result.status) {
            StationConfig.create(newStation).then(function () {
                Station.all().then(function (allStation) {
                    res.send({status: true, allStations: allStation})
                })
            })
        } else {
            res.send(result)
        }

    }, function (error) {
        res.send({
            status: false,
            message: error
        });
    })
}
function getStationStatus(req, res, next) {
    var data = {station_id: parseInt(req.query.staId)};
    var limit = parseInt(req.query.limit);

    var stationData = {};
    //StationSocketStatus.StationSocketStatus[req.query.staId] = true;

    if (!(StationSocketStatus.StationSocketStatus[req.query.staId])) {

        stationData.StationSocketStatus = false;
    } else {
        var socketStatus = StationSocketStatus.StationSocketStatus[req.query.staId];
        stationData.StationSocketStatus = socketStatus;
    }
    stationData.stationData = StationSocketStatus.getStatInfo(limit, req.query.staId);
    stationData.stationId =  req.query.staId;

    res.send(stationData);


}


/*==========================threshold*/

function getStaThreshold(req, res) {
    StationConfig.getAllStationThreshold().then(function (stationConfig) {
        res.send(stationConfig)
    });
}

function getStaHandleData(req, res) {
    StationConfig.getAllStationThreshold().then(function (stationConfig) {
        res.send(stationConfig)
    });
}

function setStaThreshold(req, res) {
    var thresholdInfo = req.body;
    StationConfig.setStationThreshold(thresholdInfo.staId, thresholdInfo.signal, thresholdInfo.threshold,thresholdInfo.config).then(function (result) {
        if (result.status) {


            StationSocketStatus.initStationOpt(thresholdInfo.staId)
            return res.send(result);
        }

    },function(err){
        console.log('------err')

    })

}


function setStaHandleData(req, res) {
    var thresholdInfo = req.body;
    StationConfig.setStationHandleData(thresholdInfo.staId, thresholdInfo.signal, thresholdInfo.handleData,thresholdInfo.config,thresholdInfo.rbUpDate).then(function (result) {
        if (result.status) {

            StationSocketStatus.initStationOpt(thresholdInfo.staId);
            return res.send(result)
        }

    })

}



function createWaring(req, res,err) {
    Station.findByStaId(req.body.staId).then(function (result) {
        if(!result){
            return res.send({status:false,message:'查询基站被删除，请刷新'})
        }
        var username = req.user.username
        var path = CSVPath + "/" + username;
        var conditionInfo = req.body;
        var fileName = new Date().getTime() + ".csv";
        settWarningStatus(username, path+'/'+fileName, true);
        var condition = {
            "$and": [
                {"happendTime": {"$gt": new Date(conditionInfo.bt)}},
                {"happendTime": {"$lt": new Date(conditionInfo.et)}},
                {staId: conditionInfo.staId},
                {sys: {$in: conditionInfo.sys}},
                {warningContent: {$in: conditionInfo.types}}

            ]
        }

        WarningInfo.where(condition).then(function (warningInfo) {
            if (!warningInfo.status) {
                res.send(warningInfo)
            } else {
                fs.mkdir(path, function (err) {
                    var time  =warningInfo.result.length/10000;
                    createCSV(warningInfo.result, path, fileName);
                    return res.send({status: true, fileName: fileName, time:time})
                })
            }
        })
    })

}

var WarningStatus = {};

function getWarningStatus(username, path) {
    return WarningStatus[username] ? WarningStatus[username][path] : true;
}

function settWarningStatus(username, path, boolean) {
    if (!WarningStatus[username]) {
        WarningStatus[username] = {}
    }
    WarningStatus[username][path] = boolean
}


function checkWarningStatus(req, res) {
    var username = req.user.username;
    var filePath = FILEPATH + '/' + username + "/" + req.query.filename;
    var path = CSVPath + '/' + username+ "/" + req.query.filename;
    if (!getWarningStatus(username, path)) {
        res.send({status: true, filePath: filePath})

    } else {
        res.send({status: false})
    }

}


function createCSV(warningInfos, path, fileName) {
    var data = [];
    var fields = ['时间', '基站名称', '系统模式', '告警内容', '告警数值', '当前阈值'];
    var sys = ['GPS', 'GLS', 'BDS', 'Group'];
    warningInfos.forEach(function (info) {

        data.push({
            '时间': info.happendTime,
            '基站名称': info.stationName,
            '系统模式': sys[info.sys],
            '告警内容': info.warningContent,
            '告警数值': info.warningValue,
            '当前阈值': info.threshold

        })
    });

    json2csv({data: data, fields: fields}, function (err, csv) {
        // if (err)  console.log(err);
        var newCsv = iconv.encode(csv, 'GBK'); // 转编码

        fs.writeFile(path + '/' + fileName, newCsv, function (err) {
            if (err) throw err;
            var username = path.split('/').pop()
            settWarningStatus(username, path + '/' + fileName, false)
            console.log('file saved');
        });
    });

}

function removeCSV(username){
    rimraf("./public/csv/" + username, function (err) {

    })
}

/*==================================*/




module.exports = {
    getUserStationId: getUserStationId,
    updateStaId: updateStaId,
    getStationStatus: getStationStatus,
    getStations: getStations,
    createStation: createStation,
    getUserStaThreshold: getUserStaThreshold,
    deleteStation: deleteStation,
    addStation: addStation,


    getStaThreshold: getStaThreshold,
    setStaThreshold: setStaThreshold,


    setStaHandleData:setStaHandleData,
    getStaHandleData:getStaHandleData,

    getUserStationInfo: getUserStationInfo,
    createWaring: createWaring,
    checkWarningStatus: checkWarningStatus,
    removeCSV:removeCSV

};

