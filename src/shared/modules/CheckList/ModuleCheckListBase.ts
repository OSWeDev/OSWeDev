import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import VersionedVOController from '../Versioned/VersionedVOController';
import VOsTypesManager from '../VO/manager/VOsTypesManager';
import ICheckList from './interfaces/ICheckList';
import ICheckListItem from './interfaces/ICheckListItem';
import ICheckListItemCheckPoints from './interfaces/ICheckListItemCheckPoints';
import ICheckPoint from './interfaces/ICheckPoint';
// import ICheckPointDep from './interfaces/ICheckPointDep';

export default abstract class ModuleCheckListBase extends Module {

    get POLICY_GROUP(): string { return AccessPolicyTools.POLICY_GROUP_UID_PREFIX + this.name; }
    get POLICY_BO_ACCESS(): string { return AccessPolicyTools.POLICY_UID_PREFIX + this.name + '.BO_ACCESS'; }
    get POLICY_FO_ACCESS(): string { return AccessPolicyTools.POLICY_UID_PREFIX + this.name + '.FO_ACCESS'; }

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

    public initialize_later() {
        this.callInitializeCheckList();
        this.callInitializeCheckListItem();
        this.callInitializeCheckPoint();
        this.callInitializeCheckListItemCheckPoints();
        // this.callInitializeCheckPointDep();
    }

    protected abstract callInitializeCheckList();
    protected initializeCheckList(additional_fields: Array<ModuleTableField<any>>, constructor: () => ICheckList) {
        if (!this.checklist_type_id) {
            return;
        }

        if (VOsTypesManager.moduleTables_by_voType[this.checklist_type_id]) {
            return;
        }

        let label_field = new ModuleTableField(field_names<ICheckList>().name, ModuleTableField.FIELD_TYPE_string, 'Nom', true);

        additional_fields.unshift(
            label_field,
            new ModuleTableField(field_names<ICheckList>().limit_affichage, ModuleTableField.FIELD_TYPE_int, 'Nb. limite affichage', false),
            new ModuleTableField(field_names<ICheckList>().hide_item_description, ModuleTableField.FIELD_TYPE_boolean, "cacher la desc. de l'item", false, true, false),
            new ModuleTableField(field_names<ICheckList>().show_legend, ModuleTableField.FIELD_TYPE_boolean, "afficher la légende", false, true, false),
            new ModuleTableField(field_names<ICheckList>().show_finalized_btn, ModuleTableField.FIELD_TYPE_boolean, "Afficher le bouton de finalisation", false, true, false),
        );

        let datatable = new ModuleTable(this, this.checklist_type_id, constructor, additional_fields, label_field, "CheckLists");
        this.datatables.push(datatable);
    }

    protected abstract callInitializeCheckListItem();
    protected initializeCheckListItem(additional_fields: Array<ModuleTableField<any>>, constructor: () => ICheckListItem) {
        if (!this.checklistitem_type_id) {
            return;
        }

        if (VOsTypesManager.moduleTables_by_voType[this.checklistitem_type_id]) {
            return;
        }

        let label_field = new ModuleTableField(field_names<ICheckListItem>().name, ModuleTableField.FIELD_TYPE_string, 'Nom', false);
        let checklist_id = new ModuleTableField(field_names<ICheckListItem>().checklist_id, ModuleTableField.FIELD_TYPE_foreign_key, 'CheckList', true);

        additional_fields.unshift(
            label_field,
            checklist_id,
            new ModuleTableField(field_names<ICheckListItem>().explaination, ModuleTableField.FIELD_TYPE_string, 'Description', false),
            new ModuleTableField(field_names<ICheckListItem>().archived, ModuleTableField.FIELD_TYPE_boolean, 'Caché', true, true, false),
            new ModuleTableField(field_names<ICheckListItem>().finalized, ModuleTableField.FIELD_TYPE_boolean, 'Checklist finalisé', false, true, false)
        );

        let datatable = new ModuleTable(this, this.checklistitem_type_id, constructor, additional_fields, label_field, "Eléments de la checklist");
        checklist_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[this.checklist_type_id]);
        VersionedVOController.getInstance().registerModuleTable(datatable);
        this.datatables.push(datatable);
    }

    protected abstract callInitializeCheckListItemCheckPoints();
    protected initializeCheckListItemCheckPoints(additional_fields: Array<ModuleTableField<any>>, constructor: () => ICheckListItemCheckPoints) {
        if (!this.checklistitemcheckpoints_type_id) {
            return;
        }

        if (VOsTypesManager.moduleTables_by_voType[this.checklistitemcheckpoints_type_id]) {
            return;
        }

        let checklistitem_id = new ModuleTableField(field_names<ICheckListItemCheckPoints>().checklistitem_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Item', true);
        let checkpoint_id = new ModuleTableField(field_names<ICheckListItemCheckPoints>().checkpoint_id, ModuleTableField.FIELD_TYPE_foreign_key, 'CheckPoint', true);

        additional_fields.unshift(
            checklistitem_id,
            checkpoint_id
        );

        let datatable = new ModuleTable(this, this.checklistitemcheckpoints_type_id, constructor, additional_fields, null, "CheckListItemCheckPoints");
        checklistitem_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[this.checklistitem_type_id]);
        checkpoint_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[this.checkpoint_type_id]);
        this.datatables.push(datatable);
    }

    protected abstract callInitializeCheckPoint();
    protected initializeCheckPoint(additional_fields: Array<ModuleTableField<any>>, constructor: () => ICheckPoint) {
        if (!this.checkpoint_type_id) {
            return;
        }

        if (VOsTypesManager.moduleTables_by_voType[this.checkpoint_type_id]) {
            return;
        }

        let label_field = new ModuleTableField(field_names<ICheckPoint>().name, ModuleTableField.FIELD_TYPE_string, 'Nom', true);
        let checklist_id = new ModuleTableField(field_names<ICheckPoint>().checklist_id, ModuleTableField.FIELD_TYPE_foreign_key, 'CheckList', true);

        additional_fields.unshift(
            label_field,
            new ModuleTableField(field_names<ICheckPoint>().explaination, ModuleTableField.FIELD_TYPE_string, 'Description', false),
            new ModuleTableField(field_names<ICheckPoint>().item_field_ids, ModuleTableField.FIELD_TYPE_string_array, 'Champs', false),
            checklist_id,
            new ModuleTableField(field_names<ICheckPoint>().weight, ModuleTableField.FIELD_TYPE_int, 'Poids', true, true, 0),
            new ModuleTableField(field_names<ICheckPoint>().item_fields_tooltip, ModuleTableField.FIELD_TYPE_string, 'item_fields_tooltip', false),
        );

        let datatable = new ModuleTable(this, this.checkpoint_type_id, constructor, additional_fields, label_field, "CheckPoints");
        checklist_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[this.checklist_type_id]);
        this.datatables.push(datatable);
    }

    // protected abstract callInitializeCheckPointDep();
    // protected initializeCheckPointDep(additional_fields: Array<ModuleTableField<any>>, constructor: () => ICheckPointDep) {
    //     if (!this.checkpointdep_type_id) {
    //         return;
    //     }

    //     let checkpoint_id = new ModuleTableField(field_names<>().checkpoint_id, ModuleTableField.FIELD_TYPE_foreign_key, 'CheckPoint', true);
    //     let dependson_id = new ModuleTableField(field_names<>().dependson_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Dépend de', true);

    //     additional_fields.unshift(
    //         checkpoint_id,
    //         dependson_id
    //     );

    //     let datatable = new ModuleTable(this, this.checkpointdep_type_id, constructor, additional_fields, null, "Dépendances des CheckPoints");
    //     checkpoint_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[this.checkpoint_type_id]);
    //     dependson_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[this.checkpoint_type_id]);
    //     this.datatables.push(datatable);
    // }
}