import IDistantVOBase from './IDistantVOBase';

export default class ModuleVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "modules";

    public id: number;
    public _type: string = ModuleVO.API_TYPE_ID;

    public name: string;
    public actif: boolean;
}