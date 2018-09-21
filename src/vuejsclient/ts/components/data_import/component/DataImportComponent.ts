import * as $ from 'jquery';
import * as moment from 'moment';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import IImportedData from '../../../../../shared/modules/DataImport/interfaces/IImportedData';
import ModuleDataImport from '../../../../../shared/modules/DataImport/ModuleDataImport';
import DataImportFormatVO from '../../../../../shared/modules/DataImport/vos/DataImportFormatVO';
import DataImportHistoricVO from '../../../../../shared/modules/DataImport/vos/DataImportHistoricVO';
import TimeSegment from '../../../../../shared/modules/DataRender/vos/TimeSegment';
import FileVO from '../../../../../shared/modules/File/vos/FileVO';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import DateHandler from '../../../../../shared/tools/DateHandler';
import TimeSegmentHandler from '../../../../../shared/tools/TimeSegmentHandler';
import { ModuleDAOAction, ModuleDAOGetter } from '../../../../ts/components/dao/store/DaoStore';
import VueComponentBase from '../../../../ts/components/VueComponentBase';
import FileComponentManager from '../../file/FileComponentManager';
import FileComponent from '../../file/FileComponent';
import VueAppController from '../../../../VueAppController';
import './DataImportComponent.scss';
import DataImportAdminVueModule from '../DataImportAdminVueModule';
import DataImportLogVO from '../../../../../shared/modules/DataImport/vos/DataImportLogVO';
import ModuleAjaxCache from '../../../../../shared/modules/AjaxCache/ModuleAjaxCache';
import { ModuleDataImportGetter, ModuleDataImportAction } from '../store/DataImportStore';
import DataImportComponentBase from '../base/DataImportComponentBase';

@Component({
    template: require('./DataImportComponent.pug'),
    components: {
        fileinput: FileComponent
    }
})
export default class DataImportComponent extends DataImportComponentBase {
    @ModuleDAOGetter
    public getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } };

    @ModuleDAOAction
    public storeDatas: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void;
    @ModuleDAOAction
    public storeData: (vo: IDistantVOBase) => void;

    @ModuleDataImportAction
    public previous_segments: () => void;
    @ModuleDataImportAction
    public next_segments: () => void;

    @ModuleDataImportAction
    public setlower_segment: (getlower_segment: TimeSegment) => void;

    @ModuleDataImportGetter
    public hasValidOptions: boolean;

    @ModuleDataImportGetter
    public getHistoricOptionsTester: (historic: DataImportHistoricVO, options: any) => boolean;

    @ModuleDataImportGetter
    public getOptions: any;

    @ModuleDataImportGetter
    public getsegments: TimeSegment[];

    @ModuleDataImportGetter
    public getsegment_type: number;

    @ModuleDataImportGetter
    public getsegment_offset: number;

    @ModuleDataImportGetter
    public getlower_segment: TimeSegment;

    @ModuleDataImportGetter
    public getsegment_number: number;

    @ModuleDataImportGetter
    public getApiTypeIdTester: (api_type_id: string) => boolean;

    @ModuleDataImportAction
    public setOptionsValidator: (options_validator: (options: any) => boolean) => void;

    @Prop()
    public title: string;

    @Prop({ default: null })
    public import_overview_component: VueComponentBase;
    @Prop({ default: null })
    public import_param_component: VueComponentBase;


    @Prop()
    public api_type_ids: string[];

    @Prop()
    public route_path: string;

    @Prop({ default: null })
    public valid_segments: TimeSegment[];

    @Prop({ default: null })
    public initial_selected_segment: string;

    @Prop({ default: false })
    public modal_show: boolean;

    @Prop({ default: null })
    public get_url_for_modal: (segment_date_index: string) => string;

    private selected_segment: TimeSegment = null;

    private previous_import_historics: { [segment_date_index: string]: { [api_type_id: string]: DataImportHistoricVO } } = {};

    private autovalidate: boolean = false;

    public hasSelectedOptions(historic: DataImportHistoricVO): boolean {
        return this.getHistoricOptionsTester(historic, this.getOptions);
    }

    private check_change_import_historics(): boolean {
        if (!this.import_historics) {
            return !!this.previous_import_historics;
        }

        for (let segment_date_index in this.import_historics) {
            if (!this.import_historics[segment_date_index]) {

                if (this.previous_import_historics[segment_date_index]) {
                    return true;
                }
                continue;
            }

            if (!this.previous_import_historics[segment_date_index]) {
                return true;
            }

            for (let j in this.import_historics[segment_date_index]) {
                if (this.check_change_import_historic(this.import_historics[segment_date_index][j], this.previous_import_historics[segment_date_index][j])) {
                    return true;
                }
            }
        }

        return false;
    }



    protected async mounted() {
        await this.on_mount();
    }

    public async initialize_on_mount() {
    }

    @Watch("$route")
    public async onrouteChange() {
        this.handle_modal_show_hide();
    }
    public async on_show_modal() {

        this.selected_segment = null;
        if (!this.initial_selected_segment) {
            return;
        }
        for (let i in this.getsegments) {
            if (this.getsegments[i].dateIndex == this.initial_selected_segment) {
                await this.select_segment(this.getsegments[i]);
                return;
            }
        }

        // Si le segment est pas chargé on le cible pour le trouver dans la liste
        this.setlower_segment(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(moment(this.initial_selected_segment), this.getsegment_type, -Math.floor(this.getsegment_number / 2)));
        await this.select_segment(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(moment(this.initial_selected_segment), this.getsegment_type));
    }

    private async select_segment(segment: TimeSegment) {
        await this.loadRawImportedDatas(segment);
        this.selected_segment = segment;
    }

    get valid_api_type_ids(): string[] {
        let res: string[] = [];

        for (let i in this.api_type_ids) {
            if (this.getApiTypeIdTester(this.api_type_ids[i])) {
                res.push(this.api_type_ids[i]);
            }
        }

        return res;
    }

    get segment_states(): { [date_index: string]: string } {
        let res: { [date_index: string]: string } = {};

        if ((!this.valid_api_type_ids) || (!this.valid_api_type_ids.length)) {
            return res;
        }

        for (let i in this.getsegments) {
            let segment: TimeSegment = this.getsegments[i];

            if (!this.is_valid_segments[segment.dateIndex]) {
                res[segment.dateIndex] = this.state_unavail;
                continue;
            }

            // Un segment est ko si tous les valid_api_type_ids sont ko
            //  Un api_type est ko si il n'y a pas d'historique
            //      ou si l'historique est en erreur
            // Un segment est ok si tous les api_types_ids sont ok
            //  Un api_type est ok si il y a un historique et 
            //      que celui-ci est en statut posttreated
            // Un segment est info si un api_type est en info
            //  Un api_type est info si il est est en attente de validation du formattage
            // Un segment est none si tous les api_type_id sont none
            // Un segment est warn dans tous les autres cas
            let all_ok: boolean = true;
            let all_ko: boolean = true;
            let all_none: boolean = true;
            let has_info: boolean = false;
            for (let j in this.api_types_ids_states[segment.dateIndex]) {
                if (this.api_types_ids_states[segment.dateIndex][j] != this.state_ok) {
                    all_ok = false;
                }
                if (this.api_types_ids_states[segment.dateIndex][j] != this.state_none) {
                    all_none = false;
                }
                if (this.api_types_ids_states[segment.dateIndex][j] != this.state_ko) {
                    all_ko = false;
                }
                if (this.api_types_ids_states[segment.dateIndex][j] == this.state_info) {
                    has_info = true;
                }
            }
            if (all_none) {
                res[segment.dateIndex] = this.state_none;
                continue;
            }
            if (all_ko) {
                res[segment.dateIndex] = this.state_ko;
                continue;
            }
            if (all_ok && !has_info) {
                res[segment.dateIndex] = this.state_ok;
                continue;
            }
            if (has_info) {
                res[segment.dateIndex] = this.state_info;
                continue;
            }
            res[segment.dateIndex] = this.state_warn;
        }

        return res;
    }


    get api_types_ids_states(): { [segment_date_index: string]: { [api_type_id: string]: string } } {
        let res: { [segment_date_index: string]: { [api_type_id: string]: string } } = {}

        if (!this.import_historics) {
            return res;
        }

        for (let i in this.getsegments) {
            let segment: TimeSegment = this.getsegments[i];
            res[segment.dateIndex] = {};

            for (let j in this.valid_api_type_ids) {
                let api_type_id: string = this.valid_api_type_ids[j];
                let historic: DataImportHistoricVO = this.import_historics[segment.dateIndex] ? this.import_historics[segment.dateIndex][api_type_id] : null;

                if (!this.is_valid_segments[segment.dateIndex]) {
                    res[segment.dateIndex][api_type_id] = this.state_unavail;
                    continue;
                }

                if (!historic) {
                    res[segment.dateIndex][api_type_id] = this.state_none;
                    continue;
                }

                switch (historic.state) {
                    case ModuleDataImport.IMPORTATION_STATE_POSTTREATED:
                        res[segment.dateIndex][api_type_id] = this.state_ok;
                        break;
                    case ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION:
                    case ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT:
                    case ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED:
                        res[segment.dateIndex][api_type_id] = this.state_ko;
                        break;
                    case ModuleDataImport.IMPORTATION_STATE_FORMATTED:
                        res[segment.dateIndex][api_type_id] = this.state_info;
                        break;
                    case ModuleDataImport.IMPORTATION_STATE_FORMATTING:
                    case ModuleDataImport.IMPORTATION_STATE_IMPORTED:
                    case ModuleDataImport.IMPORTATION_STATE_IMPORTING:
                    case ModuleDataImport.IMPORTATION_STATE_POSTTREATING:
                    case ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT:
                    case ModuleDataImport.IMPORTATION_STATE_UPLOADED:
                    default:
                        res[segment.dateIndex][api_type_id] = this.state_warn;
                }
            }
        }

        return res;
    }

    get is_valid_segments(): { [date_index: string]: boolean } {
        let res: { [date_index: string]: boolean } = {};

        for (let i in this.getsegments) {
            let segment: TimeSegment = this.getsegments[i];

            res[segment.dateIndex] = this.valid_segments ? false : true;
            for (let j in this.valid_segments) {
                if (this.valid_segments[j].dateIndex == segment.dateIndex) {
                    res[segment.dateIndex] = true;
                }
            }
        }

        return res;
    }

    @Watch('import_historics')
    private async loadRawImportedDatasSelected_segment(timeSegment: TimeSegment) {
        if (!this.check_change_import_historics()) {
            return;
        }
        this.previous_import_historics = Object.assign({}, this.import_historics);
        await this.loadRawImportedDatas(this.selected_segment);
    }

    private async loadRawImportedDatas(timeSegment: TimeSegment) {
        let promises: Array<Promise<any>> = [];
        let self = this;
        let files_ids: number[] = [];

        if ((!this.import_historics) || (!timeSegment) || (!this.import_historics[timeSegment.dateIndex])) {
            return;
        }

        console.log('loadRawImportedDatas:' + timeSegment.dateIndex);

        for (let i in this.import_historics[timeSegment.dateIndex]) {

            let historic: DataImportHistoricVO = this.import_historics[timeSegment.dateIndex][i];
            this.pushPromisesToLoadDataFromHistoric(historic, files_ids, promises);
        }

        await Promise.all(promises);
    }

    get imported_file(): FileVO {

        if ((!this.getStoredDatas) || (!this.getStoredDatas[FileVO.API_TYPE_ID]) || (!this.import_historics)) {
            return null;
        }

        if ((!this.import_historics) || (!this.selected_segment) || (!this.import_historics[this.selected_segment.dateIndex])) {
            return null;
        }

        for (let api_type_id in this.import_historics[this.selected_segment.dateIndex]) {
            let historic = this.import_historics[this.selected_segment.dateIndex][api_type_id];

            if (!historic) {
                continue;
            }

            return this.getStoredDatas[FileVO.API_TYPE_ID][historic.file_id] as FileVO;
        }
    }

    get api_types_ids_formats(): { [api_type_id: string]: DataImportFormatVO[] } {
        let res: { [api_type_id: string]: DataImportFormatVO[] } = {};

        if ((!this.getStoredDatas) || (!this.getStoredDatas[DataImportFormatVO.API_TYPE_ID])) {
            return res;
        }

        for (let i in this.getStoredDatas[DataImportFormatVO.API_TYPE_ID]) {
            let format: DataImportFormatVO = this.getStoredDatas[DataImportFormatVO.API_TYPE_ID][i] as DataImportFormatVO;

            if ((!format) || (this.valid_api_type_ids.indexOf(format.api_type_id) < 0)) {
                continue;
            }

            if (!res[format.api_type_id]) {
                res[format.api_type_id] = [];
            }
            res[format.api_type_id].push(format);
        }

        return res;
    }

    get import_historics(): { [segment_date_index: string]: { [api_type_id: string]: DataImportHistoricVO } } {
        let res: { [segment_date_index: string]: { [api_type_id: string]: DataImportHistoricVO } } = {};

        if ((!this.getStoredDatas) || (!this.getStoredDatas[DataImportHistoricVO.API_TYPE_ID])) {
            return res;
        }

        for (let i in this.getStoredDatas[DataImportHistoricVO.API_TYPE_ID]) {
            let historic: DataImportHistoricVO = this.getStoredDatas[DataImportHistoricVO.API_TYPE_ID][i] as DataImportHistoricVO;

            if (!historic) {
                continue;
            }

            if (!this.hasSelectedOptions(historic)) {
                continue;
            }

            if ((!this.valid_api_type_ids) || (this.valid_api_type_ids.indexOf(historic.api_type_id) < 0)) {
                continue;
            }

            let api_type_id = historic.api_type_id;

            for (let j in this.getsegments) {
                let segment: TimeSegment = this.getsegments[j];

                if (historic.segment_date_index != segment.dateIndex) {
                    continue;
                }

                if (!res[segment.dateIndex]) {
                    res[segment.dateIndex] = {};
                }

                if (res[segment.dateIndex][api_type_id] && moment(res[segment.dateIndex][api_type_id].start_date).isAfter(historic.start_date)) {
                    continue;
                }

                res[segment.dateIndex][api_type_id] = historic;
            }
        }

        return res;
    }

    get labels(): { [api_type_id: string]: string } {
        let res: { [api_type_id: string]: string } = {};

        if ((!this.import_historics) || (!this.selected_segment) || (!this.import_historics[this.selected_segment.dateIndex])) {
            return res;
        }

        for (let i in this.import_historics[this.selected_segment.dateIndex]) {

            if (!this.import_historics[this.selected_segment.dateIndex][i]) {
                continue;
            }

            let historic: DataImportHistoricVO = this.import_historics[this.selected_segment.dateIndex][i];
            let format: DataImportFormatVO = this.getStoredDatas[DataImportFormatVO.API_TYPE_ID][historic.data_import_format_id] as DataImportFormatVO;

            if (!format) {
                res[historic.api_type_id] = this.label('import.api_type_ids.' + historic.api_type_id);
                continue;
            }

            res[historic.api_type_id] = this.label(format.import_uid);
        }

        return res;
    }

    get format_validated(): { [api_type_id: string]: boolean } {
        let res: { [api_type_id: string]: boolean } = {};

        if ((!this.import_historics) || (!this.selected_segment) || (!this.import_historics[this.selected_segment.dateIndex])) {
            return res;
        }

        for (let i in this.import_historics[this.selected_segment.dateIndex]) {
            let historic: DataImportHistoricVO = this.import_historics[this.selected_segment.dateIndex][i];

            switch (historic.state) {
                case ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION:
                case ModuleDataImport.IMPORTATION_STATE_POSTTREATED:
                case ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT:
                case ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT:
                case ModuleDataImport.IMPORTATION_STATE_IMPORTING:
                case ModuleDataImport.IMPORTATION_STATE_IMPORTED:
                case ModuleDataImport.IMPORTATION_STATE_POSTTREATING:
                    res[historic.api_type_id] = true;
                    break;

                case ModuleDataImport.IMPORTATION_STATE_FORMATTING:
                case ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED:
                case ModuleDataImport.IMPORTATION_STATE_FORMATTED:
                case ModuleDataImport.IMPORTATION_STATE_UPLOADED:
                default:
                    res[historic.api_type_id] = false;
            }
        }
        return res;
    }
    get has_formatted_datas(): { [api_type_id: string]: boolean } {
        let res: { [api_type_id: string]: boolean } = {};

        if ((!this.import_historics) || (!this.selected_segment) || (!this.import_historics[this.selected_segment.dateIndex])) {
            return res;
        }

        for (let i in this.import_historics[this.selected_segment.dateIndex]) {
            let historic: DataImportHistoricVO = this.import_historics[this.selected_segment.dateIndex][i];

            switch (historic.state) {
                case ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT:
                case ModuleDataImport.IMPORTATION_STATE_IMPORTING:
                case ModuleDataImport.IMPORTATION_STATE_IMPORTED:
                case ModuleDataImport.IMPORTATION_STATE_POSTTREATING:
                case ModuleDataImport.IMPORTATION_STATE_FORMATTED:
                    res[historic.api_type_id] = true;
                    break;

                case ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED:
                case ModuleDataImport.IMPORTATION_STATE_POSTTREATED:
                case ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION:
                case ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT:
                case ModuleDataImport.IMPORTATION_STATE_FORMATTING:
                case ModuleDataImport.IMPORTATION_STATE_UPLOADED:
                default:
                    res[historic.api_type_id] = false;
            }
        }
        return res;
    }

    get format_invalidated(): { [api_type_id: string]: boolean } {
        let res: { [api_type_id: string]: boolean } = {};

        if ((!this.import_historics) || (!this.selected_segment) || (!this.import_historics[this.selected_segment.dateIndex])) {
            return res;
        }

        for (let i in this.import_historics[this.selected_segment.dateIndex]) {
            let historic: DataImportHistoricVO = this.import_historics[this.selected_segment.dateIndex][i];

            switch (historic.state) {
                case ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED:
                    res[historic.api_type_id] = true;
                    break;

                default:
                    res[historic.api_type_id] = false;
            }
        }
        return res;
    }

    get nb_validated_format_elements(): { [api_type_id: string]: number } {
        let res: { [api_type_id: string]: number } = {};

        if ((!this.import_historics) || (!this.selected_segment) || (!this.import_historics[this.selected_segment.dateIndex])) {
            return res;
        }

        for (let i in this.import_historics[this.selected_segment.dateIndex]) {
            let historic: DataImportHistoricVO = this.import_historics[this.selected_segment.dateIndex][i];

            res[historic.api_type_id] = historic.nb_row_validated;
            // res[historic.api_type_id] = 0;

            // let raw_imported_datas: { [id: number]: IImportedData } = this.getStoredDatas[ModuleDataImport.getInstance().getRawImportedDatasAPI_Type_Id(historic.api_type_id)] as { [id: number]: IImportedData };
            // for (let j in raw_imported_datas) {
            //     switch (raw_imported_datas[j].importation_state) {
            //         case ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION:
            //         case ModuleDataImport.IMPORTATION_STATE_POSTTREATED:
            //         case ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT:
            //         case ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT:
            //         case ModuleDataImport.IMPORTATION_STATE_IMPORTING:
            //         case ModuleDataImport.IMPORTATION_STATE_IMPORTED:
            //         case ModuleDataImport.IMPORTATION_STATE_POSTTREATING:
            //             res[historic.api_type_id]++;
            //             break;

            //         default:
            //     }
            // }
        }
        return res;
    }

    get nb_unvalidated_format_elements(): { [api_type_id: string]: number } {
        let res: { [api_type_id: string]: number } = {};

        if ((!this.import_historics) || (!this.selected_segment) || (!this.import_historics[this.selected_segment.dateIndex])) {
            return res;
        }

        for (let i in this.import_historics[this.selected_segment.dateIndex]) {
            let historic: DataImportHistoricVO = this.import_historics[this.selected_segment.dateIndex][i];

            res[historic.api_type_id] = historic.nb_row_unvalidated;
            // res[historic.api_type_id] = 0;

            // let raw_imported_datas: { [id: number]: IImportedData } = this.getStoredDatas[ModuleDataImport.getInstance().getRawImportedDatasAPI_Type_Id(historic.api_type_id)] as { [id: number]: IImportedData };
            // for (let j in raw_imported_datas) {
            //     switch (raw_imported_datas[j].importation_state) {
            //         case ModuleDataImport.IMPORTATION_STATE_FORMATTING:
            //         case ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED:
            //         case ModuleDataImport.IMPORTATION_STATE_FORMATTED:
            //         case ModuleDataImport.IMPORTATION_STATE_UPLOADED:
            //             res[historic.api_type_id]++;
            //             break;
            //         default:
            //     }
            // }
        }
        return res;
    }

    get needs_format_validation(): { [api_type_id: string]: boolean } {
        let res: { [api_type_id: string]: boolean } = {};

        if ((!this.import_historics) || (!this.selected_segment) || (!this.import_historics[this.selected_segment.dateIndex])) {
            return res;
        }

        for (let i in this.import_historics[this.selected_segment.dateIndex]) {
            let historic: DataImportHistoricVO = this.import_historics[this.selected_segment.dateIndex][i];

            res[historic.api_type_id] = false;
            switch (historic.state) {
                case ModuleDataImport.IMPORTATION_STATE_FORMATTED:
                    res[historic.api_type_id] = true;
                    break;

                default:
            }
        }
        return res;
    }

    private async continue_importation(api_type_id: string) {
        if ((!this.selected_segment) || (!this.import_historics) || (!this.import_historics[this.selected_segment.dateIndex])) {
            return;
        }

        if (this.import_historics[this.selected_segment.dateIndex][api_type_id].state != ModuleDataImport.IMPORTATION_STATE_FORMATTED) {
            return;
        }

        this.import_historics[this.selected_segment.dateIndex][api_type_id].state = ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT;
        await ModuleDAO.getInstance().insertOrUpdateVO(this.import_historics[this.selected_segment.dateIndex][api_type_id]);
    }

    private async cancel_importation(api_type_id: string) {
        if ((!this.selected_segment) || (!this.import_historics) || (!this.import_historics[this.selected_segment.dateIndex])) {
            return;
        }

        if (this.import_historics[this.selected_segment.dateIndex][api_type_id].state != ModuleDataImport.IMPORTATION_STATE_FORMATTED) {
            return;
        }

        this.import_historics[this.selected_segment.dateIndex][api_type_id].state = ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED;
        await ModuleDAO.getInstance().insertOrUpdateVO(this.import_historics[this.selected_segment.dateIndex][api_type_id]);
    }

    get imported(): { [api_type_id: string]: boolean } {
        let res: { [api_type_id: string]: boolean } = {};

        if ((!this.import_historics) || (!this.selected_segment) || (!this.import_historics[this.selected_segment.dateIndex])) {
            return res;
        }

        for (let i in this.import_historics[this.selected_segment.dateIndex]) {
            let historic: DataImportHistoricVO = this.import_historics[this.selected_segment.dateIndex][i];

            switch (historic.state) {
                case ModuleDataImport.IMPORTATION_STATE_POSTTREATED:
                case ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT:
                case ModuleDataImport.IMPORTATION_STATE_IMPORTED:
                case ModuleDataImport.IMPORTATION_STATE_POSTTREATING:
                    res[historic.api_type_id] = true;
                    break;

                default:
                    res[historic.api_type_id] = false;
            }
        }
        return res;
    }

    get import_failed(): { [api_type_id: string]: boolean } {
        let res: { [api_type_id: string]: boolean } = {};

        if ((!this.import_historics) || (!this.selected_segment) || (!this.import_historics[this.selected_segment.dateIndex])) {
            return res;
        }

        for (let i in this.import_historics[this.selected_segment.dateIndex]) {
            let historic: DataImportHistoricVO = this.import_historics[this.selected_segment.dateIndex][i];

            switch (historic.state) {
                case ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION:
                    res[historic.api_type_id] = true;
                    break;

                default:
                    res[historic.api_type_id] = false;
            }
        }
        return res;
    }

    get posttreated(): { [api_type_id: string]: boolean } {
        let res: { [api_type_id: string]: boolean } = {};

        if ((!this.import_historics) || (!this.selected_segment) || (!this.import_historics[this.selected_segment.dateIndex])) {
            return res;
        }

        for (let i in this.import_historics[this.selected_segment.dateIndex]) {
            let historic: DataImportHistoricVO = this.import_historics[this.selected_segment.dateIndex][i];

            switch (historic.state) {
                case ModuleDataImport.IMPORTATION_STATE_POSTTREATED:
                    res[historic.api_type_id] = true;
                    break;

                default:
                    res[historic.api_type_id] = false;
            }
        }
        return res;
    }


    get formatting(): { [api_type_id: string]: boolean } {
        let res: { [api_type_id: string]: boolean } = {};

        if ((!this.import_historics) || (!this.selected_segment) || (!this.import_historics[this.selected_segment.dateIndex])) {
            return res;
        }

        for (let i in this.import_historics[this.selected_segment.dateIndex]) {
            let historic: DataImportHistoricVO = this.import_historics[this.selected_segment.dateIndex][i];

            switch (historic.state) {
                case ModuleDataImport.IMPORTATION_STATE_FORMATTING:
                    res[historic.api_type_id] = true;
                    break;

                default:
                    res[historic.api_type_id] = false;
            }
        }
        return res;
    }


    get importing(): { [api_type_id: string]: boolean } {
        let res: { [api_type_id: string]: boolean } = {};

        if ((!this.import_historics) || (!this.selected_segment) || (!this.import_historics[this.selected_segment.dateIndex])) {
            return res;
        }

        for (let i in this.import_historics[this.selected_segment.dateIndex]) {
            let historic: DataImportHistoricVO = this.import_historics[this.selected_segment.dateIndex][i];

            switch (historic.state) {
                case ModuleDataImport.IMPORTATION_STATE_IMPORTING:
                    res[historic.api_type_id] = true;
                    break;

                default:
                    res[historic.api_type_id] = false;
            }
        }
        return res;
    }


    get posttreating(): { [api_type_id: string]: boolean } {
        let res: { [api_type_id: string]: boolean } = {};

        if ((!this.import_historics) || (!this.selected_segment) || (!this.import_historics[this.selected_segment.dateIndex])) {
            return res;
        }

        for (let i in this.import_historics[this.selected_segment.dateIndex]) {
            let historic: DataImportHistoricVO = this.import_historics[this.selected_segment.dateIndex][i];

            switch (historic.state) {
                case ModuleDataImport.IMPORTATION_STATE_POSTTREATING:
                    res[historic.api_type_id] = true;
                    break;

                default:
                    res[historic.api_type_id] = false;
            }
        }
        return res;
    }


    get posttreat_failed(): { [api_type_id: string]: boolean } {
        let res: { [api_type_id: string]: boolean } = {};

        if ((!this.import_historics) || (!this.selected_segment) || (!this.import_historics[this.selected_segment.dateIndex])) {
            return res;
        }

        for (let i in this.import_historics[this.selected_segment.dateIndex]) {
            let historic: DataImportHistoricVO = this.import_historics[this.selected_segment.dateIndex][i];

            switch (historic.state) {
                case ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT:
                    res[historic.api_type_id] = true;
                    break;

                default:
                    res[historic.api_type_id] = false;
            }
        }
        return res;
    }

    /**
     * On veut la liste des formats de fichiers acceptables pour importation, 
     *  en prenant l'ensemble commun à tous les valid_api_type_ids (si on peut importer un CSV
     *  mais sur un seul api_type_id et pas sur les autres on refuse, le but sur la page
     *  est de gérer un seul fichier pour plusieurs imports)
     */
    get acceptedFiles(): string {
        let res: string[] = null;

        for (let i in this.valid_api_type_ids) {
            let api_type_id: string = this.valid_api_type_ids[i];

            let api_type_id_accepted_files: string[] = [];
            for (let j in this.api_types_ids_formats) {
                let api_type_id_formats: DataImportFormatVO[] = this.api_types_ids_formats[j];

                for (let k in api_type_id_formats) {
                    let api_type_id_format: DataImportFormatVO = api_type_id_formats[k];

                    switch (api_type_id_format.type) {
                        case DataImportFormatVO.TYPE_CSV:
                            if (api_type_id_accepted_files.indexOf('.csv') < 0) {
                                api_type_id_accepted_files.push('.csv');
                            }
                        case DataImportFormatVO.TYPE_XLS:
                        case DataImportFormatVO.TYPE_XLSX:
                            if (api_type_id_accepted_files.indexOf('.xls') < 0) {
                                api_type_id_accepted_files.push('.xls');
                            }
                            if (api_type_id_accepted_files.indexOf('.xlsx') < 0) {
                                api_type_id_accepted_files.push('.xlsx');
                            }
                        default:
                    }
                }
            }

            if (!res) {
                res = api_type_id_accepted_files;
                continue;
            }

            let new_res: string[] = [];
            for (let j in res) {
                let test_res: string = res[j];

                if (api_type_id_accepted_files.indexOf(test_res) >= 0) {
                    new_res.push(test_res);
                }
            }

            res = new_res;
        }

        return res ? res.join(',') : "";
    }

    get unfinished_imports(): DataImportHistoricVO[] {
        let res: DataImportHistoricVO[] = [];

        for (let i in this.getStoredDatas[DataImportHistoricVO.API_TYPE_ID]) {
            let historic: DataImportHistoricVO = this.getStoredDatas[DataImportHistoricVO.API_TYPE_ID][i] as DataImportHistoricVO;

            if (!historic) {
                continue;
            }

            switch (historic.state) {
                case ModuleDataImport.IMPORTATION_STATE_FORMATTED:
                case ModuleDataImport.IMPORTATION_STATE_FORMATTING:
                case ModuleDataImport.IMPORTATION_STATE_IMPORTED:
                case ModuleDataImport.IMPORTATION_STATE_IMPORTING:
                case ModuleDataImport.IMPORTATION_STATE_POSTTREATING:
                case ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT:
                case ModuleDataImport.IMPORTATION_STATE_UPLOADED:
                    res.push(historic);
                    break;

                case ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION:
                case ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT:
                case ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED:
                case ModuleDataImport.IMPORTATION_STATE_POSTTREATED:
                default:
            }
        }

        return res;
    }

    get dropzoneOptions(): { [segment_date_index: string]: any } {

        let res: { [segment_date_index: string]: any } = {};
        let self = this;

        for (let i in this.getsegments) {
            let segment = this.getsegments[i];

            res[segment.dateIndex] = ((segment_date_index: string): any => {
                return {
                    createImageThumbnails: false,
                    acceptedFiles: self.acceptedFiles,
                    error: (infos, error_message) => {
                        self.snotify.error(error_message);
                    },
                    accept: (file, done) => {

                        this.checkUnfinishedImportsAndReplacement(segment_date_index, done);
                    }
                }
            })(segment.dateIndex);
        }
        return res;
    }

    private async checkUnfinishedImportsAndReplacement(segment_date_index: string, done) {
        let self = this;

        if (self.unfinished_imports && (self.unfinished_imports.length > 0)) {
            self.snotify.confirm(self.label('import.cancel_unfinished_imports.body'), self.label('import.cancel_unfinished_imports.title'), {
                timeout: 10000,
                showProgressBar: true,
                closeOnClick: false,
                pauseOnHover: true,
                buttons: [
                    {
                        text: self.t('YES'),
                        action: async (toast) => {
                            self.$snotify.remove(toast.id);
                            self.snotify.info(self.label('import.cancel_unfinished_imports.cancelling'));

                            let unfinished_imports = self.unfinished_imports;
                            for (let i in unfinished_imports) {
                                unfinished_imports[i].state = ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED;
                            }
                            await ModuleDAO.getInstance().insertOrUpdateVOs(unfinished_imports);

                            this.checkReplaceExistingImport(segment_date_index, done);
                        },
                        bold: false
                    },
                    {
                        text: self.t('NO'),
                        action: (toast) => {
                            self.$snotify.remove(toast.id);
                            done(self.label('import.new_historic_confirmation.cancelled'));
                        }
                    }
                ]
            });
        } else {

            this.checkReplaceExistingImport(segment_date_index, done);
        }
    }

    private async checkReplaceExistingImport(segment_date_index: string, done) {
        let self = this;

        if (self.import_historics && self.import_historics[segment_date_index]) {
            self.snotify.confirm(self.label('import.new_historic_confirmation.body'), self.label('import.new_historic_confirmation.title'), {
                timeout: 10000,
                showProgressBar: true,
                closeOnClick: false,
                pauseOnHover: true,
                buttons: [
                    {
                        text: self.t('YES'),
                        action: (toast) => {
                            done();
                            self.$snotify.remove(toast.id);
                            self.snotify.info(self.label('import.upload_started'));
                        },
                        bold: false
                    },
                    {
                        text: self.t('NO'),
                        action: (toast) => {
                            done(self.label('import.new_historic_confirmation.cancelled'));
                            self.$snotify.remove(toast.id);
                        }
                    }
                ]
            });
        } else {
            done();
            self.snotify.info(self.label('import.upload_started'));
        }
    }

    private async uploadedFile(segment_date_index: string, fileVo: FileVO) {
        if ((!fileVo) || (!fileVo.id)) {
            return;
        }

        let importHistorics: DataImportHistoricVO[] = [];
        for (let i in this.valid_api_type_ids) {
            let api_type_id: string = this.valid_api_type_ids[i];

            let importHistoric: DataImportHistoricVO = new DataImportHistoricVO();
            importHistoric.api_type_id = api_type_id;
            importHistoric.file_id = fileVo.id;
            importHistoric.autovalidate = this.autovalidate;
            importHistoric.segment_type = this.getsegment_type;
            importHistoric.import_type = DataImportHistoricVO.IMPORT_TYPE_REPLACE;
            importHistoric.params = JSON.stringify(this.getOptions);
            importHistoric.segment_date_index = segment_date_index;
            importHistoric.state = ModuleDataImport.IMPORTATION_STATE_UPLOADED;
            importHistoric.user_id = VueAppController.getInstance().data_user.id;

            importHistorics.push(importHistoric);
        }
        await ModuleDAO.getInstance().insertOrUpdateVOs(importHistorics);

        this.$router.push(this.get_url_for_modal ? this.get_url_for_modal(segment_date_index) : this.route_path + '/' + DataImportAdminVueModule.IMPORT_MODAL + '/' + segment_date_index);

        this.openModalDateIndex(segment_date_index);
    }

    private openModalDateIndex(segment_date_index: string) {
        this.$router.push(this.get_url_for_modal ? this.get_url_for_modal(segment_date_index) : this.route_path + '/' + DataImportAdminVueModule.IMPORT_MODAL + '/' + segment_date_index);
    }

    private openModal(segment: TimeSegment) {
        this.openModalDateIndex(segment.dateIndex);
    }

    get logs_path(): { [api_type_id: string]: string } {
        let res: { [api_type_id: string]: string } = {};

        if ((!this.import_historics) || (!this.selected_segment) || (!this.import_historics[this.selected_segment.dateIndex])) {
            return res;
        }

        for (let i in this.import_historics[this.selected_segment.dateIndex]) {
            let historic: DataImportHistoricVO = this.import_historics[this.selected_segment.dateIndex][i];

            res[historic.api_type_id] = this.getCRUDLink(DataImportLogVO.API_TYPE_ID) + "?FILTER__data_import_historic_id=" + historic.id;
        }
        return res;
    }

    get raw_datas_path(): { [api_type_id: string]: string } {
        return this.getRaw_datas_path(null);//'import.state.ready_to_import');
    }

    private getRaw_datas_path(import_state: string): { [api_type_id: string]: string } {
        let res: { [api_type_id: string]: string } = {};

        if ((!this.import_historics) || (!this.selected_segment) || (!this.import_historics[this.selected_segment.dateIndex])) {
            return res;
        }

        for (let i in this.import_historics[this.selected_segment.dateIndex]) {
            let historic: DataImportHistoricVO = this.import_historics[this.selected_segment.dateIndex][i];

            res[historic.api_type_id] = this.getCRUDLink(ModuleDataImport.getInstance().getRawImportedDatasAPI_Type_Id(historic.api_type_id)) + (import_state ? "?FILTER__importation_state=" + import_state : '');
        }
        return res;
    }

    private async reload_datas() {
        ModuleAjaxCache.getInstance().invalidateCachesFromApiTypesInvolved([DataImportHistoricVO.API_TYPE_ID]);

        this.storeDatas({
            API_TYPE_ID: DataImportHistoricVO.API_TYPE_ID,
            vos: await ModuleDAO.getInstance().getVos<DataImportHistoricVO>(DataImportHistoricVO.API_TYPE_ID)
        });
    }
}