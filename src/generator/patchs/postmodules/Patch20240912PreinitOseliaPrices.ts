import { IDatabase } from 'pg-promise';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import NumSegment from '../../../shared/modules/DataRender/vos/NumSegment';
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import TSRange from '../../../shared/modules/DataRender/vos/TSRange';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import OseliaAssistantPriceVO from '../../../shared/modules/Oselia/vos/OseliaAssistantPriceVO';
import OseliaImagePriceVO from '../../../shared/modules/Oselia/vos/OseliaImagePriceVO';
import OseliaModelVO from '../../../shared/modules/Oselia/vos/OseliaModelVO';
import OseliaTokenPriceVO from '../../../shared/modules/Oselia/vos/OseliaTokenPriceVO';
import OseliaVisionPriceVO from '../../../shared/modules/Oselia/vos/OseliaVisionPriceVO';
import RangeHandler from '../../../shared/tools/RangeHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20240912PreinitOseliaPrices implements IGeneratorWorker {

    private static instance: Patch20240912PreinitOseliaPrices = null;

    private constructor() { }
    get uid(): string {
        return 'Patch20240912PreinitOseliaPrices';
    }

    public static getInstance(): Patch20240912PreinitOseliaPrices {
        if (!Patch20240912PreinitOseliaPrices.instance) {
            Patch20240912PreinitOseliaPrices.instance = new Patch20240912PreinitOseliaPrices();
        }
        return Patch20240912PreinitOseliaPrices.instance;
    }

    public async work(db: IDatabase<unknown>) {

        // gpt-4o-2024-08-06
        const gpt_4o_2024_08_06_model = new OseliaModelVO();
        gpt_4o_2024_08_06_model.name = 'gpt-4o-2024-08-06';
        gpt_4o_2024_08_06_model.description = 'Version du modèle GPT-4o du 6 août 2024';
        gpt_4o_2024_08_06_model.ts_range = RangeHandler.getMaxTSRange();
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(gpt_4o_2024_08_06_model);

        const gpt_4o_2024_08_06_token_price = new OseliaTokenPriceVO();
        gpt_4o_2024_08_06_token_price.model_id_ranges = [RangeHandler.create_single_elt_NumRange(gpt_4o_2024_08_06_model.id, NumSegment.TYPE_INT)];
        gpt_4o_2024_08_06_token_price.ts_range = RangeHandler.getMaxTSRange();
        gpt_4o_2024_08_06_token_price.million_input_token_price = 2.5;
        gpt_4o_2024_08_06_token_price.million_output_token_price = 10;
        gpt_4o_2024_08_06_token_price.partner_million_input_token_base_price = 10;
        gpt_4o_2024_08_06_token_price.partner_million_output_token_base_price = 40;
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(gpt_4o_2024_08_06_token_price);

        const gpt_4o_2024_08_06_vision_price = new OseliaVisionPriceVO();
        gpt_4o_2024_08_06_vision_price.model_id_ranges = [RangeHandler.create_single_elt_NumRange(gpt_4o_2024_08_06_model.id, NumSegment.TYPE_INT)];
        gpt_4o_2024_08_06_vision_price.ts_range = RangeHandler.getMaxTSRange();
        gpt_4o_2024_08_06_vision_price.million_token_price = 2.5;
        gpt_4o_2024_08_06_vision_price.base_tokens = 85;
        gpt_4o_2024_08_06_vision_price.tokens_per_tile = 170;
        gpt_4o_2024_08_06_vision_price.tile_height_px = 512;
        gpt_4o_2024_08_06_vision_price.tile_width_px = 512;
        gpt_4o_2024_08_06_vision_price.partner_million_token_base_price = 10;
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(gpt_4o_2024_08_06_vision_price);

        // gpt-4o-2024-05-13
        const gpt_4o_2024_05_13_model = new OseliaModelVO();
        gpt_4o_2024_05_13_model.name = 'gpt-4o-2024-05-13';
        gpt_4o_2024_05_13_model.description = 'Version du modèle GPT-4o du 13 mai 2024';
        gpt_4o_2024_05_13_model.ts_range = RangeHandler.getMaxTSRange();
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(gpt_4o_2024_05_13_model);

        const gpt_4o_2024_05_13_token_price = new OseliaTokenPriceVO();
        gpt_4o_2024_05_13_token_price.model_id_ranges = [RangeHandler.create_single_elt_NumRange(gpt_4o_2024_05_13_model.id, NumSegment.TYPE_INT)];
        gpt_4o_2024_05_13_token_price.ts_range = RangeHandler.getMaxTSRange();
        gpt_4o_2024_05_13_token_price.million_input_token_price = 5;
        gpt_4o_2024_05_13_token_price.million_output_token_price = 15;
        gpt_4o_2024_05_13_token_price.partner_million_input_token_base_price = 20;
        gpt_4o_2024_05_13_token_price.partner_million_output_token_base_price = 60;
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(gpt_4o_2024_05_13_token_price);

        const gpt_4o_2024_05_13_vision_price = new OseliaVisionPriceVO();
        gpt_4o_2024_05_13_vision_price.model_id_ranges = [RangeHandler.create_single_elt_NumRange(gpt_4o_2024_05_13_model.id, NumSegment.TYPE_INT)];
        gpt_4o_2024_05_13_vision_price.ts_range = RangeHandler.getMaxTSRange();
        gpt_4o_2024_05_13_vision_price.million_token_price = 5;
        gpt_4o_2024_05_13_vision_price.base_tokens = 85;
        gpt_4o_2024_05_13_vision_price.tokens_per_tile = 170;
        gpt_4o_2024_05_13_vision_price.tile_height_px = 512;
        gpt_4o_2024_05_13_vision_price.tile_width_px = 512;
        gpt_4o_2024_05_13_vision_price.partner_million_token_base_price = 20;
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(gpt_4o_2024_05_13_vision_price);


        // GPT-4o
        const gpt4o_model_pre_2_10_2024 = new OseliaModelVO();
        gpt4o_model_pre_2_10_2024.name = 'gpt-4o';
        gpt4o_model_pre_2_10_2024.description = 'Version active par défaut du modèle GPT-4o';
        gpt4o_model_pre_2_10_2024.is_alias = true;
        gpt4o_model_pre_2_10_2024.alias_model_id = gpt_4o_2024_05_13_model.id;
        gpt4o_model_pre_2_10_2024.ts_range = RangeHandler.createNew(TSRange.RANGE_TYPE, RangeHandler.MIN_TS, Dates.parse('2024-10-02'), true, false, TimeSegment.TYPE_DAY);
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(gpt4o_model_pre_2_10_2024);

        const gpt4o_model_post_2_10_2024 = new OseliaModelVO();
        gpt4o_model_post_2_10_2024.name = 'gpt-4o';
        gpt4o_model_post_2_10_2024.description = 'Version active par défaut du modèle GPT-4o';
        gpt4o_model_post_2_10_2024.is_alias = true;
        gpt4o_model_post_2_10_2024.alias_model_id = gpt_4o_2024_08_06_model.id;
        gpt4o_model_post_2_10_2024.ts_range = RangeHandler.createNew(TSRange.RANGE_TYPE, Dates.parse('2024-10-02'), RangeHandler.MAX_TS, true, true, TimeSegment.TYPE_DAY);
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(gpt4o_model_post_2_10_2024);




        // gpt-4o-mini-2024-07-18
        const gpt_4o_mini_2024_07_18_model = new OseliaModelVO();
        gpt_4o_mini_2024_07_18_model.name = 'gpt-4o-mini-2024-07-18';
        gpt_4o_mini_2024_07_18_model.description = 'Version du modèle GPT-4o-mini du 18 juillet 2024';
        gpt_4o_mini_2024_07_18_model.ts_range = RangeHandler.getMaxTSRange();
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(gpt_4o_mini_2024_07_18_model);

        const gpt_4o_mini_2024_07_18_token_price = new OseliaTokenPriceVO();
        gpt_4o_mini_2024_07_18_token_price.model_id_ranges = [RangeHandler.create_single_elt_NumRange(gpt_4o_mini_2024_07_18_model.id, NumSegment.TYPE_INT)];
        gpt_4o_mini_2024_07_18_token_price.ts_range = RangeHandler.getMaxTSRange();
        gpt_4o_mini_2024_07_18_token_price.million_input_token_price = 0.15;
        gpt_4o_mini_2024_07_18_token_price.million_output_token_price = 0.6;
        gpt_4o_mini_2024_07_18_token_price.partner_million_input_token_base_price = 0.6;
        gpt_4o_mini_2024_07_18_token_price.partner_million_output_token_base_price = 2.4;
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(gpt_4o_mini_2024_07_18_token_price);

        const gpt_4o_mini_2024_07_18_vision_price = new OseliaVisionPriceVO();
        gpt_4o_mini_2024_07_18_vision_price.model_id_ranges = [RangeHandler.create_single_elt_NumRange(gpt_4o_mini_2024_07_18_model.id, NumSegment.TYPE_INT)];
        gpt_4o_mini_2024_07_18_vision_price.ts_range = RangeHandler.getMaxTSRange();
        gpt_4o_mini_2024_07_18_vision_price.million_token_price = 0.15;
        gpt_4o_mini_2024_07_18_vision_price.base_tokens = 2833;
        gpt_4o_mini_2024_07_18_vision_price.tokens_per_tile = 5667;
        gpt_4o_mini_2024_07_18_vision_price.tile_height_px = 512;
        gpt_4o_mini_2024_07_18_vision_price.tile_width_px = 512;
        gpt_4o_mini_2024_07_18_vision_price.partner_million_token_base_price = 0.6;
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(gpt_4o_mini_2024_07_18_vision_price);


        // gpt-4o-mini
        const gpt4o_mini_model = new OseliaModelVO();
        gpt4o_mini_model.name = 'gpt-4o-mini';
        gpt4o_mini_model.description = 'Version active par défaut du modèle GPT-4o-mini';
        gpt4o_mini_model.is_alias = true;
        gpt4o_mini_model.alias_model_id = gpt_4o_mini_2024_07_18_model.id;
        gpt4o_mini_model.ts_range = RangeHandler.getMaxTSRange();
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(gpt4o_mini_model);



        // dall-e-3
        const dall_e_3_model = new OseliaModelVO();
        dall_e_3_model.name = 'dall-e-3';
        dall_e_3_model.description = 'Modèle de génération d\'images DALL-E-3';
        dall_e_3_model.ts_range = RangeHandler.getMaxTSRange();
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(dall_e_3_model);

        const dall_e_3_standard_1024_1024_image_price = new OseliaImagePriceVO();
        dall_e_3_standard_1024_1024_image_price.model_id_ranges = [RangeHandler.create_single_elt_NumRange(dall_e_3_model.id, NumSegment.TYPE_INT)];
        dall_e_3_standard_1024_1024_image_price.ts_range = RangeHandler.getMaxTSRange();
        dall_e_3_standard_1024_1024_image_price.price = 0.04;
        dall_e_3_standard_1024_1024_image_price.reseller_base_price = 0.16;
        dall_e_3_standard_1024_1024_image_price.quality_filter = ['standard'];
        dall_e_3_standard_1024_1024_image_price.resolution_filter = ['1024x1024'];
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(dall_e_3_standard_1024_1024_image_price);

        const dall_e_3_standard_1024_1792_image_price = new OseliaImagePriceVO();
        dall_e_3_standard_1024_1792_image_price.model_id_ranges = [RangeHandler.create_single_elt_NumRange(dall_e_3_model.id, NumSegment.TYPE_INT)];
        dall_e_3_standard_1024_1792_image_price.ts_range = RangeHandler.getMaxTSRange();
        dall_e_3_standard_1024_1792_image_price.price = 0.08;
        dall_e_3_standard_1024_1792_image_price.reseller_base_price = 0.32;
        dall_e_3_standard_1024_1792_image_price.quality_filter = ['standard'];
        dall_e_3_standard_1024_1792_image_price.resolution_filter = ['1024x1792', '1792x1024'];
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(dall_e_3_standard_1024_1792_image_price);

        const dall_e_3_hd_1024_10124_image_price = new OseliaImagePriceVO();
        dall_e_3_hd_1024_10124_image_price.model_id_ranges = [RangeHandler.create_single_elt_NumRange(dall_e_3_model.id, NumSegment.TYPE_INT)];
        dall_e_3_hd_1024_10124_image_price.ts_range = RangeHandler.getMaxTSRange();
        dall_e_3_hd_1024_10124_image_price.price = 0.08;
        dall_e_3_hd_1024_10124_image_price.reseller_base_price = 0.32;
        dall_e_3_hd_1024_10124_image_price.quality_filter = ['hd'];
        dall_e_3_hd_1024_10124_image_price.resolution_filter = ['1024x1024'];
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(dall_e_3_hd_1024_10124_image_price);

        const dall_e_3_hd_1024_1792_image_price = new OseliaImagePriceVO();
        dall_e_3_hd_1024_1792_image_price.model_id_ranges = [RangeHandler.create_single_elt_NumRange(dall_e_3_model.id, NumSegment.TYPE_INT)];
        dall_e_3_hd_1024_1792_image_price.ts_range = RangeHandler.getMaxTSRange();
        dall_e_3_hd_1024_1792_image_price.price = 0.12;
        dall_e_3_hd_1024_1792_image_price.reseller_base_price = 0.48;
        dall_e_3_hd_1024_1792_image_price.quality_filter = ['hd'];
        dall_e_3_hd_1024_1792_image_price.resolution_filter = ['1024x1792', '1792x1024'];
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(dall_e_3_hd_1024_1792_image_price);


        // dall-e-2
        const dall_e_2_model = new OseliaModelVO();
        dall_e_2_model.name = 'dall-e-2';
        dall_e_2_model.description = 'Modèle de génération d\'images DALL-E-2';
        dall_e_2_model.ts_range = RangeHandler.getMaxTSRange();
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(dall_e_2_model);

        const dall_e_2_1024_1024_image_price = new OseliaImagePriceVO();
        dall_e_2_1024_1024_image_price.model_id_ranges = [RangeHandler.create_single_elt_NumRange(dall_e_2_model.id, NumSegment.TYPE_INT)];
        dall_e_2_1024_1024_image_price.ts_range = RangeHandler.getMaxTSRange();
        dall_e_2_1024_1024_image_price.price = 0.02;
        dall_e_2_1024_1024_image_price.reseller_base_price = 0.08;
        dall_e_2_1024_1024_image_price.quality_filter = ['standard'];
        dall_e_2_1024_1024_image_price.resolution_filter = ['1024x1024'];
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(dall_e_2_1024_1024_image_price);

        const dall_e_2_512_512_image_price = new OseliaImagePriceVO();
        dall_e_2_512_512_image_price.model_id_ranges = [RangeHandler.create_single_elt_NumRange(dall_e_2_model.id, NumSegment.TYPE_INT)];
        dall_e_2_512_512_image_price.ts_range = RangeHandler.getMaxTSRange();
        dall_e_2_512_512_image_price.price = 0.018;
        dall_e_2_512_512_image_price.reseller_base_price = 0.072;
        dall_e_2_512_512_image_price.quality_filter = ['standard'];
        dall_e_2_512_512_image_price.resolution_filter = ['512x512'];
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(dall_e_2_512_512_image_price);

        const dall_e_2_256_256_image_price = new OseliaImagePriceVO();
        dall_e_2_256_256_image_price.model_id_ranges = [RangeHandler.create_single_elt_NumRange(dall_e_2_model.id, NumSegment.TYPE_INT)];
        dall_e_2_256_256_image_price.ts_range = RangeHandler.getMaxTSRange();
        dall_e_2_256_256_image_price.price = 0.016;
        dall_e_2_256_256_image_price.reseller_base_price = 0.064;
        dall_e_2_256_256_image_price.quality_filter = ['standard'];
        dall_e_2_256_256_image_price.resolution_filter = ['256x256'];
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(dall_e_2_256_256_image_price);


        const assistant_prices = new OseliaAssistantPriceVO();
        assistant_prices.model_id_ranges = RangeHandler.get_ids_ranges_from_vos([
            gpt_4o_2024_05_13_model,
            gpt_4o_2024_08_06_model,
            gpt4o_model_pre_2_10_2024,
            gpt4o_model_post_2_10_2024,
            gpt_4o_mini_2024_07_18_model,
            gpt4o_mini_model,
        ]);
        assistant_prices.ts_range = RangeHandler.getMaxTSRange();
        assistant_prices.code_interpreter_session_price = 0.03;
        assistant_prices.file_search_gibibyte_daily_price = 0.1;
        assistant_prices.partner_code_interpreter_session_base_price = 0.12;
        assistant_prices.partner_file_search_gibibyte_daily_base_price = 0.4;
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(assistant_prices);


        // gpt-4-turbo-2024-04-09
        const gpt_4_turbo_2024_04_09_model = new OseliaModelVO();
        gpt_4_turbo_2024_04_09_model.name = 'gpt-4-turbo-2024-04-09';
        gpt_4_turbo_2024_04_09_model.description = 'Version du modèle GPT-4 turbo du 9 avril 2024';
        gpt_4_turbo_2024_04_09_model.ts_range = RangeHandler.getMaxTSRange();
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(gpt_4_turbo_2024_04_09_model);

        const gpt_4_turbo_2024_04_09_token_price = new OseliaTokenPriceVO();
        gpt_4_turbo_2024_04_09_token_price.model_id_ranges = [RangeHandler.create_single_elt_NumRange(gpt_4_turbo_2024_04_09_model.id, NumSegment.TYPE_INT)];
        gpt_4_turbo_2024_04_09_token_price.ts_range = RangeHandler.getMaxTSRange();
        gpt_4_turbo_2024_04_09_token_price.million_input_token_price = 10;
        gpt_4_turbo_2024_04_09_token_price.million_output_token_price = 30;
        gpt_4_turbo_2024_04_09_token_price.partner_million_input_token_base_price = 40;
        gpt_4_turbo_2024_04_09_token_price.partner_million_output_token_base_price = 120;
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(gpt_4_turbo_2024_04_09_token_price);

        // gpt-4-turbo
        const gpt_4_turbo_model = new OseliaModelVO();
        gpt_4_turbo_model.name = 'gpt-4-turbo';
        gpt_4_turbo_model.description = 'Version du modèle GPT-4 turbo';
        gpt_4_turbo_model.is_alias = true;
        gpt_4_turbo_model.alias_model_id = gpt_4_turbo_2024_04_09_model.id;
        gpt_4_turbo_model.ts_range = RangeHandler.getMaxTSRange();
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(gpt_4_turbo_model);

        // gpt-4-turbo-preview
        const gpt_4_turbo_preview_model = new OseliaModelVO();
        gpt_4_turbo_preview_model.name = 'gpt-4-turbo-preview';
        gpt_4_turbo_preview_model.description = 'Version du modèle GPT-4 turbo preview';
        gpt_4_turbo_preview_model.is_alias = true;
        gpt_4_turbo_preview_model.alias_model_id = gpt_4_turbo_2024_04_09_model.id;
        gpt_4_turbo_preview_model.ts_range = RangeHandler.getMaxTSRange();
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(gpt_4_turbo_preview_model);
    }
}