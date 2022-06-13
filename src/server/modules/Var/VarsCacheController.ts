import { performance } from 'perf_hooks';
import * as  moment from 'moment';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import MatroidController from '../../../shared/modules/Matroid/MatroidController';
import VarDAGNode from '../../../shared/modules/Var/graph/VarDAGNode';
import VarsController from '../../../shared/modules/Var/VarsController';
import VarConfVO from '../../../shared/modules/Var/vos/VarConfVO';
import VarCacheConfVO from '../../../shared/modules/Var/vos/VarCacheConfVO';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ConfigurationService from '../../env/ConfigurationService';
import VarsDatasProxy from './VarsDatasProxy';
import VarsServerController from './VarsServerController';
import PerfMonServerController from '../PerfMon/PerfMonServerController';
import PerfMonConfController from '../PerfMon/PerfMonConfController';
import VarsPerfMonServerController from './VarsPerfMonServerController';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import VarServerControllerBase from './VarServerControllerBase';
import RangeHandler from '../../../shared/tools/RangeHandler';

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
     * Cas insert en base d'un cache de var calculée et registered
     */
    public BDD_do_cache_param_data(var_data: VarDataBaseVO, controller: VarServerControllerBase<any>, is_requested_param: boolean): boolean {

        // Si ça vient de la bdd, on le met à jour évidemment
        if (!!var_data.id) {
            return true;
        }

        // Si on veut insérer que des caches demandés explicitement par server ou client et pas tous les noeuds de l'arbre, on check ici
        if (controller.var_cache_conf.cache_bdd_only_requested_params && !is_requested_param) {
            return false;
        }

        return this.do_cache(var_data, controller.var_cache_conf, 'cache_seuil_bdd');
    }

    /**
     * Cas A - insert en base d'un cache de var calculé mais unregistered
     */
    public A_do_cache_param(node: VarDAGNode): boolean {

        /**
         * Stratégie naïve :
         *  on calcul une estimation de charge de calcu : CARD * cout moyen pour 1000 card / 1000
         *  si sup à un seuil => cache, sinon pas de cache
         */

        let controller = VarsServerController.getInstance().getVarControllerById(node.var_data.var_id);

        return this.do_cache(node.var_data, controller.var_cache_conf, 'cache_seuil_a');
    }

    /**
     * Cas B - chargement du cache exacte d'une var en cours de déploiement dans l'arbre
     */
    public B_use_cache(node: VarDAGNode): boolean {

        /**
         * Stratégie naïve :
         *  on calcul une estimation de charge de calcu : CARD * cout moyen pour 1000 card / 1000
         *  si sup à un seuil => on tente de charger le cache, sinon non
         */
        let controller = VarsServerController.getInstance().getVarControllerById(node.var_data.var_id);

        return this.do_cache(node.var_data, controller.var_cache_conf, 'cache_seuil_b');
    }

    /**
     * Cas C - doit-on chercher un cache partiel
     */
    public C_use_partial_cache(node: VarDAGNode): boolean {

        /**
         * Stratégie naïve :
         *  on calcul une estimation de charge de calcu : CARD * cout moyen pour 1000 card / 1000
         *  si sup à un seuil => on accepte d'utiliser ce shard, sinon non
         */
        let controller = VarsServerController.getInstance().getVarControllerById(node.var_data.var_id);

        return this.do_cache(node.var_data, controller.var_cache_conf, 'cache_seuil_c');
    }

    /**
     * Cas C : sur chaque élément du cache partiel, doit-on l'utiliser ?
     */
    public C_use_partial_cache_element(node: VarDAGNode, partial_cache: VarDataBaseVO): boolean {

        /**
         * Stratégie naïve :
         *  on calcul une estimation de charge de calcu : CARD * cout moyen pour 1000 card / 1000
         *  si sup à un seuil => on accepte d'utiliser ce shard, sinon non
         */
        let controller = VarsServerController.getInstance().getVarControllerById(node.var_data.var_id);

        return this.do_cache(node.var_data, controller.var_cache_conf, 'cache_seuil_c_element');
    }

    /**
     * Méthode qu'on appelle quand on peut avancer sur le nettoyage de la bdd, et qui n'agit que pendant un temps donné
     */
    public async partially_clean_bdd_cache() {

        await PerfMonServerController.getInstance().monitor_async(
            PerfMonConfController.getInstance().perf_type_by_name[VarsPerfMonServerController.PML__VarsCacheController__partially_clean_bdd_cache],
            async () => {

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

                    /**
                     * Cas des pixels qu'on ne veut pas toucher
                     */
                    if (controller.pixel_activated && controller.pixel_never_delete) {
                        this.partially_clean_bdd_cache_offset = 0;
                        this.partially_clean_bdd_cache_var_id_i++;
                        continue;
                    }

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

                        if (var_data.last_reads_ts[var_data.last_reads_ts.length - 1] < Dates.add(Dates.now(), -max_earliest_read_days, TimeSegment.TYPE_DAY)) {
                            if (ConfigurationService.getInstance().getNodeConfiguration().DEBUG_VARS) {
                                ConsoleHandler.getInstance().log('Invalidation:<max_earliest_read_days:' + var_data._type + ':' + var_data.id + ':' + var_data.index + ':');
                            }
                            invalidateds.push(var_data);
                            continue;
                        }

                        if (var_data.last_reads_ts[var_data.last_reads_ts.length - 1] > Dates.add(Dates.now(), -min_earliest_read_days, TimeSegment.TYPE_DAY)) {
                            continue;
                        }

                        if ((var_data.last_reads_ts.length > 1) && (var_data.last_reads_ts[var_data.last_reads_ts.length - 2] < Dates.add(Dates.now(), -max_second_earliest_read_days, TimeSegment.TYPE_DAY))) {
                            if (ConfigurationService.getInstance().getNodeConfiguration().DEBUG_VARS) {
                                ConsoleHandler.getInstance().log('Invalidation:<max_second_earliest_read_days:' + var_data._type + ':' + var_data.id + ':' + var_data.index + ':');
                            }
                            invalidateds.push(var_data);
                            continue;
                        }

                        if (var_data.last_reads_ts[var_data.last_reads_ts.length - 2] && var_data.last_reads_ts[var_data.last_reads_ts.length - 2] > Dates.add(Dates.now(), -min_second_earliest_read_days, TimeSegment.TYPE_DAY)) {
                            continue;
                        }

                        if ((var_data.last_reads_ts.length > 2) && (var_data.last_reads_ts[var_data.last_reads_ts.length - 3] < Dates.add(Dates.now(), -max_third_earliest_read_days, TimeSegment.TYPE_DAY))) {
                            if (ConfigurationService.getInstance().getNodeConfiguration().DEBUG_VARS) {
                                ConsoleHandler.getInstance().log('Invalidation:<max_third_earliest_read_days:' + var_data._type + ':' + var_data.id + ':' + var_data.index + ':');
                            }
                            invalidateds.push(var_data);
                            continue;
                        }

                        if (var_data.last_reads_ts[var_data.last_reads_ts.length - 3] && var_data.last_reads_ts[var_data.last_reads_ts.length - 3] > Dates.add(Dates.now(), -min_third_earliest_read_days, TimeSegment.TYPE_DAY)) {
                            continue;
                        }

                        if ((var_data.last_reads_ts.length > 3) && (var_data.last_reads_ts[var_data.last_reads_ts.length - 4] < Dates.add(Dates.now(), -max_thourth_earliest_read_days, TimeSegment.TYPE_DAY))) {
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
            },
            this
        );
    }

    private do_cache(var_data: VarDataBaseVO, var_cache_conf: VarCacheConfVO, cache_seuil_field: string): boolean {
        switch (var_cache_conf.cache_startegy) {
            case VarCacheConfVO.VALUE_CACHE_STRATEGY_CARDINAL:
                let seuila = var_cache_conf[cache_seuil_field];
                let carda = MatroidController.getInstance().get_cardinal(var_data);
                return carda >= seuila;
            case VarCacheConfVO.VALUE_CACHE_STRATEGY_ESTIMATED_TIME:
                let seuilb = var_cache_conf[cache_seuil_field];
                let cardb = MatroidController.getInstance().get_cardinal(var_data);
                return (cardb * var_cache_conf.calculation_cost_for_1000_card / 1000) >= seuilb;
            case VarCacheConfVO.VALUE_CACHE_STRATEGY_PIXEL:

                /**
                 * En stratégie pixel, on stocke en bdd si card dimension pixellisée == 1.
                 *  Du coup de la même manière, le cache exacte ne peut être demandé que si card dimension pixellisée == 1
                 *  tout le reste est géré en amont, donc à ce niveau on doit refuser les cache C et C element
                 */
                let varconf = VarsController.getInstance().var_conf_by_id[var_cache_conf.var_id];
                if (!varconf.pixel_activated) {
                    ConsoleHandler.getInstance().error('Une var ne peut pas être en stratégie VALUE_CACHE_STRATEGY_PIXEL et ne pas avoir de pixellisation déclarée');
                }

                let is_pixel = true;
                for (let i in varconf.pixel_fields) {
                    let pixel_field = varconf.pixel_fields[i];

                    if (RangeHandler.getInstance().getCardinalFromArray(var_data[pixel_field.pixel_param_field_id]) != 1) {
                        is_pixel = false;
                        break;
                    }
                }
                return ((cache_seuil_field == 'cache_seuil_b') || (cache_seuil_field == 'cache_seuil_a') || (cache_seuil_field == 'cache_seuil_bdd')) && is_pixel;
        }
    }
}