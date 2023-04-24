import { throttle } from 'lodash';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import PerfMonLineTypeVO from '../../../shared/modules/PerfMon/vos/PerfMonLineTypeVO';
import VOsTypesManager from '../../../shared/modules/VO/manager/VOsTypesManager';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import PerfMonServerController from './PerfMonServerController';

export default class PerfMonDBUpdater {

    public static getInstance() {
        if (!PerfMonDBUpdater.instance) {
            PerfMonDBUpdater.instance = new PerfMonDBUpdater();
        }
        return PerfMonDBUpdater.instance;
    }

    private static instance: PerfMonDBUpdater = null;

    public throttled_exec = throttle(this.exec, 1000, { leading: false });

    private constructor() { }

    private async exec() {

        let copied_lines = Array.from(PerfMonServerController.getInstance().ordered_lines_to_update_in_db);
        let copied_childrens_per_parent_uid = Object.assign({}, PerfMonServerController.getInstance().childrens_per_parent_uid);
        PerfMonServerController.getInstance().ordered_lines_to_update_in_db = [];
        let types_by_id = VOsTypesManager.vosArray_to_vosByIds(await query(PerfMonLineTypeVO.API_TYPE_ID).select_vos<PerfMonLineTypeVO>());

        for (let i in copied_lines) {
            let perf_line = copied_lines[i];

            let line_type = types_by_id[perf_line.line_type_id];
            if (!line_type.is_active) {
                continue;
            }

            if (!perf_line.end_time) {
                // On devrait jamais arriver là, on essaie de nettoyer...
                ConsoleHandler.error("end_time NULL");

                PerfMonServerController.getInstance().childrens_per_parent_uid = {};
                PerfMonServerController.getInstance().lines_infos_to_update_in_db_by_uid = {};
                PerfMonServerController.getInstance().ordered_lines_to_update_in_db = [];

                PerfMonServerController.getInstance()['temp_perf_lines_per_uid'] = {};
                PerfMonServerController.getInstance()['temp_childrens_per_parent_uid'] = {};

                return;
            }

            try {

                /**
                 * WARNING : Si ça plante ici avec un problème de end vide c'est très probablement une perf en async sous une perf qui vient de se terminer et qui n'a pas d'await sur son child.
                 *  Pour le moment on considère que ce cas est une erreur car le calcul de perf semble étrange dans ce cas. Du coup on essaie pas de permettre cette situation et on laisse l'erreur.
                 */
                let res: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(perf_line);
                perf_line.id = res.id;

                let infos = PerfMonServerController.getInstance().lines_infos_to_update_in_db_by_uid[perf_line.uid];
                if (infos && infos.length) {

                    for (let j in infos) {
                        let info = infos[j];
                        info.perf_line_id = perf_line.id;
                    }
                    await ModuleDAO.getInstance().insertOrUpdateVOs(infos);
                }

                for (let j in copied_childrens_per_parent_uid[perf_line.uid]) {
                    let child = copied_childrens_per_parent_uid[perf_line.uid][j];
                    child.parent_id = perf_line.id;
                }
            } catch (error) {
                ConsoleHandler.error(error);
            }
        }
    }
}