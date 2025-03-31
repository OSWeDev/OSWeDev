import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import APIControllerWrapper from '../API/APIControllerWrapper';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import NumberParamVO, { NumberParamVOStatic } from '../API/vos/apis/NumberParamVO';
import ModuleAccessPolicy from '../AccessPolicy/ModuleAccessPolicy';
import ModuleTableController from '../DAO/ModuleTableController';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import TimeSegment from '../DataRender/vos/TimeSegment';
import Module from '../Module';
import VersionedVOController from '../Versioned/VersionedVOController';
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

    private static instance: ModuleFile = null;

    public testFileExistenz: (filevo_id: number) => Promise<boolean> = APIControllerWrapper.sah(ModuleFile.APINAME_TEST_FILE_EXISTENZ);

    private constructor() {

        super("file", ModuleFile.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleFile {
        if (!ModuleFile.instance) {
            ModuleFile.instance = new ModuleFile();
        }
        return ModuleFile.instance;
    }

    public initialize() {

        this.initializeFileVO();
        this.initializeArchiveFilesConfVO();
    }

    public initializeFileVO() {
        const label_field = ModuleTableFieldController.create_new(FileVO.API_TYPE_ID, field_names<FileVO>().path, ModuleTableFieldVO.FIELD_TYPE_file_field, 'Fichier', true).unique();

        ModuleTableFieldController.create_new(FileVO.API_TYPE_ID, field_names<FileVO>().is_secured, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Fichier sécurisé', true, true, false);
        ModuleTableFieldController.create_new(FileVO.API_TYPE_ID, field_names<FileVO>().file_access_policy_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom du droit nécessaire si sécurisé', false);

        ModuleTableFieldController.create_new(FileVO.API_TYPE_ID, field_names<FileVO>().is_archived, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Fichier archivé', true, true, false);
        ModuleTableFieldController.create_new(FileVO.API_TYPE_ID, field_names<FileVO>().archive_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date d\'archivage', false).set_segmentation_type(TimeSegment.TYPE_SECOND);
        ModuleTableFieldController.create_new(FileVO.API_TYPE_ID, field_names<FileVO>().archive_path, ModuleTableFieldVO.FIELD_TYPE_string, 'Chemin d\'archivage', false);

        ModuleTableFieldController.create_new(FileVO.API_TYPE_ID, field_names<FileVO>().archive_error_count, ModuleTableFieldVO.FIELD_TYPE_int, 'Nombre d\'erreurs d\'archivage', true, true, 0);
        ModuleTableFieldController.create_new(FileVO.API_TYPE_ID, field_names<FileVO>().archive_last_error, ModuleTableFieldVO.FIELD_TYPE_string, 'Dernière erreur d\'archivage', false);
        ModuleTableFieldController.create_new(FileVO.API_TYPE_ID, field_names<FileVO>().archive_last_error_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de la dernière erreur d\'archivage', false).set_segmentation_type(TimeSegment.TYPE_SECOND);

        ModuleTableController.create_new(this.name, FileVO, label_field, "Fichiers");
    }

    public initializeArchiveFilesConfVO() {
        const label_field = ModuleTableFieldController.create_new(ArchiveFilesConfVO.API_TYPE_ID, field_names<ArchiveFilesConfVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom', true).unique();
        ModuleTableFieldController.create_new(ArchiveFilesConfVO.API_TYPE_ID, field_names<ArchiveFilesConfVO>().name_trans, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom du répertoire /archives/', true).unique();
        ModuleTableFieldController.create_new(ArchiveFilesConfVO.API_TYPE_ID, field_names<ArchiveFilesConfVO>().activated, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Activée', true, true, true);
        ModuleTableFieldController.create_new(ArchiveFilesConfVO.API_TYPE_ID, field_names<ArchiveFilesConfVO>().add_name_trans_in_archive_path, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Ajouter le nom de la conf dans le chemin d\'archivage', true, true, false);
        ModuleTableFieldController.create_new(ArchiveFilesConfVO.API_TYPE_ID, field_names<ArchiveFilesConfVO>().paths_to_check, ModuleTableFieldVO.FIELD_TYPE_string_array, 'Répertoires à archiver', true);
        ModuleTableFieldController.create_new(ArchiveFilesConfVO.API_TYPE_ID, field_names<ArchiveFilesConfVO>().regexps_of_files_to_archive, ModuleTableFieldVO.FIELD_TYPE_string_array, 'REGEXP des fichiers à archiver', true);

        ModuleTableFieldController.create_new(ArchiveFilesConfVO.API_TYPE_ID, field_names<ArchiveFilesConfVO>().type_segment_delai_archivage, ModuleTableFieldVO.FIELD_TYPE_enum, 'Type de segment pour le délai', true, true, TimeSegment.TYPE_MONTH).setEnumValues(TimeSegment.TYPE_NAMES_ENUM);
        ModuleTableFieldController.create_new(ArchiveFilesConfVO.API_TYPE_ID, field_names<ArchiveFilesConfVO>().nb_segment_delai_archivage, ModuleTableFieldVO.FIELD_TYPE_int, 'Nombre de segments pour le délai', true, true, 12); // par défaut au delà de 1 an on archive
        ModuleTableFieldController.create_new(ArchiveFilesConfVO.API_TYPE_ID, field_names<ArchiveFilesConfVO>().date_fichier_pour_delai, ModuleTableFieldVO.FIELD_TYPE_enum, 'Date nommage rép. d\'archives', true, true, ArchiveFilesConfVO.USE_DATE_TYPE_CREATION).setEnumValues(ArchiveFilesConfVO.USE_DATE_TYPE_LABELS);

        ModuleTableFieldController.create_new(ArchiveFilesConfVO.API_TYPE_ID, field_names<ArchiveFilesConfVO>().max_files_per_treatement, ModuleTableFieldVO.FIELD_TYPE_int, 'Nombre max de fichiers à traiter par traitement', true, true, 1000);

        ModuleTableFieldController.create_new(ArchiveFilesConfVO.API_TYPE_ID, field_names<ArchiveFilesConfVO>().date_fichier_pour_nommage, ModuleTableFieldVO.FIELD_TYPE_enum, 'Date nommage rép. d\'archives', true, true, ArchiveFilesConfVO.USE_DATE_TYPE_CREATION).setEnumValues(ArchiveFilesConfVO.USE_DATE_TYPE_LABELS);
        ModuleTableFieldController.create_new(ArchiveFilesConfVO.API_TYPE_ID, field_names<ArchiveFilesConfVO>().type_segment_nommage_archives, ModuleTableFieldVO.FIELD_TYPE_enum, 'Type de segment nommage archives', true, true, TimeSegment.TYPE_MONTH).setEnumValues(TimeSegment.TYPE_NAMES_ENUM);
        ModuleTableFieldController.create_new(ArchiveFilesConfVO.API_TYPE_ID, field_names<ArchiveFilesConfVO>().max_files_per_archive_folder, ModuleTableFieldVO.FIELD_TYPE_int, 'Nombre max de fichiers par répertoire d\'archivage', true, true, 100000); // par défaut 100 000 fichiers par répertoire, à 1million on peut pas vraiment naviguer dans le répertoire sur windows

        ModuleTableFieldController.create_new(ArchiveFilesConfVO.API_TYPE_ID, field_names<ArchiveFilesConfVO>().max_tentatives, ModuleTableFieldVO.FIELD_TYPE_int, 'Nombre max de tentatives', true, true, 3);

        VersionedVOController.getInstance().registerModuleTable(ModuleTableController.create_new(this.name, ArchiveFilesConfVO, label_field, "Conf archivage des fichiers"));
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