import { cloneDeep } from 'lodash';
import IVOController from '../../interfaces/IVOController';
import ModuleTable from '../../modules/ModuleTable';
import UserVO from '../AccessPolicy/vos/UserVO';
import ModuleTableField from '../ModuleTableField';
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

    /**
     * Local thread cache -----
     */
    public registeredModuleTables: Array<ModuleTable<any>> = [];
    /**
     * ----- Local thread cache
     */

    private constructor() {
    }

    public registerModuleTable(moduleTable: ModuleTable<any>) {
        moduleTable.defineVOInterfaces([VersionedVOController.INTERFACE_VERSIONED]);
        moduleTable.is_versioned = true;

        this.registeredModuleTables.push(moduleTable);

        let version_edit_author_id = new ModuleTableField('version_edit_author_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Modificateur', false).hide_from_datatable();
        version_edit_author_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID]);
        version_edit_author_id.setModuleTable(moduleTable);
        let version_author_id = new ModuleTableField('version_author_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Créateur', false).hide_from_datatable();
        version_author_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID]);
        version_author_id.setModuleTable(moduleTable);

        moduleTable.push_field(version_edit_author_id);
        moduleTable.push_field((new ModuleTableField('version_edit_timestamp', ModuleTableField.FIELD_TYPE_tstz, 'Date de modification', false)).setModuleTable(moduleTable));

        moduleTable.push_field(version_author_id);
        moduleTable.push_field((new ModuleTableField('version_timestamp', ModuleTableField.FIELD_TYPE_tstz, 'Date de création', false)).setModuleTable(moduleTable));

        moduleTable.push_field((new ModuleTableField('version_num', ModuleTableField.FIELD_TYPE_int, 'Numéro de version', false)).setModuleTable(moduleTable));

        moduleTable.push_field((new ModuleTableField('trashed', ModuleTableField.FIELD_TYPE_boolean, 'Supprimé', false)).setModuleTable(moduleTable));

        let parent_id = new ModuleTableField('parent_id', ModuleTableField.FIELD_TYPE_int, 'Parent', false);
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

        let TRASHED_DATABASE: ModuleTable<any> = null;

        for (let e in vo_types) {
            let vo_type = vo_types[e];
            let database = databases[e];

            let fields: Array<ModuleTableField<any>> = [];

            for (let i in moduleTable.get_fields()) {
                let vofield = moduleTable.get_fields()[i];

                let cloned_field = new ModuleTableField<any>(
                    vofield.field_id, vofield.field_type,
                    vofield.field_label ? cloneDeep(vofield.field_label) : null,
                    vofield.field_required, vofield.has_default, vofield.field_default);
                cloned_field.enum_values = vofield.enum_values;
                cloned_field.is_inclusive_data = vofield.is_inclusive_data;
                cloned_field.is_inclusive_ihm = vofield.is_inclusive_ihm;
                fields.push(cloned_field);
            }

            let newTable: ModuleTable<any> = new ModuleTable<any>(moduleTable.module, vo_type, moduleTable.voConstructor, fields, null, vo_type);
            newTable.set_bdd_ref(database, moduleTable.name);
            newTable.set_inherit_rights_from_vo_type(moduleTable.vo_type);

            let tableFields = moduleTable.get_fields();

            for (let i in tableFields) {
                let vofield = tableFields[i];

                if (!vofield.has_relation) {
                    continue;
                }

                // Cas spécifique du lien parent_id, dans le vo trashed_versioned, qui doit pointer sur trashed du coup et pas sur ref
                // et le parent_id du trashed qui pointe sur rien. D'ailleurs dans le trashed et dans le versioned en fait on ne veut pas garder les liens puisque sinon la version peut disparaitre.
                // on doit garder les versions coute que coute et décider au moment de la restauration si oui ou non on peut restaurer (si j'ai un id qui existe plus, soit il existe en trashed de l'autre
                //  type et je propose de restaurer soit il existe pas et pas mandatory donc je mets null soit il existe pas et mandatory et je refuse la restauration (ou on propose de remplacer la liaison))
                if ((vofield.field_id == 'parent_id') && (database == VersionedVOController.VERSIONED_TRASHED_DATABASE)) {
                    newTable.getFieldFromId(vofield.field_id).addManyToOneRelation(TRASHED_DATABASE);
                } else if ((vofield.field_id == 'parent_id') && (database == VersionedVOController.VERSIONED_DATABASE)) {
                    newTable.getFieldFromId(vofield.field_id).addManyToOneRelation(moduleTable);
                } else if ((database == VersionedVOController.VERSIONED_DATABASE) || (database == VersionedVOController.VERSIONED_TRASHED_DATABASE) || (database == VersionedVOController.TRASHED_DATABASE)) {
                    let newField = newTable.getFieldFromId(vofield.field_id);
                    newField.has_relation = false;

                    switch (vofield.field_type) {
                        case ModuleTableField.FIELD_TYPE_refrange_array:
                            newField.field_type = ModuleTableField.FIELD_TYPE_numrange_array;
                            break;
                        default:
                            newField.field_type = ModuleTableField.FIELD_TYPE_int;
                    }
                } else {
                    newTable.getFieldFromId(vofield.field_id).addManyToOneRelation(vofield.manyToOne_target_moduletable);
                }
            }

            if (database == VersionedVOController.TRASHED_DATABASE) {
                TRASHED_DATABASE = newTable;
            }
            moduleTable.module.datatables.push(newTable);
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

    public get_registeredModuleTables_by_vo_type(vo_type: string): ModuleTable<any> {
        let result: Array<ModuleTable<any>> = this.registeredModuleTables.filter((obj) => {
            return obj.vo_type === vo_type;
        });
        if (result.length > 1) {
            console.log("Attention , il y a deux tables de même vo_type !");
        }
        return result[0];
    }

}