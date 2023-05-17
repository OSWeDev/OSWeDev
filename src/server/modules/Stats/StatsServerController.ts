import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import StatsController from '../../../shared/modules/Stats/StatsController';
import StatsGroupVO from '../../../shared/modules/Stats/vos/StatsGroupVO';
import StatVO from '../../../shared/modules/Stats/vos/StatVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import PromisePipeline from '../../../shared/tools/PromisePipeline/PromisePipeline';
import ThreadHandler from '../../../shared/tools/ThreadHandler';
import ConfigurationService from '../../env/ConfigurationService';
import StackContext from '../../StackContext';
import ModuleDAOServer from '../DAO/ModuleDAOServer';

export default class StatsServerController {

    public static getInstance(): StatsServerController {
        if (!StatsServerController.instance) {
            StatsServerController.instance = new StatsServerController();
        }
        return StatsServerController.instance;
    }

    public static async new_stats_handler(all_new_stats: StatVO[]) {

        // Spécifique serveur
        // On crée toujours les stats en tant qu'applicatif
        await StackContext.runPromise({ IS_CLIENT: false }, async () => {
            let res = await ModuleDAOServer.getInstance().insertOrUpdateVOsMulticonnections(all_new_stats);
            if ((!res) || (!res.length) || (res.length != all_new_stats.length)) {
                ConsoleHandler.error('Erreur lors de l\'insertion des stats');
            }
        });
    }

    public static async check_groups_handler(to_unstack: { [group_name: string]: StatVO[] }) {
        // Spécifique serveur
        await StatsServerController.getInstance().check_groups(to_unstack);
    }

    private static instance: StatsServerController = null;

    private is_creating_group_name: { [group_name: string]: boolean } = {};

    private constructor() { }

    /**
     * On check les groups des stats stacked. Soit on a déjà pu remplir le group_id, soit on
     * le fait maintenant en mettant en priorité le cache à jour, puis en créant le groupe si besoin
     */
    private async check_groups(to_unstack: { [group_name: string]: StatVO[] }) {

        if ((!to_unstack) || (!Object.keys(to_unstack).length)) {
            return;
        }

        let reloaded_cache = false;
        let promises_pipeline = new PromisePipeline(ConfigurationService.node_configuration.MAX_POOL / 2);

        for (let group_name in to_unstack) {
            let group = StatsController.cached_stack_groupes_by_name[group_name];

            if (!group) {
                // On devrait avoir a minima le caneva du groupe avec la segmentation, le nom, et l'aggrégateur
                ConsoleHandler.error('Pas de groupe pour ' + group_name + ' dans le cache des groupes de stats');
                throw new Error('Pas de groupe pour ' + group_name + ' dans le cache des groupes de stats');
            }

            if (!group.id) {
                // On a le caneva du groupe, mais pas l'id, on tente de reload le cache si c'est pas déjà tenté, et sinon on le crée
                if (!reloaded_cache) {
                    await this.reload_groups_cache();
                    group = StatsController.cached_stack_groupes_by_name[group_name];
                    reloaded_cache = true;
                }

                if (!group.id) {

                    // On crée le groupe si la création est pas déjà en cours, sinon on passe
                    if (!this.is_creating_group_name[group_name]) {
                        this.is_creating_group_name[group_name] = true;
                        await promises_pipeline.push(async () => {
                            group.name = group_name;
                            let res = await ModuleDAO.getInstance().insertOrUpdateVO(group);

                            delete this.is_creating_group_name[group_name];
                            if ((!res) || !res.id || !group.id || !StatsController.cached_stack_groupes_by_name[group_name].id) {
                                ConsoleHandler.error('Erreur lors de la création du groupe de stats ' + group_name);
                                throw new Error('Erreur lors de la création du groupe de stats ' + group_name);
                            }
                        });
                    } else {
                        await promises_pipeline.push(async () => {
                            while (!group.id) {
                                await ThreadHandler.sleep(10, 'StatsServerController.check_groups');
                            }
                        });
                    }
                }
            }
        }
        await promises_pipeline.end();

        // Quand les groupes sont créés, on peut les mettre à jour dans les stats
        for (let group_name in to_unstack) {
            let group = StatsController.cached_stack_groupes_by_name[group_name];
            if (!group.id) {
                throw new Error('Pas de groupe pour ' + group_name + ' dans le cache des groupes de stats');
            }

            let stats = to_unstack[group_name];
            for (let i in stats) {
                stats[i].stat_group_id = group.id;
            }
        }
    }

    /**
     * On reload le cache des groupes en complètant les éléments manquants, on garde les canevas de groupes en attente d'insertion
     *  on ne peut donc pas supprimer des groupes du cache
     */
    private async reload_groups_cache() {
        let groups = await query(StatsGroupVO.API_TYPE_ID).select_vos<StatsGroupVO>();
        for (let i in groups) {
            let group = groups[i];

            StatsController.cached_stack_groupes_by_name[group.name] = group;
        }
    }
}