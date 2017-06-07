angular.module('MetronicApp').controller('AdministratorController', function ($rootScope, $scope, $http, settingInfo, Mongodb, Prompt, UserService) {
    init()
    function init(){
        $scope.isAdmin = false;
        initUsers()
    }
    function initUsers(){
        UserService.getAllUsers(function(user){
            $scope.allUsers = user
        });
    }
    $scope.allStations = $rootScope.allStations;
    $rootScope.$watch('allStations',function(allStations){
        if(allStations==undefined) return;
        $scope.allStations = allStations

    });
    $scope.$watch('isAdmin',function(isAdmin){
        if(isAdmin){
            $scope.station = ''
        }
    })
    $scope.$watch('station',function(station){
        if(station){
            $scope.isAdmin = false
        }
    })

    $scope.addUser = function(){
        var station = $scope.station;
        var isAdmin = $scope.isAdmin
        if(!station&&!isAdmin){
            return Prompt.promptBox('warning', '普通用户需要绑定基站！')
        }
        if(station&&isAdmin){
            return Prompt.promptBox('warning', '管理员不能绑定基站！')
        }
        if ($scope.username && $scope.password ) {
            UserService.addUser($scope.username, $scope.password, station,isAdmin, function (data) {

                if(!data.status){
                    return Prompt.promptBox('warning', data.message)
                }

                initUsers()
                Prompt.promptBox('success', "添加用户成功！");
                //$scope.allUsers.push(data);
                clearInput()

            })
        } else {
            Prompt.promptBox('warning', '请输入用户名或密码！')

        }

    };




    $scope.$on('logout', function (event, url) {
        $scope.$emit('logout-connect-app', 'data')
        //$('body').addClass('page-on-load');
        //location.reload(true)
    });

    $scope.addUsers = function () {
        var admin = document.getElementsByName('admin');
        if (admin[0].checked) {
            if ($scope.username && $scope.password) {
                Mongodb.addUsers($scope.username, $scope.password, admin, function (data) {
                    if (data == "用户名已存在！") {
                        Prompt.promptBox('warning', data)
                    } else {
                        $scope.config($scope.name)
                        Mongodb.findAllUsers(function (data) {
                            $scope.allUsers = data[0];
                        });
                        var message = "添加用户成功！"
                        Prompt.promptBox('success', message)
                        $scope.allUsers.push(data)
                        $("#name-info").val('')
                        $("#pass-info").val('')
                    }
                })
            } else {
                Prompt.promptBox('warning', '请输入用户名或密码！')
            }
        } else {
            var station = $scope.station;
            if ($scope.username && $scope.password && station) {
                Mongodb.addUsers($scope.username, $scope.password, station, admin, function (data) {
                    if (data == "用户名已存在！") {
                        Prompt.promptBox('warning', data)
                    } else {
                        $scope.config($scope.name, $scope.staId)
                        Mongodb.findAllUsers(function (data) {
                            $scope.allUsers = data[0];
                        });
                        var message = "添加用户成功！"
                        Prompt.promptBox('success', message)
                        $scope.allUsers.push(data)
                        $("#name-info").val('')
                        $("#pass-info").val('')
                    }
                })
            } else {
                Prompt.promptBox('warning', '请输入用户名或密码！')

            }
        }
    };




    function clearInput(){
        $("#name-info").val('');
        $("#pass-info").val('')
    }




    $scope.changePassword = function(){
        $("#navbar_edit").modal({
            backdrop :'static'
        });
        Mongodb.changePassword(function(data){
            //console.log(data)
        });
    }
    $scope.deleteUser = function (id, username) {
        for (var i = 0; i < $scope.allUsers.length; i++) {
            if ($scope.allUsers[i]._id == id) {
                $scope.allUsers.splice(i, 1)
            }
        }
        Mongodb.deleteUser(username);
        document.getElementById(id).remove();
    }
    $scope.addStation = function () {
        if ($scope.name && $scope.staId) {
            Mongodb.addStation($scope.name, $scope.staId, function (data) {
                if (data.status == false) {
                    var remindItem = '基站已存在！'
                    Prompt.promptBox('warning', remindItem)
                } else {
                    $scope.allStation.push(data.station);
                    var remindItem = '基站创建成功！'
                    Prompt.promptBox('success', remindItem)
                    $("#station-name").val('')
                    $("#station-id").val('')
                    $("#station-info").val('')
                }
            })
        } else {
            Prompt.promptBox('warning', '请输入基站信息！')
        }
    }
    $scope.config = function (username, staId) {
        Mongodb.getConfig(username, staId, function (data) {

        })

    }
    $scope.deleteStation = function (id,name, staId) {
        Mongodb.deleteStation(name, staId, function () {
            Mongodb.getStation(function (data) {
                $scope.allStation = data;
            })
        });
        //Mongodb.findAllUsers(function (data) {
        //    $scope.allUsers = data[0];
        //});
        document.getElementById(id).remove();
        for (var i = 0; i < $scope.allUsers.length; i++) {
            if ($scope.allUsers[i].station == staId) {
                var id = $scope.allUsers[i]._id;
                document.getElementById(id).remove();
            }
        }
        localStorage.removeItem('thresholdBastation')
        for (var i = 0; i < $scope.allStation.length; i++) {
            if ($scope.allStation[i]._id == id) {
                $scope.allStation.splice(i, 1)
            }
        }
    }
});