/**
 * Created by a on 2016/8/15.
 */
var gpst0=[1980,0, 6,8,0,0];
var gst0 =[1999,7,22,8,0,0];
var bdt0 =[2006,0, 1,8,0,0];
var ca=require('./calib.js');
var math=require('mathjs');


var lam_carr=[       /* carrier wave length (m) */
    ca.CLIGHT/ca.FREQ1,ca.CLIGHT/ca.FREQ2,ca.CLIGHT/ca.FREQ5,
    ca.CLIGHT/ca.FREQ6,ca.CLIGHT/ca.FREQ7,ca.CLIGHT/ca.FREQ8,
    ca.CLIGHT/ca.FREQ2_CMP,ca.CLIGHT/ca.FREQ7_CMP,ca.CLIGHT/ca.FREQ6_CMP,
    ca.CLIGHT/ca.FREQ1_CMP_NEW,ca.CLIGHT/ca.FREQ2_CMP_NEW   /* added by Lia */
];module.exports.lam_carr=lam_carr;
var chisqr=[      /* chi-sqr(n) (alpha=0.001) */
    10.8,13.8,16.3,18.5,20.5,22.5,24.3,26.1,27.9,29.6,
    31.3,32.9,34.5,36.1,37.7,39.3,40.8,42.3,43.8,45.3,
    46.8,48.3,49.7,51.2,52.6,54.1,55.5,56.9,58.3,59.7,
    61.1,62.5,63.9,65.2,66.6,68.0,69.3,70.7,72.1,73.4,
    74.7,76.0,77.3,78.6,80.0,81.3,82.6,84.0,85.4,86.7,
    88.0,89.3,90.6,91.9,93.3,94.7,96.0,97.4,98.7,100 ,
    101 ,102 ,103 ,104 ,105 ,107 ,108 ,109 ,110 ,112 ,
    113 ,114 ,115 ,116 ,118 ,119 ,120 ,122 ,123 ,125 ,
    126 ,127 ,128 ,129 ,131 ,132 ,133 ,134 ,135 ,137 ,
    138 ,139 ,140 ,142 ,143 ,144 ,145 ,147 ,148 ,149];module.exports.chisqr=chisqr;
var leaps=[ /* leap seconds {y,m,d,h,m,s,utc-gpst,...} */
[2017,0,1,8,0,0,-18],
[2015,6,1,8,0,0,-17],
[2012,6,1,8,0,0,-16],
[2009,0,1,8,0,0,-15],
[2006,0,1,8,0,0,-14],
[1999,0,1,8,0,0,-13],
[1997,6,1,8,0,0,-12],
[1996,0,1,8,0,0,-11],
[1994,6,1,8,0,0,-10],
[1993,6,1,8,0,0, -9],
[1992,6,1,8,0,0, -8],
[1991,0,1,8,0,0, -7],
[1990,0,1,8,0,0, -6],
[1988,0,1,8,0,0, -5],
[1985,6,1,8,0,0, -4],
[1983,6,1,8,0,0, -3],
[1982,6,1,8,0,0, -2],
[1981,6,1,8,0,0, -1]
];
var tbl_CRC24Q=[
    0x000000,0x864CFB,0x8AD50D,0x0C99F6,0x93E6E1,0x15AA1A,0x1933EC,0x9F7F17,
    0xA18139,0x27CDC2,0x2B5434,0xAD18CF,0x3267D8,0xB42B23,0xB8B2D5,0x3EFE2E,
    0xC54E89,0x430272,0x4F9B84,0xC9D77F,0x56A868,0xD0E493,0xDC7D65,0x5A319E,
    0x64CFB0,0xE2834B,0xEE1ABD,0x685646,0xF72951,0x7165AA,0x7DFC5C,0xFBB0A7,
    0x0CD1E9,0x8A9D12,0x8604E4,0x00481F,0x9F3708,0x197BF3,0x15E205,0x93AEFE,
    0xAD50D0,0x2B1C2B,0x2785DD,0xA1C926,0x3EB631,0xB8FACA,0xB4633C,0x322FC7,
    0xC99F60,0x4FD39B,0x434A6D,0xC50696,0x5A7981,0xDC357A,0xD0AC8C,0x56E077,
    0x681E59,0xEE52A2,0xE2CB54,0x6487AF,0xFBF8B8,0x7DB443,0x712DB5,0xF7614E,
    0x19A3D2,0x9FEF29,0x9376DF,0x153A24,0x8A4533,0x0C09C8,0x00903E,0x86DCC5,
    0xB822EB,0x3E6E10,0x32F7E6,0xB4BB1D,0x2BC40A,0xAD88F1,0xA11107,0x275DFC,
    0xDCED5B,0x5AA1A0,0x563856,0xD074AD,0x4F0BBA,0xC94741,0xC5DEB7,0x43924C,
    0x7D6C62,0xFB2099,0xF7B96F,0x71F594,0xEE8A83,0x68C678,0x645F8E,0xE21375,
    0x15723B,0x933EC0,0x9FA736,0x19EBCD,0x8694DA,0x00D821,0x0C41D7,0x8A0D2C,
    0xB4F302,0x32BFF9,0x3E260F,0xB86AF4,0x2715E3,0xA15918,0xADC0EE,0x2B8C15,
    0xD03CB2,0x567049,0x5AE9BF,0xDCA544,0x43DA53,0xC596A8,0xC90F5E,0x4F43A5,
    0x71BD8B,0xF7F170,0xFB6886,0x7D247D,0xE25B6A,0x641791,0x688E67,0xEEC29C,
    0x3347A4,0xB50B5F,0xB992A9,0x3FDE52,0xA0A145,0x26EDBE,0x2A7448,0xAC38B3,
    0x92C69D,0x148A66,0x181390,0x9E5F6B,0x01207C,0x876C87,0x8BF571,0x0DB98A,
    0xF6092D,0x7045D6,0x7CDC20,0xFA90DB,0x65EFCC,0xE3A337,0xEF3AC1,0x69763A,
    0x578814,0xD1C4EF,0xDD5D19,0x5B11E2,0xC46EF5,0x42220E,0x4EBBF8,0xC8F703,
    0x3F964D,0xB9DAB6,0xB54340,0x330FBB,0xAC70AC,0x2A3C57,0x26A5A1,0xA0E95A,
    0x9E1774,0x185B8F,0x14C279,0x928E82,0x0DF195,0x8BBD6E,0x872498,0x016863,
    0xFAD8C4,0x7C943F,0x700DC9,0xF64132,0x693E25,0xEF72DE,0xE3EB28,0x65A7D3,
    0x5B59FD,0xDD1506,0xD18CF0,0x57C00B,0xC8BF1C,0x4EF3E7,0x426A11,0xC426EA,
    0x2AE476,0xACA88D,0xA0317B,0x267D80,0xB90297,0x3F4E6C,0x33D79A,0xB59B61,
    0x8B654F,0x0D29B4,0x01B042,0x87FCB9,0x1883AE,0x9ECF55,0x9256A3,0x141A58,
    0xEFAAFF,0x69E604,0x657FF2,0xE33309,0x7C4C1E,0xFA00E5,0xF69913,0x70D5E8,
    0x4E2BC6,0xC8673D,0xC4FECB,0x42B230,0xDDCD27,0x5B81DC,0x57182A,0xD154D1,
    0x26359F,0xA07964,0xACE092,0x2AAC69,0xB5D37E,0x339F85,0x3F0673,0xB94A88,
    0x87B4A6,0x01F85D,0x0D61AB,0x8B2D50,0x145247,0x921EBC,0x9E874A,0x18CBB1,
    0xE37B16,0x6537ED,0x69AE1B,0xEFE2E0,0x709DF7,0xF6D10C,0xFA48FA,0x7C0401,
    0x42FA2F,0xC4B6D4,0xC82F22,0x4E63D9,0xD11CCE,0x575035,0x5BC9C3,0xDD8538
];
var syscode=["G","R","C"];
//添加时间秒
/*
 * args: gtime_t t        I   gtime_t struct
 *      double sec       I   time to add (s)*
 */
function timeadd(time,sec) {
    var t0=new ca.gtime();
    var t1=time.time +time.sec +  sec;
    t0.time=math.floor(t1);
    t0.sec=t1-t0.time;
    return t0;
};module.exports.timeadd=timeadd;
//时间差
function timediff(t1,t2){
    return t1.time - t2.time +
        t1.sec-t2.sec;
}module.exports.timediff=timediff;
//向量点积
function dot(a, b, n){
    var c=0.0;
    while (--n>=0) c+=a[n]*b[n];
    return c;
}module.exports.dot=dot;
//向量模
function norm(a, n){
    return math.sqrt(dot(a,a,n));
}module.exports.norm=norm;
//大地坐标转直角坐标
function pos2ecef(pos, r){
    var sinp=math.sin(pos[0]),cosp=math.cos(pos[0]),sinl=math.sin(pos[1]),cosl=math.cos(pos[1]);
    var e2=ca.FE_WGS84*(2.0-ca.FE_WGS84),v=ca.RE_WGS84/math.sqrt(1.0-e2*sinp*sinp);

    r[0]=(v+pos[2])*cosp*cosl;
    r[1]=(v+pos[2])*cosp*sinl;
    r[2]=(v*(1.0-e2)+pos[2])*sinp;
}module.exports.pos2ecef=pos2ecef;
//直角坐标转大地坐标
function ecef2pos(r, pos){
    var e2=ca.FE_WGS84*(2.0-ca.FE_WGS84),r2=dot(r,r,2),z,zk,v=ca.RE_WGS84,sinp;
    for (z=r[2],zk=0.0;math.abs(z-zk)>=1E-4;) {
        zk=z;
        sinp=z/math.sqrt(r2+z*z);
        v=ca.RE_WGS84/math.sqrt(1.0-e2*sinp*sinp);
        z=r[2]+v*e2*sinp;
    }
    pos[0]=r2>1E-12?math.atan(z/math.sqrt(r2)):(r[2]>0.0?ca.PI/2.0:-ca.PI/2.0);
    pos[1]=r2>1E-12?math.atan2(r[1],r[0]):0.0;
    pos[2]=math.sqrt(r2+z*z)-v;
}module.exports.ecef2pos=ecef2pos;
function xyz2enu(pos, E){
    var sinp=math.sin(pos[0]),cosp=math.cos(pos[0]),
        sinl=math.sin(pos[1]),cosl=math.cos(pos[1]);
    E[0][0]=-sinl;      E[0][1]=cosl;       E[0][2]=0.0;
    E[1][0]=-sinp*cosl; E[1][1]=-sinp*sinl; E[1][2]=cosp;
    E[2][0]=cosp*cosl;  E[2][1]=cosp*sinl;  E[2][2]=sinp;
}module.exports.xyz2enu=xyz2enu;
//大地坐标转用户坐标系
function ecef2enu(pos, r, e){
    var E=new Array(3);
    for(var i=0;i<3;i++)E[i]=new Array(3);
    xyz2enu(pos,E);
    var nu=math.multiply(E,r);
    e[0]=nu[0];
    e[1]=nu[1];
    e[2]=nu[2];
}module.exports.ecef2enu=ecef2enu;
//计算星地几何距离
function geodist(rs, rr, e){
    var r;
    var i;
    if (norm(rs,3)<ca.RE_WGS84) return -1.0;
    for (i=0;i<3;i++) e[i]=rs[i]-rr[i];
    r=norm(e,3);
    for (i=0;i<3;i++) e[i]/=r;
    return r+ca.OMGE*(rs[0]*rr[1]-rs[1]*rr[0])/ca.CLIGHT;
}module.exports.geodist=geodist;
//计算卫星仰角
function satazel(pos, e, azel){
    var az=0.0,el=ca.PI/2.0,enu=new Array();
    if (pos[2]>-ca.RE_WGS84) {
        ecef2enu(pos,e,enu);
        az=dot(enu,enu,2)<1E-12?0.0:math.atan2(enu[0],enu[1]);
        if (az<0.0) az+=2*ca.PI;
        el=math.asin(enu[2]);
    }
    if (azel) {azel[0]=az; azel[1]=el;}
    return el;
}module.exports.satazel=satazel;
function satwavelen(sat,sys,nav){
    var i,frq;
    if (sys==ca.SYS_GLO) {
        return nav.lam[ca.SYS_GLO][sat-1];
    }
    else if (sys==ca.SYS_CMP) {
        return nav.lam[ca.SYS_CMP];
    }
    /*else if (sys==SYS_CMP_NEW) {
        if      (frq==0) return CLIGHT/FREQ1_CMP_NEW; /!* B1C *!/
        else if (frq==1) return CLIGHT/FREQ2_CMP_NEW; /!* B2a *!/
    }*/
    else if(sys==ca.SYS_GPS){
        return nav.lam[ca.SYS_GPS];
    }
}module.exports.satwavelen=satwavelen;
function glolam(geph) {
    var freq_glo=[ca.FREQ1_GLO,ca.FREQ2_GLO,ca.FREQ3_GLO];
    var dfrq_glo=[ca.DFRQ1_GLO,ca.DFRQ2_GLO,0.0];
    var lam=new Array(3);
    var frq;
    for (frq = 0; frq < ca.NFREQ; frq++) {
        lam[frq] = ca.CLIGHT / (freq_glo[frq] + dfrq_glo[frq] * geph.frq);
    }
    return lam;
}module.exports.glolam=glolam;
function sattgd(sat,sys,nav) {
    if (sys==ca.SYS_CMP) {
        return nav.ceph[sat-1].tgd;
    }
    else if(sys==ca.SYS_GPS){
        return nav.eph[sat-1].tgd;
    }
    else {
        var tgd=new Array();
        tgd[0]=tgd[1]=tgd[2]=0.0;
        return tgd;
    }
}module.exports.sattgd=sattgd;
function testsnr(base, freq, el, snr,mask){
    var minsnr,a;
    var i;
    if (!mask.ena[base]||freq<0||freq>=ca.NFREQ) return 0;
    a=(el*ca.R2D+5.0)/10.0;
    i=math.floor(a); a-=i;
    if      (i<1) minsnr=mask.mask[freq][0];
    else if (i>8) minsnr=mask.mask[freq][8];
    else minsnr=(1.0-a)*mask.mask[freq][i-1]+a*mask.mask[freq][i];
    return snr<minsnr;
}module.exports.testsnr=testsnr;

function satexclude(sat,sys, svh, opt){
    if (svh<0) return 1; /* ephemeris unavailable */
    if (opt) {
        if (opt.exsats[sys][sat-1]==1) return 1; /* excluded satellite */
        if (opt.exsats[sys][sat-1]==2) return 0; /* included satellite */
    }
    if (svh) {
        return 1;
    }
    return 0;
}module.exports.satexclude=satexclude;

function str2time(str) {
    return str.split(',');
}module.exports.str2time=str2time;
function timenow() {
    var time=new ca.gtime();
    var t=new Date();
    var milt=t.getTime()/1000-8*3600;
    time.time=math.floor(milt);
    time.sec=milt-math.floor(milt);
    return time;
}module.exports.timenow=timenow;
function epoch2time(ep){
    var time=new ca.gtime();
    time.time=(new Date(ep[0],ep[1],ep[2],ep[3],ep[4],math.floor(ep[5]))).getTime()/1000;
    time.sec=ep[5]-math.floor(ep[5]);
    return time;
}module.exports.epoch2time=epoch2time;
function time2gpst(t, ws){
    var t0=epoch2time(gpst0);
    var sec=timediff(t,t0);
    var w=math.floor(sec/(86400*7));
    ws[0]=w;
    ws[1]=sec-w*86400*7;
}module.exports.time2gpst=time2gpst;
function time2epoch(t, ep) {
    var tt=new Date((t.time+t.sec)*1000);
    ep[0] = tt.getFullYear();
    ep[1] = tt.getMonth();
    ep[2] = tt.getDate();
    ep[3] = tt.getHours();
    ep[4] = tt.getMinutes();
    ep[5] = tt.getSeconds() + tt.getMilliseconds() / 1000;
}module.exports.time2epoch=time2epoch;
function time2bdt(t, ws){
    var t0=epoch2time(bdt0);
    var sec=timediff(t,t0);;
    var w=math.floor(sec/(86400*7));
    ws[0]=w;
    ws[1]=sec-w*86400*7;
}module.exports.time2bdt=time2bdt;
function time2doy(t){//返回一年中某天
    var ep=new Array(6);
    time2epoch(t,ep);
    ep[1]=0;ep[2]=1.0; ep[3]=ep[4]=ep[5]=0.0;
    return timediff(t,epoch2time(ep))/86400.0+1.0;
}module.exports.time2doy=time2doy;
function gpst2time(week, sec){
    var t=epoch2time(gpst0);
    var t0=new ca.gtime();
    if (sec<-1E9||1E9<sec) sec=0.0;
    t0.time=t.time + 86400*7*week+ math.floor(sec);
    t0.sec=t.sec+sec-math.floor(sec);
    return t0;
};module.exports.gpst2time=gpst2time;
function bdt2time(week, sec){
    var t=epoch2time(bdt0);
    var t0=new ca.gtime();
    if (sec<-1E9||1E9<sec) sec=0.0;
    t0.time=t.time + 86400*7*week+ math.floor(sec);
    t0.sec=t.sec+sec-math.floor(sec);
    return t0;
};module.exports.bdt2time=bdt2time;
function gpst2bdt( t){
    return timeadd(t,-14.0);
};module.exports.gpst2bdt=gpst2bdt;
function bdt2gpst( t){
    return timeadd(t,14.0);
};module.exports.bdt2gpst=bdt2gpst;
function gpst2utc(t) {
    var tu;
    var i;
    for (i = 0; i < leaps.length; i++) {
        tu = timeadd(t, leaps[i][6]);
        if (timediff(tu, epoch2time(leaps[i])) >= 0.0) return tu;
    }
    return t;
}module.exports.gpst2utc=gpst2utc;
function utc2gpst(t){
    var i;
    for (i=0;i<leaps.length;i++) {
        if (timediff(t,epoch2time(leaps[i]))>=0.0)
            return timeadd(t,-leaps[i][6]);
    }
    return t;
}module.exports.utc2gpst=utc2gpst;
function dayofyear(t) {
    var tt=new Date(t.time*1000);
    var ep=[tt.getFullYear(),0,1,0,0,0];
    var t0=epoch2time(ep);
    var df=timediff(t,t0);
    return math.floor(timediff(t,t0)/24/3600);
}module.exports.dayofyear=dayofyear;
function stryearday(t) {
    var tt=new Date(t.time*1000);
    var year=tt.getFullYear().toString();
    var month=(tt.getMonth()+1).toString();
    var day=tt.getDate().toString();
    return year+"-"+month+"-"+day;
}module.exports.stryearday=stryearday;
function time2string(time) {
    var t=new Date((time.time+time.sec)*1000);
    var month=t.getUTCMonth()+1;
    return t.getUTCFullYear()+"-"+month +"-"+
        t.getUTCDate()+" "+t.getUTCHours()+":"+
        t.getUTCMinutes()+":"+t.getUTCSeconds();
}module.exports.time2string=time2string;
function sysstr(sys) {
    return syscode[sys];
}module.exports.sysstr=sysstr;
function sysclude(sys,opt) {
    var stat=1,i;
    for(i=0;i<opt.navsys.length;i++){
        if(sys==opt.navsys[i]) {
            stat = 0;
            break;
        }
    }
    return stat;
}module.exports.sysclude=sysclude;

function ionmodel(t, ion, pos,azel){
    /*var ion_default=[ /!* 2004/1/1 *!/
        0.1118E-07,-0.7451E-08,-0.5961E-07, 0.1192E-06,
        0.1167E+06,-0.2294E+06,-0.1311E+06, 0.1049E+07];*/

    var tt,f,psi,phi,lam,amp,per,x,I0=5E-9;
    var ws=new Array(2);
    var i;
    //double N=76;  //黑子相对数

    if (pos[2]<-1E3||azel[1]<=0) return 0.0;
    //if (norm(ion,8)<=0.0)for(i=0;i<8;i++)ion[i]=ion_default[i];

    /* earth centered angle (semi-circle) */
    psi=0.0137/(azel[1]/ca.PI+0.11)-0.022;

    /* subionospheric latitude/longitude (semi-circle) */
    phi=pos[0]/ca.PI+psi*math.cos(azel[0]);
    if      (phi> 0.416) phi= 0.416;
    else if (phi<-0.416) phi=-0.416;
    lam=pos[1]/ca.PI+psi*math.sin(azel[0])/math.cos(phi*ca.PI);

    /* geomagnetic latitude (semi-circle) */
    phi+=0.064*math.cos((lam-1.617)*ca.PI);

    /* local time (s) */
    time2gpst(t,ws);
    tt=43200.0*lam+ws[1];
    tt-=math.floor(tt/86400.0)*86400.0; /* 0<=tt<86400 */

    /* slant factor */
    f=1.0+16.0 * math.pow(0.53-azel[1]/ca.PI,3.0);

    /* ionospheric delay */
    amp=ion[0]+phi*(ion[1]+phi*(ion[2]+phi*ion[3]));
    per=ion[4]+phi*(ion[5]+phi*(ion[6]+phi*ion[7]));
    amp=amp<    0.0?    0.0:amp;
    per=per<72000.0?72000.0:per;

//	I0=I0*(1+fabs((N-50)/N));
//	per=per*(1+fabs((N-50)/N));
//	amp=amp*(1+50/N);

    x=2.0*ca.PI*(tt-50400.0)/per;

    return ca.CLIGHT*f*(math.abs(x)<1.57?I0+amp*(1.0+x*x*(-0.5+x*x/24.0)):I0);
}module.exports.ionmodel=ionmodel;
function tropmodel(time, pos, azel,humi){
    var temp0=15.0; /* temparature at sea level */
    var hgt,pres,temp,e,z,trph,trpw;

    if (pos[2]<-100.0||1E4<pos[2]||azel[1]<=0) return 0.0;

    /* standard atmosphere */
    hgt=pos[2]<0.0?0.0:pos[2];

    pres=1013.25*math.pow(1.0-2.2557E-5*hgt,5.2568);
    temp=temp0-6.5E-3*hgt+273.16;
    e=6.108*humi* math.exp((17.15*temp-4684.0)/(temp-38.45));

    /* saastamoninen model */
    z=ca.PI/2.0-azel[1];
    trph=0.0022768*pres/(1.0-0.00266*math.cos(2.0*pos[0])-0.00028*hgt/1E3)/math.cos(z);
    trpw=0.002277*(1255.0/temp+0.05)*e/math.cos(z);
    return trph+trpw;
}module.exports.tropmodel=tropmodel;

//最小二乘计算用户位置
function lsq(A, y){
    var ls=new ca.lsmatrix();
    var Q;
    var Ay=math.multiply(A,y);/* Ay=A'*y */
    var AA=math.multiply(A,math.transpose(A));/* Q=A*A' */
    Q=math.inv(AA);
    ls.Q=Q;
    ls.x=math.multiply(Q,Ay);/* x=Q^-1*Ay */
    return ls;
}module.exports.lsq=lsq;

function dops(ns, azel, elmin, dop){
    var H=new Array(4),Q,cosel,sinel;
    var i,n;
    for (i=0;i<4;i++) {
        dop[i]=0.0;
        H[i]=new Array();
    }
    for (i=n=0;i<ns;i++) {
        if (azel[1+i*2]<elmin||azel[1+i*2]<=0.0) continue;
        cosel=math.cos(azel[1+i*2]);
        sinel=math.sin(azel[1+i*2]);
        H[0][n]=cosel*math.sin(azel[i*2]);
        H[1][n]=cosel*math.cos(azel[i*2]);
        H[2][n]=sinel;
        H[3][n++]=1.0;
    }
    if (n<4) return;
    Q=math.multiply(H,math.transpose(H));
    Q=math.inv(Q);
    dop[0]=math.sqrt(Q[0][0]+Q[1][1]+Q[2][2]+Q[3][3]); /* GDOP */
    dop[1]=math.sqrt(Q[0][0]+Q[1][1]+Q[2][2]);       /* PDOP */
    dop[2]=math.sqrt(Q[0][0]+Q[1][1]);             /* HDOP */
    dop[3]=math.sqrt(Q[2][2]);                 /* VDOP */
}module.exports.dops=dops;

function Average(x,mean,n){
    return (n*mean + x)/(n+1);
};module.exports.Average=Average;
function vare(x,vare,n,xn){
    return n*vare/(n+1)+(x-xn)*(x-xn)/n;
};module.exports.vare=vare;
function getbitu(buff, pos, len){
    var bits=0;
    var i;
    for (i=pos;i<pos+len;i++) bits=(bits<<1)+((buff[math.floor(i/8)]>>(7-i%8))&1);
    return bits;
}module.exports.getbitu=getbitu;
function getbits(buff, pos, len){
    var bits=getbitu(buff,pos,len);
    if (len<=0||32<=len||!(bits&(1<<(len-1))))
        return bits;
    return (bits|(~0<<len)); /* extend sign */
}module.exports.getbits=getbits;
function crc24q(buff, len){
    var crc=0;
    var i;
    for (i=0;i<len;i++) crc=((crc<<8)&0xFFFFFF)^tbl_CRC24Q[(crc>>16)^buff[i]];
    return crc;
};module.exports.crc24q=crc24q;

