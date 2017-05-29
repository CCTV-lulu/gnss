var mongoose = require('mongoose'),
    encryption = require('../../utilities/cripto');

module.exports.init = function () {
    var stationSchema = new mongoose.Schema({
        userName: String,//首页用户名字
        staId: String,
        staName: String,
        signalType: String,//第二页面型号类型
        signalTypeId:String,
        startBaseStation:String,//第二页面基站名字
        startStaId:String
    });

    stationSchema.method({

    });

    var UserStationId = mongoose.model('UserStationId', stationSchema);
};