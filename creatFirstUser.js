var MongoClient = require('mongodb').MongoClient;
var DB_CONN_STR = 'mongodb://localhost:27017/wang';

var insertData = function(db, callback) {
    //连接到表 site
    var collection = db.collection('users');
    //插入数据
    collection.find({}).toArray(function (err,result) {
        console.log(result)
        if(result == undefined) {
            var data = [{
                "username": "admin",
                "salt": "nV4XkYpvRbwW3+aGksqhaw4nuTJZzhvOpzQxtPP0OUbccZk84eNnJxyw07NsILEejDfH55yQ+wtmnR6KpzK4lCx3fYZNqnZyGbXHlerogO8ISCkiebJ1Tc9mBtlcSnWBtMYtynto2BVUbo+NhYYKAIFfSjiG7vDHW7K+ym8vIwU=",
                "hashPass": "dec47aeac3310b548229322a236c0fbb9eccb07c",
                "roles": ["admin", "user"]
            }];
            collection.insert(data, function (err, result) {
                if (err) {
                    console.log('Error:' + err);
                    return db.close();
                }
                console.log("创建用户成功")
                callback(result);
            });
        }else {
            console.log("已有用户")
            return db.close();
        }
    })



}

MongoClient.connect(DB_CONN_STR, function(err, db) {
    insertData(db, function(result) {
        db.close();
    });
});