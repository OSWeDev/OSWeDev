
import ConsoleHandler from '../../../tools/ConsoleHandler';
import RangeHandler from '../../../tools/RangeHandler';
import IRange from '../../DataRender/interfaces/IRange';
import IMatroid from '../../Matroid/interfaces/IMatroid';
import MatroidController from '../../Matroid/MatroidController';
import ModuleTableField from '../../ModuleTableField';
import VOsTypesManager from '../../VOsTypesManager';
import VarsController from '../VarsController';
import VarConfVO from './VarConfVO';

/**
 * Paramètre le calcul de variables
 */
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
     * Méthode pour créer un nouveau paramètre de var, quelque soit le type
     * @param _type Le vo_type cible
     * @param var_name Le nom de la var cible
     * @param clone_ranges Est-ce qu'on clone les champs ou pas (par défaut il faut cloner, mais on peut dans certains contextes optimiser en ne clonant pas)
     * @param fields_ordered_as_in_moduletable_definition Les ranges du matroid ordonnés dans le même ordre que dans la définition du moduletable
     */
    public static createNew<T extends VarDataBaseVO>(var_name: string, clone_fields: boolean = true, ...fields_ordered_as_in_moduletable_definition: IRange[][]): T {

        let varConf = VarsController.getInstance().var_conf_by_name[var_name];
        let moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[varConf.var_data_vo_type];

        let res: T = moduletable.voConstructor();
        res._type = varConf.var_data_vo_type;
        res.var_id = varConf.id;

        let fields = MatroidController.getInstance().getMatroidFields(varConf.var_data_vo_type);
        let param_i: number = 0;
        for (let i in fields) {
            let field = fields[i];

            if ((!fields_ordered_as_in_moduletable_definition[param_i]) || (fields_ordered_as_in_moduletable_definition[param_i].indexOf(null) >= 0)) {
                ConsoleHandler.getInstance().warn('createNew:field null:' + var_name + ':' + field.field_id + ':');
                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_numrange_array:
                        res[field.field_id] = [RangeHandler.getInstance().getMaxNumRange()];
                        break;
                    case ModuleTableField.FIELD_TYPE_hourrange_array:
                        res[field.field_id] = [RangeHandler.getInstance().getMaxHourRange()];
                        break;
                    case ModuleTableField.FIELD_TYPE_tstzrange_array:
                        res[field.field_id] = [RangeHandler.getInstance().getMaxTSRange()];
                        break;
                    default:
                        break;
                }
            } else {
                res[field.field_id] = clone_fields ? RangeHandler.getInstance().cloneArrayFrom(fields_ordered_as_in_moduletable_definition[param_i]) : fields_ordered_as_in_moduletable_definition[param_i];
            }
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
    public value_ts: number;

    public last_reads_ts: number[];

    private _index: string;

    public constructor() { }

    /**
     * Attention : L'index est initialisé au premier appel au getter, et immuable par la suite.
     */
    get index(): string {

        if ((!this._index) || (this._index == 'X')) {
            let fields = MatroidController.getInstance().getMatroidFields(this._type);

            this._index = this.var_id ? this.var_id.toString() : 'X';
            for (let i in fields) {
                let field = fields[i];

                this._index += '_';
                this._index += RangeHandler.getInstance().getIndexRanges(this[field.field_id]);
            }
        }

        return this._index;
    }

    /**
     * On aimerait rajouter l'index en base pour les filtrages exactes mais ça veut dire un index définitivement unique et pour autant
     *  si on ségmente mois janvier ou jour 01/01 au 31/01 c'est la même var mais pas les mêmes ranges donc un index pas réversible.
     *  Est-ce qu'on parle d'un deuxième index dédié uniquement au filtrage en base du coup ?
     */
    get _bdd_only_index(): string {

        return this.index;
    }

    /**
     * Fonction qui check que le type de l'object est cohérent avec le type demandé. Même type et champs a minima avec un range
     */
    public check_param_is_valid(target_type: string): boolean {

        if (this._type != target_type) {
            return false;
        }

        if (!VarsController.getInstance().var_conf_by_id[this.var_id]) {
            return false;
        }

        let fields = MatroidController.getInstance().getMatroidFields(this._type);

        for (let i in fields) {
            let field = fields[i];

            if ((!this[field.field_id]) || (!this[field.field_id].length)) {
                return false;
            }
        }

        return true;
    }
}