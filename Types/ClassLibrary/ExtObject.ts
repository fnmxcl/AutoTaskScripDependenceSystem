/**
 * Created by fnmxcl on 2016/05/26.
 */
class ExtObject{
    ExtKey:string;
    ExtValue:any;
    constructor(extKey?:string,extValue?:any){
        this.ExtKey = extKey;
        this.ExtValue = extValue;
    }
}
export  = ExtObject;
