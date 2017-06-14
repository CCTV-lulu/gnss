/**
 * Created by a on 2016/12/23.
 */
var fs=require('fs');
var opt=require('../config/optcomm.json');
var ca=require('../routes/calib');
var cmn=require('../routes/comn');

var nodepos=require('../pvtpos/nodepos.js');
var math=require('mathjs');

function fail_create() {
    this.startTime=new Date();
    this.type=[];
};module.exports.fail_create=fail_create;
function accu_create() {
    this.X=[0];
    this.Y=[0];
};
function timeset(time) {
    var t=new Date(time.time*1000);
    var ep=[t.getFullYear(),t.getMonth(),t.getDate(),0,0,0];
    return cmn.epoch2time(ep);
};


function cont_create() {
    this.lastTime=0;
    this.beginTime=0;
    this.endTime=0;
    this.Horizontal=new accu_create();
    this.Vertical=new accu_create();
    this.Hori95=[];
    this.Vert95=[];
    this.contEvent=new Array();
};
function acc_struct(Hori,Vert) {
    this.Hori=Hori;
    this.Vert=Vert;
};
function acc95_struct(Hori,Vert) {
    var i,j;
    var acc95={"Hori":{"X":[],"Y":[]},
        "Vert":{"X":[],"Y":[]}};
    for(i=0;i<Hori.length;i++){
        acc95.Hori.X.push(cmn.stryearday(Hori[i].time));
        acc95.Hori.Y.push(Hori[i].mean+math.sqrt(Hori[i].sigma)*2);
    }
    for(i=0;i<Vert.length;i++){
        acc95.Vert.X.push(cmn.stryearday(Vert[i].time));
        acc95.Vert.Y.push(Vert[i].mean+math.sqrt(Vert[i].sigma)*2);
    }
    return acc95;
};
function accu95Update(sta_id,accH95,accV95,time,dH,dV) {
    if(accH95=={} || accV95=={}) {
        accH95 = acc95_create(time, dH);
        accV95 = acc95_create(time, dV);
    }else{
        if(cmn.timediff(time,accH95.time)>=24*3600){
            anarw.addacc95curr(sta_id,accH95,accV95);
            accH95 = acc95_create(time, dH);
            accV95 = acc95_create(time, dV);
            return;
        }
        accH95.mean=cmn.Average(dH,accH95.mean,accH95.count);
        accH95.sigma=cmn.vare(dH,accH95.sigma,accH95.count,accH95.mean);
        accH95.count++;
        accV95.mean=cmn.Average(dV,accV95.mean,accV95.count);
        accV95.sigma=cmn.vare(dV,accV95.sigma,accV95.count,accV95.mean);
        accV95.count++;
    }
};
function accuracyUpdate(X,Y,section,dd) {
    var i,j,h;
    if(dd>opt.HAL)
        dd=opt.HAL;
    var d=math.round(dd/section);
    if(X[d]==undefined){
        X[d]=d*section;
        Y[d]=1;
    }
    else{
        Y[d]++;
    }
};
function arrayUpdate(X,Y,section,dd) {
    var d=math.round(dd/section);
    if(X[d]==undefined){
        X[d]=d*section;
        Y[d]=1;
    }
    else{
        Y[d]++;
    }
}

function acc95_postUpdate(acc95,dd) {
    acc95.mean=cmn.Average(dd,acc95.mean,acc95.count);
    acc95.sigma=cmn.vare(dd,acc95.sigma,acc95.count,acc95.mean);
    acc95.count++;
}
function sliceUpdate(time,dd,para,cont) {
    if(dd>=para.extre_min && dd<=para.extre_max){
        cont.X.push(time);
        cont.Y.push(dd);
    }
    else{
        cont.X.push(time);
        cont.Y.push(0);
    }
}
function upsliceUpdate(time,dd,para,cont) {
    if(dd>=para.up_min ){
        cont.X.push(time);
        cont.Y.push(dd);
    }
    else{
        cont.X.push(time);
        cont.Y.push(0);
    }
}
function integrity_strunt(posR,hist,para,cont) {
    var dH = math.sqrt(posR.dX * posR.dX + posR.dY * posR.dY);
    var dV = math.abs(posR.dZ);
    var haserr=0;
    var time = posR.time;
    var fail=new fail_create();
    fail.startTime=time;

    if (posR.posNum <= posR.navsys.length + 3) {

        fail.type.push(opt.hpl_cant);
        haserr=1;
    }
    if (dH >= hist.Her) {
        fail.type.push(opt.her_exceed);
        haserr=1;
    }
    if (posR.HPL >= hist.HAL) {
        fail.type.push(opt.hpl_exceed);
        haserr=1;
    }
    if(fail.type.length>0){
        cont.integrity.push(fail);
    }
    if(haserr>0){
        return ;
    }

    if(para.err_hist>0){
        accuracyUpdate(cont.herr_hist.X, cont.herr_hist.Y,hist.section, dH);
        accuracyUpdate(cont.verr_hist.X, cont.verr_hist.Y,hist.section, dV);
    }
    if(para.dop_hist>0){
        arrayUpdate(cont.hdop_hist.X, cont.hdop_hist.Y,hist.section, posR.HDOP);
        arrayUpdate(cont.vdop_hist.X, cont.vdop_hist.Y,hist.section, posR.VDOP);
    }
    if(para.sat_hist>0){
        arrayUpdate(cont.sat_hist.X, cont.sat_hist.Y,1, posR.posNum);
    }
    if(para.acc95>0){
        acc95_postUpdate(cont.acc95_h, dH);
        acc95_postUpdate(cont.acc95_v, dV);
    }
    if(para.PL_hist>0){
        arrayUpdate(cont.hpl_hist.X, cont.hpl_hist.Y,hist.section, posR.HPL);
        arrayUpdate(cont.vpl_hist.X, cont.vpl_hist.Y,hist.section, posR.VPL);
    }

    if(para.slice.sat_num.flag>0 && cont.slice.sat_num.X.length<=hist.lastlen){
        sliceUpdate(time,posR.ns,para.slice.sat_num,cont.slice.sat_num);
    }
    if(para.slice.her_num.flag>0 && cont.slice.her_num.X.length<=hist.lastlen){
        sliceUpdate(time,dH,para.slice.her_num,cont.slice.her_num);
    }
    if(para.slice.ver_num.flag>0 && cont.slice.ver_num.X.length<=hist.lastlen){
        sliceUpdate(time,dV,para.slice.ver_num,cont.slice.ver_num);
    }
    if(para.slice.hdop_num.flag>0 && cont.slice.hdop_num.X.length<=hist.lastlen){
        sliceUpdate(time,posR.HDOP,para.slice.hdop_num,cont.slice.hdop_num);
    }
    if(para.slice.vdop_num.flag>0 && cont.slice.vdop_num.X.length<=hist.lastlen){
        sliceUpdate(time,posR.VDOP,para.slice.vdop_num,cont.slice.vdop_num);
    }
    if(para.slice.hpl_num.flag>0 && cont.slice.hpl_num.X.length<=hist.lastlen){
        sliceUpdate(time,posR.HPL,para.slice.hpl_num,cont.slice.hpl_num);
    }
    if(para.slice.vpl_num.flag>0 && cont.slice.vpl_num.X.length<=hist.lastlen){
        sliceUpdate(time,posR.VPL,para.slice.vpl_num,cont.slice.vpl_num);
    }

    if(para.up_slice.sat_num.flag>0 && cont.up_slice.sat_num.X.length<=hist.lastlen){
        upsliceUpdate(time,posR.posNum,para.up_slice.sat_num,cont.up_slice.sat_num);
    }
    if(para.up_slice.her_num.flag>0 && cont.up_slice.her_num.X.length<=hist.lastlen){
        upsliceUpdate(time,dH,para.up_slice.her_num,cont.up_slice.her_num);
    }
    if(para.up_slice.ver_num.flag>0 && cont.up_slice.ver_num.X.length<=hist.lastlen){
        upsliceUpdate(time,dV,para.up_slice.ver_num,cont.up_slice.ver_num);
    }
    if(para.up_slice.hdop_num.flag>0 && cont.up_slice.hdop_num.X.length<=hist.lastlen){
        upsliceUpdate(time,posR.HDOP,para.up_slice.hdop_num,cont.up_slice.hdop_num);
    }
    if(para.up_slice.vdop_num.flag>0 && cont.up_slice.vdop_num.X.length<=hist.lastlen){
        upsliceUpdate(time,posR.VDOP,para.up_slice.vdop_num,cont.up_slice.vdop_num);
    }
    if(para.up_slice.hpl_num.flag>0 && cont.up_slice.hpl_num.X.length<=hist.lastlen){
        upsliceUpdate(time,posR.HPL,para.up_slice.hpl_num,cont.up_slice.hpl_num);
    }
    if(para.up_slice.vpl_num.flag>0 && cont.up_slice.vpl_num.X.length<=hist.lastlen){
        upsliceUpdate(time,posR.VPL,para.up_slice.vpl_num,cont.up_slice.vpl_num);
    }

};module.exports.integrity_strunt=integrity_strunt;