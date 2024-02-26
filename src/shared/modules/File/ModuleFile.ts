import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import ModuleAccessPolicy from '../AccessPolicy/ModuleAccessPolicy';
import APIControllerWrapper from '../API/APIControllerWrapper';
import NumberParamVO, { NumberParamVOStatic } from '../API/vos/apis/NumberParamVO';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import Module from '../Module';
import ModuleTableVO from '../ModuleTableVO';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../ModuleTableFieldVO';
import ArchiveFilesConfVO from './vos/ArchiveFilesConfVO';
import FileVO from './vos/FileVO';

export default class ModuleFile extends Module {

    public static MODULE_NAME: string = 'File';

    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleFile.MODULE_NAME;
    public static POLICY_BO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleFile.MODULE_NAME + '.BO_ACCESS';

    public static FILES_ROOT: string = './files/';
    public static SECURED_FILES_ROOT: string = './sfiles/';
    // public static TEMP_FILES_ROOT: string = './temp/';

    public static APINAME_TEST_FILE_EXISTENZ = "test_file_existenz";

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleFile {
        if (!ModuleFile.instance) {
            ModuleFile.instance = new ModuleFile();
        }
        return ModuleFile.instance;
    }

    private static instance: ModuleFile = null;

    public testFileExistenz: (filevo_id: number) => Promise<boolean> = APIControllerWrapper.sah(ModuleFile.APINAME_TEST_FILE_EXISTENZ);

    private constructor() {

        super("file", ModuleFile.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public initialize() {

        this.initializeFileVO();
        this.initializeArchiveFilesConfVO();
    }

    public initializeFileVO() {
        let label_field = ModuleTableFieldController.create_new(FileVO.API_TYPE_ID, field_names<FileVO>().path, ModuleTableFieldVO.FIELD_TYPE_file_field, 'Fichier', true).unique();

        let datatable_fields = [
            label_field,
            ModuleTableFieldController.create_new(FileVO.API_TYPE_ID, field_names<FileVO>().is_secured, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Fichier sécurisé', true, true, false),
            ModuleTableFieldController.create_new(FileVO.API_TYPE_ID, field_names<FileVO>().file_access_policy_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom du droit nécessaire si sécurisé', false),
        ];

        let datatable = new ModuleTableVO(this, FileVO.API_TYPE_ID, () => new FileVO(), datatable_fields, label_field, "Fichiers");
        this.datatables.push(datatable);
    }

    public initializeArchiveFilesConfVO() {
        let label_field = ModuleTableFieldController.create_new("path_to_check", ModuleTableFieldVO.FIELD_TYPE_string, 'Répertoire', true).unique();
        let datatable_fields = [
            label_field,
            ModuleTableFieldController.create_new(ArchiveFilesConfVO.API_TYPE_ID, field_names<ArchiveFilesConfVO>().filter_type, ModuleTableFieldVO.FIELD_TYPE_enum, 'Type de filtre', true, true, ArchiveFilesConfVO.FILTER_TYPE_MONTH).setEnumValues(ArchiveFilesConfVO.FILTER_TYPE_LABELS),
            ModuleTableFieldController.create_new("target_achive_folder", ModuleTableFieldVO.FIELD_TYPE_file_field, 'Répertoire d\'archivage', true),
            ModuleTableFieldController.create_new("archive_delay_sec", ModuleTableFieldVO.FIELD_TYPE_file_field, 'Archiver au delà de ce délai', true, true, 30 * 24 * 60 * 60), // Defaults to 30 days
            ModuleTableFieldController.create_new("use_date_type", ModuleTableFieldVO.FIELD_TYPE_file_field, 'Répertoire d\'archivage', true, true, ArchiveFilesConfVO.USE_DATE_TYPE_CREATION),
        ];

        let datatable = new ModuleTableVO(this, ArchiveFilesConfVO.API_TYPE_ID, () => new ArchiveFilesConfVO(), datatable_fields, label_field, "Conf archivage des fichiers");

        this.datatables.push(datatable);
    }

    public registerApis() {

        APIControllerWrapper.registerApi(new GetAPIDefinition<NumberParamVO, boolean>(
            ModuleAccessPolicy.POLICY_FO_ACCESS,
            ModuleFile.APINAME_TEST_FILE_EXISTENZ,
            [FileVO.API_TYPE_ID],
            NumberParamVOStatic
        ));
    }
}