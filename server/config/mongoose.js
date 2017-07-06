var mongoose = require('mongoose'),
    UserModel = require('../data/Models/User'),
    UserStationIdModel = require('../data/Models/UserStationId'),
    StationModel = require('../data/Models/Station'),
    staThresholdModel = require('../data/Models/staThreshold'),
    StationStatusModel = require('../data/Models/StationStatus'),
    UserStationInfo = require('../data/Models/UserStationInfo'),
    StationConfig = require('../data/Models/StationConfig'),
    batchProcessModel = require('../data/Models/batchProcess'),
    followDataModel = require('../data/Models/followData'),
    WarningInfo = require('../data/Models/WarningInfo');
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
    followDataModel.init()
    UserStationInfo.init();
    StationConfig.init();
    WarningInfo.init();

};