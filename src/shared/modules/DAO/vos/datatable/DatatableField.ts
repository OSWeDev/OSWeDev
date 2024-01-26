import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import ModuleTable from '../../../../../shared/modules/ModuleTable';
import WeightHandler from '../../../../tools/WeightHandler';
import Alert from '../../../Alert/vos/Alert';
import ModuleTableField from '../../../ModuleTableField';
import VOsTypesManager from '../../../VO/manager/VOsTypesManager';
import ICRUDComponentField from '../../interface/ICRUDComponentField';

/**
 * On utilise le design pattern Fluent_interface : https://en.wikipedia.org/wiki/Fluent_interface
 */
export default abstract class DatatableField<T, U> implements IDistantVOBase {

    public static REF_RANGES_FIELD_TYPE: string = "RefRanges";
    public static MANY_TO_MANY_FIELD_TYPE: string = "ManyToMany";
    public static MANY_TO_ONE_FIELD_TYPE: string = "ManyToOne";
    public static ONE_TO_MANY_FIELD_TYPE: string = "OneToMany";
    public static SIMPLE_FIELD_TYPE: string = "Simple";
    public static COMPUTED_FIELD_TYPE: string = "COMPUTED";
    public static COMPONENT_FIELD_TYPE: string = "COMPONENT";
    public static INPUT_FIELD_TYPE: string = "INPUT";
    public static FILE_FIELD_TYPE: string = "FILE";
    public static VAR_FIELD_TYPE: string = "VAR";
    public static SELECT_BOX_FIELD_TYPE: string = "SELECT_BOX";
    public static CRUD_ACTIONS_FIELD_TYPE: string = "CRUD_ACTIONS";


    // Pour éviter les liens d'import on stocke au chargement de l'appli ici et on type pas... à améliorer certainement plus tard
    public static VueAppBase = null;

    public static computed_value: { [datatable_field_uid: string]: (field_value: any, moduleTableField: ModuleTableField<any>, vo: IDistantVOBase, datatable_field_uid: string) => any } = {};

    /**
     * Field uniquement côté client..... a voir si on a pas plus propre comme système
     */
    public vue_component: ICRUDComponentField = null;

    public id: number;
    public _type: string;

    public _vo_type_id: string;

    public vo_type_full_name: string;


    /**
     * Surcharges du ModuleTableField
     */
    public field_type: string;
    public enum_values: { [value: number]: string };
    public segmentation_type: number;
    public is_inclusive_data: boolean;
    public is_inclusive_ihm: boolean;
    public return_min_value: boolean;
    public format_localized_time: boolean;
    public return_max_value: boolean;
    public max_range_offset: number;

    public tooltip: string = null;

    /**
     * Used in the CREATE or UPDATE views
     */
    public is_required: boolean = false;

    /**
     * Used in the CREATE or UPDATE views to show infos that are not editable
     */
    public is_readonly: boolean = false;

    /**
     * Show/Hide field from datatable
     */
    public hidden: boolean = false;

    /**
     * Show/Hide field from export
     */
    public hiden_export: boolean = false;

    /**
     * Show/Hide field from print
     */
    public hidden_print: boolean = false;

    /**
     * Force Toggle Button to be visible
     */
    public force_toggle_button: boolean = false;

    /**
     * Used in the CREATE or UPDATE views
     */
    public translatable_place_holder: string = null;
    public translatable_title_custom: string = null;

    public select_options_enabled: number[] = null;

    /**
     * BEWARE : Only update for view datatables purposes with viewing multiple times the same field, on different angles.
     * On create or update tables, let it same as datatable_field_uid
     */
    public _module_table_field_id: string;

    abstract get translatable_title(): string;

    public validate: (data: any) => string;
    /**
     * @returns true si seul le field du champ est modifié, false si d'autres champs sont modifiés => forcera un reload global du vo
     */
    public onChange: (vo: IDistantVOBase) => boolean | Promise<boolean>;
    /**
     * @returns true si seul le field du champ est modifié, false si d'autres champs sont modifiés => forcera un reload global du vo
     */
    public onEndOfChange: (vo: IDistantVOBase) => boolean | Promise<boolean>;
    public isVisibleUpdateOrCreate: (vo: IDistantVOBase) => boolean;

    public validate_input: (input_value: U, field: DatatableField<T, U>, vo: any) => Alert[] = null;

    //definit comment trier le field si besoin
    public sort: (vos: IDistantVOBase[]) => void;
    public sortEnum: (opts: number[]) => void;

    //definit la fonction qui permet de filtrer
    public sieve: (vos: IDistantVOBase[]) => IDistantVOBase[];
    public sieveCondition: (e: any) => boolean;
    public sieveEnum: (opts: number[]) => number[];

    public semaphore_auto_update_datatable_field_uid_with_vo_type: boolean = false;

    /**
     *
     * @param type Pour identifier hors contexte typescript le type réel de l'objet...
     * @param datatable_field_uid uid au sein de la datatable pour ce field. Permet d'identifier la colonne. Un nom compatible avec un nom de field
     * @param translatable_title Le titre du field, à passer à la traduction au dernier moment
     */
    public type: string;
    public datatable_field_uid: string;

    get module_table_field_id(): string {
        return this._module_table_field_id;
    }

    set module_table_field_id(module_table_field_id: string) {
        this._module_table_field_id = module_table_field_id;

        this.update_moduleTableField();
    }

    public setModuleTable(moduleTable: ModuleTable<any>): this {
        this.vo_type_full_name = moduleTable.full_name;
        this.vo_type_id = moduleTable.vo_type;
        return this;
    }

    get vo_type_id(): string {
        return this._vo_type_id;
    }

    set vo_type_id(vo_type_id: string) {
        if (!vo_type_id) {
            return;
        }

        this._vo_type_id = vo_type_id;

        this.update_moduleTableField();
    }

    get moduleTable(): ModuleTable<any> {
        if (!this.vo_type_id) {
            return null;
        }

        return VOsTypesManager.moduleTables_by_voType[this.vo_type_id];
    }

    get moduleTableField(): ModuleTableField<T> {
        if (!this.moduleTable) {
            return null;
        }

        return this.moduleTable.getFieldFromId(this.module_table_field_id);
    }

    public auto_update_datatable_field_uid_with_vo_type() {
        if (!this.semaphore_auto_update_datatable_field_uid_with_vo_type) {
            this.semaphore_auto_update_datatable_field_uid_with_vo_type = true;
            this.datatable_field_uid = (this.vo_type_id ? this.vo_type_id : this.type) + '___' + this.datatable_field_uid;
        }
        return this;
    }

    public hide(): this {
        this.hidden = true;
        this.hidden_print = true;

        return this;
    }

    public show(): this {
        this.hidden = false;
        this.hidden_print = false;

        return this;
    }

    public set_tooltip(tooltip: string): this {
        this.tooltip = tooltip;

        return this;
    }

    public hide_print(): this {
        this.hidden_print = true;

        return this;
    }

    public set_force_toggle_button(): this {
        this.force_toggle_button = true;

        return this;
    }

    public hide_export(): this {
        this.hiden_export = true;

        return this;
    }


    public setIsVisibleUpdateOrCreate<P extends IDistantVOBase>(isVisibleUpdateOrCreate: (vo: P) => boolean): this {
        this.isVisibleUpdateOrCreate = isVisibleUpdateOrCreate;
        return this;
    }

    /**
     * @returns true si seul le field du champ est modifié, false si d'autres champs sont modifiés => forcera un reload global du vo
     */
    public setOnChange<P extends IDistantVOBase>(onChange: (vo: P) => boolean | Promise<boolean>): this {
        this.onChange = onChange;

        return this;
    }

    /**
     * @returns true si seul le field du champ est modifié, false si d'autres champs sont modifiés => forcera un reload global du vo
     */
    public setOnEndOfChange<P extends IDistantVOBase>(onEndOfChange: (vo: P) => boolean | Promise<boolean>): this {
        this.onEndOfChange = onEndOfChange;

        return this;
    }

    /**
     * permet de definir une fonction de tri
     * @param fonctionComparaison
     * @returns datatable avec la fonction de tri
     */
    public setSort<P extends IDistantVOBase>(fonctionComparaison: (vo1: P, vo2: P) => number): this {
        this.sort = (vos: P[]): P[] => vos.sort(fonctionComparaison);

        return this;
    }

    public setSortEnum(fonctionComparaison: (opts: number[]) => void): DatatableField<T, U> {
        this.sortEnum = fonctionComparaison;

        return this;
    }

    /**
     * permet de definir une fonction de filtrage sur les elts à afficher (sieve: passer au tamis)
     * par defaut laisse tout passer (pas de tri)
     * @param condition - la condition pour garder les elements
     * (ex: (vo) => vo_ids.includes(vo.id) ou (vo) => vo.id>10)
     * @returns datafield
     */
    public setSieveCondition<P extends IDistantVOBase>(condition: (vos: P) => boolean = null): this {

        this.sieve = (vos: P[]): P[] => vos.filter((elt) => true);
        this.sieveCondition = (e) => true;

        if (condition != null) {
            this.sieve = (vos: P[]): P[] => vos.filter(condition);
            this.sieveCondition = condition;
        }

        return this;
    }

    public setSieveEnum(condition: (opts: number[]) => number[]): DatatableField<T, U> {

        this.sieveEnum = condition;

        return this;
    }

    /**
     * applique tri et filtrage aux options
     * @param options liste d'options non triée/filtrée
     * @returns liste d'options triée/filtrée
     */
    public triFiltrage(options: { [id: number]: IDistantVOBase; }) {

        if (!options) {
            return;
        }

        //transforme les options en arrays pour le tri
        let optionsArray: IDistantVOBase[] = Object.values(options);

        // tri en fonction de la fonction de tri, Sinon on va trier par weight si c'est un objet avec un weight
        if (this.sort && optionsArray) {
            this.sort(optionsArray);
        } else if (optionsArray && optionsArray[0] && optionsArray[0]['weight']) {
            optionsArray = WeightHandler.getInstance().sortByWeight(optionsArray as any);
        }

        //s'il y a une fonction de filtrage on filtre
        if (this.sieve) {
            optionsArray = this.sieve(optionsArray);
        }
        return optionsArray;
    }

    public triFiltrageEnum(opts: number[]): number[] {
        if (this.sortEnum) {
            this.sortEnum(opts);
        }

        if (this.sieveEnum) {
            opts = this.sieveEnum(opts);
        }

        return opts;
    }

    public setValidator(validator: (data: any) => string): this {
        this.validate = validator;

        return this;
    }

    public setValidatInputFunc(validate_input: (input_value: U, field: DatatableField<T, U>, vo: any) => Alert[]): this {
        this.validate_input = validate_input;

        return this;
    }

    /**
     * BEWARE : Only update for view datatables purposes with viewing multiple times the same field, on different angles.
     * On create or update tables, let it same as module_table_field_id
     */
    public setUID_for_readDuplicateOnly(datatable_field_uid: string): this {
        this.datatable_field_uid = datatable_field_uid;
        return this;
    }

    /**
     * Force required
     */
    public required(): this {
        this.is_required = true;
        return this;
    }

    /**
     * Force readonly
     */
    public readonly(): this {
        this.is_readonly = true;
        return this;
    }

    /**
     * @param code_text Code du translatable text associé
     */
    public setPlaceholder(code_text: string): this {
        this.translatable_place_holder = code_text;
        return this;
    }

    /**
     * @param code_text Code du translatable text associé
     */
    public setTranslatableTitle(code_text: string): this {
        this.translatable_title_custom = code_text;
        return this;
    }

    get alert_path(): string {
        if (!this.vo_type_full_name) {
            return this.datatable_field_uid;
        }
        return this.vo_type_full_name + '.' + this.datatable_field_uid;
    }

    /**
     * A modifier pour gérer le dataToIHM en fonction des types d'entrée sortie.
     * Par défaut on renvoie sans modification. Attention au typage.
     */
    public dataToReadIHM(e: T, vo: IDistantVOBase): U {
        return e as any;
    }

    /**
     * A modifier pour gérer le dataToIHM en fonction des types d'entrée sortie.
     * Par défaut on renvoie comme le read.
     */
    public dataToUpdateIHM(e: T, vo: IDistantVOBase): U {
        return this.dataToReadIHM(e, vo);
    }

    /**
     * A modifier pour gérer le dataToIHM en fonction des types d'entrée sortie.
     * Par défaut on renvoie comme le read.
     */
    public dataToCreateIHM(e: T, vo: IDistantVOBase): U {
        return this.dataToReadIHM(e, vo);
    }

    /**
     * A modifier pour gérer le IHMToData en fonction des types d'entrée sortie.
     * Par défaut on renvoie sans modification. Attention au typage.
     */
    public ReadIHMToData(e: U, vo: IDistantVOBase): T {
        return e as any;
    }

    /**
     * A modifier pour gérer le IHMToData en fonction des types d'entrée sortie.
     * Par défaut on renvoie comme le read.
     */
    public UpdateIHMToData(e: U, vo: IDistantVOBase): T {
        return this.ReadIHMToData(e, vo);
    }

    /**
     * A modifier pour gérer le IHMToData en fonction des types d'entrée sortie.
     * Par défaut on renvoie comme le read.
     */
    public CreateIHMToData(e: U, vo: IDistantVOBase): T {
        return this.ReadIHMToData(e, vo);
    }

    public getValidationTextCodeBase(): string {
        return "";
    }


    public dataToHumanReadableField(e: IDistantVOBase): U {
        return null;
    }

    /**
     * n'affiche que les vos dont les ids sont renseignés
     * @param options les id des vos à afficher
     * @returns le datatableField modifié
     */
    public async setSelectOptionsEnabled(options: number[]): Promise<DatatableField<T, U>> {
        if (!options) {
            console.error("setSelectOptionsEnabled : options vide");
        }

        this.select_options_enabled = !options ? [] : Array.from(options);

        if (!!this.vue_component) {
            // on informe
            this.vue_component.$data.select_options_enabled = Array.from(options);
            await this.vue_component.on_reload_field_value();
        }

        return this;
    }

    public setComputedValueFunc(computed_value: (field_value: any, moduleTableField: ModuleTableField<any>, vo: IDistantVOBase, datatable_field_uid: string) => any): this {
        DatatableField.computed_value[this.datatable_field_uid] = computed_value;

        return this;
    }

    protected init(_type: string, type: string, datatable_field_uid: string) {
        this._type = _type;
        this.type = type;
        this.datatable_field_uid = datatable_field_uid;
        this.module_table_field_id = datatable_field_uid;
        this.validate = null;
        this.onChange = null;
        this.onEndOfChange = null;
        this.isVisibleUpdateOrCreate = () => true;
    }

    private update_moduleTableField() {
        if (this.moduleTableField) {
            this.is_required = this.moduleTableField.field_required;
            this.validate = (this.validate != null) ? this.validate : this.moduleTableField.validate;
            this.field_type = (this.field_type != null) ? this.field_type : this.moduleTableField.field_type;
            this.enum_values = (this.enum_values != null) ? this.enum_values : this.moduleTableField.enum_values;
            this.segmentation_type = (this.segmentation_type != null) ? this.segmentation_type : this.moduleTableField.segmentation_type;
            this.is_inclusive_data = (this.is_inclusive_data != null) ? this.is_inclusive_data : this.moduleTableField.is_inclusive_data;
            this.is_inclusive_ihm = (this.is_inclusive_ihm != null) ? this.is_inclusive_ihm : this.moduleTableField.is_inclusive_ihm;
            this.return_min_value = (this.return_min_value != null) ? this.return_min_value : this.moduleTableField.return_min_value;
            this.format_localized_time = (this.format_localized_time != null) ? this.format_localized_time : this.moduleTableField.format_localized_time;
            this.return_max_value = (this.return_max_value != null) ? this.return_max_value : this.moduleTableField.return_max_value;
            this.max_range_offset = (this.max_range_offset != null) ? this.max_range_offset : this.moduleTableField.max_range_offset;
        }
    }
}