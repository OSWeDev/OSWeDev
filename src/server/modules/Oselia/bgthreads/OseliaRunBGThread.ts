import UserVO from '../../../../shared/modules/AccessPolicy/vos/UserVO';
import ContextFilterVO, { filter } from '../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../../shared/modules/ContextFilter/vos/SortByVO';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import GPTAssistantAPIAssistantVO from '../../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantVO';
import GPTAssistantAPIThreadVO from '../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';
import OseliaReferrerVO from '../../../../shared/modules/Oselia/vos/OseliaReferrerVO';
import OseliaRunTemplateVO from '../../../../shared/modules/Oselia/vos/OseliaRunTemplateVO';
import OseliaRunVO from '../../../../shared/modules/Oselia/vos/OseliaRunVO';
import StatsController from '../../../../shared/modules/Stats/StatsController';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import ObjectHandler, { field_names, reflect } from '../../../../shared/tools/ObjectHandler';
import PromisePipeline from '../../../../shared/tools/PromisePipeline/PromisePipeline';
import IBGThread from '../../BGThread/interfaces/IBGThread';
import ModuleBGThreadServer from '../../BGThread/ModuleBGThreadServer';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';
import GPTAssistantAPIServerController from '../../GPT/GPTAssistantAPIServerController';
import ModuleOseliaServer from '../ModuleOseliaServer';
import OseliaRunServerController from '../OseliaRunServerController';
import OseliaRunTemplateServerController from '../OseliaRunTemplateServerController';
import OseliaServerController from '../OseliaServerController';
import OseliaRunBGThreadException from './OseliaRunBGThreadException';

export default class OseliaRunBGThread implements IBGThread {

    public static BGTHREAD_NAME: string = 'OseliaRunBGThread';

    /**
     * Les états qu'on peut faire avancer. ça n'empêche pas de créer des bgthreads ou cron pour corriger des blocages d'état et faire de la reprise sur erreur par ailleurs
     * mais ici on s'intéresse aux états qui peuvent avancer. Pas ended, pas en erreur, pas en attente des enfants, pas en cours
     */
    public static VALID_NEXT_RUN_STATES: number[] = [
        OseliaRunVO.STATE_TODO,
        // OseliaRunVO.STATE_SPLIT_ENDED, Si le split a eu lieu et est terminé, on est théoriquement passé en STATE_WAITING_SPLITS_END et c'est les enfants qui doivent passer ce run en STATE_WAIT_SPLITS_END_ENDED qui nous permet de continuer
        OseliaRunVO.STATE_WAIT_SPLITS_END_ENDED,
        OseliaRunVO.STATE_RUN_ENDED,
        OseliaRunVO.STATE_VALIDATION_ENDED,
    ];

    /**
     * Les états qui indiquent un run en attente ou qu'on peut faire avancer, mais pas terminé ni en erreur
     */
    public static EN_COURS_RUN_STATES: number[] = [
        OseliaRunVO.STATE_TODO,
        OseliaRunVO.STATE_SPLITTING,
        OseliaRunVO.STATE_SPLIT_ENDED,
        OseliaRunVO.STATE_WAITING_SPLITS_END,
        OseliaRunVO.STATE_WAIT_SPLITS_END_ENDED,
        OseliaRunVO.STATE_RUNNING,
        OseliaRunVO.STATE_RUN_ENDED,
        OseliaRunVO.STATE_VALIDATING,
        OseliaRunVO.STATE_VALIDATION_ENDED,
    ];

    public static END_STATES: number[] = [
        OseliaRunVO.STATE_DONE,
        OseliaRunVO.STATE_ERROR,
        OseliaRunVO.STATE_CANCELLED,
        OseliaRunVO.STATE_EXPIRED,
        OseliaRunVO.STATE_RERUN_ASKED,
    ];

    public static ERROR_END_STATES: number[] = [
        // OseliaRunVO.STATE_DONE, // On ne considère pas les runs terminés comme en erreur
        OseliaRunVO.STATE_ERROR,
        OseliaRunVO.STATE_CANCELLED,
        OseliaRunVO.STATE_EXPIRED,
        // OseliaRunVO.STATE_RERUN_ASKED, // On ne considère pas les runs en rerun comme en erreur car c'est le statut du rerun qui est important
    ];

    private static instance: OseliaRunBGThread = null;

    public current_timeout: number = 10000;
    public MAX_timeout: number = 30000;
    public MIN_timeout: number = 10;

    public exec_in_dedicated_thread: boolean = true;

    private currently_running_thread_ids: { [thread_id: number]: number } = {};

    private promise_pipeline: PromisePipeline = new PromisePipeline(10, 'OseliaRunBGThread');

    private constructor() {
    }

    get name(): string {
        return OseliaRunBGThread.BGTHREAD_NAME;
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!OseliaRunBGThread.instance) {
            OseliaRunBGThread.instance = new OseliaRunBGThread();
        }
        return OseliaRunBGThread.instance;
    }

    public async work(): Promise<number> {

        const time_in = Dates.now_ms();

        try {

            StatsController.register_stat_COMPTEUR('OseliaRunBGThread', 'work', 'IN');

            // On prend un run, dans un état a priori prêt à être traité, et qui soit a pas de thread, soit a pas de tag sur le thread pour indiquer qu'on a déjà testé
            const query_run = query(OseliaRunVO.API_TYPE_ID)
                .filter_is_null_or_empty(field_names<OseliaRunVO>().end_date) // Pas terminé
                .filter_by_num_has(field_names<OseliaRunVO>().state, OseliaRunBGThread.VALID_NEXT_RUN_STATES, OseliaRunVO.API_TYPE_ID) // On peut avancer (théoriquement modulo siblings, ...)
                // et c'est là qu'on indique soit ya pas encore de thread, soit ya pas de tag pour indiquer qu'on a déjà testé
                .add_filters([
                    ContextFilterVO.or([
                        filter(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().thread_id).is_null_or_empty(),
                        filter(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().thread_id).by_num_not_in(
                            query(GPTAssistantAPIThreadVO.API_TYPE_ID).field('id').filter_is_true(field_names<GPTAssistantAPIThreadVO>().has_no_run_ready_to_handle).exec_as_server())
                    ])
                ])
                .set_sort(new SortByVO(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().start_date, true))

                .set_discarded_field_path(GPTAssistantAPIThreadVO.API_TYPE_ID, reflect<GPTAssistantAPIThreadVO>().last_oselia_run_id) // On veut passer par le lien thread_id dans le run et pas par le lien last_oselia_run_id dans le thread

                .exec_as_server()
                .set_limit(1);

            if (ObjectHandler.hasAtLeastOneAttribute(this.currently_running_thread_ids)) { // Pas déjà en cours de traitement par ce bgthread
                query_run.filter_by_id_not_in(
                    query(GPTAssistantAPIThreadVO.API_TYPE_ID)
                        .filter_by_ids(Object.values(this.currently_running_thread_ids))
                        .field('id')
                        .exec_as_server(),
                    GPTAssistantAPIThreadVO.API_TYPE_ID);
            }

            const run: OseliaRunVO = await query_run.select_vo<OseliaRunVO>();

            if (!run) {
                this.stats_out('inactive', time_in);
                return ModuleBGThreadServer.TIMEOUT_COEF_SLEEP;
            }

            // On doit créer/récupérer le thread asap pour le sémaphore
            const assistant = await OseliaRunServerController.get_run_assistant(run);
            const thread = await OseliaRunServerController.get_run_thread(run, assistant);

            // On prend le semaphore
            this.currently_running_thread_ids[run.thread_id] = run.thread_id;

            await this.promise_pipeline.push(async () => {

                try {
                    await this.handle_next_thread_run(assistant, thread);

                } catch (error) {
                    ConsoleHandler.error('OseliaRunBGThread: ' + error);
                } finally {
                    // On libère le semaphore
                    delete this.currently_running_thread_ids[run.thread_id];
                }
            });

            this.stats_out('ok', time_in);
            return ModuleBGThreadServer.TIMEOUT_COEF_RUN;

        } catch (error) {
            ConsoleHandler.error(error);
        }

        this.stats_out('throws', time_in);
        return ModuleBGThreadServer.TIMEOUT_COEF_SLOWER;
    }

    private stats_out(activity: string, time_in: number) {

        const time_out = Dates.now_ms();
        StatsController.register_stat_COMPTEUR('OseliaRunBGThread', 'work', activity + '_OUT');
        StatsController.register_stat_DUREE('OseliaRunBGThread', 'work', activity + '_OUT', time_out - time_in);
    }

    private async handle_next_thread_run(
        assistant: GPTAssistantAPIAssistantVO,
        thread: GPTAssistantAPIThreadVO,
    ) {

        // On fait avancer le thread en prenant le premier run du thread qui peut avancer et on lance l'étape suivante
        // Comme c'est une arborescence, on doit charger tous les runs niveau par niveau pour savoir sur lequel on peut avancer
        let next_handleable_run = null;
        try {

            next_handleable_run = await this.get_next_handleable_run(thread);
        } catch (error) {

            if (!(error && (error as OseliaRunBGThreadException).the_run_is_stucked)) {

                ConsoleHandler.error('OseliaRunBGThread.handle_next_thread_run: ' + error);
                return;
            }
        }

        if (!next_handleable_run) {
            // Si on a pas de prochain run à traiter, on met à jour le thread et on sort
            thread.has_no_run_ready_to_handle = true;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(thread);
            return;
        }

        /**
         * Cas du next_handleable_run pas dans le même thread, on doit modifier le thread dans ce cas
         */
        if (next_handleable_run.thread_id != thread.id) {
            thread = await query(GPTAssistantAPIThreadVO.API_TYPE_ID).filter_by_id(next_handleable_run.thread_id).exec_as_server().select_vo<GPTAssistantAPIThreadVO>();
            assistant =
                next_handleable_run.assistant_id ?
                    await query(GPTAssistantAPIAssistantVO.API_TYPE_ID)
                        .filter_by_id(next_handleable_run.assistant_id)
                        .exec_as_server()
                        .select_vo<GPTAssistantAPIAssistantVO>() :
                    null;
        }

        switch (next_handleable_run.state) {
            case OseliaRunVO.STATE_TODO:
                await this.handle_STATE_TODO(next_handleable_run, thread, assistant);
                break;
            case OseliaRunVO.STATE_WAIT_SPLITS_END_ENDED:
                await this.handle_STATE_WAIT_SPLITS_END_ENDED(next_handleable_run, thread, assistant);
                break;
            case OseliaRunVO.STATE_RUN_ENDED:
                await this.handle_STATE_RUN_ENDED(next_handleable_run, thread, assistant);
                break;
            case OseliaRunVO.STATE_VALIDATION_ENDED:
                await this.handle_STATE_VALIDATION_ENDED(next_handleable_run, thread, assistant);
                break;
            default:
                ConsoleHandler.error('OseliaRunBGThread.handle_next_thread_run: next_handleable_run.state not handled: ' + next_handleable_run.state);
                throw new Error('OseliaRunBGThread.handle_next_thread_run: next_handleable_run.state not handled: ' + next_handleable_run.state);
        }

        // await ModuleDAOServer.instance.insertOrUpdateVO_as_server(next_handleable_run);
    }

    /**
     * Si on a pas de run en param, on charge le premier run pas terminé du thread sans parent_id (normalement le seul du coup),
     *  au cas où on classe par date de création
     * @param thread_to_handle
     * @param current_run
     */
    private async get_next_handleable_run(thread_to_handle: GPTAssistantAPIThreadVO, current_run: OseliaRunVO = null): Promise<OseliaRunVO> {

        if (!current_run) {
            current_run = await query(OseliaRunVO.API_TYPE_ID)
                .filter_by_num_has(field_names<OseliaRunVO>().state, OseliaRunBGThread.EN_COURS_RUN_STATES)
                .filter_by_id(thread_to_handle.id, GPTAssistantAPIThreadVO.API_TYPE_ID)
                .add_filters([ContextFilterVO.or([
                    // Ya pas de parent à ce run dans le thread :
                    // Donc soit ya pas de parent tout cours, soit le parent est dans un autre thread
                    filter(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().parent_run_id).is_null_or_empty(),
                    filter(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().parent_run_id).by_num_not_in(
                        query(OseliaRunVO.API_TYPE_ID).filter_by_num_eq(field_names<OseliaRunVO>().thread_id, thread_to_handle.id).field('id').exec_as_server()),
                ])])
                .set_sort(new SortByVO(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().version_timestamp, true))
                .set_discarded_field_path(GPTAssistantAPIThreadVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadVO>().last_oselia_run_id)
                .set_limit(1)
                .select_vo<OseliaRunVO>();

            if (!current_run) {
                throw new Error('OseliaRunBGThread.get_next_handleable_run: No next parent run found for thread but tried to get one, which might be a deadlock: ' + thread_to_handle.id + ' - ' + thread_to_handle.thread_title);
            }
        }

        /**
         * Si c'est une erreur, on ne peut pas continuer, on doit arrêter le traitement
         */
        if (OseliaRunBGThread.ERROR_END_STATES.indexOf(current_run.state) > -1) {
            throw new OseliaRunBGThreadException();
        }

        /**
         * Si le run est pas encours, on renvoie null directement quelque soit le type, pour indiquer qu'on peut passer au suivant
         */
        if (OseliaRunBGThread.EN_COURS_RUN_STATES.indexOf(current_run.state) <= -1) {
            return null;
        }

        /**
         * Si le run n'est pas un split, on doit juste vérifier son état vs les valides pour continuer
         *  et si on est en attente mais pas en handeable, on coupe le traitement si on est pas multi-threadé (throw error),
         *      ou on passe au suivant si on est multi-threadé (return null)
         *  et si on est en attente et handeable, on le renvoie c'est le prochain à traiter
         * Si le run est un split, et a donc déjà fait son split (sinon il est en todo donc il est renvoyé dans la première étape)
         *  - on cherche parmis ses enfants le prochain à traiter
         */
        if (OseliaRunBGThread.VALID_NEXT_RUN_STATES.indexOf(current_run.state) > -1) {
            return current_run;
        }

        if (current_run.state == OseliaRunVO.STATE_WAITING_SPLITS_END) {
            const children = await query(OseliaRunVO.API_TYPE_ID)
                .filter_by_num_eq(field_names<OseliaRunVO>().parent_run_id, current_run.id)
                .set_sort(new SortByVO(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().weight, true))
                .exec_as_server()
                .select_vos<OseliaRunVO>();

            for (const i in children) {
                const child = children[i];

                try {

                    const is_new_current_child = await this.get_next_handleable_run(thread_to_handle, child);
                    if (is_new_current_child) {
                        return is_new_current_child;
                    }
                } catch (error) {
                    if (error && (error as OseliaRunBGThreadException).the_run_is_stucked) {
                        if (current_run.childrens_are_multithreaded) {
                            // Si on multithread les enfants, on peut passer au suivant
                            continue;
                        } else {
                            // Sinon on est bloqué et on doit lancer une exception pour arrêter le traitement
                            throw new OseliaRunBGThreadException();
                        }
                    } else {
                        throw error;
                    }
                }

            }
        }

        throw new OseliaRunBGThreadException();
    }

    private async handle_STATE_TODO(
        run: OseliaRunVO,
        thread: GPTAssistantAPIThreadVO,
        assistant: GPTAssistantAPIAssistantVO,
    ) {
        if (run.use_splitter) {

            await OseliaRunServerController.update_oselia_run_state(run, OseliaRunVO.STATE_SPLITTING);
            await OseliaRunServerController.split_run(run, thread, assistant);
            return;
        } else {

            await this.handle_run(run, thread, assistant);
        }
    }

    /**
     * On gère vraiment le run en lui même
     */
    private async handle_run(
        run: OseliaRunVO,
        thread: GPTAssistantAPIThreadVO,
        assistant: GPTAssistantAPIAssistantVO,
    ) {

        switch (run.run_type) {

            case OseliaRunVO.RUN_TYPE_FOREACH_IN_SEPARATED_THREADS:

                await OseliaRunServerController.update_oselia_run_state(run, OseliaRunVO.STATE_RUNNING);

                if (!run.for_each_array_cache_key) {
                    run.error_msg = 'OseliaRunBGThread.handle_run: foreach run without for_each_array_cache_key';
                    await OseliaRunServerController.update_oselia_run_state(run, OseliaRunVO.STATE_ERROR);
                    return;
                }

                if (!run.for_each_element_run_template_id) {
                    run.error_msg = 'OseliaRunBGThread.handle_run: foreach run without for_each_element_run_template_id';
                    await OseliaRunServerController.update_oselia_run_state(run, OseliaRunVO.STATE_ERROR);
                    return;
                }

                const element_run_template = await query(OseliaRunTemplateVO.API_TYPE_ID)
                    .filter_by_id(run.for_each_element_run_template_id)
                    .exec_as_server()
                    .select_vo<OseliaRunTemplateVO>();

                if (!element_run_template) {
                    run.error_msg = 'OseliaRunBGThread.handle_run: foreach run without for_each_element_run_template';
                    await OseliaRunServerController.update_oselia_run_state(run, OseliaRunVO.STATE_ERROR);
                    return;
                }

                // On charge le tableau / la map depuis le cache
                const map_or_array = await ModuleOseliaServer.getInstance().get_cache_value(thread, run.for_each_array_cache_key);

                if (!map_or_array) {
                    run.error_msg = 'OseliaRunBGThread.handle_run: foreach map_or_array not found in cache: ' + run.for_each_array_cache_key;
                    await OseliaRunServerController.update_oselia_run_state(run, OseliaRunVO.STATE_ERROR);
                    return;
                }

                if (!run.for_each_parent_thread_id_cache_key) {
                    run.error_msg = 'OseliaRunBGThread.handle_run: foreach run without for_each_parent_thread_id_cache_key';
                    await OseliaRunServerController.update_oselia_run_state(run, OseliaRunVO.STATE_ERROR);
                    return;
                }

                try {

                    const user = await query(UserVO.API_TYPE_ID)
                        .filter_by_id(run.user_id)
                        .exec_as_server()
                        .select_vo<UserVO>();

                    const parsed = JSON.parse(map_or_array);

                    const referrers = await query(OseliaReferrerVO.API_TYPE_ID)
                        .filter_by_id(thread.id, GPTAssistantAPIThreadVO.API_TYPE_ID)
                        .exec_as_server()
                        .select_vos<OseliaReferrerVO>();

                    let has_splitts: boolean = false;

                    for (const i in parsed) {
                        const element = parsed[i];

                        const child_thread = await GPTAssistantAPIServerController.get_thread(run.user_id, null, element_run_template.oselia_thread_default_assistant_id);
                        if (referrers && (referrers.length > 0)) {
                            for (const referrer of referrers) {
                                await OseliaServerController.link_thread_to_referrer(child_thread.thread_vo, referrer);
                            }
                        }

                        child_thread.thread_vo.thread_title = (thread.thread_title ? '[SUB] ' + thread.thread_title + ' : ' : '[SUB] ') + 'foreach ' + run.for_each_array_cache_key + ' : ' + i + ' : ' + element;
                        child_thread.thread_vo.needs_thread_title_build = false;
                        child_thread.thread_vo.thread_title_auto_build_locked = true;
                        child_thread.thread_vo.parent_thread_id = thread.id;
                        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(child_thread.thread_vo);

                        await OseliaRunTemplateServerController.create_run_from_template(
                            element_run_template,
                            {
                                [run.for_each_index_cache_key]: i,
                                [run.for_each_element_cache_key]: element,
                                [run.for_each_parent_thread_id_cache_key]: thread.id,
                            },
                            {
                                [run.for_each_index_cache_key]: i,
                                [run.for_each_element_cache_key]: element,
                                [run.for_each_parent_thread_id_cache_key]: thread.id,
                            },
                            referrers ? referrers[0] : null,
                            child_thread.thread_vo,
                            user,
                            run.id,
                        );
                        has_splitts = true;
                    }

                    if (has_splitts) {
                        await OseliaRunServerController.update_oselia_run_state(run, OseliaRunVO.STATE_WAITING_SPLITS_END);
                        return;
                    } else {
                        await OseliaRunServerController.update_oselia_run_state(run, OseliaRunVO.STATE_DONE);
                        return;
                    }

                } catch (error) {
                    run.error_msg = 'OseliaRunBGThread.handle_run: foreach error: ' + error;
                    await OseliaRunServerController.update_oselia_run_state(run, OseliaRunVO.STATE_ERROR);
                    return;
                }

            case OseliaRunVO.RUN_TYPE_ASSISTANT:
            default:
                await OseliaRunServerController.update_oselia_run_state(run, OseliaRunVO.STATE_RUNNING);
                await OseliaRunServerController.run_run(run, thread, assistant);
                break;
        }
    }

    private async handle_STATE_WAIT_SPLITS_END_ENDED(
        run: OseliaRunVO,
        thread: GPTAssistantAPIThreadVO,
        assistant: GPTAssistantAPIAssistantVO,
    ) {

        // On a donc pas de run à faire, on est sur un split, donc on passe à la validation si besoin sinon on ferme
        if (run.use_validator) {

            await OseliaRunServerController.update_oselia_run_state(run, OseliaRunVO.STATE_VALIDATING);
            await OseliaRunServerController.validate_run(run, thread, assistant);
            return;
        }

        await OseliaRunServerController.update_oselia_run_state(run, OseliaRunVO.STATE_DONE);
    }

    private async handle_STATE_RUN_ENDED(
        run: OseliaRunVO,
        thread: GPTAssistantAPIThreadVO,
        assistant: GPTAssistantAPIAssistantVO,
    ) {
        if (run.use_validator) {

            await OseliaRunServerController.update_oselia_run_state(run, OseliaRunVO.STATE_VALIDATING);
            await OseliaRunServerController.validate_run(run, thread, assistant);
            return;
        }

        await OseliaRunServerController.update_oselia_run_state(run, OseliaRunVO.STATE_DONE);
    }

    private async handle_STATE_VALIDATION_ENDED(
        run: OseliaRunVO,
        thread: GPTAssistantAPIThreadVO,
        assistant: GPTAssistantAPIAssistantVO,
    ) {
        await OseliaRunServerController.update_oselia_run_state(run, OseliaRunVO.STATE_DONE);
    }
}