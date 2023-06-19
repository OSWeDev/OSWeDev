
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleStats from '../../../shared/modules/Stats/ModuleStats';
import StatsController from '../../../shared/modules/Stats/StatsController';
import StatClientWrapperVO from '../../../shared/modules/Stats/vos/StatClientWrapperVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import { all_promises } from '../../../shared/tools/PromiseTools';
import ModuleBGThreadServer from '../BGThread/ModuleBGThreadServer';
import ModuleServerBase from '../ModuleServerBase';
import StatsInvalidatorBGThread from './bgthreads/StatsInvalidatorBGThread';
import StatsUnstackerBGThread from './bgthreads/StatsUnstackerBGThread';
import VarSecStatsGroupeController from './vars/controllers/VarSecStatsGroupeController';

export default class ModuleStatsServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleStatsServer.instance) {
            ModuleStatsServer.instance = new ModuleStatsServer();
        }
        return ModuleStatsServer.instance;
    }

    private static instance: ModuleStatsServer = null;

    private constructor() {
        super(ModuleStats.getInstance().name);
    }

    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(ModuleStats.APINAME_register_client_stats, this.register_client_stats.bind(this));
    }

    public async registerAccessPolicies(): Promise<void> {
    }

    public async configure() {
        await this.configure_vars();
        ModuleBGThreadServer.getInstance().registerBGThread(StatsInvalidatorBGThread.getInstance());
        ModuleBGThreadServer.getInstance().registerBGThread(StatsUnstackerBGThread.getInstance());
    }

    private async configure_vars() {

        await all_promises([
            VarSecStatsGroupeController.getInstance().initialize(),
        ]);
    }

    private async register_client_stats(
        stats_client: StatClientWrapperVO[],
        client_timestamp_s: number, // this is the timestamp of the client at the time of calling the API, to be able to compare with the server timestamp
    ): Promise<void> {

        if (!stats_client || !stats_client.length) {
            return;
        }

        if (!client_timestamp_s) {
            ConsoleHandler.error('ERROR : stats client timestamp has not been provided - IGNORING STATS');
            return;
        }

        // On commence par vérifier que le timestamp est cohérent avec le server
        // Sinon on décale d'autant toutes les stats (on devrait pas aoir plus de 30 secondes entre la créa du ts de verif côté client et l'appel de l'api côté serveur)
        let server_timestamp_s = Dates.now();
        let delta_s = server_timestamp_s - client_timestamp_s;

        let nb_hours = Math.round(delta_s / (60 * 60));
        let delta_vs_decalage_horaire = (delta_s % (60 * 60)) / 60; // on compte le nombre de minutes de différence entre le décalage horaire et la diff réelle

        if (delta_vs_decalage_horaire > 1) {
            StatsController.register_stat_COMPTEUR('ModuleStatsServer', 'register_client_stats', 'delta_vs_decalage_horaire_supp3min');
        } else {
            StatsController.register_stat_COMPTEUR('ModuleStatsServer', 'register_client_stats', 'delta_vs_decalage_horaire_inf3min');
        }

        if (!!nb_hours) {
            StatsController.register_stat_COMPTEUR('ModuleStatsServer', 'register_client_stats', 'has_nb_hours');
        } else {
            StatsController.register_stat_COMPTEUR('ModuleStatsServer', 'register_client_stats', 'hasnt_nb_hours');
        }

        for (let i in stats_client) {
            stats_client[i].timestamp_s += delta_s;
        }

        for (let i in stats_client) {
            let stat_client = stats_client[i];

            StatsController.register_stat_agg(
                stat_client.tmp_category_name, stat_client.tmp_sub_category_name, stat_client.tmp_event_name, stat_client.tmp_stat_type_name,
                stat_client.value, stat_client.stats_aggregator, stat_client.stats_aggregator_min_segment_type, stat_client.timestamp_s, stat_client.tmp_thread_name);
        }
    }
}