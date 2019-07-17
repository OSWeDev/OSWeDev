import * as moment from 'moment';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import NotificationVO from '../../../../../shared/modules/PushData/vos/NotificationVO';
import ICronWorker from '../../../Cron/interfaces/ICronWorker';
import IVarMatroidDataVO from '../../../../../shared/modules/Var/interfaces/IVarMatroidDataVO';
import ModuleDAOServer from '../../../DAO/ModuleDAOServer';
import VarsController from '../../../../../shared/modules/Var/VarsController';
import IVarDataVOBase from '../../../../../shared/modules/Var/interfaces/IVarDataVOBase';

export default class PrecalcVarDataCronWorker implements ICronWorker {

    public static getInstance() {
        if (!PrecalcVarDataCronWorker.instance) {
            PrecalcVarDataCronWorker.instance = new PrecalcVarDataCronWorker();
        }
        return PrecalcVarDataCronWorker.instance;
    }

    private static instance: PrecalcVarDataCronWorker = null;

    private constructor() {
    }

    get worker_uid(): string {
        return "PrecalcVarDataCronWorker";
    }


    /**
     * On prend toutes les datas qu'il faut calculer, et on demande un gros batch au système des vars
     * A voir si on peut dispatcher ce batch à un moment donné pour éviter de questionner potentiellement 1M de data ...
     */
    public async work() {

        let datas_to_calc: IVarDataVOBase[] = [];

        for (let api_type in VarsController.getInstance().registered_var_data_api_types) {
            let vos: IVarDataVOBase[] = await ModuleDAOServer.getInstance().selectAll<IVarDataVOBase>(api_type, ' WHERE value_ts is null;');

            for (let i in vos) {
                vos[i].ignore_unvalidated_datas = true;
            }

            datas_to_calc = datas_to_calc.concat(vos);
        }

        let calculated_datas: IVarDataVOBase[] = await VarsController.getInstance().registerDataParamsAndReturnVarDatas(datas_to_calc, true);

        await ModuleDAO.getInstance().insertOrUpdateVOs(calculated_datas);
    }
}