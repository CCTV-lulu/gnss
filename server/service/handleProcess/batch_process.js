#!/usr/bin/env node
var fs = require('fs');
var ca = require('../../canavprocess/routes/calib');
var cmn = require('../../canavprocess/routes/comn');
var opt = require('../../canavprocess/config/optcomm.json');
var readline = require('readline');
var statis = require('../../canavprocess/statistics_process');
var path = require('path');
var promise = global.Promise;

var cwdData = path.resolve('../');


var exporter = require('highcharts-export-server');


function statis_create() {
    this.id = 0;
    this.bt = cmn.timenow();
    this.et = cmn.timenow();
    this.hist = {};    //new hist_create();
    this.option = {};//new statis_option_create();
}

function statis_option_create(handleData) {
    this.sat_hist = 0;
    this.err_hist = 0;
    this.dop_hist = 0;
    this.PL_hist = 0;
    this.acc95 = 0;
    this.rb_lowpass=0;
    this.slice = new function () {
        this.sat_num = {"flag": 0, "extre_min": 0, "extre_max": 0};
        this.her_num = {"flag": 0, "extre_min": 0, "extre_max": 0};
        this.ver_num = {"flag": 0, "extre_min": 0, "extre_max": 0};
        this.hdop_num = {"flag": 0, "extre_min": 0, "extre_max": 0};
        this.vdop_num = {"flag": 0, "extre_min": 0, "extre_max": 0};
        this.hpl_num = {"flag": 0, "extre_min": 0, "extre_max": 0};
        this.vpl_num = {"flag": 0, "extre_min": 0, "extre_max": 0};
    };
    this.up_slice = new function () {
        this.sat_num = {"flag": 0, "up_min": 0, "up_len": 30};
        this.her_num = {"flag": 0, "up_min": handleData.dH || 0, "up_len": 30};
        this.ver_num = {"flag": 0, "up_min": handleData.dV || 0, "up_len": 30};
        this.hdop_num = {"flag": 0, "up_min": handleData.HDOP || 0, "up_len": 30};
        this.vdop_num = {"flag": 0, "up_min": handleData.VDOP || 0, "up_len": 30};
        this.hpl_num = {"flag": 0, "up_min": handleData.HPL || 0, "up_len": 30};
        this.vpl_num = {"flag": 0, "up_min": handleData.VPL || 0, "up_len": 30};
    };
}
function hist_create() {
    this.section = 0.1;
    this.vert_axis = 1;//0:percent,1:number
    this.lastlen = 86400;
    this.failure = opt.alertTime;
    this.HAL = opt.HAL;
    this.Her = opt.HAL;
}
var UPMINVPL = 126;
var UPMINHPL = 556;
function option_init(option, myOption) {
    option.rb_lowpass=myOption.coordinate||0;
    option.sat_hist = myOption.sat_hist || 0;
    option.err_hist = myOption.err_hist || 0;
    option.dop_hist = myOption.dop_hist || 0;
    option.PL_hist = myOption.PL_hist || 0;
    option.acc95 = 1;
    option.up_slice.hpl_num.flag = myOption.hpl_num || 0;
    option.up_slice.vpl_num.flag = myOption.vpl_num || 0;
}
function satis_init(para, filter, config) {

    var startTimeInfo = filter.allDate[0].split('-');
    var startTime = [startTimeInfo[0], Number(startTimeInfo[1]) - 1, startTimeInfo[2], 0, 0, 0];
    var endTimeInfo = filter.allDate[filter.allDate.length - 1].split('-');
    var endTime = [endTimeInfo[0], Number(endTimeInfo[1]) - 1, endTimeInfo[2], 23, 59, 59];
    para.id = 0;
    para.bt = cmn.epoch2time(startTime);
    para.et = cmn.epoch2time(endTime);

    //para.hist[ca.SYS_GPS]=new hist_create();
    //para.hist[ca.SYS_GLO]=new hist_create();
    //para.hist[ca.SYS_CMP]=new hist_create();
    //para.hist[ca.SYS_ALL]=new hist_create();

    //para.option[ca.SYS_GLO]=new statis_option_create();
    //para.option[ca.SYS_CMP]=new statis_option_create();
    //para.option[ca.SYS_ALL]=new statis_option_create();
    filter.sys.forEach(function (sys) {
        para.hist[sys] = new hist_create();

        if(config){

           var handleData = config.handleData ? config.handleData[sys]:{}
        }
        else {
            handleData={}
        }
        para.option[sys] = new statis_option_create(handleData||{});
        option_init(para.option[sys], filter.options);
    });
    //option_init(para.option[ca.SYS_GPS]);
    //option_init(para.option[ca.SYS_GLO]);
    //option_init(para.option[ca.SYS_CMP]);
    //option_init(para.option[ca.SYS_ALL]);
}


function create_filestream(file, stream, cb) {

    var rd = readline.createInterface({
        input: stream,
        output: process.stdout,
        terminal: false
    });
    rd.on('line', function (line) {

        statis.statistic_data(JSON.parse(line));
    });
    rd.on('close', function () {
        var tt = 0;
        cb();
    });
}


function getFollowDatePath(batchProcessFiler) {

    return getAllFilePath(batchProcessFiler.sta_id, batchProcessFiler.allDate)
    //return ['/Users/chen/2016work/new_gnss/followData/beijing-thu.data-2017-06-11','/Users/chen/2016work/new_gnss/followData/beijing-thu.data-2017-06-12']
}


function batch_process(batchProcessFiler, config, processId) {


    var files = getFollowDatePath(batchProcessFiler);

    if (files.allTime == 30) {
        return process.send({status: 301, effectiveTime: files.allTime, processId: processId});
    }
    process.send({status: 300, effectiveTime: files.allTime, processId: processId});

    var para = new statis_create();
    satis_init(para, batchProcessFiler, config);
    statis.option_set(para);

    processOneDay(files.allFilesData, 0, function (data) {

        fs.mkdir('./public/batchHandleResult/' + batchProcessFiler.username + '/' + PROESSID + '/', function () {
            createImage(data, batchProcessFiler, config).then(function (results) {
                exporter.killPool()
                for (var sys in data) {
                    data[sys].up_slice = {
                        hpl_num: batchProcessFiler.options.hpl_num,
                        vpl_num: batchProcessFiler.options.vpl_num
                    }

                }

                var info = getOriginXYZ(data)
                var newInfo = handleXYZ(info)
                var newData = addRbLog(data,newInfo)
                fs.writeFile('./public/batchHandleResult/' + batchProcessFiler.username + '/' + PROESSID + '/' + batchProcessFiler.username + '.json', JSON.stringify(newData), function (err) {
                    if (err) throw err;
                    process.send({status: 200, username: batchProcessFiler.username});
                });
            });
        })


    });


}

function getOriginXYZ(data){
    var info = {};
    for(var i in data){
        info[i] = []
        for(var j in data[i].rb_lowpass){
            if(data[i].rb_lowpass[j] === null){
                info[i] =  null
            } else if(data[i].rb_lowpass === undefined){
                info[i] = undefined
            }else {
                info[i].push(data[i].rb_lowpass[j].ave)
            }

        }
    }

    return info
}

function handleXYZ(info){
    var newInfo ={}
    for(var i in info){
        if(info[i] == undefined){
            newInfo[i] =  undefined
            continue
        }
        if(info[i] == null){
            newInfo[i] =  null
            continue
        }

        var xyz = []
        cmn.ecef2pos(info[i],xyz)
        newInfo[i] = xyz;
    }
    return newInfo
}


function addRbLog(data, info){
    for(var i in info){
       data[i].new_rb_log =  info[i]
    }
    return data
}

function processOneDay(files, index, cb) {
    var stream = fs.createReadStream(files[index]);
    create_filestream(files[index], stream, function (data) {
        if (index !== files.length - 1) {
            return processOneDay(files, index + 1, cb)
        }
        var sta_file = statis.statistic_get();
        cb(sta_file);


    });
}

var PROESSID ;
process.on('message', function (info) {
    if (info.message == 'close') {
        return process.exit(0)
    }
    if(info =='break'){
        return process.exit(2)
    }

    //try{

    PROESSID = info.processId
    batch_process(info.filter, info.config, info.processId)
    //}catch(data){
    //    process.send({status:404, username: batchProcessFiler.username});
    //}

});


//batch_process('/Users/chen/2016work/new_gnss/followData/beijing-thu.data-2017-06-06')


function getFilesData() {
    var files = fs.readdirSync(cwdData + '/followData/');
    var filesInfo = {};
    files.forEach(function (file) {
        var station = file.split('.')[0];
        var time = file.split('data-')[1];
        if (station !== undefined && time !== undefined) {
            filesInfo[station] = filesInfo[station] || [];
            filesInfo[station].push(time)
        }
    });
    return filesInfo
}

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


function getAllFilePath(station, allDate) {
    var filesData = getFilesData();
    var allFilesData = [];
    var allFiles = {
        allTime: 30,
        allFilesData: []
    };
    var allFileSize = 0;

    if (filesData[station] === undefined) return allFiles;
    filesData[station].sort(function (one, next) {
        return new Date(one) > new Date(next)
    });
    filesData[station].forEach(function (time) {
        if (allDate.indexOf(new Date(time).Format('yyyy-MM-dd')) > -1) {
            var path = cwdData + '/followData/' + station + ".data-" + time;
            allFileSize += (fs.statSync(path).size) / 1024 / 1024;
            allFilesData.push(path)
        }
    });
    allFiles.allFilesData = allFilesData;
    allFiles.allTime = allFileSize / 2 + 30;
    return allFiles
}

function createImage(data, filter,config) {
    //var data = require('../../public/json/1.json');
    //filter = {
    //    username: 1,
    //    options:{
    //        hpl_num:1,
    //        vpl_num:1
    //    },
    //    sys:[0,1]
    //
    //}

    var infos = handleDate(data, filter, config);
    var promises = [];
    exporter.initPool({reaper: false, maxWorkers: infos.length});
    for (var i = 0; i < infos.length; i++) {
        promises.push(chartImage(infos[i], filter.username))
    }

    return promise.all(promises)
}

function chartImage(chartInfo, username) {
    var defer = promise.defer();
    exporter.export(setTimeLine(chartInfo.series), function (err, res) {
        fs.writeFile("./public/batchHandleResult/" + username + '/' + PROESSID + '/' + chartInfo.fileName + ".png", res.data, 'base64', function (err) {
            defer.resolve(chartInfo.fileName)
        });

    })
    return defer.promise
}
function handleDate(data, filter,config) {
    var chartDateArray = [];
    var lines = ['hpl_num', 'vpl_num'];
    var signals = ['GPS', 'GLS', 'BDS', 'Group'];

    lines.forEach(function (lineType) {
        if (filter.options[lineType] === 1) {
            filter.sys.forEach(function (sys) {
                var singalIndex = parseInt(sys);
                var singal = signals[singalIndex];
                var threshold =  config.handleData ||{};
                var limit = threshold[sys]||{};

                var lineLimit = lineType == 'hpl_num' ? limit['HPL'] : limit['VPL'];
                var line = getTimeLine(singal + lineType, data, singalIndex, lineType, lineLimit);
                if (line === false) return;
                chartDateArray.push(line)
            })
        }
    });


    return chartDateArray;


}

function getTimeLine(name, data, sys, type,lineLimit) {
    var fileName = name;
    var info = {"type": "column", name: fileName, data: [], color: 'red'};
    var startTime;
    sys = sys.toString();
    if (!data[sys]) return;
    var up_slice = data[sys].up_slice;

    for (var i = 0; i < up_slice[type].X.length; i++) {
        var time = new Date(up_slice[type].X[i]).getTime();
        if (i == 0) {
            startTime = new Date(up_slice[type].X[i]).getTime();
        }
        if (time - startTime > 24 * 60 * 60 * 1000) break;
        var currentTime = time
        info.data.push([time, up_slice[type].Y[i]])
    }

    var warningLine = {"type": "line", name: '警告线', data: [[startTime, lineLimit], [currentTime, lineLimit]], color: 'yellow'}
    if (info.data.length == 0) {
        return false
    }
    return {fileName: fileName, series: [info, warningLine]}
}

//function getLineDate(type, data, showType,sysArr) {
//    var lineInfo = {
//        fileName: type,
//        type: type
//    };
//
//    var names = ['GPS'+showType, 'GLS'+showType, 'BDS'+showType, 'Group'+showType];
//
//    var series = [];
//    sysArr.forEach(function (key) {
//        var info = {name: names[Number(key)], data: []};
//        if (!data[key][showType]) return;
//        data[key][showType].X.forEach(function (x, index) {
//            info.data.push([x, data[key][showType].Y[index]])
//        });
//        if (info.data.length > 0) {
//            series.push(info)
//        }
//    });
//    if (series.length == 0) return false;
//    lineInfo.series = series;
//    return  lineInfo
//}

//var info = [chartTimeLine('GPSVPLTime', data, 0, 'vpl_num')];
//var info1 = [chartTimeLine('GPSHPLTime', data, 0, 'hpl_num')];
//var info2 = [chartTimeLine('GLSVPLTime', data, 1, 'vpl_num')];
//var info3 = [chartTimeLine('GLSHPLTime', data, 1, 'hpl_num')];
//var info4 = [chartTimeLine('BDSVPLTime', data, 2, 'vpl_num')];
//var info5 = [chartTimeLine('BDSHPLTime', data, 2, 'hpl_num')];
//var info6 = [chartTimeLine('GroupVPLTime', data, 3, 'vpl_num')];
//var info7 = [chartTimeLine('GroupHPLTime', data, 3, 'hpl_num')];


function setTimeLine(series) {
    return {
        type: 'png',

        options: {
            title: "",
            xAxis: {
                type: 'datetime',
                dateTimeLabelFormats: {
                    second: '%H:%M:%S',
                    minute: '%e. %m %H:%M',
                    hour: '%m/%e %H:%M',
                    day: '%m/%e %H:%M',
                    week: '%e. %m',
                    month: '%b %y',
                    year: '%Y'
                }
            },
            chart: {width: 1000, height: 350},
            series: series
        }
    }
}
//function setLine(series) {
//    return {
//        type: 'png',
//        options: {
//            series: series
//        }
//    }
//}
//function setColumn(series) {
//    return {
//        type: 'png',
//        options: {
//            series: series
//        }
//    }
//}



