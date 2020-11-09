import * as moment from 'moment';
import { Moment } from 'moment';
import VarsServerController from '../../../../server/modules/Var/VarsServerController';
import RangeHandler from '../../../tools/RangeHandler';
import IRange from '../../DataRender/interfaces/IRange';
import IMatroid from '../../Matroid/interfaces/IMatroid';
import MatroidController from '../../Matroid/MatroidController';
import VOsTypesManager from '../../VOsTypesManager';
import VarsController from '../VarsController';
import VarCacheConfVO from './VarCacheConfVO';
import VarConfVO from './VarConfVO';

export default class VarDataBaseVO implements IMatroid {

    public static VALUE_TYPE_LABELS: string[] = ['var_data.value_type.import', 'var_data.value_type.computed'];
    public static VALUE_TYPE_IMPORT: number = 0;
    public static VALUE_TYPE_COMPUTED: number = 1;

    public static are_same(a: VarDataBaseVO, b: VarDataBaseVO): boolean {
        if (a && !b) {
            return false;
        }

        if (b && !a) {
            return false;
        }

        if ((!b) && (!a)) {
            return true;
        }

        return a.index == b.index;
    }

    /**
     * On considère la valeur valide si elle a une date de calcul ou d'init, une valeur pas undefined et
     *  si on a une conf de cache, pas expirée. Par contre est-ce que les imports expirent ? surement pas
     *  dont il faut aussi indiquer ces var datas valides
     * Si on est côté client, le varcacheconf est null donc on ignore cette question
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
    public static createNew<T extends VarDataBaseVO>(var_name: string, clone_fields: boolean = true, ...fields_ordered_as_in_moduletable_definition: Array<Array<IRange<any>>>): T {

        let varConf = VarsController.getInstance().var_conf_by_name[var_name];
        let moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[varConf.var_data_vo_type];

        let res: T = moduletable.voConstructor();
        res._type = varConf.var_data_vo_type;
        res.var_id = varConf.id;

        let fields = MatroidController.getInstance().getMatroidFields(varConf.var_data_vo_type);
        let param_i: number = 0;
        for (let i in fields) {
            let field = fields[i];

            res[field.field_id] = clone_fields ? RangeHandler.getInstance().cloneArrayFrom(fields_ordered_as_in_moduletable_definition[param_i]) : fields_ordered_as_in_moduletable_definition[param_i];
            param_i++;
        }

        /**
         * Si on change le type se segmentation on adapte aussi le param
         */
        if (varConf && (varConf.ts_ranges_segment_type != null)) {
            res[varConf.ts_ranges_field_name] = RangeHandler.getInstance().get_ranges_according_to_segment_type(
                res[varConf.ts_ranges_field_name], varConf.ts_ranges_segment_type);
        }

        return res;
    }

    /**
     * Méthode pour créer un nouveau paramètre de var, quelque soit le type
     * @param param_to_clone Le param que l'on doit cloner
     * @param var_name Le nom de la var cible
     * @param clone_ranges Est-ce qu'on clone les champs ou pas (par défaut il faut cloner, mais on peut dans certains contextes optimiser en ne clonant pas)
     */
    public static cloneFromVarName<T extends VarDataBaseVO, U extends VarDataBaseVO>(param_to_clone: T, var_name: string = null, clone_fields: boolean = true): U {

        return this.cloneFieldsFromVarName<T, U>(param_to_clone, var_name, clone_fields);
    }

    /**
     * Méthode pour créer un nouveau paramètre de var, quelque soit le type
     * @param param_to_clone Le param que l'on doit cloner
     * @param var_id Identifiant de la var cible
     * @param clone_ranges Est-ce qu'on clone les champs ou pas (par défaut il faut cloner, mais on peut dans certains contextes optimiser en ne clonant pas)
     */
    public static cloneFromVarId<T extends VarDataBaseVO, U extends VarDataBaseVO>(param_to_clone: T, var_id: number = null, clone_fields: boolean = true): U {

        return this.cloneFieldsFromVarId<T, U>(param_to_clone, var_id, clone_fields);
    }

    /**
     * Méthode pour créer un nouveau paramètre de var, quelque soit le type
     * @param param_to_clone Le param que l'on doit cloner
     * @param var_conf La conf de la var cible
     * @param clone_ranges Est-ce qu'on clone les champs ou pas (par défaut il faut cloner, mais on peut dans certains contextes optimiser en ne clonant pas)
     */
    public static cloneFromVarConf<T extends VarDataBaseVO, U extends VarDataBaseVO>(param_to_clone: T, var_conf: VarConfVO = null, clone_fields: boolean = true): U {

        return this.cloneFieldsFromVarConf<T, U>(param_to_clone, var_conf, clone_fields);
    }

    /**
     * Méthode pour créer un nouveau paramètre de var, quelque soit le type
     * @param param_to_clone Le param que l'on doit cloner
     * @param var_name Le nom de la var cible
     * @param clone_ranges Est-ce qu'on clone les champs ou pas (par défaut il faut cloner, mais on peut dans certains contextes optimiser en ne clonant pas)
     */
    public static cloneArrayFrom<T extends VarDataBaseVO, U extends VarDataBaseVO>(params_to_clone: T[], var_name: string = null, clone_fields: boolean = true): U[] {

        if (!params_to_clone) {
            return null;
        }

        let res: U[] = [];

        for (let i in params_to_clone) {
            let param_to_clone = params_to_clone[i];

            res.push(this.cloneFromVarName<T, U>(param_to_clone, var_name, clone_fields));
        }

        return res;
    }


    /**
     * Perf : préférer cloneFieldsFromVarConf si on a déjà la conf à dispo, sinon aucun impact
     * Méthode pour créer un nouveau paramètre de var, en clonant les fields depuis un autre paramètre, et en traduisant au besoin le matroid
     * @param param_to_clone Le param que l'on doit cloner
     * @param clone_ranges Est-ce qu'on clone les champs ou pas (par défaut il faut cloner, mais on peut dans certains contextes optimiser en ne clonant pas)
     */
    public static cloneFieldsFromVarName<T extends VarDataBaseVO, U extends VarDataBaseVO>(param_to_clone: T, var_name: string = null, clone_fields: boolean = true): U {

        return this.cloneFieldsFromVarConf<T, U>(param_to_clone, VarsController.getInstance().var_conf_by_name[var_name], clone_fields);
    }

    /**
     * Perf : préférer cloneFieldsFromVarConf si on a déjà la conf à dispo, sinon aucun impact
     * Méthode pour créer un nouveau paramètre de var, en clonant les fields depuis un autre paramètre, et en traduisant au besoin le matroid
     * @param param_to_clone Le param que l'on doit cloner
     * @param clone_ranges Est-ce qu'on clone les champs ou pas (par défaut il faut cloner, mais on peut dans certains contextes optimiser en ne clonant pas)
     */
    public static cloneFieldsFromVarId<T extends VarDataBaseVO, U extends VarDataBaseVO>(param_to_clone: T, var_id: number = null, clone_fields: boolean = true): U {

        return this.cloneFieldsFromVarConf<T, U>(param_to_clone, VarsController.getInstance().var_conf_by_id[var_id], clone_fields);
    }

    /**
     * Méthode pour créer un nouveau paramètre de var, en clonant les fields depuis un autre paramètre, et en traduisant au besoin le matroid
     * @param varConf Si on passe un varConf on applique une conversion sinon on fait un simple clone vers la même var et type d'objet
     * @param param_to_clone Le param que l'on doit cloner
     * @param clone_ranges Est-ce qu'on clone les champs ou pas (par défaut il faut cloner, mais on peut dans certains contextes optimiser en ne clonant pas)
     */
    public static cloneFieldsFromVarConf<T extends VarDataBaseVO, U extends VarDataBaseVO>(param_to_clone: T, varConf: VarConfVO = null, clone_fields: boolean = true): U {

        if (!param_to_clone) {
            return null;
        }

        let res: U = MatroidController.getInstance().cloneFrom<T, U>(param_to_clone, varConf ? varConf.var_data_vo_type : param_to_clone._type, varConf ? clone_fields : true);
        if (!res) {
            return null;
        }
        /**
         * Si on change le type se segmentation on adapte aussi le param
         */
        if (varConf && (varConf.ts_ranges_segment_type != null)) {
            res[varConf.ts_ranges_field_name] = RangeHandler.getInstance().get_ranges_according_to_segment_type(
                res[varConf.ts_ranges_field_name], varConf.ts_ranges_segment_type);
        }
        res.var_id = varConf ? varConf.id : param_to_clone.var_id;
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