import IExportableWidgetOptions from "../../IExportableWidgetOptions";

export default class PageSwitchWidgetOptions implements IExportableWidgetOptions {

    public static TITLE_CODE_PREFIX: string = "PageSwitchWidgetOptions.title.";

    public constructor(
        public page_id: number
    ) { }
}