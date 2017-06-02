/**
 * Created by a on 2016/8/15.
 */
var opt=require('../config/optcomm.json');
exports.PI=3.1415926535897932;  /* pi */
exports.D2R=(exports.PI/180.0);          /* deg to rad */
exports.R2D=(180.0/exports.PI);          /* rad to deg */
exports.CLIGHT=299792458.0;     /* speed of light (m/s) */
exports.SC2RAD  =    3.1415926535898;     /* semi-circle to radian (IS-GPS) */
exports.AU     =     149597870691.0;      /* 1 AU (m) */
exports.AS2R    =    (exports.D2R/3600.0);        /* arc sec to radian */

exports.OMGE   =     7.2921151467E-5 ;    /* earth angular velocity (IS-GPS) (rad/s) */

exports.RE_WGS84 =   6378137.0;           /* earth semimajor axis (WGS84) (m) */
exports.FE_WGS84 =   (1.0/298.257223563); /* earth flattening (WGS84) */

exports.HION   =     350000.0;            /* ionosphere height (m) */

exports.MAXFREQ  =   7;                   /* max NFREQ */

exports.FREQ1  =     1.57542E9;           /* L1/E1  frequency (Hz) */
exports.FREQ2  =     1.22760E9;           /* L2     frequency (Hz) */
exports.FREQ5  =     1.17645E9;           /* L5/E5a frequency (Hz) */
exports.FREQ6  =     1.27875E9;           /* E6/LEX frequency (Hz) */
exports.FREQ7   =    1.20714E9;           /* E5b    frequency (Hz) */
exports.FREQ8   =    1.191795E9;          /* E5a+b  frequency (Hz) */
exports.FREQ1_GLO =  1.60200E9;           /* GLONASS G1 base frequency (Hz) */
exports.DFRQ1_GLO =  0.56250E6;           /* GLONASS G1 bias frequency (Hz/n) */
exports.FREQ2_GLO =  1.24600E9;           /* GLONASS G2 base frequency (Hz) */
exports.DFRQ2_GLO =  0.43750E6;           /* GLONASS G2 bias frequency (Hz/n) */
exports.FREQ3_GLO =  1.202025E9;          /* GLONASS G3 frequency (Hz) */
exports.FREQ2_CMP  = 1.561098E9;          /* BeiDou B1 frequency (Hz) */
exports.FREQ7_CMP =  1.20714E9;           /* BeiDou B2 frequency (Hz) */
exports.FREQ6_CMP  = 1.26852E9;          /* BeiDou B3 frequency (Hz) */
exports.FREQ1_CMP_NEW = 1.57542E9;        /* BeiDou B1C frequency (Hz) */ /* added by Lia */
exports.FREQ2_CMP_NEW = 1.17645E9;        /* BeiDou B2A frequency (Hz) */ /* added by Lia */

exports.EFACT_GPS =  1.0;                 /* error factor: GPS */
exports.EFACT_GLO =  1.5;                /* error factor: GLONASS */
//exports.EFACT_GAL =  1.0;                 /* error factor: Galileo */
exports.EFACT_CMP =  1.0;                 /* error factor: BeiDou */



exports.SYS_GPS  =   opt.sys[0];                /* navigation system: GPS */
exports.SYS_GLO  =   opt.sys[1];                /* navigation system: GLONASS */
exports.SYS_CMP  =   opt.sys[2];                /* navigation system: BeiDou */
exports.SYS_ALL  =   opt.sys[3];                /* navigation system: all */

exports.NEXOBS=0;



exports.MINPRNGPS =  1;                   /* min satellite PRN number of GPS */
exports.MAXPRNGPS = 32;                  /* max satellite PRN number of GPS */
exports.NSATGPS   = (exports.MAXPRNGPS-exports.MINPRNGPS+1); /* number of GPS satellites */

exports.MINPRNGLO  = 1;                   /* min satellite slot number of GLONASS */
exports.MAXPRNGLO =  24;                  /* max satellite slot number of GLONASS */
exports.NSATGLO   =  (exports.MAXPRNGLO-exports.MINPRNGLO+1); /* number of GLONASS satellites */

exports.MINPRNCMP =  1;                   /* min satellite sat number of BeiDou */
exports.MAXPRNCMP =  35;                  /* max satellite sat number of BeiDou */
exports.NSATCMP  =   (exports.MAXPRNCMP-exports.MINPRNCMP+1); /* number of BeiDou satellites */

exports.MAXSAT  =   exports.NSATGPS+exports.NSATGLO+exports.NSATCMP; /* number of systems */ /* modified by Lia */

exports.MAXOBS   =   64;                  /* max number of obs in an epoch */
exports.MAXANT    =  64;                  /* max length of station name/antenna type */
exports.MAXDTOE   =  7200.0;              /* max time difference to ephem Toe (s) for GPS */
exports.MAXDTOE_GLO= 1800.0;              /* max time difference to GLONASS Toe (s) */
exports.MAXDTOE_CMP= 3600.0;              /* max time difference to Beidou Toe (s) */
exports.MAXGDOP =    300.0;               /* max GDOP */
exports.NFREQ  =     3;                   /* number of carrier frequencies */

exports.SOLQ_NONE  = 0;                   /* solution status: no solution */
exports.IONOOPT_OFF=0;
exports.IONOOPT_BRDC=1;
exports.IONOOPT_IFLC=2;

exports.TROPOPT_OFF=0;
exports.TROPOPT_SAAS=1;
exports.TROPOPT_SBAS=2;

exports.EPHOPT_BRDC=0;

exports. CODE_NONE =  0;                   /* obs code: none or unknown */
exports. CODE_L1C =   1;                   /* obs code: L1C/A,G1C/A,E1C (GPS,GLO,GAL,QZS,SBS) */
exports. CODE_L1P =   2;                   /* obs code: L1P,G1P    (GPS,GLO) */
exports. CODE_L1W =   3;                   /* obs code: L1 Z-track (GPS) */
exports. CODE_L1Y =   4;                   /* obs code: L1Y        (GPS) */
exports. CODE_L1M =   5;                   /* obs code: L1M        (GPS) */
exports. CODE_L1N  =  6;                   /* obs code: L1codeless (GPS) */
exports. CODE_L1S =   7;                   /* obs code: L1C(D)     (GPS,QZS) */
exports. CODE_L1L =   8;                   /* obs code: L1C(P)     (GPS,QZS) */
exports. CODE_L1E =   9 ;                  /* obs code: L1-SAIF    (QZS) */
exports. CODE_L1A =   10 ;                 /* obs code: E1A        (GAL) */
exports. CODE_L1B =   11;                  /* obs code: E1B        (GAL) */
exports. CODE_L1X =   12;                  /* obs code: E1B+C,L1C(D+P) (GAL,QZS) */
exports. CODE_L1Z =   13;                  /* obs code: E1A+B+C,L1SAIF (GAL,QZS) */
exports. CODE_L2C =   14;                  /* obs code: L2C/A,G1C/A (GPS,GLO) */
exports. CODE_L2D =   15 ;                 /* obs code: L2 L1C/A-(P2-P1) (GPS) */
exports. CODE_L2S =   16;                  /* obs code: L2C(M)     (GPS,QZS) */
exports. CODE_L2L =   17 ;                 /* obs code: L2C(L)     (GPS,QZS) */
exports. CODE_L2X =   18;                  /* obs code: L2C(M+L),B1I+Q (GPS,QZS,CMP) */
exports. CODE_L2P =   19;                  /* obs code: L2P,G2P    (GPS,GLO) */
exports. CODE_L2W =   20;                  /* obs code: L2 Z-track (GPS) */
exports. CODE_L2Y =   21;                  /* obs code: L2Y        (GPS) */
exports. CODE_L2M =   22;                  /* obs code: L2M        (GPS) */
exports. CODE_L2N  =  23 ;                 /* obs code: L2codeless (GPS) */
exports. CODE_L5I =   24 ;                 /* obs code: L5/E5aI    (GPS,GAL,QZS,SBS) */
exports. CODE_L5Q  =  25 ;                 /* obs code: L5/E5aQ    (GPS,GAL,QZS,SBS) */
exports. CODE_L5X =   26 ;                 /* obs code: L5/E5aI+Q  (GPS,GAL,QZS,SBS) */
exports. CODE_L7I =   27 ;                 /* obs code: E5bI,B2I   (GAL,CMP) */
exports. CODE_L7Q =   28 ;                 /* obs code: E5bQ,B2Q   (GAL,CMP) */
exports. CODE_L7A  =  48 ;                 //B2a
exports. CODE_L7X =   29 ;                 /* obs code: E5bI+Q,B2I+Q (GAL,CMP) */
exports. CODE_L6A =   30 ;                 /* obs code: E6A        (GAL) */
exports. CODE_L6B =   31 ;                 /* obs code: E6B        (GAL) */
exports. CODE_L6C =   32 ;                 /* obs code: E6C        (GAL) */
exports. CODE_L6X =   33 ;                 /* obs code: E6B+C,LEXS+L,B3I+Q (GAL,QZS,CMP) */
exports. CODE_L6Z =   34 ;                 /* obs code: E6A+B+C    (GAL) */
exports. CODE_L6S =   35 ;                 /* obs code: LEXS       (QZS) */
exports. CODE_L6L =   36 ;                 /* obs code: LEXL       (QZS) */
exports. CODE_L8I =   37 ;                 /* obs code: E5(a+b)I   (GAL) */
exports. CODE_L8Q =   38 ;                 /* obs code: E5(a+b)Q   (GAL) */
exports. CODE_L8X =   39 ;                 /* obs code: E5(a+b)I+Q (GAL) */
exports. CODE_L2I =   40 ;                 /* obs code: B1I        (CMP) */
exports. CODE_L2Q =   41 ;                 /* obs code: B1Q        (CMP) */
exports. CODE_L2c =   47 ;                 //B1C
module.exports. CODE_L6I =   42 ;                 /* obs code: B3I        (CMP) */
module.exports. CODE_L6Q =   43 ;                 /* obs code: B3Q        (CMP) */
module.exports. CODE_L3I =   44 ;                 /* obs code: G3I        (GLO) */
module.exports. CODE_L3Q =   45 ;                 /* obs code: G3Q        (GLO) */
module.exports. CODE_L3X =   46 ;                 /* obs code: G3I+Q      (GLO) */
module.exports. MAXCODE =    48 ;                 /* max number of obs code */

//自定义单星观测数据类
function gtime() {
    this.time=0.0;
    this.sec=0.0;
}module.exports.gtime=gtime;
function lsmatrix() {
    this.x=new Array();
    this.Q=new Array();
}module.exports.lsmatrix=lsmatrix;
function obsd_t(){        /* observation data record */
    this.sys=0;
    this.time=new gtime();       /* receiver sampling time (GPST) */
    this.sat=0;
    this.SNR=new Array(exports.NFREQ); /* signal strength (0.25 dBHz) */
    this.LLI=new Array(exports.NFREQ); /* loss of lock indicator */
    this.code=new Array(exports.NFREQ); /* code indicator (CODE_???) */
    this.L=new Array(exports.NFREQ); /* observation data carrier-phase (cycle) */
    this.P=new Array(exports.NFREQ); /* observation data pseudorange (m) */
    this.D=new Array(exports.NFREQ); /* observation data doppler frequency (Hz) */
    this.chState=new Array(exports.NFREQ);//通道跟踪状态
} ;module.exports.obsd_t=obsd_t;
//GPS,Beidou 广播星历
function eph_t(){        /* GPS/QZS/GAL broadcast ephemeris type */
    this.sys=-1;
    this.sat= 0;            /* satellite number */
    this.frq=0;       //
    this.iode= 0;
    this.iodc= 0;      /* IODE,IODC */
    this.sva= 0;            /* SV accuracy (URA index) */
    this.svh=0;            /* SV health (0:ok) */
    this.week=0;           /* GPS/QZS: gps week, GAL: galileo week */
    this.code=0;           /* GPS/QZS: code on L2, GAL/CMP: data sources */
    this.flag=0;           /* GPS/QZS: L2 P data flag, CMP: nav type */
    this.toe=new gtime();
    this.toc=new gtime();
    /* SV orbit parameters */
    this.tow=0;
    this.tocs=0;
    this.A= 0;
    this.e= 0;
    this.i0= 0;
    this.OMG0= 0;
    this.omg= 0;
    this.M0= 0;
    this.deln= 0;
    this.OMGd= 0;
    this.idot= 0;
    //delta_A: 0,A_DOT: 0,delta_n_Dot: 0,delta_OMEGA_DOT: 0,
    //A0: 0,B: 0,alpha0: 0,alpha1: 0,alpha2: 0,alpha3: 0,beta0: 0,beta1: 0,beta2: 0,beta3: 0,
    //gama0: 0,gama1: 0,gama2: 0,gama3: 0,
    //ITOW: 0,
    //top: 0,
    //URA_NED: 0,URA_NED1: 0,URA_NED2: 0,
    //ISC1: 0,ISC2: 0,
    this.crc= 0;
    this.crs= 0;
    this.cuc= 0;
    this.cus= 0;
    this.cic= 0;
    this.cis= 0;
    this.toes= 0;        /* Toe (s) in week */
    //fit: 0,         /* fit interval (h) */
    this.f0= 0;
    this.f1= 0;
    this.f2= 0;    /* SV clock parameters (af0,af1,af2) */
    this.tgd= [0,0,0,0];      /* group delay parameters */
    /* GPS/QZS:tgd[0]=TGD */
    /* GAL    :tgd[0]=BGD E5a/E1,tgd[1]=BGD E5b/E1 */
    /* CMP    :tgd[0]=BGD1,tgd[1]=BGD2 */
} ;module.exports.eph_t=eph_t;
//GLONASS广播星历
function geph_t(){        /* GLONASS broadcast ephemeris type */
    this.week=0;
    this.tow= 0;
    this.sat= 0;            /* satellite number */
    this.iode= 0;           /* IODE (0-6 bit of tb field) */
    this.frq= 0;            /* satellite frequency number */
    this.svh= 0;
    this.sva= 0;
    this.age= 0;    /* satellite health, accuracy, age of operation */
    this.toe=new gtime();        /* epoch of epherides (gpst) */
    this.tof=new gtime();        /* message frame time (gpst) */
    this.pos= new Array(3);      /* satellite position (ecef) (m) */
    this.vel= new Array(3);      /* satellite velocity (ecef) (m/s) */
    this.acc= new Array(3);      /* satellite acceleration (ecef) (m/s^2) */
    this.taun=0;
    this.gamn=0;   /* SV clock bias (s)/relative freq bias */
    this.dtaun=0;       /* delay between L1 and L2 (s) */
} ;module.exports.geph_t=geph_t;

function snrmask_t(){        /* SNR mask type */
    this.ena=new Array(2);         /* enable flag {rover,base} */
    this.mask=0; /* mask (dBHz) at 5,10,...85 deg */
} ;module.exports.snrmask_t=snrmask_t;
function alm_t() {
    this.sys=-1;
    this.sat=0;            /* satellite number */
    this.svh=1;            /* sv health (0:ok) */
    this.svconf=0;         /* as and sv config */
    this.week=0;           /* GPS/QZS: gps week, GAL: galileo week */
    this.toa=new gtime();        /* Toa */
    /* SV orbit parameters */
    this.A=0;
    this.e=0;
    this.i0=0;
    this.OMG0=0;
    this.omg=0;
    this.M0=0;
    this.OMGd=0;
    this.toas=0;        /* Toa (s) in week */
    this.f0=0
    this.f1=0;       /* SV clock parameters (af0,af1) */
};module.exports.alm_t=alm_t;
//电离层模型参数
function ionM(){
    this.stat=0;
    this.time=new gtime();
    this.sys=0;
    this.sat=0;
    this.np=8;
    this.ion= new Array(this.np);
};module.exports.ionM=ionM;
//时间同步参数
function bdUTC(){
    this.sys=0;
    this.week=0;
    this.tow=0;
    this.sat=0;
    this.time=new gtime();
    this.A0utc=0;
    this.A1utc=0;
    this.deltLS=0;
    this.WNLSF=0;
    this.DN=0;
    this.deltLSF=0;
};module.exports.bdUTC=bdUTC;
function gpsUTC() {
    this.sys=0;
    this.sat=0;
    this.week=0;
    this.tow=0;
    this.time=new gtime();
    this.A0utc=0;
    this.A1utc=0;
    this.deltLS=0;
    this.tot=0;
    this.WNt=0;
    this.WNLSF=0;
    this.DN=0;
    this.deltLSF=0;
};module.exports.gpsUTC=gpsUTC;
//URA
function URA() {
    this.sys=0;
    this.week=0;
    this.tow=0;
    this.time=new gtime();
    this.sat=0;
    this.ura=0;
};module.exports.URA=URA;
//北斗差分及完好性数据
function bdRURA(){
    this.week=0;
    this.tow=0;
    this.time=new gtime();
    this.sat=0;
    this.rura=0;
};module.exports.bdRURA=bdRURA;
//北斗差分距离指数
function bdUDRE(){
    this.week=0;
    this.tow=0;
    this.time=new gtime();
    this.sat=0;
    this.udre=0;
};module.exports.bdUDRE=bdUDRE;
//北斗等效钟差参数
function bdDelT(){
    this.stat=0;
    this.time=new gtime();
    this.satH=0;
    this.satID="";
    this.delt1=new Array();
    this.delt2=new Array();
};module.exports.bdDelT=bdDelT;

//北斗电离层格网参数
function IonG(){
    this.dtao=0.0;
    this.givei=0;
};module.exports.IonG=IonG;
function bdIonG(){
    this.stat=0;
    this.time=new gtime();
    this.satH=0;
    this.igp=new Array();
};module.exports.bdIonG=bdIonG;
var sta_t={        /* station parameter type */
    name  :[], /* marker name */
    marker:[],  /* marker number */
    antdes :[], /* antenna descriptor */
    antsno :[], /* antenna serial number */
    rectype :[],/* receiver type descriptor */
    recver:[],  /* receiver firmware version */
    recsno :[], /* receiver serial number */
    antsetup:0,       /* antenna setup id */
    itrf:0,           /* ITRF realization year */
    deltype:0,        /* antenna delta type (0:enu,1:xyz) */
    pos:new Array(3),      /* station position (ecef) (m) */
    del:new Array(3),      /* antenna position delta (e/n/u or x/y/z) (m) */
    hgt:0         /* antenna height (m) */
} ;module.exports.sta_t=sta_t;
function obs_rtcm(){
    this.sta_id=0;
    this.sync=1;
    this.cp=[];
    this.lock=[];
    this.time=new gtime();
    this.nsat=0;
    this.nsys=0;
    this.obs=new Array();
};module.exports.obs_rtcm=obs_rtcm;
/* multi-signal-message header type */
function msm_h_t() {
    this.iod=0;              /* issue of data station */
    this.time_s=0;           /* cumulative session transmitting time */
    this.clk_str=0;          /* clock steering indicator */
    this.clk_ext=0;          /* external clock indicator */
    this.smooth=0;           /* divergence free smoothing indicator */
    this.tint_s=0;           /* soothing interval */
    this.nsat=0;
    this.nsig=0;        /* number of satellites/signals */
    this.sats=new Array(64);         /* satellites */
    this.sigs=new Array(32);         /* signals */
    this.cellmask=new Array(64);     /* cell mask */
};module.exports.msm_h_t=msm_h_t;






