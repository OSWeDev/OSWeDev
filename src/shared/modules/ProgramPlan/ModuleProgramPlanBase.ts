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
import IPlanRDVPrep from './interfaces/IPlanRDVPrep';

export default abstract class ModuleProgramPlanBase extends Module {

    public static MODULE_NAME: string = 'ProgramPlanBase';

    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleProgramPlanBase.MODULE_NAME;
    public static POLICY_BO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleProgramPlanBase.MODULE_NAME + '.BO_ACCESS';
    public static POLICY_FO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleProgramPlanBase.MODULE_NAME + '.FO_ACCESS';

    public static POLICY_FO_SEE_ALL_TEAMS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleProgramPlanBase.MODULE_NAME + '.FO_SEE_ALL_TEAMS';
    public static POLICY_FO_SEE_OWN_TEAM: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleProgramPlanBase.MODULE_NAME + '.FO_SEE_OWN_TEAM';

    public static POLICY_FO_EDIT: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleProgramPlanBase.MODULE_NAME + '.FO_EDIT';

    public static POLICY_FO_EDIT_OWN_RDVS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleProgramPlanBase.MODULE_NAME + '.FO_EDIT_OWN_RDVS';
    public static POLICY_FO_EDIT_OWN_TEAM_RDVS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleProgramPlanBase.MODULE_NAME + '.FO_EDIT_OWN_TEAM_RDVS';
    public static POLICY_FO_EDIT_ALL_RDVS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleProgramPlanBase.MODULE_NAME + '.FO_EDIT_ALL_RDVS';

    public static APINAME_GET_RDVS_OF_PROGRAM_SEGMENT = "GET_RDVS_OF_PROGRAM_SEGMENT";
    public static APINAME_GET_CRS_OF_PROGRAM_SEGMENT = "GET_CRS_OF_PROGRAM_SEGMENT";
    public static APINAME_GET_PREPS_OF_PROGRAM_SEGMENT = "GET_PREPS_OF_PROGRAM_SEGMENT";

    public static RDV_STATE_LABELS: string[] = [
        'programplan.rdv.states.created', 'programplan.rdv.states.confirmed', 'programplan.rdv.states.prep_ok', 'programplan.rdv.states.cr_ok'
    ];
    public static RDV_STATE_CREATED: number = 0;
    public static RDV_STATE_CONFIRMED: number = 1;
    public static RDV_STATE_PREP_OK: number = 2;
    public static RDV_STATE_CR_OK: number = 3;

    // public static PROGRAM_TARGET_STATE_LABELS: string[] = ['programplan.program.target.created', 'programplan.program.target.ongoing', 'programplan.program.target.closed', 'programplan.program.target.late'];
    // public static PROGRAM_TARGET_STATE_CREATED: number = 0;
    // public static PROGRAM_TARGET_STATE_ONGOING: number = 1;
    // public static PROGRAM_TARGET_STATE_CLOSED: number = 2;
    // public static PROGRAM_TARGET_STATE_LATE: number = 3;

    public static getInstance(): ModuleProgramPlanBase {
        return ModuleProgramPlanBase.instance;
    }

    private static instance: ModuleProgramPlanBase = null;

    public program_category_type_id: string;
    public program_type_id: string;
    public partner_type_id: string;
    public manager_type_id: string;
    public enseigne_type_id: string;
    public contact_type_id: string;
    public facilitator_region_type_id: string;
    public target_type_id: string;
    public rdv_cr_type_id: string;
    public rdv_type_id: string;
    public task_type_type_id: string;
    public task_type_id: string;
    public facilitator_type_id: string;
    public program_facilitator_type_id: string;
    public program_manager_type_id: string;
    public program_target_type_id: string;
    public target_contact_type_id: string;
    public rdv_prep_type_id: string;

    public showProgramAdministration: boolean = true;

    protected constructor(
        name: string,
        reflexiveClassName: string,

        program_category_type_id: string,
        program_type_id: string,
        partner_type_id: string,
        manager_type_id: string,
        facilitator_region_type_id: string,
        enseigne_type_id: string,
        contact_type_id: string,
        target_type_id: string,
        rdv_prep_type_id: string,
        rdv_cr_type_id: string,
        rdv_type_id: string,
        facilitator_type_id: string,
        program_facilitator_type_id: string,
        program_manager_type_id: string,
        program_target_type_id: string,
        target_contact_type_id: string,
        task_type_type_id: string,
        task_type_id: string,

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
        this.contact_type_id = contact_type_id;
        this.target_contact_type_id = target_contact_type_id;
        this.facilitator_region_type_id = facilitator_region_type_id;
        this.task_type_type_id = task_type_type_id;
        this.task_type_id = task_type_id;
        this.rdv_prep_type_id = rdv_prep_type_id;

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
        this.callInitializePlanFacilitatorRegion();
        this.callInitializePlanPartner();
        this.callInitializePlanContact();
        this.callInitializePlanManager();
        this.callInitializePlanFacilitator();
        this.callInitializePlanTaskType();
        this.callInitializePlanTask();
        this.callInitializePlanRDV();
        this.callInitializePlanRDVCR();
        this.callInitializePlanRDVPrep();
        this.callInitializePlanProgramFacilitator();
        this.callInitializePlanProgramManager();
        this.callInitializePlanTargetContact();
        this.callInitializePlanProgramTarget();
    }


    public registerApis() {
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<ProgramSegmentParamVO, IPlanRDV[]>(
            ModuleProgramPlanBase.APINAME_GET_RDVS_OF_PROGRAM_SEGMENT,
            () => [this.rdv_type_id],
            ProgramSegmentParamVO.translateCheckAccessParams,
            ProgramSegmentParamVO.URL,
            ProgramSegmentParamVO.translateToURL,
            ProgramSegmentParamVO.translateFromREQ
        ));

        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<ProgramSegmentParamVO, IPlanRDVCR[]>(
            ModuleProgramPlanBase.APINAME_GET_CRS_OF_PROGRAM_SEGMENT,
            () => [this.rdv_type_id, this.rdv_cr_type_id],
            ProgramSegmentParamVO.translateCheckAccessParams,
            ProgramSegmentParamVO.URL,
            ProgramSegmentParamVO.translateToURL,
            ProgramSegmentParamVO.translateFromREQ
        ));

        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<ProgramSegmentParamVO, IPlanRDVPrep[]>(
            ModuleProgramPlanBase.APINAME_GET_PREPS_OF_PROGRAM_SEGMENT,
            () => [this.rdv_type_id, this.rdv_prep_type_id],
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

    public async getPrepsOfProgramSegment(program_id: number, timeSegment: TimeSegment): Promise<IPlanRDVPrep[]> {
        return await ModuleAPI.getInstance().handleAPI<ProgramSegmentParamVO, IPlanRDVPrep[]>(ModuleProgramPlanBase.APINAME_GET_PREPS_OF_PROGRAM_SEGMENT, program_id, timeSegment);
    }

    protected callInitializePlanProgramCategory() {
        this.initializePlanProgramCategory([]);
    }
    protected initializePlanProgramCategory(additional_fields: Array<ModuleTableField<any>>) {
        if (!this.program_category_type_id) {
            return;
        }

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

    protected callInitializePlanFacilitatorRegion() {
        this.initializePlanFacilitatorRegion([]);
    }
    protected initializePlanFacilitatorRegion(additional_fields: Array<ModuleTableField<any>>) {
        if (!this.facilitator_region_type_id) {
            return;
        }

        let label_field = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Nom', true);

        additional_fields.unshift(
            label_field,
        );

        let datatable = new ModuleTable(this, this.facilitator_region_type_id, additional_fields, label_field, "Régions des animateurs");
        this.datatables.push(datatable);
    }

    protected callInitializePlanContact() {
        this.initializePlanContact([]);
    }
    protected initializePlanContact(additional_fields: Array<ModuleTableField<any>>) {
        if (!this.contact_type_id) {
            return;
        }

        let label_field = new ModuleTableField('lastname', ModuleTableField.FIELD_TYPE_string, 'Nom', true);
        let user_id = new ModuleTableField('user_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Utilisateur', false);

        additional_fields.unshift(
            user_id,
            new ModuleTableField('firstname', ModuleTableField.FIELD_TYPE_string, 'Prénom', false),
            label_field,
            new ModuleTableField('mail', ModuleTableField.FIELD_TYPE_string, 'Mail', false),
            new ModuleTableField('mobile', ModuleTableField.FIELD_TYPE_string, 'Portable', false),
            new ModuleTableField('infos', ModuleTableField.FIELD_TYPE_string, 'Infos', false),
        );

        let datatable = new ModuleTable(this, this.contact_type_id, additional_fields, label_field, "Contacts");
        user_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID]);
        this.datatables.push(datatable);
    }

    protected callInitializePlanTargetContact() {
        this.initializePlanTargetContact([]);
    }
    protected initializePlanTargetContact(additional_fields: Array<ModuleTableField<any>>) {
        if (!this.target_contact_type_id) {
            return;
        }

        let target_id = new ModuleTableField('target_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Cible', false);
        let contact_id = new ModuleTableField('contact_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Contact', false);

        additional_fields.unshift(
            target_id,
            contact_id
        );

        let datatable = new ModuleTable(this, this.target_contact_type_id, additional_fields, null, "Contacts par cible");
        target_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[this.target_type_id]);
        contact_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[this.contact_type_id]);

        this.datatables.push(datatable);
    }

    protected callInitializePlanProgram() {
        this.initializePlanProgram([]);
    }

    protected initializePlanProgram(additional_fields: Array<ModuleTableField<any>>) {
        if (!this.program_type_id) {
            return;
        }

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

    protected callInitializePlanFacilitator() {
        this.initializePlanFacilitator([]);
    }

    protected initializePlanFacilitator(additional_fields: Array<ModuleTableField<any>>) {
        if (!this.facilitator_type_id) {
            return;
        }

        let manager_id;
        let partner_id;
        let label_field = new ModuleTableField('lastname', ModuleTableField.FIELD_TYPE_string, 'Nom', true);
        let user_id = new ModuleTableField('user_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Utilisateur', false);
        let region_id;

        additional_fields.unshift(
            user_id);

        if (!!this.manager_type_id) {
            manager_id = new ModuleTableField('manager_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Manager', false);
            additional_fields.unshift(manager_id);
        }

        if (!!this.partner_type_id) {
            partner_id = new ModuleTableField('partner_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Partenaire', false);
            additional_fields.unshift(partner_id);
        }

        if (!!this.facilitator_region_type_id) {
            region_id = new ModuleTableField('region_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Région', false);
            additional_fields.unshift(region_id);
        }

        additional_fields.unshift(
            new ModuleTableField('firstname', ModuleTableField.FIELD_TYPE_string, 'Prénom', false),
            label_field,
            new ModuleTableField('activated', ModuleTableField.FIELD_TYPE_boolean, 'Actif', true, true, true)
        );

        let datatable = new ModuleTable(this, this.facilitator_type_id, additional_fields, label_field, "Animateurs");
        user_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID]);

        if (!!this.manager_type_id) {
            manager_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[this.manager_type_id]);
        }

        if (!!this.partner_type_id) {
            partner_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[this.partner_type_id]);
        }

        if (!!this.facilitator_region_type_id) {
            region_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[this.facilitator_region_type_id]);
        }

        this.datatables.push(datatable);
    }


    protected callInitializePlanManager() {
        this.initializePlanManager([]);
    }

    protected initializePlanManager(additional_fields: Array<ModuleTableField<any>>) {
        if (!this.manager_type_id) {
            return;
        }

        let label_field = new ModuleTableField('lastname', ModuleTableField.FIELD_TYPE_string, 'Nom', true);
        let partner_id;
        let user_id = new ModuleTableField('user_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Utilisateur', false);

        additional_fields.unshift(user_id);

        if (!!this.partner_type_id) {
            partner_id = new ModuleTableField('partner_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Partenaire', false);
            additional_fields.unshift(partner_id);
        }

        additional_fields.unshift(
            new ModuleTableField('firstname', ModuleTableField.FIELD_TYPE_string, 'Prénom', false),
            label_field,
            new ModuleTableField('activated', ModuleTableField.FIELD_TYPE_boolean, 'Actif', true, true, true)
        );

        let datatable = new ModuleTable(this, this.manager_type_id, additional_fields, label_field, "Managers");
        user_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID]);

        if (!!this.partner_type_id) {
            partner_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[this.partner_type_id]);
        }

        this.datatables.push(datatable);
    }

    protected callInitializePlanEnseigne() {
        this.initializePlanEnseigne([]);
    }
    protected initializePlanEnseigne(additional_fields: Array<ModuleTableField<any>>) {
        if (!this.enseigne_type_id) {
            return;
        }

        let label_field = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Nom', true);

        additional_fields.unshift(
            label_field
        );

        let datatable = new ModuleTable(this, this.enseigne_type_id, additional_fields, label_field, "Enseignes");
        this.datatables.push(datatable);
    }

    protected callInitializePlanTaskType() {
        this.initializePlanTaskType([]);
    }
    protected initializePlanTaskType(additional_fields: Array<ModuleTableField<any>>) {
        if (!this.task_type_type_id) {
            return;
        }

        let label_field = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Nom', true);

        additional_fields.unshift(
            label_field
        );

        additional_fields.push(
            new ModuleTableField('weight', ModuleTableField.FIELD_TYPE_int, 'Poids', true, true, 0));

        let datatable = new ModuleTable(this, this.task_type_type_id, additional_fields, label_field, "Type de tâche");
        this.datatables.push(datatable);
    }

    protected callInitializePlanTask() {
        this.initializePlanTask([]);
    }
    protected initializePlanTask(additional_fields: Array<ModuleTableField<any>>) {
        if (!this.task_type_id) {
            return;
        }

        let label_field = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Nom', true);

        additional_fields.unshift(label_field);

        let task_type_id;
        if (!!this.task_type_type_id) {
            task_type_id = new ModuleTableField('task_type_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Type de tâche', false);
            additional_fields.unshift(task_type_id);
        }

        additional_fields.push(
            new ModuleTableField('weight', ModuleTableField.FIELD_TYPE_int, 'Poids', true, true, 0));

        let datatable = new ModuleTable(this, this.task_type_id, additional_fields, label_field, "Tâche");
        if (!!this.task_type_type_id) {
            task_type_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[this.task_type_type_id]);
        }
        this.datatables.push(datatable);
    }

    protected callInitializePlanTarget() {
        this.initializePlanTarget([]);
    }
    protected initializePlanTarget(additional_fields: Array<ModuleTableField<any>>) {
        if (!this.target_type_id) {
            return;
        }

        let label_field = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Nom', true);
        let enseigne_id;
        additional_fields.unshift(label_field);

        if (!!this.enseigne_type_id) {
            enseigne_id = new ModuleTableField('enseigne_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Enseigne', false);
            additional_fields.unshift(enseigne_id);
        }

        additional_fields.unshift(
            new ModuleTableField('address', ModuleTableField.FIELD_TYPE_string, 'Adresse', false),
            new ModuleTableField('cp', ModuleTableField.FIELD_TYPE_string, 'Code Postal', false),
            new ModuleTableField('city', ModuleTableField.FIELD_TYPE_string, 'Ville', false),
            new ModuleTableField('country', ModuleTableField.FIELD_TYPE_string, 'Pays', false),

            new ModuleTableField('infos_horaires', ModuleTableField.FIELD_TYPE_string, 'Infos horaires', false),
            new ModuleTableField('activated', ModuleTableField.FIELD_TYPE_boolean, 'Actif', true, true, true)
        );

        let datatable = new ModuleTable(this, this.target_type_id, additional_fields, label_field, "Etablissements");

        if (!!this.enseigne_type_id) {
            enseigne_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[this.enseigne_type_id]);
        }

        this.datatables.push(datatable);
    }

    protected callInitializePlanRDVPrep() {
        this.initializePlanRDVPrep([]);
    }
    protected initializePlanRDVPrep(additional_fields: Array<ModuleTableField<any>>) {
        if (!this.rdv_prep_type_id) {
            return;
        }

        let rdv_id;
        let prep_file_id = new ModuleTableField('prep_file_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Fichier Préparation', false);
        let author_id = new ModuleTableField('author_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Auteur', false);

        if (!!this.rdv_type_id) {
            rdv_id = new ModuleTableField('rdv_id', ModuleTableField.FIELD_TYPE_foreign_key, 'RDV', false);
            additional_fields.unshift(rdv_id);
        }

        additional_fields.unshift(
            author_id,
            prep_file_id
        );

        let datatable = new ModuleTable(this, this.rdv_prep_type_id, additional_fields, null, "Préparations");

        if (!!this.rdv_type_id) {
            rdv_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[this.rdv_type_id]);
        }

        author_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID]);
        prep_file_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[FileVO.API_TYPE_ID]);
        this.datatables.push(datatable);
    }

    protected callInitializePlanRDVCR() {
        this.initializePlanRDVCR([]);
    }
    protected initializePlanRDVCR(additional_fields: Array<ModuleTableField<any>>) {
        if (!this.rdv_cr_type_id) {
            return;
        }

        let rdv_id;
        let cr_file_id = new ModuleTableField('cr_file_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Fichier CR', false);
        let author_id = new ModuleTableField('author_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Auteur', false);

        if (!!this.rdv_type_id) {
            rdv_id = new ModuleTableField('rdv_id', ModuleTableField.FIELD_TYPE_foreign_key, 'RDV', false);
            additional_fields.unshift(rdv_id);
        }

        additional_fields.unshift(
            author_id,
            cr_file_id
        );

        let datatable = new ModuleTable(this, this.rdv_cr_type_id, additional_fields, null, "Compte-rendus");

        if (!!this.rdv_type_id) {
            rdv_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[this.rdv_type_id]);
        }

        author_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID]);
        cr_file_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[FileVO.API_TYPE_ID]);
        this.datatables.push(datatable);
    }

    protected callInitializePlanRDV() {
        this.initializePlanRDV(null, []);
    }
    protected initializePlanRDV(states: { [state_id: number]: string }, additional_fields: Array<ModuleTableField<any>>) {

        if (!this.rdv_type_id) {
            return;
        }

        states = states ? states : {
            [ModuleProgramPlanBase.RDV_STATE_CREATED]: ModuleProgramPlanBase.RDV_STATE_LABELS[ModuleProgramPlanBase.RDV_STATE_CREATED],
            [ModuleProgramPlanBase.RDV_STATE_CONFIRMED]: ModuleProgramPlanBase.RDV_STATE_LABELS[ModuleProgramPlanBase.RDV_STATE_CONFIRMED],
            [ModuleProgramPlanBase.RDV_STATE_PREP_OK]: ModuleProgramPlanBase.RDV_STATE_LABELS[ModuleProgramPlanBase.RDV_STATE_PREP_OK],
            [ModuleProgramPlanBase.RDV_STATE_CR_OK]: ModuleProgramPlanBase.RDV_STATE_LABELS[ModuleProgramPlanBase.RDV_STATE_CR_OK]
        };

        let task_id;
        let target_id;
        let label_field = new ModuleTableField('start_time', ModuleTableField.FIELD_TYPE_timestamp, 'Début', false);
        let facilitator_id;
        let program_id;

        if (!!this.facilitator_type_id) {
            facilitator_id = new ModuleTableField('facilitator_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Animateur', false);
            additional_fields.unshift(facilitator_id);
        }

        if (!!this.target_type_id) {
            target_id = new ModuleTableField('target_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Etablissement', false);
            additional_fields.unshift(target_id);
        }

        additional_fields.unshift(
            label_field,
            new ModuleTableField('end_time', ModuleTableField.FIELD_TYPE_timestamp, 'Fin', false),
            new ModuleTableField('state', ModuleTableField.FIELD_TYPE_enum, ' Statut', true, true, ModuleProgramPlanBase.RDV_STATE_CREATED).setEnumValues(
                states)
        );

        if (!!this.program_type_id) {
            program_id = new ModuleTableField('program_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Programme', false);
            additional_fields.unshift(
                program_id);
        }

        if (!!this.task_type_id) {
            task_id = new ModuleTableField('task_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Tâche', false);
            additional_fields.unshift(
                task_id);
        }

        let datatable = new ModuleTable(this, this.rdv_type_id, additional_fields, null, "RDVs");

        if (!!this.task_type_id) {
            task_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[this.task_type_id]);
        }

        if (!!this.program_type_id) {
            program_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[this.program_type_id]);
        }

        if (!!this.target_type_id) {
            target_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[this.target_type_id]);
        }

        if (!!this.facilitator_type_id) {
            facilitator_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[this.facilitator_type_id]);
        }

        this.datatables.push(datatable);
    }

    protected callInitializePlanProgramFacilitator() {
        this.initializePlanProgramFacilitator([]);
    }

    protected initializePlanProgramFacilitator(additional_fields: Array<ModuleTableField<any>>) {
        if (!this.program_facilitator_type_id) {
            return;
        }

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

    protected callInitializePlanProgramManager() {
        this.initializePlanProgramManager([]);
    }

    protected initializePlanProgramManager(additional_fields: Array<ModuleTableField<any>>) {
        if (!this.program_manager_type_id) {
            return;
        }

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

    protected callInitializePlanProgramTarget() {
        this.initializePlanProgramTarget([]);
    }

    protected initializePlanProgramTarget(additional_fields: Array<ModuleTableField<any>>) {
        if (!this.program_target_type_id) {
            return;
        }

        let target_id = new ModuleTableField('target_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Etablissement', true);
        let program_id = new ModuleTableField('program_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Programme', true);

        additional_fields.unshift(
            target_id,
            program_id
        );

        let datatable = new ModuleTable(this, this.program_target_type_id, additional_fields, null, "Etablissements par programme");
        target_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[this.target_type_id]);
        program_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[this.program_type_id]);
        this.datatables.push(datatable);
    }

    protected callInitializePlanPartner() {
        this.initializePlanPartner([]);
    }

    protected initializePlanPartner(additional_fields: Array<ModuleTableField<any>>) {
        if (!this.partner_type_id) {
            return;
        }

        let label_field = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Nom', false);

        additional_fields.unshift(
            label_field
        );

        let datatable = new ModuleTable(this, this.partner_type_id, additional_fields, label_field, "Partenaires");
        this.datatables.push(datatable);
    }
}