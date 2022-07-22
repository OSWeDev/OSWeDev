import { query } from '../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../../../shared/modules/ContextFilter/vos/SortByVO';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import ModuleParams from '../../../../../shared/modules/Params/ModuleParams';
import VarsController from '../../../../../shared/modules/Var/VarsController';
import VarBatchVarPerfVO from '../../../../../shared/modules/Var/vos/VarBatchVarPerfVO';
import VarCacheConfVO from '../../../../../shared/modules/Var/vos/VarCacheConfVO';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import ICronWorker from '../../../Cron/interfaces/ICronWorker';
import VarsServerController from '../../VarsServerController';

export default class UpdateEstimatedDurationsCronWorker implements ICronWorker {

    public static USE_MAX_X_LAST_PERFS_PARAM_NAME: string = 'UpdateEstimatedDurationsCronWorker.USE_MAX_X_LAST_PERFS';
    public static USE_MIN_X_LAST_PERFS_PARAM_NAME: string = 'UpdateEstimatedDurationsCronWorker.USE_MIN_X_LAST_PERFS';

    public static getInstance() {
        if (!UpdateEstimatedDurationsCronWorker.instance) {
            UpdateEstimatedDurationsCronWorker.instance = new UpdateEstimatedDurationsCronWorker();
        }
        return UpdateEstimatedDurationsCronWorker.instance;
    }

    private static instance: UpdateEstimatedDurationsCronWorker = null;

    private constructor() {
    }

    get worker_uid(): string {
        return "UpdateEstimatedDurationsCronWorker";
    }

    /**
     * Objectif : Reprendre les X derniers varbatchvarperfs de chaque var_id et en déduire la valeur actuelle moyenne
     *  de temps estimé par action, pour 1000 cards
     * On accepte de faire le calcul et de changer la conf uniquement si on se base sur un minimum de données de perf
     */
    public async work() {

        let USE_MAX_X_LAST_PERFS = await ModuleParams.getInstance().getParamValueAsInt(UpdateEstimatedDurationsCronWorker.USE_MAX_X_LAST_PERFS_PARAM_NAME, 100);
        let USE_MIN_X_LAST_PERFS = await ModuleParams.getInstance().getParamValueAsInt(UpdateEstimatedDurationsCronWorker.USE_MIN_X_LAST_PERFS_PARAM_NAME, 10);

        let varcacheconfs = [];
        for (let id_s in VarsController.getInstance().var_conf_by_id) {
            let varconf = VarsController.getInstance().var_conf_by_id[id_s];
            let varcacheconf = VarsServerController.getInstance().varcacheconf_by_var_ids[varconf.id];

            let last_x_perfs = await query(VarBatchVarPerfVO.API_TYPE_ID)
                .filter_by_num_eq('var_id', varconf.id)
                .set_limit(USE_MAX_X_LAST_PERFS)
                .set_sort(new SortByVO(VarBatchVarPerfVO.API_TYPE_ID, 'var_batch_perf_id', false))
                .select_vos<VarBatchVarPerfVO>();
            if ((!last_x_perfs) || (last_x_perfs.length < USE_MIN_X_LAST_PERFS)) {
                continue;
            }

            // Pour chaque perf : on calcule la somme des cards et des temps
            //  et on fait la moyenne, pour enfin la mettre à jour dans le varconf
            this.set_mean_estimation(last_x_perfs, 'ctree_ddeps_try_load_cache_complet', varcacheconf);
            this.set_mean_estimation(last_x_perfs, 'ctree_ddeps_load_imports_and_split_nodes', varcacheconf);
            this.set_mean_estimation(last_x_perfs, 'ctree_ddeps_try_load_cache_partiel', varcacheconf);
            this.set_mean_estimation(last_x_perfs, 'ctree_ddeps_get_node_deps', varcacheconf);
            this.set_mean_estimation(last_x_perfs, 'ctree_ddeps_handle_pixellisation', varcacheconf);
            this.set_mean_estimation(last_x_perfs, 'load_nodes_datas', varcacheconf);
            this.set_mean_estimation(last_x_perfs, 'compute_node', varcacheconf);

            varcacheconfs.push(varcacheconf);
        }
        await ModuleDAO.getInstance().insertOrUpdateVOs(varcacheconfs);
    }

    private set_mean_estimation(last_x_perfs: VarBatchVarPerfVO[], perf_name: string, varcacheconf: VarCacheConfVO): number {
        let mean_estimation = this.get_mean_estimation(last_x_perfs, perf_name);

        if (!mean_estimation) {
            ConsoleHandler.getInstance().warn('TODO:A supprimer ? Est-ce normal ? Comment éviter ? set_mean_estimation:' + mean_estimation + ':' + perf_name + ':' + JSON.stringify(last_x_perfs[0]));
            return;
        }
        varcacheconf['estimated_' + perf_name + '_1k_card'] = mean_estimation * 1000;
    }

    private get_mean_estimation(last_x_perfs: VarBatchVarPerfVO[], perf_name: string): number {
        let sum_ms = 0;
        let sum_card = 0;
        for (let perf_i in last_x_perfs) {
            let last_x_perf = last_x_perfs[perf_i];

            if ((!last_x_perf[perf_name]) || (!last_x_perf[perf_name].realised_nb_card)) {
                continue;
            }
            sum_card += last_x_perf[perf_name].realised_nb_card;
            sum_ms += last_x_perf[perf_name].realised_sum_ms;
        }

        return (sum_card > 0) ? sum_ms / sum_card : 0;
    }
}