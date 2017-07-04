/**
 * Created by fnmxcl on 2016/05/26.
 */
import AutoService = require('./Services/AutoServiceCoreOfTS');
import  ITask = require("./Types/Interfaces/ITask");
import  AllEnum = require("./Types/Base/AllEnum");
import  TaskResult = require("./Types/ClassLibrary/TaskResult");
import ServerUtils = require("../../../System/Utils/ServerUtils");
var fs = require("fs");

class AutoServiceStartup{

    //脚本执行结果数据事件回调。
     OnScriptExecuteResultLogCallBack:(taskConfig:ITask,taskResult:TaskResult) =>void;
    //自动任务系统控制台事件。
    OnAutoServiceCosoleCallBack:(logContent:string) =>void;
    //自动任务系统依赖执行条件事件。
    OnDependenciesConditionCallBack:(currentAutoServiceKey:string,taskConfig:ITask,taskResult:TaskResult) =>boolean;



    Startup(extersionJsonData?:any,sbeFrameWork?:any,guidID?:string){
        var localGuidID:string = <string>ServerUtils.UUID.v4();
        if(guidID){
            localGuidID = guidID;
        }
        if(!global["AutoServiceStartup"]){
            global["AutoServiceStartup"] = [];
        }
        var autoServiceStartupCheck:any = (<any>global["AutoServiceStartup"]).filter(v=>v == localGuidID);
        if(autoServiceStartupCheck && autoServiceStartupCheck.length > 0){
            console.log("已加载过AutoService系统,当前操作已取消。");
            return;
        }else{
            global["AutoServiceStartup"].push(localGuidID);
        }

        try {
            var autoService = new AutoService();
            if(this.OnScriptExecuteResultLogCallBack){
                if ((typeof this.OnScriptExecuteResultLogCallBack) == "function") {
                    autoService.OnScriptExecuteResultLogCallBack = this.OnScriptExecuteResultLogCallBack;
                }else{
                    console.log("AutoServices/Startup当前传入的OnScriptExecuteResultLogCallBack参数不是function类型,系统将以默认的方式运行。!");
                }
            }
            if(this.OnAutoServiceCosoleCallBack){
                if ((typeof this.OnAutoServiceCosoleCallBack) == "function") {
                    autoService.OnAutoServiceCosoleCallBack = this.OnAutoServiceCosoleCallBack;
                }else{
                    console.log("AutoServices/Startup当前传入的OnAutoServiceCosoleCallBack参数不是function类型,系统将以默认的方式运行。!");
                }
            }

            if(this.OnDependenciesConditionCallBack){
                if ((typeof this.OnDependenciesConditionCallBack) == "function") {
                    autoService.OnDependenciesConditionCallBack = this.OnDependenciesConditionCallBack;
                }else{
                    console.log("AutoServices/Startup当前传入的OnDependenciesConditionCallBack参数不是function类型,系统将以默认的方式运行。!");
                }
            }

            //外部传入的路径
            if((typeof extersionJsonData) == "string" ){
                var jsonConfigText =  fs.readFileSync(extersionJsonData);
                if(jsonConfigText){
                    var jsonConfigValue =  JSON.parse(jsonConfigText.toString());
                    autoService.StartAutoService(jsonConfigValue,sbeFrameWork);
                }else{
                    throw "获取JSON配置文件中的数据为空";
                }
            }else if((typeof extersionJsonData) == "object"){
                //参数列表中可以传入任务集合，如果传入则以当前的任务集合运行。传入的若为空则以内部的配置文件为准.
                autoService.StartAutoService(extersionJsonData,sbeFrameWork);
            }else{
                throw "传入的extersionJsonData参数为不可识别的格式";
            }
        }catch(exception){
            this.RemoveGlobalStartupInfo(localGuidID);
            console.log("Startup启动失败:"+exception);
        }

    }

    private RemoveGlobalStartupInfo(guidID:string){
        while(true){
            var success = false;
            for(var index = 0;index < global["AutoServiceStartup"].length;index ++ ){
                //剔除无效的命令连接。
                if(global["AutoServiceStartup"][index] == guidID){
                    global["AutoServiceStartup"].splice(index,1);
                    success = true;
                    break;
                }
            }
            if(!success){
                break;
            }
        }
    }

}
export = AutoServiceStartup;