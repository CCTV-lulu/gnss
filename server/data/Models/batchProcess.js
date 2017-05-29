/**
 * Created by dell on 17-2-14.
 */
var mongoose = require('mongoose'),
    encryption = require('../../utilities/cripto');

module.exports.init = function () {
    var stationSchema = new mongoose.Schema({
        userName: String,
        status: Boolean,
        effectiveTime: String,
        data: Object,
        createTime:Date
    });

    stationSchema.method({

    });

    var BatchProcessData = mongoose.model('BatchProcessData', stationSchema);
};