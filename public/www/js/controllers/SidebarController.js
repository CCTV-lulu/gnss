MetronicApp.controller('SidebarController', ['$state', '$scope', '$location', 'Mongodb', function ($state, $scope, $location) {




    $scope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
        $("li.nav-item").removeClass('active');
        $("#" + toState.name).addClass('active');
    })
    $scope.dataConnect = function (url) {


        $("li.nav-item").removeClass('active');
        $("#" + url).addClass('active');
        $state.go(url);


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

    $(window).resize(function() {
        var width = $(this).width();
        if(width<1000){
            $scope.width=true;
        }
        else {
            $scope.width=false;
        }

    })

    

}]);