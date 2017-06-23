angular.module('MetronicApp').controller('WarningController', function ($scope,DateTable,BatchProcess) {


    init()

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
        }
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
            findData.options = filer.options;
            console.log(findData);
            return findData;

        } else {
            Prompt.promptBox('warning', '请选择要查询的基站！！')
        }
    };

})