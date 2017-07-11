var path = require('path');
var rootPath = path.normalize(__dirname + '/../../');

module.exports = {

    development: {
        rootPath: rootPath,
        db: 'mongodb://localhost/wang',
        port: process.env.PORT || 30000,
        queueName: 'raw_prod    ',
        logPath:'/logs/',
        cwd:path.resolve('../')
    },
    production: {
        rootPath: rootPath,
        db: 'mongodb://root:123@localhost:27017/wang?authSource=admin',
        port: process.env.PORT || 30000,
        queueName: 'raw_prod_1',
        logPath:'/logs/',
        cwd:path.resolve('../')
    }
};