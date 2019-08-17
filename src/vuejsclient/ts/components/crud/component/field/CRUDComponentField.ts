import * as moment from 'moment';
import { Component, Prop, Watch } from 'vue-property-decorator';
import FileVO from '../../../../../../shared/modules/File/vos/FileVO';
import ModuleFormatDatesNombres from '../../../../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';
import ModuleTableField from '../../../../../../shared/modules/ModuleTableField';
import TableFieldTypesManager from '../../../../../../shared/modules/TableFieldTypes/TableFieldTypesManager';
import TableFieldTypeControllerBase from '../../../../../../shared/modules/TableFieldTypes/vos/TableFieldTypeControllerBase';
import { ModuleDAOGetter } from '../../../dao/store/DaoStore';
import DatatableField from '../../../datatable/vos/DatatableField';
import ManyToOneReferenceDatatableField from '../../../datatable/vos/ManyToOneReferenceDatatableField';
import ReferenceDatatableField from '../../../datatable/vos/ReferenceDatatableField';
import SimpleDatatableField from '../../../datatable/vos/SimpleDatatableField';
import FileComponent from '../../../file/FileComponent';
import ImageComponent from '../../../image/ImageComponent';
import MultiInputComponent from '../../../multiinput/MultiInputComponent';
import VueComponentBase from '../../../VueComponentBase';
import CRUDComponentManager from '../../CRUDComponentManager';


@Component({
    template: require('./CRUDComponentField.pug'),
    components: {
        fileinput: FileComponent,
        imageinput: ImageComponent,
        multi_input: MultiInputComponent,
    }
})
export default class CRUDComponentField extends VueComponentBase {

    @ModuleDAOGetter
    public getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } };

    @Prop()
    private field: DatatableField<any, any>;

    @Prop()
    private vo: IDistantVOBase;

    @Prop()
    private default_field_data: any;

    @Prop({ default: null })
    private field_select_options_enabled: number[];

    private select_options: number[] = [];
    private isLoadingOptions: boolean = false;
    private field_value: any = null;
    private field_value_range: any = {};

    public async mounted() { }

    @Watch('field', { immediate: true })
    @Watch('vo', { immediate: true })
    @Watch('datatable', { immediate: true })
    @Watch('default_field_data', { immediate: true })
    @Watch('field_select_options_enabled', { immediate: true })
    private reload_field_value(): void {
        this.field_value = this.vo[this.field.datatable_field_uid];
        this.prepare_select_options();
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
                            case ModuleTableField.FIELD_TYPE_tstzrange_array:
                            case ModuleTableField.FIELD_TYPE_numrange_array:
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

        this.$emit('changeValue', this.vo, this.field, this.field_value);
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
            }
        }

        res += "-";

        if (end) {
            try {
                res += ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay(moment(end));
            } catch (error) {
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

    private prepare_select_options() {
        if ((this.field.type == DatatableField.MANY_TO_ONE_FIELD_TYPE) ||
            (this.field.type == DatatableField.ONE_TO_MANY_FIELD_TYPE) ||
            (this.field.type == DatatableField.MANY_TO_MANY_FIELD_TYPE)) {
            let newOptions: number[] = [];

            let manyToOne: ReferenceDatatableField<any> = (this.field as ReferenceDatatableField<any>);
            let options = this.getStoredDatas[manyToOne.targetModuleTable.vo_type];

            if (this.field.type == DatatableField.MANY_TO_ONE_FIELD_TYPE) {
                let manyToOneField: ManyToOneReferenceDatatableField<any> = (this.field as ManyToOneReferenceDatatableField<any>);
                if (!!manyToOneField.filterOptionsForUpdateOrCreateOnManyToOne) {
                    options = manyToOneField.filterOptionsForUpdateOrCreateOnManyToOne(null, options);
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

    private asyncLoadOptions(query) {
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
        let options = this.getStoredDatas[manyToOne.targetModuleTable.vo_type];
        let newOptions: number[] = [];

        for (let i in options) {
            let option = options[i];

            if (manyToOne.dataToHumanReadable(option).match(new RegExp(query, 'i'))) {

                if (!this.field_select_options_enabled || this.field_select_options_enabled.indexOf(option.id) >= 0) {
                    newOptions.push(option.id);
                }
            }
        }

        this.isLoadingOptions = false;
        this.select_options = newOptions;
    }

    private asyncLoadEnumOptions() {
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

            if (!this.field_select_options_enabled || this.field_select_options_enabled.indexOf(parseInt(i)) >= 0) {
                newOptions.push(parseInt(i));
            }
        }

        this.isLoadingOptions = false;
        this.select_options = newOptions;
    }

    private onChangeField() {
        if (this.field.type == DatatableField.MANY_TO_ONE_FIELD_TYPE) {

            let manyToOneField: ManyToOneReferenceDatatableField<any> = (this.field as ManyToOneReferenceDatatableField<any>);
            let options = this.getStoredDatas[manyToOneField.targetModuleTable.vo_type];

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

        this.$emit('changeValue', this.vo, this.field, this.field_value);
        this.$emit('onChangeVO', this.vo);

        if (this.field.onChange) {
            this.field.onChange(this.vo);
        }
    }

    private validateMultiInput(values: any[]) {
        this.$emit('validateMultiInput', values, this.field, this.vo);
    }

    private inputValue(value: any) {
        this.field_value = value;
        this.$emit('changeValue', this.vo, this.field, this.field_value);
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