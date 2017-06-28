angular.module('MetronicApp').controller('StarDataController', function ($scope, settingInfo, $timeout, getStationStatus, $interval, $location, $rootScope, Show, Mongodb,userStationInfo,$state) {

    var originStationStatus = false;
    var stationId =  $rootScope.stationId;
    var rootSingalTypeId= $rootScope.rootSingalType ? $rootScope.rootSingalType.staId : undefined;
    init(stationId);

    var listenRootCurrentStationStatus;

    var listenStationId = $rootScope.$watch('stationId',function(newStationId){
        if(newStationId == undefined || stationId == newStationId) return;
        stationId = newStationId;
        $scope.starInfo = [];
        if(listenRootCurrentStationStatus){
            listenRootCurrentStationStatus()
        }

        init(newStationId)
    });


    var listerSingalType = $rootScope.$watch('rootSingalType',function(newRootSingalType){
       show(newRootSingalType)
    });

    function show(newRootSingalType){
        if(newRootSingalType==undefined || rootSingalTypeId == newRootSingalType.staId) return;
        rootSingalTypeId = newRootSingalType.staId;
        $scope.starInfo = $scope.starsInfo ? $scope.starsInfo[newRootSingalType.staId]:[];
    }

    $scope.$on('$destroy', function (event) {
        if(listenRootCurrentStationStatus){
            listenRootCurrentStationStatus()
        }
        listenRootCurrentStationStatus = true;

        if(listenStationId){
            listenStationId()
        }
        if(listerSingalType){
            listerSingalType()
        }
    });




    function init(stationId){
        if(stationId == undefined) return;
        getStationStatus.getStationStatus(stationId, 1, function (data) {
            $scope.starsInfo =[]
            showStarInfo(data, function(){
                if(listenRootCurrentStationStatus === true) return;
                listenRootCurrentStationStatus = $rootScope.$watch('RootCurrentStationStatus',function(data){
                    if(!data) return;
                    showStarInfo(data)
                })
            },function(){
                init(stationId)
            })
        })
    }


    function showStarInfo(data,sucFuc,failFuc){
        sucFuc = sucFuc? sucFuc: function(){};
        failFuc = failFuc? failFuc: function(){};

        if(data.stationData != false) {
            if (data.stationData.length == 0) {
                return failFuc()
            }

            var starInfos = data.stationData[0].obsinfo;
            var starInfo = {0:[],1:[],2:[]};
            starInfos.forEach(function (data) {
                data.time = new Date(data.time).getTime()+8*60*60*1000;
                starInfo[data.sys].push(data);
            });
            $scope.starsInfo= starInfo;
            $scope.starInfo = starInfo[$rootScope.rootSingalType.staId];
            $scope.showDataloading = false;
            sucFuc()
        }
    }



    $scope.showDataloading = true;


})