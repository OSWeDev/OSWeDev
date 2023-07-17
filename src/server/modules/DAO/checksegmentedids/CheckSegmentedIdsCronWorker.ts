import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import VOsTypesManager from '../../../../shared/modules/VO/manager/VOsTypesManager';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import ICronWorker from '../../Cron/interfaces/ICronWorker';
import DAOServerController from '../DAOServerController';
import ModuleDAOServer from '../ModuleDAOServer';

/**
 * On a un pb sur des ids dupliqués dans des bases segmentées ce qui devrait jamais arriver
 *  ce cron a pour but d'identifier tous les ids dupliqués dans toutes les tables segmentées
 */
export default class CheckSegmentedIdsCronWorker implements ICronWorker {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!CheckSegmentedIdsCronWorker.instance) {
            CheckSegmentedIdsCronWorker.instance = new CheckSegmentedIdsCronWorker();
        }
        return CheckSegmentedIdsCronWorker.instance;
    }

    private static instance: CheckSegmentedIdsCronWorker = null;

    private constructor() {
    }

    get worker_uid(): string {
        return "CheckSegmentedIdsCronWorker";
    }

    public async work() {

        for (let i in VOsTypesManager.moduleTables_by_voType) {
            let table = VOsTypesManager.moduleTables_by_voType[i];

            if (!table.is_segmented) {
                continue;
            }

            let ids: { [id: number]: string } = {};
            for (let table_name in DAOServerController.segmented_known_databases[table.name]) {
                let full_name = table.name + '.' + table_name;

                let res = await ModuleDAOServer.getInstance().query('select * from ' + full_name);
                for (let j in res) {
                    let data = res[j];
                    data._type = table.vo_type;
                }
                let vos: IDistantVOBase[] = table.forceNumerics(res);

                for (let vo_i in vos) {
                    let vo = vos[vo_i];

                    if (!ids[vo.id]) {
                        ids[vo.id] = full_name;
                        continue;
                    }

                    ConsoleHandler.error('CheckSegmentedIdsCronWorker:' + vo.id + ':[seen originally in :' + ids[vo.id] + ':] duplicated in :' + full_name + ':');

                    // A cette étape on peut directement modifier l'id du nouveau, en utilisant l'auto incrément pour supprimer la duplication.
                    //  Dans l'outil à date impossible d'avoir des références vers des datas segmentées donc ça devrait pas poser de problèmes.
                    await ModuleDAO.getInstance().deleteVOs([vo]);
                    await ModuleDAO.getInstance().insertOrUpdateVO(vo);
                }
            }
        }
    }
}