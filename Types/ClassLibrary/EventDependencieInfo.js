/**
 * Created by fnmxcl on 2016/05/24.
 */
"use strict";
class EventDependencieInfo {
    constructor(hostServiceKey, hostScriptInstance, dependenciesItems) {
        this.HostAutoServiceKey = hostServiceKey;
        this.HostScriptInstance = hostScriptInstance;
        this.DependenciesItems = dependenciesItems;
    }
}
module.exports = EventDependencieInfo;
