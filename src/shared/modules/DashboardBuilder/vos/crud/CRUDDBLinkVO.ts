import IDistantVOBase from "../../../IDistantVOBase";

/**
 * Cette classe permet de faire le lien entre les formulaires de create / update et le DB
 */
export default class CRUDDBLinkVO implements IDistantVOBase {
    // public static CRUD_STEP_TYPE_CREATE: number = 0;
    // public static CRUD_STEP_TYPE_READ: number = 1;
    // public static CRUD_STEP_TYPE_UPDATE: number = 2;
    // // public static CRUD_STEP_TYPE_DELETE: number = 3; Inutile a priori
    // public static CRUD_STEP_TYPE_LABELS: { [step: number]: string } = {
    //     0: "CRUDDBLinkVO.CRUD_STEP_TYPE_CREATE",
    //     1: "CRUDDBLinkVO.CRUD_STEP_TYPE_READ",
    //     2: "CRUDDBLinkVO.CRUD_STEP_TYPE_UPDATE",
    //     // 3: "CRUDDBLinkVO.CRUD_STEP_TYPE_DELETE" // Inutile a priori
    // };

    public static API_TYPE_ID: string = "crud_db_link";

    public id: number;
    public _type: string = CRUDDBLinkVO.API_TYPE_ID;

    // public crud_step_type: number;
    public moduletable_ref_id: number;
    // public db_ref_id: number;

    // On découpe plutôt les 3 options directement en fields pour avoir une table simple éditable qui permette de tout saisir rapidement
    public template_create_db_ref_id: number;
    public template_read_db_ref_id: number;
    public template_update_db_ref_id: number;
}