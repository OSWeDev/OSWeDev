import * as moment from 'moment';
import { Moment } from 'moment';
import VarsServerController from '../../../../server/modules/Var/VarsServerController';
import RangeHandler from '../../../tools/RangeHandler';
import IRange from '../../DataRender/interfaces/IRange';
import MatroidController from '../../Matroid/MatroidController';
import VOsTypesManager from '../../VOsTypesManager';
import VarsController from '../VarsController';
import VarCacheConfVO from './VarCacheConfVO';

export default class VarDataBaseVO {

    public static VALUE_TYPE_LABELS: string[] = ['var_data.value_type.import', 'var_data.value_type.computed'];
    public static VALUE_TYPE_IMPORT: number = 0;
    public static VALUE_TYPE_COMPUTED: number = 1;

    /**
     * On considère la valeur valide si elle a une date de calcul ou d'init, une valeur pas undefined et
     *  si on a une conf de cache, pas expirée. Par contre est-ce que les imports expirent ? surement pas
     *  dont il faut aussi indiquer ces var datas valides
     */
    get has_valid_value(): boolean {

        if (this.value_type === VarDataBaseVO.VALUE_TYPE_IMPORT) {
            return true;
        }

        if ((typeof this.value !== 'undefined') && (!!this.value_ts)) {

            if (this.varcacheconf && !!this.varcacheconf.cache_timeout_ms) {
                let timeout: Moment = moment().utc(true).add(-this.varcacheconf.cache_timeout_ms, 'ms');
                if (this.value_ts.isSameOrAfter(timeout)) {
                    return true;
                }
            } else {
                return true;
            }
        }
        return false;
    }

    get varcacheconf(): VarCacheConfVO {
        return VarsServerController.getInstance().varcacheconf_by_var_ids[this.var_id];
    }

    /**
     * Méthode pour créer un nouveau paramètre de var, quelque soit le type
     * @param _type Le vo_type cible
     * @param var_name Le nom de la var cible
     * @param clone_ranges Est-ce qu'on clone les champs ou pas (par défaut il faut cloner, mais on peut dans certains contextes optimiser en ne clonant pas)
     * @param fields_ordered_as_in_moduletable_definition Les ranges du matroid ordonnés dans le même ordre que dans la définition du moduletable
     */
    public static createNew<T extends VarDataBaseVO>(_type: string, var_name: string, clone_fields: boolean = true, ...fields_ordered_as_in_moduletable_definition: Array<Array<IRange<any>>>): T {

        let moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[_type];

        let res: T = moduletable.voConstructor();
        res._type = _type;
        res.var_id = VarsController.getInstance().var_id_by_names[var_name];

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
     * @param var_name Le nom de la var cible
     * @param clone_ranges Est-ce qu'on clone les champs ou pas (par défaut il faut cloner, mais on peut dans certains contextes optimiser en ne clonant pas)
     */
    public static cloneFrom<T extends VarDataBaseVO>(param_to_clone: T, var_name: string = null, clone_fields: boolean = true): T {

        if (!param_to_clone) {
            return null;
        }

        return this.cloneFieldsFromId(
            param_to_clone._type,
            var_name ? VarsController.getInstance().var_id_by_names[var_name] : param_to_clone.var_id,
            param_to_clone,
            clone_fields);
    }

    /**
     * Méthode pour créer un nouveau paramètre de var, quelque soit le type
     * @param param_to_clone Le param que l'on doit cloner
     * @param var_name Le nom de la var cible
     * @param clone_ranges Est-ce qu'on clone les champs ou pas (par défaut il faut cloner, mais on peut dans certains contextes optimiser en ne clonant pas)
     */
    public static cloneArrayFrom<T extends VarDataBaseVO>(params_to_clone: T[], var_name: string = null, clone_fields: boolean = true): T[] {

        if (!params_to_clone) {
            return null;
        }

        let res: T[] = [];

        for (let i in params_to_clone) {
            let param_to_clone = params_to_clone[i];

            res.push(this.cloneFrom(param_to_clone, var_name, clone_fields));
        }

        return res;
    }


    /**
     * Méthode pour créer un nouveau paramètre de var, en clonant les fields depuis un autre paramètre, et en traduisant au besoin le matroid
     * @param param_to_clone Le param que l'on doit cloner
     * @param clone_ranges Est-ce qu'on clone les champs ou pas (par défaut il faut cloner, mais on peut dans certains contextes optimiser en ne clonant pas)
     */
    public static cloneFieldsFrom<T extends VarDataBaseVO>(_type: string, var_name: string, param_to_clone: T, clone_fields: boolean = true): T {

        let res: T = MatroidController.getInstance().cloneFrom(param_to_clone, _type, clone_fields);
        if (!res) {
            return null;
        }
        res.var_id = VarsController.getInstance().var_id_by_names[var_name];
        return res;
    }

    /**
     * Méthode pour créer un nouveau paramètre de var, en clonant les fields depuis un autre paramètre, et en traduisant au besoin le matroid
     * @param param_to_clone Le param que l'on doit cloner
     * @param clone_ranges Est-ce qu'on clone les champs ou pas (par défaut il faut cloner, mais on peut dans certains contextes optimiser en ne clonant pas)
     */
    public static cloneFieldsFromId<T extends VarDataBaseVO>(_type: string, var_id: number, param_to_clone: T, clone_fields: boolean = true): T {

        let res: T = MatroidController.getInstance().cloneFrom(param_to_clone, _type, clone_fields);
        if (!res) {
            return null;
        }
        res.var_id = var_id;
        return res;
    }

    public _type: string;
    public id: number;

    public var_id: number;

    /**
     * La valeur calculée du noeud :
     *  - undefined indique une valeur non calculée
     *  - null indique une valeur calculée, dont le résultat est : null
     */
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
                this._index += RangeHandler.getInstance().getIndexRanges(this[field.field_id]);
            }
        }

        return this._index;
    }
}