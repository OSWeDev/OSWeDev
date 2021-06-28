import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";

export default class DAGBuilderEdgeVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "dagbuilderedge";

    public id: number;
    public _type: string = DAGBuilderEdgeVO.API_TYPE_ID;

    public from: number;
    public to: number;
    public fromLink: string; // right, left, top, bottom
    public toLink: string; // right, left, top, bottom

    public edgeColor: string;
    public arrowColor: string;
}