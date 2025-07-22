import NumRange from '../../DataRender/vos/NumRange';
import IDistantVOBase from '../../IDistantVOBase';

/**
 * On crée des pool de filtres de contexte pour les dashboards
 * - ça permet de gérer le partage de filtres entre dashboards
 * - ça permet aussi de gérer au sein d'un dashboard des kpis reliés à des contextes de filtres différents du pool intégré au dashboard
 */
export default class ContextFilterPoolVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "context_filter_pool";

    public _type: string = ContextFilterPoolVO.API_TYPE_ID;

    public id: number;

    public name: string;
    public description: string;

    public page_widget_id_ranges: NumRange[];
}