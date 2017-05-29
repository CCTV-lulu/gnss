angular.module('MetronicApp').controller('BlankController', function ($scope, Mongodb, $location, Prompt, getStationStatus,
                                                                          DateTable, DataAnalyseChart, EventData, $timeout, $interval) {
    var getBatchDataPolling;
    var timeDelay;

    $interval.cancel(getBatchDataPolling);
    $timeout.cancel(timeDelay);
    $(".loading").animate({"width": "0%"}, 0);

    $scope.$on('logout', function (event, url) {
        $interval.cancel(getBatchDataPolling);
        $timeout.cancel(timeDelay);
        $scope.$emit('logout-connect-app','data')
    });

    $scope.$on('goOutBlank', function (event, data) {
        $interval.cancel(getBatchDataPolling);
        $timeout.cancel(timeDelay);
        if (data == 'dashboard') {
            return $location.path("/dashboard.html/" + localStorage.getItem("staId"))
        } else {
            return $location.path(data)
        }
    });

    function showAllBaseStation() {
        Mongodb.getUserStaId(function (data) {
            if (data.allStation[0] != undefined) {
                $scope.allBlankStation = data.allStation;
            }
            else{
                var userSta = []
                userSta.push(data.userStation||"")
                //console.log(userSta)
                $scope.allBlankStation = userSta;
                //console.log($scope.allBaseStation)
            }
        })
    }

    showAllBaseStation()

    $scope.downloadData = function () {
        Mongodb.downloadSatData(function (data) {
            if(data.status == 202){
                return  Prompt.promptBox('warning', '当前基站还没有数据！！')
            }

            location.href = "http://localhost:3000/downloadStaData"
        })
    }

    $scope.findData = function () {
            var startDate = $('#searchDateRange').html();
            var stationId = $('#single').val();
            if (stationId) {
                $("#dataStatisticsChart").css("opacity", 0)
                $('#dataStatisticsChartLoding').show();
                var str = startDate.replace(new RegExp('-', 'gm'), ',')
                    .replace(new RegExp(' ', 'gm'), ',');
                var allDateArray = DateTable.allDate(startDate);
                getStationStatus.getStationStatus(stationId, 1, function (data) {
                    if(data.stationData == false) {
                        $('#dataStatisticsChartLoding').hide();
                        Prompt.promptBox('warning', '当前基站还没有数据！！')
                    }else {
                        var findData = {};
                        findData.allDate = allDateArray;
                        findData.sta_id = data.stationData[0].station_id;
                        findData.bt = str.substring(0, 10);
                        findData.et = str.substring(13, 23);
                        findData.rb = [data.stationData[0].dealWithData.lat, data.stationData[0].dealWithData.lon, data.stationData[0].dealWithData.H];
                        findData.username = localStorage.getItem('userName');
                        Mongodb.findSatData(findData, function (data) {
                            startBatchProcess(data)
                        })
                    }
                });
            } else {
                Prompt.promptBox('warning', '请选择要查询的基站！！')
            }
    }

    function dataType(data) {
        DataAnalyseChart.lineChart(data, 'accuracy', 'Hori', 'accuracy_Hori');
        DataAnalyseChart.lineChart(data, 'accuracy', 'Vert', 'accuracy_Vert');
        DataAnalyseChart.lineChart(data, 'accuracy_95', 'Hori', 'accuracy_95_Hori');
        DataAnalyseChart.lineChart(data, 'accuracy_95', 'Vert', 'accuracy_95_Vert');
    }

    function dateTable() {
        DateTable.dateTable();
    }

    dateTable();

    function startBatchProcess(data) {
        if (data.status == 202) {
            waiting(data)
            return Prompt.promptBox("warning", "有一个数据正在处理！将为你返回正在执行中的时间段分析结果")
        }
        if (data.status == 201) {
            $('#dataStatisticsChartLoding').hide();
            return Prompt.promptBox("warning", "选择的日期间隔中数据为空！")
        }
        waiting(data)
    }

//进度条
    function waiting(data){

        if(!$('.loading').is(":hidden")) return;


        var waitTime = data.waitTime;
        $interval.cancel(getBatchDataPolling);
        $timeout.cancel(timeDelay)

        $(".loading").animate({"width": "0%"}, 0);
        $(".loading").fadeIn();
        $(".loading").animate({"width": "100%"}, 1000*waitTime);
        timeDelay = $timeout(function () {
            getBatchDataPolling = $interval(function () {
                Mongodb.getUserFindStaData(function (data) {
                    console.log('----------------------------')
                    if(data.status == 202) {
                        return;
                    }
                    if(data.status == 201){
                        $(".loading").fadeOut();
                        $interval.cancel(getBatchDataPolling);
                        return Prompt.promptBox("warning", "处理异常请再次请求")
                    }
                    $(".loading").fadeOut();
                    $interval.cancel(getBatchDataPolling);
                    Prompt.promptBox("success", "数据处理完毕")
                    dataType(data.result.data);
                    $('#dataStatisticsChartLoding').hide();
                    $("#dataStatisticsChart").css("opacity", 1)
                    $scope.integritys = EventData.table(data.result.data);
                    if (data.result.data.continuity && data.result.data.availability) {
                        $scope.continuity = data.result.data.continuity;
                        $scope.availability = data.result.data.availability;
                    }
        

                })
            }, 5000)
        }, waitTime * 1000)
    }


});