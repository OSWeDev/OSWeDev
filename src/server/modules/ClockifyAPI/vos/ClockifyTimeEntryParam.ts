import IAPIParamTranslator from "../../../../shared/modules/API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../../../shared/modules/API/interfaces/IAPIParamTranslatorStatic";
import TimeParamClockifyTimeEntry from "./TimeParamClockifyTimeEntry";

export default class ClockifyTimeEntryParam implements IAPIParamTranslator<ClockifyTimeEntryParam> {

    public static fromParams(time_param: TimeParamClockifyTimeEntry): ClockifyTimeEntryParam {
        return new ClockifyTimeEntryParam(time_param);
    }

    public static getAPIParams(param: ClockifyTimeEntryParam): any[] {
        return [param.time_param];
    }

    public constructor(
        public time_param: TimeParamClockifyTimeEntry
    ) { }
}

export const ClockifyTimeEntryParamStatic: IAPIParamTranslatorStatic<ClockifyTimeEntryParam> = ClockifyTimeEntryParam;