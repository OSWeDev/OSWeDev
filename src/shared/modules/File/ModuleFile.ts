import AccessPolicyTools from '../../tools/AccessPolicyTools';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import FileVO from './vos/FileVO';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import ModuleAPI from '../API/ModuleAPI';
import NumberParamVO from '../API/vos/apis/NumberParamVO';
import { booleanFilter } from '../../tools/Filters';

export default class ModuleFile extends Module {

    public static MODULE_NAME: string = 'File';

    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleFile.MODULE_NAME;
    public static POLICY_BO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleFile.MODULE_NAME + '.BO_ACCESS';

    public static FILES_ROOT: string = './files/';

    public static APINAME_TEST_FILE_EXISTENZ = "test_file_existenz";

    public static getInstance(): ModuleFile {
        if (!ModuleFile.instance) {
            ModuleFile.instance = new ModuleFile();
        }
        return ModuleFile.instance;
    }

    private static instance: ModuleFile = null;

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
        ];

        let datatable = new ModuleTable(this, FileVO.API_TYPE_ID, () => new FileVO(), datatable_fields, label_field, "Fichiers");
        this.datatables.push(datatable);
    }

    public registerApis() {

        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<NumberParamVO, boolean>(
            ModuleFile.APINAME_TEST_FILE_EXISTENZ,
            [FileVO.API_TYPE_ID],
            NumberParamVO.translateCheckAccessParams,
            NumberParamVO.URL,
            NumberParamVO.translateToURL,
            NumberParamVO.translateFromREQ
        ));
    }

    public async testFileExistenz(filevo_id: number): Promise<boolean> {
        return await ModuleAPI.getInstance().handleAPI<void, boolean>(ModuleFile.APINAME_TEST_FILE_EXISTENZ, filevo_id);
    }
}