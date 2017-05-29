MetronicApp.factory('Show', function ($rootScope) {
    var isShowLogin = function (isShow) {
        $rootScope.indexPage = !isShow;
        $rootScope.loginPage = isShow;
    };
    var isShowAdmin = function (req) {
        if((req.roles||[]).indexOf('admin')>=0 ) {
            $rootScope.adminShow = true;
        } else {
            $rootScope.adminShow = false;
        }
    }
    //判断是否为管理员,控制权限及页面显示
    return {isShowLogin: isShowLogin,isShowAdmin: isShowAdmin};

}).factory('Login', function ($http, Mongodb, $rootScope, $location,Prompt, Passport, settingInfo, signalTypeInfo, signalTypObj, Show, httpRequest) {
    var url = "http://" + settingInfo.server + ":" + settingInfo.port;
    var loginGnss = function (userName, passWord, cb) {
        localStorage.setItem("userName", userName)//存到本地
        var loginData = {
            username: userName,
            password: passWord
        }
        var loginGnssUrl = url + "/login"
        httpRequest.post(loginGnssUrl, loginData, function(result) {
            if (result) {
                Show.isShowAdmin(result);
                cb()
            }else if(result == false) {
                $('#loginWarning').css('display', 'block')
                cb(false)
            }
        })

    }
    return {loginGnss: loginGnss};

}).factory('Passport', function (Show, $http, $location, $rootScope, settingInfo, httpRequest,Prompt) {
    var url = "http://" + settingInfo.server + ":" + settingInfo.port;
    var checkLogin = function (staId) {
        var checkLoginUrl = url + "/checkLogin"
        httpRequest.httpGet(checkLoginUrl, function(data) {
                Show.isShowLogin(false);
                Show.isShowAdmin(data);
                $('body').removeClass('page-on-load');
            //除掉后加载页面具体内容
                $rootScope.activeUser = localStorage.getItem("userName");
                if ($location.path() == "/login") {
                    $location.path('/dashboard.html/' + staId)
                } else {
                    $location.path($location.path())
                }

        })
    }
//setItem创建本地存储，getItem获取本地存储，
    var logout = function (cb) {
        cb = cb || function () {}
        var logoutUrl = url + "/logout"
        httpRequest.httpGet(logoutUrl, function(data) {
            cb();
        })
    }
    return {checkLogin: checkLogin, logout: logout};
})