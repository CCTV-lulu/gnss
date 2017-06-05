MetronicApp.directive('ngSpinnerBar', ['$rootScope', '$state',
    function ($rootScope, $state) {
        return {
            link: function (scope, element, attrs) {
                element.addClass('hide');

                $rootScope.$on('$stateChangeStart', function () {
                    element.removeClass('hide');
                });

                $rootScope.$on('$stateChangeSuccess', function (event) {
                    element.addClass('hide');
                    //$('body').removeClass('page-on-load')
                    Layout.setAngularJsSidebarMenuActiveLink('match', null, event.currentScope.$state);

                    setTimeout(function () {
                        App.scrollTop();
                    }, $rootScope.settings.layout.pageAutoScrollOnLoad);
                });

                $rootScope.$on('$stateNotFound', function () {
                    element.addClass('hide');
                });

                $rootScope.$on('$stateChangeError', function () {
                    element.addClass('hide');
                });
            }
        };
    }
]).directive('realtimeStationList', function () {
    return {
        restrict: 'EA',//属性
        template: "<li ng-repeat='station in allStations'>" +
        "<a href='javascript:;' ng-click='changeRealTimeStation(station.name,station.staId)'>" +
        "<i class='icon-flag'></i> {{station.name}} </a>" +
        "</li>"
    }//<i>标签引入Bootstrap样式图标，后为名字．然后在页面调用
}).directive('starDataStationList', function () {
    return {
        restrict: 'EA',
        template:
        "<li ng-repeat='station in allStations'>"+
        "<a href='javascript:;' ng-click='changeStartDataStation(station.name,station.staId)'>"+
        "<i class='icon-flag'></i> {{station.name}} </a>"+
        "</li>"

    }
}).directive('thresholdList', function () {
    return {
        restrict: 'EA',
        template: "<li ng-repeat='baseStation in allBaseStation'>" +
        "<a href='javascript:;' ng-click='changeThresholdBaseStation(baseStation.name,baseStation.staId)'>" +
        "<i class='icon-flag'></i> {{baseStation.name}} </a>" +
        "</li>"
    }
}).directive('signalTypeList', function () {
    return {
        restrict: 'EA',
        template:
        "<li ng-repeat='signalType in allSignalType'>"+
        "<a href='javascript:;' ng-click='changeSignalType(signalType,allSignalType[signalType])'>"+
        "<i class='icon-flag'></i> {{signalType}} </a>"+
        "</li>"
    }
}).directive('allUsersList', function () {
    return {
        restrict: 'EA',
        template:
        "<table class='table table-striped table-bordered table-hover'>"+
        "<thead>"+
        "<tr>"+
        "<th> 用户名 </th>"+
        "<th> 用户身份 </th>"+
        "<th> 用户基站 </th>"+
        "<th> 删除用户 </th>"+
        "<th> 编辑 </th>"+
        "</tr>"+
        "</thead>"+
        "<tbody>"+
        "<tr id='{{user._id}}' ng-repeat='user in allUsers'>"+
        "<td>{{user.username}}</td>"+
        "<td>{{user.roles[0]}}</td>"+
        "<td>{{user.station}}</td>"+
        "<td><button class='btn btn-sm red btn-outline' ng-click='deleteUser(user._id,user.username)'><i class='fa fa-trash-o fa-lg'></i> 删除 </button> </td>"+
        //"<td><button class='btn btn-sm blue btn-outline' ng-click='updateUser(user._id,user.username)'><i class='icon-pencil'></i> 编辑 </button></td>"+
        //"<td><button class='btn btn-primary btn-lg' data-toggle='modal' data-target='#myModal'><i class='icon-pencil'></i> 编辑</button></td>"+
        "<td><a href='javascript:void(0);' ng-click='changePassword(user._id,user.username)'> <i class='ace-icon fa fa-cog'></i>修改密码 </a>" + "</td>"+
        "</tr>"+
        "</tbody>"+
        "</table>"
    }
}).directive('integrityList', function () {
    return {
        restrict: 'EA',
        template: "<table class='table table-striped table-bordered table-hover'>" +
        "<thead>" +
        "<tr>" +
        "<th> type </th>" +
        "<th> lastTime </th>" +
        "<th> outageDuration </th>" +
        "<th> note </th>" +
        "</tr>" +
        "</thead>" +
        "<tbody>" +
        "<tr ng-repeat='integrity in integritys'>" +
        "<td>{{integrity.type}}</td>" +
        "<td>{{integrity.lastTime}}</td>" +
        "<td>{{integrity.outageDuration}}</td>" +
        "<td>{{integrity.note}}</td>" +
        "</tr>" +
        "</tbody>" +
        "</table>"
    }
}).directive('allStationList', function (Mongodb) {
    return {
        restrict: 'EA',
        template:
        "<table class='table table-striped table-bordered table-hover'>"+
        "<thead>"+
        "<tr>"+
        "<th> 基站名称 </th>"+
        "<th> 基站ID </th>"+
        //"<th> 基站 </th>"+
        "<th> 删除基站 </th>"+
        "</tr>"+
        "</thead>"+
        "<tbody>"+
        "<tr id='{{baseStation._id}}' ng-repeat='baseStation in allStation'>"+
        "<td>{{baseStation.name}}</td>"+
        "<td>{{baseStation.staId}}</td>"+
        //"<td>{{baseStation.stationName}}</td>"+
        "<td><button class='btn btn-sm red btn-outline' ng-click='deleteStation(baseStation._id,baseStation.name,baseStation.staId)'><i class='fa fa-trash-o fa-lg'></i> 删除 </button> </td>"+
        "</tr>"+
        "</tbody>"+
        "</table>"
    }
}).directive('blankStationList', function() {
    return {
        restrict: 'EA',
        template:
        "<select id='single' class='form-control select2'>"+
        "<option value='{{blankStation.staId}}' ng-repeat='blankStation in allBlankStation'>{{blankStation.name}}</option>"+
        "</select>"
    }
})




