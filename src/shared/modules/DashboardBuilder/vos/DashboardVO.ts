import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";
import IWeightedItem from "../../../tools/interfaces/IWeightedItem";
import DefaultTranslationVO from "../../Translation/vos/DefaultTranslationVO";
import DashboardBuilderController from "../DashboardBuilderController";

export default class DashboardVO implements IDistantVOBase, IWeightedItem {
    public static API_TYPE_ID: string = "dashboard";

    public _type: string = DashboardVO.API_TYPE_ID;

    public id: number;

    public title: string;

    /**
     * Pour les DBs qu'on désigne comme template de type de données
     */
    public moduletable_crud_template_ref_id: number;

    /**
     * Si un db est template de type de données, on peut en plus le paramétrer pour gérer un formulaire
     */
    public moduletable_crud_template_form: boolean;

    public cycle_tables: string[];
    public cycle_fields: { [voType: string]: string[] };
    public cycle_links: { [voType: string]: string[] };
    public has_cycle: boolean;

    public weight: number;

    get translatable_name_code_text(): string {

        if (!this.id) {
            return null;
        }

        return DashboardBuilderController.DASHBOARD_NAME_CODE_PREFIX + this.id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
    }
}