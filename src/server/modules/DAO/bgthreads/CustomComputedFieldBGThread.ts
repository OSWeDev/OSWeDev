import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../../shared/modules/ContextFilter/vos/SortByVO';
import ModuleTableFieldController from '../../../../shared/modules/DAO/ModuleTableFieldController';
import CustomComputedFieldInitVO from '../../../../shared/modules/DAO/vos/CustomComputedFieldInitVO';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import Module from '../../../../shared/modules/Module';
import ModulesManager from '../../../../shared/modules/ModulesManager';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../../shared/tools/ObjectHandler';
import { all_promises } from '../../../../shared/tools/PromiseTools';
import IBGThread from '../../BGThread/interfaces/IBGThread';
import ModuleBGThreadServer from '../../BGThread/ModuleBGThreadServer';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';

export default class CustomComputedFieldBGThread implements IBGThread {

    private static instance: CustomComputedFieldBGThread = null;

    public current_timeout: number = 10000;
    public MAX_timeout: number = 600000;
    public MIN_timeout: number = 60000;

    private constructor() {
    }

    get name(): string {
        return "CustomComputedFieldBGThread";
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!CustomComputedFieldBGThread.instance) {
            CustomComputedFieldBGThread.instance = new CustomComputedFieldBGThread();
        }
        return CustomComputedFieldBGThread.instance;
    }

    public async work(): Promise<number> {

        try {

            /**
             * On charge les conf en todo
             */
            const todos: CustomComputedFieldInitVO[] =
                await query(CustomComputedFieldInitVO.API_TYPE_ID)
                    .filter_by_num_eq(field_names<CustomComputedFieldInitVO>().state, CustomComputedFieldInitVO.STATE_TODO)
                    .exec_as_server()
                    .select_vos<CustomComputedFieldInitVO>();

            if (!todos || todos.length === 0) {
                return ModuleBGThreadServer.TIMEOUT_COEF_SLEEP;
            }

            /**
             * On les traite un par un
             */
            for (const conf of todos) {

                await this.init_custom_computed_field(conf);
            }
        } catch (error) {
            ConsoleHandler.error("CustomComputedFieldBGThread:work: " + error);
        }

        return ModuleBGThreadServer.TIMEOUT_COEF_SLEEP;
    }

    private async init_custom_computed_field(
        conf: CustomComputedFieldInitVO
    ) {
        /**
         * On doit charger tous les vos petit à petit et faire les calculs vo par vo, puis pusher les modifs
         */

        try {

            // On se donne un promisepipeline de 100
            let offset = conf.next_offset ? conf.next_offset : 0;
            const limit = conf.next_limit ? conf.next_limit : 100;
            let has_more = true;

            const field = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[conf.vo_type][conf.field_name];
            if (!field) {
                throw new Error("Impossible de trouver le champ " + conf.field_name + " pour le type " + conf.vo_type);
            }

            while (has_more) {
                const vos = await query(conf.vo_type)
                    .exec_as_server()
                    .set_limit(limit, offset)
                    .set_sort(new SortByVO(conf.vo_type, field_names<IDistantVOBase>().id, true))
                    .select_vos();

                if (!vos || !vos.length) {
                    has_more = false;
                    break;
                }

                if (vos.length < limit) {
                    has_more = false;
                }

                const promises: Promise<any>[] = [];
                for (const i in vos) {
                    const vo = vos[i];

                    const module = ModulesManager.getModuleByNameAndRole(field.custom_computed_module_name, Module.ServerModuleRoleName);

                    if (!module) {
                        throw new Error("Impossible de trouver le module " + field.custom_computed_module_name + " pour le champ " + field.field_name);
                    }

                    promises.push((async () => {
                        vo[field.field_name] = await (module[field.custom_computed_function_name].bind(module))(vo, field);
                    })());
                }

                await all_promises(promises);

                await ModuleDAOServer.instance.insertOrUpdateVOs_as_server(vos);
                offset += limit;

                if ((offset % 1000 == 0) && (has_more)) {
                    ConsoleHandler.log('ModuleTableDBService:init_custom_computed_field: ' + conf.vo_type + ':' + conf.field_name + ':ongoing... ' + offset + ' records processed.');
                    conf.state = CustomComputedFieldInitVO.STATE_TODO;
                    conf.message = 'ModuleTableDBService:init_custom_computed_field: ' + conf.vo_type + ':' + conf.field_name + ':ongoing... ' + offset + ' records processed.';
                    conf.next_offset = offset;

                    await ModuleDAOServer.instance.insertOrUpdateVO_as_server(conf);
                }
            }

            ConsoleHandler.log('ModuleTableDBService:init_custom_computed_field: ' + conf.vo_type + ':' + conf.field_name + ':done. ' + offset + ' records processed.');

            conf.state = CustomComputedFieldInitVO.STATE_OK;
            conf.message = 'ModuleTableDBService:init_custom_computed_field: ' + conf.vo_type + ':' + conf.field_name + ':done. ' + offset + ' records processed.';
            conf.next_offset = offset;

            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(conf);
        } catch (error) {
            ConsoleHandler.error('ModuleTableDBService:init_custom_computed_field: ' + conf.vo_type + ':' + conf.field_name + ':error. ' + error);
            conf.state = CustomComputedFieldInitVO.STATE_ERROR;
            conf.message = error.toString();

            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(conf);
        }
    }
}