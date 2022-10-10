import { throttle } from 'lodash';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import PerfMonLineTypeVO from '../../../shared/modules/PerfMon/vos/PerfMonLineTypeVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ForkMessageController from '../Fork/ForkMessageController';
import UpdatePerfConfsForkMessage from './messages/UpdatePerfConfsForkMessage';

export default class PerfMonConfController {

    public static getInstance() {
        if (!PerfMonConfController.instance) {
            PerfMonConfController.instance = new PerfMonConfController();
        }
        return PerfMonConfController.instance;
    }

    private static instance: PerfMonConfController = null;

    public perf_type_by_name: { [perf_type_name: string]: PerfMonLineTypeVO } = {};
    public throttled_update_cached_perf_conf = throttle(this.broadcast_update_cached_perf_conf, 1000, { leading: false });

    private constructor() {
        ForkMessageController.getInstance().register_message_handler(UpdatePerfConfsForkMessage.FORK_MESSAGE_TYPE, this.update_cached_perf_conf.bind(this));
        this.update_cached_perf_conf().then().catch((error) => ConsoleHandler.getInstance().error(error));
    }

    public async registerPerformanceType(perf_type_by_name: string): Promise<PerfMonLineTypeVO> {

        let perf_line_type = await ModuleDAO.getInstance().getNamedVoByName<PerfMonLineTypeVO>(PerfMonLineTypeVO.API_TYPE_ID, perf_type_by_name);

        if (!perf_line_type) {
            perf_line_type = new PerfMonLineTypeVO();
            perf_line_type.is_active = false;
            perf_line_type.name = perf_type_by_name;
            let res = await ModuleDAO.getInstance().insertOrUpdateVO(perf_line_type);
            perf_line_type.id = res.id;
        }

        return perf_line_type;
    }

    private async broadcast_update_cached_perf_conf() {
        await ForkMessageController.getInstance().broadcast(new UpdatePerfConfsForkMessage());
    }

    private async update_cached_perf_conf() {
        let confs = await query(PerfMonLineTypeVO.API_TYPE_ID).select_vos<PerfMonLineTypeVO>();

        let deleted_names: string[] = [];

        for (let i in PerfMonConfController.getInstance().perf_type_by_name) {
            let cached_conf = PerfMonConfController.getInstance().perf_type_by_name[i];

            let found = false;
            for (let j in confs) {
                let conf = confs[j];

                if (conf.name == cached_conf.name) {
                    found = true;
                    break;
                }
            }

            if (!found) {
                deleted_names.push(cached_conf.name);
            }
        }

        for (let i in deleted_names) {
            delete PerfMonConfController.getInstance().perf_type_by_name[deleted_names[i]];
        }

        for (let i in confs) {
            let conf = confs[i];

            PerfMonConfController.getInstance().perf_type_by_name[conf.name] = conf;
        }
    }
}