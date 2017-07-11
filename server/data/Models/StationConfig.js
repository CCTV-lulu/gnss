var mongoose = require('mongoose'),
    encryption = require('../../utilities/cripto');

module.exports.init = function () {
    var stationConfigSchema = new mongoose.Schema({
        stationName: String,
        staId: String,
        config:Object,
        threshold: Object,
        handleData:Object
    });

    stationConfigSchema.method({

    });

    var UserStationId = mongoose.model('StationConfig', stationConfigSchema);
};