import IDistantVOBase from '../../IDistantVOBase';


export default class CRUDCNVOOneToManyRefVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "crud_cnvo_one_to_many_ref";

    public id: number;
    public _type: string = CRUDCNVOOneToManyRefVO.API_TYPE_ID;

    /**
     * L'api_type_id du vo qui fait ref à celui qu'on crée
     */
    public target_vo_api_type_id: string;

    /**
     * l'id du vo qui fait ref à celui qu'on crée
     */
    public target_vo_id: number;

    /**
     * Le field_id à éditer avec l'id du vo créé (null initialement dans le champs)
     */
    public field_id: string;
}