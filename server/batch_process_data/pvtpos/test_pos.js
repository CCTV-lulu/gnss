/**
 * Created by a on 2017/1/4.
 */
var path=require('path');
var fs=require('fs');
var nodepos=require('./nodepos.js');
var pnt=require('./pntpos.js');
var opt=require('./config/opt.json');
var stationPara={};

function data_pos(sta_id,sta_data) {
    var logjson=new nodepos.logOutJson();
    if(!stationPara.hasOwnProperty(sta_id)) {
        var cwd=__dirname;
        var staopt=path.join(cwd,'/config/opt'+sta_id+'.json');
        if(fs.existsSync(staopt)){
            try{
                var prcopt=JSON.parse(fs.readFileSync(staopt));
                stationPara[sta_id]=new nodepos.posPara_create(prcopt);
                nodepos.posParainit(sta_id,stationPara[sta_id]);
            }
            catch(err){
                return 1;
            }
        }
        else{
            return 2;
        }
    }
    var para=stationPara[sta_id];
    if (nodepos.updateObsNav(sta_data,para,logjson)) {
        if(pnt.pntpos_RAIM(para.obs, para.nav, para.prcopt, para.sol)) {
            nodepos.posOutStruct(para, logjson);
            console.log(logjson.posR.Lat,logjson.posR.Lon,logjson.posR.H);
            //nodepos.posMiddleUpdate(sta_id, para);
            if (opt.statis_open) {
                nodepos.posStatistic(sta_id, logjson.posR);
            }
            logjson.sta_id = sta_id;
        }
    }
}module.exports.data_pos=data_pos;