"use strict";
var CronJob = require('cron').CronJob;
const ExtObject = require("../ClassLibrary/ExtObject");
class ScriptTask {
    constructor(autoServiceKey, scriptName, executeMode, timePatterns, _export, export_Params, discription, dependencies, taskInstance, autoServiceContext, sbeFrameWork) {
        this.AutoServiceKey = autoServiceKey;
        this.ScriptName = scriptName;
        this.ExecuteMode = executeMode;
        this.TimePatterns = timePatterns;
        this.Export = _export;
        this.Export_Params = export_Params;
        this.Discription = discription;
        this.Dependencies = dependencies;
        this.TaskInstance = taskInstance;
        this.AutoServiceContext = autoServiceContext;
        this.ExtObjectArray = new Array();
        this.SBEFrameWork = sbeFrameWork;
    }
    TriggerTask(autoServiceContext) {
        var scriptContext = this;
        scriptContext.AutoServiceContext = autoServiceContext;
        if (this.TimePatterns) {
            var cronjob = new CronJob({
                cronTime: this.TimePatterns,
                onTick: function executeTrigger() {
                    //运行周期事件时将参数暂时关闭。
                    if (scriptContext.TimePatterns) {
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
            }
            else {
                scriptContext.AutoServiceContext.EventTrigger(scriptContext);
            }
        }
    }
    //AppService完成脚本的调用。
    OnAutoServcieComplated(autoServiceContext) {
        var scriptContext = this;
        //如果周期事件执行完成后将自动启动。
        if (scriptContext.TimePatterns && (scriptContext.Dependencies == undefined ||
            scriptContext.Dependencies == null || scriptContext.Dependencies.length == 0)) {
            scriptContext.CycleInstance.start();
        }
    }
    SetExtObject(key, value) {
        var currentExtObject = null;
        for (var index = 0; index < this.ExtObjectArray.length; index++) {
            if (this.ExtObjectArray[index].ExtKey == key) {
                currentExtObject = this.ExtObjectArray[index];
                break;
            }
        }
        if (currentExtObject) {
            currentExtObject.ExtValue = value;
        }
        else {
            if (key) {
                this.ExtObjectArray.push(new ExtObject(key, value));
            }
        }
    }
    GetExtObject(key) {
        for (var index = 0; index < this.ExtObjectArray.length; index++) {
            if (this.ExtObjectArray[index].ExtKey == key) {
                return this.ExtObjectArray[index].ExtValue;
            }
        }
    }
}
module.exports = ScriptTask;
