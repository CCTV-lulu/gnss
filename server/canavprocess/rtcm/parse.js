/**
 * Created by a on 2017/5/15.
 */
var ca=require('../routes/calib.js');
var cmn=require('../routes/comn.js');
var rtcm3=require('./rtcm3');
var opt=require('../config/optcomm.json');
var math=require('mathjs');

//创建默认解析后终端
function obsdcreate(time) {
    var i, j, k, m;
    var obsd = new ca.obs_rtcm();
    obsd.cp = new Array(3);
    obsd.lock = new Array(3);
    obsd.time = time;
    for (k = 0; k < 3; k++) {
        obsd.cp[k] = new Array(ca.MAXSAT);
        obsd.lock[k] = new Array(ca.MAXSAT);
        for (i = 0; i < ca.MAXSAT; i++) {
            obsd.cp[k][i] = new Array();
            obsd.lock[k][i] = new Array();
            for (j = 0; j < ca.NFREQ; j++) {
                obsd.cp[k][i][j] = 0.0;
                obsd.lock[k][i][j] = 0.0;
            }
        }
    }
    return obsd;
};
function nav_t() {
    this.eph=new Array();
    this.ceph=new Array();
    this.geph=new Array();
}
//终端时间设定
function endtime() {
    var time=new ca.gtime();
    var t;
    if(opt.start_time !=0) {
        t=opt.start_time;
        //time.time = (new Date(t[0], t[1], t[2], t[3], t[4], math.floor(t[5]))).getTime()/1000;
        //time.sec=t[5]-math.floor(t[5]);
    }
    else{
        t=new Date();
    }
    time.time = (new Date(t[0], t[1], t[2], t[3], t[4], math.floor(t[5]))).getTime()/1000;
    time.sec=t[5]-math.floor(t[5]);
    return time;
}
function rtcm_create() {
    this.realtime=0;
    this.time=new endtime();
    this.first=0;
    this.len = 0;
    this.buff = new Buffer(opt.buff_len);
    this.index=0;
    this.obsd =new obsdcreate(this.time);
    this.lam=new cmn.wavelencreate();
    this.eph = {};
    this.alm = {};
    this.ion = {};
    this.ura=[];
    this.utc = {};
    this.rura = [];
    this.udre = [];
};module.exports.rtcm_create=rtcm_create;
function  stadata_create(){
    this.time=0.0;
    this.obs={flag:0,data:new Array()};
    this.eph={flag:0,data:new Array()};
    this.ion={flag:0,data:new Array()};
    this.alm={flag:0,data:new Array()};
    this.ura={flag:0,data:new Array()};
    this.utc={flag:0,data:new Array()};
    this.rura={flag:0,data:new Array()};
    this.udre={flag:0,data:new Array()};
};

function dataparse(data,rtcm) {
    var i,reg,index=0,id;
    var buff;
    var sta_data=new stadata_create();
    rtcm.obsd.obs=new Array();
    for(i=0;i<data.length;){
        if (data[i] == opt.rtcm_title) {
            index++;
            var len = getbitu(data.slice(i, i + 3), 14, 10) + 3;
            buff=data.slice(i, i+len+3);
            i += len+3;
            if(cmn.crc24q(buff,len)!=cmn.getbitu(buff,len*8,24)){
                console.log("rtcm frame crc24 check is error");
                continue;
            }
            rtcm.len=len;
            if(reg=rtcm3.decode_rtcm3(buff,rtcm)){
                switch (reg){
                    case 1://观测数据
                        if(!rtcm.obsd.sync && rtcm.obsd.obs.length>1) {
                            sta_data.obs.flag=1;
                            sta_data.obs.data = rtcm.obsd.obs;
                            sta_data.time=rtcm.obsd.time;
                        }
                        break;
                    case 2://星历数据
                        sta_data.eph.flag=1;
                        sta_data.eph.data.push(rtcm.eph);
                        break;
                    case 3://电离层模型参数
                        sta_data.ion.flag=1;
                        sta_data.ion.data.push(rtcm.ion);
                        break;
                    case 4://历书参数
                        sta_data.alm.flag=1;
                        sta_data.alm.data.push(rtcm.alm);
                        break;
                    case 5:                //ura
                        sta_data.ura.flag=1;
                        sta_data.ura.data=sta_data.ura.data.concat(rtcm.ura);
                        break;
                    case 6:                //时间同步参数
                        sta_data.utc.flag=1;
                        sta_data.utc.data.push(rtcm.utc);
                        break;
                    case 7:                //差分及完好性参数
                        sta_data.rura.flag=1;
                        sta_data.rura.data=sta_data.rura.data.concat(rtcm.rura);
                        break;
                    case 8:
                        sta_data.udre.flag=1;
                        sta_data.udre.data=sta_data.udre.data.concat(rtcm.udre);
                        break;
                    default :
                        break;
                }
            }
        }
        else{
            i++;
        }
    }
    return sta_data;
}

//收到单包类型新数据
function datatype(rtcm,data){
    var i,j,k;
    var len,type,sync;
    var results = [];
    if(rtcm.index+data.length>=opt.buff_len)    {
        rtcm.index=0;
        rtcm.first=0;
        console.log('buff overflow');
    }
    data.copy(rtcm.buff,rtcm.index,0,data.length);
    rtcm.index+=data.length;
    for(i=rtcm.first;i<rtcm.index;){
        if(rtcm.buff[i]==opt.rtcm_title){
            var buff=rtcm.buff.slice(i,i+10);
            len=getbitu(buff,14,10)+3;
            if(i+len+3>rtcm.index){

                rtcm.first=i;
                break;
            }
            type=getbitu(buff,24,12);
            if(type==opt.obs_type[0])
                sync=getbitu(buff,75,1);
            else if( type==opt.obs_type[1] || type==opt.obs_type[2] || type==opt.obs_type[3] ||
                type==opt.obs_type[4] || type==opt.obs_type[5])
                sync=getbitu(buff,78,1);
            i+=len+3;
            if(sync==0 && rtcm.index>=i){
                //emitter.emit('data',sta_id,rtcm.buff.slice(0,i),rtcm);
                results.push(dataparse(rtcm.buff.slice(0,i),rtcm));
                rtcm.buff.copy(rtcm.buff,0,i,rtcm.index);
                rtcm.first=0;
                rtcm.index-=i;
                sync=1;
            }
        }
        else{
            i++;
        }
    }
    return results;
};module.exports.datatype=datatype;

function getbitu(buff, pos, len){
    var bits=0;
    var i;
    for (i=pos;i<pos+len;i++) bits=(bits<<1)+((buff[i>>3]>>(7-i%8))&1);
    return bits;
}

