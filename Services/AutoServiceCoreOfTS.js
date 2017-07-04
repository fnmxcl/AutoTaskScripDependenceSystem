"use strict";
///<reference path="../../../../typings/server.d.ts" />
const fileStream = require("fs");
const domain = require("domain");
const path = require("path");
const AllEnum = require("../Types/Base/AllEnum");
const TaskResult = require("../Types/ClassLibrary/TaskResult");
const ScriptTask = require("../Types/ClassLibrary/ScriptTask");
const EventDependencieInfo = require("../Types/ClassLibrary/EventDependencieInfo");
class AutoServiceCoreOfTS {
    constructor() {
        this.CycleEventCollection = null;
        this.EventDependenciesManage = null;
        //依赖队列执行器
        this.EventDependenciesExecutor = null;
        // 若不存在保存结果的目录则创建此目录并设置相关参数。
        if (!fileStream.existsSync("./AutoServices_Log")) {
            fileStream.mkdirSync("./AutoServices_Log");
        }
        if (!fileStream.existsSync("./AutoServices_Log/Log/")) {
            fileStream.mkdirSync("./AutoServices_Log/Log/");
        }
        this.CycleEventCollection = new Array();
        this.EventDependenciesManage = new Array();
        this.EventDependenciesExecutor = new Array();
    }
    ///Task调用的触发接口。
    EventTrigger(taskConfig) {
        var currntContext = this;
        if (!taskConfig.TaskInstance[taskConfig.Export]) {
            currntContext.F_ConsoleOutput("调用外部脚本出现异常,AutoServiceKey:[" + taskConfig.AutoServiceKey + "],脚本路径:[" + taskConfig.ScriptName + "],未找到:" + taskConfig.Export + "函数,执行失败!");
        }
        else {
            var hostParmater = [];
            // 查找相关的宿主。
            for (var index; index < taskConfig.Dependencies.length; index++) {
                for (var cycleIndex = 0; cycleIndex < currntContext.CycleEventCollection.length; cycleIndex++) {
                    if (taskConfig.Dependencies[index].AutoServiceKey == this.CycleEventCollection[cycleIndex].AutoServiceKey) {
                        hostParmater.push(this.CycleEventCollection[index]);
                    }
                }
            }
            var params = {};
            params["$AutoServiceRunTime"] = taskConfig;
            params["$HostParamter"] = hostParmater;
            //设置扩展参数
            for (var item in taskConfig.Export_Params) {
                params[item] = taskConfig.Export_Params[item];
            }
            taskConfig.SetExtObject("BeginDateTime", new Date());
            currntContext.F_ConsoleOutput("调用外部脚本开始,AutoServiceKey:[" + taskConfig.AutoServiceKey + "]----------------------------BEGIN");
            try {
                var childDomain = domain.create();
                var retValue = null;
                try {
                    retValue = childDomain.run(taskConfig.TaskInstance[taskConfig.Export], params);
                }
                catch (exception) {
                    currntContext.F_ConsoleOutput("调用外部脚本Domain环境出现异常,AutoServiceKey:[" + taskConfig.AutoServiceKey + "],脚本路径:[" + taskConfig.ScriptName + "],异常内容:" + exception);
                    return;
                }
                childDomain.on("error", function (err) {
                    currntContext.F_ConsoleOutput("调用外部脚本Domain环境出现异常,AutoServiceKey:[" + taskConfig.AutoServiceKey + "],脚本路径:[" + taskConfig.ScriptName + "],异常内容:" + err);
                });
                if (retValue) {
                    //使用了Q对象控制异步的方式
                    if (typeof (retValue) == "object" && retValue.constructor.name == "Promise") {
                        retValue.then(function (data) {
                            var executeResult = new TaskResult(AllEnum.ResultState.Success, data);
                            //执行完成之后的动作。
                            currntContext.EventExecuteProcess(taskConfig, executeResult);
                        }, function (error) {
                            var executeResult = new TaskResult(AllEnum.ResultState.Error, error);
                            //执行完成之后的动作。
                            currntContext.EventExecuteProcess(taskConfig, executeResult);
                        });
                    }
                    else {
                        //如果对方函数没有异步的IO操作则立即处理返回信息否则使用$AutoServiceRunTime进行处理。
                        if (retValue && taskConfig) {
                            if (!retValue.State || !retValue.Result) {
                                retValue = {};
                                retValue.State = "Error";
                                retValue.Result = "调用外部脚本失败,直接返回方式返回结果不是有效的结果:返回结果格式不包含{\"State\":\"Success|Error\",\"Result\":\"返回的结果,如果是失败则写明失败的原因\"}";
                                currntContext.F_ConsoleOutput("调用外部脚本失败,失败原因:返回结果格式不包含{\"State\":\"Success|Error\",\"Result\":\"返回的结果,如果是失败则写明失败的原因\"}");
                            }
                            var executeResultValue = new TaskResult();
                            executeResultValue.ToTaskResult(retValue);
                            //执行完成之后的动作。
                            currntContext.EventExecuteProcess(taskConfig, retValue);
                        }
                    }
                }
            }
            catch (exception) {
                currntContext.F_ConsoleOutput("调用外部脚本出现异常,AutoServiceKey:[" + taskConfig.AutoServiceKey + "],脚本路径:[" + taskConfig.ScriptName + "],异常内容:" + exception);
            }
        }
    }
    EventExecuteProcess(taskConfig, taskResult) {
        //调用任务完成事件。
        this.F_ConsoleOutput("调用外部脚本" + taskConfig.AutoServiceKey + "完成,开始执行OnAutoServcieComplated");
        taskConfig.OnAutoServcieComplated(this);
        //执行依赖关系。
        this.F_ConsoleOutput("调用外部脚本" + taskConfig.AutoServiceKey + ">>OnAutoServcieComplated完成,开始执行依赖此脚本的关系处理DependRelationProcess");
        this.DependRelationProcess(taskConfig, taskResult);
        this.F_ConsoleOutput("调用外部脚本" + taskConfig.AutoServiceKey + ">>DependRelationProcess完成,执行OnAutoServiceLogCallBack处理。若外部传则调用外部函数。");
        if (this.OnScriptExecuteResultLogCallBack && (typeof this.OnScriptExecuteResultLogCallBack) == "function") {
            //使用call调用默认不将本对象作为此函数的上下文,以免外部系统改变此运行环境。
            this.OnScriptExecuteResultLogCallBack.call(this.OnScriptExecuteResultLogCallBack, taskConfig, taskResult);
        }
        else {
            this.AutoServiceLogEventTrigger(taskConfig, taskResult);
        }
        this.F_ConsoleOutput("调用外部脚本结束,AutoServiceKey:[" + taskConfig.AutoServiceKey + "] --------------------------------END。");
    }
    //日志记录，在外部没有设定日志记录函数时则调用默认的。
    AutoServiceLogEventTrigger(taskConfig, taskResult) {
        if (!taskConfig || !taskResult) {
            return;
        }
        var autoServiceInstanceValue = {};
        var beginDateTime = taskConfig.GetExtObject("BeginDateTime");
        //只拷贝可持久化的对象。
        autoServiceInstanceValue.AutoServiceKey = taskConfig.AutoServiceKey;
        autoServiceInstanceValue.ScriptName = taskConfig.ScriptName;
        autoServiceInstanceValue.BeginDateTime = (beginDateTime == null ? "未取得开始时间" : beginDateTime);
        autoServiceInstanceValue.ExecuteMode = taskConfig.ExecuteMode;
        autoServiceInstanceValue.TimePatterns = taskConfig.TimePatterns;
        autoServiceInstanceValue.Export = taskConfig.Export;
        autoServiceInstanceValue.Export_Params = taskConfig.Export_Params;
        autoServiceInstanceValue.Discription = taskConfig.Discription;
        autoServiceInstanceValue.Dependencies = taskConfig.Dependencies;
        var LogSavedata = {
            AutoServiceKey: autoServiceInstanceValue.AutoServiceKey,
            "BeginDateTime": autoServiceInstanceValue.BeginDateTime,
            "EndDateTime": new Date(),
            "AutoServiceInstanceValue": autoServiceInstanceValue,
            "AutoServiceResulted": taskResult.Result
        };
        //记录日志。
        var saveKey = autoServiceInstanceValue.AutoServiceKey + "_" + autoServiceInstanceValue.BeginDateTime.getTime();
        //db.setItem(saveKey,JSON.stringify( LogSavedata ));
    }
    // 依赖关系处理。
    DependRelationProcess(taskConfig, taskResult) {
        for (var index = 0; index < this.EventDependenciesManage.length; index++) {
            var item = this.EventDependenciesManage[index];
            for (var itemindex = 0; itemindex < item.DependenciesItems.length; itemindex++) {
                var dependenciesItem = item.DependenciesItems[itemindex];
                if (dependenciesItem.AutoServiceKey == taskConfig.AutoServiceKey) {
                    var CurrentRunHost = item;
                    this.F_ConsoleOutput("当前需运行的脚本程序AutoServiceKey:[" + item.HostAutoServiceKey + "(" + item.HostScriptInstance.Discription + ")]  依赖关系:[" + dependenciesItem.AutoServiceKey + "]开始计算...");
                    var calcResult;
                    //若外部代码方式调用依赖触发条件。
                    if (this.OnDependenciesConditionCallBack && (typeof this.OnDependenciesConditionCallBack) == "function") {
                        //使用call调用默认不将本对象作为此函数的上下文,以免外部系统改变此运行环境。
                        try {
                            calcResult = this.OnDependenciesConditionCallBack.call(this.OnDependenciesConditionCallBack, CurrentRunHost.HostAutoServiceKey, taskConfig, taskResult);
                        }
                        catch (exception) {
                            this.F_ConsoleOutput("OnDependenciesConditionCallBack >> FormulaCalc计算异常,,异常原因:" + exception);
                            calcResult = false;
                        }
                    }
                    else {
                        calcResult = this.FormulaCalc(taskResult, dependenciesItem.SuccessCondition);
                    }
                    if (calcResult == true || calcResult == 1) {
                        dependenciesItem.IsRun = true;
                        this.F_ConsoleOutput("当前需运行的脚本程序AutoServiceKey:[" + item.HostAutoServiceKey + "(" + item.HostScriptInstance.Discription + ")]  依赖关系:[" + dependenciesItem.AutoServiceKey + "], 条件语句:[" + (dependenciesItem.SuccessCondition ? dependenciesItem.SuccessCondition : "自定义代码方式") + "]的计算结果为:[" + calcResult + "]");
                    }
                    else {
                        dependenciesItem.IsRun = false;
                        this.F_ConsoleOutput("当前需运行的脚本程序AutoServiceKey:[" + item.HostAutoServiceKey + "(" + item.HostScriptInstance.Discription + ")]  依赖关系:[" + dependenciesItem.AutoServiceKey + "],条件语句:[" + (dependenciesItem.SuccessCondition ? dependenciesItem.SuccessCondition : "自定义代码方式") + "]的计算结果为:[" + calcResult + "]");
                    }
                }
            }
        }
        //对已经具有依赖项并且依赖项都已运行的脚本启动运行。
        for (var index = 0; index < this.EventDependenciesManage.length; index++) {
            var item = this.EventDependenciesManage[index];
            var runThisCount = [];
            for (var itemindex = 0; itemindex < item.DependenciesItems.length; itemindex++) {
                if (item.DependenciesItems[itemindex].IsRun) {
                    runThisCount.push(item.DependenciesItems[itemindex]);
                }
            }
            if (runThisCount.length == item.DependenciesItems.length) {
                for (var index = 0; index < runThisCount.length; index++) {
                    runThisCount[index].IsRun = false;
                }
                //装载到队列中
                this.EventDependenciesExecutor.push(item.HostScriptInstance);
            }
        }
    }
    FormulaCalc(taskResult, successCondition) {
        var resultCalc = "";
        if (typeof (taskResult.Result) == "string") {
            resultCalc = "'" + taskResult.Result.replace("'", "\\'") + "'";
        }
        else {
            resultCalc = JSON.stringify(taskResult.Result);
        }
        var formula = "function FormulaCalc(){";
        formula += "var $ScriptResult =" + resultCalc + ";";
        formula += successCondition + ";";
        formula += "} FormulaCalc();";
        try {
            return eval(formula);
        }
        catch (exception) {
            this.F_ConsoleOutput("当前计算FormulaCalc计算异常,公式[" + successCondition + "],异常原因:" + exception);
            return false;
        }
    }
    F_ConsoleOutput(logcontent) {
        if (this.OnAutoServiceCosoleCallBack && (typeof this.OnAutoServiceCosoleCallBack) == "function") {
            //使用call调用默认不将本对象作为此函数的上下文,以免外部系统改变此运行环境。
            this.OnAutoServiceCosoleCallBack.call(this.OnAutoServiceCosoleCallBack, logcontent);
        }
        else {
            var currentDate = new Date();
            var logFile = "AutoServiceCoreConsole_" + currentDate.toLocaleDateString() + ".txt";
            var prefix = "LogType:AutoServiceCore Console Log AT Time:" + currentDate.toLocaleDateString() + " " + currentDate.toLocaleTimeString() + " >> ";
            var data = prefix + logcontent + " \r\n";
            console.log(data);
            fileStream.appendFile('./AutoServices_Log/Log/' + logFile, data, function (err) {
                if (err) {
                    console.log("BusinessLog Error!" + err);
                }
            });
        }
    }
    //TODO : 此处考虑到外部数据兼容性则直接用JSON配置对象。,sbeFrameWork参数为新平台框架对象，对象中包含ApplicationContext,DataWorkspace，DataService三个对象
    //StartAutoService（task?:  Array<ITask>) {
    StartAutoService(extersionConfig, sbeFrameWork) {
        var currentContext = this;
        var extersionJsonData;
        if (extersionConfig && (typeof extersionConfig) == "object") {
            extersionJsonData = extersionConfig;
        }
        else {
            var data = fileStream.readFileSync(path.join(__dirname, "../Configuration", "ExtersionsConfig.json"));
            //初始化检测配置有效性。
            if (data.toString().length == 0) {
                currentContext.F_ConsoleOutput("ExtersionConfig.json的数据为空,程序终止运行! ");
                //process.exit();
                return;
            }
            extersionJsonData = JSON.parse(data.toString());
        }
        if (extersionJsonData == undefined || extersionJsonData == null || (typeof extersionJsonData) != "object" || extersionJsonData.length == 0) {
            currentContext.F_ConsoleOutput("ExtersionsConfig配置数据不是有效的JSON数据或未配置任何内容,程序终止运行! ");
            process.exit();
        }
        try {
            var autoServiceKeyMap = [];
            for (var index = 0; index < extersionJsonData.length; index++) {
                var autoServiceKey = extersionJsonData[index].AutoServiceKey;
                if (!autoServiceKey) {
                    throw ("配置数据中有未配置AutoServiceKey的数据!");
                }
                var autoKeyCount = autoServiceKeyMap.filter(function (keyMapItem) {
                    return keyMapItem.Name == autoServiceKey;
                });
                if (autoKeyCount == null || autoKeyCount.length == 0) {
                    autoServiceKeyMap.push({ "Name": autoServiceKey, "Count": 1 });
                }
                else {
                    autoKeyCount[0].Count++;
                }
                if (autoKeyCount != null && autoKeyCount.length > 0 && autoKeyCount[0].Count > 1) {
                    currentContext.F_ConsoleOutput("配置项数据中 AutoServiceKey:[" + autoServiceKey + "] 配置项存在多个,请删除保留一个之后重试,当前运行已终止E1。! ");
                    process.exit();
                }
            }
        }
        catch (exception) {
            currentContext.F_ConsoleOutput("验证配置项数据时出现异常:" + exception + ",应用程序退出!");
            process.exit();
        }
        //设置相应的实例并启动实例。
        for (var index = 0; index < extersionJsonData.length; index++) {
            let extersionFileName = path.join(__dirname, "../Extersions", extersionJsonData[index].ScriptName);
            let requireFileName = "../Extersions/" + extersionJsonData[index].ScriptName;
            let isPhysicsPath = false;
            if (extersionJsonData[index].ScriptName.lastIndexOf("\\") > 0) {
                extersionFileName = extersionJsonData[index].ScriptName;
                requireFileName = extersionJsonData[index].ScriptName;
            }
            if (!fileStream.existsSync(extersionFileName)) {
                throw ("AutoServices系统未在Extersions目录下查找到脚本文件:" + extersionFileName);
            }
            var currentExtersionInfo = new ScriptTask(extersionJsonData[index].AutoServiceKey, extersionJsonData[index].ScriptName, extersionJsonData[index].ExecuteMode, extersionJsonData[index].TimePatterns, extersionJsonData[index].Export, extersionJsonData[index].Export_Params, extersionJsonData[index].Discription, extersionJsonData[index].Dependencies, require(requireFileName), currentContext, sbeFrameWork);
            currentExtersionInfo.OnSuccess = this.F_ExtersionFile_Complated;
            currentExtersionInfo.OnFailure = this.F_ExtersionFile_Failure;
            currentContext.CycleEventCollection.push(currentExtersionInfo);
            if (currentExtersionInfo.Dependencies && currentExtersionInfo.Dependencies.length > 0) {
                //深层拷贝(因为数组是引用类型，如果其他地方改变了值则都会影响)
                var dependenciesitems = JSON.parse(JSON.stringify(currentExtersionInfo.Dependencies));
                var dependenciesInfo = new EventDependencieInfo(currentExtersionInfo.AutoServiceKey, currentExtersionInfo, dependenciesitems);
                currentContext.EventDependenciesManage.push(dependenciesInfo);
            }
        }
        //启动依赖队列执行器运行(200毫秒执行一次)
        var oneSecond = 200 * 1; // one second = 200 x 1 ms
        setInterval(function () {
            currentContext.F_EventDependenciesExecutor();
        }, oneSecond);
        //等待所有的运行环境准备完毕触发任务。
        for (var index = 0; index < currentContext.CycleEventCollection.length; index++) {
            currentContext.CycleEventCollection[index].TriggerTask(currentContext);
        }
    }
    F_EventDependenciesExecutor() {
        var that = this;
        while (that.EventDependenciesExecutor && that.EventDependenciesExecutor.length > 0) {
            var item = that.EventDependenciesExecutor.pop();
            if (item) {
                try {
                    //对于时间周期调用则启动该周期时钟，否则直接调用。
                    if (item.TimePatterns) {
                        item.CycleInstance.start();
                    }
                    else {
                        that.EventTrigger(item);
                    }
                }
                catch (exception) {
                    that.F_ConsoleOutput("F_EventDependenciesExecutor >> Call DependRelationProcess Exception:" + exception);
                }
            }
        }
    }
    F_ExtersionFile_Complated(extersionResult) {
        var autoServiceContext = this;
        if (autoServiceContext) {
            autoServiceContext.AutoServiceContext.F_ConsoleOutput("外部脚本:" + autoServiceContext.AutoServiceKey + "调用了OnSuccess函数:此函数实际指向=>AutoServiceCoreOfTS.F_ExtersionFile_Complated(extersionResult) !");
            var executeResultValue = new TaskResult(AllEnum.ResultState.Success, extersionResult);
            //执行完成之后的动作。
            autoServiceContext.AutoServiceContext.EventExecuteProcess(this, executeResultValue);
        }
    }
    F_ExtersionFile_Failure(extersionResult) {
        var autoServiceContext = this;
        if (autoServiceContext) {
            autoServiceContext.AutoServiceContext.F_ConsoleOutput("外部脚本:" + autoServiceContext.AutoServiceKey + "调用了OnFailure函数:此函数实际指向=>AutoServiceCoreOfTS.F_ExtersionFile_Failure(extersionResult) !");
            var executeResultValue = new TaskResult(AllEnum.ResultState.Error, extersionResult);
            //执行完成之后的动作。
            autoServiceContext.AutoServiceContext.EventExecuteProcess(this, executeResultValue);
        }
    }
}
;
module.exports = AutoServiceCoreOfTS;
