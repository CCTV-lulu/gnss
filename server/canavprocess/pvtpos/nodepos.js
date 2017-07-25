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
//bd 电离层数据对象构建
function ioncreate_cmp() {
    var ion_cmp=new ca.ionM();
    ion_cmp.sys=ca.SYS_CMP;
    for(var i=0;i<ion_cmp.np;i++)
        ion_cmp.ion[i]=0.0;
    return ion_cmp;
};
//gps 电离层数据对象构建
function ioncreate_gps() {
    var ion_gps=new ca.ionM();
    ion_gps.sys=ca.SYS_GPS;
    for(var i=0;i<ion_gps.np;i++)
        ion_gps.ion[i]=0.0;
    return ion_gps;
}
//定位处理观测数据之外数据对象
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
//星历更新最小仰角对象构建
function ele_create() {
    this.el_gps=new Array();
    this.el_cmp=new Array();
    this.el_glo=new Array();
}
//定位处理配置文件对象构建
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
//定位处理结果对象构建
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
    this.HPL=null;
    this.VPL=null;
    this.ex="";
    this.azel=new Array();
    this.resp=new Array();
    this.svh=new Array();
    this.navsys=[];
} ;
//预处理定位结果对象构建
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
//预处理观测数据对象构建
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
//预处理输出对象构建
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
//实时处理输出对象构建
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
    this.basecoord=[0,0,0];
    this.dX=0;
    this.dY=0;
    this.dZ=0;
    this.dH=0;
    this.dV=0;
    this.HPL=0;
    this.VPL=0;
    this.navsys=[]
}module.exports.posR_create=posR_create;
//实时处理观测数据对象构建
function satR_create() {
    this.sys=0;
    this.sat=0;
    this.week=0;
    this.tow=0;
    this.utc="";
    this.svh=1;
    this.Ele=0;
    this.Azi=0;
    this.SNR=[0,0];
    this.ura=0;
    this.rura=0;
    this.udre=0;
}module.exports.satR_create=satR_create;
//实时处理输出对象构建
function showJson() {
    this.time=cmn.timenow();
    this.posR={};
    this.satR=[];
}module.exports.showJson=showJson;
//定位处理数据对象构建
function posPara_create(prcopt) {
    this.obs={};
    this.nav=new nav_create();
    this.ele=new ele_create();
    this.prcopt=new prcopt_create(prcopt);
    this.sol={};
    //this.lowpass={};
};module.exports.posPara_create=posPara_create;
//实时定位中间结果暂存对象构建
function posMiddle_create() {
    this.rr={};
    this.count={};
    this.mean={};
    this.sigma={};
}
//构建暂存过程对象
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
function lowpass_create() {
    this.X=new ca.stats_t();
    this.Y=new ca.stats_t();
    this.Z=new ca.stats_t();
    this.Xa=[];
    this.Ya=[];
    this.Za=[];
}
//使用暂存过程对象初始化定位参数
function posParainit(sta_id,para) {
    /*var cwd=path.resolve(__dirname,'..');
    var posave=path.join(cwd,'/config/posmidd.json');
    var posInit={};*/
    try{
        /*if(fs.existsSync(posave)){
            posInit=JSON.parse(fs.readFileSync(posave));
            if(!posInit.hasOwnProperty(sta_id)){
                midd_init(posInit,sta_id);
            }            
        }
        else{
            midd_init(posInit,sta_id);
        }*/
        //fs.writeFileSync(posave,JSON.stringify(posInit));
        para.sol[ca.SYS_GPS]=new sol_create();
        para.sol[ca.SYS_GLO]=new sol_create();
        para.sol[ca.SYS_CMP]=new sol_create();
        para.sol[ca.SYS_ALL]=new sol_create();
        /*para.sol[ca.SYS_GPS].rr=posInit[sta_id].rr[ca.SYS_GPS];
        para.sol[ca.SYS_GLO].rr=posInit[sta_id].rr[ca.SYS_GLO];
        para.sol[ca.SYS_CMP].rr=posInit[sta_id].rr[ca.SYS_CMP];
        para.sol[ca.SYS_ALL].rr=posInit[sta_id].rr[ca.SYS_ALL];
        para.lowpass[ca.SYS_GPS]=new lowpass_create();
        para.lowpass[ca.SYS_GLO]=new lowpass_create();
        para.lowpass[ca.SYS_CMP]=new lowpass_create();
        para.lowpass[ca.SYS_ALL]=new lowpass_create();*/
    }
    catch(err) {
        console.log(err);
    }
};module.exports.posParainit=posParainit;
//定位处理中间暂存过程对象存储
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


//使用新接收数据更新当前定位处理对象（预处理使用）
function updateObsNav(sta_data,para,logjson) {
    var i,j;
    var reg=0;
    if(sta_data.obs.flag==1){
        try{
            para.obs={};
            obsBySys(para.obs,sta_data.obs.data);
            reg=1;
        }
        catch (err){
            console.log('obs data divide group by system error');
        }
    }
    if(sta_data.eph.flag==1) {
        var eph=sta_data.eph.data;
        for(i=0;i<eph.length;i++) {
            if (!eph[i].svh) {
                switch (eph[i].sys){
                    case ca.SYS_GPS:
                        try{
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
                        }
                        catch (err){
                            para.nav.eph[eph[i].sat-1]=eph[i];
                        }
                        break;
                    case ca.SYS_GLO:
                        try{
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
                        }
                        catch (err){
                            para.nav.geph[eph[i].sat-1]=eph[i];
                        }
                        break;
                    case ca.SYS_CMP:
                        try{
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
                        }
                        catch (err){
                            para.nav.ceph[eph[i].sat-1]=eph[i];
                        }
                        break;
                    default :
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
                    try{
                        if(!para.nav.ion_gps.stat ||
                            cmn.timediff(ions[i].time, para.nav.ion_gps.time) > 1){
                            para.nav.ion_gps = ions[i];
                            para.nav.ion_gps.stat=1;
                            logjson.ions.ion.push(ions[i]);
                        }
                    }
                    catch (err){
                        para.nav.ion_gps = ions[i];
                        para.nav.ion_gps.stat=1;
                        logjson.ions.ion.push(ions[i]);
                    }
                    break;
                case ca.SYS_CMP:
                    try{
                        if(para.nav.ion_cmp[ions[i].sat-1]==undefined)
                            para.nav.ion_cmp[ions[i].sat-1]=ions[i];
                        else{
                            if(cmn.timediff(ions[i].time, para.nav.ion_cmp[ions[i].sat-1].time) > 1){
                                para.nav.ion_cmp[ions[i].sat-1] = ions[i];
                                para.nav.ion_cmp[ions[i].sat-1].stat = 1;
                                logjson.ions.cion.push(ions[i]);
                            }
                        }
                    }
                    catch (err){
                        para.nav.ion_cmp[ions[i].sat-1] = ions[i];
                        para.nav.ion_cmp[ions[i].sat-1].stat = 1;
                        logjson.ions.cion.push(ions[i]);
                    }
                    break;
                default :
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
//使用新接收数据更新当前定位处理对象（实时定位处理使用）
function updateObsNav_show(sta_data,para,logjson) {
    var i,j;
    var reg=0;
    if(sta_data.obs.flag==1){
        try{
            para.obs={};
            obsBySys(para.obs,sta_data.obs.data);
            reg=1;
        }
        catch (err){
            console.log('obs data divide group by system error');
        }
    }
    if(sta_data.eph.flag==1) {
        var eph=sta_data.eph.data;
        for(i=0;i<eph.length;i++) {
            if (!eph[i].svh) {
                switch (eph[i].sys){
                    case ca.SYS_GPS:
                        try{
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
                        }
                        catch (err){
                            para.nav.eph[eph[i].sat-1]=eph[i];
                        }
                        break;
                    case ca.SYS_GLO:
                        try{
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
                        }
                        catch (err){
                            para.nav.geph[eph[i].sat-1]=eph[i];
                        }
                        break;
                    case ca.SYS_CMP:
                        try{
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
                        }
                        catch (err){
                            para.nav.ceph[eph[i].sat-1]=eph[i];
                        }
                        break;
                    default :
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
                    try{
                        if(!para.nav.ion_gps.stat ||
                            cmn.timediff(ions[i].time, para.nav.ion_gps.time) > 1){
                            para.nav.ion_gps = ions[i];
                            para.nav.ion_gps.stat=1;
                        }
                    }
                    catch (err){
                        para.nav.ion_gps = ions[i];
                        para.nav.ion_gps.stat=1;
                    }
                    break;
                case ca.SYS_CMP:
                    try{
                        if(para.nav.ion_cmp[ions[i].sat-1]==undefined)
                            para.nav.ion_cmp[ions[i].sat-1]=ions[i];
                        else{
                            if(cmn.timediff(ions[i].time, para.nav.ion_cmp[ions[i].sat-1].time) > 1){
                                para.nav.ion_cmp[ions[i].sat-1] = ions[i];
                                para.nav.ion_cmp[ions[i].sat-1].stat = 1;
                            }
                        }
                    }
                    catch (err){
                        para.nav.ion_cmp[ions[i].sat-1] = ions[i];
                        para.nav.ion_cmp[ions[i].sat-1].stat = 1;
                    }
                    break;
                default :
                    break;
            }
        }
    }
    if(sta_data.ura.flag==1){
        var uras=sta_data.ura.data;
        for(i=0;i<uras.length;i++){
            if(uras[i].sys==ca.SYS_GPS){
                try{
                    if(para.nav.ura_gps[uras[i].sat-1]==undefined){
                        para.nav.ura_gps[uras[i].sat-1]=uras[i];
                    }
                    else{
                        if(cmn.timediff(uras[i].time,para.nav.ura_gps[uras[i].sat-1].time)>0){
                            para.nav.ura_gps[uras[i].sat-1]=uras[i];
                        }
                    }
                }
                catch (err){
                    para.nav.ura_gps[uras[i].sat-1]=uras[i];
                }
            }
            else if(uras[i].sys==ca.SYS_CMP){
                try{
                    if(para.nav.ura_cmp[uras[i].sat-1]==undefined){
                        para.nav.ura_cmp[uras[i].sat-1]=uras[i];
                    }
                    else{
                        if(cmn.timediff(uras[i].time,para.nav.ura_cmp[uras[i].sat-1].time)>0){
                            para.nav.ura_cmp[uras[i].sat-1]=uras[i];
                        }
                    }
                }
                catch (err){
                    para.nav.ura_cmp[uras[i].sat-1]=uras[i];
                }
            }
        }
    }
    if(sta_data.utc.flag==1){
        var utcs=sta_data.utc.data;
        try{
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
        catch (err){
            console.log(err);
        }
    }
    if(sta_data.udre.flag==1){
        var udres=sta_data.udre.data;
        try{
            for(i=0;i<udres.length;i++){
                para.nav.udre[udres[i].sat-1]=udres[i].udre;
            }
        }
        catch (err){
            console.log(err);
        }
    }
    if(sta_data.rura.flag==1){
        var ruras=sta_data.rura.data;
        try{
            for(i=0;i<ruras.length;i++){
                para.nav.rura[ruras[i].sat-1]=ruras[i].rura;
            }
        }
        catch (err){
            console.log(err);
        }
    }
    return reg;
};module.exports.updateObsNav_show=updateObsNav_show;
//组合定位观测数据时间一致性检测
function obsTimeConsistent(time,obs) {
    var n=obs.length;
    for(var i=0;i<n;i++){
        if(math.abs(cmn.timediff(time,obs[i].time))!=0)
            return 0;
    }
    return 1;
};module.exports.obsTimeConsistent=obsTimeConsistent;
//组合定位观测数据时间不一致数据排除
function obsMostNumber(obs) {
    var n=obs.length;
    var obs_time=[];
    var obs_num={};

    for(var i=0;i<n;i++){
        if(contains(obs_time,obs[i].time.time)){
            obs_time.push(obs[i].time.time);
            obs_num[obs[i].time.time]=1;
        }
        else{
            obs_num[obs[i].time.time]+=1;
        }
    }
    if(obs_time.length>0){
        var ts=obs_num[obs_time[0]];
        var time=obs_time[0];
        for(var t in obs_num){
            if(obs_num[t]>ts){
                ts=obs_num[t];
                time=t;
            }
        }
        if(time!=null){
            for(var i=0;i<obs.length;){
                if(math.abs(time-obs[i].time.time)!=0){
                    obs.splice(i,1);
                    continue;
                }
                i++;
            }
        }
    }
};module.exports.obsMostNumber=obsMostNumber;
function contains(arry,u) {
    for(var i=0;i<arry.length;i++){
        if(arry[i]==u)
            return 0;
    }
    return 1;
}
//广播星历更新前故障检测
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
//使用新接收星历更新当前定位星历参数（预处理使用）
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
//使用新接收星历更新当前定位星历参数（实时定位处理使用）
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
//实时定位定位结果对象构建
function posShowStruct(para,sys,logjson) {
    var i,j;
    var time;
    var ws=[0,0];
    var pos=[0,0,0];
    var enu=[0,0,0];
    var rd=[0,0,0];
    var rb=[0,0,0];
    //var lowpass=para.lowpass[sys];
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
    if(prcopt.rb!=0){
        rb[0]=prcopt.rb[0];
        rb[1]=prcopt.rb[1];
        rb[2]=prcopt.rb[2];

        rd[0] = sol.rr[0] - rb[0];
        rd[1] = sol.rr[1] - rb[1];
        rd[2] = sol.rr[2] - rb[2];
        cmn.ecef2pos(rb, pos);
        cmn.ecef2enu(pos, rd, enu);
        posR.dX =enu[0];
        posR.dY =enu[1];
        posR.dZ =enu[2];
        posR.dH=math.sqrt(posR.dX*posR.dX+posR.dY*posR.dY);
        posR.dV=math.abs(posR.dZ);
        posR.basecoord[0]=rb[0];
        posR.basecoord[1]=rb[1];
        posR.basecoord[2]=rb[2];
    }
    else{
        posR.dX =null;
        posR.dY =null;
        posR.dZ =null;
        posR.dH=null;
        posR.dV=null;
        posR.basecoord[0]=null;
        posR.basecoord[1]=null;
        posR.basecoord[2]=null;
    }
    posR.VPL = sol.VPL;
    posR.HPL = sol.HPL;
    posR.exsats = sol.ex;
    cmn.ecef2pos(sol.rr, pos);
    posR.Lat = pos[0]*ca.R2D;
    posR.Lon = pos[1]*ca.R2D;
    posR.H = pos[2];
    posR.HDOP = sol.dop[2];
    posR.VDOP = sol.dop[3];
    posR.posNum = sol.ns;
    posR.navsys=sol.navsys;
};module.exports.posShowStruct=posShowStruct;
//实时定位观测数据结果对象构建
function satShowStruct(obs,nav,sol,logjson) {
    var satR=logjson.satR;
    var ws=[0,0];
    var time=cmn.timenow();
    for(var i=0;i< obs.length;i++){
        var ob=new satR_create();
        ob.sys=obs[i].sys;
        ob.sat=obs[i].sat;
        ob.SNR[0]=obs[i].SNR[0]*0.25;
        ob.SNR[1]=obs[i].SNR[1]*0.25;
        //if(sol.stat){
            ob.Azi = sol.azel[i * 2]*ca.R2D;
            ob.Ele = sol.azel[1 + i * 2]*ca.R2D;
        //}
        if(ob.sys==ca.SYS_GPS){
            ob.rura=undefined;
            ob.udre=undefined;
            if(nav.ura_gps[ob.sat-1]!=undefined){
                ob.ura=nav.ura_gps[ob.sat-1].ura;
            }
            if(nav.eph[ob.sat-1]!=undefined){
                ob.svh=nav.eph[ob.sat-1].svh;
            }
            cmn.time2gpst(obs[i].time,ws);
            time=time2string(obs[i].time);
        }
        else if(ob.sys==ca.SYS_GLO){
            ob.ura=undefined;
            ob.rura=undefined;
            ob.udre=undefined;
            if(nav.geph[ob.sat-1]!=undefined){
                ob.svh=nav.geph[ob.sat-1].svh;
                //ob.ura=para.nav.geph[ob.sat-1].sva;
            }
            time=cmn.gpst2utc(obs[i].time);
            time=time2string(time);
        }
        else if(ob.sys==ca.SYS_CMP){
            if(nav.ura_cmp[ob.sat-1]!=undefined){
                ob.ura=nav.ura_cmp[ob.sat-1].ura;
            }
            if(nav.ceph[ob.sat-1]!=undefined){
                ob.svh=nav.ceph[ob.sat-1].svh;
            }
            if(nav.rura[ob.sat-1]!=undefined){
                ob.rura=nav.rura[ob.sat-1];
            }
            if(nav.udre[ob.sat-1]!=undefined){
                ob.udre=nav.udre[ob.sat-1];
            }
            time=cmn.gpst2bdt(obs[i].time);
            cmn.time2bdt(time,ws);
            time=time2string(time);
        }
        if(sol.svh[i]>0){
            ob.svh=1;
        }
        ob.week=ws[0];
        ob.tow=ws[1];
        ob.time=time;
        satR.push(ob);
    }
};module.exports.satShowStruct=satShowStruct;
//预处理结果输出对象构建
function  posOutStruct(para,sys,logjson) {
    var i,j;
    var time;
    var ws=[0,0];
    var pos=[0,0,0];
    var enu=[0,0,0];
    var rd=[0,0,0];
    var rb=[0,0,0];
    //var lowpass=para.lowpass[sys];
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
    posR.X = sol.rr[0];
    posR.Y = sol.rr[1];
    posR.Z = sol.rr[2];
    posR.GDOP = sol.dop[0];
    posR.PDOP = sol.dop[1];
    posR.HDOP = sol.dop[2];
    posR.VDOP = sol.dop[3];
    posR.stat=sol.stat;
    posR.minEl=prcopt.elmin[sys];
    if(prcopt.rb!=0){
        rb[0]=prcopt.rb[0];
        rb[1]=prcopt.rb[1];
        rb[2]=prcopt.rb[2];

        rd[0] = sol.rr[0] - rb[0];
        rd[1] = sol.rr[1] - rb[1];
        rd[2] = sol.rr[2] - rb[2];
        cmn.ecef2pos(rb, pos);
        cmn.ecef2enu(pos, rd, enu);
        posR.dX =enu[0];
        posR.dY =enu[1];
        posR.dZ =enu[2];
        posR.dH=math.sqrt(posR.dX*posR.dX+posR.dY*posR.dY);
        posR.dV=math.abs(posR.dZ);
    }
    else{
        posR.dX =null;
        posR.dY =null;
        posR.dZ =null;
        posR.dH=null;
        posR.dV=null;
    }
    cmn.ecef2pos(sol.rr, pos);
    posR.Lat = pos[0]*ca.R2D;
    posR.Lon = pos[1]*ca.R2D;
    posR.H = pos[2];

    posR.posNum = sol.ns;
    posR.navsys=sol.navsys;
    posR.VPL = sol.VPL;
    posR.HPL = sol.HPL;
    posR.exsats = sol.ex;
    if(sys==ca.SYS_ALL){
        for(i=0;i<obs.length;i++){
            var rt=new obscreate();
            rt.sys=obs[i].sys;
            rt.sat=obs[i].sat;
            rt.time=obs[i].time;
            ws=[0,0];
            if(sys==ca.SYS_GPS){
                cmn.time2gpst(obs[i].time, ws);
            }
            else if(sys==ca.SYS_CMP){
                cmn.time2bdt(cmn.gpst2bdt(obs[i].time), ws);
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
//更新最新卫星仰角数据
function eleUpdate(sol,obs,ele) {
    var i;
    try{
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
    }
    catch (err){
        ele.el_gps=[];
        ele.el_glo=[];
        ele.el_cmp=[];
        console.log('elevation data update error, and reset');
    }
};module.exports.eleUpdate=eleUpdate;
//计算定位结果均值方差
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
//计算定位误差均值方差
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
//按导航系统分解观测数据
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
function calc_lowpass(lowpass,len,rr) {

    cmn.lowpass_add(lowpass.X,rr[0]);
    cmn.lowpass_add(lowpass.Y,rr[1]);
    cmn.lowpass_add(lowpass.Z,rr[2]);
    lowpass.Xa.push(rr[0]);
    lowpass.Ya.push(rr[1]);
    lowpass.Za.push(rr[2]);
    if(lowpass.Xa.length>len){
        cmn.lowpass_sub(lowpass.X,lowpass.Xa[0]);
        cmn.lowpass_sub(lowpass.Y,lowpass.Ya[0]);
        cmn.lowpass_sub(lowpass.Z,lowpass.Za[0]);
        lowpass.Xa.shift();
        lowpass.Ya.shift();
        lowpass.Za.shift();
    }
}
//服务系统定义时间格式转换到年月日形式
function time2string(time) {
    var t=new Date((time.time+time.sec)*1000);
    var month=t.getUTCMonth()+1;
    return t.getUTCFullYear()+"-"+month +"-"+
        t.getUTCDate()+" "+t.getUTCHours()+":"+
        t.getUTCMinutes()+":"+t.getUTCSeconds()+"."+
        t.getMilliseconds();
};module.exports.time2string=time2string;
