import debounce from 'lodash/debounce';
import moment from 'moment';
import { Moment } from 'moment';
import { Component, Prop, Watch } from 'vue-property-decorator';
import { Event } from 'vue-tables-2';
import { query } from '../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import Datatable from '../../../../../shared/modules/DAO/vos/datatable/Datatable';
import DatatableField from '../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import ManyToManyReferenceDatatableFieldVO from '../../../../../shared/modules/DAO/vos/datatable/ManyToManyReferenceDatatableFieldVO';
import ManyToOneReferenceDatatableFieldVO from '../../../../../shared/modules/DAO/vos/datatable/ManyToOneReferenceDatatableFieldVO';
import OneToManyReferenceDatatableFieldVO from '../../../../../shared/modules/DAO/vos/datatable/OneToManyReferenceDatatableFieldVO';
import SimpleDatatableFieldVO from '../../../../../shared/modules/DAO/vos/datatable/SimpleDatatableFieldVO';
import InsertOrDeleteQueryResult from '../../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import ExportDataToXLSXParamVO from '../../../../../shared/modules/DataExport/vos/apis/ExportDataToXLSXParamVO';
import TimeSegment from '../../../../../shared/modules/DataRender/vos/TimeSegment';
import TSRange from '../../../../../shared/modules/DataRender/vos/TSRange';
import Dates from '../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleFormatDatesNombres from '../../../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import IArchivedVOBase from '../../../../../shared/modules/IArchivedVOBase';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../../../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import DefaultTranslationVO from '../../../../../shared/modules/Translation/vos/DefaultTranslationVO';
import VOsTypesManager from '../../../../../shared/modules/VO/manager/VOsTypesManager';
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
import ArrayHandler from '../../../../../shared/tools/ArrayHandler';
import ObjectHandler from '../../../../../shared/tools/ObjectHandler';

@Component({
    template: require('./DatatableComponent.pug'),
    components: {
        Filedatatablefieldcomponent: FileDatatableFieldComponent,
        Datatablecomponentfield: DatatableComponentField
    }
})
export default class DatatableComponent extends VueComponentBase {

    private static ACTIONS_COLUMN_TRANSLATABLE_CODE: string = "datatable.actions_column" + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;

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
    private archive_button: boolean;

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

    get v_client_table_key() {
        return this.datatable ? this.datatable.API_TYPE_ID : null;
    }

    get isModuleParamTable() {
        return ModuleTableController.module_tables_by_vo_type[this.datatable.API_TYPE_ID] ?
            ModuleTableController.module_tables_by_vo_type[this.datatable.API_TYPE_ID].isModuleParamTable : false;
    }

    get is_archived_api_type_id() {
        return ModuleTableController.module_tables_by_vo_type[this.datatable.API_TYPE_ID] ?
            ModuleTableController.module_tables_by_vo_type[this.datatable.API_TYPE_ID].is_archived : false;
    }

    public async mounted() {
        this.loadDatatable();

        // Activate tooltip
        $('[data-toggle="tooltip"]').tooltip();

        // Select/Deselect checkboxes
        const checkbox = $('table tbody input[type="checkbox"]');
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
        for (const i in this.datatable.fields) {
            const field: DatatableField<any, any> = this.datatable.fields[i];

            if ((field.type != DatatableField.SIMPLE_FIELD_TYPE) &&
                (field.type != DatatableField.MANY_TO_ONE_FIELD_TYPE) &&
                (field.type != DatatableField.ONE_TO_MANY_FIELD_TYPE) &&
                (field.type != DatatableField.MANY_TO_MANY_FIELD_TYPE) &&
                (field.type != DatatableField.REF_RANGES_FIELD_TYPE)) {
                continue;
            }

            for (const j in this.$route.query) {
                if (field.type == DatatableField.SIMPLE_FIELD_TYPE) {
                    const simpleField: SimpleDatatableFieldVO<any, any> = (field as SimpleDatatableFieldVO<any, any>);

                    switch (simpleField.field_type) {
                        case ModuleTableFieldVO.FIELD_TYPE_boolean:
                            if (j == 'FILTER__' + field.datatable_field_uid) {

                                this.preload_custom_filters.push(field.datatable_field_uid);

                                this.custom_filters_values[field.datatable_field_uid] =
                                    (this.$route.query[j] == 'TRUE') ?
                                        this.custom_filters_options[field.datatable_field_uid][0] :
                                        this.custom_filters_options[field.datatable_field_uid][1];
                            }
                            continue;

                        case ModuleTableFieldVO.FIELD_TYPE_tstz:
                            switch (simpleField.segmentation_type) {
                                case TimeSegment.TYPE_YEAR:
                                    if (simpleField.segmentation_type == TimeSegment.TYPE_YEAR) {
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

                        case ModuleTableFieldVO.FIELD_TYPE_date:
                        case ModuleTableFieldVO.FIELD_TYPE_daterange:
                        case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                        case ModuleTableFieldVO.FIELD_TYPE_day:
                        case ModuleTableFieldVO.FIELD_TYPE_month:
                        case ModuleTableFieldVO.FIELD_TYPE_tsrange:
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

                        case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
                        // TODO ?
                    }
                }

                if (j == 'FILTER__' + field.datatable_field_uid) {

                    this.preload_custom_filters.push(field.datatable_field_uid);

                    if ((!!this.custom_filters_options) && (!!this.custom_filters_options[field.datatable_field_uid])) {
                        for (const k in this.custom_filters_options[field.datatable_field_uid]) {
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
                    const simpleField: SimpleDatatableFieldVO<any, any> = (field as SimpleDatatableFieldVO<any, any>);

                    switch (simpleField.field_type) {
                        case ModuleTableFieldVO.FIELD_TYPE_date:
                        case ModuleTableFieldVO.FIELD_TYPE_daterange:
                        case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                        case ModuleTableFieldVO.FIELD_TYPE_day:
                        case ModuleTableFieldVO.FIELD_TYPE_month:
                        case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                        case ModuleTableFieldVO.FIELD_TYPE_tstz:
                            if (this.embed_filter[field.datatable_field_uid].start) {

                                this.preload_custom_filters.push(field.datatable_field_uid);

                                if (!this.custom_filters_values[field.datatable_field_uid]) {
                                    this.custom_filters_values[field.datatable_field_uid] = {};
                                }
                                this.custom_filters_values[field.datatable_field_uid].start = DateHandler.getInstance().formatDayForIndex(moment(this.embed_filter[field.datatable_field_uid].start).utc(true).unix());
                            }
                            if (this.embed_filter[field.datatable_field_uid].end) {

                                this.preload_custom_filters.push(field.datatable_field_uid);

                                if (!this.custom_filters_values[field.datatable_field_uid]) {
                                    this.custom_filters_values[field.datatable_field_uid] = {};
                                }
                                this.custom_filters_values[field.datatable_field_uid].end = DateHandler.getInstance().formatDayForIndex(moment(this.embed_filter[field.datatable_field_uid].end).utc(true).unix());
                            }
                            continue;

                        case ModuleTableFieldVO.FIELD_TYPE_boolean:
                            this.preload_custom_filters.push(field.datatable_field_uid);

                            if (!this.custom_filters_values[field.datatable_field_uid]) {
                                this.custom_filters_values[field.datatable_field_uid] = {};
                            }

                            this.custom_filters_values[field.datatable_field_uid].value = this.embed_filter[field.datatable_field_uid].value;
                            continue;
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

        for (const i in this.date_filtered_fields) {
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

        for (const i in (this.$refs.vclienttable as any).allFilteredData) {

            const cloned_data = DatatableRowController.getInstance().get_exportable_datatable_row_data((this.$refs.vclienttable as any).allFilteredData[i], this.datatable, this.exportable_datatable_columns);
            if (cloned_data[DatatableRowController.MULTISELECT_COLUMN_ID]) {
                delete cloned_data[DatatableRowController.MULTISELECT_COLUMN_ID];
            }
            if (cloned_data[DatatableRowController.ACTIONS_COLUMN_ID]) {
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
        const res: string[] = [];

        for (const i in this.datatable.fields) {
            const field: DatatableField<any, any> = this.datatable.fields[i];

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
        const res: Array<DatatableField<any, any>> = [];

        for (const i in this.datatable.fields) {
            const field = this.datatable.fields[i];

            if (field.type == DatatableField.SIMPLE_FIELD_TYPE) {
                const simpleField: SimpleDatatableFieldVO<any, any> = (field as SimpleDatatableFieldVO<any, any>);

                switch (simpleField.field_type) {

                    case ModuleTableFieldVO.FIELD_TYPE_tstz:
                        if (simpleField.segmentation_type == TimeSegment.TYPE_YEAR) {
                            break;
                        }

                    case ModuleTableFieldVO.FIELD_TYPE_date:
                    case ModuleTableFieldVO.FIELD_TYPE_daterange:
                    case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_day:
                    case ModuleTableFieldVO.FIELD_TYPE_month:
                    case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                        res.push(field);
                        break;

                    case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
                    //TODO ?
                    default:
                }

            }
        }

        return res;
    }

    get number_filtered_fields(): Array<DatatableField<any, any>> {
        const res: Array<DatatableField<any, any>> = [];

        for (const i in this.datatable.fields) {
            const field = this.datatable.fields[i];

            if (field.type == DatatableField.SIMPLE_FIELD_TYPE) {
                const simpleField: SimpleDatatableFieldVO<any, any> = (field as SimpleDatatableFieldVO<any, any>);

                switch (simpleField.field_type) {

                    case ModuleTableFieldVO.FIELD_TYPE_tstz:
                        if (simpleField.segmentation_type == TimeSegment.TYPE_YEAR) {
                            res.push(field);
                        }
                        break;

                    case ModuleTableFieldVO.FIELD_TYPE_amount:
                    case ModuleTableFieldVO.FIELD_TYPE_float:
                    case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableFieldVO.FIELD_TYPE_int:
                    case ModuleTableFieldVO.FIELD_TYPE_prct:
                        res.push(field);
                        break;

                    case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
                    //TODO ?
                    default:
                }

            }
        }

        return res;
    }

    get text_filtered_fields(): Array<DatatableField<any, any>> {
        const res: Array<DatatableField<any, any>> = [];

        for (const i in this.datatable.fields) {
            const field = this.datatable.fields[i];

            if (field.type == DatatableField.SIMPLE_FIELD_TYPE) {
                const simpleField = (field as SimpleDatatableFieldVO<any, any>);

                switch (simpleField.field_type) {
                    case ModuleTableFieldVO.FIELD_TYPE_tstz:
                        if (simpleField.segmentation_type == TimeSegment.TYPE_YEAR) {
                            break;
                        }

                    case ModuleTableFieldVO.FIELD_TYPE_boolean:
                    case ModuleTableFieldVO.FIELD_TYPE_date:
                    case ModuleTableFieldVO.FIELD_TYPE_daterange:
                    case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_day:
                    case ModuleTableFieldVO.FIELD_TYPE_month:
                    case ModuleTableFieldVO.FIELD_TYPE_enum:
                    case ModuleTableFieldVO.FIELD_TYPE_html:
                    case ModuleTableFieldVO.FIELD_TYPE_html_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
                    case ModuleTableFieldVO.FIELD_TYPE_tsrange:
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
        const res: Array<DatatableField<any, any>> = [];

        for (const i in this.datatable.fields) {
            const field = this.datatable.fields[i];

            switch (field.type) {
                case DatatableField.SIMPLE_FIELD_TYPE:
                    const simpleField = (field as SimpleDatatableFieldVO<any, any>);
                    if (simpleField.field_type == ModuleTableFieldVO.FIELD_TYPE_enum) {
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
        const res: Array<DatatableField<any, any>> = [];

        for (const i in this.datatable.fields) {
            const field = this.datatable.fields[i];

            if ((field.type == DatatableField.SIMPLE_FIELD_TYPE) &&
                ((field as SimpleDatatableFieldVO<any, any>).field_type == ModuleTableFieldVO.FIELD_TYPE_boolean)) {
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

        const res: CustomFilterItem[] = [];

        // console.info('setMultiSelectFilterOptions: ' + datatable_field.datatable_field_uid);

        const field_values: { [id: number]: any } = {};

        for (const i in this.datatable_data) {
            const data = this.datatable_data[i];
            const field_value = data[datatable_field.datatable_field_uid];
            const field_value_id = data[datatable_field.datatable_field_uid + '___id___'];

            switch (datatable_field.type) {
                case DatatableField.SIMPLE_FIELD_TYPE:
                    const simpleField = (datatable_field as SimpleDatatableFieldVO<any, any>);
                    if (simpleField.field_type == ModuleTableFieldVO.FIELD_TYPE_enum) {

                        for (const j in simpleField.enum_values) {
                            const enum_value = simpleField.enum_values[j];

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

                    for (const j in field_value) {
                        const field_value_vo: IDistantVOBase = field_value[j];

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

        for (const id in field_values) {
            const field_value = field_values[id];

            switch (datatable_field.type) {
                case ManyToOneReferenceDatatableFieldVO.REF_RANGES_FIELD_TYPE:
                case OneToManyReferenceDatatableFieldVO.MANY_TO_ONE_FIELD_TYPE:
                    res.push(new CustomFilterItem(
                        (field_value && field_value != '') ? field_value : '-',
                        field_value,
                        datatable_field.datatable_field_uid,
                        parseInt(id),
                    ));
                    break;
                case ManyToOneReferenceDatatableFieldVO.MANY_TO_MANY_FIELD_TYPE:
                case ManyToManyReferenceDatatableFieldVO.ONE_TO_MANY_FIELD_TYPE:

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

    private changeTextFilterValue(datatable_field: DatatableField<any, any>) {
        Event.$emit('vue-tables.filter::' + (datatable_field.vo_type_id + '_' + datatable_field.datatable_field_uid),
            this.custom_filters_values[datatable_field.datatable_field_uid] ? this.custom_filters_values[datatable_field.datatable_field_uid] : false);
    }

    private changeBooleanFilterValue(datatable_field: DatatableField<any, any>) {
        // Impossible d'envoyer un event avec une valeur false (donc false, 0, ...) car sinon c'est comme supprimer le filtre
        Event.$emit('vue-tables.filter::' + (datatable_field.vo_type_id + '_' + datatable_field.datatable_field_uid),
            this.custom_filters_values[datatable_field.datatable_field_uid] ? (this.custom_filters_values[datatable_field.datatable_field_uid].value ? "VRAI" : "FAUX") : false);
    }

    @Watch('$route')
    private onRouteChange() {
        AppVuexStoreManager.getInstance().appVuexStore.commit('PRINT_ENABLE');
        AppVuexStoreManager.getInstance().appVuexStore.dispatch('register_hook_export_data_to_XLSX', this.get_export_params_for_xlsx);
    }

    @Watch('embed_filter', { immediate: true, deep: true })
    private async onFilterChange() {
        // if (!!this.embed_filter) {
        await this.debounced_update_datatable_data();
        // }
    }

    @Watch('custom_filters_values', { deep: true })
    private onChangeFilterValue() {
        for (const i in this.datatable.fields) {
            const field = this.datatable.fields[i];
            if (field.type == DatatableField.SIMPLE_FIELD_TYPE) {
                const simpleField: SimpleDatatableFieldVO<any, any> = field as SimpleDatatableFieldVO<any, any>;

                switch (simpleField.field_type) {
                    case ModuleTableFieldVO.FIELD_TYPE_boolean:
                        this.changeBooleanFilterValue(field);
                        break;

                    case ModuleTableFieldVO.FIELD_TYPE_daterange:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz:
                    case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                    case ModuleTableFieldVO.FIELD_TYPE_date:
                    case ModuleTableFieldVO.FIELD_TYPE_day:
                    case ModuleTableFieldVO.FIELD_TYPE_month:
                    case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                    case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
                    //TODO ?
                    default:
                        this.changeTextFilterValue(field);
                }
            } else {
                this.changeTextFilterValue(field);
            }
        }
    }

    private setWatcher(api_type_involved: string) {
        const watcher: DaoStoreTypeWatcherDefinition = new DaoStoreTypeWatcherDefinition();
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

        for (const i in this.api_types_involved) {
            this.setWatcher(this.api_types_involved[i]);
        }
    }

    /**
     * Obj, on stock dans un cache qu'on renvoie les datas liées par les champs de ref.
     */
    private prepare_ref_fields_data_for_update(): { [datatable_field_uid: string]: { [baseData_id: number]: { [dest_id: number]: IDistantVOBase } } } {

        const res: { [datatable_field_uid: string]: { [baseData_id: number]: { [dest_id: number]: IDistantVOBase } } } = {};

        for (const i in this.datatable.fields) {
            const field: DatatableField<any, any> = this.datatable.fields[i];

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
                    const oneToManyField: OneToManyReferenceDatatableFieldVO<any> = (field) as OneToManyReferenceDatatableFieldVO<any>;

                    for (const oneToManyTargetId in this.getStoredDatas[oneToManyField.targetModuleTable.vo_type]) {
                        const targetVo = this.getStoredDatas[oneToManyField.targetModuleTable.vo_type][oneToManyTargetId];

                        if ((!!targetVo) && (!!targetVo[oneToManyField.destField.field_id])) {

                            const baseData_id = targetVo[oneToManyField.destField.field_id];

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
                    const manyToManyField: ManyToManyReferenceDatatableFieldVO<any, any> = (field) as ManyToManyReferenceDatatableFieldVO<any, any>;

                    const dest_ids: number[] = [];
                    const interTargetRefField = manyToManyField.interTargetRefFieldId ? manyToManyField.interModuleTable.getFieldFromId(manyToManyField.interTargetRefFieldId) : manyToManyField.interModuleTable.getRefFieldFromTargetVoType(manyToManyField.targetModuleTable.vo_type);
                    const interSrcRefField = manyToManyField.interSrcRefFieldId ? manyToManyField.interModuleTable.getFieldFromId(manyToManyField.interSrcRefFieldId) : manyToManyField.interModuleTable.getRefFieldFromTargetVoType(manyToManyField.vo_type_id);

                    for (const interi in this.getStoredDatas[manyToManyField.interModuleTable.vo_type]) {
                        const intervo = this.getStoredDatas[manyToManyField.interModuleTable.vo_type][interi];

                        if ((!!intervo) && (!!intervo[interSrcRefField.field_id]) && (dest_ids.indexOf(intervo[interTargetRefField.field_id]) < 0)) {

                            const baseData_id = intervo[interSrcRefField.field_id];

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
                //     let refField: RefRangesReferenceDatatableFieldVO<any> = (field) as RefRangesReferenceDatatableFieldVO<any>;

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
        const baseDatas_byid: { [id: number]: IDistantVOBase } = this.getStoredDatas[this.datatable.API_TYPE_ID];
        let baseDatas: IDistantVOBase[] = [];

        if (this.datatable.data_set_hook) {
            baseDatas = this.datatable.data_set_hook(baseDatas_byid);
        }

        const datatable_data = [];

        const prepared_ref_fields_data_for_update: { [datatable_field_uid: string]: { [baseData_id: number]: { [dest_id: number]: IDistantVOBase } } } = this.prepare_ref_fields_data_for_update();

        for (const j in baseDatas) {
            const baseData: IDistantVOBase = baseDatas[j];

            const resData: IDistantVOBase = DatatableRowController.getInstance().get_datatable_row_data(baseData, this.datatable, this.getStoredDatas, prepared_ref_fields_data_for_update);

            // Les colonnes de contrôle
            if (this.multiselectable) {
                if (this.selected_datas && this.selected_datas[baseData.id]) {
                    resData[DatatableRowController.MULTISELECT_COLUMN_ID] = true;
                } else {
                    resData[DatatableRowController.MULTISELECT_COLUMN_ID] = false;
                }
            }

            // TODO en fait on peut vérifier suivant les droits en édition sur ce vo...
            if (this.vocus_button || this.update_button || this.delete_button || this.archive_button) {
                resData[DatatableRowController.ACTIONS_COLUMN_ID] = true;
            }

            datatable_data.push(resData);
        }

        if (!ObjectHandler.are_equal(this.datatable_data, datatable_data)) {
            this.datatable_data = datatable_data;
            this.initializeFilters();
        }
    }

    private initializeFilters() {

        // On initialize les options des filtres
        for (const i in this.boolean_filtered_fields) {
            this.setBooleanFilterOptions(this.boolean_filtered_fields[i].datatable_field_uid);
        }
        for (const i in this.multiselect_filtered_fields) {
            this.setMultiSelectFilterOptions(this.multiselect_filtered_fields[i]);
        }

        this.handle_filters_preload();

        this.onChangeFilterValue();
    }

    get datatable_columns_labels(): any {
        const res: any = {};

        for (const i in this.datatable.fields) {
            const field: DatatableField<any, any> = this.datatable.fields[i];
            res[field.datatable_field_uid] = this.t(field.translatable_title);
        }

        // On ajoute les colonnes de contrôle
        if (this.multiselectable) {
            res[DatatableRowController.MULTISELECT_COLUMN_ID] = null;
        }

        if (this.vocus_button || this.update_button || this.delete_button || this.archive_button) {
            res[DatatableRowController.ACTIONS_COLUMN_ID] = this.t(DatatableComponent.ACTIONS_COLUMN_TRANSLATABLE_CODE);
        }

        return res;
    }

    get datatable_columns(): string[] {
        const res: string[] = [];

        // On ajoute les colonnes de contrôle
        if (this.multiselectable && !this.isModuleParamTable) {
            res.push(DatatableRowController.MULTISELECT_COLUMN_ID);
        }
        if (this.vocus_button || this.update_button || this.delete_button || this.archive_button) {
            res.push(DatatableRowController.ACTIONS_COLUMN_ID);
        }

        for (const i in this.datatable.fields) {
            const field: DatatableField<any, any> = this.datatable.fields[i];

            if (field.type == DatatableField.INPUT_FIELD_TYPE) {
                continue;
            }

            if (field.hidden) {
                continue;
            }
            // if (field.type == DatatableField.SIMPLE_FIELD_TYPE) {
            //     let simpleField: SimpleDatatableFieldVO<any, any> = this.datatable.fields[i] as SimpleDatatableFieldVO<any, any>;

            //     if (simpleField.field_type == ModuleTableFieldVO.FIELD_TYPE_html) {
            //         continue;
            //     }
            // }

            res.push(field.datatable_field_uid);
        }

        return res;
    }

    get customFilters(): any[] {
        const customFilters: any[] = [];
        const self = this;

        if (this.isModuleParamTable) {
            return customFilters;
        }

        for (const j in this.datatable.fields) {
            const field = this.datatable.fields[j];

            if (field.type == DatatableField.COMPONENT_FIELD_TYPE) {
                continue;
            }

            if (field.type == DatatableField.FILE_FIELD_TYPE) {
                continue;
            }

            customFilters.push({
                name: field.vo_type_id + '_' + field.datatable_field_uid,
                callback: function (row, query_cf) {
                    switch (field.type) {
                        case DatatableField.SIMPLE_FIELD_TYPE:
                            const simpleField: SimpleDatatableFieldVO<any, any> = field as SimpleDatatableFieldVO<any, any>;

                            switch (simpleField.field_type) {
                                case ModuleTableFieldVO.FIELD_TYPE_boolean:

                                    if ((query_cf == null) || (typeof query_cf == 'undefined')) {
                                        return true;
                                    }

                                    const istrue: boolean = (query_cf == 'VRAI');

                                    const data_is_true = (!!row[field.datatable_field_uid]) && ((row[field.datatable_field_uid] == 'true') || (TypesHandler.getInstance().isBoolean(row[field.datatable_field_uid])));
                                    return (data_is_true && istrue) || ((!data_is_true) && !istrue);

                                case ModuleTableFieldVO.FIELD_TYPE_daterange:
                                case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                                    if ((!query_cf) || ((!query_cf.start) && (!query_cf.end))) {
                                        return true;
                                    }

                                    let daterange_array = null;
                                    if (simpleField.field_type == ModuleTableFieldVO.FIELD_TYPE_daterange) {
                                        daterange_array = [row[field.datatable_field_uid]];
                                    } else {
                                        daterange_array = row[field.datatable_field_uid].split(', ');
                                    }

                                    for (const i in daterange_array) {
                                        const daterange = daterange_array[i];

                                        const parts: string[] = daterange.split('-');
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

                                        const queryStart = moment(query_cf.start).utc(true);
                                        const queryEnd = moment(query_cf.end).utc(true);
                                        if (((!query_cf.start) || (!dateEnd) || (!dateEnd.isBefore(queryStart))) && ((!query_cf.end) || (!dateStart) || (!dateStart.isAfter(queryEnd)))) {
                                            return true;
                                        }
                                    }

                                    return false;

                                case ModuleTableFieldVO.FIELD_TYPE_tstz:
                                    if (simpleField.segmentation_type == TimeSegment.TYPE_YEAR) {
                                        if (!query_cf) {
                                            return true;
                                        }
                                        return ((!!row[field.datatable_field_uid]) && row[field.datatable_field_uid].toString().indexOf(query_cf.toString()) >= 0);
                                    }

                                    if ((!query_cf) || ((!query_cf.start) && (!query_cf.end))) {
                                        return true;
                                    }
                                    const date_tstz: number = self.getStoredDatas[self.datatable.API_TYPE_ID][row['id']][field.datatable_field_uid];

                                    const queryStart_tstz: Moment = moment(query_cf.start).utc(true);
                                    const queryEnd_tstz: Moment = moment(query_cf.end).utc(true);

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

                                case ModuleTableFieldVO.FIELD_TYPE_date:
                                case ModuleTableFieldVO.FIELD_TYPE_day:
                                    if ((!query_cf) || ((!query_cf.start) && (!query_cf.end))) {
                                        return true;
                                    }

                                    let date: Moment = ModuleFormatDatesNombres.getInstance().getMomentFromFormatted_FullyearMonthDay(row[field.datatable_field_uid]);

                                    const queryStart_date = moment(query_cf.start).utc(true);
                                    const queryEnd_date = moment(query_cf.end).utc(true);

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

                                case ModuleTableFieldVO.FIELD_TYPE_month:
                                    if ((!query_cf) || ((!query_cf.start) && (!query_cf.end))) {
                                        return true;
                                    }

                                    date = moment(row[field.datatable_field_uid], 'MMM YYYY').utc(true);
                                    const queryStart_month = moment(query_cf.start).utc(true);
                                    if (query_cf.start && date.isBefore(queryStart_month)) {
                                        return false;
                                    }

                                    const queryEnd_month = moment(query_cf.end).utc(true);
                                    if (query_cf.end && date.isAfter(queryEnd_month)) {
                                        return false;
                                    }

                                    return true;

                                case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                                    if ((!query_cf) || ((!query_cf.start) && (!query_cf.end))) {
                                        return true;
                                    }

                                    const tsrange: TSRange = self.getStoredDatas[self.datatable.API_TYPE_ID][row['id']][field.datatable_field_uid];

                                    if (!tsrange) {
                                        return false;
                                    }

                                    let is_ok: boolean = false;

                                    const has_start: boolean = query_cf.start && (query_cf.start.length > 0);
                                    const has_end: boolean = query_cf.end && (query_cf.end.length > 0);

                                    const filter_tsrange: TSRange = TSRange.createNew(
                                        has_start ? moment(query_cf.start).utc(true).unix() : RangeHandler.MIN_TS,
                                        has_end ? moment(query_cf.end).utc(true).unix() : RangeHandler.MAX_TS,
                                        true,
                                        true,
                                        tsrange.segment_type
                                    );

                                    if (filter_tsrange) {
                                        if (RangeHandler.range_intersects_range(filter_tsrange, tsrange)) {
                                            is_ok = true;
                                        }
                                    }

                                    // if (has_start) {
                                    //     if (RangeHandler.getInstance().elt_intersects_range(moment(query.start).utc(true).unix(), tsrange)) {
                                    //         is_ok = true;
                                    //     }
                                    // }

                                    // if (has_end) {
                                    //     if (RangeHandler.getInstance().elt_intersects_range(moment(query.end).utc(true).unix(), tsrange)) {
                                    //         is_ok = true;
                                    //     }
                                    // }

                                    return is_ok;

                                case ModuleTableFieldVO.FIELD_TYPE_enum:
                                    if ((!query_cf) || (!query_cf.length)) {
                                        return true;
                                    }

                                    for (const i in query_cf) {
                                        if (query_cf[i].value == row[field.datatable_field_uid]) {
                                            return true;
                                        }
                                    }
                                    return false;

                                case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
                                //TODO ?
                                default:
                                    if (!query_cf) {
                                        return true;
                                    }

                                    if (row[field.datatable_field_uid] && ((row[field.datatable_field_uid].toString().toLowerCase()).indexOf(query_cf.toLowerCase()) >= 0)) {
                                        return true;
                                    }
                                    return false;
                            }

                        case DatatableField.MANY_TO_ONE_FIELD_TYPE:
                            if ((!query_cf) || (!query_cf.length)) {
                                return true;
                            }

                            for (const i in query_cf) {
                                if (query_cf[i].value == row[field.datatable_field_uid]) {
                                    return true;
                                }
                            }
                            return false;

                        case DatatableField.REF_RANGES_FIELD_TYPE:
                        case DatatableField.MANY_TO_MANY_FIELD_TYPE:
                        case DatatableField.ONE_TO_MANY_FIELD_TYPE:
                            if ((!query_cf) || (!query_cf.length)) {
                                return true;
                            }

                            if ((!row[field.datatable_field_uid]) || (!row[field.datatable_field_uid].length)) {
                                return false;
                            }

                            for (const i in query_cf) {

                                for (const k in row[field.datatable_field_uid]) {
                                    if (row[field.datatable_field_uid][k].id == query_cf[i].value) {
                                        return true;
                                    }
                                }
                            }
                            return false;

                        case DatatableField.COMPUTED_FIELD_TYPE:
                            if (!query_cf) {
                                return true;
                            }

                            if (row[field.datatable_field_uid] && ((row[field.datatable_field_uid].toString().toLowerCase()).indexOf(query_cf.toLowerCase()) >= 0)) {
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
        const res: { [field_id: string]: string } = {};

        for (const i in this.datatable.fields) {
            const field: DatatableField<any, any> = this.datatable.fields[i];

            const class_name: string[] = ['field_' + field.datatable_field_uid];

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
            perPage: (this.perpage) ? this.perpage : 15,
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
        const res = {};

        for (const i in this.date_filtered_fields) {
            const date_field = this.date_filtered_fields[i];

            res[date_field.datatable_field_uid] = this.getCustomSortingDateColumn(date_field);
        }

        for (const i in this.number_filtered_fields) {
            const number_filtered_field = this.number_filtered_fields[i];

            res[number_filtered_field.datatable_field_uid] = this.getCustomSortingNumberColumn(number_filtered_field);
        }

        return res;
    }

    private getCustomSortingNumberColumn(number_field: DatatableField<any, any>) {
        const self = this;
        return function (ascending) {
            return function (a, b) {
                // let dataA: number = (a[number_field.datatable_field_uid] != null) ? parseFloat(a[number_field.datatable_field_uid]) : null;
                // let dataB: number = (b[number_field.datatable_field_uid] != null) ? parseFloat(b[number_field.datatable_field_uid]) : null;
                let dataA: number = null;
                let dataB: number = null;

                if (self.getStoredDatas[self.datatable.API_TYPE_ID]) {
                    dataA = self.getStoredDatas[self.datatable.API_TYPE_ID][a.id] ?
                        self.getStoredDatas[self.datatable.API_TYPE_ID][a.id][number_field.module_table_field_id] : null;

                    dataB = self.getStoredDatas[self.datatable.API_TYPE_ID][b.id] ?
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
        const self = this;
        return function (ascending) {
            return function (a, b) {
                let raw_data_a = null;
                let raw_data_b = null;

                if (self.getStoredDatas[self.datatable.API_TYPE_ID]) {
                    raw_data_a = self.getStoredDatas[self.datatable.API_TYPE_ID][a.id] ?
                        self.getStoredDatas[self.datatable.API_TYPE_ID][a.id][date_field.module_table_field_id] : null;

                    raw_data_b = self.getStoredDatas[self.datatable.API_TYPE_ID][b.id] ?
                        self.getStoredDatas[self.datatable.API_TYPE_ID][b.id][date_field.module_table_field_id] : null;
                }

                const data_a: number = self.convertRawDateToTs(raw_data_a);
                const data_b: number = self.convertRawDateToTs(raw_data_b);

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
                for (const item of raw_data) {
                    const current = Dates.parse(item);
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

        if (raw_data.min) {
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

        for (const i in this.datatable_data) {
            if (!this.selected_datas[this.datatable_data[i].id]) {
                this.allselected_chck = false;
            }
        }
    }

    private selectAll() {

        if (!this.allselected_chck) {
            for (const i in this.datatable_data) {
                this.selected_datas[this.datatable_data[i].id] = this.datatable_data[i];
            }
        } else {
            for (const i in this.datatable_data) {
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

    private updateMultiSelectFilterOptions(query_cf, datatable_field) {
        const options = this.getMultiSelectFilterOptions(datatable_field);
        const res: CustomFilterItem[] = [];

        for (const i in options) {
            const option = options[i];

            if ((new RegExp('.*' + query_cf + '.*', 'i')).test(option.label)) {
                res.push(option);
            }
        }

        this.custom_filters_options[datatable_field.datatable_field_uid] = res;
    }

    private async confirm_archive(api_type_id: string, id: number) {
        const self = this;

        // On demande confirmation avant toute chose.
        // si on valide, on lance la suppression
        self.snotify.confirm(self.label('DatatableComponent.confirm_archive.body'), self.label('DatatableComponent.confirm_archive.title'), {
            timeout: 10000,
            showProgressBar: true,
            closeOnClick: false,
            pauseOnHover: true,
            buttons: [
                {
                    text: self.t('YES'),
                    action: async (toast) => {
                        self.$snotify.remove(toast.id);
                        self.snotify.async(self.label('DatatableComponent.confirm_archive.start'), () =>
                            new Promise(async (resolve, reject) => {
                                const vo: IArchivedVOBase = await query(api_type_id).filter_by_id(id).select_vo();
                                let res: InsertOrDeleteQueryResult = null;

                                if (vo) {
                                    vo.archived = true;
                                    res = await ModuleDAO.getInstance().insertOrUpdateVO(vo);
                                }

                                if (!res?.id) {
                                    reject({
                                        body: self.label('DatatableComponent.confirm_archive.ko'),
                                        config: {
                                            timeout: 10000,
                                            showProgressBar: true,
                                            closeOnClick: false,
                                            pauseOnHover: true,
                                        },
                                    });
                                } else {
                                    resolve({
                                        body: self.label('DatatableComponent.confirm_archive.ok'),
                                        config: {
                                            timeout: 10000,
                                            showProgressBar: true,
                                            closeOnClick: false,
                                            pauseOnHover: true,
                                        },
                                    });
                                }
                                await this.debounced_update_datatable_data();
                            })
                        );
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
}