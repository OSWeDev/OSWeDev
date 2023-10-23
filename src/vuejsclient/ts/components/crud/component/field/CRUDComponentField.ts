
import { watch } from 'fs';
import 'quill/dist/quill.bubble.css'; // Compliqué à lazy load
import 'quill/dist/quill.core.css'; // Compliqué à lazy load
import 'quill/dist/quill.snow.css'; // Compliqué à lazy load
import Vue from 'vue';
import { Component, Prop, Watch } from 'vue-property-decorator';
import ModuleAccessPolicy from '../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import Alert from '../../../../../../shared/modules/Alert/vos/Alert';
import ICRUDComponentField from '../../../../../../shared/modules/DAO/interface/ICRUDComponentField';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import Datatable from '../../../../../../shared/modules/DAO/vos/datatable/Datatable';
import DatatableField from '../../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import ManyToManyReferenceDatatableFieldVO from '../../../../../../shared/modules/DAO/vos/datatable/ManyToManyReferenceDatatableFieldVO';
import ManyToOneReferenceDatatableFieldVO from '../../../../../../shared/modules/DAO/vos/datatable/ManyToOneReferenceDatatableFieldVO';
import OneToManyReferenceDatatableFieldVO from '../../../../../../shared/modules/DAO/vos/datatable/OneToManyReferenceDatatableFieldVO';
import ReferenceDatatableField from '../../../../../../shared/modules/DAO/vos/datatable/ReferenceDatatableField';
import RefRangesReferenceDatatableFieldVO from '../../../../../../shared/modules/DAO/vos/datatable/RefRangesReferenceDatatableFieldVO';
import SimpleDatatableFieldVO from '../../../../../../shared/modules/DAO/vos/datatable/SimpleDatatableFieldVO';
import InsertOrDeleteQueryResult from '../../../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import DashboardBuilderController from '../../../../../../shared/modules/DashboardBuilder/DashboardBuilderController';
import NumRange from '../../../../../../shared/modules/DataRender/vos/NumRange';
import NumSegment from '../../../../../../shared/modules/DataRender/vos/NumSegment';
import TimeSegment from '../../../../../../shared/modules/DataRender/vos/TimeSegment';
import FileVO from '../../../../../../shared/modules/File/vos/FileVO';
import Dates from '../../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleFormatDatesNombres from '../../../../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';
import ModuleTableField from '../../../../../../shared/modules/ModuleTableField';
import TableFieldTypesManager from '../../../../../../shared/modules/TableFieldTypes/TableFieldTypesManager';
import TableFieldTypeControllerBase from '../../../../../../shared/modules/TableFieldTypes/vos/TableFieldTypeControllerBase';
import VOsTypesManager from '../../../../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import DateHandler from '../../../../../../shared/tools/DateHandler';
import ObjectHandler from '../../../../../../shared/tools/ObjectHandler';
import RangeHandler from '../../../../../../shared/tools/RangeHandler';
import { ModuleAlertAction, ModuleAlertGetter } from '../../../alert/AlertStore';
import { ModuleDAOAction, ModuleDAOGetter } from '../../../dao/store/DaoStore';
import FileComponent from '../../../file/FileComponent';
import HourrangeInputComponent from '../../../hourrangeinput/HourrangeInputComponent';
import ImageComponent from '../../../image/ImageComponent';
import IsoWeekDaysInputComponent from '../../../isoweekdaysinput/IsoWeekDaysInputComponent';
import MultiInputComponent from '../../../multiinput/MultiInputComponent';
import NumRangeInputComponent from '../../../numrangeinput/NumRangeInputComponent';
import TimestampInputComponent from '../../../timestampinput/TimestampInputComponent';
import TSRangeInputComponent from '../../../tsrangeinput/TSRangeInputComponent';
import TSRangesInputComponent from '../../../tsrangesinput/TSRangesInputComponent';
import TSTZInputComponent from '../../../tstzinput/TSTZInputComponent';
import VueComponentBase from '../../../VueComponentBase';
import CRUDComponentManager from '../../CRUDComponentManager';
import CRUDFormServices from '../CRUDFormServices';
import './CRUDComponentField.scss';
let debounce = require('lodash/debounce');

@Component({
    template: require('./CRUDComponentField.pug'),
    components: {
        Filecomponent: FileComponent,
        Imagecomponent: ImageComponent,
        Multiinputcomponent: MultiInputComponent,
        Hourrangeinputcomponent: HourrangeInputComponent,
        Tsrangesinputcomponent: TSRangesInputComponent,
        Isoweekdaysinputcomponent: IsoWeekDaysInputComponent,
        Tsrangeinputcomponent: TSRangeInputComponent,
        Timestampinputcomponent: TimestampInputComponent,
        Tstzinputcomponent: TSTZInputComponent,
        Numrangeinputcomponent: NumRangeInputComponent,
    }
})
export default class CRUDComponentField extends VueComponentBase
    implements ICRUDComponentField {

    public static CRUDComp_UID: number = 1;

    @ModuleDAOGetter
    public getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } };
    @ModuleDAOAction
    private storeDatasByIds: (params: { API_TYPE_ID: string, vos_by_ids: { [id: number]: IDistantVOBase } }) => void;

    @ModuleAlertGetter
    private get_alerts: { [path: string]: Alert[] };

    @ModuleAlertAction
    private replace_alerts: (params: { alert_path: string, alerts: Alert[] }) => void;

    @ModuleAlertAction
    private register_alert: (alert: Alert) => void;

    @Prop()
    private field: DatatableField<any, any>;

    @Prop()
    private vo: IDistantVOBase;

    @Prop()
    private default_field_data: any;

    // @Prop({ default: null })
    // private field_select_options_enabled: number[];

    @Prop({ default: null })
    private filter: () => any;

    @Prop({ default: null })
    private filter_additional_params: any[];

    @Prop({ default: false })
    private auto_update_field_value: boolean;

    @Prop()
    private datatable: Datatable<IDistantVOBase>;

    @Prop({ default: true })
    private show_insert_or_update_target: boolean;

    @Prop({ default: null })
    private label_replacement: string;

    @Prop({ default: true })
    private show_title: boolean;

    @Prop({ default: false })
    private inline_input_mode: boolean;
    @Prop({ default: true })
    private inline_input_show_clear: boolean;
    @Prop({ default: true })
    private inline_input_hide_label: boolean;
    @Prop()
    private inline_input_read_value: any;
    @Prop({ default: false })
    private inline_input_mode_semaphore: boolean;

    @Prop({ default: false })
    private is_disabled: boolean;

    @Prop({ default: null })
    private description: string;

    @Prop({ default: null })
    private maxlength: number;

    @Prop({ default: false })
    private force_input_is_editing: boolean;

    @Prop({ default: false })
    private inline_input_mode_input_only: boolean;

    @Prop({ default: false })
    private force_toggle_button: boolean;

    @Prop({ default: false })
    private inverse_label: boolean;

    @Prop({ default: false })
    private for_export: boolean;

    @Prop({ default: false })
    private special_placeholder: boolean;

    @Prop({ default: false })
    private show_placeholder: boolean;

    @Prop({ default: true })
    private show_option_image: boolean;

    @Prop({ default: true })
    private searchable: boolean;

    @Prop({ default: false })
    private auto_validate_inline_input: boolean;

    /**
     * La CSS i.inline_input_is_editing.auto_validate est en dur avec la même durée, au besoin la reprendre dans le projet pour adapter au cas par cas ou faire évoluer
     */
    @Prop({ default: 2 })
    private auto_validate_inline_input_delay_sec: number;

    /**
     * Ajouté pour avoir une confirmation en notif pour les suppressions, dans certaines interfaces on peut supprimer très facilement par erreur sinon
     */
    @Prop({ default: false })
    private ask_confirmation_to_delete: boolean;

    /**
     * Une string de la forme composant_partieconcernee_option
     * Ex: 'tsrange_date_noneditable'
     * Ajouté à la base pour désactiver seulement une partie du composant TSRangeInputComponent
     * (en l'occurence ne permettre de modifier que les heures/minutes et pas la date)
     */
    @Prop({ default: null })
    private option: string;

    // Permet de définir si on veut que le champ fasse des propositions
    @Prop({ default: true })
    private autocomplete_input: boolean;

    @Prop({ default: false })
    private is_dashboard_builder: boolean;

    @Prop({ default: false })
    private show_pencil_btn: boolean;

    @Prop({ default: false })
    private hide_text_cliquable: boolean;

    private this_CRUDComp_UID: number = null;

    private auto_validate_start: number = null;

    private select_options: number[] = [];
    private isLoadingOptions: boolean = false;
    private field_value: any = null;
    private field_value_range: { [type_date: string]: string } = {};
    private field_value_refranges_selected_ids: number[] = [];

    private inline_input_is_busy: boolean = false;

    private can_insert_or_update_target: boolean = false;
    private has_loaded_can_insert_or_update_target: boolean = false;
    private inline_input_is_editing: boolean = false;

    private select_options_enabled_by_id: { [id: number]: number } = {};

    private is_readonly: boolean = false;

    private debounced_reload_field_value = debounce(this.reload_field_value, 30);
    private debounced_onchangevo_emitter = debounce(this.onchangevo_emitter, 30);

    private has_focus: boolean = false;

    private debounced_validate_inline_input_auto = null;

    @Watch('auto_validate_inline_input_delay_sec', { immediate: true })
    public onchange_auto_validate_inline_input_delay_sec() {
        this.debounced_validate_inline_input_auto = debounce(this.validate_inline_input, this.auto_validate_inline_input_delay_sec * 1000);
    }

    public async mounted() {

        this.this_CRUDComp_UID = CRUDComponentField.CRUDComp_UID++;
        this.inline_input_is_editing = this.force_input_is_editing;
        if (this.inline_input_mode && this.force_input_is_editing && this.$refs.input_elt && !!this.$refs.input_elt['focus']) {
            let self = this;
            //this.$nextTick(() => self.$refs.input_elt['focus']()); -> Autofocus du curseur lors du changement de page - voir ticket focus_auto
        }

        this.select_options_enabled_by_id = this.get_check_field_options_enabled(this.field);
        // (this.field_select_options_enabled && this.field_select_options_enabled.length > 0) ? this.field_select_options_enabled : this.field.select_options_enabled;

        /**
         * On propose un lien au datatable pour certains comportement
         *  On aura accès en l'état qu'au dernier lien fait
         *  si le lien est rompu on le sait pas
         *  a voir à l'usage ce qu'on en fait
         */
        this.field.vue_component = this;

        if (this.inline_input_mode_semaphore) {
            CRUDComponentManager.getInstance().inline_input_mode_semaphore_disable_cb[this.this_CRUDComp_UID] = this.cancel_input;
        }

        if (this.inline_input_mode_semaphore && this.inline_input_is_editing) {
            CRUDComponentManager.getInstance().inline_input_mode_semaphore = true;
        }
    }


    /**
     * TODO FIXME : gérer tous les cas pas juste les simple datatable field
     */
    // get alert_path(): string {
    //     let field = null;

    //     switch (this.field.type) {
    //         // case DatatableField.MANY_TO_ONE_FIELD_TYPE:
    //         //     field = (this.field as ManyToOneReferenceDatatableFieldVO<any>).srcField;
    //         //     break;
    //         // case DatatableField.ONE_TO_MANY_FIELD_TYPE:
    //         //     field = (this.field as OneToManyReferenceDatatableFieldVO<any>).destField;
    //         //     break;
    //         // case DatatableField.MANY_TO_MANY_FIELD_TYPE:
    //         //     field = (this.field as ManyToManyReferenceDatatableFieldVO<any, any>).interModuleTable.getFieldFromId('id');
    //         //     break;
    //         // case DatatableField.REF_RANGES_FIELD_TYPE:
    //         //     field = (this.field as RefRangesReferenceDatatableFieldVO<any>).srcField;
    //         //     break;
    //         // case DatatableField.SIMPLE_FIELD_TYPE:
    //         //     field = (this.field as SimpleDatatableFieldVO<any, any>).datatable_field_uid;
    //         //     break;
    //         default:
    //             field = (this.field as SimpleDatatableFieldVO<any, any>).datatable_field_uid;
    //             break;
    //     }

    public async validateSimpleInput(input_value: any) {

        if (this.inline_input_mode) {

            await this.prepare_auto_validate();
            return;
        }

        // TODO FIXME VALIDATE
        if (this.field_value != input_value) {
            this.field_value = input_value;
        }

        /**
         * FIXME : Au fait on a pas le droit de faire ça .... on devrait pas changer la prop ici
         */
        if (this.auto_update_field_value) {
            this.vo[this.field.datatable_field_uid] = input_value;
        }

        if (this.field.onChange) {
            await this.field.onChange(this.vo);
            this.datatable.refresh();
        }

        this.debounced_onchangevo_emitter();
    }

    // TODO FIXME là on appel 5* la fonction au démarrage... il faut debounce ou autre mais c'est pas normal
    // @Watch('field_select_options_enabled')
    @Watch('field', { immediate: true })
    @Watch('vo', { deep: true })
    @Watch('datatable')
    @Watch('default_field_data')
    @Watch('targetModuleTable_count')
    public async on_reload_field_value() {
        this.debounced_reload_field_value();
    }

    @Watch('inline_input_read_value', { immediate: true })
    private onchange_inline_input_read_value() {
        if (!this.inline_input_mode) {
            return;
        }
        let tmp = this.field.dataToUpdateIHM(this.inline_input_read_value, this.vo);
        if (this.field_value != tmp) {
            this.field_value = tmp;
        }
    }

    private async reload_field_value() {

        if (this.is_readonly != (this.field.is_readonly || this.is_disabled)) {
            this.is_readonly = this.field.is_readonly || this.is_disabled;
        }

        if (this.inline_input_mode && this.inline_input_read_value && ((!this.needs_options) || ((!!this.select_options) && this.select_options.length))) {
            // Si inline input mode et inline_input_read_value on esquive cette mise à jour puisque la valeur par défaut du champ est déjà définie à ce stade normalement
            return;
        }

        /**
         * Si on a le focus (donc probablement on est en train d'éditer) on laisse saisir la valeur
         */
        if (!this.has_focus) {
            this.update_input_field_value_from_vo_field_value();
        }

        // let current_field_value = this.field.UpdateIHMToData(this.field_value, this.vo);

        // if (current_field_value != field_value) {
        //     this.field_value = field_value;
        // }

        // JNE : je sais pas si il faut se placer au dessus ou en dessous de ça ...
        if (this.field_type == ModuleTableField.FIELD_TYPE_daterange && this.field_value) {
            let date: string[] = this.field_value.toString().split('-');

            if (date && date.length > 0) {
                Vue.set(this.field_value_range, this.field.datatable_field_uid + '_start', this.formatDateForField(date[0]));
                Vue.set(this.field_value_range, this.field.datatable_field_uid + '_end', this.formatDateForField(date[1]));
            }
        }

        let self = this;
        if ((!this.has_loaded_can_insert_or_update_target) && (
            (this.field.type == DatatableField.MANY_TO_ONE_FIELD_TYPE) ||
            (this.field.type == DatatableField.ONE_TO_MANY_FIELD_TYPE) ||
            (this.field.type == DatatableField.MANY_TO_MANY_FIELD_TYPE) ||
            (this.field.type == DatatableField.REF_RANGES_FIELD_TYPE))) {

            this.has_loaded_can_insert_or_update_target = true;
            await ModuleAccessPolicy.getInstance().testAccess(
                ModuleDAO.getInstance().getAccessPolicyName(
                    ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE,
                    (this.field as ReferenceDatatableField<any>).targetModuleTable.vo_type)).then((res: boolean) => {

                        if (self.can_insert_or_update_target != res) {
                            self.can_insert_or_update_target = res;
                        }
                    });
        }

        if (!this.isLoadingOptions) {
            this.isLoadingOptions = true;
        }
        await this.prepare_select_options();


        if (this.field.type == DatatableField.REF_RANGES_FIELD_TYPE) {
            this.field_value_refranges_selected_ids = [];

            if ((!this.select_options) || (RangeHandler.getCardinalFromArray(this.field_value) > this.select_options.length)) {
                // Si on a plus d'option dans le range que dans les options du champ, on filtre par les options du champs
                for (let i in this.select_options) {
                    let id = parseInt(this.select_options[i].toString());
                    if (RangeHandler.elt_intersects_any_range(id, this.field_value)) {
                        this.field_value_refranges_selected_ids.push(id);
                    }
                }
            } else {

                let options_by_id: { [id: number]: boolean } = ObjectHandler.getInstance().mapFromIdsArray(this.select_options);
                // sinon on commence par le range
                RangeHandler.foreach_ranges_sync(this.field_value, (id: number) => {
                    if (options_by_id[id]) {
                        this.field_value_refranges_selected_ids.push(id);
                    }
                });
            }
        }
        if (!!this.isLoadingOptions) {
            this.isLoadingOptions = false;
        }
    }

    private formatDateForField(date: string, separator: string = '/'): string {
        if (!date) {
            return null;
        }

        let dateCut: string[] = date.split(separator);

        return DateHandler.getInstance().formatDayForIndex(Dates.date(Dates.month(Dates.year(Dates.now(), parseInt(dateCut[2])), parseInt(dateCut[1]) - 1), parseInt(dateCut[0])));
    }

    private getInputValue(input: any): any {

        let input_value: any = null;

        if ((this.field.type == DatatableField.SIMPLE_FIELD_TYPE) &&
            ((this.field as SimpleDatatableFieldVO<any, any>).moduleTableField.field_type == ModuleTableField.FIELD_TYPE_html)) {
            input_value = input;
        } else {
            input_value = input.value;
        }

        if ((this.field.type == DatatableField.SIMPLE_FIELD_TYPE) &&
            ((this.field as SimpleDatatableFieldVO<any, any>).moduleTableField.field_type == ModuleTableField.FIELD_TYPE_boolean) &&
            this.field.is_required) {
            input_value = input.checked;
        }

        // cas du checkbox où la value est useless ...

        if (this.field.required) {
            if ((input_value == null) || (typeof input_value == "undefined")) {

                switch (this.field.type) {
                    case DatatableField.SIMPLE_FIELD_TYPE:
                        switch ((this.field as SimpleDatatableFieldVO<any, any>).moduleTableField.field_type) {
                            case ModuleTableField.FIELD_TYPE_boolean:
                            case ModuleTableField.FIELD_TYPE_daterange:
                            case ModuleTableField.FIELD_TYPE_hourrange_array:
                            case ModuleTableField.FIELD_TYPE_tstzrange_array:
                            case ModuleTableField.FIELD_TYPE_refrange_array:
                            case ModuleTableField.FIELD_TYPE_numrange_array:
                            case ModuleTableField.FIELD_TYPE_isoweekdays:
                            case ModuleTableField.FIELD_TYPE_html:
                                break;

                            default:
                                input.setCustomValidity ? input.setCustomValidity(this.label(ModuleTableField.VALIDATION_CODE_TEXT_required)) : document.getElementById(input.id)['setCustomValidity'](this.label(ModuleTableField.VALIDATION_CODE_TEXT_required));
                                return;
                        }
                        break;

                    default:
                        input.setCustomValidity ? input.setCustomValidity(this.label(ModuleTableField.VALIDATION_CODE_TEXT_required)) : document.getElementById(input.id)['setCustomValidity'](this.label(ModuleTableField.VALIDATION_CODE_TEXT_required));
                        return;
                }
            }
        }

        if (!this.field.validate) {
            return;
        }

        let error: string = this.field.validate(input_value);
        let msg;

        if ((!error) || (error == "")) {
            msg = "";
        } else {
            msg = this.t(error);
        }
        if ((this.field.type != DatatableField.SIMPLE_FIELD_TYPE) || ((this.field.type == DatatableField.SIMPLE_FIELD_TYPE) &&
            ((this.field as SimpleDatatableFieldVO<any, any>).moduleTableField.field_type != ModuleTableField.FIELD_TYPE_html))) {

            input.setCustomValidity ? input.setCustomValidity(msg) : document.getElementById(input.id)['setCustomValidity'](msg);
        }
        return input_value;
    }

    /**
     * Validation de la valeur du champ
     * @param input Champ de saisie
     * @param wait_endofchange Permet de ne pas enregistrer les champs input de suite pour ne pas perdre le focus
     * @returns
     */
    private async validateInput(input: any, wait_endofchange: boolean = false) {

        if (this.inline_input_mode) {
            await this.prepare_auto_validate(false, null, wait_endofchange);
            return;
        }

        let tmp = input ? this.getInputValue(input) : this.field_value;
        if (this.field_value != tmp) {
            this.field_value = tmp;
        }

        if (this.auto_update_field_value) {
            await this.changeValue(this.vo, this.field, this.field_value, this.datatable);
        }

        if (this.field.onChange) {
            await this.field.onChange(this.vo);
            this.datatable.refresh();
        }

        this.debounced_onchangevo_emitter();
    }

    /**
     * Validation de la valeur du champ
     * @param input Champ de saisie
     * @param force_save Permet de forcer l'enregistrement (nécessaire pour les champs input vu qu'on attent (wait_endofchange) la fin de la saisie)
     * @returns
     */
    private async validateEndOfInput(input: any, force_save: boolean = false) {

        //TODO checker impact sur le crud employee GR notement avec la mise en majuscule nom/prenom et le numéro employée
        // if (!this.inline_input_mode) {
        //     return;
        // }
        let is_input_html_null = false;
        if ((this.field.type == DatatableField.SIMPLE_FIELD_TYPE) &&
            ((this.field as SimpleDatatableFieldVO<any, any>).moduleTableField.field_type == ModuleTableField.FIELD_TYPE_html)) {

            // Si le champ est vide, on le met à null
            if (input.root.innerText == "\n" || input.root.innerText.trim().length == 0) {
                is_input_html_null = true;
            } else {
                input = input.root.innerHTML;
            }
        }

        let tmp = input ? this.getInputValue(input) : this.field_value;
        if (is_input_html_null) {
            tmp = null;
        }

        if (this.field_value != tmp) {
            this.field_value = tmp;
        }

        if (this.inline_input_mode) {
            if (force_save) {
                await this.prepare_auto_validate();
            }
        }

        if (this.field.onEndOfChange) {
            this.field.onEndOfChange(this.vo);
            this.datatable.refresh();
        }

        // Si je ne suis pas en inline edit, j'appelle le onchangevo
        // Cette fonction sera appelé directement dans la fonction de sauvegarde du inline edit
        //  sauf si on a aussi caché les boutons d'enregisrement :)
        if (!this.inline_input_mode) {
            this.debounced_onchangevo_emitter();
        }

        this.$emit('endofchange', this.vo, this.field, this.field.UpdateIHMToData(this.field_value, this.vo), this);
    }

    private async validateToggle() {

        this.field_value = !this.field_value;

        if (this.inline_input_mode) {
            await this.prepare_auto_validate();
            return;
        }

        if (!this.field.validate) {
            return;
        }

        let error: string = this.field.validate(this.field_value);
        let msg;

        if ((!error) || (error == "")) {
            msg = "";
        } else {
            msg = this.t(error);
        }

        if (this.auto_update_field_value) {
            await this.changeValue(this.vo, this.field, this.field_value, this.datatable);
        }

        if (this.field.onChange) {
            await this.field.onChange(this.vo);
            this.datatable.refresh();
        }

        this.debounced_onchangevo_emitter();
        this.$emit('endofchange', this.vo, this.field, this.field.UpdateIHMToData(this.field_value, this.vo), this);
    }

    private async validateMultiInput(values: any[]) {
        if (this.inline_input_mode) {
            await this.prepare_auto_validate();
            return;
        }

        if (this.auto_update_field_value) {
            this.vo[this.field.datatable_field_uid] = values;
        }

        if (this.field.onChange) {
            await this.field.onChange(this.vo);
            this.datatable.refresh();
        }

        this.debounced_onchangevo_emitter();
        this.$emit('validatemultiinput', values, this.field, this.vo);
    }


    private async changeValue(vo: IDistantVOBase, field: DatatableField<any, any>, value: any, datatable: Datatable<IDistantVOBase>) {

        if (!this.datatable) {
            vo[field.datatable_field_uid] = this.field.UpdateIHMToData(value, this.vo);
        } else {
            vo[field.datatable_field_uid] = value;
        }

        if (!datatable) {
            return;
        }
        for (let i in datatable.fields) {
            let field_datatable: DatatableField<any, any> = datatable.fields[i];

            if (field_datatable.type == DatatableField.ONE_TO_MANY_FIELD_TYPE) {

                let OneToManyField: OneToManyReferenceDatatableFieldVO<any> = (field_datatable as OneToManyReferenceDatatableFieldVO<any>);
                let options: { [id: number]: IDistantVOBase; } = this.getStoredDatas[OneToManyField.targetModuleTable.vo_type];

                if (!!OneToManyField.filterOptionsForUpdateOrCreateOnOneToMany) {
                    options = OneToManyField.filterOptionsForUpdateOrCreateOnOneToMany(vo, options);
                }

                let newOptions: IDistantVOBase[] = [];

                let select_options_enabled_by_id = this.get_check_field_options_enabled(OneToManyField);

                for (let j in options) {
                    let option: IDistantVOBase = options[j];

                    if ((!select_options_enabled_by_id) || (select_options_enabled_by_id[option.id] != null)) {
                        newOptions.push(option);
                    }
                }

                if (newOptions.length > 0) {
                    await field_datatable.setSelectOptionsEnabled(newOptions.map((elem) => elem.id));
                }
            }

            if (field_datatable.type == DatatableField.MANY_TO_MANY_FIELD_TYPE) {

                let manyToManyField: ManyToManyReferenceDatatableFieldVO<any, any> = (field_datatable as ManyToManyReferenceDatatableFieldVO<any, any>);
                let options: { [id: number]: IDistantVOBase; } = this.getStoredDatas[manyToManyField.targetModuleTable.vo_type];

                if (!!manyToManyField.filterOptionsForUpdateOrCreateOnManyToMany) {
                    options = manyToManyField.filterOptionsForUpdateOrCreateOnManyToMany(vo, options);
                }

                let newOptions: IDistantVOBase[] = [];

                let select_options_enabled_by_id = this.get_check_field_options_enabled(manyToManyField);

                for (let j in options) {
                    let option: IDistantVOBase = options[j];

                    if ((!select_options_enabled_by_id) || (select_options_enabled_by_id[option.id] != null)) {
                        newOptions.push(option);
                    }
                }

                if (newOptions.length > 0) {
                    await field_datatable.setSelectOptionsEnabled(newOptions.map((elem) => elem.id));
                }
            }

            if (field_datatable.type == DatatableField.MANY_TO_ONE_FIELD_TYPE) {

                let manyToOneField: ManyToOneReferenceDatatableFieldVO<any> = (field_datatable as ManyToOneReferenceDatatableFieldVO<any>);
                let options: { [id: number]: IDistantVOBase; } = this.getStoredDatas[manyToOneField.targetModuleTable.vo_type];

                if (!!manyToOneField.filterOptionsForUpdateOrCreateOnManyToOne) {
                    options = manyToOneField.filterOptionsForUpdateOrCreateOnManyToOne(vo, options);
                }

                let newOptions: IDistantVOBase[] = [];

                let select_options_enabled_by_id = this.get_check_field_options_enabled(manyToOneField);

                for (let j in options) {
                    let option: IDistantVOBase = options[j];

                    if ((!select_options_enabled_by_id) || (select_options_enabled_by_id[option.id] != null)) {
                        newOptions.push(option);
                    }
                }

                if (newOptions.length > 0) {
                    await field_datatable.setSelectOptionsEnabled(newOptions.map((elem) => elem.id));
                }
            }

            if (field_datatable.type == DatatableField.REF_RANGES_FIELD_TYPE) {

                let refrangesField: RefRangesReferenceDatatableFieldVO<any> = (field_datatable as RefRangesReferenceDatatableFieldVO<any>);
                let options = this.getStoredDatas[refrangesField.targetModuleTable.vo_type];

                if (!!refrangesField.filterOptionsForUpdateOrCreateOnRefRanges) {
                    options = refrangesField.filterOptionsForUpdateOrCreateOnRefRanges(vo, options);
                }

                let newOptions: IDistantVOBase[] = [];

                let select_options_enabled_by_id = this.get_check_field_options_enabled(refrangesField);

                for (let j in options) {
                    let option: IDistantVOBase = options[j];

                    if ((!select_options_enabled_by_id) || (select_options_enabled_by_id[option.id] != null)) {
                        newOptions.push(option);
                    }
                }

                if (newOptions.length > 0) {
                    await field_datatable.setSelectOptionsEnabled(newOptions.map((elem) => elem.id));
                }
            }
        }
    }

    private async updateDateRange(input: any) {

        if (this.inline_input_mode) {
            await this.prepare_auto_validate();
            return;
        }

        // On veut stocker au format "day day"
        let start = this.field_value_range[this.field.datatable_field_uid + '_start'];
        let end = this.field_value_range[this.field.datatable_field_uid + '_end'];

        let res = "";
        if (start) {
            try {
                res += ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay(start);
            } catch (error) {
                ConsoleHandler.error(error);
            }
        }

        res += "-";

        if (end) {
            try {
                res += ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay(end);
            } catch (error) {
                ConsoleHandler.error(error);
            }
        }

        await this.inputValue(res);
    }

    /**
     * Cas spécifique du FileVo sur lequel on a un champ fichier qui crée l'objet que l'on souhaite update ou create.
     * Si on est en cours d'update, il faut conserver l'ancien vo (pour maintenir les liaisons vers son id)
     *  et lui mettre en path le nouveau fichier. On garde aussi le nouveau file, pour archive de l'ancien fichier
     * @param fileVo
     */
    private async uploadedFile(fileVo: FileVO) {
        this.$emit('uploadedfile', this.vo, this.field, fileVo);
    }

    private async prepare_select_options() {
        if ((this.field.type == DatatableField.MANY_TO_ONE_FIELD_TYPE) ||
            (this.field.type == DatatableField.ONE_TO_MANY_FIELD_TYPE) ||
            (this.field.type == DatatableField.MANY_TO_MANY_FIELD_TYPE) ||
            (this.field.type == DatatableField.REF_RANGES_FIELD_TYPE)) {

            let manyToOne: ReferenceDatatableField<any> = (this.field as ReferenceDatatableField<any>);

            // à voir si c'est un souci mais pour avoir une version toujours propre et complète des options....
            /**
             * TODO refondre cette logique de filtrage des options ça parait absolument suboptimal
             */

            let options = this.getStoredDatas[manyToOne.targetModuleTable.vo_type];

            if (!ObjectHandler.getInstance().hasAtLeastOneAttribute(options)) {
                options = VOsTypesManager.vosArray_to_vosByIds(await ModuleDAO.getInstance().getVos(manyToOne.targetModuleTable.vo_type));
                this.storeDatasByIds({ API_TYPE_ID: manyToOne.targetModuleTable.vo_type, vos_by_ids: options });
            }

            if (this.field.type == DatatableField.ONE_TO_MANY_FIELD_TYPE) {
                let OneToManyField: OneToManyReferenceDatatableFieldVO<any> = (this.field as OneToManyReferenceDatatableFieldVO<any>);
                if (!!OneToManyField.filterOptionsForUpdateOrCreateOnOneToMany) {
                    options = OneToManyField.filterOptionsForUpdateOrCreateOnOneToMany(this.vo, options);
                }
            }

            if (this.field.type == DatatableField.MANY_TO_ONE_FIELD_TYPE) {
                let manyToOneField: ManyToOneReferenceDatatableFieldVO<any> = (this.field as ManyToOneReferenceDatatableFieldVO<any>);
                if (!!manyToOneField.filterOptionsForUpdateOrCreateOnManyToOne) {
                    options = manyToOneField.filterOptionsForUpdateOrCreateOnManyToOne(this.vo, options);
                }
            }

            if (this.field.type == DatatableField.MANY_TO_MANY_FIELD_TYPE) {
                let manyToManyField: ManyToManyReferenceDatatableFieldVO<any, any> = (this.field as ManyToManyReferenceDatatableFieldVO<any, any>);
                if (!!manyToManyField.filterOptionsForUpdateOrCreateOnManyToMany) {
                    options = manyToManyField.filterOptionsForUpdateOrCreateOnManyToMany(this.vo, options);
                }
            }

            if (this.field.type == DatatableField.REF_RANGES_FIELD_TYPE) {
                let refRangesReferenceDatatableField: RefRangesReferenceDatatableFieldVO<any> = (this.field as RefRangesReferenceDatatableFieldVO<any>);
                if (!!refRangesReferenceDatatableField.filterOptionsForUpdateOrCreateOnRefRanges) {
                    options = refRangesReferenceDatatableField.filterOptionsForUpdateOrCreateOnRefRanges(this.vo, options);
                }
            }

            //array car les maps (key, value) ordonne automatiquement en fonction des clés (problématique pour trier)
            let ordered_option_array: IDistantVOBase[] = this.field.triFiltrage(options);

            let doit = false;
            if ((!this.select_options_enabled_by_id) && this.field.select_options_enabled) {
                doit = true;
            } else if (this.select_options_enabled_by_id && !this.field.select_options_enabled) {
                doit = true;
            } else if (this.select_options_enabled_by_id && this.field.select_options_enabled) {
                let a = Object.keys(this.select_options_enabled_by_id).length;
                if (a != this.field.select_options_enabled.length) {
                    doit = true;
                } else {

                    for (let i in this.field.select_options_enabled) {
                        if (!this.select_options_enabled_by_id[i]) {
                            doit = true;
                            break;
                        }
                    }
                }
            }

            if (doit) {
                this.select_options_enabled_by_id = this.get_check_field_options_enabled(this.field);
            }

            let newOptions: number[] = [];
            for (let index in ordered_option_array) {
                let option: IDistantVOBase = ordered_option_array[index];

                if ((!this.select_options_enabled_by_id) || (this.select_options_enabled_by_id[option.id] != null)) {
                    newOptions.push(option.id);
                }
            }

            if (!!this.isLoadingOptions) {
                this.isLoadingOptions = false;
            }
            this.select_options = newOptions;
            return;
        }

        if (this.field.type == DatatableField.SIMPLE_FIELD_TYPE) {
            let simpleField: SimpleDatatableFieldVO<any, any> = (this.field as SimpleDatatableFieldVO<any, any>);

            if (simpleField.moduleTableField.field_type == ModuleTableField.FIELD_TYPE_enum) {
                let newOptions: number[] = [];

                for (let j in simpleField.moduleTableField.enum_values) {
                    let id: number = parseInt(j.toString());

                    if ((!this.select_options_enabled_by_id) || (this.select_options_enabled_by_id[id] != null)) {
                        newOptions.push(id);
                    }
                }
                if (!!this.isLoadingOptions) {
                    this.isLoadingOptions = false;
                }
                this.select_options = newOptions;
            }
        }
    }

    private async asyncLoadOptions(query: string) {
        if (!this.isLoadingOptions) {
            this.isLoadingOptions = true;
        }

        if ((!this.field) ||
            ((this.field.type != DatatableField.MANY_TO_ONE_FIELD_TYPE) &&
                (this.field.type != DatatableField.ONE_TO_MANY_FIELD_TYPE) &&
                (this.field.type != DatatableField.MANY_TO_MANY_FIELD_TYPE) &&
                (this.field.type != DatatableField.REF_RANGES_FIELD_TYPE))) {
            this.snotify.warning(this.label('crud.multiselect.search.error'));
            if (!!this.isLoadingOptions) {
                this.isLoadingOptions = false;
            }
            return;
        }

        let manyToOne: ManyToOneReferenceDatatableFieldVO<any> = (this.field as ManyToOneReferenceDatatableFieldVO<any>);
        let OneToMany: OneToManyReferenceDatatableFieldVO<any> = (this.field as OneToManyReferenceDatatableFieldVO<any>);
        let manyToMany: ManyToManyReferenceDatatableFieldVO<any, any> = (this.field as ManyToManyReferenceDatatableFieldVO<any, any>);

        // à voir si c'est un souci mais pour avoir une version toujours propre et complète des options....

        let options = this.getStoredDatas[manyToOne.targetModuleTable.vo_type];
        if (!ObjectHandler.getInstance().hasAtLeastOneAttribute(options)) {
            options = VOsTypesManager.vosArray_to_vosByIds(await ModuleDAO.getInstance().getVos(manyToOne.targetModuleTable.vo_type));
            this.storeDatasByIds({ API_TYPE_ID: manyToOne.targetModuleTable.vo_type, vos_by_ids: options });
        }
        if (!!OneToMany.filterOptionsForUpdateOrCreateOnOneToMany) {
            options = OneToMany.filterOptionsForUpdateOrCreateOnOneToMany(this.vo, options);
        }
        if (!!manyToOne.filterOptionsForUpdateOrCreateOnManyToOne) {
            options = manyToOne.filterOptionsForUpdateOrCreateOnManyToOne(this.vo, options);
        }
        if (!!manyToMany.filterOptionsForUpdateOrCreateOnManyToMany) {
            options = manyToMany.filterOptionsForUpdateOrCreateOnManyToMany(this.vo, options);
        }

        //array car les maps (key, value) ordonne automatiquement en fonction des clés (problématique pour trier)
        let ordered_option_array: IDistantVOBase[] = this.field.triFiltrage(options);

        let newOptions: number[] = [];

        for (let index in ordered_option_array) {
            let option: IDistantVOBase = ordered_option_array[index];

            if (manyToOne.dataToHumanReadable(option).toLowerCase().indexOf(query.toLowerCase()) >= 0) {

                if ((!this.select_options_enabled_by_id) || (this.select_options_enabled_by_id[option.id] != null)) {
                    newOptions.push(option.id);
                }
            }
        }

        if (!!this.isLoadingOptions) {
            this.isLoadingOptions = false;
        }
        this.select_options = newOptions;
    }

    private asyncLoadEnumOptions(query: string) {
        if (!this.isLoadingOptions) {
            this.isLoadingOptions = true;
        }

        if ((!this.field) ||
            ((this.field.type != DatatableField.SIMPLE_FIELD_TYPE))) {
            this.snotify.warning(this.label('crud.multiselect.search.error'));
            if (!!this.isLoadingOptions) {
                this.isLoadingOptions = false;
            }
            return;
        }

        let simpleField: SimpleDatatableFieldVO<any, any> = (this.field as SimpleDatatableFieldVO<any, any>);
        let newOptions: number[] = [];

        for (let i in simpleField.moduleTableField.enum_values) {

            if (simpleField.enumIdToHumanReadable(parseInt(i)).toLowerCase().indexOf(query.toLowerCase()) >= 0) {

                if ((!this.select_options_enabled_by_id) || (this.select_options_enabled_by_id[parseInt(i)] != null)) {
                    newOptions.push(parseInt(i));
                }
            }
        }

        if (!!this.isLoadingOptions) {
            this.isLoadingOptions = false;
        }
        this.select_options = newOptions;
    }

    private async onChangeField() {

        if (this.field_type == DatatableField.REF_RANGES_FIELD_TYPE) {
            let ranges: NumRange[] = [];
            for (let i in this.field_value_refranges_selected_ids) {
                let id = parseInt(this.field_value_refranges_selected_ids[i].toString());

                ranges.push(RangeHandler.create_single_elt_NumRange(id, NumSegment.TYPE_INT));
            }
            ranges = RangeHandler.getRangesUnion(ranges);
            this.field_value = ranges;
        }

        if (this.inline_input_mode) {
            await this.prepare_auto_validate();
            return;
        }

        if (this.field_type == DatatableField.REF_RANGES_FIELD_TYPE) {

            let refrangesField: RefRangesReferenceDatatableFieldVO<any> = (this.field as RefRangesReferenceDatatableFieldVO<any>);

            // à voir si c'est un souci mais pour avoir une version toujours propre et complète des options....
            let options = this.getStoredDatas[refrangesField.targetModuleTable.vo_type];
            if (!ObjectHandler.getInstance().hasAtLeastOneAttribute(options)) {
                options = VOsTypesManager.vosArray_to_vosByIds(await ModuleDAO.getInstance().getVos(refrangesField.targetModuleTable.vo_type));
                this.storeDatasByIds({ API_TYPE_ID: refrangesField.targetModuleTable.vo_type, vos_by_ids: options });
            }

            if (!!refrangesField.filterOptionsForUpdateOrCreateOnRefRanges) {
                options = refrangesField.filterOptionsForUpdateOrCreateOnRefRanges(this.vo, options);
            }

            //array car les maps (key, value) ordonne automatiquement en fonction des clés (problématique pour trier)
            let ordered_option_array: IDistantVOBase[] = this.field.triFiltrage(options);

            let newOptions: number[] = [];
            for (let index in ordered_option_array) {
                let option: IDistantVOBase = ordered_option_array[index];

                if ((!this.select_options_enabled_by_id) || (this.select_options_enabled_by_id[option.id] != null)) {
                    newOptions.push(option.id);
                }
            }
            this.select_options = newOptions;
        }

        if (this.field.type == DatatableField.ONE_TO_MANY_FIELD_TYPE) {

            let OneToManyField: OneToManyReferenceDatatableFieldVO<any> = (this.field as OneToManyReferenceDatatableFieldVO<any>);

            // à voir si c'est un souci mais pour avoir une version toujours propre et complète des options....
            let options = this.getStoredDatas[OneToManyField.targetModuleTable.vo_type];
            if (!ObjectHandler.getInstance().hasAtLeastOneAttribute(options)) {
                options = VOsTypesManager.vosArray_to_vosByIds(await ModuleDAO.getInstance().getVos(OneToManyField.targetModuleTable.vo_type));
                this.storeDatasByIds({ API_TYPE_ID: OneToManyField.targetModuleTable.vo_type, vos_by_ids: options });
            }

            if (!!OneToManyField.filterOptionsForUpdateOrCreateOnOneToMany) {
                options = OneToManyField.filterOptionsForUpdateOrCreateOnOneToMany(this.vo, options);
            }

            let ordered_option_array: IDistantVOBase[] = this.field.triFiltrage(options);

            let newOptions: number[] = [];
            for (let j in ordered_option_array) {
                let option = ordered_option_array[j];

                if ((!this.select_options_enabled_by_id) || (this.select_options_enabled_by_id[option.id] != null)) {
                    newOptions.push(option.id);
                }
            }
            this.select_options = newOptions;
        }

        if (this.field.type == DatatableField.MANY_TO_MANY_FIELD_TYPE) {

            let manyToManyField: ManyToManyReferenceDatatableFieldVO<any, any> = (this.field as ManyToManyReferenceDatatableFieldVO<any, any>);

            // à voir si c'est un souci mais pour avoir une version toujours propre et complète des options....
            let options = this.getStoredDatas[manyToManyField.targetModuleTable.vo_type];
            if (!ObjectHandler.getInstance().hasAtLeastOneAttribute(options)) {
                options = VOsTypesManager.vosArray_to_vosByIds(await ModuleDAO.getInstance().getVos(manyToManyField.targetModuleTable.vo_type));
                this.storeDatasByIds({ API_TYPE_ID: manyToManyField.targetModuleTable.vo_type, vos_by_ids: options });
            }

            if (!!manyToManyField.filterOptionsForUpdateOrCreateOnManyToMany) {
                options = manyToManyField.filterOptionsForUpdateOrCreateOnManyToMany(this.vo, options);
            }

            let ordered_option_array: IDistantVOBase[] = this.field.triFiltrage(options);

            let newOptions: number[] = [];
            for (let j in ordered_option_array) {
                let option = ordered_option_array[j];

                if ((!this.select_options_enabled_by_id) || (this.select_options_enabled_by_id[option.id] != null)) {
                    newOptions.push(option.id);
                }
            }
            this.select_options = newOptions;
        }

        if (this.field.type == DatatableField.MANY_TO_ONE_FIELD_TYPE) {

            let manyToOneField: ManyToOneReferenceDatatableFieldVO<any> = (this.field as ManyToOneReferenceDatatableFieldVO<any>);

            // à voir si c'est un souci mais pour avoir une version toujours propre et complète des options....
            let options = this.getStoredDatas[manyToOneField.targetModuleTable.vo_type];
            if (!ObjectHandler.getInstance().hasAtLeastOneAttribute(options)) {
                options = VOsTypesManager.vosArray_to_vosByIds(await ModuleDAO.getInstance().getVos(manyToOneField.targetModuleTable.vo_type));
                this.storeDatasByIds({ API_TYPE_ID: manyToOneField.targetModuleTable.vo_type, vos_by_ids: options });
            }

            if (!!manyToOneField.filterOptionsForUpdateOrCreateOnManyToOne) {
                options = manyToOneField.filterOptionsForUpdateOrCreateOnManyToOne(this.vo, options);
            }

            let ordered_option_array: IDistantVOBase[] = this.field.triFiltrage(options);

            let newOptions: number[] = [];
            for (let j in ordered_option_array) {
                let option = ordered_option_array[j];

                if ((!this.select_options_enabled_by_id) || (this.select_options_enabled_by_id[option.id] != null)) {
                    newOptions.push(option.id);
                }
            }
            this.select_options = newOptions;
        }

        // JNE : Ajout d'un filtrage auto suivant conf si on est pas sur le CRUD. A voir si on change pas le CRUD plus tard
        if (!this.datatable) {
            this.field_value = this.field.UpdateIHMToData(this.field_value, this.vo);
        }

        if (this.auto_update_field_value) {
            await this.changeValue(this.vo, this.field, this.field_value, this.datatable);
        }

        if (this.field.onChange) {
            await this.field.onChange(this.vo);
            this.datatable.refresh();
        }

        this.debounced_onchangevo_emitter();
        this.$emit('endofchange', this.vo, this.field, this.field.UpdateIHMToData(this.field_value, this.vo), this);
    }

    private async inputValue(value: any) {

        if (this.is_custom_field_type) {
            this.field_value = value;
        }

        if (this.inline_input_mode) {
            await this.prepare_auto_validate();
            return;
        }

        if (this.field_value != value) {
            this.field_value = value;
        }

        if (this.auto_update_field_value) {
            await this.changeValue(this.vo, this.field, this.field_value, this.datatable);
        }

        if (this.field.onChange) {
            await this.field.onChange(this.vo);
            this.datatable.refresh();
        }

        this.debounced_onchangevo_emitter();
    }

    private onchangevo_emitter() {
        this.$emit('onchangevo', this.vo, this.field, this.field.UpdateIHMToData(this.field_value, this.vo), this);
    }

    /**
     * On est sur un field de type array par définition
     */
    private async select_all() {
        switch (this.field.type) {
            case DatatableField.REF_RANGES_FIELD_TYPE:
                this.field_value_refranges_selected_ids = Array.from(this.select_options);
                break;
            case DatatableField.MANY_TO_MANY_FIELD_TYPE:
            case DatatableField.ONE_TO_MANY_FIELD_TYPE:
                this.field_value = Array.from(this.select_options);
                break;
        }
        await this.onChangeField();
    }

    /**
     * On est sur un field de type array par définition
     */
    private async select_none() {
        switch (this.field.type) {
            case DatatableField.REF_RANGES_FIELD_TYPE:
                this.field_value_refranges_selected_ids = [];
                break;
            case DatatableField.MANY_TO_MANY_FIELD_TYPE:
            case DatatableField.ONE_TO_MANY_FIELD_TYPE:
                this.field_value = [];
                break;
        }
        await this.onChangeField();
    }

    private async inline_clear_value(event) {

        if (event) {
            event.stopPropagation();
        }

        if (!this.ask_confirmation_to_delete) {
            await this.inline_clear_value_confirmed();
            return;
        }

        let self = this;
        this.$snotify.confirm(self.label('inline_clear_value.confirm.body'), self.label('inline_clear_value.confirm.title'), {
            timeout: 10000,
            showProgressBar: true,
            closeOnClick: false,
            pauseOnHover: true,
            buttons: [
                {
                    text: self.t('YES'),
                    action: async (toast) => {
                        self.$snotify.remove(toast.id);
                        await self.inline_clear_value_confirmed();
                    },
                    bold: false
                },
                {
                    text: self.t('NO'),
                    action: (toast) => {
                        self.$snotify.remove(toast.id);
                    }
                }
            ]
        });
    }

    private async inline_clear_value_confirmed() {

        this.field_value = null;

        await this.change_inline_field_value();
        this.field_value = this.field.dataToUpdateIHM(this.inline_input_read_value, this.vo);
    }

    private async validate_inline_input(event) {

        if (this.auto_validate_start) {
            CRUDFormServices.getInstance().auto_updates_waiting[this.this_CRUDComp_UID] = false;
            this.auto_validate_start = null;
        }

        if (event) {
            event.stopPropagation();
        }

        let alerts: Alert[] = this.field.validate_input ? this.field.validate_input(this.field_value, this.field, this.vo) : null;

        if ((this.field_type == ModuleTableField.FIELD_TYPE_email) || (this.field_type == ModuleTableField.FIELD_TYPE_string)) {
            if (!alerts || !alerts.length) {
                if (!!(this.$refs.input_elt as any) && !!(this.$refs.input_elt as any).checkValidity && !(this.$refs.input_elt as any).checkValidity()) {
                    if (!alerts) {
                        alerts = [];
                    }

                    alerts.push(new Alert(this.field.alert_path, 'crud.field_error_format', Alert.TYPE_ERROR));
                }
            }
        }

        // Si on a des alertes, d'une part on les register, d'autre part on check qu'on a pas des erreurs sinon il faut refuser l'input
        this.replace_alerts({
            alert_path: this.field.alert_path,
            alerts: alerts
        });

        if (alerts && alerts.length) {

            for (let i in alerts) {
                let alert = alerts[i];

                if (alert.type >= Alert.TYPE_ERROR) {
                    this.snotify.error(this.label('field.validate_input.error'));
                    return;
                }
            }
        }

        await this.change_inline_field_value();
    }

    private async change_inline_field_value() {

        let old_value: any = this.vo[this.field.datatable_field_uid];

        this.inline_input_is_busy = true;

        if (this.auto_update_field_value) {

            // En édition inline + autoupdate, on veut pouvoir aller au plus rapide / simple et donc sauvegarder asap et informer également asap

            let result: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(this.vo);

            if ((!result) || (!result.id)) {
                await this.snotify.error(this.label('field.auto_update_field_value.failed'));
                this.vo[this.field.datatable_field_uid] = old_value;

                this.register_alert(new Alert(this.alert_path, 'field.auto_update_field_value.server_error'));
                this.inline_input_is_busy = false;

                return;
            } else {
                await this.snotify.success(this.label('field.auto_update_field_value.succes'));
            }

            this.vo.id = result.id;
        }

        if (this.field.onChange) {
            await this.field.onChange(this.vo);
            this.datatable.refresh();
        }

        this.debounced_onchangevo_emitter();

        if (this.inline_input_mode_semaphore) {
            CRUDComponentManager.getInstance().inline_input_mode_semaphore = false;
        }

        if (!this.force_input_is_editing) {
            this.inline_input_is_editing = false;
        }

        this.inline_input_is_busy = false;
    }

    private prepare_inline_input(event) {

        if (event) {
            event.stopPropagation();
        }

        // Mise en place d'un sémaphore sur l'édition inline : si on est en train d'éditer un champ, on ne peut pas en éditer un second,

        /**
         * On va fluidifier un peu : si on change de champs sans enregistrer on annule la saisie et on snotify qu'il faut enregistrer pour prendre en compte une modif
         */
        if (this.inline_input_mode_semaphore && CRUDComponentManager.getInstance().inline_input_mode_semaphore) {

            let self = this;
            for (let idstr in CRUDComponentManager.getInstance().inline_input_mode_semaphore_disable_cb) {
                let id = parseInt(idstr.toString());
                let cb = CRUDComponentManager.getInstance().inline_input_mode_semaphore_disable_cb[idstr];

                if (id == self.this_CRUDComp_UID) {
                    continue;
                }
                cb();
            }

            if (!self.field_value) {

                // JNE : Ajout d'un filtrage auto suivant conf si on est pas sur le CRUD. A voir si on change pas le CRUD plus tard
                self.field_value = self.field.dataToUpdateIHM(self.inline_input_read_value, self.vo);
            }

            if (this.inline_input_mode_semaphore) {
                CRUDComponentManager.getInstance().inline_input_mode_semaphore = true;
            }
            self.inline_input_is_editing = true;

            this.$snotify.warning(this.label('crud.inline_input_mode_semaphore.canceled'));
            return;
        }

        if (!this.field_value) {

            // JNE : Ajout d'un filtrage auto suivant conf si on est pas sur le CRUD. A voir si on change pas le CRUD plus tard
            this.field_value = this.field.dataToUpdateIHM(this.inline_input_read_value, this.vo);
        }
        if (this.inline_input_mode_semaphore) {
            CRUDComponentManager.getInstance().inline_input_mode_semaphore = true;
        }
        this.inline_input_is_editing = true;

        /**
         * Si on trouve un input_elt on lui donne le focus
         * cf: https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/Client-side_JavaScript_frameworks/Vue_refs_focus_management
         * pour l'explication du nexttick
         */
        this.$nextTick(() => {
            if (this.$refs['input_elt'] && this.$refs['input_elt']['focus']) {
                this.$refs['input_elt']['focus']();
            }
        });
    }

    private cancel_input(event = null) {

        if (event) {
            event.stopPropagation();
        }

        this.$emit('on_cancel_input', this.vo, this.field, this);

        if (this.inline_input_mode_semaphore) {
            CRUDComponentManager.getInstance().inline_input_mode_semaphore = false;
        }

        if (!this.force_input_is_editing) {
            this.inline_input_is_editing = false;
        }

        this.field_value = this.field.dataToUpdateIHM(this.inline_input_read_value, this.vo);

        this.replace_alerts({
            alert_path: this.field.alert_path,
            alerts: null
        });
    }

    private async inline_input_submit() {
        if (!this.inline_input_mode) {
            return;
        }

        await this.prepare_auto_validate(true, null);
    }

    private async beforeDestroy() {

        if (this.auto_validate_start) {
            await this.prepare_auto_validate(true, null);
        }

        delete CRUDComponentManager.getInstance().inline_input_mode_semaphore_disable_cb[this.this_CRUDComp_UID];
        if (this.inline_input_mode_semaphore && this.inline_input_is_editing) {
            CRUDComponentManager.getInstance().inline_input_mode_semaphore = false;
        }
    }

    private async onkeypress(e) {
        if (!this.inline_input_mode) {
            return;
        }

        let keynum;

        keynum = e.key;

        if (keynum == 'Enter') {

            await this.prepare_auto_validate(true, null);
            return;
        }

        if (keynum == 'Escape') {

            return;
        }
    }

    private try_prepare_inline_input(event) {
        if (!this.inline_input_mode) {
            return;
        }

        if (this.inline_input_is_editing) {
            return;
        }

        this.prepare_inline_input(null);
    }

    private async onkeypress_escape() {
        if (!this.inline_input_mode) {
            return;
        }

        await this.cancel_input();
    }

    private on_focus($event) {
        this.has_focus = true;
    }

    private on_focus_select($event) {
        this.on_focus($event);
        if (this.inline_input_mode && this.force_input_is_editing) {
            $event.target.select();
        }
    }

    private on_blur($event) {

        // Pour le moment, on désactive ce truc car ça ne fonctionne pas
        return;

        this.has_focus = false;

        this.update_input_field_value_from_vo_field_value();
        this.inline_input_is_editing = false;
    }

    get filtered_value() {

        if (this.field_value == null) {
            return null;
        }

        if (!this.filter) {
            return this.field_value;
        }

        let params = [this.field_value];

        if (!!this.filter_additional_params) {
            params = params.concat(this.filter_additional_params);
        }

        return this.filter.apply(null, params);
    }

    get is_auto_validating() {
        return this.auto_validate_inline_input && !!this.auto_validate_start;
    }

    private update_input_field_value_from_vo_field_value() {
        let field_value: any = (this.vo && this.field) ? this.vo[this.field.datatable_field_uid] : null;

        if (!this.datatable) {
            field_value = this.field.dataToUpdateIHM(field_value, this.vo);
        }

        if (this.field_value != field_value) {
            this.field_value = field_value;
        }
    }

    private update_vo_field_value_from_input_field_value() {

        if ((!this.vo) || (!this.field)) {
            return;
        }

        let field_value: any = this.field_value;

        // FIXME : Pas possible de faire ça comme ça, ya des types de champs avec des contraintes de valeurs, ou mandatory. mais un field_id fixe c'est non
        // let regex: RegExp = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
        // if (this.field.datatable_field_uid == 'email' && !regex.test(field_value)) {
        //     return false;
        // }
        // if ((this.field.datatable_field_uid == 'email' || this.field.datatable_field_uid == 'name') && field_value == '') {
        //     return false;
        // }

        field_value = this.field.UpdateIHMToData(field_value, this.vo);

        if (this.vo[this.field.datatable_field_uid] != field_value) {
            this.vo[this.field.datatable_field_uid] = field_value;
        }
        return;
    }

    private on_blur_emit($event) {
        this.on_blur($event);
        this.$emit('blur', $event.target ? $event.target.value : null);
    }

    private get_crud_link(api_type_id: string, vo_id: number): string {
        if (this.is_dashboard_builder) {
            let res: string = "#" + this.$route.path;

            if (res.charAt(res.length - 1) != '/') {
                res += '/';
            }

            if (vo_id) {
                res += DashboardBuilderController.DASHBOARD_VO_ACTION_EDIT;
            } else {
                res += DashboardBuilderController.DASHBOARD_VO_ACTION_ADD;
            }

            res += '/' + vo_id + '/' + api_type_id;

            return res;
        }

        if (!vo_id) {
            return '/admin#' + this.getCRUDCreateLink(api_type_id, false);
        }

        return '/admin#' + this.getCRUDUpdateLink(api_type_id, vo_id);
    }

    get targetModuleTable_count(): number {
        let manyToOne: ReferenceDatatableField<any> = (this.field as ReferenceDatatableField<any>);
        if (manyToOne && manyToOne.targetModuleTable && manyToOne.targetModuleTable.vo_type && this.getStoredDatas && this.getStoredDatas[manyToOne.targetModuleTable.vo_type]) {
            return ObjectHandler.getInstance().arrayFromMap(this.getStoredDatas[manyToOne.targetModuleTable.vo_type]).length;
        }

        return null;
    }

    get field_value_length(): number {
        return this.field_value ? this.field_value.length : 0;
    }

    get is_custom_field_type(): boolean {
        return !!this.custom_field_types[this.field_type];
    }

    get custom_field_types(): { [name: string]: TableFieldTypeControllerBase } {
        return TableFieldTypesManager.getInstance().registeredTableFieldTypeControllers;
    }

    get field_type(): string {
        if (this.field.type == 'Simple') {
            return (this.field as SimpleDatatableFieldVO<any, any>).moduleTableField.field_type;
        }

        return this.field.type;
    }

    get random_number(): number {
        return Math.floor(Math.random() * 1000);
    }

    get show_mandatory_star(): boolean {
        return this.field.is_required && (this.field_type != 'boolean');
    }

    get hide_inline_controls(): boolean {
        return this.field.is_required && (this.field_type == 'boolean');
    }

    get needs_options(): boolean {
        let simpleField: SimpleDatatableFieldVO<any, any> = (this.field as SimpleDatatableFieldVO<any, any>);
        return ((this.field.type == DatatableField.MANY_TO_ONE_FIELD_TYPE) ||
            (this.field.type == DatatableField.ONE_TO_MANY_FIELD_TYPE) ||
            (this.field.type == DatatableField.MANY_TO_MANY_FIELD_TYPE) ||
            (this.field.type == DatatableField.REF_RANGES_FIELD_TYPE)) ||
            ((this.field.type == DatatableField.SIMPLE_FIELD_TYPE) && (simpleField.moduleTableField.field_type == ModuleTableField.FIELD_TYPE_enum));
    }

    get hourrange_input_component() {
        return HourrangeInputComponent;
    }

    get alert_path(): string {
        if (!this.field) {
            return null;
        }

        return this.field.alert_path;
    }

    get is_segmented_day_tsrange_array() {
        let field = (this.field as SimpleDatatableFieldVO<any, any>).moduleTableField;
        if (!!field) {
            return (field.field_type == ModuleTableField.FIELD_TYPE_tstzrange_array) && (field.segmentation_type == TimeSegment.TYPE_DAY);
        }
    }

    get input_elt_id() {

        if (this.vo && this.vo.id) {
            return this.vo._type + '.' + this.vo.id + '.' + this.field.datatable_field_uid;
        }
        if (this.vo) {
            return this.vo._type + '.' + this.field.datatable_field_uid;
        }
        if (this.field && this.field.vo_type_id) {
            return this.field.vo_type_id + '.' + this.field.datatable_field_uid;
        }

        return this.field.datatable_field_uid;
    }

    /**
     * Fonction liée au param option
     * Vérifie si l'option concerne le composant des tsrange
     * Si oui, transmet la chaîne de caractères complète
     * Sinon, ne transmet rien (option_ts_range = null)
     */
    get option_ts_range(): string {
        if (!this.option) {
            return null;
        }
        let option_arr: string[] = this.option.split('_');
        if (option_arr.length < 2 || option_arr[0] !== 'tsrange') {
            return null;
        }
        return this.option;
    }

    private get_check_field_options_enabled(field: DatatableField<any, any>): { [id: number]: number } {
        let res: { [id: number]: number } = {};

        // let doit = false;
        // if ((!this.select_options_enabled_by_id) && this.field.select_options_enabled) {
        //     doit = true;
        // } else if (this.select_options_enabled_by_id && !this.field.select_options_enabled) {
        //     doit = true;
        // } else if (this.select_options_enabled_by_id && this.field.select_options_enabled) {
        //     let a = Object.keys(this.select_options_enabled_by_id).length;
        //     if (a != this.field.select_options_enabled.length) {
        //         doit = true;
        //     } else {

        //         for (let i in this.field.select_options_enabled) {
        //             if (!this.select_options_enabled_by_id[i]) {
        //                 doit = true;
        //                 break;
        //             }
        //         }
        //     }
        // }

        // if (!doit) {
        //     return;
        // }

        res = field.select_options_enabled ? {} : null;
        for (let i in field.select_options_enabled) {
            let option = field.select_options_enabled[i];

            res[option] = option;
        }

        return res;
    }

    get placeholder_string(): string {
        if (!this.field) {
            return null;
        }

        return this.field.translatable_place_holder ? this.field.translatable_place_holder : this.field.translatable_title;
    }

    private async prepare_auto_validate(force_live_validation: boolean = false, event: any = null, wait_endofchange: boolean = false) {
        this.update_vo_field_value_from_input_field_value();

        if (!wait_endofchange) {
            if ((!force_live_validation) && this.auto_validate_inline_input) {

                if (this.debounced_validate_inline_input_auto) {
                    this.debounced_validate_inline_input_auto();
                }

                /**
                 * Pour recharger les animations, il faut sortir du cas !!this.auto_validate_start
                 */
                if (!!this.auto_validate_start) {
                    let self = this;

                    this.auto_validate_start = null;
                    setTimeout(() => {
                        self.auto_validate_start = Dates.now();
                    }, 50);
                } else {
                    this.auto_validate_start = Dates.now();
                    CRUDFormServices.getInstance().auto_updates_waiting[this.this_CRUDComp_UID] = true;
                }
            } else {
                await this.validate_inline_input(event);
            }
        }
    }
}