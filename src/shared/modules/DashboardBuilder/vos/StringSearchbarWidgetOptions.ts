import DashboardPageWidgetVO from "./DashboardPageWidgetVO";
import VOFieldRefVO from "./VOFieldRefVO";
import DefaultTranslationVO from "../../Translation/vos/DefaultTranslationVO";
import AbstractVO from "../../VO/abstract/AbstractVO";
import IExportableWidgetOptions from "../../../../vuejsclient/ts/components/dashboard_builder/widgets/IExportableWidgetOptions";
import ObjectHandler from "../../../tools/ObjectHandler";

export default class StringSearchbarWidgetOptions extends AbstractVO implements IExportableWidgetOptions {

    public static VO_FIELD_REF_PLACEHOLDER_CODE_PREFIX: string = "StringSearchbarWidgetOptions.vo_field_ref.placeholder.";
    public static TITLE_CODE_PREFIX: string = "StringSearchbarWidgetOptions.title.";

    public constructor(
        public vo_field_ref?: VOFieldRefVO,
        public vo_field_ref_multiple?: VOFieldRefVO[],
        public default_advanced_string_filter_type?: number,
        public placeholder_advanced_mode?: string,
        public autovalidate_advanced_filter?: boolean,
        public hide_advanced_string_filter_type?: boolean,
        public active_field_on_autovalidate_advanced_filter?: boolean,
        public tooltip?: string,
        public is_res_mode_list?: boolean,
    ) {
        super();
    }

    public static get_selected_fields(page_widget: DashboardPageWidgetVO): { [api_type_id: string]: { [field_id: string]: boolean } } {
        const res: { [api_type_id: string]: { [field_id: string]: boolean } } = {};

        const options: StringSearchbarWidgetOptions = (page_widget && page_widget.json_options) ? ObjectHandler.try_get_json(page_widget.json_options) : null;
        if ((!options) || (!options.vo_field_ref)) {
            return res;
        }

        if ((!options.vo_field_ref.api_type_id) || (!options.vo_field_ref.field_id)) {
            return res;
        }

        if (!res[options.vo_field_ref.api_type_id]) {
            res[options.vo_field_ref.api_type_id] = {};
        }

        res[options.vo_field_ref.api_type_id][options.vo_field_ref.field_id] = true;

        if (options.vo_field_ref_multiple && (options.vo_field_ref_multiple.length > 0)) {
            for (const i in options.vo_field_ref_multiple) {
                const field_ref: VOFieldRefVO = options.vo_field_ref_multiple[i];

                if (field_ref.api_type_id && field_ref.field_id) {
                    if (!res[field_ref.api_type_id]) {
                        res[field_ref.api_type_id] = {};
                    }

                    res[field_ref.api_type_id][field_ref.field_id] = true;
                }
            }
        }

        return res;
    }

    public get_advanced_mode_placeholder_code_text(page_widget_id: number): string {

        if ((!this.vo_field_ref) || (!page_widget_id)) {
            return null;
        }

        return StringSearchbarWidgetOptions.VO_FIELD_REF_PLACEHOLDER_CODE_PREFIX + page_widget_id + '.' + this.vo_field_ref.api_type_id + '.' + this.vo_field_ref.field_id;
    }

    public get_title_name_code_text(page_widget_id: number): string {

        if (!page_widget_id) {
            return null;
        }
        return StringSearchbarWidgetOptions.TITLE_CODE_PREFIX + page_widget_id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
    }

    public async get_all_exportable_name_code_and_translation(page_id: number, page_widget_id: number): Promise<{ [current_code_text: string]: string }> {
        const res: { [exportable_code_text: string]: string } = {};

        const placeholder_name_code_text: string = this.get_title_name_code_text(page_widget_id);
        if (placeholder_name_code_text) {

            res[placeholder_name_code_text] =
                StringSearchbarWidgetOptions.TITLE_CODE_PREFIX +
                '{{IMPORT:' + DashboardPageWidgetVO.API_TYPE_ID + ':' + page_widget_id + '}}' +
                DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
        }
        return res;
    }
}