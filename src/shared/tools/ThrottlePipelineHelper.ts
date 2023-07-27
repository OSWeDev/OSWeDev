import PromisePipeline from './PromisePipeline/PromisePipeline';
import { all_promises } from './PromiseTools';

export default class ThrottlePipelineHelper {

    /**
     * En empile les appels à cette fonctions, et les paramètres associés, puis tous les
     *  wait_ms, on dépile les appels en attente, on les regroupe pour faire un packs de params, et un unique appel
     *  à la fonction func, avec un tableau de params. L'appel est fait dans un PromisePipeline, et donc on retourne directement
     *  attendre le prochain wait_ms, sans attendre la fin de l'appel à func, si il reste de la place dans le pipeline.
     * Contrairement aux autres fonctions de déclaration de throttle, la fonction à appeler retournera une promise
     *  qu'on peut donc await et avoir les résultats de l'appel qu'on souhaitait faire. Pour que cela fonctionne, il faut
     *  que la fonction func retourne une map, dont les indexes sont les indexes passés en premier param à cette fonction throttled.
     * Si func n'a pas de résultat pour un index de la demande, inutile de renvoyer un null ou un undefined à cet index de map,
     *  il suffit de ne pas mettre l'index dans la map.
     * ATTENTION : on génère un while(true) dans le process, donc il faut que la fonction func soit bien écrite pour
     *  ne pas boucler à l'infini, et qu'elle soit bien asynchrone pour ne pas bloquer le process. Par ailleurs, il faut
     *  limiter le nombre de process de ce type, car ils sont permanents et ne se terminent jamais. Le wait_ms doit être
     *  bien paramétré pour ne pas être trop petit si ce n'est pas absolument nécessaire.
     * @param func
     * @param wait_ms
     * @param pipeline_size
     * @returns
     */
    public static declare_throttled_pipeline<ParamType, ResultType>(
        func: (params: { [index: number | string]: ParamType }) => { [index: number | string]: ResultType } | Promise<{ [index: number | string]: ResultType }>,
        wait_ms: number,
        pipeline_size: number
    ) {

        let UID = ThrottlePipelineHelper.UID++;
        setTimeout(() => {
            ThrottlePipelineHelper.unstack_throttled_pipeline_process(UID, func, wait_ms, pipeline_size);
        }, 1);

        return async (index: number | string, param: ParamType): Promise<ResultType> => {

            return new Promise(async (resolve, reject) => {

                if (!ThrottlePipelineHelper.throttled_pipeline_call_ids[UID]) {
                    ThrottlePipelineHelper.throttled_pipeline_call_ids[UID] = 0;
                }
                let call_id = ThrottlePipelineHelper.throttled_pipeline_call_ids[UID]++;

                if (!ThrottlePipelineHelper.throttled_pipeline_index_by_call_id[UID]) {
                    ThrottlePipelineHelper.throttled_pipeline_index_by_call_id[UID] = {};
                }
                ThrottlePipelineHelper.throttled_pipeline_index_by_call_id[UID][call_id] = index;

                if (!ThrottlePipelineHelper.throttled_pipeline_call_resolvers_by_call_id[UID]) {
                    ThrottlePipelineHelper.throttled_pipeline_call_resolvers_by_call_id[UID] = {};
                }
                ThrottlePipelineHelper.throttled_pipeline_call_resolvers_by_call_id[UID][call_id] = resolve;

                if (!ThrottlePipelineHelper.throttled_pipeline_stack_args[UID]) {
                    ThrottlePipelineHelper.throttled_pipeline_stack_args[UID] = {
                        [call_id]: param
                    };
                } else {
                    ThrottlePipelineHelper.throttled_pipeline_stack_args[UID][call_id] = param;
                }
            });
        };
    }

    protected static UID: number = 0;

    protected static throttled_pipeline_stack_args: { [throttle_id: number]: { [call_id: number]: any } } = {};
    protected static throttled_pipeline_call_ids: { [throttle_id: number]: number } = {};

    // L'index n'est pas unique c'est pourquoi on utilise le call_id pour retrouver le resolver
    protected static throttled_pipeline_index_by_call_id: { [throttle_id: number]: { [call_id: number]: number | string } } = {};
    protected static throttled_pipeline_call_resolvers_by_call_id: { [throttle_id: number]: { [call_id: number]: (a: any) => void } } = {};

    /**
     * Copie interne du ThreadHandler.sleep, pour ne pas avoir de dépendance circulaire et sans stats
     */
    private static async sleep(timeout: number): Promise<void> {

        return new Promise<any>((resolve) => {
            setTimeout(() => {
                resolve(null);
            }, timeout);
        });
    }

    /**
     * Le process permanent qui va dépiler ces types de demandes
     * @param UID
     * @param func
     * @param wait_ms
     * @param pipeline_size
     */
    private static async unstack_throttled_pipeline_process<ParamType, ResultType>(
        UID: number,
        func: (params: { [index: number | string]: ParamType }) => { [index: number | string]: ResultType } | Promise<{ [index: number | string]: ResultType }>,
        wait_ms: number,
        pipeline_size: number
    ) {

        let promise_pipeline = new PromisePipeline(pipeline_size);

        while (true) {

            if (!ThrottlePipelineHelper.throttled_pipeline_stack_args[UID]) {
                await ThrottlePipelineHelper.sleep(wait_ms);
                continue;
            }

            let params_by_call_id: { [call_id: number]: ParamType } = ThrottlePipelineHelper.throttled_pipeline_stack_args[UID];
            delete ThrottlePipelineHelper.throttled_pipeline_stack_args[UID];

            await promise_pipeline.push(async () => {

                let params_by_index: { [index: string | number]: ParamType } = {};

                for (let call_id in params_by_call_id) {
                    let index = ThrottlePipelineHelper.throttled_pipeline_index_by_call_id[UID][call_id];
                    params_by_index[index] = params_by_call_id[call_id];
                }

                let func_result: { [index: string | number]: ResultType } = await func(params_by_index);

                // On repart des params, ce qui permet de ne pas avoir de résultat pour un index plutôt que d'envoyer null ou undefined
                let promises = [];
                for (let i in params_by_call_id) {
                    let call_id = parseInt(i);
                    let index = ThrottlePipelineHelper.throttled_pipeline_index_by_call_id[UID][call_id];

                    promises.push(ThrottlePipelineHelper.throttled_pipeline_call_resolvers_by_call_id[UID][call_id](func_result ? func_result[index] : null));

                    delete ThrottlePipelineHelper.throttled_pipeline_call_resolvers_by_call_id[UID][call_id];
                    delete ThrottlePipelineHelper.throttled_pipeline_index_by_call_id[UID][call_id];
                }
                await all_promises(promises);
            });
        }
    }
}