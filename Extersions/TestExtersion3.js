var fileStream = require('fs');

//示例代码。 如果想让自动任务插件进行后续的操作则参数列表中需包含 $AutoServiceRunTime ，AutoServiceRunTime 为系统参数，如果当前函数中有这个参数则系统自动设置此值。
//TODO: 此$AutoServiceRunTime 的参数如果在混淆的情况下可能无法有效设置值。 目前唯一的考虑在服务端脚本模式下一般不会混淆代码。
//直接返回结果的格式必须为{"State":"Success|Error","Result":"返回的结果,如果是失败则写明失败的原因"}。 $AutoServiceRunTime 通过OnComplated 标识此函数已经完成。不管是失败还是成功都需要调用此函数。
//TODO: 如果用Q对象之后请不要在使用$AutoServiceRunTime进行返回了。
function Start(ScriptContext){
    fileStream.readFile("D:\\Test.txt",function(err, data){
        if(data){
            //通知完成
            ScriptContext.$AutoServiceRunTime.OnSuccess("{'name':'成功调用了BaseExtersion3的脚本了。'}");
        }
        if(err){
            ScriptContext.$AutoServiceRunTime.OnFailure(err);
        }
    });
}

module.exports.Start = Start;
