/**
 * Created by a on 2016/10/17.
 */
var fs=require('fs');
var path=require('path');
var cmn=require('../routes/comn.js');
var cwd=__dirname;
var file=path.join(cwd,'/anaOut.json');
function loadinteg() {
    var events={};
    if(fs.existsSync(file)){
        try{
            var data=fs.readFileSync(file);
            data=JSON.parse(data);
            if(data=={}){
                console.log("integrity file read error");
                process.exit(1);
            }
            else{
                for(var obj in data){
                    events[obj]={
                        "startTime":data[obj].startTime,
                        "Horizontal":data[obj].Horizontal,
                        "Vertical":data[obj].Vertical,
                        "Hori95":data[obj].Hori95[data[obj].Hori95.length-1],
                        "Vert95":data[obj].Vert95[data[obj].Vert95.length-1],
                        "contEvent":data[obj].contEvent[data[obj].contEvent.length-1]
                    }
                }
            }
        }
        catch(err){
            console.log(err.message);
            process.exit(1);
        }
    }
    else{
        console.log('the config file is not exist!');
        process.exit(1);
    }
    return events;
}module.exports.loadinteg=loadinteg;
function saveacc(curr_event) {
    fs.readFile(file,function (err,data) {
        data=JSON.parse(data);
        if(err){
            console.log(err.message);
        }else {
            for (var obj in curr_event) {
                acc95save(data[obj].Hori95, curr_event[obj].Hori95);
                acc95save(data[obj].Vert95, curr_event[obj].Vert95);
                if (data[obj].contEvent[data[obj].contEvent.length - 1].type == curr_event.contEvent.type &&
                    cmn.timediff(data[obj].contEvent[data[obj].contEvent.length - 1].startTime,
                        curr_event.contEvent.startTime) < 0.001) {
                    data[obj].contEvent[data[obj].contEvent.length - 1] = curr_event.contEvent;
                } else {
                    data[obj].contEvent.push(curr_event.contEvent);
                }
            }
            fs.writeFile(file, JSON.stringify(continuEvent),
                function (err, data) {
                    if (err) {
                        console.log(err.message);
                    }
                });
        }
    });
}module.exports.saveacc=saveacc;
function addaccevent(sta_id,curr_event) {
    fs.readFile(file,function (err,data) {
        data=JSON.parse(data);
        if(err){
            console.log(err.message);
        }else {
            data[sta_id]=curr_event;
            fs.writeFile(file, JSON.stringify(continuEvent),
                {"encoding": "String", "flag ": "w"}, function (err, data) {
                    if (err) {
                        console.log(err.message);
                    }
                });
        }
    });
}module.exports.addaccevent=addaccevent;
function addacc95curr(sta_id,Hori95,Vert95) {
    fs.readFile(file,function (err,data) {
        data=JSON.parse(data);
        if(err){
            console.log(err.message);
        }else {
            data[sta_id].Hori95.push(Hori95);
            data[sta_id].Vert95.push(Vert95);
            fs.writeFile(file, JSON.stringify(continuEvent),
                function (err, data) {
                    if (err) {
                        console.log(err.message);
                    }
                });
        }
    });
}module.exports.addacc95curr=addacc95curr;
function addfail(sta_id,curr_event) {
    fs.readFile(file,function (err,data) {
        data=JSON.parse(data);
        if(err){
            console.log(err.message);
        }else {
            data[sta_id].contEvent.push(curr_event.contEvent);
            fs.writeFile(file, JSON.stringify(continuEvent),
               function (err, data) {
                    if (err) {
                        console.log(err.message);
                    }
                });
        }
    });
}module.exports.addfail=addfail;
function acc95save(data95,curr95) {
    if(cmn.timediff(data95[data95.length-1].time,curr95.time)<24*3600){
        data95[data95.length-1]=curr95;
    }
    else{
        data95.push(curr95);
    }
}