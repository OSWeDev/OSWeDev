import NumRange from "../../../../../../../shared/modules/DataRender/vos/NumRange";
import NumSegment from "../../../../../../../shared/modules/DataRender/vos/NumSegment";
import IDistantVOBase from "../../../../../../../shared/modules/IDistantVOBase";
import VueComponentBase from "../../../../VueComponentBase";
import TableWidgetExternalSelectorConf from "./TableWidgetExternalSelectorConf";

/**
 * Controleur pour le système de sélection externe par popup (pour le moment)
 */
export default class TableWidgetExternalSelectorController {

    public static REGISTERED_COMPONENT_UID_FIELD_NAME: string = "external_selector_registered_component_UID";
    public static NUM_RANGE_FIELD_NAME: string = 'external_selector_num_range';
    public static EXPORT_SELECTED_ROWS_FIELD_NAME: string = 'external_selector_export_selected_rows';

    private static registered_confs: { [registered_component_UID: number]: TableWidgetExternalSelectorConf<any> } = {};

    /**
     * On init un external_selector pour un composant, avec comme identifiant le registered_component_UID qui est retourné
     * La démarche est :
     *  - Appeler init_external_selector lors du mounted et conserver le registered_component_UID
     *      (Il est également disponible sur le composant maintenant dans le champs TableWidgetExternalSelectorController.TAGNAME)
     *      En premier paramètre, on passe l'id du dashboard qui sert de sélecteur de données
     *      La méthode passée en paramètre comme callback sera appelée à la réception du message par le selecteur
     *  - Appeler open_thread_select pour ouvrir le popup avec en paramètre le registered_component_UID
     *  - Le popup va faire un postMessage avec le registered_component_UID et les données
     *  - Le composant va écouter le postMessage et va vérifier que le registered_component_UID correspond à celui qu'il a enregistré
     */
    public static init_external_selector<T extends VueComponentBase>(
        component: T,
        selector_dashboard_id: number,
        data_received_callback: (datas: any[]) => void,
        params_builder: (vo: IDistantVOBase) => string = null): TableWidgetExternalSelectorConf<T> {

        if (!selector_dashboard_id) {
            // RAS on a pas d'id de dashboard
            return null;
        }

        // Si on a déjà configuré ce composant, inutile de le faire à nouveau
        if (component[TableWidgetExternalSelectorController.REGISTERED_COMPONENT_UID_FIELD_NAME]) {
            return component[TableWidgetExternalSelectorController.REGISTERED_COMPONENT_UID_FIELD_NAME];
        }

        const conf = new TableWidgetExternalSelectorConf<T>(component, selector_dashboard_id, data_received_callback, params_builder);
        TableWidgetExternalSelectorController.registered_confs[conf.registered_component_UID] = conf;

        // On enregistre la conf dans le composant
        component[TableWidgetExternalSelectorController.REGISTERED_COMPONENT_UID_FIELD_NAME] = conf;

        const { protocol, hostname, port, pathname } = window.location;
        const isAdmin = pathname.startsWith('/admin');
        const basePath = isAdmin ? '/admin' : '/';
        const file_system_url = `${protocol}//${hostname}${port ? `:${port}` : ''}${basePath}#/dashboard/view/`;

        conf.selector_window_base_url = file_system_url + selector_dashboard_id;

        window.addEventListener("message", (event: MessageEvent) => {
            const source = event.source as Window;

            const normalizedHref = TableWidgetExternalSelectorController.strip_query(source.location.href);
            const normalizedTarget = TableWidgetExternalSelectorController.strip_query(file_system_url + selector_dashboard_id);

            if ((normalizedHref !== normalizedTarget)) {
                return;
            } else {

                if (event.data[TableWidgetExternalSelectorController.REGISTERED_COMPONENT_UID_FIELD_NAME] !== conf.registered_component_UID) {
                    return;
                }

                data_received_callback(event.data[TableWidgetExternalSelectorController.EXPORT_SELECTED_ROWS_FIELD_NAME]);
            }
        });

        // On rajoute dans le composant Vue, la définition du beforeDestroy pour enlever l'écouteur et fermer la popup si elle est ouverte
        component.$options.beforeDestroy = (((typeof component.$options.beforeDestroy === 'function') ? [component.$options.beforeDestroy] : component.$options.beforeDestroy) || []) as any;

        component.$options.beforeDestroy["push"](function () {

            if (!!component[TableWidgetExternalSelectorController.REGISTERED_COMPONENT_UID_FIELD_NAME]) {

                const conf_: TableWidgetExternalSelectorConf<T> = component[TableWidgetExternalSelectorController.REGISTERED_COMPONENT_UID_FIELD_NAME];
                window.removeEventListener("message", this);
                if (!!conf_.selector_window) {
                    conf_.selector_window.close();
                }
                delete conf_.selector_window;
                delete component[TableWidgetExternalSelectorController.REGISTERED_COMPONENT_UID_FIELD_NAME];
            }
        });
    }

    /**
     * open_external_selector(this, num_range) : ouvre le popup de sélection configurée avec la fonction init_external_selector
     * @param component
     * @param num_range
     */
    public static open_external_selector<T extends VueComponentBase, VOType extends IDistantVOBase>(
        component: T,
        num_range: NumRange = NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT),
        vo: VOType = null,
    ) {
        if (!component[TableWidgetExternalSelectorController.REGISTERED_COMPONENT_UID_FIELD_NAME]) {
            throw new Error("Component not registered : you have to call init_external_selector before");
        }

        const conf: TableWidgetExternalSelectorConf<T> = component[TableWidgetExternalSelectorController.REGISTERED_COMPONENT_UID_FIELD_NAME];

        (window as any).instructions = {
            [TableWidgetExternalSelectorController.NUM_RANGE_FIELD_NAME]: num_range,
            [TableWidgetExternalSelectorController.REGISTERED_COMPONENT_UID_FIELD_NAME]: conf.registered_component_UID,
        };

        // Si on a un param builder, on ajoute une section ? entre l'url et le # du dashboard
        let selector_window_url = conf.selector_window_base_url;
        if (conf.params_builder) {
            const params = conf.params_builder(vo);

            if (params) {

                // On découpe l'url en deux parties : avant le # et après le #
                const parts = selector_window_url.split('#');
                selector_window_url = parts[0] + '?' + params + '#' + parts[1];
            }
        }
        conf.selector_window = window.open(
            selector_window_url,
            "_blank",
            // Proposition GPT .... :
            // "external_selector_" + component[TableWidgetExternalSelectorController.REGISTERED_COMPONENT_UID_FIELD_NAME],
            // "width=800,height=600,scrollbars=yes,resizable=yes,toolbar=no,location=no,status=no,menubar=no,copyhistory=no" +
            // ",left=" + (window.screen.width - 800) / 2 +
            // ",top=" + (window.screen.height - 600) / 2 +
            // ",screenX=" + (window.screen.width - 800) / 2 +
            // ",screenY=" + (window.screen.height - 600) / 2 +
            // ",alwaysRaised=yes" +
            // ",dependent=yes" +
            // ",dialog=yes" +
            // ",modal=yes" +
            // ",directories=no" +
            // ",fullscreen=no" +
            // ",personalbar=no" +
            // ",status=no" +
            // ",titlebar=no"
        );
    }

    private static strip_query(url: string): string {
        const [base, hash] = url.split('#');
        const cleanBase = base.split('?')[0]; // retire query
        return hash ? `${cleanBase}#${hash}` : cleanBase;
    }
}