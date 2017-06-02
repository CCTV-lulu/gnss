MetronicApp.controller('HeaderController', ['$interval','$rootScope','$scope','Show', 'Mongodb', 'Passport', 'signalTypeInfo', '$location', 'signalTypObj','Prompt',
    function ($interval,$rootScope,$scope,Show, Mongodb, Passport, signalTypeInfo, $location, signalTypObj,Prompt) {
        function getFrequency() {
            if(localStorage.getItem('Frequency')){
                $scope.Frequency = localStorage.getItem('Frequency')+"s";
            }else{
                $scope.Frequency = 1 + 's'
            }
        }
        $scope.allSignalType = signalTypeInfo;
        $scope.$on('$includeContentLoaded', function () {
            Layout.initHeader();
        });
        $scope.$on("stationItem", function (event, data) {
            getFrequency()
            $scope.test = new Date();
            var listener = $scope.$watch('test',function(){
                Mongodb.getUserStaId(function (data) {
                    if(data.allStation[0] != undefined){
                        var userSta = []
                        userSta.push(data.userStation)
                        $rootScope.allBaseStation = data.allStation||userSta;
                        //console.log($rootScope.allBaseStation)
                        $scope.$emit('to-app-dash-allstation', data)
                    }
                })
                listener();
            })
        });

        $scope.$on('socketStatus_to_header', function(event, data) {
            $scope.StationSocketStatus = data
        });

        $scope.$on('login_to_header',function(event, data) {
            Mongodb.getUserStaId(function (data) {

                $scope.activeUser = data.userStation.userName;
                var SignalType = signalTypObj
                $scope.baseStation = data.userStation.staName||'基站';
                $scope.baseStartStation = data.userStation.startBaseStation||'基站';
                $scope.signalType = data.userStation.signalType||'信号类型';
                var staId = data.userStation.staId||'-1'

                var startStaId = data.userStation.startStaId||'-1'
                var userSta = []
                userSta.push(data.userStation)
                $scope.allBaseStation = data.allStation||userSta;
                localStorage.setItem('baseStation', $scope.baseStation)
                localStorage.setItem('startBaseStation', $scope.baseStartStation)
                localStorage.setItem('signalType', $scope.signalType)
                localStorage.setItem('signalTypeId', SignalType[$scope.signalType]||'-1')
                localStorage.setItem('staId', staId)
                localStorage.setItem('startStaId', startStaId)
                Show.isShowLogin(false);
                $location.path('/dashboard.html/'+staId)

            })
        });
        $scope.$on('show-header-basestation', function (event, data) {
            Mongodb.getUserStaId(function(userStationInfo){
                localStorage.setItem("userName", userStationInfo.userStation.userName)
                $scope.activeUser = userStationInfo.userStation.userName;
                if(userStationInfo.allStation[0] != undefined){
                    $scope.allBaseStation = userStationInfo.allStation
                    $scope.signalType = userStationInfo.userStation.signalType||'信号类型';
                }else{
                    var userSta = []
                    userSta.push(userStationInfo.userStation||"")
                    $scope.allBaseStation = userSta;
                    $scope.signalType = '信号类型';
                    localStorage.removeItem('startsInfo');
                }
                localStorage.setItem('baseStation', userStationInfo.userStation.staName||'基站')
                localStorage.setItem('startBaseStation', userStationInfo.userStation.startBaseStation||'基站')
                localStorage.setItem('staId', userStationInfo.userStation.staId||'-1');
                localStorage.setItem('startStaId', userStationInfo.userStation.startStaId||'-1');
                localStorage.setItem('signalType', $scope.signalType);
                localStorage.setItem('signalTypeId', userStationInfo.userStation.signalTypeId||'-1')
                $scope.baseStation = localStorage.getItem('baseStation') || '基站';
                $scope.baseStartStation = localStorage.getItem('startBaseStation') || '基站';
            })
        })

        $scope.$on('to-header', function (event, data) {
            if (data == 'dashboard') {
                $scope.stationShow = true;
                $scope.starShow = false;
                $scope.socketStatusShow = true;
            } else if (data == 'stardata') {
                $scope.starShow = true;
                $scope.stationShow = false;
                $scope.socketStatusShow = true;
            } else {
                $scope.socketStatusShow = false;
                $scope.starShow = false;
                $scope.stationShow = false;
            }
        })

        var nowPage = $location.path();
        if (nowPage == '/blank' || nowPage == '/threshold' || nowPage == '/administrator') {
            $scope.socketStatusShow = false;
        } else {
            $scope.socketStatusShow = true;
        }
        if (nowPage == '/blank' || nowPage == '/threshold' || nowPage == '/administrator' || nowPage == '/stardata') {
            $scope.stationShow = false;
        } else {
            $scope.stationShow = true;
        }
        if (nowPage == '/stardata') {
            $scope.starShow = true
        }
        function getLocalStorageStationItem() {
            if (localStorage.getItem('baseStation') && localStorage.getItem('signalType') && localStorage.getItem('startBaseStation')) {
                $scope.baseStation = localStorage.getItem('baseStation');
                $scope.baseStartStation = localStorage.getItem('startBaseStation');
                $scope.signalType = localStorage.getItem('signalType');
            }
        }
        getLocalStorageStationItem();

        $scope.changeBaseStation = function (name, staId) {
            if(localStorage.getItem('staId') != staId){
                Prompt.promptBox('warning', '切换成功！！')
                localStorage.setItem('baseStation', name)
                localStorage.setItem('staId', staId)
                //$scope.baseStation = name;
                $scope.$emit('endDash', staId)
            }
            //$scope.$emit和$emit发送到appcontroller
        }

        $scope.changeStartDataStation = function (name, staId) {
            localStorage.setItem('startBaseStation', name);
            localStorage.setItem('startStaId', staId);
            $scope.baseStartStation = name;
            $scope.$emit('changeStarDataStation', staId);
        }

        $scope.changeSignalType = function (name) {
            var SignalType = signalTypObj;
            localStorage.setItem('signalType', name);
            $scope.signalType = name;
            localStorage.setItem('signalTypeId', SignalType[name]);
            $scope.$emit('signalTypeId', SignalType[name]);
        }

        $scope.logoutGnss = function () {
            var sideBarArr = ['dashboard', 'blank', 'threshold', 'stardata', 'administrator'];
            for (var i = 0; i < sideBarArr.length; i++) {
                var sideBarClass = $('#' + sideBarArr[i]).attr('class');
                if (sideBarClass == 'nav-item active') {
                    $('#' + sideBarArr[i]).attr('class', 'nav-item');
                }
            }
            $scope.$emit('logout-to-parent', 'data');
        }

        $scope.$on('logout-to-header', function(event, data) {
          Passport.logout(function () {
                $location.path('/login');
            });
        })

        $scope.toHome = function () {
            $scope.$emit('gnss-to-parent', 'data');
        }

        $scope.refreshFrequency = function (frequency) {
            $scope.Frequency = frequency + "s";
            $scope.$emit('updateFrequency', frequency);
            localStorage.setItem('Frequency',frequency);
        }









        function updateUserStationInfo(realTimeStation){
            Mongodb.setUserStaId
        }

        function getUserStationInfo(){
            Mongodb.getUserStaId(function (data) {
                $rootScope.userStationInfo = data
            })
        }






    }]);
