
import axios from 'axios';
import { closeSync, existsSync, mkdirSync, openSync, unlinkSync, writeFileSync } from 'fs';
import { threadId } from 'worker_threads';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleStats from '../../../shared/modules/Stats/ModuleStats';
import StatsController from '../../../shared/modules/Stats/StatsController';
import StatClientWrapperVO from '../../../shared/modules/Stats/vos/StatClientWrapperVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import { all_promises } from '../../../shared/tools/PromiseTools';
import ThreadHandler from '../../../shared/tools/ThreadHandler';
import ConfigurationService from '../../env/ConfigurationService';
import ModuleBGThreadServer from '../BGThread/ModuleBGThreadServer';
import IDatabaseHolder from '../IDatabaseHolder';
import ModuleServerBase from '../ModuleServerBase';
import StatsInvalidatorBGThread from './bgthreads/StatsInvalidatorBGThread';
import StatsUnstackerBGThread from './bgthreads/StatsUnstackerBGThread';
import StatsServerController from './StatsServerController';
import VarSecStatsGroupeController from './vars/controllers/VarSecStatsGroupeController';

export default class ModuleStatsServer extends ModuleServerBase {

    private static instance: ModuleStatsServer = null;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleStats.getInstance().name);
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleStatsServer.instance) {
            ModuleStatsServer.instance = new ModuleStatsServer();
        }
        return ModuleStatsServer.instance;
    }

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(ModuleStats.APINAME_register_client_stats, this.register_client_stats.bind(this));
    }

    // istanbul ignore next: cannot test registerAccessPolicies
    public async registerAccessPolicies(): Promise<void> {
    }

    // istanbul ignore next: cannot test configure
    public async configure() {
        await this.configure_vars();

        if (StatsController.ACTIVATED) {
            ModuleBGThreadServer.getInstance().registerBGThread(StatsInvalidatorBGThread.getInstance());
            ModuleBGThreadServer.getInstance().registerBGThread(StatsUnstackerBGThread.getInstance());
        }

        if (StatsController.ACTIVATED) {
            ConsoleHandler.log('Activation des stats de requête PGSQL');
            ThreadHandler.set_interval('ModuleStatsServer.STAT_REQUETE_PGSQL', this.do_stat_requete_pgsql.bind(this), 10000, 'ModuleStatsServer.STAT_REQUETE_PGSQL', true);

            ConsoleHandler.log('Activation des stats d\'I/O');
            ThreadHandler.set_interval('ModuleStatsServer.STAT_I/O', this.do_stat_io.bind(this), 10000, 'ModuleStatsServer.STAT_I/O', true);

            ConsoleHandler.log('Activation des stats de requête réseau');
            ThreadHandler.set_interval('ModuleStatsServer.STAT_REQUETE_RESEAU', this.do_stat_requete_latence_reseau.bind(this), 10000, 'ModuleStatsServer.STAT_REQUETE_RESEAU', true);

            if (ConfigurationService.node_configuration.debug_top_10_query_size) {
                ConsoleHandler.log('Activation du TOP 10 des requêtes PGSQL par taille du résultat');
                ThreadHandler.set_interval('ModuleStatsServer.STAT_TOP_10_QUERY_SIZE', this.do_stat_top_10_query_size.bind(this), 10000, 'ModuleStatsServer.STAT_TOP_10_QUERY_SIZE', true);
            }
        }
    }

    private async configure_vars() {

        await all_promises([ // Attention Promise[] ne maintient pas le stackcontext a priori de façon systématique, contrairement au PromisePipeline. Ce n'est pas un contexte client donc OSEF ici
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
        const server_timestamp_s = Dates.now();
        const delta_s = server_timestamp_s - client_timestamp_s;

        const nb_hours = Math.round(delta_s / (60 * 60));
        const delta_vs_decalage_horaire = (delta_s % (60 * 60)) / 60; // on compte le nombre de minutes de différence entre le décalage horaire et la diff réelle

        if (delta_vs_decalage_horaire > 1) {
            StatsController.register_stat_COMPTEUR('ModuleStatsServer', 'register_client_stats', 'delta_vs_decalage_horaire_supp3min');
        } else {
            StatsController.register_stat_COMPTEUR('ModuleStatsServer', 'register_client_stats', 'delta_vs_decalage_horaire_inf3min');
        }

        if (nb_hours) {
            StatsController.register_stat_COMPTEUR('ModuleStatsServer', 'register_client_stats', 'has_nb_hours');
        } else {
            StatsController.register_stat_COMPTEUR('ModuleStatsServer', 'register_client_stats', 'hasnt_nb_hours');
        }

        for (const i in stats_client) {
            stats_client[i].timestamp_s += delta_s;
        }

        for (const i in stats_client) {
            const stat_client = stats_client[i];

            StatsController.register_stat_agg(
                stat_client.tmp_category_name, stat_client.tmp_sub_category_name, stat_client.tmp_event_name, stat_client.tmp_stat_type_name,
                stat_client.value, stat_client.stats_aggregator, stat_client.stats_aggregator_min_segment_type, stat_client.timestamp_s, stat_client.tmp_thread_name);
        }
    }

    /**
     * On fait une requete bidon (Cloudflare CDN) pour vérifier que la latence réseau actuelle
     */
    private async do_stat_requete_latence_reseau() {
        try {
            StatsController.register_stat_COMPTEUR('ModuleStatsServer', 'do_stat_requete_latence_reseau', 'IN');

            const start = Dates.now_ms();
            await axios.get('https://1.1.1.1', { responseType: 'text' });

            StatsController.register_stat_DUREE('ModuleStatsServer', 'do_stat_requete_latence_reseau', 'success', Dates.now_ms() - start);
        } catch (error) {
            StatsController.register_stat_COMPTEUR('ModuleStatsServer', 'do_stat_requete_latence_reseau', 'error');
            ConsoleHandler.error('do_stat_requete_latence_reseau error:', error);
        }
    }

    /**
     * On fait une requete bidon (SELECT 1) pour vérifier que la base de données est bien accessible et surtout pour connaître le temps de réponse actuel
     */
    private async do_stat_requete_pgsql() {
        try {
            StatsController.register_stat_COMPTEUR('ModuleStatsServer', 'do_stat_requete_pgsql', 'IN');

            const start = Dates.now_ms();
            await IDatabaseHolder.db.query('SELECT 1');

            StatsController.register_stat_DUREE('ModuleStatsServer', 'do_stat_requete_pgsql', 'success', Dates.now_ms() - start);
        } catch (error) {
            StatsController.register_stat_COMPTEUR('ModuleStatsServer', 'do_stat_requete_pgsql', 'error');
            ConsoleHandler.error('do_stat_requete_pgsql error:', error);
        }
    }

    /**
     * On ouvre un fichier bidon (aléatoire) dans le répertoire tmp si il existe sinon on le crée, on insère une ligne toujours la même, on ferme le fichier et on le supprime
     */
    private async do_stat_io() {
        try {
            StatsController.register_stat_COMPTEUR('ModuleStatsServer', 'do_stat_io', 'IN');

            const start = Dates.now_ms();
            if (!existsSync('./tmp')) {
                mkdirSync('./tmp');
            }
            const fd = openSync('./tmp/stats_io_test_' + threadId + '.txt', 'w');
            writeFileSync(fd, '1');
            closeSync(fd);
            unlinkSync('./tmp/stats_io_test_' + threadId + '.txt');

            StatsController.register_stat_DUREE('ModuleStatsServer', 'do_stat_io', 'success', Dates.now_ms() - start);
        } catch (error) {
            StatsController.register_stat_COMPTEUR('ModuleStatsServer', 'do_stat_io', 'error');
            ConsoleHandler.error('do_stat_io error:', error);
        }
    }

    /**
     * On dépile les requetes stockées dans le statsservercontroller pour identifier le top 10 des requêtes par taille de résultat
     */
    private async do_stat_top_10_query_size() {
        try {
            StatsController.register_stat_COMPTEUR('ModuleStatsServer', 'do_stat_top_10_query_size', 'IN');

            const start = Dates.now_ms();
            const queries = StatsServerController.pgsql_queries_log;
            StatsServerController.pgsql_queries_log = [];

            queries.sort((a, b) => b.size_ko - a.size_ko);
            const top_10 = queries.slice(0, 10);

            // On stat le numéro 1 pour avoir une évolution/suivi des tailles max
            if (top_10.length) {
                StatsController.register_stat_COMPTEUR('ModuleStatsServer', 'do_stat_top_10_query_size', 'top_1', top_10[0].size_ko);
            }

            // On ConsoleHandler.log le top 10 proprement avec une ligne par query, et on limite la taille à 1000 caractères pour la query
            ConsoleHandler.log('Top 10 des requêtes PGSQL par taille de résultat : ===>');
            for (const i in top_10) {
                const i_int = parseInt(i) + 1;
                ConsoleHandler.log('    ' + ((i_int == 10) ? i : ' ' + i) + ' : ' + top_10[i].size_ko + ' ko : ' + top_10[i].query.substring(0, 1000));
            }
            ConsoleHandler.log('<=== : Top 10 des requêtes PGSQL par taille de résultat');
        } catch (error) {
            StatsController.register_stat_COMPTEUR('ModuleStatsServer', 'do_stat_top_10_query_size', 'error');
            ConsoleHandler.error('do_stat_top_10_query_size error:', error);
        }
    }
}