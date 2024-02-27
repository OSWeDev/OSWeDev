import INamedVO from '../../../interfaces/INamedVO';
import ObjectHandler from '../../../tools/ObjectHandler';
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
     * Local thread cache -----
     */
    public static moduleTables_by_voType: { [voType: string]: ModuleTableVO } = {};
    public static moduleTables_by_vo_id: { [vo_id: number]: ModuleTableVO } = {};

    public static moduleTablesFields_by_voType_and_field_name: { [voType: string]: { [field_name: string]: ModuleTableFieldVO } } = {};
    public static moduleTablesFields_by_vo_id_and_field_id: { [vo_id: number]: { [field_id: number]: ModuleTableFieldVO } } = {};
    /**
     * ----- Local thread cache
     */

    /**
     * Renvoie tous les champs qui font référence à ce type
     * @param to_api_type_id
     */
    public static get_type_references(to_api_type_id: string): ModuleTableFieldVO[] {
        if (!VOsTypesManager.types_references[to_api_type_id]) {

            VOsTypesManager.types_references[to_api_type_id] = [];

            for (let api_type_id_i in VOsTypesManager.moduleTables_by_voType) {
                let table = VOsTypesManager.moduleTables_by_voType[api_type_id_i];

                if (api_type_id_i == to_api_type_id) {
                    continue;
                }

                let fields = table.get_fields();
                for (let j in fields) {
                    let field = fields[j];

                    if (!field.has_relation) {
                        continue;
                    }

                    if (field.manyToOne_target_moduletable.vo_type == to_api_type_id) {
                        VOsTypesManager.types_references[to_api_type_id].push(field);
                    }
                }
            }
        }

        return VOsTypesManager.types_references[to_api_type_id];
    }

    public static addAlias(api_type_id_alias: string, vo_type: string) {
        VOsTypesManager.moduleTables_by_voType[api_type_id_alias] = VOsTypesManager.moduleTables_by_voType[vo_type];
    }

    public static registerModuleTable(module_table: ModuleTableVO) {
        if (module_table && module_table.vo_type) {

            VOsTypesManager.moduleTables_by_voType[module_table.vo_type] = module_table;
        }
    }

    public static namedvosArray_to_vosByNames<T extends INamedVO>(vos: T[]): { [name: string]: T } {
        let res: { [name: string]: T } = {};

        for (let i in vos) {
            let vo = vos[i];

            res[vo.name] = vo;
        }

        return res;
    }

    public static vosArray_to_vosByIds<T extends IDistantVOBase>(vos: T[]): { [id: number]: T } {
        let res: { [id: number]: T } = {};

        for (let i in vos) {
            let vo = vos[i];

            res[vo.id] = vo;
        }

        return res;
    }

    public static isManyToManyModuleTable(moduleTable: ModuleTableVO): boolean {

        let manyToOne1: number = null;
        let field_num: number = 0;
        let isManyToMany: boolean = false;
        for (let j in moduleTable.get_fields()) {
            let field: ModuleTableFieldVO = moduleTable.get_fields()[j];

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
            if (!field.many_to_one_target_moduletable_id) {
                isManyToMany = false;
                break;
            }

            field_num++;
            if (field_num > 2) {
                isManyToMany = false;
                break;
            }

            if (!manyToOne1) {
                manyToOne1 = field.many_to_one_target_moduletable_id;
                continue;
            }

            if (manyToOne1 == field.many_to_one_target_moduletable_id) {
                isManyToMany = false;
                break;
            }

            isManyToMany = true;
        }

        return isManyToMany;
    }

    /**
     * ça ne devrait pas changer, du moins pour le moment, après un boot du serveur
     */
    public static get_manyToManyModuleTables(): ModuleTableVO[] {

        if ((!VOsTypesManager.manyToManyModuleTables) || (VOsTypesManager.init_date >= Dates.now() - 60)) {
            let res: ModuleTableVO[] = [];

            for (let i in VOsTypesManager.moduleTables_by_voType) {
                let moduleTable = VOsTypesManager.moduleTables_by_voType[i];

                if (VOsTypesManager.isManyToManyModuleTable(moduleTable)) {
                    res.push(moduleTable);
                }
            }

            VOsTypesManager.manyToManyModuleTables = res;
        }
        return VOsTypesManager.manyToManyModuleTables;
    }

    public static getManyToOneFields(api_type_id: string, ignore_target_types: string[]): ModuleTableFieldVO[] {

        let res: ModuleTableFieldVO[] = [];
        let table = VOsTypesManager.moduleTables_by_voType[api_type_id];
        let fields = table.get_fields();

        for (let j in fields) {
            let field: ModuleTableFieldVO = fields[j];

            // On ignore les 2 fields de service
            if (field.field_name == "id") {
                continue;
            }
            if (field.field_name == "_type") {
                continue;
            }

            if (!field.many_to_one_target_moduletable_id) {
                continue;
            }

            let target_table = VOsTypesManager.moduleTables_by_vo_id[field.many_to_one_target_moduletable_id];
            if (ignore_target_types && (ignore_target_types.indexOf(target_table.vo_type) >= 0)) {
                continue;
            }

            res.push(field);
        }
        return res;
    }

    public static getManyToManyOtherField(manyToManyModuleTable: ModuleTableVO, firstField: ModuleTableFieldVO): ModuleTableFieldVO {

        for (let j in manyToManyModuleTable.get_fields()) {
            let field: ModuleTableFieldVO = manyToManyModuleTable.get_fields()[j];

            // On ignore les 2 fields de service
            if (field.field_name == "id") {
                continue;
            }
            if (field.field_name == "_type") {
                continue;
            }

            if (!field.many_to_one_target_moduletable_id) {
                break;
            }

            if (firstField.many_to_one_target_moduletable_id == field.many_to_one_target_moduletable_id) {
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

        let src_fields = ObjectHandler.mapByStringFieldFromArray(type_src.get_fields(), 'field_id');
        let dest_fields = ObjectHandler.mapByStringFieldFromArray(type_dest.get_fields(), 'field_id');
        for (let i in src_fields) {
            let src_field = src_fields[i];

            if (!dest_fields[src_field.field_name]) {
                deleted_fields.push(src_field);
            } else {
                common_fields.push(src_field);
            }
        }

        for (let i in dest_fields) {
            let dest_field = dest_fields[i];

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

        return VOsTypesManager.moduleTables_by_voType[vo_field_ref.api_type_id].get_field_by_id(vo_field_ref.field_id);
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

    /**
     * ----- Local thread cache
     */
}