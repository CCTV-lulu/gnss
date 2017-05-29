/**
 * Created by a on 2016/12/23.
 */

var parse=require('../rtcm/parse_distrib.js');
var nodepos=require('../pvtpos/nodepos.js');
var integ=require('./integrity.js');

function postdata(data,para,cont,postprc){
    var sta_data;
    var data=new Buffer(data);
    if(para.first) {
        para.buff.copy(para.buff, 0, para.first, para.index);
        para.index-=para.first;
        para.first=0;
    }
    data.copy(para.buff,para.index,0,data.length);
    para.index+=data.length;
    while((sta_data=parse.postdata(para))!=-1) {
        if(sta_data.time==undefined){
            break;
        }
        //console.log(sta_data.time);
        var posR;
        if((posR= nodepos.postpos(para.sta_id, sta_data, para,postprc))==1)
            continue;
        //console.log(posR.Lat,posR.Lon,posR.H);
        integ.integrity_strunt(posR,cont);
    }
    return 1;
};module.exports.postdata=postdata;
