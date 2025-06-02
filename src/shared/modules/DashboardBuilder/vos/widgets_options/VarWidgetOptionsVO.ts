import WidgetOptionsBaseVO from "./WidgetOptionsBaseVO";

export default class VarWidgetOptionsVO extends WidgetOptionsBaseVO {

    // public static TITLE_CODE_PREFIX: string = "VarWidgetOptions.title.";

    public static API_TYPE_ID: string = "var_widget_options";

    public _type: string = VarWidgetOptionsVO.API_TYPE_ID;

    /**
     * Le lien vers la variable dont on veut afficher la valeur
     */
    public var_id: number;

    /**
     * Le type de filtre à appliquer pour afficher la valeur de la variable
     */
    public filter_type: string;

    /**
     * Les paramètres additionnels à appliquer pour définir le filtre à appliquer pour afficher la variable
     */
    public filter_additional_params: string;

    /**
     * Les filtres personnalisés à appliquer pour définir le champs date du paramètre de la variable
     */
    public filter_custom_field_filters: { [field_id: string]: string };

    public fg_color_value: string;
    // public fg_color_text?: string // Migrated to font_color in WidgetOptionsBaseVO

    // TODO FIXME : à gérer dans un patch pour migrer les noms actuels vers le champs title du WidgetOptionsBaseVO, puis supprimer cette fonction
    // public get_title_name_code_text(page_widget_id: number): string {

    //     if ((!page_widget_id) || (!this.var_id)) {
    //         return null;
    //     }

    //     return VarWidgetOptions.TITLE_CODE_PREFIX + this.var_id + '.' + page_widget_id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
    // }

    // public async get_all_exportable_name_code_and_translation(page_id: number, page_widget_id: number): Promise<{ [current_code_text: string]: string }> {
    //     const res: { [exportable_code_text: string]: string } = {};

    //     const placeholder_name_code_text: string = this.get_title_name_code_text(page_widget_id);
    //     if (placeholder_name_code_text) {

    //         res[placeholder_name_code_text] =
    //             VarWidgetOptions.TITLE_CODE_PREFIX +
    //             '{{IMPORT:' + VarConfVO.API_TYPE_ID + ':' + this.var_id + '}}' +
    //             '.' +
    //             '{{IMPORT:' + DashboardPageWidgetVO.API_TYPE_ID + ':' + page_widget_id + '}}' +
    //             DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
    //     }
    //     return res;
    // }
}