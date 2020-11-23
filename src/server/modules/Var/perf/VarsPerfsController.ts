import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import VarPerfVO from '../../../../shared/modules/Var/vos/VarPerfVO';

/**
 * Par convention on appel toujours __NAME ou [VAR_ID]__NAME les points de traking de perfs
 */
export default class VarsPerfsController {

    /**
     * Local thread cache ----- n'existe que sur le thread de calculs
     */

    public static current_batch_perfs: { [perf_name: string]: VarPerfVO } = {};

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

    public static addCard(cards: number, var_id: number) {

        for (let i in VarsPerfsController.current_batch_perfs) {
            let current_batch_perf = VarsPerfsController.current_batch_perfs[i];

            if (current_batch_perf.name.startsWith(var_id + '__')) {
                current_batch_perf.nb_card = (current_batch_perf.nb_card ? current_batch_perf.nb_card : 0) + cards;
            }
        }
    }

    public static addPerfs(ms: number, perf_names: string[], is_start: boolean) {
        perf_names.forEach((perf_name) => VarsPerfsController.addPerf(ms, perf_name, is_start));
    }

    public static async update_perfs_in_bdd() {

        /**
         * On charge les datas de mêmes noms issues de la bdd
         */
        for (let i in VarsPerfsController.current_batch_perfs) {
            let current_batch_perf = VarsPerfsController.current_batch_perfs[i];
            let bdd_data = await ModuleDAO.getInstance().getNamedVoByName<VarPerfVO>(VarPerfVO.API_TYPE_ID, current_batch_perf.name);

            if (!!bdd_data) {
                current_batch_perf.nb_calls = (current_batch_perf.nb_calls ? current_batch_perf.nb_calls : 0) + (bdd_data.nb_calls ? bdd_data.nb_calls : 0);
                current_batch_perf.nb_card = (current_batch_perf.nb_card ? current_batch_perf.nb_card : 0) + (bdd_data.nb_card ? bdd_data.nb_card : null);
                current_batch_perf.sum_ms = (current_batch_perf.sum_ms ? current_batch_perf.sum_ms : 0) + (bdd_data.sum_ms ? bdd_data.sum_ms : 0);
                current_batch_perf.id = bdd_data.id;
            }

            current_batch_perf.mean_per_call = current_batch_perf.nb_calls ? (current_batch_perf.sum_ms / current_batch_perf.nb_calls) : null;
            current_batch_perf.mean_per_cardinal_1000 = current_batch_perf.nb_card ? (current_batch_perf.sum_ms / current_batch_perf.nb_card) / 1000 : null;

            await ModuleDAO.getInstance().insertOrUpdateVO(current_batch_perf);
        }

        VarsPerfsController.current_batch_perfs = {};
    }
}