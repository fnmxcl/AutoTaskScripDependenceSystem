"use strict";
/**
 * Created by fnmxcl on 2016/05/25.
 */
const AllEnum = require("../Base/AllEnum");
class TaskResult {
    constructor(state, result) {
        this.State = state;
        this.Result = result;
    }
    ToTaskResult(jsonData) {
        if ((typeof jsonData) == "object") {
            switch (jsonData.State) {
                case "Success":
                    this.State = AllEnum.ResultState.Success;
                    break;
                case "Error":
                    this.State = AllEnum.ResultState.Error;
                    break;
                default:
                    this.State = AllEnum.ResultState.Error;
                    break;
            }
            this.Result = jsonData.Result;
        }
        else {
            throw ("当前jsonData不是有效的类型!");
        }
    }
}
module.exports = TaskResult;
