import AccessPolicyTools from '../../tools/AccessPolicyTools';
import UserVO from '../AccessPolicy/vos/UserVO';
import ModuleAPI from '../API/ModuleAPI';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import TimeSegment from '../DataRender/vos/TimeSegment';
import FileVO from '../File/vos/FileVO';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import VOsTypesManager from '../VOsTypesManager';
import IPlanRDV from './interfaces/IPlanRDV';
import IPlanRDVCR from './interfaces/IPlanRDVCR';
import ProgramSegmentParamVO from './vos/ProgramSegmentParamVO';

export default abstract class ModuleProgramPlanBase extends Module {

    public static MODULE_NAME: string = 'ProgramPlanBase';

    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleProgramPlanBase.MODULE_NAME;
    public static POLICY_BO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleProgramPlanBase.MODULE_NAME + '.BO_ACCESS';
    public static POLICY_FO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleProgramPlanBase.MODULE_NAME + '.FO_ACCESS';
    public static POLICY_FO_EDIT: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleProgramPlanBase.MODULE_NAME + '.FO_EDIT';

    public static APINAME_GET_RDVS_OF_PROGRAM_SEGMENT = "GET_RDVS_OF_PROGRAM_SEGMENT";
    public static APINAME_GET_CRS_OF_PROGRAM_SEGMENT = "GET_CRS_OF_PROGRAM_SEGMENT";

    public static RDV_STATE_LABELS: string[] = ['programplan.rdv.states.created', 'programplan.rdv.states.confirmed', 'programplan.rdv.states.cr_ok'];
    public static RDV_STATE_CREATED: number = 0;
    public static RDV_STATE_CONFIRMED: number = 1;
    public static RDV_STATE_CR_OK: number = 2;

    public static PROGRAM_TARGET_STATE_LABELS: string[] = ['programplan.program.target.created', 'programplan.program.target.ongoing', 'programplan.program.target.closed', 'programplan.program.target.late'];
    public static PROGRAM_TARGET_STATE_CREATED: number = 0;
    public static PROGRAM_TARGET_STATE_ONGOING: number = 1;
    public static PROGRAM_TARGET_STATE_CLOSED: number = 2;
    public static PROGRAM_TARGET_STATE_LATE: number = 3;

    public static getInstance(): ModuleProgramPlanBase {
        return ModuleProgramPlanBase.instance;
    }

    private static instance: ModuleProgramPlanBase = null;

    public program_category_type_id: string;
    public program_type_id: string;
    public partner_type_id: string;
    public manager_type_id: string;
    public enseigne_type_id: string;
    public target_type_id: string;
    public rdv_cr_type_id: string;
    public rdv_type_id: string;
    public facilitator_type_id: string;
    public program_facilitator_type_id: string;
    public program_manager_type_id: string;
    public program_target_type_id: string;

    protected constructor(
        name: string,
        reflexiveClassName: string,

        program_category_type_id: string,
        program_type_id: string,
        partner_type_id: string,
        manager_type_id: string,
        enseigne_type_id: string,
        target_type_id: string,
        rdv_cr_type_id: string,
        rdv_type_id: string,
        facilitator_type_id: string,
        program_facilitator_type_id: string,
        program_manager_type_id: string,
        program_target_type_id: string,

        specificImportPath: string = null) {

        super(name, reflexiveClassName, specificImportPath);

        this.program_category_type_id = program_category_type_id;
        this.program_type_id = program_type_id;
        this.manager_type_id = manager_type_id;
        this.enseigne_type_id = enseigne_type_id;
        this.target_type_id = target_type_id;
        this.rdv_cr_type_id = rdv_cr_type_id;
        this.rdv_type_id = rdv_type_id;
        this.facilitator_type_id = facilitator_type_id;
        this.program_facilitator_type_id = program_facilitator_type_id;
        this.program_manager_type_id = program_manager_type_id;
        this.program_target_type_id = program_target_type_id;
        this.partner_type_id = partner_type_id;

        ModuleProgramPlanBase.instance = this;

        this.initialize_later();
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];
    }

    public initialize_later() {
        this.fields = [];
        this.datatables = [];

        this.callInitializePlanProgramCategory();
        this.callInitializePlanProgram();
        this.callInitializePlanEnseigne();
        this.callInitializePlanTarget();
        this.callInitializePlanPartner();
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
            ModuleProgramPlanBase.APINAME_GET_RDVS_OF_PROGRAM_SEGMENT,
            [this.rdv_type_id],
            ProgramSegmentParamVO.translateCheckAccessParams,
            ProgramSegmentParamVO.URL,
            ProgramSegmentParamVO.translateToURL,
            ProgramSegmentParamVO.translateFromREQ
        ));

        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<ProgramSegmentParamVO, IPlanRDV[]>(
            ModuleProgramPlanBase.APINAME_GET_CRS_OF_PROGRAM_SEGMENT,
            [this.rdv_type_id, this.rdv_cr_type_id],
            ProgramSegmentParamVO.translateCheckAccessParams,
            ProgramSegmentParamVO.URL,
            ProgramSegmentParamVO.translateToURL,
            ProgramSegmentParamVO.translateFromREQ
        ));
    }

    public async getRDVsOfProgramSegment(program_id: number, timeSegment: TimeSegment): Promise<IPlanRDV[]> {
        return await ModuleAPI.getInstance().handleAPI<ProgramSegmentParamVO, IPlanRDV[]>(ModuleProgramPlanBase.APINAME_GET_RDVS_OF_PROGRAM_SEGMENT, program_id, timeSegment);
    }

    public async getCRsOfProgramSegment(program_id: number, timeSegment: TimeSegment): Promise<IPlanRDVCR[]> {
        return await ModuleAPI.getInstance().handleAPI<ProgramSegmentParamVO, IPlanRDVCR[]>(ModuleProgramPlanBase.APINAME_GET_CRS_OF_PROGRAM_SEGMENT, program_id, timeSegment);
    }

    protected abstract callInitializePlanProgramCategory();
    protected initializePlanProgramCategory(additional_fields: Array<ModuleTableField<any>>) {
        let label_field = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Nom', true);

        additional_fields.unshift(
            label_field,
            new ModuleTableField('weight', ModuleTableField.FIELD_TYPE_int, 'Poids', true, true, 0),
            new ModuleTableField('description', ModuleTableField.FIELD_TYPE_string, 'Description', false),
            new ModuleTableField('nb_targets', ModuleTableField.FIELD_TYPE_int, 'Nb. établissements', true, true, 0),
            new ModuleTableField('total_days', ModuleTableField.FIELD_TYPE_int, 'Nb total de jours des programmes', true, true, 0),

            new ModuleTableField('start_date', ModuleTableField.FIELD_TYPE_date, 'Début', false),
            new ModuleTableField('end_date', ModuleTableField.FIELD_TYPE_date, 'Fin', false),

            new ModuleTableField('nb_created_targets', ModuleTableField.FIELD_TYPE_int, 'En attente', true, true, 0),
            new ModuleTableField('nb_late_targets', ModuleTableField.FIELD_TYPE_int, 'En retard', true, true, 0),
            new ModuleTableField('nb_ongoing_targets', ModuleTableField.FIELD_TYPE_int, 'En cours', true, true, 0),
            new ModuleTableField('nb_closed_targets', ModuleTableField.FIELD_TYPE_int, 'Terminés', true, true, 0),
        );

        let datatable = new ModuleTable(this, this.program_category_type_id, additional_fields, label_field, "Catégories de programmes");
        this.datatables.push(datatable);
    }

    protected abstract callInitializePlanProgram();
    protected initializePlanProgram(additional_fields: Array<ModuleTableField<any>>) {
        let label_field = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Nom', true);
        let category_id = new ModuleTableField('category_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Catégorie', false);

        additional_fields.unshift(
            label_field,
            category_id,
            new ModuleTableField('start_date', ModuleTableField.FIELD_TYPE_date, 'Début', false),
            new ModuleTableField('end_date', ModuleTableField.FIELD_TYPE_date, 'Fin', false),
            new ModuleTableField('days_by_target', ModuleTableField.FIELD_TYPE_float, 'Nb. de jours par établissement', true, true, 1),
            new ModuleTableField('nb_targets', ModuleTableField.FIELD_TYPE_int, 'Nb. établissements', true, true, 0),
            new ModuleTableField('nb_created_targets', ModuleTableField.FIELD_TYPE_int, 'En attente', true, true, 0),
            new ModuleTableField('nb_late_targets', ModuleTableField.FIELD_TYPE_int, 'En retard', true, true, 0),
            new ModuleTableField('nb_ongoing_targets', ModuleTableField.FIELD_TYPE_int, 'En cours', true, true, 0),
            new ModuleTableField('nb_closed_targets', ModuleTableField.FIELD_TYPE_int, 'Terminés', true, true, 0),

            new ModuleTableField('weight', ModuleTableField.FIELD_TYPE_int, 'Poids', true, true, 0),
            new ModuleTableField('description', ModuleTableField.FIELD_TYPE_string, 'Description', false)
        );

        let datatable = new ModuleTable(this, this.program_type_id, additional_fields, label_field, "Programmes");
        category_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[this.program_category_type_id]);
        this.datatables.push(datatable);
    }

    protected abstract callInitializePlanFacilitator();
    protected initializePlanFacilitator(additional_fields: Array<ModuleTableField<any>>) {
        let manager_id = new ModuleTableField('manager_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Manager', false);
        let partner_id = new ModuleTableField('partner_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Partenaire', false);
        let label_field = new ModuleTableField('lastname', ModuleTableField.FIELD_TYPE_string, 'Nom', true);

        additional_fields.unshift(
            manager_id,
            partner_id,
            new ModuleTableField('firstname', ModuleTableField.FIELD_TYPE_string, 'Prénom', false),
            label_field
        );

        let datatable = new ModuleTable(this, this.facilitator_type_id, additional_fields, label_field, "Animateurs");
        manager_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[this.manager_type_id]);
        partner_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[this.partner_type_id]);
        this.datatables.push(datatable);
    }

    protected abstract callInitializePlanManager();
    protected initializePlanManager(additional_fields: Array<ModuleTableField<any>>) {
        let label_field = new ModuleTableField('lastname', ModuleTableField.FIELD_TYPE_string, 'Nom', true);
        let partner_id = new ModuleTableField('partner_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Partenaire', false);

        additional_fields.unshift(
            partner_id,
            new ModuleTableField('firstname', ModuleTableField.FIELD_TYPE_string, 'Prénom', false),
            label_field
        );

        let datatable = new ModuleTable(this, this.manager_type_id, additional_fields, label_field, "Managers");
        partner_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[this.partner_type_id]);
        this.datatables.push(datatable);
    }

    protected abstract callInitializePlanEnseigne();
    protected initializePlanEnseigne(additional_fields: Array<ModuleTableField<any>>) {
        let label_field = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Nom', true);

        additional_fields.unshift(
            label_field
        );

        let datatable = new ModuleTable(this, this.enseigne_type_id, additional_fields, label_field, "Enseignes");
        this.datatables.push(datatable);
    }

    protected abstract callInitializePlanTarget();
    protected initializePlanTarget(additional_fields: Array<ModuleTableField<any>>) {
        let label_field = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Nom', true);
        let enseigne_id = new ModuleTableField('enseigne_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Enseigne', false);

        additional_fields.unshift(
            label_field,
            enseigne_id,

            new ModuleTableField('address', ModuleTableField.FIELD_TYPE_string, 'Adresse', false),
            new ModuleTableField('cp', ModuleTableField.FIELD_TYPE_string, 'Code Postal', false),
            new ModuleTableField('city', ModuleTableField.FIELD_TYPE_string, 'Ville', false),
            new ModuleTableField('country', ModuleTableField.FIELD_TYPE_string, 'Pays', false),

            new ModuleTableField('contact_firstname', ModuleTableField.FIELD_TYPE_string, 'Contact - Prénom', false),
            new ModuleTableField('contact_lastname', ModuleTableField.FIELD_TYPE_string, 'Contact - Nom', false),
            new ModuleTableField('contact_mail', ModuleTableField.FIELD_TYPE_string, 'Contact - eMail', false),
            new ModuleTableField('contact_mobile', ModuleTableField.FIELD_TYPE_string, 'Contact - Mobile', false),
            new ModuleTableField('contact_infos', ModuleTableField.FIELD_TYPE_string, 'Contact - Infos', false),

            new ModuleTableField('infos_horaires', ModuleTableField.FIELD_TYPE_string, 'Infos horaires', false),
        );

        let datatable = new ModuleTable(this, this.target_type_id, additional_fields, label_field, "Etablissements");
        enseigne_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[this.enseigne_type_id]);
        this.datatables.push(datatable);
    }

    protected abstract callInitializePlanRDVCR();
    protected initializePlanRDVCR(additional_fields: Array<ModuleTableField<any>>) {
        let rdv_id = new ModuleTableField('rdv_id', ModuleTableField.FIELD_TYPE_foreign_key, 'RDV', false);
        let cr_file_id = new ModuleTableField('cr_file_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Fichier CR', false);
        let author_id = new ModuleTableField('author_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Auteur', false);
        additional_fields.unshift(
            rdv_id,
            author_id,
            cr_file_id
        );

        let datatable = new ModuleTable(this, this.rdv_cr_type_id, additional_fields, null, "Compte-rendus");
        rdv_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[this.rdv_type_id]);
        author_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID]);
        cr_file_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[FileVO.API_TYPE_ID]);
        this.datatables.push(datatable);
    }

    protected abstract callInitializePlanRDV();
    protected initializePlanRDV(additional_fields: Array<ModuleTableField<any>>) {

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
            new ModuleTableField('state', ModuleTableField.FIELD_TYPE_enum, ' Statut', true, true, ModuleProgramPlanBase.RDV_STATE_CREATED).setEnumValues({
                [ModuleProgramPlanBase.RDV_STATE_CREATED]: ModuleProgramPlanBase.RDV_STATE_LABELS[ModuleProgramPlanBase.RDV_STATE_CREATED],
                [ModuleProgramPlanBase.RDV_STATE_CONFIRMED]: ModuleProgramPlanBase.RDV_STATE_LABELS[ModuleProgramPlanBase.RDV_STATE_CONFIRMED],
                [ModuleProgramPlanBase.RDV_STATE_CR_OK]: ModuleProgramPlanBase.RDV_STATE_LABELS[ModuleProgramPlanBase.RDV_STATE_CR_OK]
            })
        );

        let datatable = new ModuleTable(this, this.rdv_type_id, additional_fields, null, "RDVs");
        program_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[this.program_type_id]);
        target_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[this.target_type_id]);
        facilitator_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[this.facilitator_type_id]);
        this.datatables.push(datatable);
    }

    protected abstract callInitializePlanProgramFacilitator();
    protected initializePlanProgramFacilitator(additional_fields: Array<ModuleTableField<any>>) {
        let facilitator_id = new ModuleTableField('facilitator_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Animateur', true);
        let program_id = new ModuleTableField('program_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Programme', true);

        additional_fields.unshift(
            facilitator_id,
            program_id
        );

        let datatable = new ModuleTable(this, this.program_facilitator_type_id, additional_fields, null, "Animateurs par programme");
        facilitator_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[this.facilitator_type_id]);
        program_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[this.program_type_id]);
        this.datatables.push(datatable);
    }

    protected abstract callInitializePlanProgramManager();
    protected initializePlanProgramManager(additional_fields: Array<ModuleTableField<any>>) {
        let manager_id = new ModuleTableField('manager_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Manager', true);
        let program_id = new ModuleTableField('program_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Programme', true);

        additional_fields.unshift(
            manager_id,
            program_id
        );

        let datatable = new ModuleTable(this, this.program_manager_type_id, additional_fields, null, "Animateurs par programme");
        manager_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[this.manager_type_id]);
        program_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[this.program_type_id]);
        this.datatables.push(datatable);
    }

    protected abstract callInitializePlanProgramTarget();
    protected initializePlanProgramTarget(additional_fields: Array<ModuleTableField<any>>) {
        let target_id = new ModuleTableField('target_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Etablissement', true);
        let program_id = new ModuleTableField('program_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Programme', true);

        additional_fields.unshift(
            target_id,
            program_id,
            new ModuleTableField('state', ModuleTableField.FIELD_TYPE_enum, 'Statut', true, true, ModuleProgramPlanBase.PROGRAM_TARGET_STATE_CREATED).setEnumValues({
                [ModuleProgramPlanBase.PROGRAM_TARGET_STATE_CREATED]: ModuleProgramPlanBase.PROGRAM_TARGET_STATE_LABELS[ModuleProgramPlanBase.PROGRAM_TARGET_STATE_CREATED],
                [ModuleProgramPlanBase.PROGRAM_TARGET_STATE_ONGOING]: ModuleProgramPlanBase.PROGRAM_TARGET_STATE_LABELS[ModuleProgramPlanBase.PROGRAM_TARGET_STATE_ONGOING],
                [ModuleProgramPlanBase.PROGRAM_TARGET_STATE_CLOSED]: ModuleProgramPlanBase.PROGRAM_TARGET_STATE_LABELS[ModuleProgramPlanBase.PROGRAM_TARGET_STATE_CLOSED],
                [ModuleProgramPlanBase.PROGRAM_TARGET_STATE_LATE]: ModuleProgramPlanBase.PROGRAM_TARGET_STATE_LABELS[ModuleProgramPlanBase.PROGRAM_TARGET_STATE_LATE]
            })
        );

        let datatable = new ModuleTable(this, this.program_target_type_id, additional_fields, null, "Etablissements par programme");
        target_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[this.target_type_id]);
        program_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[this.program_type_id]);
        this.datatables.push(datatable);
    }

    protected abstract callInitializePlanPartner();
    protected initializePlanPartner(additional_fields: Array<ModuleTableField<any>>) {
        let label_field = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Nom', false);

        additional_fields.unshift(
            label_field
        );

        let datatable = new ModuleTable(this, this.partner_type_id, additional_fields, label_field, "Partenaires");
        this.datatables.push(datatable);
    }
}