import VarCacheConfVO from '../../../shared/modules/Var/vos/VarCacheConfVO';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import RangeHandler from '../../../shared/tools/RangeHandler';
import VarServerControllerBase from './VarServerControllerBase';

/**
 * On se fixe 3 stratégies de cache :
 *  A : décider si oui ou non on met un param en cache suite à un calcul
 *  B : décider si oui ou non on tente de charger un cache exact d'un noeud = donc un noeud qui n'est pas root et techniquement pas registered mais on
 *      a pas l'info ici
 *  C : décider si oui ou non on utilise un cache chargé au point B mais partiel
 */
export default class VarsCacheController {

    /**
     * Multithreading notes :
     *  - There's only one bgthread doing all the computations, and separated from the other threads if the project decides to do so
     *  - Everything in this controller is running in the var calculation bg thread
     */

    /**
     * Cas insert en base d'un cache de var calculée et registered
     */
    public static BDD_do_cache_param_data(var_data: VarDataBaseVO, controller: VarServerControllerBase<any>, is_requested_param: boolean): boolean {

        // Si ça vient de la bdd, on le met à jour évidemment
        if (!!var_data.id) {
            return true;
        }

        // Si on veut insérer que des caches demandés explicitement par server ou client et pas tous les noeuds de l'arbre, on check ici
        if (controller.var_cache_conf.cache_bdd_only_requested_params && !is_requested_param) {
            return false;
        }

        switch (controller.var_cache_conf.cache_startegy) {
            default:
            case VarCacheConfVO.VALUE_CACHE_STRATEGY_CACHE_ALL_NEVER_LOAD_CHUNKS:
                return true;
            case VarCacheConfVO.VALUE_CACHE_STRATEGY_CACHE_NONE:
                return false;
            case VarCacheConfVO.VALUE_CACHE_STRATEGY_PIXEL:

                /**
                 * En stratégie pixel, on stocke tout en bdd maintenant. Les pixels sont identifiés par un flag is_pixel == true si card == 1
                 */
                if (!controller.varConf.pixel_activated) {
                    ConsoleHandler.error('Une var ne peut pas être en stratégie VALUE_CACHE_STRATEGY_PIXEL et ne pas avoir de pixellisation déclarée');
                    throw new Error('Not Implemented');
                }
                return true;
        }
    }
}