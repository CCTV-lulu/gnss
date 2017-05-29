MetronicApp.controller('FooterController',function ($scope) {
    $scope.$on('$includeContentLoaded', function () {
        Layout.initFooter();
    });
});