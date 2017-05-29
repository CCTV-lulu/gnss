angular.module('MetronicApp').controller('AdministratorController', function ($rootScope, $scope, $http, settingInfo, Mongodb, Prompt) {
    Mongodb.findAllUsers(function (data) {
        $scope.allUsers = data[0];
        if (data[1].allStation != undefined) {
            $scope.allStation = data[1].allStation;
        }
    });
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