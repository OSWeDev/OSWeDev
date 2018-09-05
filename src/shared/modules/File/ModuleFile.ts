import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import FileVO from './vos/FileVO';

export default class ModuleFile extends Module {

    public static getInstance(): ModuleFile {
        if (!ModuleFile.instance) {
            ModuleFile.instance = new ModuleFile();
        }
        return ModuleFile.instance;
    }

    private static instance: ModuleFile = null;

    private constructor() {

        super("file", "File");
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        let datatable_fields = [
            new ModuleTableField('path', ModuleTableField.FIELD_TYPE_string, 'Chemin du fichier', false),
        ];

        let datatable = new ModuleTable(this, FileVO.API_TYPE_ID, datatable_fields, "Fichiers");
        this.datatables.push(datatable);
    }
}