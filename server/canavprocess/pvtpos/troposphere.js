/**
 * Created by a on 2016/8/17.
 */
var ca=require('../routes/calib.js');
var math=require('mathjs');
var cmn=require('../routes/comn.js');

var ERR_SAAS  =  0.3 ;        /* saastamoinen model error std (m) */
var ERR_TROP =   3.0 ;        /* tropspheric delay std (m) */
var REL_HUMI  =  0.7 ;        /* relative humidity for saastamoinen model */
function SQR(x) {
    return x*x;
}
function getmet(lat, met){
    var metprm=[ /* lat=15,30,45,60,75 */
    [1013.25,299.65,26.31,6.30E-3,2.77,  0.00, 0.00,0.00,0.00E-3,0.00],
    [1017.25,294.15,21.79,6.05E-3,3.15, -3.75, 7.00,8.85,0.25E-3,0.33],
    [1015.75,283.15,11.66,5.58E-3,2.57, -2.25,11.00,7.24,0.32E-3,0.46],
    [1011.75,272.15, 6.78,5.39E-3,1.81, -1.75,15.00,5.36,0.81E-3,0.74],
    [1013.00,263.65, 4.11,4.53E-3,1.55, -0.50,14.50,3.39,0.62E-3,0.30]];
    var i,j;
    var a;
    lat=math.abs(lat);
    if      (lat<=15.0) for (i=0;i<10;i++) met[i]=metprm[0][i];
    else if (lat>=75.0) for (i=0;i<10;i++) met[i]=metprm[4][i];
    else {
        j=math.floor(lat/15.0); a=(lat-j*15.0)/15.0;
        for (i=0;i<10;i++) met[i]=(1.0-a)*metprm[j-1][i]+a*metprm[j][i];
    }
}
//对流层模型修正
function tropcorr(time, nav, pos,azel, tropopt, trp){
    /* saastamoinen model */
    if (tropopt==ca.TROPOPT_SAAS) {
        trp[0]=tropmodel(time,pos,azel,REL_HUMI);
        trp[1]=SQR(ERR_SAAS/(math.sin(azel[1])+0.1));
    }
    /* sbas troposphere model */
    else if (tropopt==ca.TROPOPT_SBAS) {
        sbstropcorr(time,pos,azel,trp);
    }
    else {
        trp[0] = 0.0;
        trp[1] = tropopt == ca.TROPOPT_OFF ? SQR(ERR_TROP) : 0.0;
    }
    return 0;
};module.exports.tropcorr=tropcorr;
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
};
function sbstropcorr(time, pos, azel,trp){
    var k1=77.604,k2=382000.0,rd=287.054,gm=9.784,g=9.80665;
    var pos_=new Array(3),zh=0.0,zw=0.0;
    var i;
    var c,met=new Array(10),sinel=math.sin(azel[1]),h=pos[2],m;

    pos_[0]=pos_[1]=pos_[2]=0;
    if (pos[2]<-100.0||10000.0<pos[2]||azel[1]<=0) {
    trp[1]=0.0;
        return 0.0;
    }
    if (zh==0.0||math.abs(pos[0]-pos_[0])>1E-7||math.abs(pos[1]-pos_[1])>1E-7||
        math.abs(pos[2]-pos_[2])>1.0) {
        getmet(pos[0]*ca.R2D,met);
        c=math.cos(2.0*ca.PI*(cmn.time2doy(time)-(pos[0]>=0.0?28.0:211.0))/365.25);
        for (i=0;i<5;i++) met[i]-=met[i+5]*c;
        zh=1E-6*k1*rd*met[0]/gm;
        zw=1E-6*k2*rd/(gm*(met[4]+1.0)-met[3]*rd)*met[2]/met[1];
        zh*=math.pow(1.0-met[3]*h/met[1],g/(rd*met[3]));
        zw*=math.pow(1.0-met[3]*h/met[1],(met[4]+1.0)*g/(rd*met[3])-1.0);
        for (i=0;i<3;i++) pos_[i]=pos[i];
    }
    m=1.001/math.sqrt(0.002001+sinel*sinel);
    trp[1]=0.12*0.12*m*m;
    trp[0]= (zh+zw)*m;
};