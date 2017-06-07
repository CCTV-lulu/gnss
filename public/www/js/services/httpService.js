MetronicApp.factory('Mongodb', function ($http, $location, settingInfo, Prompt, Passport, httpRequest) {
    var url = "http://" + settingInfo.server + ":" + settingInfo.port;
    var setUserStaId = function (staId, userName, staName, signalType,signalTypeId,startBaseStation,startStaId) {
        var data = {
            staId: staId,
            userName: userName,
            staName: staName,
            signalType: signalType,
            signalTypeId:signalTypeId,
            startBaseStation:startBaseStation,
            startStaId:startStaId
        };
        var setUserStaIdUrl = url + "/userStaId";
        httpRequest.post(setUserStaIdUrl, data, function(data) {
            if(data.status == false){
                return Prompt.promptBox("warning", data.message)
            } else {
                $location.path('/dashboard.html/' + staId)
            }
        })

    }

    var setUserStartStaId = function (staId, userName, staName, signalType,signalTypeId,startBaseStation,startStaId) {
        var data = {
            staId: staId,
            userName: userName,
            staName: staName,
            signalType: signalType,
            signalTypeId:signalTypeId,
            startBaseStation:startBaseStation,
            startStaId:startStaId
        }
        var setUserStartStaIdUrl = url + "/userStartStaId"
        httpRequest.post(setUserStartStaIdUrl, data, function(data) {
            if(data.status == false){
                return Prompt.promptBox("warning", data.message)
            }
        })
    }
    var getUserStaId = function (cb) {
        cb = cb || function () {}
        var getUserStaIdUrl = url + "/userStaId"
        httpRequest.httpGet(getUserStaIdUrl, function(req) {
            if(req.status == false){
                return Prompt.promptBox("warning", req.message)
            }else {
                cb(req)
            }
        })
    }

    var findAllUsers = function (callback) {
        var findAllUsersUrl = url + "/findAllUsers"
        httpRequest.httpGet(findAllUsersUrl, function(data) {
            if(data.status == 400){
                Prompt.promptBox("warning", data.message)
            }else{
                getUserStaId(function(result) {
                    var test = []
                    test.push(data);
                    test.push(result)
                    callback(test)
                })
            }
        })
    }


    var addUsers = function (username, password,station, admin, callback) {
        var data = {
            username: username,
            password: password,
            station: station,
            type: JSON.stringify(admin[0].checked)
        }
        var addUsersUrl = url + "/addUser"
        httpRequest.post(addUsersUrl, data, function(data) {
            if(data.status == false){
                Prompt.promptBox("warning", data.message)
            }else{
                callback(data)
            }
        })
    }
    var deleteUser = function (username) {
        var data = {
            username: username
        }
        var deleteUserUrl = url + "/deleteUser"
        httpRequest.post(deleteUserUrl, data, function(data) {
            if(data.status == false){
                return Prompt.promptBox("warning", data.message)
            } else {
                Prompt.promptBox("success", data)
            }
        })
    }
    var addStation = function(name,staId, cb) {
        var data = {
            name: name,
            staId: staId
        };
        var addStationUrl = url + "/addStation";
        httpRequest.post(addStationUrl, data, function(data) {
           cb(data)
        })
    }
    var getConfig = function(name,staId, cb) {
        cb = cb || function () {}
        var data = {
            name: name,
            staId: staId
            //stationName: stationName
        }
        var getAllConfigUrl = url + "/StationConfig"
        httpRequest.post(getAllConfigUrl, data, function(data) {
            cb(data)
        })
    }
    var deleteStation = function(name, staId,cb) {
        var data = {
            name: name,
            staId: staId
            //stationName:stationName
        }
        var deleteStationUrl = url + "/deleteStation"
        httpRequest.post(deleteStationUrl, data, function(data) {
            if (data.status == 400) {
               return Prompt.promptBox("warning", data.message)
            } else if (data.status == true) {
                var remind = '删除基站成功！'
                Prompt.promptBox("success", remind)
                cb()
            }
        })

    }
    var findSatData = function (testData, cb) {
        cb = cb || function () {}
        var findSatDataUrl = url + "/findSatData"
       httpRequest.post(findSatDataUrl, testData, function(data) {
           cb(data);
       })
    }

    var downloadSatData = function (cb) {
        cb = cb || function () {}
        var downloadSatDataUrl = url + "/downloadStaData"
        httpRequest.httpGet(downloadSatDataUrl, function(data) {
            cb(data);
        })
    }
    var getUserFindStaData = function (cb) {
        cb = cb || function () {}
        var findSatDataUrl = url + "/getUserFindStaData"
        httpRequest.httpGet(findSatDataUrl,function(data) {
            cb(data);
        })
    };

    var getStation = function (cb) {
        cb = cb || function () {};
        var getStationUrl = url + "/getStation"
        httpRequest.httpGet(getStationUrl, function(data) {
            if(data.status == 400){
              return  Prompt.promptBox("warning", data.message)
            } else {
                cb(data)
            }
        })
    };


    return {
        setUserStaId: setUserStaId,setUserStartStaId:setUserStartStaId,
        getUserStaId: getUserStaId, findAllUsers: findAllUsers, addUsers: addUsers, deleteUser: deleteUser,
        findSatData: findSatData, addStation: addStation, getStation: getStation, deleteStation: deleteStation,
        getUserFindStaData:getUserFindStaData,downloadSatData:downloadSatData,
        getConfig:getConfig

    };

}).factory("getCommitThreshold", function ($rootScope, $http, $location, settingInfo, httpRequest, Prompt, Mongodb) {
    var url = "http://" + settingInfo.server + ":" + settingInfo.port;
    var threshold = function (staName,cb) {
        cb = cb || function () {}
        var userName = localStorage.getItem('userName')
        var data = {
            userName: userName,
            staName: staName
        }
        var thresholdUrl = url + "/getStaThreshold"
        httpRequest.post(thresholdUrl, data, function(data) {
            if(data.status == 400){
                return Prompt.promptBox("warning", data.message)
            } else {
                cb(data);
            }
        })
    }
    var setStaThreshold = function(staName, username, Threshold) {
        var setThreshold = {
            staName:staName,
            username:username,
            Threshold:Threshold
        }
        var setStaThresholdUrl = url + "/setStaThreshold"
        httpRequest.post(setStaThresholdUrl, setThreshold, function(data) {
            if(data.status == 400||data.status == false){
               return  Prompt.promptBox("warning", data.message)
            } else {
                Prompt.promptBox("success", '修改成功！！')
                $location.path('/threshold')
            }
        })
    }
    var getUserStaId = function (callback) {
        var getUserStaIdUrl = url + "/userStaId"
        httpRequest.httpGet(getUserStaIdUrl, function(req) {
            if(req.status == false){
                return Prompt.promptBox("warning", data.message)
            } else if(req == false) {
                Mongodb.getStation(function (stationInfo) {
                    $location.path('/dashboard.html/' + stationInfo[0].staId)
                })
            }else {
                //console.log(req)
                if(req.allStation[0] != undefined) {
                    $rootScope.station = localStorage.getItem('thresholdBastation') || req.allStation[0].name;
                    var staName = $rootScope.station;
                    localStorage.setItem('thresholdBastation', staName);
                    threshold(staName, function (data) {
                        var arr = [];
                        var Threshold = data.staThreshold;
                        arr.push(req.allStation);
                        arr.push(Threshold)
                        callback(arr);
                    })
                }else if(req.allStation[0] == undefined){
                    var userSta = []
                    userSta.push(req.userStation)
                    $rootScope.station = localStorage.getItem('thresholdBastation') || req.userStation.name;
                    var staName = $rootScope.station;
                    localStorage.setItem('thresholdBastation', staName);
                    threshold(staName, function (data) {
                        var arr = [];
                        var Threshold = data.staThreshold;
                        arr.push(userSta);
                        arr.push(Threshold)
                        callback(arr);
                    })

                }else {
                    $rootScope.station = undefined;
                    callback(false)
                }
            }
        })
    }
    return {threshold: threshold, setStaThreshold: setStaThreshold,getUserStaId: getUserStaId};
}).factory("getStationStatus", function ($http, settingInfo, Passport, httpRequest, Prompt) {
    //对数据分类处理
    //整理数据

    function PosR(){
        this.stat=0;//定位结果状态
        this.week= 0;//定位时间GPS周
        this.tow= 0;//定位时间GPS周内秒
        this.time= "";//定位结果对应的年月日时间
        this.X= 0;//定位结果，ECEF坐标
        this.Y= 0;
        this.Z= 0;
        this.dX= 0;//定位误差，本地坐标系下水平东向
        this.dY= 0;//北向
        this.dZ= 0;//垂向
        this.Lat= 0;//定位结果纬度
        this.Lon= 0;//定位结果经度
        this.H= 0;//定位结果高程
        this.GDOP= 0;//几何精度GDOP
        this.PDOP= 0;//
        this.HDOP= 0;
        this.VDOP= 0;
        this.VPL= 0;//定位垂直保护水平
        this.HPL= 0;//定位水平保护水平
        this.posNum= 0;//定位卫星数
        this.trackNum=0;//当前跟踪卫星数
        this.exsats= "";//定位排除的卫星
        this.minEl= 0;//最小卫星仰角
        this.navsys=[];//定位卫星系统

    }
    var mapping = function (logJSON, dataId, timestamp) {
        var algoIn = logJSON.satR,//原始数据[28]
            algoOut = logJSON.posR;//

        var webIn = {
            posR: algoOut,
            timestamp: timestamp,//时间戳
            time: logJSON.time,
            dataId: dataId,//id
            obsinfo:[],
            satpos:{gpsatpos:[],glsatpos:[],bdsatpos:[]},
            SNY:{gpsSNY:[[],[]],glsSNY:[[],[]],bdsSNY:[[],[]]}
        };
        for(var i in webIn.posR){
            if(webIn.posR[i].stat ==0){
                webIn.posR[i] =  new PosR()
            }
        }

        //console.log(webIn.satpos)
        //console.log(algoIn)
        //algoIn数组里包含对象
        //原始数据
        for (var i=0;i<algoIn.length;i++) {
            var obs = algoIn[i];
            //console.log(obs)
            //原始数据
            var obsinfo = obs;
            webIn.obsinfo.push(obsinfo);
            if (0 === obs.sys) {
                //gps

                var gpsatpos = {
                    x: obs.Azi ,//x方位角
                    y: obs.Ele ,//y 仰角

                    id: obs.sat//型号卫星id
                }

                webIn.SNY.gpsSNY[0].push([obs.sat.toString(), obs.SNR[0]]);
                webIn.SNY.gpsSNY[1].push([obs.sat.toString(), obs.SNR[1]]);
                webIn.satpos.gpsatpos.push(gpsatpos);//push到webin，放到大对象里

            } else if (1 === obs.sys) {

                var glsatpos = {
                    //gls
                    x: obs.Azi ,
                    y: obs.Ele,
                    SNR:{1:[obs.sat, obs.SNR[0]],2:[obs.sat, obs.SNR[1]]},
                    id: obs.sat
                };
                webIn.SNY.glsSNY[0].push([obs.sat.toString(), obs.SNR[0]]);
                webIn.SNY.glsSNY[1].push([obs.sat.toString(), obs.SNR[1]]);
                webIn.satpos.glsatpos.push(glsatpos);

            } else if (2 === obs.sys) {
                //北斗
                var bdsatpos = {
                    x: obs.Azi ,
                    y: obs.Ele,
                    SNR:{1:[obs.sat, obs.SNR[0]],2:[obs.sat, obs.SNR[1]]},
                    id: obs.sat
                }
                webIn.SNY.bdsSNY[0].push([obs.sat.toString(), obs.SNR[0]]);
                webIn.SNY.bdsSNY[1].push([obs.sat.toString(), obs.SNR[1]]);
                webIn.satpos.bdsatpos.push(bdsatpos);

            }
//星空图里三个的具体数据
        }
        webIn.SNY.gpsSNY[0].sort(sortByindexOne)
        webIn.SNY.gpsSNY[1].sort(sortByindexOne)
        webIn.SNY.glsSNY[0].sort(sortByindexOne)
        webIn.SNY.glsSNY[1].sort(sortByindexOne)
        webIn.SNY.bdsSNY[0].sort(sortByindexOne)
        webIn.SNY.bdsSNY[1].sort(sortByindexOne)

        function sortByindexOne(a,b){
            return a[0]-b[0]
        }

        return webIn;
    }
    function sortNumber(a, b)
    {
        return a - b
    }
    var getStationStatus = function (staId, limit, cb) {
        cb = cb || function () {}
        var getStationStatusUrl = "http://" + settingInfo.server + ":" + settingInfo.port + "/getStationStatus?staId=" + staId + "&limit=" + limit
        httpRequest.httpGet(getStationStatusUrl, function(req) {
            if(req.status == 400){
               return Prompt.promptBox("warning", data.message)
            } else if(req.stationData) {
                    var result = [];
                    var stationData = [];
                    req.stationData.forEach(function (fileData) {

                        var data = fileData
                        //var data = JSON.parse(fileData);

                        data = mapping(data.data, data._id, data.data.time)
                        stationData.push(data)
                    });
                    var by = function(name){
                        return function(o, p){
                            var a, b;
                            if (typeof o === "object" && typeof p === "object" && o && p) {
                                a = o[name];
                                b = p[name];
                                if (a === b) {
                                    return 0;
                                }
                                if (typeof a === typeof b) {
                                    return a < b ? 1 : -1;
                                }
                                return typeof a < typeof b ? 1 : -1;
                            }
                            else {
                                throw ("error");
                            }
                        }
                    };
                    req.stationData = stationData.sort(by('timestamp'))//按照时间戳排序
                    cb(req);

            }else{
                cb(req);
            }
        })
        var userName = localStorage.getItem('userName')
    };
    return {getStationStatus: getStationStatus};
})
    .factory("httpRequest",function($http, $rootScope, Show, $location, settingInfo){
    var post = function(url, data, cb) {
        var req = {
            url: url,
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            withCredentials: true,
            data: data
        }
        $http(req).success(function (result) {
            if(result.bool == false) return logout();
            cb(result)
        }).error(function () {
            cb(false)
            return logout();
        })
    }
    var httpGet = function(url, cb) {
        $http.get(url, {withCredentials: true}).success(function(result){
            if(result.bool == false) return logout();
            cb(result)
        }).error(function (req) {
            cb(false)
            return logout();
        })
    }

    function logout (){
        localStorage.clear();
        var sideBarArr = ['dashboard', 'blank', 'threshold', 'stardata', 'administrator'];
        for (var i = 0; i < sideBarArr.length; i++) {
            var sideBarClass = $('#' + sideBarArr[i]).attr('class');
            if (sideBarClass == 'nav-item active') {
                $('#' + sideBarArr[i]).attr('class', 'nav-item');
            }
        }
        $location.path('/login');
    }

    return {post: post, httpGet: httpGet}
})
    .factory('userStationInfo', function ($http, $location, settingInfo, Prompt, Passport, httpRequest) {
        var url = "http://" + settingInfo.server + ":" + settingInfo.port;
        function updateUserStationInfo(data){
            var setUserStartStaIdUrl = url + "/updateUserStationInfo";
            httpRequest.post(setUserStartStaIdUrl, data, function(result) {
                if(result.status == false){
                    return Prompt.promptBox("warning", result.message)
                }
                cb(result)
            });
        }

        function getUserStationInfo(cb){
            var setUserStartStaIdUrl = url + "/getUserStationInfo";
            httpRequest.httpGet(setUserStartStaIdUrl, function(result) {
                if(result.status == false){
                    return Prompt.promptBox("warning", result.message)
                }
                cb(result)
            });
        }

        return {
            updateUserStationInfo: updateUserStationInfo,
            getUserStationInfo: getUserStationInfo

        };

    })
    .factory('UserService',function($http, $location, settingInfo, Prompt, Passport, httpRequest){
        var url = "http://" + settingInfo.server + ":" + settingInfo.port;
        var addUser = function (username, password,station, isadmin, callback) {

            var data = {
                username: username,
                password: password,
                type: JSON.stringify(isadmin),
                station: station
            };
            var addUsersUrl = url + "/addUser";
            httpRequest.post(addUsersUrl, data, function(data) {
                callback(data)
            })
        };
        var getAllUsers = function(cb){
            var findAllUsersUrl = url + "/findAllUsers";
            httpRequest.httpGet(findAllUsersUrl, function(data) {
                if(!data.status){
                    return Prompt.promptBox("warning", data.message)
                }
                cb(data.users)


            })
        };
        function changePassword(userId, password,cb){
            var data = {
                userId: userId,
                password: password
            };
            var addUsersUrl = url + "/changePassword";
            httpRequest.post(addUsersUrl, data, function(data) {
                cb(data)
            })
        }
        function deleteUser(username, cb){
                var data = {
                    username: username
                };
                var deleteUserUrl = url + "/deleteUser";
                httpRequest.post(deleteUserUrl, data, function(data) {
                    cb(data)
                })
        }
        return {
            addUser: addUser,
            getAllUsers: getAllUsers,
            changePassword: changePassword,
            deleteUser: deleteUser
        }
    });

