import IDistantVOBase from "../../../IDistantVOBase";

/**
 * Cette classe permet de faire le lien entre les formulaires de create / update et le DB
 */
export class CRUDDBLinkVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "crud_db_link";

    public id: number;
    public _type: string = CRUDDBLinkVO.API_TYPE_ID;

    public crud_step_type: number;
    public moduletable_ref_id: number;


}