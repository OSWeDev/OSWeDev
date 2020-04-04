import IDistantVOBase from '../../IDistantVOBase';

export default class DocumentDocumentTagVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "d_dt";

    public id: number;
    public _type: string = DocumentDocumentTagVO.API_TYPE_ID;

    public d_id: number;
    public dt_id: number;
}