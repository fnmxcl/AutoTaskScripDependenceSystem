/**
 * Created by fnmxcl on 2016/05/23.
 */
import ExtObject = require("../ClassLibrary/ExtObject");
interface ITask{
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
    ExtObjectArray:Array<ExtObject>;
    SBEFrameWork:any;
    TriggerTask:(autoServiceContext:any) => void ;
    OnAutoServcieComplated:(autoServiceContext:any) => void ;
    OnSuccess:(scriptExecuteData:any) =>void;
    OnFailure:(scriptExecuteData:any) =>void;
    SetExtObject(key:string,value:any):void;
    GetExtObject(key:string):ExtObject;
}
export  = ITask;

