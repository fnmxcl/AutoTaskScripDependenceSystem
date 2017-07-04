var Request = require('request');
var fileStream = require('fs');

//$HostParams 为宿主参数.如果函数中写了此参数则调用者会自动设置此值。
function ScriptMain(ScriptContext){
    var hostParmater = ScriptContext.$HostParamter;
    if(hostParmater && hostParmater.length > 0){
        hostParmater.forEach(function(item){
            console.log("HostParmter集合:" + item.AutoServiceKey);
        });
    }

    fileStream.readFile("D:\\Test.txt",function(err, data){
        if(data){
            //通知完成
            ScriptContext.$AutoServiceRunTime.OnSuccess(data.toString());
        }
        if(err){
            ScriptContext.$AutoServiceRunTime.OnFailure(err);
        }
    });
}

module.exports.ScriptMain = ScriptMain;