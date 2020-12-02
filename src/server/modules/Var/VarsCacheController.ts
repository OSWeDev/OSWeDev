import MatroidController from '../../../shared/modules/Matroid/MatroidController';
import VarDAGNode from '../../../shared/modules/Var/graph/VarDAGNode';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import VarsServerController from './VarsServerController';

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
    public static getInstance(): VarsCacheController {
        if (!VarsCacheController.instance) {
            VarsCacheController.instance = new VarsCacheController();
        }
        return VarsCacheController.instance;
    }

    private static instance: VarsCacheController = null;

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
     * Cas C
     */
    public C_use_partial_cache_element(node: VarDAGNode, partial_cache: VarDataBaseVO): boolean {

        /**
         * Stratégie naïve :
         *  on calcul une estimation de charge de calcu : CARD * cout moyen pour 1000 card / 1000
         *  si sup à un seuil => on accepte d'utiliser ce shard, sinon non
         */
        let card = MatroidController.getInstance().get_cardinal(partial_cache);
        let controller = VarsServerController.getInstance().getVarControllerById(node.var_data.var_id);

        return (card * controller.var_cache_conf.calculation_cost_for_1000_card / 1000) >= controller.var_cache_conf.cache_seuil_c;
    }

}