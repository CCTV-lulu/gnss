/**
 * Created by dell on 17-2-14.
 */
var mongoose = require('mongoose'),
    encryption = require('../../utilities/cripto');

module.exports.init = function () {
    var stationSchema = new mongoose.Schema({
        userName: String,
        isRunning: Number,
        effectiveTime: String,
        data: Object,
        createTime:Date,
        processId: String
    });

    stationSchema.method({

    });

    var BatchProcessData = mongoose.model('BatchProcessData', stationSchema);
};