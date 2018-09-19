import * as $ from 'jquery';
import VueComponentBase from '../VueComponentBase';
import DataImportHistoricVO from '../../../../shared/modules/DataImport/vos/DataImportHistoricVO';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import DataImportFormatVO from '../../../../shared/modules/DataImport/vos/DataImportFormatVO';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';

export default abstract class DataImportComponentBase extends VueComponentBase {
    protected state_ok: string = "ok";
    protected state_ko: string = "ko";
    protected state_warn: string = "warn";
    protected state_unavail: string = "unavail";
    protected state_info: string = "info";

    abstract storeDatas: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void;
    abstract route_path: string;
    abstract modal_show: boolean;

    abstract async initialize_on_mount();
    abstract async on_show_modal();
    abstract hasSelectedOptions(historic: DataImportHistoricVO): boolean;

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
                self.$router.push(self.route_path);
            });
        }, 100);

        this.stopLoading();
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
}