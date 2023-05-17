import ContextFilterVO, { filter } from '../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import StatsController from '../../../../shared/modules/Stats/StatsController';
import StatsCategoryVO from '../../../../shared/modules/Stats/vos/StatsCategoryVO';
import StatsEventVO from '../../../../shared/modules/Stats/vos/StatsEventVO';
import StatsGroupVO from '../../../../shared/modules/Stats/vos/StatsGroupVO';
import StatsSubCategoryVO from '../../../../shared/modules/Stats/vos/StatsSubCategoryVO';
import StatsThreadVO from '../../../../shared/modules/Stats/vos/StatsThreadVO';
import StatsTypeVO from '../../../../shared/modules/Stats/vos/StatsTypeVO';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import IBGThread from '../../BGThread/interfaces/IBGThread';
import ModuleBGThreadServer from '../../BGThread/ModuleBGThreadServer';

/**
 * On prend toutes les stats dont les liaisons de catégories sont pas à jour et on met à jour de manière centralisée
 */
export default class StatsCategoryMapperBGThread implements IBGThread {

    public static getInstance() {
        if (!StatsCategoryMapperBGThread.instance) {
            StatsCategoryMapperBGThread.instance = new StatsCategoryMapperBGThread();
        }
        return StatsCategoryMapperBGThread.instance;
    }

    private static instance: StatsCategoryMapperBGThread = null;

    public current_timeout: number = 10000;
    public MAX_timeout: number = 10000;
    public MIN_timeout: number = 10000;

    private category_cache: { [category_name: string]: StatsCategoryVO } = {};
    private sub_category_cache: { [category_id: number]: { [sub_category_name: string]: StatsSubCategoryVO } } = {};
    private event_cache: { [sub_category_id: number]: { [event_name: string]: StatsEventVO } } = {};
    private stat_type_cache: { [stat_type_name: string]: StatsTypeVO } = {};
    private thread_cache: { [thread_name: string]: StatsThreadVO } = {};

    private cache_initialised: boolean = false;

    private constructor() { }

    get name(): string {
        return "StatsCategoryMapperBGThread";
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

            StatsController.register_stat_COMPTEUR('StatsCategoryMapperBGThread', 'work', 'IN');

            if (!this.cache_initialised) {
                await this.init_cache();
            }

            let invalid_stats_groups: StatsGroupVO[] = await query(StatsGroupVO.API_TYPE_ID).add_filters([
                ContextFilterVO.or([
                    filter(StatsGroupVO.API_TYPE_ID, 'category_id').is_null_or_empty(),
                    filter(StatsGroupVO.API_TYPE_ID, 'sub_category_id').is_null_or_empty(),
                    filter(StatsGroupVO.API_TYPE_ID, 'event_id').is_null_or_empty(),
                    filter(StatsGroupVO.API_TYPE_ID, 'stat_type_id').is_null_or_empty(),
                    filter(StatsGroupVO.API_TYPE_ID, 'thread_id').is_null_or_empty(),
                ])
            ]).select_vos<StatsGroupVO>();

            if (!invalid_stats_groups || !invalid_stats_groups.length) {
                this.stats_out('inactive', time_in);
                return ModuleBGThreadServer.TIMEOUT_COEF_NEUTRAL;
            }

            await this.handle_invalid_stats_groups(invalid_stats_groups);

            this.stats_out('ok', time_in);
            return ModuleBGThreadServer.TIMEOUT_COEF_NEUTRAL;
        } catch (error) {
            ConsoleHandler.error('StatsCategoryMapperBGThread:FAILED:' + error);
        }

        this.stats_out('throws', time_in);
        return ModuleBGThreadServer.TIMEOUT_COEF_NEUTRAL;
    }

    private stats_out(activity: string, time_in: number) {

        let time_out = Dates.now_ms();
        StatsController.register_stat_COMPTEUR('StatsCategoryMapperBGThread', 'work', activity + '_OUT');
        StatsController.register_stat_DUREE('StatsCategoryMapperBGThread', 'work', activity + '_OUT', time_out - time_in);
    }

    private async handle_invalid_stats_groups(invalid_stats_groups: StatsGroupVO[]) {

        /**
         * Pour chacun on va chercher les liens manquants et vider les données temporaires quand tout est ok
         */
        let updateds = [];
        for (let i in invalid_stats_groups) {
            let invalid_stats_group = invalid_stats_groups[i];

            try {

                if (!invalid_stats_group.category_id) {
                    invalid_stats_group.category_id = await this.get_category_id(invalid_stats_group);
                }
                if (!invalid_stats_group.sub_category_id) {
                    invalid_stats_group.sub_category_id = await this.get_sub_category_id(invalid_stats_group);
                }
                if (!invalid_stats_group.event_id) {
                    invalid_stats_group.event_id = await this.get_event_id(invalid_stats_group);
                }
                if (!invalid_stats_group.stat_type_id) {
                    invalid_stats_group.stat_type_id = await this.get_stat_type_id(invalid_stats_group);
                }
                if (!invalid_stats_group.thread_id) {
                    invalid_stats_group.thread_id = await this.get_thread_id(invalid_stats_group);
                }
            } catch (error) {
                ConsoleHandler.error('StatsCategoryMapperBGThread:FAILED:' + invalid_stats_group.id + ':' + error);
                continue;
            }

            updateds.push(invalid_stats_group);
        }

        await ModuleDAO.getInstance().insertOrUpdateVOs(updateds);
    }

    private async get_stat_type_id(invalid_stats_group: StatsGroupVO) {

        if (!invalid_stats_group) {
            return null;
        }

        if (!invalid_stats_group.stat_type_name) {
            ConsoleHandler.error('Statsstat_typeMapperBGThread:FAILED:invalid_stats_group.tmp_stat_type_name:' + invalid_stats_group.id);
            invalid_stats_group.stat_type_name = 'ERROR';
        }

        if (!this.stat_type_cache[invalid_stats_group.stat_type_name]) {
            this.stat_type_cache[invalid_stats_group.stat_type_name] = new StatsTypeVO();
            this.stat_type_cache[invalid_stats_group.stat_type_name].name = invalid_stats_group.stat_type_name;
            let res = await ModuleDAO.getInstance().insertOrUpdateVO(this.stat_type_cache[invalid_stats_group.stat_type_name]);
            if ((!res) || !res.id) {
                delete this.stat_type_cache[invalid_stats_group.stat_type_name];
                throw new Error('Statsstat_typeMapperBGThread:FAILED:stat_type_cache:' + invalid_stats_group.id);
            }
            this.stat_type_cache[invalid_stats_group.stat_type_name].id = res.id;
        }
        return this.stat_type_cache[invalid_stats_group.stat_type_name].id;
    }

    private async get_category_id(invalid_stats_group: StatsGroupVO) {

        if (!invalid_stats_group) {
            return null;
        }

        if (!invalid_stats_group.category_name) {
            ConsoleHandler.error('StatsCategoryMapperBGThread:FAILED:invalid_stats_group.category_name:' + invalid_stats_group.id);
            invalid_stats_group.category_name = 'ERROR';
        }

        if (!this.category_cache[invalid_stats_group.category_name]) {
            this.category_cache[invalid_stats_group.category_name] = new StatsCategoryVO();
            this.category_cache[invalid_stats_group.category_name].name = invalid_stats_group.category_name;
            let res = await ModuleDAO.getInstance().insertOrUpdateVO(this.category_cache[invalid_stats_group.category_name]);
            if ((!res) || !res.id) {
                delete this.category_cache[invalid_stats_group.category_name];
                throw new Error('StatsCategoryMapperBGThread:FAILED:category_cache:' + invalid_stats_group.id);
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
            ConsoleHandler.error('StatsCategoryMapperBGThread:FAILED:invalid_stats_group.tmp_sub_category_name:' + invalid_stats_group.id);
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
                throw new Error('StatsCategoryMapperBGThread:FAILED:sub_category_cache:' + invalid_stats_group.id);
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
            ConsoleHandler.error('StatsCategoryMapperBGThread:FAILED:invalid_stats_group.tmp_event_name:' + invalid_stats_group.id);
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
                throw new Error('StatsCategoryMapperBGThread:FAILED:event_cache:' + invalid_stats_group.id);
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
            ConsoleHandler.error('StatsCategoryMapperBGThread:FAILED:invalid_stats_group.tmp_thread_name:' + invalid_stats_group.id);
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
                    throw new Error('StatsCategoryMapperBGThread:FAILED:thread_cache:' + invalid_stats_group.id);
                }
                this.thread_cache[invalid_stats_group.thread_name].id = res.id;
            } else {
                ConsoleHandler.log('StatsCategoryMapperBGThread:ALREADY_EXISTS:thread_cache:' + lastcheck.name + ':' + lastcheck.aliases.join(','));
                this.thread_cache[lastcheck.name] = lastcheck;
                for (let i in lastcheck.aliases) {
                    this.thread_cache[lastcheck.aliases[i]] = lastcheck;
                }
            }
        }
        return this.thread_cache[invalid_stats_group.thread_name].id;
    }

    private async init_cache() {
        let categorys = await query(StatsCategoryVO.API_TYPE_ID).select_vos<StatsCategoryVO>();
        let subcategorys = await query(StatsSubCategoryVO.API_TYPE_ID).select_vos<StatsSubCategoryVO>();
        let events = await query(StatsEventVO.API_TYPE_ID).select_vos<StatsEventVO>();
        let threads = await query(StatsThreadVO.API_TYPE_ID).select_vos<StatsThreadVO>();
        let stat_types = await query(StatsTypeVO.API_TYPE_ID).select_vos<StatsTypeVO>();

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