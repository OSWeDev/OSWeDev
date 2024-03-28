
import ConsoleHandler from '../../../tools/ConsoleHandler';
import MatroidIndexHandler from '../../../tools/MatroidIndexHandler';
import RangeHandler from '../../../tools/RangeHandler';
import ModuleTableController from '../../DAO/ModuleTableController';
import ModuleTableFieldVO from '../../DAO/vos/ModuleTableFieldVO';
import IRange from '../../DataRender/interfaces/IRange';
import MatroidController from '../../Matroid/MatroidController';
import IMatroid from '../../Matroid/interfaces/IMatroid';
import VarsController from '../VarsController';
import VarConfVO from './VarConfVO';


/**
 * Généré par ChatGPT :
 *      Utility type pour filtrer les clés de T qui correspondent à un type de donnée spécifique
 *          et qui ne commencent pas par '_'.
 */
type FilterFields<T, FieldType> = {
    [Key in keyof T]: T[Key] extends FieldType ? (Key extends string ? (Key extends `_${string}` ? never : Key) : never) : never;
}[keyof T];

/**
 * Généré par ChatGPT :
 *      Utiliser Pick pour sélectionner uniquement les champs filtrés.
 */
type MatroidFields<T> = Pick<T, FilterFields<T, IRange[]>>;

/**
 * Paramètre le calcul de variables
 */
export default class VarDataBaseVO implements IMatroid {

    public static VALUE_TYPE_LABELS: string[] = ['var_data.value_type.import', 'var_data.value_type.computed', 'var_data.value_type.denied'];
    public static VALUE_TYPE_IMPORT: number = 0;
    public static VALUE_TYPE_COMPUTED: number = 1;
    public static VALUE_TYPE_DENIED: number = 2;

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

    private _index: string;
    private _is_pixel: boolean;

    private rebuilding_index: boolean = false;

    public constructor() { }

    get var_id(): number { return this._var_id; }
    get is_pixel(): boolean {

        if (this._is_pixel == null) {
            const a = this.index;
        }

        return this._is_pixel;
    }

    get _bdd_only_is_pixel(): boolean {

        return this.is_pixel;
    }

    /**
     * Attention : L'index est initialisé au premier appel au getter, et immuable par la suite.
     *
     * Suite discussion avec chatgpt... pour booster les perfs de ce truc, on passe par un getter pour le premier appel,
     * par ce que c'est quand même de loin le plus simple, mais lorsque le getter est appelé, on le remplace par une propriété
     *
     *
     * class A {
     *   constructor() {}
     *
     *   get b() {
     *     console.log("IN B");
     *     // Suppression du getter et définition de la propriété avec une valeur fixe
     *     Object.defineProperty(this, 'b', {
     *       value: "f",
     *       writable: true, // Permet de réassigner la valeur plus tard si nécessaire
     *       configurable: true // Permet de reconfigurer ou de supprimer la propriété plus tard
     *     });
     *     return this.b;
     *   }
     *
     *   public e() {
     *     this.b = "g"; // Réaffectation directe sans supprimer, car 'b' n'est plus un getter
     *     console.log("IN E");
     *   }
     * }
     *
     * let a_ = new A();
     * console.log(a_.b); // Premier appel, affichera "IN B" puis "f"
     * a_.e(); // Modification de la valeur de 'b'
     * console.log(a_.b); // Affichera "g" sans passer par le getter
     */
    get index(): string {

        return this.initial_getter_index();
    }

    /**
     * On aimerait rajouter l'index en base pour les filtrages exactes mais ça veut dire un index définitivement unique et pour autant
     *  si on ségmente mois janvier ou jour 01/01 au 31/01 c'est la même var mais pas les mêmes ranges donc un index pas réversible.
     *  Est-ce qu'on parle d'un deuxième index dédié uniquement au filtrage en base du coup ?
     */
    get _bdd_only_index(): string {

        return this.index;
    }

    set var_id(var_id: number) {
        this.set_field('var_id', var_id);
    }

    /**
     * On définit un pixel comme un param qui a un cardinal de 1 sur les champs pixellisés
     * @param vardata
     */
    public static is_pixel(vardata: VarDataBaseVO): boolean {

        const varconf = VarsController.var_conf_by_id[vardata.var_id];

        if (!varconf) {
            return false;
        }

        for (const i in varconf.pixel_fields) {
            const pixel_field = varconf.pixel_fields[i];
            const card = RangeHandler.getCardinalFromArray(vardata[pixel_field.pixel_param_field_name]);

            if (card != 1) {
                return false;
            }
        }

        return true;
    }

    public static from_index(index: string): VarDataBaseVO {

        return MatroidIndexHandler.from_normalized_vardata(index);
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
     * Méthode typée pour créer un nouveau paramètre de var, quelque soit le type
     * @param _type Le vo_type cible
     * @param var_name Le nom de la var cible
     * @param clone_ranges Est-ce qu'on clone les champs ou pas (par défaut il faut cloner, mais on peut dans certains contextes optimiser en ne clonant pas)
     * @param fields_ordered_as_in_moduletable_definition Les ranges du matroid ordonnés dans le même ordre que dans la définition du moduletable
     */
    public static new<T extends VarDataBaseVO>(
        var_type: { new(): T },
        var_name: string,
        clone_fields: boolean = true,
        matroid_fields: MatroidFields<T>): T {

        const fields_ordered_as_in_moduletable_definition: IRange[][] = [];
        const var_conf = VarsController.var_conf_by_name[var_name];

        const fields = MatroidController.getMatroidFields(var_conf.var_data_vo_type);
        for (const i in fields) {
            const field = fields[i];
            fields_ordered_as_in_moduletable_definition.push(matroid_fields[field.field_name]);
        }
        return this.createNew(var_name, clone_fields, ...fields_ordered_as_in_moduletable_definition);
    }


    /**
     * Méthode pour créer un nouveau paramètre de var, quelque soit le type
     * @param _type Le vo_type cible
     * @param var_name Le nom de la var cible
     * @param clone_ranges Est-ce qu'on clone les champs ou pas (par défaut il faut cloner, mais on peut dans certains contextes optimiser en ne clonant pas)
     * @param fields_ordered_as_in_moduletable_definition Les ranges du matroid ordonnés dans le même ordre que dans la définition du moduletable
     */
    public static createNew<T extends VarDataBaseVO>(var_name: string, clone_fields: boolean = true, ...fields_ordered_as_in_moduletable_definition: IRange[][]): T {

        const varConf = VarsController.var_conf_by_name[var_name];

        const res: T = new ModuleTableController.vo_constructor_by_vo_type[varConf.var_data_vo_type]() as T;
        res._type = varConf.var_data_vo_type;
        res.var_id = varConf.id;

        if (!res.var_id) {
            ConsoleHandler.error("VarDataBaseVO.createNew var_name :: " + var_name);
        }

        const fields = MatroidController.getMatroidFields(varConf.var_data_vo_type);
        let param_i: number = 0;
        for (const i in fields) {
            const field = fields[i];

            if ((!fields_ordered_as_in_moduletable_definition[param_i]) || (fields_ordered_as_in_moduletable_definition[param_i].indexOf(null) >= 0)) {
                // ConsoleHandler.warn('createNew:field null:' + var_name + ':' + field.field_id + ':');
                switch (field.field_type) {
                    case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
                        res[field.field_id] = [RangeHandler.getMaxNumRange()];
                        break;
                    case ModuleTableFieldVO.FIELD_TYPE_hourrange_array:
                        res[field.field_id] = [RangeHandler.getMaxHourRange()];
                        break;
                    case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                        res[field.field_id] = [RangeHandler.getMaxTSRange()];
                        break;
                    default:
                        break;
                }
            } else {
                res[field.field_id] = clone_fields ? RangeHandler.cloneArrayFrom(fields_ordered_as_in_moduletable_definition[param_i]) : fields_ordered_as_in_moduletable_definition[param_i];
            }
            param_i++;
        }

        const field_segmentations: { [field_id: string]: number } = this.get_varconf_segmentations(varConf);

        /**
         * Si on change le type de segmentation on adapte aussi le param
         */
        this.adapt_param_to_varconf_segmentations(res, field_segmentations);
        return res;
    }

    /**
     * Si on change le type se segmentation on adapte le param
     */
    public static adapt_param_to_varconf_segmentations<T extends VarDataBaseVO>(vardata: T, field_segmentations: { [field_id: string]: number }) {
        for (const field_id in field_segmentations) {
            const segmentation_cible = field_segmentations[field_id];
            const ranges = vardata[field_id];

            if (ranges && (segmentation_cible != null)) {
                vardata[field_id] = RangeHandler.get_ranges_according_to_segment_type(
                    ranges, field_segmentations[field_id], true);
            }
        }
    }

    public static get_varconf_segmentations(varConf: VarConfVO): { [field_id: string]: number } {
        const res: { [field_id: string]: number } = {};

        if (!varConf) {
            return res;
        }

        const fields = MatroidController.getMatroidFields(varConf.var_data_vo_type);

        for (const i in fields) {
            const field = fields[i];
            let segmentation_cible = varConf.segment_types ? varConf.segment_types[field.field_id] : null;
            segmentation_cible = (segmentation_cible != null) ?
                segmentation_cible :
                RangeHandler.get_smallest_segment_type_for_range_type(RangeHandler.getRangeType(field));
            res[field.field_id] = segmentation_cible;
        }

        return res;
    }

    /**
     * Méthode pour créer un nouveau paramètre de var, quelque soit le type
     * TODO FIXME un jour trouver un moyen de typer ce truc correctement. ya 2 cas d'usages, 1 où on accepte d'étendre le type, et un autre où on veut pas
     *   j'ai fait plein de tests de typages mais c'est à la fois très contraignant et incomplet, donc on fait simple et pratique quitte à être incomplet.
     * @param param_to_clone Le param que l'on doit cloner
     * @param var_name Le nom de la var cible
     * @param clone_ranges Est-ce qu'on clone les champs ou pas (par défaut il faut cloner, mais on peut dans certains contextes optimiser en ne clonant pas)
     */
    public static cloneFromVarName<T extends VarDataBaseVO, U extends VarDataBaseVO>(
        param_to_clone: T,
        var_name: string = null,
        clone_fields: boolean = true,
        static_fields: { [field_id: string]: IRange[] } = null): U {

        return this.cloneFieldsFromVarName<T, U>(param_to_clone, var_name, clone_fields, static_fields);
    }

    /**
     * Méthode pour créer un nouveau paramètre de var, quelque soit le type
     * TODO FIXME un jour trouver un moyen de typer ce truc correctement. ya 2 cas d'usages, 1 où on accepte d'étendre le type, et un autre où on veut pas
     *   j'ai fait plein de tests de typages mais c'est à la fois très contraignant et incomplet, donc on fait simple et pratique quitte à être incomplet.
     * @param param_to_clone Le param que l'on doit cloner
     * @param var_id Identifiant de la var cible
     * @param clone_ranges Est-ce qu'on clone les champs ou pas (par défaut il faut cloner, mais on peut dans certains contextes optimiser en ne clonant pas)
     */
    public static cloneFromVarId<T extends VarDataBaseVO, U extends VarDataBaseVO>(
        param_to_clone: T,
        var_id: number = null,
        clone_fields: boolean = true,
        static_fields: { [field_id: string]: IRange[] } = null): U {

        return this.cloneFieldsFromVarId<T, U>(param_to_clone, var_id, clone_fields, static_fields);
    }

    /**
     * Méthode pour créer un nouveau paramètre de var, quelque soit le type
     * TODO FIXME un jour trouver un moyen de typer ce truc correctement. ya 2 cas d'usages, 1 où on accepte d'étendre le type, et un autre où on veut pas
     *   j'ai fait plein de tests de typages mais c'est à la fois très contraignant et incomplet, donc on fait simple et pratique quitte à être incomplet.
     *     public static cloneFromVarConf<T extends U, U extends VarDataBaseVO, V extends { [field_id: string]: IRange[] }>(
     *       param_to_clone: T,
     *        var_conf: VarConfVO = null,
     *        clone_fields: boolean = true,
     *        static_fields: V = null): U & V & { [key in keyof V as `_${Extract<key, string>}`]: IRange[] } {
     *
     *        return this.cloneFieldsFromVarConf<T, U, V>(param_to_clone, var_conf, clone_fields, static_fields);
     *    }

     * @param param_to_clone Le param que l'on doit cloner
     * @param var_conf La conf de la var cible
     * @param clone_ranges Est-ce qu'on clone les champs ou pas (par défaut il faut cloner, mais on peut dans certains contextes optimiser en ne clonant pas)
     */
    public static cloneFromVarConf<T extends VarDataBaseVO, U extends VarDataBaseVO>(
        param_to_clone: T,
        var_conf: VarConfVO = null,
        clone_fields: boolean = true,
        static_fields: { [field_id: string]: IRange[] } = null): U {

        return this.cloneFieldsFromVarConf<T, U>(param_to_clone, var_conf, clone_fields, static_fields);
    }

    /**
     * Méthode pour créer un nouveau paramètre de var, quelque soit le type
     * TODO FIXME un jour trouver un moyen de typer ce truc correctement. ya 2 cas d'usages, 1 où on accepte d'étendre le type, et un autre où on veut pas
     *   j'ai fait plein de tests de typages mais c'est à la fois très contraignant et incomplet, donc on fait simple et pratique quitte à être incomplet.
     * @param param_to_clone Le param que l'on doit cloner
     * @param var_name Le nom de la var cible
     * @param clone_ranges Est-ce qu'on clone les champs ou pas (par défaut il faut cloner, mais on peut dans certains contextes optimiser en ne clonant pas)
     */
    public static cloneArrayFrom<T extends VarDataBaseVO, U extends VarDataBaseVO>(
        params_to_clone: T[],
        var_name: string = null,
        clone_fields: boolean = true,
        static_fields: { [field_id: string]: IRange[] } = null): Array<U> {

        if (!params_to_clone) {
            return null;
        }

        const res: Array<U> = [];

        for (const i in params_to_clone) {
            const param_to_clone = params_to_clone[i];

            // On surcharge volontairement le typage, car ici on veut bien avoir U extends T au lieu de l'inverse, ça pose pas de soucis a priori dans l'usage qui est plutôt pour des invalidators
            res.push(this.cloneFromVarName<T, U>(param_to_clone, var_name, clone_fields, static_fields));
        }

        return res;
    }


    /**
     * Perf : préférer cloneFieldsFromVarConf si on a déjà la conf à dispo, sinon aucun impact
     * Méthode pour créer un nouveau paramètre de var, en clonant les fields depuis un autre paramètre, et en traduisant au besoin le matroid
     * TODO FIXME un jour trouver un moyen de typer ce truc correctement. ya 2 cas d'usages, 1 où on accepte d'étendre le type, et un autre où on veut pas
     *   j'ai fait plein de tests de typages mais c'est à la fois très contraignant et incomplet, donc on fait simple et pratique quitte à être incomplet.
     * @param param_to_clone Le param que l'on doit cloner
     * @param clone_ranges Est-ce qu'on clone les champs ou pas (par défaut il faut cloner, mais on peut dans certains contextes optimiser en ne clonant pas)
     */
    public static cloneFieldsFromVarName<T extends VarDataBaseVO, U extends VarDataBaseVO>(
        param_to_clone: T,
        var_name: string = null,
        clone_fields: boolean = true,
        static_fields: { [field_id: string]: IRange[] } = null
    ): U {

        return this.cloneFieldsFromVarConf<T, U>(param_to_clone, VarsController.var_conf_by_name[var_name], clone_fields, static_fields);
    }

    /**
     * Perf : préférer cloneFieldsFromVarConf si on a déjà la conf à dispo, sinon aucun impact
     * Méthode pour créer un nouveau paramètre de var, en clonant les fields depuis un autre paramètre, et en traduisant au besoin le matroid
     * TODO FIXME un jour trouver un moyen de typer ce truc correctement. ya 2 cas d'usages, 1 où on accepte d'étendre le type, et un autre où on veut pas
     *   j'ai fait plein de tests de typages mais c'est à la fois très contraignant et incomplet, donc on fait simple et pratique quitte à être incomplet.
     * @param param_to_clone Le param que l'on doit cloner
     * @param clone_ranges Est-ce qu'on clone les champs ou pas (par défaut il faut cloner, mais on peut dans certains contextes optimiser en ne clonant pas)
     */
    public static cloneFieldsFromVarId<T extends VarDataBaseVO, U extends VarDataBaseVO>(
        param_to_clone: T, var_id: number = null, clone_fields: boolean = true, static_fields: { [field_id: string]: IRange[] } = null): U {

        return this.cloneFieldsFromVarConf<T, U>(param_to_clone, VarsController.var_conf_by_id[var_id], clone_fields, static_fields);
    }

    /**
     * Méthode pour créer un nouveau paramètre de var, en clonant les fields depuis un autre paramètre, et en traduisant au besoin le matroid
     * TODO FIXME un jour trouver un moyen de typer ce truc correctement. ya 2 cas d'usages, 1 où on accepte d'étendre le type, et un autre où on veut pas
     *   j'ai fait plein de tests de typages mais c'est à la fois très contraignant et incomplet, donc on fait simple et pratique quitte à être incomplet.
     * @param varConf Si on passe un varConf on applique une conversion sinon on fait un simple clone vers la même var et type d'objet
     * @param param_to_clone Le param que l'on doit cloner
     * @param clone_ranges Est-ce qu'on clone les champs ou pas (par défaut il faut cloner, mais on peut dans certains contextes optimiser en ne clonant pas)
     */
    public static cloneFieldsFromVarConf<T extends VarDataBaseVO, U extends VarDataBaseVO>(
        param_to_clone: T,
        varConf: VarConfVO = null,
        clone_fields: boolean = true,
        static_fields: { [field_id: string]: IRange[] } = null): U {

        if (!param_to_clone) {
            return null;
        }

        clone_fields = varConf ? clone_fields : true; // FIXME : ancienne version, mais pourquoi on voudrait forcer à cloner spécifiquement quand on garde le var_id ?
        varConf = varConf ? varConf : VarsController.var_conf_by_id[param_to_clone.var_id];

        const res: U = MatroidController.cloneFrom<T, U>(param_to_clone, varConf.var_data_vo_type, clone_fields, static_fields);
        if (!res) {
            return null;
        }
        /**
         * Si on change le type se segmentation on adapte aussi le param
         */
        const field_segmentations: { [field_id: string]: number } = this.get_varconf_segmentations(varConf);
        this.adapt_param_to_varconf_segmentations(res, field_segmentations);

        res.var_id = varConf ? varConf.id : param_to_clone.var_id;

        if (!res.var_id) {
            ConsoleHandler.error("VarDataBaseVO.cloneFieldsFromVarConf varConf :: " + JSON.stringify(varConf));
            ConsoleHandler.error("VarDataBaseVO.cloneFieldsFromVarConf param_to_clone:: " + JSON.stringify(param_to_clone));
        }

        for (const field_name in static_fields) {
            res[field_name] = static_fields[field_name];
        }

        return res;
    }

    /**
     * on demande le rebuild au prochain accès au getter
     */
    public rebuild_index() {

        this._index = null;
        Object.defineProperty(this, 'index', {
            get: this.initial_getter_index,
            configurable: true // Permet de reconfigurer ou de supprimer la propriété plus tard
        });
    }

    public do_rebuild_index() {

        if (this.rebuilding_index) {
            return;
        }
        this.rebuilding_index = true;

        MatroidIndexHandler.normalize_vardata_fields(this);
        this._index = MatroidIndexHandler.get_normalized_vardata(this);
        this._is_pixel = VarDataBaseVO.is_pixel(this);

        this.rebuilding_index = false;
    }

    /**
     * Fonction qui check que le type de l'object est cohérent avec le type demandé. Même type et champs a minima avec un range
     */
    public check_param_is_valid(target_type: string): boolean {

        if (this._type != target_type) {
            return false;
        }

        if (!VarsController.var_conf_by_id[this.var_id]) {
            return false;
        }

        const fields = MatroidController.getMatroidFields(this._type);

        for (const i in fields) {
            const field = fields[i];

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
        } else {
            this.rebuild_index();
        }
    }

    private initial_getter_index(): string {

        if (!this._index) {
            this.do_rebuild_index();
        }

        Object.defineProperty(this, 'index', {
            value: this._index,
            writable: true, // Permet de réassigner la valeur plus tard si nécessaire
            configurable: true // Permet de reconfigurer ou de supprimer la propriété plus tard
        });

        return this._index;
    }
}