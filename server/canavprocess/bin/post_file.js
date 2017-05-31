#!/usr/bin/env node
var fs=require('fs');
var ca=require('../routes/calib');
var cmn=require('../routes/comn');
var opt=require('../config/optcomm.json');
var readline=require('readline');
var statis=require('../statistics_process');
var test_file='D:/nodejs/data/rover_20170528_log.txt';

var stream=fs.createReadStream(test_file);
var readfile=new create_filestream(test_file);
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
function option_init(option) {
    option.sat_hist=1;
    option.err_hist=1;
    option.dop_hist=1;
    option.PL_hist=1;
    option.acc95=1;
    option.slice.sat_num.flag=1;
    option.slice.sat_num.extre_min=1.0;
    option.slice.sat_num.extre_max=3.0;
    option.slice.her_num.flag=1;
    option.slice.her_num.extre_min=1.0;
    option.slice.her_num.extre_max=3.0;
    option.slice.ver_num.flag=1;
    option.slice.ver_num.extre_min=1.0;
    option.slice.ver_num.extre_max=3.0;
    option.slice.hdop_num.flag=1;
    option.slice.hdop_num.extre_min=1.0;
    option.slice.hdop_num.extre_max=3.0;
    option.slice.vdop_num.flag=1;
    option.slice.vdop_num.extre_min=1.0;
    option.slice.vdop_num.extre_max=3.0;
    option.slice.hpl_num.flag=1;
    option.slice.hpl_num.extre_min=1.0;
    option.slice.hpl_num.extre_max=3.0;
    option.slice.vpl_num.flag=1;
    option.slice.vpl_num.extre_min=1.0;
    option.slice.vpl_num.extre_max=3.0;

    option.up_slice.sat_num.flag=1;
    option.up_slice.sat_num.up_min=8;
    option.up_slice.sat_num.up_len=30;
    option.up_slice.her_num.flag=1;
    option.up_slice.her_num.up_min=100;
    option.up_slice.her_num.up_len=30;
    option.up_slice.ver_num.flag=1;
    option.up_slice.ver_num.up_min=100;
    option.up_slice.ver_num.up_len=30;
    option.up_slice.hdop_num.flag=1;
    option.up_slice.hdop_num.up_min=1.0;
    option.up_slice.hdop_num.up_len=30;
    option.up_slice.vdop_num.flag=1;
    option.up_slice.vdop_num.up_min=1.0;
    option.up_slice.vdop_num.up_len=30;
    option.up_slice.hpl_num.flag=1;
    option.up_slice.hpl_num.up_min=50;
    option.up_slice.hpl_num.up_len=30;
    option.up_slice.vpl_num.flag=1;
    option.up_slice.vpl_num.up_min=50;
    option.up_slice.vpl_num.up_len=30;
}
function satis_init(para) {
    para.id=0;
    para.bt=cmn.epoch2time([2017,4,28,11,45,0]);
    para.et=cmn.epoch2time([2017,4,28,13,10,30]);
    para.hist[ca.SYS_GPS]=new hist_create();
    para.hist[ca.SYS_GLO]=new hist_create();
    para.hist[ca.SYS_CMP]=new hist_create();
    para.hist[ca.SYS_ALL]=new hist_create();
    para.option[ca.SYS_GPS]=new statis_option_create();
    para.option[ca.SYS_GLO]=new statis_option_create();
    para.option[ca.SYS_CMP]=new statis_option_create();
    para.option[ca.SYS_ALL]=new statis_option_create();
    option_init(para.option[ca.SYS_GPS]);
    option_init(para.option[ca.SYS_GLO]);
    option_init(para.option[ca.SYS_CMP]);
    option_init(para.option[ca.SYS_ALL]);
}
var para=new statis_create();
satis_init(para);
statis.option_set(para);
function create_filestream(file) {

    var rd=readline.createInterface({
        input:stream,
        output: process.stdout,
        terminal: false
    });
    rd.on('line',function (line) {
        statis.statistic_data(JSON.parse(line));
    });
    rd.on('close',function () {
        var sta_file=statis.statistic_get();
        var tt=0;
    });
}



