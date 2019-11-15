import IVOController from '../../interfaces/IVOController';
import ModuleTable from '../../modules/ModuleTable';
import UserVO from '../AccessPolicy/vos/UserVO';
import ModuleTableField from '../ModuleTableField';
import VOsTypesManager from '../VOsTypesManager';
import moment = require('moment');

export default class VersionedVOController implements IVOController {

    public static INTERFACE_VERSIONED: string = 'IVERSIONED';

    public static getInstance(): VersionedVOController {
        if (!VersionedVOController.instance) {
            VersionedVOController.instance = new VersionedVOController();
        }
        return VersionedVOController.instance;
    }

    private static instance: VersionedVOController = null;
    private static VERSIONED_DATABASE: string = 'versioned';
    private static TRASHED_DATABASE: string = 'trashed';
    private static VERSIONED_TRASHED_DATABASE: string = VersionedVOController.TRASHED_DATABASE + '__' + VersionedVOController.VERSIONED_DATABASE;

    public registeredModuleTables: Array<ModuleTable<any>> = [];

    private constructor() {
    }

    public registerModuleTable(moduleTable: ModuleTable<any>) {
        moduleTable.defineVOInterfaces([VersionedVOController.INTERFACE_VERSIONED]);

        this.registeredModuleTables.push(moduleTable);

        let version_edit_author_id = new ModuleTableField('version_edit_author_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Modificateur', true).hide_from_datatable();
        version_edit_author_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID]);
        version_edit_author_id.setModuleTable(moduleTable);
        let version_author_id = new ModuleTableField('version_author_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Créateur', true).hide_from_datatable();
        version_author_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID]);
        version_author_id.setModuleTable(moduleTable);

        moduleTable.push_field(version_edit_author_id);
        moduleTable.push_field((new ModuleTableField('version_edit_timestamp', ModuleTableField.FIELD_TYPE_tstz, 'Date de modification', false)).setModuleTable(moduleTable));

        moduleTable.push_field(version_author_id);
        moduleTable.push_field((new ModuleTableField('version_timestamp', ModuleTableField.FIELD_TYPE_tstz, 'Date de création', false)).setModuleTable(moduleTable));

        moduleTable.push_field((new ModuleTableField('version_num', ModuleTableField.FIELD_TYPE_int, 'Numéro de version', false)).setModuleTable(moduleTable));

        moduleTable.push_field((new ModuleTableField('trashed', ModuleTableField.FIELD_TYPE_boolean, 'Supprimé', false)).setModuleTable(moduleTable));

        let parent_id = new ModuleTableField('parent_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Parent', false);
        parent_id.addManyToOneRelation(moduleTable);
        parent_id.setModuleTable(moduleTable);
        moduleTable.push_field(parent_id);

        // On copie les champs, pour les 3 tables à créer automatiquement :
        //  - La table versioned
        //  - La table trashed
        //  - La table trashed versioned
        let vo_types: string[] = [
            this.getVersionedVoType(moduleTable.vo_type),
            this.getTrashedVoType(moduleTable.vo_type),
            this.getTrashedVersionedVoType(moduleTable.vo_type),
        ];

        let databases: string[] = [
            VersionedVOController.VERSIONED_DATABASE,
            VersionedVOController.TRASHED_DATABASE,
            VersionedVOController.VERSIONED_TRASHED_DATABASE
        ];

        for (let e in vo_types) {
            let vo_type = vo_types[e];
            let database = databases[e];

            let fields: Array<ModuleTableField<any>> = [];

            for (let i in moduleTable.get_fields()) {
                let vofield = moduleTable.get_fields()[i];

                let cloned_field = new ModuleTableField<any>(vofield.field_id, vofield.field_type, vofield.field_label, vofield.field_required, vofield.has_default, vofield.field_default);
                cloned_field.enum_values = vofield.enum_values;
                cloned_field.is_inclusive_data = vofield.is_inclusive_data;
                cloned_field.is_inclusive_ihm = vofield.is_inclusive_ihm;
                fields.push(cloned_field);
            }

            let importTable: ModuleTable<any> = new ModuleTable<any>(moduleTable.module, vo_type, moduleTable.getNewVO, fields, null, vo_type);
            importTable.set_bdd_ref(database, moduleTable.name);

            for (let i in moduleTable.get_fields()) {
                let vofield = moduleTable.get_fields()[i];

                if (!vofield.has_relation) {
                    continue;
                }

                importTable.getFieldFromId(vofield.field_id).addManyToOneRelation(vofield.manyToOne_target_moduletable);
            }

            moduleTable.module.datatables.push(importTable);
        }
    }

    public recoverOriginalVoTypeFromTrashed(trashedVoType: string): string {
        return trashedVoType.replace('__' + VersionedVOController.TRASHED_DATABASE + '__', '');
    }

    public getVersionedVoType(original_vo_type: string): string {
        return VersionedVOController.VERSIONED_DATABASE + '__' + original_vo_type;
    }

    public getTrashedVoType(original_vo_type: string): string {
        return '__' + VersionedVOController.TRASHED_DATABASE + '__' + original_vo_type;
    }

    public getTrashedVersionedVoType(original_vo_type: string): string {
        return '__' + VersionedVOController.VERSIONED_TRASHED_DATABASE + '__' + original_vo_type;
    }
}