import * as moment from 'moment';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import IImportedData from '../../../../../shared/modules/DataImport/interfaces/IImportedData';
import ModuleDataImport from '../../../../../shared/modules/DataImport/ModuleDataImport';
import DataImportFormatVO from '../../../../../shared/modules/DataImport/vos/DataImportFormatVO';
import DataImportHistoricVO from '../../../../../shared/modules/DataImport/vos/DataImportHistoricVO';
import ModuleDataRender from '../../../../../shared/modules/DataRender/ModuleDataRender';
import TimeSegment from '../../../../../shared/modules/DataRender/vos/TimeSegment';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import { ModuleDAOAction, ModuleDAOGetter } from '../../../../ts/components/dao/store/DaoStore';
import VueComponentBase from '../../../../ts/components/VueComponentBase';
import FileController from '../file/FileController';
import FileVO from '../../../../../shared/modules/File/vos/FileVO';

@Component({
    template: require('./DataImportAdminVueBase.pug'),
    components: {}
})
export default class DataImportAdminVueBase extends VueComponentBase {
    @ModuleDAOGetter
    public getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } };

    @ModuleDAOAction
    public storeDatas: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void;

    @Prop()
    public title: string;

    @Prop({ default: null })
    public import_overview_component: VueComponentBase;
    @Prop({ default: null })
    public import_param_component: VueComponentBase;

    @Prop({ default: TimeSegment.TYPE_MONTH })
    public segment_type: string;

    @Prop({ default: 9 })
    public segment_offset: number;

    @Prop({ default: 12 })
    public segment_number: number;

    @Prop()
    public api_type_ids: string[];

    @Prop()
    public route_path: string;

    @Prop({ default: null })
    public valid_segments: TimeSegment[];

    private segments: TimeSegment[] = [];

    private previous_segments() {
        if ((!this.segments) || (this.segments.length != this.segment_number)) {
            return;
        }

        this.segments = ModuleDataRender.getInstance().getPreviousTimeSegments(this.segments, this.segment_type, this.segment_offset);
    }

    private next_segments() {
        if ((!this.segments) || (this.segments.length != this.segment_number)) {
            return;
        }

        this.segments = ModuleDataRender.getInstance().getPreviousTimeSegments(this.segments, this.segment_type, -this.segment_offset);
    }

    private async uploadFile(selector: string) {

        let fileVO: FileVO = await FileController.uploadFileVO(selector);
        if (!fileVO) {
            this.snotify.error('Erreur lors de l\'upload');
            return;
        }

        let import_historic: DataImportHistoricVO = new DataImportHistoricVO();
        return;
    }

    private async mounted() {
        this.startLoading();
        this.nbLoadingSteps = 2;

        let promises: Array<Promise<any>> = [];
        let self = this;

        promises.push((async () => {
            self.storeDatas({
                API_TYPE_ID: DataImportFormatVO.API_TYPE_ID,
                vos: await ModuleDAO.getInstance().getVos<DataImportFormatVO>(DataImportFormatVO.API_TYPE_ID)
            });
        })());
        promises.push((async () => {
            self.storeDatas({
                API_TYPE_ID: DataImportHistoricVO.API_TYPE_ID,
                vos: await ModuleDAO.getInstance().getVos<DataImportHistoricVO>(DataImportHistoricVO.API_TYPE_ID)
            });
        })());
        await Promise.all(promises);

        this.nextLoadingStep();

        await this.loadRawImportedDatas();

        this.stopLoading();
    }

    @Watch('import_historics')
    private async loadRawImportedDatas() {
        let promises: Array<Promise<any>> = [];
        let self = this;

        for (let i in this.import_historics) {

            let historic = this.import_historics[i];
            let raw_api_type_id = ModuleDataImport.getInstance().getRawImportedDatasAPI_Type_Id(historic.api_type_id);
            promises.push((async () => {
                self.storeDatas({
                    API_TYPE_ID: raw_api_type_id,
                    vos: await ModuleDAO.getInstance().getVos(raw_api_type_id)
                });
            })());
        }
        await Promise.all(promises);
    }

    get import_historics(): { [api_type_id: string]: DataImportHistoricVO } {
        let res: { [api_type_id: string]: DataImportHistoricVO } = {};

        for (let i in this.getStoredDatas[DataImportHistoricVO.API_TYPE_ID]) {
            let historic: DataImportHistoricVO = this.getStoredDatas[DataImportHistoricVO.API_TYPE_ID][i] as DataImportHistoricVO;

            if ((!historic) || (!this.getStoredDatas[DataImportFormatVO.API_TYPE_ID][historic.data_import_format_id])) {
                continue;
            }

            let format: DataImportFormatVO = this.getStoredDatas[DataImportFormatVO.API_TYPE_ID][historic.data_import_format_id] as DataImportFormatVO;

            if (this.api_type_ids.indexOf(format.api_type_id) < 0) {
                continue;
            }

            if (res[format.api_type_id] && moment(res[format.api_type_id].start_date).isAfter(historic.start_date)) {
                continue;
            }

            res[format.api_type_id] = historic;
        }

        return res;
    }

    get labels(): string[] {
        let res: string[] = [];

        if ((!this.import_historics) || (!this.import_historics.length)) {
            return res;
        }

        for (let i in this.import_historics) {
            let format: DataImportFormatVO = this.getStoredDatas[DataImportFormatVO.API_TYPE_ID][this.import_historics[i].data_import_format_id] as DataImportFormatVO;
            res.push(this.label(format.import_uid));
        }
    }

    get format_validated(): { [api_type_id: string]: boolean } {
        let res: { [api_type_id: string]: boolean } = {};

        if ((!this.import_historics) || (!this.import_historics.length)) {
            return res;
        }

        for (let i in this.import_historics) {
            let historic: DataImportHistoricVO = this.getStoredDatas[DataImportHistoricVO.API_TYPE_ID][i] as DataImportHistoricVO;

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

        if ((!this.import_historics) || (!this.import_historics.length)) {
            return res;
        }

        for (let i in this.import_historics) {
            let historic: DataImportHistoricVO = this.getStoredDatas[DataImportHistoricVO.API_TYPE_ID][i] as DataImportHistoricVO;

            switch (historic.state) {
                case ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION:
                case ModuleDataImport.IMPORTATION_STATE_POSTTREATED:
                case ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT:
                case ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT:
                case ModuleDataImport.IMPORTATION_STATE_IMPORTING:
                case ModuleDataImport.IMPORTATION_STATE_IMPORTED:
                case ModuleDataImport.IMPORTATION_STATE_POSTTREATING:
                case ModuleDataImport.IMPORTATION_STATE_FORMATTED:
                case ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED:
                    res[historic.api_type_id] = true;
                    break;

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

        if ((!this.import_historics) || (!this.import_historics.length)) {
            return res;
        }

        for (let i in this.import_historics) {
            let historic: DataImportHistoricVO = this.getStoredDatas[DataImportHistoricVO.API_TYPE_ID][i] as DataImportHistoricVO;

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

        if ((!this.import_historics) || (!this.import_historics.length)) {
            return res;
        }

        for (let i in this.import_historics) {
            let historic: DataImportHistoricVO = this.getStoredDatas[DataImportHistoricVO.API_TYPE_ID][i] as DataImportHistoricVO;

            res[historic.api_type_id] = 0;

            let raw_imported_datas: { [id: number]: IImportedData } = this.getStoredDatas[ModuleDataImport.getInstance().getRawImportedDatasAPI_Type_Id(historic.api_type_id)] as { [id: number]: IImportedData };
            for (let j in raw_imported_datas) {
                switch (raw_imported_datas[j].importation_state) {
                    case ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION:
                    case ModuleDataImport.IMPORTATION_STATE_POSTTREATED:
                    case ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT:
                    case ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT:
                    case ModuleDataImport.IMPORTATION_STATE_IMPORTING:
                    case ModuleDataImport.IMPORTATION_STATE_IMPORTED:
                    case ModuleDataImport.IMPORTATION_STATE_POSTTREATING:
                        res[historic.api_type_id]++;
                        break;

                    default:
                }
            }
        }
        return res;
    }

    get nb_unvalidated_format_elements(): { [api_type_id: string]: number } {
        let res: { [api_type_id: string]: number } = {};

        if ((!this.import_historics) || (!this.import_historics.length)) {
            return res;
        }

        for (let i in this.import_historics) {
            let historic: DataImportHistoricVO = this.getStoredDatas[DataImportHistoricVO.API_TYPE_ID][i] as DataImportHistoricVO;

            res[historic.api_type_id] = 0;

            let raw_imported_datas: { [id: number]: IImportedData } = this.getStoredDatas[ModuleDataImport.getInstance().getRawImportedDatasAPI_Type_Id(historic.api_type_id)] as { [id: number]: IImportedData };
            for (let j in raw_imported_datas) {
                switch (raw_imported_datas[j].importation_state) {
                    case ModuleDataImport.IMPORTATION_STATE_FORMATTING:
                    case ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED:
                    case ModuleDataImport.IMPORTATION_STATE_FORMATTED:
                    case ModuleDataImport.IMPORTATION_STATE_UPLOADED:
                        res[historic.api_type_id]++;
                        break;
                    default:
                }
            }
        }
        return res;
    }

    get needs_format_validation(): { [api_type_id: string]: boolean } {
        let res: { [api_type_id: string]: boolean } = {};

        if ((!this.import_historics) || (!this.import_historics.length)) {
            return res;
        }

        for (let i in this.import_historics) {
            let historic: DataImportHistoricVO = this.getStoredDatas[DataImportHistoricVO.API_TYPE_ID][i] as DataImportHistoricVO;

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
        if (this.import_historics[api_type_id].state != ModuleDataImport.IMPORTATION_STATE_FORMATTED) {
            return;
        }

        this.import_historics[api_type_id].state = ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT;
        await ModuleDAO.getInstance().insertOrUpdateVO(this.import_historics[api_type_id]);
    }

    private async cancel_importation(api_type_id: string) {
        if (this.import_historics[api_type_id].state != ModuleDataImport.IMPORTATION_STATE_FORMATTED) {
            return;
        }

        this.import_historics[api_type_id].state = ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED;
        await ModuleDAO.getInstance().insertOrUpdateVO(this.import_historics[api_type_id]);
    }

    get imported(): { [api_type_id: string]: boolean } {
        let res: { [api_type_id: string]: boolean } = {};

        if ((!this.import_historics) || (!this.import_historics.length)) {
            return res;
        }

        for (let i in this.import_historics) {
            let historic: DataImportHistoricVO = this.getStoredDatas[DataImportHistoricVO.API_TYPE_ID][i] as DataImportHistoricVO;

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

        if ((!this.import_historics) || (!this.import_historics.length)) {
            return res;
        }

        for (let i in this.import_historics) {
            let historic: DataImportHistoricVO = this.getStoredDatas[DataImportHistoricVO.API_TYPE_ID][i] as DataImportHistoricVO;

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

        if ((!this.import_historics) || (!this.import_historics.length)) {
            return res;
        }

        for (let i in this.import_historics) {
            let historic: DataImportHistoricVO = this.getStoredDatas[DataImportHistoricVO.API_TYPE_ID][i] as DataImportHistoricVO;

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

    get posttreat_failed(): { [api_type_id: string]: boolean } {
        let res: { [api_type_id: string]: boolean } = {};

        if ((!this.import_historics) || (!this.import_historics.length)) {
            return res;
        }

        for (let i in this.import_historics) {
            let historic: DataImportHistoricVO = this.getStoredDatas[DataImportHistoricVO.API_TYPE_ID][i] as DataImportHistoricVO;

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
}