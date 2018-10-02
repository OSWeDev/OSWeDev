import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import ImageVO from './vos/ImageVO';

export default class ModuleImage extends Module {

    public static IMAGES_ROOT: string = './images/';

    public static getInstance(): ModuleImage {
        if (!ModuleImage.instance) {
            ModuleImage.instance = new ModuleImage();
        }
        return ModuleImage.instance;
    }

    private static instance: ModuleImage = null;

    private constructor() {

        super("image", "Image");
        this.forceActivationOnInstallation();
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        let label_field = new ModuleTableField('path', ModuleTableField.FIELD_TYPE_image_field, 'Image', false);
        let datatable_fields = [
            label_field,
        ];

        let datatable = new ModuleTable(this, ImageVO.API_TYPE_ID, datatable_fields, label_field, "Images");
        this.datatables.push(datatable);
    }
}