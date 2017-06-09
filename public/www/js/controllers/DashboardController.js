angular.module('MetronicApp').controller('dashboardController', function ($rootScope,$interval, $scope, $stateParams, settingInfo, $location, getCommitThreshold,
                                                                          getStationStatus, Mongodb, DataArray, StarMapChart, StarChart, StarData, Initialise,userStationInfo,$state) {

    var stationId = $rootScope.stationId;
    var listenRootCurrentStationStatus = false;
    var dataId = [];
    var chartWidth = $('#chartBox').css('width');


    $scope.seriesList = {};
    init(stationId);


    var listenStationId = $rootScope.$watch('stationId',function(newStationId){

        if (!newStationId||stationId == newStationId) return;
        stationId = newStationId;
        if(listenRootCurrentStationStatus){
            listenRootCurrentStationStatus()
        }

        init(newStationId)
    });


    $scope.$on('$destroy', function (event) {
        if(listenRootCurrentStationStatus){
            listenRootCurrentStationStatus()
        }
        listenRootCurrentStationStatus = true;
        if(listenStationId){
            listenStationId()
        }
    });


    function init(newStationId){
        if(newStationId !=undefined ){
            $('.table-responsive tbody').hide();
            $('.portlet-body>div:last-child').hide();
            $('.portlet-body>div:first-child').show();
            getStationInfo(newStationId, 10);
        }
    }







    function getStationInfo(staId, limit) {

        try {
            loadStationStatus(staId, limit,function(){
                if(listenRootCurrentStationStatus !== true){
                    getStationInfo(staId, limit)
                }

            })
        } catch (err) {

        }
    }

    function loadStationStatus(staId, limit, cb) {

        getStationStatus.getStationStatus(staId, limit, function (data) {
            if (limit == 10 && data.stationData != false) {
                if (data.stationData.length < 300) {
                    return cb()
                }

                for (var i = 0; i < (data.stationData.length); i++) {
                    if (dataId.indexOf(data.stationData[i].dataId) == -1) {
                        if (i == (data.stationData.length - 1)) {
                            showChart(data.stationData[i]);
                            showDxDy(data.stationData, 'gpsDxDy');
                            showDxDy(data.stationData, 'glsDxDy');
                            showDxDy(data.stationData, 'dbsDxDy');
                            showDxDy(data.stationData, 'groupDxDy');
                            showH(data.stationData, 'H');
                            //
                            settingSys(data.stationData[i]);
                            StarMapChart.starMap((data.stationData[i]).satpos);
                            //dataArray.cooacc = data.stationData[i].cooacc//给前端
                            //

                            startOneStaStatus();
                            $('.table-responsive tbody').show();

                            //showSatelliteNum(data.stationData[i].satnum)
                        }

                    }
                }
                //实时一条一条动态加载
            }
        })
    }
    function updateDxDy(staInfo){

        if (staInfo.posR[0]&&getDxDy(staInfo.posR[0])) {
            $scope.seriesList.gpsDxDy.addPoint(getDxDy(staInfo.posR[0]), true, true);

        }
        if (staInfo.posR[1]&&getDxDy(staInfo.posR[1])){
            $scope.seriesList.glsDxDy.addPoint(getDxDy(staInfo.posR[1]), true, true);

        }
        if (staInfo.posR[2]&&getDxDy(staInfo.posR[2])) {
            $scope.seriesList.dbsDxDy.addPoint(getDxDy(staInfo.posR[2]), true, true);

        }
        if (staInfo.posR[3]&&getDxDy(staInfo.posR[3])) {
            $scope.seriesList.groupDxDy.addPoint(getDxDy(staInfo.posR[3]), true, true);
        }
    }

    function updateH(staInfo) {


        if (staInfo.posR[0]) {
            $scope.seriesList.gpsDH.addPoint([staInfo.posR[0].H], true, true);

        }
        if (staInfo.posR[1]) {
            $scope.seriesList.glsDH.addPoint([staInfo.posR[1].H], true, true);

        }
        if (staInfo.posR[2]) {
            $scope.seriesList.dbsDH.addPoint([ staInfo.posR[2].H], true, true);

        }
        if (staInfo.posR[3]) {
            $scope.seriesList.groupDH.addPoint([staInfo.posR[3].H], true, true);
        }

    }

    function settingSys(dataInfo) {
        $scope.utcTime = dataInfo.timestamp
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
            $scope.latestData.push(StarData.getSatelliteNumber('satnum', chartData.timestamp, chartData.satnum, dataArray, Threshold.staNumThresholdMax, Threshold.staNumThresholdMin, "卫星数量"));
            $scope.latestData.push(StarData.getSatelliteNumber('DopValue', chartData.timestamp, chartData.dopinfo, dataArray, Threshold.pdopThresholdMax, Threshold.pdopThresholdMin, "DOP值"));
            $scope.latestData.push(StarData.getSatelliteNumber('absoluteError', chartData.timestamp, chartData.abserror, dataArray, Threshold.absoluteThresholdMax, Threshold.absoluteThresholdMin, "绝对误差"));
            $scope.latestData.push(StarData.getSatelliteNumber('chartPositionPrecision', chartData.timestamp, chartData.accinfo, dataArray, Threshold.posaccThresholdMax, Threshold.posaccThresholdMin, "定位精度"));
            $scope.latestData.push(StarData.getSatelliteNumber('protectionLevel', chartData.timestamp, chartData.plinfo, dataArray, Threshold.protectionLevelThresholdMax, Threshold.protectionLevelThresholdMin, "保护水平"));
            StarChart.addPoint($scope.latestData, $scope.seriesList);
        });
    }

    function showChart(chartData) {
        showSNR(chartData.SNY, 'gpsSNY');
        showSNR(chartData.SNY, 'glsSNY');
        showSNR(chartData.SNY, 'bdsSNY')
    }
    function updateChart(chartData){
        updateSNR(chartData.SNY, 'gpsSNY');
        updateSNR(chartData.SNY, 'glsSNY');
        updateSNR(chartData.SNY, 'bdsSNY')
    }

    function startOneStaStatus(data) {
        if(listenRootCurrentStationStatus === true) return;
        listenRootCurrentStationStatus =  $rootScope.$watch('RootCurrentStationStatus', function(data){

            if(!data) return;
            data.stationData.forEach(function (chartData) {

                StarMapChart.starMap(chartData.satpos);
                settingSys(chartData);
                updateH(chartData);
                //updateDxDy(chartData)
                updateChart(chartData);
            })
        })

    }


    function showSNR(data, type) {
        var showData = data[type];
        $('#' + type + '_loading').hide();
        $('#' + type + '_content').show();
        $('#' + type).highcharts({
            chart: {
                type: 'column',
                events: {
                    load: function () {
                        //// set up the updating of the chart each second
                        $scope.seriesList[type] = this.series;



                    }
                }
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

            plotOptions: {
                series: {
                    animation: false
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
                data: showData[0].slice(0,15)
            },
                {
                    name: '2频点',
                    color: '#00FF00',
                    data: showData[1].slice(0,15)
                }]
        });
    }

    function updateSNR(staInfo,type){
            var showData = staInfo[type];
            $scope.seriesList[type][0].setData(showData[0].slice(0,15))
            $scope.seriesList[type][1].setData(showData[1].slice(0,15))


    }

    function getDxDy(info){
        var x = Math.abs(info.dX);
        var y = Math.abs(info.dY);
        var z = Math.sqrt(x * x + y * y);

        var rotat = Math.round((Math.asin(x / z) / Math.PI * 180));

        if (x > 0 && y < 0) {
            rotat += 90
        }
        if (x < 0 && y < 0) {
            rotat = 180 - rotat
        }
        if (x < 0 && y > 0) {
            rotat = 360 - rotat
        }
        var length = 5 * z;
        if(length>100){
            return false
        }
        return [isNaN(rotat) ? 0 : rotat, length]
    }


    function showDxDy(data, type) {

        var types = {
            'gpsDxDy': 0,
            'glsDxDy': 1,
            'dbsDxDy': 2,
            'groupDxDy': 3
        };
        var show_date = [];
        for (var i = 0; i < data.length; i++) {
            if (data[i].posR[types[type]]) {
                var info = data[i].posR[types[type]];
                if(getDxDy(info)){
                    show_date.push(getDxDy(info))
                }

            }
        }

        $('#' + type + '_loading').hide();
        $('#' + type + '_content').show();
        $('#' + type).highcharts({
            exporting: {
                enabled: false
            },
            chart: {
                polar: true,
                events: {
                    load: function () {
                        //// set up the updating of the chart each second
                        var series = this.series[0],
                            chart = this;
                        this.series.forEach(function (serie) {
                            $scope.seriesList[serie.name] = serie;
                        });


                    }
                }
            },
            title: {
                text: ''
            },
            tooltip:{
                enabled: false
            },


            pane: {
                startAngle: 0,
                endAngle: 360
            },
            xAxis: {
                tickInterval: 90,
                min: 0,
                max: 360,
                labels: {
                    formatter: function () {
                        var txt = "";

                        if(this.value == 0 ){
                            txt = 'N'
                        }
                        if(this.value == 90 ){
                            txt = 'E(20m)'
                        }
                        if(this.value == 180 ){
                            txt = 'S'
                        }
                        if(this.value == 270){
                            txt = 'W'
                        }
                        return txt
                    }
                }
            },
            yAxis: {
                tickInterval: 22.5,
                min: 0,
                max: 90,
                reversed: false,
                labels: {
                    formatter: function () {

                        return ''
                    }
                }

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
                name: type,
                type: 'scatter',
                data: show_date
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

        allSta.forEach(function (sta,index) {

            xAxis.push(index);
            for (var i in sta.posR) {
                push_data(sta.posR[i], staArrs[i])
            }
        });

        function activeLastPointToolip(chart) {
            var points = chart.series[0].points;
            chart.tooltip.refresh(points[points.length - 1]);
        }


        $('#' + type + '_loading').hide();
        $('#' + type + '_content').show();
        Highcharts.setOptions({
            lang: {
                resetZoom: '重置',
                resetZoomTitle: '重置缩放比例'
            },
            global: {
                useUTC: false
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
                        var series = this.series[0],
                            chart = this;
                        this.series.forEach(function (serie) {
                            $scope.seriesList[serie.name] = serie;
                            $scope.seriesList['H'] = chart
                        });


                    }
                }
            },
            plotOptions: {
                series: {
                    animation: false
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
