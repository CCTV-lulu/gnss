var mongoose = require('mongoose'),
    encryption = require('../../utilities/cripto');
//
//var db = mongoose.connect('mongodb://127.0.0.1:28018');
//
////var db = mongoose.connect('mongodb://127.0.0.1:28019');
//
//db.connection.on("error", function (error) {
//    console.log("数据库连接失败：" + error);
//});
//db.connection.on("open", function () {
//    console.log("------数据库连接成功！------");
//});

module.exports.init = function () {
    var stationSchema = new mongoose.Schema({
        station_id: Number,
        signal_type: Number,
        updated_at: Number,
        data: Object
    });

    stationSchema.method({

    });

    var stationStatus = mongoose.model('StationStatus', stationSchema);
};