import { mean } from 'lodash';
import { query } from '../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../../../shared/modules/ContextFilter/vos/SortByVO';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import ModuleParams from '../../../../../shared/modules/Params/ModuleParams';
import VarsController from '../../../../../shared/modules/Var/VarsController';
import VarBatchPerfVO from '../../../../../shared/modules/Var/vos/VarBatchPerfVO';
import VarBatchVarPerfVO from '../../../../../shared/modules/Var/vos/VarBatchVarPerfVO';
import VarCacheConfVO from '../../../../../shared/modules/Var/vos/VarCacheConfVO';
import VarNodePerfElementVO from '../../../../../shared/modules/Var/vos/VarNodePerfElementVO';
import VarPerfElementVO from '../../../../../shared/modules/Var/vos/VarPerfElementVO';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import RangeHandler from '../../../../../shared/tools/RangeHandler';
import ICronWorker from '../../../Cron/interfaces/ICronWorker';
import VarsServerController from '../../VarsServerController';

export default class UpdateEstimatedDurationsCronWorker implements ICronWorker {

    public static USE_MAX_X_LAST_PERFS_PARAM_NAME: string = 'UpdateEstimatedDurationsCronWorker.USE_MAX_X_LAST_PERFS';
    public static USE_MIN_X_LAST_PERFS_PARAM_NAME: string = 'UpdateEstimatedDurationsCronWorker.USE_MIN_X_LAST_PERFS';

    public static DEBUG_PARAM_NAME: string = 'UpdateEstimatedDurationsCronWorker.DEBUG';

    public static getInstance() {
        if (!UpdateEstimatedDurationsCronWorker.instance) {
            UpdateEstimatedDurationsCronWorker.instance = new UpdateEstimatedDurationsCronWorker();
        }
        return UpdateEstimatedDurationsCronWorker.instance;
    }

    private static instance: UpdateEstimatedDurationsCronWorker = null;

    private batchs_cache: { [batch_id: string]: VarBatchPerfVO } = {};
    private batchs_vars_cache: { [batch_id: string]: VarBatchVarPerfVO[] } = {};

    private USE_MAX_X_LAST_PERFS: number = 0;
    private USE_MIN_X_LAST_PERFS: number = 0;

    private debug: boolean = false;

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

        this.USE_MAX_X_LAST_PERFS = await ModuleParams.getInstance().getParamValueAsInt(UpdateEstimatedDurationsCronWorker.USE_MAX_X_LAST_PERFS_PARAM_NAME, 100);
        this.USE_MIN_X_LAST_PERFS = await ModuleParams.getInstance().getParamValueAsInt(UpdateEstimatedDurationsCronWorker.USE_MIN_X_LAST_PERFS_PARAM_NAME, 10);

        this.debug = await ModuleParams.getInstance().getParamValueAsBoolean(UpdateEstimatedDurationsCronWorker.DEBUG_PARAM_NAME, false);

        this.batchs_cache = {};
        this.batchs_vars_cache = {};

        let varcacheconfs = [];
        for (let id_s in VarsController.getInstance().var_conf_by_id) {
            let varconf = VarsController.getInstance().var_conf_by_id[id_s];
            let varcacheconf = VarsServerController.getInstance().varcacheconf_by_var_ids[varconf.id];

            let last_x_perfs = await query(VarBatchVarPerfVO.API_TYPE_ID)
                .filter_by_num_eq('var_id', varconf.id)
                .set_limit(this.USE_MAX_X_LAST_PERFS * 2)
                .set_sort(new SortByVO(VarBatchVarPerfVO.API_TYPE_ID, 'var_batch_perf_id', false))
                .select_vos<VarBatchVarPerfVO>();
            if ((!last_x_perfs) || (last_x_perfs.length < this.USE_MIN_X_LAST_PERFS)) {
                continue;
            }

            // Pour chaque perf : on calcule la somme des cards et des temps
            //  et on fait la moyenne, pour enfin la mettre à jour dans le varconf

            /**
             * Pour gérer les fameuses promises qui font que la somme des perfs des vars n'est pas égale au temps total puisqu'on
             *  fait les calculs en parallèle, on va donc faire une somme des temps estimés pour chaque perf, faire le ratio vs la perf parente qui doit etre
             *  une perf qui englobe les promises la perf cible. et on remonte jusqu'à une perf qui soit en temps réel (donc pas un groupe de promises)
             * Exemple du ctree_ddeps_try_load_cache_complet:
             *  - ctree_ddeps_try_load_cache_complet, ctree_ddeps_load_imports_and_split_nodes, ctree_ddeps_try_load_cache_partiel, ctree_ddeps_get_node_deps, ctree_ddeps_handle_pixellisation :
             *      - à ce niveau c'est le bordel, les appels sont récursifs, on ne peut pas calculer le temps estimé de cette perf de manière propre
             *          par contre on peut faire une estimation à la louche qui devrait permettre quand même d'estimer un temps pas débile pour l'arbre
             *          (load_caches_and_imports_on_var_to_deploy qui est appelé dans create_tree et handle_deploy_deps qui est appelé dans load_caches_and_imports_on_var_to_deploy ...)
             *      - du coup pour ces 5 perfs, on prend pour chaque perf et chaque var_id, la somme des temps, divisée par la somme des temps toutes vars des 5 perfs,
             *          puis multiplié par le temps global à savoir create_tree (batch perf).
             *  - load_node_datas :
             *      - le load_node_datas est bien appelé en bacth au sein d'un load_nodes_datas (batch perfs) et on peut du coup faire le ratio entre les temps de la var et la somme des temps des vars, puis appliquer le ratio sur le temps réel total
             *  - compute_node :
             *      - le compute_node est bien appelé dans compute_node_wrapper (batch perfs) et on peut donc faire le ratio entre les temps de la var et la somme des temps des vars, puis appliquer le ratio sur le temps réel total
             */
            await this.set_mean_estimation(last_x_perfs, 'ctree_ddeps_try_load_cache_complet', ['ctree_ddeps_try_load_cache_complet', 'ctree_ddeps_load_imports_and_split_nodes', 'ctree_ddeps_try_load_cache_partiel', 'ctree_ddeps_get_node_deps', 'ctree_ddeps_handle_pixellisation'], 'create_tree', varcacheconf);
            await this.set_mean_estimation(last_x_perfs, 'ctree_ddeps_load_imports_and_split_nodes', ['ctree_ddeps_try_load_cache_complet', 'ctree_ddeps_load_imports_and_split_nodes', 'ctree_ddeps_try_load_cache_partiel', 'ctree_ddeps_get_node_deps', 'ctree_ddeps_handle_pixellisation'], 'create_tree', varcacheconf);
            await this.set_mean_estimation(last_x_perfs, 'ctree_ddeps_try_load_cache_partiel', ['ctree_ddeps_try_load_cache_complet', 'ctree_ddeps_load_imports_and_split_nodes', 'ctree_ddeps_try_load_cache_partiel', 'ctree_ddeps_get_node_deps', 'ctree_ddeps_handle_pixellisation'], 'create_tree', varcacheconf);
            await this.set_mean_estimation(last_x_perfs, 'ctree_ddeps_get_node_deps', ['ctree_ddeps_try_load_cache_complet', 'ctree_ddeps_load_imports_and_split_nodes', 'ctree_ddeps_try_load_cache_partiel', 'ctree_ddeps_get_node_deps', 'ctree_ddeps_handle_pixellisation'], 'create_tree', varcacheconf);
            await this.set_mean_estimation(last_x_perfs, 'ctree_ddeps_handle_pixellisation', ['ctree_ddeps_try_load_cache_complet', 'ctree_ddeps_load_imports_and_split_nodes', 'ctree_ddeps_try_load_cache_partiel', 'ctree_ddeps_get_node_deps', 'ctree_ddeps_handle_pixellisation'], 'create_tree', varcacheconf);
            await this.set_mean_estimation(last_x_perfs, 'load_node_datas', ['load_node_datas'], 'load_nodes_datas', varcacheconf);
            await this.set_mean_estimation(last_x_perfs, 'compute_node', ['compute_node'], 'compute_node_wrapper', varcacheconf);

            varcacheconfs.push(varcacheconf);
        }
        await ModuleDAO.getInstance().insertOrUpdateVOs(varcacheconfs);

        this.batchs_cache = {};
        this.batchs_vars_cache = {};
    }

    /**
     * Tout d'abord on filtre les perfs sur ce perf_name pour garder uniquement les perfs qui contiennent un info utile sur ce perf_name
     * @param last_x_perfs les perfs de la dernière période
     * @param perf_name la perf qu'on cible
     * @param ratio_perfs_names les perfs sur lesquels on fait le ratio
     * @param batch_perf_name le nom de la perf du batch sur lequel on applique le ratio
     * @param varcacheconf le varcache conf à modifier
     * @returns
     */
    private async set_mean_estimation(
        last_x_perfs: VarBatchVarPerfVO[],
        perf_name: string,
        ratio_perfs_names: string[],
        batch_perf_name: string,
        varcacheconf: VarCacheConfVO): Promise<void> {

        let valid_last_x_perfs: VarBatchVarPerfVO[] = this.filter_valid_var_perfs_for_perf_name(last_x_perfs, perf_name);
        if ((!valid_last_x_perfs) || (valid_last_x_perfs.length < this.USE_MIN_X_LAST_PERFS)) {
            ConsoleHandler.getInstance().warn(`Not enough valid perfs for perf_name ${perf_name}:var_id:${last_x_perfs[0].var_id}:initially selected perfs:${last_x_perfs.length}:valid perfs:${valid_last_x_perfs ? valid_last_x_perfs.length : 0}`);
            return;
        }

        await this.load_missing_batchs(valid_last_x_perfs);

        let mean_estimation = await this.get_estimation(valid_last_x_perfs, perf_name, ratio_perfs_names, batch_perf_name);
        mean_estimation = mean_estimation ? mean_estimation * 1000 : 0;

        if ((!mean_estimation) || (mean_estimation == varcacheconf['estimated_' + perf_name + '_1k_card'])) {
            return;
        }

        ConsoleHandler.getInstance().log(`Changing estimated_${perf_name}_1k_card from ${varcacheconf['estimated_' + perf_name + '_1k_card']} to ${mean_estimation} for var_id:${last_x_perfs[0].var_id}`);

        varcacheconf['estimated_' + perf_name + '_1k_card'] = mean_estimation;
    }

    /**
     * On fait la somme des ratio_perfs_names toutes vars, et on fait le ratio entre la last_x_perf et la somme toutes vars, ramenée à 1 card, et ramené au temps réel du batch
     * @param last_x_perf les perfs de la dernière période
     * @param perf_name la perf qu'on cible
     * @param ratio_perfs_names les perfs sur lesquels on fait le ratio
     * @param batch_perf_name le nom de la perf du batch sur lequel on applique le ratio
     * @returns l'estimation moyenne
     */
    private get_ratiod_mean(last_x_perf: VarBatchVarPerfVO, perf_name: string, ratio_perfs_names: string[], batch_perf_name: string): number {

        // on fait la somme des batchs_vars_cache de tous les var_id, sur le last_x_perf.var_batch_perf_id
        let batch_id = last_x_perf.var_batch_perf_id;
        let perf = last_x_perf[perf_name] as VarPerfElementVO;
        if ((!perf) || (!perf.realised_sum_ms) || (!perf.realised_nb_card) || (!this.batchs_vars_cache[batch_id]) || (!this.batchs_cache[batch_id])) {
            return null;
        }

        if (this.debug) {
            ConsoleHandler.getInstance().log(
                'UpdateEstimationVarPerfHandler.get_ratiod_mean: start for ' + perf_name +
                ' on [' + last_x_perf.var_id + '] ' + VarsServerController.getInstance().getVarConfById(last_x_perf.var_id).name);
        }

        let all_var_ids_means_sum = 0;
        for (let i in this.batchs_vars_cache[batch_id]) {
            let batch_vars_cache = this.batchs_vars_cache[batch_id][i];

            for (let j in ratio_perfs_names) {
                let ratio_perf_name = ratio_perfs_names[j];
                let ratio_perf = (batch_vars_cache[ratio_perf_name] as VarPerfElementVO);

                if ((!ratio_perf) || (!ratio_perf.realised_nb_calls) || (!ratio_perf.realised_sum_ms) || (!ratio_perf.realised_nb_card)) {
                    continue;
                }

                all_var_ids_means_sum += (ratio_perf.realised_sum_ms / ratio_perf.realised_nb_card);

                if (this.debug) {
                    ConsoleHandler.getInstance().log(
                        'UpdateEstimationVarPerfHandler.get_ratiod_mean: all_var_ids_means_sum ' + perf_name +
                        ' on [' + last_x_perf.var_id + '] ' + VarsServerController.getInstance().getVarConfById(last_x_perf.var_id).name +
                        ' : all_var_ids_means_sum += (ratio_perf.realised_sum_ms / ratio_perf.realised_nb_card) : ' + all_var_ids_means_sum + ' : (+' + (ratio_perf.realised_sum_ms / ratio_perf.realised_nb_card) + ') : ' +
                        ' ratio_perf.realised_sum_ms : ' + ratio_perf.realised_sum_ms + ' : ratio_perf.realised_nb_card : ' + ratio_perf.realised_nb_card);
                }
            }
        }

        let batch_perf_sum = (this.batchs_cache[batch_id][batch_perf_name] as VarNodePerfElementVO).total_elapsed_time;

        // Le coef est compilé en prenant le temps de la stat ciblée perf_name, ramené au cardinal, divisé par la somme des temps de toutes les stats ratio_perfs_names (composants au final batch_perf_name et dont fait partie la perf_name), ramenées au cardinal également
        let coef = ((perf.realised_sum_ms / perf.realised_nb_card) / all_var_ids_means_sum);
        if (this.debug) {
            ConsoleHandler.getInstance().log(
                'UpdateEstimationVarPerfHandler.get_ratiod_mean: coef ' + perf_name +
                ' on [' + last_x_perf.var_id + '] ' + VarsServerController.getInstance().getVarConfById(last_x_perf.var_id).name +
                ' : coef = ((perf.realised_sum_ms / perf.realised_nb_card) / all_var_ids_means_sum) : ' + coef +
                ' : perf.realised_sum_ms : ' + perf.realised_sum_ms + ' : perf.realised_nb_card : ' + perf.realised_nb_card);
        }

        // on applique le coef au temps réel du batch, et on ramène au cardinal
        if (this.debug) {
            ConsoleHandler.getInstance().log(
                'UpdateEstimationVarPerfHandler.get_ratiod_mean: end for ' + perf_name +
                ' on [' + last_x_perf.var_id + '] ' + VarsServerController.getInstance().getVarConfById(last_x_perf.var_id).name +
                ' : res = coef * batch_perf_sum / perf.realised_nb_card : ' + coef * batch_perf_sum / perf.realised_nb_card +
                ' : batch_perf_sum : ' + batch_perf_sum);
        }

        return coef * batch_perf_sum / perf.realised_nb_card;
    }

    /**
     * On charge les x batchs liés à ces x dernières perfs. Pour ce faire on commence par filtrer les batchs qu'on a déjà chargés, puis on charge les batchs qui n'ont pas encore été chargés.
     * @param last_x_var_perfs les derniers x perfs de la var - 1 par batch, et donc x batchs
     * @param perf_name le nom de la perf qu'on cible dans le calcul
     * @param ratio_perfs_names les perfs sur lesquels on fait le ratio
     * @param batch_perf_name le nom de la perf du batch sur lequel on applique le ratio
     * @returns le temps estimé pour la perf cible
     */
    private async get_estimation(last_x_var_perfs: VarBatchVarPerfVO[], perf_name: string, ratio_perfs_names: string[], batch_perf_name: string): Promise<number> {

        let means: number[] = [];

        if (this.debug) {
            ConsoleHandler.getInstance().log(
                'UpdateEstimationVarPerfHandler.get_estimation: starting for ' + perf_name +
                ' on ' + (last_x_var_perfs ? '[' + last_x_var_perfs[0].var_id + '] ' + VarsServerController.getInstance().getVarConfById(last_x_var_perfs[0].var_id).name : 'N/A'));
        }

        for (let perf_i in last_x_var_perfs) {
            let last_x_var_perf = last_x_var_perfs[perf_i];

            let ratiod_mean = this.get_ratiod_mean(last_x_var_perf, perf_name, ratio_perfs_names, batch_perf_name);
            if (!ratiod_mean) {
                continue;
            }

            if (this.debug) {
                ConsoleHandler.getInstance().log(
                    'UpdateEstimationVarPerfHandler.get_estimation: using mean for ' + perf_name +
                    ' on [' + last_x_var_perf.var_id + '] ' + VarsServerController.getInstance().getVarConfById(last_x_var_perf.var_id).name +
                    ' : mean : ' + ratiod_mean + ' : last_x_perf[perf_name].realised_sum_ms : ' + last_x_var_perf[perf_name].realised_sum_ms + ' : realised_nb_card : ' + last_x_var_perf[perf_name].realised_nb_card);
            }
            means.push(ratiod_mean);
        }

        if ((!means) || (!means.length)) {
            ConsoleHandler.getInstance().warn(
                'UpdateEstimationVarPerfHandler.get_estimation: no means for ' + perf_name +
                ' on ' + (last_x_var_perfs ? '[' + last_x_var_perfs[0].var_id + '] ' + VarsServerController.getInstance().getVarConfById(last_x_var_perfs[0].var_id).name : 'N/A'));
        }

        if (this.debug) {
            ConsoleHandler.getInstance().log(
                'UpdateEstimationVarPerfHandler.get_estimation: ending for ' + perf_name +
                ' on ' + (last_x_var_perfs ? '[' + last_x_var_perfs[0].var_id + '] ' + VarsServerController.getInstance().getVarConfById(last_x_var_perfs[0].var_id).name : 'N/A' +
                    ' : mean : ' + ((means && means.length) ? mean(means) : 'N/A')));
        }

        return (means && means.length) ? mean(means) : null;
    }

    /**
     * On charge les x batchs liés à ces x dernières perfs. Pour ce faire on commence par filtrer les batchs qu'on a déjà chargés, puis on charge les batchs qui n'ont pas encore été chargés.
     */
    private async load_missing_batchs(last_x_var_perfs: VarBatchVarPerfVO[]): Promise<void> {
        let batch_ids = [];
        for (let perf_i in last_x_var_perfs) {
            let last_x_perf = last_x_var_perfs[perf_i];

            if (!this.batchs_cache[last_x_perf.var_batch_perf_id]) {
                batch_ids.push(last_x_perf.var_batch_perf_id);
            }
        }
        let batch_ids_ranges = null;

        if (batch_ids && batch_ids.length) {
            batch_ids_ranges = RangeHandler.getInstance().get_ids_ranges_from_list(batch_ids);
            let batchs: VarBatchPerfVO[] = await query(VarBatchPerfVO.API_TYPE_ID)
                .filter_by_ids(batch_ids_ranges)
                .select_vos<VarBatchPerfVO>();

            for (let batch_i in batchs) {
                let batch = batchs[batch_i];
                this.batchs_cache[batch.id] = batch;
            }
        }

        batch_ids = [];
        for (let perf_i in last_x_var_perfs) {
            let last_x_perf = last_x_var_perfs[perf_i];

            if (!this.batchs_vars_cache[last_x_perf.var_batch_perf_id]) {
                batch_ids.push(last_x_perf.var_batch_perf_id);
            }
        }

        if (batch_ids && batch_ids.length) {
            batch_ids_ranges = RangeHandler.getInstance().get_ids_ranges_from_list(batch_ids);
            let batchs_vars: VarBatchVarPerfVO[] = await query(VarBatchVarPerfVO.API_TYPE_ID)
                .filter_by_num_x_ranges('var_batch_perf_id', batch_ids_ranges)
                .select_vos<VarBatchVarPerfVO>();

            for (let batch_i in batchs_vars) {
                let batch_var = batchs_vars[batch_i];

                if (!this.batchs_vars_cache[batch_var.var_batch_perf_id]) {
                    this.batchs_vars_cache[batch_var.var_batch_perf_id] = [];
                }
                this.batchs_vars_cache[batch_var.var_batch_perf_id].push(batch_var);
            }
        }

        return;
    }

    /**
     * On filtre les perfs qui ont ce perf_name et qui ont au moins un appel
     */
    private filter_valid_var_perfs_for_perf_name(last_x_var_perfs: VarBatchVarPerfVO[], perf_name: string): VarBatchVarPerfVO[] {
        let valid_var_perfs = [];
        for (let perf_i in last_x_var_perfs) {
            let last_x_perf = last_x_var_perfs[perf_i];

            if ((!last_x_perf[perf_name]) || (!last_x_perf[perf_name].realised_nb_calls)) {
                continue;
            }
            valid_var_perfs.push(last_x_perf);
        }
        return valid_var_perfs;
    }
}