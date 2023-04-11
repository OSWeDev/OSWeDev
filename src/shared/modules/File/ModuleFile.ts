import AccessPolicyTools from '../../tools/AccessPolicyTools';
import ModuleAccessPolicy from '../AccessPolicy/ModuleAccessPolicy';
import APIControllerWrapper from '../API/APIControllerWrapper';
import NumberParamVO, { NumberParamVOStatic } from '../API/vos/apis/NumberParamVO';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
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
        this.fields = [];
        this.datatables = [];

        this.initializeFileVO();
        this.initializeArchiveFilesConfVO();
    }

    public initializeFileVO() {
        let label_field = new ModuleTableField('path', ModuleTableField.FIELD_TYPE_file_field, 'Fichier', false);

        let datatable_fields = [
            label_field,
            new ModuleTableField('is_secured', ModuleTableField.FIELD_TYPE_boolean, 'Fichier sécurisé', true, true, false),
            new ModuleTableField('file_access_policy_name', ModuleTableField.FIELD_TYPE_string, 'Nom du droit nécessaire si sécurisé', false),
        ];

        let datatable = new ModuleTable(this, FileVO.API_TYPE_ID, () => new FileVO(), datatable_fields, label_field, "Fichiers");
        this.datatables.push(datatable);
    }

    public initializeArchiveFilesConfVO() {
        let label_field = new ModuleTableField("path_to_check", ModuleTableField.FIELD_TYPE_string, 'Répertoire', true).unique();
        let datatable_fields = [
            label_field,
            new ModuleTableField('filter_type', ModuleTableField.FIELD_TYPE_enum, 'Type de filtre', true, true, ArchiveFilesConfVO.FILTER_TYPE_MONTH).setEnumValues(ArchiveFilesConfVO.FILTER_TYPE_LABELS),
            new ModuleTableField("target_achive_folder", ModuleTableField.FIELD_TYPE_file_field, 'Répertoire d\'archivage', true),
            new ModuleTableField("archive_delay_sec", ModuleTableField.FIELD_TYPE_file_field, 'Archiver au delà de ce délai', true, true, 30 * 24 * 60 * 60), // Defaults to 30 days
            new ModuleTableField("use_date_type", ModuleTableField.FIELD_TYPE_file_field, 'Répertoire d\'archivage', true, true, ArchiveFilesConfVO.USE_DATE_TYPE_CREATION),
        ];

        let datatable = new ModuleTable(this, ArchiveFilesConfVO.API_TYPE_ID, () => new ArchiveFilesConfVO(), datatable_fields, label_field, "Conf archivage des fichiers");

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