import { performance } from 'perf_hooks';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import VarDAGNode from '../../../shared/modules/Var/graph/VarDAGNode';
import VarsController from '../../../shared/modules/Var/VarsController';
import VarCacheConfVO from '../../../shared/modules/Var/vos/VarCacheConfVO';
import VarConfVO from '../../../shared/modules/Var/vos/VarConfVO';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import VarDataInvalidatorVO from '../../../shared/modules/Var/vos/VarDataInvalidatorVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import RangeHandler from '../../../shared/tools/RangeHandler';
import ConfigurationService from '../../env/ConfigurationService';
import VarsDatasProxy from './VarsDatasProxy';
import VarsDatasVoUpdateHandler from './VarsDatasVoUpdateHandler';
import VarServerControllerBase from './VarServerControllerBase';
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

        switch (controller.var_cache_conf.cache_startegy) {
            case VarCacheConfVO.VALUE_CACHE_STRATEGY_CACHE_ALL_NEVER_LOAD_CHUNKS:
                return true;
            case VarCacheConfVO.VALUE_CACHE_STRATEGY_CACHE_NONE:
                return false;
            case VarCacheConfVO.VALUE_CACHE_STRATEGY_PIXEL:

                /**
                 * En stratégie pixel, on stocke en bdd si card dimension pixellisée == 1.
                 *  Du coup de la même manière, le cache exacte ne peut être demandé que si card dimension pixellisée == 1
                 *  tout le reste est géré en amont, donc à ce niveau on doit refuser les cache C et C element
                 */
                if (!controller.varConf.pixel_activated) {
                    ConsoleHandler.error('Une var ne peut pas être en stratégie VALUE_CACHE_STRATEGY_PIXEL et ne pas avoir de pixellisation déclarée');
                    throw new Error('Not Implemented');
                }

                for (let i in controller.varConf.pixel_fields) {
                    let pixel_field = controller.varConf.pixel_fields[i];

                    if (RangeHandler.getCardinalFromArray(var_data[pixel_field.pixel_param_field_id]) != 1) {
                        return false;
                    }
                }
                return true;
            default:
                return true;
        }
    }

    /**
     * doit-on chercher un cache partiel pour ce type de var ?
     *  Attention en ce moment il n'y a aucun type de cache qui utilise du cache partiel, à voir comment on réintroduit le principe
     */
    public use_partial_cache(node: VarDAGNode): boolean {

        let var_cache_conf = VarsServerController.getInstance().varcacheconf_by_var_ids[node.var_data.var_id];

        switch (var_cache_conf.cache_startegy) {
            case VarCacheConfVO.VALUE_CACHE_STRATEGY_CACHE_ALL_NEVER_LOAD_CHUNKS:
            case VarCacheConfVO.VALUE_CACHE_STRATEGY_CACHE_NONE:
            case VarCacheConfVO.VALUE_CACHE_STRATEGY_PIXEL:
            default:
                return false;
        }
    }

    /**
     * sur chaque élément du cache partiel, doit-on l'utiliser ?
     *  Attention en ce moment il n'y a aucun type de cache qui utilise du cache partiel, à voir comment on réintroduit le principe
     */
    public use_partial_cache_element(node: VarDAGNode, partial_cache: VarDataBaseVO): boolean {

        let var_cache_conf = VarsServerController.getInstance().varcacheconf_by_var_ids[node.var_data.var_id];

        switch (var_cache_conf.cache_startegy) {
            case VarCacheConfVO.VALUE_CACHE_STRATEGY_CACHE_ALL_NEVER_LOAD_CHUNKS:
            case VarCacheConfVO.VALUE_CACHE_STRATEGY_CACHE_NONE:
            case VarCacheConfVO.VALUE_CACHE_STRATEGY_PIXEL:
            default:
                return false;
        }
    }

    /**
     * Méthode qu'on appelle quand on peut avancer sur le nettoyage de la bdd, et qui n'agit que pendant un temps donné
     */
    public async partially_clean_bdd_cache() {

        let timeout = performance.now() + 500;

        let max_earliest_read_days: number = 33;
        let min_earliest_read_days: number = 8;

        let max_second_earliest_read_days: number = 34;
        let min_second_earliest_read_days: number = 10;

        let max_third_earliest_read_days: number = 35;
        let min_third_earliest_read_days: number = 11;

        let max_thourth_earliest_read_days: number = 36;
        let var_ids = Object.keys(VarsController.var_conf_by_id);

        while (performance.now() < timeout) {

            if (this.partially_clean_bdd_cache_var_id_i > (var_ids.length - 1)) {
                this.partially_clean_bdd_cache_var_id_i = 0;
            }

            let var_id = var_ids[this.partially_clean_bdd_cache_var_id_i];
            let controller: VarConfVO = VarsController.var_conf_by_id[var_id];
            let var_cache_conf: VarCacheConfVO = VarsServerController.getInstance().varcacheconf_by_var_ids[var_id];

            // anomalie constatée qui ne devrait pas arriver, je ne sais pas ce qui doit etre fait donc pour commencer je log
            //   => probablement revérifier en base la varconf et si elle a été supprimée, vider le cache qui lui fait ref
            if (!var_cache_conf) {
                ConsoleHandler.error('partially_clean_bdd_cache:no var_cache_conf for var_id:' + var_id);
            }

            if (var_cache_conf && !var_cache_conf.use_cache_read_ms_to_partial_clean) {
                this.partially_clean_bdd_cache_offset = 0;
                this.partially_clean_bdd_cache_var_id_i++;
                continue;
            }

            // anomalie constatée qui ne devrait pas arriver, je ne sais pas ce qui doit etre fait donc pour commencer je log
            //   => probablement revérifier en base la varconf et si elle a été supprimée, vider le cache qui lui fait ref
            if (!controller) {
                ConsoleHandler.error('partially_clean_bdd_cache:no controller for var_id:' + var_id);
            }

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
            let var_datas = await query(controller.var_data_vo_type).set_limit(100, this.partially_clean_bdd_cache_offset).select_vos<VarDataBaseVO>();
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
                    if (ConfigurationService.node_configuration.DEBUG_VARS) {
                        ConsoleHandler.log('Invalidation:!last_reads_ts:' + var_data._type + ':' + var_data.id + ':' + var_data.index + ':');
                    }
                    invalidateds.push(var_data);
                    continue;
                }

                if (var_data.last_reads_ts[var_data.last_reads_ts.length - 1] < Dates.add(Dates.now(), -max_earliest_read_days, TimeSegment.TYPE_DAY)) {
                    if (ConfigurationService.node_configuration.DEBUG_VARS) {
                        ConsoleHandler.log('Invalidation:<max_earliest_read_days:' + var_data._type + ':' + var_data.id + ':' + var_data.index + ':');
                    }
                    invalidateds.push(var_data);
                    continue;
                }

                if (var_data.last_reads_ts[var_data.last_reads_ts.length - 1] > Dates.add(Dates.now(), -min_earliest_read_days, TimeSegment.TYPE_DAY)) {
                    continue;
                }

                if ((var_data.last_reads_ts.length > 1) && (var_data.last_reads_ts[var_data.last_reads_ts.length - 2] < Dates.add(Dates.now(), -max_second_earliest_read_days, TimeSegment.TYPE_DAY))) {
                    if (ConfigurationService.node_configuration.DEBUG_VARS) {
                        ConsoleHandler.log('Invalidation:<max_second_earliest_read_days:' + var_data._type + ':' + var_data.id + ':' + var_data.index + ':');
                    }
                    invalidateds.push(var_data);
                    continue;
                }

                if (var_data.last_reads_ts[var_data.last_reads_ts.length - 2] && var_data.last_reads_ts[var_data.last_reads_ts.length - 2] > Dates.add(Dates.now(), -min_second_earliest_read_days, TimeSegment.TYPE_DAY)) {
                    continue;
                }

                if ((var_data.last_reads_ts.length > 2) && (var_data.last_reads_ts[var_data.last_reads_ts.length - 3] < Dates.add(Dates.now(), -max_third_earliest_read_days, TimeSegment.TYPE_DAY))) {
                    if (ConfigurationService.node_configuration.DEBUG_VARS) {
                        ConsoleHandler.log('Invalidation:<max_third_earliest_read_days:' + var_data._type + ':' + var_data.id + ':' + var_data.index + ':');
                    }
                    invalidateds.push(var_data);
                    continue;
                }

                if (var_data.last_reads_ts[var_data.last_reads_ts.length - 3] && var_data.last_reads_ts[var_data.last_reads_ts.length - 3] > Dates.add(Dates.now(), -min_third_earliest_read_days, TimeSegment.TYPE_DAY)) {
                    continue;
                }

                if ((var_data.last_reads_ts.length > 3) && (var_data.last_reads_ts[var_data.last_reads_ts.length - 4] < Dates.add(Dates.now(), -max_thourth_earliest_read_days, TimeSegment.TYPE_DAY))) {
                    if (ConfigurationService.node_configuration.DEBUG_VARS) {
                        ConsoleHandler.log('Invalidation:<max_thourth_earliest_read_days:' + var_data._type + ':' + var_data.id + ':' + var_data.index + ':');
                    }
                    invalidateds.push(var_data);
                    continue;
                }
            }

            let invalidators: VarDataInvalidatorVO[] = [];
            for (let i in invalidateds) {
                let invalidated = invalidateds[i];

                let invalidator = new VarDataInvalidatorVO(invalidated, VarDataInvalidatorVO.INVALIDATOR_TYPE_EXACT, false, false, false);
                invalidators.push(invalidator);
            }
            await VarsDatasVoUpdateHandler.getInstance().push_invalidators(invalidators);

            if (go_to_next_table) {
                this.partially_clean_bdd_cache_offset = 0;
                this.partially_clean_bdd_cache_var_id_i++;
            } else {
                this.partially_clean_bdd_cache_offset += var_datas.length;
            }
        }
    }
}