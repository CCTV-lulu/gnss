/**
 * Created by a on 2017/5/27.
 */
var ca=require('../routes/calib.js');
var math=require('mathjs');
var cmn=require('../routes/comn.js');

var ERR_ION =    5.0 ;        /* ionospheric delay std (m) */
var ERR_BRDCI =  0.5 ;        /* broadcast iono model error factor */
var ion_default=[ /* 2004/1/1 */
    0.1118E-07,-0.7451E-08,-0.5961E-07, 0.1192E-06,
    0.1167E+06,-0.2294E+06,-0.1311E+06, 0.1049E+07];
function SQR(x) {
    return x*x;
}
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
    cmn.time2gpst(t,ws);
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
}
//电离层模型修正
function ionocorr(time, nav, sat, sys, pos,azel, ionoopt, ion,opt){
    var i;
    if (ionoopt==ca.IONOOPT_BRDC && sys== ca.SYS_CMP) {
        if(nav.ion_cmp[sat-1]!=undefined){
            if (cmn.norm(nav.ion_cmp[sat-1].ion,8)<=0.0) {
                for (i = 0; i < 8; i++)nav.ion_cmp[sat-1].ion[i] = ion_default[i];
                ion[0] = ionmodel(time, nav.ion_cmp[sat-1].ion, pos, azel);
                /*var lam_cmp=cmn.satwavelen(1,ca.SYS_CMP,nav);
                 var lam_gps=cmn.satwavelen(1,ca.SYS_GPS,nav);
                 if(opt.nf==0){
                 ion[0]*=lam_cmp[0]*lam_cmp[0]/lam_gps[0]/lam_gps[0];
                 }else if(opt.nf==1){
                 ion[0]*=lam_cmp[1]*lam_cmp[1]/lam_gps[0]/lam_gps[0];
                 }*/
            }
            else{
                ion[0] = ionmodel(time, nav.ion_cmp[sat-1].ion, pos, azel);
            }
        }
        else {
            nav.ion_cmp[sat-1]=new ca.ionM();
            for (i = 0; i < 8; i++)nav.ion_cmp[sat-1].ion[i] = ion_default[i];
            ion[0] = ionmodel(time, nav.ion_cmp[sat-1].ion, pos, azel);
        }
        ion[1] = SQR(ion[0] * ERR_BRDCI);
    }
    else if(ionoopt==ca.IONOOPT_BRDC && sys== ca.SYS_GPS){
        if (cmn.norm(nav.ion_gps.ion,8)<=0.0) for(i=0;i<8;i++)nav.ion_gps.ion[i]=ion_default[i];
        ion[0] = ionmodel(time, nav.ion_gps.ion, pos, azel);
        if(opt.nf==1){
            var lam_gps=cmn.satwavelen(1,ca.SYS_GPS,nav);
            ion[0]*=lam_gps[1]*lam_gps[1]/lam_gps[0]/lam_gps[0];
        }
        ion[1] = SQR(ion[0] * ERR_BRDCI);
    }
    else if(ionoopt==ca.IONOOPT_BRDC && sys== ca.SYS_GLO){
        ion[0]=0;
        ion[1]=SQR(ERR_ION);
        /*if (cmn.norm(nav.ion_gps.ion,8)<=0.0) {
         for (i = 0; i < 8; i++)nav.ion_gps.ion[i] = ion_default[i];
         }
         ion[0] = cmn.ionmodel(time, nav.ion_gps.ion, pos, azel);
         var lam_glo=cmn.satwavelen(sat,sys,nav);
         var lam_gps=cmn.satwavelen(1,ca.SYS_GPS,nav);
         var glsvar=1;
         if(opt.nf==0){
         glsvar=lam_glo[0]*lam_glo[0]/lam_gps[0]/lam_gps[0];
         ion[0]*=glsvar;
         }else if(opt.nf==1){
         glsvar=lam_glo[1]*lam_glo[1]/lam_gps[0]/lam_gps[0];
         ion[0]*=glsvar;
         }
         ion[1] = SQR(ion[0] * ERR_BRDCI*glsvar);*/
        //ion[0] = 0.0;
        //[1] = ionoopt == ca.IONOOPT_OFF ? SQR(ERR_ION) : 0.0;
    }
    return 0;
    /* ionex tec model */
    /* if (ionoopt==IONOOPT_TEC) {
     return iontec(time,nav,pos,azel,1,ion,var);
     }*/
}module.exports.ionocorr=ionocorr;