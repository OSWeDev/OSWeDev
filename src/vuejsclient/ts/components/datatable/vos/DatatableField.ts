import VueComponentBase from '../../VueComponentBase';
import Datatable from './Datatable';
import ModuleTable from '../../../../../shared/modules/ModuleTable';
import DefaultTranslation from '../../../../../shared/modules/Translation/vos/DefaultTranslation';

/**
 * On utilise le design pattern Fluent_interface : https://en.wikipedia.org/wiki/Fluent_interface
 */
export default abstract class DatatableField<T, U> {

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
     *
     * @param type Pour identifier hors contexte typescript le type réel de l'objet...
     * @param datatable_field_uid uid au sein de la datatable pour ce field. Permet d'identifier la colonne. Un nom compatible avec un nom de field
     * @param translatable_title Le titre du field, à passer à la traduction au dernier moment
     */
    protected constructor(public type: string, public datatable_field_uid: string, public translatable_title: string = null) {
    }


    public validate: (value: U) => boolean = () => true;

    public setValidation(validator: (value: U) => boolean): DatatableField<T, U> {
        this.validate = validator;
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
    public dataToIHM: (e: T) => U = (e: T) => e as any;

    /**
     * A modifier pour gérer le IHMToData en fonction des types d'entrée sortie.
     * Par défaut on renvoie sans modification. Attention au typage.
     */
    public IHMToData: (e: U) => T = (e: U) => e as any;
}