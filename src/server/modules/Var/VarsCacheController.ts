import { performance } from 'perf_hooks';
import * as  moment from 'moment';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import MatroidController from '../../../shared/modules/Matroid/MatroidController';
import VarDAGNode from '../../../shared/modules/Var/graph/VarDAGNode';
import VarsController from '../../../shared/modules/Var/VarsController';
import VarConfVO from '../../../shared/modules/Var/vos/VarConfVO';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ConfigurationService from '../../env/ConfigurationService';
import VarsDatasProxy from './VarsDatasProxy';
import VarsServerController from './VarsServerController';

/**
 * On se fixe 3 stratégies de cache :
 *  A : décider si oui ou non on met un param en cache suite à un calcul
 *  B : décider si oui ou non on tente de charger un cache exact d'un noeud = donc un noeud qui n'est pas root et techniquement pas registered mais on
 *      a pas l'info ici
 *  C : décider si oui ou non on utilise un cache chargé au point B mais partiel
 */
export default class VarsCacheController {

    public static instance: VarsCacheController = null;

    /**
     * Multithreading notes :
     *  - There's only one bgthread doing all the computations, and separated from the other threads if the project decides to do so
     *  - Everything in this controller is running in the var calculation bg thread
     */
    public static getInstance(): VarsCacheController {
        if (!VarsCacheController.instance) {
            VarsCacheController.instance = new VarsCacheController();
        }
        return VarsCacheController.instance;
    }

    private partially_clean_bdd_cache_var_id_i: number = 0;
    private partially_clean_bdd_cache_offset: number = 0;

    protected constructor() {
    }

    /**
     * Cas A
     */
    public A_do_cache_param(node: VarDAGNode): boolean {

        /**
         * Stratégie naïve :
         *  on calcul une estimation de charge de calcu : CARD * cout moyen pour 1000 card / 1000
         *  si sup à un seuil => cache, sinon pas de cache
         */
        let card = MatroidController.getInstance().get_cardinal(node.var_data);
        let controller = VarsServerController.getInstance().getVarControllerById(node.var_data.var_id);

        return (card * controller.var_cache_conf.calculation_cost_for_1000_card / 1000) >= controller.var_cache_conf.cache_seuil_a;
    }

    /**
     * Cas B
     */
    public B_use_cache(node: VarDAGNode): boolean {

        /**
         * Stratégie naïve :
         *  on calcul une estimation de charge de calcu : CARD * cout moyen pour 1000 card / 1000
         *  si sup à un seuil => on tente de charger le cache, sinon non
         */
        let card = MatroidController.getInstance().get_cardinal(node.var_data);
        let controller = VarsServerController.getInstance().getVarControllerById(node.var_data.var_id);

        return (card * controller.var_cache_conf.calculation_cost_for_1000_card / 1000) >= controller.var_cache_conf.cache_seuil_b;
    }

    /**
     * Cas C : globalement
     */
    public C_use_partial_cache(node: VarDAGNode): boolean {

        /**
         * Stratégie naïve :
         *  on calcul une estimation de charge de calcu : CARD * cout moyen pour 1000 card / 1000
         *  si sup à un seuil => on accepte d'utiliser ce shard, sinon non
         */
        let card = MatroidController.getInstance().get_cardinal(node.var_data);
        let controller = VarsServerController.getInstance().getVarControllerById(node.var_data.var_id);

        return (card * controller.var_cache_conf.calculation_cost_for_1000_card / 1000) >= controller.var_cache_conf.cache_seuil_c;
    }

    /**
     * Cas C : chaque élément
     */
    public C_use_partial_cache_element(node: VarDAGNode, partial_cache: VarDataBaseVO): boolean {

        /**
         * Stratégie naïve :
         *  on calcul une estimation de charge de calcu : CARD * cout moyen pour 1000 card / 1000
         *  si sup à un seuil => on accepte d'utiliser ce shard, sinon non
         */
        let card = MatroidController.getInstance().get_cardinal(partial_cache);
        let controller = VarsServerController.getInstance().getVarControllerById(node.var_data.var_id);

        return (card * controller.var_cache_conf.calculation_cost_for_1000_card / 1000) >= controller.var_cache_conf.cache_seuil_c_element;
    }

    /**
     * Méthode qu'on appelle quand on peut avancer sur le nettoyage de la bdd, et qui n'agit que pendant un temps donné
     */
    public async partially_clean_bdd_cache() {
        let timeout = performance.now() + 1000;

        let max_earliest_read_days: number = 33;
        let min_earliest_read_days: number = 8;

        let max_second_earliest_read_days: number = 34;
        let min_second_earliest_read_days: number = 10;

        let max_third_earliest_read_days: number = 35;
        let min_third_earliest_read_days: number = 11;

        let max_thourth_earliest_read_days: number = 36;

        while (performance.now() < timeout) {

            let var_ids = Object.keys(VarsController.getInstance().var_conf_by_id);
            if (this.partially_clean_bdd_cache_var_id_i > (var_ids.length - 1)) {
                this.partially_clean_bdd_cache_var_id_i = 0;
            }

            let var_id = var_ids[this.partially_clean_bdd_cache_var_id_i];
            let controller: VarConfVO = VarsController.getInstance().var_conf_by_id[var_id];

            // On charge des packs de vars, et on test des conditions de suppression du cache (on parle bien de suppression)
            //  On doit refuser de toucher des vars qui seraient en ce moment dans le cache du proxy
            let var_datas = await ModuleDAO.getInstance().getVos<VarDataBaseVO>(controller.var_data_vo_type, 100, this.partially_clean_bdd_cache_offset);
            let go_to_next_table = false;
            if ((!var_datas) || (var_datas.length < 100)) {
                go_to_next_table = true;
            }
            var_datas = var_datas.filter((vd) => vd.value_type == VarDataBaseVO.VALUE_TYPE_COMPUTED);

            let invalidateds = [];

            // TODO FIXME Les seuils dépendent de la segmentation temps de la var si il y en a une

            for (let i in var_datas) {
                let var_data = var_datas[i];

                if (VarsDatasProxy.getInstance().has_cached_index(var_data.index)) {
                    continue;
                }

                if ((!var_data.last_reads_ts) || (!var_data.last_reads_ts.length)) {
                    if (ConfigurationService.getInstance().getNodeConfiguration().DEBUG_VARS) {
                        ConsoleHandler.getInstance().log('Invalidation:!last_reads_ts:' + var_data._type + ':' + var_data.id + ':' + var_data.index + ':');
                    }
                    invalidateds.push(var_data);
                    continue;
                }

                if (var_data.last_reads_ts[var_data.last_reads_ts.length - 1].isBefore(moment().utc(true).add(-max_earliest_read_days, 'days'))) {
                    if (ConfigurationService.getInstance().getNodeConfiguration().DEBUG_VARS) {
                        ConsoleHandler.getInstance().log('Invalidation:<max_earliest_read_days:' + var_data._type + ':' + var_data.id + ':' + var_data.index + ':');
                    }
                    invalidateds.push(var_data);
                    continue;
                }

                if (var_data.last_reads_ts[var_data.last_reads_ts.length - 1].isAfter(moment().utc(true).add(-min_earliest_read_days, 'days'))) {
                    continue;
                }

                if ((var_data.last_reads_ts.length <= 1) || (var_data.last_reads_ts[var_data.last_reads_ts.length - 2].isBefore(moment().utc(true).add(-max_second_earliest_read_days, 'days')))) {
                    if (ConfigurationService.getInstance().getNodeConfiguration().DEBUG_VARS) {
                        ConsoleHandler.getInstance().log('Invalidation:<max_second_earliest_read_days:' + var_data._type + ':' + var_data.id + ':' + var_data.index + ':');
                    }
                    invalidateds.push(var_data);
                    continue;
                }

                if (var_data.last_reads_ts[var_data.last_reads_ts.length - 2].isAfter(moment().utc(true).add(-min_second_earliest_read_days, 'days'))) {
                    continue;
                }

                if ((var_data.last_reads_ts.length <= 2) || (var_data.last_reads_ts[var_data.last_reads_ts.length - 3].isBefore(moment().utc(true).add(-max_third_earliest_read_days, 'days')))) {
                    if (ConfigurationService.getInstance().getNodeConfiguration().DEBUG_VARS) {
                        ConsoleHandler.getInstance().log('Invalidation:<max_third_earliest_read_days:' + var_data._type + ':' + var_data.id + ':' + var_data.index + ':');
                    }
                    invalidateds.push(var_data);
                    continue;
                }

                if (var_data.last_reads_ts[var_data.last_reads_ts.length - 3].isAfter(moment().utc(true).add(-min_third_earliest_read_days, 'days'))) {
                    continue;
                }

                if ((var_data.last_reads_ts.length <= 3) || (var_data.last_reads_ts[var_data.last_reads_ts.length - 4].isBefore(moment().utc(true).add(-max_thourth_earliest_read_days, 'days')))) {
                    if (ConfigurationService.getInstance().getNodeConfiguration().DEBUG_VARS) {
                        ConsoleHandler.getInstance().log('Invalidation:<max_thourth_earliest_read_days:' + var_data._type + ':' + var_data.id + ':' + var_data.index + ':');
                    }
                    invalidateds.push(var_data);
                    continue;
                }
            }

            if (invalidateds && invalidateds.length) {
                await ModuleDAO.getInstance().deleteVOs(invalidateds);
            }

            if (go_to_next_table) {
                this.partially_clean_bdd_cache_offset = 0;
                this.partially_clean_bdd_cache_var_id_i++;
            } else {
                this.partially_clean_bdd_cache_offset += var_datas.length;
            }
        }
    }
}