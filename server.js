var express = require('express');

var env = process.argv[2]|| process.env.NODE_ENV || 'development';

var app = express();
var config = require('./server/config/config')[env];

app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:63342');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,Content-type','Accept');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
    next();
});

require('./server/config/express')(app, config);
require('./server/config/mongoose')(config);
require('./server/config/passport')();
require('./server/config/routes')(app);
require('./server/config/logfile')(app);

app.listen(config.port);



console.log("Server running on port: " + config.port);
//forever start server启动程序时，想看打印－>vi /home/wang/.forever/L1Wj.log进入文件查看
//终端改文件：vi filename进入文件，i 编辑，编辑完后Esc输入:wq保存退出,q退出,q!强制退出