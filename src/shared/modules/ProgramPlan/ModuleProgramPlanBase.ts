import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import TimeHandler from '../../tools/TimeHandler';
import UserVO from '../AccessPolicy/vos/UserVO';
import APIControllerWrapper from '../API/APIControllerWrapper';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import ComputedDatatableFieldVO from '../DAO/vos/datatable/ComputedDatatableFieldVO';
import TimeSegment from '../DataRender/vos/TimeSegment';
import FileVO from '../File/vos/FileVO';
import Dates from '../FormatDatesNombres/Dates/Dates';
import ModuleFormatDatesNombres from '../FormatDatesNombres/ModuleFormatDatesNombres';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import VOsTypesManager from '../VO/manager/VOsTypesManager';
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
        let self = this;
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

        if (!!this.rdv_prep_type_id) {
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

    protected abstract callInitializePlanProgramCategory();
    protected initializePlanProgramCategory(additional_fields: Array<ModuleTableField<any>>, constructor: () => IPlanProgramCategory) {
        if (!this.program_category_type_id) {
            return;
        }

        let label_field = new ModuleTableField(field_names<IPlanProgramCategory>().name, ModuleTableField.FIELD_TYPE_string, 'Nom', true);

        additional_fields.unshift(
            label_field,
            new ModuleTableField(field_names<IPlanProgramCategory>().weight, ModuleTableField.FIELD_TYPE_int, 'Poids', true, true, 0),
            new ModuleTableField(field_names<IPlanProgramCategory>().description, ModuleTableField.FIELD_TYPE_string, 'Description', false),
            new ModuleTableField(field_names<IPlanProgramCategory>().nb_targets, ModuleTableField.FIELD_TYPE_int, 'Nb. établissements', true, true, 0),
            new ModuleTableField(field_names<IPlanProgramCategory>().total_days, ModuleTableField.FIELD_TYPE_int, 'Nb total de jours des programmes', true, true, 0),

            new ModuleTableField(field_names<IPlanProgramCategory>().start_date, ModuleTableField.FIELD_TYPE_tstz, 'Début', false),
            new ModuleTableField(field_names<IPlanProgramCategory>().end_date, ModuleTableField.FIELD_TYPE_tstz, 'Fin', false),

            new ModuleTableField(field_names<IPlanProgramCategory>().nb_created_targets, ModuleTableField.FIELD_TYPE_int, 'En attente', true, true, 0),
            new ModuleTableField(field_names<IPlanProgramCategory>().nb_late_targets, ModuleTableField.FIELD_TYPE_int, 'En retard', true, true, 0),
            new ModuleTableField(field_names<IPlanProgramCategory>().nb_ongoing_targets, ModuleTableField.FIELD_TYPE_int, 'En cours', true, true, 0),
            new ModuleTableField(field_names<IPlanProgramCategory>().nb_closed_targets, ModuleTableField.FIELD_TYPE_int, 'Terminés', true, true, 0),
        );

        let datatable = new ModuleTable(this, this.program_category_type_id, constructor, additional_fields, label_field, "Catégories de programmes");
        this.datatables.push(datatable);
    }

    protected abstract callInitializePlanContactType();
    protected initializePlanContactType(additional_fields: Array<ModuleTableField<any>>, constructor: () => IPlanContactType) {
        if (!this.contact_type_type_id) {
            return;
        }

        let label_field = new ModuleTableField(field_names<IPlanContactType>().name, ModuleTableField.FIELD_TYPE_string, 'Type de contact', true);

        additional_fields.unshift(
            label_field
        );

        let datatable = new ModuleTable(this, this.contact_type_type_id, constructor, additional_fields, label_field, "Types de contact");
        this.datatables.push(datatable);
    }

    protected abstract callInitializePlanFacilitatorRegion();
    protected initializePlanFacilitatorRegion(additional_fields: Array<ModuleTableField<any>>, constructor: () => IPlanFacilitatorRegion) {
        if (!this.facilitator_region_type_id) {
            return;
        }

        let label_field = new ModuleTableField(field_names<IPlanFacilitatorRegion>().name, ModuleTableField.FIELD_TYPE_string, 'Nom', true);

        additional_fields.unshift(
            label_field
        );

        let datatable = new ModuleTable(this, this.facilitator_region_type_id, constructor, additional_fields, label_field, "Régions des animateurs");
        this.datatables.push(datatable);
    }

    protected abstract callInitializePlanTargetGroup();
    protected initializePlanTargetgroup(additional_fields: Array<ModuleTableField<any>>, constructor: () => IPlanTargetGroup) {
        if (!this.target_group_type_id) {
            return;
        }

        let label_field = new ModuleTableField(field_names<IPlanTargetGroup>().name, ModuleTableField.FIELD_TYPE_string, 'Nom', true);
        let user_id = new ModuleTableField(field_names<IPlanTargetGroup>().user_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Utilisateur', false);

        additional_fields.unshift(
            label_field,
            user_id
        );

        let datatable = new ModuleTable(this, this.target_group_type_id, constructor, additional_fields, label_field, "Groupe d'établissements");

        user_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID]);
        this.datatables.push(datatable);
    }

    protected abstract callInitializePlanTargetRegion();
    protected initializePlanTargetRegion(additional_fields: Array<ModuleTableField<any>>, constructor: () => IPlanTargetRegion) {
        if (!this.target_region_type_id) {
            return;
        }

        let label_field = new ModuleTableField(field_names<IPlanTargetRegion>().name, ModuleTableField.FIELD_TYPE_string, 'Nom', true);
        let region_director_uid = new ModuleTableField(field_names<IPlanTargetRegion>().region_director_uid, ModuleTableField.FIELD_TYPE_foreign_key, 'Directeur de région', false);


        additional_fields.unshift(
            label_field,
            region_director_uid
        );

        let datatable = new ModuleTable(this, this.target_region_type_id, constructor, additional_fields, label_field, "Régions d'établissements");


        region_director_uid.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID]);
        this.datatables.push(datatable);
    }

    protected abstract callInitializePlanTargetZone();
    protected initializePlanTargetZone(additional_fields: Array<ModuleTableField<any>>, constructor: () => IPlanTargetZone) {
        if (!this.target_zone_type_id) {
            return;
        }

        let label_field = new ModuleTableField(field_names<IPlanTargetZone>().name, ModuleTableField.FIELD_TYPE_string, 'Nom', true);
        let zone_manager_uid = new ModuleTableField(field_names<IPlanTargetZone>().zone_manager_uid, ModuleTableField.FIELD_TYPE_foreign_key, 'Manager de Zone', false);

        let region_id;

        if (!!this.target_region_type_id) {
            region_id = new ModuleTableField(field_names<IPlanTargetZone>().region_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Région', false);
            additional_fields.unshift(region_id);
        }

        additional_fields.unshift(
            label_field,
            zone_manager_uid
        );

        let datatable = new ModuleTable(this, this.target_zone_type_id, constructor, additional_fields, label_field, "Zones d'établissements");
        if (!!this.target_region_type_id) {
            region_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[this.target_region_type_id]);
        }
        zone_manager_uid.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID]);
        this.datatables.push(datatable);
    }

    protected abstract callInitializePlanContact();
    protected initializePlanContact(additional_fields: Array<ModuleTableField<any>>, constructor: () => IPlanContact) {
        if (!this.contact_type_id) {
            return;
        }

        let label_field = new ModuleTableField(field_names<IPlanContact>().lastname, ModuleTableField.FIELD_TYPE_string, 'Nom', true);
        let user_id = new ModuleTableField(field_names<IPlanContact>().user_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Utilisateur', false);

        let contact_type_id = null;

        if (!!this.contact_type_type_id) {
            contact_type_id = new ModuleTableField(field_names<IPlanContact>().contact_type_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Type de contact', false);
            additional_fields.unshift(contact_type_id);
        }

        additional_fields.unshift(
            user_id,
            new ModuleTableField(field_names<IPlanContact>().firstname, ModuleTableField.FIELD_TYPE_string, 'Prénom', false),
            label_field,
            new ModuleTableField(field_names<IPlanContact>().mail, ModuleTableField.FIELD_TYPE_email, 'Mail', false),
            new ModuleTableField(field_names<IPlanContact>().mobile, ModuleTableField.FIELD_TYPE_string, 'Portable', false),
            new ModuleTableField(field_names<IPlanContact>().infos, ModuleTableField.FIELD_TYPE_string, 'Infos', false)
        );

        let datatable = new ModuleTable(this, this.contact_type_id, constructor, additional_fields, label_field, "Contacts");
        user_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID]);

        if (!!this.contact_type_type_id) {
            contact_type_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[this.contact_type_type_id]);
        }

        this.datatables.push(datatable);
    }

    protected abstract callInitializePlanTargetContact();
    protected initializePlanTargetContact(additional_fields: Array<ModuleTableField<any>>, constructor: () => IPlanTargetContact) {
        if (!this.target_contact_type_id) {
            return;
        }

        let target_id = new ModuleTableField(field_names<IPlanTargetContact>().target_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Cible', true);
        let contact_id = new ModuleTableField(field_names<IPlanTargetContact>().contact_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Contact', true);

        additional_fields.unshift(
            target_id,
            contact_id
        );

        let datatable = new ModuleTable(this, this.target_contact_type_id, constructor, additional_fields, null, "Contacts par cible");
        target_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[this.target_type_id]);
        contact_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[this.contact_type_id]);

        this.datatables.push(datatable);
    }

    protected abstract callInitializePlanProgram();
    protected initializePlanProgram(additional_fields: Array<ModuleTableField<any>>, constructor: () => IPlanProgram) {
        if (!this.program_type_id) {
            return;
        }

        let label_field = new ModuleTableField(field_names<IPlanProgram>().name, ModuleTableField.FIELD_TYPE_string, 'Nom', true);
        let category_id = new ModuleTableField(field_names<IPlanProgram>().category_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Catégorie', false);

        additional_fields.unshift(
            label_field,
            category_id,
            new ModuleTableField(field_names<IPlanProgram>().start_date, ModuleTableField.FIELD_TYPE_tstz, 'Début', false),
            new ModuleTableField(field_names<IPlanProgram>().end_date, ModuleTableField.FIELD_TYPE_tstz, 'Fin', false),
            new ModuleTableField(field_names<IPlanProgram>().days_by_target, ModuleTableField.FIELD_TYPE_float, 'Nb. de jours par établissement', true, true, 1),
            new ModuleTableField(field_names<IPlanProgram>().nb_targets, ModuleTableField.FIELD_TYPE_int, 'Nb. établissements', true, true, 0),
            new ModuleTableField(field_names<IPlanProgram>().nb_created_targets, ModuleTableField.FIELD_TYPE_int, 'En attente', true, true, 0),
            new ModuleTableField(field_names<IPlanProgram>().nb_late_targets, ModuleTableField.FIELD_TYPE_int, 'En retard', true, true, 0),
            new ModuleTableField(field_names<IPlanProgram>().nb_ongoing_targets, ModuleTableField.FIELD_TYPE_int, 'En cours', true, true, 0),
            new ModuleTableField(field_names<IPlanProgram>().nb_closed_targets, ModuleTableField.FIELD_TYPE_int, 'Terminés', true, true, 0),

            new ModuleTableField(field_names<IPlanProgram>().weight, ModuleTableField.FIELD_TYPE_int, 'Poids', true, true, 0),
            new ModuleTableField(field_names<IPlanProgram>().description, ModuleTableField.FIELD_TYPE_string, 'Description', false)
        );

        let datatable = new ModuleTable(this, this.program_type_id, constructor, additional_fields, label_field, "Programmes");
        category_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[this.program_category_type_id]);
        this.datatables.push(datatable);
    }

    protected abstract callInitializePlanFacilitator();
    protected initializePlanFacilitator(additional_fields: Array<ModuleTableField<any>>, constructor: () => IPlanFacilitator) {
        if (!this.facilitator_type_id) {
            return;
        }

        let manager_id;
        let partner_id;
        let label_field = new ModuleTableField(field_names<IPlanFacilitator>().lastname, ModuleTableField.FIELD_TYPE_string, 'Nom', true);
        let user_id = new ModuleTableField(field_names<IPlanFacilitator>().user_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Utilisateur', false);
        let region_id;

        additional_fields.unshift(
            user_id);

        if (!!this.manager_type_id) {
            manager_id = new ModuleTableField(field_names<IPlanFacilitator>().manager_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Manager', false);
            additional_fields.unshift(manager_id);
        }

        if (!!this.partner_type_id) {
            partner_id = new ModuleTableField(field_names<IPlanFacilitator>().partner_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Partenaire', false);
            additional_fields.unshift(partner_id);
        }

        if (!!this.facilitator_region_type_id) {
            region_id = new ModuleTableField(field_names<IPlanFacilitator>().region_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Région', false);
            additional_fields.unshift(region_id);
        }

        additional_fields.unshift(
            new ModuleTableField(field_names<IPlanFacilitator>().firstname, ModuleTableField.FIELD_TYPE_string, 'Prénom', false),
            label_field,
            new ModuleTableField(field_names<IPlanFacilitator>().activated, ModuleTableField.FIELD_TYPE_boolean, 'Actif', true, true, true).index()
        );

        let datatable = new ModuleTable(this, this.facilitator_type_id, constructor, additional_fields, label_field, "Animateurs");
        user_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID]);

        if (!!this.manager_type_id) {
            manager_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[this.manager_type_id]);
        }

        if (!!this.partner_type_id) {
            partner_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[this.partner_type_id]);
        }

        if (!!this.facilitator_region_type_id) {
            region_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[this.facilitator_region_type_id]);
        }

        this.datatables.push(datatable);
    }


    protected abstract callInitializePlanManager();
    protected initializePlanManager(additional_fields: Array<ModuleTableField<any>>, constructor: () => IPlanManager) {
        if (!this.manager_type_id) {
            return;
        }

        let label_field = new ModuleTableField(field_names<IPlanManager>().lastname, ModuleTableField.FIELD_TYPE_string, 'Nom', true);
        let partner_id;
        let user_id = new ModuleTableField(field_names<IPlanManager>().user_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Utilisateur', false);

        additional_fields.unshift(user_id);

        if (!!this.partner_type_id) {
            partner_id = new ModuleTableField(field_names<IPlanManager>().partner_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Partenaire', false);
            additional_fields.unshift(partner_id);
        }

        additional_fields.unshift(
            new ModuleTableField(field_names<IPlanManager>().firstname, ModuleTableField.FIELD_TYPE_string, 'Prénom', false),
            label_field,
            new ModuleTableField(field_names<IPlanManager>().activated, ModuleTableField.FIELD_TYPE_boolean, 'Actif', true, true, true).index()
        );

        let datatable = new ModuleTable(this, this.manager_type_id, constructor, additional_fields, label_field, "Managers");
        user_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID]);

        if (!!this.partner_type_id) {
            partner_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[this.partner_type_id]);
        }

        this.datatables.push(datatable);
    }

    protected abstract callInitializePlanEnseigne();
    protected initializePlanEnseigne(additional_fields: Array<ModuleTableField<any>>, constructor: () => IPlanEnseigne) {
        if (!this.enseigne_type_id) {
            return;
        }

        let label_field = new ModuleTableField(field_names<IPlanEnseigne>().name, ModuleTableField.FIELD_TYPE_string, 'Nom', true);

        additional_fields.unshift(
            label_field
        );

        let datatable = new ModuleTable(this, this.enseigne_type_id, constructor, additional_fields, label_field, "Enseignes");
        this.datatables.push(datatable);
    }

    protected abstract callInitializePlanTaskType();
    protected initializePlanTaskType(additional_fields: Array<ModuleTableField<any>>, constructor: () => IPlanTaskType) {
        if (!this.task_type_type_id) {
            return;
        }

        let label_field = new ModuleTableField(field_names<IPlanTaskType>().name, ModuleTableField.FIELD_TYPE_string, 'Nom', true);

        additional_fields.unshift(
            label_field
        );

        additional_fields.push(
            new ModuleTableField(field_names<IPlanTaskType>().order_tasks_on_same_target, ModuleTableField.FIELD_TYPE_boolean, 'Choix automatique de la tâche', true, true, false));
        additional_fields.push(
            new ModuleTableField(field_names<IPlanTaskType>().weight, ModuleTableField.FIELD_TYPE_int, 'Poids', true, true, 0));

        let datatable = new ModuleTable(this, this.task_type_type_id, constructor, additional_fields, label_field, "Type de tâche");
        this.datatables.push(datatable);
    }

    protected abstract callInitializePlanTask();
    protected initializePlanTask(additional_fields: Array<ModuleTableField<any>>, constructor: () => IPlanTask) {
        if (!this.task_type_id) {
            return;
        }

        let label_field = new ModuleTableField(field_names<IPlanTask>().name, ModuleTableField.FIELD_TYPE_string, 'Nom', true);

        additional_fields.unshift(label_field);

        let task_type_id;
        if (!!this.task_type_type_id) {
            task_type_id = new ModuleTableField(field_names<IPlanTask>().task_type_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Type de tâche', false);
            additional_fields.unshift(task_type_id);
        }

        additional_fields.push(
            new ModuleTableField(field_names<IPlanTask>().is_facilitator_specific, ModuleTableField.FIELD_TYPE_boolean, 'Tâche liée à l\'animateur/admin', true, true, false));
        additional_fields.push(
            new ModuleTableField(field_names<IPlanTask>().limit_on_same_target, ModuleTableField.FIELD_TYPE_int, 'Nombre max de RDV de ce type', false));
        additional_fields.push(
            new ModuleTableField(field_names<IPlanTask>().weight, ModuleTableField.FIELD_TYPE_int, 'Poids', true, true, 0));

        let datatable = new ModuleTable(this, this.task_type_id, constructor, additional_fields, label_field, "Tâche");
        if (!!this.task_type_type_id) {
            task_type_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[this.task_type_type_id]);
        }
        this.datatables.push(datatable);
    }

    protected abstract callInitializePlanTarget();
    protected initializePlanTarget(additional_fields: Array<ModuleTableField<any>>, constructor: () => IPlanTarget) {
        if (!this.target_type_id) {
            return;
        }

        let label_field = new ModuleTableField(field_names<IPlanTarget>().name, ModuleTableField.FIELD_TYPE_string, 'Nom', true);
        let enseigne_id;
        let zone_id;
        let group_id;
        additional_fields.unshift(label_field);

        if (!!this.target_zone_type_id) {
            zone_id = new ModuleTableField(field_names<IPlanTarget>().zone_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Zone', false);
            additional_fields.unshift(zone_id);
        }
        if (!!this.target_group_type_id) {
            group_id = new ModuleTableField(field_names<IPlanTarget>().group_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Groupe', false);
            additional_fields.unshift(group_id);
        }
        if (!!this.enseigne_type_id) {
            enseigne_id = new ModuleTableField(field_names<IPlanTarget>().enseigne_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Enseigne', true);
            additional_fields.unshift(enseigne_id);
        }

        additional_fields.unshift(
            new ModuleTableField(field_names<IPlanTarget>().address, ModuleTableField.FIELD_TYPE_string, 'Adresse', false),
            new ModuleTableField(field_names<IPlanTarget>().cp, ModuleTableField.FIELD_TYPE_string, 'Code Postal', false),
            new ModuleTableField(field_names<IPlanTarget>().city, ModuleTableField.FIELD_TYPE_string, 'Ville', false),
            new ModuleTableField(field_names<IPlanTarget>().country, ModuleTableField.FIELD_TYPE_string, 'Pays', false),

            new ModuleTableField(field_names<IPlanTarget>().infos_horaires, ModuleTableField.FIELD_TYPE_string, 'Infos horaires', false),
            new ModuleTableField(field_names<IPlanTarget>().activated, ModuleTableField.FIELD_TYPE_boolean, 'Actif', true, true, true).index()
        );

        let datatable = new ModuleTable(this, this.target_type_id, constructor, additional_fields, label_field, "Etablissements");

        if (!!this.enseigne_type_id) {
            enseigne_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[this.enseigne_type_id]);
        }
        if (!!this.target_group_type_id) {
            group_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[this.target_group_type_id]);
        }
        if (!!this.target_zone_type_id) {
            zone_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[this.target_zone_type_id]);
        }

        this.datatables.push(datatable);
    }

    protected abstract callInitializePlanRDVPrep();
    protected initializePlanRDVPrep(additional_fields: Array<ModuleTableField<any>>, constructor: () => IPlanRDVPrep) {
        if (!this.rdv_prep_type_id) {
            return;
        }

        let rdv_id;
        let prep_file_id = new ModuleTableField(field_names<IPlanRDVPrep>().prep_file_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Fichier Préparation', false).not_add_to_crud();
        let author_id = new ModuleTableField(field_names<IPlanRDVPrep>().author_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Auteur', false);

        if (!!this.rdv_type_id) {
            rdv_id = new ModuleTableField(field_names<IPlanRDVPrep>().rdv_id, ModuleTableField.FIELD_TYPE_foreign_key, 'RDV', false);
            additional_fields.unshift(rdv_id);
        }

        additional_fields.unshift(
            author_id,
            prep_file_id
        );

        let datatable = new ModuleTable(this, this.rdv_prep_type_id, constructor, additional_fields, null, "Préparations");

        if (!!this.rdv_type_id) {
            rdv_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[this.rdv_type_id]);
        }

        author_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID]);
        prep_file_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[FileVO.API_TYPE_ID]);
        this.datatables.push(datatable);
    }

    protected abstract callInitializePlanRDVCR();
    protected initializePlanRDVCR(additional_fields: Array<ModuleTableField<any>>, constructor: () => IPlanRDVCR) {
        if (!this.rdv_cr_type_id) {
            return;
        }

        let rdv_id;
        let cr_file_id = new ModuleTableField(field_names<IPlanRDVCR>().cr_file_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Fichier CR', false).not_add_to_crud();
        let author_id = new ModuleTableField(field_names<IPlanRDVCR>().author_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Auteur', false);

        if (!!this.rdv_type_id) {
            rdv_id = new ModuleTableField(field_names<IPlanRDVCR>().rdv_id, ModuleTableField.FIELD_TYPE_foreign_key, 'RDV', false);
            additional_fields.unshift(rdv_id);
        }

        additional_fields.unshift(
            author_id,
            cr_file_id
        );

        let datatable = new ModuleTable(this, this.rdv_cr_type_id, constructor, additional_fields, null, "Compte-rendus");

        if (!!this.rdv_type_id) {
            rdv_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[this.rdv_type_id]);
        }

        author_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID]);
        cr_file_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[FileVO.API_TYPE_ID]);
        this.datatables.push(datatable);
    }

    protected abstract callInitializePlanRDV();
    protected initializePlanRDV(
        states: { [state_id: number]: string },
        additional_fields: Array<ModuleTableField<any>>, constructor: () => IPlanRDV,
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
        let label_field = new ModuleTableField(field_names<IPlanRDV>().start_time, ModuleTableField.FIELD_TYPE_tstz, 'Début', false).set_segmentation_type(start_time_segmentation_type);
        let facilitator_id;
        let program_id;

        if (!!this.facilitator_type_id) {
            facilitator_id = new ModuleTableField(field_names<IPlanRDV>().facilitator_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Animateur', false);
            additional_fields.unshift(facilitator_id);
        }

        if (!!this.target_type_id) {
            target_id = new ModuleTableField(field_names<IPlanRDV>().target_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Etablissement', false);
            additional_fields.unshift(target_id);
        }

        additional_fields.unshift(
            label_field,
            new ModuleTableField(field_names<IPlanRDV>().end_time, ModuleTableField.FIELD_TYPE_tstz, 'Fin', false).set_segmentation_type(end_time_segmentation_type),
            new ModuleTableField(field_names<IPlanRDV>().state, ModuleTableField.FIELD_TYPE_enum, 'Statut', true, true, this.RDV_STATE_CREATED).setEnumValues(
                states),
            new ModuleTableField(field_names<IPlanRDV>().archived, ModuleTableField.FIELD_TYPE_boolean, 'Archivé ?', true, true, false)
        );

        if (!!this.program_type_id) {
            program_id = new ModuleTableField(field_names<IPlanRDV>().program_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Programme', false);
            additional_fields.unshift(
                program_id);
        }

        if (!!this.task_type_id) {
            task_id = new ModuleTableField(field_names<IPlanRDV>().task_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Tâche', false);
            additional_fields.unshift(
                task_id);
        }

        additional_fields.push(new ModuleTableField(field_names<IPlanRDV>().target_validation, ModuleTableField.FIELD_TYPE_boolean, 'RDV confirmé', false));

        let datatable = new ModuleTable(this, this.rdv_type_id, constructor, additional_fields, null, "RDVs");

        if (!!this.task_type_id) {
            task_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[this.task_type_id]);
        }

        if (!!this.program_type_id) {
            program_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[this.program_type_id]);
        }

        if (!!this.target_type_id) {
            target_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[this.target_type_id]);
        }

        if (!!this.facilitator_type_id) {
            facilitator_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[this.facilitator_type_id]);
        }

        this.datatables.push(datatable);
    }

    protected abstract callInitializePlanProgramFacilitator();
    protected initializePlanProgramFacilitator(additional_fields: Array<ModuleTableField<any>>, constructor: () => IPlanProgramFacilitator) {
        if (!this.program_facilitator_type_id) {
            return;
        }

        let facilitator_id = new ModuleTableField(field_names<IPlanProgramFacilitator>().facilitator_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Animateur', true);
        let program_id = new ModuleTableField(field_names<IPlanProgramFacilitator>().program_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Programme', true);

        additional_fields.unshift(
            facilitator_id,
            program_id
        );

        let datatable = new ModuleTable(this, this.program_facilitator_type_id, constructor, additional_fields, null, "Animateurs par programme");
        facilitator_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[this.facilitator_type_id]);
        program_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[this.program_type_id]);
        this.datatables.push(datatable);
    }

    protected abstract callInitializePlanProgramManager();
    protected initializePlanProgramManager(additional_fields: Array<ModuleTableField<any>>, constructor: () => IPlanProgramManager) {
        if (!this.program_manager_type_id) {
            return;
        }

        let manager_id = new ModuleTableField(field_names<IPlanProgramManager>().manager_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Manager', true);
        let program_id = new ModuleTableField(field_names<IPlanProgramManager>().program_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Programme', true);

        additional_fields.unshift(
            manager_id,
            program_id
        );

        let datatable = new ModuleTable(this, this.program_manager_type_id, constructor, additional_fields, null, "Animateurs par programme");
        manager_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[this.manager_type_id]);
        program_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[this.program_type_id]);
        this.datatables.push(datatable);
    }

    protected abstract callInitializePlanProgramTarget();
    protected initializePlanProgramTarget(additional_fields: Array<ModuleTableField<any>>, constructor: () => IPlanProgramTarget) {
        if (!this.program_target_type_id) {
            return;
        }

        let target_id = new ModuleTableField(field_names<IPlanProgramTarget>().target_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Etablissement', true);
        let program_id = new ModuleTableField(field_names<IPlanProgramTarget>().program_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Programme', true);

        additional_fields.unshift(
            target_id,
            program_id
        );

        let datatable = new ModuleTable(this, this.program_target_type_id, constructor, additional_fields, null, "Etablissements par programme");
        target_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[this.target_type_id]);
        program_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[this.program_type_id]);
        this.datatables.push(datatable);
    }

    protected abstract callInitializePlanPartner();
    protected initializePlanPartner(additional_fields: Array<ModuleTableField<any>>, constructor: () => IPlanPartner) {
        if (!this.partner_type_id) {
            return;
        }

        let label_field = new ModuleTableField(field_names<IPlanPartner>().name, ModuleTableField.FIELD_TYPE_string, 'Nom', false);

        additional_fields.unshift(
            label_field
        );

        let datatable = new ModuleTable(this, this.partner_type_id, constructor, additional_fields, label_field, "Partenaires");
        this.datatables.push(datatable);
    }



    protected abstract callInitializePlanTargetFacilitator();
    protected initializePlanTargetFacilitator(additional_fields: Array<ModuleTableField<any>>, constructor: () => IPlanTargetFacilitator) {
        if (!this.target_facilitator_type_id) {
            return;
        }

        let target_id = new ModuleTableField(field_names<IPlanTargetFacilitator>().target_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Etablissement', true);
        let facilitator_id = new ModuleTableField(field_names<IPlanTargetFacilitator>().facilitator_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Animateur', true);

        additional_fields.unshift(
            target_id,
            facilitator_id
        );

        let datatable = new ModuleTable(this, this.target_facilitator_type_id, constructor, additional_fields, null, "Animateurs par établissements");
        target_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[this.target_type_id]);
        facilitator_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[this.facilitator_type_id]);
        this.datatables.push(datatable);
    }

    protected abstract callInitializePlanTargetGroupContact();
    protected initializePlanTargetGroupContact(additional_fields: Array<ModuleTableField<any>>, constructor: () => IPlanTargetGroupContact) {
        if (!this.target_group_contact_type_id) {
            return;
        }

        let target_group_id = new ModuleTableField(field_names<IPlanTargetGroupContact>().target_group_id, ModuleTableField.FIELD_TYPE_foreign_key, "Groupe d'établissements", true);
        let contact_id = new ModuleTableField(field_names<IPlanTargetGroupContact>().contact_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Contact', true);

        additional_fields.unshift(
            target_group_id,
            contact_id
        );

        let datatable = new ModuleTable(this, this.target_group_contact_type_id, constructor, additional_fields, null, "Contacts par groupe d'établissements");
        target_group_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[this.target_group_type_id]);
        contact_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[this.contact_type_id]);
        this.datatables.push(datatable);
    }
}