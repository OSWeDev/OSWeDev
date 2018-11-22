import * as $ from 'jquery';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import DataImportFormatVO from '../../../../../shared/modules/DataImport/vos/DataImportFormatVO';
import DataImportHistoricVO from '../../../../../shared/modules/DataImport/vos/DataImportHistoricVO';
import FileVO from '../../../../../shared/modules/File/vos/FileVO';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import VueComponentBase from '../../VueComponentBase';

export default abstract class DataImportComponentBase extends VueComponentBase {
    public abstract getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } };
    public abstract storeDatas: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void;
    public abstract storeData: (vo: IDistantVOBase) => void;
    public abstract route_path: string;
    public abstract modal_show: boolean;
    public abstract show_overview: boolean;

    public abstract get_url_for_modal: (segment_date_index: string) => string;

    protected state_ok: string = "ok";
    protected state_ko: string = "ko";
    protected state_none: string = "none";
    protected state_warn: string = "warn";
    protected state_unavail: string = "unavail";
    protected state_info: string = "info";

    public abstract async initialize_on_mount();
    public abstract async on_show_modal();
    public abstract hasSelectedOptions(historic: DataImportHistoricVO): boolean;

    protected check_change_import_historic(historic: DataImportHistoricVO, previous_historic: DataImportHistoricVO): boolean {
        if (!historic) {

            if (previous_historic) {
                return true;
            }
            return false;
        }

        if (!previous_historic) {
            return true;
        }

        if (previous_historic.id != historic.id) {
            return true;
        }

        if (previous_historic.state != historic.state) {
            return true;
        }

        return false;
    }

    protected async on_mount() {
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

        await this.initialize_on_mount();

        setTimeout(() => {
            self.handle_modal_show_hide();
            $("#import_modal").on("hidden.bs.modal", function () {

                self.closeModal();
            });
        }, 100);

        this.stopLoading();
    }


    protected closeModal() {
        this.$router.push(this.get_url_for_modal ? this.get_url_for_modal(null) : this.route_path);
    }


    protected async handle_modal_show_hide() {
        if (!this.modal_show) {
            $('#import_modal').modal('hide');
        }
        if (this.modal_show) {
            await this.on_show_modal();
            $('#import_modal').modal('show');
            return;
        }
    }

    protected pushPromisesToLoadDataFromHistoric(
        historic: DataImportHistoricVO,
        files_ids: number[],
        promises: Array<Promise<any>>): void {
        let self = this;

        // On va chercher le fichier aussi du coup
        if ((!historic.file_id) || (self.getStoredDatas[FileVO.API_TYPE_ID] && self.getStoredDatas[FileVO.API_TYPE_ID][historic.file_id]) ||
            (files_ids.indexOf(historic.file_id) >= 0)) {
            return;
        }
        files_ids.push(historic.file_id);
        promises.push((async () => {
            self.storeData(await ModuleDAO.getInstance().getVoById(FileVO.API_TYPE_ID, historic.file_id));
        })());


        // let raw_api_type_id = ModuleDataImport.getInstance().getRawImportedDatasAPI_Type_Id(historic.api_type_id);
        // switch (historic.state) {
        //     case ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT:
        //     case ModuleDataImport.IMPORTATION_STATE_IMPORTING:
        //     case ModuleDataImport.IMPORTATION_STATE_IMPORTED:
        //     case ModuleDataImport.IMPORTATION_STATE_POSTTREATING:
        //     case ModuleDataImport.IMPORTATION_STATE_FORMATTED:
        //         break;

        //     case ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED:
        //     case ModuleDataImport.IMPORTATION_STATE_POSTTREATED:
        //     case ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION:
        //     case ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT:
        //     case ModuleDataImport.IMPORTATION_STATE_FORMATTING:
        //     case ModuleDataImport.IMPORTATION_STATE_UPLOADED:
        //     default:
        //         return;
        // }

        // ModuleAjaxCache.getInstance().invalidateCachesFromApiTypesInvolved([raw_api_type_id]);
        // promises.push((async () => {
        //     self.storeDatas({
        //         API_TYPE_ID: raw_api_type_id,
        //         vos: await ModuleDAO.getInstance().getVos(raw_api_type_id)
        //     });
        // })());
    }
}