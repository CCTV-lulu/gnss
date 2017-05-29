MetronicApp.controller('loginController', ['$state', '$scope', '$location','Show', function ($state, $scope, $location,Show) {
    $('body').addClass('page-on-load');
    Show.isShowLogin(true);
    Show.isShowAdmin({});
    localStorage.clear();
}])