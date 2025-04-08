import Vue from "vue";
import NumRange from "../../../../../../shared/modules/DataRender/vos/NumRange";
import NumSegment from "../../../../../../shared/modules/DataRender/vos/NumSegment";
import VueComponentBase from "../../../VueComponentBase";

/**
 * Controleur pour le système de sélection externe par popup (pour le moment)
 */
export default class TableWidgetExternalSelectorController {

    public static REGISTERED_COMPONENT_UID_FIELD_NAME: string = "external_selector_registered_component_UID";
    public static NUM_RANGE_FIELD_NAME: string = 'external_selector_num_range';
    public static EXPORT_SELECTED_ROWS_FIELD_NAME: string = 'external_selector_export_selected_rows';

    /**
     * Pour identifier de manière unique le composant qui souhaite faire appel à ce système
     */
    private static registered_component_UID: number = 1;

    private static export_windows_by_registered_component_UID: { [registered_component_UID: number]: Window } = {};
    private static window_url_by_registered_component_UID: { [registered_component_UID: number]: string } = {};

    public static get_registered_component_UID(): number {
        return TableWidgetExternalSelectorController.registered_component_UID++;
    }

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
        data_received_callback: (datas: any[]) => void): number {

        if (!selector_dashboard_id) {
            // RAS on a pas d'id de dashboard
            return null;
        }

        // Si on a déjà configuré ce composant, inutile de le faire à nouveau
        if (component[TableWidgetExternalSelectorController.REGISTERED_COMPONENT_UID_FIELD_NAME]) {
            return component[TableWidgetExternalSelectorController.REGISTERED_COMPONENT_UID_FIELD_NAME];
        }

        const registered_component_UID = TableWidgetExternalSelectorController.get_registered_component_UID();
        // On enregistre le registered_component_UID dans le composant
        component[TableWidgetExternalSelectorController.REGISTERED_COMPONENT_UID_FIELD_NAME] = registered_component_UID;

        const { protocol, hostname, port } = window.location;
        const file_system_url = `${protocol}//${hostname}${(port ? `:${port}` : '')}/admin#/dashboard/view/`;

        TableWidgetExternalSelectorController.window_url_by_registered_component_UID[registered_component_UID] = file_system_url + selector_dashboard_id;

        window.addEventListener("message", (event: MessageEvent) => {
            const source = event.source as Window;
            if ((source.location.href !== file_system_url + selector_dashboard_id)) {
                return;
            } else {

                if (event.data[TableWidgetExternalSelectorController.REGISTERED_COMPONENT_UID_FIELD_NAME] !== registered_component_UID) {
                    return;
                }

                data_received_callback(event.data[TableWidgetExternalSelectorController.EXPORT_SELECTED_ROWS_FIELD_NAME]);
            }
        });

        // On rajoute dans le composant Vue, la définition du beforeDestroy pour enlever l'écouteur et fermer la popup si elle est ouverte
        const current_before_destroy = component.$options.beforeDestroy;

        component.$options.beforeDestroy = function () {

            if (!!component[TableWidgetExternalSelectorController.REGISTERED_COMPONENT_UID_FIELD_NAME]) {
                window.removeEventListener("message", this);
                if (!!TableWidgetExternalSelectorController.export_windows_by_registered_component_UID[component[TableWidgetExternalSelectorController.REGISTERED_COMPONENT_UID_FIELD_NAME]]) {
                    TableWidgetExternalSelectorController.export_windows_by_registered_component_UID[component[TableWidgetExternalSelectorController.REGISTERED_COMPONENT_UID_FIELD_NAME]].close();
                }
                delete TableWidgetExternalSelectorController.export_windows_by_registered_component_UID[component[TableWidgetExternalSelectorController.REGISTERED_COMPONENT_UID_FIELD_NAME]];
                delete component[TableWidgetExternalSelectorController.REGISTERED_COMPONENT_UID_FIELD_NAME];
                delete TableWidgetExternalSelectorController.window_url_by_registered_component_UID[component[TableWidgetExternalSelectorController.REGISTERED_COMPONENT_UID_FIELD_NAME]];
            }

            if (current_before_destroy) {
                current_before_destroy.call(this);
            }
        };
    }

    /**
     * open_external_selector(this, num_range) : ouvre le popup de sélection configurée avec la fonction init_external_selector
     * @param component
     * @param num_range
     */
    public static open_external_selector<T extends VueComponentBase>(
        component: T,
        num_range: NumRange = NumRange.createNew(0, 1, true, true, NumSegment.TYPE_INT),
    ) {
        if (!component[TableWidgetExternalSelectorController.REGISTERED_COMPONENT_UID_FIELD_NAME]) {
            throw new Error("Component not registered : you have to call init_external_selector before");
        }

        (window as any).instructions = {
            [TableWidgetExternalSelectorController.NUM_RANGE_FIELD_NAME]: num_range,
            [TableWidgetExternalSelectorController.REGISTERED_COMPONENT_UID_FIELD_NAME]: component[TableWidgetExternalSelectorController.REGISTERED_COMPONENT_UID_FIELD_NAME],
        };

        TableWidgetExternalSelectorController.export_windows_by_registered_component_UID[component[TableWidgetExternalSelectorController.REGISTERED_COMPONENT_UID_FIELD_NAME]] = window.open(
            TableWidgetExternalSelectorController.window_url_by_registered_component_UID[component[TableWidgetExternalSelectorController.REGISTERED_COMPONENT_UID_FIELD_NAME]],
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
}