import FileVO from '../File/vos/FileVO';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import VOsTypesManager from '../VOsTypesManager';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import ModuleAPI from '../API/ModuleAPI';
import IPlanRDV from './interfaces/IPlanRDV';
import ProgramSegmentParamVO from './vos/ProgramSegmentParamVO';
import TimeSegment from '../DataRender/vos/TimeSegment';
import IPlanRDVCR from './interfaces/IPlanRDVCR';

export default abstract class ModuleProgramPlan extends Module {

    public static ACCESS_GROUP_NAME = "ProgramPlan_ACCESS";
    public static ADMIN_ACCESS_RULE_NAME = "ADMIN_CONF";
    public static FRONT_ACCESS_RULE_NAME = "FRONT_ACCESS";
    public static FRONT_EDIT_RULE_NAME = "FRONT_EDIT";

    public static APINAME_GET_RDVS_OF_PROGRAM_SEGMENT = "GET_RDVS_OF_PROGRAM_SEGMENT";
    public static APINAME_GET_CRS_OF_PROGRAM_SEGMENT = "GET_CRS_OF_PROGRAM_SEGMENT";

    public static RDV_STATE_LABELS: string[] = ['programplan.rdv.states.created', 'programplan.rdv.states.confirmed', 'programplan.rdv.states.cr_ok'];
    public static RDV_STATE_CREATED: number = 0;
    public static RDV_STATE_CONFIRMED: number = 1;
    public static RDV_STATE_CR_OK: number = 2;

    public static getInstance(): ModuleProgramPlan {
        return ModuleProgramPlan.instance;
    }

    private static instance: ModuleProgramPlan = null;

    private constructor(
        name: string,
        reflexiveClassName: string,

        public program_type_id: string,
        public manager_type_id: string,
        public enseigne_type_id: string,
        public target_type_id: string,
        public rdv_cr_type_id: string,
        public rdv_type_id: string,
        public facilitator_type_id: string,
        public program_facilitator_type_id: string,
        public program_manager_type_id: string,
        public program_target_type_id: string,

        specificImportPath: string = null) {

        super(name, reflexiveClassName, specificImportPath);
        ModuleProgramPlan.instance = this;
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        this.callInitializePlanProgram();
        this.callInitializePlanEnseigne();
        this.callInitializePlanTarget();
        this.callInitializePlanManager();
        this.callInitializePlanFacilitator();
        this.callInitializePlanRDV();
        this.callInitializePlanRDVCR();
        this.callInitializePlanProgramFacilitator();
        this.callInitializePlanProgramManager();
        this.callInitializePlanProgramTarget();
    }


    public registerApis() {
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<ProgramSegmentParamVO, IPlanRDV[]>(
            ModuleProgramPlan.APINAME_GET_RDVS_OF_PROGRAM_SEGMENT,
            [this.rdv_type_id],
            ProgramSegmentParamVO.translateCheckAccessParams,
            ProgramSegmentParamVO.URL,
            ProgramSegmentParamVO.translateToURL,
            ProgramSegmentParamVO.translateFromREQ
        ));

        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<ProgramSegmentParamVO, IPlanRDV[]>(
            ModuleProgramPlan.APINAME_GET_CRS_OF_PROGRAM_SEGMENT,
            [this.rdv_type_id, this.rdv_cr_type_id],
            ProgramSegmentParamVO.translateCheckAccessParams,
            ProgramSegmentParamVO.URL,
            ProgramSegmentParamVO.translateToURL,
            ProgramSegmentParamVO.translateFromREQ
        ));
    }

    public async getRDVsOfProgramSegment(program_id: number, timeSegment: TimeSegment): Promise<IPlanRDV[]> {
        return await ModuleAPI.getInstance().handleAPI<ProgramSegmentParamVO, IPlanRDV[]>(ModuleProgramPlan.APINAME_GET_RDVS_OF_PROGRAM_SEGMENT, program_id, timeSegment);
    }

    public async getCRsOfProgramSegment(program_id: number, timeSegment: TimeSegment): Promise<IPlanRDVCR[]> {
        return await ModuleAPI.getInstance().handleAPI<ProgramSegmentParamVO, IPlanRDVCR[]>(ModuleProgramPlan.APINAME_GET_CRS_OF_PROGRAM_SEGMENT, program_id, timeSegment);
    }

    protected abstract callInitializePlanProgram();
    protected initializePlanProgram(additional_fields: ModuleTableField<any>[]) {
        let label_field = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Nom', false);

        additional_fields.unshift(
            label_field,
            new ModuleTableField('start_date', ModuleTableField.FIELD_TYPE_date, 'Début', false),
            new ModuleTableField('end_date', ModuleTableField.FIELD_TYPE_date, 'Fin', false),
        );

        let datatable = new ModuleTable(this, this.program_type_id, additional_fields, label_field, "Programmes");
        this.datatables.push(datatable);
    }

    protected abstract callInitializePlanFacilitator();
    protected initializePlanFacilitator(additional_fields: ModuleTableField<any>[]) {
        let manager_id = new ModuleTableField('manager_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Manager', false);
        let label_field = new ModuleTableField('lastname', ModuleTableField.FIELD_TYPE_string, 'Nom', false);

        additional_fields.unshift(
            manager_id,
            new ModuleTableField('firstname', ModuleTableField.FIELD_TYPE_string, 'Prénom', false),
            label_field
        );

        let datatable = new ModuleTable(this, this.facilitator_type_id, additional_fields, label_field, "Animateurs");
        manager_id.addManyToOneRelation(datatable, VOsTypesManager.getInstance().moduleTables_by_voType[this.manager_type_id]);
        this.datatables.push(datatable);
    }

    protected abstract callInitializePlanManager();
    protected initializePlanManager(additional_fields: ModuleTableField<any>[]) {
        let label_field = new ModuleTableField('lastname', ModuleTableField.FIELD_TYPE_string, 'Nom', false);

        additional_fields.unshift(
            new ModuleTableField('firstname', ModuleTableField.FIELD_TYPE_string, 'Prénom', false),
            label_field
        );

        let datatable = new ModuleTable(this, this.manager_type_id, additional_fields, label_field, "Managers");
        this.datatables.push(datatable);
    }

    protected abstract callInitializePlanEnseigne();
    protected initializePlanEnseigne(additional_fields: ModuleTableField<any>[]) {
        let label_field = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Nom', false);

        additional_fields.unshift(
            label_field
        );

        let datatable = new ModuleTable(this, this.enseigne_type_id, additional_fields, label_field, "Enseignes");
        this.datatables.push(datatable);
    }

    protected abstract callInitializePlanTarget();
    protected initializePlanTarget(additional_fields: ModuleTableField<any>[]) {
        let label_field = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Nom', false);
        let enseigne_id = new ModuleTableField('enseigne_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Enseigne', false);

        additional_fields.unshift(
            label_field,
            enseigne_id
        );

        let datatable = new ModuleTable(this, this.target_type_id, additional_fields, label_field, "Etablissements");
        enseigne_id.addManyToOneRelation(datatable, VOsTypesManager.getInstance().moduleTables_by_voType[this.enseigne_type_id]);
        this.datatables.push(datatable);
    }

    protected abstract callInitializePlanRDVCR();
    protected initializePlanRDVCR(additional_fields: ModuleTableField<any>[]) {
        let rdv_id = new ModuleTableField('rdv_id', ModuleTableField.FIELD_TYPE_foreign_key, 'RDV', false);
        let cr_file_id = new ModuleTableField('cr_file_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Fichier CR', false);

        additional_fields.unshift(
            rdv_id,
            cr_file_id
        );

        let datatable = new ModuleTable(this, this.rdv_cr_type_id, additional_fields, null, "Compte-rendus");
        rdv_id.addManyToOneRelation(datatable, VOsTypesManager.getInstance().moduleTables_by_voType[this.rdv_type_id]);
        cr_file_id.addManyToOneRelation(datatable, VOsTypesManager.getInstance().moduleTables_by_voType[FileVO.API_TYPE_ID]);
        this.datatables.push(datatable);
    }

    protected abstract callInitializePlanRDV();
    protected initializePlanRDV(additional_fields: ModuleTableField<any>[]) {

        let program_id = new ModuleTableField('program_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Programme', false);
        let target_id = new ModuleTableField('target_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Etablissement', false);
        let label_field = new ModuleTableField('start_time', ModuleTableField.FIELD_TYPE_timestamp, 'Début', false);
        let facilitator_id = new ModuleTableField('facilitator_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Animateur', false);

        additional_fields.unshift(
            program_id,
            facilitator_id,
            target_id,
            label_field,
            new ModuleTableField('end_time', ModuleTableField.FIELD_TYPE_timestamp, 'Fin', false),
            new ModuleTableField('state', ModuleTableField.FIELD_TYPE_enum, ' Statut', true, true, ModuleProgramPlan.RDV_STATE_CREATED).setEnumValues({
                [ModuleProgramPlan.RDV_STATE_CREATED]: ModuleProgramPlan.RDV_STATE_LABELS[ModuleProgramPlan.RDV_STATE_CREATED],
                [ModuleProgramPlan.RDV_STATE_CONFIRMED]: ModuleProgramPlan.RDV_STATE_LABELS[ModuleProgramPlan.RDV_STATE_CONFIRMED],
                [ModuleProgramPlan.RDV_STATE_CR_OK]: ModuleProgramPlan.RDV_STATE_LABELS[ModuleProgramPlan.RDV_STATE_CR_OK]
            })
        );

        let datatable = new ModuleTable(this, this.rdv_type_id, additional_fields, null, "RDVs");
        program_id.addManyToOneRelation(datatable, VOsTypesManager.getInstance().moduleTables_by_voType[this.program_type_id]);
        target_id.addManyToOneRelation(datatable, VOsTypesManager.getInstance().moduleTables_by_voType[this.target_type_id]);
        facilitator_id.addManyToOneRelation(datatable, VOsTypesManager.getInstance().moduleTables_by_voType[this.facilitator_type_id]);
        this.datatables.push(datatable);
    }

    protected abstract callInitializePlanProgramFacilitator();
    protected initializePlanProgramFacilitator(additional_fields: ModuleTableField<any>[]) {
        let facilitator_id = new ModuleTableField('facilitator_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Animateur', false);
        let program_id = new ModuleTableField('program_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Programme', false);

        additional_fields.unshift(
            facilitator_id,
            program_id
        );

        let datatable = new ModuleTable(this, this.program_facilitator_type_id, additional_fields, null, "Animateurs par programme");
        facilitator_id.addManyToOneRelation(datatable, VOsTypesManager.getInstance().moduleTables_by_voType[this.facilitator_type_id]);
        program_id.addManyToOneRelation(datatable, VOsTypesManager.getInstance().moduleTables_by_voType[this.program_type_id]);
        this.datatables.push(datatable);
    }

    protected abstract callInitializePlanProgramManager();
    protected initializePlanProgramManager(additional_fields: ModuleTableField<any>[]) {
        let manager_id = new ModuleTableField('manager_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Manager', false);
        let program_id = new ModuleTableField('program_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Programme', false);

        additional_fields.unshift(
            manager_id,
            program_id
        );

        let datatable = new ModuleTable(this, this.program_manager_type_id, additional_fields, null, "Animateurs par programme");
        manager_id.addManyToOneRelation(datatable, VOsTypesManager.getInstance().moduleTables_by_voType[this.manager_type_id]);
        program_id.addManyToOneRelation(datatable, VOsTypesManager.getInstance().moduleTables_by_voType[this.program_type_id]);
        this.datatables.push(datatable);
    }

    protected abstract callInitializePlanProgramTarget();
    protected initializePlanProgramTarget(additional_fields: ModuleTableField<any>[]) {
        let target_id = new ModuleTableField('target_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Etablissement', false);
        let program_id = new ModuleTableField('program_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Programme', false);

        additional_fields.unshift(
            target_id,
            program_id
        );

        let datatable = new ModuleTable(this, this.program_target_type_id, additional_fields, null, "Etablissements par programme");
        target_id.addManyToOneRelation(datatable, VOsTypesManager.getInstance().moduleTables_by_voType[this.target_type_id]);
        program_id.addManyToOneRelation(datatable, VOsTypesManager.getInstance().moduleTables_by_voType[this.program_type_id]);
        this.datatables.push(datatable);
    }
}