import { Moment } from 'moment';
import RangeHandler from '../../../tools/RangeHandler';
import IRange from '../../DataRender/interfaces/IRange';
import MatroidController from '../../Matroid/MatroidController';
import ModuleTableField from '../../ModuleTableField';
import VOsTypesManager from '../../VOsTypesManager';
import IVarDataVOBase from '../interfaces/IVarDataVOBase';

export default class VarDataBaseVO implements IVarDataVOBase {

    /**
     * Méthode pour créer un nouveau paramètre de var, quelque soit le type
     * @param _type Le vo_type cible
     * @param var_id La var_id cible
     * @param clone_ranges Est-ce qu'on clone les champs ou pas (par défaut il faut cloner, mais on peut dans certains contextes optimiser en ne clonant pas)
     * @param fields_ordered_as_in_moduletable_definition Les ranges du matroid ordonnés dans le même ordre que dans la définition du moduletable
     */
    public static createNew<T extends IVarDataVOBase>(_type: string, var_id: number, clone_fields: boolean = true, ...fields_ordered_as_in_moduletable_definition: Array<Array<IRange<any>>>): T {

        let moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[_type];

        let res: T = moduletable.voConstructor();
        res._type = _type;
        res.var_id = var_id;

        let fields = MatroidController.getInstance().getMatroidFields(_type);
        let param_i: number = 0;
        for (let i in fields) {
            let field = fields[i];

            res[field.field_id] = clone_fields ? RangeHandler.getInstance().cloneArrayFrom(fields_ordered_as_in_moduletable_definition[param_i]) : fields_ordered_as_in_moduletable_definition[param_i];
            param_i++;
        }

        return res;
    }

    /**
     * Méthode pour créer un nouveau paramètre de var, quelque soit le type
     * @param param_to_clone Le param que l'on doit cloner
     * @param clone_ranges Est-ce qu'on clone les champs ou pas (par défaut il faut cloner, mais on peut dans certains contextes optimiser en ne clonant pas)
     */
    public static cloneFrom<T extends IVarDataVOBase>(param_to_clone: T, clone_fields: boolean = true): T {

        if (!param_to_clone) {
            return null;
        }

        return this.cloneFieldsFrom(param_to_clone._type, param_to_clone.var_id, param_to_clone, clone_fields);
    }


    /**
     * Méthode pour créer un nouveau paramètre de var, en clonant les fields depuis un autre paramètre, et en traduisant au besoin le matroid
     * @param param_to_clone Le param que l'on doit cloner
     * @param clone_ranges Est-ce qu'on clone les champs ou pas (par défaut il faut cloner, mais on peut dans certains contextes optimiser en ne clonant pas)
     */
    public static cloneFieldsFrom<T extends IVarDataVOBase>(_type: string, var_id: number, param_to_clone: T, clone_fields: boolean = true): T {

        if (!param_to_clone) {
            return null;
        }

        let moduletable_from = VOsTypesManager.getInstance().moduleTables_by_voType[param_to_clone._type];
        let moduletable_to = VOsTypesManager.getInstance().moduleTables_by_voType[_type];

        let res: T = moduletable_to.voConstructor();
        res._type = _type;
        res.var_id = param_to_clone.var_id;

        let needs_mapping: boolean = moduletable_from != moduletable_to;
        let mappings: { [field_id_a: string]: string } = moduletable_from.mapping_by_api_type_ids[_type];

        if (needs_mapping && (typeof mappings === 'undefined')) {
            throw new Error('Mapping missing:from:' + param_to_clone._type + ":to:" + _type + ":");
        }

        let to_fields = MatroidController.getInstance().getMatroidFields(_type);
        for (let to_fieldi in to_fields) {
            let to_field = to_fields[to_fieldi];

            let from_field_id = to_field.field_id;
            if (needs_mapping) {
                for (let mappingi in mappings) {

                    if (mappings[mappingi] == to_field.field_id) {
                        from_field_id = mappingi;
                    }
                }
            }

            if (!!from_field_id) {
                res[to_field.field_id] = clone_fields ? RangeHandler.getInstance().cloneArrayFrom(param_to_clone[from_field_id]) : param_to_clone[from_field_id];
            } else {
                switch (to_field.field_type) {
                    case ModuleTableField.FIELD_TYPE_tstzrange_array:
                        res[to_field.field_id] = [RangeHandler.getInstance().getMaxTSRange()];
                    case ModuleTableField.FIELD_TYPE_refrange_array:
                        res[to_field.field_id] = [RangeHandler.getInstance().getMaxNumRange()];
                    case ModuleTableField.FIELD_TYPE_numrange_array:
                        res[to_field.field_id] = [RangeHandler.getInstance().getMaxNumRange()];
                    case ModuleTableField.FIELD_TYPE_hourrange_array:
                        res[to_field.field_id] = [RangeHandler.getInstance().getMaxHourRange()];
                    default:
                }
            }
        }

        return res;
    }

    public _type: string;
    public id: number;

    public var_id: number;

    public value: number;
    public value_type: number;
    public value_ts: Moment;

    private _index: string;

    public constructor() { }

    /**
     * Attention : L'index est initialisé au premier appel au getter, et immuable par la suite.
     */
    get index(): string {

        if (!this._index) {
            let fields = MatroidController.getInstance().getMatroidFields(this._type);

            this._index = this.var_id.toString();
            for (let i in fields) {
                let field = fields[i];

                this._index += '_';
                this._index = RangeHandler.getInstance().getIndexRanges(field.field_value);
            }
        }

        return this._index;
    }
}