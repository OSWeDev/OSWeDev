export default class SetParamParamVO {

    public static async translateCheckAccessParams(
        param_name: string, param_value: string): Promise<SetParamParamVO> {

        return new SetParamParamVO(param_name, param_value);
    }

    public constructor(
        public param_name: string,
        public param_value: string) {
    }
}