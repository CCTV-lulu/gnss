angular.module('MetronicApp').controller('dashboardController', function ($interval, $scope, $stateParams, settingInfo, $location, getCommitThreshold,
                                                                          getStationStatus, Mongodb, DataArray, StarMapChart, StarChart, StarData, Initialise) {
    var timeArray = []
    var dataId = [];
    var chartWidth = $('#chartBox').css('width')
    var xAxisTickPixelInterval = Math.round((Number(chartWidth.substring(0,3))-200)/10);
    var dashboardPolling;
    var initPolling;
    var stationDataStatus = true;
    var dataArray = {
        "bdsatnum": [],
        "glsatnum": [],
        "gpsatnum": [],
        "hor": [],
        "ver": [],
        "hacc": [],
        "vacc": [],
        "hdop": [],
        "vdop": [],
        "pdop": [],
        "hpl": [],
        "vpl": [],
        "alt": [],
        "lat": [],
        "lon": [],
        "rura": [],
        "type": [],
        "udre": [],
        "utc": []
    };
    $scope.seriesList = {};


    var stationId;
    $scope.$on('allStation-to-dash', function(event, data) {
        var arr=[]
        for(var i = 0;i<data.allStation.length;i++) {
            arr.push(JSON.stringify(data.allStation[i].staId))
        }
        if(arr.indexOf(localStorage.getItem('staId')) == -1) {
            stationId = data.allStation[0].staId;
        }else {
            stationId = localStorage.getItem('staId');
        }
        init_station_info()
    })
    $scope.$emit('to_allBaseStation', 'data');

    $scope.$emit('to_appController', 'data');

    $scope.$emit('to-app-basestation', 'data');

    $interval.cancel(dashboardPolling)
    $interval.cancel(initPolling)

    $scope.$on('$destroy', function(event) {
        $interval.cancel(dashboardPolling);
        $interval.cancel(initPolling);
    })

    $scope.$on('endDashRepeat', function (event, staId) {
        $interval.cancel(dashboardPolling);//cancel取消方法的调用
        $interval.cancel(initPolling)
        var signalId = localStorage.getItem('signalTypeId');
        var signalType = localStorage.getItem('signalType');
        var stationId = localStorage.getItem("startStaId");
        var startBaseStation = localStorage.getItem('startBaseStation');
        Mongodb.setUserStaId(staId, localStorage.getItem("userName"), localStorage.getItem('baseStation'),
            signalType, signalId, startBaseStation, stationId)
    })
    $scope.$on('data_disconnect', function (event, url) {
        $location.path(url)
    })
    $scope.$on('logout', function (event, url) {
        $interval.cancel(dashboardPolling);
        $interval.cancel(initPolling)
        $scope.$emit('logout-connect-app','data')
    });

    $scope.$on('frequencyUpdate', function (event, frequency) {
        $interval.cancel(dashboardPolling);
        dashboardPolling = $interval(function () {
            getStationInfo(stationId, 1)
        }, frequency * 1000 )
    });

    function showTime() {
        var date = new Date();
        var now = "";
        if (date.getHours() < 10) now = "0"
        now = now + date.getHours() + ":";
        if (date.getMinutes() < 10) now = now + "0";
        now = now + date.getMinutes() + ":";
        if (date.getSeconds() < 10) now = now + "0";
        $scope.nowTime = now + date.getSeconds()
        return now + date.getSeconds();
    }

    function showSatelliteNum(data) {
        $scope.satelliteData = {
            "bdsSatellite": data.bdsatnum,
            "gpsSatellite": data.gpsatnum,
            "glsSatellite": data.glsatnum
        }
    }
    function showSatelliteLon(){

    }
    function init() {
        showTime()
        $interval(showTime, 1000)
    }
    init()

    function init_station_info(){
        initPolling = $interval(function () {
            getStationInfo(stationId, 10);
        },1000)
    }

    function getStationInfo(staId, limit){
        if(stationDataStatus == false) return;
        try {
            loadStationStatus(staId, limit)
        } catch(err) {
            stationDataStatus = true;
        }
    }
//MongoDB中读取指定数量的数据记录,大小为读取的记录条数
    function loadStationStatus(staId, limit) {
        stationDataStatus = false;
        getStationStatus.getStationStatus(staId, limit, function (data) {
            //console.log(data)
            stationDataStatus = true;
            if(data.StationSocketStatus == true) {
                $scope.$emit('socketStatus_to_app', '实时数据接收中');
            }else {
                $scope.$emit('socketStatus_to_app', '实时数据未连接');
            }
            //10条是以前的
            if (limit == 10 && data.stationData != false) {
                if (data.stationData.length < 10) {
                    return
                }
                //console.log(data)
                $interval.cancel(initPolling);
                //够10条后一条一条拉

                //console.log(data)

                for (var i = 0; i < (data.stationData.length); i++) {
                    if (dataId.indexOf(data.stationData[i].dataId) == -1) {
                        if (i == (data.stationData.length-1)) {
                            StarMapChart.starMap(StarMapChart.starMapData(data.stationData[i].satpos))
                            //console.log(data.stationData[i].satpos.bdsatpos北斗)


                            $scope.conacc_bd_jd = data.stationData[i].satpos.bdsatpos[0].az.toFixed(6);
                            //console.log( data.stationData[i])
                            $scope.conacc_bd_wd = data.stationData[i].satpos.bdsatpos[0].el.toFixed(6);
                            $scope.conacc_GPS_jd = data.stationData[i].satpos.gpsatpos[0].az;
                            $scope.conacc_GPS_wd = data.stationData[i].satpos.gpsatpos[0].el;
                            $scope.conacc_GLO_jd = data.stationData[i].satpos.glsatpos[0].az;
                            $scope.conacc_GLO_wd = data.stationData[i].satpos.glsatpos[0].el;

                            //$scope.conacc_GPS_jd = data.stationData[0].satpos.bdsatpos[0].az;
                            showChart(data.stationData[i],function(){})
                            dataArray.cooacc = data.stationData[i].cooacc//给前端

                            showSatelliteNum(data.stationData[i].satnum)
                        } else {
                            DataArray.arrange(dataId, data.stationData[i].dataId)
                            handleData(data.stationData[i])
                        }
                        settingSys(data.stationData[i].dataInfo)
                    }
                }
                //实时一条一条动态加载
            } else if(limit == 1 && data.stationData != false) {
                data.stationData.forEach(function (chartData) {
                    if (dataId.indexOf(chartData.dataId) == -1) {
                        //settingSys(data.stationData[i].dataInfo)
                        DataArray.arrange(dataId, chartData.dataId);
                        StarMapChart.starMap(StarMapChart.starMapData(chartData.satpos))
                        dataArray.cooacc = chartData.cooacc;//给前端
                        updataChart(chartData);
                        showSatelliteNum(chartData.satnum)

                    }
                })
            }
        })
    }

    function settingSys(dataInfo){
        if(dataInfo.type==0){
            $scope.gpInfo = dataInfo
        }else if(dataInfo.type==1){
            $scope.glInfo = dataInfo

        }else if(dataInfo.type ==2){
            $scope.bdInfo = dataInfo
        }else{
            $scope.groupInfo = dataInfo
        }

    }

    function updataChart(chartData) {
        $scope.latestData = [];
        getCommitThreshold.threshold(localStorage.getItem('baseStation') ,function (data) {
            var Threshold = data.staThreshold;
            $scope.cooacc = chartData.cooacc;
            //console.log(chartData.cooacc)
            $scope.latestData.push(StarData.getSatelliteNumber('satnum', chartData.timestamp, chartData.satnum, dataArray, Threshold.staNumThresholdMax, Threshold.staNumThresholdMin, "卫星数量"));
            $scope.latestData.push(StarData.getSatelliteNumber('DopValue', chartData.timestamp, chartData.dopinfo, dataArray, Threshold.pdopThresholdMax, Threshold.pdopThresholdMin, "DOP值"));
            $scope.latestData.push(StarData.getSatelliteNumber('absoluteError', chartData.timestamp, chartData.abserror, dataArray, Threshold.absoluteThresholdMax, Threshold.absoluteThresholdMin, "绝对误差"));
            $scope.latestData.push(StarData.getSatelliteNumber('chartPositionPrecision', chartData.timestamp, chartData.accinfo, dataArray, Threshold.posaccThresholdMax, Threshold.posaccThresholdMin, "定位精度"));
            $scope.latestData.push(StarData.getSatelliteNumber('protectionLevel', chartData.timestamp, chartData.plinfo, dataArray, Threshold.protectionLevelThresholdMax, Threshold.protectionLevelThresholdMin, "保护水平"));
            StarChart.addPoint($scope.latestData, $scope.seriesList);
        });
    }

    function showChart(chartData) {
        getCommitThreshold.threshold(localStorage.getItem('baseStation'),function (data) {
            //getCommitThreshold.threshold获取阈值超值弹框
            var Threshold = data.staThreshold;
            timeArray = DataArray.arrange(timeArray, chartData.timestamp)

            $scope.cooacc = chartData.cooacc;
            //console.log($scope.cooacc)
            Initialise.dataConnect('satnum', Threshold.staNumThresholdMax, Threshold.staNumThresholdMin, "卫星数量", timeArray, chartData.satnum, dataArray, $scope.seriesList, xAxisTickPixelInterval)
            Initialise.dataConnect('DopValue', Threshold.pdopThresholdMax, Threshold.pdopThresholdMin, 'DOP值', timeArray, chartData.dopinfo, dataArray, $scope.seriesList, xAxisTickPixelInterval);
            Initialise.dataConnect('absoluteError', Threshold.absoluteThresholdMax, Threshold.absoluteThresholdMin, '绝对误差', timeArray, chartData.abserror, dataArray, $scope.seriesList, xAxisTickPixelInterval);
            Initialise.dataConnect('chartPositionPrecision', Threshold.posaccThresholdMax, Threshold.posaccThresholdMin, '定位精度', timeArray, chartData.accinfo, dataArray, $scope.seriesList, xAxisTickPixelInterval);
            Initialise.dataConnect('protectionLevel', Threshold.protectionLevelThresholdMax, Threshold.protectionLevelThresholdMin, '保护水平', timeArray, chartData.plinfo, dataArray, $scope.seriesList, xAxisTickPixelInterval);
            if(localStorage.getItem('Frequency')) {
                var Frequency = localStorage.getItem('Frequency');
            }else {
                var Frequency = 1;
            }
            $interval.cancel(dashboardPolling);
            dashboardPolling = $interval(function () {
                getStationInfo(stationId, 1);
            }, Frequency * 1000)//频率
        });
    }


    function handleData(chartData) {
        //console.log(chartData.abserror.hor)
        DataArray.arrange(timeArray, chartData.timestamp)
        DataArray.arrange(dataArray.bdsatnum, chartData.satnum.bdsatnum)
        DataArray.arrange(dataArray.glsatnum, chartData.satnum.glsatnum)
        DataArray.arrange(dataArray.gpsatnum, chartData.satnum.gpsatnum)
        DataArray.arrange(dataArray.hdop, chartData.dopinfo.hdop)
        DataArray.arrange(dataArray.vdop, chartData.dopinfo.vdop)
        DataArray.arrange(dataArray.pdop, chartData.dopinfo.pdop)
        DataArray.arrange(dataArray.hor, chartData.abserror.hor)
        DataArray.arrange(dataArray.ver, chartData.abserror.ver)
        DataArray.arrange(dataArray.hacc, chartData.accinfo.hacc)
        DataArray.arrange(dataArray.vacc, chartData.accinfo.vacc)
        DataArray.arrange(dataArray.hpl, chartData.plinfo.hpl)
        DataArray.arrange(dataArray.vpl, chartData.plinfo.vpl)
    }

})
;
