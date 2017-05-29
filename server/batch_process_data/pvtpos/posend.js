/**
 * Created by a on 2016/8/18.
 */
var express = require('express');
var router = express.Router();
var path=require('path');
var fs=require('fs');
var opt=require('./config/opt.json');
var nodepos=require('./nodepos.js');
var pnt=require('./pntpos.js');
var stationPara={};
var stationMiddle=global.stationMiddle;
var stationpost={};
router.post('/',function(req,res){
    var sta_data=req.body;
    var sta_id=req.query['sta_id'];
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
                res.status(400).send(err.message);
                return;
            }
        }
        else{
            res.status(400).send("this station config file not exist!");
            return;
        }
    }
    var para=stationPara[sta_id];
    if (nodepos.updateObsNav(sta_data,para,logjson)) {
        if(pnt.pntpos_RAIM(para.obs, para.nav, para.prcopt, para.sol)) {
            nodepos.posOutStruct(para, logjson);
            nodepos.posMiddleUpdate(sta_id, para);
            if (opt.statis_open) {
                nodepos.posStatistic(sta_id, logjson.posR);
            }
            logjson.sta_id = sta_id;
        }
        res.send(logjson);
    }
});
router.get('/rb',function (req,res) {
    var sta_id=req.query['sta_id'];
    var rb=[0,0,0];
    if(stationMiddle.hasOwnProperty(sta_id)) {
        var mean=stationMiddle[sta_id].mean;
        rb[0]=mean[0];
        rb[1]=mean[1];
        rb[2]=mean[2];
        stationpost=new nodepos.posPara_create(stationPara[sta_id].prcopt);
        res.send(rb);
    }
    else{
        res.status(400).send("no request reference coordinate");
    }
});

module.exports = router;


