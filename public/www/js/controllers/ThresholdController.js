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
        getStation($scope.isAdmin);
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
        if(!station||!$scope.allThreshold) return;
        showThreshold()
        //$scope.threshold = $scope.allThreshold[$scope.station]?$scope.allThreshold[$scope.station][$scope.signal]:{}
    });

    function showThreshold(){
        if(!$scope.isAdmin){
            $scope.isReadonly = false;
        }
        $scope.threshold = $scope.allThreshold[$scope.station]?$scope.allThreshold[$scope.station][$scope.signal].threshold:{}
        $scope.config=$scope.allThreshold[$scope.station]?$scope.allThreshold[$scope.station][$scope.signal].config:{}
        if(!$scope.isAdmin){
            $scope.isReadonly = true;
        }

    }

    $scope.commitThreshold = function () {
        if(!$scope.station||!$scope.signal||!$scope.threshold||!$scope.config) return
        var data = {
            staId: $scope.station,
            signal: $scope.signal,
            threshold: $scope.threshold,
            config:$scope.config,
        };
        Threshold.setThreshold(data,function(allThreshold){
            if(allThreshold.status){
                $scope.allThreshold = allThreshold.allThreshold;
                showThreshold()
                Prompt.promptBox('success','保存成功')
            }else{

                Prompt.promptBox('warning','请刷新')
            }

        })
    };


});
