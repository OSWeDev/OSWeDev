/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import ModuleTranslation from '../../../shared/modules/Translation/ModuleTranslation';
import DefaultTranslationVO from '../../../shared/modules/Translation/vos/DefaultTranslationVO';
import TranslatableTextVO from '../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../shared/modules/Translation/vos/TranslationVO';
import { field_names } from '../../../shared/tools/ObjectHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20250224AddDbbTrad implements IGeneratorWorker {

    private static instance: Patch20250224AddDbbTrad = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20250224AddDbbTrad';
    }

    public static getInstance(): Patch20250224AddDbbTrad {
        if (!Patch20250224AddDbbTrad.instance) {
            Patch20250224AddDbbTrad.instance = new Patch20250224AddDbbTrad();
        }
        return Patch20250224AddDbbTrad.instance;
    }

    public async work(db: IDatabase<any>) {

        await this.update_trad(
            'var_chart_scales_options_item_component.separator.var_options.___LABEL___',
            'Options visuelles'
        );

        await this.update_trad(
            'var_chart_scales_options_component.separator.datas_filter_options.___LABEL___',
            'Options du pas de l\'axe des ordonnées'
        );

        await this.update_trad(
            'var_mixed_charts_widget_options_component.multiple_dataset_vo_field_ref.tooltip.___LABEL___',
            'Le multidataset permet de superposer plusieurs graphiques sur un même axe des abscisses.'
        );

        await this.update_trad(
            'var_chart_options_item_component.section.graphical_options.___LABEL___',
            'Options visuelles'
        );

        await this.update_trad(
            'var_chart_options_item_component.section.filter_options.___LABEL___',
            'Options des données'
        );

        await this.update_trad(
            'var_chart_scales_options_item.stacked_tooltip.___LABEL___',
            'Permet, dans le cas d\'un graphique en bar de superposer les valeurs des différentes variables.'
        );

        await this.update_trad(
            'var_chart_scales_options_item.fill_tooltip.___LABEL___',
            'Permet, dans le cas d\'un graphique en ligne de remplir l\'espace entre la ligne et l\'axe des abscisses.'
        );

        await this.update_trad(
            'var_chart_scales_options_item.widget_filter_tooltip.___LABEL___',
            'Permet de filtrer l\'affichage du pas de l\'axe des ordonnées.'
        );

        await this.update_trad(
            'chart_js_scale_type.linear.___LABEL___',
            'Linéaire'
        );

        await this.update_trad(
            'chart_js_scale_type.logarithmic.___LABEL___',
            'Logarithmique'
        );

        await this.update_trad(
            'chart_js_scale_type.category.___LABEL___',
            'Catégorie'
        );

        await this.update_trad(
            'chart_js_scale_type.time.___LABEL___',
            'Temps'
        );

        await this.update_trad(
            'var_chart_options_item_component.field_that_could_get_custom_filter.___LABEL___',
            'Ordonnée du graphique'
        );

        await this.update_trad(
            'var_chart_options_item_component.field_that_could_get_scales_filter.___LABEL___',
            'Ordonnée du graphique'
        );

        await this.update_trad(
            'var_choropleth_chart_widget_options_component.max_dimension_values.___LABEL___',
            'Segmentation de la dimension'
        );

        await this.update_trad(
            'var_mixed_charts_widget_options_component.section.legend_options.___LABEL___',
            'Options de la légende'
        );

        await this.update_trad(
            'var_mixed_charts_widget_options_component.section.data_options.___LABEL___',
            'Options des données'
        );

        await this.update_trad(
            'var_radar_chart_widget_options_component.dimension_custom_filter_segment_type.___LABEL___',
            'Segmentation de la dimension'
        );

        await this.update_trad(
            'var_mixed_charts_widget_options_component.switch_tooltip_by_index.tooltip.___LABEL___',
            'Condition d\'affichage des valeurs des données au survol.'
        );

        await this.update_trad(
            'var_mixed_charts_widget_options_component.legend_position.top.___LABEL___',
            'Haut'
        );

        await this.update_trad(
            'var_mixed_charts_widget_options_component.legend_position.left.___LABEL___',
            'Gauche'
        );

        await this.update_trad(
            'var_mixed_charts_widget_options_component.legend_position.bottom.___LABEL___',
            'Bas'
        );

        await this.update_trad(
            'var_mixed_charts_widget_options_component.legend_position.right.___LABEL___',
            'Droite'
        );

        await this.update_trad(
            'var_mixed_charts_widget_options_component.legend_font_color.___LABEL___',
            'Couleur du texte'
        );

        await this.update_trad(
            'var_mixed_charts_widget_options_component.legend_font_size.___LABEL___',
            'Taille'
        );

        await this.update_trad(
            'var_mixed_charts_widget_options_component.legend_box_width.___LABEL___',
            'Epaisseur'
        );

        await this.update_trad(
            'var_mixed_charts_widget_options_component.legend_padding.___LABEL___',
            'Marge'
        );

        await this.update_trad(
            'var_mixed_charts_widget_options_component.legend_style.___LABEL___',
            'Style'
        );

        await this.update_trad(
            'var_mixed_charts_widget_options_component.legend_style.circle.___LABEL___',
            'Rond'
        );

        await this.update_trad(
            'var_mixed_charts_widget_options_component.legend_style.rectangle.___LABEL___',
            'Rectangle'
        );

        await this.update_trad(
            'var_mixed_charts_widget_options_component.dimension_custom_filter_segment_type.___LABEL___',
            'Segmentation de la dimension'
        );

        await this.update_trad(
            'var_mixed_charts_widget_options_component.show_scale_x.___LABEL___',
            'Afficher la légende'
        );

        await this.update_trad(
            'var_mixed_charts_widget_options_component.scale_x_title.___LABEL___',
            'Légende'
        );

        await this.update_trad(
            'var_mixed_charts_widget_options_component.scale_x_type.___LABEL___',
            'Type de l\'axe'
        );

        await this.update_trad(
            'var_chart_options_item_component.section.filter_options.___LABEL___',
            'Options des données'
        );

        await this.update_trad(
            'var_chart_options_item_component.graph_type.line.___LABEL___',
            'Ligne'
        );

        await this.update_trad(
            'var_chart_options_item_component.graph_type.bar.___LABEL___',
            'Barre'
        );

        await this.update_trad(
            'var_charts_scales_options_component.tooltip.toggle_all_button.open.___LABEL___',
            'Ouvrir les sections'
        );

        await this.update_trad(
            'var_charts_scales_options_component.tooltip.toggle_all_button.close.___LABEL___',
            'Fermer les sections'
        );

        await this.update_trad(
            'var_charts_scales_options_component.tooltip.toggle_all_and_children_button.open.___LABEL___',
            'Tout ouvrir'
        );

        await this.update_trad(
            'var_charts_scales_options_component.tooltip.toggle_all_and_children_button.close.___LABEL___',
            'Tout fermer'
        );

        await this.update_trad(
            'var_chart_scales_options_item_component.separator.scale_position.left.___LABEL___',
            'Gauche'
        );

        await this.update_trad(
            'var_chart_scales_options_item_component.separator.scale_position.right.___LABEL___',
            'Droite'
        );

        await this.update_trad(
            'var_pie_chart_widget_options_component.legend_position.___LABEL___',
            'Position'
        );

        await this.update_trad(
            'var_pie_chart_widget_options_component.legend_font_color.___LABEL___',
            'Couleur'
        );

        await this.update_trad(
            'var_pie_chart_widget_options_component.legend_font_size.___LABEL___',
            'Taille'
        );

        await this.update_trad(
            'var_pie_chart_widget_options_component.legend_box_width.___LABEL___',
            'Epaisseur'
        );

        await this.update_trad(
            'var_pie_chart_widget_options_component.legend_padding.___LABEL___',
            'Marge'
        );

        await this.update_trad(
            'var_pie_chart_widget_options_component.legend_style.___LABEL___',
            'Style'
        );

        await this.update_trad(
            'var_pie_chart_widget_options_component.legend_style.circle.___LABEL___',
            'Rond'
        );

        await this.update_trad(
            'var_pie_chart_widget_options_component.legend_style.rectangle.___LABEL___',
            'Rectangle'
        );

        await this.update_trad(
            'var_pie_chart_widget_options_component.circumference.___LABEL___',
            'Circonférence'
        );

        await this.update_trad(
            'var_pie_chart_widget_options_component.circumference.tooltip.___LABEL___',
            'Circonférence du graphique. Entre 0 et 360. Exemple pour une jauge : 180'
        );

        await this.update_trad(
            'var_pie_chart_widget_options_component.dimension_custom_filter_segment_type.___LABEL___',
            'Segmentation de la dimension'
        );

        await this.update_trad(
            'var_pie_chart_widget_options_component.dimension_custom_filter_name.___LABEL___',
            'Nom du filtre de la dimension'
        );

    }

    /**
     * Méthode utilitaire qui cherche la traduction par code.
     * - Si elle n'existe pas, on crée un DefaultTranslationVO avec le texte fourni.
     * - Si elle existe, on met à jour ou insère la traduction en base.
     */
    private async update_trad(code: string, text: string) {
        const trad: TranslatableTextVO = await ModuleTranslation.getInstance().getTranslatableText(code);
        if (!trad) {
            // Si le code n'existe pas, on enregistre directement la traduction par défaut
            DefaultTranslationManager.registerDefaultTranslation(
                DefaultTranslationVO.create_new({
                    'fr-fr': text
                }, code)
            );
        } else {
            // Si le code existe déjà, on met à jour la traduction FR
            const fr = await ModuleTranslation.getInstance().getLang('fr-fr');
            if (fr) {
                const trad_fr: TranslationVO = await query(TranslationVO.API_TYPE_ID)
                    .filter_by_num_eq(field_names<TranslationVO>().lang_id, fr.id)
                    .filter_by_num_eq(field_names<TranslationVO>().text_id, trad.id)
                    .select_vo<TranslationVO>();

                if (!trad_fr) {
                    DefaultTranslationManager.registerDefaultTranslation(
                        DefaultTranslationVO.create_new({
                            'fr-fr': text
                        }, code)
                    );
                } else {
                    trad_fr.translated = text;
                    await ModuleDAOServer.instance.insertOrUpdateVO_as_server(trad_fr);
                }
            }
        }
    }
}
