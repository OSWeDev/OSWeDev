import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import ModuleTableController from '../DAO/ModuleTableController';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import Module from '../Module';
import VersionedVOController from '../Versioned/VersionedVOController';
import ICheckList from './interfaces/ICheckList';
import ICheckListItem from './interfaces/ICheckListItem';
import ICheckListItemCheckPoints from './interfaces/ICheckListItemCheckPoints';
import ICheckPoint from './interfaces/ICheckPoint';
// import ICheckPointDep from './interfaces/ICheckPointDep';

export default abstract class ModuleCheckListBase extends Module {

    public checklist_name: string = null;

    protected constructor(
        name: string,
        reflexiveClassName: string,

        public checklist_type_id: string,
        public checklistitem_type_id: string,
        public checklistitemcheckpoints_type_id: string,
        public checkpoint_type_id: string,
        // public checkpointdep_type_id: string,
        specificImportPath: string = null) {

        super(name, reflexiveClassName, specificImportPath);

        this.initialize_later();
    }

    get POLICY_GROUP(): string { return AccessPolicyTools.POLICY_GROUP_UID_PREFIX + this.name; }
    get POLICY_BO_ACCESS(): string { return AccessPolicyTools.POLICY_UID_PREFIX + this.name + '.BO_ACCESS'; }
    get POLICY_FO_ACCESS(): string { return AccessPolicyTools.POLICY_UID_PREFIX + this.name + '.FO_ACCESS'; }

    public initialize_later() {
        this.callInitializeCheckList();
        this.callInitializeCheckListItem();
        this.callInitializeCheckPoint();
        this.callInitializeCheckListItemCheckPoints();
        // this.callInitializeCheckPointDep();
    }

    protected initializeCheckList(additional_fields: ModuleTableFieldVO[], constructor: { new(): ICheckList }) {
        if (!this.checklist_type_id) {
            return;
        }

        if (ModuleTableController.module_tables_by_vo_type[this.checklist_type_id]) {
            return;
        }

        const label_field = ModuleTableFieldController.create_new(this.checklist_type_id, field_names<ICheckList>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom', true);

        additional_fields.unshift(
            label_field,
            ModuleTableFieldController.create_new(this.checklist_type_id, field_names<ICheckList>().limit_affichage, ModuleTableFieldVO.FIELD_TYPE_int, 'Nb. limite affichage', false),
            ModuleTableFieldController.create_new(this.checklist_type_id, field_names<ICheckList>().hide_item_description, ModuleTableFieldVO.FIELD_TYPE_boolean, "cacher la desc. de l'item", false, true, false),
            ModuleTableFieldController.create_new(this.checklist_type_id, field_names<ICheckList>().show_legend, ModuleTableFieldVO.FIELD_TYPE_boolean, "afficher la légende", false, true, false),
            ModuleTableFieldController.create_new(this.checklist_type_id, field_names<ICheckList>().show_finalized_btn, ModuleTableFieldVO.FIELD_TYPE_boolean, "Afficher le bouton de finalisation", false, true, false),
        );

        const datatable = ModuleTableController.create_new(this.name, constructor, label_field, "CheckLists");
    }

    protected initializeCheckListItem(additional_fields: ModuleTableFieldVO[], constructor: { new(): ICheckListItem }) {
        if (!this.checklistitem_type_id) {
            return;
        }

        if (ModuleTableController.module_tables_by_vo_type[this.checklistitem_type_id]) {
            return;
        }

        const label_field = ModuleTableFieldController.create_new(this.checklist_type_id, field_names<ICheckListItem>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom', false);
        const checklist_id = ModuleTableFieldController.create_new(this.checklist_type_id, field_names<ICheckListItem>().checklist_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'CheckList', true);

        additional_fields.unshift(
            label_field,
            checklist_id,
            ModuleTableFieldController.create_new(this.checklist_type_id, field_names<ICheckListItem>().explaination, ModuleTableFieldVO.FIELD_TYPE_string, 'Description', false),
            ModuleTableFieldController.create_new(this.checklist_type_id, field_names<ICheckListItem>().archived, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Caché', true, true, false),
            ModuleTableFieldController.create_new(this.checklist_type_id, field_names<ICheckListItem>().finalized, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Checklist finalisé', false, true, false)
        );

        const datatable = ModuleTableController.create_new(this.name, constructor, label_field, "Eléments de la checklist");
        checklist_id.set_many_to_one_target_moduletable_name(this.checklist_type_id);
        VersionedVOController.getInstance().registerModuleTable(datatable);
    }

    protected initializeCheckListItemCheckPoints(additional_fields: ModuleTableFieldVO[], constructor: { new(): ICheckListItemCheckPoints }) {
        if (!this.checklistitemcheckpoints_type_id) {
            return;
        }

        if (ModuleTableController.module_tables_by_vo_type[this.checklistitemcheckpoints_type_id]) {
            return;
        }

        const checklistitem_id = ModuleTableFieldController.create_new(this.checklistitem_type_id, field_names<ICheckListItemCheckPoints>().checklistitem_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Item', true);
        const checkpoint_id = ModuleTableFieldController.create_new(this.checklistitem_type_id, field_names<ICheckListItemCheckPoints>().checkpoint_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'CheckPoint', true);

        additional_fields.unshift(
            checklistitem_id,
            checkpoint_id
        );

        ModuleTableController.create_new(this.name, constructor, null, "CheckListItemCheckPoints");
        checklistitem_id.set_many_to_one_target_moduletable_name(this.checklistitem_type_id);
        checkpoint_id.set_many_to_one_target_moduletable_name(this.checkpoint_type_id);
    }

    protected initializeCheckPoint(additional_fields: ModuleTableFieldVO[], constructor: { new(): ICheckPoint }) {
        if (!this.checkpoint_type_id) {
            return;
        }

        if (ModuleTableController.module_tables_by_vo_type[this.checkpoint_type_id]) {
            return;
        }

        const label_field = ModuleTableFieldController.create_new(this.checkpoint_type_id, field_names<ICheckPoint>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom', true);
        const checklist_id = ModuleTableFieldController.create_new(this.checkpoint_type_id, field_names<ICheckPoint>().checklist_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'CheckList', true);

        additional_fields.unshift(
            label_field,
            ModuleTableFieldController.create_new(this.checkpoint_type_id, field_names<ICheckPoint>().explaination, ModuleTableFieldVO.FIELD_TYPE_string, 'Description', false),
            ModuleTableFieldController.create_new(this.checkpoint_type_id, field_names<ICheckPoint>().item_field_ids, ModuleTableFieldVO.FIELD_TYPE_string_array, 'Champs', false),
            checklist_id,
            ModuleTableFieldController.create_new(this.checkpoint_type_id, field_names<ICheckPoint>().weight, ModuleTableFieldVO.FIELD_TYPE_int, 'Poids', true, true, 0),
            ModuleTableFieldController.create_new(this.checkpoint_type_id, field_names<ICheckPoint>().item_fields_tooltip, ModuleTableFieldVO.FIELD_TYPE_string, 'item_fields_tooltip', false),
        );

        ModuleTableController.create_new(this.name, constructor, label_field, "CheckPoints");
        checklist_id.set_many_to_one_target_moduletable_name(this.checklist_type_id);
    }

    protected abstract callInitializeCheckList(): void;
    protected abstract callInitializeCheckListItem();
    protected abstract callInitializeCheckListItemCheckPoints();
    protected abstract callInitializeCheckPoint();
}