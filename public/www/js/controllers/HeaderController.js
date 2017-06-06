MetronicApp.controller('HeaderController',
    ['$interval', '$rootScope', '$scope', 'Show', 'Mongodb',
        'Passport', 'signalTypeInfo', '$location', 'signalTypObj', 'Prompt', 'userStationInfo','$state','getStationStatus',
        function ($interval, $rootScope, $scope, Show, Mongodb, Passport, signalTypeInfo, $location, signalTypObj, Prompt, userStationInfo,$state,getStationStatus) {





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










            /*=========new*/


            var intervalGetCurrentStationStatus;




            $scope.changeSignalType = function (name) {
                $rootScope.rootSingalType = {
                    name: name,
                    staId: $scope.allSignalType.indexOf(name)
                };

                $scope.signalType = name;
                saveSingalType($rootScope.rootSingalType)
            };







            function showOption(rootUserStationInfo) {
                $scope.realTimeStation = getCurrentStationInfo(rootUserStationInfo.allStations[0]).realTimeStation.name;
                $scope.originStation = getCurrentStationInfo(rootUserStationInfo.allStations[0]).originStation.name;

                if ($scope.isAdmin) {
                    $scope.allStations = rootUserStationInfo.allStations
                }
            }

            $scope.allSignalType = signalTypeInfo;

            $scope.signalType = $rootScope.rootSingalType ? $rootScope.rootSingalType.name : signalTypeInfo[0];

            $rootScope.rootSingalType = getSingalType();

            function getSingalType() {
                var defaultSingalType = JSON.stringify({name: 'GPS', staId: 0});
                return JSON.parse(localStorage.getItem($rootScope.activeUser + 'SingalType') || defaultSingalType)
            }

            function saveSingalType(singalType) {
                return localStorage.setItem($rootScope.activeUser + 'SingalType', JSON.stringify(singalType))
            }















            /*=============get station status*/


            init($rootScope.activeUser);

            $rootScope.$watch('activeUser', function (activeUser) {
                init(activeUser)
            });

            function init(activeUser){
                if(!activeUser) return ;
                userStationInfo.getUserStationInfo(function(userStationInfo){
                    $scope.updateRate = getRate();
                    $scope.isAdmin = $rootScope.rootIsAdmin || false;
                    if($scope.isAdmin){
                        var currentStationInfo = getCurrentStationInfo(userStationInfo.allStations[0]);
                        if($location.path() ==  '/dashboard') {
                            $rootScope.stationId = currentStationInfo.realTimeStation.staId
                            console.log($rootScope.stationId)
                        }
                        if($location.path()  ==  '/stardata'){
                             $rootScope.stationId = currentStationInfo.originStation.staId
                        }
                        $scope.realTimeStation = currentStationInfo.realTimeStation.name;
                        $scope.originStation = currentStationInfo.originStation.name;
                        showOption(userStationInfo);
                    }else{
                        $rootScope.stationId = userStationInfo.userStationInfo.data.staId;
                        $scope.realTimeStation = userStationInfo.userStationInfo.data.name;
                        $scope.originStation = userStationInfo.userStationInfo.data.name;
                    }
                });

            }

            $rootScope.$watch('stationId',function(stationId){
                if(stationId == undefined) return;
                resetIntervalGetCurrentStationStatus(stationId)
            });

            var intervalStatus= true;
            function resetIntervalGetCurrentStationStatus(stationId){
                $interval.cancel(intervalGetCurrentStationStatus);

                intervalGetCurrentStationStatus = $interval(function(){
                    if(!intervalStatus) return;
                    intervalStatus = false;
                    getCurrentStationStatus(stationId);
                }, $scope.updateRate*1000)
            }


            function getRate(){
                if(!getRateStorate()){
                    saveRateStorate(1)
                }
                return getRateStorate()
            }

            function getRateStorate(){
                return localStorage.getItem($rootScope.activeUser + 'UpdateRate')
            }
            function saveRateStorate(rate){
                localStorage.setItem($rootScope.activeUser + 'UpdateRate', rate)
            }

            function getCurrentStationInfo(station){

                if(!getCurrentStationInfoStorage()){
                    var defaultInfo ={
                        realTimeStation:{
                            name:station.name,
                            staId:station.staId
                        },
                        originStation:{
                            name:station.name,
                            staId:station.staId
                        }
                    };
                    saveCurrentStationInfoStorage(defaultInfo)
                }
                return getCurrentStationInfoStorage()
            }

            function getCurrentStationInfoStorage() {
                return JSON.parse(localStorage.getItem($rootScope.activeUser + '_currentStationInfo')||"false");
            }

            function saveCurrentStationInfoStorage(stationInfo) {
                localStorage.setItem($rootScope.activeUser + '_currentStationInfo', JSON.stringify(stationInfo));
            }



            $rootScope.$watch('rootIsAdmin', function (rootIsAdmin) {
                $scope.isAdmin = $rootScope.rootIsAdmin
            });

            $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {

                if (toState.name == 'dashboard') {
                    $scope.stationShow = true;
                    $scope.starShow = false;
                    $scope.socketStatusShow =  true;
                    init($rootScope.activeUser);
                } else if (toState.name == 'stardata') {
                    $scope.stationShow = false;
                    $scope.starShow = true;
                    $scope.socketStatusShow =  true
                    init($rootScope.activeUser)
                } else {
                    $scope.stationShow = false;
                    $scope.starShow = false;
                    $scope.socketStatusShow =  false;

                }

                if(toState.name == 'login'){
                    if(intervalGetCurrentStationStatus){
                        console.log(intervalGetCurrentStationStatus)
                        intervalGetCurrentStationStatus()
                    }
                }

            });




            $scope.changeRealTimeStation = function (name, staId) {
                var currentStationInfo = getCurrentStationInfo({name:name,staId:staId});
                if (currentStationInfo.realTimeStation.staId == staId) {
                    return;
                    //Prompt.promptBox('warning', '切换成功！！');

                }
                $rootScope.stationId = staId;
                currentStationInfo.realTimeStation.name = name;
                currentStationInfo.realTimeStation.staId = staId;
                saveCurrentStationInfoStorage(currentStationInfo);
                $scope.realTimeStation = getCurrentStationInfo().realTimeStation.name;



            };

            $scope.changeStartDataStation = function (name, staId) {
                var currentStationInfo = getCurrentStationInfo({name:name,staId:staId});
                if (currentStationInfo.originStation.staId == staId) {
                    return;
                    //Prompt.promptBox('warning', '切换成功！！');
                }
                $rootScope.rootOriginStation = {
                    name: name,
                    staId: staId
                };
                $rootScope.stationId = staId;
                currentStationInfo.originStation.name = name;
                currentStationInfo.originStation.staId = staId;
                saveCurrentStationInfoStorage(currentStationInfo);

                $scope.originStation = getCurrentStationInfo().originStation.name;

            };

            $scope.refreshFrequency = function (rate) {
                if (rate == localStorage.getItem($rootScope.activeUser + 'UpdateRate')) return;

                $scope.updateRate = rate;
                localStorage.setItem($rootScope.activeUser + 'UpdateRate', rate);
                resetIntervalGetCurrentStationStatus($rootScope.stationId);
            };






            function getCurrentStationStatus (stationId){
                getStationStatus.getStationStatus(stationId , 1, function (data) {

                    if (data.StationSocketStatus == true) {
                        $scope.StationSocketStatus = '实时数据接收中'
                    } else {
                        $scope.StationSocketStatus = '实时数据未连接'
                    }
                    $rootScope.RootCurrentStationStatus = data;
                    intervalStatus = true;
                })
            }

            $scope.$on('$destroy', function () {
                if(intervalGetCurrentStationStatus){
                    $interval.cancel(intervalGetCurrentStationStatus)
                }
            })






        }
    ]);
