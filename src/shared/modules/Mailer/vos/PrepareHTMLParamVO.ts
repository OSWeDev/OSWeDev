
export default class PrepareHTMLParamVO {

    public static async translateCheckAccessParams(
        template: string,
        lang_id: number,
        vars: { [name: string]: string },
    ): Promise<PrepareHTMLParamVO> {

        return new PrepareHTMLParamVO(template, lang_id, vars);
    }

    public constructor(
        public template: string,
        public lang_id: number,
        public vars: { [name: string]: string }) {
    }
}