angular.module('MetronicApp').controller('AdministratorController', function ($rootScope, $scope, $http, settingInfo, Mongodb, Prompt, UserService,userStationInfo) {

    $scope.currentUserisAdmin = false;
    init();
    function init(){
        initUsers()
    }

    $scope.$watch('isAdmin',function(isAdmin){
        if(isAdmin === true){
        $scope.station = undefined
        }

    })

    function initUsers(){
        if($rootScope.rootIsAdmin){
            return getAllUser()
        }
        getUserStation()

    }

    function getUserStation(){
        userStationInfo.getUserStationInfo(function(userStationInfo){
            $scope.userStationInfo = userStationInfo.userStationInfo
        })
    }



    function getAllUser(){
        UserService.getAllUsers(function(user){
            $scope.allUsers = user
        });
    }

    $scope.allStations = $rootScope.allStations;
    $rootScope.$watch('allStations',function(allStations){
        if(allStations==undefined) return;
        $scope.allStations = allStations

    });


    $rootScope.$watch('rootIsAdmin',function(isAdmin){
        if(isAdmin==undefined ||$scope.currentUserisAdmin == isAdmin) return ;
        $scope.currentUserisAdmin = isAdmin

    });


    $scope.$watch('station',function(station){
        if(station){
            $scope.isAdmin = false
        }
    });

    $scope.addUser = function(){
        var station = $scope.station;
        var isAdmin = $scope.isAdmin;
        var userName = $scope.username;
        var passWord = $scope.password;
        if(!userName||!passWord){
            return Prompt.promptBox('warning', '请输入用户名或密码！')
        }
        if(!station&&!isAdmin){
            return Prompt.promptBox('warning', '普通用户需要绑定基站！')
        }
        if(station&&isAdmin){
            return Prompt.promptBox('warning', '管理员不能绑定基站！')
        }
        if ($scope.username && $scope.password ) {
            UserService.addUser($scope.username, $scope.password, station,isAdmin, function (data) {
                if(!data.status){
                    clearInput()
                    $scope.station = undefined;
                    $scope.isAdmin = false
                    return Prompt.promptBox('warning', data.message)
                }
                initUsers();
                Prompt.promptBox('success', "添加用户成功！");
                clearInput()
                $scope.isAdmin = false
                $scope.station = undefined

            })
        }

    };


    $scope.showChangePassword = function(useId, username){
        $("#navbar_edit").modal('show');

        $scope.changeUserName = username;
        $scope.changeUserId = useId

    }
    $scope.changePassword = function(){
        if(!$scope.newPassword||!$scope.rePassword||($scope.rePassword!=$scope.newPassword)){
            return alert('请检查密码')
        }
        UserService.changePassword($scope.changeUserName, $scope.newPassword,function(result){
            if(result.status){
                $("#navbar_edit").modal('hide');
                Prompt.promptBox('success','修改成功')
            }else{
                $("#password").val('')
                $("#newpassword").val('')
                return alert( result.message)
            }

        })
    };

    function clearInput(){
        $("#name-info").val('');
        $("#pass-info").val('')
    }


    $scope.deleteUser = function (id, username) {

        UserService.deleteUser(username,function(result){
            if(result.status == false){
                return Prompt.promptBox("warning", result.message)
            } else {
                Prompt.promptBox("success", result.message);
                for (var i = 0; i < $scope.allUsers.length; i++) {
                    if ($scope.allUsers[i]._id == id) {
                        $scope.allUsers.splice(i, 1)
                    }
                }
            }
        });
    }


    /*===========================*/


    $scope.$on('logout', function (event, url) {
        $scope.$emit('logout-connect-app', 'data')

    });


    $scope.addStation = function () {
        if ($scope.name && $scope.staId) {
            Mongodb.addStation($scope.name, $scope.staId, function (result) {
                if (result.status == false) {
                    $("#station-name").val('');
                    $("#station-id").val('');
                    Prompt.promptBox('warning', result.message)
                } else {
                    $rootScope.allStations = result.allStations;
                    $scope.allStations = result.allStations;
                    Prompt.promptBox('success', '基站创建成功');
                    $("#station-name").val('');
                    $("#station-id").val('');
                }
            })
        } else {
            Prompt.promptBox('warning', '请输入基站信息！')
        }
    }

    $scope.deleteStation = function (id,name, staId) {
        Mongodb.deleteStation(name, staId, function () {
            Mongodb.getStation(function (data) {
                initUsers();
                $scope.allStations = data;
                $rootScope.allStations  = data

            })
        });
    }
});