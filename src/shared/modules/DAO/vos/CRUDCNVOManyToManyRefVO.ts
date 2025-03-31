import IDistantVOBase from '../../IDistantVOBase';


export default class CRUDCNVOManyToManyRefVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "crud_cnvo_many_to_many_ref";

    public id: number;
    public _type: string = CRUDCNVOManyToManyRefVO.API_TYPE_ID;

    /**
     * le vo à créer, avec null dans le champs de liaison vers le nouveau vo
     */
    public new_vo: IDistantVOBase;

    /**
     * Le field_id à éditer avec l'id du vo créé (null initialement dans le champs)
     */
    public field_id: string;
}