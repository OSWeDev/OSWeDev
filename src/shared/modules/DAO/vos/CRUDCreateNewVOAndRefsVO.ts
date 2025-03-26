import IDistantVOBase from '../../IDistantVOBase';
import CRUDCNVOManyToManyRefVO from './CRUDCNVOManyToManyRefVO';
import CRUDCNVOOneToManyRefVO from './CRUDCNVOOneToManyRefVO';


export default class CRUDCreateNewVOAndRefsVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "crud_create_new_vo_and_refs";

    public id: number;
    public _type: string = CRUDCreateNewVOAndRefsVO.API_TYPE_ID;

    /**
     * Le vo à créer en premier, avec null en id
     */
    public new_vo: IDistantVOBase;

    /**
     * Les vos à créer en second pour les liaisons ManyToMany, et on remplace le champs à null par l'id du vo nouvellement créé
     */
    public many_to_many_vos: CRUDCNVOManyToManyRefVO[];

    /**
     * Les vos à modifier ensuite pour les liaisons OneToMany, et on remplace le champs de liaison vers notre à null par l'id du vo nouvellement créé
     */
    public one_to_many_vos: CRUDCNVOOneToManyRefVO[];
}