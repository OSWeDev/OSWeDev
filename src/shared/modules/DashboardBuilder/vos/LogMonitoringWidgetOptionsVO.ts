import DefaultTranslation from "../../Translation/vos/DefaultTranslation";
import AbstractVO from "../../VO/abstract/AbstractVO";

/**
 * LogMonitoringWidgetOptionsVO
 *  - Log Monitoring Widget Options
 */
export default class LogMonitoringWidgetOptionsVO extends AbstractVO {

    public static TITLE_CODE_PREFIX: string = "LogMonitoringWidgetOptionsVO.title.";

    public constructor() {
        super();
    }

    public get_title_name_code_text(page_widget_id: number): string {

        if (!page_widget_id) {
            return null;
        }

        return LogMonitoringWidgetOptionsVO.TITLE_CODE_PREFIX + page_widget_id + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }

}