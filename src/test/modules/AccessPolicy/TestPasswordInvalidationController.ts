import { expect, assert } from 'chai';
import 'mocha';
import PasswordInvalidationController from '../../../server/modules/AccessPolicy/workers/PasswordInvalidation/PasswordInvalidationController';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';

import moment = require('moment');
import DateHandler from '../../../shared/tools/DateHandler';

describe('TestPasswordInvalidationController', () => {

    it('test get_users_to_remind_and_invalidate', () => {

        let reminder1_days: number = 20;
        let reminder2_days: number = 5;
        let invalid_days: number = 90;

        let user_toinvalidate: UserVO = {
            _type: UserVO.API_TYPE_ID,
            email: 'maila',
            id: 1,
            invalidated: false,
            lang_id: 1,
            name: 'toinvalid-namea',
            password: 'pwda',
            password_change_date: DateHandler.getInstance().formatDayForIndex(moment().utc(true).add(-(invalid_days + 1), 'days')),
            phone: 'phone',
            recovery_challenge: null,
            recovery_expiration: null,
            reminded_pwd_1: false,
            reminded_pwd_2: false
        };

        let user_invalidated: UserVO = {
            _type: UserVO.API_TYPE_ID,
            email: 'mailb',
            id: 2,
            invalidated: true,
            lang_id: 1,
            name: 'invalidated-nameb',
            password: 'pwdb',
            password_change_date: DateHandler.getInstance().formatDayForIndex(moment().utc(true).add(-(invalid_days + 1), 'days')),
            phone: 'phone',
            recovery_challenge: null,
            recovery_expiration: null,
            reminded_pwd_1: true,
            reminded_pwd_2: true
        };

        let user_toremind1: UserVO = {
            _type: UserVO.API_TYPE_ID,
            email: 'mailc',
            id: 3,
            invalidated: false,
            lang_id: 1,
            name: 'toremind1-namec',
            password: 'pwdc',
            password_change_date: DateHandler.getInstance().formatDayForIndex(moment().utc(true).add(-(invalid_days - reminder1_days + 1), 'days')),
            phone: 'phone',
            recovery_challenge: null,
            recovery_expiration: null,
            reminded_pwd_1: false,
            reminded_pwd_2: false
        };

        let user_reminded1: UserVO = {
            _type: UserVO.API_TYPE_ID,
            email: 'maild',
            id: 4,
            invalidated: false,
            lang_id: 1,
            name: 'reminded1-named',
            password: 'pwdd',
            password_change_date: DateHandler.getInstance().formatDayForIndex(moment().utc(true).add(-(invalid_days - reminder1_days + 1), 'days')),
            phone: 'phone',
            recovery_challenge: null,
            recovery_expiration: null,
            reminded_pwd_1: true,
            reminded_pwd_2: false
        };

        let user_toremind2: UserVO = {
            _type: UserVO.API_TYPE_ID,
            email: 'maile',
            id: 5,
            invalidated: false,
            lang_id: 1,
            name: 'toremind2-namee',
            password: 'pwde',
            password_change_date: DateHandler.getInstance().formatDayForIndex(moment().utc(true).add(-(invalid_days - reminder2_days + 1), 'days')),
            phone: 'phone',
            recovery_challenge: null,
            recovery_expiration: null,
            reminded_pwd_1: true,
            reminded_pwd_2: false
        };

        let user_toremind1_before_2: UserVO = {
            _type: UserVO.API_TYPE_ID,
            email: 'maile',
            id: 51,
            invalidated: false,
            lang_id: 1,
            name: 'toremind2b1-namee2',
            password: 'pwde2',
            password_change_date: DateHandler.getInstance().formatDayForIndex(moment().utc(true).add(-(invalid_days - reminder2_days + 1), 'days')),
            phone: 'phone',
            recovery_challenge: null,
            recovery_expiration: null,
            reminded_pwd_1: false,
            reminded_pwd_2: false
        };

        let user_reminded2: UserVO = {
            _type: UserVO.API_TYPE_ID,
            email: 'mailf',
            id: 6,
            invalidated: false,
            lang_id: 1,
            name: 'reminded2-namef',
            password: 'pwdf',
            password_change_date: DateHandler.getInstance().formatDayForIndex(moment().utc(true).add(-(invalid_days - reminder2_days + 1), 'days')),
            phone: 'phone',
            recovery_challenge: null,
            recovery_expiration: null,
            reminded_pwd_1: true,
            reminded_pwd_2: true
        };

        let user_nothingtodo: UserVO = {
            _type: UserVO.API_TYPE_ID,
            email: 'mailz',
            id: 66,
            invalidated: false,
            lang_id: 1,
            name: 'reminded2-namez',
            password: 'pwdz',
            password_change_date: DateHandler.getInstance().formatDayForIndex(moment().utc(true).add(-1, 'days')),
            phone: 'phone',
            recovery_challenge: null,
            recovery_expiration: null,
            reminded_pwd_1: false,
            reminded_pwd_2: false
        };

        let users: UserVO[] = [
            user_invalidated,
            user_reminded1,
            user_reminded2,
            user_toinvalidate,
            user_toremind1,
            user_toremind1_before_2,
            user_toremind2,
            user_nothingtodo
        ];

        let users_to_remind_1: UserVO[] = [];
        let users_to_remind_2: UserVO[] = [];
        let users_to_invalidate: UserVO[] = [];

        PasswordInvalidationController.getInstance().get_users_to_remind_and_invalidate(
            users,
            reminder1_days,
            reminder2_days,
            invalid_days,
            users_to_remind_1,
            users_to_remind_2,
            users_to_invalidate
        );

        expect(users_to_remind_1).to.deep.equal([
            user_toremind1
        ]);

        expect(users_to_remind_2).to.deep.equal([
            user_toremind1_before_2,
            user_toremind2
        ]);

        expect(users_to_invalidate).to.deep.equal([
            user_toinvalidate
        ]);
    });
});