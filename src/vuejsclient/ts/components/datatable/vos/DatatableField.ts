import ModuleTable from '../../../../../shared/modules/ModuleTable';
import VueComponentBase from '../../VueComponentBase';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';

/**
 * On utilise le design pattern Fluent_interface : https://en.wikipedia.org/wiki/Fluent_interface
 */
export default abstract class DatatableField<T, U> {

    public static MANY_TO_MANY_FIELD_TYPE: string = "ManyToMany";
    public static MANY_TO_ONE_FIELD_TYPE: string = "ManyToOne";
    public static ONE_TO_MANY_FIELD_TYPE: string = "OneToMany";
    public static SIMPLE_FIELD_TYPE: string = "Simple";
    public static COMPUTED_FIELD_TYPE: string = "COMPUTED";
    public static INPUT_FIELD_TYPE: string = "INPUT";

    /**
     * Il faudrait employer des slots ou des composants vue directement
     */
    public uiFieldComponent: VueComponentBase;

    public moduleTable: ModuleTable<any>;

    /**
     * Used in the CREATE or UPDATE views
     */
    public is_required: boolean = false;

    /**
     * Used in the CREATE or UPDATE views to show infos that are not editable
     */
    public is_readonly: boolean = false;

    /**
     * Used in the CREATE or UPDATE views
     */
    public translatable_place_holder: string = null;

    /**
     * BEWARE : Only update for view datatables purposes with viewing multiple times the same field, on different angles.
     * On create or update tables, let it same as datatable_field_uid
     */
    public module_table_field_id: string;

    public validate: (data: any) => string;
    public onChange: (vo: IDistantVOBase) => void;
    public isVisibleUpdateOrCreate: (vo: IDistantVOBase) => boolean;

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

    public setIsVisibleUpdateOrCreate(isVisibleUpdateOrCreate: (vo: IDistantVOBase) => boolean): DatatableField<T, U> {
        this.isVisibleUpdateOrCreate = isVisibleUpdateOrCreate;

        return this;
    }

    public setOnChange(onChange: (vo: IDistantVOBase) => void): DatatableField<T, U> {
        this.onChange = onChange;

        return this;
    }

    public setValidator(validator: (data: any) => string): DatatableField<T, U> {
        this.validate = validator;

        return this;
    }

    /**
     * BEWARE : Only update for view datatables purposes with viewing multiple times the same field, on different angles.
     * On create or update tables, let it same as module_table_field_id
     */
    public setUID_for_readDuplicateOnly(datatable_field_uid: string): DatatableField<T, U> {
        this.datatable_field_uid = datatable_field_uid;
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

    public abstract setModuleTable(moduleTable: ModuleTable<any>);

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
}