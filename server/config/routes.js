var auth = require('./auth'),
    controllers = require('../controllers');
module.exports = function(app) {
    app.post('/login', auth.login);
    app.get('/logout', auth.logout);
    app.get('/checkLogin',auth.isAuthenticated);

    app.get('/', function (req, res) {
        res.redirect('/www/index.html');
    });

    //todo check login







//    app.post('/staThreshold', controllers.station.saveThreshold);

    //todo check admin
    app.post('/changePassword',controllers.users.changePassword);
    app.get('/findAllUsers',  auth.isInRole('admin'), controllers.users.getAllUser);

    app.post('/addAdmin',controllers.users.addAdmin);
    app.post('/addUser',controllers.users.addUser);


    app.get('/downloadStaData',  auth.isInRole('user'), controllers.station.downloadStaData);


    app.post('/userStaId', auth.isInRole('user') ,controllers.station.updateStaId);
    app.post('/userStartStaId', auth.isInRole('user') ,controllers.station.updateStaId);


    app.get('/userStaId', auth.isInRole('user'),controllers.station.getUserStationId);
    app.get('/getStationStatus', auth.isInRole('user'),controllers.station.getStationStatus);

    app.post('/StationConfig', controllers.users.getStationConfig);




    app.get('/getStation', auth.isInRole('user'), controllers.station.getStations);
    app.post('/findSatData', auth.isInRole('user'), controllers.station.setUserFindTime);
    app.post('/getStaThreshold',  auth.isInRole('user'), controllers.station.getUserStaThreshold);
    app.post('/setStaThreshold',  auth.isInRole('user'), controllers.station.setStaThreshold);
    app.get('/getUserFindStaData', auth.isInRole('user'), controllers.station.getUserFindStaData);


    app.get('/addStation', auth.isInRole('admin'),controllers.station.createStation);

    app.post('/deleteUser', auth.isInRole('admin'),controllers.users.deleteUser);
    app.post('/deleteStation', auth.isInRole('admin'),controllers.station.deleteStation);
    app.post('/addStation', auth.isInRole('admin'),controllers.station.addStation)

    app.get('/getStartInfo',function (req,res) {
        res.send(true)
    });

};