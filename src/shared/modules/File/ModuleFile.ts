import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import FileVO from './vos/FileVO';

export default class ModuleFile extends Module {

    public static FILES_ROOT: string = './files/';

    public static getInstance(): ModuleFile {
        if (!ModuleFile.instance) {
            ModuleFile.instance = new ModuleFile();
        }
        return ModuleFile.instance;
    }

    private static instance: ModuleFile = null;

    private constructor() {

        super("file", "File");
        this.forceActivationOnInstallation();
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        let label_field = new ModuleTableField('path', ModuleTableField.FIELD_TYPE_file_field, 'Fichier', false);
        let datatable_fields = [
            label_field,
        ];

        let datatable = new ModuleTable(this, FileVO.API_TYPE_ID, datatable_fields, label_field, "Fichiers");
        this.datatables.push(datatable);
    }
}