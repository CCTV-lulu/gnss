angular.module('MetronicApp').controller('dashboardController', function ($interval, $scope, $stateParams, settingInfo, $location, getCommitThreshold,
                                                                          getStationStatus, Mongodb, DataArray, StarMapChart, StarChart, StarData, Initialise) {
    var timeArray = []
    var dataId = [];
    var chartWidth = $('#chartBox').css('width')
    var xAxisTickPixelInterval = Math.round((Number(chartWidth.substring(0, 3)) - 200) / 10);
    var dashboardPolling;
    var initPolling;
    var stationDataStatus = true;
    //var dataArray = {
    //    "bdsatnum": [],
    //    "glsatnum": [],
    //    "gpsatnum": [],
    //    "hor": [],
    //    "ver": [],
    //    "hacc": [],
    //    "vacc": [],
    //    "hdop": [],
    //    "vdop": [],
    //    "pdop": [],
    //    "hpl": [],
    //    "vpl": [],
    //    "alt": [],
    //    "lat": [],
    //    "lon": [],
    //    "rura": [],
    //    "type": [],
    //    "udre": [],
    //    "utc": []
    //};
    $scope.seriesList = {};


    var stationId;
    $scope.$on('allStation-to-dash', function (event, data) {
        var arr = []
        for (var i = 0; i < data.allStation.length; i++) {
            arr.push(JSON.stringify(data.allStation[i].staId))
        }
        if (arr.indexOf(localStorage.getItem('staId')) == -1) {
            stationId = data.allStation[0].staId;
        } else {
            stationId = localStorage.getItem('staId');
        }
        init_station_info()
    })
    $scope.$emit('to_allBaseStation', 'data');

    $scope.$emit('to_appController', 'data');

    $scope.$emit('to-app-basestation', 'data');

    $interval.cancel(dashboardPolling)
    $interval.cancel(initPolling)

    $scope.$on('$destroy', function (event) {
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
        $scope.$emit('logout-connect-app', 'data')
    });

    $scope.$on('frequencyUpdate', function (event, frequency) {
        $interval.cancel(dashboardPolling);
        dashboardPolling = $interval(function () {
            getStationInfo(stationId, 1)
        }, frequency * 1000)
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

    function showSatelliteLon() {

    }

    function init() {
        showTime()
        $interval(showTime, 1000)
    }

    init()

    function init_station_info() {
        initPolling = $interval(function () {
            getStationInfo(stationId, 10);
        }, 1000)
    }

    function getStationInfo(staId, limit) {
        if (stationDataStatus == false) return;
        try {
            loadStationStatus(staId, limit)
        } catch (err) {
            stationDataStatus = true;
        }
    }

//MongoDB中读取指定数量的数据记录,大小为读取的记录条数
    function loadStationStatus(staId, limit) {
        stationDataStatus = false;
        getStationStatus.getStationStatus(staId, limit, function (data) {
            //console.log(data)
            stationDataStatus = true;
            if (data.StationSocketStatus == true) {
                $scope.$emit('socketStatus_to_app', '实时数据接收中');
            } else {
                $scope.$emit('socketStatus_to_app', '实时数据未连接');
            }
            //10条是以前的

            if (limit == 10 && data.stationData != false) {
                if (data.stationData.length < 10) {
                    return
                }
                $interval.cancel(initPolling);

                for (var i = 0; i < (data.stationData.length); i++) {
                    if (dataId.indexOf(data.stationData[i].dataId) == -1) {
                        if (i == (data.stationData.length - 1)) {
                            console.log((data.stationData[i]).satpos)


                            showChart(data.stationData[i]);
                            showDH(data.stationData, 'gpsDH');
                            showDH(data.stationData, 'glsDH');
                            showDH(data.stationData, 'dbsDH');
                            showH(data.stationData, 'H');
                            startOneStaStatus();
                            settingSys(data.stationData[i]);
                            //dataArray.cooacc = data.stationData[i].cooacc//给前端
                            //
                            //showSatelliteNum(data.stationData[i].satnum)
                        } else {
                            //DataArray.arrange(dataId, data.stationData[i].dataId)
                            //handleData(data.stationData[i])
                        }
                        console.log(data.stationData[i].satpos.gpsatpos[0].y)
                        
                        if(data.stationData[i].satpos.gpsatpos[0].y != NaN){
                            StarMapChart.starMap((data.stationData[i]).satpos);
                        }


                    }
                }
                //实时一条一条动态加载
            } else if (limit == 1 && data.stationData != false) {
                data.stationData.forEach(function (chartData) {
                    //if (dataId.indexOf(chartData.dataId) == -1) {
                    //    //settingSys(data.stationData[i].dataInfo)
                    //    DataArray.arrange(dataId, chartData.dataId);
                    StarMapChart.starMap((chartData.satpos));
                    showChart(chartData);
                    settingSys(chartData);
                    //updateH(chartData)
                    //    dataArray.cooacc = chartData.cooacc;//给前端
                    //    updataChart(chartData);
                    //    showSatelliteNum(chartData.satnum)
                    //
                    //}
                })
            }
        })
    }

    function updateH(staInfo){
        console.log(staInfo)
        staInfo.time =
        $scope.seriesList.glsDH.addPoint([staInfo.time, staInfo.posR[1].H], true, true);
        $scope.seriesList.gpsDH.addPoint([staInfo.time, staInfo.posR[0].H], true, true);
        $scope.seriesList.dbsDH.addPoint([staInfo.time, staInfo.posR[2].H], true, true);
        $scope.seriesList.groupDH.addPoint([staInfo.time, staInfo.posR[3].H], true, true);
    }

    function settingSys(dataInfo) {

        if (dataInfo.posR[0]) {
            $scope.gpInfo = dataInfo.posR[0]
        }
        if (dataInfo.posR[1]) {
            $scope.glInfo = dataInfo.posR[1]
        }
        if (dataInfo.posR[2]) {
            $scope.bdInfo = dataInfo.posR[2]
        }
        if (dataInfo.posR[3]) {
            $scope.groupInfo = dataInfo.posR[3]
        }

    }

    function updataChart(chartData) {
        $scope.latestData = [];
        getCommitThreshold.threshold(localStorage.getItem('baseStation'), function (data) {
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


        showSNR(chartData.SNY, 'gpsSNY')
        showSNR(chartData.SNY, 'glsSNY')
        showSNR(chartData.SNY, 'bdsSNY')

    }

    function startOneStaStatus(){
        if (localStorage.getItem('Frequency')) {
            var Frequency = localStorage.getItem('Frequency');
        } else {
            var Frequency = 1;
        }
        $interval.cancel(dashboardPolling);
        dashboardPolling = $interval(function () {
            getStationInfo(stationId, 1);
        }, Frequency * 1000)
    }


    function showSNR(data, type) {
        var showData = data[type];
        $('#' + type + '_loading').hide();
        $('#' + type + '_content').show();
        $('#' + type).highcharts({
            chart: {
                type: 'column'
            },
            //线类型
            title: {
                text: ''
            },
            //标题
            subtitle: {
                text: ''
            },
            //副标题
            xAxis: {
                type: 'category',
                //坐标轴类型:分类轴
                labels: {
                    rotation: -45,
                    //倾斜度
                    style: {
                        fontSize: '13px',
                        fontFamily: 'Verdana, sans-serif'
                    }
                }
            },
            yAxis: {
                min: 0,
                title: {
                    text: ''
                }
            },
            legend: {
                enabled: true
            },
            //图例开关,默认是：true
            series: [{
                name: '1频点',
                color: '#0011FF',
                data: showData[0]
            },
                {
                    name: '2频点',
                    color: '#00FF00',
                    data: showData[1]
                }]
        });
    }


    function showDH(data, type) {

        var types = {
            'gpsDH': 0,
            'glsDH': 1,
            'dbsDH': 2,
            'groupDH': 3
        };
        var show_date = [];
        for (var i = 0; i < data.length; i++) {
            if (data[i].posR[types[type]]) {
                show_date.push(data[i].posR[types[type].dV, data[i].posR[types[type]].dH])
            }
        }


        $('#' + type + '_loading').hide();
        $('#' + type + '_content').show();
        $('#' + type).highcharts({
            exporting: {
                enabled: false
            },
            chart: {
                polar: true
            },
            title: {
                text: ''
            },
            pane: {
                startAngle: 0,
                endAngle: 360
            },
            xAxis: {
                tickInterval: 30,
                min: 0,
                max: 360,
                labels: {
                    formatter: function () {
                        return this.value
                    }
                }
            },
            yAxis: {
                tickInterval: 10,
                min: 0,
                max: 90,
                reversed: true
            },
            plotOptions: {
                series: {
                    marker: {
                        radius: 2,
                        symbol: "circle"
                    },
                    animation: false,
                    lineWidth: 1,
                    pointStart: 0,
                    pointInterval: 45

                },
                column: {
                    pointPadding: 0,
                    groupPadding: 0
                }
            },
            series: [{
                name: "北斗",
                type: 'scatter',
                data: [[-10, 190], [10, 190], [50, 30], [90, 90]]
            }]
        });
    }


    function showH(allSta, type) {
        var types = {
            'gpsDH': 0,
            'glsDH': 1,
            'dbsDH': 2,
            'groupDH': 3
        };
        var xAxis = [], gpsY = [], dbsY = [], groupY = [], glsY = [];
        var staArrs = [gpsY, glsY, dbsY, groupY];

        function push_data(data, staArr) {
            if (data) {
                staArr.push(data.H)
            }
            else {
                if (staArr.length == 0) {
                    staArr.push(0)
                }
                else {
                    staArr.push(staArr[staArr.length - 1])
                }
            }
        }

        allSta.forEach(function (sta) {

            xAxis.push(sta.time);
            for (var i in sta.posR) {
                push_data(sta.posR[i], staArrs[i])
            }
        });

        function activeLastPointToolip(chart) {
            var points = chart.series[0].points;
            chart.tooltip.refresh(points[points.length -1]);
        }


        $('#' + type + '_loading').hide();
        $('#' + type + '_content').show();
        Highcharts.setOptions({
            lang: {
                resetZoom: '重置',
                resetZoomTitle: '重置缩放比例'
            }
        });
        $('#' + type).highcharts({

            exporting: {
                enabled: false
            },
            chart: {
                type: 'line',
                zoomType: 'x',
                panning: true,
                panKey: 'shift',
                selectionMarkerFill: 'rgba(0,0,0, 0.2)',
                resetZoomButton: {
                    position: {
                        align: 'right',
                        verticalAlign: 'top',
                        x: 0,
                        y: -30
                    },
                    theme: {
                        fill: 'white',
                        stroke: 'silver',
                        r: 0,
                        states: {
                            hover: {
                                fill: '#41739D',
                                style: {
                                    color: 'white'
                                }
                            }
                        }
                    }
                },
                events: {
                    load: function () {
                        //// set up the updating of the chart each second
                        //var series = this.series[0],
                        //
                        //    chart = this;
                        //this.series.forEach(function(serie){
                        //    $scope.seriesList[serie.name] = serie
                        //});
                        //setInterval(function () {
                        //    var x = (new Date()).getTime(), // current time
                        //        y = Math.random();
                        //    series.addPoint([x, y], true, true);
                        //
                        //    //activeLastPointToolip(chart)
                        //}, 1000);
                    }
                }
            },
            subtitle: {
                text: '双击选中区域放大图标，按住shift点击拖动'
            },
            xAxis: {
                categories: xAxis
            },
            series: [{
                name: 'gpsDH',
                data: gpsY
            }
                , {
                    name: 'glsDH',
                    data: glsY
                }, {
                    name: 'dbsDH',
                    data: dbsY
                }, {
                    name: 'groupDH',
                    data: groupY
                }
            ]
        })
    }


})
;
