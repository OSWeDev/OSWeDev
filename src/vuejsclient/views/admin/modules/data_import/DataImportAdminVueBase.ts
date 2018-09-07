import * as moment from 'moment';
import ModuleAjaxCache from '../../../../../shared/modules/AjaxCache/ModuleAjaxCache';
import ModuleDataImport from '../../../../../shared/modules/DataImport/ModuleDataImport';
import DataImportFormatVO from '../../../../../shared/modules/DataImport/vos/DataImportFormatVO';
import DataImportHistoricVO from '../../../../../shared/modules/DataImport/vos/DataImportHistoricVO';
import DataImportLogVO from '../../../../../shared/modules/DataImport/vos/DataImportLogVO';
import DateHandler from '../../../../../shared/tools/DateHandler';
import ThreadHandler from '../../../../../shared/tools/ThreadHandler';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import VueComponentBase from '../../../../ts/components/VueComponentBase';
import * as $ from 'jquery';


@Component({
    template: require('./DataImportAdminVueBase.pug'),
    components: {}
})
export default class DataImportAdminVueBase extends VueComponentBase {

    @Prop(Array)
    public file_import_names: string[];

    protected datatargetdate: Date;
    protected importing: boolean = false;
    protected dataImportFiles: DataImportFormatVO[] = [];
    protected dataImportFiles_by_name: { [name: string]: DataImportFormatVO } = {};
    protected import_historics: DataImportHistoricVO[] = [];
    protected import_logs: DataImportLogVO[] = [];

    public async mounted() {

        this.isLoading = true;

        this.datatargetdate = moment().startOf('month').toDate();
        this.importing = false;

        if (this.file_import_names) {

            for (let i in this.file_import_names) {
                let data_file_import_name: string = this.file_import_names[i];

                this.dataImportFiles_by_name[data_file_import_name] = ModuleDataImport.getInstance().dataImportFiles_by_name[data_file_import_name];
                this.dataImportFiles.push(this.dataImportFiles_by_name[data_file_import_name]);
            }
        }

        if (this.dataImportFiles_by_name) {

            // On charge les logs en async
            this.refreshlogs();
        }

        this.isLoading = false;
    }

    public async refreshlogs() {
        try {

            let hiderefreshbutton: boolean = !this.importing;

            if (hiderefreshbutton) {
                this.importing = true;
            }
            // On refresh logs et historiques des imports, les uns après les autres pour éviter "la cohue"
            for (let i in this.dataImportFiles_by_name) {
                let dataImportFile: DataImportFormatVO = this.dataImportFiles_by_name[i];

                await this.updateHistorics(dataImportFile.id);
                await this.updateLogs(dataImportFile.id);
            }
            if (hiderefreshbutton) {
                this.importing = false;
            }

        } catch (e) {
            console.error(e);
        }
    }

    /**
     * On lance l'import côté serveur et on attend ensuite confirmation que l'import est bien terminé
     * @param selector Selecteur CSS du input type file
     * @param data_file_import_name Par défaut this.data_file_import_name
     * @param target_date_index Pas obligatoire. Par défaut DateHandler.getInstance().formatDayForIndex(moment(this.datatargetdate))
     * @param formData Pas obligatoire. Par défaut on en crée un vide avec juste l'input file
     */
    protected async importFile(
        selector: string,
        data_file_import_name: string,
        target_date_index: string = null,
        formData: FormData = null): Promise<void> {

        this.importing = true;
        let res = null;

        try {

            if (!this.hasFileInputData(selector)) {
                this.importing = false;
                return;
            }

            data_file_import_name = data_file_import_name;
            target_date_index = target_date_index ? target_date_index : DateHandler.getInstance().formatDayForIndex(moment(this.datatargetdate));

            let file: File = $(selector)[0]['files'][0];

            formData = formData ? formData : new FormData();
            formData.append('file', file);

            // On lance la requête en asynchrone, de sorte que l'import est réalisé en BG
            let historic: DataImportHistoricVO = await ModuleAjaxCache.getInstance().post(
                '/modules/ModuleDataImport/ImportFile/' + data_file_import_name + '/' + target_date_index,
                [DataImportHistoricVO.API_TYPE_ID, DataImportLogVO.API_TYPE_ID],
                formData,
                null,
                null,
                false,
                30000) as DataImportHistoricVO;

            if (!historic) {
                this.importing = false;
                this.snotify.error('Erreur lors de l\'impotation. Merci de recharger la page');
                return;
            }

            await this.waitForEndOfImportation(historic);
        } catch (error) {
            if (error && error.statusText == "timeout") {
                this.snotify.warning('L\'import continue, consulter les logs pour suivre l\'avancement.');
            }
            await this.refreshlogs();
        }
        this.importing = false;
        return;
    }

    protected async waitForEndOfImportation(historic: DataImportHistoricVO) {
        if (!historic) {
            return;
        }

        // Timeout de 3 minutes
        let timeout: number = 180000;
        while (((!historic.end_date) || (historic.state == DataImportHistoricVO.IMPORT_STATE_STARTED)) && (timeout > 0)) {
            await ThreadHandler.getInstance().sleep(10000);
            historic = await ModuleDataImport.getInstance().getDataImportHistoric(historic.id);
            timeout -= 10000;
        }

        if ((!historic.end_date) || (historic.state == DataImportHistoricVO.IMPORT_STATE_STARTED)) {
            this.snotify.warning('L\'import n\'est pas terminé');
        } else {
            this.snotify.success('Import terminé');
        }
    }

    protected hasFileInputData(selector: string): boolean {
        return $(selector) && $(selector)[0] && $(selector)[0]['files'] && $(selector)[0]['files'][0];
    }

    private async updateHistorics(dataImportFile_id: number) {

        let promise: Promise<any> = ModuleDataImport.getInstance().getDataImportHistorics(dataImportFile_id);

        // On commence par vider des datas actuelles les éléments liés à ce dataImportFile_id
        let res: DataImportHistoricVO[] = [];
        for (let i in this.import_historics) {
            let import_historic: DataImportHistoricVO = this.import_historics[i];

            if (import_historic.data_import_format_id != dataImportFile_id) {
                res.push(import_historic);
            }
        }

        res = res.concat(await promise);

        res.sort((a: DataImportHistoricVO, b: DataImportHistoricVO): number => {

            return moment(b.last_up_date).valueOf() - moment(a.last_up_date).valueOf();
        });

        this.import_historics = res;
    }

    private async updateLogs(dataImportFile_id: number) {
        let promise: Promise<any> = ModuleDataImport.getInstance().getDataImportLogs(dataImportFile_id);

        // On commence par vider des datas actuelles les éléments liés à ce dataImportFile_id
        let res: DataImportLogVO[] = [];
        for (let i in this.import_logs) {
            let import_log: DataImportLogVO = this.import_logs[i];

            if (import_log.data_import_format_id != dataImportFile_id) {
                res.push(import_log);
            }
        }

        res = res.concat(await promise);

        res.sort((a: DataImportLogVO, b: DataImportLogVO): number => {

            // if (ModuleDataImport.getInstance().getLogLevelValue(a.log_level) == ModuleDataImport.getInstance().getLogLevelValue(b.log_level)) {
            return moment(b.date).valueOf() - moment(a.date).valueOf();
            // }
            // return ModuleDataImport.getInstance().getLogLevelValue(b.log_level) - ModuleDataImport.getInstance().getLogLevelValue(a.log_level);
        });

        this.import_logs = res;
    }
}