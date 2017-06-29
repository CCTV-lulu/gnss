MetronicApp.controller('loginController', ['$state', '$scope', '$location', 'Show','$rootScope', function ($state, $scope, $location, Show, $rootScope) {
    $('body').addClass('page-on-load');
    Show.isShowLogin(true);
    Show.isShowAdmin({});
    localStorage.removeItem(localStorage.getItem('userName')+'_current_result_path')
    localStorage.removeItem('userName');
    $rootScope.activeUser = undefined;
    $rootScope.rootUserInfo = undefined;
    $rootScope.warnning = undefined;
    if ($rootScope.client) {
        $rootScope.client.disconnect();
        $rootScope.client = undefined
    }
}])