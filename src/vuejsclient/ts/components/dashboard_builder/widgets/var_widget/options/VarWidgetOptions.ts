
export default class VarWidgetOptions {

    public static TITLE_CODE_PREFIX: string = "VarWidgetOptions.title.";

    public constructor(
        public var_name: string,
        public page_widget_id: number
    ) { }

    get title_name_code_text(): string {

        if ((!this.page_widget_id) || (!this.var_name)) {
            return null;
        }
        return VarWidgetOptions.TITLE_CODE_PREFIX + this.var_name + '.' + this.page_widget_id;
    }
}