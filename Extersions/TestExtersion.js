
var fileStream = require('fs');
var Q = require('q');
var Request = require('request');

//示例代码。 如果想让自动任务插件进行后续的操作则参数列表中需包含 $AutoServiceRunTime ，AutoServiceRunTime 为系统参数，如果当前函数中有这个参数则系统自动设置此值。
//TODO: 此$AutoServiceRunTime 的参数如果在混淆的情况下可能无法有效设置值。 目前唯一的考虑在服务端脚本模式下一般不会混淆代码。
//直接返回结果的格式必须为{"State":"Success|Error","Result":"返回的结果,如果是失败则写明失败的原因"}。 $AutoServiceRunTime 通过OnComplated 标识此函数已经完成。不管是失败还是成功都需要调用此函数。
//TODO: 如果用Q对象之后请不要在使用$AutoServiceRunTime进行返回了。
function Start(ScriptContext){
    //-----测试代码1 ，没有异步IO代码的状态下直接返回.----------------------------------------------
    //var result = {};
    //var test1 = {};
    //test1.name = "雨昂刘";
    //test1.age = 12;
    //test1.range = ["1","2","3"];
    //
    //result.State = "Success";
    //
    //result.Result = test1;
    //
    //return result;
    //-----测试代码1 ，没有异步IO代码的状态下直接返回.----------------------------------------------




    //-----测试代码2 ，使用$AutoServiceRunTime 在异步状态下成功返回和失败返回。.----------------------------------------------
    //fileStream.readFile("D:\\Test1.xml",function(err, data){
    //    if(data){
    //        //通知完成
    //        ScriptContext.$AutoServiceRunTime.OnSuccess(data.toString().substr(0,10000));
    //    }
    //    if(err){
    //        ScriptContext.$AutoServiceRunTime.OnFailure(err);
    //    }
    //});
    //var options = {
    //    method: 'GET',
    //    url: "http://www.qqdms.com:8002/CloudAPI/ExecuteBizTemplate?client=4CED2040A3F57B343FCCF1635FB4B5D2&bizTemplate=ARS_ETL_CU_004&Parameters={%22pointCode%22:%221001%22,%22beginDT%22:%222015-01-01%22,%22endDT%22:%222015-01-1%22}"
    //    //,
    //    //headers: {
    //    //    "X-Requested-With": 'XMLHttpRequest'
    //    //}
    //};
    //var j = Request.jar();
    //var request = Request.defaults({jar: j});
    //request(options, function (error, response, body) {
    //    try{
    //        //将远程Cookies设置到返回信息中
    //        if (error) {
    //            ScriptContext.$AutoServiceRunTime.OnFailure(error);
    //        }
    //        else {
    //            ScriptContext.$AutoServiceRunTime.OnSuccess(body);
    //        }
    //
    //    }catch(exception){
    //        ScriptContext.$AutoServiceRunTime.OnFailure(exception);
    //    }
    //});
    //-----测试代码2----------------------------------------------



    //-----测试代码3 ，使用Q 在异步状态下返回.----------------------------------------------
    var deferred = Q.defer();
    var options = {
        method: 'GET',
        url: "http://www.qqdms.com:8002/CloudAPI/ExecuteBizTemplate?client=4CED2040A3F57B343FCCF1635FB4B5D2&bizTemplate=ARS_ETL_CU_004&Parameters={%22pointCode%22:%221001%22,%22beginDT%22:%222015-01-01%22,%22endDT%22:%222015-01-1%22}",
        headers: {
            "X-Requested-With": 'XMLHttpRequest'
        }
    };
    var j = Request.jar();
    var request = Request.defaults({jar: j});
    request(options, function (error, response, body) {
        try{
            //将远程Cookies设置到返回信息中
            if (error) {
                deferred.reject(error);
            }
            else {
                deferred.resolve(response);
            }
            deferred.resolve(response);

        }catch(exception){
            deferred.reject(exception);
        }
    });
    return deferred.promise;
    //-----测试代码3 ，使用Q 在异步状态下返回.----------------------------------------------
}

module.exports.Start = Start;
