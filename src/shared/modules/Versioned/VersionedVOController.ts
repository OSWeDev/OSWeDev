import IVOController from '../../interfaces/IVOController';
import ModuleDAO from '../../modules/DAO/ModuleDAO';
import ModuleTable from '../../modules/ModuleTable';
import DateHandler from '../../tools/DateHandler';
import moment = require('moment');
import ModuleTableField from '../ModuleTableField';
import ModuleVersioned from './ModuleVersioned';
import VOsTypesManager from '../VOsTypesManager';

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

            for (let i in moduleTable.fields) {
                let vofield = moduleTable.fields[i];

                fields.push(Object.assign(new ModuleTableField<any>(vofield.field_id, vofield.field_type, vofield.field_label, vofield.field_required, vofield.has_default, vofield.field_default), vofield));
            }

            let importTable: ModuleTable<any> = new ModuleTable<any>(moduleTable.module, vo_type, fields, null, vo_type);
            importTable.set_bdd_ref(database, moduleTable.name);
            importTable.getFieldFromId('parent_id').addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[moduleTable.vo_type]);
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