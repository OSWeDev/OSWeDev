import * as $ from 'jquery';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import DataImportFormatVO from '../../../../../shared/modules/DataImport/vos/DataImportFormatVO';
import DataImportHistoricVO from '../../../../../shared/modules/DataImport/vos/DataImportHistoricVO';
import FileVO from '../../../../../shared/modules/File/vos/FileVO';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import { all_promises } from '../../../../../shared/tools/PromiseTools';
import VueComponentBase from '../../VueComponentBase';

export default abstract class DataImportComponentBase extends VueComponentBase {
    public abstract getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } };
    public abstract storeDatas: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void;
    public abstract storeData: (vo: IDistantVOBase) => void;
    public abstract route_path: string;
    public abstract modal_show: boolean;
    public abstract show_overview: boolean;
    public abstract show_new_import: boolean;

    public abstract modal_historics: { [api_type_id: string]: DataImportHistoricVO; };
    public abstract modal_dropzone_options: any;
    public abstract modal_dropzone_key: string;

    public abstract get_url_for_modal: (segment_date_index: number) => string;

    protected state_ok: string = "ok";
    protected state_ko: string = "ko";
    protected state_none: string = "none";
    protected state_warn: string = "warn";
    protected state_unavail: string = "unavail";
    protected state_info: string = "info";

    public abstract toggleShowNewImport(): void;
    public abstract uploadedFile(target_segment_date_index: number, fileVo: FileVO): Promise<void>;
    public abstract initialize_on_mount(): Promise<void>;
    public abstract on_show_modal(): Promise<void>;
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
                vos: await query(DataImportFormatVO.API_TYPE_ID).select_vos<DataImportFormatVO>()
            });
        })());

        await all_promises(promises);

        this.nextLoadingStep();

        await this.initialize_on_mount();

        setTimeout(async () => {
            await self.handle_modal_show_hide();
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
    }
}