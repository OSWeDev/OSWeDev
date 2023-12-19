/* istanbul ignore file : nothing to test in ParamVOs */

import IAPIParamTranslator from '../../API/interfaces/IAPIParamTranslator';
import IAPIParamTranslatorStatic from '../../API/interfaces/IAPIParamTranslatorStatic';
import FileVO from '../vos/FileVO';

export default class LogMonitoringFiles implements IAPIParamTranslator<LogMonitoringFiles> {

    public static fromParams(
        files: FileVO[]
    ): LogMonitoringFiles {

        return new LogMonitoringFiles(files);
    }

    public static getAPIParams(param: LogMonitoringFiles): any[] {
        return [param.files];
    }

    public constructor(
        public files: FileVO[]
    ) {
    }
}

export const LogMonitoringFilesStatic: IAPIParamTranslatorStatic<LogMonitoringFiles> = LogMonitoringFiles;