import INamedVO from '../../../interfaces/INamedVO';

export default class VarConfVOBase implements INamedVO {

    public static API_TYPE_ID: string = "simple_var_conf";

    public id: number;
    public _type: string = VarConfVOBase.API_TYPE_ID;

    /**
     * @param id Pour les tests unitaires en priorité, on a juste à set l'id pour éviter de chercher en bdd
     */
    public constructor(public name: string, public var_data_vo_type: string, id: number = null) {
        if (id) {
            this.id = id;
        }
    }
}