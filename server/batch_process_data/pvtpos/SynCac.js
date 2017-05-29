/**
 * Created by a on 2016/8/18.
 */
var ca=require('../routes/calib.js');
var cmn=require('../routes/comn.js');
function SynUTC(t,syn,utc) {
    var ws=new Array(2);
    cmn.time2bdt(t,ws);
    var day=ws[1]/86400;
    utc[1]=syn.deltLS + syn.A0utc + syn.A1utc*ws[1];
    if(ws[0]==syn.WNLSF && day >= syn.DN+2/3 && day<=syn.DN+5/4){
        utc[0]=(t.time+t.sec-utc[1]-43200)% 86400 +43200;
    }
    else{
        utc[0]=(t.time+t.sec-utc[1])% 86400;
    }
};
module.exports.SynUTC=SynUTC;
function SynGPS(t,syn){
    var ws=new Array(2);
    cmn.time2bdt(t,ws);
    var delGPS=syn.A0gps+syn.A1gps*ws[1];
    return cmn.timeadd(t,delGPS);
};
module.exports.SynGPS=SynGPS;
function SynGLO(t,syn){
    var ws=new Array(2);
    cmn.time2bdt(t,ws);
    var delGLO=syn.A0glo+syn.A1glo*ws[1];
    return cmn.timeadd(t,delGLO);
};
module.exports.SynGLO=SynGLO;
