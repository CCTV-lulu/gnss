/**
 * Created by a on 2016/8/16.
 */
var eph = require('./ephemeris.js');     // initialise it
var cmn=require('../routes/comn.js');
var trop=require('./troposphere');
var math=require('mathjs');
var ca=require('../routes/calib.js');
var ionc=require('./ionosphere');

var MAXITR  =    10;          /* max number of iteration for point pos */
var ERR_CBIAS =  0.3 ;        /* code bias error std (m) */

function  SQR(x){
    return x*x;
}
//伪距修正
function prange(obs,nav,azel,iter, opt, vare){
    var PC,P1,P2,P3,gama12,gama13,gama23;
    var sys=obs.sys;
    var lam=cmn.satwavelen(obs.sat,obs.sys,nav.lam);
    var tgd=cmn.sattgd(obs.sat,obs.sys,nav);
    vare[0]=0.0;

    if (iter>0) {
        if (cmn.testsnr(0,0,azel[1],obs.SNR[0]*0.25,opt.snrmask)) {
            return 0.0;
        }
        if (opt.ionoopt==ca.IONOOPT_IFLC) {
            if (cmn.testsnr(0,1,azel[1],obs.SNR[1]*0.25,opt.snrmask)) return 0.0;
        }
    }
    gama12=SQR(lam[1])/SQR(lam[0]); /* f1^2/f2^2 */
    gama13=SQR(lam[2])/SQR(lam[0]);
    gama23=SQR(lam[2])/SQR(lam[1]);

    if (opt.ionoopt==ca.IONOOPT_IFLC) { /* dual-frequency */
        P1=obs.P[0];
        P2=obs.P[1];
        P3=obs.P[2];
        if(opt.nf==0)
        {
            if (P1==0.0||P2==0.0) return 0.0;
            PC=(gama12*P1-P2)/(gama12-1.0);
        }
        if(opt.nf==1)
        {
            if (P1==0.0||P3==0.0) return 0.0;
            PC=(gama13*P1-P3)/(gama13-1.0);
        }
        if(opt.nf==2) {
            if (P2==0.0||P3==0.0) return 0.0;
            PC = (gama23 * P2 - P3) / (gama23 - 1.0);
        }
    }
    else { /* single-frequency */
        P1=obs.P[0]-tgd[0]*ca.CLIGHT;
        P2=obs.P[1]-tgd[1]*ca.CLIGHT;
        P3=obs.P[2]-tgd[2]*ca.CLIGHT;
        if(opt.nf==0) {
            if (P1==0.0) return 0.0;
            PC = P1;
        }
        if(opt.nf==1){
            if (P2==0.0) return 0.0;
            PC=P2;
        }
        if(opt.nf==2){
            if (P3==0.0) return 0.0;
            PC=P3;
        }
    }
    vare[0]=SQR(ERR_CBIAS);
    return PC;
}
//伪距测量误差方差
function varerr(opt, el, sys){
    var fact,varr;
    fact=sys==ca.SYS_GLO?ca.EFACT_GLO:sys==ca.SYS_CMP ? ca.EFACT_CMP:ca.EFACT_GPS;
    varr=SQR(opt.err[0])*(SQR(opt.err[1])+SQR(opt.err[2])/math.sin(el));
    if (opt.ionoopt==ca.IONOOPT_IFLC) varr*=SQR(3.0); /* iono-free */
    return SQR(fact)*varr;
}
//生成几何矩阵
function rescode(iter, obs, rs,dts, vars, svh,nav, x,NX, opt,v, H, vare,azel,vsat,resp,sst,ns){
    var r,vmeas=new Array(),rr=new Array(3),pos=new Array(3),dtr,e=new Array(3),P;
    var i,j,nv=0,sys;
    var rst=new Array(3);
    var ion=new Array(2),trp=new Array(2);
    var mask=new Array(3);
    var azt=new Array(2),el,pr;
    for (i=0;i<3;i++) {rr[i]=x[i];mask[i]=0.0;}
    dtr=x[3];
    cmn.ecef2pos(rr,pos);
    for (i=0;i<obs.length;i++) {

        vsat[i]=0; azel[i*2]=azel[1+i*2]=resp[i]=0.0;
        ion[0]=ion[1]=trp[0]=trp[1]=0.0;
        azt[0]=azt[1]=el=0.0;
        sys=obs[i].sys;

        /* geometric distance/azimuth/elevation angle */
        if(svh[i]==1)continue;
        for(j=0;j<3;j++)rst[j]=rs[j+i*6];
        r=cmn.geodist(rst,rr,e);
        el=cmn.satazel(pos,e,azt);
        azel[i*2]=azt[0];
        azel[1+i*2]=azt[1];
        /*if (opt.ionoopt==ca.IONOOPT_IFLC){
            if(obs[i].SNR[0]<140 || obs[i].SNR[1]<140)
                continue;
        }
        else{
            if(opt.nf==0){
                if(obs[i].SNR[0]<140)
                    continue;
            }
            else if(opt.nf==1){
                if(obs[i].SNR[1]<140)
                    continue;
            }
        }*/

        if(opt.navsys.indexOf(sys)==-1)continue;
        if (r<=0.0|| el<opt.elmin[sys]) continue;

        /* psudorange with code bias correction */
        if ((P=prange(obs[i],nav,azt,iter,opt,vmeas))==0.0)
            continue;
        /* excluded satellite? */
        if (cmn.satexclude(obs[i].sat,obs[i].sys,svh[i],opt))
            continue;
        /* ionospheric corrections */
        if (ionc.ionocorr(obs[i].time,nav,obs[i].sat,obs[i].sys,pos,azt,
                iter>0 ?opt.ionoopt: ca.IONOOPT_BRDC,ion,opt))
            continue;
        /* tropospheric corrections */
        if (trop.tropcorr(obs[i].time,nav,pos,azt,
                iter>0 ?opt.tropopt:ca.TROPOPT_SAAS,trp))
            continue;
        /* pseudorange residual */
        v[nv]=P-(r+dtr-ca.CLIGHT*dts[i*2]+ion[0]+trp[0]);

        /* design matrix */
        for (j=0;j<NX;j++) H[j][nv]=j<3 ? -e[j] : j==3 ? 1.0 : 0.0;

        /* time system and receiver bias offset */
        if      (sys==ca.SYS_GLO) {v[nv]-=x[4]; H[4][nv]=1.0; mask[sys]=1;}
        else if (sys==ca.SYS_CMP) {v[nv]-=x[5]; H[5][nv]=1.0; mask[sys]=1;}
        else { mask[sys]=1;}
        vsat[i]=1; resp[i]=v[nv];

        /* error variance */
        vare[nv++]=varerr(opt,azel[1+i*2],sys)+vars[i]+vmeas[0]+ion[1]+trp[1];
        sst.push(cmn.sysstr(obs[i].sys)+obs[i].sat);
    }
    for (i=2;i>=0;i--) {
        if (mask[i]) {ns.push(i);continue;}
        H.splice(i+3,1);
        if(!mask[0]){
            for (j=0;j<nv;j++)H[3][j]=1.0;
        }
    }
    return nv;
}
function valsol_m(azel, vsat, n,opt, v, nv, nx,dop){
    var azels=new Array(),vv;
    var i,ns;
    /* large gdop check */
    for (i=ns=0;i<n;i++) {
        if (!vsat[i]) continue;
        azels[  ns*2]=azel[  i*2];
        azels[1+ns*2]=azel[1+i*2];
        ns++;
    }
    cmn.dops(ns,azels,opt.elmin,dop);
}
//最小二乘定位解算
function estpos(obs, rs, dts,vars, svh, nav,opt,NX ,sol, vsat,azel,vare,H,v,sst){
    var x=new Array(NX),dx=new Array(NX),resp=new Array(obs.length),sig;
    var i,j,k,info,stat,nv;
    var Ht,vt,nx,vart,sstt;
    var info;
    var nsys;
    for (i=0;i<6;i++)x[i]= i<3 ? sol.rr[i] : 0;
    for (i=0;i<MAXITR;i++) {
        /* pseudorange residuals */
        Ht=new Array(NX);
        for(j=0;j<NX;j++)Ht[j]=new Array();
        vt=new Array();
        vart=new Array();
        sstt=new Array();
        nsys=new Array();
        nv=rescode(i,obs,rs,dts,vars,svh,nav,x,NX,opt,vt,Ht,vart,azel,vsat,resp,sstt,nsys);
        nx=Ht.length;
        /*for(j=0;j<Ht.length;j++){
            H[j]=new Array(Ht[j].length);
            for(k=0;k<Ht[j].length;k++)
                H[j][k]=Ht[j][k];
        }*/

        //for(j=0;j<Ht.length;j++)H[j]=Ht[j];
        if (nv<nx) {
            break;
        }
        /* weight by variance */
        for (j=0;j<nv;j++) {
            sig=math.sqrt(vart[j]);
            vt[j]/=sig;
            for (k=0;k<nx;k++) Ht[k][j]/=sig;
        }
        /* least square estimation */
        info=cmn.lsq(Ht,vt);
        for (j = 0; j < NX; j++)dx[j] = j < 3 ? info.x[j] : 0.0;
        if(nsys.length>1) {
            if (nsys.indexOf(ca.SYS_GPS) > -1 && nsys.indexOf(ca.SYS_GLO) > -1 &&
                nsys.indexOf(ca.SYS_CMP) > -1) {
                dx[3] = info.x[3]; dx[4] = info.x[4]; dx[5] = info.x[5];
            }
            else if (nsys.indexOf(ca.SYS_GPS) > -1 && nsys.indexOf(ca.SYS_GLO) == -1 &&
                nsys.indexOf(ca.SYS_CMP) > -1) {
                dx[3] = info.x[3]; dx[5] = info.x[4];
            }
            else if(nsys.indexOf(ca.SYS_GPS) > -1 && nsys.indexOf(ca.SYS_GLO) > -1 &&
                nsys.indexOf(ca.SYS_CMP) == -1){
                dx[3] = info.x[3]; dx[4] = info.x[4];
            }
            else if(nsys.indexOf(ca.SYS_GPS) == -1 && nsys.indexOf(ca.SYS_GLO) > -1 &&
                nsys.indexOf(ca.SYS_CMP) > -1){
                dx[4] = info.x[3]; dx[5] = info.x[4];
            }
        }
        else
            dx[3]=info.x[3];
        for (j=0;j<NX;j++) x[j]+=dx[j];
        if (cmn.norm(dx,NX)<1E-4) {
            sol.type=0;
            sol.time=cmn.timeadd(obs[0].time,-x[3]/ca.CLIGHT);
            sol.dtr[0]=x[3]/ca.CLIGHT; /* receiver clock bias (s) */
            sol.dtr[1]=x[4]/ca.CLIGHT; /* glonass-gps time offset (s) */
            sol.dtr[2]=(x[5])/ca.CLIGHT;/* BD-gps time offset (s) 2013.11.12*/
            for (j=0;j<6;j++) sol.rr[j]=j<3?x[j]:0.0;
            cmn.ecef2pos(sol.rr,sol.pos);
            sol.pos[0]*=ca.R2D;
            sol.pos[1]*=ca.R2D;
            sol.qr=info.Q;
            sol.ns=nv;
            sol.azel=azel;
            sol.resp=resp;
            sol.navsys=nsys;
            sol.svh=svh;
            for(j=NX-1;j>=nx;j--)H.splice(j,1);
            for(j=0;j<nv;j++){v[j]=vt[j];vare[j]=vart[j];sst[j]=sstt[j];};
            valsol_m(azel,vsat,obs.length,opt,vt,nv,4,sol.dop);
            H2enu(H,Ht,sol.rr);
            return 0;
        }
    }
    if(i==MAXITR){
        for (j=0;j<6;j++){
            if(isNaN(x[j])){
                sol.time=obs[0].time;
                return 1;
            }
        }
        sol.time=cmn.timeadd(obs[0].time,-x[3]/ca.CLIGHT);
        for (j=0;j<6;j++) sol.rr[j]=j<3?x[j]:0.0;
        cmn.ecef2pos(sol.rr,sol.pos);
        sol.pos[0]*=ca.R2D;
        sol.pos[1]*=ca.R2D;
        sol.ns=nv;
        sol.azel=azel;
        sol.navsys=nsys;
        sol.svh=svh;
        for(j=0;j<nv;j++){v[j]=vt[j];vare[j]=vart[j];sst[j]=sstt[j];};
        valsol_m(azel,vsat,obs.length,opt,vt,nv,4,sol.dop);
        H2enu(H,Ht,sol.rr);
    }
    return 1;
}
function H2enu(H,Ht,rr) {
    var nx=Ht.length;
    var He,F=new Array(nx),E=[],pos=new Array(3),j,k;
    cmn.ecef2pos(rr,pos);
    cmn.xyz2enu(pos,E);
    for(j=0;j<nx;j++){
        F[j]=new Array(nx);
        for(k=0;k<nx;k++){
            F[j][k]=j==k?1.0:0;
        }
    }
    for(j=0;j<3;j++){
        for(k=0;k<3;k++){
            F[j][k]=E[j][k];
        }
    }
    He=math.multiply(F,Ht);
    for(j=0;j<nx;j++)H[j]=He[j];
}
function raim_fde(obs,rs,dts,vars,svh,nav,opt,NX,sol,vsat,azel,vare,H,v,sst){
    var info,i,j,p;
    var n,m,k,len;
    var svh_e=[];
    var A=[],S=[],I,Ht,V,w;
    var sigma=0,pbiasB,FSN,FSN_t,HPL,HPL_t,VPL,VPL_t,SSE,sys,sat;
    var FSat,svh_r=[];
    len=obs.length;
    n=sol.ns;
    m=sol.navsys.length+3;
    k=n-m;
    for(j=0;j<len;j++){
        svh_e[j]=svh[j];
        svh_r[j]=0;
    }
    while ((SSE=raim_for(obs,rs,dts,vars,svh,nav,opt,NX,sol,vare,H,v,A,S))>opt.threshold_PFD[k]){
        FSN = v[0]*v[0]/S[0][0];
        FSat = sst[0];
        if(S[0][0]<0)
            return 3;
        HPL = math.sqrt((A[0][0]*A[0][0]+A[1][0]*A[1][0])/S[0][0]);
        VPL = math.sqrt((A[2][0]*A[2][0])/S[0][0]);
        n=sol.ns;
        for(i=1;i<n;i++){
            if(S[i][i]<0)
                return 3;
            FSN_t = v[i]*v[i]/S[i][i];
            HPL_t = math.sqrt((A[0][i]*A[0][i]+A[1][i]*A[1][i])/S[i][i]);
            VPL_t = math.sqrt((A[2][i]*A[2][i])/S[i][i]);
            if(HPL_t==Infinity || VPL_t==Infinity || isNaN(HPL_t) || isNaN(VPL_t))
                return 3;
            if(FSN_t>FSN){
                FSN = FSN_t;
                FSat = sst[i];
            }
        }
        sol.ex+=FSat;
        sys=cmn.str2sys(FSat.substr(0,1));
        sat=parseInt(FSat.substr(1,FSat.length-1));

        for(j=0;j<len;j++){
            if(obs[j].sys==sys && obs[j].sat==sat){
                svh_e[j]=1;
                svh_r[j]=1;
            }
        }
        vsat=new Array();
        vare=new Array();
        azel=new Array();
        v=new Array();
        H=new Array(NX);
        sst=new Array();
        if(estpos(obs,rs,dts,vars,svh_e,nav,opt,NX,sol,vsat,azel,vare,H,v,sst)){
            return 2;
        }
    }
    /* find excluded sat and calculate HPL/VPL */
    n=sol.ns;
    sigma=0;
    for (p=0;p<n;p++)
        sigma += vare[p];
    sigma = math.sqrt(sigma/n);
    k=n-m;
    if (k<=0) {
        return 1;
    }
    if(k>opt.nclamda_PMD.length)
        return 2;
    pbiasB = sigma*math.sqrt(opt.nclamda_PMD[k]);
    FSN = v[0]*v[0]/S[0][0];
    FSat = sst[0];
    if(S[0][0]<0)
        return 3;
    HPL = math.sqrt((A[0][0]*A[0][0]+A[1][0]*A[1][0])/S[0][0]);
    VPL = math.sqrt((A[2][0]*A[2][0])/S[0][0]);
    for(i=1;i<n;i++){
        if(S[i][i]<0)
            return 3;
        FSN_t = v[i]*v[i]/S[i][i];
        HPL_t = math.sqrt((A[0][i]*A[0][i]+A[1][i]*A[1][i])/S[i][i]);
        VPL_t = math.sqrt((A[2][i]*A[2][i])/S[i][i]);
        if(HPL_t==Infinity || VPL_t==Infinity || isNaN(HPL_t) || isNaN(VPL_t))
            continue;
        if(FSN_t>FSN){
            FSN = FSN_t;
            FSat = sst[i];
            //HPL = HPL_t;
            //VPL = VPL_t;
        }
        if(HPL_t>HPL){
            //FSat = sst[i];
            HPL = HPL_t;
        }
        if(VPL_t>VPL)
            VPL = VPL_t;
        var x=10;
    }
    sol.VPL=pbiasB*VPL;
    sol.HPL=pbiasB*HPL;
    //sol.ex=FSat;
    sol.svh=svh_r;
    return 0;
}
function raim_for(obs,rs,dts,vars,svh,nav,opt,NX,sol,vare,H,v,A,S) {
    var i,n,m,k;
    var sigma=0,pbiasB,I,Ht,V,w,SSE;
    var At,St;
    n=sol.ns;
    m=sol.navsys.length+3;
    k=n-m;  //degrees of freedom
    if (k<=0) {
        return 1;
    }
    /* calculate pbiasB */
    for (i=0;i<n;i++)
        sigma += vare[i];
    sigma = math.sqrt(sigma/n);
    if(k>opt.nclamda_PMD.length)
        return 0;
    pbiasB = sigma*math.sqrt(opt.nclamda_PMD[k]);

    /* calculate matrix A/S */
    I=math.eye(n);
    //V=math.inv(math.diag(vare));
    Ht=math.transpose(H);
    //A=math.multiply(math.inv(math.multiply(math.multiply(H,V),Ht)),H);
    At=math.multiply(math.inv(math.multiply(H,Ht)),H);
    //S=math.subtract(I,math.multiply(math.multiply(Ht,A),V)).valueOf();
    St=math.subtract(I,math.multiply(Ht,At)).valueOf();   // S = I-H' x A
    w=math.multiply(St,v);
    for(i=0;i<At.length;i++)A[i]=At[i];
    for(i=0;i<St.length;i++)S[i]=St[i];
    SSE=math.norm(w);
    return SSE;
}
function resdop(obs, rs,dts,nav,rr,x,azel,vsat, v,H){
    var rate,pos=new Array(3),E=new Array(3),a=new Array(3),
        e=new Array(3),vs=new Array(3),cosel;
    var i,j,nv=0;
    var rst=new Array(6);
    for(i=0;i<3;i++)E[i]=new Array();
    for (j=0;j<4;j++) H[j]=new Array();
    cmn.ecef2pos(rr,pos);
    cmn.xyz2enu(pos,E);
    for (i=0;i<obs.length;i++) {
        var lam=cmn.satwavelen(obs[i].sat,obs[i].sys,nav);
        for(j=0;j<6;j++)rst[j]=rs[j+i*6];
        if (obs[i].D[0]==0.0||lam[0]==0.0||!vsat[i]||cmn.norm(rst,3)<=0.0) {
            continue;
        }
        /* line-of-sight vector in ecef */
        cosel=math.cos(azel[1+i*2]);
        a[0]=math.sin(azel[i*2])*cosel;
        a[1]=math.cos(azel[i*2])*cosel;
        a[2]=math.sin(azel[1+i*2]);
        e=math.multiply(math.transpose(E),a);

        /* satellite velocity relative to receiver in ecef */
        for (j=0;j<3;j++) vs[j]=rst[j+3]-x[j];

        /* range rate with earth rotation correction */
        rate=cmn.dot(vs,e,3)+ca.OMGE/ca.CLIGHT*(rst[4]*rr[0]+rst[1]*x[0]-
            rst[3]*rr[1]-rst[0]*x[1]);

        /* doppler residual */
        v[nv]=lam[0]*obs[i].D[0]-(rate+x[3]-ca.CLIGHT*dts[1+i*2]);
        /* design matrix */
        for (j=0;j<4;j++) H[j][nv]=j<3?-e[j]:1.0;
        nv++;
    }
    return nv;
}
//用户速度计算
function estvel(obs, n, rs, dts,nav, opt, sol,azel, vsat){
    var x=new Array(4),v,H;
    var i,j,nv;
    var ls;
    for(i=0;i<4;i++)x[i]=0.0;
    for (i=0;i<MAXITR;i++) {
        H=new Array(4);
        v=new Array();
        /* doppler residuals */
        if ((nv=resdop(obs,rs,dts,nav,sol.rr,x,azel,vsat,v,H))<4) {
            break;
        }
        /* least square estimation */
        ls=cmn.lsq(H,v);

        for (j=0;j<4;j++) x[j]+=ls.x[j];

        if (cmn.norm(ls.x,4)<1E-6) {
            for (i=0;i<3;i++) sol.rr[i+3]=ls.x[i];
            break;
        }
    }
}
/* single-point positioning ----------------------------------------------------
 * compute receiver position, velocity, clock bias by single-point positioning
 * with pseudorange and doppler observables
 * args   : obsd_t *obs      I   observation data
 *          int    n         I   number of observation data
 *          nav_t  *nav      I   navigation data
 *          prcopt_t *opt    I   processing options
 *          sol_t  *sol      IO  solution
 *          double *azel     IO  azimuth/elevation angle (rad) (NULL: no output)
 *          ssat_t *ssat     IO  satellite status              (NULL: no output)
 *          char   *msg      O   error message for error exit
 * return : status(1:ok,0:error)
 * notes  : assuming sbas-gps, galileo-gps, qzss-gps, compass-gps time offset and
 *          receiver bias are negligible (only involving glonass-gps time offset
 *          and receiver bias)
 *-----------------------------------------------------------------------------*/
module.exports.pntpos_RAIM=function(obs, nav, opt, sol){
    var rs,dts,vars,H,v,vare,azel;
    var i,stat,vsat,svh;
    var NX=6;
    var sst=new Array();
    var n=obs.length;
    stat=sol.stat=ca.SOLQ_NONE;
    sol.time=obs[0].time;

    v=new Array();
    H=new Array(NX);
    rs=new Array();
    dts=new Array();
    vars=new Array();
    vare=new Array();
    azel=new Array();
    svh=new Array();
    vsat=new Array();
    //estimate satellite position with bradcast ephemetis
    eph.satposs(sol.time,obs,n,nav,opt,rs,dts,vars,svh);
    /* estimate receiver position with pseudorange */
    if(!estpos(obs,rs,dts,vars,svh,nav,opt,NX,sol,vsat,azel,vare,H,v,sst)) {
        if(sol.ns>sol.navsys.length+3){
            if(!raim_fde( obs,rs,dts,vars,svh,nav,opt,NX,sol,vsat,azel,vare,H,v,sst))
                stat=1;
        }
    }
    sol.stat=stat;
    return stat;
};
