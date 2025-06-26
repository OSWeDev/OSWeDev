import AbstractVO from "../../../../../../../shared/modules/VO/abstract/AbstractVO";

export default class ValidationFiltersWidgetOptions extends AbstractVO {

    public static TITLE_CODE_PREFIX: string = "ValidationFiltersWidgetOptions.title.";

    public constructor(
        public load_widgets_prevalidation: boolean = false,
        public bg_color: string = null,
        public fg_color_text: string = null,
    ) {
        super();
    }
}