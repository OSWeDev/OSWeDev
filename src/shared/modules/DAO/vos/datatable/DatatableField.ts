import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import ModuleTable from '../../../../../shared/modules/ModuleTable';
import Alert from '../../../Alert/vos/Alert';
import ModuleTableField from '../../../ModuleTableField';
import ICRUDComponentField from '../../interface/ICRUDComponentField';

/**
 * On utilise le design pattern Fluent_interface : https://en.wikipedia.org/wiki/Fluent_interface
 */
export default abstract class DatatableField<T, U> {

    public static REF_RANGES_FIELD_TYPE: string = "RefRanges";
    public static MANY_TO_MANY_FIELD_TYPE: string = "ManyToMany";
    public static MANY_TO_ONE_FIELD_TYPE: string = "ManyToOne";
    public static ONE_TO_MANY_FIELD_TYPE: string = "OneToMany";
    public static SIMPLE_FIELD_TYPE: string = "Simple";
    public static COMPUTED_FIELD_TYPE: string = "COMPUTED";
    public static COMPONENT_FIELD_TYPE: string = "COMPONENT";
    public static INPUT_FIELD_TYPE: string = "INPUT";
    public static FILE_FIELD_TYPE: string = "FILE";

    // Pour éviter les liens d'import on stocke au chargement de l'appli ici et on type pas... à améliorer certainement plus tard
    public static VueAppBase = null;

    public static computed_value: { [datatable_field_uid: string]: (field_value: any, moduleTableField: ModuleTableField<any>, vo: IDistantVOBase, datatable_field_uid: string) => any } = {};

    public vue_component: ICRUDComponentField = null;

    /**
     * Il faudrait employer des slots ou des composants vue directement
     */
    public uiFieldComponent: any;

    public moduleTable: ModuleTable<any>;

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
     * Used in the CREATE or UPDATE views
     */
    public translatable_place_holder: string = null;

    public select_options_enabled: number[] = null;

    /**
     * BEWARE : Only update for view datatables purposes with viewing multiple times the same field, on different angles.
     * On create or update tables, let it same as datatable_field_uid
     */
    public module_table_field_id: string;

    public validate: (data: any) => string;
    public onChange: (vo: IDistantVOBase) => void;
    public isVisibleUpdateOrCreate: (vo: IDistantVOBase) => boolean;

    public validate_input: (input_value: U, field: DatatableField<T, U>, vo: any) => Alert[] = null;

    //definit comment trier le field si besoin
    public sort: (vos: IDistantVOBase[]) => void;

    //definit la fonction qui permet de filtrer
    public keepOn: (vos: IDistantVOBase[]) => IDistantVOBase[];


    /**
     *
     * @param type Pour identifier hors contexte typescript le type réel de l'objet...
     * @param datatable_field_uid uid au sein de la datatable pour ce field. Permet d'identifier la colonne. Un nom compatible avec un nom de field
     * @param translatable_title Le titre du field, à passer à la traduction au dernier moment
     */
    protected constructor(public type: string, public datatable_field_uid: string, public translatable_title: string = null) {
        this.module_table_field_id = this.datatable_field_uid;
        this.validate = null;
        this.onChange = null;
        this.isVisibleUpdateOrCreate = () => true;
    }

    public hide(): DatatableField<T, U> {
        this.hidden = true;
        this.hidden_print = true;

        return this;
    }

    public show(): DatatableField<T, U> {
        this.hidden = false;
        this.hidden_print = false;

        return this;
    }

    public set_tooltip(tooltip: string): DatatableField<T, U> {
        this.tooltip = tooltip;

        return this;
    }

    public hide_print(): DatatableField<T, U> {
        this.hidden_print = true;

        return this;
    }

    public hide_export(): DatatableField<T, U> {
        this.hiden_export = true;

        return this;
    }


    public setIsVisibleUpdateOrCreate(isVisibleUpdateOrCreate: (vo: IDistantVOBase) => boolean): DatatableField<T, U> {
        this.isVisibleUpdateOrCreate = isVisibleUpdateOrCreate;

        return this;
    }

    public setOnChange(onChange: (vo: IDistantVOBase) => void): DatatableField<T, U> {
        this.onChange = onChange;

        return this;
    }

    //permet de definir une fonction de tri
    public setSort(sort: (vos: IDistantVOBase[]) => void): DatatableField<T, U> {
        this.sort = sort;

        return this;
    }

    /**
     * permet de definir une fonction de tri sur les elts à afficher
     * @param condition - la condition pour garder les elements (>10 gardes les elts >10)
     */
    public setKeepOn(condition: (vos: IDistantVOBase) => boolean): DatatableField<T, U> {
        this.keepOn = (vos: IDistantVOBase[]) => vos.filter(condition);

        return this;
    }

    public setValidator(validator: (data: any) => string): DatatableField<T, U> {
        this.validate = validator;

        return this;
    }

    public setValidatInputFunc(validate_input: (input_value: U, field: DatatableField<T, U>, vo: any) => Alert[]): DatatableField<T, U> {
        this.validate_input = validate_input;

        return this;
    }


    /**
     * BEWARE : Only update for view datatables purposes with viewing multiple times the same field, on different angles.
     * On create or update tables, let it same as module_table_field_id
     */
    public setUID_for_readDuplicateOnly(datatable_field_uid: string): DatatableField<T, U> {
        this.datatable_field_uid = datatable_field_uid;

        // TODO FIXME FORCE READONLY ???
        return this;
    }

    /**
     * Force required
     */
    public required(): DatatableField<T, U> {
        this.is_required = true;
        return this;
    }

    /**
     * Force readonly
     */
    public readonly(): DatatableField<T, U> {
        this.is_readonly = true;
        return this;
    }

    /**
     * @param code_text Code du translatable text associé
     */
    public setPlaceholder(code_text: string): DatatableField<T, U> {
        this.translatable_place_holder = code_text;
        return this;
    }

    get alert_path(): string {
        if (!this.moduleTable) {
            return this.datatable_field_uid;
        }
        return this.moduleTable.full_name + '.' + this.datatable_field_uid;
    }

    public abstract setModuleTable(moduleTable: ModuleTable<any>): DatatableField<T, U>;

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

    public setSelectOptionsEnabled(options: number[]): DatatableField<T, U> {
        this.select_options_enabled = options;

        if (!!this.vue_component) {
            // on informe
            this.vue_component.$data.select_options_enabled = options;
            this.vue_component.on_reload_field_value();
        }

        return this;
    }

    public setComputedValueFunc(computed_value: (field_value: any, moduleTableField: ModuleTableField<any>, vo: IDistantVOBase, datatable_field_uid: string) => any): DatatableField<T, U> {
        DatatableField.computed_value[this.datatable_field_uid] = computed_value;

        return this;
    }
}