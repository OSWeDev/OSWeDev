
import DefaultTranslationVO from "../../Translation/vos/DefaultTranslationVO";
import AbstractVO from "../../VO/abstract/AbstractVO";
import VarDataBaseVO from "../../Var/vos/VarDataBaseVO";
export default class VarWidgetOptionsElementsVO extends AbstractVO {

    public static TITLE_CODE_PREFIX: string = "VarWidgetOptionsElements.title.";
    constructor(
        public id?: number,
        public var_id?: number,
        public filter_type?: string,
        public filter_additional_params?: string,
        public page_widget_id?: number,
        public selected_position?: string, // ?
        public style?: {       // ?
            bg_color?: string,
            text_color?: string,
            font_size?: string,
            font_family?: string
        },
        public type?: string,
        public icon_text?: string,
        public var_params?: VarDataBaseVO,
        public custom_filter_name?: { [field_id: string]: string },
        public show_title?: boolean,
        public title_style?: {
            bg_color?: string,
            text_color?: string,
            font_size?: number,
            font_family?: string
            text_align?: string
        },
        public icon_style?: {
            bg_color?: string,
            icon_size?: number,
        }
    ) {
        super();
    }

    public initialize() {
        this.style = {
            bg_color: '#ffffff',
            text_color: '#666',
            font_size: '12px',
            font_family: 'Arial'
        };
        this.title_style = {
            bg_color: '#ffffff',
            text_color: '#666',
            font_size: 12,
            font_family: 'Arial',
            text_align: 'center'
        };
        this.icon_style = {
            bg_color: '#ffffff',
            icon_size: 20
        };
        this.id = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
        return this;
    }

    public get_title_name_code_text(page_widget_id: number): string {

        if (!page_widget_id) {
            return null;
        }
        return VarWidgetOptionsElementsVO.TITLE_CODE_PREFIX + page_widget_id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION + '.' + this.id;
    }
}