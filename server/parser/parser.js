/**
 * Created by xiaopingfeng on 1/5/17.
 */
var parse = require('./rtcm/parse_distrib.js');
var opt = require('./rtcm/opt.json');
var path=require('path');
var fs=require('fs');
var nodepos=require('./pvtpos/nodepos.js');
var pnt=require('./pvtpos/pntpos.js');
var math=require('mathjs');
var stationPara={};

module.exports.parse = function (sta_id, data) {
    var results = parse.datatype(sta_id, data);
    var pos_list = [];
    if(sta_id>3){
        var sta_id_opt = 0
    }else{
        var sta_id_opt = sta_id
    }
    //console.log(sta_id_opt)
    results.forEach(function (result) {
        var sta_data = result;
        //var sta_id = 0;
        var logjson = new nodepos.logOutJson()

        if (!stationPara.hasOwnProperty(sta_id)) {
            //console.log(__dirname)
            var cwd = __dirname;
            var staopt = path.join(cwd, '/pvtpos/config/opt' + sta_id_opt + '.json');
            console.log('config:' + staopt);
            if (fs.existsSync(staopt)) {
                try {
                    var prcopt = JSON.parse(fs.readFileSync(staopt));
                    prcopt.sta_id = sta_id
                    stationPara[sta_id] = new nodepos.posPara_create(prcopt);
                    nodepos.posParainit(sta_id, stationPara[sta_id]);
                }
                catch (err) {
                    console.log(err.message);
                    return;
                }
            }
            else {
                console.log("this station config file not exist!");
                return;
            }
        }
        //console.log('-=-=-=-=-=-=-=-=-=-=-=-333333')
        var para = stationPara[sta_id];
        //console.log(para)
        /* if(sta_data.time.time<1490498589)
         {
         return;
         }*/
        if (nodepos.updateObsNav(sta_data, para, logjson)) {
            if(sta_data.time.time== 1492709118){
                var x=10;
            }
            if (pnt.pntpos_RAIM(para.obs, para.nav, para.prcopt, para.sol)) {
                nodepos.posOutStruct(para, logjson);
                if(math.mod(para.obs[0].time.time,opt.midd_interval)==0)
                    nodepos.middleSaveAll(stationPara);
                nodepos.eleUpdate(para);
                //console.log(para.sol.time,para.sol.pos,logjson.posR.HPL);

                logjson.sta_id = sta_id;
            }
        }
        pos_list.push(logjson);
    });
    return pos_list;
};
