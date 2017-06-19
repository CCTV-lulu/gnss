angular.module('MetronicApp').controller('ThresholdController', function ($rootScope, $scope, $http, settingInfo, $location,
                                                                          getCommitThreshold, Prompt,Threshold) {
    init()

    function init(){
        $scope.allSingal = {
            2:'BDS',
            0:'GPS',
            1:'GLS',
            3:'组合'
        };
        $scope.signal = '0';
        getThreshold();
         $scope.isAdmin = $rootScope.rootIsAdmin;
        $rootScope.$watch('rootIsAdmin',function(rootIsAdmin){
            $scope.isAdmin=rootIsAdmin;
            getStation($scope.isAdmin)
        });
        getStation($scope.isAdmin)
        $scope.isReadonly=false
    }

    function getStation(isAdmin){
        if(isAdmin){
            $scope.allStations = $rootScope.allStations;

            $rootScope.$watch('allStations',function(allStations){
                if(allStations==undefined) return;
                $scope.allStations = allStations;
                $scope.station = $scope.allStations[0] ? $scope.allStations[0].staId : ''

            });

        }else{
            $scope.station =$rootScope.stationId;
            $scope.stationInfoId= $rootScope.stationId;
            $scope.stationInfoName = $rootScope.stationName;

        }
    }
    function getThreshold(){
        Threshold.getThreshold(function(allThreshold){
            $scope.allThreshold = allThreshold.allThreshold;
            showThreshold()
            //$scope.threshold = $scope.allThreshold[$scope.station]?$scope.allThreshold[$scope.station][$scope.signal]:{}
        })
    }

    $scope.$watch('signal',function(signal){
        if(!signal||!$scope.allThreshold) return;
        showThreshold()
        //$scope.threshold = $scope.allThreshold[$scope.station]?$scope.allThreshold[$scope.station][$scope.signal]:{}
    });
    $scope.$watch('station',function(station){
        console.log(!station||!$scope.allThreshold)
        if(!station||!$scope.allThreshold) return;
        showThreshold()
        //$scope.threshold = $scope.allThreshold[$scope.station]?$scope.allThreshold[$scope.station][$scope.signal]:{}
    });

    function showThreshold(){
        if(!$scope.isAdmin){
            $scope.isReadonly = false;
        }
        console.log($scope.allThreshold)
        $scope.threshold = $scope.allThreshold[$scope.station]?$scope.allThreshold[$scope.station][$scope.signal]:{}
        if(!$scope.isAdmin){
            $scope.isReadonly = true;
        }

    }

    $scope.commitThreshold = function () {
        var data = {
            staId: $scope.station,
            signal: $scope.signal,
            threshold: $scope.threshold
        };
        Threshold.setThreshold(data,function(allThreshold){
            if(allThreshold.status){
                $scope.allThreshold = allThreshold.allThreshold;
                showThreshold()
                Prompt.promptBox('success','保存成功')
            }else{
                Prompt.promptBox('warnning',allThreshold.message)
            }

        })
    };




    /*==========================*/




    //$scope.getStationThreshold = function (station) {
    //    var staName = station || $('#single').val();
    //    localStorage.setItem('thresholdBastation', staName);
    //    //getCommitThreshold.threshold(staName, function (data) {
    //    //    var Threshold = data.staThreshold;
    //    //    $scope.test = Threshold;
    //    //})
    //}
    //
    //$scope.commitThreshold = function (Max, Min) {
    //    var staName = $('#single').val();
    //    if (staName == '? undefined:undefined ?') {
    //        Prompt.promptBox("warning", "请选择基站")
    //    } else {
    //        $scope.test[Max] = undefined;
    //        $scope.test[Min] = undefined;
    //        var Threshold = {};
    //        for (var i in $scope.test) {
    //            Threshold[i] = $scope.test[i];
    //        }
    //        var username = localStorage.getItem('userName');
    //        getCommitThreshold.setStaThreshold(staName, username, Threshold)
    //    }
    //}
    //
    //getCommitThreshold.getUserStaId(function (data) {
    //    if (data) {
    //        //console.log(data)
    //        $scope.allBlankStation = data[0];
    //        $scope.test = data[1];
    //    }
    //    else {
    //        //console.log(data)
    //        $scope.allBaseStation = undefined;
    //        $scope.test = undefined;
    //    }
    //})
    //
    //$scope.$on('logout', function (event, url) {
    //    $scope.$emit('logout-connect-app','data')
    //    //$('body').addClass('page-on-load');
    //    //location.reload(true)
    //});
});
