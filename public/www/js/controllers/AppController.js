MetronicApp.controller('AppController', ['$scope', '$http', '$location', 'Login', 'Passport','Show','$state', function ($scope, $http, $location, Login, Passport, Show, $state) {

    $scope.$on('hideHearerStation', function (event, data) {
        $scope.$broadcast('to-header', data);
    });

    $scope.$on('to_appController', function(event, data) {
        $scope.$broadcast('dashTo_Sidebar', data);
    })

    $scope.$on('disconnect-to-parent', function (event, data) {
        $scope.$broadcast('data_disconnect', data);
    });

    $scope.$on('logout-to-parent', function (event, data) {
        $scope.$broadcast('logout', data);
    });

    $scope.$on('logout-connect-app', function(event, data) {
        $scope.$broadcast('logout-to-header', data);
    })

    $scope.$on('to-app-dash-allstation', function(event, data) {
        $scope.$broadcast('allStation-to-dash',data)
        $scope.$broadcast('allStation-to-starData', data)
    })

    $scope.$on('updateFrequency', function (event, data) {
        $scope.$broadcast('frequencyUpdate', data);
    });

    $scope.$on('endDash', function (event, data) {
        $scope.$broadcast('endDashRepeat', data);
    });

    $scope.$on('socketStatus_to_app', function(event, data) {
        $scope.$broadcast('socketStatus_to_header', data)
    })

    $scope.$on('gnss-to-parent', function(event, data) {
        $scope.$broadcast('to-sidebar',  data);
    })

    $scope.$on('changeStarDataStation', function (event, data) {
        $scope.$broadcast('StarDataStationChange', data);
    });

    $scope.$on('signalTypeId', function (event, data) {
        $scope.$broadcast('signalId', data);
    });

    $scope.$on('goOutStartdataPage', function (event, data) {
        $scope.$broadcast('goOutStartdata', data);
    });

    $scope.$on('goOutBlankPage', function(event, data) {
        $scope.$broadcast('goOutBlank', data);
    })

    $scope.$on('to_allBaseStation', function(event, data){
        $scope.$broadcast('stationItem', data);
    })
    $scope.$on('to-app-basestation',function(event,data){
        $scope.$broadcast('show-header-basestation',data);
    })
    $scope.loginGnss = function () {
        if($scope.userName && $scope.passWord) {
            Login.loginGnss($scope.userName, $scope.passWord, function (data) {
                if(data == false){
                    return $scope.loginWarning = '用户名或密码错误！'
                }
                $('body').removeClass('page-on-load');
                $scope.$broadcast('login_to_header', 'data');
                //登录成功后走
            });
            //$broadcast给子控制器传值
            $scope.$broadcast('to-sidebar-class', 'data');
        }else{
            $('#loginWarning').css('display', 'block')
            $scope.loginWarning = '请输入您的用户名或密码！'
        }
    }

    $(".login").keydown(function() {
        if (event.keyCode == "13") {
            $scope.loginGnss();
        }
    });

    var staId = localStorage.getItem('staId')
    Passport.checkLogin(staId);

}]);
