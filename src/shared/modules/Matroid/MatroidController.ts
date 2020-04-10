import { cloneDeep } from 'lodash';
import RangeHandler from '../../tools/RangeHandler';
import IRange from '../DataRender/interfaces/IRange';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import VOsTypesManager from '../VOsTypesManager';
import IMatroid from './interfaces/IMatroid';
import MatroidBaseController from './MatroidBaseController';
import MatroidBase from './vos/MatroidBase';
import MatroidBaseCutResult from './vos/MatroidBaseCutResult';
import MatroidCutResult from './vos/MatroidCutResult';
const moment = require('moment');

export default class MatroidController {

    public static getInstance(): MatroidController {
        if (!MatroidController.instance) {
            MatroidController.instance = new MatroidController();
        }
        return MatroidController.instance;
    }

    private static instance: MatroidController = null;

    private constructor() { }

    public async initialize() {
    }

    /**
     * TODO FIXME ASAP TU VARS
     * On définit le cardinal du matroid par la multiplication des cardinaux des bases
     * @param matroid
     */
    public get_cardinal(matroid: IMatroid): number {

        if (!matroid) {
            return 0;
        }

        let matroid_bases = this.getMatroidBases(matroid);

        let res = null;

        for (let i in matroid_bases) {
            let matroid_base = matroid_bases[i];
            let matroid_base_cardinal = (matroid_base != null) ? MatroidBaseController.getInstance().get_cardinal(matroid_base) : 0;

            res = (res != null) ? res * matroid_base_cardinal : matroid_base_cardinal;
        }
        return (res != null) ? res : 0;
    }

    public getIndex<T extends IMatroid>(matroid: T): string {

        if (!matroid) {
            return null;
        }

        let res: string = matroid._type;

        let fields: Array<ModuleTableField<any>> = this.getMatroidFields(matroid._type);

        for (let i in fields) {
            let field = fields[i];

            res += '_' + RangeHandler.getInstance().getIndexRanges(matroid[field.field_type]);
        }

        return res;
    }

    // FIXME Algo naif certainement très mauvais mais simple
    //  on regarde si on trouve des matroids identiques, on ignore le second,
    //  si on trouve des matroids qui n'ont qu'une base différente, on fait une union des bases sur le premier et on ignore le second,
    //  si on trouve plus d'une base différente
    public union<T extends IMatroid>(matroids: T[]): T[] {
        let res: T[] = [];

        if ((!matroids) || (!matroids.length)) {
            return null;
        }

        let moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[matroids[0]._type];

        if (!moduletable) {
            return null;
        }

        for (let i in matroids) {

            let tested_matroid = matroids[i];
            let ignore_matroid: boolean = false;

            for (let j in res) {
                let matroid = res[j];

                let different_field_ids: string[] = this.get_different_field_ids(tested_matroid, matroid);

                if ((!different_field_ids) || (different_field_ids.length == 0)) {
                    ignore_matroid = true;
                    break;
                }

                if (different_field_ids.length > 1) {
                    continue;
                }

                if (different_field_ids.length == 1) {

                    matroid[different_field_ids[0]] = RangeHandler.getInstance().getRangesUnion(tested_matroid[different_field_ids[0]].concat(matroid[different_field_ids[0]]));

                    ignore_matroid = true;
                    break;
                }
            }

            if (ignore_matroid) {
                continue;
            }

            res.push(tested_matroid);
        }

        return res;
    }

    /**
     * FIXME TODO ASAP WITH TU
     */
    public getMatroidFields(api_type_id: string): Array<ModuleTableField<any>> {
        let moduleTable: ModuleTable<any> = VOsTypesManager.getInstance().moduleTables_by_voType[api_type_id];

        if (!moduleTable) {
            return null;
        }

        let matroid_fields: Array<ModuleTableField<any>> = [];
        for (let i in moduleTable.get_fields()) {

            let field = moduleTable.get_fields()[i];

            switch (field.field_type) {
                // case ModuleTableField.FIELD_TYPE_daterange_array:
                case ModuleTableField.FIELD_TYPE_numrange_array:
                case ModuleTableField.FIELD_TYPE_refrange_array:
                case ModuleTableField.FIELD_TYPE_isoweekdays:
                case ModuleTableField.FIELD_TYPE_hourrange_array:
                case ModuleTableField.FIELD_TYPE_tstzrange_array:
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
    public getMatroidBases(matroid: IMatroid, sort: boolean = false, sort_asc: boolean = false): Array<MatroidBase<any>> {

        if (!matroid) {
            return null;
        }

        let matroid_fields: Array<ModuleTableField<any>> = this.getMatroidFields(matroid._type);
        let matroid_bases: Array<MatroidBase<any>> = [];

        if ((!matroid_fields) || (!matroid_fields.length)) {
            return null;
        }

        for (let i in matroid_fields) {

            let field = matroid_fields[i];
            matroid_bases.push(MatroidBase.createNew(matroid._type, field.field_id, matroid[field.field_id]));
        }

        if (sort) {
            matroid_bases.sort((a: MatroidBase<any>, b: MatroidBase<any>) => {
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
    public get_different_field_ids(a: IMatroid, b: IMatroid): string[] {

        let res: string[] = [];

        if ((!a) || (!b)) {
            return null;
        }

        let moduletablea = VOsTypesManager.getInstance().moduleTables_by_voType[a._type];
        let moduletableb = VOsTypesManager.getInstance().moduleTables_by_voType[b._type];

        if (moduletablea != moduletableb) {
            return null;
        }

        let matroid_fields = this.getMatroidFields(a._type);

        for (let i in matroid_fields) {
            let matroid_field = matroid_fields[i];

            let a_ranges = a[matroid_field.field_id];
            let b_ranges = b[matroid_field.field_id];

            if ((!a_ranges) || (!a_ranges.length) || (!b_ranges) || (!b_ranges.length)) {
                return null;
            }

            if (RangeHandler.getInstance().are_same(a_ranges, b_ranges)) {
                continue;
            }

            res.push(matroid_field.field_id);
        }

        return res;
    }


    /**
     * FIXME TODO ASAP WITH TU
     */
    public matroid_intersects_matroid(a: IMatroid, b: IMatroid): boolean {
        // On part du principe que l'on peut affirmer qu'un matroid intersecte un autre matroid
        //  dès que toutes les bases intersectent. Il faut pour cela avoir les mêmes formats de matroid, le même _type sur le matroid
        //  On utilise les fields du matroid pour identifier également des champs qui seraient non définis mais
        //  qui seraient définis sur la structure de données, et qui indique un non filtrage, donc une intersection obligatoire
        //  à moins que l'autre matroid soit vide (cardinal = 0).

        // if ((!a) || (!MatroidController.getInstance().get_cardinal(a)) || (!b) || (!MatroidController.getInstance().get_cardinal(b))) {
        //     return false;
        // }

        if ((!a) || (!b)) {
            return false;
        }

        let moduletablea = VOsTypesManager.getInstance().moduleTables_by_voType[a._type];
        let moduletableb = VOsTypesManager.getInstance().moduleTables_by_voType[b._type];

        if (moduletablea != moduletableb) {
            return false;
        }

        let matroid_fields = this.getMatroidFields(a._type);

        for (let i in matroid_fields) {
            let matroid_field = matroid_fields[i];

            let a_ranges = a[matroid_field.field_id];
            let b_ranges = b[matroid_field.field_id];

            if ((!a_ranges) || (!a_ranges.length) || (!b_ranges) || (!b_ranges.length)) {
                continue;
            }

            let intersects: boolean = false;
            switch (matroid_field.field_type) {
                // case ModuleTableField.FIELD_TYPE_daterange_array:
                case ModuleTableField.FIELD_TYPE_tstzrange_array:
                case ModuleTableField.FIELD_TYPE_numrange_array:
                case ModuleTableField.FIELD_TYPE_refrange_array:
                case ModuleTableField.FIELD_TYPE_hourrange_array:
                case ModuleTableField.FIELD_TYPE_isoweekdays:
                    for (let j in a_ranges) {

                        if (RangeHandler.getInstance().range_intersects_any_range(a_ranges[j], b_ranges)) {
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
    public matroid_intersects_any_matroid(a: IMatroid, bs: IMatroid[]): boolean {
        for (let i in bs) {
            if (this.matroid_intersects_matroid(a, bs[i])) {
                return true;
            }
        }

        return false;
    }

    /**
     * FIXME TODO ASAP WITH TU
     */
    public matroids_intersect_themselves_at_least_once(matroids: IMatroid[]): boolean {

        if (!matroids) {
            return false;
        }

        for (let i = 0; i < (matroids.length - 1); i++) {
            for (let j = i + 1; j < matroids.length; j++) {
                let a = matroids[i];
                let b = matroids[j];

                if (this.matroid_intersects_matroid(a, b)) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * FIXME TODO ASAP WITH TU
     */
    public cut_matroids<T extends IMatroid>(matroid_cutter: T, matroids_to_cut: T[]): Array<MatroidCutResult<T>> {

        let res: Array<MatroidCutResult<T>> = [];
        for (let i in matroids_to_cut) {
            let matroid_to_cut: T = matroids_to_cut[i];

            let cut_result: MatroidCutResult<T> = this.cut_matroid(matroid_cutter, matroid_to_cut);

            if (!cut_result) {
                continue;
            }

            res.push(cut_result);
        }

        return res;
    }

    /**
     * FIXME TODO ASAP WITH TU
     */
    public matroids_cut_matroids_get_remainings<T extends IMatroid>(matroid_cutters: T[], matroids_to_cut: T[]): T[] {

        let remaining_matroids: T[] = [];
        remaining_matroids = this.cloneFromRanges(matroids_to_cut);
        for (let j in matroid_cutters) {

            let matroid_cutter = matroid_cutters[j];

            let cut_results: Array<MatroidCutResult<any>> = this.cut_matroids(matroid_cutter, remaining_matroids);

            remaining_matroids = [];
            for (let k in cut_results) {
                remaining_matroids = remaining_matroids.concat(cut_results[k].remaining_items);
            }
        }

        return remaining_matroids;
    }

    /**
     * FIXME TODO ASAP WITH TU
     */
    public matroids_cut_matroids<T extends IMatroid>(matroid_cutters: T[], matroids_to_cut: T[]): MatroidCutResult<T> {

        let res: MatroidCutResult<T> = new MatroidCutResult<T>([], this.cloneFromRanges(matroids_to_cut));

        for (let j in matroid_cutters) {

            let matroid_cutter = matroid_cutters[j];

            let cut_results: Array<MatroidCutResult<any>> = this.cut_matroids(matroid_cutter, res.remaining_items);

            for (let k in cut_results) {
                res.chopped_items = res.chopped_items.concat(cut_results[k].chopped_items);
            }

            res.remaining_items = [];
            for (let k in cut_results) {
                res.remaining_items = res.remaining_items.concat(cut_results[k].remaining_items);
            }
        }

        return res;
    }

    /**
     * FIXME TODO ASAP WITH TU
     */
    public cut_matroid<T extends IMatroid>(matroid_cutter: T, matroid_to_cut: T): MatroidCutResult<T> {

        if (!matroid_to_cut) {
            return null;
        }

        let res: MatroidCutResult<T> = new MatroidCutResult<T>([], []);

        if (!this.matroid_intersects_matroid(matroid_cutter, matroid_to_cut)) {
            res.remaining_items.push(matroid_to_cut);
            return res;
        }

        // On choisit (arbitrairement) de projeter la coupe selon une base du matroid
        //  de manière totalement arbitraire aussi, on priorise la base de cardinal la plus élevée
        // on limite l'utilisation du get_cardinal très lourd pour peu de gain a priori let matroid_to_cut_bases: Array<MatroidBase<any>> = this.getMatroidBases(matroid_to_cut, true, false);
        let matroid_to_cut_bases: Array<MatroidBase<any>> = this.getMatroidBases(matroid_to_cut);

        // Le matroid chopped est unique par définition et reprend simplement les bases chopped
        let chopped_matroid = this.cloneFrom(matroid_to_cut);

        // On coupe sur chaque base, si elle a une intersection
        for (let i in matroid_to_cut_bases) {
            let matroid_to_cut_base = matroid_to_cut_bases[i];

            // Pour chaque base:
            //  - on cherche le résultat de la coupe.
            //  - on en déduit un matroid sur cette coupe
            //  - si il y a un chopped, on fixe cette dimension et on continue de couper sur les autres bases

            if (!matroid_cutter[matroid_to_cut_base.field_id]) {
                continue;
            }

            let cutter_field_ranges: Array<IRange<any>> = matroid_cutter[matroid_to_cut_base.field_id];

            let matroidbase_cutter = MatroidBase.createNew(
                matroid_to_cut_base.api_type_id, matroid_to_cut_base.field_id,
                cutter_field_ranges);
            let cut_result: MatroidBaseCutResult<MatroidBase<any>> = MatroidBaseController.getInstance().cut_matroid_base(matroidbase_cutter, matroid_to_cut_base);

            // ça marche que si il y a un remaining sur cette dimension, sinon on veut pas stocker des bases null...
            if (!cut_result) {
                continue;
            }

            if (!!cut_result.remaining_items) {

                // Le but est de créer le matroid lié à la coupe sur cette dimension
                let this_base_remaining_matroid = this.cloneFrom(chopped_matroid);

                this_base_remaining_matroid[matroid_to_cut_base.field_id] = cloneDeep(cut_result.remaining_items.ranges);

                // On enlève le field_id qui ne sert pas et modifie le matroid source ce qui n'est pas le but
                for (let k in this_base_remaining_matroid[matroid_to_cut_base.field_id]) {
                    let range = this_base_remaining_matroid[matroid_to_cut_base.field_id][k];
                    delete range.field_id;
                    delete range.api_type_id;
                }

                res.remaining_items.push(this_base_remaining_matroid);
            }

            if (!!cut_result.chopped_items) {

                chopped_matroid[matroid_to_cut_base.field_id] = cloneDeep(cut_result.chopped_items.ranges);

                // On enlève le field_id qui ne sert pas et modifie le matroid source ce qui n'est pas le but
                for (let k in chopped_matroid[matroid_to_cut_base.field_id]) {
                    let range = chopped_matroid[matroid_to_cut_base.field_id][k];
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
    public createEmptyFrom<T extends IMatroid>(from: T): T {
        let res: T = {
            _type: from._type,
            id: undefined
        } as T;

        return res;
    }

    /**
     * Clones all but id
     * @param from
     */
    public cloneFrom<T extends IMatroid>(from: T): T {

        if (!from) {
            return null;
        }

        let moduleTable = VOsTypesManager.getInstance().moduleTables_by_voType[from._type];

        // On copie uniquement le matroid et le var_id si présent pour compatibilité avec les vars
        let res: T = Object.assign({
            _type: from._type,
            id: undefined,
            var_id: from['var_id']
        } as any, moduleTable.matroid_cloner(from));

        let matroid_fields: Array<ModuleTableField<any>> = this.getMatroidFields(from._type);

        for (let i in matroid_fields) {
            let matroid_field = matroid_fields[i];

            res[matroid_field.field_id] = cloneDeep(from[matroid_field.field_id]);
        }

        return res;
    }


    /**
     * Clones all but id
     * @param from
     */
    public cloneFromRanges<T extends IMatroid>(from: T[]): T[] {

        if (!from) {
            return null;
        }

        let res: T[] = [];

        for (let i in from) {
            res[i] = this.cloneFrom(from[i]);
        }

        return res;
    }
}