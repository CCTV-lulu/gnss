var mongoose = require('mongoose'),
    UserModel = require('../data/Models/User'),
    UserStationIdModel = require('../data/Models/UserStationId'),
    StationModel = require('../data/Models/Station'),
    staThresholdModel = require('../data/Models/staThreshold'),
    StationStatusModel = require('../data/Models/StationStatus'),
    UserStationInfo = require('../data/Models/UserStationInfo'),
    batchProcessModel = require('../data/Models/batchProcess');

    mongoose.Promise = global.Promise;


module.exports = function (config) {
    mongoose.connect(config.db);
    var db = mongoose.connection;

    db.once('open', function (err) {
        if (err) {
            console.log('Database could not be opened: ' + err);
            return;
        }
        console.log('Database up and running...')
    });

    db.on('error', function (err) {
        console.log('Database error: ' + err);
    });

    UserModel.init();
    UserStationIdModel.init();
    StationStatusModel.init();
    StationModel.init();
    staThresholdModel.init();
    batchProcessModel.init();
    UserStationInfo.init()

};