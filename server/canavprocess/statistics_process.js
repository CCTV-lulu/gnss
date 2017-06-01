/**
 * Created by a on 2017/5/14.
 */
var path=require('path');
var ca=require('./routes/calib');
var cmn=require('./routes/comn');
var opt=require('./config/optcomm.json');
var integ=require('./post/integrity');
var math=require('mathjs');
var statistic_para={};
var statistic_result={};


function acc95_create() {
    this.mean=0;
    this.sigma=0;
    this.count=0;
};
function sta_result() {
    this.sat_hist={"X":[],"Y":[]};
    this.herr_hist={"X":[],"Y":[]};
    this.verr_hist={"X":[],"Y":[]};
    this.hdop_hist={"X":[],"Y":[]};
    this.vdop_hist={"X":[],"Y":[]};
    this.hpl_hist={"X":[],"Y":[]};
    this.vpl_hist={"X":[],"Y":[]};
    this.acc95_h=new acc95_create();
    this.acc95_v=new acc95_create();
    this.integrity=[];
    this.continuity=1.0;
    this.availability=1.0;
    this.slice=new function () {
        this.sat_num={"flag":0,"X":[],"Y":[]};
        this.her_num={"flag":0,"X":[],"Y":[]};
        this.ver_num={"flag":0,"X":[],"Y":[]};
        this.hdop_num={"flag":0,"X":[],"Y":[]};
        this.vdop_num={"flag":0,"X":[],"Y":[]};
        this.hpl_num={"flag":0,"X":[],"Y":[]};
        this.vpl_num={"flag":0,"X":[],"Y":[]};
    };
    this.up_slice=new function () {
        this.sat_num={"flag":0,"X":[],"Y":[]};
        this.her_num={"flag":0,"X":[],"Y":[]};
        this.ver_num={"flag":0,"X":[],"Y":[]};
        this.hdop_num={"flag":0,"X":[],"Y":[]};
        this.vdop_num={"flag":0,"X":[],"Y":[]};
        this.hpl_num={"flag":0,"X":[],"Y":[]};
        this.vpl_num={"flag":0,"X":[],"Y":[]};
    };
}

module.exports.option_set=function(para){
    statistic_para=para;
    //statistic_para=new statis_create();
    //satis_init(statistic_para);
    for(var sys in statistic_para.option){
        statistic_result[sys]=new sta_result();
    }
    return 0;
};
module.exports.statistic_data=function (data) {
    if(cmn.timediff(data.time,statistic_para.bt)<0 || cmn.timediff(data.time,statistic_para.et)>0)
        return 1;
    for(var sys in statistic_result){
        try{
            if(data.data.hasOwnProperty(sys)){
                integ.integrity_strunt(data.data[sys],statistic_para.hist[sys],statistic_para.option[sys],statistic_result[sys]);
            }
        }
        catch(err){
            console.log(err);
        }

    }
    return 0;
};
module.exports.statistic_get=function () {
    for(var sys in statistic_result){
        var cont=statistic_result[sys];
        var para=statistic_para.option[sys];
        var hist=statistic_para.hist[sys];
        var fails=outage_event(cont.integrity,hist);
        cont.continuity=get_continuity(fails,statistic_result[sys]);
        cont.availability=get_availability(fails,statistic_result[sys]);
        cont.integrity=(cont.acc95_h.count-fails[1])/cont.acc95_h.count;
        if(para.sat_hist>0){
            for(var i=0;i<cont.sat_hist.X.length;i++){
                if(cont.sat_hist.X[i]==undefined){
                    cont.sat_hist.X[i]=i;
                    cont.sat_hist.Y[i]=0;
                }
                if(hist.vert_axis>0){
                    cont.sat_hist.Y[i]=cont.sat_hist.Y[i]/cont.acc95_h.count;
                }
            }
        }
        if(para.err_hist>0){
            histUpdate(cont.herr_hist,hist,cont.acc95_h.count);
            histUpdate(cont.verr_hist,hist,cont.acc95_h.count);
        }
        if(para.dop_hist>0){
            histUpdate(cont.hdop_hist,hist,cont.acc95_h.count);
            histUpdate(cont.vdop_hist,hist,cont.acc95_h.count);
        }
        if(para.PL_hist>0){
            histUpdate(cont.hpl_hist,hist,cont.acc95_h.count);
            histUpdate(cont.vpl_hist,hist,cont.acc95_h.count);
        }
        cont.slice.sat_num.flag=para.slice.sat_num.flag;
        cont.slice.her_num.flag=para.slice.her_num.flag;
        cont.slice.ver_num.flag=para.slice.ver_num.flag;
        cont.slice.hdop_num.flag=para.slice.hdop_num.flag;
        cont.slice.vdop_num.flag=para.slice.vdop_num.flag;
        cont.slice.hpl_num.flag=para.slice.hpl_num.flag;
        cont.slice.vpl_num.flag=para.slice.vpl_num.flag;
        cont.up_slice.sat_num.flag=para.up_slice.sat_num.flag;
        cont.up_slice.her_num.flag=para.up_slice.her_num.flag;
        cont.up_slice.ver_num.flag=para.up_slice.ver_num.flag;
        cont.up_slice.hdop_num.flag=para.up_slice.hdop_num.flag;
        cont.up_slice.vdop_num.flag=para.up_slice.vdop_num.flag;
        cont.up_slice.hpl_num.flag=para.up_slice.hpl_num.flag;
        cont.up_slice.vpl_num.flag=para.up_slice.vpl_num.flag;
        if(cont.up_slice.sat_num.flag){
            upslice(cont.up_slice.sat_num,statistic_para.option[sys].up_slice.sat_num.up_len);
        }
        if(cont.up_slice.her_num.flag){
            upslice(cont.up_slice.her_num,statistic_para.option[sys].up_slice.her_num.up_len);
        }
        if(cont.up_slice.ver_num.flag){
            upslice(cont.up_slice.ver_num,statistic_para.option[sys].up_slice.ver_num.up_len);
        }
        if(cont.up_slice.hdop_num.flag){
            upslice(cont.up_slice.hdop_num,statistic_para.option[sys].up_slice.hdop_num.up_len);
        }
        if(cont.up_slice.vdop_num.flag){
            upslice(cont.up_slice.vdop_num,statistic_para.option[sys].up_slice.vdop_num.up_len);
        }
        if(cont.up_slice.hpl_num.flag){
            upslice(cont.up_slice.hpl_num,statistic_para.option[sys].up_slice.hpl_num.up_len);
        }
        if(cont.up_slice.vpl_num.flag){
            upslice(cont.up_slice.vpl_num,statistic_para.option[sys].up_slice.vpl_num.up_len);
        }
    }
    return statistic_result;
};
function histUpdate(stas,hist,count) {
    for(var i=0;i<stas.X.length;i++){
        if(stas.X[i]==undefined){
            stas.X[i]=i*hist.section;
            stas.Y[i]=0;
        }
        if(hist.vert_axis>0){
            stas.Y[i]=stas.Y[i]/count;
        }
    }
}
function upslice(slice,len) {
    var n=slice.X.length;
    var lastfor=0;
    var first=1;
    var j=0;
    for(var i=0;i<slice.Y.length;i++){
        if(slice.Y[i]>0 ){
            lastfor++;
            if(first>0){
                j=i;
                first=0;
            }
        }
        else{
            if(first==0 && lastfor<len){
                for(;j<i;j++){
                    slice.Y[j]=0;
                }
                lastfor=0;
                first=1;
            }
        }
    }
}
function outage_event(integrity,hist) {
    var fails=[0,0];
    var elen=integrity.length;
    var event=new integ.fail_create();
    var lastfor=0;
    if(elen>0){
        event=integrity[0];
        for(var i=1;i<elen;i++){
            if(math.abs(cmn.timediff(integrity[i].startTime,event.startTime))<2){
                lastfor+=1;
            }
            else{
                if(lastfor>=hist.failure){
                    fails[0]++;
                    fails[1]+=lastfor;
                }
                lastfor=0;
            }
            event=integrity[i];
        }
    }
    return fails;
}

function get_continuity(fails,statis) {
    var pcf=1.0;
    var MTBF;
    MTBF=statis.acc95_h.count;
    if(fails[0]==0)
        pcf=1.0;
    else{
        pcf=1.0-1.0/(MTBF/fails[0]);
    }
    return pcf;
}

function get_availability(fails,statis) {
    var MTBO,MTTR=0;
    var pcf=0;
    if(fails[0]==0)
        pcf=1.0;
    else{
        MTBO=statis.acc95_h.count/fails[0];
        MTTR=fails[1];
        pcf=MTBO/(MTBO+MTTR/fails[0]);
    }
    return pcf;
}