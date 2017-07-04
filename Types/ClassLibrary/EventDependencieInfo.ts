/**
 * Created by fnmxcl on 2016/05/24.
 */

import ScriptTask = require("./ScriptTask");
 class EventDependencieInfo{
    HostAutoServiceKey:string;
    HostScriptInstance:ScriptTask;
    DependenciesItems:any[];
    constructor(hostServiceKey:string,hostScriptInstance:ScriptTask,dependenciesItems:any[]){
        this.HostAutoServiceKey = hostServiceKey;
        this.HostScriptInstance = hostScriptInstance;
        this.DependenciesItems = dependenciesItems;
    }
}
export = EventDependencieInfo;
