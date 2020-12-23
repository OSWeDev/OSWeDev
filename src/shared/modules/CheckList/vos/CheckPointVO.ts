import ICheckPoint from '../interfaces/ICheckPoint';

export default class CheckPointVO implements ICheckPoint {
    public static API_TYPE_ID: string = "checkpoint";

    public id: number;
    public _type: string = CheckPointVO.API_TYPE_ID;

    public name: string;
    public shortname: string;
    public explaination: string;

    public checklist_id: number;
}