import IDistantVOBase from "../../../../../../../shared/modules/IDistantVOBase";
import VueComponentBase from "../../../../VueComponentBase";

export default class TableWidgetExternalSelectorConf<T extends VueComponentBase> {

    /**
     * Pour identifier de manière unique le composant qui souhaite faire appel à ce système
     */
    private static registered_component_UID: number = 1;

    public registered_component_UID: number;
    public selector_window: any;
    public selector_window_base_url: string;

    public constructor(
        public component: T,
        public selector_dashboard_id: number,
        public data_received_callback: (datas: any[]) => void,
        public params_builder: (vo: IDistantVOBase) => string = null) {

        this.registered_component_UID = TableWidgetExternalSelectorConf.get_registered_component_UID();
    }

    public static get_registered_component_UID(): number {
        return TableWidgetExternalSelectorConf.registered_component_UID++;
    }
}