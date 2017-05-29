var mongoose = require('mongoose'),
    encryption = require('../../utilities/cripto');

module.exports.init = function () {
    var stationSchema = new mongoose.Schema({
        staId: String,
        name: String,
        //stationName: String
    });

    stationSchema.method({

    });

    var stationInfo = mongoose.model('Station', stationSchema);
};