var mongoose = require('mongoose'),
    encryption = require('../../utilities/cripto');

module.exports.init = function () {
    var stationSchema = new mongoose.Schema({
        stationName:String,
        filePath:Object
    });

    stationSchema.method({

    });

    var FollowData = mongoose.model('FollowData', stationSchema);
};