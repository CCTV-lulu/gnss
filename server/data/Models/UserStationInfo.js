var mongoose = require('mongoose'),
    encryption = require('../../utilities/cripto');

module.exports.init = function () {
    var stationSchema = new mongoose.Schema({
        username: String,
        realTimeStation:Object,
        originalStation:Object,
        originalSystem:Object

    });

    stationSchema.method({

    });

    var UserStationId = mongoose.model('UserStationInfo', stationSchema);
};