export default class GetFormattedImageParamVO {

    public static async translateCheckAccessParams(
        src: string,
        format_name: string,
        width: number,
        height: number): Promise<GetFormattedImageParamVO> {

        return new GetFormattedImageParamVO(src, format_name, width, height);
    }

    public constructor(
        public src: string,
        public format_name: string,
        public width: number,
        public height: number) {
    }
}