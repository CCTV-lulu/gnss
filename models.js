var child_process = require("child_process");

function install() {
    child_process.exec('rm node_modules -r',{maxBuffer: 1024 * 500000000},function (err,stdout,stderr) {
                        // rmdir /s/q node_modules
        if(err){
            console.log(err)
        }
        else {
            child_process.exec('npm install',{maxBuffer: 1024 * 500000000},function (err,stdout,stderr) {
                if(err) {
                    console.log("安装失败，正在尝试重新安装...")
                    install()
                }
                console.log('node依赖包安装成功！！')
            })
        }

    })
}
install()


