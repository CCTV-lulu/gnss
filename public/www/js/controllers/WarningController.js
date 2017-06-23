angular.module('MetronicApp').controller('WarningController', function ($scope, DateTable, BatchProcess, WarningCSV, Prompt, $location) {


    init()

    function init() {
        $(".loading").animate({"width": "0%"}, 0);
        DateTable.dateTable();
        $scope.sysNav = ['GPS', 'GLS', 'BDS', '组合'];
        $scope.filter = {
            sys: [true, true, true, true],
            types: {
                dH: true,
                dV: true,
                HDOP: true,
                VDOP: true,
                HPL: true,
                VPL: true
            }
        }
    }


    function getFilter() {

        var sys = [];
        var types = [];
        $('input[name=sys]').each(function () {
            if (this.checked) {
                sys.push(Number(this.value))
            }
        });
        $('#options input').each(function () {
            if (this.checked) {
                types.push(this.name)
            }
        });

        return {
            sys: sys,
            types: types
        }

    }

    function getWarningCSV(fileName) {
        if ($location.path() != '/warning') return
        WarningCSV.getWarningInfo(fileName, function (result) {
            if (!result.status) {
                setTimeout(function () {
                    getWarningCSV(fileName)
                }, 3000)
            } else {
                hideWait()
                window.open(result.filePath)
            }
        })
    }

    function showWait(time) {
        var $loading = $('.loading');
        if (!$loading.is(":hidden")) return false;
        $loading.stop();
        $loading.animate({"width": "0%"}, 0);
        $loading.show();
        $loading.animate({"width": "100%"}, 1000 * time);

    }

    function hideWait() {
        $('.loading').hide();
    }

    $scope.findData = function () {


        var startDate = $('#searchDateRange').html();
        var stationId = $('#single').val();

        if (stationId) {
            showWait()
            $("#dataStatisticsChart").css("opacity", 0);
            $('#dataStatisticsChartLoding').show();
            var str = startDate.replace(new RegExp('-', 'gm'), '-')
                .replace(new RegExp(' ', 'gm'), '-');

            var findData = {};
            findData.staId = stationId;

            findData.bt = str.substring(0, 10) + 'T00:00:00Z';
            findData.et = str.substring(13, 23) + 'T23:59:59Z';

            var filer = getFilter();
            findData.sys = filer.sys;
            findData.types = filer.types;
            WarningCSV.createWaring(findData, function (result) {
                if (result.status) {
                    getWarningCSV(result.fileName)
                }
            });
            return;

        } else {
            Prompt.promptBox('warning', '请选择要查询的基站！！')
        }
    };

})