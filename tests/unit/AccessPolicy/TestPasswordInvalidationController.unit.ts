import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { expect, test } from '@playwright/test';
import PasswordInvalidationController from '../../../src/server/modules/AccessPolicy/workers/PasswordInvalidation/PasswordInvalidationController';
import UserVO from '../../../src/shared/modules/AccessPolicy/vos/UserVO';

import Dates from '../../../src/shared/modules/FormatDatesNombres/Dates/Dates';
import TimeSegment from '../../../src/shared/modules/DataRender/vos/TimeSegment';

test('TestPasswordInvalidationController. test get_users_to_remind_and_invalidate', () => {

    let reminder1_days: number = 20;
    let reminder2_days: number = 5;
    let invalid_days: number = 90;

    let creation_date = Dates.now();

    let user_toinvalidate: UserVO = {
        _type: UserVO.API_TYPE_ID,
        firstname: 'firstname',
        lastname: 'lastname',
        email: 'maila',
        id: 1,
        invalidated: false,
        lang_id: 1,
        name: 'toinvalid-namea',
        password: 'pwda',
        password_change_date: Dates.add(Dates.now(), -(invalid_days + 1), TimeSegment.TYPE_DAY),
        phone: 'phone',
        recovery_challenge: null,
        recovery_expiration: null,
        reminded_pwd_1: false,
        reminded_pwd_2: false,
        blocked: false,
        logged_once: false,
        creation_date: creation_date,
        archived: false,
    };

    let user_invalidated: UserVO = {
        _type: UserVO.API_TYPE_ID,
        firstname: 'firstname',
        lastname: 'lastname',
        email: 'mailb',
        id: 2,
        invalidated: true,
        lang_id: 1,
        name: 'invalidated-nameb',
        password: 'pwdb',
        password_change_date: Dates.add(Dates.now(), -(invalid_days + 1), TimeSegment.TYPE_DAY),
        phone: 'phone',
        recovery_challenge: null,
        recovery_expiration: null,
        reminded_pwd_1: true,
        reminded_pwd_2: true,
        blocked: false,
        logged_once: false,
        creation_date: creation_date,
        archived: false,
    };

    let user_toremind1: UserVO = {
        _type: UserVO.API_TYPE_ID,
        firstname: 'firstname',
        lastname: 'lastname',
        email: 'mailc',
        id: 3,
        invalidated: false,
        lang_id: 1,
        name: 'toremind1-namec',
        password: 'pwdc',
        password_change_date: Dates.add(Dates.now(), -(invalid_days - reminder1_days + 1), TimeSegment.TYPE_DAY),
        phone: 'phone',
        recovery_challenge: null,
        recovery_expiration: null,
        reminded_pwd_1: false,
        reminded_pwd_2: false,
        blocked: false,
        logged_once: false,
        creation_date: creation_date,
        archived: false,
    };

    let user_reminded1: UserVO = {
        _type: UserVO.API_TYPE_ID,
        firstname: 'firstname',
        lastname: 'lastname',
        email: 'maild',
        id: 4,
        invalidated: false,
        lang_id: 1,
        name: 'reminded1-named',
        password: 'pwdd',
        password_change_date: Dates.add(Dates.now(), -(invalid_days - reminder1_days + 1), TimeSegment.TYPE_DAY),
        phone: 'phone',
        recovery_challenge: null,
        recovery_expiration: null,
        reminded_pwd_1: true,
        reminded_pwd_2: false,
        blocked: false,
        logged_once: false,
        creation_date: creation_date,
        archived: false,
    };

    let user_toremind2: UserVO = {
        _type: UserVO.API_TYPE_ID,
        firstname: 'firstname',
        lastname: 'lastname',
        email: 'maile',
        id: 5,
        invalidated: false,
        lang_id: 1,
        name: 'toremind2-namee',
        password: 'pwde',
        password_change_date: Dates.add(Dates.now(), -(invalid_days - reminder2_days + 1), TimeSegment.TYPE_DAY),
        phone: 'phone',
        recovery_challenge: null,
        recovery_expiration: null,
        reminded_pwd_1: true,
        reminded_pwd_2: false,
        blocked: false,
        logged_once: false,
        creation_date: creation_date,
        archived: false,
    };

    let user_toremind1_before_2: UserVO = {
        _type: UserVO.API_TYPE_ID,
        firstname: 'firstname',
        lastname: 'lastname',
        email: 'maile',
        id: 51,
        invalidated: false,
        lang_id: 1,
        name: 'toremind2b1-namee2',
        password: 'pwde2',
        password_change_date: Dates.add(Dates.now(), -(invalid_days - reminder2_days + 1), TimeSegment.TYPE_DAY),
        phone: 'phone',
        recovery_challenge: null,
        recovery_expiration: null,
        reminded_pwd_1: false,
        reminded_pwd_2: false,
        blocked: false,
        logged_once: false,
        creation_date: creation_date,
        archived: false,
    };

    let user_reminded2: UserVO = {
        _type: UserVO.API_TYPE_ID,
        firstname: 'firstname',
        lastname: 'lastname',
        email: 'mailf',
        id: 6,
        invalidated: false,
        lang_id: 1,
        name: 'reminded2-namef',
        password: 'pwdf',
        password_change_date: Dates.add(Dates.now(), -(invalid_days - reminder2_days + 1), TimeSegment.TYPE_DAY),
        phone: 'phone',
        recovery_challenge: null,
        recovery_expiration: null,
        reminded_pwd_1: true,
        reminded_pwd_2: true,
        blocked: false,
        logged_once: false,
        creation_date: creation_date,
        archived: false,
    };

    let user_nothingtodo: UserVO = {
        _type: UserVO.API_TYPE_ID,
        firstname: 'firstname',
        lastname: 'lastname',
        email: 'mailz',
        id: 66,
        invalidated: false,
        lang_id: 1,
        name: 'reminded2-namez',
        password: 'pwdz',
        password_change_date: Dates.add(Dates.now(), -1, TimeSegment.TYPE_DAY),
        phone: 'phone',
        recovery_challenge: null,
        recovery_expiration: null,
        reminded_pwd_1: false,
        reminded_pwd_2: false,
        blocked: false,
        logged_once: false,
        creation_date: creation_date,
        archived: false,
    };



    let user_toinvalidate_blocked: UserVO = {
        _type: UserVO.API_TYPE_ID,
        firstname: 'firstname',
        lastname: 'lastname',
        email: 'maila',
        id: 1,
        invalidated: false,
        lang_id: 1,
        name: 'toinvalid-namea',
        password: 'pwda',
        password_change_date: Dates.add(Dates.now(), -(invalid_days + 1), TimeSegment.TYPE_DAY),
        phone: 'phone',
        recovery_challenge: null,
        recovery_expiration: null,
        reminded_pwd_1: false,
        reminded_pwd_2: false,
        blocked: true,
        logged_once: false,
        creation_date: creation_date,
        archived: false,
    };

    let user_invalidated_blocked: UserVO = {
        _type: UserVO.API_TYPE_ID,
        firstname: 'firstname',
        lastname: 'lastname',
        email: 'mailb',
        id: 2,
        invalidated: true,
        lang_id: 1,
        name: 'invalidated-nameb',
        password: 'pwdb',
        password_change_date: Dates.add(Dates.now(), -(invalid_days + 1), TimeSegment.TYPE_DAY),
        phone: 'phone',
        recovery_challenge: null,
        recovery_expiration: null,
        reminded_pwd_1: true,
        reminded_pwd_2: true,
        blocked: true,
        logged_once: false,
        creation_date: creation_date,
        archived: false,
    };

    let user_toremind1_blocked: UserVO = {
        _type: UserVO.API_TYPE_ID,
        firstname: 'firstname',
        lastname: 'lastname',
        email: 'mailc',
        id: 3,
        invalidated: false,
        lang_id: 1,
        name: 'toremind1-namec',
        password: 'pwdc',
        password_change_date: Dates.add(Dates.now(), -(invalid_days - reminder1_days + 1), TimeSegment.TYPE_DAY),
        phone: 'phone',
        recovery_challenge: null,
        recovery_expiration: null,
        reminded_pwd_1: false,
        reminded_pwd_2: false,
        blocked: true,
        logged_once: false,
        creation_date: creation_date,
        archived: false,
    };

    let user_reminded1_blocked: UserVO = {
        _type: UserVO.API_TYPE_ID,
        firstname: 'firstname',
        lastname: 'lastname',
        email: 'maild',
        id: 4,
        invalidated: false,
        lang_id: 1,
        name: 'reminded1-named',
        password: 'pwdd',
        password_change_date: Dates.add(Dates.now(), -(invalid_days - reminder1_days + 1), TimeSegment.TYPE_DAY),
        phone: 'phone',
        recovery_challenge: null,
        recovery_expiration: null,
        reminded_pwd_1: true,
        reminded_pwd_2: false,
        blocked: true,
        logged_once: false,
        creation_date: creation_date,
        archived: false,
    };

    let user_toremind2_blocked: UserVO = {
        _type: UserVO.API_TYPE_ID,
        firstname: 'firstname',
        lastname: 'lastname',
        email: 'maile',
        id: 5,
        invalidated: false,
        lang_id: 1,
        name: 'toremind2-namee',
        password: 'pwde',
        password_change_date: Dates.add(Dates.now(), -(invalid_days - reminder2_days + 1), TimeSegment.TYPE_DAY),
        phone: 'phone',
        recovery_challenge: null,
        recovery_expiration: null,
        reminded_pwd_1: true,
        reminded_pwd_2: false,
        blocked: true,
        logged_once: false,
        creation_date: creation_date,
        archived: false,
    };

    let user_toremind1_before_2_blocked: UserVO = {
        _type: UserVO.API_TYPE_ID,
        firstname: 'firstname',
        lastname: 'lastname',
        email: 'maile',
        id: 51,
        invalidated: false,
        lang_id: 1,
        name: 'toremind2b1-namee2',
        password: 'pwde2',
        password_change_date: Dates.add(Dates.now(), -(invalid_days - reminder2_days + 1), TimeSegment.TYPE_DAY),
        phone: 'phone',
        recovery_challenge: null,
        recovery_expiration: null,
        reminded_pwd_1: false,
        reminded_pwd_2: false,
        blocked: true,
        logged_once: false,
        creation_date: creation_date,
        archived: false,
    };

    let user_reminded2_blocked: UserVO = {
        _type: UserVO.API_TYPE_ID,
        firstname: 'firstname',
        lastname: 'lastname',
        email: 'mailf',
        id: 6,
        invalidated: false,
        lang_id: 1,
        name: 'reminded2-namef',
        password: 'pwdf',
        password_change_date: Dates.add(Dates.now(), -(invalid_days - reminder2_days + 1), TimeSegment.TYPE_DAY),
        phone: 'phone',
        recovery_challenge: null,
        recovery_expiration: null,
        reminded_pwd_1: true,
        reminded_pwd_2: true,
        blocked: true,
        logged_once: false,
        creation_date: creation_date,
        archived: false,
    };

    let user_nothingtodo_blocked: UserVO = {
        _type: UserVO.API_TYPE_ID,
        firstname: 'firstname',
        lastname: 'lastname',
        email: 'mailz',
        id: 66,
        invalidated: false,
        lang_id: 1,
        name: 'reminded2-namez',
        password: 'pwdz',
        password_change_date: Dates.add(Dates.now(), -1, TimeSegment.TYPE_DAY),
        phone: 'phone',
        recovery_challenge: null,
        recovery_expiration: null,
        reminded_pwd_1: false,
        reminded_pwd_2: false,
        blocked: true,
        logged_once: false,
        creation_date: creation_date,
        archived: false,
    };



    let users: UserVO[] = [
        user_invalidated,
        user_reminded1,
        user_reminded2,
        user_toinvalidate,
        user_toremind1,
        user_toremind1_before_2,
        user_toremind2,
        user_nothingtodo,

        user_invalidated_blocked,
        user_reminded1_blocked,
        user_reminded2_blocked,
        user_toinvalidate_blocked,
        user_toremind1_blocked,
        user_toremind1_before_2_blocked,
        user_toremind2_blocked,
        user_nothingtodo_blocked
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

    expect(users_to_remind_1).toStrictEqual([
        user_toremind1
    ]);

    expect(users_to_remind_2).toStrictEqual([
        user_toremind1_before_2,
        user_toremind2
    ]);

    expect(users_to_invalidate).toStrictEqual([
        user_toinvalidate
    ]);
});