import TypesHandler from '../../../../../shared/tools/TypesHandler';
import * as $ from 'jquery';
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
import RefRangesReferenceDatatableField from '../../../../../shared/modules/DAO/vos/datatable/RefRangesReferenceDatatableField';
import SimpleDatatableField from '../../../../../shared/modules/DAO/vos/datatable/SimpleDatatableField';
import ExportDataToXLSXParamVO from '../../../../../shared/modules/DataExport/vos/apis/ExportDataToXLSXParamVO';
import TimeSegment from '../../../../../shared/modules/DataRender/vos/TimeSegment';
import ModuleFormatDatesNombres from '../../../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import ModuleTableField from '../../../../../shared/modules/ModuleTableField';
import DefaultTranslation from '../../../../../shared/modules/Translation/vos/DefaultTranslation';
import VOsTypesManager from '../../../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import DateHandler from '../../../../../shared/tools/DateHandler';
import RangeHandler from '../../../../../shared/tools/RangeHandler';
import AppVuexStoreManager from '../../../store/AppVuexStoreManager';
import { ModuleCRUDAction } from '../../crud/store/CRUDStore';
import { ModuleDAOAction, ModuleDAOGetter } from '../../dao/store/DaoStore';
import DaoStoreTypeWatcherDefinition from '../../dao/vos/DaoStoreTypeWatcherDefinition';
import VueComponentBase from '../../VueComponentBase';
import CustomFilterItem from './CustomFilterItem';
import './DatatableComponent.scss';
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

    private static ACTIONS_COLUMN_ID: string = "__actions_column__";
    private static MULTISELECT_COLUMN_ID: string = "__multiselect_column__";

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
        return VOsTypesManager.getInstance().moduleTables_by_voType[this.datatable.API_TYPE_ID] ?
            VOsTypesManager.getInstance().moduleTables_by_voType[this.datatable.API_TYPE_ID].isModuleParamTable : false;
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
                            if (simpleField.moduleTableField.segmentation_type == TimeSegment.TYPE_YEAR) {
                                if (j == 'FILTER__' + field.datatable_field_uid) {

                                    this.preload_custom_filters.push(field.datatable_field_uid);

                                    this.custom_filters_values[field.datatable_field_uid] = this.$route.query[j];
                                }
                            }
                            continue;

                        case ModuleTableField.FIELD_TYPE_date:
                        case ModuleTableField.FIELD_TYPE_daterange:
                        case ModuleTableField.FIELD_TYPE_tstzrange_array:
                        case ModuleTableField.FIELD_TYPE_day:
                        case ModuleTableField.FIELD_TYPE_timestamp:
                        case ModuleTableField.FIELD_TYPE_month:
                            if (j == 'FILTER__' + field.datatable_field_uid + '__START') {

                                this.preload_custom_filters.push(field.datatable_field_uid);

                                if (!this.custom_filters_values[field.datatable_field_uid]) {
                                    this.custom_filters_values[field.datatable_field_uid] = {};
                                }
                                this.custom_filters_values[field.datatable_field_uid].start = DateHandler.getInstance().formatDayForIndex(moment(this.$route.query[j]).utc(true));
                            }
                            if (j == 'FILTER__' + field.datatable_field_uid + '__END') {

                                this.preload_custom_filters.push(field.datatable_field_uid);

                                if (!this.custom_filters_values[field.datatable_field_uid]) {
                                    this.custom_filters_values[field.datatable_field_uid] = {};
                                }
                                this.custom_filters_values[field.datatable_field_uid].end = DateHandler.getInstance().formatDayForIndex(moment(this.$route.query[j]).utc(true));
                            }
                            continue;
                    }
                }

                if (j == 'FILTER__' + field.datatable_field_uid) {

                    this.preload_custom_filters.push(field.datatable_field_uid);

                    if ((!!this.custom_filters_options) && (!!this.custom_filters_options[field.datatable_field_uid])) {
                        for (let k in this.custom_filters_options[field.datatable_field_uid]) {
                            if (this.custom_filters_options[field.datatable_field_uid][k] && this.custom_filters_options[field.datatable_field_uid][k].value == this.$route.query[j]) {
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
                        case ModuleTableField.FIELD_TYPE_timestamp:
                        case ModuleTableField.FIELD_TYPE_month:
                            if (!!this.embed_filter[field.datatable_field_uid].start) {

                                this.preload_custom_filters.push(field.datatable_field_uid);

                                if (!this.custom_filters_values[field.datatable_field_uid]) {
                                    this.custom_filters_values[field.datatable_field_uid] = {};
                                }
                                this.custom_filters_values[field.datatable_field_uid].start = DateHandler.getInstance().formatDayForIndex(moment(this.embed_filter[field.datatable_field_uid].start).utc(true));
                            }
                            if (!!this.embed_filter[field.datatable_field_uid].end) {

                                this.preload_custom_filters.push(field.datatable_field_uid);

                                if (!this.custom_filters_values[field.datatable_field_uid]) {
                                    this.custom_filters_values[field.datatable_field_uid] = {};
                                }
                                this.custom_filters_values[field.datatable_field_uid].end = DateHandler.getInstance().formatDayForIndex(moment(this.embed_filter[field.datatable_field_uid].end).utc(true));
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
            let cloned_data = Object.assign({}, (this.$refs.vclienttable as any).allFilteredData[i]);

            if (!!cloned_data[DatatableComponent.MULTISELECT_COLUMN_ID]) {
                delete cloned_data[DatatableComponent.MULTISELECT_COLUMN_ID];
            }
            if (!!cloned_data[DatatableComponent.ACTIONS_COLUMN_ID]) {
                delete cloned_data[DatatableComponent.ACTIONS_COLUMN_ID];
            }

            // On allège le vo en gardant que les colonne à exporter
            for (let column in cloned_data) {

                if (this.exportable_datatable_columns.indexOf(column) < 0) {
                    cloned_data[column] = undefined;
                }
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
                    case ModuleTableField.FIELD_TYPE_timestamp:
                    case ModuleTableField.FIELD_TYPE_day:
                    case ModuleTableField.FIELD_TYPE_month:
                        res.push(field);
                        break;

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
                    case ModuleTableField.FIELD_TYPE_timestamp:
                    case ModuleTableField.FIELD_TYPE_date:
                    case ModuleTableField.FIELD_TYPE_daterange:
                    case ModuleTableField.FIELD_TYPE_tstzrange_array:
                    case ModuleTableField.FIELD_TYPE_day:
                    case ModuleTableField.FIELD_TYPE_month:
                    case ModuleTableField.FIELD_TYPE_enum:
                    case ModuleTableField.FIELD_TYPE_html:
                    case ModuleTableField.FIELD_TYPE_html_array:
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
            new CustomFilterItem(this.t('YES'), true, datatable_field_uid),
            new CustomFilterItem(this.t('NO'), false, datatable_field_uid)
        ];
    }

    private setMultiSelectFilterOptions(datatable_field: DatatableField<any, any>) {

        this.custom_filters_options[datatable_field.datatable_field_uid] = this.getMultiSelectFilterOptions(datatable_field);
    }

    private getMultiSelectFilterOptions(datatable_field: DatatableField<any, any>): CustomFilterItem[] {

        let res: CustomFilterItem[] = [];

        // console.info('setMultiSelectFilterOptions: ' + datatable_field.datatable_field_uid);

        let field_values: any[] = [];
        let ids_marker: any[] = [];

        for (let i in this.datatable_data) {
            let data = this.datatable_data[i];
            let field_value = data[datatable_field.datatable_field_uid];

            switch (datatable_field.type) {
                case DatatableField.MANY_TO_ONE_FIELD_TYPE:
                    if (field_values.indexOf(field_value) < 0) {
                        field_values.push(field_value);
                    }
                    break;
                case DatatableField.MANY_TO_MANY_FIELD_TYPE:
                case DatatableField.ONE_TO_MANY_FIELD_TYPE:

                    if ((!field_value) || (!field_value.length)) {
                        break;
                    }

                    for (let j in field_value) {

                        if (ids_marker.indexOf(field_value[j]['id']) < 0) {
                            field_values.push(field_value[j]);
                            ids_marker.push(field_value[j]['id']);
                        }
                    }
                    break;
                case DatatableField.REF_RANGES_FIELD_TYPE:

                    if ((!field_value) || (!field_value.length)) {
                        break;
                    }

                    RangeHandler.getInstance().foreach_ranges_sync(field_value, (id: number) => {
                        if (field_values.indexOf(id.toString()) < 0) {
                            field_values.push(id.toString());
                        }
                    });
                    break;
            }
        }

        field_values.sort();

        for (let i in field_values) {

            switch (datatable_field.type) {
                case ManyToOneReferenceDatatableField.REF_RANGES_FIELD_TYPE:
                case OneToManyReferenceDatatableField.MANY_TO_ONE_FIELD_TYPE:
                    res.push(new CustomFilterItem(
                        (field_values[i] && field_values[i] != '') ? field_values[i] : '-',
                        field_values[i],
                        datatable_field.datatable_field_uid
                    ));
                    break;
                case ManyToOneReferenceDatatableField.MANY_TO_MANY_FIELD_TYPE:
                case ManyToManyReferenceDatatableField.ONE_TO_MANY_FIELD_TYPE:

                    res.push(new CustomFilterItem(
                        (field_values[i] && field_values[i] != '') ? field_values[i]['label'] : '-',
                        field_values[i]['id'],
                        datatable_field.datatable_field_uid
                    ));
                    break;
            }
        }

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

    @Watch('embed_filter', { deep: true })
    private onFilterChange() {
        if (!!this.embed_filter) {
            this.update_datatable_data();
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

                    case ModuleTableField.FIELD_TYPE_timestamp:
                    case ModuleTableField.FIELD_TYPE_daterange:
                    case ModuleTableField.FIELD_TYPE_tstz:
                    case ModuleTableField.FIELD_TYPE_tstzrange_array:
                    case ModuleTableField.FIELD_TYPE_date:
                    case ModuleTableField.FIELD_TYPE_day:
                    case ModuleTableField.FIELD_TYPE_month:
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
                    let interTargetRefField = manyToManyField.interModuleTable.getRefFieldFromTargetVoType(manyToManyField.targetModuleTable.vo_type);
                    let interSrcRefField = manyToManyField.interModuleTable.getRefFieldFromTargetVoType(manyToManyField.moduleTable.vo_type);

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

                //     RangeHandler.getInstance().foreach_ranges_sync()
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
        let baseDatas_byid: { [id: number]: IDistantVOBase } = this.getStoredDatas[this.datatable.API_TYPE_ID]; //TODO chargement depuis le store
        let baseDatas: IDistantVOBase[] = [];

        if (!!this.datatable.data_set_hook) {
            baseDatas = this.datatable.data_set_hook(baseDatas_byid);
        }

        this.datatable_data = [];

        let prepared_ref_fields_data_for_update: { [datatable_field_uid: string]: { [baseData_id: number]: { [dest_id: number]: IDistantVOBase } } } = this.prepare_ref_fields_data_for_update();

        for (let j in baseDatas) {
            let baseData: IDistantVOBase = baseDatas[j];

            if (!baseData) {
                continue;
            }

            if (!!this.datatable.conditional_show) {
                if (!this.datatable.conditional_show(baseData)) {
                    continue;
                }
            }

            let resData: IDistantVOBase = {
                id: baseData.id,
                _type: baseData._type
            };

            // Les colonnes de contrôle
            if (this.multiselectable) {
                if (this.selected_datas && this.selected_datas[baseData.id]) {
                    resData[DatatableComponent.MULTISELECT_COLUMN_ID] = true;
                } else {
                    resData[DatatableComponent.MULTISELECT_COLUMN_ID] = false;
                }
            }

            // TODO en fait on peut vérifier suivant les droits en édition sur ce vo...
            if (this.vocus_button || this.update_button || this.delete_button) {
                resData[DatatableComponent.ACTIONS_COLUMN_ID] = true;
            }

            for (let i in this.datatable.fields) {
                let field: DatatableField<any, any> = this.datatable.fields[i];

                try {

                    switch (field.type) {

                        case DatatableField.SIMPLE_FIELD_TYPE:
                            let simpleField: SimpleDatatableField<any, any> = (field) as SimpleDatatableField<any, any>;

                            let value = field.dataToReadIHM(baseData[simpleField.moduleTableField.field_id], baseData);
                            // Limite à 300 cars si c'est du html et strip html
                            if (simpleField.moduleTableField.field_type == ModuleTableField.FIELD_TYPE_html) {

                                try {

                                    value = value.replace(/&nbsp;/gi, ' ');
                                    value = value.replace(/<\/div>/gi, '\n');
                                    value = value.replace(/<\/span>/gi, '\n');
                                    value = value.replace(/<\/ul>/gi, '\n');
                                    value = value.replace(/<\/li>/gi, '\n');
                                    value = value.replace(/<\/p>/gi, '\n');
                                    value = value.replace(/<br>/gi, '\n');
                                    value = value.replace(/<(?:.|\n)*?>/gm, '');
                                    // value = $("<p>" + value + "</p>").text();
                                } catch (error) {
                                    value = value;
                                }

                                if (value.length > 300) {
                                    value = value.substring(0, 300) + '...';
                                }
                            }

                            if (simpleField.moduleTableField.field_type == ModuleTableField.FIELD_TYPE_html_array) {

                                for (let vi in value) {
                                    let v = value[vi];

                                    try {

                                        v = v.replace(/&nbsp;/gi, ' ');
                                        v = v.replace(/<\/div>/gi, '\n');
                                        v = v.replace(/<\/span>/gi, '\n');
                                        v = v.replace(/<\/ul>/gi, '\n');
                                        v = v.replace(/<\/li>/gi, '\n');
                                        v = v.replace(/<\/p>/gi, '\n');
                                        v = v.replace(/<br>/gi, '\n');
                                        v = v.replace(/<(?:.|\n)*?>/gm, '');
                                        // v = $("<p>" + v + "</p>").text();
                                    } catch (error) {
                                        v = v;
                                    }

                                    if (v.length > 300) {
                                        v = v.substring(0, 300) + '...';
                                    }

                                    value[vi] = v;
                                }
                            }


                            resData[field.datatable_field_uid] = value;
                            break;

                        case DatatableField.COMPUTED_FIELD_TYPE:
                            resData[field.datatable_field_uid] = field.dataToReadIHM(null, baseData);
                            break;

                        case DatatableField.COMPONENT_FIELD_TYPE:
                            resData[field.datatable_field_uid] = null;
                            break;

                        case DatatableField.FILE_FIELD_TYPE:
                            resData[field.datatable_field_uid] = null;
                            break;

                        case DatatableField.MANY_TO_ONE_FIELD_TYPE:
                            let manyToOneField: ManyToOneReferenceDatatableField<any> = (field) as ManyToOneReferenceDatatableField<any>;

                            // On va chercher la valeur du champs depuis la valeur de la donnée liée
                            if (this.getStoredDatas && this.getStoredDatas[manyToOneField.targetModuleTable.vo_type]) {
                                let ref_data: IDistantVOBase = this.getStoredDatas[manyToOneField.targetModuleTable.vo_type][baseData[manyToOneField.srcField.field_id]];
                                resData[field.datatable_field_uid] = manyToOneField.dataToHumanReadable(ref_data);
                                resData[field.datatable_field_uid + "___id___"] = baseData[manyToOneField.srcField.field_id];
                                resData[field.datatable_field_uid + "___type___"] = manyToOneField.targetModuleTable.vo_type;
                            }
                            break;

                        case DatatableField.ONE_TO_MANY_FIELD_TYPE:
                            let oneToManyField: OneToManyReferenceDatatableField<any> = (field) as OneToManyReferenceDatatableField<any>;

                            resData[field.datatable_field_uid] = [];

                            // for (let oneToManyTargetId in this.getStoredDatas[oneToManyField.targetModuleTable.vo_type]) {
                            //     let targetVo = this.getStoredDatas[oneToManyField.targetModuleTable.vo_type][oneToManyTargetId];

                            //     if ((!!targetVo) && (targetVo[oneToManyField.destField.field_id] == baseData.id)) {

                            //         resData[field.datatable_field_uid].push({
                            //             id: oneToManyTargetId,
                            //             label: oneToManyField.dataToHumanReadable(targetVo)
                            //         });
                            //     }
                            // }

                            if ((!!prepared_ref_fields_data_for_update) && (!!prepared_ref_fields_data_for_update[field.datatable_field_uid]) && (!!prepared_ref_fields_data_for_update[field.datatable_field_uid][baseData.id])) {
                                for (let oneToManyTargetId in prepared_ref_fields_data_for_update[field.datatable_field_uid][baseData.id]) {
                                    resData[field.datatable_field_uid].push({
                                        id: oneToManyTargetId,
                                        label: oneToManyField.dataToHumanReadable(prepared_ref_fields_data_for_update[field.datatable_field_uid][baseData.id][oneToManyTargetId])
                                    });
                                }
                            }
                            break;

                        case DatatableField.MANY_TO_MANY_FIELD_TYPE:
                            let manyToManyField: ManyToManyReferenceDatatableField<any, any> = (field) as ManyToManyReferenceDatatableField<any, any>;

                            resData[field.datatable_field_uid] = [];
                            // let dest_ids: number[] = [];
                            // let interTargetRefField = manyToManyField.interModuleTable.getRefFieldFromTargetVoType(manyToManyField.targetModuleTable.vo_type);
                            // let interSrcRefField = manyToManyField.interModuleTable.getRefFieldFromTargetVoType(manyToManyField.moduleTable.vo_type);

                            // for (let interi in this.getStoredDatas[manyToManyField.interModuleTable.vo_type]) {
                            //     let intervo = this.getStoredDatas[manyToManyField.interModuleTable.vo_type][interi];

                            //     if (intervo && (intervo[interSrcRefField.field_id] == baseData.id) && (dest_ids.indexOf(intervo[interTargetRefField.field_id]) < 0)) {
                            //         dest_ids.push(intervo[interTargetRefField.field_id]);
                            //     }
                            // }

                            // for (let desti in dest_ids) {
                            //     resData[field.datatable_field_uid].push({
                            //         id: dest_ids[desti],
                            //         label: manyToManyField.dataToHumanReadable(this.getStoredDatas[manyToManyField.targetModuleTable.vo_type][dest_ids[desti]])
                            //     });
                            // }

                            if ((!!prepared_ref_fields_data_for_update) && (!!prepared_ref_fields_data_for_update[field.datatable_field_uid]) && (!!prepared_ref_fields_data_for_update[field.datatable_field_uid][baseData.id])) {
                                for (let oneToManyTargetId in prepared_ref_fields_data_for_update[field.datatable_field_uid][baseData.id]) {
                                    resData[field.datatable_field_uid].push({
                                        id: oneToManyTargetId,
                                        label: manyToManyField.dataToHumanReadable(prepared_ref_fields_data_for_update[field.datatable_field_uid][baseData.id][oneToManyTargetId])
                                    });
                                }
                            }

                            break;

                        case DatatableField.REF_RANGES_FIELD_TYPE:
                            let refField: RefRangesReferenceDatatableField<any> = (field) as RefRangesReferenceDatatableField<any>;

                            resData[field.datatable_field_uid] = [];

                            if (this.getStoredDatas && this.getStoredDatas[refField.targetModuleTable.vo_type]) {

                                RangeHandler.getInstance().foreach_ranges_sync(baseData[refField.srcField.field_id], (id: number) => {
                                    let ref_data: IDistantVOBase = this.getStoredDatas[refField.targetModuleTable.vo_type][id];
                                    resData[field.datatable_field_uid].push({
                                        id: id,
                                        label: refField.dataToHumanReadable(ref_data)
                                    });
                                });
                            }
                            break;

                        default:
                            break;
                    }
                } catch (error) {
                    ConsoleHandler.getInstance().error(error);
                    resData[field.datatable_field_uid] = null;
                }
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
        for (let i in this.date_filtered_fields) {
            this.custom_filters_values[this.date_filtered_fields[i].datatable_field_uid] = {
                start: null,
                end: null,
            };
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
            res[DatatableComponent.MULTISELECT_COLUMN_ID] = null;
        }

        if (this.vocus_button || this.update_button || this.delete_button) {
            res[DatatableComponent.ACTIONS_COLUMN_ID] = this.t(DatatableComponent.ACTIONS_COLUMN_TRANSLATABLE_CODE);
        }

        return res;
    }

    get datatable_columns(): string[] {
        let res: string[] = [];

        // On ajoute les colonnes de contrôle
        if (this.multiselectable && !this.isModuleParamTable) {
            res.push(DatatableComponent.MULTISELECT_COLUMN_ID);
        }
        if (this.vocus_button || this.update_button || this.delete_button) {
            res.push(DatatableComponent.ACTIONS_COLUMN_ID);
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
                                    let date_tstz: Moment = self.getStoredDatas[self.datatable.API_TYPE_ID][row['id']][field.datatable_field_uid];

                                    let queryStart_tstz = moment(query.start).utc(true);
                                    let queryEnd_tstz = moment(query.end).utc(true);

                                    if (((queryStart_tstz && queryStart_tstz.isValid()) || (queryEnd_tstz && queryEnd_tstz.isValid())) && ((!date_tstz) || (!date_tstz.isValid()))) {
                                        return false;
                                    }
                                    if (queryStart_tstz && queryStart_tstz.isValid() && date_tstz.isBefore(queryStart_tstz)) {
                                        return false;
                                    }
                                    if (queryEnd_tstz && queryEnd_tstz.isValid() && date_tstz.isAfter(queryEnd_tstz)) {
                                        return false;
                                    }
                                    return true;

                                case ModuleTableField.FIELD_TYPE_date:
                                case ModuleTableField.FIELD_TYPE_day:
                                case ModuleTableField.FIELD_TYPE_timestamp:
                                    if ((!query) || ((!query.start) && (!query.end))) {
                                        return true;
                                    }

                                    let date: Moment = ModuleFormatDatesNombres.getInstance().getMomentFromFormatted_FullyearMonthDay(row[field.datatable_field_uid]);

                                    let queryStart_ = moment(query.start).utc(true);
                                    let queryEnd_ = moment(query.end).utc(true);

                                    if (((queryStart_ && queryStart_.isValid()) || (queryEnd_ && queryEnd_.isValid())) && ((!date) || (!date.isValid()))) {
                                        return false;
                                    }
                                    if (queryStart_ && queryStart_.isValid() && date.isBefore(queryStart_)) {
                                        return false;
                                    }
                                    if (queryEnd_ && queryEnd_.isValid() && date.isAfter(queryEnd_)) {
                                        return false;
                                    }

                                    return true;

                                case ModuleTableField.FIELD_TYPE_month:
                                    if ((!query) || ((!query.start) && (!query.end))) {
                                        return true;
                                    }

                                    date = ModuleFormatDatesNombres.getInstance().getMomentFromFormatted_FullyearMonthDay(moment(row[field.datatable_field_uid], 'MMM YYYY').utc(true));
                                    queryStart_ = moment(query.start).utc(true);
                                    if (query.start && date.isBefore(queryStart_)) {
                                        return false;
                                    }

                                    queryEnd_ = moment(query.end).utc(true);
                                    if (query.end && date.isAfter(queryEnd_)) {
                                        return false;
                                    }

                                    return true;

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

            if (field.hidden_print) {
                res[field.datatable_field_uid] = 'hidden-print';
            }
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
            // pagination: { chunk: 10, dropdown: false },
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
     * CustomSorting pour les champs de type date ...
     */
    get customSorting(): {} {
        let res = {};

        for (let i in this.date_filtered_fields) {
            let date_field = this.date_filtered_fields[i];

            res[date_field.datatable_field_uid] = this.getCustomSortingDateColumn(date_field);
        }

        return res;
    }

    private getCustomSortingDateColumn(date_field: DatatableField<any, any>) {
        return function (ascending) {
            return function (a, b) {
                let dateA: Moment = ModuleFormatDatesNombres.getInstance().getMomentFromFormatted_FullyearMonthDay(a[date_field.datatable_field_uid]);
                let dateB: Moment = ModuleFormatDatesNombres.getInstance().getMomentFromFormatted_FullyearMonthDay(b[date_field.datatable_field_uid]);

                if (ascending) {
                    return dateA.diff(dateB);
                }

                return -dateA.diff(dateB);
            };
        };
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