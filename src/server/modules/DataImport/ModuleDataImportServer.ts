import * as moment from 'moment';
import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import NumberParamVO from '../../../shared/modules/API/vos/apis/NumberParamVO';
import StringParamVO from '../../../shared/modules/API/vos/apis/StringParamVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import IImportedData from '../../../shared/modules/DataImport/interfaces/IImportedData';
import ModuleDataImport from '../../../shared/modules/DataImport/ModuleDataImport';
import DataImportColumnVO from '../../../shared/modules/DataImport/vos/DataImportColumnVO';
import DataImportFormatVO from '../../../shared/modules/DataImport/vos/DataImportFormatVO';
import DataImportHistoricVO from '../../../shared/modules/DataImport/vos/DataImportHistoricVO';
import DataImportLogVO from '../../../shared/modules/DataImport/vos/DataImportLogVO';
import ModulesManager from '../../../shared/modules/ModulesManager';
import ModuleTable from '../../../shared/modules/ModuleTable';
import ModuleVO from '../../../shared/modules/ModuleVO';
import ModuleTrigger from '../../../shared/modules/Trigger/ModuleTrigger';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import DateHandler from '../../../shared/tools/DateHandler';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import DAOTriggerHook from '../DAO/triggers/DAOTriggerHook';
import ModuleServerBase from '../ModuleServerBase';
import ModulePushDataServer from '../PushData/ModulePushDataServer';
import DataImportModuleBase from './DataImportModuleBase/DataImportModuleBase';
import ImportTypeXLSXHandler from './ImportTypeHandlers/ImportTypeXLSXHandler';
import ImportLogger from './logger/ImportLogger';
import FileVO from '../../../shared/modules/File/vos/FileVO';
import ModuleFileServer from '../File/ModuleFileServer';
import ModuleFile from '../../../shared/modules/File/ModuleFile';
import FormattedDatasStats from './FormattedDatasStats';
import IRenderedData from '../../../shared/modules/DataRender/interfaces/IRenderedData';

export default class ModuleDataImportServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleDataImportServer.instance) {
            ModuleDataImportServer.instance = new ModuleDataImportServer();
        }
        return ModuleDataImportServer.instance;
    }

    private static instance: ModuleDataImportServer = null;

    private constructor() {
        super(ModuleDataImport.getInstance().name);
    }

    public async configure() {

        // Triggers pour mettre à jour les dates
        let preCreateTrigger: DAOTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOTriggerHook.DAO_PRE_CREATE_TRIGGER);
        let preUpdateTrigger: DAOTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOTriggerHook.DAO_PRE_UPDATE_TRIGGER);
        preUpdateTrigger.registerHandler(DataImportHistoricVO.API_TYPE_ID, this.handleImportHistoricDateUpdate.bind(this));
        preCreateTrigger.registerHandler(DataImportHistoricVO.API_TYPE_ID, this.handleImportHistoricDateCreation.bind(this));

        // Triggers pour faire avancer l'import
        let postUpdateTrigger: DAOTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOTriggerHook.DAO_POST_UPDATE_TRIGGER);
        let postCreateTrigger: DAOTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOTriggerHook.DAO_POST_CREATE_TRIGGER);
        postUpdateTrigger.registerHandler(DataImportHistoricVO.API_TYPE_ID, this.handleImportHistoricProgression.bind(this));
        postCreateTrigger.registerHandler(DataImportHistoricVO.API_TYPE_ID, this.setImportHistoricUID.bind(this));
        postCreateTrigger.registerHandler(DataImportHistoricVO.API_TYPE_ID, this.handleImportHistoricProgression.bind(this));
    }

    private async setImportHistoricUID(importHistoric: DataImportHistoricVO): Promise<void> {
        importHistoric.historic_uid = importHistoric.id.toString();
        await ModuleDAO.getInstance().insertOrUpdateVO(importHistoric);
    }

    private async handleImportHistoricDateUpdate(importHistoric: DataImportHistoricVO): Promise<boolean> {
        importHistoric.last_up_date = DateHandler.getInstance().formatDateTimeForBDD(moment());

        if (!importHistoric.end_date) {
            if ((importHistoric.state == ModuleDataImport.IMPORTATION_STATE_POSTTREATED) ||
                (importHistoric.state == ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION) ||
                (importHistoric.state == ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT) ||
                (importHistoric.state == ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED)) {
                importHistoric.end_date = DateHandler.getInstance().formatDateTimeForBDD(moment());
            }
        }
        return true;
    }

    private async handleImportHistoricDateCreation(importHistoric: DataImportHistoricVO): Promise<boolean> {
        importHistoric.start_date = DateHandler.getInstance().formatDateTimeForBDD(moment());
        return true;
    }

    private async handleImportHistoricProgression(importHistoric: DataImportHistoricVO): Promise<void> {

        if (!(importHistoric && importHistoric.id)) {
            return;
        }

        // Call the workers async to give the hand back to the client, but change the state right now since we're ready to launch the trigger
        // The updates will be pushed later on, no need to wait
        switch (importHistoric.state) {
            case ModuleDataImport.IMPORTATION_STATE_UPLOADED:
                importHistoric.state = ModuleDataImport.IMPORTATION_STATE_FORMATTING;
                await this.updateImportHistoric(importHistoric);
                this.formatDatas(importHistoric);
                break;

            case ModuleDataImport.IMPORTATION_STATE_FORMATTED:
                //  Si on est sur une autovalidation, et qu'on a des résultats, on peut passer directement à l'étape suivante
                if (importHistoric.autovalidate) {
                    await this.logAndUpdateHistoric(importHistoric, null, ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT, 'Autovalidation', "import.success.autovalidation", DataImportLogVO.LOG_LEVEL_SUCCESS);
                }
                break;

            case ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT:
                importHistoric.state = ModuleDataImport.IMPORTATION_STATE_IMPORTING;
                await this.updateImportHistoric(importHistoric);
                this.importDatas(importHistoric);
                break;

            case ModuleDataImport.IMPORTATION_STATE_IMPORTED:
                importHistoric.state = ModuleDataImport.IMPORTATION_STATE_POSTTREATING;
                await this.updateImportHistoric(importHistoric);
                this.posttreatDatas(importHistoric);
                break;

            default:
                return;
        }
    }

    /**
     * 1 - Récupérer les différents formats possible, 
     * 2 - Choisir le format le plus adapté
     * 3 - Importer dans le vo intermédiaire
     * 4 - Mettre à jour le status et informer le client de la mise à jour du DAO
     */
    private async formatDatas(importHistoric: DataImportHistoricVO): Promise<void> {

        await ImportLogger.getInstance().log(importHistoric, null, 'Début de l\'importation', DataImportLogVO.LOG_LEVEL_INFO);

        // On commence par nettoyer la table, quelle que soit l'issue
        await ModuleDAOServer.getInstance().truncate(ModuleDataImport.getInstance().getRawImportedDatasAPI_Type_Id(importHistoric.api_type_id));

        // 1
        let formats: DataImportFormatVO[] = await this.getImportFormatsForApiTypeId(importHistoric.api_type_id);
        if ((!formats) || (!formats.length)) {
            await this.logAndUpdateHistoric(importHistoric, null, ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED, "Aucun format pour l'import", "import.errors.failed_formatting_no_format", DataImportLogVO.LOG_LEVEL_FATAL);
            return;
        }

        let all_formats_datas: { [format_id: number]: IImportedData[] } = {};

        let max_formattedDatasStats: FormattedDatasStats = new FormattedDatasStats();
        let moduleTable: ModuleTable<any> = VOsTypesManager.getInstance().moduleTables_by_voType[importHistoric.api_type_id];

        let has_datas: boolean = false;

        // On priorise les formats de type colonnes nommées, car si on arrive à remplir l'un de ces formats, on a pas besoin de tester les autres
        formats.sort((a: DataImportFormatVO, b: DataImportFormatVO) => {
            if (a.type_column_position < b.type_column_position) {
                return -1;
            }
            if (a.type_column_position > b.type_column_position) {
                return 1;
            }

            return 0;
        });

        for (let i in formats) {
            let format: DataImportFormatVO = formats[i];
            let columns: DataImportColumnVO[] = await ModuleDataImport.getInstance().getDataImportColumnsFromFormatId(format.id);

            if ((!format) || (!columns) || (!columns.length)) {
                await ImportLogger.getInstance().log(importHistoric, format, "Impossible de charger un des formats, ou il n'a pas de colonnes", DataImportLogVO.LOG_LEVEL_ERROR);
                continue;
            }

            let datas: IImportedData[] = [];
            switch (format.type) {
                case DataImportFormatVO.TYPE_XLS:
                case DataImportFormatVO.TYPE_XLSX:
                default:
                    datas = await ImportTypeXLSXHandler.getInstance().importFile(format, columns, importHistoric, format.type_column_position != DataImportFormatVO.TYPE_COLUMN_POSITION_LABEL);
            }

            // Ensuite on demande au module responsable de l'import si on a des filtrages à appliquer
            let postTreatementModuleVO: ModuleVO = await ModuleDAO.getInstance().getVoById<ModuleVO>(ModuleVO.API_TYPE_ID, format.post_exec_module_id);

            if ((!postTreatementModuleVO) || (!postTreatementModuleVO.name)) {
                await ImportLogger.getInstance().log(importHistoric, format, "Impossible de retrouver le module pour tester le format", DataImportLogVO.LOG_LEVEL_ERROR);
                continue;
            }

            let postTraitementModule: DataImportModuleBase = (ModulesManager.getInstance().getModuleByNameAndRole(postTreatementModuleVO.name, DataImportModuleBase.DataImportRoleName)) as DataImportModuleBase;
            if (!postTraitementModule) {
                await ImportLogger.getInstance().log(importHistoric, format, "Impossible de retrouver le module pour tester le format", DataImportLogVO.LOG_LEVEL_ERROR);
                continue;
            }

            let pre_validation_formattedDatasStats: FormattedDatasStats = this.countValidatedDataAndColumns(datas, moduleTable, format.id);
            let prevalidation_datas = datas;
            datas = await postTraitementModule.validate_formatted_data(datas, importHistoric);

            has_datas = has_datas || (datas && (datas.length > 0));
            all_formats_datas[format.id] = datas;

            let formattedDatasStats: FormattedDatasStats = this.countValidatedDataAndColumns(datas, moduleTable, format.id);

            if ((formattedDatasStats.nb_fields_validated > 0) && (formattedDatasStats.nb_row_validated > 0) && (format.type_column_position == DataImportFormatVO.TYPE_COLUMN_POSITION_LABEL)) {
                max_formattedDatasStats = formattedDatasStats;
                break;
            }

            if (formattedDatasStats.nb_fields_validated > max_formattedDatasStats.nb_fields_validated) {
                max_formattedDatasStats = formattedDatasStats;
            }

            // Si on a pas de données, et qu'on est sur un type position label, on veut comprendre
            if (((!formattedDatasStats.nb_fields_validated) || (!formattedDatasStats.nb_row_validated)) && (format.type_column_position == DataImportFormatVO.TYPE_COLUMN_POSITION_LABEL)) {

                // Si on avait des datas avant la validation et qu'on en a plus après, ça intéresse de savoir pourquoi on a tout invalidé.
                // Donc on va chercher les raisons évoquées et on les résume
                if ((pre_validation_formattedDatasStats.nb_row_validated > 0) || (pre_validation_formattedDatasStats.nb_fields_validated > 0)) {
                    let messages_stats: { [msg: string]: number } = {};

                    for (let data_i in datas) {
                        let data: IImportedData = datas[data_i];

                        if ((!!data.not_validated_msg) && (data.not_validated_msg != '')) {
                            if (!messages_stats[data.not_validated_msg]) {
                                messages_stats[data.not_validated_msg] = 0;
                            }
                            messages_stats[data.not_validated_msg]++;
                        }
                    }

                    await ImportLogger.getInstance().log(importHistoric, format, "Toutes les données sont invalides. Nb de lignes identifiées : " + prevalidation_datas.length + ".", DataImportLogVO.LOG_LEVEL_ERROR);
                    for (let msg in messages_stats) {
                        await ImportLogger.getInstance().log(importHistoric, format, "Dont " + messages_stats[msg] + " lignes invalidées car : " + msg + ".", DataImportLogVO.LOG_LEVEL_WARN);
                    }
                }
            }
        }

        if ((!has_datas) || (!max_formattedDatasStats.format_id) || (max_formattedDatasStats.nb_fields_validated <= 0) || (max_formattedDatasStats.nb_row_validated <= 0)) {
            await this.logAndUpdateHistoric(importHistoric, null, ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED, "Aucune donnée formattable", "import.errors.failed_formatting_no_data", DataImportLogVO.LOG_LEVEL_FATAL);
            return;
        }

        importHistoric.data_import_format_id = max_formattedDatasStats.format_id;
        importHistoric.nb_row_unvalidated = max_formattedDatasStats.nb_row_unvalidated;
        importHistoric.nb_row_validated = max_formattedDatasStats.nb_row_validated;
        await this.insertImportedDatasInDb(all_formats_datas[importHistoric.data_import_format_id], ModuleDataImport.getInstance().getRawImportedDatasAPI_Type_Id(importHistoric.api_type_id), moduleTable);

        // 4
        await this.logAndUpdateHistoric(importHistoric, null, ModuleDataImport.IMPORTATION_STATE_FORMATTED, 'Formattage terminé', "import.success.formatted", DataImportLogVO.LOG_LEVEL_SUCCESS);
    }

    private countValidatedDataAndColumns(vos: IImportedData[], moduleTable: ModuleTable<any>, data_import_format_id: number): FormattedDatasStats {
        let res: FormattedDatasStats = new FormattedDatasStats();
        res.format_id = data_import_format_id;

        for (let i in vos) {
            let vo = vos[i];

            if ((!vo) || (vo.importation_state != ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT)) {
                res.nb_row_unvalidated++;
                continue;
            }

            res.nb_row_validated++;

            for (let j in moduleTable.fields) {
                let field = moduleTable.fields[j];

                if (!!vo[field.field_id]) {
                    res.nb_fields_validated++;
                }
            }
        }

        return res;
    }

    /**
     * 1 - Récupérer le format validé, et les données validées
     * 2 - Importer dans le vo cible, suivant le mode d'importation (remplacement ou mise à jour)
     * 3 - Mettre à jour le status et informer le client
     * @param importHistoric
     */
    private async importDatas(importHistoric: DataImportHistoricVO): Promise<void> {

        //  1 - Récupérer le format validé, et les données importées ()
        let format: DataImportFormatVO = await ModuleDAO.getInstance().getVoById<DataImportFormatVO>(DataImportFormatVO.API_TYPE_ID, importHistoric.data_import_format_id);
        let raw_imported_datas: IImportedData[] = await ModuleDAO.getInstance().getVos<IImportedData>(ModuleDataImport.getInstance().getRawImportedDatasAPI_Type_Id(format.api_type_id));

        if ((!format) || (!format.post_exec_module_id) || (!raw_imported_datas) || (!raw_imported_datas.length)) {
            await this.logAndUpdateHistoric(importHistoric, format, ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION, "Aucune data formattée ou pas de module configuré", "import.errors.failed_importation_see_logs", DataImportLogVO.LOG_LEVEL_FATAL);
            return;
        }

        // On garde que les données, validées et importées
        let validated_imported_datas: IImportedData[] = [];
        for (let i in raw_imported_datas) {
            if (raw_imported_datas[i].importation_state != ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT) {
                continue;
            }
            validated_imported_datas.push(raw_imported_datas[i]);
        }

        if ((!validated_imported_datas) || (!validated_imported_datas.length)) {
            await this.logAndUpdateHistoric(importHistoric, format, ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION, "Aucune data validée pour importation", "import.errors.failed_importation_see_logs", DataImportLogVO.LOG_LEVEL_FATAL);
            return;
        }

        // 2 - Importer dans le vo cible, suivant le mode d'importation (remplacement ou mise à jour)
        switch (importHistoric.import_type) {
            case DataImportHistoricVO.IMPORT_TYPE_REPLACE:
                await ModuleDAOServer.getInstance().truncate(format.api_type_id);

                // a priori on a juste à virer les ids et modifier les _type, on peut insérer dans le vo cible
                let insertable_datas: IImportedData[] = [];
                for (let i in validated_imported_datas) {
                    let insertable_data: IImportedData = Object.assign({}, validated_imported_datas[i]);
                    delete insertable_data.id;
                    insertable_data._type = format.api_type_id;
                    insertable_datas.push(insertable_data);
                }

                let inserteds: InsertOrDeleteQueryResult[] = await ModuleDAO.getInstance().insertOrUpdateVOs(insertable_datas);

                if ((!inserteds) || (inserteds.length != insertable_datas.length)) {

                    for (let i in validated_imported_datas) {
                        validated_imported_datas[i].importation_state = ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION;
                    }
                    await ModuleDAO.getInstance().insertOrUpdateVOs(validated_imported_datas);

                    await this.logAndUpdateHistoric(importHistoric, format, ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION, "Le nombre d'éléments importés ne correspond pas au nombre d'éléments validés", "import.errors.failed_importation_numbers_not_matching", DataImportLogVO.LOG_LEVEL_FATAL);
                    return;
                }

                break;
            default:
                await this.logAndUpdateHistoric(importHistoric, format, ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION, "Type d\'importation non supporté", "import.errors.failed_importation_unknown_import_type", DataImportLogVO.LOG_LEVEL_FATAL);
                return;
        }

        for (let i in validated_imported_datas) {
            validated_imported_datas[i].importation_state = ModuleDataImport.IMPORTATION_STATE_IMPORTED;
        }
        await ModuleDAO.getInstance().insertOrUpdateVOs(validated_imported_datas);

        // 3 - Mettre à jour le status et informer le client
        await this.logAndUpdateHistoric(importHistoric, format, ModuleDataImport.IMPORTATION_STATE_IMPORTED, "Import terminé", "import.success.imported", DataImportLogVO.LOG_LEVEL_SUCCESS);
    }

    /**
     * 1 - Récupérer le format validé, et les données importées ()
     * 2 - Post-traiter les données
     * 3 - Mettre à jour le status et informer le client
     */
    private async posttreatDatas(importHistoric: DataImportHistoricVO): Promise<void> {

        //  1 - Récupérer le format validé, et les données importées ()
        let format: DataImportFormatVO = await ModuleDAO.getInstance().getVoById<DataImportFormatVO>(DataImportFormatVO.API_TYPE_ID, importHistoric.data_import_format_id);
        let raw_imported_datas: IImportedData[] = await ModuleDAO.getInstance().getVos<IImportedData>(ModuleDataImport.getInstance().getRawImportedDatasAPI_Type_Id(format.api_type_id));

        if ((!format) || (!format.post_exec_module_id) || (!raw_imported_datas) || (!raw_imported_datas.length)) {
            await this.logAndUpdateHistoric(importHistoric, format, ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT, "Aucune data formattée ou pas de module configuré", "import.errors.failed_post_treatement_see_logs", DataImportLogVO.LOG_LEVEL_FATAL);
            return;
        }

        // On garde que les données, validées et importées
        let validated_imported_datas: IImportedData[] = [];
        for (let i in raw_imported_datas) {
            if (raw_imported_datas[i].importation_state != ModuleDataImport.IMPORTATION_STATE_IMPORTED) {
                continue;
            }
            validated_imported_datas.push(raw_imported_datas[i]);
        }

        let postTreated = false;
        let postTreatementModuleVO: ModuleVO = await ModuleDAO.getInstance().getVoById<ModuleVO>(ModuleVO.API_TYPE_ID, format.post_exec_module_id);

        if ((!validated_imported_datas) || (!validated_imported_datas.length)) {
            await this.logAndUpdateHistoric(importHistoric, format, ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT, "Aucune data importée", "import.errors.failed_post_treatement_see_logs", DataImportLogVO.LOG_LEVEL_FATAL);
            return;
        }
        if ((!postTreatementModuleVO) || (!postTreatementModuleVO.name)) {
            await this.logAndUpdateHistoric(importHistoric, format, ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT, "Impossible de retrouver le module", "import.errors.failed_post_treatement_see_logs", DataImportLogVO.LOG_LEVEL_FATAL);
            return;
        }

        //  2 - Post-traiter les données
        // PostTraitement des données avec les hooks pour générer les questions et intégrer ce qui peut l'être
        let postTraitementModule: DataImportModuleBase = (ModulesManager.getInstance().getModuleByNameAndRole(postTreatementModuleVO.name, DataImportModuleBase.DataImportRoleName)) as DataImportModuleBase;
        try {
            if (await postTraitementModule.hook_merge_imported_datas_in_database(validated_imported_datas, importHistoric)) {
                postTreated = true;
            }
        } catch (error) {
            console.error(error);
            await this.logAndUpdateHistoric(importHistoric, format, ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT, "Le post-traitement a échoué :" + error, "import.errors.failed_post_treatement_see_logs", DataImportLogVO.LOG_LEVEL_FATAL);
            return;
        }

        if (!postTreated) {
            await this.logAndUpdateHistoric(importHistoric, format, ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT, "Le post-traitement a échoué", "import.errors.failed_post_treatement_see_logs", DataImportLogVO.LOG_LEVEL_FATAL);
            return;
        }

        //  3 - Mettre à jour le status et informer le client
        // à la fin on indique le bon fonctionnement
        // Pour l'instant on informe que l'auteur, mais en fait à terme ce qui serait top (mais à réfléchir par ce que très gourmand potentiellement)
        //  ça serait d'informer tout le monde, directement en post creat et post update, et post delete, de toutes les modifs de DAO...
        //  comme ça la data se mettrait à jour en temps réel dans l'appli, même si c'est un autre utilisateur qui fait un import

        // Alors c'est tellement gourmand que même pour un user on le fait pour l'instant...
        // let api_type_ids: string[] = postTraitementModule.get_merged_api_type_ids();
        // for (let i in api_type_ids) {
        //     await ModulePushDataServer.getInstance().notifyDAOGetVos(importHistoric.user_id, api_type_ids[i]);
        // }

        await this.logAndUpdateHistoric(importHistoric, format, ModuleDataImport.IMPORTATION_STATE_POSTTREATED, "Fin import : " + moment().format("Y-MM-DD HH:mm"), "import.success.posttreated", DataImportLogVO.LOG_LEVEL_SUCCESS);
    }

    private async updateImportHistoric(importHistoric: DataImportHistoricVO) {
        await ModuleDAO.getInstance().insertOrUpdateVO(importHistoric);
        await ModulePushDataServer.getInstance().notifyDAOGetVoById(importHistoric.user_id, DataImportHistoricVO.API_TYPE_ID, importHistoric.id);
    }

    private async logAndUpdateHistoric(importHistoric: DataImportHistoricVO, format: DataImportFormatVO, import_state: number, logmsg: string, notif_code: string, log_lvl: number) {

        importHistoric.state = import_state;

        // On choisit la notif à envoyer
        switch (log_lvl) {
            case DataImportLogVO.LOG_LEVEL_FATAL:
            case DataImportLogVO.LOG_LEVEL_ERROR:
                await ModulePushDataServer.getInstance().notifySimpleERROR(importHistoric.user_id, notif_code);
                break;
            case DataImportLogVO.LOG_LEVEL_WARN:
                await ModulePushDataServer.getInstance().notifySimpleWARN(importHistoric.user_id, notif_code);
                break;
            case DataImportLogVO.LOG_LEVEL_SUCCESS:
                await ModulePushDataServer.getInstance().notifySimpleSUCCESS(importHistoric.user_id, notif_code);
                break;
            case DataImportLogVO.LOG_LEVEL_INFO:
                await ModulePushDataServer.getInstance().notifySimpleINFO(importHistoric.user_id, notif_code);
                break;
            case DataImportLogVO.LOG_LEVEL_DEBUG:
            default:
                break;
        }

        await ImportLogger.getInstance().log(importHistoric, format, logmsg, log_lvl);
        await this.updateImportHistoric(importHistoric);
    }

    public registerServerApiHandlers() {
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDataImport.APINAME_getDataImportHistorics, this.getDataImportHistorics.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDataImport.APINAME_getDataImportHistoric, this.getDataImportHistoric.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDataImport.APINAME_getDataImportLogs, this.getDataImportLogs.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDataImport.APINAME_getDataImportFiles, this.getDataImportFiles.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDataImport.APINAME_getDataImportFile, this.getDataImportFile.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDataImport.APINAME_getDataImportColumnsFromFormatId, this.getDataImportColumnsFromFormatId.bind(this));
    }

    public async getDataImportHistorics(param: NumberParamVO): Promise<DataImportHistoricVO[]> {

        return await ModuleDAOServer.getInstance().selectAll<DataImportHistoricVO>(
            DataImportHistoricVO.API_TYPE_ID, 'WHERE t.data_import_format_id = $1 LIMIT 50;', [param.num]);
    }

    public async getDataImportHistoric(param: NumberParamVO): Promise<DataImportHistoricVO> {

        return await ModuleDAOServer.getInstance().selectOne<DataImportHistoricVO>(
            DataImportHistoricVO.API_TYPE_ID, 'WHERE t.id = $1;', [param.num]);
    }

    public async getDataImportLogs(param: NumberParamVO): Promise<DataImportLogVO[]> {

        return await ModuleDAOServer.getInstance().selectAll<DataImportLogVO>(
            DataImportLogVO.API_TYPE_ID, 'WHERE t.data_import_format_id = $1 LIMIT 50;', [param.num]);
    }

    public async getDataImportFiles(): Promise<DataImportFormatVO[]> {

        return await ModuleDAO.getInstance().getVos<DataImportFormatVO>(DataImportFormatVO.API_TYPE_ID);
    }

    public async getDataImportFile(param: StringParamVO): Promise<DataImportFormatVO> {

        return await ModuleDAOServer.getInstance().selectOne<DataImportFormatVO>(
            DataImportFormatVO.API_TYPE_ID, 'WHERE t.import_uid = $1', [param.text]);
    }

    public async getImportFormatsForApiTypeId(API_TYPE_ID: string): Promise<DataImportFormatVO[]> {

        return await ModuleDAOServer.getInstance().selectAll<DataImportFormatVO>(
            DataImportFormatVO.API_TYPE_ID, 'WHERE t.api_type_id = $1', [API_TYPE_ID]);
    }

    public async getDataImportColumnsFromFormatId(param: NumberParamVO): Promise<DataImportColumnVO[]> {

        return await ModuleDAOServer.getInstance().selectAll<DataImportColumnVO>(
            DataImportColumnVO.API_TYPE_ID, 'WHERE t.data_import_format_id = $1', [param.num]);
    }

    private async insertImportedDatasInDb(vos: IImportedData[], api_type_id: string, moduleTable: ModuleTable<any>): Promise<InsertOrDeleteQueryResult[]> {

        // Avant de remplir la base, on la vide.
        await ModuleDAOServer.getInstance().truncate(api_type_id);

        let insertVos: IImportedData[] = [];

        for (let i in vos) {
            let vo: IImportedData = vos[i];

            // let hasIncompatibleData: boolean = false;
            // for (const f in moduleTable.fields) {

            //     if (typeof vo[moduleTable.fields[f].field_id] != "undefined") {

            //         // On peut tester le format des datas suivant le type source et le type dest pour voir si c'est cohérent
            //         //  et mettre à jour hasIncompatibleData
            //     }
            // }

            insertVos.push(vo);
        }

        return ModuleDAO.getInstance().insertOrUpdateVOs(insertVos);
    }
}