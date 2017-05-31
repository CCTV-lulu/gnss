/**
 * Created by a on 2016/12/23.
 */
var fs=require('fs');
var math=require('mathjs');
var path=require('path');
var ca=require('../routes/calib.js');
var cmn=require('../routes/comn.js');
var pnt=require('./pntpos.js');
var opt=require('../config/optcomm.json');
var ephcalc=require('./ephemeris.js');

function ioncreate_cmp() {
    var ion_cmp=new ca.ionM();
    ion_cmp.sys=ca.SYS_CMP;
    for(var i=0;i<ion_cmp.np;i++)
        ion_cmp.ion[i]=0.0;
    return ion_cmp;
};
function ioncreate_gps() {
    var ion_gps=new ca.ionM();
    ion_gps.sys=ca.SYS_GPS;
    for(var i=0;i<ion_gps.np;i++)
        ion_gps.ion[i]=0.0;
    return ion_gps;
}

function nav_create(){        /* navigation data type */
    this.eph=[];         /* GPS/QZS/GAL ephemeris */
    this.geph=[];       /* GLONASS ephemeris */
    this.ceph=[];      //
    //alm_t *alm;         /* almanac data */
    //tec_t *tec;         /* tec grid data */
    //erp_t  erp;         /* earth rotation parameters */
    this.ion_gps=new ioncreate_gps();  /* GPS iono model parameters {a0,a1,a2,a3,b0,b1,b2,b3} */
    this.ion_cmp=[];  /* BeiDou iono model parameters {a0,a1,a2,a3,b0,b1,b2,b3} */
    this.ura_gps=[];
    this.ura_cmp=[];
    this.utc_gps=new ca.gpsUTC();
    this.utc_cmp=new ca.bdUTC();
    this.udre=[];
    this.rura=[];
    this.lam=new cmn.wavelencreate();/* carrier wave lengths (m) */
};
function ele_create() {
    this.el_gps=new Array();
    this.el_cmp=new Array();
    this.el_glo=new Array();
}
function prcopt_create(prcopt){        /* processing options type */
    this.mode=prcopt.mode;           /* positioning mode (PMODE_???) */
    this.nf=prcopt.nf;             /* number of frequencies (1:L1,2:L1+L2,3:L1+L2+L5) */
    this.navsys=prcopt.navsys;         /* navigation system */
    this.elmin=new function () {
        var elmin=[];
        for(var i=0;i<prcopt.elmin.length;i++){
            elmin.push(prcopt.elmin[i] * ca.D2R)
        }
        return elmin;
    };       /* elevation mask angle (rad) */
    this.snrmask= prcopt.snrmask;  /* SNR mask */
    this.ionoopt=prcopt.ionoopt;        /* ionosphere option (IONOOPT_???) */
    this.tropopt=prcopt.tropopt;        /* troposphere option (TROPOPT_???) */
    this.eratio=prcopt.eratio; /* code/phase error ratio */
    this.err=prcopt.err;      /* measurement error factor */
    this.rbinit=prcopt.rbinit;
    this.isrb=prcopt.isrb;
    this.rb=prcopt.rb;      /* base position for relative mode {x,y,z} (ecef) (m) */
    this.mul_vare=prcopt.mul_vare;
    this.init_vare=prcopt.init_vare;
    this.exsats=prcopt.exsats; /* excluded satellites (1:excluded,2:included) */
    this.maxgdop=prcopt.maxgdop;
    this.threshold_PFD=prcopt.threshold_PFD;
    this.nclamda_PMD=prcopt.nclamda_PMD;
    this.sys=-1;
};
function sol_create(){        /* solution type */
    this.time=new Date();       /* time (GPST) */
    this.rr=[0,0,0];       /* position/velocity (m|m/s) */
    this.pos=[0,0,0];
    this.dtr=[0,0,0];      /* receiver clock bias to time systems (s) */
    this.type=0; /* type (0:xyz-ecef,1:enu-baseline) */
    this.stat=0; /* solution status (SOLQ_???) */
    this.qr={};
    this.ns=0;   /* number of valid satellites */
    this.dop=[0,0,0,0];
    this.HPL=0;
    this.VPL=0;
    this.ex="";
    this.azel=new Array();
    this.resp=new Array();
    this.svh=new Array();
    this.navsys=[];
} ;
function posResult() {
    this.stat=0;//定位结果状态
    this.week= 0;//定位时间GPS周
    this.tow= 0;//定位时间GPS周内秒
    this.time= "";//定位结果UTC时间
    this.X= 0;//定位结果，ECEF坐标
    this.Y= 0;
    this.Z= 0;
    this.dX= 0;//定位误差，本地坐标系下水平东向
    this.dY= 0;//北向
    this.dZ= 0;//垂向
    this.Lat= 0;//定位结果纬度
    this.Lon= 0;//定位结果经度
    this.H= 0;//定位结果高程
    this.GDOP= 0;//几何精度GDOP
    this.PDOP= 0;//
    this.HDOP= 0;
    this.VDOP= 0;
    this.VPL= 0;//定位垂直保护水平
    this.HPL= 0;//定位水平保护水平
    this.posNum= 0;//定位卫星数
    this.trackNum=0;
    this.exsats= "";//定位排除的卫星
    this.minEl= 0;//最小卫星仰角
    this.navsys=[];//定位卫星系统
};module.exports.posResult=posResult;
function obscreate() {
    this.sys=0;//卫星所属导航系统
    this.sat=0;//卫星PRN号
    this.week=0;//GPS周
    this.tow=0;//周内秒
    this.time=new ca.gtime();//观测数据时间
    this.P=[0,0,0];//伪距1频点2频点
    this.L=[0,0,0];//载波相位
    this.D=[0,0,0];//多普勒
    this.S=[0,0,0];//载噪比
    this.Azi=0;//方位角
    this.Ele=0;    //仰角
}
function syncreate() {
    this.utc=0.0;//当前精确UTC时间
    this.bias=0.0;//北斗时与UTC时间差
    this.gps=0.0;//北斗时与GPS时间差
    this.glo=0.0;//北斗时与GLONASS时间差
    this.gal=0.0;//北斗时与galileo时间差
}
function logOutJson() {
    this.time=time2string(cmn.timenow());
    this.posR={};
    this.obsR=new Array();
    this.ephs={"eph":new Array(),"ceph":new Array(),"geph":new Array()};
    this.alms={"alm":new Array(),"calm":new Array()};
    this.ions={"ion":new Array(),"cion":new Array()};
    this.uras={"ura":new Array(),"cura":new Array()};
    this.utcs={"utc":new Array(),"cutc":new Array()};
    this.udre=new Array();
    this.rura=new Array();
};module.exports.logOutJson=logOutJson;
function posR_create() {
    this.stat=0;
    this.week=0;
    this.tow=0;
    this.time=0;
    this.Lat=0;
    this.Lon=0;
    this.H=0;
    this.posNum=0;
    this.trackNum=0;
    this.exsats="";
    this.HDOP=0;
    this.VDOP=0;
    this.dH=0;
    this.dV=0;
    this.Hc=0;
    this.Vc=0;
    this.HPL=0;
    this.VPL=0;
    this.navsys=[]
}module.exports.posR_create=posR_create;
function satR_create() {
    this.sys=0;
    this.sat=0;
    this.week=0;
    this.tow=0;
    this.utc="";
    this.svh=1;
    this.ELe=0;
    this.Azi=0;
    this.SNR=[0,0];
    this.ura=0;
    this.rura=0;
    this.udre=0;
}module.exports.satR_create=satR_create;
function showJson() {
    this.time=cmn.timenow();
    this.posR={};
    this.satR=[];
}module.exports.showJson=showJson;
function posPara_create(prcopt) {
    this.obs={};
    this.nav=new nav_create();
    this.ele=new ele_create();
    this.prcopt=new prcopt_create(prcopt);
    this.sol={};
    this.bootc={};
    this.count={};
    this.mean={};
    this.rb=prcopt.rb;
    this.sigma={};
};module.exports.posPara_create=posPara_create;

function posMiddle_create() {
    this.rr={};
    this.count={};
    this.mean={};
    this.sigma={};
}
function midd_init(posInit,sta_id) {
    posInit[sta_id]={
        "rr":{},
        "count":{},
        "mean":{},
        "sigma":{}
    };
    posInit[sta_id].rr[ca.SYS_ALL]=[0,0,0];
    posInit[sta_id].rr[ca.SYS_GPS]=[0,0,0];
    posInit[sta_id].rr[ca.SYS_GLO]=[0,0,0];
    posInit[sta_id].rr[ca.SYS_CMP]=[0,0,0];

    posInit[sta_id].count[ca.SYS_ALL]=0;
    posInit[sta_id].count[ca.SYS_GPS]=0;
    posInit[sta_id].count[ca.SYS_GLO]=0;
    posInit[sta_id].count[ca.SYS_CMP]=0;

    posInit[sta_id].mean[ca.SYS_ALL]=[0,0,0,0,0,0];
    posInit[sta_id].mean[ca.SYS_GPS]=[0,0,0,0,0,0];
    posInit[sta_id].mean[ca.SYS_GLO]=[0,0,0,0,0,0];
    posInit[sta_id].mean[ca.SYS_CMP]=[0,0,0,0,0,0];

    posInit[sta_id].sigma[ca.SYS_ALL]=[0,0,0,0];
    posInit[sta_id].sigma[ca.SYS_GPS]=[0,0,0,0];
    posInit[sta_id].sigma[ca.SYS_GLO]=[0,0,0,0];
    posInit[sta_id].sigma[ca.SYS_CMP]=[0,0,0,0];
}
function posParainit(sta_id,para) {
    var cwd=path.resolve(__dirname,'..');
    var posave=path.join(cwd,'/config/posmidd.json');
    var posInit={};
    try{
        if(fs.existsSync(posave)){
            posInit=JSON.parse(fs.readFileSync(posave));
            if(!posInit.hasOwnProperty(sta_id)){
                midd_init(posInit,sta_id);
            }            
        }
        else{
            midd_init(posInit,sta_id);
        }
        //fs.writeFileSync(posave,JSON.stringify(posInit));
        para.sol[ca.SYS_GPS]=new sol_create();
        para.sol[ca.SYS_GLO]=new sol_create();
        para.sol[ca.SYS_CMP]=new sol_create();
        para.sol[ca.SYS_ALL]=new sol_create();
        para.bootc[ca.SYS_GPS]=0;
        para.bootc[ca.SYS_GLO]=0;
        para.bootc[ca.SYS_CMP]=0;
        para.bootc[ca.SYS_ALL]=0;
        para.sol[ca.SYS_GPS].rr=posInit[sta_id].rr[ca.SYS_GPS];
        para.sol[ca.SYS_GLO].rr=posInit[sta_id].rr[ca.SYS_GLO];
        para.sol[ca.SYS_CMP].rr=posInit[sta_id].rr[ca.SYS_CMP];
        para.sol[ca.SYS_ALL].rr=posInit[sta_id].rr[ca.SYS_ALL];
        para.count=posInit[sta_id].count;
        para.mean=posInit[sta_id].mean;
        para.sigma=posInit[sta_id].sigma;
    }
    catch(err) {
        console.log(err);
    }
};module.exports.posParainit=posParainit;

//后处理定位
function postpos(sta_id,sta_data,post_para,postprc) {
    var logjson=new logOutJson();
    var posR=new posResult();
    if (updateObsNav(sta_data,postprc,logjson)) {
        //console.log(sta_data.obs.data[0].time.time);
        if(cmn.timediff(postprc.obs[0].time,post_para.bt)>=0 &&
            cmn.timediff(postprc.obs[0].time,post_para.et)<=0){
            if(!pnt.pntpos_RAIM(postprc.obs, postprc.nav, postprc.prcopt, postprc.sol))
                return 1;
            postOut(posR,post_para,postprc);
            return posR;
        }
    }
    return 1;
};module.exports.postpos=postpos;
function posMiddleUpdate(sta_id,para) {
    var midd;
    if(stationMiddle.hasOwnProperty(sta_id)){
        midd=stationMiddle[sta_id];
    }
    else{
        midd=new posMiddle_create();
        stationMiddle[sta_id]=midd;
    }
    midd.sol=para.sol;
    midd.count=para.count;
    midd.mean=para.mean;
    midd.sigma=para.sigma;
};module.exports.posMiddleUpdate=posMiddleUpdate;
function posStatistic(sta_id,posR) {
    var options = {
        headers: {"Connection": "close"},
        url: opt.statis_url+"add",
        method: 'POST',
        json:true,
        body: {"sta_id":sta_id,"posR":posR}
    };
    request(options,callback);
};module.exports.posStatistic=posStatistic;
function middleSaveAll(sta_id,stationPara) {
    var cwd=path.resolve(__dirname,'..');
    var posave=path.join(cwd,'/config/posmidd.json');
    fs.exists(posave,function (exist) {
        if(exist){
            fs.readFile(posave,function (err, data) {
                if(err){
                    console.log(err);
                }
                else{
                    if(data.length==0)
                        data={};
                    else
                        data=JSON.parse(data);

                    if(!data.hasOwnProperty(sta_id)) {
                        data[sta_id]=new posMiddle_create();
                    }
                    data[sta_id].rr[ca.SYS_GPS]=stationPara.sol[ca.SYS_GPS].rr;
                    data[sta_id].rr[ca.SYS_GLO]=stationPara.sol[ca.SYS_GLO].rr;
                    data[sta_id].rr[ca.SYS_CMP]=stationPara.sol[ca.SYS_CMP].rr;
                    data[sta_id].rr[ca.SYS_ALL]=stationPara.sol[ca.SYS_ALL].rr;
                    data[sta_id].count=stationPara.count;
                    data[sta_id].mean=stationPara.mean;
                    data[sta_id].sigma=stationPara.sigma;
                }
                fs.writeFile(posave,JSON.stringify(data),function (err) {
                    if(err){
                        console.log(err);
                    }
                });
                //fs.writeFileSync(posave,JSON.stringify(data));
            });
        }
        else{
            var data={};
            data[sta_id]=new posMiddle_create();
            data[sta_id].rr[ca.SYS_GPS]=stationPara.sol[ca.SYS_GPS].rr;
            data[sta_id].rr[ca.SYS_GLO]=stationPara.sol[ca.SYS_GLO].rr;
            data[sta_id].rr[ca.SYS_CMP]=stationPara.sol[ca.SYS_CMP].rr;
            data[sta_id].rr[ca.SYS_ALL]=stationPara.sol[ca.SYS_ALL].rr;
            data[sta_id].count=stationPara.count;
            data[sta_id].mean=stationPara.mean;
            data[sta_id].sigma=stationPara.sigma;
            fs.writeFile(posave,JSON.stringify(data),function (err) {
                if(err){
                    console.log(err);
                }
            });
            //fs.writeFileSync(posave,JSON.stringify(data));
        }
    });
};module.exports.middleSaveAll=middleSaveAll;
//GPS星历复制
function ephCopyGPS(eph_t) {
    var eph=Object.create(ca.eph_t);
    eph.sys=eph_t.sys;
    eph.sat=eph_t.sat;
    eph.sva=eph_t.sva;
    eph.svh=eph_t.svh;
    eph.iode=eph_t.iode;
    eph.iodc=eph_t.iodc;
    eph.week=eph_t.week;
    eph.toe=cmn.gpst2time(eph_t.week,eph_t.toe);
    eph.toc=cmn.gpst2time(eph_t.week,eph_t.toc);
    eph.toes=eph_t.toe;
    eph.tocs=eph_t.toc;
    eph.A=eph_t.A;
    eph.e=eph_t.e;
    eph.i0=eph_t.i0;
    eph.OMG0=eph_t.OMG0;
    eph.omg=eph_t.omg;
    eph.M0=eph_t.M0;
    eph.deln=eph_t.deln;
    eph.OMGd=eph_t.OMGd;
    eph.idot=eph_t.idot;
    eph.crc=eph_t.crc;
    eph.crs=eph_t.crs;
    eph.cuc=eph_t.cuc;
    eph.cus=eph_t.cus;
    eph.cic=eph_t.cic;
    eph.cis=eph_t.cis;
    eph.f0=eph_t.f0;
    eph.f1=eph_t.f1;
    eph.f2=eph_t.f2;
    eph.tgd[0]=eph_t.tgd;
    return eph;
}
//Beidou星历复制
function ephCopyBeidou(eph_t) {
    var eph=Object.create(ca.eph_t);
    eph.sys=eph_t.sys;
    eph.sat=eph_t.sat;
    eph.sva=eph_t.sva;
    eph.svh=eph_t.svh;
    eph.iode=eph_t.iode;
    eph.iodc=eph_t.iodc;
    eph.week=eph_t.week;
    eph.toe=cmn.gpst2time(eph_t.week,eph_t.toe);
    eph.toc=cmn.gpst2time(eph_t.week,eph_t.toc);
    eph.toes=eph_t.toe;
    eph.tocs=eph_t.toc;
    eph.A=eph_t.A;
    eph.e=eph_t.e;
    eph.i0=eph_t.i0;
    eph.OMG0=eph_t.OMG0;
    eph.omg=eph_t.omg;
    eph.M0=eph_t.M0;
    eph.deln=eph_t.deln;
    eph.OMGd=eph_t.OMGd;
    eph.idot=eph_t.idot;
    eph.crc=eph_t.crc;
    eph.crs=eph_t.crs;
    eph.cuc=eph_t.cuc;
    eph.cus=eph_t.cus;
    eph.cic=eph_t.cic;
    eph.cis=eph_t.cis;
    eph.f0=eph_t.f0;
    eph.f1=eph_t.f1;
    eph.f2=eph_t.f2;
    eph.tgd[0]=eph_t.tgd[0];
    eph.tgd[1]=eph_t.tgd[1];
    return eph;
}

//更新观测数据及星历数据
function updateObsNav(sta_data,para,logjson) {
    var i,j;
    var reg=0;
    if(sta_data.obs.flag==1){
        para.obs={};
        obsBySys(para.obs,sta_data.obs.data);
        reg=1;
    }
    if(sta_data.eph.flag==1) {
        /*if(sta_data.eph.data[0].sys==ca.SYS_GPS)
         console.log(sta_data.eph.data[0].toe.time,sta_data.time.time);*/
        var eph=sta_data.eph.data;
        for(i=0;i<eph.length;i++) {
            if (!eph[i].svh) {
                switch (eph[i].sys){
                    case ca.SYS_GPS:
                        if(para.ele.el_gps[eph[i].sat-1]!=undefined){
                            if(para.ele.el_gps[eph[i].sat-1]>=para.prcopt.elmin[ca.SYS_GPS]*ca.D2R){
                                if(math.abs(cmn.timediff(eph[i].toe,eph[i].toc))<3600) {
                                    ephUpdate(sta_data.time, para.nav.eph, eph[i], logjson.ephs.eph);
                                }
                            }
                        }
                        else if(math.abs(cmn.timediff(eph[i].toe,eph[i].toc))<3600){
                            ephUpdate(sta_data.time,para.nav.eph,eph[i],logjson.ephs.eph);
                        }
                        break;
                    case ca.SYS_GLO:
                        if(para.ele.el_glo[eph[i].sat-1]!=undefined){
                            if(para.ele.el_glo[eph[i].sat-1]>=para.prcopt.elmin[ca.SYS_GLO]*ca.D2R){
                                if(math.abs(cmn.timediff(eph[i].toe,eph[i].tof))<3600) {
                                    ephUpdate(sta_data.time, para.nav.geph, eph[i], logjson.ephs.geph);
                                }
                            }
                        }
                        else if(math.abs(cmn.timediff(eph[i].toe,eph[i].tof))<3600){
                            ephUpdate(sta_data.time,para.nav.geph,eph[i],logjson.ephs.geph);
                        }
                        para.nav.lam[ca.SYS_GLO][eph[i].sat - 1] = cmn.glolam(eph[i]);
                        break;
                    case ca.SYS_CMP:
                        if(para.ele.el_cmp[eph[i].sat-1]!=undefined){
                            if(para.ele.el_cmp[eph[i].sat-1]>=para.prcopt.elmin[ca.SYS_CMP]*ca.D2R){
                                if(math.abs(cmn.timediff(eph[i].toe,eph[i].toc))<3600) {
                                    ephUpdate(sta_data.time, para.nav.ceph, eph[i], logjson.ephs.ceph);
                                }
                            }
                        }
                        else if(math.abs(cmn.timediff(eph[i].toe,eph[i].toc))<3600) {
                            ephUpdate(sta_data.time,para.nav.ceph, eph[i], logjson.ephs.ceph);
                        }
                        break;
                }
            }
        }
    }
    if(sta_data.ion.flag==1){
        var ions=sta_data.ion.data;
        for(i=0;i<ions.length;i++) {
            switch (ions[i].sys){
                case ca.SYS_GPS:
                    if(!para.nav.ion_gps.stat ||
                        cmn.timediff(ions[i].time, para.nav.ion_gps.time) > 1){
                        para.nav.ion_gps.stat=1;
                        para.nav.ion_gps = ions[i];
                        logjson.ions.ion.push(ions[i]);
                    }
                    break;
                case ca.SYS_CMP:
                    if(para.nav.ion_cmp[ions[i].sat-1]==undefined)
                        para.nav.ion_cmp[ions[i].sat-1]=ions[i];
                    else{
                        if(cmn.timediff(ions[i].time, para.nav.ion_cmp[ions[i].sat-1].time) > 1){
                            para.nav.ion_cmp[ions[i].sat-1].stat = 1;
                            para.nav.ion_cmp[ions[i].sat-1] = ions[i];
                            logjson.ions.cion.push(ions[i]);
                        }
                    }
                    break;
            }
        }
    }
    if(sta_data.alm.flag==1){
        var alms=sta_data.alm.data;
        for(i=0;i<alms.length;i++) {
            switch (alms[i].sys){
                case ca.SYS_GPS:
                    logjson.alms.alm.push(alms[i]);
                    break;
                case ca.SYS_CMP:
                    logjson.alms.calm.push(alms[i]);
                    break;
            }
        }
    }
    if(sta_data.ura.flag==1){
        var uras=sta_data.ura.data;
        for(i=0;i<uras.length;i++){
            if(uras[i].sys==ca.SYS_GPS){
                logjson.uras.ura.push(uras[i]);
            }
            else if(uras[i].sys==ca.SYS_CMP){
                logjson.uras.cura.push(uras[i]);
            }
        }
    }
    if(sta_data.utc.flag==1){
        var utcs=sta_data.utc.data;
        for(i=0;i<utcs.length;i++){
            if(utcs[i].sys==ca.SYS_GPS){
                logjson.utcs.utc.push(utcs[i]);
            }
            else if(utcs[i].sys==ca.SYS_CMP){
                logjson.utcs.cutc.push(utcs[i]);
            }
        }
    }
    if(sta_data.udre.flag==1){
        var udres=sta_data.udre.data;
        for(i=0;i<udres.length;i++){
            para.nav.udre[udres[i].sat-1]=udres[i];
            logjson.udre.push(udres[i])
        }
    }
    if(sta_data.rura.flag==1){
        var ruras=sta_data.rura.data;
        for(i=0;i<ruras.length;i++){
            para.nav.rura[ruras[i].sat-1]=ruras[i];
            logjson.rura.push(ruras[i]);
        }
    }
    return reg;
};module.exports.updateObsNav=updateObsNav;
function updateObsNav_show(sta_data,para,logjson) {
    var i,j;
    var reg=0;
    if(sta_data.obs.flag==1){
        para.obs={};
        obsBySys(para.obs,sta_data.obs.data);
        reg=1;
    }
    if(sta_data.eph.flag==1) {
        var eph=sta_data.eph.data;
        for(i=0;i<eph.length;i++) {
            if (!eph[i].svh) {
                switch (eph[i].sys){
                    case ca.SYS_GPS:
                        if(para.ele.el_gps[eph[i].sat-1]!=undefined){
                            if(para.ele.el_gps[eph[i].sat-1]>=para.prcopt.elmin[ca.SYS_GPS]){
                                if(math.abs(cmn.timediff(eph[i].toe,eph[i].toc))<3600) {
                                    ephUpdate_show(sta_data.time, para.nav.eph, eph[i]);
                                }
                            }
                        }
                        else if(math.abs(cmn.timediff(eph[i].toe,eph[i].toc))<3600){
                            ephUpdate_show(sta_data.time,para.nav.eph,eph[i]);
                        }
                        break;
                    case ca.SYS_GLO:
                        if(para.ele.el_glo[eph[i].sat-1]!=undefined){
                            if(para.ele.el_glo[eph[i].sat-1]>=para.prcopt.elmin[ca.SYS_GLO]){
                                if(math.abs(cmn.timediff(eph[i].toe,eph[i].tof))<3600) {
                                    ephUpdate_show(sta_data.time, para.nav.geph, eph[i]);
                                }
                            }
                        }
                        else if(math.abs(cmn.timediff(eph[i].toe,eph[i].tof))<3600){
                            ephUpdate_show(sta_data.time,para.nav.geph,eph[i]);
                        }
                        para.nav.lam[ca.SYS_GLO][eph[i].sat - 1] = cmn.glolam(eph[i]);
                        break;
                    case ca.SYS_CMP:
                        if(para.ele.el_cmp[eph[i].sat-1]!=undefined){
                            if(para.ele.el_cmp[eph[i].sat-1]>=para.prcopt.elmin[ca.SYS_CMP]){
                                if(math.abs(cmn.timediff(eph[i].toe,eph[i].toc))<3600) {
                                    ephUpdate_show(sta_data.time, para.nav.ceph, eph[i]);
                                }
                            }
                        }
                        else if(math.abs(cmn.timediff(eph[i].toe,eph[i].toc))<3600) {
                            ephUpdate_show(sta_data.time,para.nav.ceph, eph[i]);
                        }
                        break;
                }
            }
        }
    }
    if(sta_data.ion.flag==1){
        var ions=sta_data.ion.data;
        for(i=0;i<ions.length;i++) {
            switch (ions[i].sys){
                case ca.SYS_GPS:
                    if(!para.nav.ion_gps.stat ||
                        cmn.timediff(ions[i].time, para.nav.ion_gps.time) > 1){
                        para.nav.ion_gps.stat=1;
                        para.nav.ion_gps = ions[i];
                    }
                    break;
                case ca.SYS_CMP:
                    if(para.nav.ion_cmp[ions[i].sat-1]==undefined)
                        para.nav.ion_cmp[ions[i].sat-1]=ions[i];
                    else{
                        if(cmn.timediff(ions[i].time, para.nav.ion_cmp[ions[i].sat-1].time) > 1){
                            para.nav.ion_cmp[ions[i].sat-1].stat = 1;
                            para.nav.ion_cmp[ions[i].sat-1] = ions[i];
                        }
                    }
                    break;
            }
        }
    }
    if(sta_data.ura.flag==1){
        var uras=sta_data.ura.data;
        for(i=0;i<uras.length;i++){
            if(uras[i].sys==ca.SYS_GPS){
                if(para.nav.ura_gps[uras[i].sat-1]==undefined){
                    para.nav.ura_gps[uras[i].sat-1]=uras[i];
                }
                else{
                    if(cmn.timediff(uras[i].time,para.nav.ura_gps[uras[i].sat-1].time)>0){
                        para.nav.ura_gps[uras[i].sat-1]=uras[i];
                    }
                }
            }
            else if(uras[i].sys==ca.SYS_CMP){
                if(para.nav.ura_cmp[uras[i].sat-1]==undefined){
                    para.nav.ura_cmp[uras[i].sat-1]=uras[i];
                }
                else{
                    if(cmn.timediff(uras[i].time,para.nav.ura_cmp[uras[i].sat-1].time)>0){
                        para.nav.ura_cmp[uras[i].sat-1]=uras[i];
                    }
                }
            }
        }
    }
    if(sta_data.utc.flag==1){
        var utcs=sta_data.utc.data;
        for(i=0;i<utcs.length;i++){
            if(utcs[i].sys==ca.SYS_GPS){
                para.nav.utc_gps=utcs[i];
                para.nav.utc_gps.stat=1;
            }
            else if(utcs[i].sys==ca.SYS_CMP){
                para.nav.utc_cmp=utcs[i];
                para.nav.utc_cmp.stat=1;
            }
        }
    }
    if(sta_data.udre.flag==1){
        var udres=sta_data.udre.data;
        for(i=0;i<udres.length;i++){
            para.nav.udre[udres[i].sat-1]=udres[i].udre;
        }
    }
    if(sta_data.rura.flag==1){
        var ruras=sta_data.rura.data;
        for(i=0;i<ruras.length;i++){
            para.nav.rura[ruras[i].sat-1]=ruras[i].rura;
        }
    }
    return reg;
};module.exports.updateObsNav_show=updateObsNav_show;
function obsTimeConsistent(time,obs) {
    var n=obs.length;
    for(var i=0;i<n;i++){
        if(math.abs(cmn.timediff(time,obs[i].time))!=0)
            return 0;
    }
    return 1;
};module.exports.obsTimeConsistent=obsTimeConsistent;
function obsMostNumber(obs) {
    var n=obs.length;
    var obs_time=[];
    var obs_num={};

    for(var obi in obs){
        if(!obs_time.contains(obi.time)){
            obs_time.push(obi.time);
            obs_num[obi.time]=1;
        }
        else{
            obs_num[obi.time]+=1;
        }
    }
    if(obs_time.length>0){
        var ts=obs_num[obs_time[0]];
        var time;
        for(var t in obs_num){
            if(obs_num[t]>ts){
                ts=obs_num[t];
                time=t;
            }
        }
        if(time!=null){
            for(var i=0;i<obs.length;){
                if(math.abs(cmn.timediff(time,obs[i].time))!=0){
                    obs.splice(i,1);
                    continue;
                }
                i++;
            }
        }
    }
};module.exports.obsMostNumber=obsMostNumber;
function ephConsistent(epha,ephb) {
    var time;
    var sys=ephb.sys;
    var rsa=[0,0,0],rsb=[0,0,0],rs=[0,0,0];
    var dts=[0,0];
    var vare=[0];
    var vv=0;
    if(sys==ca.SYS_GLO){
        time=epha.toe;
        ephcalc.geph2pos_port(time,epha,rsa,dts,vare);
        ephcalc.geph2pos_port(time,ephb,rsb,dts,vare);
        rs[0]=rsa[0]-rsb[0];
        rs[1]=rsa[1]-rsb[1];
        rs[2]=rsa[2]-rsb[2];
        if(cmn.norm(rs,3)>opt.eph_diff)
            return 1;
    }
    else if(sys==ca.SYS_CMP){
        if(cmn.timediff(epha.ttr,ephb.ttr)>0)
            return 1;
        else{
            if(cmn.timediff(ephb.toe,epha.toe)>3600)
                return 0;
            else{
                time=ephb.toe;
                ephcalc.eph2pos_port(time,epha,sys,rsa,dts,vare);
                ephcalc.eph2pos_port(time,ephb,sys,rsb,dts,vare);
                rs[0]=rsa[0]-rsb[0];
                rs[1]=rsa[1]-rsb[1];
                rs[2]=rsa[2]-rsb[2];
                if((vv=cmn.norm(rs,3))>opt.eph_diff)
                    return 1;
            }
        }
    }
    else if(sys==ca.SYS_GPS){
        if(cmn.timediff(epha.ttr,ephb.ttr)>0)
            return 1;
        else{
            if(cmn.timediff(ephb.toe,epha.toe)>3600*2)
                return 0;
            else{
                time=epha.toe;
                ephcalc.eph2pos_port(time,epha,sys,rsa,dts,vare);
                ephcalc.eph2pos_port(time,ephb,sys,rsb,dts,vare);
                rs[0]=rsa[0]-rsb[0];
                rs[1]=rsa[1]-rsb[1];
                rs[2]=rsa[2]-rsb[2];
                if((vv=cmn.norm(rs,3))>opt.eph_diff)
                    return 1;
            }
        }
    }
    return 0;
}
function ephUpdate(time,naveph,eph,logeph) {
    if (naveph[eph.sat - 1] != undefined) {
        if(!ephConsistent(naveph[eph.sat - 1],eph)){
            naveph[eph.sat - 1] = eph;
            if (eph.iode != naveph[eph.sat - 1].iode) {
                logeph.push(eph);
            }
        }
        else{
            console.log('')
        }
    }
    else {
        naveph[eph.sat - 1] = eph;
        logeph.push(eph);
    }
}
function ephUpdate_show(time,naveph,eph) {
    if (naveph[eph.sat - 1] != undefined) {
        if(!ephConsistent(naveph[eph.sat - 1],eph)){
            naveph[eph.sat - 1] = eph;
        }
    }
    else {
        naveph[eph.sat - 1] = eph;
    }
}
function posShowStruct(para,sys,logjson) {
    var i,j;
    var time;
    var ws=[0,0];
    var pos=new Array(3);
    var enu=new Array(3);
    var rd=new Array(3);
    var utc=new Array(2);
    var count=para.count[sys];
    var bootc=para.bootc[sys];
    var mean=para.mean[sys];
    var sigma=para.sigma[sys];
    var rb=para.rb[sys];
    var sol=para.sol[sys];
    var obs=para.obs[sys];
    var prcopt=para.prcopt;
    var nav=para.nav;
    var posR=logjson.posR[sys];
    posR.stat=sol.stat;
    if(sys==ca.SYS_ALL || sys==ca.SYS_GPS){
        cmn.time2gpst(sol.time, ws);
        time=time2string(sol.time);
    }
    else if(sys==ca.SYS_GLO){
        time=time2string(cmn.gpst2utc(sol.time));
    }
    else if(sys==ca.SYS_CMP){
        cmn.time2bdt(sol.time, ws);
        time=time2string(cmn.timeadd(sol.time,-14));
    }
    posR.week = ws[0];
    posR.tow = ws[1];
    posR.time = time;
    if(sol.stat) {
        if(bootc<prcopt.rbinit[sys] && count<prcopt.rbinit[sys]){
            mean[0] = sol.rr[0];
            mean[1] = sol.rr[1];
            mean[2] = sol.rr[2];
            mean[3] = mean[4] = mean[5] = 0;
            sigma[0]=sigma[1]=sigma[2]=sigma[3]=0;
        }
        else if(count>prcopt.rbinit[sys]){
            if((math.abs(sol.rr[0]-mean[0]) <= prcopt.mul_vare*math.sqrt(mean[3])) &&
                (math.abs(sol.rr[1]-mean[1]) <= prcopt.mul_vare*math.sqrt(mean[4])) &&
                (math.abs(sol.rr[2]-mean[2]) <= prcopt.mul_vare*math.sqrt(mean[5])) ) {
                mean_rr(mean,sol.rr,count);
                count++;
            }
        }
        if (prcopt.isrb[sys]) {
            rb[0] = prcopt.rb[sys][0];
            rb[1] = prcopt.rb[sys][1];
            rb[2] = prcopt.rb[sys][2];
        }
        else{
            rb[0] = mean[0];
            rb[1] = mean[1];
            rb[2] = mean[2];
        }
        cmn.ecef2pos(rb, pos);
        rd[0] = sol.rr[0] - rb[0];
        rd[1] = sol.rr[1] - rb[1];
        rd[2] = sol.rr[2] - rb[2];
        cmn.ecef2enu(pos, rd, enu);
        posR.dH =math.sqrt(enu[0]*enu[0]+ enu[1]*enu[1]);
        posR.dV =enu[2];
        mean_enu(sigma,enu,count);
        posR.Hc=sigma[0]+ math.sqrt(sigma[2])*1.96;
        posR.Vc=sigma[1]+ math.sqrt(sigma[3])*1.96;

        bootc++;
        para.count[sys]=count;
        para.bootc[sys]=bootc;
        posR.VPL = sol.VPL;
        posR.HPL = sol.HPL;
        posR.exsats = sol.ex;
    }
    cmn.ecef2pos(sol.rr, pos);
    posR.Lat = pos[0]*ca.R2D;
    posR.Lon = pos[1]*ca.R2D;
    posR.H = pos[2];
    posR.HDOP = sol.dop[2];
    posR.VDOP = sol.dop[3];
    posR.posNum = sol.ns;
    posR.navsys=sol.navsys;
};module.exports.posShowStruct=posShowStruct;
function satShowStruct(obs,nav,sol,logjson) {
    var satR=logjson.satR;
    var ws=[0,0];
    var time=cmn.timenow();
    for(var i=0;i< obs.length;i++){
        var ob=new satR_create();
        ob.sys=obs[i].sys;
        ob.sat=obs[i].sat;
        if(sol.stat){
            ob.Azi = sol.azel[i * 2];
            ob.Ele = sol.azel[1 + i * 2];
        }
        if(ob.sys==ca.SYS_GPS){
            if(nav.ura_gps.indexOf(ob.sat-1)!=-1){
                ob.ura=nav.ura_gps[ob.sat-1].ura;
            }
            if(nav.eph.indexOf(ob.sat-1)!=-1){
                ob.svh=nav.eph[ob.sat-1].svh;
            }
            cmn.time2gpst(obs[i].time,ws);
            time=time2string(obs[i].time);
        }
        else if(ob.sys==ca.SYS_GLO){
            if(nav.geph.indexOf(ob.sat-1)!=-1){
                ob.svh=nav.geph[ob.sat-1].svh;
                //ob.ura=para.nav.geph[ob.sat-1].sva;
            }
            time=cmn.gpst2utc(obs[i].time);
            time=time2string(time);
        }
        else if(ob.sys==ca.SYS_CMP){
            if(nav.ura_cmp.indexOf(ob.sat-1)!=-1){
                ob.ura=nav.ura_cmp[ob.sat-1].ura;
            }
            if(nav.ceph.indexOf(ob.sat-1)!=-1){
                ob.svh=nav.ceph[ob.sat-1].svh;
            }
            if(nav.rura.indexOf(ob.sat-1)!=-1){
                ob.rura=nav.rura[ob.sat-1];
            }
            if(nav.udre.indexOf(ob.sat-1)!=-1){
                ob.udre=nav.udre[ob.sat-1];
            }
            time=cmn.timeadd(obs[i].time,-14);
            cmn.time2bdt(obs[i].time,ws);
            time=time2string(time);
        }
        ob.week=ws[0];
        ob.tow=ws[1];
        ob.time=time;
        satR.push(ob);
    }
};module.exports.satShowStruct=satShowStruct;

function  posOutStruct(para,sys,logjson) {
    var i,j;
    var time;
    var ws=[0,0];
    var pos=new Array(3);
    var enu=new Array(3);
    var rd=new Array(3);
    var mean=para.mean[sys];
    var rb=para.rb[sys];
    var sol=para.sol[sys];
    var obs=para.obs[sys];
    var prcopt=para.prcopt;
    var posR=logjson.posR[sys];

    posR.stat=sol.stat;
    if(sys==ca.SYS_ALL || sys==ca.SYS_GPS){
        cmn.time2gpst(sol.time, ws);
        time=time2string(sol.time);
    }
    else if(sys==ca.SYS_GLO){
        time=time2string(cmn.gpst2utc(sol.time));
    }
    else if(sys==ca.SYS_CMP){
        cmn.time2bdt(sol.time, ws);
        time=time2string(cmn.timeadd(sol.time,-14));
    }
    posR.week = ws[0];
    posR.tow = ws[1];
    posR.time =time;
    if (prcopt.isrb[sys]) {
        rb[0] = prcopt.rb[sys][0];
        rb[1] = prcopt.rb[sys][1];
        rb[2] = prcopt.rb[sys][2];
    }
    else{
        rb[0] = mean[0];
        rb[1] = mean[1];
        rb[2] = mean[2];
    }
    posR.X = sol.rr[0];
    posR.Y = sol.rr[1];
    posR.Z = sol.rr[2];
    cmn.ecef2pos(rb, pos);
    rd[0] = sol.rr[0] - rb[0];
    rd[1] = sol.rr[1] - rb[1];
    rd[2] = sol.rr[2] - rb[2];
    cmn.ecef2enu(pos, rd, enu);
    posR.dX = enu[0];
    posR.dY = enu[1];
    posR.dZ = enu[2];
    cmn.ecef2pos(sol.rr, pos);
    posR.Lat = pos[0]*ca.R2D;
    posR.Lon = pos[1]*ca.R2D;
    posR.H = pos[2];
    posR.GDOP = sol.dop[0];
    posR.PDOP = sol.dop[1];
    posR.HDOP = sol.dop[2];
    posR.VDOP = sol.dop[3];
    posR.posNum = sol.ns;
    posR.navsys=sol.navsys;
    if(sol.stat) {
        posR.VPL = sol.VPL;
        posR.HPL = sol.HPL;
        posR.exsats = sol.ex;
    }
    posR.stat=sol.stat;
    posR.minEl=prcopt.elmin[sys];
    if(sys==ca.SYS_ALL){
        for(i=0;i<obs.length;i++){
            var rt=new obscreate();
            rt.sys=obs[i].sys;
            rt.sat=obs[i].sat;
            rt.time=obs[i].time;
            ws=[0,0];
            if(sys==ca.SYS_GPS){
                cmn.time2gpst(sol.time, ws);
            }
            else if(sys==ca.SYS_CMP){
                cmn.time2bdt(sol.time, ws);
            }
            rt.week=ws[0];
            rt.tow=ws[1];
            rt.P[0]=obs[i].P[0];
            rt.P[1]=obs[i].P[1];
            rt.L[0]=obs[i].L[0];
            rt.L[1]=obs[i].L[1];
            rt.D[0]=obs[i].D[0];
            rt.D[1]=obs[i].D[1];
            rt.S[0]=obs[i].SNR[0];
            rt.S[1]=obs[i].SNR[1];
            if(sol.stat) {
                rt.Azi = sol.azel[i * 2];
                rt.Ele = sol.azel[1 + i * 2];
            }
            logjson.obsR.push(rt);
        }
    }
};module.exports.posOutStruct=posOutStruct;
function eleUpdate(sol,obs,ele) {
    var i;
    if(sol.stat) {
        for(i=0;i<obs.length;i++){
            if(obs[i].sys==ca.SYS_GPS && sol.resp[i]!=0)
                ele.el_gps[obs[i].sat-1]=sol.azel[1 + i * 2];
            else if(obs[i].sys==ca.SYS_CMP&& sol.resp[i]!=0)
                ele.el_cmp[obs[i].sat-1]=sol.azel[1 + i * 2];
            else if(obs[i].sys==ca.SYS_GLO&& sol.resp[i]!=0)
                ele.el_glo[obs[i].sat-1]=sol.azel[1 + i * 2];
        }
    }
};module.exports.eleUpdate=eleUpdate;
function postOut(posR,post_para,para) {
    var ws=[0,0];
    var pos=[0,0,0];
    var enu=[0,0,0];
    var rd=[0,0,0];
    var sigma=para.sigma;
    var sol=para.sol;
    var mean=para.mean;
    posR.stat=sol.stat;
    cmn.time2gpst(sol.time, ws);
    posR.week = ws[0];
    posR.tow = ws[1];
    posR.time = time2string(sol.time);
    if(sol.stat) {
        posR.X = sol.rr[0];
        posR.Y = sol.rr[1];
        posR.Z = sol.rr[2];
        posR.mX=mean[0];
        posR.mY=mean[1];
        posR.mZ=mean[2];
        posR.vX=math.sqrt(mean[3]);
        posR.vY=math.sqrt(mean[4]);
        posR.vZ=math.sqrt(mean[5]);
        cmn.ecef2pos(sol.rr, pos);

        rd[0] = sol.rr[0] - post_para.rb[0];
        rd[1] = sol.rr[1] - post_para.rb[1];
        rd[2] = sol.rr[2] - post_para.rb[2];
        cmn.ecef2enu(post_para.pos, rd, enu);
        posR.dX = enu[0];
        posR.dY = enu[1];
        posR.dZ = enu[2];
        mean_enu(sigma,enu,post_para.count);
        posR.dH=sigma[0]+ math.sqrt(sigma[2])*2;
        posR.dV=sigma[1]+ math.sqrt(sigma[3])*2;

        post_para.count++;

        posR.Lat = pos[0]*ca.R2D;
        posR.Lon = pos[1]*ca.R2D;
        posR.H = pos[2];
        posR.GDOP = sol.dop[0];
        posR.PDOP = sol.dop[1];
        posR.HDOP = sol.dop[2];
        posR.VDOP = sol.dop[3];
        posR.VPL = sol.VPL;
        posR.HPL = sol.HPL;
        posR.posNum = sol.ns;
        posR.exsats = sol.ex;
        posR.navsys=sol.navsys;
    }
    posR.minEl=para.prcopt.elmin;
}
function mean_rr(mean,rr,count) {
    mean[0] = cmn.Average(rr[0], mean[0], count);
    mean[1] = cmn.Average(rr[1], mean[1], count);
    mean[2] = cmn.Average(rr[2], mean[2], count);
    if(count==0){
        mean[3] = 0;
        mean[4] = 0;
        mean[5] = 0;
    }
    else{
        mean[3] = cmn.vare(rr[0], mean[3], count, mean[0]);
        mean[4] = cmn.vare(rr[1], mean[4], count, mean[1]);
        mean[5] = cmn.vare(rr[2], mean[5], count, mean[2]);
    }
}
function mean_enu(mean,rr,count) {
    var h=math.sqrt(rr[0]*rr[0]+rr[1]*rr[1]);
    mean[0] = cmn.Average(h, mean[0], count);
    mean[1] = cmn.Average(rr[2], mean[1], count);
    if(count==0){
        mean[2]=0;
        mean[3]=0;
    }
    else{
        mean[2] = cmn.vare(h, mean[2], count, mean[0]);
        mean[3] = cmn.vare(rr[2], mean[3], count, mean[1]);
    }
}
function obsBySys(obs,sta_obs) {
    sta_obs.forEach(function(obi){
        if(obs.hasOwnProperty(obi.sys)){
            obs[obi.sys].push(obi);
        }
        else{
            obs[obi.sys]=new Array();
            obs[obi.sys].push(obi);
        }
    });
    obs[ca.SYS_ALL]=sta_obs;
}

function obssort(obs) {
    var i,j;
    var obs_t=new Array(3);
    var ind=0;
    for(j=0;j<3;j++)obs_t[j]=new Array();
    for(i=0;i<obs.length;i++){
        switch (obs[i].sys){
            case ca.SYS_GPS:
                obsSysSatSort(obs[i],obs_t[ca.SYS_GPS]);
                break;
            case ca.SYS_GLO:
                obsSysSatSort(obs[i],obs_t[ca.SYS_GLO]);
                break;
            case ca.SYS_CMP:
                obsSysSatSort(obs[i],obs_t[ca.SYS_CMP]);
                break;
        }
    }

    for(i=0;i<3;i++)for(j=0;j<obs_t[i].length;j++)obs[ind++]=obs_t[i][j];
}
function obsSysSatSort(obs,obs_t) {
    var j;
    if(obs_t.length==0)
        obs_t.push(obs);
    else{
        for(j=0;j<obs_t.length;j++){
            if(obs.sat<obs_t[j].sat){
                obs_t.splice(j,0,obs);
                break;
            }
        }
        if(j==obs_t.length)
            obs_t.push(obs);
    }
}
function time2string(time) {
    var t=new Date((time.time+time.sec)*1000);
    var month=t.getUTCMonth()+1;
    return t.getUTCFullYear()+"-"+month +"-"+
        t.getUTCDate()+" "+t.getUTCHours()+":"+
        t.getUTCMinutes()+":"+t.getUTCSeconds()+"."+
        t.getMilliseconds();
};module.exports.time2string=time2string;
//对象克隆
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
function callback(error, response, data) {
    if (error) {
        console.log(error.message);
    }
    else{

    }
}