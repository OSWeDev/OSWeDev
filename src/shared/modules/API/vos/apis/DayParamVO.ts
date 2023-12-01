/* istanbul ignore file : nothing to test in ParamVOs */

import IAPIParamTranslator from '../../interfaces/IAPIParamTranslator';
import IAPIParamTranslatorStatic from '../../interfaces/IAPIParamTranslatorStatic';

export default class DayParamVO implements IAPIParamTranslator<DayParamVO> {

    public static URL: string = ':day';

    public static fromREQ(req): DayParamVO {

        if (!(req && req.params)) {
            return null;
        }
        return new DayParamVO(parseInt(req.params.day));
    }

    public static fromParams(day: number): DayParamVO {

        return new DayParamVO(day);
    }

    public static getAPIParams(param: DayParamVO): any[] {
        return [param.day];
    }

    public constructor(
        public day: number) {
    }

    public translateToURL(): string {

        return this.day.toString();
    }
}

export const DayParamVOStatic: IAPIParamTranslatorStatic<DayParamVO> = DayParamVO;