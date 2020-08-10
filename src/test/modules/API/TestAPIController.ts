import { expect, assert } from 'chai';
import 'mocha';
import RoleVO from '../../../shared/modules/AccessPolicy/vos/RoleVO';
import APIController from '../../../shared/modules/API/APIController';


describe('APIController', () => {

    it('test try_translate_vo_to_api', () => {

        expect(APIController.getInstance().try_translate_vo_to_api(
            JSON.parse('{"_type":"notification","api_type_id":null,"notification_type":3,"read":true,"user_id":15,"auto_read_if_connected":true,"vos":[' +
                '{"_type":"apv_day_dr","var_id":14,"famille_crescendo_id_ranges":[{"range_type":1,"segment_type":0,"max":2,"max_inclusiv":false,"min":1,"min_inclusiv":true}]}' +
                ']}')
        )).to.deep.equal(
            JSON.parse('{"_type":"notification","api_type_id":null,"notification_type":3,"read":true,"user_id":15,"auto_read_if_connected":true,"vos":[' +
                '{"_type":"apv_day_dr","var_id":14,"famille_crescendo_id_ranges":[{"range_type":1,"segment_type":0,"max":2,"max_inclusiv":false,"min":1,"min_inclusiv":true}]}' +
                ']}')
        );

        expect(APIController.getInstance().try_translate_vo_to_api(
            JSON.parse('{"_type":"notification","api_type_id":null,"notification_type":3,"read":true,"user_id":15,"auto_read_if_connected":true,' +
                '"vos":[{"_type":"apv_day_dr","var_id":14,"famille_crescendo_id_ranges":[{"range_type":1,"segment_type":0,"max":2,"max_inclusiv":false,"min":1,"min_inclusiv":true}],' +
                '"gamme_id_ranges":[{"range_type":1,"segment_type":0,"max":2,"max_inclusiv":false,"min":1,"min_inclusiv":true},{"range_type":1,"segment_type":0,"max":3,"max_inclusiv":false,"min":2,"min_inclusiv":true}],' +
                '"pdv_id_ranges":[{"range_type":1,"segment_type":0,"max":17,"max_inclusiv":false,"min":16,"min_inclusiv":true}],' +
                '"ligne_de_facture_id_ranges":[{"range_type":1,"segment_type":0,"max":2,"max_inclusiv":false,"min":1,"min_inclusiv":true}],' +
                '"service_id_ranges":[{"range_type":1,"segment_type":0,"max":2,"max_inclusiv":false,"min":1,"min_inclusiv":true}],' +
                '"type_de_facturation_id_ranges":[{"range_type":1,"segment_type":0,"max":2,"max_inclusiv":false,"min":1,"min_inclusiv":true}],' +
                '"ts_ranges":[{"range_type":2,"segment_type":8,"max":"2020-08-01T00:00:00.000Z","max_inclusiv":false,"min":"2020-07-01T00:00:00.000Z","min_inclusiv":true}],' +
                '"id":5047,"value":0,"value_type":1,"value_ts":"2020-07-15T17:14:55.000Z","missing_datas_infos":null}]}')
        )).to.deep.equal(
            JSON.parse('{"_type":"notification","api_type_id":null,"notification_type":3,"read":true,"user_id":15,"auto_read_if_connected":true,' +
                '"vos":[{"_type":"apv_day_dr","var_id":14,"famille_crescendo_id_ranges":[{"range_type":1,"segment_type":0,"max":2,"max_inclusiv":false,"min":1,"min_inclusiv":true}],' +
                '"gamme_id_ranges":[{"range_type":1,"segment_type":0,"max":2,"max_inclusiv":false,"min":1,"min_inclusiv":true},{"range_type":1,"segment_type":0,"max":3,"max_inclusiv":false,"min":2,"min_inclusiv":true}],' +
                '"pdv_id_ranges":[{"range_type":1,"segment_type":0,"max":17,"max_inclusiv":false,"min":16,"min_inclusiv":true}],' +
                '"ligne_de_facture_id_ranges":[{"range_type":1,"segment_type":0,"max":2,"max_inclusiv":false,"min":1,"min_inclusiv":true}],' +
                '"service_id_ranges":[{"range_type":1,"segment_type":0,"max":2,"max_inclusiv":false,"min":1,"min_inclusiv":true}],' +
                '"type_de_facturation_id_ranges":[{"range_type":1,"segment_type":0,"max":2,"max_inclusiv":false,"min":1,"min_inclusiv":true}],' +
                '"ts_ranges":[{"range_type":2,"segment_type":8,"max":"2020-08-01T00:00:00.000Z","max_inclusiv":false,"min":"2020-07-01T00:00:00.000Z","min_inclusiv":true}],' +
                '"id":5047,"value":0,"value_type":1,"value_ts":"2020-07-15T17:14:55.000Z","missing_datas_infos":null}]}')
        );

    });
});