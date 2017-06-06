MetronicApp.controller('SidebarController', ['$state', '$scope', '$location', 'Mongodb', function ($state, $scope, $location) {
    //window.onload = function () {
    //    juadgePage();
    //};
    //
    //function juadgePage() {
    //    var nowPage = $location.path();
    //    if(nowPage == '/blank' || nowPage == '/threshold' || nowPage == '/stardata' || nowPage == '/administrator') {
    //        var sideBarId = nowPage.substring(1);
    //        $('#' + sideBarId).attr('class', 'nav-item active');
    //    } else {
    //        $('#dashboard').attr('class', 'nav-item active');
    //    }
    //}
    //
    //$scope.$on('dashTo_Sidebar', function(event, data) {
    //    $('#dashboard').attr('class', 'nav-item active');
    //})
    //
    //$scope.$on('$includeContentLoaded', function () {
    //    Layout.initSidebar($state);
    //});
    //
    //$scope.$on('to-sidebar', function (data) {
    //    dashboardBar('dashboard');
    //})
    //
    //$scope.$on('to-sidebar-class', function (data) {
    //    $scope.$emit('hideHearerStation','dashboard');
    //    $("#dashboard").attr('class', 'nav-item active')
    //});



    $scope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
        $("#" + toState.name).addClass('active');
    })
    $scope.dataConnect = function (url) {


        $("li.nav-item").removeClass('active');
        $("#" + url).addClass('active');
        $state.go(url);

        //$scope.$emit('hideHearerStation', url);
        //var pathUrl = $location.path();
        //    if (pathUrl.match('dashboard.html') == 'dashboard.html') {
        //        changClass();
        //        $("#" + url).attr('class', 'nav-item active')
        //        $scope.$emit('disconnect-to-parent', '/' + url);
        //    } else if (pathUrl == '/stardata' && url != 'stardata') {
        //        changClass();
        //        $("#" + url).attr('class', 'nav-item active')
        //        $scope.$emit('goOutStartdataPage', '/' + url);
        //    }else if(pathUrl == '/blank' && url != 'blank') {
        //        changClass();
        //        $("#" + url).attr('class', 'nav-item active')
        //        $scope.$emit('goOutBlankPage', '/' + url)
        //    } else {
        //        changClass();
        //        $("#" + url).attr('class', 'nav-item active')
        //        $location.path('/' + url);
        //    }
    }

    function changClass() {
        var sideBarArr = ['dashboard', 'blank', 'threshold', 'stardata', 'administrator'];
        for (var i = 0; i < sideBarArr.length; i++) {
            var sideBarClass = $('#' + sideBarArr[i]).attr('class');
            if (sideBarClass == 'nav-item active') {
                $('#' + sideBarArr[i]).attr('class', 'nav-item');
            }
        }
    }

    //function dashboardBar(url) {
    //
    //    var pathUrl = $location.path();
    //    if (pathUrl == '/stardata') {
    //        changClass();
    //        $("#" + url).attr('class', 'nav-item active')
    //        $scope.$emit('goOutStartdataPage', url);
    //        $scope.$emit('hideHearerStation','dashboard');
    //    }else if(pathUrl == '/blank'){
    //        changClass();
    //        $("#" + url).attr('class', 'nav-item active')
    //        $scope.$emit('goOutBlankPage', url)
    //        $scope.$emit('hideHearerStation','dashboard');
    //    }else{
    //        $scope.$emit('hideHearerStation','dashboard');
    //        changClass();
    //        $("#" + url).attr('class', 'nav-item active')
    //        $location.path("/dashboard.html/" + localStorage.getItem("staId"))
    //    }
    //
    //
    //}

    //$scope.goToDashboard = function (url) {
    //    dashboardBar(url);
    //}

}]);