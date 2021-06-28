import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";

export default class DAGBuilderNodeVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "dagbuildernode";

    public id: number;
    public _type: string = DAGBuilderNodeVO.API_TYPE_ID;

    public x: number;
    public y: number;

    public component: string;
    public content: string;

    public props_json: string;
}