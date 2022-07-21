import AccessPolicyTools from '../../tools/AccessPolicyTools';
import ModuleAccessPolicy from '../AccessPolicy/ModuleAccessPolicy';
import APIControllerWrapper from '../API/APIControllerWrapper';
import NumberParamVO, { NumberParamVOStatic } from '../API/vos/apis/NumberParamVO';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import FileVO from './vos/FileVO';
import FilterFilesVO from './vos/FilterFilesVO';

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

        let label_field = new ModuleTableField('path', ModuleTableField.FIELD_TYPE_file_field, 'Fichier', false);
        let datatable_fields = [
            label_field,
            new ModuleTableField('is_secured', ModuleTableField.FIELD_TYPE_boolean, 'Fichier sécurisé', true, true, false),
            new ModuleTableField('file_access_policy_name', ModuleTableField.FIELD_TYPE_string, 'Nom du droit nécessaire si sécurisé', false),
        ];

        let label_field_ff = new ModuleTableField("path_to_check", ModuleTableField.FIELD_TYPE_file_field, 'fichier', true).unique();
        let datatable_fields_ff = [
            label_field_ff,
            new ModuleTableField('filter_type', ModuleTableField.FIELD_TYPE_enum, 'Type de filtre', false, true).setEnumValues(FilterFilesVO.FILTER_TYPE_LABELS),
            new ModuleTableField("new_path_saved", ModuleTableField.FIELD_TYPE_file_field, 'fichier', true)
        ];

        let datatableFilterFile = new ModuleTable(this, FilterFilesVO.API_TYPE_ID, () => new FilterFilesVO(), datatable_fields_ff, label_field_ff, "Fichier");

        let datatable = new ModuleTable(this, FileVO.API_TYPE_ID, () => new FileVO(), datatable_fields, label_field);
        this.datatables.push(datatable);
        this.datatables.push(datatableFilterFile);
    }

    public registerApis() {

        APIControllerWrapper.getInstance().registerApi(new GetAPIDefinition<NumberParamVO, boolean>(
            ModuleAccessPolicy.POLICY_FO_ACCESS,
            ModuleFile.APINAME_TEST_FILE_EXISTENZ,
            [FileVO.API_TYPE_ID],
            NumberParamVOStatic
        ));
    }
}