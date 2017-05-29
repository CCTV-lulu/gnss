/**
 * Created by a on 2016/12/23.
 */
var fs=require('fs');
var opt=require('./opt.json');
var ca=require('../routes/calib.js');
var cmn=require('../routes/comn.js');
var parse=require('../rtcm/parse_distrib.js');
var nodepos=require('../pvtpos/nodepos.js');
var math=require('mathjs');


function coordXYZset(coord,rr) {
    var rb=[0,0,0];
    if(coord==0){
        rb[0]=rr[0];
        rb[1]=rr[1];
        rb[2]=rr[2];
    }
    else{
        var pos=[0,0,0];
        pos[0]=rr[0]*ca.D2R;
        pos[1]=rr[1]*ca.D2R;
        pos[2]=rr[2]*1.0;
        cmn.pos2ecef(pos,rb);
    }
    return rb;
};module.exports.coordXYZset=coordXYZset;
function coordLLhset(coord,rr) {
    var rb=[0,0,0];
    var pos=[0,0,0];
    if(coord==0){
        rb[0]=rr[0];
        rb[1]=rr[1];
        rb[2]=rr[2];
        cmn.ecef2pos(rb,pos);
    }
    else{
        pos[0]=rr[0]*ca.D2R;
        pos[1]=rr[1]*ca.D2R;
        pos[2]=rr[2]*1.0;
    }
    return pos;
};module.exports.coordLLhset=coordLLhset;
function loadrb(sta_id) {
    request(opt.rb_url + "?sta_id=" + sta_id, function (error, response, data) {
        if (error) {
            console.log(error.message);
            process.exit(1);
        }
        else {
            if(response.statusCode==400) {
                console.log(data);
                process.exit(1);
            }
            para.rb = data;
        }
    });
}
function fail_create() {
    this.type=-1;
    this.startTime=new Date();
    this.outageDuration=1;
    this.notes="";
};module.exports.fail_create=fail_create;
function accu_create() {
    this.X=[0];
    this.Y=[0];
};module.exports.accu_create=accu_create;
function timeset(time) {
    var t=new Date(time.time*1000);
    var ep=[t.getFullYear(),t.getMonth(),t.getDate(),0,0,0];
    return cmn.epoch2time(ep);
};module.exports.timeset=timeset;
function acc95_create(time) {
    this.time=new timeset(time);
    this.mean=0;
    this.sigma=0;
    this.count=0;
};module.exports.acc95_create=acc95_create;

function cont_create() {
    this.lastTime=0;
    this.beginTime=0;
    this.endTime=0;
    this.Horizontal=new accu_create();
    this.Vertical=new accu_create();
    this.Hori95=[];
    this.Vert95=[];
    this.contEvent=new Array();
};module.exports.cont_create=cont_create;
function acc_struct(Hori,Vert) {
    this.Hori=Hori;
    this.Vert=Vert;
};module.exports.acc_struct=acc_struct;
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
};module.exports.acc95_struct=acc95_struct;
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
};module.exports.accu95Update=accu95Update;
function accuracyUpdate(X,Y,dd) {
    var i,j,h;
    if(dd>opt.HAL)
        dd=opt.HAL;
    var d=math.round(dd/opt.accu_val);
    if(X[d]==undefined){
        X[d]=d*opt.accu_val;
        Y[d]=1;
    }
    else{
        Y[d]++;
    }
};module.exports.accuracyUpdate=accuracyUpdate;
function acc95_postUpdate(acc95,time,dd) {
    var acc;
    if(acc95.length>0)
        acc=acc95[acc95.length-1];
    if(acc95.length==0 || cmn.timediff(time,acc.time)>24*3600){
        acc=new acc95_create(time);
        acc.mean=dd;
        acc.sigma=0;
        acc.count++;
        acc95.push(acc);
        return;
    }
    acc.mean=cmn.Average(dd,acc.mean,acc.count);
    acc.sigma=cmn.vare(dd,acc.sigma,acc.count,acc.mean);
    acc.count++;
};module.exports.accuracyUpdate=accuracyUpdate;
function integrity_strunt(posR,cont) {
    var dH = math.sqrt(posR.dX * posR.dX + posR.dY * posR.dY);
    var dV = math.abs(posR.dZ);
    var df;
    var time = cmn.gpst2time(posR.week, posR.tow);

    if (posR.posNum < posR.navsys.length + 3) {
        var fail = new fail_create();
        fail.type = opt.svLack;
        fail.startTime = time;
        cont.contEvent.push(fail);
    }
    if (dH >= opt.Herr) {
        var fail = new fail_create();
        fail.type = opt.Herr_exceed;
        fail.startTime = time;
        cont.contEvent.push(fail);
    }
    if (posR.HPL >= opt.HAL) {
        var fail = new fail_create();
        fail.type = opt.HPL_exceed;
        fail.startTime = time;
        cont.contEvent.push(fail);
    }
    accuracyUpdate(cont.Horizontal.X, cont.Horizontal.Y, dH);
    accuracyUpdate(cont.Vertical.X, cont.Vertical.Y, dV);
    acc95_postUpdate(cont.Hori95, time, dH);
    acc95_postUpdate(cont.Vert95, time, dV);
    if (cont.lastTime == 0)
        cont.lastTime = time;
    if (opt.isOutage && (df = cmn.timediff(time, cont.lastTime)) > opt.accu_val) {
        var fail = new fail_create();
        fail.type = opt.trans_outage;
        fail.lastTime = cont.lastTime;
        fail.outageDuration = df;
        cont.contEvent.push(fail);
    }
    if(cont.beginTime==0)
        cont.beginTime=time;
    cont.endTime=time;
    cont.lastTime = time;
};module.exports.integrity_strunt=integrity_strunt;