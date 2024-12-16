import { createHook } from 'async_hooks';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ParamVO from '../../../shared/modules/Params/vos/ParamVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ConfigurationService from '../../env/ConfigurationService';
import DAOPostCreateTriggerHook from '../DAO/triggers/DAOPostCreateTriggerHook';
import DAOPostUpdateTriggerHook from '../DAO/triggers/DAOPostUpdateTriggerHook';
import DAOUpdateVOHolder from '../DAO/vos/DAOUpdateVOHolder';
import ParamsServerController from '../Params/ParamsServerController';
import ModuleTriggerServer from '../Trigger/ModuleTriggerServer';


export default class AsyncHookPromiseWatchController {

    private static instance: AsyncHookPromiseWatchController = null;

    private static ACTIVATION_PARAM_NAME: string = 'AsyncHookPromiseWatchController.activate_async_hook_for_promise_watch';
    private static ACTIVATION_PARAM_DEFAULT_VALUE: boolean = false;

    private static TIMEOUT_LOG_MS_PARAM_NAME: string = 'AsyncHookPromiseWatchController.timeout_log_ms';
    private static TIMEOUT_LOG_MS_PARAM_DEFAULT_VALUE: number = 1000;
    private static LOGGING_INTERVAL_MS: number = 10000;

    private static LIMIT_TO_NEWS_PARAM_NAME: string = 'AsyncHookPromiseWatchController.limit_to_news';
    private static LIMIT_TO_NEWS_PARAM_DEFAULT_VALUE: boolean = true;

    private static current_timeout_log_ms: number = AsyncHookPromiseWatchController.TIMEOUT_LOG_MS_PARAM_DEFAULT_VALUE;
    private static current_activation: boolean = AsyncHookPromiseWatchController.ACTIVATION_PARAM_DEFAULT_VALUE;
    private static current_limit_to_news: boolean = AsyncHookPromiseWatchController.LIMIT_TO_NEWS_PARAM_DEFAULT_VALUE;

    private static promises: { [asyncId: number]: { timestamp: number, location: string, logged: boolean } } = {};
    private static interval: NodeJS.Timeout = null;

    private static hook = null;

    private constructor() { }

    // istanbul ignore next: nothing to test
    public static getInstance(): AsyncHookPromiseWatchController {
        if (!AsyncHookPromiseWatchController.instance) {
            AsyncHookPromiseWatchController.instance = new AsyncHookPromiseWatchController();
        }
        return AsyncHookPromiseWatchController.instance;
    }

    public static async init() {

        if (ConfigurationService.node_configuration.activate_async_hook_for_promise_watch) {
            const postCreateTrigger: DAOPostCreateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostCreateTriggerHook.DAO_POST_CREATE_TRIGGER);
            const postUpdateTrigger: DAOPostUpdateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostUpdateTriggerHook.DAO_POST_UPDATE_TRIGGER);

            const instance = AsyncHookPromiseWatchController.getInstance();

            postCreateTrigger.registerHandler(ParamVO.API_TYPE_ID, instance, instance.on_c_params);
            postUpdateTrigger.registerHandler(ParamVO.API_TYPE_ID, instance, instance.on_u_params);

            await instance.reload_params();
        }
    }

    private async on_c_params(param: ParamVO): Promise<void> {
        // a priori osef de recharger toujours les params de ce module à ce stade, on est en mode debug local par definition, ou en tout cas en train de monitorer les promises
        // ya pas vraiment de recherche de perfs à ce stade
        await this.reload_params();
    }

    private async on_u_params(vo_update_holder: DAOUpdateVOHolder<AccessPolicyVO>): Promise<void> {
        // a priori osef de recharger toujours les params de ce module à ce stade, on est en mode debug local par definition, ou en tout cas en train de monitorer les promises
        // ya pas vraiment de recherche de perfs à ce stade
        await this.reload_params();
    }

    private async reload_params() {
        AsyncHookPromiseWatchController.current_timeout_log_ms = await ParamsServerController.getParamValueAsInt_as_server(AsyncHookPromiseWatchController.TIMEOUT_LOG_MS_PARAM_NAME, AsyncHookPromiseWatchController.TIMEOUT_LOG_MS_PARAM_DEFAULT_VALUE);
        AsyncHookPromiseWatchController.current_limit_to_news = await ParamsServerController.getParamValueAsBoolean_as_server(AsyncHookPromiseWatchController.LIMIT_TO_NEWS_PARAM_NAME, AsyncHookPromiseWatchController.LIMIT_TO_NEWS_PARAM_DEFAULT_VALUE);
        const new_activation = await ParamsServerController.getParamValueAsBoolean_as_server(AsyncHookPromiseWatchController.ACTIVATION_PARAM_NAME, AsyncHookPromiseWatchController.ACTIVATION_PARAM_DEFAULT_VALUE);

        // On active le hook
        if ((!AsyncHookPromiseWatchController.current_activation) && new_activation) {

            if (!AsyncHookPromiseWatchController.hook) {
                AsyncHookPromiseWatchController.hook = createHook({
                    init(asyncId, type, triggerAsyncId) {
                        if (type === 'PROMISE') {
                            const error = new Error(); // Crée une erreur pour capturer la pile d'exécution.
                            // Ignore les deux premières lignes (init et Error) + les 4 suivantes :
                            // at emitInitNative(node: internal / async_hooks: 202: 43)
                            // at emitInitScript(node: internal / async_hooks: 505: 3)
                            // at promiseInitHook(node: internal / async_hooks: 324: 3)
                            // at promiseInitHookWithDestroyTracking(node: internal / async_hooks: 328: 3)
                            const stack = error.stack?.split('\n').slice(6).join('\n');

                            // On élimine les stacks inutiles - qui n'apportent pas d'information sur l'endroit où la promesse a été créée
                            if (stack) {

                                if (/ {4}at Promise\.then \(<anonymous>\)/.test(stack)) {
                                    return;
                                }

                                if (/ {4}at Promise\.then \(<anonymous>\)\n {4}at runNextTicks \(node:internal\/process\/task_queues:[0-9]+:[0-9]+\)\n {4}at listOnTimeout \(node:internal\/timers:[0-9]+:[0-9]+\) {4}at process\.processTimers \(node:internal\/timers:[0-9]+:[0-9]+\)/.test(stack)) {
                                    return;
                                }

                                if (/ {4}at Promise\.then \(<anonymous>\)\n {4}at runNextTicks \(node:internal\/process\/task_queues:[0-9]+:[0-9]+\)\n {4}at process\.processTimers \(node:internal\/timers:[0-9]+:[0-9]+\)/.test(stack)) {
                                    return;
                                }

                                if (/ {4}at Promise\.then \(<anonymous>\)\n {4}at process\.processTicksAndRejections \(node:internal\/process\/task_queues:[0-9]+:[0-9]+\)/.test(stack)) {
                                    return;
                                }

                                if (/ {4}at Timeout\._onTimeout \([^.]+\\node_modules\\oswedev\\dist\\shared\\tools\\ThreadHandler\.js:[0-9]+:[0-9]+\)\n {4}at listOnTimeout \(node:internal\/timers:[0-9]+:[0-9]+\)\n {4}at process\.processTimers \(node:internal\/timers:[0-9]+:[0-9]+\)/.test(stack)) {
                                    return;
                                }

                                // On ignore les sleeps du process de vars
                                if (/( {4}at new Promise \(<anonymous>\)\n)?( {4}at ThreadHandler\.sleep \([^)]+\\node_modules\\oswedev\\dist\\shared\\tools\\ThreadHandler\.js:[0-9]+:[0-9]+\)\n)? {4}at VarsProcess[^.]+\.work \([^.]+\\node_modules\\oswedev\\dist\\server\\modules\\Var\\bgthreads\\processes\\VarsProcessBase\.js:[0-9]+:[0-9]+\)(\n {4}at runNextTicks \(node:internal\/process\/task_queues:[0-9]+:[0-9]+\))?(\n {4}at listOnTimeout \(node:internal\/timers:[0-9]+:[0-9]+\))?(\n {4}at process\.processTimers \(node:internal\/timers:[0-9]+:[0-9]+\))?/.test(stack)) {
                                    return;
                                }

                                // On ignore les sleeps liés aux intervals de ThreadHandler
                                if (/ {4}at [^.]+\\node_modules\\oswedev\\dist\\shared\\tools\\ThreadHandler\.js:[0-9]+:[0-9]+/.test(stack)) {
                                    return;
                                }

                                if (/( {4}at new Promise \(<anonymous>\))?\n {4}at ThreadHandler.sleep \([^.]+\\node_modules\\oswedev\\dist\\shared\\tools\\ThreadHandler\.js:[0-9]+:[0-9]+\)\n {4}at [^.]+\\node_modules\\oswedev\\dist\\shared\\tools\\ThreadHandler\.js:[0-9]+:[0-9]+/.test(stack)) {
                                    return;
                                }

                                /**
                                 * TODO  enlever :
                                 *     at VarsProcessDeployDeps.work (D:\ws\GR\node_modules\oswedev\dist\server\modules\Var\bgthreads\processes\VarsProcessBase.js:71:43)
                                 * 
                                 * [DEBUG 2024-12-16 12:46:29.111] (thread 3) Pending_promise;92747;1734349587409.3884;1702.34521484375;    at ThreadHandler.sleep (D:\ws\GR\node_modules\oswedev\dist\shared\tools\ThreadHandler.js:17:23)
    at VarsProcessDagCleaner.work (D:\ws\GR\node_modules\oswedev\dist\server\modules\Var\bgthreads\processes\VarsProcessBase.js:71:43)
[DEBUG 2024-12-16 12:46:29.112] (thread 3) Pending_promise;92748;1734349587409.4177;1703.2568359375;    at new Promise (<anonymous>)
    at ThreadHandler.sleep (D:\ws\GR\node_modules\oswedev\dist\shared\tools\ThreadHandler.js:20:16)
    at VarsProcessDagCleaner.work (D:\ws\GR\node_modules\oswedev\dist\server\modules\Var\bgthreads\processes\VarsProcessBase.js:71:43)
[DEBUG 2024-12-16 12:46:29.112] (thread 3) Pending_promise;92750;1734349587409.4817;1703.204345703125;    at VarsProcessDagCleaner.work (D:\ws\GR\node_modules\oswedev\dist\server\modules\Var\bgthreads\processes\VarsProcessBase.js:71:43)

                                 */
                            }

                            AsyncHookPromiseWatchController.promises[asyncId] = {
                                timestamp: Dates.now_ms(),
                                location: stack || 'Unknown location',
                                logged: false,
                            };
                        }
                    },
                    promiseResolve(asyncId) {
                        delete AsyncHookPromiseWatchController.promises[asyncId];
                    },
                });
            }

            AsyncHookPromiseWatchController.hook.enable();

            // Vérification périodique
            if (AsyncHookPromiseWatchController.interval) {
                clearInterval(AsyncHookPromiseWatchController.interval);
                AsyncHookPromiseWatchController.interval = null;
            }
            AsyncHookPromiseWatchController.interval = setInterval(() => {

                // const pending_promises: { timestamp: number, location: string }[] = [];

                for (const asyncId in AsyncHookPromiseWatchController.promises) {
                    const p = AsyncHookPromiseWatchController.promises[asyncId];
                    if ((Dates.now_ms() - p.timestamp) > AsyncHookPromiseWatchController.current_timeout_log_ms) {

                        if (AsyncHookPromiseWatchController.current_limit_to_news && p.logged) {
                            continue;
                        }

                        p.logged = true;

                        // pending_promises.push(p);
                        ConsoleHandler.debug('Pending_promise;' + asyncId + ';' + p.timestamp + ';' + (Dates.now_ms() - p.timestamp) + ';' + p.location.replaceAll(';', ' '));
                    }
                }

                // if (pending_promises.length) {
                // console.log(
                //     'Pending promises:',
                //     pending_promises.map(p => ({
                //         age: Dates.now_ms() - p.timestamp,
                //         location: p.location,
                //     }))
                // );
                // }
            }, AsyncHookPromiseWatchController.LOGGING_INTERVAL_MS);


            ConsoleHandler.debug('AsyncHookPromiseWatchController: hook enabled');
        }

        // On désactive le hook
        else if (AsyncHookPromiseWatchController.current_activation && (!new_activation)) {
            AsyncHookPromiseWatchController.hook.disable();

            // Vérification périodique
            if (AsyncHookPromiseWatchController.interval) {
                clearInterval(AsyncHookPromiseWatchController.interval);
                AsyncHookPromiseWatchController.interval = null;
            }

            ConsoleHandler.debug('AsyncHookPromiseWatchController: hook disabled');
        }

        AsyncHookPromiseWatchController.current_activation = new_activation;
    }
}