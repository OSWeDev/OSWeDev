import cloneDeep from 'lodash/cloneDeep';
import RangeHandler from '../../tools/RangeHandler';
import ModuleTableController from '../DAO/ModuleTableController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import ModuleTableVO from '../DAO/vos/ModuleTableVO';
import IRange from '../DataRender/interfaces/IRange';
import MatroidBaseController from './MatroidBaseController';
import IMatroid from './interfaces/IMatroid';
import MatroidBase from './vos/MatroidBase';
import MatroidBaseCutResult from './vos/MatroidBaseCutResult';
import MatroidCutResult from './vos/MatroidCutResult';

export default class MatroidController {

    public static async initialize() {
    }

    public static check_bases_not_max_ranges(matroid: IMatroid): boolean {
        const matroid_bases = this.getMatroidBases(matroid);

        for (const i in matroid_bases) {
            const matroid_base = matroid_bases[i];

            for (const j in matroid_base.ranges) {
                const range = matroid_base.ranges[j];
                if (RangeHandler.is_one_max_range(range)) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * TODO FIXME ASAP TU VARS
     * On définit le cardinal du matroid par la multiplication des cardinaux des bases
     * @param matroid
     */
    public static get_cardinal(matroid: IMatroid): number {

        if (!matroid) {
            return 0;
        }

        const matroid_bases = this.getMatroidBases(matroid);

        let res = null;

        for (const i in matroid_bases) {
            const matroid_base = matroid_bases[i];
            const matroid_base_cardinal = (matroid_base != null) ? MatroidBaseController.getInstance().get_cardinal(matroid_base) : 0;

            res = (res != null) ? res * matroid_base_cardinal : matroid_base_cardinal;
        }
        return (res != null) ? res : 0;
    }

    public static getIndex<T extends IMatroid>(matroid: T): string {

        if (!matroid) {
            return null;
        }

        let res: string = matroid._type;

        const fields: ModuleTableFieldVO[] = this.getMatroidFields(matroid._type);

        for (const i in fields) {
            const field = fields[i];

            res += '_' + RangeHandler.getIndexRanges(matroid[field.field_type]);
        }

        return res;
    }

    // FIXME Algo naif certainement très mauvais mais simple
    //  on regarde si on trouve des matroids identiques, on ignore le second,
    //  si on trouve des matroids qui n'ont qu'une base différente, on fait une union des bases sur le premier et on ignore le second,
    //  si on trouve plus d'une base différente
    public static union<T extends IMatroid>(matroids: T[]): T[] {
        const res: T[] = [];

        if ((!matroids) || (!matroids.length)) {
            return null;
        }

        const moduletable = ModuleTableController.module_tables_by_vo_type[matroids[0]._type];

        if (!moduletable) {
            return null;
        }

        const ranges_need_union: { [res_i: number]: { [field_id: string]: boolean } } = {};
        for (const i in matroids) {

            const tested_matroid = matroids[i];
            let ignore_matroid: boolean = false;

            for (const j in res) {
                const matroid = res[j];

                const different_field_ids: string[] = this.get_different_field_ids(tested_matroid, matroid);

                if ((!different_field_ids) || (different_field_ids.length == 0)) {
                    ignore_matroid = true;
                    break;
                }

                if (different_field_ids.length > 1) {
                    continue;
                }

                if (different_field_ids.length == 1) {

                    // matroid[different_field_ids[0]] = RangeHandler.getRangesUnion(tested_matroid[different_field_ids[0]].concat(matroid[different_field_ids[0]]));
                    // Au lieu de faire l'union à chaque rapprochement on tag ce champ comme nécessitant une union en fin de calcul avant de tout renvoyer
                    matroid[different_field_ids[0]] = tested_matroid[different_field_ids[0]].concat(matroid[different_field_ids[0]]);
                    if (!ranges_need_union[j]) {
                        ranges_need_union[j] = {};
                    }
                    ranges_need_union[j][different_field_ids[0]] = true;

                    ignore_matroid = true;
                    break;
                }
            }

            if (ignore_matroid) {
                continue;
            }

            res.push(this.cloneFrom(tested_matroid));
        }

        for (const i in ranges_need_union) {
            const matroid: T = res[i];

            for (const field_id in ranges_need_union[i]) {
                matroid[field_id] = RangeHandler.getRangesUnion(matroid[field_id]);
            }

            if (matroid['_index']) {
                res['rebuild_index']();
            }
        }

        return res;
    }

    /**
     * FIXME TODO ASAP WITH TU
     */
    public static getMatroidFields(api_type_id: string): ModuleTableFieldVO[] {
        const moduleTable: ModuleTableVO = ModuleTableController.module_tables_by_vo_type[api_type_id];

        if (!moduleTable) {
            return null;
        }

        const matroid_fields: ModuleTableFieldVO[] = [];
        const mt_fields = moduleTable.get_fields();
        for (const i in mt_fields) {
            const field = mt_fields[i];

            switch (field.field_type) {
                // case ModuleTableFieldVO.FIELD_TYPE_daterange_array:
                case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
                case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
                case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                case ModuleTableFieldVO.FIELD_TYPE_hourrange_array:
                case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                    break;

                default:
                    continue;
            }

            matroid_fields.push(field);
        }

        return matroid_fields;
    }

    /**
     * FIXME TODO ASAP WITH TU
     * @param sort Sorts by cardinal
     */
    public static getMatroidBases(matroid: IMatroid, sort: boolean = false, sort_asc: boolean = false): MatroidBase[] {

        if (!matroid) {
            return null;
        }

        const matroid_fields: ModuleTableFieldVO[] = this.getMatroidFields(matroid._type);
        const matroid_bases: MatroidBase[] = [];

        if ((!matroid_fields) || (!matroid_fields.length)) {
            return null;
        }

        for (const i in matroid_fields) {

            const field = matroid_fields[i];
            matroid_bases.push(MatroidBase.createNew(matroid._type, field.field_id, matroid[field.field_id]));
        }

        if (sort) {
            matroid_bases.sort((a: MatroidBase, b: MatroidBase) => {
                return sort_asc ? MatroidBaseController.getInstance().get_cardinal(a) - MatroidBaseController.getInstance().get_cardinal(b) :
                    MatroidBaseController.getInstance().get_cardinal(b) - MatroidBaseController.getInstance().get_cardinal(a);
            });
        }

        return matroid_bases;
    }

    /**
     * FIXME TODO ASAP WITH TU
     * Renvoie les bases qui diffèrent entre a et b (qu'elles intersectent ou pas)
     */
    public static get_different_field_ids(a: IMatroid, b: IMatroid): string[] {

        const res: string[] = [];

        if ((!a) || (!b)) {
            return null;
        }

        const moduletablea = ModuleTableController.module_tables_by_vo_type[a._type];
        const moduletableb = ModuleTableController.module_tables_by_vo_type[b._type];

        if (moduletablea != moduletableb) {
            return null;
        }

        const matroid_fields = this.getMatroidFields(a._type);

        for (const i in matroid_fields) {
            const matroid_field = matroid_fields[i];

            const a_ranges = a[matroid_field.field_id];
            const b_ranges = b[matroid_field.field_id];

            if ((!a_ranges) || (!a_ranges.length) || (!b_ranges) || (!b_ranges.length)) {
                return null;
            }

            if (RangeHandler.are_same(a_ranges, b_ranges)) {
                continue;
            }

            res.push(matroid_field.field_id);
        }

        return res;
    }


    /**
     * FIXME TODO ASAP WITH TU
     */
    public static matroid_intersects_matroid(a: IMatroid, b: IMatroid, fields_mapping: { [matroid_a_field_id: string]: string } = null, ignore_var_id_check: boolean = false): boolean {
        // On part du principe que l'on peut affirmer qu'un matroid intersecte un autre matroid
        //  dès que toutes les bases intersectent. Il faut pour cela avoir les mêmes formats de matroid, le même _type sur le matroid
        //  On utilise les fields du matroid pour identifier également des champs qui seraient non définis mais
        //  qui seraient définis sur la structure de données, et qui indique un non filtrage, donc une intersection obligatoire
        //  à moins que l'autre matroid soit vide (cardinal = 0).

        // if ((!a) || (!MatroidController.get_cardinal(a)) || (!b) || (!MatroidController.get_cardinal(b))) {
        //     return false;
        // }

        if ((!a) || (!b)) {
            return false;
        }

        const moduletablea = ModuleTableController.module_tables_by_vo_type[a._type];
        const moduletableb = ModuleTableController.module_tables_by_vo_type[b._type];

        if (moduletablea != moduletableb) {

            // Les matroids sont différents à la base, on veut traduire l'un des deux pour permettre l'intersection
            // si le mapping est undefined, on va prendre les champs avec le nom identique et si on échoue on renvoit false
            //  et si le mapping est null, alors on peut pas comparer et on considère que ça intersecte jamais.
            if (fields_mapping === null) {
                return false;
            }
        }

        // On vérifie le cas des vars, et de leur var_id. 2 matroids de var_id différents ne peut pas intersecter (sauf à vouloir ignorer ce check de façon explicite)
        if (!ignore_var_id_check) {
            if (((!!a['var_id']) && (!!b['var_id'])) && (a['var_id'] != b['var_id'])) {
                return false;
            }
        }

        const matroid_fields = this.getMatroidFields(a._type);

        for (const i in matroid_fields) {
            const matroid_field = matroid_fields[i];

            const a_ranges = a[matroid_field.field_id];

            // Si ce champ est mappé à null, on ignore
            if (fields_mapping && (fields_mapping[matroid_field.field_id] === null)) {
                continue;
            }

            const b_ranges = (fields_mapping && fields_mapping[matroid_field.field_id]) ? b[fields_mapping[matroid_field.field_id]] : b[matroid_field.field_id];

            if ((!a_ranges) || (!a_ranges.length) || (!b_ranges) || (!b_ranges.length)) {
                continue;
            }

            let intersects: boolean = false;
            switch (matroid_field.field_type) {
                // case ModuleTableFieldVO.FIELD_TYPE_daterange_array:
                case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
                case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
                case ModuleTableFieldVO.FIELD_TYPE_hourrange_array:
                case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                    for (const j in a_ranges) {

                        if (RangeHandler.range_intersects_any_range(a_ranges[j], b_ranges)) {
                            intersects = true;
                            break;
                        }
                    }
                    break;
            }

            if (intersects) {
                continue;
            }

            return false;
        }

        return true;
    }

    /**
     * FIXME TODO ASAP WITH TU
     */
    public static matroid_intersects_any_matroid(a: IMatroid, bs: IMatroid[]): boolean {
        for (const i in bs) {
            if (this.matroid_intersects_matroid(a, bs[i])) {
                return true;
            }
        }

        return false;
    }

    /**
     * FIXME TODO ASAP WITH TU
     */
    public static matroids_intersect_themselves_at_least_once(matroids: IMatroid[]): boolean {

        if (!matroids) {
            return false;
        }

        for (let i = 0; i < (matroids.length - 1); i++) {
            for (let j = i + 1; j < matroids.length; j++) {
                const a = matroids[i];
                const b = matroids[j];

                if (this.matroid_intersects_matroid(a, b)) {
                    return true;
                }
            }
        }
        return false;
    }

    public static cut_matroids<T extends IMatroid>(matroid_cutter: T, matroids_to_cut: T[]): Array<MatroidCutResult<T>> {

        const res: Array<MatroidCutResult<T>> = [];
        for (const i in matroids_to_cut) {
            const matroid_to_cut: T = matroids_to_cut[i];

            const cut_result: MatroidCutResult<T> = this.cut_matroid(matroid_cutter, matroid_to_cut);

            if (!cut_result) {
                continue;
            }

            res.push(cut_result);
        }

        return res;
    }

    public static matroids_cut_matroids_get_remainings<T extends IMatroid>(matroid_cutters: T[], matroids_to_cut: T[]): T[] {

        let remaining_matroids: T[] = [];
        remaining_matroids = matroids_to_cut;
        for (const j in matroid_cutters) {

            const matroid_cutter = matroid_cutters[j];

            const cut_results: Array<MatroidCutResult<any>> = this.cut_matroids(matroid_cutter, remaining_matroids);

            remaining_matroids = [];
            for (const k in cut_results) {
                if (cut_results[k].remaining_items && cut_results[k].remaining_items.length) {
                    remaining_matroids = remaining_matroids.concat(cut_results[k].remaining_items);
                }
            }
        }

        return this.union(remaining_matroids);
    }

    /**
     * FIXME TODO ASAP WITH TU
     */
    public static matroids_cut_matroids<T extends IMatroid>(matroid_cutters: T[], matroids_to_cut: T[]): MatroidCutResult<T> {

        const res: MatroidCutResult<T> = new MatroidCutResult<T>([], this.cloneFromRanges(matroids_to_cut));

        for (const j in matroid_cutters) {

            const matroid_cutter = matroid_cutters[j];

            const cut_results: Array<MatroidCutResult<any>> = this.cut_matroids(matroid_cutter, res.remaining_items);

            for (const k in cut_results) {
                res.chopped_items = res.chopped_items.concat(cut_results[k].chopped_items);
            }

            res.remaining_items = [];
            for (const k in cut_results) {
                res.remaining_items = res.remaining_items.concat(cut_results[k].remaining_items);
            }
        }

        return res;
    }

    public static cut_matroid<T extends IMatroid>(matroid_cutter: T, matroid_to_cut: T): MatroidCutResult<T> {

        if (!matroid_to_cut) {
            return null;
        }

        const res: MatroidCutResult<T> = new MatroidCutResult<T>([], []);

        if (!this.matroid_intersects_matroid(matroid_cutter, matroid_to_cut)) {
            res.remaining_items.push(matroid_to_cut);
            return res;
        }

        // On choisit (arbitrairement) de projeter la coupe selon une base du matroid
        //  de manière totalement arbitraire aussi, on priorise la base de cardinal la plus élevée
        // on limite l'utilisation du get_cardinal très lourd pour peu de gain a priori let matroid_to_cut_bases: MatroidBase[] = this.getMatroidBases(matroid_to_cut, true, false);
        const matroid_to_cut_bases: MatroidBase[] = this.getMatroidBases(matroid_to_cut);

        // Le matroid chopped est unique par définition et reprend simplement les bases chopped
        const chopped_matroid = this.cloneFrom<T, T>(matroid_to_cut);

        // On coupe sur chaque base, si elle a une intersection
        for (const i in matroid_to_cut_bases) {
            const matroid_to_cut_base = matroid_to_cut_bases[i];

            // Pour chaque base:
            //  - on cherche le résultat de la coupe.
            //  - on en déduit un matroid sur cette coupe
            //  - si il y a un chopped, on fixe cette dimension et on continue de couper sur les autres bases

            if (!matroid_cutter[matroid_to_cut_base.field_id]) {
                continue;
            }

            const cutter_field_ranges: IRange[] = matroid_cutter[matroid_to_cut_base.field_id];

            const matroidbase_cutter = MatroidBase.createNew(
                matroid_to_cut_base.api_type_id, matroid_to_cut_base.field_id,
                cutter_field_ranges);
            const cut_result: MatroidBaseCutResult = MatroidBaseController.getInstance().cut_matroid_base(matroidbase_cutter, matroid_to_cut_base);

            // ça marche que si il y a un remaining sur cette dimension, sinon on veut pas stocker des bases null...
            if (!cut_result) {
                continue;
            }

            if (cut_result.remaining_items) {

                // Le but est de créer le matroid lié à la coupe sur cette dimension
                const this_base_remaining_matroid = this.cloneFrom<T, T>(chopped_matroid);

                this_base_remaining_matroid[matroid_to_cut_base.field_id] = cloneDeep(cut_result.remaining_items.ranges);

                // On enlève le field_id qui ne sert pas et modifie le matroid source ce qui n'est pas le but
                for (const k in this_base_remaining_matroid[matroid_to_cut_base.field_id]) {
                    const range = this_base_remaining_matroid[matroid_to_cut_base.field_id][k];
                    delete range.field_id;
                    delete range.api_type_id;
                }

                res.remaining_items.push(this_base_remaining_matroid);
            }

            if (cut_result.chopped_items) {

                chopped_matroid[matroid_to_cut_base.field_id] = cloneDeep(cut_result.chopped_items.ranges);

                // On enlève le field_id qui ne sert pas et modifie le matroid source ce qui n'est pas le but
                for (const k in chopped_matroid[matroid_to_cut_base.field_id]) {
                    const range = chopped_matroid[matroid_to_cut_base.field_id][k];
                    delete range.field_id;
                    delete range.api_type_id;
                }

            }
        }
        res.chopped_items.push(chopped_matroid);

        return res;
    }

    /**
     * Clones the type and segment_type. The bases are left undefined
     * @param from
     */
    public static createEmptyFrom<T extends IMatroid>(from: T): T {
        const res: T = {
            _type: from._type,
            id: undefined
        } as T;

        return res;
    }

    /**
     * Clones all but id and value, value_type, value_ts for vars
     * @param from
     */
    public static cloneFrom<T extends IMatroid, U extends IMatroid>(from: T, to_type: string = null, clone_fields: boolean = true): U {

        if (!from) {
            return null;
        }

        const _type: string = to_type ? to_type : from._type;
        const moduletable_from = ModuleTableController.module_tables_by_vo_type[from._type];
        const moduletable_to = ModuleTableController.module_tables_by_vo_type[_type];

        const res: U = new ModuleTableController.vo_constructor_by_vo_type[_type]() as U;
        res._type = _type;

        // Compatibilité avec les vars
        if (typeof from['var_id'] !== 'undefined') {
            res['var_id'] = from['var_id'];
        }
        // if (typeof from['value'] !== 'undefined') {
        //     res['value'] = from['value'];
        // }
        // if (typeof from['value_type'] !== 'undefined') {
        //     res['value_type'] = from['value_type'];
        // }
        // if (typeof from['value_ts'] !== 'undefined') {
        //     res['value_ts'] = from['value_ts'] ? from['value_ts'].clone() : from['value_ts'];
        // }

        const needs_mapping: boolean = moduletable_from != moduletable_to;
        const mappings: { [field_id_a: string]: string } = moduletable_from.mapping_by_api_type_ids[_type];

        // if (needs_mapping && (typeof mappings === 'undefined')) {
        //     throw new Error('Mapping missing:from:' + from._type + ":to:" + _type + ":");
        // }

        const to_fields = MatroidController.getMatroidFields(_type);
        for (const to_fieldi in to_fields) {
            const to_field = to_fields[to_fieldi];

            let from_field_id = to_field.field_id;
            if (needs_mapping) {
                /**
                 * Si on a un mapping predef on l'utilise
                 */
                if (typeof mappings !== 'undefined') {
                    for (const mappingi in mappings) {

                        if (mappings[mappingi] == to_field.field_id) {
                            from_field_id = mappingi;
                        }
                    }
                } else {
                    /**
                     * Sinon on check que le champ existait dans le type from
                     */
                    const from_field = moduletable_from.get_field_by_id(to_field.field_id);
                    from_field_id = from_field ? to_field.field_id : null;
                }
            }

            if (from_field_id) {
                res[to_field.field_id] = clone_fields ? RangeHandler.cloneArrayFrom(from[from_field_id]) : from[from_field_id];
            } else {
                switch (to_field.field_type) {
                    case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_hourrange_array:
                        res[to_field.field_id] = [RangeHandler.getMaxRange(to_field)];
                        break;
                    case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                    case ModuleTableFieldVO.FIELD_TYPE_numrange:
                    case ModuleTableFieldVO.FIELD_TYPE_hourrange:
                    case ModuleTableFieldVO.FIELD_TYPE_daterange:
                        res[to_field.field_id] = [RangeHandler.getMaxRange(to_field)];
                        break;
                    default:
                }
            }
        }

        if (res['_index']) {
            res['rebuild_index']();
        }
        return res;
    }


    /**
     * Clones all but id
     * @param from
     */
    public static cloneFromRanges<T extends IMatroid>(from: T[]): T[] {

        if (!from) {
            return null;
        }

        const res: T[] = [];

        for (const i in from) {
            res[i] = this.cloneFrom(from[i]);
        }

        return res;
    }

    private constructor() { }
}