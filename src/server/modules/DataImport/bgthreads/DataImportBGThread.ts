import { filter } from '../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../../shared/modules/ContextFilter/vos/SortByVO';
import InsertOrDeleteQueryResult from '../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import IImportedData from '../../../../shared/modules/DataImport/interfaces/IImportedData';
import ModuleDataImport from '../../../../shared/modules/DataImport/ModuleDataImport';
import DataImportHistoricVO from '../../../../shared/modules/DataImport/vos/DataImportHistoricVO';
import DataImportLogVO from '../../../../shared/modules/DataImport/vos/DataImportLogVO';
import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleParams from '../../../../shared/modules/Params/ModuleParams';
import StatsController from '../../../../shared/modules/Stats/StatsController';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../../shared/tools/ObjectHandler';
import TypesHandler from '../../../../shared/tools/TypesHandler';
import ConfigurationService from '../../../env/ConfigurationService';
import IBGThread from '../../BGThread/interfaces/IBGThread';
import ModuleBGThreadServer from '../../BGThread/ModuleBGThreadServer';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';
import ParamsServerController from '../../Params/ParamsServerController';
import VarsDatasVoUpdateHandler from '../../Var/VarsDatasVoUpdateHandler';
import ModuleDataImportServer from '../ModuleDataImportServer';

export default class DataImportBGThread implements IBGThread {

    private static instance: DataImportBGThread = null;

    // private static request: string = ' where state in ($1, $3, $4, $5) or (state = $2 and autovalidate = true) order by last_up_date desc limit 1;';

    private static importing_dih_id_param_name: string = 'DataImportBGThread.importing_dih_id';
    private static wait_for_empty_vars_vos_cud_param_name: string = 'DataImportBGThread.wait_for_empty_vars_vos_cud';
    private static wait_for_empty_cache_vars_waiting_for_compute_param_name: string = 'DataImportBGThread.wait_for_empty_cache_vars_waiting_for_compute';

    public current_timeout: number = 10000;
    public MAX_timeout: number = 60000;
    public MIN_timeout: number = 100;

    private waiting_for_empty_vars_vos_cud: boolean = false;
    private waiting_for_empty_cache_vars_waiting_for_compute: boolean = false;

    private constructor() {
    }

    get name(): string {
        return "DataImportBGThread";
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!DataImportBGThread.instance) {
            DataImportBGThread.instance = new DataImportBGThread();
        }
        return DataImportBGThread.instance;
    }

    public async work(): Promise<number> {

        const time_in = Dates.now_ms();

        try {

            StatsController.register_stat_COMPTEUR('DataImportBGThread', 'work', 'IN');

            /**
             * Pour éviter de surcharger le système, on attend que le vos_cud des vars soit vidé (donc on a vraiment fini de traiter les imports précédents et rien de complexe en cours)
             */
            const wait_for_empty_vars_vos_cud: boolean = await ParamsServerController.getParamValueAsBoolean(DataImportBGThread.wait_for_empty_vars_vos_cud_param_name, true, 180000);
            try {
                if (wait_for_empty_vars_vos_cud) {
                    if (await VarsDatasVoUpdateHandler.has_vos_cud_or_intersectors()) {
                        ConsoleHandler.log('DataImportBGThread:wait_for_empty_vars_vos_cud KO ... next try in ' + this.current_timeout + ' ms');
                        this.waiting_for_empty_vars_vos_cud = true;
                        this.stats_out('waiting_for_empty_vars_vos_cud', time_in);
                        return ModuleBGThreadServer.TIMEOUT_COEF_LITTLE_BIT_SLOWER;
                    }

                    if (this.waiting_for_empty_vars_vos_cud) {
                        this.waiting_for_empty_vars_vos_cud = false;
                        ConsoleHandler.log('DataImportBGThread:wait_for_empty_vars_vos_cud OK');
                    }
                }
            } catch (error) {
                ConsoleHandler.error('DataImportBGThread:wait_for_empty_vars_vos_cud varbgthread did not answer. waiting for it to get back up');
                this.waiting_for_empty_vars_vos_cud = true;
                this.stats_out('waiting_for_empty_vars_vos_cud_failed', time_in);
                return ModuleBGThreadServer.TIMEOUT_COEF_LITTLE_BIT_SLOWER;
            }

            // On commence par préparer les réimport en attente si il y en a
            await this.prepare_reimports();

            // Objectif, on prend l'import en attente le plus ancien, et on l'importe tout simplement.
            //  en fin d'import, si on voit qu'il y en a un autre à importer, on demande d'aller plus vite.

            // Si un import est en cours et doit être continué, on le récupère et on continue, sinon on en cherche un autre
            const importing_dih_id_param: string = await ParamsServerController.getParamValueAsString(DataImportBGThread.importing_dih_id_param_name);
            let importing_dih_id: number = null;
            let dih: DataImportHistoricVO = null;
            if (importing_dih_id_param) {
                importing_dih_id = parseInt(importing_dih_id_param);
                dih = await query(DataImportHistoricVO.API_TYPE_ID).filter_by_id(importing_dih_id).select_vo<DataImportHistoricVO>();

                if ((!dih) || (
                    (dih.state != ModuleDataImport.IMPORTATION_STATE_UPLOADED) &&
                    (dih.state != ModuleDataImport.IMPORTATION_STATE_FORMATTED) &&
                    (dih.state != ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT) &&
                    (dih.state != ModuleDataImport.IMPORTATION_STATE_IMPORTED))) {
                    dih = null;
                    await ParamsServerController.setParamValue_as_server(DataImportBGThread.importing_dih_id_param_name, null);
                }
            }

            if (!dih) {
                /**
                 * 2eme tentative de continuer un import qui serait à mi-chemin mais pas dans le param (plantage du serveur par exemple)
                 */
                dih = await query(DataImportHistoricVO.API_TYPE_ID)
                    .add_filters([
                        filter(DataImportHistoricVO.API_TYPE_ID, field_names<DataImportHistoricVO>().state).by_num_has([ModuleDataImport.IMPORTATION_STATE_IMPORTED, ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT])
                            .or(
                                filter(DataImportHistoricVO.API_TYPE_ID, field_names<DataImportHistoricVO>().state).by_num_eq(
                                    ModuleDataImport.IMPORTATION_STATE_FORMATTED
                                ).and(
                                    filter(DataImportHistoricVO.API_TYPE_ID, field_names<DataImportHistoricVO>().autovalidate).is_true()
                                )
                            )
                    ])
                    .set_limit(1)
                    .select_vo();
            }

            if (!dih) {
                /**
                 * Sinon on tente d'entamer un nouvel import, dans un ordre basé en premier lieu sur le poids de l'import, puis sur l'ancienneté
                 */
                dih = await query(DataImportHistoricVO.API_TYPE_ID)
                    .filter_by_num_eq(field_names<DataImportHistoricVO>().state, ModuleDataImport.IMPORTATION_STATE_UPLOADED)
                    .set_sorts([
                        new SortByVO(DataImportHistoricVO.API_TYPE_ID, field_names<DataImportHistoricVO>().weight, true),
                        new SortByVO(DataImportHistoricVO.API_TYPE_ID, field_names<DataImportHistoricVO>().start_date, true),
                        new SortByVO(DataImportHistoricVO.API_TYPE_ID, field_names<DataImportHistoricVO>().id, true)
                    ])
                    .set_limit(1)
                    .select_vo();
            }

            if (!dih) {

                /**
                 * If there's nothing to do at the time, we try to find a import than meets these requirements :
                 *  - state == ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION
                 *  - reimport_of_dih_id is null
                 *  - no import references this one in reimport_of_dih_id
                 *  - last_up_date is older than 5 mninutes
                 */
                const can_retry = await ParamsServerController.getParamValueAsBoolean(ModuleDataImport.PARAM_CAN_RETRY_FAILED, false, 180000);
                if (can_retry) {
                    dih = await this.try_getting_failed_retryable_import();
                }
            }

            if (!dih) {
                this.stats_out('inactive', time_in);
                return ModuleBGThreadServer.TIMEOUT_COEF_LITTLE_BIT_SLOWER;
            }

            await ParamsServerController.setParamValue_as_server(DataImportBGThread.importing_dih_id_param_name, dih.id.toString());

            await this.handleImportHistoricProgression(dih);
            ConsoleHandler.log('DataImportBGThread DIH[' + dih.id + '] state:' + dih.state + ':');

            if ([
                ModuleDataImport.IMPORTATION_STATE_UPLOADED,
                ModuleDataImport.IMPORTATION_STATE_FORMATTED,
                ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT,
                ModuleDataImport.IMPORTATION_STATE_IMPORTED
            ].indexOf(dih.state) >= 0) {
                this.stats_out('ok', time_in);
                return ModuleBGThreadServer.TIMEOUT_COEF_RUN;
            }

            // Si on est pas dans un état de continuation, on arrête cet import
            //  Tant qu'on gère des imports, on run
            await ParamsServerController.setParamValue_as_server(DataImportBGThread.importing_dih_id_param_name, null);
            this.stats_out('ok', time_in);
            return ModuleBGThreadServer.TIMEOUT_COEF_RUN;
        } catch (error) {
            ConsoleHandler.error(error);
        }

        this.stats_out('throws', time_in);
        return ModuleBGThreadServer.TIMEOUT_COEF_LITTLE_BIT_SLOWER;
    }

    private stats_out(activity: string, time_in: number) {

        const time_out = Dates.now_ms();
        StatsController.register_stat_COMPTEUR('DataImportBGThread', 'work', activity + '_OUT');
        StatsController.register_stat_DUREE('DataImportBGThread', 'work', activity + '_OUT', time_out - time_in);
    }

    private async prepare_reimports() {

        const time_in = Dates.now_ms();

        StatsController.register_stat_COMPTEUR('DataImportBGThread', 'prepare_reimports', 'IN');

        const dihs = await query(DataImportHistoricVO.API_TYPE_ID)
            .filter_by_num_eq(field_names<DataImportHistoricVO>().state, ModuleDataImport.IMPORTATION_STATE_NEEDS_REIMPORT)
            .set_sorts([
                new SortByVO(DataImportHistoricVO.API_TYPE_ID, field_names<DataImportHistoricVO>().start_date, true),
                new SortByVO(DataImportHistoricVO.API_TYPE_ID, field_names<DataImportHistoricVO>().id, true)
            ]).select_vos<DataImportHistoricVO>();

        for (const i in dihs) {
            const dih = dihs[i];

            await this.handleImportHistoricProgression(dih);
            ConsoleHandler.log('DataImportBGThread REIMPORT DIH[' + dih.id + '] state:' + dih.state + ':');
        }

        const time_out = Dates.now_ms();
        StatsController.register_stat_COMPTEUR('DataImportBGThread', 'prepare_reimports', 'OUT');
        StatsController.register_stat_DUREE('DataImportBGThread', 'prepare_reimports', 'OUT', time_out - time_in);
    }

    private async handleImportHistoricProgression(importHistoric: DataImportHistoricVO): Promise<boolean> {

        if (!(importHistoric && importHistoric.id)) {
            return false;
        }

        return ((importHistoric.use_fast_track) && (importHistoric.state != ModuleDataImport.IMPORTATION_STATE_NEEDS_REIMPORT)) ?
            await this.handleImportHistoricProgressionFastTrack(importHistoric) :
            await this.handleImportHistoricProgressionClassic(importHistoric);
    }

    /**
     * Sur une erreur de fasttrack on remet en importation sans fastttrack pour avoir le détail des erreurs
     */
    private async handlefasttrackerror(importHistoric: DataImportHistoricVO) {

        if (ConfigurationService.node_configuration.retry_failed_fast_track_imports_with_normal_importation) {
            ConsoleHandler.log('DataImportBGThread Using Fast Track DIH[' + importHistoric.id + '] failed, trying normal importation');
            importHistoric.use_fast_track = false;
            importHistoric.state = ModuleDataImport.IMPORTATION_STATE_UPLOADED;
        }
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(importHistoric);
    }

    /**
     * L'idée du fast track, c'est d'éviter de passer par la bdd sauf dans le post process et pour mettre à jour le statut final
     */
    private async handleImportHistoricProgressionFastTrack(importHistoric: DataImportHistoricVO): Promise<boolean> {

        ConsoleHandler.log('DataImportBGThread Using Fast Track DIH[' + importHistoric.id + '] state:' + importHistoric.state + ':IN');

        if (importHistoric.state != ModuleDataImport.IMPORTATION_STATE_UPLOADED) {
            return false;
        }

        // case ModuleDataImport.IMPORTATION_STATE_UPLOADED:
        importHistoric.state = ModuleDataImport.IMPORTATION_STATE_FORMATTING;
        // await ModuleDataImportServer.getInstance().updateImportHistoric(importHistoric);
        const fasttrack_datas: IImportedData[] = await ModuleDataImportServer.getInstance().formatDatas(importHistoric);

        if (ConfigurationService.node_configuration.debug_imports) {
            ConsoleHandler.log('DataImportBGThread Using Fast Track DIH[' + importHistoric.id + '] :post formatDatas' +
                ':IMPORTATION_STATE_FORMATTED:' + (importHistoric.state == ModuleDataImport.IMPORTATION_STATE_FORMATTED) +
                ':fasttrack_datas:' + ((fasttrack_datas && fasttrack_datas.length) ? fasttrack_datas.length : 0));
        }

        if ((!fasttrack_datas) || (!fasttrack_datas.length) || (importHistoric.state != ModuleDataImport.IMPORTATION_STATE_FORMATTED)) {
            await this.handlefasttrackerror(importHistoric);
            return false;
        }

        // case ModuleDataImport.IMPORTATION_STATE_FORMATTED:
        // await ModuleDataImportServer.getInstance().logAndUpdateHistoric(importHistoric, null, ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT, 'Autovalidation', "import.success.autovalidation", DataImportLogVO.LOG_LEVEL_SUCCESS);

        // if (importHistoric.state != ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT) {
        //     return false;
        // }

        // case ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT:
        importHistoric.state = ModuleDataImport.IMPORTATION_STATE_IMPORTING;
        // await ModuleDataImportServer.getInstance().updateImportHistoric(importHistoric);
        await ModuleDataImportServer.getInstance().importDatas(importHistoric, fasttrack_datas);

        if (ConfigurationService.node_configuration.debug_imports) {
            ConsoleHandler.log('DataImportBGThread Using Fast Track DIH[' + importHistoric.id + '] :post importDatas' +
                ':IMPORTATION_STATE_IMPORTED:' + (importHistoric.state == ModuleDataImport.IMPORTATION_STATE_IMPORTED));
        }

        if (importHistoric.state != ModuleDataImport.IMPORTATION_STATE_IMPORTED) {
            await this.handlefasttrackerror(importHistoric);
            return false;
        }

        // case ModuleDataImport.IMPORTATION_STATE_IMPORTED:
        importHistoric.state = ModuleDataImport.IMPORTATION_STATE_POSTTREATING;
        // await ModuleDataImportServer.getInstance().updateImportHistoric(importHistoric);
        await ModuleDataImportServer.getInstance().posttreatDatas(importHistoric, fasttrack_datas);

        if (ConfigurationService.node_configuration.debug_imports) {
            ConsoleHandler.log('DataImportBGThread Using Fast Track DIH[' + importHistoric.id + '] :post posttreatDatas' +
                ':IMPORTATION_STATE_POSTTREATED:' + (importHistoric.state == ModuleDataImport.IMPORTATION_STATE_POSTTREATED));
        }

        if (importHistoric.state != ModuleDataImport.IMPORTATION_STATE_POSTTREATED) {
            await this.handlefasttrackerror(importHistoric);
            return false;
        }

        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(importHistoric);

        return true;
    }

    private async handleImportHistoricProgressionClassic(importHistoric: DataImportHistoricVO): Promise<boolean> {

        // Call the workers async to give the hand back to the client, but change the state right now since we're ready to launch the trigger
        // The updates will be pushed later on, no need to wait
        switch (importHistoric.state) {
            case ModuleDataImport.IMPORTATION_STATE_UPLOADED:
                importHistoric.state = ModuleDataImport.IMPORTATION_STATE_FORMATTING;
                ConsoleHandler.log('DataImportBGThread DIH[' + importHistoric.id + '] state:' + importHistoric.state + ':');
                await ModuleDataImportServer.getInstance().updateImportHistoric(importHistoric);
                await ModuleDataImportServer.getInstance().formatDatas(importHistoric);
                return true;

            case ModuleDataImport.IMPORTATION_STATE_FORMATTED:
                //  Si on est sur une autovalidation, et qu'on a des résultats, on peut passer directement à l'étape suivante
                if (importHistoric.autovalidate) {
                    await ModuleDataImportServer.getInstance().logAndUpdateHistoric(importHistoric, null, ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT, 'Autovalidation', "import.success.autovalidation", DataImportLogVO.LOG_LEVEL_SUCCESS);
                    return true;
                } else {
                    return false;
                }

            case ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT:
                importHistoric.state = ModuleDataImport.IMPORTATION_STATE_IMPORTING;
                await ModuleDataImportServer.getInstance().updateImportHistoric(importHistoric);
                await ModuleDataImportServer.getInstance().importDatas(importHistoric);
                return true;

            case ModuleDataImport.IMPORTATION_STATE_IMPORTED:

                // /**
                //  * Pour éviter de surcharger le système, on attend qu'il n'y ai plus de vars en cours de calcul pour le client pour passer à la dernière étape des imports
                //  */
                // let wait_for_empty_cache_vars_waiting_for_compute: boolean = await ParamsServerController.getParamValueAsBoolean(DataImportBGThread.wait_for_empty_cache_vars_waiting_for_compute_param_name, true, 180000);
                // try {
                //     if (wait_for_empty_cache_vars_waiting_for_compute) {
                //         if (await VarsDatasProxy.has_cached_vars_waiting_for_compute()) {
                //             ConsoleHandler.log('DataImportBGThread:wait_for_empty_cache_vars_waiting_for_compute KO ... next try in ' + this.current_timeout + ' ms');
                //             this.waiting_for_empty_cache_vars_waiting_for_compute = true;
                //             return false;
                //         }

                //         if (this.waiting_for_empty_cache_vars_waiting_for_compute) {
                //             this.waiting_for_empty_cache_vars_waiting_for_compute = false;
                //             ConsoleHandler.log('DataImportBGThread:wait_for_empty_cache_vars_waiting_for_compute OK');
                //         }
                //     }
                // } catch (error) {
                //     ConsoleHandler.error('DataImportBGThread:wait_for_empty_cache_vars_waiting_for_compute varbgthread did not answer. waiting for it to get back up');
                //     this.waiting_for_empty_cache_vars_waiting_for_compute = true;
                //     return false;
                // }

                importHistoric.state = ModuleDataImport.IMPORTATION_STATE_POSTTREATING;
                await ModuleDataImportServer.getInstance().updateImportHistoric(importHistoric);
                await ModuleDataImportServer.getInstance().posttreatDatas(importHistoric);
                return true;

            case ModuleDataImport.IMPORTATION_STATE_NEEDS_REIMPORT:

                importHistoric.state = (((importHistoric.status_before_reimport != null) && (typeof importHistoric.status_before_reimport != 'undefined')) ? importHistoric.status_before_reimport : ModuleDataImport.IMPORTATION_STATE_POSTTREATED);
                await ModuleDAOServer.instance.insertOrUpdateVO_as_server(importHistoric);

                const new_importHistoric = new DataImportHistoricVO();
                new_importHistoric.api_type_id = importHistoric.api_type_id;
                new_importHistoric.autovalidate = true;
                new_importHistoric.file_id = importHistoric.file_id;
                new_importHistoric.import_type = importHistoric.import_type;
                new_importHistoric.segment_type = importHistoric.segment_type;
                new_importHistoric.segment_date_index = importHistoric.segment_date_index;
                new_importHistoric.params = importHistoric.params;
                new_importHistoric.state = ModuleDataImport.IMPORTATION_STATE_UPLOADED;
                new_importHistoric.user_id = importHistoric.user_id;
                new_importHistoric.reimport_of_dih_id = importHistoric.id;
                new_importHistoric.use_fast_track = importHistoric.use_fast_track;

                const insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAOServer.instance.insertOrUpdateVO_as_server(new_importHistoric);

                if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
                    ConsoleHandler.error('!insertOrDeleteQueryResult dans handleImportHistoricProgression');
                    return false;
                }
                const id = insertOrDeleteQueryResult.id;
                if ((!id) || (!TypesHandler.getInstance().isNumber(id))) {
                    ConsoleHandler.error('!id dans handleImportHistoricProgression');
                    return false;
                }

                return true;

            default:
                return false;
        }
    }

    private async try_getting_failed_retryable_import(): Promise<DataImportHistoricVO> {
        /**
         * If there's nothing to do at the time, we try to find a import than meets these requirements :
         *  - state == ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION
         *  - reimport_of_dih_id is null
         *  - status_of_last_reimport is null
         *  - status_before_reimport is null
         *  - last_up_date is older than 5 mninutes
         */

        const dihs: DataImportHistoricVO[] = await query(DataImportHistoricVO.API_TYPE_ID)
            .filter_by_num_eq(field_names<DataImportHistoricVO>().state, ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION)
            .filter_is_null_or_empty(field_names<DataImportHistoricVO>().reimport_of_dih_id)
            .filter_is_null_or_empty(field_names<DataImportHistoricVO>().status_before_reimport)
            .filter_is_null_or_empty(field_names<DataImportHistoricVO>().status_of_last_reimport)
            .filter_by_num_inf(field_names<DataImportHistoricVO>().last_up_date, Dates.add(Dates.now(), -5, TimeSegment.TYPE_MINUTE))
            .select_vos<DataImportHistoricVO>();

        if ((!dihs) || (!dihs.length)) {
            return null;
        }

        const dih = dihs[0];
        await ModuleDataImport.getInstance().reimportdih(dih);
        return query(DataImportHistoricVO.API_TYPE_ID).filter_by_id(dih.id).select_vo<DataImportHistoricVO>();
    }
}