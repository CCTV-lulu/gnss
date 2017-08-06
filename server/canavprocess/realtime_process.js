/**
 * Created by a on 2017/5/14.
 */
var fs = require('fs');
var path=require('path');
var parse = require('./rtcm/parse');
var ca=require('./routes/calib.js');
var cmn=require('./routes/comn');
var opt = require('./config/optcomm.json');
var nodepos = require('./pvtpos/nodepos.js');
var pnt = require('./pvtpos/pntpos.js');
var math=require('mathjs');
var cwd=__dirname;

var rtcmParse={};
var stationPara = {};
var stationMiddle = {};
function proct_set() {
    this.rb_gps={"flag":0,"data":[0,0,0]};
    this.rb_glo={"flag":0,"data":[0,0,0]};
    this.rb_cmp={"flag":0,"data":[0,0,0]};
    this.rb_mix={"flag":0,"data":[0,0,0]};
    this.el_gps={"flag":0,"data":10};
    this.el_glo={"flag":0,"data":10};
    this.el_cmp={"flag":0,"data":10};
    this.el_mix={"flag":0,"data":10};
}

function rtcm_init(sta_id) {
    var rtcm={};
    if(!rtcmParse.hasOwnProperty(sta_id))
        rtcmParse[sta_id]=new parse.rtcm_create();
    rtcm=rtcmParse[sta_id];
    return rtcm;
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
function pos_config(sta_id,prcopt) {
    var para={};
    if (!stationPara.hasOwnProperty(sta_id)) {
        // var prcopt = getProopt(sta_id);
        if(prcopt!=0){
            stationPara[sta_id] = new nodepos.posPara_create(prcopt);
            nodepos.posParainit(sta_id, stationPara[sta_id]);
        }
        else{
            console.log('there has not config file');
            return 0;
        }
    }
    para= stationPara[sta_id];
    return para;
}

module.exports.parser_pos=function(sta_id,data,prcopt) {
    var rtcm=rtcm_init(sta_id);
    var para=pos_config(sta_id,prcopt);


    var pos_list = [];

    if(para!=0){
        // console.log(typeof para.prcopt.rb[0])
        var navsys=[];
        var results=[];
        for(var i=0;i<para.prcopt.navsys.length;i++){
            navsys[i]=para.prcopt.navsys[i];
        }
        para.prcopt.navsys=ca.navsys;

        try{
            results = parse.datatype(rtcm, data);
        }
        catch (err){
            rtcmParse[sta_id]=new parse.rtcm_create();
            rtcm=rtcmParse[sta_id];
            console.log('rtcm data decode error, and rtcm buff is reinitialize');
        }
        results.forEach(function (sta_data) {
            var logjson = new nodepos.showJson();
            if (nodepos.updateObsNav_show(sta_data, para, logjson)) {
                try {
                    if (para.obs.hasOwnProperty(ca.SYS_GPS)) {
                        real_pos(para,para.obs[ca.SYS_GPS],para.nav, para.prcopt, para.sol[ca.SYS_GPS],ca.SYS_GPS,logjson);
                    }
                }
                catch(err){
                    console.log(err);
                }
                try{
                    if (para.obs.hasOwnProperty(ca.SYS_GLO)) {
                        real_pos(para,para.obs[ca.SYS_GLO],para.nav, para.prcopt, para.sol[ca.SYS_GLO],ca.SYS_GLO,logjson);
                        //logjson.time=cmn.time2string_UTC(cmn.gpst2utc(para.sol[ca.SYS_GLO].time));
                    }
                }
                catch(err){
                    console.log(err);
                }
                try{
                    if (para.obs.hasOwnProperty(ca.SYS_CMP)) {
                        real_pos(para,para.obs[ca.SYS_CMP],para.nav, para.prcopt, para.sol[ca.SYS_CMP],ca.SYS_CMP,logjson);
                        /*if(para.nav.utc_cmp.stat==1){
                            logjson.time=cmn.time2string_UTC(cmn.bd2utc(para.sol[ca.SYS_CMP].time,para.nav.utc_cmp));
                        }
                        else{
                            logjson.time=cmn.time2string_UTC(para.sol[ca.SYS_CMP].time);
                        }*/
                    }
                }
                catch(err){
                    console.log(err);
                }
                try{
                    if (para.obs.hasOwnProperty(ca.SYS_ALL)) {
                        if (!nodepos.obsTimeConsistent(sta_data.time, para.obs[ca.SYS_ALL])) {
                            nodepos.obsMostNumber(para.obs[ca.SYS_ALL]);
                        }
                        para.prcopt.navsys=navsys;
                        real_pos(para,para.obs[ca.SYS_ALL],para.nav, para.prcopt, para.sol[ca.SYS_ALL],ca.SYS_ALL,logjson);
                        nodepos.satShowStruct(para.obs[ca.SYS_ALL],para.nav,para.sol[ca.SYS_ALL],logjson);
                        nodepos.eleUpdate(para.sol[ca.SYS_ALL], para.obs[ca.SYS_ALL], para.ele);
                        logjson.time=cmn.time2string_UTC(sta_data.time);
                        /*if(para.nav.utc_gps.stat==1){
                            logjson.time=cmn.time2string_UTC(cmn.gps2utc(para.sol[ca.SYS_ALL].time,para.nav.utc_gps));
                        }
                        else{
                            logjson.time=cmn.time2string_UTC(para.sol[ca.SYS_ALL].time);
                        }*/
                    }
                    /*if (math.mod(sta_data.time.time, opt.midd_time) == 0) {
                        nodepos.middleSaveAll(sta_id, para);
                    }*/
                }
                catch(err){
                    console.log(err);
                }
            }
            pos_list.push(logjson);
        });
        para.prcopt.navsys=navsys;
    }
    return pos_list;
};
module.exports.procset=function (sta_id,prcopt) {
    try{
        if(stationPara.hasOwnProperty(sta_id)){
            // var prcopt=getProopt(sta_id);
            var prcUp=stationPara[sta_id].prcopt;
            prcUp.mode=prcopt.mode;           /* positioning mode (PMODE_???) */
            prcUp.nf=prcopt.nf;             /* number of frequencies (1:L1,2:L1+L2,3:L1+L2+L5) */
            prcUp.navsys=prcopt.navsys;         /* navigation system */
            prcUp.elmin=new function () {
                var elmin=[];
                for(var i=0;i<prcopt.elmin.length;i++){
                    elmin.push(prcopt.elmin[i] * ca.D2R)
                }
                return elmin;
            };       /* elevation mask angle (rad) */
            prcUp.snrmask= prcopt.snrmask;  /* SNR mask */
            prcUp.ionoopt=prcopt.ionoopt;        /* ionosphere option (IONOOPT_???) */
            prcUp.tropopt=prcopt.tropopt;        /* troposphere option (TROPOPT_???) */
            prcUp.eratio=prcopt.eratio; /* code/phase error ratio */
            prcUp.err=prcopt.err;      /* measurement error factor */
            prcUp.rbinit=prcopt.rbinit;
            prcUp.isrb=prcopt.isrb;
            prcUp.rb=prcopt.rb;      /* base position for relative mode {x,y,z} (ecef) (m) */
            prcUp.mul_vare=prcopt.mul_vare;
            prcUp.init_vare=prcopt.init_vare;
            prcUp.exsats=prcopt.exsats; /* excluded satellites (1:excluded,2:included) */
            prcUp.maxgdop=prcopt.maxgdop;
            prcUp.threshold_PFD=prcopt.threshold_PFD;
            prcUp.nclamda_PMD=prcopt.nclamda_PMD;
            prcUp.sys=prcopt.sys;
            return 0;
        }
        else {
            return 1;
        }
    }
    catch (err){
        console.log(err);
        return 1;
    }

};
module.exports.delconfig=function (sta_id) {
    try{
        if(rtcmParse.hasOwnProperty(sta_id)){
            delete rtcmParse[sta_id];
        }
        if(stationPara.hasOwnProperty(sta_id)){
            delete stationPara[sta_id];
        }
        return 0;
    }
    catch(err){
        console.log(err);
        return 1;
    }
};

module.exports.initStationPara = function(sta_id){
    delete  stationPara[sta_id]
};

function real_pos(para,obs,nav,prcopt,sol,sys,logjson) {
    prcopt.sys = sys;
    sol.ex="-";
    sol.VPL=null;
    sol.HPL=null;
    pnt.pntpos_RAIM(obs, nav, prcopt, sol);
    logjson.posR[sys] = new nodepos.posR_create();
    nodepos.posShowStruct(para, sys, logjson);
    logjson.posR[sys].trackNum = obs.length;
    //nodepos.eleUpdate(para);
    console.log(sys,sol.time,cmn.time2string_Local(sol.time), sol.pos, logjson.posR[sys].HPL,logjson.posR[sys].VPL,logjson.posR[sys].posNum,logjson.posR[sys].trackNum);
}