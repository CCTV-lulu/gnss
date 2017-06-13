#!/usr/bin/env node
var fs=require('fs');
var ca=require('../canavprocess/routes/calib');
var cmn=require('../canavprocess/routes/comn');
var opt=require('../canavprocess/config/optcomm.json');
var readline=require('readline');
var statis=require('../canavprocess/statistics_process');
var path = require('path');

var cwdData = path.resolve('../');




function statis_create() {
    this.id=0;
    this.bt=cmn.timenow();
    this.et=cmn.timenow();
    this.hist={};    //new hist_create();
    this.option={};//new statis_option_create();
}

function statis_option_create() {
    this.sat_hist=0;
    this.err_hist=0;
    this.dop_hist=0;
    this.PL_hist=0;
    this.acc95=0;
    this.slice=new function () {
        this.sat_num={"flag":0,"extre_min":0,"extre_max":0};
        this.her_num={"flag":0,"extre_min":0,"extre_max":0};
        this.ver_num={"flag":0,"extre_min":0,"extre_max":0};
        this.hdop_num={"flag":0,"extre_min":0,"extre_max":0};
        this.vdop_num={"flag":0,"extre_min":0,"extre_max":0};
        this.hpl_num={"flag":0,"extre_min":0,"extre_max":0};
        this.vpl_num={"flag":0,"extre_min":0,"extre_max":0};
    };
    this.up_slice=new function () {
        this.sat_num={"flag":0,"up_min":0,"up_len":0};
        this.her_num={"flag":0,"up_min":0,"up_len":0};
        this.ver_num={"flag":0,"up_min":0,"up_len":0};
        this.hdop_num={"flag":0,"up_min":0,"up_len":0};
        this.vdop_num={"flag":0,"up_min":0,"up_len":0};
        this.hpl_num={"flag":0,"up_min":0,"up_len":0};
        this.vpl_num={"flag":0,"up_min":0,"up_len":0};
    };
}
function hist_create() {
    this.section=0.1;
    this.vert_axis=1;//0:percent,1:number
    this.lastlen=86400;
    this.failure=opt.alertTime;
    this.HAL=opt.HAL;
    this.Her=opt.HAL;
}
function option_init(option,myOption) {
    option.sat_hist=myOption.sat_hist||0;
    option.err_hist=myOption.err_hist||0;
    option.dop_hist=myOption.dop_hist||0;
    option.PL_hist=myOption.PL_hist||0;
    option.acc95=1;
    option.up_slice.hpl_num.flag=myOption.hpl_num?myOption.hpl_num.flag:0;
    option.up_slice.hpl_num.up_min=50;
    option.up_slice.hpl_num.up_len=30;
    option.up_slice.vpl_num.flag=myOption.vpl_num?myOption.vpl_num.flag:0;
    option.up_slice.vpl_num.up_min=50;
    option.up_slice.vpl_num.up_len=30;
}
function satis_init(para,filter) {
    para.id=0;
    para.bt=cmn.epoch2time([2017,5,11,0,0,0]);
    para.et=cmn.epoch2time([2017,5,12,23,59,59]);

    para.hist[ca.SYS_GPS]=new hist_create();
    para.hist[ca.SYS_GLO]=new hist_create();
    para.hist[ca.SYS_CMP]=new hist_create();
    para.hist[ca.SYS_ALL]=new hist_create();
    para.option[ca.SYS_GPS]=new statis_option_create();
    para.option[ca.SYS_GLO]=new statis_option_create();
    para.option[ca.SYS_CMP]=new statis_option_create();
    para.option[ca.SYS_ALL]=new statis_option_create();
    filter.sys.forEach(function(sys){
        option_init(para.option[sys],filter.options);
    });
    //option_init(para.option[ca.SYS_GPS]);
    //option_init(para.option[ca.SYS_GLO]);
    //option_init(para.option[ca.SYS_CMP]);
    //option_init(para.option[ca.SYS_ALL]);
}








function create_filestream(file, stream ,cb) {

    var rd=readline.createInterface({
        input:stream,
        output: process.stdout,
        terminal: false
    });
    rd.on('line',function (line) {

        statis.statistic_data(JSON.parse(line));
    });
    rd.on('close',function () {
        var tt=0;
        cb();
    });
}





function getFollowDatePath(batchProcessFiler){

    return getAllFilePath(batchProcessFiler.sta_id, batchProcessFiler.allDate)
    //return ['/Users/chen/2016work/new_gnss/followData/beijing-thu.data-2017-06-11','/Users/chen/2016work/new_gnss/followData/beijing-thu.data-2017-06-12']
}


function batch_process(batchProcessFiler){


    var files = getFollowDatePath(batchProcessFiler);
    if( files.allTime == 0){
        return   process.send({status:301, effectiveTime: files.allTime});
    }
    process.send({status:300, effectiveTime: files.allTime});
    processOneDay(files.allFilesData, 0,function(data){
        fs.writeFile('./public/json/'+ batchProcessFiler.username  +'.json',JSON.stringify(data),function(err){
            if(err) throw err;
            process.send({status:200, username: batchProcessFiler.username});
        });
    });

    batchProcessFiler.sys=[0,1];
    batchProcessFiler.options={
        sat_hist:1,
        err_hist:1
    };


    var para=new statis_create();
    satis_init(para, batchProcessFiler);
    statis.option_set(para);





}

function processOneDay(files,index, cb){
    var stream=fs.createReadStream(files[index]);
    create_filestream(files[index], stream,function(data){
        if(index !== files.length-1){
           return  processOneDay(files, index+1,cb)
        }
        var sta_file=statis.statistic_get();
        cb(sta_file);


    });
}


process.on('message', function(batchProcessFiler) {
    if(batchProcessFiler.message == 'close'){
        process.exit()
    }
    //try{
        batch_process(batchProcessFiler)
    //}catch(data){
    //    process.send({status:404, username: batchProcessFiler.username});
    //}

});


//batch_process('/Users/chen/2016work/new_gnss/followData/beijing-thu.data-2017-06-06')


function getFilesData(){
    var files = fs.readdirSync(cwdData +'/followData/');
    var filesInfo ={};
    files.forEach(function(file){
        var station = file.split('.')[0];
        var time = file.split('data-')[1];
        if(station!== undefined && time !== undefined){
            filesInfo[station] = filesInfo[station]||[];
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
            var path = cwdData +'/followData/'+ station + ".data-" + time;
            allFileSize+=(fs.statSync(path).size)/1024/1024;
            allFilesData.push(path)
        }
    });
    allFiles.allFilesData = allFilesData;
    allFiles.allTime = allFileSize/5;
    return allFiles
}


