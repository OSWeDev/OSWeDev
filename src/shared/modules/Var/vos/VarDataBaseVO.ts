
import ConsoleHandler from '../../../tools/ConsoleHandler';
import MatroidIndexHandler from '../../../tools/MatroidIndexHandler';
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

    public static VALUE_TYPE_LABELS: string[] = ['var_data.value_type.import', 'var_data.value_type.computed', 'var_data.value_type.denied'];
    public static VALUE_TYPE_IMPORT: number = 0;
    public static VALUE_TYPE_COMPUTED: number = 1;
    public static VALUE_TYPE_DENIED: number = 2;

    public static from_index(index: string): VarDataBaseVO {

        return MatroidIndexHandler.getInstance().from_normalized_vardata(index);
    }

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
        let moduletable = VOsTypesManager.moduleTables_by_voType[varConf.var_data_vo_type];

        let res: T = moduletable.voConstructor();
        res._type = varConf.var_data_vo_type;
        res.var_id = varConf.id;

        if (!res.var_id) {
            ConsoleHandler.error("VarDataBaseVO.createNew var_name :: " + var_name);
        }

        let fields = MatroidController.getInstance().getMatroidFields(varConf.var_data_vo_type);
        let param_i: number = 0;
        for (let i in fields) {
            let field = fields[i];

            if ((!fields_ordered_as_in_moduletable_definition[param_i]) || (fields_ordered_as_in_moduletable_definition[param_i].indexOf(null) >= 0)) {
                // ConsoleHandler.warn('createNew:field null:' + var_name + ':' + field.field_id + ':');
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

        let field_segmentations: { [field_id: string]: number } = this.get_varconf_segmentations(varConf);

        /**
         * Si on change le type se segmentation on adapte aussi le param
         */
        this.adapt_param_to_varconf_segmentations(res, field_segmentations);
        return res;
    }

    /**
     * Si on change le type se segmentation on adapte le param
     */
    public static adapt_param_to_varconf_segmentations<T extends VarDataBaseVO>(vardata: T, field_segmentations: { [field_id: string]: number }) {
        for (let field_id in field_segmentations) {
            let segmentation_cible = field_segmentations[field_id];
            let ranges = vardata[field_id];

            if (ranges && (segmentation_cible != null)) {
                vardata[field_id] = RangeHandler.getInstance().get_ranges_according_to_segment_type(
                    ranges, field_segmentations[field_id], true);
            }
        }
    }

    public static get_varconf_segmentations(varConf: VarConfVO): { [field_id: string]: number } {
        let res: { [field_id: string]: number } = {};
        let fields = MatroidController.getInstance().getMatroidFields(varConf.var_data_vo_type);

        if (varConf) {
            if (varConf.segment_types) {
                for (let i in fields) {
                    let field = fields[i];
                    let segmentation_cible = varConf.segment_types[field.field_id];
                    segmentation_cible = (segmentation_cible != null) ?
                        segmentation_cible :
                        RangeHandler.getInstance().get_smallest_segment_type_for_range_type(RangeHandler.getInstance().getRangeType(field));
                    res[field.field_id] = segmentation_cible;
                }
            }
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

        clone_fields = varConf ? clone_fields : true; // FIXME : ancienne version, mais pourquoi on voudrait forcer à cloner spécifiquement quand on garde le var_id ?
        varConf = varConf ? varConf : VarsController.getInstance().var_conf_by_id[param_to_clone.var_id];

        let res: U = MatroidController.getInstance().cloneFrom<T, U>(param_to_clone, varConf.var_data_vo_type, clone_fields);
        if (!res) {
            return null;
        }
        /**
         * Si on change le type se segmentation on adapte aussi le param
         */
        let field_segmentations: { [field_id: string]: number } = this.get_varconf_segmentations(varConf);
        this.adapt_param_to_varconf_segmentations(res, field_segmentations);

        res.var_id = varConf ? varConf.id : param_to_clone.var_id;

        if (!res.var_id) {
            ConsoleHandler.error("VarDataBaseVO.cloneFieldsFromVarConf varConf :: " + JSON.stringify(varConf));
            ConsoleHandler.error("VarDataBaseVO.cloneFieldsFromVarConf param_to_clone:: " + JSON.stringify(param_to_clone));
        }

        return res;
    }

    public _type: string;
    public id: number;

    public _var_id: number;

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

    get var_id(): number { return this._var_id; }
    set var_id(var_id: number) {
        this.set_field('var_id', var_id);
    }

    /**
     * Pour forcer le rebuild de l'index et avoir un truc propre (à appeler si on change le param après un create new ou un clone from)
     */
    public rebuild_index() {

        this._index = null;
    }

    /**
     * Attention : L'index est initialisé au premier appel au getter, et immuable par la suite.
     */
    get index(): string {

        if (!this._index) {
            MatroidIndexHandler.getInstance().normalize_vardata_fields(this);
            this._index = MatroidIndexHandler.getInstance().get_normalized_vardata(this);
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

    protected set_field(field_id: string, value: any) {
        this['_' + field_id] = value;
        if (field_id != 'var_id') {
            if (Array.isArray(value)) {
                this.rebuild_index();
            }
        }
    }
}