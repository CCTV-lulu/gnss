angular.module('MetronicApp').controller('StarDataController', function ($scope, settingInfo, $timeout, getStationStatus, $interval, $location, $rootScope, Show, Mongodb,userStationInfo,$state) {

    var originStationStatus = false;
    var stationId =  $rootScope.stationId;
    var rootSingalTypeId= $rootScope.rootSingalType ? $rootScope.rootSingalType.staId : undefined;
    init(stationId)

    var listenRootCurrentStationStatus;

    var listenStationId = $rootScope.$watch('stationId',function(newStationId){
        if(newStationId == undefined || stationId == newStationId) return;
        stationId = newStationId

        if(listenRootCurrentStationStatus){
            listenRootCurrentStationStatus()
        }
        $scope.starInfo =[];
        init(newStationId)
    });


    var listerSingalType = $rootScope.$watch('rootSingalType',function(newRootSingalType){
        if(newRootSingalType==undefined || rootSingalTypeId == newRootSingalType.staId) return;
        rootSingalTypeId = newRootSingalType.staId;
        $scope.starInfo = $scope.starsInfo ? $scope.starsInfo[newRootSingalType.staId]:[];
    });

    $scope.$on('$destroy', function (event) {
        if(listenRootCurrentStationStatus){
            listenRootCurrentStationStatus()
        }

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
            showStarInfo(data, function(){
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
                //if (data.sys == $rootScope.rootSingalType.staId) {
                //
                //    starInfo.push(data)
                //}
            });
            $scope.starsInfo= starInfo;
            $scope.starInfo = starInfo[$rootScope.rootSingalType.staId];
            $scope.showDataloading = false;
            sucFuc()
        }
    }







    //$scope.baseStartStation = localStorage.getItem('startBaseStation');
    var dataId = "";
    var stationDataStatus = true;






    $scope.showDataloading = true;


    //
    //function loadStationStatus(signalTypeId, staId, limit, type, callback) {
    //    stationDataStatus = false;
    //    getStationStatus.getStationStatus(staId, limit, function (data) {
    //
    //        stationDataStatus = true;
    //        if(data.StationSocketStatus == true) {
    //            $scope.$emit('socketStatus_to_app', '实时数据接收中');
    //        }else {
    //            $scope.$emit('socketStatus_to_app', '实时数据未连接');
    //        }
    //
    //        if(data.stationData != false) {
    //            if (data.stationData.length == 0) {
    //                return
    //            }
    //            if (dataId != data.stationData[0].dataId) {
    //                dataId = data.stationData[0].dataId;
    //                var starInfos = data.stationData[0].obsinfo;
    //
    //                $("#starInfo").empty();
    //                var starInfo = [];
    //                starInfos.forEach(function (data) {
    //                    if (data.sys == signalTypeId) {
    //                        data.time = new Date(data.time).getTime()+8*60*60*1000
    //                        starInfo.push(data)
    //                    }
    //                });
    //                $scope.starInfo = starInfo;
    //
    //                $scope.showDataloading = false;
    //
    //
    //            }else{
    //
    //            }
    //
    //        }else {
    //            if(type){
    //                callback();
    //            }
    //        }
    //    })
    //}
    //
    //function showStartInfo(signalTypeId) {
    //    if (localStorage.getItem("startsInfo")) {
    //        var startsInfo = JSON.parse(localStorage.getItem("startsInfo"))
    //        startsInfo.forEach(function (data) {
    //            if (data.sys == signalTypeId) {
    //                $("#startInfo").prepend(htmlString(data))
    //            }
    //        });
    //        $scope.showDataloading = false
    //    }
    //}
    //
    //function htmlString(data) {
    //
    //    return "<tr>" +
    //        "<td> " + data.sat + "</td>" +
    //        "<td>" + data.svh + "</td>" +
    //        "<td>" + data.Ele + "</td>" +
    //        "<td>" + data.Azi + "</td>" +
    //        "<td>" + data.ura + "</td>" +
    //        "<td>" + data.rura + "</td>" +
    //        "<td>" + data.udre + "</td>" +
    //        "<td>" + data.week + "</td>" +
    //        "<td>" + data.tow + "</td>" +
    //        "<td>" + (new Date(data.time).getTime()+8*60*60*1000) + "</td>" +
    //        "</tr>"
    //}
//原始数据页面


})