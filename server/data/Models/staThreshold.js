
var mongoose = require('mongoose'),
    encryption = require('../../utilities/cripto');

module.exports.init = function () {
    var stationSchema = new mongoose.Schema({
        userName: String,
        staName: String,
        staThreshold: Object
    });

    stationSchema.method({

    });

    var StaThreshold = mongoose.model('StaThreshold', stationSchema);
};