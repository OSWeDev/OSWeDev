import { IDatabase } from 'pg-promise';
import ModuleLogger from '../../../shared/modules/Logger/ModuleLogger';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import IGeneratorWorker from '../../IGeneratorWorker';

// ça va forcer à revérifier dans les projets si on veut vraiment  logger plus que les erreurs/warns par ce que là c'est trop lourd de logger debug + log ...
export default class Patch20241216LowerDefaultDBLogTypeToWARN implements IGeneratorWorker {

    private static instance: Patch20241216LowerDefaultDBLogTypeToWARN = null;

    private constructor() { }
    get uid(): string {
        return 'Patch20241216LowerDefaultDBLogTypeToWARN';
    }

    public static getInstance(): Patch20241216LowerDefaultDBLogTypeToWARN {
        if (!Patch20241216LowerDefaultDBLogTypeToWARN.instance) {
            Patch20241216LowerDefaultDBLogTypeToWARN.instance = new Patch20241216LowerDefaultDBLogTypeToWARN();
        }
        return Patch20241216LowerDefaultDBLogTypeToWARN.instance;
    }

    public async work(db: IDatabase<unknown>) {
        await ModuleParams.getInstance().setParamValueAsNumber(
            ModuleLogger.PARAM_LOGGER_LOG_TYPE_SERVER_MAX,
            await ModuleParams.getInstance().getParamValueAsInt(ModuleLogger.PARAM_LOGGER_LOG_TYPE_WARN, null, null)
        );
    }
}