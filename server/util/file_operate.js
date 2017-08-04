var fs = require('fs');
var async = require("async");
var path = require("path");
var _ = require('underscore');
var mime = require('mime');

// cursively make dir
function mkdirs(p, mode, f, made) {
    if (typeof mode === 'function' || mode === undefined) {
        f = mode;
        mode = 0777 & (~process.umask());
    }
    if (!made)
        made = null;

    var cb = f || function () {
        };
    if (typeof mode === 'string')
        mode = parseInt(mode, 8);
    p = path.resolve(p);

    fs.mkdir(p, mode, function (er) {
        if (!er) {
            made = made || p;
            return cb(null, made);
        }
        switch (er.code) {
            case 'ENOENT':
                mkdirs(path.dirname(p), mode, function (er, made) {
                    if (er) {
                        cb(er, made);
                    } else {
                        mkdirs(p, mode, cb, made);
                    }
                });
                break;

            // In the case of any other error, just see if there's a dir
            // there already.  If so, then hooray!  If not, then something
            // is borked.
            default:
                fs.stat(p, function (er2, stat) {
                    // if the stat fails, then that's super weird.
                    // let the original error be the failure reason.
                    if (er2 || !stat.isDirectory()) {
                        cb(er, made);
                    } else {
                        cb(null, made)
                    }
                    ;
                });
                break;
        }
    });
}

// single file copy
function copyFile(file, toDir, cb) {
    async.waterfall([
        function (callback) {
            fs.exists(toDir, function (exists) {
                if (exists) {
                    callback(null, false);
                } else {
                    callback(null, true);
                }
            });
        }, function (need, callback) {
            if (need) {
                mkdirs(path.dirname(toDir), callback);
            } else {
                callback(null, true);
            }
        }, function (p, callback) {
            var reads = fs.createReadStream(file);
            var writes = fs.createWriteStream(path.join(path.dirname(toDir), path.basename(file)));
            reads.pipe(writes);
            //don't forget close the  when  all the data are read
            reads.on("end", function () {
                writes.end();
                callback(null);
            });
            reads.on("error", function (err) {
                console.log("error occur in reads");
                callback(true, err);
            });

        }
    ], cb);

}

// cursively count the  files that need to be copied

function _ccoutTask(from, to, cbw) {
    async.waterfall([
        function (callback) {
            fs.stat(from, callback);
        },
        function (stats, callback) {
            if (stats.isFile()) {
                cbw.addFile(from, to);
                callback(null, []);
            } else if (stats.isDirectory()) {
                fs.readdir(from, callback);
            }
        },
        function (files, callback) {
            if (files.length) {
                for (var i = 0; i < files.length; i++) {
                    _ccoutTask(path.join(from, files[i]), path.join(to, files[i]), cbw.increase());
                }
            }
            callback(null);
        }
    ], cbw);

}
// wrap the callback before counting
function ccoutTask(from, to, cb) {
    var files = [];
    var count = 1;

    function wrapper(err) {
        count--;
        if (err || count <= 0) {
            cb(err, files)
        }
    }

    wrapper.increase = function () {
        count++;
        return wrapper;
    };
    wrapper.addFile = function (file, dir) {
        files.push({
            file: file,
            dir: dir
        });
    };

    _ccoutTask(from, to, wrapper);
}


function copyDir(from, to, cb) {
    if (!cb) {
        cb = function () {
        };
    }
    async.waterfall([
        function (callback) {
            fs.exists(from, function (exists) {
                if (exists) {
                    callback(null, true);
                } else {
                    console.log(from + " not exists");
                    callback(true);
                }
            });
        },
        function (exists, callback) {
            fs.stat(from, callback);
        },
        function (stats, callback) {
            if (stats.isFile()) {
                // one file copy
                copyFile(from, to, function (err) {
                    if (err) {
                        // break the waterfall
                        callback(true);
                    } else {
                        callback(null, []);
                    }
                });
            } else if (stats.isDirectory()) {
                ccoutTask(from, to, callback);
            }
        },
        function (files, callback) {
            // prevent reaching to max file open limit
            async.mapLimit(files, 10, function (f, cb) {
                copyFile(f.file, f.dir, cb);
            }, callback);
        }
    ], cb);
}

function copyDirSync(path,toPath){
    var filesName = fs.readdirSync(path);
    _.each(filesName,function(fileName){
        var filePath = path + '/' + fileName;
        var stats = fs.statSync(filePath);
        if(stats.isDirectory()){
            copyDirSync(filePath,toPath+'/'+fileName);
        }else{
            copyFileSync(filePath,toPath);
        }
    });
}
//指向路径中如果存在同名文件则覆盖
function copyFileSync(filePath,toPath){
    var fileName = filePath.substr(filePath.lastIndexOf('/')+1);
    if(!fs.exists(toPath)){
        mkdirsSync(toPath);
    }
    var data = fs.readFileSync(filePath);
    var toFile = toPath+'/'+fileName;
    fs.openSync(toFile,'w+');
    fs.writeFileSync(toFile,data);
}

function copyFileSyncRename(filePath,toPath,newname) {
    var fileName = newname || filePath.substr(filePath.lastIndexOf('/')+1);
    if(!fs.exists(toPath)){
        mkdirsSync(toPath);
    }
    var data = fs.readFileSync(filePath);
    var toFile = toPath+'/'+fileName;
    fs.openSync(toFile,'w+');
    fs.writeFileSync(toFile,data);
}

var dir = {
    user: 'public/user',
    project: "public/template",
    public: "public"
};

var mkdir = function (dirpath, mode, callback) {
    path.exists(dirpath, function (exists) {
        if (exists) {
            callback(dirpath);
        } else {
            mkdir(path.dirname(dirpath), mode, function () {
                fs.mkdir(dirpath, mode, callback);
            });
        }
    });
};

var mkdirsSync = function (p, mode, made) {
    if (mode === undefined) {
        mode = 0777 & (~process.umask());
    }
    if (!made) made = null;

    if (typeof mode === 'string') mode = parseInt(mode, 8);
    p = path.resolve(p);

    try {
        fs.mkdirSync(p, mode);
        made = made || p;
    }
    catch (err0) {
        switch (err0.code) {
            case 'ENOENT' :
                made = mkdirsSync(path.dirname(p), mode, made);
                mkdirsSync(p, mode, made);
                break;
            default:
                var stat;
                try {
                    stat = fs.statSync(p);
                }
                catch (err1) {
                    throw err0;
                }
                if (!stat.isDirectory()) throw err0;
                break;
        }
    }
    return made;
};

var cp = function (src, target, cb) {
    var fileReadStream = fs.createReadStream(src);
    var fileWriteStream = fs.createWriteStream(target);
    fileReadStream.pipe(fileWriteStream);

    fileWriteStream.on('close', function () {
        cb();
    });
};

var list_files = function (file_path, cb) {
    var options = { followLinks: false};
    walker_on_dir_or_file(file_path, 'file', options, cb)
};

var list_dirs = function (file_path, cb) {
    var options = { followLinks: false,  filters: ["codes", "/.git"]};
    walker_on_dir_or_file(file_path, 'directory', options, cb)
};

function walker_on_dir_or_file(file_path, attention, op, cb) {
    var walk = require('walk'), results = [];
    var walker = walk.walk(file_path, op);
    walker.on(attention, function (root, stat, next) {
        results.push({name: stat.name, url: root + "/", mimeType: mime.lookup(root + '/' + stat.name)});
        next();
    });

    walker.on('end', function () {
        cb(results);
    });
}

var read = function (url, name) {
    var file_path = url + name;
    if (!fs.existsSync(file_path)) {
        console.log(file_path)
        file_path = url + '/' + name;
    }
    if (!fs.existsSync(file_path)) {
        console.log(file_path)
        console.log('file not find');
    }
    return {name: name, content: fs.readFileSync(file_path, 'utf8')};
};

var write = function (file_name, content, cb) {
    var paths = file_name.split("/");
    var name_length = paths[paths.length - 1].length;
    var file_path = file_name.slice(0, file_name.length - name_length);
    var interval = setInterval(function () {
        check_dir(file_path, function (exists) {
            if (exists) {
                fs.open(file_name, "w", 0644, function (e, fd) {
                    if (e) throw e;
                    fs.write(fd, content, 0, 'utf8', function (e) {
                        if (e) throw e;
                        cb();
                        fs.closeSync(fd);
                    });
                });
                clearInterval(interval);
            }
        });
    }, 5);
};


var copy = function (project_path, user_path, call_back) {
    list_files(project_path, function (result) {
        var mkdir_count = 0;
        var cp_count = 0;
        for (var i in result) {
            result[i].url = result[i].url.split(dir.project)[1];
            mkdir(user_path.slice(0, user_path.length - 1) + result[i].url, 0755, function () {
                cp(dir.project + result[mkdir_count].url + result[mkdir_count].name, user_path.slice(0, user_path.length) + result[mkdir_count].url + result[mkdir_count].name, function () {
                    cp_count++;
                    if (cp_count == result.length) {
                        call_back();
                    }
                });
                mkdir_count++;
            });
        }
    });
};

var tar = function (project, position, cb) {
    var targz = require('tar.gz');
    new targz().compress(position + "/" + project, position + "/" + project + ".tar.gz", cb);
};

var rm = function (path) {
    var files = [];
    if (fs.existsSync(path)) {
        files = fs.readdirSync(path);
        files.forEach(function (file, index) {
            var curPath = path + "/" + file;
            if (fs.statSync(curPath).isDirectory()) { // recurse
                rm(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};

var check_dir = function (dirpath, callback) {
    path.exists(dirpath, callback);
};


module.exports = {
    mkdir: mkdir,
    mkdirsSync:mkdirsSync,
    write: write,
    read: read,
    position: dir,
    copy: copy,
    tar: tar,
    copy_file: copyFile,
    copy_file_sync:copyFileSync,
    copy_dir: copyDir,
    copy_dir_sync:copyDirSync,
    rm: rm,
    check: check_dir,
    list_files: list_files,
    list_dirs: list_dirs,
    copy_file_and_rename: copyFileSyncRename
};