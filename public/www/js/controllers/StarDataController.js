angular.module('MetronicApp').controller('StarDataController', function ($scope, settingInfo, $timeout, getStationStatus, $interval, $location, $rootScope, Show, Mongodb,userStationInfo) {

    userStationInfo.getUserStationInfo(function(userStationInfo){
        $rootScope.rootUserStationInfo = userStationInfo
        console.log($rootScope.rootUserStationInfo)
    })




    var stationId;
    var signalId;
    $scope.baseStartStation = localStorage.getItem('startBaseStation');
    var dataId = "";
    var getStartInfo;
    var stationDataStatus = true;

    $scope.$emit('to_allBaseStation', 'data')
    $scope.$emit('to-app-basestation', 'data');
    $interval.cancel(getStartInfo);
    $scope.$on('allStation-to-starData', function(event, data) {
        var arr=[]
        for(var i = 0;i<data.allStation.length;i++) {
            arr.push(JSON.stringify(data.allStation[i].staId))
        }
        if(arr.indexOf(localStorage.getItem('startStaId')) == -1) {
            stationId = data.allStation[0].staId;
            signalId = data.userStation.signalTypeId;
        }else {
            stationId = localStorage.getItem('startStaId');
            signalId = data.userStation.signalTypeId;
        }
        init()
    })


    function init() {
        getStationInfo(signalId, stationId, true, function () {
            getStartInfo = $interval(function () {
                getStationInfo(signalId, stationId, false)
            }, 1000);
        })
    }

    function getStationInfo(signalId, stationId,boolen, callback){
        callback = callback||function(){}
        if(stationDataStatus == false) return;
        try {
            loadStationStatus(signalId, stationId, 1, boolen, function() {
                callback()
            })
        } catch(err) {
            stationDataStatus = true;
        }
    }

    $scope.showDataloading = true;

    $scope.$on('$destroy', function(event) {
        $interval.cancel(getStartInfo);
    })

    $scope.$on('logout', function (event, url) {
        $interval.cancel(getStartInfo);
        $scope.$emit('logout-connect-app','data')
    });
    $scope.$on('signalId', function (event, data) {
        Mongodb.setUserStartStaId(localStorage.getItem("staId"), localStorage.getItem("userName"), localStorage.getItem('baseStation'),
            localStorage.getItem('signalType'), data, localStorage.getItem('startBaseStation'), localStorage.getItem("startStaId"))
        $("#startInfo").empty();
        signalId = data;
        $scope.showDataloading = true;
        showStartInfo(signalId)
    });

    $scope.$on('StarDataStationChange', function (event, data) {
        $interval.cancel(getStartInfo);
        signalId = localStorage.getItem('signalTypeId')
        Mongodb.setUserStartStaId(localStorage.getItem("staId"), localStorage.getItem("userName"), localStorage.getItem('baseStation'),
            localStorage.getItem('signalType'), localStorage.getItem('signalTypeId'), localStorage.getItem('startBaseStation'), data)
        $("#startInfo").empty();
        localStorage.removeItem('startsInfo');
        stationId = data;
        dataId = "";
        $scope.showDataloading = true;
        init()
    });

    $scope.$on('goOutStartdata', function (event, data) {
        //$interval.cancel(getStartInfo);
        $("#startInfo").empty();
        if (data == 'dashboard') {
            return $location.path("/dashboard.html/" + localStorage.getItem("staId"))
        } else {
            return $location.path(data)
        }
    });

    function loadStationStatus(signalTypeId, staId, limit, type, callback) {
        stationDataStatus = false;
        getStationStatus.getStationStatus(staId, limit, function (data) {
            stationDataStatus = true;
            if(data.StationSocketStatus == true) {
                $scope.$emit('socketStatus_to_app', '实时数据接收中');
            }else {
                $scope.$emit('socketStatus_to_app', '实时数据未连接');
            }
            if(data.stationData != false) {
                if (data.stationData.length == 0) {
                    return
                } else {
                    if (dataId != data.stationData[0].dataId) {
                        dataId = data.stationData[0].dataId
                        var starInfos = data.stationData[0].obsinfo
                        $("#startInfo").empty();
                        localStorage.setItem("startsInfo", JSON.stringify(starInfos))
                        if (type) {
                            starInfos.forEach(function (data) {
                                if (data.sys == signalTypeId) {
                                    $("#startInfo").prepend(htmlString(data))
                                }
                            });
                            $scope.showDataloading = false;
                            callback()
                        } else {
                            showStartInfo(signalTypeId)
                        }
                    }
                }
            }else {
                if(type){
                    callback();
                }
            }
        })
    }

    function showStartInfo(signalTypeId) {
        if (localStorage.getItem("startsInfo")) {
            var startsInfo = JSON.parse(localStorage.getItem("startsInfo"))
            startsInfo.forEach(function (data) {
                //console.log(data)
                if (data.sys == signalTypeId) {
                    $("#startInfo").prepend(htmlString(data))
                }
            });
            $scope.showDataloading = false
        }
    }

    function htmlString(data) {

        return "<tr>" +
            "<td> " + data.sat + "</td>" +
            "<td>" + data.svh + "</td>" +
            "<td>" + data.Ele + "</td>" +
            "<td>" + data.Azi + "</td>" +
            "<td>" + data.ura + "</td>" +
            "<td>" + data.rura + "</td>" +
            "<td>" + data.udre + "</td>" +
            "<td>" + data.week + "</td>" +
            "<td>" + data.tow + "</td>" +
            "<td>" + (new Date(data.time).getTime()+8*60*60*1000) + "</td>" +
            "</tr>"
    }
//原始数据页面


})