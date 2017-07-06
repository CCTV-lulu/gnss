var UsersController = require('./usersController.js');
var Station = require("./stationController.js");
var BatchProcess = require('./batchProcessController.js');
var FollowData = require('./followDataController.js');

module.exports = {
    users: UsersController,
    station: Station,
    batchProcess: BatchProcess,
    followData:FollowData
};