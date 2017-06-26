angular.module('MetronicApp').controller('BlankController', function ($http,$rootScope,$scope, Mongodb, $location, Prompt, getStationStatus,
                                                                      DateTable, DataAnalyseChart, EventData, $timeout, $interval, BatchProcess) {
    //var getBatchDataPolling;
    //var timeDelay;
    init();


    function init() {
        $(".loading").animate({"width": "0%"}, 0);
        DateTable.dateTable();
        $scope.sysNav = ['GPS', 'GLS', 'BDS', '组合'];
        $scope.filter = {
            sys: [true, true, true, true],
            option: {
                sat_hist: true,
                err_hist: true,
                dop_hist: true,
                PL_hist: true,
                hpl_num: false,
                vpl_num: false
            }
        };
        $scope.test = '1212';
        $scope.processResult = {};
            initResult()
    }


    function getFilter() {
        var sys = [];
        var options = {}
        $('input[name=sys]').each(function () {
            if (this.checked) {
                sys.push(Number(this.value))
            }
        });
        $('#options input').each(function () {
            if (this.checked) {
                options[this.name] = 1;
            }
        });
        return {
            sys: sys,
            options: options
        }

    }


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
            var filer = getFilter();
            findData.sys = filer.sys;
            findData.options = filer.options

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

    function waiting(data) {
        var waitTime = parseInt(data.effectiveTime)
        if (!show_wait(waitTime)) return;
        getResult();

    }

    function show_wait(waitTime) {
        var $loading = $('.loading');
        if (!$loading.is(":hidden")) return false;
        $('#dataStatisticsChart .col-xs-12').hide();
        $loading.stop();
        $loading.animate({"width": "0%"}, 0);
        $loading.show();
        $loading.animate({"width": "100%"}, 1000 * waitTime);
        return true;
    }

    function getResult() {
        if ($location.path() != '/blank') return;
        BatchProcess.getBatchProcessResult(function (data) {
            if (data.status == 400) {
                return batchProcessErr()
            }
            if (data.result.isRunning === 1) {
                return setTimeout(getResult, 5000)
            }
            if (data.result.isRunning === -1) {
                return batchProcessErr();
            }
            var username = data.result.userName
            //$interval.cancel(getBatchDataPolling);
            $http.get('/chartImage/' + $rootScope.rootUserInfo.username+'/'+$rootScope.rootUserInfo.username + '.json').success(function ( data) {
                showProcessResult(data, username)

            })


        })
    }

    function batchProcessErr() {
        $(".loading").hide();
        //$interval.cancel(getBatchDataPolling);
        Prompt.promptBox("warning", "处理异常请再次请求")
    }

    function showProcessResult(data, username) {
        $('.loading').hide();
        Prompt.promptBox("success", "数据处理完毕");
        showResult(data,username)

        //$scope.integritys = EventData.table(data.result.data);
        //if (data.result.data.continuity && data.result.data.availability) {
        //    $scope.continuity = data.result.data.continuity;
        //    $scope.availability = data.result.data.availability;
        //}

    }


    function showResult(data, username){
        $('#dataStatisticsChartLoding').hide();
        $("#dataStatisticsChart").css("opacity", 1);
        showTime(data,username);
        showErrHist('HErrHist', data,'herr_hist');
        showErrHist('VErrHist', data,'verr_hist');
        showDop('Hdop', data, 'vdop_hist');
        showDop('Vdop', data, 'hdop_hist');
        showPL('VPL', data, 'vpl_hist');
        showPL('HPL', data, 'hpl_hist');
        showAvailability('content', data);
        showStaNum('StaNum', data);

    }

    function showErrHist(type, data,showType) {

        $('#' + type + '_loading').hide();
        $('#' + type + '_content').show();
        var names = ['GPSErrHist', 'GLSErrHist', 'BDSErrHist', 'GroupErrHist'];

        var series = [];
        Object.keys(data).forEach(function (key) {

            var info = {name: names[Number(key)], data: []};
            if (!data[key][showType]) return;
            var currentRate = 0
            data[key][showType].Y.forEach(function (y, index) {
                currentRate += y;
                info.data.push([data[key][showType].X[index], currentRate])
            });
            if (info.data.length > 0) {
                series.push(info)
            }
        });
        if (series.length == 0) return;
        $('#' + type + '_container').show();

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
            xAxis: {
                labels:{
                    formatter:function(){
                        return this.value+'m';
                    }
                }
            },
            series: series
        })
    }



    function showDop(type, data, showType) {

        $('#' + type + '_loading').hide();
        $('#' + type + '_content').show();
        var names = ['GPSDop', 'GLSDop', 'BDSDop', 'GroupDop'];

        var series = [];
        Object.keys(data).forEach(function (key) {
            var info = {name: names[Number(key)], data: []};
            if (!data[key][showType]) return;
            var currentRate = 0
            data[key][showType].X.forEach(function (x, index) {
                currentRate += data[key][showType].Y[index];
                info.data.push([x, currentRate])
            });
            if (info.data.length > 0) {
                series.push(info)
            }

        });
        if (series.length == 0) return;
        $('#' + type + '_container').show();
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
            xAxis: {
                labels:{
                    formatter:function(){
                        return this.value+'m';
                    }
                }
            },
            series: series
        })
    }


    function showPL(type, data,showType) {

        $('#' + type + '_loading').hide();
        $('#' + type + '_content').show();
        var names = ['GPSPL', 'GLSPL', 'BDSPL', 'GroupPL'];

        var series = [];
        Object.keys(data).forEach(function (key) {
            var currentRate = 0
            var info = {name: names[Number(key)], data: []};
            if (!data[key][showType]) return;
            data[key][showType].X.forEach(function (x, index) {
                currentRate += data[key][showType].Y[index];
                info.data.push([x, currentRate])
            });
            if (info.data.length > 0) {
                series.push(info)
            }
        });
        if (series.length == 0) return;
        $('#' + type + '_container').show();

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
            xAxis: {
                labels:{
                    formatter:function(){
                        return this.value+'m';
                    }
                }
            },
            //xAxis: {
            //    type: 'category',
            //    tickWidth: 10
            //
            //},
            series: series
        })
    }

    function showTime(data,username) {
        var signals = ['GPS', 'GLS', 'BDS', 'Group'];
        for(var sys in data){
            var sysIndex = parseInt(sys)
            if(data[sys].up_slice.vpl_num ==1){

                chartTimeLine(signals[sysIndex]+'VPLTime',signals[sysIndex]+'vpl_num.png',username)
            }
            if(data[sys].up_slice.hpl_num ==1){
                chartTimeLine(signals[sysIndex]+'HPLTime', signals[sysIndex]+'hpl_num.png',username)
            }

        }
        //chartTimeLine('GPSVPLTime', data, 3, 'vpl_num');
        //chartTimeLine('GPSHPLTime', data, 3, 'hpl_num');
        //chartTimeLine('GLSVPLTime', data, 3, 'vpl_num');
        //chartTimeLine('GLSHPLTime', data, 3, 'hpl_num');
        //chartTimeLine('BDSVPLTime', data, 3, 'vpl_num');
        //chartTimeLine('BDSHPLTime', data, 3, 'hpl_num');
        //chartTimeLine('GroupVPLTime', data, 3, 'vpl_num');
        //chartTimeLine('GroupHPLTime', data, 3, 'hpl_num');
        console.log('endTime')
        console.log(new Date())
    }

    function chartTimeLine(id, imageName, username) {

        //var showData = data[type];
        //var series = [];
        //var name = id.replace('Time', '');
        //var info = {name: name, data: [],color: 'red'};
        //var startTime;
        //sys = sys.toString();
        //if (!data[sys]) return;
        //var up_slice = data[sys].up_slice;
        //up_slice[type].X.forEach(function (x, index) {
        //    var time = new Date(x).getTime();
        //    if (index == 0) {
        //
        //        startTime = new Date(x).getTime();
        //        //console.log(startTime)
        //    }
        //    if (time - startTime <= 24 * 60 * 60 * 1000) {
        //        info.data.push([time, 500])
        //    } else {
        //        //console.log(time)
        //    }
        //
        //
        //});
        //if (info.data.length > 0) {
        //    series.push(info)
        //}
        //return
        //if (series.length == 0) return;
        $("#"+id+' img').attr('src','/chartImage/'+username+'/'+imageName)
        $('#' + id + '_loading').hide();
        $('#' + id + '_content').show();
        $('#' + id + '_container').show();


        //Highcharts.setOptions({
        //    lang: {
        //        resetZoom: '重置',
        //        resetZoomTitle: '重置缩放比例'
        //    },
        //    global: {
        //        useUTC: false<div class="col-md-12 col-xs-12 col-sm-12 display-none" id="GroupVPLTime_container" style="display: none;">…</div>
        //    }
        //});
        //$('#' + id).highcharts({
        //    chart: {
        //        type: 'column',
        //        zoomType: 'x',
        //        panning: true,
        //        panKey: 'shift',
        //        selectionMarkerFill: 'rgba(0,0,0, 0.2)',
        //        resetZoomButton: {
        //            position: {
        //                align: 'right',
        //                verticalAlign: 'top',
        //                x: 0,
        //                y: 0
        //            },
        //            theme: {
        //                fill: 'white',
        //                stroke: 'silver',
        //                r: 0,
        //                states: {
        //                    hover: {
        //                        fill: '#41739D',
        //                        style: {
        //                            color: 'white'
        //                        }
        //                    }
        //                }
        //            }
        //        },
        //        events: {
        //            load: function () {
        //                //// set up the updating of the chart each second
        //                console.log('----end-----type'+type)
        //                console.log(new Date())
        //
        //
        //
        //            }
        //        }
        //
        //
        //    },
        //    xAxis: {
        //        type: 'datetime',
        //        dateTimeLabelFormats: {
        //            second: '%H:%M:%S',
        //            minute: '%e. %m %H:%M',
        //            hour: '%m/%e %H:%M',
        //            day: '%m/%e %H:%M',
        //            week: '%e. %m',
        //            month: '%b %y',
        //            year: '%Y'
        //        }
        //
        //    },
        //    plotOptions: {
        //        series: {
        //            animation: false
        //        }
        //    },
        //
        //    legend: {
        //        enabled: true
        //    },
        //    //图例开关,默认是：true
        //    series: series
        //
        //});
    }

    function showStaNum(type, data) {
        //var showData = data[type];
        var names = ['GPSStaNum', 'GLSStaNum', 'BDSStaNum', 'GroupStaNum'];

        var series = [];
        Object.keys(data).forEach(function (key) {
            var info = {name: names[Number(key)], data: []};
            if (!data[key].sat_hist) return;
            data[key].sat_hist.X.forEach(function (x, index) {
                info.data.push([x, data[key].sat_hist.Y[index]])
            });
            if (info.data.length > 0) {
                series.push(info)
            }
        });
        if (series.length == 0) return;
        $('#' + type + '_loading').hide();
        $('#' + type + '_content').show();
        $('#' + type + '_container').show();
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
    function initResult(){
        $http.get('/chartImage/' + $rootScope.rootUserInfo.username+'/'+$rootScope.rootUserInfo.username + '.json').success(function ( data) {
            showResult(data,$rootScope.rootUserInfo.username)

        })
    }


    function showAvailability(type, result) {
        $scope.processResult = {};
        $('#' + type + '_loading').hide();
        $('#' + type + '_content').show();
        $('#' + type + '_container').show();
        Object.keys(result).forEach(function (key) {
            var value = result[key];
            $scope.processResult[key] = {};
            $scope.processResult[key].availability = value.availability;
            $scope.processResult[key].continuity = value.continuity;
            $scope.processResult[key].acc95_h = value.acc95_h;
            $scope.processResult[key].acc95_v = value.acc95_v;
            $scope.processResult[key].integrity = value.integrity
        });

    }



});