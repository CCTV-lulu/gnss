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
        console.log(stationId)
        if(stationId == undefined) return;
        getStationStatus.getStationStatus(stationId, 1, function (data) {
            console.log('---------------------------startINfo   ')
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
            console.log('-----------showStarInfo-------------')
    console.log(data)
        if(data.stationData != false) {
            console.log('--------stationData----------------')
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
            console.log('-------------------------------end')
            sucFuc()
        }
        if($rootScope.rootSingalType.name === 'BDS'){
            $scope.signal = true
        }
        // var starInfos =$scope.starInfo
        // starInfos.forEach(function (star) {
        //     Object.keys(star).forEach(function (key) {
        //         if(star[key] === null){
        //             var index = starInfos.indexOf(star)
        //             starInfos[index][key]="-";
        //             $scope.starInfo = starInfos
        //         }
        //         if(star[key] === undefined){
        //             var index = starInfos.indexOf(star)
        //             starInfos[index][key] = 'NA'
        //             $scope.starInfo = starInfos
        //         }
        //     })
        // })

        $scope.handleDataTwo =  function (value) {
            if(value === null){
                return '-'
            }
            if(value === undefined){
                return 'NA'
            }
            return value.toFixed(2)
        }
        $scope.handleDataInt = function (value) {
            if(value === null){
                return '-'
            }
            if(value === undefined){
                return 'NA'
            }
            return parseInt(value)
        }

    }
    $scope.parseInt = function(number) {
        return parseInt(number)
    }


    $scope.showDataloading = true;


})