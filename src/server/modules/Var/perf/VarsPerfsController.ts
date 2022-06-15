import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import MatroidController from '../../../../shared/modules/Matroid/MatroidController';
import ModuleParams from '../../../../shared/modules/Params/ModuleParams';
import VarDAGNode from '../../../../shared/modules/Var/graph/VarDAGNode';
import VarCacheConfVO from '../../../../shared/modules/Var/vos/VarCacheConfVO';
import VarPerfVO from '../../../../shared/modules/Var/vos/VarPerfVO';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../shared/tools/ThrottleHelper';
import PerfMonConfController from '../../PerfMon/PerfMonConfController';
import PerfMonServerController from '../../PerfMon/PerfMonServerController';
import VarsPerfMonServerController from '../VarsPerfMonServerController';
import VarsServerController from '../VarsServerController';

/**
 * Par convention on appel toujours __NAME ou [VAR_ID]__NAME les points de traking de perfs
 */
export default class VarsPerfsController {

    public static NB_MEAN_1000_CARD_CALCULATION_PARAM_NAME: string = 'VarsPerfsController.NB_MEAN_1000_CARD_CALCULATION';

    /**
     * Local thread cache ----- n'existe que sur le thread de calculs
     */

    public static current_batch_perfs: { [perf_name: string]: VarPerfVO } = {};

    public static max_nb_calls: number = 100;
    public static max_nb_card: number = 10000;
    public static max_sum_ms: number = 30000;


    /**
     * ----- Local thread cache
     */

    public static addPerf(ms: number, perf_name: string, is_start: boolean) {
        if (!VarsPerfsController.current_batch_perfs[perf_name]) {
            let perf = new VarPerfVO();
            perf.nb_calls = 0;
            perf.sum_ms = 0;
            perf.name = perf_name;

            let split = perf_name.split('__')[0];
            if (/^[0-9]+$/.test(split)) {
                perf.var_id = parseInt(split);
            }
            VarsPerfsController.current_batch_perfs[perf_name] = perf;
        }

        VarsPerfsController.current_batch_perfs[perf_name].sum_ms += is_start ? -ms : ms;
        if (is_start) { VarsPerfsController.current_batch_perfs[perf_name].nb_calls++; }
    }

    public static addCard(node: VarDAGNode) {

        let cards: number = MatroidController.getInstance().get_cardinal(node.var_data);
        let var_id: number = node.var_data.var_id;

        for (let i in VarsPerfsController.current_batch_perfs) {
            let current_batch_perf = VarsPerfsController.current_batch_perfs[i];

            if (current_batch_perf && current_batch_perf.name.startsWith(var_id + '__')) {

                let perf_id = current_batch_perf.name.substring(current_batch_perf.name.lastIndexOf('.') + 1, current_batch_perf.name.length);
                if (!node['has_' + perf_id + '_perf']) {
                    continue;
                }
                current_batch_perf.nb_card = (current_batch_perf.nb_card ? current_batch_perf.nb_card : 0) + cards;
            }
        }
    }

    public static addPerfs(ms: number, perf_names: string[], is_start: boolean) {
        perf_names.forEach((perf_name) => VarsPerfsController.addPerf(ms, perf_name, is_start));
    }

    public static async update_perfs_in_bdd() {

        await VarsPerfsController.throttled_update_param();
    }

    private static throttled_update_param = ThrottleHelper.getInstance().declare_throttle_without_args(VarsPerfsController.do_update_perfs_in_bdd, 30000, { leading: false, trailing: true });

    private static async do_update_perfs_in_bdd() {

        return await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsPerfsController__update_perfs_in_bdd],
            async () => {

                ConsoleHandler.getInstance().log('VarsPerfsController do_update_perfs_in_bdd start');

                let nb_mean = await ModuleParams.getInstance().getParamValueAsInt(VarsPerfsController.NB_MEAN_1000_CARD_CALCULATION_PARAM_NAME, 5);

                let mean_per_cardinal_1000_per_var_id: { [var_id: number]: number } = {};

                /**
                 * On charge les datas de mêmes noms issues de la bdd
                 */
                for (let i in VarsPerfsController.current_batch_perfs) {
                    let current_batch_perf = VarsPerfsController.current_batch_perfs[i];

                    if (!current_batch_perf) {
                        continue;
                    }

                    let bdd_data = await ModuleDAO.getInstance().getNamedVoByName<VarPerfVO>(VarPerfVO.API_TYPE_ID, current_batch_perf.name);

                    if (!!bdd_data) {
                        current_batch_perf.nb_calls = (current_batch_perf.nb_calls ? current_batch_perf.nb_calls : 0) + (bdd_data.nb_calls ? bdd_data.nb_calls : 0);
                        current_batch_perf.nb_card = (current_batch_perf.nb_card ? current_batch_perf.nb_card : 0) + (bdd_data.nb_card ? bdd_data.nb_card : null);
                        current_batch_perf.sum_ms = (current_batch_perf.sum_ms ? current_batch_perf.sum_ms : 0) + (bdd_data.sum_ms ? bdd_data.sum_ms : 0);
                        current_batch_perf.id = bdd_data.id;
                    }

                    // Pour limiter les dépassements on fixe un max à ne pas dépasser et on ramène les historiques dans la limite si ça dépasse
                    if ((current_batch_perf.nb_calls < 0) || (current_batch_perf.nb_card < 0) || (current_batch_perf.sum_ms < 0)) {
                        // si déjà <0, on doit juste repartir de 0 c'est n'imp
                        current_batch_perf.nb_calls = 0;
                        current_batch_perf.nb_card = 0;
                        current_batch_perf.sum_ms = 0;
                    }

                    if ((current_batch_perf.nb_calls > VarsPerfsController.max_nb_calls) || (current_batch_perf.nb_card > VarsPerfsController.max_nb_card) || (current_batch_perf.sum_ms > VarsPerfsController.max_sum_ms)) {
                        // on fixe des limites arbitraires
                        let coef_nb_calls = (current_batch_perf.nb_calls / VarsPerfsController.max_nb_calls) * 3;
                        let coef_nb_card = (current_batch_perf.nb_card / VarsPerfsController.max_nb_card) * 3;
                        let coef_sum_ms = (current_batch_perf.sum_ms / VarsPerfsController.max_sum_ms) * 3;
                        let coef = Math.max(coef_nb_calls, coef_nb_card, coef_sum_ms);
                        current_batch_perf.nb_calls = current_batch_perf.nb_calls / coef;
                        current_batch_perf.nb_card = current_batch_perf.nb_card / coef;
                        current_batch_perf.sum_ms = current_batch_perf.sum_ms / coef;
                    }

                    current_batch_perf.mean_per_call = current_batch_perf.nb_calls ? (current_batch_perf.sum_ms / current_batch_perf.nb_calls) : null;
                    current_batch_perf.mean_per_cardinal_1000 = current_batch_perf.nb_card ? (current_batch_perf.sum_ms / (current_batch_perf.nb_card / 1000)) : null;

                    if (current_batch_perf.var_id) {
                        if (!mean_per_cardinal_1000_per_var_id[current_batch_perf.var_id]) {
                            mean_per_cardinal_1000_per_var_id[current_batch_perf.var_id] = current_batch_perf.mean_per_cardinal_1000;
                        } else {
                            mean_per_cardinal_1000_per_var_id[current_batch_perf.var_id] += current_batch_perf.mean_per_cardinal_1000;
                        }
                    }

                    await ModuleDAO.getInstance().insertOrUpdateVO(current_batch_perf);
                }

                /**
                 * On update les varcacheconfs pour mettre la valeur de tps de calcul moyen / 1000 card
                 */
                for (let var_id_s in mean_per_cardinal_1000_per_var_id) {
                    let var_id = parseInt(var_id_s);

                    let vars_cache_conf: VarCacheConfVO[] = await ModuleDAO.getInstance().getVosByRefFieldIds<VarCacheConfVO>(VarCacheConfVO.API_TYPE_ID, "var_id", [var_id]);
                    let var_cache_conf: VarCacheConfVO = (vars_cache_conf && vars_cache_conf.length) ? vars_cache_conf[0] : null;

                    if (!var_cache_conf) {
                        continue;
                    }

                    if (mean_per_cardinal_1000_per_var_id[var_id_s] == null) {
                        continue;
                    }

                    /**
                     * On fait une moyenne sur les 5 dernieres valeurs, tout en mettant un poids de 0.1 à la plus grande et à la plus petite valeur
                     *  donc on divise par 3 + 0.2 au final
                     */

                    /**
                     * rétrocompatibilité, si on a aucun historique on le rempli avec la valeur du calculation_cost_for_1000_card actuel
                     */
                    if (!var_cache_conf.last_calculations_cost_for_1000_card) {
                        var_cache_conf.last_calculations_cost_for_1000_card = [];

                        let init_value = var_cache_conf.calculation_cost_for_1000_card ? var_cache_conf.calculation_cost_for_1000_card : mean_per_cardinal_1000_per_var_id[var_id_s];
                        for (let ii = 0; ii < nb_mean; ii++) {
                            var_cache_conf.last_calculations_cost_for_1000_card.push(init_value);
                        }
                    } else {
                        var_cache_conf.last_calculations_cost_for_1000_card.push(mean_per_cardinal_1000_per_var_id[var_id_s]);
                        var_cache_conf.last_calculations_cost_for_1000_card.shift();
                    }

                    let min_value = null;
                    let max_value = null;
                    let min_index = null;
                    let max_index = null;

                    for (let ij in var_cache_conf.last_calculations_cost_for_1000_card) {
                        let cost_for_1000_card = var_cache_conf.last_calculations_cost_for_1000_card[ij];

                        if ((min_value == null) || (min_value > cost_for_1000_card)) {
                            min_value = cost_for_1000_card;
                            min_index = ij;
                        }

                        if ((max_value == null) || (max_value > cost_for_1000_card)) {
                            max_value = cost_for_1000_card;
                            max_index = ij;
                        }
                    }

                    let sum_ = 0;
                    let coef = 0;
                    for (let ij in var_cache_conf.last_calculations_cost_for_1000_card) {
                        let cost_for_1000_card = var_cache_conf.last_calculations_cost_for_1000_card[ij];

                        if ((ij == min_index) || (ij == max_index)) {
                            sum_ += cost_for_1000_card * 0.1;
                            coef += 0.1;
                            continue;
                        }

                        sum_ += cost_for_1000_card;
                        coef++;
                    }

                    var_cache_conf.calculation_cost_for_1000_card = sum_ / coef;
                    VarsServerController.getInstance().varcacheconf_by_var_ids[var_cache_conf.var_id].calculation_cost_for_1000_card = var_cache_conf.calculation_cost_for_1000_card;
                    await ModuleDAO.getInstance().insertOrUpdateVO(var_cache_conf);
                }


                ConsoleHandler.getInstance().log('VarsPerfsController do_update_perfs_in_bdd end');
                VarsPerfsController.current_batch_perfs = {};
            },
            this
        );
    }
}