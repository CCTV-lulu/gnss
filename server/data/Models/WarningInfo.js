var mongoose = require('mongoose'),
    encryption = require('../../utilities/cripto');

module.exports.init = function () {
    var stationSchema = new mongoose.Schema({
        stationName: String,
        stationId:string,


    });

    stationSchema.method({

    });

    var UserStationId = mongoose.model('WarningInfo', stationSchema);
};
