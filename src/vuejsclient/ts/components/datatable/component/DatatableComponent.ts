import debounce from 'lodash/debounce';
import * as moment from 'moment';
import { Moment } from 'moment';
import { Component, Prop, Watch } from 'vue-property-decorator';
import { Event } from 'vue-tables-2';
import Datatable from '../../../../../shared/modules/DAO/vos/datatable/Datatable';
import DatatableField from '../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import ManyToManyReferenceDatatableField from '../../../../../shared/modules/DAO/vos/datatable/ManyToManyReferenceDatatableField';
import ManyToOneReferenceDatatableField from '../../../../../shared/modules/DAO/vos/datatable/ManyToOneReferenceDatatableField';
import OneToManyReferenceDatatableField from '../../../../../shared/modules/DAO/vos/datatable/OneToManyReferenceDatatableField';
import SimpleDatatableField from '../../../../../shared/modules/DAO/vos/datatable/SimpleDatatableField';
import ExportDataToXLSXParamVO from '../../../../../shared/modules/DataExport/vos/apis/ExportDataToXLSXParamVO';
import TimeSegment from '../../../../../shared/modules/DataRender/vos/TimeSegment';
import TSRange from '../../../../../shared/modules/DataRender/vos/TSRange';
import Dates from '../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleFormatDatesNombres from '../../../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import ModuleTableField from '../../../../../shared/modules/ModuleTableField';
import DefaultTranslation from '../../../../../shared/modules/Translation/vos/DefaultTranslation';
import VOsTypesManager from '../../../../../shared/modules/VOsTypesManager';
import DateHandler from '../../../../../shared/tools/DateHandler';
import RangeHandler from '../../../../../shared/tools/RangeHandler';
import TypesHandler from '../../../../../shared/tools/TypesHandler';
import AppVuexStoreManager from '../../../store/AppVuexStoreManager';
import { ModuleCRUDAction } from '../../crud/store/CRUDStore';
import { ModuleDAOAction, ModuleDAOGetter } from '../../dao/store/DaoStore';
import DaoStoreTypeWatcherDefinition from '../../dao/vos/DaoStoreTypeWatcherDefinition';
import VueComponentBase from '../../VueComponentBase';
import CustomFilterItem from './CustomFilterItem';
import './DatatableComponent.scss';
import DatatableRowController from './DatatableRowController';
import DatatableComponentField from './fields/DatatableComponentField';
import FileDatatableFieldComponent from './fields/file/file_datatable_field';

@Component({
    template: require('./DatatableComponent.pug'),
    components: {
        Filedatatablefieldcomponent: FileDatatableFieldComponent,
        Datatablecomponentfield: DatatableComponentField
    }
})
export default class DatatableComponent extends VueComponentBase {

    private static ACTIONS_COLUMN_TRANSLATABLE_CODE: string = "datatable.actions_column" + DefaultTranslation.DEFAULT_LABEL_EXTENSION;

    @ModuleDAOGetter
    public getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } };

    @ModuleDAOAction
    public registerTypeWatcher: (watcher: DaoStoreTypeWatcherDefinition) => void;

    @ModuleDAOAction
    public storeDatas: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void;

    @ModuleCRUDAction
    public setSelectedVOs: (selectedVOs: IDistantVOBase[]) => void;

    @Prop()
    private datatable: Datatable<IDistantVOBase>;

    @Prop({ default: false })
    private embed: boolean;
    @Prop({ default: true })
    private display_filters: boolean;
    @Prop({ default: null })
    private perpage: number;

    @Prop({ default: true })
    private load_datas: boolean;

    @Prop()
    private api_types_involved: string[];

    @Prop({ default: false })
    private update_button: boolean;

    @Prop({ default: false })
    private vocus_button: boolean;

    @Prop({ default: false })
    private delete_button: boolean;

    @Prop({ default: false })
    private multiselectable: boolean;

    @Prop({ default: false })
    private sort_id_descending: boolean;

    @Prop({ default: null })
    private embed_filter: { [field_id: string]: any };

    private allselected_chck: boolean = false;
    private selected_datas: { [id: number]: IDistantVOBase } = {};
    private loaded: boolean = false;

    private datatable_data: IDistantVOBase[] = [];

    // private preloadFilter: { [field_id: string]: any } = null;
    private custom_filters_values: { [field_id: string]: any } = {};
    private preload_custom_filters: string[] = [];
    private custom_filters_options: { [field_id: string]: any[] } = {};

    private exportable_datatable_data: any[] = [];

    private watcherLoaded: boolean = false;

    private debounced_update_datatable_data: () => Promise<void> = debounce(this.update_datatable_data, 500) as any as () => Promise<void>;

    get isModuleParamTable() {
        return VOsTypesManager.moduleTables_by_voType[this.datatable.API_TYPE_ID] ?
            VOsTypesManager.moduleTables_by_voType[this.datatable.API_TYPE_ID].isModuleParamTable : false;
    }

    public async mounted() {
        this.loadDatatable();

        // Activate tooltip
        $('[data-toggle="tooltip"]').tooltip();

        // Select/Deselect checkboxes
        var checkbox = $('table tbody input[type="checkbox"]');
        $("#selectAll").click(() => {
            if (this['checked']) {
                checkbox.each(() => {
                    this['checked'] = true;
                });
            } else {
                checkbox.each(() => {
                    this['checked'] = false;
                });
            }
        });
        checkbox.click(() => {
            if (!this['checked']) {
                $("#selectAll").prop("checked", false);
            }
        });
    }

    private handle_filters_preload() {

        this.custom_filters_values = {};
        this.preload_custom_filters = [];

        // En fait, on parcourt le type et pour chaque champ, si il existe en param un 'FILTER__' + field_id
        //  on l'utilise comme valeur par défaut pour le filtre correspondant
        // this.$route.query
        // this.preloadFilter = {};
        for (let i in this.datatable.fields) {
            let field: DatatableField<any, any> = this.datatable.fields[i];

            if ((field.type != DatatableField.SIMPLE_FIELD_TYPE) &&
                (field.type != DatatableField.MANY_TO_ONE_FIELD_TYPE) &&
                (field.type != DatatableField.ONE_TO_MANY_FIELD_TYPE) &&
                (field.type != DatatableField.MANY_TO_MANY_FIELD_TYPE) &&
                (field.type != DatatableField.REF_RANGES_FIELD_TYPE)) {
                continue;
            }

            for (let j in this.$route.query) {
                if (field.type == DatatableField.SIMPLE_FIELD_TYPE) {
                    let simpleField: SimpleDatatableField<any, any> = (field as SimpleDatatableField<any, any>);

                    switch (simpleField.moduleTableField.field_type) {
                        case ModuleTableField.FIELD_TYPE_boolean:
                            if (j == 'FILTER__' + field.datatable_field_uid) {

                                this.preload_custom_filters.push(field.datatable_field_uid);

                                this.custom_filters_values[field.datatable_field_uid] =
                                    (this.$route.query[j] == 'TRUE') ?
                                        this.custom_filters_options[field.datatable_field_uid][0] :
                                        this.custom_filters_options[field.datatable_field_uid][1];
                            }
                            continue;

                        case ModuleTableField.FIELD_TYPE_tstz:
                            switch (simpleField.moduleTableField.segmentation_type) {
                                case TimeSegment.TYPE_YEAR:
                                    if (simpleField.moduleTableField.segmentation_type == TimeSegment.TYPE_YEAR) {
                                        if (j == 'FILTER__' + field.datatable_field_uid) {

                                            this.preload_custom_filters.push(field.datatable_field_uid);

                                            this.custom_filters_values[field.datatable_field_uid] = this.$route.query[j];
                                        }
                                    }
                                    break;

                                default:
                                    if (j == 'FILTER__' + field.datatable_field_uid + '__START') {

                                        this.preload_custom_filters.push(field.datatable_field_uid);

                                        if (!this.custom_filters_values[field.datatable_field_uid]) {
                                            this.custom_filters_values[field.datatable_field_uid] = {};
                                        }
                                        this.custom_filters_values[field.datatable_field_uid].start = DateHandler.getInstance().formatDayForIndex(moment(this.$route.query[j]).utc(true).unix());
                                    }
                                    if (j == 'FILTER__' + field.datatable_field_uid + '__END') {

                                        this.preload_custom_filters.push(field.datatable_field_uid);

                                        if (!this.custom_filters_values[field.datatable_field_uid]) {
                                            this.custom_filters_values[field.datatable_field_uid] = {};
                                        }
                                        this.custom_filters_values[field.datatable_field_uid].end = DateHandler.getInstance().formatDayForIndex(moment(this.$route.query[j]).utc(true).unix());
                                    }
                                    break;
                            }
                            continue;

                        case ModuleTableField.FIELD_TYPE_date:
                        case ModuleTableField.FIELD_TYPE_daterange:
                        case ModuleTableField.FIELD_TYPE_tstzrange_array:
                        case ModuleTableField.FIELD_TYPE_day:
                        case ModuleTableField.FIELD_TYPE_month:
                        case ModuleTableField.FIELD_TYPE_tsrange:
                            if (j == 'FILTER__' + field.datatable_field_uid + '__START') {

                                this.preload_custom_filters.push(field.datatable_field_uid);

                                if (!this.custom_filters_values[field.datatable_field_uid]) {
                                    this.custom_filters_values[field.datatable_field_uid] = {};
                                }
                                this.custom_filters_values[field.datatable_field_uid].start = DateHandler.getInstance().formatDayForIndex(moment(this.$route.query[j]).utc(true).unix());
                            }
                            if (j == 'FILTER__' + field.datatable_field_uid + '__END') {

                                this.preload_custom_filters.push(field.datatable_field_uid);

                                if (!this.custom_filters_values[field.datatable_field_uid]) {
                                    this.custom_filters_values[field.datatable_field_uid] = {};
                                }
                                this.custom_filters_values[field.datatable_field_uid].end = DateHandler.getInstance().formatDayForIndex(moment(this.$route.query[j]).utc(true).unix());
                            }
                            continue;

                        case ModuleTableField.FIELD_TYPE_tstz_array:
                        // TODO ?
                    }
                }

                if (j == 'FILTER__' + field.datatable_field_uid) {

                    this.preload_custom_filters.push(field.datatable_field_uid);

                    if ((!!this.custom_filters_options) && (!!this.custom_filters_options[field.datatable_field_uid])) {
                        for (let k in this.custom_filters_options[field.datatable_field_uid]) {
                            let option_value = this.custom_filters_options[field.datatable_field_uid][k].value;

                            if (typeof option_value == 'string') {
                                option_value = option_value.trim();
                            }

                            if ((this.custom_filters_options[field.datatable_field_uid][k]) && (option_value == this.$route.query[j])) {
                                this.custom_filters_values[field.datatable_field_uid] = [this.custom_filters_options[field.datatable_field_uid][k]];
                            }
                        }
                    } else {
                        this.custom_filters_values[field.datatable_field_uid] = this.$route.query[j];
                    }
                }
            }

            // at the moment the "embed" CRUD doesn't handle all types of fields filtering
            if (!!this.embed_filter && !!this.embed_filter[field.datatable_field_uid]) {
                if (field.type == DatatableField.SIMPLE_FIELD_TYPE) {
                    let simpleField: SimpleDatatableField<any, any> = (field as SimpleDatatableField<any, any>);

                    switch (simpleField.moduleTableField.field_type) {
                        case ModuleTableField.FIELD_TYPE_date:
                        case ModuleTableField.FIELD_TYPE_daterange:
                        case ModuleTableField.FIELD_TYPE_tstzrange_array:
                        case ModuleTableField.FIELD_TYPE_day:
                        case ModuleTableField.FIELD_TYPE_month:
                        case ModuleTableField.FIELD_TYPE_tsrange:
                        case ModuleTableField.FIELD_TYPE_tstz:
                            if (!!this.embed_filter[field.datatable_field_uid].start) {

                                this.preload_custom_filters.push(field.datatable_field_uid);

                                if (!this.custom_filters_values[field.datatable_field_uid]) {
                                    this.custom_filters_values[field.datatable_field_uid] = {};
                                }
                                this.custom_filters_values[field.datatable_field_uid].start = DateHandler.getInstance().formatDayForIndex(moment(this.embed_filter[field.datatable_field_uid].start).utc(true).unix());
                            }
                            if (!!this.embed_filter[field.datatable_field_uid].end) {

                                this.preload_custom_filters.push(field.datatable_field_uid);

                                if (!this.custom_filters_values[field.datatable_field_uid]) {
                                    this.custom_filters_values[field.datatable_field_uid] = {};
                                }
                                this.custom_filters_values[field.datatable_field_uid].end = DateHandler.getInstance().formatDayForIndex(moment(this.embed_filter[field.datatable_field_uid].end).utc(true).unix());
                            }
                            continue;
                    }
                }

                if (field.type == DatatableField.SIMPLE_FIELD_TYPE) {
                    if (!this.custom_filters_values[field.datatable_field_uid]) {
                        this.custom_filters_values[field.datatable_field_uid] = [];
                    }
                    this.preload_custom_filters.push(field.datatable_field_uid);
                    this.custom_filters_values[field.datatable_field_uid] = this.embed_filter[field.datatable_field_uid].value;
                    continue;
                }

                if (!this.custom_filters_values[field.datatable_field_uid]) {
                    this.custom_filters_values[field.datatable_field_uid] = [];
                }
                this.preload_custom_filters.push(field.datatable_field_uid);
                this.custom_filters_values[field.datatable_field_uid].push(this.embed_filter[field.datatable_field_uid]);
            }
        }

        for (let i in this.date_filtered_fields) {
            if (this.custom_filters_values[this.date_filtered_fields[i].datatable_field_uid]) {
                continue;
            }

            this.custom_filters_values[this.date_filtered_fields[i].datatable_field_uid] = {
                start: null,
                end: null,
            };
        }
    }

    get api_type_id(): string {
        return this.datatable.API_TYPE_ID;
    }

    private get_export_params_for_xlsx(): ExportDataToXLSXParamVO {

        this.set_exportable_datatable_data();
        return new ExportDataToXLSXParamVO(
            "Export-" + this.datatable.API_TYPE_ID + ".xlsx",
            this.exportable_datatable_data,
            this.exportable_datatable_columns,
            this.datatable_columns_labels,
            this.datatable.API_TYPE_ID,
        );
    }

    private set_exportable_datatable_data(): any[] {
        this.exportable_datatable_data = [];

        for (let i in (this.$refs.vclienttable as any).allFilteredData) {

            let cloned_data = DatatableRowController.getInstance().get_exportable_datatable_row_data((this.$refs.vclienttable as any).allFilteredData[i], this.datatable, this.exportable_datatable_columns);
            if (!!cloned_data[DatatableRowController.MULTISELECT_COLUMN_ID]) {
                delete cloned_data[DatatableRowController.MULTISELECT_COLUMN_ID];
            }
            if (!!cloned_data[DatatableRowController.ACTIONS_COLUMN_ID]) {
                delete cloned_data[DatatableRowController.ACTIONS_COLUMN_ID];
            }

            this.exportable_datatable_data.push(cloned_data);
        }

        return this.exportable_datatable_data;
    }

    private selectVoForAction(vo_id: number, action: string) {
        let vo: IDistantVOBase = null;
        if (this.datatable && this.datatable.API_TYPE_ID && this.getStoredDatas && this.getStoredDatas[this.datatable.API_TYPE_ID] && this.getStoredDatas[this.datatable.API_TYPE_ID][vo_id]) {
            vo = this.getStoredDatas[this.datatable.API_TYPE_ID][vo_id];
        }
        this.setSelectedVOs([vo]);
        this.$emit('show-crud-modal', vo._type, action);
    }

    get exportable_datatable_columns(): string[] {
        let res: string[] = [];

        for (let i in this.datatable.fields) {
            let field: DatatableField<any, any> = this.datatable.fields[i];

            if (field.type == DatatableField.INPUT_FIELD_TYPE) {
                continue;
            }

            // On peut refuser l'export d'une colonne
            if (field.hiden_export) {
                continue;
            }

            res.push(field.datatable_field_uid);
        }

        return res;
    }

    get date_filtered_fields(): Array<DatatableField<any, any>> {
        let res: Array<DatatableField<any, any>> = [];

        for (let i in this.datatable.fields) {
            let field = this.datatable.fields[i];

            if (field.type == DatatableField.SIMPLE_FIELD_TYPE) {
                let simpleField: SimpleDatatableField<any, any> = (field as SimpleDatatableField<any, any>);

                switch (simpleField.moduleTableField.field_type) {

                    case ModuleTableField.FIELD_TYPE_tstz:
                        if (simpleField.moduleTableField.segmentation_type == TimeSegment.TYPE_YEAR) {
                            break;
                        }

                    case ModuleTableField.FIELD_TYPE_date:
                    case ModuleTableField.FIELD_TYPE_daterange:
                    case ModuleTableField.FIELD_TYPE_tstzrange_array:
                    case ModuleTableField.FIELD_TYPE_day:
                    case ModuleTableField.FIELD_TYPE_month:
                    case ModuleTableField.FIELD_TYPE_tsrange:
                        res.push(field);
                        break;

                    case ModuleTableField.FIELD_TYPE_tstz_array:
                    //TODO ?
                    default:
                }

            }
        }

        return res;
    }

    get number_filtered_fields(): Array<DatatableField<any, any>> {
        let res: Array<DatatableField<any, any>> = [];

        for (let i in this.datatable.fields) {
            let field = this.datatable.fields[i];

            if (field.type == DatatableField.SIMPLE_FIELD_TYPE) {
                let simpleField: SimpleDatatableField<any, any> = (field as SimpleDatatableField<any, any>);

                switch (simpleField.moduleTableField.field_type) {

                    case ModuleTableField.FIELD_TYPE_tstz:
                        if (simpleField.moduleTableField.segmentation_type == TimeSegment.TYPE_YEAR) {
                            res.push(field);
                        }
                        break;

                    case ModuleTableField.FIELD_TYPE_amount:
                    case ModuleTableField.FIELD_TYPE_float:
                    case ModuleTableField.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableField.FIELD_TYPE_int:
                    case ModuleTableField.FIELD_TYPE_prct:
                        res.push(field);
                        break;

                    case ModuleTableField.FIELD_TYPE_tstz_array:
                    //TODO ?
                    default:
                }

            }
        }

        return res;
    }

    get text_filtered_fields(): Array<DatatableField<any, any>> {
        let res: Array<DatatableField<any, any>> = [];

        for (let i in this.datatable.fields) {
            let field = this.datatable.fields[i];

            if (field.type == DatatableField.SIMPLE_FIELD_TYPE) {
                let simpleField = (field as SimpleDatatableField<any, any>);

                switch (simpleField.moduleTableField.field_type) {
                    case ModuleTableField.FIELD_TYPE_tstz:
                        if (simpleField.moduleTableField.segmentation_type == TimeSegment.TYPE_YEAR) {
                            break;
                        }

                    case ModuleTableField.FIELD_TYPE_boolean:
                    case ModuleTableField.FIELD_TYPE_date:
                    case ModuleTableField.FIELD_TYPE_daterange:
                    case ModuleTableField.FIELD_TYPE_tstzrange_array:
                    case ModuleTableField.FIELD_TYPE_day:
                    case ModuleTableField.FIELD_TYPE_month:
                    case ModuleTableField.FIELD_TYPE_enum:
                    case ModuleTableField.FIELD_TYPE_html:
                    case ModuleTableField.FIELD_TYPE_html_array:
                    case ModuleTableField.FIELD_TYPE_tstz_array:
                    case ModuleTableField.FIELD_TYPE_tsrange:
                        //TODO ?
                        continue;
                }
            }
            if (field.type == DatatableField.MANY_TO_ONE_FIELD_TYPE) {
                continue;
            }
            if (field.type == DatatableField.ONE_TO_MANY_FIELD_TYPE) {
                continue;
            }
            if (field.type == DatatableField.MANY_TO_MANY_FIELD_TYPE) {
                continue;
            }
            if (field.type == DatatableField.REF_RANGES_FIELD_TYPE) {
                continue;
            }
            if (field.type == DatatableField.INPUT_FIELD_TYPE) {
                continue;
            }
            if (field.type == DatatableField.COMPONENT_FIELD_TYPE) {
                continue;
            }
            if (field.type == DatatableField.FILE_FIELD_TYPE) {
                continue;
            }
            res.push(field);
        }

        return res;
    }

    get multiselect_filtered_fields(): Array<DatatableField<any, any>> {
        let res: Array<DatatableField<any, any>> = [];

        for (let i in this.datatable.fields) {
            let field = this.datatable.fields[i];

            switch (field.type) {
                case DatatableField.SIMPLE_FIELD_TYPE:
                    let simpleField = (field as SimpleDatatableField<any, any>);
                    if (simpleField.moduleTableField.field_type == ModuleTableField.FIELD_TYPE_enum) {
                        res.push(field);
                    }
                    break;

                case DatatableField.MANY_TO_ONE_FIELD_TYPE:
                case DatatableField.ONE_TO_MANY_FIELD_TYPE:
                case DatatableField.MANY_TO_MANY_FIELD_TYPE:
                case DatatableField.REF_RANGES_FIELD_TYPE:
                    res.push(field);
                    break;
            }
        }

        return res;
    }

    get boolean_filtered_fields(): Array<DatatableField<any, any>> {
        let res: Array<DatatableField<any, any>> = [];

        for (let i in this.datatable.fields) {
            let field = this.datatable.fields[i];

            if ((field.type == DatatableField.SIMPLE_FIELD_TYPE) &&
                ((field as SimpleDatatableField<any, any>).moduleTableField.field_type == ModuleTableField.FIELD_TYPE_boolean)) {
                res.push(field);
            }
        }

        return res;
    }

    private setBooleanFilterOptions(datatable_field_uid: string) {
        this.custom_filters_options[datatable_field_uid] = [
            new CustomFilterItem(this.t('YES'), true, datatable_field_uid, 1),
            new CustomFilterItem(this.t('NO'), false, datatable_field_uid, 0)
        ];
    }

    private setMultiSelectFilterOptions(datatable_field: DatatableField<any, any>) {

        this.custom_filters_options[datatable_field.datatable_field_uid] = this.getMultiSelectFilterOptions(datatable_field);
    }

    private getMultiSelectFilterOptions(datatable_field: DatatableField<any, any>): CustomFilterItem[] {

        let res: CustomFilterItem[] = [];

        // console.info('setMultiSelectFilterOptions: ' + datatable_field.datatable_field_uid);

        let field_values: { [id: number]: any } = {};

        for (let i in this.datatable_data) {
            let data = this.datatable_data[i];
            let field_value = data[datatable_field.datatable_field_uid];
            let field_value_id = data[datatable_field.datatable_field_uid + '___id___'];

            switch (datatable_field.type) {
                case DatatableField.SIMPLE_FIELD_TYPE:
                    let simpleField = (datatable_field as SimpleDatatableField<any, any>);
                    if (simpleField.moduleTableField.field_type == ModuleTableField.FIELD_TYPE_enum) {

                        for (let j in simpleField.moduleTableField.enum_values) {
                            let enum_value = simpleField.moduleTableField.enum_values[j];

                            res.push(new CustomFilterItem(
                                this.t(enum_value),
                                this.t(enum_value),
                                datatable_field.datatable_field_uid,
                                parseInt(j),
                            ));
                        }
                        return res;
                    }
                case DatatableField.MANY_TO_ONE_FIELD_TYPE:
                    if (!field_values[field_value_id]) {
                        field_values[field_value_id] = field_value;
                    }
                    break;
                case DatatableField.MANY_TO_MANY_FIELD_TYPE:
                case DatatableField.ONE_TO_MANY_FIELD_TYPE:

                    if ((!field_value) || (!field_value.length)) {
                        break;
                    }

                    for (let j in field_value) {
                        let field_value_vo: IDistantVOBase = field_value[j];

                        if (!field_values[field_value_vo.id]) {
                            field_values[field_value_vo.id] = field_value_vo;
                        }
                    }
                    break;
                case DatatableField.REF_RANGES_FIELD_TYPE:

                    if ((!field_value) || (!field_value.length)) {
                        break;
                    }

                    RangeHandler.foreach_ranges_sync(field_value, (id: number) => {
                        if (!field_values[id]) {
                            field_values[id] = id.toString();
                        }
                    });
                    break;
            }
        }

        for (let id in field_values) {
            let field_value = field_values[id];

            switch (datatable_field.type) {
                case ManyToOneReferenceDatatableField.REF_RANGES_FIELD_TYPE:
                case OneToManyReferenceDatatableField.MANY_TO_ONE_FIELD_TYPE:
                    res.push(new CustomFilterItem(
                        (field_value && field_value != '') ? field_value : '-',
                        field_value,
                        datatable_field.datatable_field_uid,
                        parseInt(id),
                    ));
                    break;
                case ManyToOneReferenceDatatableField.MANY_TO_MANY_FIELD_TYPE:
                case ManyToManyReferenceDatatableField.ONE_TO_MANY_FIELD_TYPE:

                    res.push(new CustomFilterItem(
                        (field_value && field_value != '') ? field_value.label : '-',
                        field_value.id,
                        datatable_field.datatable_field_uid,
                        parseInt(id),
                    ));
                    break;
            }
        }

        res.sort((a: CustomFilterItem, b: CustomFilterItem) => {
            if (a.label < b.label) {
                return -1;
            }
            if (a.label > b.label) {
                return 1;
            }
            return 0;
        });

        return res;
    }

    private changeTextFilterValue(datatable_field_uid: string) {
        Event.$emit('vue-tables.filter::' + datatable_field_uid,
            this.custom_filters_values[datatable_field_uid] ? this.custom_filters_values[datatable_field_uid] : false);
    }

    private changeBooleanFilterValue(datatable_field_uid: string) {
        // Impossible d'envoyer un event avec une valeur false (donc false, 0, ...) car sinon c'est comme supprimer le filtre
        Event.$emit('vue-tables.filter::' + datatable_field_uid,
            this.custom_filters_values[datatable_field_uid] ? (this.custom_filters_values[datatable_field_uid].value ? "VRAI" : "FAUX") : false);
    }

    @Watch('$route')
    private onRouteChange() {
        AppVuexStoreManager.getInstance().appVuexStore.commit('PRINT_ENABLE');
        AppVuexStoreManager.getInstance().appVuexStore.dispatch('register_hook_export_data_to_XLSX', this.get_export_params_for_xlsx);
    }

    @Watch('embed_filter', { immediate: true, deep: true })
    private async onFilterChange() {
        if (!!this.embed_filter) {
            await this.debounced_update_datatable_data();
        }
    }

    @Watch('custom_filters_values', { deep: true })
    private onChangeFilterValue() {
        for (let i in this.datatable.fields) {
            let field = this.datatable.fields[i];
            if (field.type == DatatableField.SIMPLE_FIELD_TYPE) {
                let simpleField: SimpleDatatableField<any, any> = field as SimpleDatatableField<any, any>;

                switch (simpleField.moduleTableField.field_type) {
                    case ModuleTableField.FIELD_TYPE_boolean:
                        this.changeBooleanFilterValue(field.datatable_field_uid);
                        break;

                    case ModuleTableField.FIELD_TYPE_daterange:
                    case ModuleTableField.FIELD_TYPE_tstz:
                    case ModuleTableField.FIELD_TYPE_tstzrange_array:
                    case ModuleTableField.FIELD_TYPE_date:
                    case ModuleTableField.FIELD_TYPE_day:
                    case ModuleTableField.FIELD_TYPE_month:
                    case ModuleTableField.FIELD_TYPE_tsrange:
                    case ModuleTableField.FIELD_TYPE_tstz_array:
                    //TODO ?
                    default:
                        this.changeTextFilterValue(field.datatable_field_uid);
                }
            } else {
                this.changeTextFilterValue(field.datatable_field_uid);
            }
        }
    }

    private setWatcher(api_type_involved: string) {
        let watcher: DaoStoreTypeWatcherDefinition = new DaoStoreTypeWatcherDefinition();
        watcher.UID = this.api_type_id + "___datatable___" + api_type_involved;
        watcher.API_TYPE_ID = api_type_involved;
        watcher.handler = this.debounced_update_datatable_data;
        this.registerTypeWatcher(watcher);
    }

    @Watch('datatable')
    private loadDatatable() {
        this.selected_datas = {};
        this.loaded = false;

        this.onRouteChange();

        this.loaded = true;

        this.update_datatable_data();

        for (let i in this.api_types_involved) {
            this.setWatcher(this.api_types_involved[i]);
        }
    }

    /**
     * Obj, on stock dans un cache qu'on renvoie les datas liées par les champs de ref.
     */
    private prepare_ref_fields_data_for_update(): { [datatable_field_uid: string]: { [baseData_id: number]: { [dest_id: number]: IDistantVOBase } } } {

        let res: { [datatable_field_uid: string]: { [baseData_id: number]: { [dest_id: number]: IDistantVOBase } } } = {};

        for (let i in this.datatable.fields) {
            let field: DatatableField<any, any> = this.datatable.fields[i];

            switch (field.type) {

                case DatatableField.COMPUTED_FIELD_TYPE:
                case DatatableField.COMPONENT_FIELD_TYPE:
                case DatatableField.SIMPLE_FIELD_TYPE:
                case DatatableField.FILE_FIELD_TYPE:
                    break;

                case DatatableField.REF_RANGES_FIELD_TYPE:
                case DatatableField.MANY_TO_ONE_FIELD_TYPE:
                    // très simple, on a pas besoin d'un cache
                    break;

                case DatatableField.ONE_TO_MANY_FIELD_TYPE:
                    let oneToManyField: OneToManyReferenceDatatableField<any> = (field) as OneToManyReferenceDatatableField<any>;

                    for (let oneToManyTargetId in this.getStoredDatas[oneToManyField.targetModuleTable.vo_type]) {
                        let targetVo = this.getStoredDatas[oneToManyField.targetModuleTable.vo_type][oneToManyTargetId];

                        if ((!!targetVo) && (!!targetVo[oneToManyField.destField.field_id])) {

                            let baseData_id = targetVo[oneToManyField.destField.field_id];

                            if (!res[field.datatable_field_uid]) {
                                res[field.datatable_field_uid] = {};
                            }

                            if (!res[field.datatable_field_uid][baseData_id]) {
                                res[field.datatable_field_uid][baseData_id] = {};
                            }

                            res[field.datatable_field_uid][baseData_id][targetVo.id] = targetVo;
                        }
                    }
                    break;

                case DatatableField.MANY_TO_MANY_FIELD_TYPE:
                    let manyToManyField: ManyToManyReferenceDatatableField<any, any> = (field) as ManyToManyReferenceDatatableField<any, any>;

                    let dest_ids: number[] = [];
                    let interTargetRefField = manyToManyField.interTargetRefFieldId ? manyToManyField.interModuleTable.getFieldFromId(manyToManyField.interTargetRefFieldId) : manyToManyField.interModuleTable.getRefFieldFromTargetVoType(manyToManyField.targetModuleTable.vo_type);
                    let interSrcRefField = manyToManyField.interSrcRefFieldId ? manyToManyField.interModuleTable.getFieldFromId(manyToManyField.interSrcRefFieldId) : manyToManyField.interModuleTable.getRefFieldFromTargetVoType(manyToManyField.moduleTable.vo_type);

                    for (let interi in this.getStoredDatas[manyToManyField.interModuleTable.vo_type]) {
                        let intervo = this.getStoredDatas[manyToManyField.interModuleTable.vo_type][interi];

                        if ((!!intervo) && (!!intervo[interSrcRefField.field_id]) && (dest_ids.indexOf(intervo[interTargetRefField.field_id]) < 0)) {

                            let baseData_id = intervo[interSrcRefField.field_id];

                            if (!res[field.datatable_field_uid]) {
                                res[field.datatable_field_uid] = {};
                            }

                            if (!res[field.datatable_field_uid][baseData_id]) {
                                res[field.datatable_field_uid][baseData_id] = {};
                            }

                            res[field.datatable_field_uid][baseData_id][intervo[interTargetRefField.field_id]] = this.getStoredDatas[manyToManyField.targetModuleTable.vo_type][intervo[interTargetRefField.field_id]];
                        }
                    }
                    break;

                // case DatatableField.REF_RANGES_FIELD_TYPE:
                //     let refField: RefRangesReferenceDatatableField<any> = (field) as RefRangesReferenceDatatableField<any>;

                //     RangeHandler.foreach_ranges_sync()
                //     let dest_ids: number[] = [];
                //     let interTargetRefField = refField.interModuleTable.getRefFieldFromTargetVoType(refField.targetModuleTable.vo_type);
                //     let interSrcRefField = refField.interModuleTable.getRefFieldFromTargetVoType(refField.moduleTable.vo_type);

                //     for (let interi in this.getStoredDatas[refField.interModuleTable.vo_type]) {
                //         let intervo = this.getStoredDatas[refField.interModuleTable.vo_type][interi];

                //         if ((!!intervo) && (!!intervo[interSrcRefField.field_id]) && (dest_ids.indexOf(intervo[interTargetRefField.field_id]) < 0)) {

                //             let baseData_id = intervo[interSrcRefField.field_id];

                //             if (!res[field.datatable_field_uid]) {
                //                 res[field.datatable_field_uid] = {};
                //             }

                //             if (!res[field.datatable_field_uid][baseData_id]) {
                //                 res[field.datatable_field_uid][baseData_id] = {};
                //             }

                //             res[field.datatable_field_uid][baseData_id][intervo[interTargetRefField.field_id]] = this.getStoredDatas[refField.targetModuleTable.vo_type][intervo[interTargetRefField.field_id]];
                //         }
                //     }
                //     break;

                default:
                    break;
            }
        }

        return res;
    }

    private update_datatable_data() {

        if (!this.loaded) {
            return;
        }

        // Stocker la data suivant le type dans le store et renvoyer la valeur du store (comme ça on impact les modifs en live)
        // Comment on gère des types de données, qui ne seraient pas exactement issues de la base (comme le nom de la boutique liée au lieu de l'id ???)
        // Comment on gère le filtrage des colonnes sur ces types de données (car on veut voir un sous ensemble de colonne)

        // On commence par charger la liste des données concernées
        // Un getter du store qui renvoie les datas de base, version distant vo et on va chercher ensuite tous les fields utiles, et les refs
        let baseDatas_byid: { [id: number]: IDistantVOBase } = this.getStoredDatas[this.datatable.API_TYPE_ID];
        let baseDatas: IDistantVOBase[] = [];

        if (!!this.datatable.data_set_hook) {
            baseDatas = this.datatable.data_set_hook(baseDatas_byid);
        }

        this.datatable_data = [];

        let prepared_ref_fields_data_for_update: { [datatable_field_uid: string]: { [baseData_id: number]: { [dest_id: number]: IDistantVOBase } } } = this.prepare_ref_fields_data_for_update();

        for (let j in baseDatas) {
            let baseData: IDistantVOBase = baseDatas[j];

            let resData: IDistantVOBase = DatatableRowController.getInstance().get_datatable_row_data(baseData, this.datatable, this.getStoredDatas, prepared_ref_fields_data_for_update);

            // Les colonnes de contrôle
            if (this.multiselectable) {
                if (this.selected_datas && this.selected_datas[baseData.id]) {
                    resData[DatatableRowController.MULTISELECT_COLUMN_ID] = true;
                } else {
                    resData[DatatableRowController.MULTISELECT_COLUMN_ID] = false;
                }
            }

            // TODO en fait on peut vérifier suivant les droits en édition sur ce vo...
            if (this.vocus_button || this.update_button || this.delete_button) {
                resData[DatatableRowController.ACTIONS_COLUMN_ID] = true;
            }

            this.datatable_data.push(resData);
        }

        this.initializeFilters();
    }

    private initializeFilters() {

        // On initialize les options des filtres
        for (let i in this.boolean_filtered_fields) {
            this.setBooleanFilterOptions(this.boolean_filtered_fields[i].datatable_field_uid);
        }
        for (let i in this.multiselect_filtered_fields) {
            this.setMultiSelectFilterOptions(this.multiselect_filtered_fields[i]);
        }

        this.handle_filters_preload();

        this.onChangeFilterValue();
    }

    get datatable_columns_labels(): any {
        let res: any = {};

        for (let i in this.datatable.fields) {
            let field: DatatableField<any, any> = this.datatable.fields[i];
            res[field.datatable_field_uid] = this.t(field.translatable_title);
        }

        // On ajoute les colonnes de contrôle
        if (this.multiselectable) {
            res[DatatableRowController.MULTISELECT_COLUMN_ID] = null;
        }

        if (this.vocus_button || this.update_button || this.delete_button) {
            res[DatatableRowController.ACTIONS_COLUMN_ID] = this.t(DatatableComponent.ACTIONS_COLUMN_TRANSLATABLE_CODE);
        }

        return res;
    }

    get datatable_columns(): string[] {
        let res: string[] = [];

        // On ajoute les colonnes de contrôle
        if (this.multiselectable && !this.isModuleParamTable) {
            res.push(DatatableRowController.MULTISELECT_COLUMN_ID);
        }
        if (this.vocus_button || this.update_button || this.delete_button) {
            res.push(DatatableRowController.ACTIONS_COLUMN_ID);
        }

        for (let i in this.datatable.fields) {
            let field: DatatableField<any, any> = this.datatable.fields[i];

            if (field.type == DatatableField.INPUT_FIELD_TYPE) {
                continue;
            }

            if (field.hidden) {
                continue;
            }
            // if (field.type == DatatableField.SIMPLE_FIELD_TYPE) {
            //     let simpleField: SimpleDatatableField<any, any> = this.datatable.fields[i] as SimpleDatatableField<any, any>;

            //     if (simpleField.moduleTableField.field_type == ModuleTableField.FIELD_TYPE_html) {
            //         continue;
            //     }
            // }

            res.push(field.datatable_field_uid);
        }

        return res;
    }

    get customFilters(): any[] {
        let customFilters: any[] = [];
        let self = this;

        if (this.isModuleParamTable) {
            return customFilters;
        }

        for (let j in this.datatable.fields) {
            let field = this.datatable.fields[j];

            if (field.type == DatatableField.COMPONENT_FIELD_TYPE) {
                continue;
            }

            if (field.type == DatatableField.FILE_FIELD_TYPE) {
                continue;
            }

            customFilters.push({
                name: field.datatable_field_uid,
                callback: function (row, query) {
                    switch (field.type) {
                        case DatatableField.SIMPLE_FIELD_TYPE:
                            let simpleField: SimpleDatatableField<any, any> = field as SimpleDatatableField<any, any>;

                            switch (simpleField.moduleTableField.field_type) {
                                case ModuleTableField.FIELD_TYPE_boolean:

                                    if ((query == null) || (typeof query == 'undefined')) {
                                        return true;
                                    }

                                    let istrue: boolean = (query == 'VRAI');

                                    let data_is_true = (!!row[field.datatable_field_uid]) && ((row[field.datatable_field_uid] == 'true') || (TypesHandler.getInstance().isBoolean(row[field.datatable_field_uid])));
                                    return (data_is_true && istrue) || ((!data_is_true) && !istrue);

                                case ModuleTableField.FIELD_TYPE_daterange:
                                case ModuleTableField.FIELD_TYPE_tstzrange_array:
                                    if ((!query) || ((!query.start) && (!query.end))) {
                                        return true;
                                    }

                                    let daterange_array = null;
                                    if (simpleField.moduleTableField.field_type == ModuleTableField.FIELD_TYPE_daterange) {
                                        daterange_array = [row[field.datatable_field_uid]];
                                    } else {
                                        daterange_array = row[field.datatable_field_uid].split(', ');
                                    }

                                    for (let i in daterange_array) {
                                        let daterange = daterange_array[i];

                                        let parts: string[] = daterange.split('-');
                                        if ((!parts) || (parts.length <= 0)) {
                                            continue;
                                        }

                                        let dateStart: Moment = null;
                                        let dateEnd: Moment = null;
                                        if (parts[0] && parts[0].trim() && (parts[0].trim() != "")) {
                                            dateStart = ModuleFormatDatesNombres.getInstance().getMomentFromFormatted_FullyearMonthDay(parts[0].trim());
                                        }
                                        if (parts[1] && parts[1].trim() && (parts[1].trim() != "")) {
                                            dateEnd = ModuleFormatDatesNombres.getInstance().getMomentFromFormatted_FullyearMonthDay(parts[1].trim());
                                        }

                                        let queryStart = moment(query.start).utc(true);
                                        let queryEnd = moment(query.end).utc(true);
                                        if (((!query.start) || (!dateEnd) || (!dateEnd.isBefore(queryStart))) && ((!query.end) || (!dateStart) || (!dateStart.isAfter(queryEnd)))) {
                                            return true;
                                        }
                                    }

                                    return false;

                                case ModuleTableField.FIELD_TYPE_tstz:
                                    if (simpleField.moduleTableField.segmentation_type == TimeSegment.TYPE_YEAR) {
                                        if (!query) {
                                            return true;
                                        }
                                        return ((!!row[field.datatable_field_uid]) && row[field.datatable_field_uid].toString().indexOf(query.toString()) >= 0);
                                    }

                                    if ((!query) || ((!query.start) && (!query.end))) {
                                        return true;
                                    }
                                    let date_tstz: number = self.getStoredDatas[self.datatable.API_TYPE_ID][row['id']][field.datatable_field_uid];

                                    let queryStart_tstz: Moment = moment(query.start).utc(true);
                                    let queryEnd_tstz: Moment = moment(query.end).utc(true);

                                    if (((queryStart_tstz && queryStart_tstz.isValid()) || (queryEnd_tstz && queryEnd_tstz.isValid())) && (date_tstz == null)) {
                                        return false;
                                    }
                                    if (queryStart_tstz && queryStart_tstz.isValid() && (date_tstz < queryStart_tstz.unix())) {
                                        return false;
                                    }
                                    if (queryEnd_tstz && queryEnd_tstz.isValid() && (date_tstz > queryEnd_tstz.unix())) {
                                        return false;
                                    }
                                    return true;

                                case ModuleTableField.FIELD_TYPE_date:
                                case ModuleTableField.FIELD_TYPE_day:
                                    if ((!query) || ((!query.start) && (!query.end))) {
                                        return true;
                                    }

                                    let date: Moment = ModuleFormatDatesNombres.getInstance().getMomentFromFormatted_FullyearMonthDay(row[field.datatable_field_uid]);

                                    let queryStart_date = moment(query.start).utc(true);
                                    let queryEnd_date = moment(query.end).utc(true);

                                    if (((queryStart_date && queryStart_date.isValid()) || (queryEnd_date && queryEnd_date.isValid())) && ((!date) || (!date.isValid()))) {
                                        return false;
                                    }
                                    if (queryStart_date && queryStart_date.isValid() && date.isBefore(queryStart_date)) {
                                        return false;
                                    }
                                    if (queryEnd_date && queryEnd_date.isValid() && date.isAfter(queryEnd_date)) {
                                        return false;
                                    }

                                    return true;

                                case ModuleTableField.FIELD_TYPE_month:
                                    if ((!query) || ((!query.start) && (!query.end))) {
                                        return true;
                                    }

                                    date = moment(row[field.datatable_field_uid], 'MMM YYYY').utc(true);
                                    let queryStart_month = moment(query.start).utc(true);
                                    if (query.start && date.isBefore(queryStart_month)) {
                                        return false;
                                    }

                                    let queryEnd_month = moment(query.end).utc(true);
                                    if (query.end && date.isAfter(queryEnd_month)) {
                                        return false;
                                    }

                                    return true;

                                case ModuleTableField.FIELD_TYPE_tsrange:
                                    if ((!query) || ((!query.start) && (!query.end))) {
                                        return true;
                                    }

                                    let tsrange: TSRange = self.getStoredDatas[self.datatable.API_TYPE_ID][row['id']][field.datatable_field_uid];

                                    if (!tsrange) {
                                        return false;
                                    }

                                    let is_ok: boolean = false;

                                    if (query.start && query.start.length > 0) {
                                        if (RangeHandler.elt_intersects_range(moment(query.start).utc(true).unix(), tsrange)) {
                                            is_ok = true;
                                        }
                                    }

                                    if (query.end && query.end.length > 0) {
                                        if (RangeHandler.elt_intersects_range(moment(query.end).utc(true).unix(), tsrange)) {
                                            is_ok = true;
                                        }
                                    }

                                    return is_ok;

                                case ModuleTableField.FIELD_TYPE_enum:
                                    if ((!query) || (!query.length)) {
                                        return true;
                                    }

                                    for (let i in query) {
                                        if (query[i].value == row[field.datatable_field_uid]) {
                                            return true;
                                        }
                                    }
                                    return false;

                                case ModuleTableField.FIELD_TYPE_tstz_array:
                                //TODO ?
                                default:
                                    if (!query) {
                                        return true;
                                    }

                                    if (row[field.datatable_field_uid] && ((row[field.datatable_field_uid].toString().toLowerCase()).indexOf(query.toLowerCase()) >= 0)) {
                                        return true;
                                    }
                                    return false;
                            }

                        case DatatableField.MANY_TO_ONE_FIELD_TYPE:
                            if ((!query) || (!query.length)) {
                                return true;
                            }

                            for (let i in query) {
                                if (query[i].value == row[field.datatable_field_uid]) {
                                    return true;
                                }
                            }
                            return false;

                        case DatatableField.REF_RANGES_FIELD_TYPE:
                        case DatatableField.MANY_TO_MANY_FIELD_TYPE:
                        case DatatableField.ONE_TO_MANY_FIELD_TYPE:
                            if ((!query) || (!query.length)) {
                                return true;
                            }

                            if ((!row[field.datatable_field_uid]) || (!row[field.datatable_field_uid].length)) {
                                return false;
                            }

                            for (let i in query) {

                                for (let k in row[field.datatable_field_uid]) {
                                    if (row[field.datatable_field_uid][k].id == query[i].value) {
                                        return true;
                                    }
                                }
                            }
                            return false;

                        case DatatableField.COMPUTED_FIELD_TYPE:
                            if (!query) {
                                return true;
                            }

                            if (row[field.datatable_field_uid] && ((row[field.datatable_field_uid].toString().toLowerCase()).indexOf(query.toLowerCase()) >= 0)) {
                                return true;
                            }
                            return false;

                        case DatatableField.COMPONENT_FIELD_TYPE:
                            return false;

                        case DatatableField.FILE_FIELD_TYPE:
                            return false;

                        default:
                            return false;
                    }
                }
            });
        }
        return customFilters;
    }

    get columnsClasses(): { [field_id: string]: string } {
        let res: { [field_id: string]: string } = {};

        for (let i in this.datatable.fields) {
            let field: DatatableField<any, any> = this.datatable.fields[i];

            let class_name: string[] = ['field_' + field.datatable_field_uid];

            if (field.hidden_print) {
                class_name.push('hidden-print');
            }

            res[field.datatable_field_uid] = class_name.join(' ');
        }

        return res;
    }

    get datatable_options(): any {
        // if (!this.preloadFilter) {
        //     this.handle_filters_preload();
        // }

        return {
            columnsClasses: this.columnsClasses,
            filterByColumn: true,
            filterable: [],
            perPage: (!!this.perpage) ? this.perpage : 15,
            perPageValues: [],
            // initFilters: this.preloadFilter,
            customFilters: this.customFilters,
            // footerHeadings: true,
            texts: {
                count: this.label('datatable.count').replace(/###/g, '{').replace(/-##/g, '}'),
                first: this.label('datatable.first'),
                last: this.label('datatable.last'),
                filter: this.label('datatable.filter'),
                filterPlaceholder: this.label('datatable.filter_place_holder'),
                limit: this.label('datatable.limit'),
                page: this.label('datatable.page'),
                noResults: this.label('datatable.no_results'),
                filterBy: this.label('datatable.filter_by').replace(/###/g, '{').replace(/-##/g, '}'),
                loading: this.label('datatable.loading'),
                defaultOption: this.label('datatable.default_option').replace(/###/g, '{').replace(/-##/g, '}'),
                columns: this.label('datatable.columns')
            },
            pagination: { edge: true },
            headings: this.datatable_columns_labels,
            skin: 'table-striped table-hover',
            customSorting: this.customSorting,
            orderBy: {
                column: 'id',
                ascending: (this.sort_id_descending) ? false : true
            }
        };
    }

    /**
     * CustomSorting pour les champs de type date et number ...
     */
    get customSorting(): {} {
        let res = {};

        for (let i in this.date_filtered_fields) {
            let date_field = this.date_filtered_fields[i];

            res[date_field.datatable_field_uid] = this.getCustomSortingDateColumn(date_field);
        }

        for (let i in this.number_filtered_fields) {
            let number_filtered_field = this.number_filtered_fields[i];

            res[number_filtered_field.datatable_field_uid] = this.getCustomSortingNumberColumn(number_filtered_field);
        }

        return res;
    }

    private getCustomSortingNumberColumn(number_field: DatatableField<any, any>) {
        let self = this;
        return function (ascending) {
            return function (a, b) {
                // let dataA: number = (a[number_field.datatable_field_uid] != null) ? parseFloat(a[number_field.datatable_field_uid]) : null;
                // let dataB: number = (b[number_field.datatable_field_uid] != null) ? parseFloat(b[number_field.datatable_field_uid]) : null;
                let dataA: number = null;
                let dataB: number = null;

                if (!!self.getStoredDatas[self.datatable.API_TYPE_ID]) {
                    dataA = !!self.getStoredDatas[self.datatable.API_TYPE_ID][a.id] ?
                        self.getStoredDatas[self.datatable.API_TYPE_ID][a.id][number_field.module_table_field_id] : null;

                    dataB = !!self.getStoredDatas[self.datatable.API_TYPE_ID][b.id] ?
                        self.getStoredDatas[self.datatable.API_TYPE_ID][b.id][number_field.module_table_field_id] : null;
                }
                return self.sortingNumber(ascending, dataA, dataB);
            };
        };
    }

    private sortingNumber(ascending: boolean, a: number, b: number): number {
        if ((a == null) && (b != null)) {
            return 1;
        }

        if ((b == null) && (a != null)) {
            return -1;
        }

        if (a == b) {
            return 0;
        }

        if (a > b) {
            return ascending ? 1 : -1;
        }
        return ascending ? -1 : 1;
    }

    private getCustomSortingDateColumn(date_field: DatatableField<any, any>) {
        let self = this;
        return function (ascending) {
            return function (a, b) {
                let raw_data_a = null;
                let raw_data_b = null;

                if (!!self.getStoredDatas[self.datatable.API_TYPE_ID]) {
                    raw_data_a = !!self.getStoredDatas[self.datatable.API_TYPE_ID][a.id] ?
                        self.getStoredDatas[self.datatable.API_TYPE_ID][a.id][date_field.module_table_field_id] : null;

                    raw_data_b = !!self.getStoredDatas[self.datatable.API_TYPE_ID][b.id] ?
                        self.getStoredDatas[self.datatable.API_TYPE_ID][b.id][date_field.module_table_field_id] : null;
                }

                let data_a: number = self.convertRawDateToTs(raw_data_a);
                let data_b: number = self.convertRawDateToTs(raw_data_b);

                return self.sortingNumber(ascending, data_a, data_b);
                // let dateA: Moment = ModuleFormatDatesNombres.getInstance().getMomentFromFormatted_FullyearMonthDay(a[date_field.datatable_field_uid]);
                // let dateB: Moment = ModuleFormatDatesNombres.getInstance().getMomentFromFormatted_FullyearMonthDay(b[date_field.datatable_field_uid]);

                // if (ascending) {
                //     return dateA.diff(dateB);
                // }

                // return -dateA.diff(dateB);
            };
        };
    }

    private convertRawDateToTs(raw_data: any): number {

        if (!raw_data) {
            return null;
        }

        // si c'est un tableau
        if (Array.isArray(raw_data) && !!raw_data[0]) {
            if (!raw_data[0].min) {
                // si le premier item n'a pas de min c'est un tableau de date alors on parse les dates et on get la plus petite
                let res: number = null;
                for (let item of raw_data) {
                    let current = Dates.parse(item);
                    if ((current !== null) && (res === null) || (current < res)) {
                        res = current;
                    }
                }
                return res;

            } else {
                // si le premier item a un min de type number c'est que c'est un tableau de range alors on get le min du range
                if (typeof raw_data[0].min === 'number') {
                    return RangeHandler.getSegmentedMin_from_ranges(raw_data as TSRange[]);
                }
            }
            // cas non identifié
            return null;
        }

        if (!!raw_data.min) {
            if (typeof raw_data.min === 'number') {
                return raw_data.min;
            } else {
                return Dates.parse(raw_data.min);
            }
        }

        if (typeof raw_data === 'number') {
            return raw_data;
        } else {
            return Dates.parse(raw_data);
        }
    }

    @Watch("selected_datas", { deep: true })
    private onSelectData() {
        this.allselected_chck = true;

        for (let i in this.datatable_data) {
            if (!this.selected_datas[this.datatable_data[i].id]) {
                this.allselected_chck = false;
            }
        }
    }

    private selectAll() {

        if (!this.allselected_chck) {
            for (let i in this.datatable_data) {
                this.selected_datas[this.datatable_data[i].id] = this.datatable_data[i];
            }
        } else {
            for (let i in this.datatable_data) {
                delete this.selected_datas[this.datatable_data[i].id];
            }
        }
    }

    private multiselectOptionLabel(filter_item: CustomFilterItem): string {
        if ((filter_item == null) || (typeof filter_item == 'undefined')) {
            return '';
        }

        return filter_item.label;
    }

    private updateMultiSelectFilterOptions(query, datatable_field) {
        let options = this.getMultiSelectFilterOptions(datatable_field);
        let res: CustomFilterItem[] = [];

        for (let i in options) {
            let option = options[i];

            if ((new RegExp('.*' + query + '.*', 'i')).test(option.label)) {
                res.push(option);
            }
        }

        this.custom_filters_options[datatable_field.datatable_field_uid] = res;
    }
}