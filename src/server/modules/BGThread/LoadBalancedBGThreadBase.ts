import IBGThread from "./interfaces/IBGThread";

export default abstract class LoadBalancedBGThreadBase implements IBGThread {

    public static LOAD_BALANCED_BGTHREAD_NAME_SUFFIX: string = '##lb##';

    /**
     * Par définition un bgthread loadbalancé est exécuté dans un thread dédié (et dans plusieurs puisqu'on loadbalance)
     */
    public exec_in_dedicated_thread: boolean = true;

    public this_worker_index: number = 0;

    abstract current_timeout: number;
    abstract MAX_timeout: number;
    abstract MIN_timeout: number;

    /**
     * Le nom du worker d'un bgthrad loadbalancé est le nom de base + ##lb## + l'index du worker
     * Attention '.*##lb##.*' est donc un nom réservé pour les bgthreads loadbalancés. Si on trouve ##lb## dans le nom d'un bgthread, on sait que c'est un bgthread loadbalancé
     */
    get name(): string {
        return this.base_name + LoadBalancedBGThreadBase.LOAD_BALANCED_BGTHREAD_NAME_SUFFIX + this.this_worker_index;
    }

    abstract get base_name(): string;

    /**
     * Ya pas de work sur un bgthread qui sert de load balancer. c'est les méthode qui sont indiquée run on bgthread qui sont loadbalancées
     */
    public async work(): Promise<number> {
        return null;
    }
}