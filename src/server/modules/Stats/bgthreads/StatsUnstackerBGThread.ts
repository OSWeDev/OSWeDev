import ContextFilterVO, { filter } from '../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import StatsController from '../../../../shared/modules/Stats/StatsController';
import StatClientWrapperVO from '../../../../shared/modules/Stats/vos/StatClientWrapperVO';
import StatsCategoryVO from '../../../../shared/modules/Stats/vos/StatsCategoryVO';
import StatsEventVO from '../../../../shared/modules/Stats/vos/StatsEventVO';
import StatsGroupVO from '../../../../shared/modules/Stats/vos/StatsGroupVO';
import StatsSubCategoryVO from '../../../../shared/modules/Stats/vos/StatsSubCategoryVO';
import StatsThreadVO from '../../../../shared/modules/Stats/vos/StatsThreadVO';
import StatsTypeVO from '../../../../shared/modules/Stats/vos/StatsTypeVO';
import StatVO from '../../../../shared/modules/Stats/vos/StatVO';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import IBGThread from '../../BGThread/interfaces/IBGThread';
import ModuleBGThreadServer from '../../BGThread/ModuleBGThreadServer';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';
import ForkedTasksController from '../../Fork/ForkedTasksController';

/**
 * Objectif centraliser les stats pour éviter les doublons dans les liaisons et délestet les autres threads de ces requêtes
 */
export default class StatsUnstackerBGThread implements IBGThread {

    public static TASK_NAME_register_aggregated_stats: string = 'StatsUnstackerBGThread.register_aggregated_stats';

    public static getInstance() {
        if (!StatsUnstackerBGThread.instance) {
            StatsUnstackerBGThread.instance = new StatsUnstackerBGThread();
        }
        return StatsUnstackerBGThread.instance;
    }

    private static instance: StatsUnstackerBGThread = null;

    public current_timeout: number = 10000;
    public MAX_timeout: number = 10000;
    public MIN_timeout: number = 10000;

    public exec_in_dedicated_thread: boolean = true;

    private group_cache: { [group_name: string]: StatsGroupVO } = {};

    private category_cache: { [category_name: string]: StatsCategoryVO } = {};
    private sub_category_cache: { [category_id: number]: { [sub_category_name: string]: StatsSubCategoryVO } } = {};
    private event_cache: { [sub_category_id: number]: { [event_name: string]: StatsEventVO } } = {};
    private stat_type_cache: { [stat_type_name: string]: StatsTypeVO } = {};
    private thread_cache: { [thread_name: string]: StatsThreadVO } = {};

    private cache_initialised: boolean = false;
    private aggregated_stats: StatClientWrapperVO[] = [];

    private constructor() {
        ForkedTasksController.getInstance().register_task(StatsUnstackerBGThread.TASK_NAME_register_aggregated_stats, this.register_aggregated_stats.bind(this));
    }

    /**
     * On récupère les stats aggrégées sur chaque thread et on les stocke dans le cache du bgthread dédié au unstack
     * @param aggregated_stats
     * @returns
     */
    public async register_aggregated_stats(
        aggregated_stats: StatClientWrapperVO[]
    ): Promise<void> {

        if (!aggregated_stats || !aggregated_stats.length) {
            return;
        }

        return new Promise(async (resolve, reject) => {

            let thrower = (error) => {
                ConsoleHandler.error('failed register_aggregated_stats:' + error);
                reject();
            };

            if (!await ForkedTasksController.getInstance().exec_self_on_bgthread_and_return_value(
                thrower,
                StatsUnstackerBGThread.getInstance().name,
                StatsUnstackerBGThread.TASK_NAME_register_aggregated_stats, resolve,
                aggregated_stats)) {
                return;
            }

            this.aggregated_stats = this.aggregated_stats.concat(aggregated_stats);
            resolve();
        });
    }

    get name(): string {
        return "StatsUnstackerBGThread";
    }

    /**
     * On recharge régulièrement les stats en fonction des paramètres
     */
    public async work(): Promise<number> {

        if (!StatsController.ACTIVATED) {
            return ModuleBGThreadServer.TIMEOUT_COEF_SLEEP;
        }

        let time_in = Dates.now_ms();

        try {

            StatsController.register_stat_COMPTEUR('StatsUnstackerBGThread', 'work', 'IN');

            if (!this.aggregated_stats || !this.aggregated_stats.length) {
                this.stats_out('inactive', time_in);
                return ModuleBGThreadServer.TIMEOUT_COEF_SLEEP;
            }
            let aggregated_stats = this.aggregated_stats;
            this.aggregated_stats = [];

            if (!this.cache_initialised) {
                await this.init_cache();
            }

            let stats_to_insert = [];
            for (let i in aggregated_stats) {
                let aggregated_stat = aggregated_stats[i];

                if (!aggregated_stat) {
                    continue;
                }

                if (
                    (!aggregated_stat.tmp_category_name) || (!aggregated_stat.tmp_sub_category_name) ||
                    (!aggregated_stat.tmp_event_name) || (!aggregated_stat.tmp_stat_type_name) || (!aggregated_stat.tmp_thread_name) ||
                    (aggregated_stat.stats_aggregator == null) || (aggregated_stat.stats_aggregator_min_segment_type == null)
                ) {
                    ConsoleHandler.error('StatsUnstackerBGThread:FAILED:aggregated_stat:Check fields:' + JSON.stringify(aggregated_stat));
                    continue;
                }

                /**
                 * On check qu'on peut créer la stat en retrouvant le groupe et toutes les deps
                 */
                let stats_name = aggregated_stat.tmp_category_name + '.' +
                    aggregated_stat.tmp_sub_category_name + '.' +
                    aggregated_stat.tmp_event_name + '.' +
                    aggregated_stat.tmp_stat_type_name + '.' +
                    StatsController.get_aggregator_extension(aggregated_stat.stats_aggregator) + '.' +
                    aggregated_stat.tmp_thread_name;

                let new_stat = new StatVO();
                new_stat.value = aggregated_stat.value;
                new_stat.timestamp_s = aggregated_stat.timestamp_s;
                new_stat.stat_group_id = await this.get_group_id(aggregated_stat, stats_name);
                if (!new_stat.stat_group_id) {
                    ConsoleHandler.error('StatsUnstackerBGThread:FAILED:aggregated_stat:Check fields:' + JSON.stringify(aggregated_stat));
                    continue;
                }

                stats_to_insert.push(new_stat);
            }
            await ModuleDAOServer.getInstance().insertOrUpdateVOsMulticonnections(stats_to_insert);

            this.stats_out('ok', time_in);
            return ModuleBGThreadServer.TIMEOUT_COEF_NEUTRAL;
        } catch (error) {
            ConsoleHandler.error('StatsUnstackerBGThread:FAILED:' + error);
        }

        this.stats_out('throws', time_in);
        return ModuleBGThreadServer.TIMEOUT_COEF_NEUTRAL;
    }

    private stats_out(activity: string, time_in: number) {

        let time_out = Dates.now_ms();
        StatsController.register_stat_COMPTEUR('StatsUnstackerBGThread', 'work', activity + '_OUT');
        StatsController.register_stat_DUREE('StatsUnstackerBGThread', 'work', activity + '_OUT', time_out - time_in);
    }

    private async get_stat_type_id(invalid_stats_group: StatsGroupVO) {

        if (!invalid_stats_group) {
            return null;
        }

        if (!invalid_stats_group.stat_type_name) {
            ConsoleHandler.error('Statsstat_typeMapperBGThread:FAILED:invalid_stats_group.tmp_stat_type_name:' + JSON.stringify(invalid_stats_group));
            invalid_stats_group.stat_type_name = 'ERROR';
        }

        if (!this.stat_type_cache[invalid_stats_group.stat_type_name]) {
            this.stat_type_cache[invalid_stats_group.stat_type_name] = new StatsTypeVO();
            this.stat_type_cache[invalid_stats_group.stat_type_name].name = invalid_stats_group.stat_type_name;
            let res = await ModuleDAO.getInstance().insertOrUpdateVO(this.stat_type_cache[invalid_stats_group.stat_type_name]);
            if ((!res) || !res.id) {
                delete this.stat_type_cache[invalid_stats_group.stat_type_name];
                throw new Error('Statsstat_typeMapperBGThread:FAILED:stat_type_cache:' + JSON.stringify(invalid_stats_group));
            }
            this.stat_type_cache[invalid_stats_group.stat_type_name].id = res.id;
        }
        return this.stat_type_cache[invalid_stats_group.stat_type_name].id;
    }

    private async get_group_id(client_stat: StatClientWrapperVO, stat_name: string) {

        if (!client_stat) {
            return null;
        }

        if (!stat_name) {
            ConsoleHandler.error('StatsUnstackerBGThread:FAILED:stat_name:' + JSON.stringify(client_stat));
            stat_name = 'ERROR';
        }

        if (!this.group_cache[stat_name]) {
            let new_group = new StatsGroupVO();
            new_group.name = stat_name;

            new_group.category_name = client_stat.tmp_category_name;
            new_group.sub_category_name = client_stat.tmp_sub_category_name;
            new_group.event_name = client_stat.tmp_event_name;
            new_group.stat_type_name = client_stat.tmp_stat_type_name;
            new_group.thread_name = client_stat.tmp_thread_name;
            new_group.stats_aggregator = client_stat.stats_aggregator;
            new_group.stats_aggregator_min_segment_type = client_stat.stats_aggregator_min_segment_type;

            new_group.category_id = await this.get_category_id(new_group);
            new_group.sub_category_id = await this.get_sub_category_id(new_group);
            new_group.event_id = await this.get_event_id(new_group);
            new_group.stat_type_id = await this.get_stat_type_id(new_group);
            new_group.thread_id = await this.get_thread_id(new_group);

            if (!new_group.category_id || !new_group.sub_category_id || !new_group.event_id || !new_group.stat_type_id || !new_group.thread_id) {
                throw new Error('StatsUnstackerBGThread:FAILED:group_cache:' + JSON.stringify(client_stat));
            }

            let res = await ModuleDAO.getInstance().insertOrUpdateVO(new_group);
            if ((!res) || !res.id || !new_group.id) {
                delete this.group_cache[stat_name];
                throw new Error('StatsUnstackerBGThread:FAILED:group_cache:' + JSON.stringify(client_stat));
            }
            this.group_cache[stat_name] = new_group;
        }
        return this.group_cache[stat_name].id;
    }

    private async get_category_id(invalid_stats_group: StatsGroupVO) {

        if (!invalid_stats_group) {
            return null;
        }

        if (!invalid_stats_group.category_name) {
            ConsoleHandler.error('StatsUnstackerBGThread:FAILED:invalid_stats_group.category_name:' + JSON.stringify(invalid_stats_group));
            invalid_stats_group.category_name = 'ERROR';
        }

        if (!this.category_cache[invalid_stats_group.category_name]) {
            this.category_cache[invalid_stats_group.category_name] = new StatsCategoryVO();
            this.category_cache[invalid_stats_group.category_name].name = invalid_stats_group.category_name;
            let res = await ModuleDAO.getInstance().insertOrUpdateVO(this.category_cache[invalid_stats_group.category_name]);
            if ((!res) || !res.id) {
                delete this.category_cache[invalid_stats_group.category_name];
                throw new Error('StatsUnstackerBGThread:FAILED:category_cache:' + JSON.stringify(invalid_stats_group));
            }
            this.category_cache[invalid_stats_group.category_name].id = res.id;
        }
        return this.category_cache[invalid_stats_group.category_name].id;
    }

    private async get_sub_category_id(invalid_stats_group: StatsGroupVO) {

        if (!invalid_stats_group) {
            return null;
        }

        if ((!invalid_stats_group.sub_category_name) || (!invalid_stats_group.category_id)) {
            ConsoleHandler.error('StatsUnstackerBGThread:FAILED:invalid_stats_group.tmp_sub_category_name:' + JSON.stringify(invalid_stats_group));
            invalid_stats_group.sub_category_name = 'ERROR';
        }

        if (!this.sub_category_cache[invalid_stats_group.category_id]) {
            this.sub_category_cache[invalid_stats_group.category_id] = {};
        }

        if (!this.sub_category_cache[invalid_stats_group.category_id][invalid_stats_group.sub_category_name]) {
            this.sub_category_cache[invalid_stats_group.category_id][invalid_stats_group.sub_category_name] = new StatsSubCategoryVO();
            this.sub_category_cache[invalid_stats_group.category_id][invalid_stats_group.sub_category_name].name = invalid_stats_group.sub_category_name;
            this.sub_category_cache[invalid_stats_group.category_id][invalid_stats_group.sub_category_name].category_id = invalid_stats_group.category_id;
            let res = await ModuleDAO.getInstance().insertOrUpdateVO(this.sub_category_cache[invalid_stats_group.category_id][invalid_stats_group.sub_category_name]);
            if ((!res) || !res.id) {
                delete this.sub_category_cache[invalid_stats_group.category_id][invalid_stats_group.sub_category_name];
                throw new Error('StatsUnstackerBGThread:FAILED:sub_category_cache:' + JSON.stringify(invalid_stats_group));
            }
            this.sub_category_cache[invalid_stats_group.category_id][invalid_stats_group.sub_category_name].id = res.id;
        }
        return this.sub_category_cache[invalid_stats_group.category_id][invalid_stats_group.sub_category_name].id;
    }

    private async get_event_id(invalid_stats_group: StatsGroupVO) {

        if (!invalid_stats_group) {
            return null;
        }

        if ((!invalid_stats_group.event_name) || (!invalid_stats_group.sub_category_id)) {
            ConsoleHandler.error('StatsUnstackerBGThread:FAILED:invalid_stats_group.tmp_event_name:' + JSON.stringify(invalid_stats_group));
            invalid_stats_group.event_name = 'ERROR';
        }

        if (!this.event_cache[invalid_stats_group.sub_category_id]) {
            this.event_cache[invalid_stats_group.sub_category_id] = {};
        }

        if (!this.event_cache[invalid_stats_group.sub_category_id][invalid_stats_group.event_name]) {
            this.event_cache[invalid_stats_group.sub_category_id][invalid_stats_group.event_name] = new StatsEventVO();
            this.event_cache[invalid_stats_group.sub_category_id][invalid_stats_group.event_name].name = invalid_stats_group.event_name;
            this.event_cache[invalid_stats_group.sub_category_id][invalid_stats_group.event_name].sub_category_id = invalid_stats_group.sub_category_id;
            let res = await ModuleDAO.getInstance().insertOrUpdateVO(this.event_cache[invalid_stats_group.sub_category_id][invalid_stats_group.event_name]);
            if ((!res) || !res.id) {
                delete this.event_cache[invalid_stats_group.sub_category_id][invalid_stats_group.event_name];
                throw new Error('StatsUnstackerBGThread:FAILED:event_cache:' + JSON.stringify(invalid_stats_group));
            }
            this.event_cache[invalid_stats_group.sub_category_id][invalid_stats_group.event_name].id = res.id;
        }
        return this.event_cache[invalid_stats_group.sub_category_id][invalid_stats_group.event_name].id;
    }

    private async get_thread_id(invalid_stats_group: StatsGroupVO) {

        if (!invalid_stats_group) {
            return null;
        }

        if (!invalid_stats_group.thread_name) {
            ConsoleHandler.error('StatsUnstackerBGThread:FAILED:invalid_stats_group.tmp_thread_name:' + JSON.stringify(invalid_stats_group));
            invalid_stats_group.thread_name = 'ERROR';
        }

        if (!this.thread_cache[invalid_stats_group.thread_name]) {
            this.thread_cache[invalid_stats_group.thread_name] = new StatsThreadVO();
            this.thread_cache[invalid_stats_group.thread_name].name = invalid_stats_group.thread_name;

            /**
             * Avant de créer on check qu'on a pas déjà en base, via alias par exemple ce thread, par ce que si on modifie en base en fait on ne le sait pas à ce stade
             */
            let lastcheck = await query(StatsThreadVO.API_TYPE_ID)
                .add_filters([
                    ContextFilterVO.or([
                        filter(StatsThreadVO.API_TYPE_ID, 'name').by_text_eq(invalid_stats_group.thread_name),
                        filter(StatsThreadVO.API_TYPE_ID, 'aliases').by_text_has(invalid_stats_group.thread_name),
                    ])
                ]).select_vo<StatsThreadVO>();
            if (!lastcheck) {
                let res = await ModuleDAO.getInstance().insertOrUpdateVO(this.thread_cache[invalid_stats_group.thread_name]);
                if ((!res) || !res.id) {
                    delete this.thread_cache[invalid_stats_group.thread_name];
                    throw new Error('StatsUnstackerBGThread:FAILED:thread_cache:' + JSON.stringify(invalid_stats_group));
                }
                this.thread_cache[invalid_stats_group.thread_name].id = res.id;
            } else {
                ConsoleHandler.log('StatsUnstackerBGThread:ALREADY_EXISTS:thread_cache:' + lastcheck.name + ':' + lastcheck.aliases.join(','));
                this.thread_cache[lastcheck.name] = lastcheck;
                for (let i in lastcheck.aliases) {
                    this.thread_cache[lastcheck.aliases[i]] = lastcheck;
                }
            }
        }
        return this.thread_cache[invalid_stats_group.thread_name].id;
    }

    private async init_cache() {
        let groups = await query(StatsGroupVO.API_TYPE_ID).select_vos<StatsGroupVO>();
        let categorys = await query(StatsCategoryVO.API_TYPE_ID).select_vos<StatsCategoryVO>();
        let subcategorys = await query(StatsSubCategoryVO.API_TYPE_ID).select_vos<StatsSubCategoryVO>();
        let events = await query(StatsEventVO.API_TYPE_ID).select_vos<StatsEventVO>();
        let threads = await query(StatsThreadVO.API_TYPE_ID).select_vos<StatsThreadVO>();
        let stat_types = await query(StatsTypeVO.API_TYPE_ID).select_vos<StatsTypeVO>();

        this.group_cache = {};
        for (let i in groups) {
            let group = groups[i];
            this.group_cache[group.name] = group;
        }

        this.stat_type_cache = {};
        for (let i in stat_types) {
            let stat_type = stat_types[i];
            this.stat_type_cache[stat_type.name] = stat_type;
        }

        this.category_cache = {};
        for (let i in categorys) {
            let category = categorys[i];
            this.category_cache[category.name] = category;
        }

        this.sub_category_cache = {};
        for (let i in subcategorys) {
            let subcategory = subcategorys[i];

            if (!this.sub_category_cache[subcategory.category_id]) {
                this.sub_category_cache[subcategory.category_id] = {};
            }
            this.sub_category_cache[subcategory.category_id][subcategory.name] = subcategory;
        }

        this.event_cache = {};
        for (let i in events) {
            let event = events[i];

            if (!this.event_cache[event.sub_category_id]) {
                this.event_cache[event.sub_category_id] = {};
            }
            this.event_cache[event.sub_category_id][event.name] = event;
        }

        this.thread_cache = {};
        for (let i in threads) {
            let thread = threads[i];
            this.thread_cache[thread.name] = thread;

            for (let j in thread.aliases) {
                let alias = thread.aliases[j];
                this.thread_cache[alias] = thread;
            }
        }

        this.cache_initialised = true;
    }
}