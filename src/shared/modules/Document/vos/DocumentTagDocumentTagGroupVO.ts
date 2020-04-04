import IDistantVOBase from '../../IDistantVOBase';

export default class DocumentTagDocumentTagGroupVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "dt_dtg";

    public id: number;
    public _type: string = DocumentTagDocumentTagGroupVO.API_TYPE_ID;

    public dtg_id: number;
    public dt_id: number;
}