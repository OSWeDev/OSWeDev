import AccessPolicyTools from '../../tools/AccessPolicyTools';
import RoleVO from '../AccessPolicy/vos/RoleVO';
import TimeSegment from '../DataRender/vos/TimeSegment';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import VersionedVOController from '../Versioned/VersionedVOController';
import VOsTypesManager from '../VOsTypesManager';
import PopupVO from './vos/PopupVO';

export default class ModulePopup extends Module {

    public static MODULE_NAME: string = 'Popup';

    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModulePopup.MODULE_NAME;
    public static POLICY_BO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModulePopup.MODULE_NAME + '.BO_ACCESS';

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
        this.fields = [];
        this.datatables = [];

        this.initializePopupVO();
    }

    private initializePopupVO() {
        let only_roles = new ModuleTableField('only_roles', ModuleTableField.FIELD_TYPE_refrange_array, 'Seulement les rôles sélectionnés (laisser vide pour tout le monde)');

        let fields = [
            new ModuleTableField('activated_ts_range', ModuleTableField.FIELD_TYPE_tsrange, "Période d'affichage").set_segmentation_type(TimeSegment.TYPE_DAY),
            new ModuleTableField('title', ModuleTableField.FIELD_TYPE_html, 'Titre'),
            new ModuleTableField('message', ModuleTableField.FIELD_TYPE_html, 'Message'),
            new ModuleTableField('btn_txt', ModuleTableField.FIELD_TYPE_string, 'Texte du bouton', false, true, 'Fermer'),
            new ModuleTableField('cookie_name', ModuleTableField.FIELD_TYPE_string, "Cookie pour bloquer l'affichage"),
            only_roles,
        ];

        let table = new ModuleTable(this, PopupVO.API_TYPE_ID, () => new PopupVO(), fields, null, 'Popups');
        this.datatables.push(table);

        only_roles.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[RoleVO.API_TYPE_ID]);

        VersionedVOController.getInstance().registerModuleTable(table);
    }
}