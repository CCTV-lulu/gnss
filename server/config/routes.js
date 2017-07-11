var auth = require('./auth'),
    controllers = require('../controllers');

module.exports = function (app) {
    app.post('/login', auth.login);
    app.get('/logout', auth.logout);
    app.get('/checkLogin', auth.isAuthenticated);

    app.get('/', function (req, res) {
        res.redirect('/www/index.html');
    });


    //app.post('/staThreshold', controllers.station.saveThreshold);


    app.post('/userStaId', auth.isInRole('user'), controllers.station.updateStaId);
    app.post('/userStartStaId', auth.isInRole('user'), controllers.station.updateStaId);


    app.get('/userStaId', auth.isInRole('user'), controllers.station.getUserStationId);
    app.get('/getStationStatus', auth.isInRole('user'), controllers.station.getStationStatus);



    app.get('/getStation', auth.isInRole('user'), controllers.station.getStations);

    app.post('/getStaThreshold', auth.isInRole('user'), controllers.station.getUserStaThreshold);
    app.post('/setStaThreshold', auth.isInRole('user'), controllers.station.setStaThreshold);
    //app.get('/getUserFindStaData', auth.isInRole('user'), controllers.station.getUserFindStaData);
    //app.get('/getStartInfo', function (req, res) {
    //    res.send(true)
    //});

    /*================user*/
    app.get('/getUserStationInfo', controllers.station.getUserStationInfo);
    app.post('/changePassword', auth.isInRole('user'), controllers.users.changePassword);
    app.get('/findAllUsers', auth.isInRole('admin'), controllers.users.getAllUser);
    app.post('/addUser', controllers.users.addUser);
    app.post('/deleteUser', auth.isInRole('admin'), controllers.users.deleteUser);

    /*==========station*/
    app.post('/deleteStation', auth.isInRole('admin'), controllers.station.deleteStation);
    app.post('/addStation', auth.isInRole('admin'), controllers.station.addStation);

    /*=======batchProcess*/
    app.get('/getBatchProcessResult', auth.isInRole('user'), controllers.batchProcess.getBatchProcess);
    app.post('/startBatchProcess', auth.isInRole('user'), controllers.batchProcess.startBatchProcess);
    app.get('/stopBatchProcess', auth.isInRole('user'), controllers.batchProcess.stopBatchProcess);
    /*================threshole*/
    app.get('/getStaThreshold', auth.isInRole('user'),controllers.station.getStaThreshold);
    app.post('/setStaThreshold', auth.isInRole('admin'),controllers.station.setStaThreshold);
    /*====================Warning*/
    app.get('/getWarningInfo' ,auth.isInRole('user'),controllers.station.checkWarningStatus);
    app.post('/createWaring', auth.isInRole('user'), controllers.station.createWaring);
    /*====================HandleData*/
    app.get('/getStaHandleData', auth.isInRole('user'),controllers.station.getStaHandleData);
    app.post('/setStaHandleData', auth.isInRole('admin'),controllers.station.setStaHandleData);
};