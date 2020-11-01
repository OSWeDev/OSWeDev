import INamedVO from '../../../interfaces/INamedVO';

export default class VarConfVO implements INamedVO {

    public static API_TYPE_ID: string = "simple_var_conf";

    public id: number;
    public _type: string = VarConfVO.API_TYPE_ID;

    /**
     * @param segment_type Pour toutes les vars qui sont segmentées sur le temps, on indique le segment_type directement dans la conf de la var. Si la var n'est pas segmentée, on indiquera null sur ce paramètre.
     * @param id Pour les tests unitaires en priorité, on a juste à set l'id pour éviter de chercher en bdd
     */
    public constructor(public name: string, public var_data_vo_type: string, public segment_type: number, id: number = null) {
        if (id) {
            this.id = id;
        }
    }
}