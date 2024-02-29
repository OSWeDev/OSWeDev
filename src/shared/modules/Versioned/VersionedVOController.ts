import { cloneDeep } from 'lodash';
import IVOController from '../../interfaces/IVOController';
import { field_names } from '../../tools/ObjectHandler';
import UserVO from '../AccessPolicy/vos/UserVO';
import ModuleTableController from '../DAO/ModuleTableController';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import ModuleTableVO from '../DAO/vos/ModuleTableVO';
import IVersionedVO from './interfaces/IVersionedVO';

export default class VersionedVOController implements IVOController {

    public static INTERFACE_VERSIONED: string = 'IVERSIONED';

    // istanbul ignore next: nothing to test
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
    public registeredModuleTables: ModuleTableVO[] = [];
    /**
     * ----- Local thread cache
     */

    private constructor() {
    }

    public registerModuleTable(moduleTable: ModuleTableVO) {
        moduleTable.is_versioned = true;

        this.registeredModuleTables.push(moduleTable);

        ModuleTableFieldController.create_new(moduleTable.vo_type, field_names<IVersionedVO>().version_edit_author_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Modificateur', false).hide_from_datatable()
            .set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(moduleTable.vo_type, field_names<IVersionedVO>().version_author_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Créateur', false).hide_from_datatable()
            .set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);

        ModuleTableFieldController.create_new(moduleTable.vo_type, field_names<IVersionedVO>().version_edit_timestamp, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de modification', false);
        ModuleTableFieldController.create_new(moduleTable.vo_type, field_names<IVersionedVO>().version_timestamp, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de création', false);
        ModuleTableFieldController.create_new(moduleTable.vo_type, field_names<IVersionedVO>().version_num, ModuleTableFieldVO.FIELD_TYPE_int, 'Numéro de version', false);
        ModuleTableFieldController.create_new(moduleTable.vo_type, field_names<IVersionedVO>().trashed, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Supprimé', false);
        ModuleTableFieldController.create_new(moduleTable.vo_type, field_names<IVersionedVO>().parent_id, ModuleTableFieldVO.FIELD_TYPE_int, 'Parent', false);

        // On copie les champs, pour les 3 tables à créer automatiquement :
        //  - La table versioned
        //  - La table trashed
        //  - La table trashed versioned
        const vo_types: string[] = [
            this.getVersionedVoType(moduleTable.vo_type),
            this.getTrashedVoType(moduleTable.vo_type),
            this.getTrashedVersionedVoType(moduleTable.vo_type),
        ];

        const databases: string[] = [
            VersionedVOController.VERSIONED_DATABASE,
            VersionedVOController.TRASHED_DATABASE,
            VersionedVOController.VERSIONED_TRASHED_DATABASE
        ];

        let TRASHED_DATABASE: ModuleTableVO = null;

        for (const e in vo_types) {
            const vo_type = vo_types[e];
            const database = databases[e];

            const fields: ModuleTableFieldVO[] = [];
            const table_fields = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[moduleTable.vo_type];
            for (const field_name in table_fields) {
                const vofield = table_fields[field_name];

                const cloned_field = ModuleTableFieldController.create_new(
                    vo_type,
                    vofield.field_name, vofield.field_type,
                    (ModuleTableFieldController.default_field_translation_by_vo_type_and_field_name[moduleTable.vo_type] &&
                        ModuleTableFieldController.default_field_translation_by_vo_type_and_field_name[moduleTable.vo_type][vofield.field_name]) ?
                        cloneDeep(ModuleTableFieldController.default_field_translation_by_vo_type_and_field_name[moduleTable.vo_type][vofield.field_name]) : null,
                    vofield.field_required, vofield.has_default, vofield.field_default_value?.value);
                cloned_field.enum_values = vofield.enum_values;
                cloned_field.is_inclusive_data = vofield.is_inclusive_data;
                cloned_field.is_inclusive_ihm = vofield.is_inclusive_ihm;
                fields.push(cloned_field);
            }

            // TODO FIXME le constructeur est clairement pas bon, on utilise le constructeur du main vo, pour les versioned. a priori pas d'impact aujourd'hui, mais c'est complètement faux
            const newTable: ModuleTableVO = ModuleTableController.create_new(moduleTable.module_name, ModuleTableController.vo_constructor_by_vo_type[moduleTable.vo_type], null, vo_type);
            newTable.vo_type = vo_type;
            newTable.set_bdd_ref(database, moduleTable.name);
            newTable.set_inherit_rights_from_vo_type(moduleTable.vo_type);

            const moduleTableFields = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[moduleTable.vo_type];
            const newTableFields = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[vo_type];

            for (const i in moduleTableFields) {
                const vofield = moduleTableFields[i];

                if (!vofield.foreign_ref_vo_type) {
                    continue;
                }

                // Cas spécifique du lien parent_id, dans le vo trashed_versioned, qui doit pointer sur trashed du coup et pas sur ref
                // et le parent_id du trashed qui pointe sur rien. D'ailleurs dans le trashed et dans le versioned en fait on ne veut pas garder les liens puisque sinon la version peut disparaitre.
                // on doit garder les versions coute que coute et décider au moment de la restauration si oui ou non on peut restaurer (si j'ai un id qui existe plus, soit il existe en trashed de l'autre
                //  type et je propose de restaurer soit il existe pas et pas mandatory donc je mets null soit il existe pas et mandatory et je refuse la restauration (ou on propose de remplacer la liaison))
                if ((vofield.field_name == 'parent_id') && (database == VersionedVOController.VERSIONED_TRASHED_DATABASE)) {
                    newTableFields[vofield.field_name].set_many_to_one_target_moduletable_name(TRASHED_DATABASE.vo_type);
                } else if ((vofield.field_name == 'parent_id') && (database == VersionedVOController.VERSIONED_DATABASE)) {
                    newTableFields[vofield.field_name].set_many_to_one_target_moduletable_name(moduleTable.vo_type);
                } else if ((database == VersionedVOController.VERSIONED_DATABASE) || (database == VersionedVOController.VERSIONED_TRASHED_DATABASE) || (database == VersionedVOController.TRASHED_DATABASE)) {
                    const newField = newTableFields[vofield.field_name];
                    newField.foreign_ref_moduletable_id = null;
                    newField.foreign_ref_vo_type = null;

                    switch (vofield.field_type) {
                        case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
                            newField.field_type = ModuleTableFieldVO.FIELD_TYPE_numrange_array;
                            break;
                        default:
                            newField.field_type = ModuleTableFieldVO.FIELD_TYPE_int;
                    }
                } else {
                    newTableFields[vofield.field_name].set_many_to_one_target_moduletable_name(vofield.foreign_ref_vo_type);
                }
            }

            if (database == VersionedVOController.TRASHED_DATABASE) {
                TRASHED_DATABASE = newTable;
            }
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