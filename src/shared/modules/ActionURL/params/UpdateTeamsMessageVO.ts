/* istanbul ignore file : nothing to test in ParamVOs */

import IAPIParamTranslator from "../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../API/interfaces/IAPIParamTranslatorStatic";

export default class UpdateTeamsMessageVO implements IAPIParamTranslator<UpdateTeamsMessageVO> {

    public static URL: string = ':text/:bool/:message_id/:channel_id/:group_id';

    public static fromREQ(req): UpdateTeamsMessageVO {

        if (!(req && req.params)) {
            return null;
        }
        return new UpdateTeamsMessageVO(req.params.text, req.params.bool == 'true', req.params.message_id, req.params.channel_id, req.params.group_id);
    }

    public static fromParams(text: string, bool: boolean, message_id: string, channel_id: string, group_id: string): UpdateTeamsMessageVO {
        return new UpdateTeamsMessageVO(text, bool, message_id, channel_id, group_id);
    }

    public static getAPIParams(param: UpdateTeamsMessageVO): any[] {
        return [param.text, param.bool, param.message_id, param.channel_id, param.group_id];
    }

    public constructor(
        public text: string,
        public bool: boolean,
        public message_id: string,
        public channel_id: string,
        public group_id: string
    ) {
    }

    public translateToURL(): string {

        return this.text + '/' + (this.bool ? 'true' : 'false') + '/' + this.message_id + '/' + this.channel_id + '/' + this.group_id;
    }
}

export const UpdateTeamsMessageVOStatic: IAPIParamTranslatorStatic<UpdateTeamsMessageVO> = UpdateTeamsMessageVO;