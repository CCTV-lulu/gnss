/**
 * Created by a on 2016/9/22.
 */
var express = require('express');
var router = express.Router();
var anarw=require('./anarw.js');
var math=require('mathjs');
var opt=require('./opt.json');
var cmn=require('../routes/comn.js');
var integ=require('./integrity.js');
var continuEvent=global.continuEvent;
function acc95_create(time,dd) {
    var acc95=new integ.acc95_create(time);
    acc95.time=integ.timeset(time);
    acc95.mean=dd;
    acc95.sigma=0;
    acc95.count++;
    return acc95;
}
router.post('/add',function (req,res) {
    try {
        var staid = req.body.sta_id;
        var posR = req.body.posR;
        if(posR.stat) {
            var dH = math.sqrt(posR.dX * posR.dX + posR.dY * posR.dY);
            var dV = posR.dZ;
            var df;
            var time = cmn.gpst2time(posR.week, posR.tow);
            if (!continuEvent.hasOwnProperty(staid)) {
                continuEvent[staid] = new integ.cont_create();
                anarw.addaccevent(staid,continuEvent[staid]);
            }
            var cont = continuEvent[staid];
            if (posR.posNum < posR.navsys.length + 3) {
                var fail = new integ.fail_create();
                fail.type = opt.svLack;
                fail.startTime = time;
                cont.contEvent=fail;
                anarw.addfail(cont);
            }
            if (dH >= opt.Herr) {
                var fail = new integ.fail_create();
                fail.type = opt.Herr_exceed;
                fail.startTime = time;
                cont.contEvent=fail;
                anarw.addfail(cont);
            }
            if (posR.HPL >= opt.HAL) {
                var fail = new integ.fail_create();
                fail.type = opt.HPL_exceed;
                fail.startTime = time;
                cont.contEvent=fail;
                anarw.addfail(cont);
            }
            integ.accuracyUpdate(cont.Horizontal.X, cont.Horizontal.Y, dH);
            integ.accuracyUpdate(cont.Vertical.X, cont.Vertical.Y, dV);
            integ.accu95Update(staid,cont.Hori95,cont.Vert95, time, dH,dV);

            if (opt.isOutage && (df = cmn.timediff(time, cont.startTime)) > opt.accu_val) {
                var fail = new integ.fail_create();
                fail.type = opt.trans_outage;
                fail.startTime = cont.startTime;
                fail.outageDuration = df;
                cont.contEvent=fail;
                anarw.addfail(cont);
            }
            cont.startTime = time;
        }
        res.send('ok');
    }catch(err){
        res.status(400).send(err.message);
    }
});
router.get('/get_acc',function (req,res) {
    var sta_id=req.query['sta_id'];
    //var sta_id=req.body.sta_id;
    if(!continuEvent.hasOwnProperty(sta_id)){
        res.status(400).send("no "+sta_id+" statistic data");
        return;
    }
    var acc=new acc_struct(continuEvent[sta_id].Horizontal,continuEvent[sta_id].Vertical);
    res.send(acc);
});
router.get('/get_acc95',function (req,res) {
    var sta_id=req.query['sta_id'];
    var time;
    if(!continuEvent.hasOwnProperty(sta_id)){
        res.status(400).send("no "+sta_id+" statistic data");
        return;
    }
    var cont = continuEvent[sta_id];
    var acc=acc95_struct(cont.Hori95,cont.Vert95);
    res.send(acc);
});
router.get('/get_integrity',function (req,res) {
    var sta_id=req.query['sta_id'];
    if(!continuEvent.hasOwnProperty(sta_id)){
        res.status(400).send("no "+sta_id+" statistic data");
        return;
    }
    res.send(continuEvent[sta_id].contEvent);
});
router.get('/get_continue',function (req,res) {
    var sta_id=req.query['sta_id'];
    var MTBF;
    if(!continuEvent.hasOwnProperty(sta_id)){
        res.status(400).send("no "+sta_id+" statistic data");
        return;
    }
    var cont = continuEvent[sta_id];
    MTBF=cmn.timediff(cont.currentTime,cont.startTime).time/3600;
    if(cont.contEvent.length==0)
        res.send(1);
    else
        res.send(1-1/(MTBF/cont.contEvent.length));
});
router.get('/get_available',function (req,res) {
    var sta_id=req.query['sta_id'];
    var MTBO,MTTR=0;
    if(!continuEvent.hasOwnProperty(sta_id)){
        res.status(400).send("no "+sta_id+" statistic data");
        return;
    }
    var cont = continuEvent[sta_id];
    MTBO=cmn.timediff(cont.currentTime,cont.startTime).time;
    for(var i=0;i<cont.contEvent.length;i++){
        MTTR+=cont.contEvent[i].outageDuration;
    }
    if(cont.contEvent.length==0)
        res.send(1);
    else
        res.send(MTBO/(MTBO+MTTR/(cont.contEvent.length)));
});

module.exports = router;