import INamedVO from '../../../interfaces/INamedVO';

export default class VarConfVO implements INamedVO {

    public static API_TYPE_ID: string = "var_conf";

    public id: number;
    public _type: string = VarConfVO.API_TYPE_ID;

    /**
     * @deprecated Déprécié - utiliser segment_types - Si on a un champ ts_ranges, ce paramètre permet d'en changer le field_id. Par convention on utilise ts_ranges par défaut
     *  on peut laisser ts_ranges si il n'y a pas de ts_ranges, on mettra en revanche ts_ranges_segment_type à null
     */
    public ts_ranges_field_name: string = 'ts_ranges';

    /**
     * @deprecated Déprécié - utiliser segment_types
     */
    public ts_ranges_segment_type: number;

    /**
     * Hide/Show tooltip to explain var to public users (via '?' button)
     */
    public show_help_tooltip: boolean;

    /**
     * Disable computation of this var, denies any computation
     */
    public disable_var: boolean;

    /**
     * @param ts_ranges_segment_type Déprécié - utiliser segment_types - Pour toutes les vars qui sont segmentées sur le temps, on indique le segment_type directement dans la conf de la var. Si la var n'est pas segmentée, on indiquera null sur ce paramètre.
     * @param id Pour les tests unitaires en priorité, on a juste à set l'id pour éviter de chercher en bdd
     */
    public constructor(
        public name: string,
        public var_data_vo_type: string,
        ts_ranges_segment_type: number,
        public segment_types: { [matroid_field_id: string]: number } = null,
        id: number = null) {

        this.ts_ranges_segment_type = ts_ranges_segment_type;
        if (id) {
            this.id = id;
        }
    }
}