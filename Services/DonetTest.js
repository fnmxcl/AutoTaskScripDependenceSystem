/**
 * Created by fnmxcl on 2016/05/05.
 */
var edge=require('edge');
function start(){

    var clrMethod = edge.func({
        assemblyFile: './Services/Test.dll',
        typeName: 'Test.Test',
        methodName: 'Hello' // This must be Func<object,Task<object>>
    });

    clrMethod("", function (d,error, result) {

        var a = result;
    });

};


module.exports.Start = start;


