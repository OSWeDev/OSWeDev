/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ConfigurationService from '../../../server/env/ConfigurationService';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import ModuleTranslationServer from '../../../server/modules/Translation/ModuleTranslationServer';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import DashboardWidgetVO from '../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import LangVO from '../../../shared/modules/Translation/vos/LangVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../shared/tools/ObjectHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20250717AddWidgetsNames implements IGeneratorWorker {


    private static instance: Patch20250717AddWidgetsNames = null;
    private constructor() { }

    get uid(): string {
        return 'Patch20250717AddWidgetsNames';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20250717AddWidgetsNames {
        if (!Patch20250717AddWidgetsNames.instance) {
            Patch20250717AddWidgetsNames.instance = new Patch20250717AddWidgetsNames();
        }
        return Patch20250717AddWidgetsNames.instance;
    }

    public async work(db: IDatabase<any>) {
        const widgets: DashboardWidgetVO[] = await query(DashboardWidgetVO.API_TYPE_ID)
            .exec_as_server()
            .select_vos<DashboardWidgetVO>();

        const default_lang: LangVO = await query(LangVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<LangVO>().code_lang, ConfigurationService.node_configuration.default_locale)
            .exec_as_server()
            .select_vo<LangVO>();

        if (!default_lang) {
            throw new Error('Default language not found: ' + ConfigurationService.node_configuration.default_locale);
        }

        for (const widget of widgets) {
            switch (widget.name) {
                case DashboardWidgetVO.WIDGET_NAME_TemplateConsultation_bloctext:
                    await ModuleTranslationServer.getInstance().set_translation_if_not_exists(
                        widget.label,
                        ConfigurationService.node_configuration.default_locale,
                        'Template: Bloc de texte',
                    );
                    break;
                case DashboardWidgetVO.WIDGET_NAME_TemplateConsultation_image:
                    await ModuleTranslationServer.getInstance().set_translation_if_not_exists(
                        widget.label,
                        ConfigurationService.node_configuration.default_locale,
                        'Template: Image',
                    );
                    break;
                case DashboardWidgetVO.WIDGET_NAME_TemplateConsultation_linkbutton:
                    await ModuleTranslationServer.getInstance().set_translation_if_not_exists(
                        widget.label,
                        ConfigurationService.node_configuration.default_locale,
                        'Template: Bouton de lien',
                    );
                    break;
                case DashboardWidgetVO.WIDGET_NAME_TemplateConsultation_visionneusepdf:
                    await ModuleTranslationServer.getInstance().set_translation_if_not_exists(
                        widget.label,
                        ConfigurationService.node_configuration.default_locale,
                        'Template: Visionneuse PDF',
                    );
                    break;
                case DashboardWidgetVO.WIDGET_NAME_TemplateConsultation_crudbuttons:
                    await ModuleTranslationServer.getInstance().set_translation_if_not_exists(
                        widget.label,
                        ConfigurationService.node_configuration.default_locale,
                        'Template: Boutons CRUD',
                    );
                    break;
                case DashboardWidgetVO.WIDGET_NAME_cmsbloctext:
                    await ModuleTranslationServer.getInstance().set_translation_if_not_exists(
                        widget.label,
                        ConfigurationService.node_configuration.default_locale,
                        'CMS: Bloc de texte',
                    );
                    break;
                case DashboardWidgetVO.WIDGET_NAME_cmsimage:
                    await ModuleTranslationServer.getInstance().set_translation_if_not_exists(
                        widget.label,
                        ConfigurationService.node_configuration.default_locale,
                        'CMS: Image',
                    );
                    break;
                case DashboardWidgetVO.WIDGET_NAME_cmslinkbutton:
                    await ModuleTranslationServer.getInstance().set_translation_if_not_exists(
                        widget.label,
                        ConfigurationService.node_configuration.default_locale,
                        'CMS: Bouton de lien',
                    );
                    break;
                case DashboardWidgetVO.WIDGET_NAME_cmslikebutton:
                    await ModuleTranslationServer.getInstance().set_translation_if_not_exists(
                        widget.label,
                        ConfigurationService.node_configuration.default_locale,
                        'CMS: Bouton de like',
                    );
                    break;
                case DashboardWidgetVO.WIDGET_NAME_cmsvisionneusepdf:
                    await ModuleTranslationServer.getInstance().set_translation_if_not_exists(
                        widget.label,
                        ConfigurationService.node_configuration.default_locale,
                        'CMS: Visionneuse PDF',
                    );
                    break;
                case DashboardWidgetVO.WIDGET_NAME_cmsbooleanbutton:
                    await ModuleTranslationServer.getInstance().set_translation_if_not_exists(
                        widget.label,
                        ConfigurationService.node_configuration.default_locale,
                        'CMS: Bouton booléen',
                    );
                    break;
                case DashboardWidgetVO.WIDGET_NAME_cmsprintparam:
                    await ModuleTranslationServer.getInstance().set_translation_if_not_exists(
                        widget.label,
                        ConfigurationService.node_configuration.default_locale,
                        'CMS: Paramètres d\'impression',
                    );
                    break;
                case DashboardWidgetVO.WIDGET_NAME_crudbuttons:
                    await ModuleTranslationServer.getInstance().set_translation_if_not_exists(
                        widget.label,
                        ConfigurationService.node_configuration.default_locale,
                        'Boutons CRUD',
                    );
                    break;
                case DashboardWidgetVO.WIDGET_NAME_bloctext:
                    await ModuleTranslationServer.getInstance().set_translation_if_not_exists(
                        widget.label,
                        ConfigurationService.node_configuration.default_locale,
                        'Bloc de texte',
                    );
                    break;
                case DashboardWidgetVO.WIDGET_NAME_suivicompetences:
                    await ModuleTranslationServer.getInstance().set_translation_if_not_exists(
                        widget.label,
                        ConfigurationService.node_configuration.default_locale,
                        'Suivi des compétences',
                    );
                    break;
                case DashboardWidgetVO.WIDGET_NAME_oseliarungraphwidget:
                    await ModuleTranslationServer.getInstance().set_translation_if_not_exists(
                        widget.label,
                        ConfigurationService.node_configuration.default_locale,
                        'Graph Osélia',
                    );
                    break;
                case DashboardWidgetVO.WIDGET_NAME_varpiechart:
                    await ModuleTranslationServer.getInstance().set_translation_if_not_exists(
                        widget.label,
                        ConfigurationService.node_configuration.default_locale,
                        'Graphique en camembert',
                    );
                    break;
                case DashboardWidgetVO.WIDGET_NAME_varchoroplethchart:
                    await ModuleTranslationServer.getInstance().set_translation_if_not_exists(
                        widget.label,
                        ConfigurationService.node_configuration.default_locale,
                        'Graphique choroplèthe',
                    );
                    break;
                case DashboardWidgetVO.WIDGET_NAME_varradarchart:
                    await ModuleTranslationServer.getInstance().set_translation_if_not_exists(
                        widget.label,
                        ConfigurationService.node_configuration.default_locale,
                        'Graphique radar',
                    );
                    break;
                case DashboardWidgetVO.WIDGET_NAME_varmixedcharts:
                    await ModuleTranslationServer.getInstance().set_translation_if_not_exists(
                        widget.label,
                        ConfigurationService.node_configuration.default_locale,
                        'Graphique mixte',
                    );
                    break;
                case DashboardWidgetVO.WIDGET_NAME_datatable:
                    await ModuleTranslationServer.getInstance().set_translation_if_not_exists(
                        widget.label,
                        ConfigurationService.node_configuration.default_locale,
                        'Tableau de données',
                    );
                    break;
                case DashboardWidgetVO.WIDGET_NAME_bulkops:
                    await ModuleTranslationServer.getInstance().set_translation_if_not_exists(
                        widget.label,
                        ConfigurationService.node_configuration.default_locale,
                        'Opérations en masse',
                    );
                    break;
                case DashboardWidgetVO.WIDGET_NAME_supervision:
                    await ModuleTranslationServer.getInstance().set_translation_if_not_exists(
                        widget.label,
                        ConfigurationService.node_configuration.default_locale,
                        'Supervision',
                    );
                    break;
                case DashboardWidgetVO.WIDGET_NAME_fieldvaluefilter:
                    await ModuleTranslationServer.getInstance().set_translation_if_not_exists(
                        widget.label,
                        ConfigurationService.node_configuration.default_locale,
                        'Filtre de valeur de champ',
                    );
                    break;
                case DashboardWidgetVO.WIDGET_NAME_dowfilter:
                    await ModuleTranslationServer.getInstance().set_translation_if_not_exists(
                        widget.label,
                        ConfigurationService.node_configuration.default_locale,
                        'Filtre jour de la semaine',
                    );
                    break;
                case DashboardWidgetVO.WIDGET_NAME_monthfilter:
                    await ModuleTranslationServer.getInstance().set_translation_if_not_exists(
                        widget.label,
                        ConfigurationService.node_configuration.default_locale,
                        'Filtre mois',
                    );
                    break;
                case DashboardWidgetVO.WIDGET_NAME_advanceddatefilter:
                    await ModuleTranslationServer.getInstance().set_translation_if_not_exists(
                        widget.label,
                        ConfigurationService.node_configuration.default_locale,
                        'Filtre date avancé',
                    );
                    break;
                case DashboardWidgetVO.WIDGET_NAME_yearfilter:
                    await ModuleTranslationServer.getInstance().set_translation_if_not_exists(
                        widget.label,
                        ConfigurationService.node_configuration.default_locale,
                        'Filtre année',
                    );
                    break;
                case DashboardWidgetVO.WIDGET_NAME_currentuserfilter:
                    await ModuleTranslationServer.getInstance().set_translation_if_not_exists(
                        widget.label,
                        ConfigurationService.node_configuration.default_locale,
                        'Filtre utilisateur courant',
                    );
                    break;
                case DashboardWidgetVO.WIDGET_NAME_validationfilters:
                    await ModuleTranslationServer.getInstance().set_translation_if_not_exists(
                        widget.label,
                        ConfigurationService.node_configuration.default_locale,
                        'Validation des filtres',
                    );
                    break;
                case DashboardWidgetVO.WIDGET_NAME_savefavoritesfilters:
                    await ModuleTranslationServer.getInstance().set_translation_if_not_exists(
                        widget.label,
                        ConfigurationService.node_configuration.default_locale,
                        'Enregistrer les filtres favoris',
                    );
                    break;
                case DashboardWidgetVO.WIDGET_NAME_showfavoritesfilters:
                    await ModuleTranslationServer.getInstance().set_translation_if_not_exists(
                        widget.label,
                        ConfigurationService.node_configuration.default_locale,
                        'Afficher les filtres favoris',
                    );
                    break;
                case DashboardWidgetVO.WIDGET_NAME_resetfilters:
                    await ModuleTranslationServer.getInstance().set_translation_if_not_exists(
                        widget.label,
                        ConfigurationService.node_configuration.default_locale,
                        'Réinitialiser les filtres',
                    );
                    break;
                case DashboardWidgetVO.WIDGET_NAME_pageswitch:
                    await ModuleTranslationServer.getInstance().set_translation_if_not_exists(
                        widget.label,
                        ConfigurationService.node_configuration.default_locale,
                        'Changer de page',
                    );
                    break;
                case DashboardWidgetVO.WIDGET_NAME_var:
                    await ModuleTranslationServer.getInstance().set_translation_if_not_exists(
                        widget.label,
                        ConfigurationService.node_configuration.default_locale,
                        'Variable',
                    );
                    break;
                case DashboardWidgetVO.WIDGET_NAME_oseliathread:
                    await ModuleTranslationServer.getInstance().set_translation_if_not_exists(
                        widget.label,
                        ConfigurationService.node_configuration.default_locale,
                        'Fil Osélia',
                    );
                    break;

                case DashboardWidgetVO.WIDGET_NAME_perfreportgraph:
                    await ModuleTranslationServer.getInstance().set_translation_if_not_exists(
                        widget.label,
                        ConfigurationService.node_configuration.default_locale,
                        'Graphique de rapport de performance',
                    );
                    break;

                case DashboardWidgetVO.WIDGET_NAME_checklist:
                    await ModuleTranslationServer.getInstance().set_translation_if_not_exists(
                        widget.label,
                        ConfigurationService.node_configuration.default_locale,
                        'CheckList',
                    );
                    break;

                case DashboardWidgetVO.WIDGET_NAME_supervision_type:
                    await ModuleTranslationServer.getInstance().set_translation_if_not_exists(
                        widget.label,
                        ConfigurationService.node_configuration.default_locale,
                        'Supervision par type',
                    );
                    break;

                case 'varlinechart':
                    // Bah en fait on le supprime celui là par ce que je vois pas la ref ....
                    await ModuleDAOServer.getInstance().deleteVOs_as_server([widget]);
                    break;

                default:
                    ConsoleHandler.error('No translation found for widget: ' + widget.name + ' (' + widget.label + ')');
                    break;
            }
        }
    }
}