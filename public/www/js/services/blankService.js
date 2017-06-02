MetronicApp.factory('DateTable',  function() {
    var dateTable = function() {
        $('#reportrange span').html(moment().subtract('hours', 1).format('YYYY-MM-DD') + ' - ' + moment().format('YYYY-MM-DD'));
        $('#reportrange').daterangepicker(
            {
                maxDate: moment(),
                dateLimit: {
                    days: 30
                },
                showDropdowns: true,
                showWeekNumbers: false,
                timePicker: false,
                timePickerIncrement: 1,
                timePicker12Hour: false,
                ranges: {
                    '今日': [moment().startOf('day'), moment()],
                    '昨日': [moment().subtract('days', 1).startOf('day'), moment().subtract('days', 1).endOf('day')],
                    '最近7日': [moment().subtract('days', 6), moment()],
                    '最近30日': [moment().subtract('days', 29), moment()]
                },
                opens: 'right',
                buttonClasses: ['btn btn-default'],
                applyClass: 'btn-small btn-primary blue',
                cancelClass: 'btn-small',
                format: 'YYYY-MM-DD',
                separator: ' to ',
                locale: {
                    applyLabel: '确定',
                    cancelLabel: '取消',
                    fromLabel: '起始时间',
                    toLabel: '结束时间',
                    customRangeLabel: '自定义',
                    daysOfWeek: ['日', '一', '二', '三', '四', '五', '六'],
                    monthNames: ['一月', '二月', '三月', '四月', '五月', '六月',
                        '七月', '八月', '九月', '十月', '十一月', '十二月'],
                    firstDay: 1
                }
            }, function (start, end, label) {

                $('#reportrange span').html(start.format('YYYY-MM-DD') + ' - ' + end.format('YYYY-MM-DD'));

            }
        );
    }

    function getDaysInOneMonth(year, month){
        month = parseInt(month, 10);
        var d= new Date(year, month, 0);
        return d.getDate();
    }

    var allDate = function(startDate) {
        var allDate = [];
        var startYear = Number(startDate.substring(0, 4));
        var startMonth = Number(startDate.substring(5, 7));
        var startDay = Number(startDate.substring(8, 10));
        var endYear = Number(startDate.substring(13,17));
        var endMonth = Number(startDate.substring(18,20));
        var endDay = Number(startDate.substring(21,23));
        if (startMonth == endMonth && startDay != endDay) {
            var allDays = endDay - startDay + 1;
            for(var i=0;i<allDays;i++) {
                var nowDay = startDay + i;
                if(nowDay < 10){nowDay = '0' + nowDay}
                allDate.push(startYear + '-' + startDate.substring(5, 7) + '-' + nowDay)
            }
        }else if(startMonth == endMonth && startDay == endDay) {
            var nowDay = startDay;
            if(nowDay < 10){nowDay = '0' + nowDay}
            allDate.push(startYear + '-' + startDate.substring(5, 7) + '-' + nowDay)
        } else {
            var allDays = getDaysInOneMonth(startYear,startMonth) - startDay + 1;
            for(var i=0;i<allDays;i++) {
                var lastDay = startDay + i;
                if(lastDay < 10){lastDay = '0' + lastDay}
                allDate.push(startYear + '-' + startDate.substring(5, 7) + '-' + lastDay)
            }
            for(var j=0;j<endDay;j++) {
                var nextDay = j + 1;
                if(nextDay < 10){nextDay = '0' + nextDay}
                allDate.push(endYear + '-' + startDate.substring(18,20) + '-' + nextDay)
            }
        }
        return allDate;
    }
    return {dateTable: dateTable, allDate: allDate}

})
    .factory('DataAnalyseChart', function() {
    function lineChart(data,key1,key2,id) {
        var xAxis = [];
        data[key1][key2].X.forEach(function(data_x) {
            if(typeof data_x === 'number' && isFinite(data_x)) {
                var value = data_x.toString().split(".");
                if(value.length == 1) {
                    xAxis.push(value.toString()+".00000")
                }else if(value.length > 1) {
                    if(value[1].length > 5){
                        xAxis.push(data_x.toFixed(5))
                    }else{
                        xAxis.push(data_x)
                    }
                }else {return}
            }else {
                xAxis.push(data_x)
            }
        });
        $('#' + id + '_loading').hide();
        $('#' + id + '_content').show();
        Highcharts.setOptions({
            lang: {
                resetZoom: '重置',
                resetZoomTitle: '重置缩放比例'
            }
        });
        $('#'+id).highcharts({

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
                    position:{
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
            subtitle: {
                text: '双击选中区域放大图标，按住shift点击拖动'
            },
            xAxis: {
                categories: xAxis
            },
            series: [{
                name: id,
                data: data[key1][key2].Y
            }]
        });
    }
    return {lineChart: lineChart}

})
    .factory('EventData', function() {
    var table = function(results) {
        var type = {'0':'卫星数不足','1':'hpl超限','2':'误差超限','3':'数据有中断'}
        for(var i=0;i<results.integrity.length;i++) {
            results.integrity[i].type = type[results.integrity[i].type];
            results.integrity[i].lastTime = (results.integrity[i].lastTime.time + results.integrity[i].lastTime.sec) * 1000;
        }
        return results.integrity;
    }
    return {table: table}
})