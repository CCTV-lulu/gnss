var mongoose = require('mongoose'),
    encryption = require('../../utilities/cripto');

module.exports.init = function () {
    var stationSchema = new mongoose.Schema({
        happendTime: Date,
        stationName: String,
        staId:String,
        sys:Number,
        warningContent:String,
        warningValue:Number,
        threshold: Number

    });

    stationSchema.method({

    });

    var WarningInfo  = mongoose.model('WarningInfo', stationSchema);
};
