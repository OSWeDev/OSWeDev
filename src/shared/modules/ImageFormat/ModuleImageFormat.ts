import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import APIControllerWrapper from '../API/APIControllerWrapper';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import DAOController from '../DAO/DAOController';
import ModuleDAO from '../DAO/ModuleDAO';
import FileVO from '../File/vos/FileVO';
import Module from '../Module';
import ModuleTableVO from '../ModuleTableVO';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../ModuleTableFieldVO';
import VersionedVOController from '../Versioned/VersionedVOController';
import VOsTypesManager from '../VO/manager/VOsTypesManager';
import GetFormattedImageParamVO, { GetFormattedImageParamVOStatic } from './apis/GetFormattedImageParamVO';
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

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleImageFormat {
        if (!ModuleImageFormat.instance) {
            ModuleImageFormat.instance = new ModuleImageFormat();
        }
        return ModuleImageFormat.instance;
    }

    private static instance: ModuleImageFormat = null;

    public get_formatted_image: (src: string, format_name: string, width: number, height: number) => Promise<FormattedImageVO> = APIControllerWrapper.sah(ModuleImageFormat.APINAME_get_formatted_image);

    private constructor() {

        super("imageformat", ModuleImageFormat.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public registerApis() {

        APIControllerWrapper.registerApi(new PostAPIDefinition<GetFormattedImageParamVO, FormattedImageVO>(
            DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, ImageFormatVO.API_TYPE_ID),
            ModuleImageFormat.APINAME_get_formatted_image,
            [ImageFormatVO.API_TYPE_ID],
            GetFormattedImageParamVOStatic
        ));
    }

    public initialize() {

        this.initializeImageFormatVO();
        this.initializeFormattedImageVO();
    }

    private initializeImageFormatVO() {

        let fields = [
            ModuleTableFieldController.create_new(ImageFormatVO.API_TYPE_ID, field_names<ImageFormatVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom', true),
            ModuleTableFieldController.create_new(ImageFormatVO.API_TYPE_ID, field_names<ImageFormatVO>().remplir_larg, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Remplir la largeur', true, true, true),
            ModuleTableFieldController.create_new(ImageFormatVO.API_TYPE_ID, field_names<ImageFormatVO>().remplir_haut, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Remplir la hauteur', true, true, true),
            ModuleTableFieldController.create_new(ImageFormatVO.API_TYPE_ID, field_names<ImageFormatVO>().align_larg, ModuleTableFieldVO.FIELD_TYPE_enum, 'Alignement en largeur', true, true, ImageFormatVO.HALIGN_CENTER).setEnumValues(ImageFormatVO.HALIGN_NAMES),
            ModuleTableFieldController.create_new(ImageFormatVO.API_TYPE_ID, field_names<ImageFormatVO>().align_haut, ModuleTableFieldVO.FIELD_TYPE_enum, 'Alignement en hauteur', true, true, ImageFormatVO.VALIGN_CENTER).setEnumValues(ImageFormatVO.VALIGN_NAMES),
            ModuleTableFieldController.create_new(ImageFormatVO.API_TYPE_ID, field_names<ImageFormatVO>().quality, ModuleTableFieldVO.FIELD_TYPE_prct, 'Qualité', true, true, 0.9),
            ModuleTableFieldController.create_new(ImageFormatVO.API_TYPE_ID, field_names<ImageFormatVO>().height, ModuleTableFieldVO.FIELD_TYPE_int, 'Hauteur'),
            ModuleTableFieldController.create_new(ImageFormatVO.API_TYPE_ID, field_names<ImageFormatVO>().width, ModuleTableFieldVO.FIELD_TYPE_int, 'Largeur'),
            ModuleTableFieldController.create_new(ImageFormatVO.API_TYPE_ID, field_names<ImageFormatVO>().add_size_rename_name, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Ajouter la taille au nom', false, true, true),
            ModuleTableFieldController.create_new(ImageFormatVO.API_TYPE_ID, field_names<ImageFormatVO>().watermark_txt, ModuleTableFieldVO.FIELD_TYPE_string, 'Watermark texte'),
            ModuleTableFieldController.create_new(ImageFormatVO.API_TYPE_ID, field_names<ImageFormatVO>().watermark_x, ModuleTableFieldVO.FIELD_TYPE_int, 'Watermark ecart X'),
            ModuleTableFieldController.create_new(ImageFormatVO.API_TYPE_ID, field_names<ImageFormatVO>().watermark_y, ModuleTableFieldVO.FIELD_TYPE_int, 'Watermark ecart Y'),
            ModuleTableFieldController.create_new(ImageFormatVO.API_TYPE_ID, field_names<ImageFormatVO>().watermark_horizontal_align, ModuleTableFieldVO.FIELD_TYPE_enum, 'Watermark Alignement horizontal').setEnumValues(ImageFormatVO.WATERMARK_HORIZONTAL_ALIGN_LABELS),
            ModuleTableFieldController.create_new(ImageFormatVO.API_TYPE_ID, field_names<ImageFormatVO>().watermark_vertical_align, ModuleTableFieldVO.FIELD_TYPE_enum, 'Watermark Alignement vertical').setEnumValues(ImageFormatVO.WATERMARK_VERTICAL_ALIGN_LABELS),
            ModuleTableFieldController.create_new(ImageFormatVO.API_TYPE_ID, field_names<ImageFormatVO>().watermark_font, ModuleTableFieldVO.FIELD_TYPE_enum, 'Watermark Font').setEnumValues(ImageFormatVO.WATERMARK_FONT_LABELS),
            ModuleTableFieldController.create_new(ImageFormatVO.API_TYPE_ID, field_names<ImageFormatVO>().watermark_rotate, ModuleTableFieldVO.FIELD_TYPE_int, 'Watermark Rotation'),
        ];

        let table = new ModuleTableVO(this, ImageFormatVO.API_TYPE_ID, () => new ImageFormatVO(), fields, null, 'Formats d\'image');
        this.datatables.push(table);

        VersionedVOController.getInstance().registerModuleTable(table);
    }

    private initializeFormattedImageVO() {
        let file_id = ModuleTableFieldController.create_new(FormattedImageVO.API_TYPE_ID, field_names<FormattedImageVO>().file_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Image - fichier formatté', true).not_add_to_crud();
        let image_format_id = ModuleTableFieldController.create_new(FormattedImageVO.API_TYPE_ID, field_names<FormattedImageVO>().image_format_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Format d\'image', true);

        let fields = [
            file_id,
            image_format_id,

            ModuleTableFieldController.create_new(FormattedImageVO.API_TYPE_ID, field_names<FormattedImageVO>().formatted_src, ModuleTableFieldVO.FIELD_TYPE_string, 'Image formattée - url', true),
            ModuleTableFieldController.create_new(FormattedImageVO.API_TYPE_ID, field_names<FormattedImageVO>().image_src, ModuleTableFieldVO.FIELD_TYPE_string, 'Image - url', true),
            ModuleTableFieldController.create_new(FormattedImageVO.API_TYPE_ID, field_names<FormattedImageVO>().image_height, ModuleTableFieldVO.FIELD_TYPE_int, 'Image - hauteur', true),
            ModuleTableFieldController.create_new(FormattedImageVO.API_TYPE_ID, field_names<FormattedImageVO>().image_width, ModuleTableFieldVO.FIELD_TYPE_int, 'Image - largeur', true),
            ModuleTableFieldController.create_new(FormattedImageVO.API_TYPE_ID, field_names<FormattedImageVO>().remplir_larg, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Remplir la largeur', true, true, true),
            ModuleTableFieldController.create_new(FormattedImageVO.API_TYPE_ID, field_names<FormattedImageVO>().remplir_haut, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Remplir la hauteur', true, true, true),
            ModuleTableFieldController.create_new(FormattedImageVO.API_TYPE_ID, field_names<FormattedImageVO>().align_larg, ModuleTableFieldVO.FIELD_TYPE_enum, 'Alignement en largeur', true, true, ImageFormatVO.HALIGN_CENTER).setEnumValues(ImageFormatVO.HALIGN_NAMES),
            ModuleTableFieldController.create_new(FormattedImageVO.API_TYPE_ID, field_names<FormattedImageVO>().align_haut, ModuleTableFieldVO.FIELD_TYPE_enum, 'Alignement en hauteur', true, true, ImageFormatVO.VALIGN_CENTER).setEnumValues(ImageFormatVO.VALIGN_NAMES),
            ModuleTableFieldController.create_new(FormattedImageVO.API_TYPE_ID, field_names<FormattedImageVO>().quality, ModuleTableFieldVO.FIELD_TYPE_prct, 'Qualité', true, true, 0.9),
        ];

        let table = new ModuleTableVO(this, FormattedImageVO.API_TYPE_ID, () => new FormattedImageVO(), fields, null, 'Images formattées');
        this.datatables.push(table);

        file_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[FileVO.API_TYPE_ID]);
        image_format_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[ImageFormatVO.API_TYPE_ID]);

        VersionedVOController.getInstance().registerModuleTable(table);
    }
}