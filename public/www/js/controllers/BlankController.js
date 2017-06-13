angular.module('MetronicApp').controller('BlankController', function ($scope, Mongodb, $location, Prompt, getStationStatus,
                                                                      DateTable, DataAnalyseChart, EventData, $timeout, $interval, BatchProcess) {
    //var getBatchDataPolling;
    //var timeDelay;
    init()
    function init() {
        $(".loading").animate({"width": "0%"}, 0);
        DateTable.dateTable();
    }


    //$scope.$on('logout', function (event, url) {
    //    $interval.cancel(getBatchDataPolling);
    //    $timeout.cancel(timeDelay);
    //    $scope.$emit('logout-connect-app','data')
    //});
    //
    //$scope.$on('$destroy', function (event) {
    //    if (getBatchDataPolling) {
    //        $interval.cancel(getBatchDataPolling);
    //    }
    //    if (timeDelay) {
    //        $timeout.cancel(timeDelay);
    //    }
    //
    //});



    $scope.findData = function () {
        var startDate = $('#searchDateRange').html();
        var stationId = $('#single').val();
        if (stationId) {
            $("#dataStatisticsChart").css("opacity", 0);
            $('#dataStatisticsChartLoding').show();
            var str = startDate.replace(new RegExp('-', 'gm'), ',')
                .replace(new RegExp(' ', 'gm'), ',');
            var allDateArray = DateTable.allDate(startDate);

            var findData = {};
            findData.allDate = allDateArray;
            findData.sta_id = stationId;
            findData.bt = str.substring(0, 10);
            findData.et = str.substring(13, 23);
            console.log(findData);

            BatchProcess.startBatchProcess(findData, function (data) {
                startBatchProcess(data)
            })


        } else {
            Prompt.promptBox('warning', '请选择要查询的基站！！')
        }
    };





    function startBatchProcess(data) {
        //if (data.status == 201) {
        //    waiting(data);
        //    return Prompt.promptBox("warning", "有一个数据正在处理！将为你返回正在执行中的时间段分析结果")
        //}
        if (data.status == 202) {
            $('#dataStatisticsChartLoding').hide();
            return Prompt.promptBox("warning", "选择的日期间隔中数据为空！")
        }
        waiting(data)
    }

//进度条
    function getWaitTime(data) {

    }

    function waiting(data) {


        var waitTime = 60;
        if (!show_wait(waitTime)) return;
        //$interval.cancel(getBatchDataPolling);
        //$timeout.cancel(timeDelay);

        getResult();


    }

    function show_wait(waitTime) {
        var $loading = $('.loading');
        if (!$loading.is(":hidden")) return false;

        $loading.animate({"width": "0%"}, 0);
        $loading.show();
        $loading.animate({"width": "100%"}, 1000 * waitTime);
        return true;
    }

    function getResult() {
        if($location.path() != '/blank') return;
        BatchProcess.getBatchProcessResult(function (data) {
            if (data.status == 400) {
                return batchProcessErr()
            }
            if (data.result.isRunning === 1) {
                return getResult();
            }
            if (data.result.isRunning === -1) {
                return batchProcessErr();
            }
            //$interval.cancel(getBatchDataPolling);

            $.getJSON('/json/' + data.result.userName + '.json', function (data) {

                showProcessResult(data)
            });

        })
    }

    function batchProcessErr() {
        $(".loading").hide();
        //$interval.cancel(getBatchDataPolling);
        Prompt.promptBox("warning", "处理异常请再次请求")
    }

    function showProcessResult(data) {
        $('.loading').hide();
        Prompt.promptBox("success", "数据处理完毕");
        showErrHist('ErrHist', data);
        showHdop('Hdop', data);
        showVPL('VPL', data);
        showStaNum('StaNum', data);
         showAvailability('content',data);
        $('#dataStatisticsChartLoding').hide();
        $("#dataStatisticsChart").css("opacity", 1);
        //$scope.integritys = EventData.table(data.result.data);
        //if (data.result.data.continuity && data.result.data.availability) {
        //    $scope.continuity = data.result.data.continuity;
        //    $scope.availability = data.result.data.availability;
        //}

    }


    function showErrHist(type, data) {

        $('#' + type + '_loading').hide();
        $('#' + type + '_content').show();
        var names = ['GPSErrHist', 'GLSErrHist', 'BDSErrHist', 'GroupErrHist'];

        var series = [];
        Object.keys(data).forEach(function (key) {
            var info = {name: names[Number(key)], data: []};
            if(!data[key].sat_hist) return;
            data[key].sat_hist.X.forEach(function (x, index) {
                info.data.push([x, data[key].herr_hist.Y[index]])
            });
            if(info.data.length > 0){
                series.push(info)
            }
        });
        if(series.length == 0) return ;
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
            //xAxis: {
            //    categories: xAxis
            //},
            series: series
        })
    }


    function showAvailability(type, result) {
        var newResult = {};

        Object.keys(result).forEach(function (key) {
            var value = result[key];
            newResult[key] = {};
            newResult[key].availability = value.availability;
            newResult[key].continuity = value.continuity;
            newResult[key].acc95_h = value.acc95_h;
            newResult[key].acc95_v = value.acc95_v;
            newResult[key].integrity = value.integrity
        });
        $('#' + type + '_loading').hide();
        $('#' + type + '_content').show();
        $scope.processResult =  newResult;

    }

    function showHdop(type, data) {

        $('#' + type + '_loading').hide();
        $('#' + type + '_content').show();
        var names = ['GPSHdop', 'GLSHdop', 'BDSHdop', 'GroupHdop'];

        var series = [];
        Object.keys(data).forEach(function (key) {
            var info = {name: names[Number(key)], data: []};
            if(!data[key].hdop_hist) return;
            data[key].hdop_hist.X.forEach(function (x, index) {
                info.data.push([x, data[key].hdop_hist.Y[index]])
            });
            if(info.data.length > 0){
                series.push(info)
            }

        });
        if(series.length == 0) return ;
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
            //xAxis: {
            //    categories: xAxis
            //},
            series: series
        })
    }


    function showVPL(type, data) {

        $('#' + type + '_loading').hide();
        $('#' + type + '_content').show();
        var names = ['GPSVpl', 'GLSVpl', 'BDSVpl', 'GroupVpl'];

        var series = []
        Object.keys(data).forEach(function (key) {
            var info = {name: names[Number(key)], data: []};
            if(!data[key].hpl_hist) return;
            data[key].hpl_hist.X.forEach(function (x, index) {
                info.data.push([x, data[key].hpl_hist.Y[index]])
            });
            if(info.data.length > 0){
                series.push(info)
            }
        });
        if(series.length == 0) return ;

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
            //xAxis: {
            //    categories: xAxis
            //},
            series: series
        })
    }

    function showStaNum(type, data) {
        //var showData = data[type];
        var names = ['GPSStaNum', 'GLSStaNum', 'BDSStaNum', 'GroupStaNum'];

        var series = [];
        Object.keys(data).forEach(function (key) {
            var info = {name: names[Number(key)], data: []};
            if(!data[key].sat_hist) return;
            data[key].sat_hist.X.forEach(function (x, index) {
                info.data.push([x, data[key].sat_hist.Y[index]])
            });
            if(info.data.length > 0){
                series.push(info)
            }
        });
        if(series.length == 0) return ;
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
            plotOptions: {
                series: {
                    animation: false
                }
            },
            xAxis: {
                type: 'category',
                tickWidth: 1

            },
            yAxis: {
                min: 0,
                max: 1,
                title: {
                    text: ''
                }
            },
            legend: {
                enabled: true
            },
            //图例开关,默认是：true
            series: series

        });
    }


});