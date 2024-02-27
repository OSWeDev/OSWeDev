import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import ISupervisedItem from '../../../shared/modules/Supervision/interfaces/ISupervisedItem';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ISupervisedItemServerController from './interfaces/ISupervisedItemServerController';
import SupervisionServerController from './SupervisionServerController';

export default abstract class SupervisedItemServerControllerBase<T extends ISupervisedItem> implements ISupervisedItemServerController<T> {

    protected constructor(public api_type_id: string) {
        SupervisionServerController.getInstance().registerServerController(api_type_id, this);
    }

    public abstract get_execute_time_ms(): number;

    public async work_all(): Promise<boolean> {

        try {

            const supervised_pdvs: T[] = await query(this.api_type_id).select_vos<T>();

            for (const i in supervised_pdvs) {
                const supervised_pdv = supervised_pdvs[i];

                await this.work_one(supervised_pdv);
            }
        } catch (e) {
            ConsoleHandler.error(e);
        }

        return true;
    }

    public async work_invalid(): Promise<boolean> {
        try {

            const supervised_pdvs: T[] = await query(this.api_type_id)
                .filter_is_true('invalid')
                .select_vos<T>();

            for (const i in supervised_pdvs) {
                const supervised_pdv = supervised_pdvs[i];

                await this.work_one(supervised_pdv);
            }
        } catch (e) {
            ConsoleHandler.error(e);
        }

        return true;
    }

    public abstract work_one(item: T, ...args): Promise<boolean>;
}