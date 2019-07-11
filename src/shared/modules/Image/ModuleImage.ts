import AccessPolicyTools from '../../tools/AccessPolicyTools';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import ImageVO from './vos/ImageVO';

export default class ModuleImage extends Module {

    public static MODULE_NAME: string = 'Image';

    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleImage.MODULE_NAME;
    public static POLICY_BO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleImage.MODULE_NAME + '.BO_ACCESS';

    public static IMAGES_ROOT: string = './images/';

    public static getInstance(): ModuleImage {
        if (!ModuleImage.instance) {
            ModuleImage.instance = new ModuleImage();
        }
        return ModuleImage.instance;
    }

    private static instance: ModuleImage = null;

    private constructor() {

        super("image", ModuleImage.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        let label_field = new ModuleTableField('path', ModuleTableField.FIELD_TYPE_image_field, 'Image', false);
        let datatable_fields = [
            label_field,
        ];

        let datatable = new ModuleTable(this, ImageVO.API_TYPE_ID, () => new ImageVO(), datatable_fields, label_field, "Images");
        this.datatables.push(datatable);
    }
}