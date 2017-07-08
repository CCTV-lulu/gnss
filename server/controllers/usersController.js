var encryption = require('../utilities/cripto'),
    User = require('../data/usersData'),
    fs = require("fs"),
    Station = require('../data/station'),
    UserStationInfo = require('../data/userStationInfo');

module.exports = {


    changePassword: function (req, res) {

        if (req.user._id == req.body.userId || req.user.roles.indexOf('admin') > -1) {
            var updatedUserData = {
                password: req.body.password
            };
            User.findByName(req.user.username).then(function (result) {
                var newHashPass = encryption.generateHashedPassword(result.salt,updatedUserData.password);
                if(result.hashPass===newHashPass){
                    return res.send({status:false,message:"新密码与旧密码相同"})
                }else {
                    if (updatedUserData.password && updatedUserData.password.length > 0) {
                        updatedUserData.salt = encryption.generateSalt();
                        updatedUserData.hashPass = encryption.generateHashedPassword(updatedUserData.salt, updatedUserData.password);
                    }

                    User.updateUser({_id: req.body.userId}, updatedUserData, function (err,result) {
                        if(result.ok ===1&&result.n ===1){
                            return res.send({status:true})
                        }else{
                            return res.send({status:false,message:"检查输入信息"})
                        }
                    })
                }

            })

        }
        else {
            res.send({status:false, message:"权限不足"})
        }

    },
    getAllUser: function (req, res) {
        User.all().then(function (users) {
            res.send(users)
        }, function (
            error) {
            res.send({
                status: false,
                message: error

            })
        })
    },

    addUser: function (req, res) {
        var user = {
            username: req.body.username,
            password: req.body.password,
            station: req.body.station

        };

        user.roles = (req.body.type == 'true') ? ['admin', 'user'] : ['user'];
        user.salt = encryption.generateSalt();
        user.hashPass = encryption.generateHashedPassword(user.salt, user.password);

        Station.findOne({name: req.body.station})
            .then(function (station) {

                if (!station && req.body.type !== 'true') {
                    return res.send({status: false, message: "基站不存在！"})
                }

                User.createUser(user, function (err, result) {
                    if (err) {
                        return res.send({status: false, message: '添加用户失败'})
                    }
                    if(result.status===false){
                        return res.send({status: false, message: '用户已存在'})
                    }
                    if(req.body.type === 'true'){
                      return  res.send({status:true})
                    }
                    UserStationInfo.createUserStation(req.body.username, station)
                        .then(function(){
                            res.send({status:true})
                        });
                })
            })


    },

    getUserInfo: function(){

    },


    deleteUser: function (req, res) {
        User.deleteByName(req.body.username, function (err, result) {
            if (err) {
              return  res.send({status: false, message: '删除用户失败'})
            }
            UserStationInfo.deleteUserStation(req.body.username).then(function(){
                res.send(result)
            })


        })
    }
};