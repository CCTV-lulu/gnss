
angular.module('MetronicApp').controller('DataHandleController', function ($rootScope, $scope, $http, settingInfo, $location,
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
        Threshold.getHandleData(function(allThreshold){

            $scope.allThreshold = allThreshold.allThreshold;
            showThreshold()
            //$scope.threshold = $scope.allThreshold[$scope.station]?$scope.allThreshold[$scope.station][$scope.signal]:{}
        })
    }

    // $scope.$watch('signal',function(signal){
    //     if(!signal||!$scope.allThreshold) return;
    //     showThreshold()
    //     //$scope.threshold = $scope.allThreshold[$scope.station]?$scope.allThreshold[$scope.station][$scope.signal]:{}
    // });
    $scope.$watch('station',function(station){
        if(!station||!$scope.allThreshold) return;
        showThreshold()
        //$scope.threshold = $scope.allThreshold[$scope.station]?$scope.allThreshold[$scope.station][$scope.signal]:{}
    });

    function showThreshold(){
        if(!$scope.isAdmin){
            $scope.isReadonly = false;
        }

        // $scope.threshold = $scope.allThreshold[$scope.station]?$scope.allThreshold[$scope.station][$scope.signal].handleData:{}
        $scope.config=$scope.allThreshold[$scope.station]?$scope.allThreshold[$scope.station][$scope.signal].config:{}
        if(!$scope.isAdmin){
            $scope.isReadonly = true;
        }

    }
    $scope.$watch()

    $scope.commitThreshold = function () {
        var data = {
            staId: $scope.station,
            // signal: $scope.signal,
            // handleData: $scope.threshold,
            config:$scope.config,
        };
        Threshold.setHandleData(data,function(allHandleData){

            if(allHandleData.status){
                $scope.allThreshold = allHandleData.allThreshold;

                showThreshold()
                Prompt.promptBox('success','保存成功')
            }else{

                Prompt.promptBox('warning','请刷新')
            }

        })
    };
    // $scope.clearConfig = function () {
    //     var data={
    //         staId: $scope.station,
    //         signal: $scope.signal,
    //     }
    //     Threshold.removeConfig(data,function(result){
    //         if(result.status){
    //             $scope.allThreshold = result.allThreshold;
    //             showThreshold()
    //             Prompt.promptBox('success','重置成功')
    //         }else{
    //
    //             Prompt.promptBox('warning','请刷新')
    //         }
    //
    //     })
    // }




});
