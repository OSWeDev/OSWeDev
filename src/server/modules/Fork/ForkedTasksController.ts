import ForkMessageController from './ForkMessageController';
import ForkServerController from './ForkServerController';
import MainProcessTaskForkMessage from './messages/MainProcessTaskForkMessage';
import BroadcastWrapperForkMessage from './messages/BroadcastWrapperForkMessage';
import BGThreadServerController from '../BGThread/BGThreadServerController';
import BGThreadProcessTaskForkMessage from './messages/BGThreadProcessTaskForkMessage';

export default class ForkedTasksController {

    public static getInstance() {
        if (!ForkedTasksController.instance) {
            ForkedTasksController.instance = new ForkedTasksController();
        }
        return ForkedTasksController.instance;
    }

    private static instance: ForkedTasksController = null;

    /**
     * Local thread cache -----
     */
    public registered_task_result_resolvers: { [result_task_uid: number]: (result: any) => any } = {};
    private registered_tasks: { [task_uid: string]: (...task_params) => Promise<boolean> } = {};

    private result_task_prefix_thread_uid: number = process.pid;
    private result_task_uid: number = 1;
    /**
     * ----- Local thread cache
     */

    private constructor() { }

    get process_registered_tasks(): { [task_uid: string]: (...task_params) => Promise<boolean> } {
        return this.registered_tasks;
    }

    public get_result_task_uid(): string {
        return this.result_task_prefix_thread_uid + '_' + (this.result_task_uid++);
    }

    public register_task(task_uid: string, handler: (...task_params) => Promise<boolean>) {
        this.registered_tasks[task_uid] = handler;
    }

    /**
     * Objectif : Exécuter la fonction sur tous les threads, et le plus vite possible (et en synchrone) en local
     *  donc on envoie un message pour tous les autres threads, mais on indique bien que nous c'est fait
     * @param task_uid
     * @param task_params
     */
    public async broadexec(task_uid: string, ...task_params): Promise<boolean> {
        if (!ForkServerController.getInstance().is_main_process) {
            // ForkMessageController.getInstance().send(new BroadcastWrapperForkMessage(new MainProcessTaskForkMessage(task_uid, task_params)).except_self());

            // Si on est pas sur le thread parent, on doit d'abord le lancer en local, puis envoyer aux autres threads
            await ForkedTasksController.getInstance().process_registered_tasks[task_uid](...task_params);
            await ForkMessageController.getInstance().send(new BroadcastWrapperForkMessage(new MainProcessTaskForkMessage(task_uid, task_params)).except_self());

            return true;
        } else {

            // Si on est sur le thread parent, le broadcast s'occupe de lancer la tache en local aussi
            return await ForkMessageController.getInstance().broadcast(new MainProcessTaskForkMessage(task_uid, task_params));
        }
    }

    /**
     * Objectif : Exécuter la fonction sur le thread principal et récupérer la valeur de retour.
     *  On envoie la demande au thread maitre si besoin, sinon on exécute directement
     * @param task_uid
     * @param task_params
     * @param resolver fonction resolve issue de la promise de la fonction que l'on souhaite exécuter côté main process
     */
    public async exec_self_on_main_process_and_return_value(task_uid: string, resolver, ...task_params): Promise<boolean> {
        if (!ForkServerController.getInstance().is_main_process) {

            let result_task_uid = this.get_result_task_uid();
            this.registered_task_result_resolvers[result_task_uid] = resolver;

            // On doit envoyer la demande d'éxécution ET un ID de callback pour récupérer le résultat
            await ForkMessageController.getInstance().send(new MainProcessTaskForkMessage(task_uid, task_params, result_task_uid));
            return false;
        }
        return true;
    }

    /**
     * Objectif : Exécuter la fonction sur le thread principal. On envoie la demande au thread maitre si besoin, sinon on exécute directement
     * @param task_uid
     * @param task_params
     */
    public async exec_self_on_main_process(task_uid: string, ...task_params): Promise<boolean> {
        if (!ForkServerController.getInstance().is_main_process) {
            await ForkMessageController.getInstance().send(new MainProcessTaskForkMessage(task_uid, task_params));
            return false;
        }
        return true;
    }

    /**
     * Objectif : Exécuter la fonction sur un thread particulier. On envoie la demande à tous au besoin, sinon on exécute directement
     * @param bgthread le nom de la tache de type bgthread, dont on va chercher le thread actuel
     * @param task_uid
     * @param task_params
     */
    public exec_self_on_bgthread(bgthread: string, task_uid: string, ...task_params): boolean {
        if (!BGThreadServerController.getInstance().valid_bgthreads_names[bgthread]) {
            ForkMessageController.getInstance().broadcast(new BGThreadProcessTaskForkMessage(bgthread, task_uid, task_params));
            return false;
        }
        return true;
    }

    /**
     * Objectif : Exécuter la fonction sur le bgthread et récupérer la valeur de retour.
     *  On envoie la demande au thread maitre si besoin, sinon on exécute directement
     * @param task_uid
     * @param task_params
     * @param resolver fonction resolve issue de la promise de la fonction que l'on souhaite exécuter côté main process
     */
    public exec_self_on_bgthread_and_return_value(bgthread: string, task_uid: string, resolver, ...task_params): boolean {
        if (!BGThreadServerController.getInstance().valid_bgthreads_names[bgthread]) {

            let result_task_uid = this.get_result_task_uid();
            this.registered_task_result_resolvers[result_task_uid] = resolver;

            // On doit envoyer la demande d'éxécution ET un ID de callback pour récupérer le résultat
            ForkMessageController.getInstance().broadcast(new BGThreadProcessTaskForkMessage(bgthread, task_uid, task_params, result_task_uid));
            return false;
        }
        return true;
    }

    public assert_is_main_process() {
        if (!ForkServerController.getInstance().is_main_process) {
            throw new Error('Should not be called on child process. See exec_async_task_on_main_process.');
        }
    }

    // /**
    //  * Méthode qui permet d'encapsuler l'appel à une méthode pour la réaliser sur le process main
    //  * ATTENTION on attend aucun retour, et on attend pas l'exécution donc on est en asynchrone pur sur ces taches
    //  * @param task_uid Identifiant pour cette fonction, unique parmi les tasks qui passent par des messages
    //  * @param task_handler La méthode cible si on est sur le bon process
    //  * @param task_params Les paramères à appliquer
    //  */
    // public exec_async_task_on_main_process(task_uid: string, ...task_params) {
    //     if (ForkServerController.getInstance().is_main_process) {
    //         this.registered_tasks[task_uid](...task_params);
    //         return;
    //     }

    //     ForkMessageController.getInstance().send(new MainProcessTaskForkMessage(task_uid, task_params));
    // }
}