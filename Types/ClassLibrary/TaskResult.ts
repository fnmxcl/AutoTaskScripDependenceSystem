/**
 * Created by fnmxcl on 2016/05/25.
 */
    import  AllEnum = require("../Base/AllEnum");
class TaskResult{
    State:AllEnum.ResultState;
    Result:any;
    constructor(state?:AllEnum.ResultState,result?:any){
        this.State = state;
        this.Result = result;
    }

    ToTaskResult(jsonData:any){
        if((typeof jsonData) == "object" ){
            switch (jsonData.State){
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
            this.Result =jsonData.Result;
        }else{
            throw("当前jsonData不是有效的类型!");
        }
    }
}
export  = TaskResult;
