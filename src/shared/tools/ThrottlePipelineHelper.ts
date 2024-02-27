import ConsoleHandler from './ConsoleHandler';
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
     * @param wait_ms Le temps d'attente entre chaque check des éléments en attente, si il n'y en a pas à date (sinon on boucle sans attente)
     * @param pipeline_size Le nombre max d'appel à la func d'aggrégat en //
     * @param max_stack_size Le nombre max de params qu'on aggrège dans un seul appel à la func d'aggrégat
     * @returns
     */
    public static declare_throttled_pipeline<ParamType, ResultType>(
        pipeline_name: string,
        func: (params: { [index: number | string]: ParamType }) => { [index: number | string]: ResultType } | Promise<{ [index: number | string]: ResultType }>,
        wait_ms: number,
        pipeline_size: number,
        max_stack_size: number
    ) {

        const UID = ThrottlePipelineHelper.UID++;
        ThrottlePipelineHelper.throttled_pipeline_names_by_UID[UID] = pipeline_name;
        setTimeout(() => {
            ThrottlePipelineHelper.unstack_throttled_pipeline_process(UID, func, wait_ms, pipeline_size, max_stack_size);
        }, 1);

        return async (index: number | string, param: ParamType): Promise<ResultType> => {

            return new Promise(async (resolve, reject) => {

                if (!ThrottlePipelineHelper.throttled_pipeline_call_ids[UID]) {
                    ThrottlePipelineHelper.throttled_pipeline_call_ids[UID] = 0;
                }
                const call_id = ThrottlePipelineHelper.throttled_pipeline_call_ids[UID]++;

                if (!ThrottlePipelineHelper.throttled_pipeline_index_by_call_id[UID]) {
                    ThrottlePipelineHelper.throttled_pipeline_index_by_call_id[UID] = {};
                }
                ThrottlePipelineHelper.throttled_pipeline_index_by_call_id[UID][call_id] = index;

                if (!ThrottlePipelineHelper.throttled_pipeline_call_resolvers_by_call_id[UID]) {
                    ThrottlePipelineHelper.throttled_pipeline_call_resolvers_by_call_id[UID] = {};
                }
                ThrottlePipelineHelper.throttled_pipeline_call_resolvers_by_call_id[UID][call_id] = resolve;

                if (!ThrottlePipelineHelper.throttled_pipeline_call_rejecters_by_call_id[UID]) {
                    ThrottlePipelineHelper.throttled_pipeline_call_rejecters_by_call_id[UID] = {};
                }
                ThrottlePipelineHelper.throttled_pipeline_call_rejecters_by_call_id[UID][call_id] = reject;

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

    protected static throttled_pipeline_names_by_UID: { [UID: number]: string } = {};

    protected static throttled_pipeline_stack_args: { [throttle_id: number]: { [call_id: number]: any } } = {};
    protected static throttled_pipeline_call_ids: { [throttle_id: number]: number } = {};

    // L'index n'est pas unique c'est pourquoi on utilise le call_id pour retrouver le resolver
    protected static throttled_pipeline_index_by_call_id: { [throttle_id: number]: { [call_id: number]: number | string } } = {};
    protected static throttled_pipeline_call_resolvers_by_call_id: { [throttle_id: number]: { [call_id: number]: (a: any) => void } } = {};
    protected static throttled_pipeline_call_rejecters_by_call_id: { [throttle_id: number]: { [call_id: number]: (a: any) => void } } = {};

    /**
     * Copie interne du ThreadHandler.sleep, pour ne pas avoir de dépendance circulaire et sans stats
     */
    private static async sleep(timeout: number): Promise<void> {

        return new Promise<any>((resolve) => {
            setTimeout(() => {
                resolve("sleep");
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
        pipeline_size: number,
        max_stack_size: number
    ) {

        const promise_pipeline = new PromisePipeline(pipeline_size, 'ThrottledPipeline.' + ThrottlePipelineHelper.throttled_pipeline_names_by_UID[UID]);

        while (true) {

            if (!ThrottlePipelineHelper.throttled_pipeline_stack_args[UID]) {
                await ThrottlePipelineHelper.sleep(wait_ms);
                continue;
            }

            const params_by_call_id: { [call_id: number]: ParamType } = ThrottlePipelineHelper.throttled_pipeline_stack_args[UID];
            delete ThrottlePipelineHelper.throttled_pipeline_stack_args[UID];

            // On fait des paquets de params en fonction du max_stack_size
            let current_stack_size = 0;
            let params_by_index: { [index: string | number]: ParamType } = {};
            let current_stack_param_by_call_id: { [call_id: number]: ParamType } = {};

            for (const call_id in params_by_call_id) {
                const index = ThrottlePipelineHelper.throttled_pipeline_index_by_call_id[UID][call_id];
                params_by_index[index] = params_by_call_id[call_id];
                current_stack_param_by_call_id[call_id] = params_by_call_id[call_id];

                current_stack_size++;
                if (current_stack_size >= max_stack_size) {
                    await ThrottlePipelineHelper.handle_throttled_pipeline_call(UID, func, current_stack_param_by_call_id, promise_pipeline, params_by_index);
                    params_by_index = {};
                    current_stack_param_by_call_id = {};
                    current_stack_size = 0;
                }
            }

            if (current_stack_size) {
                await ThrottlePipelineHelper.handle_throttled_pipeline_call(UID, func, current_stack_param_by_call_id, promise_pipeline, params_by_index);
            }
        }
    }

    private static async handle_throttled_pipeline_call<ParamType, ResultType>(
        UID: number,
        func: (params: { [index: number | string]: ParamType }) => { [index: number | string]: ResultType } | Promise<{ [index: number | string]: ResultType }>,
        params_by_call_id: { [call_id: number]: ParamType },
        promise_pipeline: PromisePipeline,
        params_by_index: { [index: string | number]: ParamType }
    ) {
        await promise_pipeline.push(async () => {

            try {
                const func_result: { [index: string | number]: ResultType } = await func(params_by_index);

                // On repart des params, ce qui permet de ne pas avoir de résultat pour un index plutôt que d'envoyer null ou undefined
                const promises = [];
                for (const i in params_by_call_id) {
                    const call_id = parseInt(i);
                    const index = ThrottlePipelineHelper.throttled_pipeline_index_by_call_id[UID][call_id];

                    promises.push(ThrottlePipelineHelper.throttled_pipeline_call_resolvers_by_call_id[UID][call_id](func_result ? func_result[index] : null));

                    delete ThrottlePipelineHelper.throttled_pipeline_call_resolvers_by_call_id[UID][call_id];
                    delete ThrottlePipelineHelper.throttled_pipeline_call_rejecters_by_call_id[UID][call_id];
                    delete ThrottlePipelineHelper.throttled_pipeline_index_by_call_id[UID][call_id];
                }
                await all_promises(promises);
            } catch (error) {

                ConsoleHandler.error('ThrottlePipelineHelper.handle_throttled_pipeline_call:' + error);

                // On repart des params, ce qui permet de ne pas avoir de résultat pour un index plutôt que d'envoyer null ou undefined
                const promises = [];
                for (const i in params_by_call_id) {
                    const call_id = parseInt(i);

                    promises.push(ThrottlePipelineHelper.throttled_pipeline_call_rejecters_by_call_id[UID][call_id](error));

                    delete ThrottlePipelineHelper.throttled_pipeline_call_resolvers_by_call_id[UID][call_id];
                    delete ThrottlePipelineHelper.throttled_pipeline_call_rejecters_by_call_id[UID][call_id];
                    delete ThrottlePipelineHelper.throttled_pipeline_index_by_call_id[UID][call_id];
                }
                await all_promises(promises);
            }
        });
    }
}