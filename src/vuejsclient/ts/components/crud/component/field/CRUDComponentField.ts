import * as moment from 'moment';
import { Component, Prop, Watch } from 'vue-property-decorator';
import ModuleAccessPolicy from '../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import TimeSegment from '../../../../../../shared/modules/DataRender/vos/TimeSegment';
import FileVO from '../../../../../../shared/modules/File/vos/FileVO';
import ModuleFormatDatesNombres from '../../../../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';
import ModuleTableField from '../../../../../../shared/modules/ModuleTableField';
import TableFieldTypesManager from '../../../../../../shared/modules/TableFieldTypes/TableFieldTypesManager';
import TableFieldTypeControllerBase from '../../../../../../shared/modules/TableFieldTypes/vos/TableFieldTypeControllerBase';
import VOsTypesManager from '../../../../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import DateHandler from '../../../../../../shared/tools/DateHandler';
import ObjectHandler from '../../../../../../shared/tools/ObjectHandler';
import { ModuleDAOAction, ModuleDAOGetter } from '../../../dao/store/DaoStore';
import Datatable from '../../../datatable/vos/Datatable';
import DatatableField from '../../../datatable/vos/DatatableField';
import ManyToOneReferenceDatatableField from '../../../datatable/vos/ManyToOneReferenceDatatableField';
import ReferenceDatatableField from '../../../datatable/vos/ReferenceDatatableField';
import SimpleDatatableField from '../../../datatable/vos/SimpleDatatableField';
import FileComponent from '../../../file/FileComponent';
import HourrangeInputComponent from '../../../hourrangeinput/HourrangeInputComponent';
import ImageComponent from '../../../image/ImageComponent';
import IsoWeekDaysInputComponent from '../../../isoweekdaysinput/IsoWeekDaysInputComponent';
import MultiInputComponent from '../../../multiinput/MultiInputComponent';
import TSRangesInputComponent from '../../../tsrangesinput/TSRangesInputComponent';
import VueComponentBase from '../../../VueComponentBase';
let debounce = require('lodash/debounce');


@Component({
    template: require('./CRUDComponentField.pug'),
    components: {
        FileComponent: FileComponent,
        ImageComponent: ImageComponent,
        MultiInputComponent: MultiInputComponent,
        HourrangeInputComponent: HourrangeInputComponent,
        TSRangesInputComponent: TSRangesInputComponent,
        IsoWeekDaysInputComponent: IsoWeekDaysInputComponent
    }
})
export default class CRUDComponentField extends VueComponentBase {

    @ModuleDAOGetter
    public getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } };
    @ModuleDAOAction
    private storeDatasByIds: (params: { API_TYPE_ID: string, vos_by_ids: { [id: number]: IDistantVOBase } }) => void;

    get hourrange_input_component() {
        return HourrangeInputComponent;
    }

    @Prop()
    private field: DatatableField<any, any>;

    @Prop()
    private vo: IDistantVOBase;

    @Prop()
    private default_field_data: any;

    @Prop({ default: null })
    private field_select_options_enabled: number[];

    @Prop({ default: false })
    private auto_update_field_value: boolean;

    @Prop()
    private datatable: Datatable<IDistantVOBase>;

    @Prop({ default: true })
    private show_insert_or_update_target: boolean;

    @Prop({ default: true })
    private show_title: boolean;

    private select_options: number[] = [];
    private isLoadingOptions: boolean = false;
    private field_value: any = null;
    private field_value_range: any = {};

    private can_insert_or_update_target: boolean = false;

    private debounced_reload_field_value = debounce(this.reload_field_value, 50);

    public async mounted() { }

    get is_segmented_day_tsrange_array() {
        let field = (this.field as SimpleDatatableField<any, any>).moduleTableField;
        return (field.field_type == ModuleTableField.FIELD_TYPE_tstzrange_array) && (field.segmentation_type == TimeSegment.TYPE_DAY);
    }


    // TODO FIXME là on appel 5* la fonction au démarrage... il faut debounce ou autre mais c'est pas normal
    @Watch('field', { immediate: true })
    @Watch('vo', { immediate: true })
    @Watch('datatable', { immediate: true })
    @Watch('default_field_data', { immediate: true })
    @Watch('field_select_options_enabled', { immediate: true })
    private on_reload_field_value() {
        this.debounced_reload_field_value();
    }

    private async reload_field_value() {

        this.can_insert_or_update_target = false;

        this.field_value = this.vo[this.field.datatable_field_uid];

        // JNE : Ajout d'un filtrage auto suivant conf si on est pas sur le CRUD. A voir si on change pas le CRUD plus tard
        if (!this.datatable) {
            this.field_value = this.field.dataToUpdateIHM(this.field_value, this.vo);
        }

        // JNE : je sais pas si il faut se placer au dessus ou en dessous de ça ...
        if (this.field_type == ModuleTableField.FIELD_TYPE_daterange && this.field_value) {
            let date: string[] = this.field_value.toString().split('-');

            if (date && date.length > 0) {
                this.field_value_range[this.field.datatable_field_uid + '_start'] = this.formatDateForField(date[0]);
                this.field_value_range[this.field.datatable_field_uid + '_end'] = this.formatDateForField(date[1]);
            }
        }

        let self = this;
        if ((this.field.type == DatatableField.MANY_TO_ONE_FIELD_TYPE) ||
            (this.field.type == DatatableField.ONE_TO_MANY_FIELD_TYPE) ||
            (this.field.type == DatatableField.MANY_TO_MANY_FIELD_TYPE)) {
            ModuleAccessPolicy.getInstance().checkAccess(
                ModuleDAO.getInstance().getAccessPolicyName(
                    ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE,
                    (this.field as ReferenceDatatableField<any>).targetModuleTable.vo_type)).then((res: boolean) => {
                        self.can_insert_or_update_target = res;
                    });
        }

        this.isLoadingOptions = true;
        await this.prepare_select_options();
        this.isLoadingOptions = false;
    }

    private formatDateForField(date: string, separator: string = '/'): string {
        if (!date) {
            return null;
        }

        let dateCut: string[] = date.split(separator);

        return DateHandler.getInstance().formatDayForIndex(moment().year(parseInt(dateCut[2])).month(parseInt(dateCut[1]) - 1).date(parseInt(dateCut[0])));
    }

    private validateInput(input: any) {

        let input_value = input.value;
        if ((this.field.type == DatatableField.SIMPLE_FIELD_TYPE) &&
            ((this.field as SimpleDatatableField<any, any>).moduleTableField.field_type == ModuleTableField.FIELD_TYPE_boolean)) {
            input_value = input.checked;
        }

        // cas du checkbox où la value est useless ...

        if (this.field.required) {
            if ((input_value == null) || (typeof input_value == "undefined")) {

                switch (this.field.type) {
                    case DatatableField.SIMPLE_FIELD_TYPE:
                        switch ((this.field as SimpleDatatableField<any, any>).moduleTableField.field_type) {
                            case ModuleTableField.FIELD_TYPE_boolean:
                            case ModuleTableField.FIELD_TYPE_daterange:
                            case ModuleTableField.FIELD_TYPE_hourrange_array:
                            case ModuleTableField.FIELD_TYPE_tstzrange_array:
                            case ModuleTableField.FIELD_TYPE_numrange_array:
                            case ModuleTableField.FIELD_TYPE_isoweekdays:
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
        input.setCustomValidity ? input.setCustomValidity(msg) : document.getElementById(input.id)['setCustomValidity'](msg);

        this.field_value = input_value;

        if (this.auto_update_field_value) {
            this.changeValue(this.vo, this.field, this.field_value, this.datatable);
        }
        this.$emit('changeValue', this.vo, this.field, this.field_value, this.datatable);
    }

    private validateSimpleInput(input_value: any) {

        // TODO FIXME VALIDATE
        this.field_value = input_value;

        if (this.auto_update_field_value) {
            this.vo[this.field.datatable_field_uid] = this.field_value;
        }
        this.$emit('changeValue', this.vo, this.field, this.field_value, this.datatable);
    }

    private validateMultiInput(values: any[]) {
        if (this.auto_update_field_value) {
            this.vo[this.field.datatable_field_uid] = values;
        }
        this.$emit('changeValue', this.vo, this.field, this.field_value, this.datatable);
        this.$emit('validateMultiInput', values, this.field, this.vo);
    }


    private changeValue(vo: IDistantVOBase, field: DatatableField<any, any>, value: any, datatable: Datatable<IDistantVOBase>) {
        vo[field.datatable_field_uid] = value;

        if (!datatable) {
            return;
        }
        for (let i in datatable.fields) {
            let field_datatable: DatatableField<any, any> = datatable.fields[i];
            if (field_datatable.type == DatatableField.MANY_TO_ONE_FIELD_TYPE) {

                let manyToOneField: ManyToOneReferenceDatatableField<any> = (field_datatable as ManyToOneReferenceDatatableField<any>);
                let options = this.getStoredDatas[manyToOneField.targetModuleTable.vo_type];

                if (!!manyToOneField.filterOptionsForUpdateOrCreateOnManyToOne) {
                    options = manyToOneField.filterOptionsForUpdateOrCreateOnManyToOne(vo, options);
                }

                if (options) {
                    field_datatable.setSelectOptionsEnabled(ObjectHandler.getInstance().arrayFromMap(options).map((elem) => elem.id));
                }
            }
        }
    }

    private updateDateRange(input: any) {
        // On veut stocker au format "day day"
        let start = this.field_value_range[this.field.datatable_field_uid + '_start'];
        let end = this.field_value_range[this.field.datatable_field_uid + '_end'];

        let res = "";
        if (start) {
            try {
                res += ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay(moment(start));
            } catch (error) {
                ConsoleHandler.getInstance().error(error);
            }
        }

        res += "-";

        if (end) {
            try {
                res += ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay(moment(end));
            } catch (error) {
                ConsoleHandler.getInstance().error(error);
            }
        }

        this.inputValue(res);
    }

    /**
     * Cas spécifique du FileVo sur lequel on a un champ fichier qui crée l'objet que l'on souhaite update ou create.
     * Si on est en cours d'update, il faut conserver l'ancien vo (pour maintenir les liaisons vers son id)
     *  et lui mettre en path le nouveau fichier. On garde aussi le nouveau file, pour archive de l'ancien fichier
     * @param fileVo
     */
    private async uploadedFile(fileVo: FileVO) {
        this.$emit('uploadedFile', this.vo, this.field, fileVo);
    }

    private async prepare_select_options() {
        if ((this.field.type == DatatableField.MANY_TO_ONE_FIELD_TYPE) ||
            (this.field.type == DatatableField.ONE_TO_MANY_FIELD_TYPE) ||
            (this.field.type == DatatableField.MANY_TO_MANY_FIELD_TYPE)) {
            let newOptions: number[] = [];

            let manyToOne: ReferenceDatatableField<any> = (this.field as ReferenceDatatableField<any>);

            // à voir si c'est un souci mais pour avoir une version toujours propre et complète des options....
            let options = VOsTypesManager.getInstance().vosArray_to_vosByIds(await ModuleDAO.getInstance().getVos(manyToOne.targetModuleTable.vo_type));
            this.storeDatasByIds({ API_TYPE_ID: manyToOne.targetModuleTable.vo_type, vos_by_ids: options });

            // let options = this.getStoredDatas[manyToOne.targetModuleTable.vo_type];

            if (this.field.type == DatatableField.MANY_TO_ONE_FIELD_TYPE) {
                let manyToOneField: ManyToOneReferenceDatatableField<any> = (this.field as ManyToOneReferenceDatatableField<any>);
                if (!!manyToOneField.filterOptionsForUpdateOrCreateOnManyToOne) {
                    options = manyToOneField.filterOptionsForUpdateOrCreateOnManyToOne(this.vo, options);
                }
            }

            for (let j in options) {
                let option = options[j];

                if (!this.field_select_options_enabled || this.field_select_options_enabled.indexOf(option.id) >= 0) {
                    newOptions.push(option.id);
                }
            }

            this.isLoadingOptions = false;
            this.select_options = newOptions;
            return;
        }

        if (this.field.type == DatatableField.SIMPLE_FIELD_TYPE) {
            let simpleField: SimpleDatatableField<any, any> = (this.field as SimpleDatatableField<any, any>);

            if (simpleField.moduleTableField.field_type == ModuleTableField.FIELD_TYPE_enum) {
                let newOptions: number[] = [];

                for (let j in simpleField.moduleTableField.enum_values) {
                    let id: number = parseInt(j.toString());

                    if ((!this.field_select_options_enabled) || (this.field_select_options_enabled.indexOf(id) >= 0)) {
                        newOptions.push(id);
                    }
                }
                this.isLoadingOptions = false;
                this.select_options = newOptions;
            }
        }
    }

    private async asyncLoadOptions(query) {
        this.isLoadingOptions = true;

        if ((!this.field) ||
            ((this.field.type != DatatableField.MANY_TO_ONE_FIELD_TYPE) &&
                (this.field.type != DatatableField.ONE_TO_MANY_FIELD_TYPE) &&
                (this.field.type != DatatableField.MANY_TO_MANY_FIELD_TYPE))) {
            this.snotify.warning(this.label('crud.multiselect.search.error'));
            this.isLoadingOptions = false;
            return;
        }

        let manyToOne: ReferenceDatatableField<any> = (this.field as ReferenceDatatableField<any>);

        // à voir si c'est un souci mais pour avoir une version toujours propre et complète des options....
        // let options = VOsTypesManager.getInstance().vosArray_to_vosByIds(await ModuleDAO.getInstance().getVos(manyToOne.targetModuleTable.vo_type));
        // this.storeDatasByIds({ API_TYPE_ID: manyToOne.targetModuleTable.vo_type, vos_by_ids: options });

        let options = this.getStoredDatas[manyToOne.targetModuleTable.vo_type];
        let newOptions: number[] = [];

        for (let i in options) {
            let option = options[i];

            if ((manyToOne.dataToHumanReadable(option)).match(new RegExp(query, 'i'))) {

                if (!this.field_select_options_enabled || this.field_select_options_enabled.indexOf(option.id) >= 0) {
                    newOptions.push(option.id);
                }
            }
        }

        this.isLoadingOptions = false;
        this.select_options = newOptions;
    }

    private asyncLoadEnumOptions(query) {
        this.isLoadingOptions = true;

        if ((!this.field) ||
            ((this.field.type != DatatableField.SIMPLE_FIELD_TYPE))) {
            this.snotify.warning(this.label('crud.multiselect.search.error'));
            this.isLoadingOptions = false;
            return;
        }

        let simpleField: SimpleDatatableField<any, any> = (this.field as SimpleDatatableField<any, any>);
        let newOptions: number[] = [];

        for (let i in simpleField.moduleTableField.enum_values) {

            if ((simpleField.enumIdToHumanReadable(parseInt(i))).match(new RegExp(query, 'i'))) {

                if (!this.field_select_options_enabled || this.field_select_options_enabled.indexOf(parseInt(i)) >= 0) {
                    newOptions.push(parseInt(i));
                }
            }
        }

        this.isLoadingOptions = false;
        this.select_options = newOptions;
    }

    private async onChangeField() {
        if (this.field.type == DatatableField.MANY_TO_ONE_FIELD_TYPE) {

            let manyToOneField: ManyToOneReferenceDatatableField<any> = (this.field as ManyToOneReferenceDatatableField<any>);

            // à voir si c'est un souci mais pour avoir une version toujours propre et complète des options....
            let options = VOsTypesManager.getInstance().vosArray_to_vosByIds(await ModuleDAO.getInstance().getVos(manyToOneField.targetModuleTable.vo_type));
            this.storeDatasByIds({ API_TYPE_ID: manyToOneField.targetModuleTable.vo_type, vos_by_ids: options });
            // let options = this.getStoredDatas[manyToOneField.targetModuleTable.vo_type];

            if (!!manyToOneField.filterOptionsForUpdateOrCreateOnManyToOne) {
                options = manyToOneField.filterOptionsForUpdateOrCreateOnManyToOne(this.vo, options);
            }

            let newOptions: number[] = [];
            for (let j in options) {
                let option = options[j];

                if (!this.field_select_options_enabled || this.field_select_options_enabled.indexOf(option.id) >= 0) {
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
            this.changeValue(this.vo, this.field, this.field_value, this.datatable);
        }
        this.$emit('changeValue', this.vo, this.field, this.field_value, this.datatable);
        this.$emit('onChangeVO', this.vo);

        if (this.field.onChange) {
            this.field.onChange(this.vo);
        }
    }

    private inputValue(value: any) {
        this.field_value = value;

        if (this.auto_update_field_value) {
            this.changeValue(this.vo, this.field, this.field_value, this.datatable);
        }
        this.$emit('changeValue', this.vo, this.field, this.field_value, this.datatable);
    }

    get is_custom_field_type(): boolean {
        return !!this.custom_field_types[this.field_type];
    }

    get custom_field_types(): { [name: string]: TableFieldTypeControllerBase } {
        return TableFieldTypesManager.getInstance().registeredTableFieldTypeControllers;
    }

    get segmentation_type(): number {
        if (this.field.type == 'Simple') {
            return (this.field as SimpleDatatableField<any, any>).moduleTableField.segmentation_type;
        }

        return null;
    }

    get field_type(): string {
        if (this.field.type == 'Simple') {
            return (this.field as SimpleDatatableField<any, any>).moduleTableField.field_type;
        }

        return this.field.type;
    }

    get random_number(): number {
        return Math.floor(Math.random() * 1000);
    }
}