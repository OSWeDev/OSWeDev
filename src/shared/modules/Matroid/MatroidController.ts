import moment = require('moment');
import FieldRangeHandler from '../../tools/FieldRangeHandler';
import ModuleDAO from '../DAO/ModuleDAO';
import IRange from '../DataRender/interfaces/IRange';
import FieldRange from '../DataRender/vos/FieldRange';
import IDistantVOBase from '../IDistantVOBase';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import VOsTypesManager from '../VOsTypesManager';
import IMatroid from './interfaces/IMatroid';
import RangeHandler from '../../tools/RangeHandler';
import TSRangeHandler from '../../tools/TSRangeHandler';
import NumRangeHandler from '../../tools/NumRangeHandler';
import MatroidBase from './vos/MatroidBase';

export default class MatroidController {

    public static Matroid_RUN: boolean = true;

    public static getInstance(): MatroidController {
        if (!MatroidController.instance) {
            MatroidController.instance = new MatroidController();
        }
        return MatroidController.instance;
    }

    private static instance: MatroidController = null;

    private matroids_types_by_type_id: { [api_type_id: string]: ModuleTable<any> } = {};

    private constructor() { }

    public async initialize() {
    }

    public register_matroid_type(moduleTable: ModuleTable<any>) {
        this.matroids_types_by_type_id[moduleTable.vo_type] = moduleTable;
    }

    public is_matroid_type(api_type_id: string): boolean {
        return !!this.matroids_types_by_type_id[api_type_id];
    }

    // public union(matroids: IMatroid[]): IMatroid[]{
    //     let res: IMatroid[] = [];

    //     // MAIS PAS DU TOUT :: DONC ON OUBLIE On définit l'union des matroids comme l'union des bases
    //     //  (au sein d'une même variable ça semble accurate)

    //     return res;
    // }

    /**
     * TODO FIXME ASAP VARS Si on a trop de ranges on peut pas envoyer la requête, il faut limiter le nombre de ranges ciblés au global (en scindant le matroide sur une base proablement)
     * @param api_type_id
     * @param matroid
     */
    public async getVosFilteredByMatroid<T extends IDistantVOBase>(api_type_id: string, matroid: IMatroid): Promise<T[]> {

        let field_ranges: Array<FieldRange<any>> = [];

        let matroid_fields: Array<ModuleTableField<any>> = this.getMatroidFields(matroid._type);

        for (let i in matroid_fields) {
            let matroid_field = matroid_fields[i];
            let matroid_field_ranges: Array<IRange<any>> = matroid[matroid_field.field_id];

            for (let j in matroid_field_ranges) {
                let matroid_field_range = matroid_field_ranges[j];

                field_ranges.push(FieldRangeHandler.getInstance().createNew(
                    api_type_id, matroid_field.field_id,
                    matroid_field_range.min, matroid_field_range.max,
                    matroid_field_range.min_inclusiv, matroid_field_range.max_inclusiv));

                if (field_ranges.length > 20) {
                    console.error('getVosFilteredByMatroid:field_ranges.length>20');
                    return null;
                }
            }
        }

        return await ModuleDAO.getInstance().filterVosByFieldRanges(api_type_id, field_ranges);
    }

    public getMatroidFields(api_type_id: string): Array<ModuleTableField<any>> {
        let moduleTable: ModuleTable<any> = VOsTypesManager.getInstance().moduleTables_by_voType[api_type_id];

        if (!moduleTable) {
            return null;
        }

        let matroid_fields: Array<ModuleTableField<any>> = [];
        for (let i in moduleTable.fields) {

            let field = moduleTable.fields[i];

            switch (field.field_type) {
                case ModuleTableField.FIELD_TYPE_daterange_array:
                case ModuleTableField.FIELD_TYPE_numrange_array:
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
        let matroid_fields: Array<ModuleTableField<any>> = this.getMatroidFields(matroid._type);
        let matroid_bases: Array<MatroidBase<any>> = [];

        if ((!matroid_fields) || (!matroid_fields.length)) {
            return null;
        }

        for (let i in matroid_fields) {

            let field = matroid_fields[i];
            let base_ranges: Array<FieldRange<any>> = [];

            for (let j in matroid[field.field_id]) {
                let range = matroid[field.field_id][j];

                base_ranges.push(FieldRangeHandler.getInstance().createNew(matroid._type, field.field_id, range.min, range.max, range.min_inclusiv, range.max_inclusiv));
            }

            matroid_bases.push(MatroidBase.createNew(matroid._type, field.field_id, matroid.segment_type, base_ranges));
        }

        if (sort) {
            matroid_bases.sort((a: MatroidBase<any>, b: MatroidBase<any>) => {
                let a_cardinal = 0;
                let b_cardinal = 0;

                return sort_asc ? a.cardinal - b.cardinal : b.cardinal - a.cardinal;
            });
        }

        return matroid_bases;
    }

    public matroid_intersects_matroid(a: IMatroid, b: IMatroid): boolean {
        // On part du principe que l'on peut affirmer qu'un matroid intersecte un autre matroid
        //  dès que toutes les bases intersectent. Il faut pour cela avoir les mêmes formats de matroid, le même _type sur le matroid
        //  On utilise les fields du matroid pour identifier également des champs qui seraient non définis mais
        //  qui seraient définis sur la structure de données, et qui indique un non filtrage, donc une intersection obligatoire
        //  à moins que l'autre matroid soit vide (cardinal = 0).

        if ((!a) || (!a.cardinal) || (!b) || (!b.cardinal) || (a._type != b._type)) {
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
                case ModuleTableField.FIELD_TYPE_daterange_array:
                case ModuleTableField.FIELD_TYPE_tstzrange_array:
                    for (let j in a_ranges) {

                        if (TSRangeHandler.getInstance().range_intersects_any_range(a_ranges[j], b_ranges)) {
                            intersects = true;
                            break;
                        }
                    }
                    break;
                case ModuleTableField.FIELD_TYPE_numrange_array:
                    for (let j in a_ranges) {

                        if (NumRangeHandler.getInstance().range_intersects_any_range(a_ranges[j], b_ranges)) {
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

    public matroid_intersects_any_matroid(a: IMatroid, bs: IMatroid[]): boolean {
        for (let i in bs) {
            if (this.matroid_intersects_matroid(a, bs[i])) {
                return true;
            }
        }

        return false;
    }

    public cut_matroids(matroid_cutter: IMatroid, matroids_to_cut: IMatroid[]): IMatroid[] {

        let res: IMatroid[] = Object.assign({}, matroids_to_cut);
        for (let i in matroids_to_cut) {
            let matroid_to_cut: IMatroid = matroids_to_cut[i];

            let cut_results: IMatroid[] = this.cut_matroid(matroid_cutter, matroid_to_cut);

            if (!cut_results) {
                continue;
            }

            res = res.concat(cut_results);
        }

        return res;
    }

    /**
     * FIXME TODO ASAP WITH TU
     */
    public cut_matroid(matroid_cutter: IMatroid, matroid_to_cut: IMatroid): IMatroid[] {
        let res: IMatroid[] = [];

        if (!this.matroid_intersects_matroid(matroid_cutter, matroid_to_cut)) {
            return null;
        }

        // On choisit (arbitrairement) de projeter la coupe selon une base du matroid
        //  de manière totalement arbitraire aussi, on priorise la base de cardinal la plus élevée
        let matroid_fields: Array<ModuleTableField<any>> = this.getMatroidFields(matroid_to_cut._type);
        let matroid_to_cut_bases: Array<MatroidBase<any>> = this.getMatroidBases(matroid_to_cut, true, false);

        // On coupe sur chaque base, si elle a une intersection

        for (let i in matroid_to_cut_bases) {
            let matroid_to_cut_base = matroid_to_cut_bases[i];

            matroid_to_cut_base.ranges
        }

        return res;
    }
}