var mongoose = require('mongoose'),
    encryption = require('../../utilities/cripto');

module.exports.init = function () {
    var stationSchema = new mongoose.Schema({
        username: String,
        name: String,
        staId: String

    });

    stationSchema.method({

    });

    var UserStationId = mongoose.model('UserStationInfo', stationSchema);
};