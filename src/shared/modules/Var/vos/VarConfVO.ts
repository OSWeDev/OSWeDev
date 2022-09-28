import INamedVO from '../../../interfaces/INamedVO';
import VarPixelFieldConfVO from './VarPixelFieldConfVO';

export default class VarConfVO implements INamedVO {

    public static NO_AGGREGATOR: number = 0;
    public static SUM_AGGREGATOR: number = 1;
    public static TIMES_AGGREGATOR: number = 2;
    public static MAX_AGGREGATOR: number = 3;
    public static MIN_AGGREGATOR: number = 4;
    public static AND_AGGREGATOR: number = 5;
    public static OR_AGGREGATOR: number = 6;
    public static XOR_AGGREGATOR: number = 7;
    public static ARRAY_AGG_AGGREGATOR: number = 8;
    public static IS_NULLABLE_AGGREGATOR: number = 9;
    public static ARRAY_AGG_AND_IS_NULLABLE_AGGREGATOR: number = 10;
    public static AGGREGATOR_LABELS: { [id: number]: string } = {
        [VarConfVO.NO_AGGREGATOR]: 'var_conf.aggregator.no',
        [VarConfVO.SUM_AGGREGATOR]: 'var_conf.aggregator.sum',
        [VarConfVO.TIMES_AGGREGATOR]: 'var_conf.aggregator.times',
        [VarConfVO.MAX_AGGREGATOR]: 'var_conf.aggregator.max',
        [VarConfVO.MIN_AGGREGATOR]: 'var_conf.aggregator.min',
        [VarConfVO.AND_AGGREGATOR]: 'var_conf.aggregator.and',
        [VarConfVO.OR_AGGREGATOR]: 'var_conf.aggregator.or',
        [VarConfVO.XOR_AGGREGATOR]: 'var_conf.aggregator.xor',
        [VarConfVO.ARRAY_AGG_AGGREGATOR]: 'var_conf.aggregator.array_agg',
        [VarConfVO.IS_NULLABLE_AGGREGATOR]: 'var_conf.aggregator.is_nullable',
        [VarConfVO.ARRAY_AGG_AND_IS_NULLABLE_AGGREGATOR]: 'var_conf.aggregator.array_agg_and_is_nullable',
    };

    // Cas spécifique du count pour les requêtes qui se traduirait en sum dans une var probablement
    public static COUNT_AGGREGATOR: number = 8;

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
     * On déclare l'agreggation à ce niveau, de manière à pouvoir l'utiliser dans les requêtes
     *  defaults to MainAggregateOperatorsHandlers.SUM_AGGREGATOR
     */
    public aggregator: number;

    /**
     * Possibilité de pixelliser sur une champs (de type id numranges a priori), typiquement un champs de segmentation de la donnée, ce qui permet
     *  de forcer que les calculs se fassent par segment, et on stocke donc le cache par segment. Les autres champs eux sont statiques.
     * Pour les recherches en base, on cherchera ranges 'contenu' sur le segment, et 'strictement égal' sur les autres champs. En gros
     *  on est en train de dire que le calcul a un cout à peu près linéraire suivant le nombre de segments, mais globalement fixe sur les autres dimensions.
     *  Exemple si le segment est la boutique, si on faire sum(CA) sur 10 boutiques, on join 10 tables en fait, et on fait en gros 10 requetes. Par contre si on
     *  fait la sum(CA) sur 1 boutique, et 10 mois, on a 1 requete sur la boutique, juste les dates changent, l'impact en terme de perf est très différent.
     * Quand on va chercher un cache sur x segments, on cherche le count et l'aggrégat en même temps (sum par exemple) et si le count correspond au x
     *  on a dans l'aggrégat la valeur issue du cache et le calcul est terminé. Sinon on demande la liste des id liés au segment, et en fonction on
     *  pixellise en découpant sur le segment les ids qui ne sont pas en cache, et on gère les nouveaux noeuds normalement. On fait un noeud qui regroupe les
     *  ids déjà traités dont la valeur est celle qu'on a déjà chargée avant.
     */
    public pixel_activated: boolean;

    /**
     * Les champs de pixellisation
     */
    public pixel_fields: VarPixelFieldConfVO[];

    /**
     * Lié à la logique de pixellisation, on force le stockage permanent des pixels en mémoire, on invalide mais on supprime plus ces pixels
     */
    public pixel_never_delete: boolean;

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