
var ca=require('../routes/calib.js');
var cmn=require('../routes/comn.js');
var rtcm3=require('./rtcm3.js');
var opt=require('./opt.json');
var math=require('mathjs');
var testpos=require('../pvtpos/test_pos.js');
var events=require('events');
if (opt.start_time === 0) {
    var now = new Date();
    opt.start_time = [
        now.getYear() + 1900,
        now.getMonth(),
        now.getDate(),
        now.getHours(),
        now.getMinutes(),
        now.getSeconds()
    ];
    console.log('new');
}
var rtcmParse={};
var rtcmpost={};
var emitter=new events.EventEmitter();
emitter.on('data',databuff);

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
    var t=[];
    if(opt.start_time !=0) {
        t=opt.start_time;
    }
    else{
        var tnow=new Date();
        t[0]=tnow.getFullYear();
        t[1]=tnow.getMonth();
        t[2]=tnow.getDate();
        t[3]=tnow.getHours();
        t[4]=tnow.getMinutes();
        t[5]=tnow.getSeconds();
    }
    time.time = (new Date(t[0], t[1], t[2], t[3], t[4], math.floor(t[5]))).getTime()/1000;
    time.sec=t[5]-math.floor(t[5]);
    return time;
}
function rtcm_create() {
    this.time=new endtime();
    this.first=0;
    this.len = 0;
    this.buff = new Buffer(opt.buff_len);
    this.index=0;
    this.obsd =new obsdcreate(this.time);
    this.nav=new nav_t();
    this.eph = {};
    this.alm = {};
    this.ion = {};
    this.syn = {};
    this.rura = {};
    this.udre = {};
    this.deltT = {};
    this.ionG = {};
};
function  stadata_create(){
    this.time=0.0;
    this.obs={flag:0,data:new Array()};
    this.eph={flag:0,data:new Array()};
    this.ion={flag:0,data:new Array()};
    this.alm={flag:0,data:new Array()};
    this.syn={flag:0,data:new Array()};
    this.rura={flag:0,data:new Array()};
    this.deltT={flag:0,data:new Array()};
    this.udre={flag:0,data:new Array()};
    this.ionG={flag:0,data:new Array()};
};

function rtcmPosendAddnew(id) {
    rtcmParse[id]=new rtcm_create();
    /*var i;
    for(i=0;i<opt.sta_id.length;i++){
        if(id==opt.sta_id[i]){
            break;
        }
    }
    if(rtcm.obsd.length==i) {
        var obsobj = new obsdcreate(rtcm.time, id);
        opt.sta_id.push(id);
        opt.sta_url.push(sta_url);
        rtcm.obsd.push(obsobj);
        rtcm.posend[id] = sta_url;
    }*/
}module.exports.rtcmPosendAddnew=rtcmPosendAddnew;
//删除解析后终端
function rtcmPosendDel(id) {
    if(rtcmParse.hasOwnProperty(id))
        delete rtcmParse[id];
    /*for(var i=0;i<rtcm.obsd.length;i++){
        if(rtcm.obsd[i].sta_id==id){
            rtcm.obsd.splice(i,1);
            delete rtcm.posend[id];
            break;
        }
    }
    for(i=0;i<opt.sta_id.length;i++){
        if(id==opt.sta_id[i]){
            opt.sta_id.splice(i,1);
            opt.sta_url.splice(i,1);
            break;
        }
    }*/
};module.exports.rtcmPosendDel=rtcmPosendDel;

var options = {
    headers: {"Connection": "close"},
    url: "",
    method: 'POST',
    json:true,
    body: {}
};
function dataparse(data,rtcm) {
    var i,reg,index=0,id;
    var buff;
    var endpos;
    var sta_data=new stadata_create();
    rtcm.obsd.obs=new Array();
    for(i=0;i<data.length;){
        if (data[i] == opt.rtcm_title) {
            index++;
            var len = getbitu(data.slice(i, i + 3), 14, 10) + 3;
            buff=data.slice(i, i+len+3);
            i += len+3;
            var a1=cmn.crc24q(buff,len);
            var a2=cmn.getbitu(buff,len*8,24);
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
                    case 5:                //时间同步参数
                        sta_data.syn.flag=1;
                        sta_data.syn.data.push(rtcm.syn);
                        break;
                    case 6:                        //差分及完好性参数
                        sta_data.rura.flag=1;
                        sta_data.rura.data.push(rtcm.rura);
                        break;
                    case 7:
                        //等效钟差参数
                        sta_data.udre.flag=1;
                        sta_data.udre.data.push(rtcm.udre);
                        break;
                    case 8:                        //差分距离指数
                        sta_data.deltT.flag=1;
                        sta_data.deltT.data.push(rtcm.deltT);
                        break;
                    case 9:                        //电离层格网参数
                        sta_data.ionG.flag=1;
                        sta_data.ionG.data.push(rtcm.ionG);
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
//收到buff包数据
function databuff(sta_id,data,rtcm) {
    var sta_data=dataparse(data,rtcm);
    options.url=opt.sta_url+"?sta_id="+sta_id;
    options.body=sta_data;
    //console.log(cmn.time2string(sta_data.time));
    testpos.data_pos(sta_id,sta_data);
    /*if(sta_data.time!=undefined)
        request(options,callback);*/
    return 1;
};
//收到单包类型新数据
function datatype(sta_id,data){
    var i,j,k;
    var len,type,sync;
    var results = [];
    if(!rtcmParse.hasOwnProperty(sta_id))
        rtcmPosendAddnew(sta_id);
    var rtcm=rtcmParse[sta_id];
    if(rtcm.index+data.length>=opt.buff_len){
        rtcm.index=0;
        rtcm.first=0;
        console.log('buff overflow');
    }
   // console.log(rtcm)
    data.copy(rtcm.buff,rtcm.index,0,data.length);
    rtcm.index+=data.length;
    console.log('---------------------------------------')
    //console.log(rtcm)
    for(i=rtcm.first;i<rtcm.index;){
        if(rtcm.buff[i]==opt.rtcm_title){
            var buff=rtcm.buff.slice(i,i+10);
            len=getbitu(buff,14,10)+3;
            if(i+len+3>rtcm.index){
                /*rtcm.buff.copy(rtcm.buff,0,k,rtcm.index);
                rtcm.index-=k;*/
                rtcm.first=i;
                break;
            }
            //buff=rtcm.buff.slice(i,i+len+3);
            /*if(cmn.crc24q(buff,len)!=cmn.getbitu(buff,len*8,24)){
                i+=len+3;
                console.log("rtcm frame crc24 check is error");
                continue;
            }*/
            /*buff.copy(dbuff,j,0);
            j+=buff.length;*/
            type=getbitu(buff,24,12);
            if(type==opt.obs_type[0])
                sync=getbitu(buff,75,1);
            else if( type==opt.obs_type[1] || type==opt.obs_type[2])
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

//后处理解析
function postset(time,len) {
    opt.start_time=time;
    if(len*2>opt.buff_len)
        opt.buff_len=len*2;
    rtcmpost=new rtcm_create();
    return time;
};module.exports.postset=postset;
function postdata(para) {
    var i,j;
    var len,type,sync;
    var dbuff=new Buffer(opt.buff_len);
    var sta_data={};
    j=0;
    sync=1;
    for(i=para.first;i<para.index;){
        if(para.buff[i]==opt.rtcm_title){
            var buff=para.buff.slice(i,i+10);
            len=getbitu(buff,14,10)+3;
            buff=para.buff.slice(i,i+len+3);
            if(i+len+3>para.index){
                return -1;
            }
           /* if(cmn.crc24q(buff,len)!=cmn.getbitu(buff,len*8,24)){
                i+=len+3;
                console.log("rtcm frame crc24 check is error");
                continue;
            }*/
            buff.copy(dbuff,j,0);
            j+=buff.length;
            type=getbitu(buff,24,12);
            if(type==opt.obs_type[0])
                sync=getbitu(buff,75,1);
            else if( type==opt.obs_type[1] || type==opt.obs_type[2])
                sync=getbitu(buff,78,1);
            i+=len+3;
            if(sync==0 && para.index>=i){
                sta_data=dataparse(dbuff.slice(0,j),rtcmpost);
                para.first=i;
                //para.buff.copy(para.buff,0,i,para.index);
                //para.index-=i;
                break;
            }
        }
        else{
            i++;
        }
    }
    if(i==para.index){
        para.first=0;
        para.index=0;
        //console.log(0);
    }
    return sta_data;
};module.exports.postdata=postdata;

function sendToAll(sta_data) {
    var i=0;
    //for(i=0;i<opt.sta_id.length;i++){
        var options = {
            headers: {"Connection": "close"},
            url:"http://127.0.0.1:3001/",
            //url: opt.sta_url[i]+":"+opt.sta_port[i]+opt.sta_path[i],
            method: 'POST',
            json:true,
            body: sta_data
        };
        request(options, callback);
    //}
}
function sendToLog(sta_data) {
    var options = {
        headers: {"Connection": "close"},
        url: opt.log_url,
        method: 'POST',
        json:true,
        body: sta_data
    };
    //request(options, callback);
}
function getbitu(buff, pos, len){
    var bits=0;
    var i;
    for (i=pos;i<pos+len;i++) bits=(bits<<1)+((buff[i>>3]>>(7-i%8))&1);
    return bits;
}
function callback(error, response, data) {
    if (error) {
        console.log(error);
    }
    else
        try {
            //posStatistic(data.sta_id,data.posR);
            console.log(data.posR.time, data.posR.Lat, data.posR.Lon, data.posR.H);
        }catch(err){
            console.log(err.message);
        }

}
function posStatistic(sta_id,posR) {
    var options = {
        headers: {"Connection": "close"},
        url: opt.log_url+"add",
        method: 'POST',
        json:true,
        body: {"sta_id":sta_id,"posR":posR}
    };
    request(options,callback_statistics);
}
function callback_statistics(error, response, data) {
    if (error) {
        console.log(error);
    }
}
function clone(obj) {
    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        var copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        var copy = [];
        for (var i = 0,  len = obj.length; i < len; ++i) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        var copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}