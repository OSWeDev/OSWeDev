import IAPIParamTranslator from "../../interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../interfaces/IAPIParamTranslatorStatic";

export default class BooleanParamVO implements IAPIParamTranslator<BooleanParamVO> {

    public static URL: string = ':value';

    public static fromREQ(req): BooleanParamVO {

        if (!(req && req.params)) {
            return null;
        }
        return new BooleanParamVO(req.params.value == 'true');
    }

    public static fromParams(value: boolean): BooleanParamVO {

        return new BooleanParamVO(value);
    }

    public constructor(
        public value: boolean) {
    }

    public translateToURL(): string {

        return this.value ? 'true' : 'false';
    }

    public getAPIParams(): any[] {
        return [this.value];
    }
}

export const BooleanParamVOStatic: IAPIParamTranslatorStatic<BooleanParamVO> = BooleanParamVO;