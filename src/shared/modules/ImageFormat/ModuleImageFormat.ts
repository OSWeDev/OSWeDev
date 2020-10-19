import AccessPolicyTools from '../../tools/AccessPolicyTools';
import ModuleAPI from '../API/ModuleAPI';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import ModuleDAO from '../DAO/ModuleDAO';
import FileVO from '../File/vos/FileVO';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import VersionedVOController from '../Versioned/VersionedVOController';
import VOsTypesManager from '../VOsTypesManager';
import GetFormattedImageParamVO from './apis/GetFormattedImageParamVO';
import FormattedImageVO from './vos/FormattedImageVO';
import ImageFormatVO from './vos/ImageFormatVO';

export default class ModuleImageFormat extends Module {

    /**
     * Pour le moment, on ne veut gerer que du png ou du jpg
     * Toutes les images doivent être dans "/files/resizable_imgs/" + SRC [la src indiquée dans le composant]
     */

    public static RESIZABLE_IMGS_PATH_BASE: string = "./files/resizable_imgs/";

    public static MODULE_NAME: string = 'ImageFormat';

    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleImageFormat.MODULE_NAME;
    public static POLICY_BO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleImageFormat.MODULE_NAME + '.BO_ACCESS';

    public static APINAME_get_formatted_image: string = "get_formatted_image";

    public static getInstance(): ModuleImageFormat {
        if (!ModuleImageFormat.instance) {
            ModuleImageFormat.instance = new ModuleImageFormat();
        }
        return ModuleImageFormat.instance;
    }

    private static instance: ModuleImageFormat = null;

    private constructor() {

        super("imageformat", ModuleImageFormat.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public registerApis() {

        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<GetFormattedImageParamVO, FormattedImageVO>(
            ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, ImageFormatVO.API_TYPE_ID),
            ModuleImageFormat.APINAME_get_formatted_image,
            [ImageFormatVO.API_TYPE_ID],
            GetFormattedImageParamVO.translateCheckAccessParams
        ));
    }

    public async get_formatted_image(src: string, format_name: string, width: number, height: number): Promise<FormattedImageVO> {
        return ModuleAPI.getInstance().handleAPI<GetFormattedImageParamVO, FormattedImageVO>(ModuleImageFormat.APINAME_get_formatted_image, src, format_name, width, height);
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        this.initializeImageFormatVO();
        this.initializeFormattedImageVO();
    }

    private initializeImageFormatVO() {

        let fields = [
            new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Nom', true),
            new ModuleTableField('remplir_larg', ModuleTableField.FIELD_TYPE_boolean, 'Remplir la largeur', true, true, true),
            new ModuleTableField('remplir_haut', ModuleTableField.FIELD_TYPE_boolean, 'Remplir la hauteur', true, true, true),
            new ModuleTableField('align_larg', ModuleTableField.FIELD_TYPE_enum, 'Alignement en largeur', true, true, ImageFormatVO.HALIGN_CENTER).setEnumValues(ImageFormatVO.HALIGN_NAMES),
            new ModuleTableField('align_haut', ModuleTableField.FIELD_TYPE_enum, 'Alignement en hauteur', true, true, ImageFormatVO.VALIGN_CENTER).setEnumValues(ImageFormatVO.VALIGN_NAMES),
            new ModuleTableField('quality', ModuleTableField.FIELD_TYPE_prct, 'Qualité', true, true, 0.9),
        ];

        let table = new ModuleTable(this, ImageFormatVO.API_TYPE_ID, () => new ImageFormatVO(), fields, null, 'Formats d\'image');
        this.datatables.push(table);

        VersionedVOController.getInstance().registerModuleTable(table);
    }

    private initializeFormattedImageVO() {
        let file_id = new ModuleTableField('file_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Image - fichier formatté', true);
        let image_format_id = new ModuleTableField('image_format_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Format d\'image', true);

        let fields = [
            file_id,
            image_format_id,

            new ModuleTableField('formatted_src', ModuleTableField.FIELD_TYPE_string, 'Image formattée - url', true),
            new ModuleTableField('image_src', ModuleTableField.FIELD_TYPE_string, 'Image - url', true),
            new ModuleTableField('image_height', ModuleTableField.FIELD_TYPE_int, 'Image - hauteur', true),
            new ModuleTableField('image_width', ModuleTableField.FIELD_TYPE_int, 'Image - largeur', true),
            new ModuleTableField('remplir_larg', ModuleTableField.FIELD_TYPE_boolean, 'Remplir la largeur', true, true, true),
            new ModuleTableField('remplir_haut', ModuleTableField.FIELD_TYPE_boolean, 'Remplir la hauteur', true, true, true),
            new ModuleTableField('align_larg', ModuleTableField.FIELD_TYPE_enum, 'Alignement en largeur', true, true, ImageFormatVO.HALIGN_CENTER).setEnumValues(ImageFormatVO.HALIGN_NAMES),
            new ModuleTableField('align_haut', ModuleTableField.FIELD_TYPE_enum, 'Alignement en hauteur', true, true, ImageFormatVO.VALIGN_CENTER).setEnumValues(ImageFormatVO.VALIGN_NAMES),
            new ModuleTableField('quality', ModuleTableField.FIELD_TYPE_prct, 'Qualité', true, true, 0.9),
        ];

        let table = new ModuleTable(this, FormattedImageVO.API_TYPE_ID, () => new FormattedImageVO(), fields, null, 'Images formattées');
        this.datatables.push(table);

        file_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[FileVO.API_TYPE_ID]);
        image_format_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[ImageFormatVO.API_TYPE_ID]);

        VersionedVOController.getInstance().registerModuleTable(table);
    }
}