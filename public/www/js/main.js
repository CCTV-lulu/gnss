var MetronicApp = angular.module("MetronicApp", [
    "ui.router",
    "ui.bootstrap",
    "oc.lazyLoad",
    "ngSanitize",
    'ngCookies'
]);

MetronicApp.config(['$ocLazyLoadProvider', function ($ocLazyLoadProvider) {
    $ocLazyLoadProvider.config({});
}]);

MetronicApp.config(['$controllerProvider', function ($controllerProvider) {
    $controllerProvider.allowGlobals();
}]);

MetronicApp.factory('settings', ['$rootScope', function ($rootScope) {
    var settings = {
        layout: {
            pageSidebarClosed: false,
            pageContentWhite: true,
            pageBodySolid: false,
            pageAutoScrollOnLoad: 1000
        },
        assetsPath: 'assets',
        //globalPath: 'asset/global',
        layoutPath: 'assets/layout2',
    };

    $rootScope.settings = settings;

    return settings;
}]);

MetronicApp.config(['$stateProvider', '$httpProvider', '$urlRouterProvider', function ($stateProvider, $httpProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise("/login");

    $httpProvider.defaults.headers.common = {};
    $httpProvider.defaults.headers.post = {};
    $httpProvider.defaults.headers.put = {};
    $httpProvider.defaults.headers.patch = {};

    $stateProvider

        .state('dashboard', {
            url: "/dashboard",
            templateUrl: "views/dashboard.html",
            data: {pageTitle: 'Admin Dashboard Template'},
            controller: "dashboardController",
            resolve: {
                deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        name: 'MetronicApp',
                        insertBefore: '#ng_load_plugins_before',
                        files: [
                            'assets/morris/morris.css',
                            'assets/morris/morris.min.js',
                            'assets/morris/raphael-min.js',
                            'assets/jquery.sparkline.min.js',
                            'assets/dashboard.min.js',
                            'assets/echarts/echarts.js',
                            'js/controllers/DashboardController.js'
                        ]
                    });
                }]
            }
        })

        .state('blank', {
            url: "/blank",
            templateUrl: "views/blank.html",
            data: {pageTitle: 'Blank Page Template'},
            controller: "BlankController",
            resolve: {
                deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        name: 'MetronicApp',
                        insertBefore: '#ng_load_plugins_before',
                        files: [
                            'js/controllers/BlankController.js'
                        ]
                    });
                }]
            }
        })

        .state('threshold', {
            url: '/threshold',
            templateUrl: "views/threshold.html",
            data: {pageTitle: "Threshold Page Template"},
            controller: "ThresholdController",
            resolve: {
                deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        name: 'MetronicApp',
                        insertBefore: '#ng_load_plugins_before',
                        files: [
                            'js/controllers/ThresholdController.js'
                        ]
                    });
                }]
            }
        })

         .state('datahandle', {
            url: '/datahandle',
            templateUrl: "views/datahandle.html",
            data: {pageTitle: "Datahandle Page Template"},
            controller: "DataHandleController",
            resolve: {
                deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        name: 'MetronicApp',
                        insertBefore: '#ng_load_plugins_before',
                        files: [
                            'js/controllers/DataHandleController.js'
                        ]
                    });
                }]
            }
        })

        .state('warning', {
            url: '/warning',
            templateUrl: "views/warning.html",
            data: {pageTitle: "Warning Page Template"},
            controller: "WarningController",
            resolve: {
                deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        name: 'MetronicApp',
                        insertBefore: '#ng_load_plugins_before',
                        files: [
                            'js/controllers/WarningController.js'
                        ]
                    });
                }]
            }
        })

        .state('stardata', {
        url: '/stardata',
        templateUrl: "views/stardata.html",
        data: {pageTitle: "StarData Page Template"},
        controller: "StarDataController",
        resolve: {
            deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                return $ocLazyLoad.load({
                    name: 'MetronicApp',
                    insertBefore: '#ng_load_plugins_before',
                    files: [
                        'js/controllers/StarDataController.js'
                    ]
                });
            }]
        }
    })

        .state('administrator', {
            url: '/administrator',
            templateUrl: "views/administrator.html",
            data: {pageTitle: 'Administrator Page Template'},
            controller: "AdministratorController",
            resolve: {
                deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        name: 'MetronicApp',
                        insertBefore: '#ng_load_plugins_before',
                        files: [
                            'js/controllers/AdministratorController.js'
                        ]
                    });
                }]
            }
        }).state('login',{
            url:"/login",
            templateUrl:"views/login.html",
            controller: 'loginController',
            resolve: {
                deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        name: 'MetronicApp',
                        insertBefore: '#ng_load_plugins_before',
                        files: [
                            'js/controllers/loginController.js'
                        ]
                    });
                }]
            }


        })

}]);

MetronicApp.run(["$rootScope", "settings", "$state", function ($rootScope, settings, $state) {
    $rootScope.$state = $state;
    $rootScope.$settings = settings;
}]);

