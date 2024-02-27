import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import Module from '../Module';
import ModuleTableVO from '../DAO/vos/ModuleTableVO';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import ImageVO from './vos/ImageVO';

export default class ModuleImage extends Module {

    public static MODULE_NAME: string = 'Image';

    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleImage.MODULE_NAME;
    public static POLICY_BO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleImage.MODULE_NAME + '.BO_ACCESS';

    public static IMAGES_ROOT: string = './images/';

    // istanbul ignore next: nothing to test
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

        let label_field = ModuleTableFieldController.create_new(ImageVO.API_TYPE_ID, field_names<ImageVO>().path, ModuleTableFieldVO.FIELD_TYPE_image_field, 'Image', true).unique();
        let datatable_fields = [
            label_field,
        ];

        let datatable = new ModuleTableVO(this, ImageVO.API_TYPE_ID, () => new ImageVO(), datatable_fields, label_field, "Images");
        this.datatables.push(datatable);
    }
}