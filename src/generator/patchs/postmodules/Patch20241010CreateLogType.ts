import { IDatabase } from 'pg-promise';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import ModuleLogger from '../../../shared/modules/Logger/ModuleLogger';
import LogTypeVO from '../../../shared/modules/Logger/vos/LogTypeVO';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20241010CreateLogType implements IGeneratorWorker {

    private static instance: Patch20241010CreateLogType = null;

    private constructor() { }
    get uid(): string {
        return 'Patch20241010CreateLogType';
    }

    public static getInstance(): Patch20241010CreateLogType {
        if (!Patch20241010CreateLogType.instance) {
            Patch20241010CreateLogType.instance = new Patch20241010CreateLogType();
        }
        return Patch20241010CreateLogType.instance;
    }

    public async work(db: IDatabase<unknown>) {
        await this.createLogType(LogTypeVO.createNew('ERROR', 1), ModuleLogger.PARAM_LOGGER_LOG_TYPE_ERROR);
        await this.createLogType(LogTypeVO.createNew('WARN', 2), ModuleLogger.PARAM_LOGGER_LOG_TYPE_WARN);
        await this.createLogType(LogTypeVO.createNew('LOG', 3), ModuleLogger.PARAM_LOGGER_LOG_TYPE_LOG);
        await this.createLogType(LogTypeVO.createNew('DEBUG', 4), ModuleLogger.PARAM_LOGGER_LOG_TYPE_DEBUG);
        await ModuleParams.getInstance().setParamValueAsNumber(
            ModuleLogger.PARAM_LOGGER_LOG_TYPE_CLIENT_MAX,
            await ModuleParams.getInstance().getParamValueAsInt(ModuleLogger.PARAM_LOGGER_LOG_TYPE_ERROR, null, null)
        );
        await ModuleParams.getInstance().setParamValueAsNumber(
            ModuleLogger.PARAM_LOGGER_LOG_TYPE_SERVER_MAX,
            await ModuleParams.getInstance().getParamValueAsInt(ModuleLogger.PARAM_LOGGER_LOG_TYPE_DEBUG, null, null)
        );
    }

    private async createLogType(logtype: LogTypeVO, param_name: string) {
        const res: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(logtype);

        if (!res) {
            return;
        }

        await ModuleParams.getInstance().setParamValueAsNumber(param_name, res.id);
    }
}