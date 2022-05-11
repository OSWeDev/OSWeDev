import IAPIParamTranslator from "../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../API/interfaces/IAPIParamTranslatorStatic";

export default class APIDAONamedParamVO implements IAPIParamTranslator<APIDAONamedParamVO> {

    public static URL: string = ':api_type_id/:name';

    public static fromREQ(req): APIDAONamedParamVO {

        if (!(req && req.params)) {
            return null;
        }
        return new APIDAONamedParamVO(req.params.api_type_id, req.params.name);
    }

    public static fromParams(API_TYPE_ID: string, name: string): APIDAONamedParamVO {
        return new APIDAONamedParamVO(API_TYPE_ID, name);
    }

    public static getAPIParams(param: APIDAONamedParamVO): any[] {
        return [param.API_TYPE_ID, param.name];
    }

    public constructor(
        public API_TYPE_ID: string,
        public name: string) {
    }

    public translateToURL(): string {

        return this.API_TYPE_ID + '/' + this.name;
    }
}

export const APIDAONamedParamVOStatic: IAPIParamTranslatorStatic<APIDAONamedParamVO> = APIDAONamedParamVO;