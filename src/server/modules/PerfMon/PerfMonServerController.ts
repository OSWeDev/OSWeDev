import { performance } from 'perf_hooks';
import IPerfMonLineInfo from '../../../shared/modules/PerfMon/interfaces/IPerfMonLineInfo';
import PerfMonLineTypeVO from '../../../shared/modules/PerfMon/vos/PerfMonLineTypeVO';
import PerfMonLineVO from '../../../shared/modules/PerfMon/vos/PerfMonLineVO';
import StackContext from '../../StackContext';
import PerfMonDBUpdater from './PerfMonDBUpdater';

export default class PerfMonServerController {

    public static instance: PerfMonServerController = null;

    public static getInstance(): PerfMonServerController {
        if (!PerfMonServerController.instance) {
            PerfMonServerController.instance = new PerfMonServerController();
        }
        return PerfMonServerController.instance;
    }

    private static stackcontext_parent_UID: string = 'PerfMonServerController_parent_UID';
    private static line_uid: number = 0;

    public ordered_lines_to_update_in_db: PerfMonLineVO[] = [];
    public childrens_per_parent_uid: { [parent_uid: number]: PerfMonLineVO[] } = {};

    public lines_infos_to_update_in_db_by_uid: { [uid: number]: IPerfMonLineInfo[] } = {};

    private temp_perf_lines_per_uid: { [uid: number]: PerfMonLineVO } = {};
    private temp_childrens_per_parent_uid: { [parent_uid: number]: { [child_uid: number]: PerfMonLineVO } } = {};

    protected constructor() {
    }

    /**
     * Pour monitorer un fonctionnement il faut définir un point de départ - permet de forcer la réinitialisation du StackContext...
     * @param line_type
     * @param monitored_func
     * @param this_obj
     * @param monitored_func_params
     * @param perf_line_infos
     * @returns
     */
    public async monitor_async_root(
        line_type: PerfMonLineTypeVO,
        monitored_func: (...params) => Promise<any>,
        this_obj: any,
        monitored_func_params: any[] = null,
        perf_line_infos: IPerfMonLineInfo[] = null
    ): Promise<any> {

        return await StackContext.getInstance().runPromise(
            { [PerfMonServerController.stackcontext_parent_UID]: null },
            async () => {

                return await this.monitor_async(
                    line_type,
                    monitored_func,
                    this_obj,
                    monitored_func_params,
                    perf_line_infos
                );
            });
    }

    public async monitor_async(
        line_type: PerfMonLineTypeVO,
        monitored_func: (...params) => Promise<any>,
        this_obj: any,
        monitored_func_params: any[] = null,
        perf_line_infos: IPerfMonLineInfo[] = null
    ): Promise<any> {

        if ((!line_type) || !line_type.is_active) {
            if (monitored_func_params) {
                return await monitored_func.call(this_obj, ...monitored_func_params);
            } else {
                return await monitored_func.call(this_obj);
            }
        }

        let uid: number = PerfMonServerController.line_uid++;
        PerfMonServerController.getInstance().lines_infos_to_update_in_db_by_uid[uid] = perf_line_infos;

        let monitor_line: PerfMonLineVO = new PerfMonLineVO();
        monitor_line.start_time = performance.now();
        monitor_line.is_server = !StackContext.getInstance().get('IS_CLIENT');
        monitor_line.user_id = StackContext.getInstance().get('UID');
        monitor_line.client_tab_id = StackContext.getInstance().get('CLIENT_TAB_ID');
        monitor_line.line_type_id = line_type.id;
        monitor_line.uid = uid;
        PerfMonServerController.getInstance().temp_perf_lines_per_uid[uid] = monitor_line;

        let temp_parent_uid = StackContext.getInstance().get(PerfMonServerController.stackcontext_parent_UID);

        if (temp_parent_uid && !PerfMonServerController.getInstance().temp_childrens_per_parent_uid[temp_parent_uid]) {
            PerfMonServerController.getInstance().temp_childrens_per_parent_uid[temp_parent_uid] = {};
        }
        if (temp_parent_uid) {
            PerfMonServerController.getInstance().temp_childrens_per_parent_uid[temp_parent_uid][uid] = monitor_line;
        }

        return await StackContext.getInstance().runPromise(
            { [PerfMonServerController.stackcontext_parent_UID]: uid },
            async () => {
                let res;
                if (monitored_func_params) {
                    res = await monitored_func.call(this_obj, ...monitored_func_params);
                } else {
                    res = await monitored_func.call(this_obj);
                }
                monitor_line.end_time = performance.now();

                // On indique qu'on peut mettre en bdd ainsi que les enfants dès qu'on est sur un parent
                if (!temp_parent_uid) {
                    await PerfMonServerController.getInstance().prepare_for_update(uid);
                }

                return res;
            });
    }

    private async prepare_for_update(uid) {
        this.ordered_lines_to_update_in_db.push(this.temp_perf_lines_per_uid[uid]);
        delete this.temp_perf_lines_per_uid[uid];

        if (!!this.temp_childrens_per_parent_uid[uid]) {

            if (!this.childrens_per_parent_uid[uid]) {
                this.childrens_per_parent_uid[uid] = [];
            }

            for (let child_uid in this.temp_childrens_per_parent_uid[uid]) {
                this.childrens_per_parent_uid[uid].push(this.temp_perf_lines_per_uid[child_uid]);
                await this.prepare_for_update(child_uid);
            }
            delete this.temp_childrens_per_parent_uid[uid];
        }

        await PerfMonDBUpdater.getInstance().throttled_exec();
    }
}



