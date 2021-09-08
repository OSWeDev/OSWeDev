import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";
import HourRange from "../../DataRender/vos/HourRange";
import NumRange from "../../DataRender/vos/NumRange";
import TSRange from "../../DataRender/vos/TSRange";

export default class ContextFilterVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "context_filter";

    public static TYPE_LABELS: string[] = [
        'context_filter.type.FILTER_NOT',
        'context_filter.type.FILTER_AND',
        'context_filter.type.FILTER_OR',
        'context_filter.type.FILTER_XOR',
        'context_filter.type.NULL_ALL',
        'context_filter.type.NULL_ANY',
        'context_filter.type.NULL_NONE',
        'context_filter.type.BOOLEAN_TRUE_ALL',
        'context_filter.type.BOOLEAN_TRUE_ANY',
        'context_filter.type.BOOLEAN_FALSE_ALL',
        'context_filter.type.BOOLEAN_FALSE_ANY',
        'context_filter.type.NUMERIC_INTERSECTS',
        'context_filter.type.NUMERIC_EQUALS',
        'context_filter.type.NUMERIC_INCLUDES',
        'context_filter.type.NUMERIC_IS_INCLUDED_IN',
        'context_filter.type.ID_INTERSECTS',
        'context_filter.type.ID_EQUALS',
        'context_filter.type.ID_INCLUDES',
        'context_filter.type.ID_IS_INCLUDED_IN',
        'context_filter.type.HOUR_INTERSECTS',
        'context_filter.type.HOUR_EQUALS',
        'context_filter.type.HOUR_INCLUDES',
        'context_filter.type.HOUR_IS_INCLUDED_IN',
        'context_filter.type.DATE_INTERSECTS',
        'context_filter.type.DATE_EQUALS',
        'context_filter.type.DATE_INCLUDES',
        'context_filter.type.DATE_IS_INCLUDED_IN',
        'context_filter.type.TEXT_EQUALS_ALL',
        'context_filter.type.TEXT_EQUALS_ANY',
        'context_filter.type.TEXT_INCLUDES_ALL',
        'context_filter.type.TEXT_INCLUDES_ANY',
        'context_filter.type.TEXT_STARTSWITH_ALL',
        'context_filter.type.TEXT_STARTSWITH_ANY',
        'context_filter.type.TEXT_ENDSWITH_ALL',
        'context_filter.type.TEXT_ENDSWITH_ANY',
    ];

    /**
     * Pour les filtres, si le filtre s'applique à un champs à valeur unique, on a pas de distinction
     *  entre TYPE_BOOLEAN_TRUE_ALL et TYPE_BOOLEAN_TRUE_ANY par exemple donc on propose juste TYPE_BOOLEAN_TRUE_ALL et on adapte le texte
     */

    /**
     * A - Les combinaisons de filtres
     */

    /**
     * NOT le filtre en hook left
     */
    public static TYPE_FILTER_NOT: number = 0;

    /**
     * AND OR XOR left hook xx right hook
     */
    public static TYPE_FILTER_AND: number = 1;
    public static TYPE_FILTER_OR: number = 2;
    public static TYPE_FILTER_XOR: number = 3;

    /**
     * B - Les filtres sur les datas
     */

    /**
     * Toutes les valeurs du champs (ou la valeur) sont nulles
     */
    public static TYPE_NULL_ALL: number = 4;
    /**
     * Une valeur du champs (ou la valeur) est nulle
     */
    public static TYPE_NULL_ANY: number = 5;
    /**
     * Aucune valeur du champs (ou la valeur) n'est nulle
     */
    public static TYPE_NULL_NONE: number = 6;

    /**
     * Toutes les valeurs du champs (ou la valeur) sont TRUE
     */
    public static TYPE_BOOLEAN_TRUE_ALL: number = 7; // AND
    /**
     * Une valeur du champs (ou la valeur) est TRUE
     */
    public static TYPE_BOOLEAN_TRUE_ANY: number = 8; // OR
    // public static TYPE_BOOLEAN_TRUE_NONE: number = 2; // NOR
    /**
     * Toutes les valeurs du champs (ou la valeur) sont FALSE
     */
    public static TYPE_BOOLEAN_FALSE_ALL: number = 9; // == TRUE NONE == NOR
    /**
     * Une valeur du champs (ou la valeur) est FALSE
     */
    public static TYPE_BOOLEAN_FALSE_ANY: number = 10; // NAND
    // public static TYPE_BOOLEAN_FALSE_NONE: number = 3; // == TRUE ALL == AND
    // /**
    //  * XOR entre les valeurs => faisable en PGSQL ça ? .....
    //  */
    // public static TYPE_BOOLEAN_XOR: number = 7;
    // /**
    //  * XNOR entre les valeurs => faisable en PGSQL ça ? .....
    //  */
    // public static TYPE_BOOLEAN_XNOR: number = 7;

    /**
     * On stocke la valeur dans param_numranges
     */
    public static TYPE_NUMERIC_INTERSECTS: number = 11;
    public static TYPE_NUMERIC_EQUALS: number = 12;
    public static TYPE_NUMERIC_INCLUDES: number = 13;
    public static TYPE_NUMERIC_IS_INCLUDED_IN: number = 14;

    /**
     * On stocke la valeur dans param_numranges
     * TODO : FIXME : Est-ce vraiment utile de différencier numérique et ID ? pas convaincu
     */
    public static TYPE_ID_INTERSECTS: number = 15;
    public static TYPE_ID_EQUALS: number = 16;
    public static TYPE_ID_INCLUDES: number = 17;
    public static TYPE_ID_IS_INCLUDED_IN: number = 18;

    /**
     * On stocke la valeur dans param_hourranges
     */
    public static TYPE_HOUR_INTERSECTS: number = 19;
    public static TYPE_HOUR_EQUALS: number = 20;
    public static TYPE_HOUR_INCLUDES: number = 21;
    public static TYPE_HOUR_IS_INCLUDED_IN: number = 22;

    /**
     * On stocke la valeur dans param_dateranges
     */
    public static TYPE_DATE_INTERSECTS: number = 23;
    public static TYPE_DATE_EQUALS: number = 24;
    public static TYPE_DATE_INCLUDES: number = 25;
    public static TYPE_DATE_IS_INCLUDED_IN: number = 26;

    /**
     * On stocke la valeur dans param_text
     */
    public static TYPE_TEXT_EQUALS_ALL: number = 27;
    public static TYPE_TEXT_EQUALS_ANY: number = 28;
    public static TYPE_TEXT_INCLUDES_ALL: number = 29;
    public static TYPE_TEXT_INCLUDES_ANY: number = 30;
    public static TYPE_TEXT_STARTSWITH_ALL: number = 31;
    public static TYPE_TEXT_STARTSWITH_ANY: number = 32;
    public static TYPE_TEXT_ENDSWITH_ALL: number = 33;
    public static TYPE_TEXT_ENDSWITH_ANY: number = 34;


    public id: number;
    public _type: string = ContextFilterVO.API_TYPE_ID;

    public vo_type: string;
    public field_id: string;

    public filter_type: number;

    public param_text: string;
    public param_numeric: number;
    public param_textarray: string[];
    public param_tsranges: TSRange[];
    public param_numranges: NumRange[];
    public param_hourranges: HourRange[];

    public left_hook_id: number;
    public right_hook_id: number;

    /**
     * En fait on stocke pas pour le moment en base, à voir après comment on pourra repeupler ces fields au chargement depuis la bdd si besoin
     */
    public left_hook: ContextFilterVO;
    public right_hook: ContextFilterVO;
}