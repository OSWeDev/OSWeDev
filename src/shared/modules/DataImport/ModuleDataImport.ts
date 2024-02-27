import { valuesIn } from 'lodash';
import AccessPolicyTools from '../../tools/AccessPolicyTools';
import UserVO from '../AccessPolicy/vos/UserVO';
import CacheInvalidationRulesVO from '../AjaxCache/vos/CacheInvalidationRulesVO';
import APIControllerWrapper from '../API/APIControllerWrapper';
import NumberParamVO, { NumberParamVOStatic } from '../API/vos/apis/NumberParamVO';
import StringParamVO, { StringParamVOStatic } from '../API/vos/apis/StringParamVO';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import DAOController from '../DAO/DAOController';
import ModuleDAO from '../DAO/ModuleDAO';
import APIStringAndVOParamVO, { APIStringAndVOParamVOStatic } from '../DAO/vos/APIStringAndVOParamVO';
import TimeSegment from '../DataRender/vos/TimeSegment';
import FileVO from '../File/vos/FileVO';
import IDistantVOBase from '../IDistantVOBase';
import Module from '../Module';
import ModuleTableVO from '../DAO/vos/ModuleTableVO';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import ModuleVO from '../ModuleVO';
import DefaultTranslationVO from '../Translation/vos/DefaultTranslationVO';
import VOsTypesManager from '../VO/manager/VOsTypesManager';
import DataImportColumnVO from './vos/DataImportColumnVO';
import DataImportErrorLogVO from './vos/DataImportErrorLogVO';
import DataImportFormatVO from './vos/DataImportFormatVO';
import DataImportHistoricVO from './vos/DataImportHistoricVO';
import DataImportLogVO from './vos/DataImportLogVO';
import { field_names } from '../../tools/ObjectHandler';
import IImportedData from './interfaces/IImportedData';

export default class ModuleDataImport extends Module {

    public static MODULE_NAME: string = 'DataImport';

    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleDataImport.MODULE_NAME;
    public static POLICY_LOGS_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleDataImport.MODULE_NAME + '.LOGS_ACCESS';
    public static POLICY_BO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleDataImport.MODULE_NAME + '.BO_ACCESS';
    public static POLICY_BO_FULL_MENU_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleDataImport.MODULE_NAME + '.BO_FULL_MENU_ACCESS';

    public static PARAM_CAN_RETRY_FAILED: string = ModuleDataImport.MODULE_NAME + '.CAN_RETRY_FAILED';

    public static IMPORT_SCHEMA: string = 'imports';

    public static APINAME_reimportdih: string = 'reimportdih';
    public static APINAME_getDataImportHistorics: string = 'getDataImportHistorics';
    public static APINAME_getDataImportHistoric: string = 'getDataImportHistoric';
    public static APINAME_getDataImportLogs: string = 'getDataImportLogs';
    public static APINAME_getDataImportFiles: string = 'getDataImportFiles';
    public static APINAME_getDataImportFile: string = 'getDataImportFile';
    public static APINAME_importJSON: string = 'importJSON';
    public static APINAME_getDataImportColumnsFromFormatId: string = 'getDataImportColumnsFromFormatId';

    public static IMPORTATION_STATE_NAMES: string[] = [
        "import.state.uploaded",
        "import.state.formatting",
        "import.state.formatted",
        "import.state.ready_to_import",
        "import.state.importing",
        "import.state.imported",
        "import.state.posttreating",
        "import.state.posttreated",
        "import.state.importation_not_allowed",
        "import.state.failed_importation",
        "import.state.failed_posttreatment",
        "import.state.needs_reimport"];
    public static IMPORTATION_STATE_UPLOADED: number = 0;
    public static IMPORTATION_STATE_FORMATTING: number = 1;
    public static IMPORTATION_STATE_FORMATTED: number = 2;
    public static IMPORTATION_STATE_READY_TO_IMPORT: number = 3;
    public static IMPORTATION_STATE_IMPORTING: number = 4;
    public static IMPORTATION_STATE_IMPORTED: number = 5;
    public static IMPORTATION_STATE_POSTTREATING: number = 6;
    public static IMPORTATION_STATE_POSTTREATED: number = 7;
    public static IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED: number = 8;
    public static IMPORTATION_STATE_FAILED_IMPORTATION: number = 9;
    public static IMPORTATION_STATE_FAILED_POSTTREATMENT: number = 10;
    public static IMPORTATION_STATE_NEEDS_REIMPORT: number = 11;


    public static IMPORT_TABLE_PREFIX: string = '_i_';

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleDataImport {
        if (!ModuleDataImport.instance) {
            ModuleDataImport.instance = new ModuleDataImport();
        }
        return ModuleDataImport.instance;
    }

    private static instance: ModuleDataImport = null;

    public reimportdih: (dih: DataImportHistoricVO) => Promise<void> = APIControllerWrapper.sah(ModuleDataImport.APINAME_reimportdih);
    public getDataImportHistorics: (data_import_format_id: number) => Promise<DataImportHistoricVO[]> = APIControllerWrapper.sah(ModuleDataImport.APINAME_getDataImportHistorics);
    public getDataImportHistoric: (historic_id: number) => Promise<DataImportHistoricVO> = APIControllerWrapper.sah(ModuleDataImport.APINAME_getDataImportHistoric);
    public getDataImportLogs: (data_import_format_id: number) => Promise<DataImportLogVO[]> = APIControllerWrapper.sah(ModuleDataImport.APINAME_getDataImportLogs);
    public getDataImportFiles: () => Promise<DataImportFormatVO[]> = APIControllerWrapper.sah(ModuleDataImport.APINAME_getDataImportFiles);

    /**
     * N'utiliser que dans le cadre de l'init des formats de type d'import, on preload un cache et on le maintien pas à jour donc si on veut des données à jour => query
     */
    public getDataImportFile: (import_uid: string) => Promise<DataImportFormatVO> = APIControllerWrapper.sah(ModuleDataImport.APINAME_getDataImportFile);
    public importJSON: (import_json: string, import_on_vo: IDistantVOBase) => Promise<IDistantVOBase[]> = APIControllerWrapper.sah(ModuleDataImport.APINAME_importJSON);
    public getDataImportColumnsFromFormatId: (data_import_format_id: number) => Promise<DataImportColumnVO[]> = APIControllerWrapper.sah(ModuleDataImport.APINAME_getDataImportColumnsFromFormatId);

    private constructor() {

        super("data_import", ModuleDataImport.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public registerApis() {

        APIControllerWrapper.registerApi(new PostAPIDefinition<DataImportHistoricVO, void>(
            DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, DataImportHistoricVO.API_TYPE_ID),
            ModuleDataImport.APINAME_reimportdih,
            [DataImportHistoricVO.API_TYPE_ID]
        ));
        APIControllerWrapper.registerApi(new GetAPIDefinition<NumberParamVO, DataImportHistoricVO[]>(
            DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, DataImportHistoricVO.API_TYPE_ID),
            ModuleDataImport.APINAME_getDataImportHistorics,
            CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED,
            NumberParamVOStatic
        ));
        APIControllerWrapper.registerApi(new GetAPIDefinition<NumberParamVO, DataImportHistoricVO>(
            DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, DataImportHistoricVO.API_TYPE_ID),
            ModuleDataImport.APINAME_getDataImportHistoric,
            CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED,
            NumberParamVOStatic
        ));
        APIControllerWrapper.registerApi(new PostAPIDefinition<APIStringAndVOParamVO, IDistantVOBase[]>(
            DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, DataImportHistoricVO.API_TYPE_ID),
            ModuleDataImport.APINAME_importJSON,
            (value: APIStringAndVOParamVO) => {
                const res: string[] = [DataImportHistoricVO.API_TYPE_ID];

                if (value && value.vo && value.vo._type) {
                    res.push(value.vo._type);
                }

                if (value && value.text) {
                    try {
                        const vos = JSON.parse(value.text);
                        for (const i in vos) {
                            const vo = vos[i];

                            if (vo && vo._type) {
                                res.push(vo._type);
                            }
                        }
                    } catch (error) {
                    }
                }

                return res;
            },
            APIStringAndVOParamVOStatic
        ));
        APIControllerWrapper.registerApi(new GetAPIDefinition<NumberParamVO, DataImportLogVO[]>(
            DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, DataImportLogVO.API_TYPE_ID),
            ModuleDataImport.APINAME_getDataImportLogs,
            CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED,
            NumberParamVOStatic
        ));
        APIControllerWrapper.registerApi(new GetAPIDefinition<void, DataImportFormatVO[]>(
            DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, DataImportFormatVO.API_TYPE_ID),
            ModuleDataImport.APINAME_getDataImportFiles,
            [DataImportFormatVO.API_TYPE_ID]
        ));
        APIControllerWrapper.registerApi(new GetAPIDefinition<StringParamVO, DataImportFormatVO>(
            DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, DataImportFormatVO.API_TYPE_ID),
            ModuleDataImport.APINAME_getDataImportFile,
            [DataImportFormatVO.API_TYPE_ID],
            StringParamVOStatic
        ));
        APIControllerWrapper.registerApi(new GetAPIDefinition<NumberParamVO, DataImportColumnVO[]>(
            DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, DataImportColumnVO.API_TYPE_ID),
            ModuleDataImport.APINAME_getDataImportColumnsFromFormatId,
            [DataImportColumnVO.API_TYPE_ID],
            NumberParamVOStatic
        ));
    }

    public getTableSuffix(dataImportFile: DataImportFormatVO): string {

        return dataImportFile.import_uid.replace(/[^a-zA-Z_]/g, '_');
    }

    public registerImportableModuleTable(targetModuleTable: ModuleTableVO) {

        targetModuleTable.defineAsImportable();

        // On crée le moduletable adapté, et on stocke l'info de l'existence de ce type importable
        const fields: ModuleTableFieldVO[] = [];

        for (const i in targetModuleTable.get_fields()) {
            const vofield = targetModuleTable.get_fields()[i];

            fields.push(Object.assign(ModuleTableFieldController.create_new(targetModuleTable.vo_type, vofield.field_id, vofield.field_type, vofield.field_label, vofield.field_required, vofield.has_default, vofield.field_default_value?.value), vofield));
        }

        const field_historic_id = ModuleTableFieldController.create_new(targetModuleTable.vo_type, field_names<IImportedData>().historic_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, "Historique", false);
        fields.unshift(ModuleTableFieldController.create_new(targetModuleTable.vo_type, field_names<IImportedData>().not_validated_msg, ModuleTableFieldVO.FIELD_TYPE_string, "Msg validation", false));
        fields.unshift(ModuleTableFieldController.create_new(targetModuleTable.vo_type, field_names<IImportedData>().imported_line_number, ModuleTableFieldVO.FIELD_TYPE_int, "N° de la ligne", false));
        fields.unshift(ModuleTableFieldController.create_new(targetModuleTable.vo_type, field_names<IImportedData>().importation_state, ModuleTableFieldVO.FIELD_TYPE_enum, "Status", true, true, 0).setEnumValues({
            [ModuleDataImport.IMPORTATION_STATE_UPLOADED]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_UPLOADED],
            [ModuleDataImport.IMPORTATION_STATE_FORMATTING]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_FORMATTING],
            [ModuleDataImport.IMPORTATION_STATE_FORMATTED]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_FORMATTED],
            [ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT],
            [ModuleDataImport.IMPORTATION_STATE_IMPORTING]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_IMPORTING],
            [ModuleDataImport.IMPORTATION_STATE_IMPORTED]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_IMPORTED],
            [ModuleDataImport.IMPORTATION_STATE_POSTTREATING]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_POSTTREATING],
            [ModuleDataImport.IMPORTATION_STATE_POSTTREATED]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_POSTTREATED],
            [ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED],
            [ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION],
            [ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT],
            [ModuleDataImport.IMPORTATION_STATE_NEEDS_REIMPORT]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_NEEDS_REIMPORT],
        }));
        fields.push(ModuleTableFieldController.create_new(targetModuleTable.vo_type, field_names<IImportedData>().creation_date, ModuleTableFieldVO.FIELD_TYPE_tstz, "Date de création", false).set_segmentation_type(TimeSegment.TYPE_MINUTE));
        fields.push(ModuleTableFieldController.create_new(targetModuleTable.vo_type, field_names<IImportedData>().not_imported_msg, ModuleTableFieldVO.FIELD_TYPE_string, "Msg import", false));
        fields.push(ModuleTableFieldController.create_new(targetModuleTable.vo_type, field_names<IImportedData>().not_posttreated_msg, ModuleTableFieldVO.FIELD_TYPE_string, "Msg post-traitement", false));
        fields.unshift(field_historic_id);
        const importTable: ModuleTableVO = new ModuleTableVO(
            targetModuleTable.module_name,
            ModuleDataImport.IMPORT_TABLE_PREFIX + targetModuleTable.vo_type,
            () => ({} as any), fields, null, "Import " + targetModuleTable.name);
        importTable.set_bdd_ref(ModuleDataImport.IMPORT_SCHEMA, ModuleDataImport.IMPORT_TABLE_PREFIX + targetModuleTable.vo_type);
        field_historic_id.set_many_to_one_target_moduletable_name(DataImportHistoricVO.API_TYPE_ID);
        targetModuleTable.module.datatables.push(importTable);
        targetModuleTable.importable = true;
    }

    public getRawImportedDatasAPI_Type_Id(target_vo_api_type_id: string): string {
        return ModuleDataImport.IMPORT_TABLE_PREFIX + target_vo_api_type_id;
    }

    public initialize() {
        // Création de la table dataimportfile
        let field_file_id: ModuleTableFieldVO = ModuleTableFieldController.create_new(DataImportFormatVO.API_TYPE_ID, field_names<DataImportFormatVO>().file_id, ModuleTableFieldVO.FIELD_TYPE_file_ref, 'Fichier importé', false).not_add_to_crud();
        const field_post_exec_module_id: ModuleTableFieldVO = ModuleTableFieldController.create_new(DataImportFormatVO.API_TYPE_ID, field_names<DataImportFormatVO>().post_exec_module_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Module de post-traitement', false);
        let label_field = ModuleTableFieldController.create_new(DataImportFormatVO.API_TYPE_ID, field_names<DataImportFormatVO>().import_uid, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom du fichier d\'import', true);
        let datatable_fields = [
            field_file_id,
            label_field,
            ModuleTableFieldController.create_new(DataImportFormatVO.API_TYPE_ID, field_names<DataImportFormatVO>().type, ModuleTableFieldVO.FIELD_TYPE_enum, 'Type d\'import (XLS, XLSX, CSV)', true).setEnumValues({
                [DataImportFormatVO.TYPE_XLS]: DataImportFormatVO.TYPE_LABELS[DataImportFormatVO.TYPE_XLS],
                [DataImportFormatVO.TYPE_XLSX]: DataImportFormatVO.TYPE_LABELS[DataImportFormatVO.TYPE_XLSX],
                [DataImportFormatVO.TYPE_CSV]: DataImportFormatVO.TYPE_LABELS[DataImportFormatVO.TYPE_CSV],
                [DataImportFormatVO.TYPE_XML]: DataImportFormatVO.TYPE_LABELS[DataImportFormatVO.TYPE_XML],
            }),
            ModuleTableFieldController.create_new(DataImportFormatVO.API_TYPE_ID, field_names<DataImportFormatVO>().encoding, ModuleTableFieldVO.FIELD_TYPE_enum, 'Encodage', false).setEnumValues({
                [DataImportFormatVO.TYPE_UTF8]: DataImportFormatVO.TYPE_ENCODING_LABELS[DataImportFormatVO.TYPE_UTF8],
                [DataImportFormatVO.TYPE_WINDOWS1252]: DataImportFormatVO.TYPE_ENCODING_LABELS[DataImportFormatVO.TYPE_WINDOWS1252],
            }),
            ModuleTableFieldController.create_new(DataImportFormatVO.API_TYPE_ID, field_names<DataImportFormatVO>().sheet_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom de l\'onglet (XLS, XLSX)', false, true, ""),
            ModuleTableFieldController.create_new(DataImportFormatVO.API_TYPE_ID, field_names<DataImportFormatVO>().sheet_index, ModuleTableFieldVO.FIELD_TYPE_int, 'Index de l\'onglet (XLS, XLSX) si nom indisponible', false, true, 0),
            ModuleTableFieldController.create_new(DataImportFormatVO.API_TYPE_ID, field_names<DataImportFormatVO>().first_row_index, ModuleTableFieldVO.FIELD_TYPE_int, 'Index de la première ligne (1ère ligne = 0)', true),
            ModuleTableFieldController.create_new(DataImportFormatVO.API_TYPE_ID, field_names<DataImportFormatVO>().api_type_id, ModuleTableFieldVO.FIELD_TYPE_string, 'API_TYPE_ID associé', true),
            ModuleTableFieldController.create_new(DataImportFormatVO.API_TYPE_ID, field_names<DataImportFormatVO>().copy_folder, ModuleTableFieldVO.FIELD_TYPE_string, 'Répertoire d\'archivage', true),
            ModuleTableFieldController.create_new(DataImportFormatVO.API_TYPE_ID, field_names<DataImportFormatVO>().type_sheet_position, ModuleTableFieldVO.FIELD_TYPE_enum, 'Type de positionnement de l\'onglet', true, true, DataImportFormatVO.TYPE_SHEET_POSITION_INDEX).setEnumValues({
                [DataImportFormatVO.TYPE_SHEET_POSITION_LABEL]: DataImportFormatVO.TYPE_SHEET_POSITION_LABELS[DataImportFormatVO.TYPE_SHEET_POSITION_LABEL],
                [DataImportFormatVO.TYPE_SHEET_POSITION_INDEX]: DataImportFormatVO.TYPE_SHEET_POSITION_LABELS[DataImportFormatVO.TYPE_SHEET_POSITION_INDEX],
                [DataImportFormatVO.TYPE_SHEET_POSITION_SCAN]: DataImportFormatVO.TYPE_SHEET_POSITION_LABELS[DataImportFormatVO.TYPE_SHEET_POSITION_SCAN]
            }),
            ModuleTableFieldController.create_new(DataImportFormatVO.API_TYPE_ID, field_names<DataImportFormatVO>().type_column_position, ModuleTableFieldVO.FIELD_TYPE_enum, 'Type de positionnement des colonnes', true, true, DataImportFormatVO.TYPE_COLUMN_POSITION_INDEX).setEnumValues({
                [DataImportFormatVO.TYPE_COLUMN_POSITION_LABEL]: DataImportFormatVO.TYPE_COLUMN_POSITION_LABELS[DataImportFormatVO.TYPE_COLUMN_POSITION_LABEL],
                [DataImportFormatVO.TYPE_COLUMN_POSITION_INDEX]: DataImportFormatVO.TYPE_COLUMN_POSITION_LABELS[DataImportFormatVO.TYPE_COLUMN_POSITION_INDEX]
            }),
            ModuleTableFieldController.create_new(DataImportFormatVO.API_TYPE_ID, field_names<DataImportFormatVO>().column_labels_row_index, ModuleTableFieldVO.FIELD_TYPE_int, 'Index de la ligne des titres de colonne (1ère ligne = 0)', false),

            field_post_exec_module_id,
            ModuleTableFieldController.create_new(DataImportFormatVO.API_TYPE_ID, field_names<DataImportFormatVO>().batch_import, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Import par segments', true, true, false),
            ModuleTableFieldController.create_new(DataImportFormatVO.API_TYPE_ID, field_names<DataImportFormatVO>().batch_size, ModuleTableFieldVO.FIELD_TYPE_int, 'Taille d\'un segment (si import par segment)', true, true, 10000),
            ModuleTableFieldController.create_new(DataImportFormatVO.API_TYPE_ID, field_names<DataImportFormatVO>().use_multiple_connections, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Insertions en //', true, true, true),
            ModuleTableFieldController.create_new(DataImportFormatVO.API_TYPE_ID, field_names<DataImportFormatVO>().save_error_logs, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Sauvegarde des logs d\'erreur'),
        ];
        const datatable_desc = new ModuleTableVO(this, DataImportFormatVO.API_TYPE_ID, () => new DataImportFormatVO(), datatable_fields, label_field, "Fichiers d'import");
        field_file_id.donotCascadeOnDelete();
        field_file_id.set_many_to_one_target_moduletable_name(FileVO.API_TYPE_ID);
        field_post_exec_module_id.set_many_to_one_target_moduletable_name(ModuleVO.API_TYPE_ID);
        this.datatables.push(datatable_desc);

        // Création de la table dataimportcolumn
        label_field = ModuleTableFieldController.create_new(DataImportColumnVO.API_TYPE_ID, field_names<DataImportColumnVO>().title, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom de la colonne (Fichier)', true);
        let field_data_import_format_id: ModuleTableFieldVO = ModuleTableFieldController.create_new(DataImportColumnVO.API_TYPE_ID, field_names<DataImportColumnVO>().data_import_format_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Format d\'import', true, true, 0);
        datatable_fields = [
            field_data_import_format_id,
            ModuleTableFieldController.create_new(DataImportColumnVO.API_TYPE_ID, field_names<DataImportColumnVO>().column_index, ModuleTableFieldVO.FIELD_TYPE_int, 'Index de la colonne (1ère colonne = 0)', false),
            label_field,
            ModuleTableFieldController.create_new(DataImportColumnVO.API_TYPE_ID, field_names<DataImportColumnVO>().type, ModuleTableFieldVO.FIELD_TYPE_string, 'Type de donnée', true),
            ModuleTableFieldController.create_new(DataImportColumnVO.API_TYPE_ID, field_names<DataImportColumnVO>().mandatory, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Obligatoire', true, true, false),
            ModuleTableFieldController.create_new(DataImportColumnVO.API_TYPE_ID, field_names<DataImportColumnVO>().vo_field_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom de la colonne (Vo)', true),
            ModuleTableFieldController.create_new(DataImportColumnVO.API_TYPE_ID, field_names<DataImportColumnVO>().other_column_labels, ModuleTableFieldVO.FIELD_TYPE_string_array, 'Autres noms possibles (Fichier)', false)
        ];
        const dt2 = new ModuleTableVO(this, DataImportColumnVO.API_TYPE_ID, () => new DataImportColumnVO(), datatable_fields, label_field, "Colonnes importées");
        field_data_import_format_id.set_many_to_one_target_moduletable_name(DataImportFormatVO.API_TYPE_ID);
        this.datatables.push(dt2);

        label_field = ModuleTableFieldController.create_new(DataImportHistoricVO.API_TYPE_ID, field_names<DataImportHistoricVO>().historic_uid, ModuleTableFieldVO.FIELD_TYPE_string, 'ID unique', false);
        field_data_import_format_id = ModuleTableFieldController.create_new(DataImportHistoricVO.API_TYPE_ID, field_names<DataImportHistoricVO>().data_import_format_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Format d\'import', false);
        const field_user_id = ModuleTableFieldController.create_new(DataImportHistoricVO.API_TYPE_ID, field_names<DataImportHistoricVO>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Auteur', false);
        field_file_id = ModuleTableFieldController.create_new(DataImportHistoricVO.API_TYPE_ID, field_names<DataImportHistoricVO>().file_id, ModuleTableFieldVO.FIELD_TYPE_file_ref, 'Fichier importé', false).not_add_to_crud();
        const reimport_of_dih_id = ModuleTableFieldController.create_new(DataImportHistoricVO.API_TYPE_ID, field_names<DataImportHistoricVO>().reimport_of_dih_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Réimport de ...', false);
        datatable_fields = [
            field_data_import_format_id,
            field_file_id,
            field_user_id,
            ModuleTableFieldController.create_new(DataImportHistoricVO.API_TYPE_ID, field_names<DataImportHistoricVO>().state, ModuleTableFieldVO.FIELD_TYPE_enum, 'Etat de l\'import', true).setEnumValues({
                [ModuleDataImport.IMPORTATION_STATE_UPLOADED]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_UPLOADED],
                [ModuleDataImport.IMPORTATION_STATE_FORMATTING]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_FORMATTING],
                [ModuleDataImport.IMPORTATION_STATE_FORMATTED]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_FORMATTED],
                [ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT],
                [ModuleDataImport.IMPORTATION_STATE_IMPORTING]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_IMPORTING],
                [ModuleDataImport.IMPORTATION_STATE_IMPORTED]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_IMPORTED],
                [ModuleDataImport.IMPORTATION_STATE_POSTTREATING]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_POSTTREATING],
                [ModuleDataImport.IMPORTATION_STATE_POSTTREATED]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_POSTTREATED],
                [ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED],
                [ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION],
                [ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT],
                [ModuleDataImport.IMPORTATION_STATE_NEEDS_REIMPORT]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_NEEDS_REIMPORT]
            }),
            reimport_of_dih_id,
            ModuleTableFieldController.create_new(DataImportHistoricVO.API_TYPE_ID, field_names<DataImportHistoricVO>().status_before_reimport, ModuleTableFieldVO.FIELD_TYPE_enum, 'Sauvegarde de l\'état pour réimport', false).setEnumValues({
                [ModuleDataImport.IMPORTATION_STATE_UPLOADED]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_UPLOADED],
                [ModuleDataImport.IMPORTATION_STATE_FORMATTING]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_FORMATTING],
                [ModuleDataImport.IMPORTATION_STATE_FORMATTED]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_FORMATTED],
                [ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT],
                [ModuleDataImport.IMPORTATION_STATE_IMPORTING]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_IMPORTING],
                [ModuleDataImport.IMPORTATION_STATE_IMPORTED]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_IMPORTED],
                [ModuleDataImport.IMPORTATION_STATE_POSTTREATING]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_POSTTREATING],
                [ModuleDataImport.IMPORTATION_STATE_POSTTREATED]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_POSTTREATED],
                [ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED],
                [ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION],
                [ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT],
                [ModuleDataImport.IMPORTATION_STATE_NEEDS_REIMPORT]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_NEEDS_REIMPORT]
            }),
            ModuleTableFieldController.create_new(DataImportHistoricVO.API_TYPE_ID, field_names<DataImportHistoricVO>().status_of_last_reimport, ModuleTableFieldVO.FIELD_TYPE_enum, 'Etat du réimport le plus récent', false).setEnumValues({
                [ModuleDataImport.IMPORTATION_STATE_UPLOADED]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_UPLOADED],
                [ModuleDataImport.IMPORTATION_STATE_FORMATTING]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_FORMATTING],
                [ModuleDataImport.IMPORTATION_STATE_FORMATTED]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_FORMATTED],
                [ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT],
                [ModuleDataImport.IMPORTATION_STATE_IMPORTING]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_IMPORTING],
                [ModuleDataImport.IMPORTATION_STATE_IMPORTED]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_IMPORTED],
                [ModuleDataImport.IMPORTATION_STATE_POSTTREATING]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_POSTTREATING],
                [ModuleDataImport.IMPORTATION_STATE_POSTTREATED]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_POSTTREATED],
                [ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED],
                [ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION],
                [ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT],
                [ModuleDataImport.IMPORTATION_STATE_NEEDS_REIMPORT]: ModuleDataImport.IMPORTATION_STATE_NAMES[ModuleDataImport.IMPORTATION_STATE_NEEDS_REIMPORT]
            }),

            label_field,
            ModuleTableFieldController.create_new(DataImportHistoricVO.API_TYPE_ID, field_names<DataImportHistoricVO>().start_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de démarrage', false).set_segmentation_type(TimeSegment.TYPE_MINUTE),
            ModuleTableFieldController.create_new(DataImportHistoricVO.API_TYPE_ID, field_names<DataImportHistoricVO>().segment_date_index, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Segment cible', false),
            ModuleTableFieldController.create_new(DataImportHistoricVO.API_TYPE_ID, field_names<DataImportHistoricVO>().segment_type, ModuleTableFieldVO.FIELD_TYPE_enum, 'Type de segment', false).setEnumValues({
                [TimeSegment.TYPE_YEAR]: TimeSegment.TYPE_NAMES[TimeSegment.TYPE_YEAR],
                [TimeSegment.TYPE_MONTH]: TimeSegment.TYPE_NAMES[TimeSegment.TYPE_MONTH],
                [TimeSegment.TYPE_DAY]: TimeSegment.TYPE_NAMES[TimeSegment.TYPE_DAY],
                [TimeSegment.TYPE_WEEK]: TimeSegment.TYPE_NAMES[TimeSegment.TYPE_WEEK],
                [TimeSegment.TYPE_ROLLING_YEAR_MONTH_START]: TimeSegment.TYPE_NAMES[TimeSegment.TYPE_ROLLING_YEAR_MONTH_START],
            }),
            ModuleTableFieldController.create_new(DataImportHistoricVO.API_TYPE_ID, field_names<DataImportHistoricVO>().last_up_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Modification', false).set_segmentation_type(TimeSegment.TYPE_MINUTE).index(),
            ModuleTableFieldController.create_new(DataImportHistoricVO.API_TYPE_ID, field_names<DataImportHistoricVO>().end_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de fin', false).set_segmentation_type(TimeSegment.TYPE_MINUTE),
            ModuleTableFieldController.create_new(DataImportHistoricVO.API_TYPE_ID, field_names<DataImportHistoricVO>().weight, ModuleTableFieldVO.FIELD_TYPE_int, 'Poids', true, true, 0),
            ModuleTableFieldController.create_new(DataImportHistoricVO.API_TYPE_ID, field_names<DataImportHistoricVO>().params, ModuleTableFieldVO.FIELD_TYPE_string, 'Paramètres', false),
            ModuleTableFieldController.create_new(DataImportHistoricVO.API_TYPE_ID, field_names<DataImportHistoricVO>().api_type_id, ModuleTableFieldVO.FIELD_TYPE_string, 'Vo importé', false),
            ModuleTableFieldController.create_new(DataImportHistoricVO.API_TYPE_ID, field_names<DataImportHistoricVO>().import_type, ModuleTableFieldVO.FIELD_TYPE_enum, 'Type d\'import', true).setEnumValues({
                [DataImportHistoricVO.IMPORT_TYPE_EDIT]: DataImportHistoricVO.IMPORT_TYPE_NAMES[DataImportHistoricVO.IMPORT_TYPE_EDIT],
                [DataImportHistoricVO.IMPORT_TYPE_REPLACE]: DataImportHistoricVO.IMPORT_TYPE_NAMES[DataImportHistoricVO.IMPORT_TYPE_REPLACE],
            }),
            ModuleTableFieldController.create_new(DataImportHistoricVO.API_TYPE_ID, field_names<DataImportHistoricVO>().nb_row_validated, ModuleTableFieldVO.FIELD_TYPE_int, DefaultTranslationVO.create_new({
                'fr-fr': 'Nb. de lignes validées'
            }), false),
            ModuleTableFieldController.create_new(DataImportHistoricVO.API_TYPE_ID, field_names<DataImportHistoricVO>().nb_row_unvalidated, ModuleTableFieldVO.FIELD_TYPE_int, 'Nb. de lignes invalidées', false),
            ModuleTableFieldController.create_new(DataImportHistoricVO.API_TYPE_ID, field_names<DataImportHistoricVO>().autovalidate, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Validation automatique', false, true, false),
            ModuleTableFieldController.create_new(DataImportHistoricVO.API_TYPE_ID, field_names<DataImportHistoricVO>().use_fast_track, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Fast Track', true, true, false),
        ];
        const datatable_historic = new ModuleTableVO(this, DataImportHistoricVO.API_TYPE_ID, () => new DataImportHistoricVO(), datatable_fields, label_field, "Historiques d'importation").hideAnyToManyByDefault();
        field_data_import_format_id.set_many_to_one_target_moduletable_name(datatable_desc.vo_type);
        field_user_id.donotCascadeOnDelete();
        field_user_id.set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);
        reimport_of_dih_id.set_many_to_one_target_moduletable_name(datatable_historic.vo_type);
        field_file_id.set_many_to_one_target_moduletable_name(FileVO.API_TYPE_ID);
        this.datatables.push(datatable_historic);


        label_field = ModuleTableFieldController.create_new(DataImportLogVO.API_TYPE_ID, field_names<DataImportLogVO>().date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date', false).set_segmentation_type(TimeSegment.TYPE_MINUTE);
        field_data_import_format_id = ModuleTableFieldController.create_new(DataImportLogVO.API_TYPE_ID, field_names<DataImportLogVO>().data_import_format_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Format d\'import', false);
        const field_data_import_historic_id = ModuleTableFieldController.create_new(DataImportLogVO.API_TYPE_ID, field_names<DataImportLogVO>().data_import_historic_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Historique', false);
        datatable_fields = [
            field_data_import_format_id,
            field_data_import_historic_id,
            label_field,
            ModuleTableFieldController.create_new(DataImportLogVO.API_TYPE_ID, field_names<DataImportLogVO>().api_type_id, ModuleTableFieldVO.FIELD_TYPE_string, 'VO cible', false),
            ModuleTableFieldController.create_new(DataImportLogVO.API_TYPE_ID, field_names<DataImportLogVO>().code_text, ModuleTableFieldVO.FIELD_TYPE_string, 'Message (traduit)', false),
            ModuleTableFieldController.create_new(DataImportLogVO.API_TYPE_ID, field_names<DataImportLogVO>().message, ModuleTableFieldVO.FIELD_TYPE_string, 'Message (statique)', false),
            ModuleTableFieldController.create_new(DataImportLogVO.API_TYPE_ID, field_names<DataImportLogVO>().log_level, ModuleTableFieldVO.FIELD_TYPE_enum, 'Type', true, true, DataImportLogVO.LOG_LEVEL_INFO).setEnumValues({
                [DataImportLogVO.LOG_LEVEL_DEBUG]: DataImportLogVO.LOG_LEVEL_LABELS[DataImportLogVO.LOG_LEVEL_DEBUG],
                [DataImportLogVO.LOG_LEVEL_INFO]: DataImportLogVO.LOG_LEVEL_LABELS[DataImportLogVO.LOG_LEVEL_INFO],
                [DataImportLogVO.LOG_LEVEL_SUCCESS]: DataImportLogVO.LOG_LEVEL_LABELS[DataImportLogVO.LOG_LEVEL_SUCCESS],
                [DataImportLogVO.LOG_LEVEL_WARN]: DataImportLogVO.LOG_LEVEL_LABELS[DataImportLogVO.LOG_LEVEL_WARN],
                [DataImportLogVO.LOG_LEVEL_ERROR]: DataImportLogVO.LOG_LEVEL_LABELS[DataImportLogVO.LOG_LEVEL_ERROR],
                [DataImportLogVO.LOG_LEVEL_FATAL]: DataImportLogVO.LOG_LEVEL_LABELS[DataImportLogVO.LOG_LEVEL_FATAL],
            })
        ];
        const datatable_log = new ModuleTableVO(this, DataImportLogVO.API_TYPE_ID, () => new DataImportLogVO(), datatable_fields, label_field, "Logs d'importation").hideAnyToManyByDefault();
        field_data_import_format_id.set_many_to_one_target_moduletable_name(datatable_desc.vo_type);
        field_data_import_historic_id.set_many_to_one_target_moduletable_name(datatable_historic.vo_type);
        this.datatables.push(datatable_log);

        //Création de la table dataimporterrorlogs
        label_field = ModuleTableFieldController.create_new(DataImportErrorLogVO.API_TYPE_ID, field_names<DataImportErrorLogVO>().msg_import, ModuleTableFieldVO.FIELD_TYPE_string, 'Message d\'import', true);
        const field_dih_id = ModuleTableFieldController.create_new(DataImportErrorLogVO.API_TYPE_ID, field_names<DataImportErrorLogVO>().dih_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Historique', true);
        datatable_fields = [
            label_field,
            field_dih_id
        ];
        const data_error_log = new ModuleTableVO(this, DataImportErrorLogVO.API_TYPE_ID, () => new DataImportErrorLogVO(), datatable_fields, label_field, "Logs d'erreur d'importation").hideAnyToManyByDefault();
        field_dih_id.set_many_to_one_target_moduletable_name(datatable_historic.vo_type);
        this.datatables.push(data_error_log);
    }
}