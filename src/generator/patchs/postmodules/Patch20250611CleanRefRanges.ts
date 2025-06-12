/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleOseliaServer from '../../../server/modules/Oselia/ModuleOseliaServer';
import ModuleTranslationServer from '../../../server/modules/Translation/ModuleTranslationServer';
import SuperviseurAssistantTraductionServerController from '../../../server/modules/Translation/SuperviseurAssistantTraductionServerController';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import GPTAssistantAPIAssistantVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantVO';
import { field_names, reflect } from '../../../shared/tools/ObjectHandler';
import IGeneratorWorker from '../../IGeneratorWorker';
import ModuleTableFieldController from '../../../shared/modules/DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import NumRange from '../../../shared/modules/DataRender/vos/NumRange';
import RangeHandler from '../../../shared/tools/RangeHandler';
import NumSegment from '../../../shared/modules/DataRender/vos/NumSegment';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ModuleTableVO from '../../../shared/modules/DAO/vos/ModuleTableVO';
import ModuleTableController from '../../../shared/modules/DAO/ModuleTableController';
import ModulesManager from '../../../shared/modules/ModulesManager';
import Module from '../../../shared/modules/Module';

export default class Patch20250611CleanRefRanges implements IGeneratorWorker {

    private static instance: Patch20250611CleanRefRanges = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20250611CleanRefRanges';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20250611CleanRefRanges {
        if (!Patch20250611CleanRefRanges.instance) {
            Patch20250611CleanRefRanges.instance = new Patch20250611CleanRefRanges();
        }
        return Patch20250611CleanRefRanges.instance;
    }


    public async work(db: IDatabase<any>) {
        for (const vo_type in ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name) {
            const fields: ModuleTableFieldVO[] = [];

            for (const field_name in ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[vo_type]) {
                const field = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[vo_type][field_name];

                if (field.field_type != ModuleTableFieldVO.FIELD_TYPE_refrange_array) {
                    continue;
                }

                fields.push(field);
            }

            if (!fields?.length) {
                continue;
            }

            // On va aller chercher tous les module table fields qui sont des refs de cette table
            let moduleTable: ModuleTableVO = ModuleTableController.module_tables_by_vo_type[vo_type];
    
            if (!moduleTable || !ModulesManager.getModuleByNameAndRole(moduleTable.module_name, Module.SharedModuleRoleName).actif) {
                continue;
            }

            const vos: IDistantVOBase[] = await query(vo_type)
                .exec_as_server()
                .select_vos();

            const vos_to_delete: IDistantVOBase[] = [];
            const vos_to_update: IDistantVOBase[] = [];

            for (const i in vos) {
                const vo: IDistantVOBase = vos[i];
                let to_delete: boolean = false;
                let to_update: boolean = false;

                for (const field of fields) {
                    const field_value: NumRange[] = vo[field.field_name];

                    if (!field_value?.length) {
                        continue;
                    }

                    // On va aller chercher tous les module table fields qui sont des refs de cette table
                    moduleTable = ModuleTableController.module_tables_by_vo_type[field.foreign_ref_vo_type];
            
                    if (!moduleTable || !ModulesManager.getModuleByNameAndRole(moduleTable.module_name, Module.SharedModuleRoleName).actif) {
                        continue;
                    }

                    const ref_vos: IDistantVOBase[] = await query(field.foreign_ref_vo_type)
                        .filter_by_ids(field_value)
                        .exec_as_server()
                        .select_vos();

                    if (ref_vos?.length == RangeHandler.get_all_segmented_elements_from_ranges(field_value).length) {
                        // All ranges are valid, nothing to do
                        continue;
                    }

                    vo[field.field_name] = RangeHandler.create_multiple_NumRange_from_ids(ref_vos.map((ref_vo: IDistantVOBase) => ref_vo.id), NumSegment.TYPE_INT);

                    // Si le champ est requis et qu'on a pas de plages valides, on doit supprimer la ligne
                    if (field.field_required && !vo[field.field_name]?.length) {
                        to_delete = true;
                        break;
                    }

                    to_update = true;
                }

                if (to_delete) {
                    vos_to_delete.push(vo);
                    continue;
                }

                if (to_update) {
                    vos_to_update.push(vo);
                }
            }

            if (vos_to_delete.length) {
                ConsoleHandler.log("Suppression de " + vos_to_delete.length + " VOs (" + vos_to_delete.map((e) => e.id) + ") avec des plages de référence invalides pour le type " + vo_type + " et les champs " + fields.map((field: ModuleTableFieldVO) => field.field_name).join(", "));
                await ModuleDAOServer.instance.deleteVOs_as_server(vos_to_delete);
            }

            if (vos_to_update.length) {
                ConsoleHandler.log("Mise à jour de " + vos_to_update.length + " VOs (" + vos_to_update.map((e) => e.id) + ") avec des plages de référence invalides pour le type " + vo_type + " et les champs " + fields.map((field: ModuleTableFieldVO) => field.field_name).join(", "));
                await ModuleDAOServer.instance.insertOrUpdateVOs_as_server(vos_to_update);
            }
        }
    }
}