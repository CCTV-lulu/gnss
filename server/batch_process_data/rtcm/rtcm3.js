/**
 * Created by a on 2016/8/22.
 */
/*------------------------------------------------------------------------------
 * rtcm3 : rtcm ver.3 message decorder functions
 *-----------------------------------------------------------------------------*/

/* constants -----------------------------------------------------------------*/
var ca=require('../routes/calib.js');
var cmn=require('../routes/comn.js');
var opt=require('./opt.json');
var math=require('mathjs');

var PRUNIT_GPS = 299792.458;  /* rtcm ver.3 unit of gps pseudorange (m) */
var PRUNIT_GLO = 599584.916;  /* rtcm ver.3 unit of glonass pseudorange (m) */
var RANGE_MS   = (ca.CLIGHT*0.001);      /* range in 1 ms */

var P2_10=      0.0009765625;          /* 2^-10 */
var P2_5 =       0.03125 ;            /* 2^-5 */
var P2_6  =      0.015625;            /* 2^-6 */
var P2_9	=	 1.953125e-3 ;/* 2^-9 */
var P2_8	=	 3.90625e-3; /* 2^-8 */
var P2_11 =      4.882812500000000E-04; /* 2^-11 */
var P2_15 =      3.051757812500000E-05; /* 2^-15 */
var P2_17 =      7.629394531250000E-06; /* 2^-17 */
var P2_19 =      1.907348632812500E-06; /* 2^-19 */
var P2_20 =      9.536743164062500E-07; /* 2^-20 */
var P2_21 =      4.768371582031250E-07; /* 2^-21 */
var P2_23 =      1.192092895507810E-07; /* 2^-23 */
var P2_24 =      5.960464477539063E-08; /* 2^-24 */
var P2_27 =      7.450580596923828E-09; /* 2^-27 */
var P2_29 =      1.862645149230957E-09; /* 2^-29 */
var P2_30 =      9.313225746154785E-10; /* 2^-30 */
var P2_31 =      4.656612873077393E-10; /* 2^-31 */
var P2_32 =      2.328306436538696E-10 ;/* 2^-32 */
var P2_33 =      1.164153218269348E-10; /* 2^-33 */
var P2_34=	 5.82076609134674e-11;/* 2^-34 */
var P2_35 =      2.910383045673370E-11 ;/* 2^-35 */
var P2_38  =     3.637978807091710E-12 ;/* 2^-38 */
var P2_39 =      1.818989403545856E-12; /* 2^-39 */
var P2_40 =      9.094947017729280E-13; /* 2^-40 */
var P2_43 =      1.136868377216160E-13; /* 2^-43 */
var P2_44 =	 5.68434188608080e-14;/* 2^-44 */
var P2_46=	1.42108547152020e-14;/* 2^-46 */
var P2_48 =      3.552713678800501E-15; /* 2^-48 */
var P2_50 =      8.881784197001252E-16; /* 2^-50 */
var P2_55 =      2.775557561562891E-17; /* 2^-55 */
var P2_57=	6.938893903907228e-18;/* 2^-57 */
var P2_59=	1.73472347597680e-18;/* 2^-59 */
var P2_60=	8.67361737988404e-19;/* 2^-60 */
var P2_66 =      1.355252715606881E-20; /* 2^-66 */

var c_2p16 = 65536;
var c_2p14 = 16384;
var c_2p12 = 4096;
var c_2p11 = 2048;
var c_2p4  = 16;
var c_2p3  = 8;
var c_2m5  = 0.03125;
var c_2m6  = 0.015625;
var c_2m9  = 1.953125e-3;
var c_2m8  = 3.90625e-3;
var c_2m11 = 4.8828125e-4;
var c_2m19 = 1.9073486328125e-6;
var c_2m20 = 9.5367431640625e-7;
var c_2m21 = 4.76837158203125e-7;
var c_2m23 = 1.19209289550781e-7;
var c_2m24 = 5.96046447753906e-8;
var c_2m27 = 7.45058059692383e-9;
var c_2m29 = 1.86264514923096e-9;
var c_2m30 = 9.31322574615479e-10;
var c_2m31 = 4.65661287307739e-10;
var c_2m32 = 2.328306436538696e-10;
var c_2m33 = 1.16415321826935E-10;
var c_2m34 = 5.82076609134674e-11;
var c_2m35 = 2.910383045673370e-11;
var c_2m38 = 3.63797880709171e-12;
var c_2m40 = 9.09494701772928e-13;
var c_2m43 = 1.13686837721616e-13;
var c_2m44 = 5.68434188608080e-14;
var c_2m46 = 1.42108547152020e-14;
var c_2m48 = 3.55271367880050e-15;
var c_2m50 = 8.881784197e-16;
var c_2m55 = 2.77555756156289e-17;
var c_2m57 = 6.938893903907228e-18;
var c_2m59 = 1.73472347597680e-18;
var c_2m60 = 8.67361737988404e-19;
var c_2m66 = 1.35525271560688e-20;
/* type definition -----------------------------------------------------------*/

var msm_h_t={                    /* multi-signal-message header type */
    iod:0,              /* issue of data station */
    time_s:0,           /* cumulative session transmitting time */
    clk_str:0,          /* clock steering indicator */
    clk_ext:0,          /* external clock indicator */
    smooth:0,           /* divergence free smoothing indicator */
    tint_s:0,         /* soothing interval */
    nsat:0,nsig:0,        /* number of satellites/signals */
    sats:new Array(64),         /* satellites */
    sigs:new Array(32),         /* signals */
    cellmask:new Array(64)     /* cell mask */
} ;

/* msm signal id table -------------------------------------------------------*/
var msm_sig_gps=[
    /* GPS: ref [13] table 3.5-87, ref [14] table 3.5-91 */
    ""  ,"1C","1P","1W","1Y","1M",""  ,"2C","2P","2W","2Y","2M", /*  1-12 */
    ""  ,""  ,"2S","2L","2X",""  ,""  ,""  ,""  ,"5I","5Q","5X", /* 13-24 */
    ""  ,""  ,""  ,""  ,""  ,"1S","1L","1X"                      /* 25-32 */
];
msm_sig_glo=[
    /* GLONASS: ref [13] table 3.5-93, ref [14] table 3.5-97 */
    ""  ,"1C","1P",""  ,""  ,""  ,""  ,"2C","2P",""  ,"3I","3Q",
    "3X",""  ,""  ,""  ,""  ,""  ,""  ,""  ,""  ,""  ,""  ,""  ,
    ""  ,""  ,""  ,""  ,""  ,""  ,""  ,""
];
msm_sig_gal=[
    /* Galileo: ref [13] table 3.5-96, ref [14] table 3.5-100 */
    ""  ,"1C","1A","1B","1X","1Z",""  ,"6C","6A","6B","6X","6Z",
    ""  ,"7I","7Q","7X",""  ,"8I","8Q","8X",""  ,"5I","5Q","5X",
    ""  ,""  ,""  ,""  ,""  ,""  ,""  ,""
];
msm_sig_qzs=[
    /* QZSS: ref [13] table 3.5-T+003 */
    ""  ,"1C",""  ,""  ,""  ,"1Z",""  ,""  ,"6S","6L","6X",""  ,
    ""  ,""  ,"2S","2L","2X",""  ,""  ,""  ,""  ,"5I","5Q","5X",
    ""  ,""  ,""  ,""  ,""  ,"1S","1L","1X"
];
msm_sig_sbs=[
    /* SBAS: ref [13] table 3.5-T+005 */
    ""  ,"1C",""  ,""  ,""  ,""  ,""  ,""  ,""  ,""  ,""  ,""  ,
    ""  ,""  ,""  ,""  ,""  ,""  ,""  ,""  ,""  ,"5I","5Q","5X",
    ""  ,""  ,""  ,""  ,""  ,""  ,""  ,""
];
msm_sig_cmp=[
    /* BeiDou: ref [15] table 3.5-106 */
    ""  ,"1I","1Q","1X",""  ,""  ,""  ,"6I","6Q","6X",""  ,""  ,
    ""  ,"7I","7Q","7X",""  ,""  ,""  ,""  ,""  ,""  ,""  ,""  ,
    ""  ,""  ,""  ,""  ,""  ,""  ,""  ,""
];
/* ssr update intervals ------------------------------------------------------*/
ssrudint=[
    1,2,5,10,15,30,60,120,240,300,600,900,1800,3600,7200,10800
];
function getbitu32(buff, pos, len) {
    var bits=0;
    var i;
    for (i=pos;i<pos+len;i++) bits=(bits<<1)+((buff[i>>3]>>(7-i%8))&1);
    bits=bits>>>0;
    return bits;
}
function getbitu(buff, pos, len){
    var bits=0;
    var i;
    for (i=pos;i<pos+len;i++) bits=(bits<<1)+((buff[i>>3]>>(7-i%8))&1);
    return bits;
}
function getbits(buff, pos, len){
    var bits=getbitu(buff,pos,len);
    if (len<=0||32<=len||!(bits&(1<<(len-1))))
        return bits;
    return (bits|(~0<<len)); /* extend sign */
}
/* get sign-magnitude bits ---------------------------------------------------*/
function getbitg(buff, pos, len){
    var value=cmn.getbitu(buff,pos+1,len-1);
    return getbitu(buff,pos,1)?-value:value;
}
/* adjust weekly rollover of gps time ----------------------------------------*/
function adjweek(rtcm, tow){
    var ws=new Array(2);
    var time;
    /* if no time, get cpu time */
    if(rtcm.time.time==0)
        time=new cmn.timenow();
    else
        time=rtcm.time;
    cmn.time2gpst(time,ws);
    if      (tow<ws[1]-302400.0) tow+=604800.0;
    else if (tow>ws[1]+302400.0) tow-=604800.0;
    rtcm.obsd.time=cmn.gpst2time(ws[0],tow);
}
/* adjust weekly rollover of bdt time ----------------------------------------*/
function adjbdtweek(rtcm,week){
    var ws=new Array(2);
    cmn.time2bdt(cmn.gpst2bdt(rtcm.time),ws);
    if (ws[0]<1) ws[0]=1; /* use 2006/1/1 if time is earlier than 2006/1/1 */
    return week+math.floor((ws[0]-week+512)/1024)*1024;
}
function adjgpsweek(rtcm,week){
    var ws=new Array(2);
    var tow_p;
    cmn.time2gpst(rtcm.time,ws);
    if (ws[0]<1560) ws[0]=1560; /* use 2009/12/1 if time is earlier than 2009/12/1 */
    return week+math.floor((ws[0]-week+512)/1024)*1024;
}
/* adjust daily rollover of glonass time -------------------------------------*/
function adjday_glot(rtcm, tod){
    var time;
    var ws=new Array(2),tod_p;
    //time=new cmn.timenow();
    if (rtcm.time.time==0)
        time=new cmn.timenow();
    else
        time=rtcm.time;
    time=cmn.timeadd(cmn.gpst2utc(time),10800.0); /* glonass time */
    cmn.time2gpst(time,ws);
    tod_p=ws[1]%86400.0; ws[1]-=tod_p;
    if      (tod<tod_p-43200.0) tod+=86400.0;
    else if (tod>tod_p+43200.0) tod-=86400.0;
    time=cmn.gpst2time(ws[0],ws[1]+tod);
    rtcm.obsd.time=cmn.utc2gpst(cmn.timeadd(time,-10800.0));
}
/* adjust carrier-phase rollover ---------------------------------------------*/
function adjcp(obsd,sys, sat, freq, cp){
    if (obsd.cp[sys][sat-1][freq]==0.0) ;
    else if (cp<obsd.cp[sys][sat-1][freq]-750.0) cp+=1500.0;
    else if (cp>obsd.cp[sys][sat-1][freq]+750.0) cp-=1500.0;
    obsd.cp[sys][sat-1][freq]=cp;
    return cp;
}
function adobstime(obsd) {
    for(var i=0;i<obsd.obs.length;i++){
        if(math.abs(cmn.timediff(obsd.time,obsd.obs[i].time))){
            obsd.obs.splice(i,1);
        }
    }
    return 1;
}
/* loss-of-lock indicator ----------------------------------------------------*/
function lossoflock(obsd,sys, sat, freq, lock){
    var lli=(!lock&&!obsd.lock[sys][sat-1][freq])||lock<obsd.lock[sys][sat-1][freq];
    obsd.lock[sys][sat-1][freq]=lock;
    return lli;
}
/* s/n ratio -----------------------------------------------------------------*/
function snratio(snr){
    return (snr<=0.0||255.5<=snr?0.0:snr*4.0+0.5);
}
/* get observation data index ------------------------------------------------*/
function obsindex(obsd,sys, sat){
    var i=obsd.obs.length,j;
    /*for (i=0;i<rtcm.obs.length;i++) {
        if (rtcm.obs[i].sat==sat) return i; /!* field already exists *!/
    }*/
    obsd.obs.push(new ca.obsd_t());
    /* add new field */
    obsd.obs[i].sys=sys;
    obsd.obs[i].time=obsd.time;
    obsd.obs[i].sat=sat;
    for (j=0;j<ca.NFREQ;j++) {
        obsd.obs[i].L[j]=obsd.obs[i].P[j]=0.0;
        obsd.obs[i].D[j]=0.0;
        obsd.obs[i].SNR[j]=obsd.obs[i].LLI[j]=obsd.obs[i].code[j]=0;
    }
    return i;
}
/* test station id consistency -----------------------------------------------*/
function test_staid(rtcm, staid){
    var id;
    if((id=cmn.stano(staid))<0 || rtcm.obsd.sta_id!=staid)
        return -1;
    return id;
}
function stano(staid) {
    var i;
    for(i=0;i<opt.sta_id.length;i++){
        if(opt.sta_id[i]==staid)
            return i;
    }
    return -1;
}
//GPS观测数据头
/* decode type 1001-1004 message header --------------------------------------*/
function decode_head1001(buff,rtcm){
    var tow,sync;
    var i=24,staid,nsat,type,temp1,temp2;
    var id=0;
    type=getbitu(buff,i,12); i+=12;
    if (i+52<=rtcm.len*8) {
        staid=getbitu(buff,i,12);       i+=12;
        tow  =getbitu(buff,i,30)*0.001; i+=30;
        sync=getbitu(buff,i, 1);       i+= 1;
        nsat =getbitu(buff,i, 5);       i+=5;
        temp1 =getbitu(buff,i, 1);      i+=1;
        temp2 = getbitu(buff,i, 3);
    }
    else {
        return -1;
    }
    /*if((id=test_staid(rtcm,staid))<0)
        return -1;*/
    adjweek(rtcm,tow);
    if(!sync)
        adobstime(rtcm.obsd);
    rtcm.obsd.sync=sync;
    rtcm.obsd.nsat=nsat;
    return 1;
}
//BD 观测数据头
/* decode type 1004: extended L1&L2 gps rtk observables ----------------------*/
function decode_type1004(buff,rtcm){
//    const int L2codes[]={CODE_L2C,CODE_L2P,CODE_L2W,CODE_L2W};
    var L2codes=[ca.CODE_L2W,ca.CODE_L2P,ca.CODE_L2W,ca.CODE_L2W];//ldy 20131214

    var pr1,cnr1,cnr2,tt,cp1,cp2;
    var i=24+64,j,index,id,prn,sat,code1,code2,pr21,ppr1,ppr2;
    var lock1,lock2,amb,sys;
    var ep2=new Array(6),ep=[2014, 1,  4, 22, 33, 0.0000000];	//add test code by LDY ,6/1/2014//  > 2014  1  4 22 26 55.0000000  0 19

    if (decode_head1001(buff,rtcm)<0) return -1;

    for (j=0;j<rtcm.obsd.nsat&&i+125<=rtcm.len*8;j++) {

        prn  =getbitu(buff,i, 6); i+= 6;
        code1=getbitu(buff,i, 1); i+= 1;
        pr1  =getbitu(buff,i,24); i+=24;
        ppr1 =getbits(buff,i,20); i+=20;
        lock1=getbitu(buff,i, 7); i+= 7;
        amb  =getbitu(buff,i, 8); i+= 8;
        cnr1 =getbitu(buff,i, 8); i+= 8;
        code2=getbitu(buff,i, 2); i+= 2;
        pr21 =getbits(buff,i,14); i+=14;
        ppr2 =getbits(buff,i,20); i+=20;
        lock2=getbitu(buff,i, 7); i+= 7;
        cnr2 =getbitu(buff,i, 8); i+= 8;

        sys=ca.SYS_GPS;
        sat=prn;

        if ((index=obsindex(rtcm.obsd,sys,sat))<0) continue;
        pr1=pr1*0.02+amb*PRUNIT_GPS;
        if (ppr1!=0xFFF80000) {
            rtcm.obsd.obs[index].P[0]=pr1;
            cp1=adjcp(rtcm.obsd,sys,sat,0,ppr1*0.0005/ca.lam_carr[0]);
            rtcm.obsd.obs[index].L[0]=pr1/ca.lam_carr[0]+cp1;
        }
        rtcm.obsd.obs[index].LLI[0]=lossoflock(rtcm.obsd,sys,sat,0,lock1);
        rtcm.obsd.obs[index].SNR[0]=snratio(cnr1*0.25);
        rtcm.obsd.obs[index].code[0]=code1?ca.CODE_L1P:ca.CODE_L1C;

        if (pr21!=0xFFFFE000) {
            rtcm.obsd.obs[index].P[1]=pr1+pr21*0.02;
        }
        if (ppr2!=0xFFF80000) {
            cp2=adjcp(rtcm.obsd,sys,sat,1,ppr2*0.0005/ca.lam_carr[1]);
            rtcm.obsd.obs[index].L[1]=pr1/ca.lam_carr[1]+cp2;
        }
        rtcm.obsd.obs[index].LLI[1]=lossoflock(rtcm.obsd,sys,sat,1,lock2);
        rtcm.obsd.obs[index].SNR[1]=snratio(cnr2*0.25);
        rtcm.obsd.obs[index].code[1]=L2codes[code2];

        //end//
    }
    rtcm.time=rtcm.obsd.time;
    return 1;
}

/* decode type 1009-1012 message header --------------------------------------*/
function decode_head1009(buff,rtcm){
    var tod,sync,id;
    var i=24,staid,nsat,type;

    type=getbitu(buff,i,12); i+=12;

    if (i+49<=rtcm.len*8) {
        staid=getbitu(buff,i,12);       i+=12;
        tod  =getbitu(buff,i,27)*0.001; i+=27; /* sec in a day */
        sync=getbitu(buff,i, 1);       i+= 1;
        nsat =getbitu(buff,i, 5);
    }
    else {
        return -1;
    }
    adjday_glot(rtcm,tod);
    if(!sync)
        adobstime(rtcm.obsd);
    rtcm.obsd.sync=sync;
    rtcm.obsd.nsat=nsat;
    return 1;
}
/* decode type 1001-1004 message header --------------------------------------*/
function decode_head1104(buff,rtcm){
    var tow,sync,id;
    var i=24,staid,nsat,type;
    type=getbitu(buff,i,12); i+=12;
    if (i+52<=rtcm.len*8) {
        staid=getbitu(buff,i,12);       i+=12;
        tow  =getbitu(buff,i,30)*0.001; i+=30;
        sync=getbitu(buff,i, 1);       i+= 1;
        nsat =getbitu(buff,i, 5);
    }
    else {
        return -1;
    }
    tow = tow  + 14;
    adjweek(rtcm,tow);
    if(!sync)
        adobstime(rtcm.obsd);
    rtcm.obsd.sync=sync;
    rtcm.obsd.nsat=nsat;
    return 1;
}

//GPS星历数据
/* decode type 1019: gps ephemerides -----------------------------------------*/
function decode_type1019(buff,rtcm){
    var eph=new ca.eph_t();
    var toc,sqrtA;
    var i=24+12,prn,sat,week,sys=ca.SYS_GPS;
    if (i+476<=rtcm.len*8) {
        prn       =getbitu(buff,i, 6);              i+= 6;
        week      =getbitu(buff,i,10);              i+=10;
        eph.sva   =getbitu(buff,i, 4);              i+= 4;
        eph.code  =getbitu(buff,i, 2);              i+= 2;
        eph.idot  =getbits(buff,i,14)*P2_43*ca.SC2RAD; i+=14;
        eph.iode  =getbitu(buff,i, 8);              i+= 8;
        toc       =getbitu(buff,i,16)*16.0;         i+=16;
        eph.f2    =getbits(buff,i, 8)*P2_55;        i+= 8;
        eph.f1    =getbits(buff,i,16)*P2_43;        i+=16;
        eph.f0    =getbits(buff,i,22)*P2_31;        i+=22;
        eph.iodc  =getbitu(buff,i,10);              i+=10;
        eph.crs   =getbits(buff,i,16)*P2_5;         i+=16;
        eph.deln  =getbits(buff,i,16)*P2_43*ca.SC2RAD; i+=16;
        eph.M0    =getbits(buff,i,32)*P2_31*ca.SC2RAD; i+=32;
        eph.cuc   =getbits(buff,i,16)*P2_29;        i+=16;
        eph.e     =getbitu(buff,i,32)*P2_33;        i+=32;
        eph.cus   =getbits(buff,i,16)*P2_29;        i+=16;
        sqrtA      =getbitu32(buff,i,32)*P2_19;        i+=32;
        eph.toes  =getbitu(buff,i,16)*16.0;         i+=16;
        eph.cic   =getbits(buff,i,16)*P2_29;        i+=16;
        eph.OMG0  =getbits(buff,i,32)*P2_31*ca.SC2RAD; i+=32;
        eph.cis   =getbits(buff,i,16)*P2_29;        i+=16;
        eph.i0    =getbits(buff,i,32)*P2_31*ca.SC2RAD; i+=32;
        eph.crc   =getbits(buff,i,16)*P2_5;         i+=16;
        eph.omg   =getbits(buff,i,32)*P2_31*ca.SC2RAD; i+=32;
        eph.OMGd  =getbits(buff,i,24)*P2_43*ca.SC2RAD; i+=24;
        eph.tgd[0]=getbits(buff,i, 8)*P2_31;        i+= 8;
        eph.svh   =getbitu(buff,i, 6);              i+= 6;
        eph.flag  =getbitu(buff,i, 1);              i+= 1;
        eph.fit   =getbitu(buff,i, 1)?0.0:4.0; /* 0:4hr,1:>4hr */
    }
    else {
        return -1;
    }
    sat=prn;
    eph.sat=sat;
    //eph.week=week;
    if(week==918){
        var x=10;
    }
    eph.week=adjgpsweek(rtcm,week);
    eph.toe=cmn.gpst2time(eph.week,eph.toes);
    eph.toc=cmn.gpst2time(eph.week,toc);
    eph.ttr=rtcm.time;
    eph.A=sqrtA*sqrtA;
    eph.sys=sys;
    rtcm.eph=eph;
    rtcm.nav.eph[eph.sat-1]=eph;
    return 2;
}
//GLONASS星历数据
/* decode type 1020: glonass ephemerides -------------------------------------*/
function decode_type1020(buff,rtcm){
    var geph=new ca.geph_t();
    var tk_h,tk_m,tk_s,toe,tow,tod,tof;
    var i=24+12,prn,sat,ws=new Array(2),tb,bn,sys=ca.SYS_GLO;

    if (i+348<=rtcm.len*8) {
        prn        =getbitu(buff,i, 6);           i+= 6;
        geph.frq   =getbitu(buff,i, 5)-7;         i+= 5+2+2;
        tk_h       =getbitu(buff,i, 5);           i+= 5;
        tk_m       =getbitu(buff,i, 6);           i+= 6;
        tk_s       =getbitu(buff,i, 1)*30.0;      i+= 1;
        bn         =getbitu(buff,i, 1);           i+= 1+1;
        tb         =getbitu(buff,i, 7);           i+= 7;
        geph.vel[0]=getbitg(buff,i,24)*P2_20*1E3; i+=24;
        geph.pos[0]=getbitg(buff,i,27)*P2_11*1E3; i+=27;
        geph.acc[0]=getbitg(buff,i, 5)*P2_30*1E3; i+= 5;
        geph.vel[1]=getbitg(buff,i,24)*P2_20*1E3; i+=24;
        geph.pos[1]=getbitg(buff,i,27)*P2_11*1E3; i+=27;
        geph.acc[1]=getbitg(buff,i, 5)*P2_30*1E3; i+= 5;
        geph.vel[2]=getbitg(buff,i,24)*P2_20*1E3; i+=24;
        geph.pos[2]=getbitg(buff,i,27)*P2_11*1E3; i+=27;
        geph.acc[2]=getbitg(buff,i, 5)*P2_30*1E3; i+= 5+1;
        geph.gamn  =getbitg(buff,i,11)*P2_40;     i+=11+3;
        geph.taun  =getbitg(buff,i,22)*P2_30;
    }
    else {
        return -1;
    }
    sat=prn;
    geph.sat=sat;
    geph.svh=bn;
    geph.iode=tb&0x7F;
    cmn.time2gpst(cmn.gpst2utc(rtcm.time),ws);
    tod=ws[1]%86400.0; ws[1]-=tod;

    tof=tk_h*3600.0+tk_m*60.0+tk_s-10800.0; /* lt->utc */
    if      (tof<tod-43200.0) tof+=86400.0;
    else if (tof>tod+43200.0) tof-=86400.0;
    geph.tof=cmn.utc2gpst(cmn.gpst2time(ws[0],ws[1]+tof));
    //geph.tof=cmn.gpst2time(ws[0],ws[1]+tof);
    var tt=new Date(geph.tof.time*1000);
    toe=tb*900.0-10800.0; /* lt->utc */
    if      (toe<tod-43200.0) toe+=86400.0;
    else if (toe>tod+43200.0) toe-=86400.0;
    geph.toe=cmn.utc2gpst(cmn.gpst2time(ws[0],ws[1]+toe)); /* utc->gpst */
    //geph.toe=cmn.gpst2time(ws[0],ws[1]+toe);
    geph.sys=sys;
    rtcm.eph=geph;
    rtcm.nav.geph[geph.sat-1]=geph;
    return 2;
}
//北斗星历
function decode_type1119(buff,rtcm){
    var eph=new ca.eph_t();
    var toc,sqrtA;
    var i=24+12,prn,sat,week,sys=ca.SYS_CMP;

    if (i+476<=rtcm.len*8) {
        prn       =getbitu(buff,i, 6);              i+= 6;
        week      =getbitu(buff,i,13);              i+=13;
        eph.sva   =getbitu(buff,i, 4);              i+= 4;
        eph.code  =getbitu(buff,i, 2);              i+= 2;
        eph.idot  =getbits(buff,i,14)*P2_43*ca.SC2RAD; i+=14;
        eph.iode  =getbitu(buff,i, 5);              i+= 5;
        toc       =getbitu(buff,i,17)*8.0;         i+=17;
        eph.f2    =getbits(buff,i, 11)*P2_66;        i+= 11;
        eph.f1    =getbits(buff,i,22)*P2_50;        i+=22;
        eph.f0    =getbits(buff,i,24)*P2_33;        i+=24;
        eph.iodc  =getbitu(buff,i,5);              i+=5;
        eph.crs   =getbits(buff,i,18)*P2_6;         i+=18;
        eph.deln  =getbits(buff,i,16)*P2_43*ca.SC2RAD; i+=16;
        eph.M0    =getbits(buff,i,32)*P2_31*ca.SC2RAD; i+=32;
        eph.cuc   =getbits(buff,i,18)*P2_31;        i+=18;
        eph.e     =getbitu(buff,i,32)*P2_33;        i+=32;
        eph.cus   =getbits(buff,i,18)*P2_31;        i+=18;
        sqrtA     =getbitu32(buff,i,32)*P2_19;        i+=32;
        eph.toes  =getbitu(buff,i,17)*8.0;         i+=17;
        eph.cic   =getbits(buff,i,18)*P2_31;        i+=18;
        eph.OMG0  =getbits(buff,i,32)*P2_31*ca.SC2RAD; i+=32;
        eph.cis   =getbits(buff,i,18)*P2_31;        i+=18;
        eph.i0    =getbits(buff,i,32)*P2_31*ca.SC2RAD; i+=32;
        eph.crc   =getbits(buff,i,18)*P2_6;         i+=18;
        eph.omg   =getbits(buff,i,32)*P2_31*ca.SC2RAD; i+=32;
        eph.OMGd  =getbits(buff,i,24)*P2_43*ca.SC2RAD; i+=24;
        eph.tgd[0]=getbits(buff,i, 10)*1e-10;        i+= 10;
        eph.svh   =getbitu(buff,i, 1);              i+= 1;
        eph.flag  =getbitu(buff,i, 1);              i+= 1;
        eph.fit   =getbitu(buff,i, 1);
    }
    else {
        return -1;
    }

    sat=prn;
    eph.sat=sat;
    //eph.week=week;
    eph.week=adjbdtweek(rtcm,week);
    eph.toe=cmn.bdt2gpst(cmn.bdt2time(eph.week,eph.toes)); /* bdt -> gpst */
    eph.toc=cmn.bdt2gpst(cmn.bdt2time(eph.week,toc));      /* bdt -> gpst */
    //eph.toes=cmn.bdt2gpst(eph.toes);
    //eph.toe=cmn.bdt2time(eph.week,eph.toes); /* bdt -> gpst */
    //eph.toc=cmn.bdt2time(eph.week,toc);      /* bdt -> gpst */
    eph.ttr=rtcm.time;
    eph.A=sqrtA*sqrtA;
    eph.sys=sys;
    rtcm.eph=eph;
    rtcm.nav.ceph[eph.sat-1]=eph;
    return 2;
}
//GLONASS观测数据
/* decode type 1012: extended L1&L2 glonass rtk observables ------------------*/
function decode_type1012(buff,rtcm){
    var pr1,cnr1,cnr2,tt,cp1,cp2,lam1,lam2;
    var i=24+61,j,index,id,prn,sat,freq,code1,code2,pr21,ppr1,ppr2;
    var lock1,lock2,amb,sys=ca.SYS_GLO;
    var sliptime;
    if ((id=decode_head1009(buff,rtcm))<0) return -1;

    for (j=0;j<rtcm.obsd.nsat&&i+130<=rtcm.len*8;j++) {
        prn  =getbitu(buff,i, 6); i+= 6;
        code1=getbitu(buff,i, 1); i+= 1;
        freq =getbitu(buff,i, 5); i+= 5;
        pr1  =getbitu(buff,i,25); i+=25;
        ppr1 =getbits(buff,i,20); i+=20;
        lock1=getbitu(buff,i, 7); i+= 7;
        amb  =getbitu(buff,i, 7); i+= 7;
        cnr1 =getbitu(buff,i, 8); i+= 8;
        code2=getbitu(buff,i, 2); i+= 2;
        pr21 =getbits(buff,i,14); i+=14;
        ppr2 =getbits(buff,i,20); i+=20;
        lock2=getbitu(buff,i, 7); i+= 7;
        cnr2 =getbitu(buff,i, 8); i+= 8;
        sat=prn;

        if ((index=obsindex(rtcm.obsd,sys,sat))<0) continue;
        pr1=pr1*0.02+amb*PRUNIT_GLO;
        if (ppr1!=0xFFF80000) {
            lam1=ca.CLIGHT/(ca.FREQ1_GLO+ca.DFRQ1_GLO*(freq-7));
            rtcm.obsd.obs[index].P[0]=pr1;
            cp1=adjcp(rtcm.obsd,sys,sat,1,ppr1*0.0005/lam1);
            rtcm.obsd.obs[index].L[0]=pr1/lam1+cp1;
        }
        rtcm.obsd.obs[index].LLI[0]=lossoflock(rtcm.obsd,sys,sat,0,lock1);
        rtcm.obsd.obs[index].SNR[0]=snratio(cnr1*0.25);
        rtcm.obsd.obs[index].code[0]=code1?ca.CODE_L1P:ca.CODE_L1C;

        if (pr21!=0xFFFFE000) {
            rtcm.obsd.obs[index].P[1]=pr1+pr21*0.02;
        }
        if (ppr2!=0xFFF80000) {
            lam2=ca.CLIGHT/(ca.FREQ2_GLO+ca.DFRQ2_GLO*(freq-7));
            cp2=adjcp(rtcm.obsd,sys,sat,1,ppr2*0.0005/lam2);
            rtcm.obsd.obs[index].L[1]=pr1/lam2+cp2;
        }
        rtcm.obsd.obs[index].LLI[1]=lossoflock(rtcm.obsd,sys,sat,1,lock2);
        rtcm.obsd.obs[index].SNR[1]=snratio(cnr2*0.25);
        rtcm.obsd.obs[index].code[1]=code2?ca.CODE_L2P:ca.CODE_L2C;
    }
    sliptime=cmn.timediff(rtcm.obsd.time,rtcm.time);
    if(sliptime>0 && sliptime<opt.slip_time)
        rtcm.time=rtcm.obsd.time;
    return 1;
}
//GPS观测数据
/* decode type 2004: extended L1&L2 gps rtk observables ----------------------*/
function decode_type2004(buff,rtcm){
    var L2codes=[ca.CODE_L2C,ca.CODE_L2P,ca.CODE_L2W,ca.CODE_L2W];
    var pr1,cnr1,cnr2,tt,cp1,cp2;
    var i=24+64,j,index,id,sync,prn,sat,code1,code2,pr21,ppr1,ppr2;
    var lock1,lock2,amb,sys;
    var doppler,sliptime;
    if ((id=decode_head1001(buff,rtcm))<0) return -1;

    for (j=0;j<rtcm.obsd.nsat&&i+125+32<=rtcm.len*8;j++) {
        prn  =getbitu(buff,i, 6); i+= 6;
        code1=getbitu(buff,i, 1); i+= 1;
        pr1  =getbitu(buff,i,24); i+=24;
        ppr1 =getbits(buff,i,20); i+=20;
        lock1=getbitu(buff,i, 7); i+= 7;
        amb  =getbitu(buff,i, 8); i+= 8;
        cnr1 =getbitu(buff,i, 8); i+= 8;
        code2=getbitu(buff,i, 2); i+= 2;
        pr21 =getbits(buff,i,14); i+=14;
        ppr2 =getbits(buff,i,20); i+=20;
        lock2=getbitu(buff,i, 7); i+= 7;
        cnr2 =getbitu(buff,i, 8); i+= 8;
        doppler=getbits(buff,i,32); i+=32;

        sys=ca.SYS_GPS;
        sat=prn;

        if ((index=obsindex(rtcm.obsd,sys,sat))<0) continue;
        pr1=pr1*0.02+amb*PRUNIT_GPS;
        if (ppr1!=0xFFF80000) {
            rtcm.obsd.obs[index].P[0]=pr1;
            cp1=adjcp(rtcm.obsd,sys,sat,0,ppr1*0.0005/cmn.lam_carr[0]);
            rtcm.obsd.obs[index].L[0]=pr1/cmn.lam_carr[0]+cp1;
        }
        rtcm.obsd.obs[index].LLI[0]=lossoflock(rtcm.obsd,sys,sat,0,lock1);
        rtcm.obsd.obs[index].SNR[0]=snratio(cnr1*0.25);
        rtcm.obsd.obs[index].code[0]=code1?ca.CODE_L1P:ca.CODE_L1C;
        rtcm.obsd.obs[index].D[0]=doppler*0.001;
        if (pr21!=0xFFFFE000) {
            rtcm.obsd.obs[index].P[1]=pr1+pr21*0.02;
        }
        if (ppr2!=0xFFF80000) {
            cp2=adjcp(rtcm.obsd,sys,sat,1,ppr2*0.0005/cmn.lam_carr[1]);
            rtcm.obsd.obs[index].L[1]=pr1/cmn.lam_carr[1]+cp2;
        }
        rtcm.obsd.obs[index].LLI[1]=lossoflock(rtcm.obsd,sys,sat,1,lock2);
        rtcm.obsd.obs[index].SNR[1]=snratio(cnr2*0.25);
        rtcm.obsd.obs[index].code[1]=L2codes[code2];
    }
    rtcm.id=id;
    sliptime=cmn.timediff(rtcm.obsd.time,rtcm.time);
    if(sliptime>0 && sliptime<opt.slip_time)
        rtcm.time=rtcm.obsd.time;
    return 1;
}
//北斗观测数据
/* decode type 2104: extended B1&B2&B3 gps rtk observables ----------------------*/
function decode_type2104(buff,rtcm){
    // const int L2codes[]={CODE_L2C,CODE_L2P,CODE_L2W,CODE_L2W};
    var pr1,pr2,pr3,cnr1,cnr2,cnr3,tt,cp1,cp2,cp3;
    var i=24+64,j,index,id,prn,sat,code1,code2,ppr1,ppr2,code3,ppr3;
    var lock1,lock2,lock3,amb1,amb2,amb3,sys;
    var BD_indicator,sliptime;
    var LL=0,iL;
    var doppler_1,doppler_2,doppler_3;
    var ws=new Array(2);//test

    if ((id=decode_head1104(buff,rtcm))<0) return -1;

    BD_indicator=getbitu(buff,i, 3);i+=3;
    for(iL=0;iL<3;iL++)    {
        if((BD_indicator>>iL)&0x1) LL += (71+32);
    }

    for (j=0;j<rtcm.obsd.nsat&&i+LL<=rtcm.len*8;j++) {
        prn  =getbitu(buff,i, 6); i+= 6;

        /* ---探测协议中的异常 */
        cmn.time2gpst(rtcm.time,ws);

        /* ---------------------------- */

        if((BD_indicator>>2)&0x1)
        {
            code1=getbitu(buff,i, 2); i+= 2;
            pr1  =getbitu(buff,i,24); i+=24;
            ppr1 =getbits(buff,i,20); i+=20;
            lock1=getbitu(buff,i, 7); i+= 7;
            amb1 =getbitu(buff,i, 8); i+= 8;
            cnr1 =getbitu(buff,i, 8); i+= 8;
            doppler_1=getbits(buff,i,32); i+=32;
        }

        if((BD_indicator>>1)&0x1)
        {
            code2=getbitu(buff,i, 2); i+= 2;
            pr2  =getbitu(buff,i,24); i+=24;
            ppr2 =getbits(buff,i,20); i+=20;
            lock2=getbitu(buff,i, 7); i+= 7;
            amb2 =getbitu(buff,i, 8); i+= 8;
            cnr2 =getbitu(buff,i, 8); i+= 8;
            doppler_2=getbits(buff,i,32); i+=32;
        }

        if(BD_indicator&0x1)
        {
            code3=getbitu(buff,i, 2); i+= 2;
            pr3  =getbitu(buff,i,24); i+=24;
            ppr3 =getbits(buff,i,20); i+=20;
            lock3=getbitu(buff,i, 7); i+= 7;
            amb3 =getbitu(buff,i, 8); i+= 8;
            cnr3 =getbitu(buff,i, 8); i+= 8;
            doppler_3=getbits(buff,i,32); i+=32;
        }
        sys=ca.SYS_CMP;
        sat=prn;

        if ((index=obsindex(rtcm.obsd,sys,sat))<0) continue;
        if((BD_indicator>>2)&0x1)
        {
            pr1=pr1*0.02+amb1*PRUNIT_GPS;
            if (ppr1!=0xFFF80000) {
                rtcm.obsd.obs[index].P[0]=pr1;
                cp1=adjcp(rtcm.obsd,sys,sat,0,ppr1*0.0005/cmn.lam_carr[6]);
                rtcm.obsd.obs[index].L[0]=pr1/cmn.lam_carr[6]+cp1;
        }
            rtcm.obsd.obs[index].LLI[0]=lossoflock(rtcm.obsd,sys,sat,0,lock1);
            rtcm.obsd.obs[index].SNR[0]=snratio(cnr1*0.25);
            rtcm.obsd.obs[index].code[0]=ca.CODE_L2I;
            rtcm.obsd.obs[index].D[0]=doppler_1*0.001;
        }

        if((BD_indicator>>1)&0x1)
        {
            pr2=pr2*0.02+amb2*PRUNIT_GPS;
            if (ppr2!=0xFFF80000) {
                rtcm.obsd.obs[index].P[1]=pr2;
                cp2=adjcp(rtcm.obsd,sys,sat,1,ppr2*0.0005/cmn.lam_carr[7]);
                rtcm.obsd.obs[index].L[1]=pr2/cmn.lam_carr[7]+cp2;
        }
            rtcm.obsd.obs[index].LLI[1]=lossoflock(rtcm.obsd,sys,sat,1,lock2);
            rtcm.obsd.obs[index].SNR[1]=snratio(cnr2*0.25);
            rtcm.obsd.obs[index].code[1]=ca.CODE_L7I;
            rtcm.obsd.obs[index].D[1]=doppler_2*0.001;
        }

        if(BD_indicator&0x1)
        {
            pr3=pr3*0.02+amb3*PRUNIT_GPS;
            if (ppr3!=0xFFF80000) {
                rtcm.obsd.obs[index].P[2]=pr3;
                cp3=adjcp(rtcm.obsd,sys,sat,2,ppr3*0.0005/cmn.lam_carr[8]);
                rtcm.obsd.obs[index].L[2]=pr3/cmn.lam_carr[8]+cp3;
        }
            rtcm.obsd.obs[index].LLI[2]=lossoflock(rtcm.obsd,sys,sat,2,lock3);
            rtcm.obsd.obs[index].SNR[2]=snratio(cnr3*0.25);
            rtcm.obsd.obs[index].code[2]=ca.CODE_L6I;
            rtcm.obsd.obs[index].D[2]=doppler_3*0.001;
        }

    }
    sliptime=cmn.timediff(rtcm.obsd.time,rtcm.time);
    if(sliptime>0 && sliptime<opt.slip_time)
        rtcm.time=rtcm.obsd.time;
    return 1;
}

//GPS 历书
function decode_type2016(buff,rtcm){
    var alm=new ca.alm_t();
    var week;
    var ws=Array(2);
    var i=24+12,sat,dataID,sys=ca.SYS_GPS,toa,prn,nsat,sync;

    //if ((nsat=decode_head2016(rtcm,&sync))<0) return -1;

    if (i+190<=rtcm.len*8) {
        week      =getbitu(buff,i,10);              i+=10;
        cmn.time2gpst(rtcm.time,ws);
        if(ws[0]<1560)ws[0]=1560;
        alm.week=week+math.floor((ws[0]-week+128)/256)*256;
        dataID        = getbitu(buff,i, 2);              i+= 2;
        prn      	  = getbitu(buff,i, 7);              i+= 7;
        if (prn != 0) {
            i = i;
        }
        alm.e 		  = getbitu(buff,i, 16);             i+= 16;
        toa 	      = getbitu(buff,i, 8);              i+= 8;
        alm.i0        = getbits(buff,i, 16);             i+= 16;
        alm.OMGd      = getbits(buff,i, 16);             i+= 16;
        alm.svh       = getbitu(buff,i, 8);              i+= 8;
        alm.A         = getbitu(buff,i, 24);             i+= 24;
        alm.OMG0      = getbits(buff,i, 24);             i+= 24;
        alm.omg       = getbits(buff,i, 24);             i+= 24;
        alm.M0 		  = getbits(buff,i, 24);             i+= 24;
        alm.f0  	  = getbits(buff,i, 11);             i+= 11;
        alm.f1 	      = getbits(buff,i, 11);             i+= 11;

        alm.e = alm.e * c_2m21;
        alm.toas =  toa * c_2p12;
        alm.i0 = (alm.i0 * c_2m19) * ca.PI;
        alm.OMGd = alm.OMGd * c_2m38 * ca.PI;
        alm.A = (alm.A * c_2m11) * (alm.A * c_2m11);
        alm.OMG0 = alm.OMG0 * c_2m23 * ca.PI;
        alm.omg = alm.omg * c_2m23 * ca.PI;
        alm.M0 =  alm.M0 * c_2m23 * ca.PI;
        alm.f0 = alm.f0 * c_2m20;
        alm.f1 = alm.f1 * c_2m38;

    }
    else {
        return -1;
    }
    sat=prn;
    alm.toa=cmn.gpst2time(alm.week,alm.toas);
    alm.sat = sat;
    alm.sys=sys;
    alm.time=alm.toa;
    rtcm.alm=alm;
    return 4;
}

//北斗历书
function decode_type2006(buff,rtcm){
    var alm=new ca.alm_t();
    var week,ws=Array(2);
    var i=24+12,sat,dataID,sys=ca.SYS_CMP,toa,prn,nsat,sync;

    if (i+190<=rtcm.len*8) {
        week      =getbitu(buff,i,10);              i+=10;
        cmn.time2gpst(rtcm.time,ws);
        if(ws[0]<1560)ws[0]=1560;
        alm.week=week+math.floor((ws[0]-week+128)/256)*256;
        //dataID        = getbitu(buff,i, 2);              i+= 2;
        prn      	  = getbitu(buff,i, 7);              i+= 7;
        if (prn != 0) {
            i = i;
        }
        alm.e 		  = getbitu(buff,i, 17);             i+= 17;
        toa 	      = getbitu(buff,i, 8);              i+= 8;
        alm.i0        = getbits(buff,i, 16);             i+= 16;
        alm.OMGd      = getbits(buff,i, 17);             i+= 17;
        alm.svh       = getbitu(buff,i, 8);              i+= 8;
        alm.A         = getbitu(buff,i, 24);             i+= 24;
        alm.OMG0      = getbits(buff,i, 24);             i+= 24;
        alm.omg       = getbits(buff,i, 24);             i+= 24;
        alm.M0 		  = getbits(buff,i, 24);             i+= 24;
        alm.f0  	  = getbits(buff,i, 11);             i+= 11;
        alm.f1 	      = getbits(buff,i, 11);             i+= 11;

        alm.e = alm.e * c_2m21;
        alm.toas =  toa * c_2p12;
        alm.i0 = (alm.i0 * c_2m19) * ca.PI;
        alm.OMGd = alm.OMGd * c_2m38 * ca.PI;
        alm.A = (alm.A * c_2m11) * (alm.A * c_2m11);
        alm.OMG0 = alm.OMG0 * c_2m23 * ca.PI;
        alm.omg = alm.omg * c_2m23 * ca.PI;
        alm.M0 =  alm.M0 * c_2m23 * ca.PI;
        alm.f0 = alm.f0 * c_2m20;
        alm.f1 = alm.f1 * c_2m38;
    }
    else {
        return -1;
    }
    sat=prn;
    alm.toa=cmn.gpst2time(alm.week,alm.toas);
    alm.sat = sat;
    alm.sys=sys;
    alm.time=alm.toa;
    rtcm.nav.alm=alm;
    return 4;
}

//北斗电离层
function decode_type2007(buff,rtcm){

    //int i=24+12,prn,sat,week,sys=SYS_GPS;
    var i=24+12,prn,sys;
    var ion=new ca.ionM();
    ion.stat=1;
    ion.sys=ca.SYS_CMP;
    //ion.ion=new Array(8);
    //if ((nsat=decode_head2016(rtcm,&sync))<0) return -1;

    if (i+64<=rtcm.len*8) {

        prn      	  = getbitu(buff,i, 8);              i+= 8;
        ion.ion[0]      	  = getbits(buff,i, 8)*c_2m30;       i+= 8;
        ion.ion[1]      	  = getbits(buff,i, 8)*c_2m27;       i+= 8;
        ion.ion[2]      	  = getbits(buff,i, 8)*c_2m24;              i+= 8;
        ion.ion[3]      	  = getbits(buff,i, 8)*c_2m24;              i+= 8;
        ion.ion[4]      	  = getbits(buff,i, 8)*c_2p11;              i+= 8;
        ion.ion[5]      	  = getbits(buff,i, 8)*c_2p14;              i+= 8;
        ion.ion[6]      	  = getbits(buff,i, 8)*c_2p16;              i+= 8;
        ion.ion[7]      	  = getbits(buff,i, 8)*c_2p16;              i+= 8;
    }
    ion.sat=prn;
    ion.time=rtcm.time;
    rtcm.ion=ion;
    return 3;
}
//GPS电离层
function decode_type2017(buff,rtcm){

    //int i=24+12,prn,sat,week,sys=SYS_GPS;
    var i=24+12,prn,sys;
    var ion=new ca.ionM();
    ion.stat=1;
    ion.sys=ca.SYS_GPS;
    //ion.ion=new Array(8);
    //if ((nsat=decode_head2016(rtcm,&sync))<0) return -1;

    if (i+64<=rtcm.len*8) {
        //sys      	  = getbitu(rtcm->buff,i, 2);              i+= 2;
        //prn      	  = getbitu(rtcm->buff,i, 8);              i+= 8;
        ion.ion[0]      	  = getbits(buff,i, 8)*c_2m30;       i+= 8;
        ion.ion[1]      	  = getbits(buff,i, 8)*c_2m27;       i+= 8;
        ion.ion[2]      	  = getbits(buff,i, 8)*c_2m24;              i+= 8;
        ion.ion[3]      	  = getbits(buff,i, 8)*c_2m24;              i+= 8;
        ion.ion[4]      	  = getbits(buff,i, 8)*c_2p11;              i+= 8;
        ion.ion[5]      	  = getbits(buff,i, 8)*c_2p14;              i+= 8;
        ion.ion[6]      	  = getbits(buff,i, 8)*c_2p16;              i+= 8;
        ion.ion[7]      	  = getbits(buff,i, 8)*c_2p16;              i+= 8;
    }
    ion.time=rtcm.time;
    rtcm.ion=ion;
    return 3;
}
/* decode rtcm ver.3 message -------------------------------------------------*/
function decode_rtcm3(buff,rtcm) {
    var   ret = 0, type = getbitu(buff, 24, 12);
    switch (type) {
        case 1019://GPS星历数据
            ret = decode_type1019(buff,rtcm);
            break;
        case 1020://GLONASS星历数据
            ret = decode_type1020(buff,rtcm);
            break;
        /*case 1047:
            ret = decode_type1047(buff,rtcm);
            break;*/
        case 1119://扩展北斗星历
            ret = decode_type1119(buff,rtcm);
            break;
        case 1012://GLONASS观测数据
            ret = decode_type1012(buff,rtcm);
            break;
        case 2004://GPS观测数据
            ret = decode_type2004(buff,rtcm);
            break;
        case 2104://北斗观测数据
            ret = decode_type2104(buff,rtcm);
            break;
        case 2006:
            ret = decode_type2006(buff,rtcm);
            break;
        case 2016:
            ret = decode_type2016(buff,rtcm);
            break;
        case 2007:
            ret = decode_type2007(buff,rtcm);
            break;
        case 2017:
            ret = decode_type2017(buff,rtcm);
            break;
    }
    return ret;
};module.exports.decode_rtcm3=decode_rtcm3;


