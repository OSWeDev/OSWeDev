import Module from '../Module';
import ModuleTableField from '../ModuleTableField';
import SimpleVarConfVO from './simple_vars/SimpleVarConfVO';
import ModuleTable from '../ModuleTable';

export default class ModuleVar extends Module {

    public static MODULE_NAME: string = 'Var';

    public static getInstance(): ModuleVar {
        if (!ModuleVar.instance) {
            ModuleVar.instance = new ModuleVar();
        }
        return ModuleVar.instance;
    }

    private static instance: ModuleVar = null;

    private constructor() {

        super("var", ModuleVar.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        this.initializeSimpleVarConf();
    }

    private initializeSimpleVarConf() {

        let labelField = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Nom du compteur');
        let datatable_fields = [
            labelField,

            new ModuleTableField('var_data_vo_type', ModuleTableField.FIELD_TYPE_string, 'VoType des données du jour'),
            new ModuleTableField('var_imported_data_vo_type', ModuleTableField.FIELD_TYPE_string, 'VoType des données importées'),

            new ModuleTableField('json_params', ModuleTableField.FIELD_TYPE_string, 'Paramètres')
        ];

        let datatable = new ModuleTable(this, SimpleVarConfVO.API_TYPE_ID, datatable_fields, labelField);
        this.datatables.push(datatable);
    }
}