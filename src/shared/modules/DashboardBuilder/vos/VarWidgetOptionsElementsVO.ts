
import AbstractVO from "../../VO/abstract/AbstractVO";
export default class VarWidgetOptionsElementsVO extends AbstractVO {

    constructor(
        public id?: number,
        public var_id?: number,
        public filter_type?: string,
        public filter_additional_params?: string,
        public page_widget_id?: number,
        public selected_position?: string,
        public style?: {
            bg_color?: string,
            text_color?: string,
            font_size?: string,
            font_family?: string
        },
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
        this.id = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
        return this;
    }
}