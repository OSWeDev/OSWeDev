import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import TimeHandler from '../../tools/TimeHandler';
import APIControllerWrapper from '../API/APIControllerWrapper';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import UserVO from '../AccessPolicy/vos/UserVO';
import ModuleTableController from '../DAO/ModuleTableController';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import ComputedDatatableFieldVO from '../DAO/vos/datatable/ComputedDatatableFieldVO';
import TimeSegment from '../DataRender/vos/TimeSegment';
import FileVO from '../File/vos/FileVO';
import Dates from '../FormatDatesNombres/Dates/Dates';
import ModuleFormatDatesNombres from '../FormatDatesNombres/ModuleFormatDatesNombres';
import Module from '../Module';
import IPlanContact from './interfaces/IPlanContact';
import IPlanContactType from './interfaces/IPlanContactType';
import IPlanEnseigne from './interfaces/IPlanEnseigne';
import IPlanFacilitator from './interfaces/IPlanFacilitator';
import IPlanFacilitatorRegion from './interfaces/IPlanFacilitatorRegion';
import IPlanManager from './interfaces/IPlanManager';
import IPlanPartner from './interfaces/IPlanPartner';
import IPlanProgram from './interfaces/IPlanProgram';
import IPlanProgramCategory from './interfaces/IPlanProgramCategory';
import IPlanProgramFacilitator from './interfaces/IPlanProgramFacilitator';
import IPlanProgramManager from './interfaces/IPlanProgramManager';
import IPlanProgramTarget from './interfaces/IPlanProgramTarget';
import IPlanRDV from './interfaces/IPlanRDV';
import IPlanRDVCR from './interfaces/IPlanRDVCR';
import IPlanRDVPrep from './interfaces/IPlanRDVPrep';
import IPlanTarget from './interfaces/IPlanTarget';
import IPlanTargetContact from './interfaces/IPlanTargetContact';
import IPlanTargetFacilitator from './interfaces/IPlanTargetFacilitator';
import IPlanTargetGroup from './interfaces/IPlanTargetGroup';
import IPlanTargetGroupContact from './interfaces/IPlanTargetGroupContact';
import IPlanTargetRegion from './interfaces/IPlanTargetRegion';
import IPlanTargetZone from './interfaces/IPlanTargetZone';
import IPlanTask from './interfaces/IPlanTask';
import IPlanTaskType from './interfaces/IPlanTaskType';
import ProgramSegmentParamVO, { ProgramSegmentParamVOStatic } from './vos/ProgramSegmentParamVO';

export default abstract class ModuleProgramPlanBase extends Module {

    public static rdv_date_compute_function_uid: string = 'ModuleProgramPlanBase.rdv_date_compute_function_uid';
    public static facilitator_name_compute_function_uid: string = 'ModuleProgramPlanBase.facilitator_name_compute_function_uid';
    public getRDVsOfProgramSegment: (program_id: number, timeSegment: TimeSegment) => Promise<IPlanRDV[]> = APIControllerWrapper.sah(this.APINAME_GET_RDVS_OF_PROGRAM_SEGMENT);
    public getCRsOfProgramSegment: (program_id: number, timeSegment: TimeSegment) => Promise<IPlanRDVCR[]> = APIControllerWrapper.sah(this.APINAME_GET_CRS_OF_PROGRAM_SEGMENT);
    public getPrepsOfProgramSegment: (program_id: number, timeSegment: TimeSegment) => Promise<IPlanRDVPrep[]> = APIControllerWrapper.sah(this.APINAME_GET_PREPS_OF_PROGRAM_SEGMENT);

    protected constructor(
        name: string,
        reflexiveClassName: string,

        public program_category_type_id: string,
        public program_type_id: string,
        public partner_type_id: string,
        public manager_type_id: string,
        public facilitator_region_type_id: string,
        public enseigne_type_id: string,
        public contact_type_id: string,
        public target_type_id: string,
        public rdv_prep_type_id: string,
        public rdv_cr_type_id: string,
        public rdv_type_id: string,
        public facilitator_type_id: string,
        public program_facilitator_type_id: string,
        public program_manager_type_id: string,
        public program_target_type_id: string,
        public target_contact_type_id: string,
        public task_type_type_id: string,
        public task_type_id: string,
        public target_facilitator_type_id: string,
        public target_group_type_id: string,
        public target_region_type_id: string,
        public target_zone_type_id: string,
        public contact_type_type_id: string,
        public target_group_contact_type_id: string,

        specificImportPath: string) {

        super(name, reflexiveClassName, specificImportPath);

        this.initialize_later();
    }

    get POLICY_GROUP(): string { return AccessPolicyTools.POLICY_GROUP_UID_PREFIX + this.name; }
    get POLICY_BO_ACCESS(): string { return AccessPolicyTools.POLICY_UID_PREFIX + this.name + '.BO_ACCESS'; }
    get POLICY_FO_ACCESS(): string { return AccessPolicyTools.POLICY_UID_PREFIX + this.name + '.FO_ACCESS'; }

    get POLICY_FO_SEE_FC(): string { return AccessPolicyTools.POLICY_UID_PREFIX + this.name + '.FO_SEE_FC'; }
    get POLICY_FO_SEE_ALL_TEAMS(): string { return AccessPolicyTools.POLICY_UID_PREFIX + this.name + '.FO_SEE_ALL_TEAMS'; }
    get POLICY_FO_SEE_OWN_TEAM(): string { return AccessPolicyTools.POLICY_UID_PREFIX + this.name + '.FO_SEE_OWN_TEAM'; }

    get POLICY_FO_EDIT(): string { return AccessPolicyTools.POLICY_UID_PREFIX + this.name + '.FO_EDIT'; }

    get POLICY_FO_CAN_ARCHIVE_RDV(): string { return AccessPolicyTools.POLICY_UID_PREFIX + this.name + '.FO_CAN_ARCHIVE_RDV'; }

    get POLICY_FO_EDIT_OWN_RDVS(): string { return AccessPolicyTools.POLICY_UID_PREFIX + this.name + '.FO_EDIT_OWN_RDVS'; }
    get POLICY_FO_EDIT_OWN_TEAM_RDVS(): string { return AccessPolicyTools.POLICY_UID_PREFIX + this.name + '.FO_EDIT_OWN_TEAM_RDVS'; }
    get POLICY_FO_EDIT_ALL_RDVS(): string { return AccessPolicyTools.POLICY_UID_PREFIX + this.name + '.FO_EDIT_ALL_RDVS'; }

    get APINAME_GET_RDVS_OF_PROGRAM_SEGMENT() { return this.name + "_GET_RDVS_OF_PROGRAM_SEGMENT"; }
    get APINAME_GET_CRS_OF_PROGRAM_SEGMENT() { return this.name + "_GET_CRS_OF_PROGRAM_SEGMENT"; }
    get APINAME_GET_PREPS_OF_PROGRAM_SEGMENT() { return this.name + "_GET_PREPS_OF_PROGRAM_SEGMENT"; }

    get RDV_STATE_LABELS(): string[] {
        return [
            this.name + '.rdv.states.created',
            this.name + '.rdv.states.confirmed',
            this.name + '.rdv.states.prep_ok',
            this.name + '.rdv.states.cr_ok'
        ];
    }
    get RDV_STATE_CREATED(): number { return 0; }
    get RDV_STATE_CONFIRMED(): number { return 1; }
    get RDV_STATE_PREP_OK(): number { return 2; }
    get RDV_STATE_CR_OK(): number { return 3; }

    public initialize() {

        ComputedDatatableFieldVO.define_compute_function(ModuleProgramPlanBase.rdv_date_compute_function_uid, (rdv: IPlanRDV) => Dates.format(rdv.start_time, ModuleFormatDatesNombres.FORMAT_YYYYMMDD + ' ' + TimeHandler.MINUTES_TIME_FOR_INDEX_FORMAT));
        ComputedDatatableFieldVO.define_compute_function(ModuleProgramPlanBase.facilitator_name_compute_function_uid, (facilitator: IPlanFacilitator) => facilitator.firstname + ' ' + facilitator.lastname);
    }

    public initialize_later() {
        this.callInitializePlanContactType();
        this.callInitializePlanTargetGroup();
        this.callInitializePlanTargetRegion();
        this.callInitializePlanTargetZone();
        this.callInitializePlanProgramCategory();
        this.callInitializePlanProgram();
        this.callInitializePlanEnseigne();
        this.callInitializePlanContact();
        this.callInitializePlanTarget();
        this.callInitializePlanFacilitatorRegion();
        this.callInitializePlanPartner();
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
        this.callInitializePlanTargetFacilitator();
        this.callInitializePlanTargetGroupContact();
    }


    public registerApis() {
        const self = this;
        APIControllerWrapper.registerApi(new GetAPIDefinition<ProgramSegmentParamVO, IPlanRDV[]>(
            null,
            self.APINAME_GET_RDVS_OF_PROGRAM_SEGMENT,
            () => [self.rdv_type_id],
            ProgramSegmentParamVOStatic
        ));

        APIControllerWrapper.registerApi(new GetAPIDefinition<ProgramSegmentParamVO, IPlanRDVCR[]>(
            null,
            self.APINAME_GET_CRS_OF_PROGRAM_SEGMENT,
            () => [self.rdv_type_id, self.rdv_cr_type_id],
            ProgramSegmentParamVOStatic
        ));

        if (this.rdv_prep_type_id) {
            APIControllerWrapper.registerApi(new GetAPIDefinition<ProgramSegmentParamVO, IPlanRDVPrep[]>(
                null,
                self.APINAME_GET_PREPS_OF_PROGRAM_SEGMENT,
                () => [self.rdv_type_id, self.rdv_prep_type_id],
                ProgramSegmentParamVOStatic
            ));
        }
    }

    public getRDVState(rdv: IPlanRDV, prep: IPlanRDVPrep, cr: IPlanRDVCR): number {

        if (!rdv) {
            return null;
        }

        if (!rdv.target_validation) {
            return this.RDV_STATE_CREATED;
        }

        if (!prep) {
            return this.RDV_STATE_CONFIRMED;
        }

        if (!cr) {
            return this.RDV_STATE_PREP_OK;
        }

        return this.RDV_STATE_CR_OK;
    }

    protected initializePlanProgramCategory(additional_fields: ModuleTableFieldVO[], vo_constructor: { new(): IPlanProgramCategory }) {
        if (!this.program_category_type_id) {
            return;
        }

        const label_field = ModuleTableFieldController.create_new(this.program_category_type_id, field_names<IPlanProgramCategory>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom', true);

        additional_fields.unshift(
            label_field,
            ModuleTableFieldController.create_new(this.program_category_type_id, field_names<IPlanProgramCategory>().weight, ModuleTableFieldVO.FIELD_TYPE_int, 'Poids', true, true, 0),
            ModuleTableFieldController.create_new(this.program_category_type_id, field_names<IPlanProgramCategory>().description, ModuleTableFieldVO.FIELD_TYPE_string, 'Description', false),
            ModuleTableFieldController.create_new(this.program_category_type_id, field_names<IPlanProgramCategory>().nb_targets, ModuleTableFieldVO.FIELD_TYPE_int, 'Nb. établissements', true, true, 0),
            ModuleTableFieldController.create_new(this.program_category_type_id, field_names<IPlanProgramCategory>().total_days, ModuleTableFieldVO.FIELD_TYPE_int, 'Nb total de jours des programmes', true, true, 0),

            ModuleTableFieldController.create_new(this.program_category_type_id, field_names<IPlanProgramCategory>().start_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Début', false),
            ModuleTableFieldController.create_new(this.program_category_type_id, field_names<IPlanProgramCategory>().end_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Fin', false),

            ModuleTableFieldController.create_new(this.program_category_type_id, field_names<IPlanProgramCategory>().nb_created_targets, ModuleTableFieldVO.FIELD_TYPE_int, 'En attente', true, true, 0),
            ModuleTableFieldController.create_new(this.program_category_type_id, field_names<IPlanProgramCategory>().nb_late_targets, ModuleTableFieldVO.FIELD_TYPE_int, 'En retard', true, true, 0),
            ModuleTableFieldController.create_new(this.program_category_type_id, field_names<IPlanProgramCategory>().nb_ongoing_targets, ModuleTableFieldVO.FIELD_TYPE_int, 'En cours', true, true, 0),
            ModuleTableFieldController.create_new(this.program_category_type_id, field_names<IPlanProgramCategory>().nb_closed_targets, ModuleTableFieldVO.FIELD_TYPE_int, 'Terminés', true, true, 0),
        );

        const datatable = ModuleTableController.create_new(this.name, vo_constructor, label_field, "Catégories de programmes");
    }

    protected initializePlanContactType(additional_fields: ModuleTableFieldVO[], vo_constructor: { new(): IPlanContactType }) {
        if (!this.contact_type_type_id) {
            return;
        }

        const label_field = ModuleTableFieldController.create_new(this.contact_type_type_id, field_names<IPlanContactType>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Type de contact', true);

        additional_fields.unshift(
            label_field
        );

        const datatable = ModuleTableController.create_new(this.name, vo_constructor, label_field, "Types de contact");
    }

    protected initializePlanFacilitatorRegion(additional_fields: ModuleTableFieldVO[], vo_constructor: { new(): IPlanFacilitatorRegion }) {
        if (!this.facilitator_region_type_id) {
            return;
        }

        const label_field = ModuleTableFieldController.create_new(this.facilitator_region_type_id, field_names<IPlanFacilitatorRegion>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom', true);

        additional_fields.unshift(
            label_field
        );

        const datatable = ModuleTableController.create_new(this.name, vo_constructor, label_field, "Régions des animateurs");
    }

    protected initializePlanTargetgroup(additional_fields: ModuleTableFieldVO[], vo_constructor: { new(): IPlanTargetGroup }) {
        if (!this.target_group_type_id) {
            return;
        }

        const label_field = ModuleTableFieldController.create_new(this.target_group_type_id, field_names<IPlanTargetGroup>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom', true);
        const user_id = ModuleTableFieldController.create_new(this.target_group_type_id, field_names<IPlanTargetGroup>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Utilisateur', false);

        additional_fields.unshift(
            label_field,
            user_id
        );

        const datatable = ModuleTableController.create_new(this.name, vo_constructor, label_field, "Groupe d'établissements");

        user_id.set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);
    }

    protected initializePlanTargetRegion(additional_fields: ModuleTableFieldVO[], vo_constructor: { new(): IPlanTargetRegion }) {
        if (!this.target_region_type_id) {
            return;
        }

        const label_field = ModuleTableFieldController.create_new(this.target_region_type_id, field_names<IPlanTargetRegion>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom', true);
        const region_director_uid = ModuleTableFieldController.create_new(this.target_region_type_id, field_names<IPlanTargetRegion>().region_director_uid, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Directeur de région', false);


        additional_fields.unshift(
            label_field,
            region_director_uid
        );

        const datatable = ModuleTableController.create_new(this.name, vo_constructor, label_field, "Régions d'établissements");


        region_director_uid.set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);
    }

    protected initializePlanTargetZone(additional_fields: ModuleTableFieldVO[], vo_constructor: { new(): IPlanTargetZone }) {
        if (!this.target_zone_type_id) {
            return;
        }

        const label_field = ModuleTableFieldController.create_new(this.target_zone_type_id, field_names<IPlanTargetZone>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom', true);
        const zone_manager_uid = ModuleTableFieldController.create_new(this.target_zone_type_id, field_names<IPlanTargetZone>().zone_manager_uid, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Manager de Zone', false);

        let region_id;

        if (this.target_region_type_id) {
            region_id = ModuleTableFieldController.create_new(this.target_zone_type_id, field_names<IPlanTargetZone>().region_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Région', false);
            additional_fields.unshift(region_id);
        }

        additional_fields.unshift(
            label_field,
            zone_manager_uid
        );

        const datatable = ModuleTableController.create_new(this.name, vo_constructor, label_field, "Zones d'établissements");
        if (this.target_region_type_id) {
            region_id.set_many_to_one_target_moduletable_name(this.target_region_type_id);
        }
        zone_manager_uid.set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);
    }

    protected initializePlanContact(additional_fields: ModuleTableFieldVO[], vo_constructor: { new(): IPlanContact }) {
        if (!this.contact_type_id) {
            return;
        }

        const label_field = ModuleTableFieldController.create_new(this.contact_type_id, field_names<IPlanContact>().lastname, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom', true);
        const user_id = ModuleTableFieldController.create_new(this.contact_type_id, field_names<IPlanContact>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Utilisateur', false);

        let contact_type_id = null;

        if (this.contact_type_type_id) {
            contact_type_id = ModuleTableFieldController.create_new(this.contact_type_id, field_names<IPlanContact>().contact_type_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Type de contact', false);
            additional_fields.unshift(contact_type_id);
        }

        additional_fields.unshift(
            user_id,
            ModuleTableFieldController.create_new(this.contact_type_id, field_names<IPlanContact>().firstname, ModuleTableFieldVO.FIELD_TYPE_string, 'Prénom', false),
            label_field,
            ModuleTableFieldController.create_new(this.contact_type_id, field_names<IPlanContact>().mail, ModuleTableFieldVO.FIELD_TYPE_email, 'Mail', false),
            ModuleTableFieldController.create_new(this.contact_type_id, field_names<IPlanContact>().mobile, ModuleTableFieldVO.FIELD_TYPE_string, 'Portable', false),
            ModuleTableFieldController.create_new(this.contact_type_id, field_names<IPlanContact>().infos, ModuleTableFieldVO.FIELD_TYPE_string, 'Infos', false)
        );

        const datatable = ModuleTableController.create_new(this.name, vo_constructor, label_field, "Contacts");
        user_id.set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);

        if (this.contact_type_type_id) {
            contact_type_id.set_many_to_one_target_moduletable_name(this.contact_type_type_id);
        }
    }

    protected initializePlanTargetContact(additional_fields: ModuleTableFieldVO[], vo_constructor: { new(): IPlanTargetContact }) {
        if (!this.target_contact_type_id) {
            return;
        }

        const target_id = ModuleTableFieldController.create_new(this.target_contact_type_id, field_names<IPlanTargetContact>().target_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Cible', true);
        const contact_id = ModuleTableFieldController.create_new(this.target_contact_type_id, field_names<IPlanTargetContact>().contact_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Contact', true);

        additional_fields.unshift(
            target_id,
            contact_id
        );

        const datatable = ModuleTableController.create_new(this.name, vo_constructor, null, "Contacts par cible");
        target_id.set_many_to_one_target_moduletable_name(this.target_type_id);
        contact_id.set_many_to_one_target_moduletable_name(this.contact_type_id);
    }

    protected initializePlanProgram(additional_fields: ModuleTableFieldVO[], vo_constructor: { new(): IPlanProgram }) {
        if (!this.program_type_id) {
            return;
        }

        const label_field = ModuleTableFieldController.create_new(this.program_type_id, field_names<IPlanProgram>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom', true);
        const category_id = ModuleTableFieldController.create_new(this.program_type_id, field_names<IPlanProgram>().category_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Catégorie', false);

        additional_fields.unshift(
            label_field,
            category_id,
            ModuleTableFieldController.create_new(this.program_type_id, field_names<IPlanProgram>().start_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Début', false),
            ModuleTableFieldController.create_new(this.program_type_id, field_names<IPlanProgram>().end_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Fin', false),
            ModuleTableFieldController.create_new(this.program_type_id, field_names<IPlanProgram>().days_by_target, ModuleTableFieldVO.FIELD_TYPE_float, 'Nb. de jours par établissement', true, true, 1),
            ModuleTableFieldController.create_new(this.program_type_id, field_names<IPlanProgram>().nb_targets, ModuleTableFieldVO.FIELD_TYPE_int, 'Nb. établissements', true, true, 0),
            ModuleTableFieldController.create_new(this.program_type_id, field_names<IPlanProgram>().nb_created_targets, ModuleTableFieldVO.FIELD_TYPE_int, 'En attente', true, true, 0),
            ModuleTableFieldController.create_new(this.program_type_id, field_names<IPlanProgram>().nb_late_targets, ModuleTableFieldVO.FIELD_TYPE_int, 'En retard', true, true, 0),
            ModuleTableFieldController.create_new(this.program_type_id, field_names<IPlanProgram>().nb_ongoing_targets, ModuleTableFieldVO.FIELD_TYPE_int, 'En cours', true, true, 0),
            ModuleTableFieldController.create_new(this.program_type_id, field_names<IPlanProgram>().nb_closed_targets, ModuleTableFieldVO.FIELD_TYPE_int, 'Terminés', true, true, 0),

            ModuleTableFieldController.create_new(this.program_type_id, field_names<IPlanProgram>().weight, ModuleTableFieldVO.FIELD_TYPE_int, 'Poids', true, true, 0),
            ModuleTableFieldController.create_new(this.program_type_id, field_names<IPlanProgram>().description, ModuleTableFieldVO.FIELD_TYPE_string, 'Description', false)
        );

        const datatable = ModuleTableController.create_new(this.name, vo_constructor, label_field, "Programmes");
        category_id.set_many_to_one_target_moduletable_name(this.program_category_type_id);
    }

    protected initializePlanFacilitator(additional_fields: ModuleTableFieldVO[], vo_constructor: { new(): IPlanFacilitator }) {
        if (!this.facilitator_type_id) {
            return;
        }

        let manager_id;
        let partner_id;
        const label_field = ModuleTableFieldController.create_new(this.facilitator_type_id, field_names<IPlanFacilitator>().lastname, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom', true);
        const user_id = ModuleTableFieldController.create_new(this.facilitator_type_id, field_names<IPlanFacilitator>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Utilisateur', false);
        let region_id;

        additional_fields.unshift(
            user_id);

        if (this.manager_type_id) {
            manager_id = ModuleTableFieldController.create_new(this.facilitator_type_id, field_names<IPlanFacilitator>().manager_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Manager', false);
            additional_fields.unshift(manager_id);
        }

        if (this.partner_type_id) {
            partner_id = ModuleTableFieldController.create_new(this.facilitator_type_id, field_names<IPlanFacilitator>().partner_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Partenaire', false);
            additional_fields.unshift(partner_id);
        }

        if (this.facilitator_region_type_id) {
            region_id = ModuleTableFieldController.create_new(this.facilitator_type_id, field_names<IPlanFacilitator>().region_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Région', false);
            additional_fields.unshift(region_id);
        }

        additional_fields.unshift(
            ModuleTableFieldController.create_new(this.facilitator_type_id, field_names<IPlanFacilitator>().firstname, ModuleTableFieldVO.FIELD_TYPE_string, 'Prénom', false),
            label_field,
            ModuleTableFieldController.create_new(this.facilitator_type_id, field_names<IPlanFacilitator>().activated, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Actif', true, true, true).index()
        );

        const datatable = ModuleTableController.create_new(this.name, vo_constructor, label_field, "Animateurs");
        user_id.set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);

        if (this.manager_type_id) {
            manager_id.set_many_to_one_target_moduletable_name(this.manager_type_id);
        }

        if (this.partner_type_id) {
            partner_id.set_many_to_one_target_moduletable_name(this.partner_type_id);
        }

        if (this.facilitator_region_type_id) {
            region_id.set_many_to_one_target_moduletable_name(this.facilitator_region_type_id);
        }
    }


    protected initializePlanManager(additional_fields: ModuleTableFieldVO[], vo_constructor: { new(): IPlanManager }) {
        if (!this.manager_type_id) {
            return;
        }

        const label_field = ModuleTableFieldController.create_new(this.manager_type_id, field_names<IPlanManager>().lastname, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom', true);
        let partner_id;
        const user_id = ModuleTableFieldController.create_new(this.manager_type_id, field_names<IPlanManager>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Utilisateur', false);

        additional_fields.unshift(user_id);

        if (this.partner_type_id) {
            partner_id = ModuleTableFieldController.create_new(this.manager_type_id, field_names<IPlanManager>().partner_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Partenaire', false);
            additional_fields.unshift(partner_id);
        }

        additional_fields.unshift(
            ModuleTableFieldController.create_new(this.manager_type_id, field_names<IPlanManager>().firstname, ModuleTableFieldVO.FIELD_TYPE_string, 'Prénom', false),
            label_field,
            ModuleTableFieldController.create_new(this.manager_type_id, field_names<IPlanManager>().activated, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Actif', true, true, true).index()
        );

        const datatable = ModuleTableController.create_new(this.name, vo_constructor, label_field, "Managers");
        user_id.set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);

        if (this.partner_type_id) {
            partner_id.set_many_to_one_target_moduletable_name(this.partner_type_id);
        }
    }

    protected initializePlanEnseigne(additional_fields: ModuleTableFieldVO[], vo_constructor: { new(): IPlanEnseigne }) {
        if (!this.enseigne_type_id) {
            return;
        }

        const label_field = ModuleTableFieldController.create_new(this.enseigne_type_id, field_names<IPlanEnseigne>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom', true);

        additional_fields.unshift(
            label_field
        );

        const datatable = ModuleTableController.create_new(this.name, vo_constructor, label_field, "Enseignes");
    }

    protected initializePlanTaskType(additional_fields: ModuleTableFieldVO[], vo_constructor: { new(): IPlanTaskType }) {
        if (!this.task_type_type_id) {
            return;
        }

        const label_field = ModuleTableFieldController.create_new(this.task_type_type_id, field_names<IPlanTaskType>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom', true);

        additional_fields.unshift(
            label_field
        );

        additional_fields.push(
            ModuleTableFieldController.create_new(this.task_type_type_id, field_names<IPlanTaskType>().order_tasks_on_same_target, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Choix automatique de la tâche', true, true, false));
        additional_fields.push(
            ModuleTableFieldController.create_new(this.task_type_type_id, field_names<IPlanTaskType>().weight, ModuleTableFieldVO.FIELD_TYPE_int, 'Poids', true, true, 0));

        const datatable = ModuleTableController.create_new(this.name, vo_constructor, label_field, "Type de tâche");
    }

    protected initializePlanTask(additional_fields: ModuleTableFieldVO[], vo_constructor: { new(): IPlanTask }) {
        if (!this.task_type_id) {
            return;
        }

        const label_field = ModuleTableFieldController.create_new(this.task_type_id, field_names<IPlanTask>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom', true);

        additional_fields.unshift(label_field);

        let task_type_id;
        if (this.task_type_type_id) {
            task_type_id = ModuleTableFieldController.create_new(this.task_type_id, field_names<IPlanTask>().task_type_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Type de tâche', false);
            additional_fields.unshift(task_type_id);
        }

        additional_fields.push(
            ModuleTableFieldController.create_new(this.task_type_id, field_names<IPlanTask>().is_facilitator_specific, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Tâche liée à l\'animateur/admin', true, true, false));
        additional_fields.push(
            ModuleTableFieldController.create_new(this.task_type_id, field_names<IPlanTask>().limit_on_same_target, ModuleTableFieldVO.FIELD_TYPE_int, 'Nombre max de RDV de ce type', false));
        additional_fields.push(
            ModuleTableFieldController.create_new(this.task_type_id, field_names<IPlanTask>().weight, ModuleTableFieldVO.FIELD_TYPE_int, 'Poids', true, true, 0));

        const datatable = ModuleTableController.create_new(this.name, vo_constructor, label_field, "Tâche");
        if (this.task_type_type_id) {
            task_type_id.set_many_to_one_target_moduletable_name(this.task_type_type_id);
        }
    }

    protected initializePlanTarget(additional_fields: ModuleTableFieldVO[], vo_constructor: { new(): IPlanTarget }) {
        if (!this.target_type_id) {
            return;
        }

        const label_field = ModuleTableFieldController.create_new(this.target_type_id, field_names<IPlanTarget>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom', true);
        let enseigne_id;
        let zone_id;
        let group_id;
        additional_fields.unshift(label_field);

        if (this.target_zone_type_id) {
            zone_id = ModuleTableFieldController.create_new(this.target_type_id, field_names<IPlanTarget>().zone_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Zone', false);
            additional_fields.unshift(zone_id);
        }
        if (this.target_group_type_id) {
            group_id = ModuleTableFieldController.create_new(this.target_type_id, field_names<IPlanTarget>().group_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Groupe', false);
            additional_fields.unshift(group_id);
        }
        if (this.enseigne_type_id) {
            enseigne_id = ModuleTableFieldController.create_new(this.target_type_id, field_names<IPlanTarget>().enseigne_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Enseigne', true);
            additional_fields.unshift(enseigne_id);
        }

        additional_fields.unshift(
            ModuleTableFieldController.create_new(this.target_type_id, field_names<IPlanTarget>().address, ModuleTableFieldVO.FIELD_TYPE_string, 'Adresse', false),
            ModuleTableFieldController.create_new(this.target_type_id, field_names<IPlanTarget>().cp, ModuleTableFieldVO.FIELD_TYPE_string, 'Code Postal', false),
            ModuleTableFieldController.create_new(this.target_type_id, field_names<IPlanTarget>().city, ModuleTableFieldVO.FIELD_TYPE_string, 'Ville', false),
            ModuleTableFieldController.create_new(this.target_type_id, field_names<IPlanTarget>().country, ModuleTableFieldVO.FIELD_TYPE_string, 'Pays', false),

            ModuleTableFieldController.create_new(this.target_type_id, field_names<IPlanTarget>().infos_horaires, ModuleTableFieldVO.FIELD_TYPE_string, 'Infos horaires', false),
            ModuleTableFieldController.create_new(this.target_type_id, field_names<IPlanTarget>().activated, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Actif', true, true, true).index()
        );

        const datatable = ModuleTableController.create_new(this.name, vo_constructor, label_field, "Etablissements");

        if (this.enseigne_type_id) {
            enseigne_id.set_many_to_one_target_moduletable_name(this.enseigne_type_id);
        }
        if (this.target_group_type_id) {
            group_id.set_many_to_one_target_moduletable_name(this.target_group_type_id);
        }
        if (this.target_zone_type_id) {
            zone_id.set_many_to_one_target_moduletable_name(this.target_zone_type_id);
        }
    }

    protected initializePlanRDVPrep(additional_fields: ModuleTableFieldVO[], vo_constructor: { new(): IPlanRDVPrep }) {
        if (!this.rdv_prep_type_id) {
            return;
        }

        let rdv_id;
        const prep_file_id = ModuleTableFieldController.create_new(this.rdv_prep_type_id, field_names<IPlanRDVPrep>().prep_file_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Fichier Préparation', false).not_add_to_crud();
        const author_id = ModuleTableFieldController.create_new(this.rdv_prep_type_id, field_names<IPlanRDVPrep>().author_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Auteur', false);

        if (this.rdv_type_id) {
            rdv_id = ModuleTableFieldController.create_new(this.rdv_prep_type_id, field_names<IPlanRDVPrep>().rdv_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'RDV', false);
            additional_fields.unshift(rdv_id);
        }

        additional_fields.unshift(
            author_id,
            prep_file_id
        );

        const datatable = ModuleTableController.create_new(this.name, vo_constructor, null, "Préparations");

        if (this.rdv_type_id) {
            rdv_id.set_many_to_one_target_moduletable_name(this.rdv_type_id);
        }

        author_id.set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);
        prep_file_id.set_many_to_one_target_moduletable_name(FileVO.API_TYPE_ID);
    }

    protected initializePlanRDVCR(additional_fields: ModuleTableFieldVO[], vo_constructor: { new(): IPlanRDVCR }) {
        if (!this.rdv_cr_type_id) {
            return;
        }

        let rdv_id;
        const cr_file_id = ModuleTableFieldController.create_new(this.rdv_cr_type_id, field_names<IPlanRDVCR>().cr_file_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Fichier CR', false).not_add_to_crud();
        const author_id = ModuleTableFieldController.create_new(this.rdv_cr_type_id, field_names<IPlanRDVCR>().author_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Auteur', false);

        if (this.rdv_type_id) {
            rdv_id = ModuleTableFieldController.create_new(this.rdv_cr_type_id, field_names<IPlanRDVCR>().rdv_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'RDV', false);
            additional_fields.unshift(rdv_id);
        }

        additional_fields.unshift(
            author_id,
            cr_file_id
        );

        const datatable = ModuleTableController.create_new(this.name, vo_constructor, null, "Compte-rendus");

        if (this.rdv_type_id) {
            rdv_id.set_many_to_one_target_moduletable_name(this.rdv_type_id);
        }

        author_id.set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);
        cr_file_id.set_many_to_one_target_moduletable_name(FileVO.API_TYPE_ID);
    }

    protected initializePlanRDV(
        states: { [state_id: number]: string },
        additional_fields: ModuleTableFieldVO[], vo_constructor: { new(): IPlanRDV },
        start_time_segmentation_type: number = TimeSegment.TYPE_DAY,
        end_time_segmentation_type: number = TimeSegment.TYPE_DAY,
    ) {

        if (!this.rdv_type_id) {
            return;
        }

        states = states ? states : {
            [this.RDV_STATE_CREATED]: this.RDV_STATE_LABELS[this.RDV_STATE_CREATED],
            [this.RDV_STATE_CONFIRMED]: this.RDV_STATE_LABELS[this.RDV_STATE_CONFIRMED],
            [this.RDV_STATE_PREP_OK]: this.RDV_STATE_LABELS[this.RDV_STATE_PREP_OK],
            [this.RDV_STATE_CR_OK]: this.RDV_STATE_LABELS[this.RDV_STATE_CR_OK]
        };

        let task_id;
        let target_id;
        const label_field = ModuleTableFieldController.create_new(this.rdv_type_id, field_names<IPlanRDV>().start_time, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Début', false).set_segmentation_type(start_time_segmentation_type);
        let facilitator_id;
        let program_id;

        if (this.facilitator_type_id) {
            facilitator_id = ModuleTableFieldController.create_new(this.rdv_type_id, field_names<IPlanRDV>().facilitator_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Animateur', false);
            additional_fields.unshift(facilitator_id);
        }

        if (this.target_type_id) {
            target_id = ModuleTableFieldController.create_new(this.rdv_type_id, field_names<IPlanRDV>().target_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Etablissement', false);
            additional_fields.unshift(target_id);
        }

        additional_fields.unshift(
            label_field,
            ModuleTableFieldController.create_new(this.rdv_type_id, field_names<IPlanRDV>().end_time, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Fin', false).set_segmentation_type(end_time_segmentation_type),
            ModuleTableFieldController.create_new(this.rdv_type_id, field_names<IPlanRDV>().state, ModuleTableFieldVO.FIELD_TYPE_enum, 'Statut', true, true, this.RDV_STATE_CREATED).setEnumValues(
                states),
            ModuleTableFieldController.create_new(this.rdv_type_id, field_names<IPlanRDV>().archived, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Archivé ?', true, true, false)
        );

        if (this.program_type_id) {
            program_id = ModuleTableFieldController.create_new(this.rdv_type_id, field_names<IPlanRDV>().program_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Programme', false);
            additional_fields.unshift(
                program_id);
        }

        if (this.task_type_id) {
            task_id = ModuleTableFieldController.create_new(this.rdv_type_id, field_names<IPlanRDV>().task_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Tâche', false);
            additional_fields.unshift(
                task_id);
        }

        additional_fields.push(ModuleTableFieldController.create_new(this.rdv_type_id, field_names<IPlanRDV>().target_validation, ModuleTableFieldVO.FIELD_TYPE_boolean, 'RDV confirmé', false));

        const datatable = ModuleTableController.create_new(this.name, vo_constructor, null, "RDVs");

        if (this.task_type_id) {
            task_id.set_many_to_one_target_moduletable_name(this.task_type_id);
        }

        if (this.program_type_id) {
            program_id.set_many_to_one_target_moduletable_name(this.program_type_id);
        }

        if (this.target_type_id) {
            target_id.set_many_to_one_target_moduletable_name(this.target_type_id);
        }

        if (this.facilitator_type_id) {
            facilitator_id.set_many_to_one_target_moduletable_name(this.facilitator_type_id);
        }
    }

    protected initializePlanProgramFacilitator(additional_fields: ModuleTableFieldVO[], vo_constructor: { new(): IPlanProgramFacilitator }) {
        if (!this.program_facilitator_type_id) {
            return;
        }

        const facilitator_id = ModuleTableFieldController.create_new(this.program_facilitator_type_id, field_names<IPlanProgramFacilitator>().facilitator_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Animateur', true);
        const program_id = ModuleTableFieldController.create_new(this.program_facilitator_type_id, field_names<IPlanProgramFacilitator>().program_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Programme', true);

        additional_fields.unshift(
            facilitator_id,
            program_id
        );

        const datatable = ModuleTableController.create_new(this.name, vo_constructor, null, "Animateurs par programme");
        facilitator_id.set_many_to_one_target_moduletable_name(this.facilitator_type_id);
        program_id.set_many_to_one_target_moduletable_name(this.program_type_id);
    }

    protected initializePlanProgramManager(additional_fields: ModuleTableFieldVO[], vo_constructor: { new(): IPlanProgramManager }) {
        if (!this.program_manager_type_id) {
            return;
        }

        const manager_id = ModuleTableFieldController.create_new(this.program_manager_type_id, field_names<IPlanProgramManager>().manager_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Manager', true);
        const program_id = ModuleTableFieldController.create_new(this.program_manager_type_id, field_names<IPlanProgramManager>().program_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Programme', true);

        additional_fields.unshift(
            manager_id,
            program_id
        );

        const datatable = ModuleTableController.create_new(this.name, vo_constructor, null, "Animateurs par programme");
        manager_id.set_many_to_one_target_moduletable_name(this.manager_type_id);
        program_id.set_many_to_one_target_moduletable_name(this.program_type_id);
    }

    protected initializePlanProgramTarget(additional_fields: ModuleTableFieldVO[], vo_constructor: { new(): IPlanProgramTarget }) {
        if (!this.program_target_type_id) {
            return;
        }

        const target_id = ModuleTableFieldController.create_new(this.program_target_type_id, field_names<IPlanProgramTarget>().target_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Etablissement', true);
        const program_id = ModuleTableFieldController.create_new(this.program_target_type_id, field_names<IPlanProgramTarget>().program_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Programme', true);

        additional_fields.unshift(
            target_id,
            program_id
        );

        const datatable = ModuleTableController.create_new(this.name, vo_constructor, null, "Etablissements par programme");
        target_id.set_many_to_one_target_moduletable_name(this.target_type_id);
        program_id.set_many_to_one_target_moduletable_name(this.program_type_id);
    }

    protected initializePlanPartner(additional_fields: ModuleTableFieldVO[], vo_constructor: { new(): IPlanPartner }) {
        if (!this.partner_type_id) {
            return;
        }

        const label_field = ModuleTableFieldController.create_new(this.partner_type_id, field_names<IPlanPartner>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom', false);

        additional_fields.unshift(
            label_field
        );

        const datatable = ModuleTableController.create_new(this.name, vo_constructor, label_field, "Partenaires");
    }



    protected initializePlanTargetFacilitator(additional_fields: ModuleTableFieldVO[], vo_constructor: { new(): IPlanTargetFacilitator }) {
        if (!this.target_facilitator_type_id) {
            return;
        }

        const target_id = ModuleTableFieldController.create_new(this.target_facilitator_type_id, field_names<IPlanTargetFacilitator>().target_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Etablissement', true);
        const facilitator_id = ModuleTableFieldController.create_new(this.target_facilitator_type_id, field_names<IPlanTargetFacilitator>().facilitator_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Animateur', true);

        additional_fields.unshift(
            target_id,
            facilitator_id
        );

        const datatable = ModuleTableController.create_new(this.name, vo_constructor, null, "Animateurs par établissements");
        target_id.set_many_to_one_target_moduletable_name(this.target_type_id);
        facilitator_id.set_many_to_one_target_moduletable_name(this.facilitator_type_id);
    }

    protected initializePlanTargetGroupContact(additional_fields: ModuleTableFieldVO[], vo_constructor: { new(): IPlanTargetGroupContact }) {
        if (!this.target_group_contact_type_id) {
            return;
        }

        const target_group_id = ModuleTableFieldController.create_new(this.target_group_contact_type_id, field_names<IPlanTargetGroupContact>().target_group_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, "Groupe d'établissements", true);
        const contact_id = ModuleTableFieldController.create_new(this.target_group_contact_type_id, field_names<IPlanTargetGroupContact>().contact_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Contact', true);

        additional_fields.unshift(
            target_group_id,
            contact_id
        );

        const datatable = ModuleTableController.create_new(this.name, vo_constructor, null, "Contacts par groupe d'établissements");
        target_group_id.set_many_to_one_target_moduletable_name(this.target_group_type_id);
        contact_id.set_many_to_one_target_moduletable_name(this.contact_type_id);
    }

    protected abstract callInitializePlanProgramCategory();
    protected abstract callInitializePlanContactType();
    protected abstract callInitializePlanFacilitatorRegion();
    protected abstract callInitializePlanTargetGroup();
    protected abstract callInitializePlanTargetRegion();
    protected abstract callInitializePlanTargetZone();
    protected abstract callInitializePlanContact();
    protected abstract callInitializePlanTargetContact();
    protected abstract callInitializePlanProgram();
    protected abstract callInitializePlanFacilitator();
    protected abstract callInitializePlanManager();
    protected abstract callInitializePlanEnseigne();
    protected abstract callInitializePlanTaskType();
    protected abstract callInitializePlanTask();
    protected abstract callInitializePlanTarget();
    protected abstract callInitializePlanRDVPrep();
    protected abstract callInitializePlanRDVCR();
    protected abstract callInitializePlanRDV();
    protected abstract callInitializePlanProgramFacilitator();
    protected abstract callInitializePlanProgramManager();
    protected abstract callInitializePlanProgramTarget();
    protected abstract callInitializePlanPartner();
    protected abstract callInitializePlanTargetFacilitator();
    protected abstract callInitializePlanTargetGroupContact();
}