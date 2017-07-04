import  ITask = require("../Interfaces/ITask");
var CronJob = require('cron').CronJob;
import  TaskResult = require("../ClassLibrary/TaskResult");
import ExtObject = require("../ClassLibrary/ExtObject");
class ScriptTask implements  ITask{
    AutoServiceKey:string;
    ScriptName:string;
    ExecuteMode:string;
    TimePatterns:string;
    Export:string;
    Export_Params:any;
    Discription:string;
    Dependencies:any[];
    TaskInstance:any;
    CycleInstance:any;
    AutoServiceContext:any;
    ExtObjectArray:Array<ExtObject>;
    SBEFrameWork:any;

    constructor( autoServiceKey:string,scriptName:string,executeMode:string, timePatterns:string,_export:string,export_Params:any,
                 discription:string,dependencies:any[],taskInstance:any,autoServiceContext:any,sbeFrameWork?:any){
        this.AutoServiceKey = autoServiceKey ;
        this.ScriptName= scriptName;
        this.ExecuteMode = executeMode;
        this.TimePatterns= timePatterns;
        this.Export = _export;
        this.Export_Params =export_Params ;
        this.Discription=discription;
        this.Dependencies = dependencies;
        this.TaskInstance = taskInstance;
        this.AutoServiceContext = autoServiceContext;
        this.ExtObjectArray = new Array<ExtObject>();
        this.SBEFrameWork = sbeFrameWork;
    }

    TriggerTask(autoServiceContext:any):void {
        var scriptContext = this;
        scriptContext.AutoServiceContext = autoServiceContext;
        if (this.TimePatterns) {
            var cronjob = new CronJob({
                cronTime: this.TimePatterns, /*Seconds: 0-59 Minutes: 0-59 Hours: 0-23 Day of Month: 1-31 Months: 0-11 Day of Week: 0-6*/
                onTick: function executeTrigger() {
                    //运行周期事件时将参数暂时关闭。
                    if(scriptContext.TimePatterns){
                        scriptContext.CycleInstance.stop();
                    }

                    scriptContext.AutoServiceContext.EventTrigger(scriptContext);
                },
                runOnInit: false,
                timeZone: 'Asia/Chongqing'
            });
            this.CycleInstance = cronjob;
        }

        //当前任务若没有依赖项则直接启动。
        if (scriptContext.Dependencies == undefined || scriptContext.Dependencies == null || scriptContext.Dependencies.length == 0) {
            if (scriptContext.TimePatterns) {
                scriptContext.CycleInstance.start();
            } else {
                scriptContext.AutoServiceContext.EventTrigger(scriptContext);
            }
        }
    }
    //AppService完成脚本的调用。
    OnAutoServcieComplated(autoServiceContext:any):void {
        var scriptContext = this;
        //如果周期事件执行完成后将自动启动。
        if(scriptContext.TimePatterns && (scriptContext.Dependencies == undefined ||
            scriptContext.Dependencies == null || scriptContext.Dependencies.length == 0) ){
            scriptContext.CycleInstance.start();
        }
    }

    //外部脚本调用成功完成事件(此项被AutoService服务器接管)。
    OnSuccess:(executeResultData)=>void;
    //外部脚本调用失败完成事件.(此项被AutoService服务器接管)。
    OnFailure:(executeResultData) =>void;

    SetExtObject(key:string,value:any):void{
        var currentExtObject = null;
        for(var index = 0;index < this.ExtObjectArray.length;index ++){
            if(this.ExtObjectArray[index].ExtKey == key){
                currentExtObject =  this.ExtObjectArray[index];
                break;
            }
        }
        if(currentExtObject){
            currentExtObject.ExtValue  = value;
        }else{
            if(key){
                this.ExtObjectArray.push(new ExtObject(key,value));
            }
        }
    }

    GetExtObject(key:string):ExtObject{
        for(var index = 0;index < this.ExtObjectArray.length;index ++){
            if(this.ExtObjectArray[index].ExtKey == key){
                return this.ExtObjectArray[index].ExtValue;
            }
        }
    }

}
export = ScriptTask;
