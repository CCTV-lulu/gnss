/**
 * Created by a on 2016/8/15.
 */
var math=require('mathjs');
var ca=require('../routes/calib.js');
var cmn=require('../routes/comn.js');


var  RE_GLO = 6378136.0;        /* radius of earth (m)            ref [2] */
var  MU_GPS =  3.9860050E14;     /* gravitational constant         ref [1] */
var  MU_GLO =  3.9860044E14;     /* gravitational constant         ref [2] */
var  MU_GAL =  3.986004418E14;   /* earth gravitational constant   ref [7] */
var  MU_CMP =  3.986004418E14;   /* earth gravitational constant   ref [9] */
var  J2_GLO =  1.0826257E-3;     /* 2nd zonal harmonic of geopot   ref [2] */

var  OMGE_GLO= 7.292115E-5;      /* earth angular velocity (rad/s) ref [2] */
var  OMGE_GAL =7.2921151467E-5;  /* earth angular velocity (rad/s) ref [7] */
var  OMGE_CMP =7.292115E-5;      /* earth angular velocity (rad/s) ref [9] */

var  AREF_BDS_MEO=	27906100;  /* Beidou A ref */     /* added by Lia */
var  AREF_BDS_NMEO=	42162200;  /* Beidou A ref */
var  OMGEREF_BDS	=	-2.6E-9;   /* Beidou Omega ref */

var  SIN_5 =-0.0871557427476582 ;/* sin(-5.0 deg) */
var  COS_5 = 0.9961946980917456 ;/* cos(-5.0 deg) */

var  ERREPH_GLO= 5.0;            /* error of glonass ephemeris (m) */
var  TSTEP=    60.0 ;            /* integration step glonass ephemeris (s) */
var  RTOL_KEPLER= 1E-14  ;       /* relative tolerance for Kepler equation */

var  DEFURASSR= 0.15 ;           /* default accurary of ssr corr (m) */
var  MAXECORSSR =10.0;           /* max orbit correction of ssr (m) */
var  MAXCCORSSR =(1E-6*ca.CLIGHT);  /* max clock correction of ssr (m) */
var  MAXAGESSR =70.0 ;           /* max age of ssr orbit and clock (s) */
var  MAXAGESSR_HRCLK =10.0;      /* max age of ssr high-rate clock (s) */
var  STD_BRDCCLK =30.0;          /* error of broadcast clock (m) */

function SQR(x) {return x*x;}
//从星历URA计算卫星位置方差
function var_uraeph(ura){
    var ura_value=[2.4,3.4,4.85,6.85,9.65,13.65,24.0,48.0,96.0,192.0,384.0,768.0,1536.0,
                    3072.0,6144.0];
    return ura<0||15<ura?6144.0:SQR(ura_value[ura]);
}
//查找最新GPS/CMP星历
function seleph(sat, iode,eph){
    if(eph[sat-1]==undefined)return 0;
    if (iode>=0)return 0;
    return eph[sat-1];
}
//查找最新GLONASS星历
function selgeph(sat, iode, geph){
    if(geph[sat-1]==undefined)return 0;
    if (iode>=0)return 0;
    return geph[sat-1];
}
//计算GPS、CMP卫星钟差
function eph2clk(time, eph){
    var t;
    var i;
    t=cmn.timediff(time,eph.toc);
    for (i=0;i<2;i++) {
        t-=eph.f0+eph.f1*t+eph.f2*t*t;
    }
    return eph.f0+eph.f1*t+eph.f2*t*t;
}
//计算GLO卫星钟差
function geph2clk(time, geph){
    var t;
    var i;
    t=cmn.timediff(time,geph.toe);
    for (i=0;i<2;i++) {
        t-=-geph.taun+geph.gamn*t;
    }
    return -geph.taun+geph.gamn*t;
}
//使用广播星历计算卫星钟差
function ephclk(time, teph, sat, sys, nav){
    var eph;
    var ceph;
    var geph;
    var dts;
    if (sys==ca.SYS_GPS) {
        if(nav.eph.length==0)return 0;
        if (!(eph=seleph(sat,-1,nav.eph))) return 0;
            dts=eph2clk(time,eph);
    }
    else if(sys==ca.SYS_CMP)    {
        if(nav.ceph.length==0)return 0;
        if (!(ceph=seleph(sat,-1,nav.ceph))) return 0;
            dts=eph2clk(time,ceph);
    }
    else if (sys==ca.SYS_GLO) {
        if(nav.geph.length==0)return 0;
        if (!(geph=selgeph(sat,-1,nav.geph))) return 0;
            dts=geph2clk(time,geph);
    }
    else
        dts= 0;
    return dts;
}
/* glonass orbit differential equations --------------------------------------*/
function deq(x, xdot, acc){
    var a,b,c,r2=cmn.dot(x,x,3),r3=r2*math.sqrt(r2),omg2=SQR(OMGE_GLO);

    if (r2<=0.0) {
        xdot[0]=xdot[1]=xdot[2]=xdot[3]=xdot[4]=xdot[5]=0.0;
        return;
    }
    /* ref [2] A.3.1.2 with bug fix for xdot[4],xdot[5] */
    a=1.5*J2_GLO*MU_GLO*SQR(RE_GLO)/r2/r3; /* 3/2*J2*mu*Ae^2/r^5 */
    b=5.0*x[2]*x[2]/r2;                    /* 5*z^2/r^2 */
    c=-MU_GLO/r3-a*(1.0-b);                /* -mu/r^3-a(1-b) */
    xdot[0]=x[3]; xdot[1]=x[4]; xdot[2]=x[5];
    xdot[3]=(c+omg2)*x[0]+2.0*OMGE_GLO*x[4]+acc[0];
    xdot[4]=(c+omg2)*x[1]-2.0*OMGE_GLO*x[3]+acc[1];
    xdot[5]=(c-2.0*a)*x[2]+acc[2];
}
/* glonass position and velocity by numerical integration --------------------*/
function glorbit(t, x, acc){
    var k1=new Array(6),k2=new Array(6),k3=new Array(6),k4=new Array(6),w=new Array(6);
    var i;

    deq(x,k1,acc); for (i=0;i<6;i++) w[i]=x[i]+k1[i]*t/2.0;
    deq(w,k2,acc); for (i=0;i<6;i++) w[i]=x[i]+k2[i]*t/2.0;
    deq(w,k3,acc); for (i=0;i<6;i++) w[i]=x[i]+k3[i]*t;
    deq(w,k4,acc);
    for (i=0;i<6;i++) x[i]+=(k1[i]+2.0*k2[i]+2.0*k3[i]+k4[i])*t/6.0;
}
//从广播星历计算卫星位置和钟差（GPS,Beidou)
function eph2pos(time, eph,sys, rs, dts,vare){
    var tk,M,E,Ek,sinE,cosE,u,r,i,O,sin2u,cos2u,x,y,sinO,cosO,cosi,mu,omge;
    var xg,yg,zg,sino,coso;
    var n,prn;
    prn=eph.sat;
    if (eph.A<=0.0) {
        rs[0]=rs[1]=rs[2]=dts[0]=vare[0]=0.0;
        return 1;
    }
    tk=cmn.timediff(time,eph.toe);
    switch (sys) {
        case ca.SYS_CMP: mu=MU_CMP; omge=OMGE_CMP; break;
        default:      mu=MU_GPS; omge=ca.OMGE;     break;
    }
        M=eph.M0+(math.sqrt(mu/(eph.A*eph.A*eph.A))+eph.deln)*tk;
        for (n=0,E=M,Ek=0.0;math.abs(E-Ek)>RTOL_KEPLER;n++) {
            Ek=E; E-=(E-eph.e*math.sin(E)-M)/(1.0-eph.e * math.cos(E));
            if(n>1000){
                rs[0]=rs[1]=rs[2]=dts[0]=vare[0]=0.0;
                return 1;
            }
        }
        sinE=math.sin(E); cosE=math.cos(E);


        u=math.atan2(math.sqrt(1.0-eph.e*eph.e)*sinE,cosE-eph.e)+eph.omg;
        r=eph.A*(1.0-eph.e*cosE);
        i=eph.i0+eph.idot*tk;
        sin2u=math.sin(2.0*u); cos2u=math.cos(2.0*u);
        u+=eph.cus*sin2u+eph.cuc*cos2u;
        r+=eph.crs*sin2u+eph.crc*cos2u;
        i+=eph.cis*sin2u+eph.cic*cos2u;
        x=r*math.cos(u); y=r*math.sin(u); cosi=math.cos(i);

        /* beidou geo satellite (ref [9]) */
        if (sys==ca.SYS_CMP&&prn<=5) {
            O=eph.OMG0+eph.OMGd*tk-omge*eph.toes;
            sinO=math.sin(O); cosO=math.cos(O);
            xg=x*cosO-y*cosi*sinO;
            yg=x*sinO+y*cosi*cosO;
            zg=y*math.sin(i);
            sino=math.sin(omge*tk); coso=math.cos(omge*tk);
            rs[0]= xg*coso+yg*sino*COS_5+zg*sino*SIN_5;
            rs[1]=-xg*sino+yg*coso*COS_5+zg*coso*SIN_5;
            rs[2]=-yg*SIN_5+zg*COS_5;
        }
        else {
            O=eph.OMG0+(eph.OMGd-omge)*tk-omge*eph.toes;
            sinO=math.sin(O); cosO=math.cos(O);
            rs[0]=x*cosO-y*cosi*sinO;
            rs[1]=x*sinO+y*cosi*cosO;
            rs[2]=y*math.sin(i);
        }
        tk=cmn.timediff(time,eph.toc);
    dts[0]=eph.f0+eph.f1*tk+eph.f2*tk*tk;

        /* relativity correction */
    dts[0]-=2.0*math.sqrt(mu*eph.A)*eph.e*sinE/SQR(ca.CLIGHT);

        /* position and clock error variance */
    vare[0]=var_uraeph(eph.sva);
    return 0;
}
/* glonass ephemeris to satellite position and clock bias ----------------------
 *-----------------------------------------------------------------------------*/
function geph2pos(time, geph, rs, dts,vare){
    var t,tt,x=new Array(6);
    var i;

    //trace(4,"geph2pos: time=%s sat=%2d\n",time_str(time,3),geph->sat);
    rs[0]=rs[1]=rs[2]=dts[0]=vare[0]=0.0;
    t=cmn.timediff(time,geph.toe);

    dts[0]=-geph.taun+geph.gamn*t;

    for (i=0;i<3;i++) {
        x[i  ]=geph.pos[i];
        x[i+3]=geph.vel[i];
    }
    for (tt=t<0.0?-TSTEP:TSTEP;math.abs(t)>1E-9;t-=tt) {
        if (math.abs(t)<TSTEP) tt=t;
        glorbit(tt,x,geph.acc);
    }
    for (i=0;i<3;i++) rs[i]=x[i];

    vare[0]=SQR(ERREPH_GLO);
}
/* satellite position and clock by broadcast ephemeris -----------------------*/
function  ephpos(time, teph, sat,sys, nav,iode,rs,dts,vare,svh,index){
    var eph;
    var geph;
    var ceph;
    var rst=new Array(3),dtst=new Array(1),tt=1E-3;
    var i;
    var varet=new Array(1);
    //trace(4,"ephpos  : time=%s sat=%2d iode=%d\n",time_str(time,3),sat,iode);
    svh[index]=1;

    if (sys==ca.SYS_GPS) {
        if (!(eph=seleph(sat,iode,nav.eph))) return 0;
        var tk=cmn.timediff(time,eph.toe);
        if(tk<-7201 || tk>100)
            return 1;
       /* else if(tk>100){
            return 1;
        }*/
        eph2pos(time,eph,sys,rst,dtst,varet);
        for (i=0;i<3;i++)rs[6*index+i]=rst[i];
        dts[2*index]=dtst[0];
        time=cmn.timeadd(time,tt);
        eph2pos(time,eph,sys,rst,dtst,varet);
        vare[index]=varet[0];
        svh[index]=eph.svh;
    }
    /* Beidou new sys *//* added by Lia*/
    else if (sys==ca.SYS_CMP) {
        if (!(ceph=seleph(sat,iode,nav.ceph))) return 0;
        var tk=cmn.timediff(time,ceph.toe);
        if(tk>3700 || tk<-100) {
            return 1;
        }
       /* else if(tk<-100){
            return 1;
        }*/
        eph2pos(time,ceph,sys,rst,dtst,varet);
        for (i=0;i<3;i++)rs[6*index+i]=rst[i];
        dts[2*index]=dtst[0];
        time=cmn.timeadd(time,tt);
        eph2pos(time,ceph,sys,rst,dtst,varet);
        vare[index]=varet[0];
        svh[index]=ceph.svh;
    }
    else if (sys==ca.SYS_GLO) {
        if (!(geph=selgeph(sat,iode,nav.geph))) return 0;
        geph2pos(time,geph,rst,dtst,varet);
        for (i=0;i<3;i++)rs[6*index+i]=rst[i];
        dts[2*index]=dtst[0];
        time=cmn.timeadd(time,tt);
        geph2pos(time,geph,rst,dtst,varet);
        vare[index]=varet[0];
        svh[index]=geph.svh;
    }
    else
        return 1;

    /* satellite velocity and clock drift by differential approx */
    for (i=0;i<3;i++) rs[i+3 + 6*index]=(rst[i]-rs[i + 6*index])/tt;
    dts[1+2*index]=(dtst[0]-dts[2*index])/tt;

    return 0;
}
//计算卫星位置和钟差
/* args   : gtime_t teph     I   time to select ephemeris (gpst)
*          obsd_t *obs      I   observation data
*          int    n         I   number of observation data
*          nav_t  *nav      I   navigation data
*          int    ephopt    I   ephemeris option (EPHOPT_???)
*          double *rs       O   satellite positions and velocities (ecef)
*          double *dts      O   satellite clocks
*          double *var      O   sat position and clock error variances (m^2)
*          int    *svh      O   sat health flag (-1:correction not available)
* return : none
* notes  : rs [(0:2)+i*6]= obs[i] sat position {x,y,z} (m)
*          rs [(3:5)+i*6]= obs[i] sat velocity {vx,vy,vz} (m/s)
*          dts[(0:1)+i*2]= obs[i] sat clock {bias,drift} (s|s/s)
*          var[i]        = obs[i] sat position and clock error variance (m^2)
*          svh[i]        = obs[i] sat health flag
*          if no navigation data, set 0 to rs[], dts[], var[] and svh[]
*          satellite position and clock are values at signal transmission time
*          satellite position is referenced to antenna phase center
*          satellite clock does not include code bias correction (tgd or bgd)
*          any pseudorange and broadcast ephemeris are always needed to get
*          signal transmission time
*          */
exports.satposs=function(teph,obs,n,nav,opt, rs,dts, vare,svh){
    var time=new Array(n);
    var dt,pr;
    var i,j;

    for (i=0;i<n;i++) {
        for (j=0;j<6;j++) rs[j+i*6]=0.0;
        for (j=0;j<2;j++) dts[j+i*2]=0.0;
        vare[i]=0.0; svh[i]=1;

        /* search any psuedorange */
        for (j=0,pr=0.0;j<ca.NFREQ;j++){
            if ((pr=obs[i].P[j])>0.0)
                break;
        }
        if (j>=ca.NFREQ)
            continue;
        /* transmission time by satellite clock */
        time[i]=cmn.timeadd(obs[i].time,-pr/ca.CLIGHT);

        /* satellite clock bias by broadcast ephemeris */
        if (!(dt=ephclk(time[i],teph,obs[i].sat,obs[i].sys,nav))) {
            continue;
        }
        time[i]=cmn.timeadd(time[i],-dt);

        /* satellite position and clock at transmission time */
        if(ephpos(time[i], teph, obs[i].sat,obs[i].sys, nav,-1,rs,dts,vare,svh,i)){
            continue;
        }
        /* if no precise clock unavailable, use broadcast clock instead */
        if (dts[i*2]==0.0) {
            if (!(dts[i*2]=ephclk(time[i],teph,obs[i].sat,nav)))
                continue;
            dts[1+i*2]=0.0;
            vare[index]=SQR(STD_BRDCCLK);
        }
    }
}
exports.eph2pos_port=eph2pos;
exports.geph2pos_port=geph2pos;
