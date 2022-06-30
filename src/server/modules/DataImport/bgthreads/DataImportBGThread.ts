import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import ModuleDataImport from '../../../../shared/modules/DataImport/ModuleDataImport';
import DataImportHistoricVO from '../../../../shared/modules/DataImport/vos/DataImportHistoricVO';
import DataImportLogVO from '../../../../shared/modules/DataImport/vos/DataImportLogVO';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import IBGThread from '../../BGThread/interfaces/IBGThread';
import ModuleBGThreadServer from '../../BGThread/ModuleBGThreadServer';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';
import ModuleDataImportServer from '../ModuleDataImportServer';
import VarsDatasVoUpdateHandler from '../../Var/VarsDatasVoUpdateHandler';
import TypesHandler from '../../../../shared/tools/TypesHandler';
import ModuleParams from '../../../../shared/modules/Params/ModuleParams';
import ModuleContextFilter from '../../../../shared/modules/ContextFilter/ModuleContextFilter';
import ContextFilterVO, { filter } from '../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';
import VarsDatasProxy from '../../Var/VarsDatasProxy';
import IImportedData from '../../../../shared/modules/DataImport/interfaces/IImportedData';
import ContextQueryVO, { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import NumRange from '../../../../shared/modules/DataRender/vos/NumRange';
import RangeHandler from '../../../../shared/tools/RangeHandler';
import NumSegment from '../../../../shared/modules/DataRender/vos/NumSegment';
import SortByVO from '../../../../shared/modules/ContextFilter/vos/SortByVO';

export default class DataImportBGThread implements IBGThread {

    public static getInstance() {
        if (!DataImportBGThread.instance) {
            DataImportBGThread.instance = new DataImportBGThread();
        }
        return DataImportBGThread.instance;
    }

    private static instance: DataImportBGThread = null;

    // private static request: string = ' where state in ($1, $3, $4, $5) or (state = $2 and autovalidate = true) order by last_up_date desc limit 1;';

    private static request_all_reimports: string = ' where state = $1 order by start_date asc, id asc;';
    private static request: string = ' where state in ($1, $3, $4) or (state = $2 and autovalidate = true) order by start_date asc, id asc limit 1;';
    private static importing_dih_id_param_name: string = 'DataImportBGThread.importing_dih_id';
    private static wait_for_empty_vars_vos_cud_param_name: string = 'DataImportBGThread.wait_for_empty_vars_vos_cud';
    private static wait_for_empty_cache_vars_waiting_for_compute_param_name: string = 'DataImportBGThread.wait_for_empty_cache_vars_waiting_for_compute';

    public current_timeout: number = 2000;
    public MAX_timeout: number = 2000;
    public MIN_timeout: number = 100;

    private waiting_for_empty_vars_vos_cud: boolean = false;
    private waiting_for_empty_cache_vars_waiting_for_compute: boolean = false;

    private constructor() {
    }

    get name(): string {
        return "DataImportBGThread";
    }

    public async work(): Promise<number> {

        try {

            /**
             * Pour éviter de surcharger le système, on attend que le vos_cud des vars soit vidé (donc on a vraiment fini de traiter les imports précédents et rien de complexe en cours)
             */
            let wait_for_empty_vars_vos_cud: boolean = await ModuleParams.getInstance().getParamValueAsBoolean(DataImportBGThread.wait_for_empty_vars_vos_cud_param_name, true);
            try {
                if (wait_for_empty_vars_vos_cud) {
                    if (await VarsDatasVoUpdateHandler.getInstance().has_vos_cud()) {
                        ConsoleHandler.getInstance().log('DataImportBGThread:wait_for_empty_vars_vos_cud KO ... next try in ' + this.current_timeout + ' ms');
                        this.waiting_for_empty_vars_vos_cud = true;
                        return ModuleBGThreadServer.TIMEOUT_COEF_LITTLE_BIT_SLOWER;
                    }

                    if (this.waiting_for_empty_vars_vos_cud) {
                        this.waiting_for_empty_vars_vos_cud = false;
                        ConsoleHandler.getInstance().log('DataImportBGThread:wait_for_empty_vars_vos_cud OK');
                    }
                }
            } catch (error) {
                ConsoleHandler.getInstance().error('DataImportBGThread:wait_for_empty_vars_vos_cud varbgthread did not answer. waiting for it to get back up');
                this.waiting_for_empty_vars_vos_cud = true;
                return ModuleBGThreadServer.TIMEOUT_COEF_LITTLE_BIT_SLOWER;
            }

            // On commence par préparer les réimport en attente si il y en a
            await this.prepare_reimports();

            // Objectif, on prend l'import en attente le plus ancien, et on l'importe tout simplement.
            //  en fin d'import, si on voit qu'il y en a un autre à importer, on demande d'aller plus vite.

            // Si un import est en cours et doit être continuer, on le récupère et on continue, sinon on en cherche un autre
            let importing_dih_id_param: string = await ModuleParams.getInstance().getParamValue(DataImportBGThread.importing_dih_id_param_name);
            let importing_dih_id: number = null;
            let dih: DataImportHistoricVO = null;
            if (!!importing_dih_id_param) {
                importing_dih_id = parseInt(importing_dih_id_param);
                dih = await ModuleDAO.getInstance().getVoById<DataImportHistoricVO>(DataImportHistoricVO.API_TYPE_ID, importing_dih_id);

                if ((!dih) || (
                    (dih.state != ModuleDataImport.IMPORTATION_STATE_UPLOADED) &&
                    (dih.state != ModuleDataImport.IMPORTATION_STATE_FORMATTED) &&
                    (dih.state != ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT) &&
                    (dih.state != ModuleDataImport.IMPORTATION_STATE_IMPORTED))) {
                    dih = null;
                    await ModuleParams.getInstance().setParamValue(DataImportBGThread.importing_dih_id_param_name, null);
                }
            }

            if (!dih) {
                /**
                 * 2eme tentative de continuer un import qui serait à mi-chemin mais pas dans le param (plantage du serveur par exemple)
                 */
                dih = await query(DataImportHistoricVO.API_TYPE_ID)
                    .add_filters([
                        filter(DataImportHistoricVO.API_TYPE_ID, 'state').by_num_eq(
                            [
                                RangeHandler.getInstance().create_single_elt_NumRange(ModuleDataImport.IMPORTATION_STATE_IMPORTED, NumSegment.TYPE_INT),
                                RangeHandler.getInstance().create_single_elt_NumRange(ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT, NumSegment.TYPE_INT)
                            ]
                        ).or(
                            filter(DataImportHistoricVO.API_TYPE_ID, 'state').by_num_eq(
                                ModuleDataImport.IMPORTATION_STATE_FORMATTED
                            ).and(
                                filter(DataImportHistoricVO.API_TYPE_ID, 'autovalidate').is_true()
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
                    .filter_by_num_eq('state', ModuleDataImport.IMPORTATION_STATE_UPLOADED)
                    .set_sorts([
                        new SortByVO(DataImportHistoricVO.API_TYPE_ID, 'weight', true),
                        new SortByVO(DataImportHistoricVO.API_TYPE_ID, 'start_date', true),
                        new SortByVO(DataImportHistoricVO.API_TYPE_ID, 'id', true)
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
                let can_retry = await ModuleParams.getInstance().getParamValueAsBoolean(ModuleDataImport.PARAM_CAN_RETRY_FAILED, false);
                if (can_retry) {
                    dih = await this.try_getting_failed_retryable_import();
                }
            }

            if (!dih) {
                return ModuleBGThreadServer.TIMEOUT_COEF_LITTLE_BIT_SLOWER;
            }

            await ModuleParams.getInstance().setParamValue(DataImportBGThread.importing_dih_id_param_name, dih.id.toString());

            if (!await this.handleImportHistoricProgression(dih)) {
                return ModuleBGThreadServer.TIMEOUT_COEF_LITTLE_BIT_SLOWER;
            }
            ConsoleHandler.getInstance().log('DataImportBGThread DIH[' + dih.id + '] state:' + dih.state + ':');

            if ([
                ModuleDataImport.IMPORTATION_STATE_UPLOADED,
                ModuleDataImport.IMPORTATION_STATE_FORMATTED,
                ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT,
                ModuleDataImport.IMPORTATION_STATE_IMPORTED
            ].indexOf(dih.state) >= 0) {
                return ModuleBGThreadServer.TIMEOUT_COEF_RUN;
            }

            dih = await ModuleDAOServer.getInstance().selectOne<DataImportHistoricVO>(DataImportHistoricVO.API_TYPE_ID,
                DataImportBGThread.request, [
                ModuleDataImport.IMPORTATION_STATE_UPLOADED,
                ModuleDataImport.IMPORTATION_STATE_FORMATTED,
                ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT,
                ModuleDataImport.IMPORTATION_STATE_IMPORTED
            ]);

            if (!dih) {
                await ModuleParams.getInstance().setParamValue(DataImportBGThread.importing_dih_id_param_name, null);
                return ModuleBGThreadServer.TIMEOUT_COEF_LITTLE_BIT_SLOWER;
            } else {
                await ModuleParams.getInstance().setParamValue(DataImportBGThread.importing_dih_id_param_name, dih.id.toString());
                return ModuleBGThreadServer.TIMEOUT_COEF_RUN;
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }

        return ModuleBGThreadServer.TIMEOUT_COEF_LITTLE_BIT_SLOWER;
    }

    private async prepare_reimports() {
        let dihs = await ModuleDAOServer.getInstance().selectAll<DataImportHistoricVO>(DataImportHistoricVO.API_TYPE_ID,
            DataImportBGThread.request_all_reimports, [
            ModuleDataImport.IMPORTATION_STATE_NEEDS_REIMPORT
        ]);

        for (let i in dihs) {
            let dih = dihs[i];

            await this.handleImportHistoricProgression(dih);
            ConsoleHandler.getInstance().log('DataImportBGThread REIMPORT DIH[' + dih.id + '] state:' + dih.state + ':');
        }
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
        importHistoric.use_fast_track = false;
        importHistoric.state = ModuleDataImport.IMPORTATION_STATE_UPLOADED;
        await ModuleDAO.getInstance().insertOrUpdateVO(importHistoric);
    }

    /**
     * L'idée du fast track, c'est d'éviter de passer par la bdd sauf dans le post process et pour mettre à jour le statut final
     */
    private async handleImportHistoricProgressionFastTrack(importHistoric: DataImportHistoricVO): Promise<boolean> {

        ConsoleHandler.getInstance().log('DataImportBGThread Using Fast Track DIH[' + importHistoric.id + '] state:' + importHistoric.state + ':IN');

        if (importHistoric.state != ModuleDataImport.IMPORTATION_STATE_UPLOADED) {
            return false;
        }

        // case ModuleDataImport.IMPORTATION_STATE_UPLOADED:
        importHistoric.state = ModuleDataImport.IMPORTATION_STATE_FORMATTING;
        // await ModuleDataImportServer.getInstance().updateImportHistoric(importHistoric);
        let fasttrack_datas: IImportedData[] = await ModuleDataImportServer.getInstance().formatDatas(importHistoric);

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

        if (importHistoric.state != ModuleDataImport.IMPORTATION_STATE_IMPORTED) {
            await this.handlefasttrackerror(importHistoric);
            return false;
        }

        // case ModuleDataImport.IMPORTATION_STATE_IMPORTED:
        importHistoric.state = ModuleDataImport.IMPORTATION_STATE_POSTTREATING;
        // await ModuleDataImportServer.getInstance().updateImportHistoric(importHistoric);
        await ModuleDataImportServer.getInstance().posttreatDatas(importHistoric, fasttrack_datas);

        if (importHistoric.state != ModuleDataImport.IMPORTATION_STATE_POSTTREATED) {
            await this.handlefasttrackerror(importHistoric);
            return false;
        }

        await ModuleDAO.getInstance().insertOrUpdateVO(importHistoric);

        return true;
    }

    private async handleImportHistoricProgressionClassic(importHistoric: DataImportHistoricVO): Promise<boolean> {

        // Call the workers async to give the hand back to the client, but change the state right now since we're ready to launch the trigger
        // The updates will be pushed later on, no need to wait
        switch (importHistoric.state) {
            case ModuleDataImport.IMPORTATION_STATE_UPLOADED:
                importHistoric.state = ModuleDataImport.IMPORTATION_STATE_FORMATTING;
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

                /**
                 * Pour éviter de surcharger le système, on attend qu'il n'y ai plus de vars en cours de calcul pour le client pour passer à la dernière étape des imports
                 */
                let wait_for_empty_cache_vars_waiting_for_compute: boolean = await ModuleParams.getInstance().getParamValueAsBoolean(DataImportBGThread.wait_for_empty_cache_vars_waiting_for_compute_param_name, true);
                try {
                    if (wait_for_empty_cache_vars_waiting_for_compute) {
                        if (await VarsDatasProxy.getInstance().has_cached_vars_waiting_for_compute()) {
                            ConsoleHandler.getInstance().log('DataImportBGThread:wait_for_empty_cache_vars_waiting_for_compute KO ... next try in ' + this.current_timeout + ' ms');
                            this.waiting_for_empty_cache_vars_waiting_for_compute = true;
                            return false;
                        }

                        if (this.waiting_for_empty_cache_vars_waiting_for_compute) {
                            this.waiting_for_empty_cache_vars_waiting_for_compute = false;
                            ConsoleHandler.getInstance().log('DataImportBGThread:wait_for_empty_cache_vars_waiting_for_compute OK');
                        }
                    }
                } catch (error) {
                    ConsoleHandler.getInstance().error('DataImportBGThread:wait_for_empty_cache_vars_waiting_for_compute varbgthread did not answer. waiting for it to get back up');
                    this.waiting_for_empty_cache_vars_waiting_for_compute = true;
                    return false;
                }

                importHistoric.state = ModuleDataImport.IMPORTATION_STATE_POSTTREATING;
                await ModuleDataImportServer.getInstance().updateImportHistoric(importHistoric);
                await ModuleDataImportServer.getInstance().posttreatDatas(importHistoric);
                return true;

            case ModuleDataImport.IMPORTATION_STATE_NEEDS_REIMPORT:

                importHistoric.state = (((importHistoric.status_before_reimport != null) && (typeof importHistoric.status_before_reimport != 'undefined')) ? importHistoric.status_before_reimport : ModuleDataImport.IMPORTATION_STATE_POSTTREATED);
                await ModuleDAO.getInstance().insertOrUpdateVO(importHistoric);

                let new_importHistoric = new DataImportHistoricVO();
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

                let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(new_importHistoric);

                if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
                    ConsoleHandler.getInstance().error('!insertOrDeleteQueryResult dans handleImportHistoricProgression');
                    return false;
                }
                let id = insertOrDeleteQueryResult.id;
                if ((!id) || (!TypesHandler.getInstance().isNumber(id))) {
                    ConsoleHandler.getInstance().error('!id dans handleImportHistoricProgression');
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
        let filter_state = new ContextFilterVO();
        filter_state.field_id = 'state';
        filter_state.vo_type = DataImportHistoricVO.API_TYPE_ID;
        filter_state.filter_type = ContextFilterVO.TYPE_NUMERIC_EQUALS;
        filter_state.param_numeric = ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION;

        let filter_reimport_of_dih_id = new ContextFilterVO();
        filter_reimport_of_dih_id.field_id = 'reimport_of_dih_id';
        filter_reimport_of_dih_id.vo_type = DataImportHistoricVO.API_TYPE_ID;
        filter_reimport_of_dih_id.filter_type = ContextFilterVO.TYPE_NULL_ALL;

        let filter_status_before_reimport = new ContextFilterVO();
        filter_status_before_reimport.field_id = 'status_before_reimport';
        filter_status_before_reimport.vo_type = DataImportHistoricVO.API_TYPE_ID;
        filter_status_before_reimport.filter_type = ContextFilterVO.TYPE_NULL_ALL;

        let filter_status_of_last_reimport = new ContextFilterVO();
        filter_status_of_last_reimport.field_id = 'status_of_last_reimport';
        filter_status_of_last_reimport.vo_type = DataImportHistoricVO.API_TYPE_ID;
        filter_status_of_last_reimport.filter_type = ContextFilterVO.TYPE_NULL_ALL;

        let filter_last_up_date = new ContextFilterVO();
        filter_last_up_date.field_id = 'last_up_date';
        filter_last_up_date.vo_type = DataImportHistoricVO.API_TYPE_ID;
        filter_last_up_date.filter_type = ContextFilterVO.TYPE_NUMERIC_INF_ALL;
        filter_last_up_date.param_numeric = Dates.add(Dates.now(), -5, TimeSegment.TYPE_MINUTE);

        let query_context: ContextQueryVO = new ContextQueryVO();
        query_context.base_api_type_id = DataImportHistoricVO.API_TYPE_ID;
        query_context.active_api_type_ids = [DataImportHistoricVO.API_TYPE_ID];
        query_context.filters = [filter_state, filter_reimport_of_dih_id, filter_status_of_last_reimport, filter_last_up_date, filter_status_before_reimport];
        query_context.query_limit = 0;
        query_context.query_offset = 0;

        let dihs: DataImportHistoricVO[] = await ModuleContextFilter.getInstance().select_vos<DataImportHistoricVO>(query_context);

        if ((!dihs) || (!dihs.length)) {
            return null;
        }

        let dih = dihs[0];
        await ModuleDataImport.getInstance().reimportdih(dih);
        return await ModuleDAO.getInstance().getVoById<DataImportHistoricVO>(DataImportHistoricVO.API_TYPE_ID, dih.id);
    }
}