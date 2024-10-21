/* istanbul ignore file : nothing to test in ParamVOs */

import IAPIParamTranslator from "../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../API/interfaces/IAPIParamTranslatorStatic";

export default class UpdateTeamsMessageVO implements IAPIParamTranslator<UpdateTeamsMessageVO> {

    public static URL: string = ':text/:bool';

    public constructor(
        public text: string,
        public bool: boolean
    ) {
    }

    public static fromREQ(req): UpdateTeamsMessageVO {

        if (!(req && req.params)) {
            return null;
        }
        return new UpdateTeamsMessageVO(req.params.text, req.params.bool == 'true');
    }

    public static fromParams(text: string, bool: boolean, message_id: string, channel_id: string, group_id: string): UpdateTeamsMessageVO {
        return new UpdateTeamsMessageVO(text, bool);
    }

    public static getAPIParams(param: UpdateTeamsMessageVO): any[] {
        return [param.text, param.bool];
    }

    public translateToURL(): string {

        return this.text + '/' + (this.bool ? 'true' : 'false');
    }
}

export const UpdateTeamsMessageVOStatic: IAPIParamTranslatorStatic<UpdateTeamsMessageVO> = UpdateTeamsMessageVO;