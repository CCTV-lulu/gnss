/**
 * Created by a on 2017/5/14.
 */
var fs = require('fs');
var path=require('path');
var parse = require('./rtcm/parse');
var ca=require('./routes/calib.js');
var opt = require('./config/optcomm.json');
var nodepos = require('./pvtpos/nodepos.js');
var pnt = require('./pvtpos/pntpos.js');
var cmn=require('./routes/comn');
var math=require('mathjs');
var cwd=__dirname;

var rtcm=new parse.rtcm_create();
var para={};
var prcopt={};
function init_create(bt,et) {
    this.bt=bt;//cmn.timestruct(1495157300,0);
    this.et=et;//cmn.timestruct(1495172481,0);
}
function getProopt(sta_id) {
    var staopt = path.join(cwd, '/config/opt' + sta_id + '.json');
    if (fs.existsSync(staopt)) {
        try {
            var prcopt = JSON.parse(fs.readFileSync(staopt));
            return prcopt;
        }
        catch (err) {
            console.log(err.message);
            return 0;
        }
    }
    else {
        console.log("this station config file not exist!");
        return 0;
    }
    return 0;
}
module.exports.parser_pos=function(data) {
    var pos_list = [];
    var results = parse.datatype(rtcm, data);
    results.forEach(function (sta_data) {
        var sta_id = 0;
        var logjson = new nodepos.logOutJson();
        if (nodepos.updateObsNav(sta_data, para, logjson)) {
            if(cmn.timediff(sta_data.time,prcopt.bt)<0 || cmn.timediff(sta_data.time,prcopt.et)>0)
                return false;
            try {
                if (para.obs.hasOwnProperty(ca.SYS_GPS)) {
                    follow_pos(para, para.obs[ca.SYS_GPS], para.nav, para.prcopt, para.sol[ca.SYS_GPS], ca.SYS_GPS, logjson);
                }
            }
            catch (err){
                console.log(err);
            }
            try {
                if(para.obs.hasOwnProperty(ca.SYS_GLO)){
                    follow_pos(para,para.obs[ca.SYS_GLO],para.nav, para.prcopt, para.sol[ca.SYS_GLO],ca.SYS_GLO,logjson);
                }
            }
            catch (err){
                console.log(err);
            }
            try{
                if(para.obs.hasOwnProperty(ca.SYS_CMP)){
                    follow_pos(para,para.obs[ca.SYS_CMP],para.nav, para.prcopt, para.sol[ca.SYS_CMP],ca.SYS_CMP,logjson);
                }
            }
            catch (err){
                console.log(err);
            }
            try{
                if(para.obs.hasOwnProperty(ca.SYS_ALL)){
                    if (!nodepos.obsTimeConsistent(sta_data.time, para.obs[ca.SYS_ALL])) {
                        nodepos.obsMostNumber(para.obs[ca.SYS_ALL]);
                    }
                    follow_pos(para,para.obs[ca.SYS_ALL],para.nav, para.prcopt, para.sol[ca.SYS_ALL],ca.SYS_ALL,logjson);
                    nodepos.eleUpdate(para.sol[ca.SYS_ALL], para.obs[ca.SYS_ALL], para.ele);
                }
            }
            catch (err){
                console.log(err);
            }
            logjson.time=sta_data.time;
            pos_list.push(logjson);
        }
    });
    return pos_list;
};
module.exports.procinit=function (sta_id,bt,et,len, opt_init) {
    if(bt.length<6 || et.length<6){
        return 1;
    }
    bt=cmn.epoch2time(bt);
    et=cmn.epoch2time(et);
    if(cmn.timediff(bt,et)>0){
        return 2;
    }
    prcopt=new init_create(bt,et);
    rtcm.buff=new Buffer(len*5);
    rtcm.time=prcopt.bt;
    rtcm.realtime=1;
    if(!opt_init){
        opt_init = getProopt(sta_id);
    }
    //var opt_init = getProopt(sta_id);
    if(opt_init!=0){
        para = new nodepos.posPara_create(opt_init);
        nodepos.posParainit(sta_id, para);
        return 0;
    }
    else{
        console.log('there has not config file');
        return 3;
    }
    return 4;
};

function follow_pos(para,obs,nav,prcopt,sol,sys,logjson) {
    prcopt.sys = sys;
    pnt.pntpos_RAIM(obs, nav, prcopt, sol);
    logjson.posR[sys] = new nodepos.posResult();
    nodepos.posOutStruct(para, sys, logjson);
    logjson.posR[sys].trackNum = obs.length;
    //logjson.time=sol.time;
    //console.log(sys,sol.time,cmn.time2string_Local(sol.time), sol.pos, logjson.posR[sys].HPL,logjson.posR[sys].posNum,logjson.posR[sys].trackNum);
}