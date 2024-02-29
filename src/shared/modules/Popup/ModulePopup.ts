import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import RoleVO from '../AccessPolicy/vos/RoleVO';
import ModuleTableController from '../DAO/ModuleTableController';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import TimeSegment from '../DataRender/vos/TimeSegment';
import Module from '../Module';
import VersionedVOController from '../Versioned/VersionedVOController';
import PopupVO from './vos/PopupVO';

export default class ModulePopup extends Module {

    public static MODULE_NAME: string = 'Popup';

    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModulePopup.MODULE_NAME;
    public static POLICY_BO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModulePopup.MODULE_NAME + '.BO_ACCESS';

    // istanbul ignore next: nothing to test
    public static getInstance(): ModulePopup {
        if (!ModulePopup.instance) {
            ModulePopup.instance = new ModulePopup();
        }
        return ModulePopup.instance;
    }

    private static instance: ModulePopup = null;

    private constructor() {

        super("popup", ModulePopup.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public initialize() {

        this.initializePopupVO();
    }

    private initializePopupVO() {
        const only_roles = ModuleTableFieldController.create_new(PopupVO.API_TYPE_ID, field_names<PopupVO>().only_roles, ModuleTableFieldVO.FIELD_TYPE_refrange_array, 'Seulement les rôles sélectionnés (laisser vide pour tout le monde)');

        const fields = [
            ModuleTableFieldController.create_new(PopupVO.API_TYPE_ID, field_names<PopupVO>().activated_ts_range, ModuleTableFieldVO.FIELD_TYPE_tsrange, "Période d'affichage").set_segmentation_type(TimeSegment.TYPE_DAY),
            ModuleTableFieldController.create_new(PopupVO.API_TYPE_ID, field_names<PopupVO>().title, ModuleTableFieldVO.FIELD_TYPE_html, 'Titre', true),
            ModuleTableFieldController.create_new(PopupVO.API_TYPE_ID, field_names<PopupVO>().message, ModuleTableFieldVO.FIELD_TYPE_html, 'Message', true),
            ModuleTableFieldController.create_new(PopupVO.API_TYPE_ID, field_names<PopupVO>().btn_txt, ModuleTableFieldVO.FIELD_TYPE_string, 'Texte du bouton', false, true, 'Fermer'),
            ModuleTableFieldController.create_new(PopupVO.API_TYPE_ID, field_names<PopupVO>().cookie_name, ModuleTableFieldVO.FIELD_TYPE_string, "Cookie pour bloquer l'affichage", true).unique(),
            only_roles,
        ];

        const table = ModuleTableController.create_new(this.name, PopupVO, null, 'Popups');

        only_roles.set_many_to_one_target_moduletable_name(RoleVO.API_TYPE_ID);

        VersionedVOController.getInstance().registerModuleTable(table);
    }
}