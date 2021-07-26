import IAPIParamTranslator from "../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../API/interfaces/IAPIParamTranslatorStatic";

export default class APIDAOTypeLimitOffsetVO implements IAPIParamTranslator<APIDAOTypeLimitOffsetVO> {

    public static URL: string = ':api_type_id/:limit/:offset';

    public static fromREQ(req): APIDAOTypeLimitOffsetVO {

        if (!(req && req.params)) {
            return null;
        }
        return new APIDAOTypeLimitOffsetVO(req.params.api_type_id, parseInt(req.params.limit), parseInt(req.params.offset));
    }

    public static fromParams(API_TYPE_ID: string, limit: number = 0, offset: number = 0): APIDAOTypeLimitOffsetVO {
        return new APIDAOTypeLimitOffsetVO(API_TYPE_ID, limit, offset);
    }

    public static getAPIParams(param: APIDAOTypeLimitOffsetVO): any[] {
        return [param.API_TYPE_ID, param.limit, param.offset];
    }

    public constructor(
        public API_TYPE_ID: string,
        public limit: number = 0,
        public offset: number = 0) {
    }

    public translateToURL(): string {

        return this.API_TYPE_ID + '/' + this.limit + '/' + this.offset;
    }
}

export const APIDAOTypeLimitOffsetVOStatic: IAPIParamTranslatorStatic<APIDAOTypeLimitOffsetVO> = APIDAOTypeLimitOffsetVO;