import * as $ from 'jquery';
import * as moment from 'moment';
import { Moment } from 'moment';
import ExportDataToXLSXParamVO from '../../../../../shared/modules/DataExport/vos/apis/ExportDataToXLSXParamVO';
import ModuleFormatDatesNombres from '../../../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import ModuleTableField from '../../../../../shared/modules/ModuleTableField';
import DefaultTranslation from '../../../../../shared/modules/Translation/vos/DefaultTranslation';
import VOsTypesManager from '../../../../../shared/modules/VOsTypesManager';
import DateHandler from '../../../../../shared/tools/DateHandler';
import { Component, Prop, Watch } from 'vue-property-decorator';
import { Event } from 'vue-tables-2';
import AppVuexStoreManager from '../../../store/AppVuexStoreManager';
import { ModuleCRUDAction } from '../../crud/store/CRUDStore';
import { ModuleDAOAction, ModuleDAOGetter } from '../../dao/store/DaoStore';
import VueComponentBase from '../../VueComponentBase';
import Datatable from '../vos/Datatable';
import DatatableField from '../vos/DatatableField';
import ManyToOneReferenceDatatableField from '../vos/ManyToOneReferenceDatatableField';
import SimpleDatatableField from '../vos/SimpleDatatableField';
import ManyToManyReferenceDatatableField from '../vos/ManyToManyReferenceDatatableField';
import DaoStoreTypeWatcherDefinition from '../../dao/vos/DaoStoreTypeWatcherDefinition';
import * as debounce from 'lodash/debounce';
import './DatatableComponent.scss';

@Component({
    template: require('./DatatableComponent.pug'),
    components: {}
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

    @Prop({
        default: true
    })
    private load_datas: boolean;

    @Prop()
    private api_types_involved: string[];

    @Prop({
        default: false
    })
    private update_button: boolean;

    @Prop({
        default: false
    })
    private delete_button: boolean;

    @Prop({
        default: false
    })
    private multiselectable: boolean;

    private allselected_chck: boolean = false;
    private selected_datas: { [id: number]: IDistantVOBase } = {};
    private loaded: boolean = false;

    private datatable_data: IDistantVOBase[] = [];

    // private preloadFilter: { [field_id: string]: any } = null;
    private custom_filters_values: { [field_id: string]: any } = {};
    private preload_custom_filters: string[] = [];
    private custom_filters_options: { [field_id: string]: any[] } = {};

    private watcherLoaded: boolean = false;

    get isModuleParamTable() {
        return VOsTypesManager.getInstance().moduleTables_by_voType[this.datatable.API_TYPE_ID] ?
            VOsTypesManager.getInstance().moduleTables_by_voType[this.datatable.API_TYPE_ID].isModuleParamTable : false;
    }

    public async mounted() {

        await this.loadDatatable();

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

        // En fait, on parcourt le type et pour chaque champ, si il existe en param un 'FILTER__' + field_id
        //  on l'utilise comme valeur par défaut pour le filtre correspondant
        // this.$route.query
        // this.preloadFilter = {};
        for (let i in this.datatable.fields) {
            let field: DatatableField<any, any> = this.datatable.fields[i];

            if ((field.type != DatatableField.SIMPLE_FIELD_TYPE) && (field.type != DatatableField.MANY_TO_ONE_FIELD_TYPE)) {
                continue;
            }

            for (let j in this.$route.query) {
                if (field.type == DatatableField.SIMPLE_FIELD_TYPE) {
                    let simpleField: SimpleDatatableField<any, any> = (field as SimpleDatatableField<any, any>);

                    if (simpleField.moduleTableField.field_type == ModuleTableField.FIELD_TYPE_boolean) {
                        if (j == 'FILTER__' + field.datatable_field_uid) {

                            this.preload_custom_filters.push(field.datatable_field_uid);

                            this.custom_filters_values[field.datatable_field_uid] =
                                (this.$route.query[j] == 'TRUE') ?
                                    this.custom_filters_options[field.datatable_field_uid][0] :
                                    this.custom_filters_options[field.datatable_field_uid][1];
                        }
                        continue;
                    }

                    if ((simpleField.moduleTableField.field_type == ModuleTableField.FIELD_TYPE_date) ||
                        (simpleField.moduleTableField.field_type == ModuleTableField.FIELD_TYPE_daterange) ||
                        (simpleField.moduleTableField.field_type == ModuleTableField.FIELD_TYPE_day) ||
                        (simpleField.moduleTableField.field_type == ModuleTableField.FIELD_TYPE_month)) {
                        if (j == 'FILTER__' + field.datatable_field_uid + '__START') {

                            this.preload_custom_filters.push(field.datatable_field_uid);

                            if (!this.custom_filters_values[field.datatable_field_uid]) {
                                this.custom_filters_values[field.datatable_field_uid] = {};
                            }
                            this.custom_filters_values[field.datatable_field_uid].start = DateHandler.getInstance().formatDayForIndex(moment(this.$route.query[j]));
                        }
                        if (j == 'FILTER__' + field.datatable_field_uid + '__END') {

                            this.preload_custom_filters.push(field.datatable_field_uid);

                            if (!this.custom_filters_values[field.datatable_field_uid]) {
                                this.custom_filters_values[field.datatable_field_uid] = {};
                            }
                            this.custom_filters_values[field.datatable_field_uid].end = DateHandler.getInstance().formatDayForIndex(moment(this.$route.query[j]));
                        }
                        continue;
                    }
                }

                if (j == 'FILTER__' + field.datatable_field_uid) {

                    this.preload_custom_filters.push(field.datatable_field_uid);

                    for (let k in this.custom_filters_options[field.datatable_field_uid]) {
                        if (this.custom_filters_options[field.datatable_field_uid][k] && this.custom_filters_options[field.datatable_field_uid][k].value == this.$route.query[j]) {
                            this.custom_filters_values[field.datatable_field_uid] = [this.custom_filters_options[field.datatable_field_uid][k]];
                        }
                    }
                }
            }
        }
    }

    get api_type_id(): string {
        return this.datatable.API_TYPE_ID;
    }

    private get_export_params_for_xlsx(): ExportDataToXLSXParamVO {

        return new ExportDataToXLSXParamVO(
            "Export-" + this.datatable.API_TYPE_ID + ".xlsx",
            this.exportable_datatable_data,
            this.exportable_datatable_columns,
            this.datatable_columns_labels
        );
    }

    get exportable_datatable_data(): any[] {
        let res: any[] = [];

        for (let i in this.datatable_data) {
            res.push(this.datatable_data[i]);
            delete res[res.length - 1][DatatableComponent.MULTISELECT_COLUMN_ID];
            delete res[res.length - 1][DatatableComponent.ACTIONS_COLUMN_ID];
        }

        return res;
    }

    get exportable_datatable_columns(): string[] {
        let res: string[] = [];

        for (let i in this.datatable_columns) {
            let column: string = this.datatable_columns[i];
            if ((column == DatatableComponent.ACTIONS_COLUMN_ID) ||
                (column == DatatableComponent.MULTISELECT_COLUMN_ID)) {
                continue;
            }
            res.push(column);
        }

        return res;
    }

    get date_filtered_fields(): Array<DatatableField<any, any>> {
        let res: Array<DatatableField<any, any>> = [];

        for (let i in this.datatable.fields) {
            let field = this.datatable.fields[i];

            if ((field.type == DatatableField.SIMPLE_FIELD_TYPE) &&
                (((field as SimpleDatatableField<any, any>).moduleTableField.field_type == ModuleTableField.FIELD_TYPE_date) ||
                    ((field as SimpleDatatableField<any, any>).moduleTableField.field_type == ModuleTableField.FIELD_TYPE_daterange) ||
                    ((field as SimpleDatatableField<any, any>).moduleTableField.field_type == ModuleTableField.FIELD_TYPE_day) ||
                    ((field as SimpleDatatableField<any, any>).moduleTableField.field_type == ModuleTableField.FIELD_TYPE_month))) {
                res.push(field);
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
                if ((simpleField.moduleTableField.field_type == ModuleTableField.FIELD_TYPE_boolean) ||
                    (simpleField.moduleTableField.field_type == ModuleTableField.FIELD_TYPE_date) ||
                    (simpleField.moduleTableField.field_type == ModuleTableField.FIELD_TYPE_daterange) ||
                    (simpleField.moduleTableField.field_type == ModuleTableField.FIELD_TYPE_day) ||
                    (simpleField.moduleTableField.field_type == ModuleTableField.FIELD_TYPE_month) ||
                    (simpleField.moduleTableField.field_type == ModuleTableField.FIELD_TYPE_html) ||
                    (simpleField.moduleTableField.field_type == ModuleTableField.FIELD_TYPE_enum)) {
                    continue;
                }
            }
            if (field.type == DatatableField.MANY_TO_ONE_FIELD_TYPE) {
                continue;
            }
            if (field.type == DatatableField.MANY_TO_MANY_FIELD_TYPE) {
                continue;
            }
            if (field.type == DatatableField.INPUT_FIELD_TYPE) {
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

            if (field.type == DatatableField.SIMPLE_FIELD_TYPE) {
                let simpleField = (field as SimpleDatatableField<any, any>);
                if (simpleField.moduleTableField.field_type == ModuleTableField.FIELD_TYPE_enum) {
                    res.push(field);
                }
            } else if (field.type == DatatableField.MANY_TO_ONE_FIELD_TYPE) {
                res.push(field);
            } else if (field.type == DatatableField.MANY_TO_MANY_FIELD_TYPE) {
                res.push(field);
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
        this.custom_filters_options[datatable_field_uid] = [{
            label: this.t('YES'),
            value: true,
            datatable_field_uid: datatable_field_uid
        },
        {
            label: this.t('NO'),
            value: false,
            datatable_field_uid: datatable_field_uid
        }];
    }

    private setMultiSelectFilterOptions(datatable_field_uid: string) {

        this.custom_filters_options[datatable_field_uid] = [];

        console.info('setMultiSelectFilterOptions: ' + datatable_field_uid);

        let field_values: string[] = [];

        for (let i in this.datatable_data) {
            let data = this.datatable_data[i];
            let field_value = data[datatable_field_uid];

            if (field_values.indexOf(field_value) < 0) {
                field_values.push(field_value);
            }
        }

        field_values.sort();

        for (let i in field_values) {
            this.custom_filters_options[datatable_field_uid].push({
                label: (field_values[i] && field_values[i] != '') ? field_values[i] : '-',
                value: field_values[i],
                datatable_field_uid: datatable_field_uid
            });
        }
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

    @Watch('custom_filters_values', { deep: true })
    private onChangeFilterValue() {

        for (let i in this.datatable.fields) {
            let field = this.datatable.fields[i];
            if (field.type == DatatableField.SIMPLE_FIELD_TYPE) {
                let simpleField: SimpleDatatableField<any, any> = field as SimpleDatatableField<any, any>;

                switch (simpleField.moduleTableField.field_type) {
                    case ModuleTableField.FIELD_TYPE_boolean:
                        this.changeBooleanFilterValue(field.datatable_field_uid);
                        continue;

                    case ModuleTableField.FIELD_TYPE_daterange:
                    case ModuleTableField.FIELD_TYPE_date:
                    case ModuleTableField.FIELD_TYPE_day:
                    case ModuleTableField.FIELD_TYPE_month:
                        this.changeTextFilterValue(field.datatable_field_uid);
                        continue;

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
    private async loadDatatable() {
        this.selected_datas = {};
        this.loaded = false;

        this.onRouteChange();

        this.loaded = true;

        this.update_datatable_data();

        for (let i in this.api_types_involved) {
            this.setWatcher(this.api_types_involved[i]);
        }
    }

    get debounced_update_datatable_data() {
        let self = this;
        return debounce(() => {
            self.update_datatable_data();
        }, 500);
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
        this.datatable_data = [];

        for (let j in baseDatas_byid) {
            let baseData: IDistantVOBase = baseDatas_byid[j];

            if (!baseData) {
                continue;
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
            if (this.update_button || this.delete_button) {
                resData[DatatableComponent.ACTIONS_COLUMN_ID] = true;
            }

            for (let i in this.datatable.fields) {
                let field: DatatableField<any, any> = this.datatable.fields[i];

                try {

                    switch (field.type) {
                        case DatatableField.SIMPLE_FIELD_TYPE:
                            resData[field.datatable_field_uid] = field.dataToReadIHM(baseData[(field as SimpleDatatableField<any, any>).moduleTableField.field_id], baseData);
                            break;

                        case DatatableField.COMPUTED_FIELD_TYPE:
                            resData[field.datatable_field_uid] = field.dataToReadIHM(null, baseData);
                            break;

                        case DatatableField.MANY_TO_ONE_FIELD_TYPE:
                            let manyToOneField: ManyToOneReferenceDatatableField<any> = (field) as ManyToOneReferenceDatatableField<any>;

                            // On va chercher la valeur du champs depuis la valeur de la donnée liée
                            if (this.getStoredDatas && this.getStoredDatas[manyToOneField.targetModuleTable.vo_type]) {
                                let ref_data: IDistantVOBase = this.getStoredDatas[manyToOneField.targetModuleTable.vo_type][baseData[manyToOneField.srcField.field_id]];
                                resData[field.datatable_field_uid] = manyToOneField.dataToHumanReadable(ref_data);
                                resData[field.datatable_field_uid + "___id___"] = baseData[manyToOneField.srcField.field_id];
                            }
                            break;

                        // case DatatableField.ONE_TO_MANY_FIELD_TYPE:

                        case DatatableField.MANY_TO_MANY_FIELD_TYPE:
                            let manyToManyField: ManyToManyReferenceDatatableField<any, any> = (field) as ManyToManyReferenceDatatableField<any, any>;

                            resData[field.datatable_field_uid] = [];
                            let dest_ids: number[] = [];
                            let interTargetRefField = manyToManyField.interModuleTable.getRefFieldFromTargetVoType(manyToManyField.targetModuleTable.vo_type);
                            let interSrcRefField = manyToManyField.interModuleTable.getRefFieldFromTargetVoType(manyToManyField.moduleTable.vo_type);

                            for (let interi in this.getStoredDatas[manyToManyField.interModuleTable.vo_type]) {
                                let intervo = this.getStoredDatas[manyToManyField.interModuleTable.vo_type][interi];

                                if (intervo && (intervo[interSrcRefField.field_id] == baseData.id) && (dest_ids.indexOf(intervo[interTargetRefField.field_id]) < 0)) {
                                    dest_ids.push(intervo[interTargetRefField.field_id]);
                                }
                            }

                            for (let desti in dest_ids) {
                                resData[field.datatable_field_uid].push({
                                    id: desti,
                                    label: manyToManyField.dataToHumanReadable(this.getStoredDatas[manyToManyField.targetModuleTable.vo_type][dest_ids[desti]])
                                });
                            }
                            break;

                        default:
                            break;
                    }
                } catch (error) {
                    console.error(error);
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
            this.setMultiSelectFilterOptions(this.multiselect_filtered_fields[i].datatable_field_uid);
        }
        for (let i in this.date_filtered_fields) {
            this.custom_filters_values[this.date_filtered_fields[i].datatable_field_uid] = {
                start: null,
                end: null,
            };
        }
        this.handle_filters_preload();

        for (let i in this.preload_custom_filters) {
            this.onChangeFilterValue();
        }
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

        if (this.update_button || this.delete_button) {
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
        if (this.update_button || this.delete_button) {
            res.push(DatatableComponent.ACTIONS_COLUMN_ID);
        }

        for (let i in this.datatable.fields) {
            let field: DatatableField<any, any> = this.datatable.fields[i];

            if (field.type == DatatableField.INPUT_FIELD_TYPE) {
                continue;
            }
            if (field.type == DatatableField.SIMPLE_FIELD_TYPE) {
                let simpleField: SimpleDatatableField<any, any> = this.datatable.fields[i] as SimpleDatatableField<any, any>;

                if (simpleField.moduleTableField.field_type == ModuleTableField.FIELD_TYPE_html) {
                    continue;
                }
            }

            res.push(field.datatable_field_uid);
        }

        return res;
    }

    get customFilters(): any[] {
        let customFilters: any[] = [];

        if (this.isModuleParamTable) {
            return customFilters;
        }

        for (let j in this.datatable.fields) {
            let field = this.datatable.fields[j];

            customFilters.push({
                name: field.datatable_field_uid,
                callback: function (row, query) {
                    switch (field.type) {
                        case DatatableField.SIMPLE_FIELD_TYPE:
                            let simpleField: SimpleDatatableField<any, any> = field as SimpleDatatableField<any, any>;

                            switch (simpleField.moduleTableField.field_type) {
                                case ModuleTableField.FIELD_TYPE_boolean:
                                    let istrue: boolean = (query == 'VRAI');
                                    return (row[field.datatable_field_uid] && istrue) || ((!row[field.datatable_field_uid]) && !istrue);

                                case ModuleTableField.FIELD_TYPE_daterange:
                                    if ((!query) || ((!query.start) && (!query.end))) {
                                        return true;
                                    }

                                    let parts: string[] = row[field.datatable_field_uid].split('-');
                                    if ((!parts) || (parts.length <= 0)) {
                                        return row[field.datatable_field_uid];
                                    }

                                    let dateStart: Moment = null;
                                    let dateEnd: Moment = null;
                                    if (parts[0] && parts[0].trim() && (parts[0].trim() != "")) {
                                        dateStart = ModuleFormatDatesNombres.getInstance().getMomentFromFormatted_FullyearMonthDay(parts[0].trim());
                                    }
                                    if (parts[1] && parts[1].trim() && (parts[1].trim() != "")) {
                                        dateEnd = ModuleFormatDatesNombres.getInstance().getMomentFromFormatted_FullyearMonthDay(parts[1].trim());
                                    }

                                    let queryStart = moment(query.start);
                                    if (query.start && dateEnd && dateEnd.isBefore(queryStart)) {
                                        return false;
                                    }

                                    let queryEnd = moment(query.end);
                                    if (query.end && dateStart && dateStart.isAfter(queryEnd)) {
                                        return false;
                                    }

                                    return true;

                                case ModuleTableField.FIELD_TYPE_date:
                                case ModuleTableField.FIELD_TYPE_day:
                                    if ((!query) || ((!query.start) && (!query.end))) {
                                        return true;
                                    }

                                    let date: Moment = ModuleFormatDatesNombres.getInstance().getMomentFromFormatted_FullyearMonthDay(row[field.datatable_field_uid]);

                                    let queryStart_ = moment(query.start);
                                    if (query.start && date.isBefore(queryStart_)) {
                                        return false;
                                    }

                                    let queryEnd_ = moment(query.end);
                                    if (query.end && date.isAfter(queryEnd_)) {
                                        return false;
                                    }

                                    return true;

                                case ModuleTableField.FIELD_TYPE_month:
                                    if ((!query) || ((!query.start) && (!query.end))) {
                                        return true;
                                    }

                                    date = ModuleFormatDatesNombres.getInstance().getMomentFromFormatted_FullyearMonthDay(moment(row[field.datatable_field_uid], 'MMM YYYY'));
                                    queryStart_ = moment(query.start);
                                    if (query.start && date.isBefore(queryStart_)) {
                                        return false;
                                    }

                                    queryEnd_ = moment(query.end);
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
                            break;

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
                            break;

                        case DatatableField.COMPUTED_FIELD_TYPE:
                            if (!query) {
                                return true;
                            }

                            if (row[field.datatable_field_uid] && ((row[field.datatable_field_uid].toString().toLowerCase()).indexOf(query.toLowerCase()) >= 0)) {
                                return true;
                            }
                            return false;

                            break;
                        default:
                    }
                }
            });
        }
        return customFilters;
    }

    get datatable_options(): any {
        // if (!this.preloadFilter) {
        //     this.handle_filters_preload();
        // }

        return {
            filterByColumn: true,
            filterable: [],
            perPage: 15,
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
            customSorting: this.customSorting
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
}