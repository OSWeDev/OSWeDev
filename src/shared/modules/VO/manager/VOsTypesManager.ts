import INamedVO from '../../../interfaces/INamedVO';
import ObjectHandler from '../../../tools/ObjectHandler';
import ModuleTableController from '../../DAO/ModuleTableController';
import ModuleTableFieldController from '../../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../../DAO/vos/ModuleTableFieldVO';
import ModuleTableVO from '../../DAO/vos/ModuleTableVO';
import Dates from '../../FormatDatesNombres/Dates/Dates';
import IDistantVOBase from '../../IDistantVOBase';

/**
 * VOsTypesManager
 *  - Manager for each VOs Fields
 */
export default class VOsTypesManager {

    /**
     * Renvoie tous les champs qui font référence à ce type
     * @param to_api_type_id
     */
    public static get_type_references(to_api_type_id: string): ModuleTableFieldVO[] {
        if (!VOsTypesManager.types_references[to_api_type_id]) {

            VOsTypesManager.types_references[to_api_type_id] = [];

            for (const api_type_id_i in ModuleTableController.module_tables_by_vo_type) {
                const table = ModuleTableController.module_tables_by_vo_type[api_type_id_i];

                if (api_type_id_i == to_api_type_id) {
                    continue;
                }

                const fields = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[table.vo_type];
                for (const j in fields) {
                    const field = fields[j];

                    if (!field.foreign_ref_vo_type) {
                        continue;
                    }

                    if (field.foreign_ref_vo_type == to_api_type_id) {
                        VOsTypesManager.types_references[to_api_type_id].push(field);
                    }
                }
            }
        }

        return VOsTypesManager.types_references[to_api_type_id];
    }

    public static registerModuleTable(module_table: ModuleTableVO) {
        if (module_table && module_table.vo_type) {

            ModuleTableController.module_tables_by_vo_type[module_table.vo_type] = module_table;
        }
    }

    public static namedvosArray_to_vosByNames<T extends INamedVO>(vos: T[]): { [name: string]: T } {
        const res: { [name: string]: T } = {};

        for (const i in vos) {
            const vo = vos[i];

            res[vo.name] = vo;
        }

        return res;
    }

    public static vosArray_to_vosByIds<T extends IDistantVOBase>(vos: T[]): { [id: number]: T } {
        const res: { [id: number]: T } = {};

        for (const i in vos) {
            const vo = vos[i];

            res[vo.id] = vo;
        }

        return res;
    }

    public static isManyToManyModuleTable(moduleTable: ModuleTableVO): boolean {

        let manyToOne1: string = null;
        let field_num: number = 0;
        let isManyToMany: boolean = false;
        const fields = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[moduleTable.vo_type];
        for (const j in fields) {
            const field: ModuleTableFieldVO = fields[j];

            // On ignore les 2 fields de service
            if (field.field_name == "id") {
                continue;
            }
            if (field.field_name == "_type") {
                continue;
            }

            /**
             * Gestion des tables versionnées N/N
             */
            if (moduleTable.is_versioned) {
                switch (field.field_name) {
                    case 'parent_id':
                    case 'trashed':
                    case 'version_num':
                    case 'version_author_id':
                    case 'version_timestamp':
                    case 'version_edit_author_id':
                    case 'version_edit_timestamp':
                        continue;
                }
            }

            // On défini une table many to many comme une table ayant 2 fields, de type manyToOne vers 2 moduletables différents
            if (!field.foreign_ref_vo_type) {
                return false;
            }

            field_num++;
            if (field_num > 2) {
                return false;
            }

            if (!manyToOne1) {
                manyToOne1 = field.foreign_ref_vo_type;
                continue;
            }

            if (manyToOne1 == field.foreign_ref_vo_type) {
                return false;
            }

            isManyToMany = true;
        }

        return isManyToMany;
    }

    /**
     * ça ne devrait pas changer, du moins pour le moment, après un boot du serveur
     */
    public static get_manyToManyModuleTables(): ModuleTableVO[] {

        if ((!VOsTypesManager.manyToManyModuleTables) || (!VOsTypesManager.init_date_is_passed)) {

            if (VOsTypesManager.init_date >= Dates.now() - 60) {
                const res: ModuleTableVO[] = [];

                for (const i in ModuleTableController.module_tables_by_vo_type) {
                    const moduleTable = ModuleTableController.module_tables_by_vo_type[i];

                    if (VOsTypesManager.isManyToManyModuleTable(moduleTable)) {
                        res.push(moduleTable);
                    }
                }

                VOsTypesManager.manyToManyModuleTables = res;
            } else {
                VOsTypesManager.init_date_is_passed = true;
            }
        }
        return VOsTypesManager.manyToManyModuleTables;
    }

    public static getManyToOneFields(api_type_id: string, ignore_target_types: string[]): ModuleTableFieldVO[] {

        const res: ModuleTableFieldVO[] = [];
        const table = ModuleTableController.module_tables_by_vo_type[api_type_id];
        const fields = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[table.vo_type];

        for (const j in fields) {
            const field: ModuleTableFieldVO = fields[j];

            // On ignore les 2 fields de service
            if (field.field_name == "id") {
                continue;
            }
            if (field.field_name == "_type") {
                continue;
            }

            if (!field.foreign_ref_vo_type) {
                continue;
            }

            const target_table = ModuleTableController.module_tables_by_vo_type[field.foreign_ref_vo_type];
            if (ignore_target_types && (ignore_target_types.indexOf(target_table.vo_type) >= 0)) {
                continue;
            }

            res.push(field);
        }
        return res;
    }

    public static getManyToManyOtherField(manyToManyModuleTable: ModuleTableVO, firstField: ModuleTableFieldVO): ModuleTableFieldVO {

        const fields = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[manyToManyModuleTable.vo_type];
        for (const j in fields) {
            const field: ModuleTableFieldVO = fields[j];

            // On ignore les 2 fields de service
            if (field.field_name == "id") {
                continue;
            }
            if (field.field_name == "_type") {
                continue;
            }

            if (!field.foreign_ref_vo_type) {
                break;
            }

            if (firstField.foreign_ref_vo_type == field.foreign_ref_vo_type) {
                continue;
            }

            return field;
        }
        return null;
    }

    /**
     * Indique dans new_fields et deleted_fields respectivement les nouveaux champs et ceux ayant disparus en passant de type_src à type_dest.
     *  On se base sur le field_id
     * @param type_src La table de l'objet source de la conversion
     * @param type_dest La table de l'objet destination de la conversion
     * @param new_fields Un tableau passé en param et que l'on rempli dans la fonction pour indiquer les champs qui apparaissent dans la cible
     * @param deleted_fields Un tableau passé en param et que l'on rempli dans la fonction pour indiquer les champs qui disparaissent dans la cible
     */
    public static getChangingFieldsFromDifferentApiTypes(
        type_src: ModuleTableVO,
        type_dest: ModuleTableVO,
        common_fields: ModuleTableFieldVO[],
        new_fields: ModuleTableFieldVO[],
        deleted_fields: ModuleTableFieldVO[]) {

        const src_fields = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[type_src.vo_type];
        const dest_fields = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[type_dest.vo_type];
        for (const i in src_fields) {
            const src_field = src_fields[i];

            if (!dest_fields[src_field.field_name]) {
                deleted_fields.push(src_field);
            } else {
                common_fields.push(src_field);
            }
        }

        for (const i in dest_fields) {
            const dest_field = dest_fields[i];

            if (!src_fields[dest_field.field_name]) {
                new_fields.push(dest_field);
            }
        }
    }

    /**
     * Get the field from a vo_field_ref
     *
     * @param {{ api_type_id: string, field_id: string }} vo_field_ref
     * @returns {ModuleTableFieldVO}
     */
    public static get_field_from_vo_field_ref(vo_field_ref: { api_type_id: string, field_id: string }): ModuleTableFieldVO {
        if (!vo_field_ref || !vo_field_ref?.api_type_id || !vo_field_ref?.field_id) {
            return null;
        }

        return ModuleTableController.module_tables_by_vo_type[vo_field_ref.api_type_id].get_field_by_id(vo_field_ref.field_id);
    }

    /**
     * Local thread cache -----
     */
    private static types_references: { [api_type_id: string]: ModuleTableFieldVO[] } = {};
    private static manyToManyModuleTables: ModuleTableVO[] = null;

    /**
     * on voudrait utiliser BGThreadServerController.server_ready mais on peut pas import ça bloc
     *  donc on passe par un pis-aller pour le moment avec juste un délai de 1 minute après le boot du serveur pour accepter de cacher les résultas du get_manyToManyModuleTables
     */
    private static init_date: number = Dates.now();
    private static init_date_is_passed: boolean = false; // Juste pour limiter les appel systématique à Dates.now() pour vérifier si on a passé le délai de 1 minute

    /**
     * ----- Local thread cache
     */
}