/**
 * Created by a on 2016/10/13.
 */
var express = require('express');
var fs=require('fs');
var integ=require('./integrity.js');
var post=require('./postcalc.js');
var ca=require('../routes/calib.js');
var cmn=require('../routes/comn.js');
var math=require('mathjs');
var request=require('request');
var opt=require('./opt.json');
var path=require('path');
var parse=require('../rtcm/parse_distrib.js');
var nodepos=require('../pvtpos/nodepos.js');
var router = express.Router();

var cwd=path.resolve(__dirname,'..');
var para={
    "sta_id":global.argv.sta_id,
    //"rb":loadrb(global.argv.sta_id),
    "rb":new integ.coordXYZset(global.argv.coord,global.argv.rb),
    "pos":new integ.coordLLhset(global.argv.coord,global.argv.rb),
    "len":global.argv.len,
    "buff":new Buffer(global.argv.len*2),
    "first":0,
    "index":0,
    "time":parse.postset(cmn.str2time(global.argv.bt),global.argv.len),
    "bt":cmn.epoch2time(cmn.str2time(global.argv.bt)),
    "et":cmn.epoch2time(cmn.str2time(global.argv.et)),
    "count":0
};
/*var para={
 "sta_id":0,
 "rb":[],
 "len":0,
 "buff":[],
 "index":0,
 "bt":[],
 "et":[],
 "count":0
 };*/
var cont = new integ.cont_create();
var postprc=new function () {
    var proc;
    var staopt=path.join(cwd,'/pvtpos/config/opt'+para.sta_id+'.json');
    if(fs.existsSync(staopt)){
        try{
            var prcopt=JSON.parse(fs.readFileSync(staopt));
            proc=new nodepos.posPara_create(prcopt);
            nodepos.posParainit(para.sta_id,proc);
        }
        catch(err){
            console.log(err);
            process.exit(1);
        }
    }
    else{
        console.log('this station config file not exist!');
        process.exit(1);
    }
    return proc;
}
router.post('/sta_id',function (req,res) {
    var sta=req.body;
    request(opt.rb_url+"?sta_id="+sta.sta_id, function (error, response, data) {
        if (error) {
            console.log(error);
            res.status(400).send("no this reference coordinate");
        }
        else {
            para.rb = data;
            if(data[0]!=0 && data[1]!=0 && data[2]!=0){
                res.send("ok");
            }
            else{
                res.status(400).send("no this reference coordinate");
            }
        }
    });
    para.sta_id=sta.sta_id;
    para.len=sta.len;
    para.buff=new Buffer(para.len*2);
    para.bt=cmn.epoch2time(sta.bt);
    para.et=cmn.epoch2time(sta.et);
});
router.post('/add',function (req,res) {
    console.log(req.url);
    try {
        post.postdata(req.body.data,para,cont,postprc);
        res.send('ok');
    }catch(err){
        res.status(400).send(err.message);
    }
});
router.get('/get_acc',function (req,res) {
    var acc=new integ.acc_struct(cont.Horizontal,cont.Vertical);
    res.send(acc);
});
router.get('/get_acc95',function (req,res) {
    var acc=integ.acc95_struct(cont.Hori95,cont.Vert95);
    res.send(acc);
});
router.get('/get_integrity',function (req,res) {
    res.send(cont.contEvent);
});
router.get('/get_continue',function (req,res) {
    var pcf="probability of continuity is:";
    var MTBF;
    MTBF=cmn.timediff(cont.endTime,cont.beginTime)/3600;
    if(cont.contEvent.length==0)
        res.send(pcf+1);
    else
        res.send(pcf+(1-1/(MTBF/cont.contEvent.length)));
});
router.get('/get_available',function (req,res) {
    var MTBO,MTTR=0;
    var pcf="probability of availablity is:";
    MTBO=cmn.timediff(cont.endTime,cont.beginTime);
    for(var i=0;i<cont.contEvent.length;i++){
        MTTR+=cont.contEvent[i].outageDuration;
    }
    if(cont.contEvent.length==0)
        res.send(pcf+1);
    else
        res.send(pcf+(MTBO/(MTBO+MTTR/(cont.contEvent.length))));
});
function callback(error, response, data) {
    if (error) {
        console.log(error);
    }
    else {
        try {
            para.rb = data;
        } catch (err) {
            console.log(err.message);
        }
    }
}
module.exports = router;