var nodepos = require('./pvtpos/nodepos.js');

var integ = require('./post/integrity.js');

var parse = require('./rtcm/parse_distrib.js');
var fs = require('fs');
var cmn = require('./routes/comn.js');
var post = require('./post/postcalc.js');
var StreamBrake = require('streambrake');
var path = require('path');

var math=require('mathjs');

var cwdData = path.resolve('../');

var readLine = require('linebyline');

var opt = require('./post/opt.json');


var cwd = path.resolve(__dirname, '..');
//var test_file = cwd + '/batch_process_data/rover_2016-12-23.txt';
//console.log('begin batch process!')
var files = [];


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




function get_post_prc (filer) {
    var proc;
    if(filer.sta_id>3){
        var sta_id_opt = 0
    }else{
        var sta_id_opt = filer.sta_id
    }
    var staopt = path.join(cwd, '/batch_process_data/pvtpos/config/opt' + sta_id_opt + '.json');

    if (fs.existsSync(staopt)) {
        try {
            var prcopt = JSON.parse(fs.readFileSync(staopt));
            prcopt.sta_id = filer.sta_id
            proc = new nodepos.posPara_create(prcopt);
            nodepos.posParainit(filer.sta_id, proc);
        }
        catch (err) {
            console.log(err);
//            process.exit(1);
        }
    }
    else {
        console.log('this station config file not exist!');
//        process.exit(1);
    }
    return proc;
}



function getPostPara(file, fiter) {
    //console.log(file)
    var start_time = file.split('data-')[1];
    var time = new Date(start_time)

    start_time = [1900 + time.getYear(), time.getMonth(), time.getDate()]
    time.setDate(time.getDate() + 1)

    var end_time = [1900 + time.getYear(), time.getMonth(), time.getDate()]

    fiter.bt = start_time.join(',') + ',0,0,0';
    fiter.et = end_time.join(',') + ',0,0,0';
    //console.log(fiter)
    var post_para = new function () {
        return {
            "sta_id": fiter.sta_id,
            "rb": new integ.coordXYZset(fiter.coord, fiter.rb),
            "pos": new integ.coordLLhset(fiter.coord, fiter.rb),
            "len": fiter.len,
            "buff": new Buffer(fiter.len * 2),
            "index": 0,
            "first": 0,
            "time": parse.postset(cmn.str2time(fiter.bt), fiter.len),
            "bt": cmn.epoch2time(cmn.str2time(fiter.bt)),
            "et": cmn.epoch2time(cmn.str2time(fiter.et)),
            "count": 0
        };
    };

    return post_para

}

function create_filestream(files, index, fiter, post_statistic, callback) {

    var stream;

    var post_para = getPostPara(files[index],fiter)

    var post_prc = get_post_prc(fiter);


    stream = fs.createReadStream(files[index])//.pipe(new StreamBrake(3000));
    stream.on('readable', function () {
        var data;
        while (null !== (data = stream.read(post_para.len))) {
            post.postdata(data, post_para, post_statistic, post_prc);
        }
    });
    stream.on("end", function () {
        index++;
        if (index < files.length) {
            create_filestream(files, index, fiter, post_statistic, callback)
        }
    });
    stream.on("close", function () {
        if (index == files.length) {
            var callbackData = save_statistic(post_statistic, post_para)
            callback(true, callbackData)
        }


    });
}
// console.log('test file:' + test_file);

function save_statistic(post_statistic, post_para) {
    var savefile = cwd + '/batch_process_data/post/sta' + post_para.sta_id + '.txt';
    var nve=[0,0];
    if(post_statistic.contEvent.length>=2)
        outage_event(post_statistic,nve);
    for(var i=0;i<post_statistic.Horizontal.X.length;i++) {
        if (post_statistic.Horizontal.X[i] == undefined) {
            post_statistic.Horizontal.X[i] = i * opt.accu_val;
            post_statistic.Horizontal.Y[i] = 0;
        }
    }
    for(var i=0;i<post_statistic.Vertical.X.length;i++){
        if(post_statistic.Vertical.X[i]==undefined){
            post_statistic.Vertical.X[i]=i*opt.accu_val;
            post_statistic.Vertical.Y[i]=0;
        }
    }
    var cont=get_continuity(post_statistic,nve[0]);
    var avil=get_availability(post_statistic,nve);
    var statistic_file = {
        "accuracy": new integ.acc_struct(post_statistic.Horizontal, post_statistic.Vertical),
        "accuracy_95": new integ.acc95_struct(post_statistic.Hori95, post_statistic.Vert95),
        "integrity":post_statistic.contEvent,
        "continuity": cont,
        "availability": avil
    };
    try{
         fs.writeFileSync(savefile,JSON.stringify(statistic_file));
    }catch (err){
        console.log(err);
    }
    /*fs.writeFile(savefile, JSON.stringify(statistic_file), function (err) {
     console.log(err);
     });*/
    return statistic_file
}

function outage_event(post_statistic,nve) {
    var elen=post_statistic.contEvent.length;
    var first=1;
    var event=new integ.fail_create();
    var lastfor=0;
    for(var i=0;i<elen;i++){
        if(first){
            event=post_statistic.contEvent[i];
            first=0;
            continue;
        }
        if(post_statistic.contEvent[i].type==event.type){
            if(math.abs(cmn.timediff(post_statistic.contEvent[i].startTime,event.startTime)
                    -event.outageDuration)<0.01){
                lastfor+=event.outageDuration;
            }
            else{
                if(lastfor>=10){
                    nve[0]++;
                    nve[1]+=lastfor;
                }
                lastfor=0;
            }
        }
        else{
            if(cmn.timediff(post_statistic.contEvent[i].startTime,event.startTime)>0.5){
                if(lastfor>=10){
                    nve[0]++;
                    nve[1]+=lastfor;
                }
                lastfor=0;
            }
            else{
                if(post_statistic.contEvent[i].outageDuration>event.outageDuration)
                    lastfor+=post_statistic.contEvent[i].outageDuration;
                else
                    lastfor+=event.outageDuration;
            }
        }
        event=post_statistic.contEvent[i];
    }
}


function get_continuity(post_statistic,n) {
    var pcf="probability of continuity is:";
    var MTBF;
    MTBF=cmn.timediff(post_statistic.endTime,post_statistic.beginTime);

    if(post_statistic.contEvent.length==0)
        pcf=1.0;
    else{
        if(post_statistic.contEvent.length>=2){
            if(n==0)
                pcf=1.0;
            else
                pcf=1.0-1.0/(MTBF/n);
        }
        else{
            if(post_statistic.contEvent[0].outageDuration>=10)
                pcf=1-1.0/MTBF;
            else
                pcf=1.0;
        }
    }
    return pcf;
}

function get_availability(post_statistic,n) {
    var MTBO,MTTR=0;
    var pcf=0;
    if(n[0]==0)
        pcf=1.0;
    else{
        MTBO=cmn.timediff(post_statistic.endTime,post_statistic.beginTime)/n[0];
        MTTR=n[1];
        if(post_statistic.contEvent.length==0)
            pcf=1.0;
        else
            pcf=MTBO/(MTBO+MTTR/n[0]);
    }
    return pcf;
}



function batchProcess(station, filer, userName) {

    var defer = Promise.defer();
    var  post_statistic= new integ.cont_create();
    var index = 0;
    var allFiles = getAllFilePath(station, filer.allDate);
    filer.len=4096;
    filer.coord =1;
    var files = allFiles.allFilesData;
    if(files.length == 0) {
        defer.resolve({status: 201})
        //return ({status: 201})
    }else{
        create_filestream(files, index ,filer, post_statistic, function (status, data) {
            var batchProcessResult = {
                data:data,
                userName: userName
            }
            defer.resolve(batchProcessResult)

        });
    }
    return defer.promise
}

function getFilesData(){
    var files = fs.readdirSync(cwdData +'/data/');
    var filesInfo ={};
    files.forEach(function(file){
        var station = file.split('.')[0];
        var time = file.split('data-')[1];
        if(station!== undefined && time !== undefined){
            filesInfo[station] = filesInfo[station]||[]
            filesInfo[station].push(time)
        }
    });
    return filesInfo
}

function getAllFilePath(station, allDate){
    var filesData = getFilesData();
    var allFilesData = [];
    var allFiles = {};
    var allFileSize =0;

    if(filesData[station]===undefined) return allFiles;
    filesData[station].sort(function(one, next){
        return new Date(one) > new Date(next)
    });
    filesData[station].forEach(function(time){
        if(allDate.indexOf(new Date(time).Format('yyyy-MM-dd'))>-1){
            var path = cwdData +'/data/'+ station + ".data-" + time;

            var fileSize = (fs.statSync(path).size)/1024000;
            allFileSize+=fileSize;

            allFilesData.push(path)
        }
    });
    allFiles.allFilesData = allFilesData;
    allFiles.allTime = allFileSize*5;
    return allFiles
}


function getBatchProcessTime(station, allDate){
    var filesData = getFilesData();
    var allFileSize =0;
    if(filesData[station]===undefined) return 0;

    filesData[station].sort(function(one, next){
        return new Date(one) > new Date(next)
    });

    filesData[station].forEach(function(time){
        if(allDate.indexOf(new Date(time).Format('yyyy-MM-dd'))>-1){
            var path = cwdData +'/data/'+ station + ".data-" + time;
            var fileSize = (fs.statSync(path).size)/1024000;
            allFileSize+=fileSize;
        }
    });

    return allFileSize*4;

}


process.on('message', function(batchProcessFiler) {
    if(batchProcessFiler.message == 'close'){
        process.exit()
    }
    batchProcess(batchProcessFiler.station, batchProcessFiler.filter, batchProcessFiler.userName).then(function(batchProcessResult){
        process.send(batchProcessResult);

    })
});

module.exports = {
    batchProcess: batchProcess,
    getAllFilePath:getAllFilePath,
    getBatchProcessTime: getBatchProcessTime

}
