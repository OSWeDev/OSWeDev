import { isArray } from "lodash";
import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";
import ConsoleHandler from "../../../tools/ConsoleHandler";
import RangeHandler from "../../../tools/RangeHandler";
import HourRange from "../../DataRender/vos/HourRange";
import NumRange from "../../DataRender/vos/NumRange";
import TimeSegment from "../../DataRender/vos/TimeSegment";
import TSRange from "../../DataRender/vos/TSRange";
import AbstractVO from "../../VO/abstract/AbstractVO";
import ContextQueryVO from "./ContextQueryVO";

export default class ContextFilterVO extends AbstractVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "context_filter";

    public static CUSTOM_FILTERS_TYPE: string = "__custom_filters__";

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

        'context_filter.type.TYPE_DATE_DOW',
        'context_filter.type.TYPE_DATE_DOM',
        'context_filter.type.TYPE_DATE_WEEK',
        'context_filter.type.TYPE_DATE_MONTH',
        'context_filter.type.TYPE_DATE_YEAR',

        'context_filter.type.NUMERIC_INF_ANY',
        'context_filter.type.NUMERIC_INF_ALL',
        'context_filter.type.NUMERIC_INFEQ_ANY',
        'context_filter.type.NUMERIC_INFEQ_ALL',
        'context_filter.type.NUMERIC_SUP_ANY',
        'context_filter.type.NUMERIC_SUP_ALL',
        'context_filter.type.NUMERIC_SUPEQ_ANY',
        'context_filter.type.NUMERIC_SUPEQ_ALL',

        'context_filter.type.TYPE_IN',
        'context_filter.type.TYPE_NOT_IN',
        'context_filter.type.TYPE_NOT_EXISTS',

        'context_filter.type.TYPE_NUMERIC_NOT_EQUALS',
        'context_filter.type.TYPE_NUMERIC_EQUALS_ANY',
        'context_filter.type.TYPE_EXISTS',

        'context_filter.type.FILTER_UNION',
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
    public static TYPE_FILTER_UNION: number = 60;

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
    public static TYPE_NUMERIC_EQUALS_ALL: number = 12;
    public static TYPE_NUMERIC_EQUALS_ANY: number = 58;
    public static TYPE_NUMERIC_INCLUDES: number = 13;
    public static TYPE_NUMERIC_IS_INCLUDED_IN: number = 14;
    public static TYPE_NUMERIC_CONTAINS: number = 61;
    public static TYPE_NUMERIC_NOT_EQUALS: number = 57;

    /**
     * On stocke la valeur dans param_numranges
     * TODO : FIXME : Est-ce vraiment utile de différencier numérique et ID ? pas convaincu
     */
    public static TYPE_ID_INTERSECTS: number = 15;
    public static TYPE_ID_EQUALS: number = 16;
    public static TYPE_ID_INCLUDES: number = 17;
    public static TYPE_ID_IS_INCLUDED_IN: number = 18;

    /**
     * On stocke la valeur dans param_numranges
     */
    public static TYPE_HOUR_INTERSECTS: number = 19;
    public static TYPE_HOUR_EQUALS: number = 20;
    public static TYPE_HOUR_INCLUDES: number = 21;
    public static TYPE_HOUR_IS_INCLUDED_IN: number = 22;

    /**
     * On stocke la valeur dans param_numranges
     */
    public static TYPE_MINUTE_INTERSECTS: number = 62;
    public static TYPE_MINUTE_EQUALS: number = 63;
    public static TYPE_MINUTE_INCLUDES: number = 64;
    public static TYPE_MINUTE_IS_INCLUDED_IN: number = 65;

    /**
     * On stocke la valeur dans param_numranges
     */
    public static TYPE_SECOND_INTERSECTS: number = 66;
    public static TYPE_SECOND_EQUALS: number = 67;
    public static TYPE_SECOND_INCLUDES: number = 68;
    public static TYPE_SECOND_IS_INCLUDED_IN: number = 69;

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

    public static TYPE_TEXT_EQUALS_NONE: number = 35;
    public static TYPE_TEXT_INCLUDES_NONE: number = 36;
    public static TYPE_TEXT_STARTSWITH_NONE: number = 37;
    public static TYPE_TEXT_ENDSWITH_NONE: number = 38;

    public static TYPE_TEXT_CONTAINS_ALL_EXACT: number = 60;

    /**
     * Dates special filters
     */
    public static TYPE_DATE_DOW: number = 39;
    public static TYPE_DATE_DOM: number = 40;
    public static TYPE_DATE_WEEK: number = 41;
    public static TYPE_DATE_MONTH: number = 42;
    public static TYPE_DATE_YEAR: number = 43;

    /**
     * Numeric > >= < <=
     */
    public static TYPE_NUMERIC_INF_ANY: number = 44;
    public static TYPE_NUMERIC_INF_ALL: number = 45;
    public static TYPE_NUMERIC_INFEQ_ANY: number = 46;
    public static TYPE_NUMERIC_INFEQ_ALL: number = 47;
    public static TYPE_NUMERIC_SUP_ANY: number = 48;
    public static TYPE_NUMERIC_SUP_ALL: number = 49;
    public static TYPE_NUMERIC_SUPEQ_ANY: number = 50;
    public static TYPE_NUMERIC_SUPEQ_ALL: number = 51;

    /**
     * Pour faire le lien avec une sous-requête
     *  Le lien sera fait en indiquant field_name in (%SUB_QUERY%)
     */
    public static TYPE_IN: number = 52;

    /**
     * Pour faire le lien avec une sous-requête
     *  Le lien sera fait en indiquant field_name not in (%SUB_QUERY%)
     */
    public static TYPE_NOT_IN: number = 55;

    /**
     * Pour faire le lien avec une sous-requête
     *  Le lien sera fait en indiquant not exists (%SUB_QUERY%)
     */
    public static TYPE_NOT_EXISTS: number = 56;
    /**
     * Pour faire le lien avec une sous-requête
     *  Le lien sera fait en indiquant exists (%SUB_QUERY%)
     */
    public static TYPE_EXISTS: number = 59;

    /**
     * (Vide) et (vide || null)
     *  par exemple sur les array on peut tester la taille == 0 ou sur les type string == ''
     */
    public static TYPE_EMPTY: number = 53;
    public static TYPE_NULL_OR_EMPTY: number = 54;

    /**
     * Sucre syntaxique pour echaîner facilement des or et obtenir le filtre résultat
     * @param filters les filtres à joindre par une chaîne OR
     */
    public static or(filters: ContextFilterVO[]): ContextFilterVO {
        return this.chain_cond(filters, ContextFilterVO.TYPE_FILTER_OR);
    }

    /**
     * Sucre syntaxique pour echaîner facilement des and et obtenir le filtre résultat
     * @param filters les filtres à joindre par une chaîne AND
     */
    public static and(filters: ContextFilterVO[]): ContextFilterVO {
        return this.chain_cond(filters, ContextFilterVO.TYPE_FILTER_AND);
    }

    /**
     * Sucre syntaxique pour echaîner facilement des xor et obtenir le filtre résultat
     * @param filters les filtres à joindre par une chaîne XOR
     */
    public static xor(filters: ContextFilterVO[]): ContextFilterVO {
        return this.chain_cond(filters, ContextFilterVO.TYPE_FILTER_XOR);
    }

    /**
     * Sucre syntaxique pour echaîner facilement des union et obtenir le filtre résultat
     * @param filters les filtres à joindre par une chaîne UNION
     */
    public static union(filters: ContextFilterVO[]): ContextFilterVO {
        return this.chain_cond(filters, ContextFilterVO.TYPE_FILTER_UNION);
    }

    private static UID_QUERY_TABLE_PREFIX: number = 0;

    private static chain_cond(filters: ContextFilterVO[], type: number): ContextFilterVO {
        if ((!filters) || (!filters.length)) {
            return null;
        }

        if (filters.length == 1) {
            return filters[0];
        }

        let res: ContextFilterVO = null;
        let first_filter: ContextFilterVO = null;
        for (let i = 0; i < (filters.length - 1); i++) {
            let filter_ = filters[i];

            let tmp = new ContextFilterVO();
            tmp.filter_type = type;
            tmp.left_hook = filter_;
            tmp.right_hook = res;
            if (!first_filter) {
                first_filter = tmp;
            }
            res = tmp;
        }

        first_filter.right_hook = filters[filters.length - 1];
        return res;
    }

    public id: number;
    public _type: string = ContextFilterVO.API_TYPE_ID;

    public vo_type: string;
    public field_name: string;

    public filter_type: number;

    public param_text: string;
    public param_numeric: number;
    public param_numeric_array: number[];
    public param_textarray: string[];
    public param_tsranges: TSRange[];
    public param_numranges: NumRange[];
    public param_hourranges: HourRange[];

    /**
     * Permet d'influer sur les filtrage en indiquant un lower sur le field et sur le param du filtrage pour test en ignore_case
     */
    public text_ignore_case: boolean = true;
    /**
     * Permet d'influer sur les filtrage en indiquant un trim sur le field et sur le param du filtrage
     */
    // public text_trim: boolean = false;

    /**
     * En fait on stocke pas pour le moment en base, à voir après comment on pourra repeupler ces fields au chargement depuis la bdd si besoin
     */
    public left_hook: ContextFilterVO;

    /**
     * - Can be actual field_filter
     * - Can be a tree of context_filters (in case when filter_type is one of AND/OR/XOR)
     */
    public right_hook: ContextFilterVO;

    /**
     * Permet de faire référence à un field de la query, plutôt qu'une valeur
     */
    public param_alias: string;

    /**
     * WARNING : Ne pas modifier directement toujours passer par set_sub_query pour mettre à jour le prefix de la sub_query
     * Sous-requête liée dans le cas d'un type sub_query
     */
    public sub_query: ContextQueryVO = null;

    /**
     * Hydrate this from the given properties
     *
     * @param {Partial<T>} props
     * @returns {T}
     */
    public from(props: Partial<ContextFilterVO>): this {
        return super.from(props);
    }

    /**
     * Filtrer par text en début de la valeur du champ
     * @param included le texte qu'on veut voir apparaître au début de la valeur du champs
     */
    public by_text_starting_with(starts_with: string | string[], text_ignore_case: boolean = true/*, text_trim: boolean = false*/): ContextFilterVO {
        this.filter_type = ContextFilterVO.TYPE_TEXT_STARTSWITH_ANY;
        if (isArray(starts_with)) {
            this.param_textarray = starts_with;
        } else {
            this.param_text = starts_with;
        }

        this.text_ignore_case = text_ignore_case;
        // this.text_trim = text_trim;

        return this;
    }

    /**
     * Filtrer par text pas en début de la valeur du champ
     * @param included le texte qu'on veut pas voir apparaître au début de la valeur du champs
     */
    public by_text_starting_with_none(starts_with: string | string[], text_ignore_case: boolean = true/*, text_trim: boolean = false*/): ContextFilterVO {
        this.filter_type = ContextFilterVO.TYPE_TEXT_STARTSWITH_NONE;
        if (isArray(starts_with)) {
            this.param_textarray = starts_with;
        } else {
            this.param_text = starts_with;
        }

        this.text_ignore_case = text_ignore_case;
        // this.text_trim = text_trim;

        return this;
    }

    /**
     * Filtrer par text strictement égal
     * @param text le texte que l'on doit retrouver à l'identique en base
     */
    public by_text_eq(text: string | string[], text_ignore_case: boolean = false/*, text_trim: boolean = false*/): ContextFilterVO {
        this.filter_type = ContextFilterVO.TYPE_TEXT_EQUALS_ALL;
        if (isArray(text)) {
            this.param_textarray = text;
        } else {
            this.param_text = text;
        }

        this.text_ignore_case = text_ignore_case;
        // this.text_trim = text_trim;

        return this;
    }

    /**
     * Filtrer par text égal (au moins une fois)
     */
    public by_text_has_alias(alias: string, text_ignore_case: boolean = false/*, text_trim: boolean = false*/): ContextFilterVO {
        this.filter_type = ContextFilterVO.TYPE_TEXT_EQUALS_ANY;
        this.param_alias = alias;

        this.text_ignore_case = text_ignore_case;
        // this.text_trim = text_trim;

        return this;
    }

    /**
     * Filtrer par text strictement égal
     */
    public by_text_eq_alias(alias: string, text_ignore_case: boolean = false/*, text_trim: boolean = false*/): ContextFilterVO {
        this.filter_type = ContextFilterVO.TYPE_TEXT_EQUALS_ALL;
        this.param_alias = alias;

        this.text_ignore_case = text_ignore_case;
        // this.text_trim = text_trim;

        return this;
    }

    /**
     * Filtrer par text égal (au moins une fois)
     * @param text le texte que l'on doit retrouver à l'identique en base
     */
    public by_text_has(text: string | string[], text_ignore_case: boolean = false/*, text_trim: boolean = false*/): ContextFilterVO {
        this.filter_type = ContextFilterVO.TYPE_TEXT_EQUALS_ANY;
        if (isArray(text)) {
            this.param_textarray = text;
        } else {
            this.param_text = text;
        }

        this.text_ignore_case = text_ignore_case;
        // this.text_trim = text_trim;

        return this;
    }

    /**
     * Filtrer par text différent systématiquement
     * @param text le texte que l'on filtre
     */
    public by_text_has_none(text: string | string[], text_ignore_case: boolean = false/*, text_trim: boolean = false*/): ContextFilterVO {
        this.filter_type = ContextFilterVO.TYPE_TEXT_EQUALS_NONE;
        if (isArray(text)) {
            this.param_textarray = text;
        } else {
            this.param_text = text;
        }

        this.text_ignore_case = text_ignore_case;
        // this.text_trim = text_trim;

        return this;
    }

    /**
     * Filtrer par text contenu dans la valeur du champ
     * @param included le texte qu'on veut voir apparaître dans la valeur du champs
     */
    public by_text_including(included: string | string[], text_ignore_case: boolean = true/*, text_trim: boolean = false*/): ContextFilterVO {
        this.filter_type = ContextFilterVO.TYPE_TEXT_INCLUDES_ANY;
        if (isArray(included)) {
            this.param_textarray = included;
        } else {
            this.param_text = included;
        }

        this.text_ignore_case = text_ignore_case;
        // this.text_trim = text_trim;

        return this;
    }

    /**
     * Filtrer par text non contenu dans la valeur du champ
     * @param included le texte qu'on ne veut pas voir apparaître dans la valeur du champs
     */
    public by_text_excluding(included: string | string[], text_ignore_case: boolean = true/*, text_trim: boolean = false*/): ContextFilterVO {
        this.filter_type = ContextFilterVO.TYPE_TEXT_INCLUDES_NONE;
        if (isArray(included)) {
            this.param_textarray = included;
        } else {
            this.param_text = included;
        }

        this.text_ignore_case = text_ignore_case;
        // this.text_trim = text_trim;

        return this;
    }

    /**
     * Filter by ID not in (subquery)
     * @param query la sous requête qui doit renvoyer les ids comme unique field
     */
    public by_id_not_in(query: ContextQueryVO, this_query: ContextQueryVO = null): ContextFilterVO {
        this.field_name = 'id';
        this.filter_type = ContextFilterVO.TYPE_NOT_IN;
        this.set_sub_query(query, this_query);
        return this;
    }

    /**
     * Filtrer un champ number par un sous-requête : field not in (subquery)
     * @param query la sous requête qui doit renvoyer les nums acceptés en un unique field
     */
    public by_num_not_in(query: ContextQueryVO, this_query: ContextQueryVO = null): ContextFilterVO {
        this.filter_type = ContextFilterVO.TYPE_NOT_IN;
        this.set_sub_query(query, this_query);
        return this;
    }

    /**
     * Filtrer en fonction d'un sub en exists
     * @param query la sous requête qui doit renvoyer aucune ligne pour être valide
     */
    public by_exists(query: ContextQueryVO, this_query: ContextQueryVO = null): ContextFilterVO {
        this.filter_type = ContextFilterVO.TYPE_EXISTS;
        this.set_sub_query(query, this_query);
        return this;
    }

    /**
     * Filtrer en fonction d'un sub en not exists
     * @param query la sous requête qui doit renvoyer aucune ligne pour être valide
     */
    public by_not_exists(query: ContextQueryVO, this_query: ContextQueryVO = null): ContextFilterVO {
        this.filter_type = ContextFilterVO.TYPE_NOT_EXISTS;
        this.set_sub_query(query, this_query);
        return this;
    }

    /**
     * Filter by ID in (subquery)
     * @param query la sous requête qui doit renvoyer les ids comme unique field
     */
    public by_id_in(query: ContextQueryVO, this_query: ContextQueryVO = null): ContextFilterVO {
        this.field_name = 'id';
        this.filter_type = ContextFilterVO.TYPE_IN;
        this.set_sub_query(query, this_query);
        return this;
    }

    /**
     * Filtrer un champ number par un sous-requête : field in (subquery)
     * @param query la sous requête qui doit renvoyer les nums acceptés en un unique field
     */
    public by_num_in(query: ContextQueryVO, this_query: ContextQueryVO = null): ContextFilterVO {
        this.filter_type = ContextFilterVO.TYPE_IN;
        this.set_sub_query(query, this_query);
        return this;
    }

    /**
     * Enchaîner des or
     * @param filter le filtre qu'on veut chaîner en OU
     */
    public or(filter_: ContextFilterVO): ContextFilterVO {
        if (!filter_) {
            return this;
        }

        return ContextFilterVO.or([this, filter_]);
    }

    /**
     * Enchaîner des and
     * @param filter le filtre qu'on veut chaîner en ET
     */
    public and(filter_: ContextFilterVO): ContextFilterVO {
        if (!filter_) {
            return this;
        }

        return ContextFilterVO.and([this, filter_]);
    }

    /**
     * Enchaîner des and
     * @param _filters le filtre qu'on veut chaîner en ET
     */
    public andMany(_filters: ContextFilterVO[]): ContextFilterVO {
        if (!(_filters?.length > 0)) {
            return this;
        }

        return ContextFilterVO.and([this, ..._filters]);
    }

    /**
     * Enchaîner des xor
     * @param filter le filtre qu'on veut chaîner en XOR
     */
    public xor(filter_: ContextFilterVO): ContextFilterVO {
        if (!filter_) {
            return this;
        }

        return ContextFilterVO.xor([this, filter_]);
    }

    /**
     * Enchaîner des union
     * @param {ContextFilterVO} _filter le filtre qu'on veut chaîner en XOR
     */
    public union(_filter: ContextFilterVO): ContextFilterVO {
        if (!_filter) {
            return this;
        }

        return ContextFilterVO.union([this, _filter]);
    }

    /**
     * Enchaîner des union
     * @param {ContextFilterVO} _filter le filtre qu'on veut chaîner en XOR
     */
    public unionMany(_filters: ContextFilterVO[]): ContextFilterVO {
        if (!(_filters?.length > 0)) {
            return this;
        }

        return ContextFilterVO.union([this, ..._filters]);
    }

    /**
     * Filtre par champs < param date
     * @param date timestamp en secondes
     * @param segmentation_type optionnel, par défaut TimeSegment.TYPE_SECOND, normalement (si les segmentations sont gérées correctement en amont) inutile sur un <
     */
    public by_date_before(date: number, segmentation_type: number = TimeSegment.TYPE_SECOND): ContextFilterVO {
        this.filter_type = ContextFilterVO.TYPE_DATE_INTERSECTS;
        this.param_tsranges = [RangeHandler.createNew(TSRange.RANGE_TYPE, RangeHandler.MIN_TS, date, true, false, segmentation_type)];
        return this;
    }

    /**
     * Filtre par champs <= param date
     * @param date timestamp en secondes
     * @param segmentation_type optionnel, par défaut TimeSegment.TYPE_SECOND
     */
    public by_date_same_or_before(date: number, segmentation_type: number = TimeSegment.TYPE_SECOND): ContextFilterVO {
        this.filter_type = ContextFilterVO.TYPE_DATE_INTERSECTS;
        this.param_tsranges = [RangeHandler.createNew(TSRange.RANGE_TYPE, RangeHandler.MIN_TS, date, true, true, segmentation_type)];
        return this;
    }

    /**
     * Filtre par champs > param date
     * @param date timestamp en secondes
     * @param segmentation_type optionnel, par défaut TimeSegment.TYPE_SECOND
     */
    public by_date_after(date: number, segmentation_type: number = TimeSegment.TYPE_SECOND): ContextFilterVO {
        this.filter_type = ContextFilterVO.TYPE_DATE_INTERSECTS;
        this.param_tsranges = [RangeHandler.createNew(TSRange.RANGE_TYPE, date, RangeHandler.MAX_TS, false, false, segmentation_type)];
        return this;
    }

    /**
     * Filtre par champs >= param date
     * @param date timestamp en secondes
     * @param segmentation_type optionnel, par défaut TimeSegment.TYPE_SECOND
     */
    public by_date_same_or_after(date: number, segmentation_type: number = TimeSegment.TYPE_SECOND): ContextFilterVO {
        this.filter_type = ContextFilterVO.TYPE_DATE_INTERSECTS;
        this.param_tsranges = [RangeHandler.createNew(TSRange.RANGE_TYPE, date, RangeHandler.MAX_TS, true, false, segmentation_type)];
        return this;
    }

    /**
     * Filtre par un nombre simple == ALL
     * @param alias alias du champs à comparer
     */
    public by_num_eq_alias(alias: string): ContextFilterVO {
        this.filter_type = ContextFilterVO.TYPE_NUMERIC_EQUALS_ALL;
        this.param_alias = alias;
        return this;
    }

    /**
     * Filtre par un nombre simple == ALL
     * @param num le nombre à utiliser dans le filtre
     */
    public by_num_eq(num: number | NumRange | NumRange[] | number[]): ContextFilterVO {
        this.filter_type = ContextFilterVO.TYPE_NUMERIC_EQUALS_ALL;
        if (typeof num === "number") {
            this.param_numeric = num;
        } else {

            if (isArray(num) && (num.length > 0) && (typeof num[0] === "number")) {
                this.param_numeric_array = num as number[];
            } else {
                this.param_numranges = isArray(num) ? num as NumRange[] : (num ? [num] as NumRange[] : null);
            }
        }

        return this;
    }

    /**
     * Filtre par un nombre simple == ANY
     * @param alias alias du champs à comparer
     */
    public by_num_has_alias(alias: string): ContextFilterVO {
        this.filter_type = ContextFilterVO.TYPE_NUMERIC_EQUALS_ANY;
        this.param_alias = alias;
        return this;
    }

    /**
     * Filtre par un nombre simple == ANY
     * @param nums les nombres à utiliser dans le filtre
     */
    public by_num_has(nums: number[]): ContextFilterVO {
        this.filter_type = ContextFilterVO.TYPE_NUMERIC_EQUALS_ANY;
        this.param_numeric_array = nums;

        return this;
    }

    /**
     * Filtre par un nombre simple !=
     * @param num le nombre à utiliser dans le filtre
     */
    public by_num_not_eq_alias(alias: string): ContextFilterVO {
        this.filter_type = ContextFilterVO.TYPE_NUMERIC_NOT_EQUALS;
        this.param_alias = alias;
        return this;
    }

    /**
     * Filtre par un nombre simple !=
     * @param num le nombre à utiliser dans le filtre
     */
    public by_num_not_eq(num: number): ContextFilterVO {
        this.filter_type = ContextFilterVO.TYPE_NUMERIC_NOT_EQUALS;
        this.param_numeric = num;
        return this;
    }

    /**
     * Filtre par un nombre simple field > nombre
     * @param num le nombre à utiliser dans le filtre
     */
    public by_num_sup(num: number): ContextFilterVO {
        this.filter_type = ContextFilterVO.TYPE_NUMERIC_SUP_ALL;
        this.param_numeric = num;
        return this;
    }

    /**
     * Filtre par un nombre simple field >= nombre
     * @param num le nombre à utiliser dans le filtre
     */
    public by_num_sup_eq(num: number): ContextFilterVO {
        this.filter_type = ContextFilterVO.TYPE_NUMERIC_SUPEQ_ALL;
        this.param_numeric = num;
        return this;
    }

    /**
     * Filtre par un nombre simple field < nombre
     * @param num le nombre à utiliser dans le filtre
     */
    public by_num_inf(num: number): ContextFilterVO {
        this.filter_type = ContextFilterVO.TYPE_NUMERIC_INF_ALL;
        this.param_numeric = num;
        return this;
    }

    /**
     * Filtre par un nombre simple field <= nombre
     * @param num le nombre à utiliser dans le filtre
     */
    public by_num_inf_eq(num: number): ContextFilterVO {
        this.filter_type = ContextFilterVO.TYPE_NUMERIC_INFEQ_ALL;
        this.param_numeric = num;
        return this;
    }

    /**
     * Filtre par == de date
     * @param alias
     */
    public by_date_eq_alias(alias: string): ContextFilterVO {
        this.filter_type = ContextFilterVO.TYPE_DATE_EQUALS;
        this.param_alias = alias;
        return this;
    }

    /**
     * Filtre par == de date
     * @param date
     */
    public by_date_eq(date: number | number[] | TSRange | TSRange[]): ContextFilterVO {
        this.filter_type = ContextFilterVO.TYPE_DATE_EQUALS;
        if (typeof date === "number") {
            this.param_numeric = date;
        } else if (Array.isArray(date) && (date.length > 0) && (typeof date[0] === "number")) {
            // cas number[]
            this.param_numeric_array = date as number[];
        } else {
            this.param_tsranges = isArray(date) ? date as TSRange[] : (date ? [date] : null);
        }
        return this;
    }

    /**
     * Filtre par inclusion de ts_ranges
     * @param ranges
     */
    public by_date_is_in_ranges(ranges: TSRange[]): ContextFilterVO {
        this.filter_type = ContextFilterVO.TYPE_DATE_IS_INCLUDED_IN;
        this.param_tsranges = ranges;
        return this;
    }

    /**
     * Filtre par intersection de ts_ranges
     * @param ranges
     */
    public by_date_x_ranges(ranges: TSRange[]): ContextFilterVO {
        this.filter_type = ContextFilterVO.TYPE_DATE_INTERSECTS;
        this.param_tsranges = ranges;
        return this;
    }

    /**
     * Filtre par inclusion de num_ranges
     * @param ranges
     */
    public by_num_is_in_ranges(ranges: NumRange[]): ContextFilterVO {
        this.filter_type = ContextFilterVO.TYPE_NUMERIC_IS_INCLUDED_IN;
        this.param_numranges = ranges;
        return this;
    }

    /**
     * Filtre par inclusion de num_ranges et vérifie que le nombre de valeurs est supérieur ou égal au nombre de ranges
     * @param ranges
     */
    public by_num_contains_ranges(ranges: NumRange[]): ContextFilterVO {
        this.filter_type = ContextFilterVO.TYPE_NUMERIC_CONTAINS;
        this.param_numranges = ranges;
        return this;
    }

    /**
     * Filtre par intersection de num_ranges
     * @param ranges
     */
    public by_num_x_ranges(ranges: NumRange[]): ContextFilterVO {
        this.filter_type = ContextFilterVO.TYPE_NUMERIC_INTERSECTS;
        this.param_numranges = ranges;
        return this;
    }

    /**
     * Filter sur le champs id, avec un id numérique simple
     * @param id la valeur de l'id qu'on veut filtrer
     */
    public by_id(id: number): ContextFilterVO {
        this.field_name = 'id';
        this.filter_type = ContextFilterVO.TYPE_NUMERIC_EQUALS_ALL;
        this.param_numeric = id;
        return this;
    }

    /**
     * Filter sur le champs id, avec un numranges à intersecter
     * @param id_ranges les ids qu'on filtre
     */
    public by_ids(id_ranges: NumRange[] | number[]): ContextFilterVO {

        if ((!id_ranges) || (!id_ranges.length) || (!id_ranges[0])) {
            /**
             * On filtre par ids, mais sans ids, donc c'est pas valide comme demande
             */
            throw new Error('ContextFilterVO.by_ids: no ids provided');
        }

        this.field_name = 'id';

        if (Array.isArray(id_ranges) && (id_ranges.length > 0) && (typeof id_ranges[0] === 'number')) {
            this.filter_type = ContextFilterVO.TYPE_NUMERIC_EQUALS_ANY;
            this.param_numeric_array = id_ranges as number[];
        } else {
            this.filter_type = ContextFilterVO.TYPE_NUMERIC_INTERSECTS;
            this.param_numranges = id_ranges as NumRange[];
        }

        return this;
    }

    /**
     * Filter sur champs strictement NULL
     */
    public is_null(): ContextFilterVO {
        this.filter_type = ContextFilterVO.TYPE_NULL_ALL;
        return this;
    }

    /**
     * Filter sur champs au moins partiellement NULL
     */
    public has_null(): ContextFilterVO {
        this.filter_type = ContextFilterVO.TYPE_NULL_ANY;
        return this;
    }

    /**
     * Filter sur champs strictement NON NULL
     */
    public is_not_null(): ContextFilterVO {
        this.filter_type = ContextFilterVO.TYPE_NULL_NONE;
        return this;
    }

    /**
     * Filter sur champs strictement NULL ou VIDE
     */
    public is_null_or_empty(): ContextFilterVO {
        this.filter_type = ContextFilterVO.TYPE_NULL_OR_EMPTY;
        return this;
    }

    /**
     * Filter sur le champs par boolean strictement vrai
     */
    public is_true(): ContextFilterVO {
        this.filter_type = ContextFilterVO.TYPE_BOOLEAN_TRUE_ALL;
        return this;
    }

    /**
     * Filter sur le champs par boolean strictement faux
     */
    public is_false(): ContextFilterVO {
        this.filter_type = ContextFilterVO.TYPE_BOOLEAN_FALSE_ALL;
        return this;
    }

    /**
     * Filter sur le champs par boolean au moins partiellement vrai
     */
    public has_true(): ContextFilterVO {
        this.filter_type = ContextFilterVO.TYPE_BOOLEAN_TRUE_ANY;
        return this;
    }

    /**
     * Filter sur le champs par boolean au moins partiellement faux
     */
    public has_false(): ContextFilterVO {
        this.filter_type = ContextFilterVO.TYPE_BOOLEAN_FALSE_ANY;
        return this;
    }

    /**
     *
     * @param sub_query
     * @param this_query TODO FIXME : est-ce vraiment utile... pourquoi ça sufirait pas d'avoir toujours un id unique ?
     * @returns
     */
    public set_sub_query(sub_query: ContextQueryVO, this_query: ContextQueryVO = null): ContextFilterVO {
        this.sub_query = sub_query;
        if (!sub_query) {
            return this;
        }

        sub_query.query_tables_prefix = this_query ?
            ('_' + (this_query.query_tables_prefix ? this_query.query_tables_prefix : '')) :
            ('_' + ContextFilterVO.UID_QUERY_TABLE_PREFIX++);
        return this;
    }

    public log(is_error: boolean = false) {
        let log_func = ConsoleHandler.log;

        if (is_error) {
            log_func = ConsoleHandler.error;
        }

        log_func('ContextQueryFilterVO - vo_type:' + this.vo_type);
        log_func('                     - field_name:' + this.field_name);
        log_func('                     - filter_type:' + this.filter_type + ':' + ContextFilterVO.TYPE_LABELS[this.filter_type]);
        log_func('                     - param_text:' + this.param_text);
        log_func('                     - param_numeric:' + this.param_numeric);
        log_func('                     - param_numeric_array:' + (this.param_numeric_array ? JSON.stringify(this.param_numeric_array) : 'null'));
        log_func('                     - param_textarray:' + (this.param_textarray ? JSON.stringify(this.param_textarray) : 'null'));
        log_func('                     - param_tsranges:' + (this.param_tsranges ? RangeHandler.translate_to_bdd(this.param_tsranges) : 'null'));
        log_func('                     - param_numranges:' + (this.param_numranges ? RangeHandler.translate_to_bdd(this.param_numranges) : 'null'));
        log_func('                     - param_hourranges:' + (this.param_hourranges ? RangeHandler.translate_to_bdd(this.param_hourranges) : 'null'));
        log_func('                     - text_ignore_case:' + this.text_ignore_case);
        log_func('                     - left_hook:' + (this.left_hook ? this.left_hook.log(is_error) : 'null'));
        log_func('                     - right_hook:' + (this.right_hook ? this.right_hook.log(is_error) : 'null'));
        log_func('                     - param_alias:' + this.param_alias);
        log_func('                     - sub_query:' + (this.sub_query ? this.sub_query.log(is_error) : 'null'));
    }
}

/**
 * Sucre syntaxique utilisant le design pattern Proxy
 *  on initialise un filtre avec les confs par défaut ou passées en param
 * @param API_TYPE_ID le type de base de la query
 */
export const filter = (API_TYPE_ID: string = null, field_name: string = null): ContextFilterVO => {
    let res = new ContextFilterVO();
    res.field_name = field_name;
    res.filter_type = null;
    res.left_hook = null;
    res.right_hook = null;
    res.param_hourranges = null;
    res.param_numeric = null;
    res.param_numranges = null;
    res.param_text = null;
    res.param_tsranges = null;
    res.param_textarray = null;
    res.vo_type = API_TYPE_ID;
    return res;
};