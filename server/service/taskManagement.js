var Processes ={};
var uuidv4 = require('uuid/v4');

function getProcessById(processId){
    return Processes[processId]
}

function getAllProcess(){
    return Processes
}
function clearProcessById(processId){
    delete Processes[processId]
}


function addProcess(chlid){
    var processId = uuidv4();
    Processes[processId] = chlid;
    return processId
}


function stopProcessById(processId){
    var process = getProcessById(processId);
    if(process){
        try{
            process.process.send("break")

            clearProcessById(processId)
        }catch(err){
            clearProcessById(processId)
        }
    }
}

function stopProcessByStation(stationId){
    var allProcess = getAllProcess();
    for(var processId in allProcess){
        if(allProcess[processId].stationId == stationId){
            stopProcessById(processId)
        }
    }
}

function stopProcessByUsername(username){
    var allProcess = getAllProcess();
    for(var processId in allProcess){
        if(allProcess[processId].username == username){
            stopProcessById(processId)
        }
    }
}

module.exports = {
    addProcess: addProcess,
    stopProcessByStation: stopProcessByStation,
    stopProcessById: stopProcessById,
    clearProcessById: clearProcessById,
    stopProcessByUsername: stopProcessByUsername,
    getProcessById: getProcessById
};