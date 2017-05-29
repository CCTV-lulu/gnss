angular.module('MetronicApp').controller('ThresholdController', function ($rootScope, $scope, $http, settingInfo, $location,
                                                                          getCommitThreshold, Prompt) {

    $scope.$on('logout', function (event, url) {
        $scope.$emit('logout-connect-app','data')
        //$('body').addClass('page-on-load');
        //location.reload(true)
    });

    $scope.getStationThreshold = function (station) {
        var staName = station || $('#single').val();
        localStorage.setItem('thresholdBastation', staName);
        getCommitThreshold.threshold(staName, function (data) {
            var Threshold = data.staThreshold;
            $scope.test = Threshold;
        })
    }

    $scope.commitThreshold = function (Max, Min) {
        var staName = $('#single').val();
        if (staName == '? undefined:undefined ?') {
            Prompt.promptBox("warning", "请选择基站")
        } else {
            $scope.test[Max] = undefined;
            $scope.test[Min] = undefined;
            var Threshold = {};
            for (var i in $scope.test) {
                Threshold[i] = $scope.test[i];
            }
            var username = localStorage.getItem('userName');
            getCommitThreshold.setStaThreshold(staName, username, Threshold)
        }
    }

    getCommitThreshold.getUserStaId(function (data) {
        if (data) {
            //console.log(data)
            $scope.allBlankStation = data[0];
            $scope.test = data[1];
        }
        else {
            //console.log(data)
            $scope.allBaseStation = undefined;
            $scope.test = undefined;
        }
    })
});
