import { test, expect } from "playwright-test-coverage";

import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';

import AccessPolicyServerController from '../../../src/server/modules/AccessPolicy/AccessPolicyServerController';
import DAOServerController from '../../../src/server/modules/DAO/DAOServerController';
import AccessPolicyGroupVO from '../../../src/shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../src/shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../src/shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import RolePolicyVO from '../../../src/shared/modules/AccessPolicy/vos/RolePolicyVO';
import RoleVO from '../../../src/shared/modules/AccessPolicy/vos/RoleVO';
import ConsoleHandler from '../../../src/shared/tools/ConsoleHandler';

APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();
ConsoleHandler.init();

test('AccessPolicyServer: test check access - denied by default to all but admin', () => {
    APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

    AccessPolicyServerController.role_anonymous = new RoleVO();
    AccessPolicyServerController.role_anonymous.parent_role_id = null;
    AccessPolicyServerController.role_anonymous.id = 1;
    AccessPolicyServerController.role_anonymous.translatable_name = 'role_anonymous';

    AccessPolicyServerController.role_logged = new RoleVO();
    AccessPolicyServerController.role_logged.parent_role_id = AccessPolicyServerController.role_anonymous.id;
    AccessPolicyServerController.role_logged.id = 2;
    AccessPolicyServerController.role_logged.translatable_name = 'role_logged';

    AccessPolicyServerController.role_admin = new RoleVO();
    AccessPolicyServerController.role_admin.parent_role_id = AccessPolicyServerController.role_logged.id;
    AccessPolicyServerController.role_admin.id = 3;
    AccessPolicyServerController.role_admin.translatable_name = 'role_admin';

    let all_roles: { [role_id: number]: RoleVO } = {
        1: AccessPolicyServerController.role_anonymous,
        2: AccessPolicyServerController.role_logged,
        3: AccessPolicyServerController.role_admin
    };

    expect(AccessPolicyServerController.checkAccessTo(
        null,
        null,
        null,
        null,
        null,
        null
    )).toStrictEqual(false);

    expect(AccessPolicyServerController.checkAccessTo(
        new AccessPolicyVO(),
        null,
        all_roles,
        null,
        null,
        null
    )).toStrictEqual(false);

    expect(AccessPolicyServerController.checkAccessTo(
        new AccessPolicyVO(),
        {},
        all_roles,
        {},
        {},
        {}
    )).toStrictEqual(false);

    let policy: AccessPolicyVO = new AccessPolicyVO();
    policy.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
    policy.translatable_name = 'test';
    policy.id = 1;
    let policies: { [policy_id: number]: AccessPolicyVO } = {
        1: policy
    };
    expect(AccessPolicyServerController.checkAccessTo(
        policy,
        null,
        all_roles,
        null,
        policies,
        null
    )).toStrictEqual(false);

    expect(AccessPolicyServerController.checkAccessTo(
        policy,
        null,
        all_roles,
        null,
        policies,
        null
    )).toStrictEqual(false);

    expect(AccessPolicyServerController.checkAccessTo(
        policy,
        { [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous },
        all_roles,
        null,
        policies,
        null
    )).toStrictEqual(false);

    expect(AccessPolicyServerController.checkAccessTo(
        policy,
        { [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged },
        all_roles,
        null,
        policies,
        null
    )).toStrictEqual(false);

    expect(AccessPolicyServerController.checkAccessTo(
        policy,
        { [AccessPolicyServerController.role_admin.id]: AccessPolicyServerController.role_admin },
        all_roles,
        null,
        policies,
        null
    )).toStrictEqual(true);
});

test('AccessPolicyServer: test check access - role inherit : denied by default to all but admin', () => {
    APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

    AccessPolicyServerController.role_anonymous = new RoleVO();
    AccessPolicyServerController.role_anonymous.parent_role_id = null;
    AccessPolicyServerController.role_anonymous.id = 1;
    AccessPolicyServerController.role_anonymous.translatable_name = 'role_anonymous';

    AccessPolicyServerController.role_logged = new RoleVO();
    AccessPolicyServerController.role_logged.parent_role_id = AccessPolicyServerController.role_anonymous.id;
    AccessPolicyServerController.role_logged.id = 2;
    AccessPolicyServerController.role_logged.translatable_name = 'role_logged';

    AccessPolicyServerController.role_admin = new RoleVO();
    AccessPolicyServerController.role_admin.parent_role_id = AccessPolicyServerController.role_logged.id;
    AccessPolicyServerController.role_admin.id = 3;
    AccessPolicyServerController.role_admin.translatable_name = 'role_admin';

    let all_roles: { [role_id: number]: RoleVO } = {
        1: AccessPolicyServerController.role_anonymous,
        2: AccessPolicyServerController.role_logged,
        3: AccessPolicyServerController.role_admin
    };



    let policy: AccessPolicyVO = new AccessPolicyVO();
    policy.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
    policy.translatable_name = 'test';
    policy.id = 1;
    let policies: { [policy_id: number]: AccessPolicyVO } = {
        1: policy
    };

    let new_role: RoleVO = new RoleVO();
    new_role.parent_role_id = AccessPolicyServerController.role_logged.id;
    new_role.translatable_name = 'new_role';
    new_role.id = 1001;

    all_roles[new_role.id] = new_role;
    expect(AccessPolicyServerController.checkAccessTo(
        policy,
        { [new_role.id]: new_role },
        all_roles,
        null,
        policies,
        null
    )).toStrictEqual(false);

    expect(AccessPolicyServerController.checkAccessTo(
        policy,
        {
            [new_role.id]: new_role,
            [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous
        },
        all_roles,
        null,
        policies,
        null
    )).toStrictEqual(false);

    expect(AccessPolicyServerController.checkAccessTo(
        policy,
        {
            [new_role.id]: new_role,
            [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged
        },
        all_roles,
        null,
        policies,
        null
    )).toStrictEqual(false);

    expect(AccessPolicyServerController.checkAccessTo(
        policy,
        {
            [new_role.id]: new_role,
            [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged,
            [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous
        },
        all_roles,
        null,
        policies,
        null
    )).toStrictEqual(false);

    expect(AccessPolicyServerController.checkAccessTo(
        policy,
        {
            [new_role.id]: new_role,
            [AccessPolicyServerController.role_admin.id]: AccessPolicyServerController.role_admin
        },
        all_roles,
        null,
        policies,
        null
    )).toStrictEqual(true);

    expect(AccessPolicyServerController.checkAccessTo(
        policy,
        {
            [AccessPolicyServerController.role_admin.id]: AccessPolicyServerController.role_admin,
            [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged,
            [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous
        },
        all_roles,
        null,
        policies,
        null
    )).toStrictEqual(true);
    delete all_roles[new_role.id];
});

test('AccessPolicyServer: test check access - inheritance test (ignore explicit policies) - no rp', () => {
    APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

    AccessPolicyServerController.role_anonymous = new RoleVO();
    AccessPolicyServerController.role_anonymous.parent_role_id = null;
    AccessPolicyServerController.role_anonymous.id = 1;
    AccessPolicyServerController.role_anonymous.translatable_name = 'role_anonymous';

    AccessPolicyServerController.role_logged = new RoleVO();
    AccessPolicyServerController.role_logged.parent_role_id = AccessPolicyServerController.role_anonymous.id;
    AccessPolicyServerController.role_logged.id = 2;
    AccessPolicyServerController.role_logged.translatable_name = 'role_logged';

    AccessPolicyServerController.role_admin = new RoleVO();
    AccessPolicyServerController.role_admin.parent_role_id = AccessPolicyServerController.role_logged.id;
    AccessPolicyServerController.role_admin.id = 3;
    AccessPolicyServerController.role_admin.translatable_name = 'role_admin';

    let all_roles: { [role_id: number]: RoleVO } = {
        1: AccessPolicyServerController.role_anonymous,
        2: AccessPolicyServerController.role_logged,
        3: AccessPolicyServerController.role_admin
    };



    let policyA: AccessPolicyVO = new AccessPolicyVO();
    policyA.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
    policyA.translatable_name = 'test';
    policyA.id = 1;
    let policies: { [policy_id: number]: AccessPolicyVO } = {
        1: policyA
    };

    let new_role: RoleVO = new RoleVO();
    new_role.parent_role_id = AccessPolicyServerController.role_logged.id;
    new_role.translatable_name = 'new_role';
    new_role.id = 1001;

    all_roles[new_role.id] = new_role;

    expect(AccessPolicyServerController.checkAccessTo(
        policyA,
        { [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous },
        all_roles,
        null,
        policies,
        null,
        AccessPolicyServerController.role_anonymous
    )).toStrictEqual(false);

    expect(AccessPolicyServerController.checkAccessTo(
        policyA,
        { [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged },
        all_roles,
        null,
        policies,
        null,
        AccessPolicyServerController.role_logged
    )).toStrictEqual(false);

    expect(AccessPolicyServerController.checkAccessTo(
        policyA,
        { [new_role.id]: new_role },
        all_roles,
        null,
        policies,
        null,
        new_role
    )).toStrictEqual(false);

    expect(AccessPolicyServerController.checkAccessTo(
        policyA,
        { [AccessPolicyServerController.role_admin.id]: AccessPolicyServerController.role_admin },
        all_roles,
        null,
        policies,
        null,
        AccessPolicyServerController.role_admin
    )).toStrictEqual(true);

    delete all_roles[new_role.id];
});

test('AccessPolicyServer: test check access - inheritance test (ignore explicit policies) - rp anon', () => {
    APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

    AccessPolicyServerController.role_anonymous = new RoleVO();
    AccessPolicyServerController.role_anonymous.parent_role_id = null;
    AccessPolicyServerController.role_anonymous.id = 1;
    AccessPolicyServerController.role_anonymous.translatable_name = 'role_anonymous';

    AccessPolicyServerController.role_logged = new RoleVO();
    AccessPolicyServerController.role_logged.parent_role_id = AccessPolicyServerController.role_anonymous.id;
    AccessPolicyServerController.role_logged.id = 2;
    AccessPolicyServerController.role_logged.translatable_name = 'role_logged';

    AccessPolicyServerController.role_admin = new RoleVO();
    AccessPolicyServerController.role_admin.parent_role_id = AccessPolicyServerController.role_logged.id;
    AccessPolicyServerController.role_admin.id = 3;
    AccessPolicyServerController.role_admin.translatable_name = 'role_admin';

    let all_roles: { [role_id: number]: RoleVO } = {
        1: AccessPolicyServerController.role_anonymous,
        2: AccessPolicyServerController.role_logged,
        3: AccessPolicyServerController.role_admin
    };



    let policyA: AccessPolicyVO = new AccessPolicyVO();
    policyA.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
    policyA.translatable_name = 'test';
    policyA.id = 1;
    let policies: { [policy_id: number]: AccessPolicyVO } = {
        1: policyA
    };

    let new_role: RoleVO = new RoleVO();
    new_role.parent_role_id = AccessPolicyServerController.role_logged.id;
    new_role.translatable_name = 'new_role';
    new_role.id = 1001;

    all_roles[new_role.id] = new_role;

    let role_policyA: RolePolicyVO = new RolePolicyVO();
    role_policyA.id = 1;
    role_policyA.accpol_id = policyA.id;
    role_policyA.role_id = AccessPolicyServerController.role_anonymous.id;
    role_policyA.granted = true;

    let role_policies: { [role_id: number]: { [pol_id: number]: RolePolicyVO } } = {
        [AccessPolicyServerController.role_anonymous.id]: {
            [policyA.id]: role_policyA
        }
    };

    expect(AccessPolicyServerController.checkAccessTo(
        policyA,
        { [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous },
        all_roles,
        role_policies,
        policies,
        null,
        AccessPolicyServerController.role_anonymous
    )).toStrictEqual(false);

    expect(AccessPolicyServerController.checkAccessTo(
        policyA,
        { [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged },
        all_roles,
        role_policies,
        policies,
        null,
        AccessPolicyServerController.role_logged
    )).toStrictEqual(true);

    expect(AccessPolicyServerController.checkAccessTo(
        policyA,
        {
            [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous,
            [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged
        },
        all_roles,
        role_policies,
        policies,
        null,
        AccessPolicyServerController.role_logged
    )).toStrictEqual(true);


    expect(AccessPolicyServerController.checkAccessTo(
        policyA,
        { [new_role.id]: new_role },
        all_roles,
        role_policies,
        policies,
        null,
        new_role
    )).toStrictEqual(true);

    expect(AccessPolicyServerController.checkAccessTo(
        policyA,
        {
            [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous,
            [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged,
            [new_role.id]: new_role
        },
        all_roles,
        role_policies,
        policies,
        null,
        new_role
    )).toStrictEqual(true);

    expect(AccessPolicyServerController.checkAccessTo(
        policyA,
        { [AccessPolicyServerController.role_admin.id]: AccessPolicyServerController.role_admin },
        all_roles,
        role_policies,
        policies,
        null,
        AccessPolicyServerController.role_admin
    )).toStrictEqual(true);

    expect(AccessPolicyServerController.checkAccessTo(
        policyA,
        {
            [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous,
            [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged,
            [AccessPolicyServerController.role_admin.id]: AccessPolicyServerController.role_admin
        },
        all_roles,
        role_policies,
        policies,
        null,
        AccessPolicyServerController.role_admin
    )).toStrictEqual(true);

    delete all_roles[new_role.id];
});

test('AccessPolicyServer: test check access - inheritance test (ignore explicit policies) - rp logged', () => {
    APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

    AccessPolicyServerController.role_anonymous = new RoleVO();
    AccessPolicyServerController.role_anonymous.parent_role_id = null;
    AccessPolicyServerController.role_anonymous.id = 1;
    AccessPolicyServerController.role_anonymous.translatable_name = 'role_anonymous';

    AccessPolicyServerController.role_logged = new RoleVO();
    AccessPolicyServerController.role_logged.parent_role_id = AccessPolicyServerController.role_anonymous.id;
    AccessPolicyServerController.role_logged.id = 2;
    AccessPolicyServerController.role_logged.translatable_name = 'role_logged';

    AccessPolicyServerController.role_admin = new RoleVO();
    AccessPolicyServerController.role_admin.parent_role_id = AccessPolicyServerController.role_logged.id;
    AccessPolicyServerController.role_admin.id = 3;
    AccessPolicyServerController.role_admin.translatable_name = 'role_admin';

    let all_roles: { [role_id: number]: RoleVO } = {
        1: AccessPolicyServerController.role_anonymous,
        2: AccessPolicyServerController.role_logged,
        3: AccessPolicyServerController.role_admin
    };



    let policyA: AccessPolicyVO = new AccessPolicyVO();
    policyA.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
    policyA.translatable_name = 'test';
    policyA.id = 1;
    let policies: { [policy_id: number]: AccessPolicyVO } = {
        1: policyA
    };

    let new_role: RoleVO = new RoleVO();
    new_role.parent_role_id = AccessPolicyServerController.role_logged.id;
    new_role.translatable_name = 'new_role';
    new_role.id = 1001;

    all_roles[new_role.id] = new_role;

    let role_policyA: RolePolicyVO = new RolePolicyVO();
    role_policyA.id = 1;
    role_policyA.accpol_id = policyA.id;
    role_policyA.role_id = AccessPolicyServerController.role_logged.id;
    role_policyA.granted = true;

    let role_policies: { [role_id: number]: { [pol_id: number]: RolePolicyVO } } = {
        [AccessPolicyServerController.role_logged.id]: {
            [policyA.id]: role_policyA
        }
    };

    expect(AccessPolicyServerController.checkAccessTo(
        policyA,
        { [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous },
        all_roles,
        role_policies,
        policies,
        null,
        AccessPolicyServerController.role_anonymous
    )).toStrictEqual(false);

    expect(AccessPolicyServerController.checkAccessTo(
        policyA,
        { [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged },
        all_roles,
        role_policies,
        policies,
        null,
        AccessPolicyServerController.role_logged
    )).toStrictEqual(false);

    expect(AccessPolicyServerController.checkAccessTo(
        policyA,
        { [new_role.id]: new_role },
        all_roles,
        role_policies,
        policies,
        null,
        new_role
    )).toStrictEqual(true);

    expect(AccessPolicyServerController.checkAccessTo(
        policyA,
        { [AccessPolicyServerController.role_admin.id]: AccessPolicyServerController.role_admin },
        all_roles,
        role_policies,
        policies,
        null,
        AccessPolicyServerController.role_admin
    )).toStrictEqual(true);

    delete all_roles[new_role.id];
});

test('AccessPolicyServer: test check access - inheritance test (ignore explicit policies) - rp inherit logged', () => {
    APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

    AccessPolicyServerController.role_anonymous = new RoleVO();
    AccessPolicyServerController.role_anonymous.parent_role_id = null;
    AccessPolicyServerController.role_anonymous.id = 1;
    AccessPolicyServerController.role_anonymous.translatable_name = 'role_anonymous';

    AccessPolicyServerController.role_logged = new RoleVO();
    AccessPolicyServerController.role_logged.parent_role_id = AccessPolicyServerController.role_anonymous.id;
    AccessPolicyServerController.role_logged.id = 2;
    AccessPolicyServerController.role_logged.translatable_name = 'role_logged';

    AccessPolicyServerController.role_admin = new RoleVO();
    AccessPolicyServerController.role_admin.parent_role_id = AccessPolicyServerController.role_logged.id;
    AccessPolicyServerController.role_admin.id = 3;
    AccessPolicyServerController.role_admin.translatable_name = 'role_admin';

    let all_roles: { [role_id: number]: RoleVO } = {
        1: AccessPolicyServerController.role_anonymous,
        2: AccessPolicyServerController.role_logged,
        3: AccessPolicyServerController.role_admin
    };



    let policyA: AccessPolicyVO = new AccessPolicyVO();
    policyA.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
    policyA.translatable_name = 'test';
    policyA.id = 1;
    let policies: { [policy_id: number]: AccessPolicyVO } = {
        1: policyA
    };

    let new_role: RoleVO = new RoleVO();
    new_role.parent_role_id = AccessPolicyServerController.role_logged.id;
    new_role.translatable_name = 'new_role';
    new_role.id = 1001;

    all_roles[new_role.id] = new_role;

    let role_policyA: RolePolicyVO = new RolePolicyVO();
    role_policyA.id = 1;
    role_policyA.accpol_id = policyA.id;
    role_policyA.role_id = new_role.id;
    role_policyA.granted = true;

    let role_policies: { [role_id: number]: { [pol_id: number]: RolePolicyVO } } = {
        [new_role.id]: {
            [policyA.id]: role_policyA
        }
    };

    expect(AccessPolicyServerController.checkAccessTo(
        policyA,
        { [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous },
        all_roles,
        role_policies,
        policies,
        null,
        AccessPolicyServerController.role_anonymous
    )).toStrictEqual(false);

    expect(AccessPolicyServerController.checkAccessTo(
        policyA,
        { [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged },
        all_roles,
        role_policies,
        policies,
        null,
        AccessPolicyServerController.role_logged
    )).toStrictEqual(false);

    expect(AccessPolicyServerController.checkAccessTo(
        policyA,
        { [new_role.id]: new_role },
        all_roles,
        role_policies,
        policies,
        null,
        new_role
    )).toStrictEqual(false);

    expect(AccessPolicyServerController.checkAccessTo(
        policyA,
        { [AccessPolicyServerController.role_admin.id]: AccessPolicyServerController.role_admin },
        all_roles,
        role_policies,
        policies,
        null,
        AccessPolicyServerController.role_admin
    )).toStrictEqual(true);

    delete all_roles[new_role.id];
});

test('AccessPolicyServer: test check access - inheritance test (ignore explicit policies) - dp granted', () => {
    APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

    AccessPolicyServerController.role_anonymous = new RoleVO();
    AccessPolicyServerController.role_anonymous.parent_role_id = null;
    AccessPolicyServerController.role_anonymous.id = 1;
    AccessPolicyServerController.role_anonymous.translatable_name = 'role_anonymous';

    AccessPolicyServerController.role_logged = new RoleVO();
    AccessPolicyServerController.role_logged.parent_role_id = AccessPolicyServerController.role_anonymous.id;
    AccessPolicyServerController.role_logged.id = 2;
    AccessPolicyServerController.role_logged.translatable_name = 'role_logged';

    AccessPolicyServerController.role_admin = new RoleVO();
    AccessPolicyServerController.role_admin.parent_role_id = AccessPolicyServerController.role_logged.id;
    AccessPolicyServerController.role_admin.id = 3;
    AccessPolicyServerController.role_admin.translatable_name = 'role_admin';

    let all_roles: { [role_id: number]: RoleVO } = {
        1: AccessPolicyServerController.role_anonymous,
        2: AccessPolicyServerController.role_logged,
        3: AccessPolicyServerController.role_admin
    };



    let policyA: AccessPolicyVO = new AccessPolicyVO();
    policyA.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
    policyA.translatable_name = 'testA';
    policyA.id = 1;

    let policyB: AccessPolicyVO = new AccessPolicyVO();
    policyB.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ANONYMOUS;
    policyB.translatable_name = 'testB';
    policyB.id = 2;
    let policies: { [policy_id: number]: AccessPolicyVO } = {
        1: policyA,
        2: policyB
    };

    let new_role: RoleVO = new RoleVO();
    new_role.parent_role_id = AccessPolicyServerController.role_logged.id;
    new_role.translatable_name = 'new_role';
    new_role.id = 1001;

    all_roles[new_role.id] = new_role;

    let dependency: PolicyDependencyVO = new PolicyDependencyVO();
    dependency.id = 1;
    dependency.src_pol_id = policyA.id;
    dependency.depends_on_pol_id = policyB.id;
    dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED;
    let policies_dependencies: { [src_pol_id: number]: PolicyDependencyVO[] } = {
        [policyA.id]: [dependency]
    };

    expect(AccessPolicyServerController.checkAccessTo(
        policyA,
        { [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous },
        all_roles,
        null,
        policies,
        policies_dependencies,
        AccessPolicyServerController.role_anonymous
    )).toStrictEqual(false);

    expect(AccessPolicyServerController.checkAccessTo(
        policyA,
        { [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged },
        all_roles,
        null,
        policies,
        policies_dependencies,
        AccessPolicyServerController.role_logged
    )).toStrictEqual(true);

    expect(AccessPolicyServerController.checkAccessTo(
        policyA,
        { [new_role.id]: new_role },
        all_roles,
        null,
        policies,
        policies_dependencies,
        new_role
    )).toStrictEqual(true);

    expect(AccessPolicyServerController.checkAccessTo(
        policyA,
        { [AccessPolicyServerController.role_admin.id]: AccessPolicyServerController.role_admin },
        all_roles,
        null,
        policies,
        policies_dependencies,
        AccessPolicyServerController.role_admin
    )).toStrictEqual(true);

    delete all_roles[new_role.id];
});

test('AccessPolicyServer: test check access - inheritance test (ignore explicit policies) - dp denied', () => {
    APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

    AccessPolicyServerController.role_anonymous = new RoleVO();
    AccessPolicyServerController.role_anonymous.parent_role_id = null;
    AccessPolicyServerController.role_anonymous.id = 1;
    AccessPolicyServerController.role_anonymous.translatable_name = 'role_anonymous';

    AccessPolicyServerController.role_logged = new RoleVO();
    AccessPolicyServerController.role_logged.parent_role_id = AccessPolicyServerController.role_anonymous.id;
    AccessPolicyServerController.role_logged.id = 2;
    AccessPolicyServerController.role_logged.translatable_name = 'role_logged';

    AccessPolicyServerController.role_admin = new RoleVO();
    AccessPolicyServerController.role_admin.parent_role_id = AccessPolicyServerController.role_logged.id;
    AccessPolicyServerController.role_admin.id = 3;
    AccessPolicyServerController.role_admin.translatable_name = 'role_admin';

    let all_roles: { [role_id: number]: RoleVO } = {
        1: AccessPolicyServerController.role_anonymous,
        2: AccessPolicyServerController.role_logged,
        3: AccessPolicyServerController.role_admin
    };



    let policyA: AccessPolicyVO = new AccessPolicyVO();
    policyA.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
    policyA.translatable_name = 'testA';
    policyA.id = 1;

    let policyB: AccessPolicyVO = new AccessPolicyVO();
    policyB.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ANONYMOUS;
    policyB.translatable_name = 'testB';
    policyB.id = 2;
    let policies: { [policy_id: number]: AccessPolicyVO } = {
        1: policyA,
        2: policyB
    };

    let new_role: RoleVO = new RoleVO();
    new_role.parent_role_id = AccessPolicyServerController.role_logged.id;
    new_role.translatable_name = 'new_role';
    new_role.id = 1001;

    all_roles[new_role.id] = new_role;

    let dependency: PolicyDependencyVO = new PolicyDependencyVO();
    dependency.id = 1;
    dependency.src_pol_id = policyA.id;
    dependency.depends_on_pol_id = policyB.id;
    dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
    let policies_dependencies: { [src_pol_id: number]: PolicyDependencyVO[] } = {
        [policyA.id]: [dependency]
    };

    expect(AccessPolicyServerController.checkAccessTo(
        policyA,
        { [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous },
        all_roles,
        null,
        policies,
        policies_dependencies,
        AccessPolicyServerController.role_anonymous
    )).toStrictEqual(false);

    expect(AccessPolicyServerController.checkAccessTo(
        policyA,
        { [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged },
        all_roles,
        null,
        policies,
        policies_dependencies,
        AccessPolicyServerController.role_logged
    )).toStrictEqual(false);

    expect(AccessPolicyServerController.checkAccessTo(
        policyA,
        { [new_role.id]: new_role },
        all_roles,
        null,
        policies,
        policies_dependencies,
        new_role
    )).toStrictEqual(false);

    expect(AccessPolicyServerController.checkAccessTo(
        policyA,
        { [AccessPolicyServerController.role_admin.id]: AccessPolicyServerController.role_admin },
        all_roles,
        null,
        policies,
        policies_dependencies,
        AccessPolicyServerController.role_admin
    )).toStrictEqual(true);

    delete all_roles[new_role.id];
});

test('AccessPolicyServer: test check access - policy explicit configuration', () => {
    APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

    AccessPolicyServerController.role_anonymous = new RoleVO();
    AccessPolicyServerController.role_anonymous.parent_role_id = null;
    AccessPolicyServerController.role_anonymous.id = 1;
    AccessPolicyServerController.role_anonymous.translatable_name = 'role_anonymous';

    AccessPolicyServerController.role_logged = new RoleVO();
    AccessPolicyServerController.role_logged.parent_role_id = AccessPolicyServerController.role_anonymous.id;
    AccessPolicyServerController.role_logged.id = 2;
    AccessPolicyServerController.role_logged.translatable_name = 'role_logged';

    AccessPolicyServerController.role_admin = new RoleVO();
    AccessPolicyServerController.role_admin.parent_role_id = AccessPolicyServerController.role_logged.id;
    AccessPolicyServerController.role_admin.id = 3;
    AccessPolicyServerController.role_admin.translatable_name = 'role_admin';

    let all_roles: { [role_id: number]: RoleVO } = {
        1: AccessPolicyServerController.role_anonymous,
        2: AccessPolicyServerController.role_logged,
        3: AccessPolicyServerController.role_admin
    };




    let policy: AccessPolicyVO = new AccessPolicyVO();
    policy.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
    policy.translatable_name = 'test';
    policy.id = 1;
    let policies: { [policy_id: number]: AccessPolicyVO } = {
        1: policy
    };

    let role_policy: RolePolicyVO = new RolePolicyVO();
    role_policy.id = 1;
    role_policy.accpol_id = 1;
    role_policy.role_id = AccessPolicyServerController.role_logged.id;
    role_policy.granted = false;

    let role_policies: { [role_id: number]: { [pol_id: number]: RolePolicyVO } } = {
        [AccessPolicyServerController.role_logged.id]: {
            [policy.id]: role_policy
        }
    };

    expect(AccessPolicyServerController.checkAccessTo(
        policy,
        null,
        all_roles,
        role_policies,
        policies,
        null
    )).toStrictEqual(false);

    expect(AccessPolicyServerController.checkAccessTo(
        policy,
        { [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous },
        all_roles,
        role_policies,
        policies,
        null
    )).toStrictEqual(false);

    expect(AccessPolicyServerController.checkAccessTo(
        policy,
        { [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged },
        all_roles,
        role_policies,
        policies,
        null
    )).toStrictEqual(false);

    expect(AccessPolicyServerController.checkAccessTo(
        policy,
        { [AccessPolicyServerController.role_admin.id]: AccessPolicyServerController.role_admin },
        all_roles,
        role_policies,
        policies,
        null
    )).toStrictEqual(true);


    policy.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ANONYMOUS;
    expect(AccessPolicyServerController.checkAccessTo(
        policy,
        { [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous },
        all_roles,
        role_policies,
        policies,
        null
    )).toStrictEqual(false);

    expect(AccessPolicyServerController.checkAccessTo(
        policy,
        { [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged },
        all_roles,
        role_policies,
        policies,
        null
    )).toStrictEqual(false);

    expect(AccessPolicyServerController.checkAccessTo(
        policy,
        { [AccessPolicyServerController.role_admin.id]: AccessPolicyServerController.role_admin },
        all_roles,
        role_policies,
        policies,
        null
    )).toStrictEqual(true);
});

test('AccessPolicyServer: test check access - policy explicit inheritance', () => {
    APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

    AccessPolicyServerController.role_anonymous = new RoleVO();
    AccessPolicyServerController.role_anonymous.parent_role_id = null;
    AccessPolicyServerController.role_anonymous.id = 1;
    AccessPolicyServerController.role_anonymous.translatable_name = 'role_anonymous';

    AccessPolicyServerController.role_logged = new RoleVO();
    AccessPolicyServerController.role_logged.parent_role_id = AccessPolicyServerController.role_anonymous.id;
    AccessPolicyServerController.role_logged.id = 2;
    AccessPolicyServerController.role_logged.translatable_name = 'role_logged';

    AccessPolicyServerController.role_admin = new RoleVO();
    AccessPolicyServerController.role_admin.parent_role_id = AccessPolicyServerController.role_logged.id;
    AccessPolicyServerController.role_admin.id = 3;
    AccessPolicyServerController.role_admin.translatable_name = 'role_admin';

    let all_roles: { [role_id: number]: RoleVO } = {
        1: AccessPolicyServerController.role_anonymous,
        2: AccessPolicyServerController.role_logged,
        3: AccessPolicyServerController.role_admin
    };



    let policy: AccessPolicyVO = new AccessPolicyVO();
    policy.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED_TO_ANYONE;
    policy.translatable_name = 'test';
    policy.id = 1;
    let policies: { [policy_id: number]: AccessPolicyVO } = {
        1: policy
    };

    let role_policy: RolePolicyVO = new RolePolicyVO();
    role_policy.id = 1;
    role_policy.accpol_id = 1;
    role_policy.role_id = AccessPolicyServerController.role_logged.id;
    role_policy.granted = false;

    let role_policies: { [role_id: number]: { [pol_id: number]: RolePolicyVO } } = {
        [AccessPolicyServerController.role_logged.id]: {
            [policy.id]: role_policy
        }
    };

    expect(AccessPolicyServerController.checkAccessTo(
        policy,
        { [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous },
        all_roles,
        role_policies,
        policies,
        null
    )).toStrictEqual(true);

    // ATTENTION : un rôle ne peut pas avoir moins d'accès que son parent
    expect(AccessPolicyServerController.checkAccessTo(
        policy,
        { [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged },
        all_roles,
        role_policies,
        policies,
        null
    )).toStrictEqual(true);

    expect(AccessPolicyServerController.checkAccessTo(
        policy,
        { [AccessPolicyServerController.role_admin.id]: AccessPolicyServerController.role_admin },
        all_roles,
        role_policies,
        policies,
        null
    )).toStrictEqual(true);
});

test('AccessPolicyServer: test check access - policy explicit dependency', () => {
    APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

    AccessPolicyServerController.role_anonymous = new RoleVO();
    AccessPolicyServerController.role_anonymous.parent_role_id = null;
    AccessPolicyServerController.role_anonymous.id = 1;
    AccessPolicyServerController.role_anonymous.translatable_name = 'role_anonymous';

    AccessPolicyServerController.role_logged = new RoleVO();
    AccessPolicyServerController.role_logged.parent_role_id = AccessPolicyServerController.role_anonymous.id;
    AccessPolicyServerController.role_logged.id = 2;
    AccessPolicyServerController.role_logged.translatable_name = 'role_logged';

    AccessPolicyServerController.role_admin = new RoleVO();
    AccessPolicyServerController.role_admin.parent_role_id = AccessPolicyServerController.role_logged.id;
    AccessPolicyServerController.role_admin.id = 3;
    AccessPolicyServerController.role_admin.translatable_name = 'role_admin';

    let all_roles: { [role_id: number]: RoleVO } = {
        1: AccessPolicyServerController.role_anonymous,
        2: AccessPolicyServerController.role_logged,
        3: AccessPolicyServerController.role_admin
    };



    let policyA: AccessPolicyVO = new AccessPolicyVO();
    policyA.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED_TO_ANYONE;
    policyA.translatable_name = 'testA';
    policyA.id = 1;

    let policyB: AccessPolicyVO = new AccessPolicyVO();
    policyB.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
    policyB.translatable_name = 'testB';
    policyB.id = 2;

    let policies: { [policy_id: number]: AccessPolicyVO } = {
        [policyA.id]: policyA,
        [policyB.id]: policyB
    };

    let role_policyA: RolePolicyVO = new RolePolicyVO();
    role_policyA.id = 1;
    role_policyA.accpol_id = 1;
    role_policyA.role_id = AccessPolicyServerController.role_anonymous.id;
    role_policyA.granted = true;

    let role_policies: { [role_id: number]: { [pol_id: number]: RolePolicyVO } } = {
        [AccessPolicyServerController.role_logged.id]: {
            [policyA.id]: role_policyA
        }
    };

    expect(AccessPolicyServerController.checkAccessTo(
        policyA,
        { [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged },
        all_roles,
        role_policies,
        policies,
        null
    )).toStrictEqual(true);

    expect(AccessPolicyServerController.checkAccessTo(
        policyB,
        { [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged },
        all_roles,
        role_policies,
        policies,
        null
    )).toStrictEqual(false);

    expect(AccessPolicyServerController.checkAccessTo(
        policyB,
        { [AccessPolicyServerController.role_admin.id]: AccessPolicyServerController.role_admin },
        all_roles,
        role_policies,
        policies,
        null
    )).toStrictEqual(true);


    let dependency: PolicyDependencyVO = new PolicyDependencyVO();
    dependency.id = 1;
    dependency.src_pol_id = policyA.id;
    dependency.depends_on_pol_id = policyB.id;
    dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED;
    let policies_dependencies: { [src_pol_id: number]: PolicyDependencyVO[] } = {
        [policyA.id]: [dependency]
    };

    expect(AccessPolicyServerController.checkAccessTo(
        policyB,
        { [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged },
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).toStrictEqual(false);

    expect(AccessPolicyServerController.checkAccessTo(
        policyB,
        { [AccessPolicyServerController.role_admin.id]: AccessPolicyServerController.role_admin },
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).toStrictEqual(true);

    expect(AccessPolicyServerController.checkAccessTo(
        policyA,
        { [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged },
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).toStrictEqual(true);

    // L'admin a juste accès à tout
    expect(AccessPolicyServerController.checkAccessTo(
        policyA,
        { [AccessPolicyServerController.role_admin.id]: AccessPolicyServerController.role_admin },
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).toStrictEqual(true);

    dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
    expect(AccessPolicyServerController.checkAccessTo(
        policyA,
        { [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged },
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).toStrictEqual(false);

    let role_policyB: RolePolicyVO = new RolePolicyVO();
    role_policyB.id = 2;
    role_policyB.accpol_id = policyB.id;
    role_policyB.role_id = AccessPolicyServerController.role_anonymous.id;
    role_policyB.granted = true;

    role_policies[AccessPolicyServerController.role_anonymous.id] = {};
    role_policies[AccessPolicyServerController.role_anonymous.id][policyB.id] = role_policyB;

    expect(AccessPolicyServerController.checkAccessTo(
        policyA,
        { [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous },
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).toStrictEqual(true);

    expect(AccessPolicyServerController.checkAccessTo(
        policyA,
        { [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged },
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).toStrictEqual(true);


    expect(AccessPolicyServerController.checkAccessTo(
        policyA,
        { [AccessPolicyServerController.role_admin.id]: AccessPolicyServerController.role_admin },
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).toStrictEqual(true);

    role_policyB.granted = false;

    expect(AccessPolicyServerController.checkAccessTo(
        policyA,
        { [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous },
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).toStrictEqual(false);

    expect(AccessPolicyServerController.checkAccessTo(
        policyA,
        { [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged },
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).toStrictEqual(false);


    expect(AccessPolicyServerController.checkAccessTo(
        policyA,
        { [AccessPolicyServerController.role_admin.id]: AccessPolicyServerController.role_admin },
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).toStrictEqual(true);

    role_policyA.granted = false;
    role_policyB.granted = true;

    expect(AccessPolicyServerController.checkAccessTo(
        policyA,
        { [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous },
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).toStrictEqual(true);

    expect(AccessPolicyServerController.checkAccessTo(
        policyA,
        { [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged },
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).toStrictEqual(true);


    expect(AccessPolicyServerController.checkAccessTo(
        policyA,
        { [AccessPolicyServerController.role_admin.id]: AccessPolicyServerController.role_admin },
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).toStrictEqual(true);
});

test('AccessPolicyServer: test check access - policy multiple dependencies defaults GRANTED', () => {
    APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

    AccessPolicyServerController.role_anonymous = new RoleVO();
    AccessPolicyServerController.role_anonymous.parent_role_id = null;
    AccessPolicyServerController.role_anonymous.id = 1;
    AccessPolicyServerController.role_anonymous.translatable_name = 'role_anonymous';

    AccessPolicyServerController.role_logged = new RoleVO();
    AccessPolicyServerController.role_logged.parent_role_id = AccessPolicyServerController.role_anonymous.id;
    AccessPolicyServerController.role_logged.id = 2;
    AccessPolicyServerController.role_logged.translatable_name = 'role_logged';

    AccessPolicyServerController.role_admin = new RoleVO();
    AccessPolicyServerController.role_admin.parent_role_id = AccessPolicyServerController.role_logged.id;
    AccessPolicyServerController.role_admin.id = 3;
    AccessPolicyServerController.role_admin.translatable_name = 'role_admin';

    let all_roles: { [role_id: number]: RoleVO } = {
        1: AccessPolicyServerController.role_anonymous,
        2: AccessPolicyServerController.role_logged,
        3: AccessPolicyServerController.role_admin
    };



    let policyA: AccessPolicyVO = new AccessPolicyVO();
    policyA.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
    policyA.translatable_name = 'testA';
    policyA.id = 1;

    let policyB: AccessPolicyVO = new AccessPolicyVO();
    policyB.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
    policyB.translatable_name = 'testB';
    policyB.id = 2;

    let policyC: AccessPolicyVO = new AccessPolicyVO();
    policyB.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
    policyB.translatable_name = 'testC';
    policyB.id = 3;

    let policies: { [policy_id: number]: AccessPolicyVO } = {
        [policyA.id]: policyA,
        [policyB.id]: policyB,
        [policyC.id]: policyC
    };

    let role_policyA: RolePolicyVO = new RolePolicyVO();
    role_policyA.id = 1;
    role_policyA.accpol_id = policyA.id;
    role_policyA.role_id = AccessPolicyServerController.role_logged.id;
    role_policyA.granted = true;

    let role_policyB: RolePolicyVO = new RolePolicyVO();
    role_policyB.id = 2;
    role_policyB.accpol_id = policyB.id;
    role_policyB.role_id = AccessPolicyServerController.role_logged.id;
    role_policyB.granted = true;

    let role_policies: { [role_id: number]: { [pol_id: number]: RolePolicyVO } } = {
        [AccessPolicyServerController.role_logged.id]: {
            [policyA.id]: role_policyA,
            [policyB.id]: role_policyB
        }
    };

    let dependencyCA: PolicyDependencyVO = new PolicyDependencyVO();
    dependencyCA.id = 1;
    dependencyCA.src_pol_id = policyC.id;
    dependencyCA.depends_on_pol_id = policyA.id;
    dependencyCA.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED;
    let dependencyCB: PolicyDependencyVO = new PolicyDependencyVO();
    dependencyCB.id = 2;
    dependencyCB.src_pol_id = policyC.id;
    dependencyCB.depends_on_pol_id = policyB.id;
    dependencyCB.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED;
    let policies_dependencies: { [src_pol_id: number]: PolicyDependencyVO[] } = {
        [policyC.id]: [dependencyCA, dependencyCB],
    };

    expect(AccessPolicyServerController.checkAccessTo(
        policyC,
        { [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous },
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).toStrictEqual(false);

    expect(AccessPolicyServerController.checkAccessTo(
        policyC,
        { [AccessPolicyServerController.role_admin.id]: AccessPolicyServerController.role_admin },
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).toStrictEqual(true);

    expect(AccessPolicyServerController.checkAccessTo(
        policyC,
        { [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged },
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).toStrictEqual(true);

    role_policyB.granted = false;

    expect(AccessPolicyServerController.checkAccessTo(
        policyC,
        { [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged },
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).toStrictEqual(true);

    role_policyA.granted = false;

    expect(AccessPolicyServerController.checkAccessTo(
        policyC,
        { [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged },
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).toStrictEqual(false);

    role_policyB.granted = true;

    expect(AccessPolicyServerController.checkAccessTo(
        policyC,
        { [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged },
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).toStrictEqual(true);

    role_policyA.granted = true;

    expect(AccessPolicyServerController.checkAccessTo(
        policyC,
        { [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged },
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).toStrictEqual(true);
});

test('AccessPolicyServer: test check access - policy multiple dependencies defaults DENIED', () => {
    APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

    AccessPolicyServerController.role_anonymous = new RoleVO();
    AccessPolicyServerController.role_anonymous.parent_role_id = null;
    AccessPolicyServerController.role_anonymous.id = 1;
    AccessPolicyServerController.role_anonymous.translatable_name = 'role_anonymous';

    AccessPolicyServerController.role_logged = new RoleVO();
    AccessPolicyServerController.role_logged.parent_role_id = AccessPolicyServerController.role_anonymous.id;
    AccessPolicyServerController.role_logged.id = 2;
    AccessPolicyServerController.role_logged.translatable_name = 'role_logged';

    AccessPolicyServerController.role_admin = new RoleVO();
    AccessPolicyServerController.role_admin.parent_role_id = AccessPolicyServerController.role_logged.id;
    AccessPolicyServerController.role_admin.id = 3;
    AccessPolicyServerController.role_admin.translatable_name = 'role_admin';

    let all_roles: { [role_id: number]: RoleVO } = {
        1: AccessPolicyServerController.role_anonymous,
        2: AccessPolicyServerController.role_logged,
        3: AccessPolicyServerController.role_admin
    };



    let policyA: AccessPolicyVO = new AccessPolicyVO();
    policyA.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
    policyA.translatable_name = 'testA';
    policyA.id = 1;

    let policyB: AccessPolicyVO = new AccessPolicyVO();
    policyB.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
    policyB.translatable_name = 'testB';
    policyB.id = 2;

    let policyC: AccessPolicyVO = new AccessPolicyVO();
    policyB.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
    policyB.translatable_name = 'testC';
    policyB.id = 3;

    let policies: { [policy_id: number]: AccessPolicyVO } = {
        [policyA.id]: policyA,
        [policyB.id]: policyB,
        [policyC.id]: policyC
    };

    let role_policyA: RolePolicyVO = new RolePolicyVO();
    role_policyA.id = 1;
    role_policyA.accpol_id = policyA.id;
    role_policyA.role_id = AccessPolicyServerController.role_logged.id;
    role_policyA.granted = true;

    let role_policyB: RolePolicyVO = new RolePolicyVO();
    role_policyB.id = 2;
    role_policyB.accpol_id = policyB.id;
    role_policyB.role_id = AccessPolicyServerController.role_logged.id;
    role_policyB.granted = true;

    let role_policies: { [role_id: number]: { [pol_id: number]: RolePolicyVO } } = {
        [AccessPolicyServerController.role_logged.id]: {
            [policyA.id]: role_policyA,
            [policyB.id]: role_policyB
        }
    };

    let dependencyCA: PolicyDependencyVO = new PolicyDependencyVO();
    dependencyCA.id = 1;
    dependencyCA.src_pol_id = policyC.id;
    dependencyCA.depends_on_pol_id = policyA.id;
    dependencyCA.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
    let dependencyCB: PolicyDependencyVO = new PolicyDependencyVO();
    dependencyCB.id = 2;
    dependencyCB.src_pol_id = policyC.id;
    dependencyCB.depends_on_pol_id = policyB.id;
    dependencyCB.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
    let policies_dependencies: { [src_pol_id: number]: PolicyDependencyVO[] } = {
        [policyC.id]: [dependencyCA, dependencyCB],
    };

    expect(AccessPolicyServerController.checkAccessTo(
        policyC,
        { [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous },
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).toStrictEqual(false);

    expect(AccessPolicyServerController.checkAccessTo(
        policyC,
        { [AccessPolicyServerController.role_admin.id]: AccessPolicyServerController.role_admin },
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).toStrictEqual(true);

    expect(AccessPolicyServerController.checkAccessTo(
        policyC,
        { [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged },
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).toStrictEqual(false);

    role_policyB.granted = false;

    expect(AccessPolicyServerController.checkAccessTo(
        policyC,
        { [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged },
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).toStrictEqual(false);

    role_policyA.granted = false;

    expect(AccessPolicyServerController.checkAccessTo(
        policyC,
        { [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged },
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).toStrictEqual(false);

    role_policyB.granted = true;

    expect(AccessPolicyServerController.checkAccessTo(
        policyC,
        { [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged },
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).toStrictEqual(false);

    role_policyA.granted = true;

    expect(AccessPolicyServerController.checkAccessTo(
        policyC,
        { [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged },
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).toStrictEqual(false);
});

test('AccessPolicyServer: test check access - policy multiple dependencies different defaults', () => {
    APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

    AccessPolicyServerController.role_anonymous = new RoleVO();
    AccessPolicyServerController.role_anonymous.parent_role_id = null;
    AccessPolicyServerController.role_anonymous.id = 1;
    AccessPolicyServerController.role_anonymous.translatable_name = 'role_anonymous';

    AccessPolicyServerController.role_logged = new RoleVO();
    AccessPolicyServerController.role_logged.parent_role_id = AccessPolicyServerController.role_anonymous.id;
    AccessPolicyServerController.role_logged.id = 2;
    AccessPolicyServerController.role_logged.translatable_name = 'role_logged';

    AccessPolicyServerController.role_admin = new RoleVO();
    AccessPolicyServerController.role_admin.parent_role_id = AccessPolicyServerController.role_logged.id;
    AccessPolicyServerController.role_admin.id = 3;
    AccessPolicyServerController.role_admin.translatable_name = 'role_admin';

    let all_roles: { [role_id: number]: RoleVO } = {
        1: AccessPolicyServerController.role_anonymous,
        2: AccessPolicyServerController.role_logged,
        3: AccessPolicyServerController.role_admin
    };



    let policyA: AccessPolicyVO = new AccessPolicyVO();
    policyA.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
    policyA.translatable_name = 'testA';
    policyA.id = 1;

    let policyB: AccessPolicyVO = new AccessPolicyVO();
    policyB.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
    policyB.translatable_name = 'testB';
    policyB.id = 2;

    let policyC: AccessPolicyVO = new AccessPolicyVO();
    policyB.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
    policyB.translatable_name = 'testC';
    policyB.id = 3;

    let policies: { [policy_id: number]: AccessPolicyVO } = {
        [policyA.id]: policyA,
        [policyB.id]: policyB,
        [policyC.id]: policyC
    };

    let role_policyA: RolePolicyVO = new RolePolicyVO();
    role_policyA.id = 1;
    role_policyA.accpol_id = policyA.id;
    role_policyA.role_id = AccessPolicyServerController.role_logged.id;
    role_policyA.granted = true;

    let role_policyB: RolePolicyVO = new RolePolicyVO();
    role_policyB.id = 2;
    role_policyB.accpol_id = policyB.id;
    role_policyB.role_id = AccessPolicyServerController.role_logged.id;
    role_policyB.granted = true;

    let role_policies: { [role_id: number]: { [pol_id: number]: RolePolicyVO } } = {
        [AccessPolicyServerController.role_logged.id]: {
            [policyA.id]: role_policyA,
            [policyB.id]: role_policyB
        }
    };

    let dependencyCA: PolicyDependencyVO = new PolicyDependencyVO();
    dependencyCA.id = 1;
    dependencyCA.src_pol_id = policyC.id;
    dependencyCA.depends_on_pol_id = policyA.id;
    dependencyCA.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
    let dependencyCB: PolicyDependencyVO = new PolicyDependencyVO();
    dependencyCB.id = 2;
    dependencyCB.src_pol_id = policyC.id;
    dependencyCB.depends_on_pol_id = policyB.id;
    dependencyCB.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED;
    let policies_dependencies: { [src_pol_id: number]: PolicyDependencyVO[] } = {
        [policyC.id]: [dependencyCA, dependencyCB],
    };

    expect(AccessPolicyServerController.checkAccessTo(
        policyC,
        { [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous },
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).toStrictEqual(false);

    expect(AccessPolicyServerController.checkAccessTo(
        policyC,
        { [AccessPolicyServerController.role_admin.id]: AccessPolicyServerController.role_admin },
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).toStrictEqual(true);

    expect(AccessPolicyServerController.checkAccessTo(
        policyC,
        { [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged },
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).toStrictEqual(true);

    role_policyB.granted = false;

    expect(AccessPolicyServerController.checkAccessTo(
        policyC,
        { [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged },
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).toStrictEqual(false);

    role_policyA.granted = false;

    expect(AccessPolicyServerController.checkAccessTo(
        policyC,
        { [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged },
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).toStrictEqual(false);

    role_policyB.granted = true;

    expect(AccessPolicyServerController.checkAccessTo(
        policyC,
        { [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged },
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).toStrictEqual(false);

    role_policyA.granted = true;

    expect(AccessPolicyServerController.checkAccessTo(
        policyC,
        { [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged },
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).toStrictEqual(true);
});

test('AccessPolicyServer: test getUsersRoles', () => {
    APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

    AccessPolicyServerController.role_anonymous = new RoleVO();
    AccessPolicyServerController.role_anonymous.parent_role_id = null;
    AccessPolicyServerController.role_anonymous.id = 1;
    AccessPolicyServerController.role_anonymous.translatable_name = 'role_anonymous';

    AccessPolicyServerController.role_logged = new RoleVO();
    AccessPolicyServerController.role_logged.parent_role_id = AccessPolicyServerController.role_anonymous.id;
    AccessPolicyServerController.role_logged.id = 2;
    AccessPolicyServerController.role_logged.translatable_name = 'role_logged';

    AccessPolicyServerController.role_admin = new RoleVO();
    AccessPolicyServerController.role_admin.parent_role_id = AccessPolicyServerController.role_logged.id;
    AccessPolicyServerController.role_admin.id = 3;
    AccessPolicyServerController.role_admin.translatable_name = 'role_admin';

    let all_roles: { [role_id: number]: RoleVO } = {
        1: AccessPolicyServerController.role_anonymous,
        2: AccessPolicyServerController.role_logged,
        3: AccessPolicyServerController.role_admin
    };



    let new_role: RoleVO = new RoleVO();
    new_role.parent_role_id = AccessPolicyServerController.role_logged.id;
    new_role.translatable_name = 'new_role';
    new_role.id = 1001;

    all_roles[new_role.id] = new_role;
    expect(AccessPolicyServerController.getUsersRoles(false, null, null, null)).toStrictEqual({
        [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous
    });

    expect(AccessPolicyServerController.getUsersRoles(false, null, [], all_roles)).toStrictEqual({
        [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous
    });

    expect(AccessPolicyServerController.getUsersRoles(true, null, [], all_roles)).toStrictEqual({
        [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous,
        [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged
    });

    expect(AccessPolicyServerController.getUsersRoles(true, null, null, all_roles)).toStrictEqual({
        [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous,
        [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged
    });

    expect(AccessPolicyServerController.getUsersRoles(true, null, [
        AccessPolicyServerController.role_anonymous
    ], all_roles)).toStrictEqual({
        [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous,
        [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged
    });

    expect(AccessPolicyServerController.getUsersRoles(true, null, [
        AccessPolicyServerController.role_anonymous,
        AccessPolicyServerController.role_logged
    ], all_roles)).toStrictEqual({
        [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged,
        [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous
    });

    expect(AccessPolicyServerController.getUsersRoles(true, null, [
        new_role
    ], all_roles)).toStrictEqual({
        [new_role.id]: new_role,
        [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged,
        [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous
    });

    expect(AccessPolicyServerController.getUsersRoles(true, null, [
        AccessPolicyServerController.role_admin
    ], all_roles)).toStrictEqual({
        [AccessPolicyServerController.role_admin.id]: AccessPolicyServerController.role_admin,
        [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged,
        [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous
    });

    delete all_roles[new_role.id];
});

test('AccessPolicyServer: test check access - inheritance test - complex - dont inherit role policy when dependency not validated', () => {
    APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

    AccessPolicyServerController.role_anonymous = new RoleVO();
    AccessPolicyServerController.role_anonymous.parent_role_id = null;
    AccessPolicyServerController.role_anonymous.id = 1;
    AccessPolicyServerController.role_anonymous.translatable_name = 'role_anonymous';

    AccessPolicyServerController.role_logged = new RoleVO();
    AccessPolicyServerController.role_logged.parent_role_id = AccessPolicyServerController.role_anonymous.id;
    AccessPolicyServerController.role_logged.id = 2;
    AccessPolicyServerController.role_logged.translatable_name = 'role_logged';

    AccessPolicyServerController.role_admin = new RoleVO();
    AccessPolicyServerController.role_admin.parent_role_id = AccessPolicyServerController.role_logged.id;
    AccessPolicyServerController.role_admin.id = 3;
    AccessPolicyServerController.role_admin.translatable_name = 'role_admin';

    let all_roles: { [role_id: number]: RoleVO } = {
        1: AccessPolicyServerController.role_anonymous,
        2: AccessPolicyServerController.role_logged,
        3: AccessPolicyServerController.role_admin
    };



    let policyA: AccessPolicyVO = new AccessPolicyVO();
    policyA.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
    policyA.translatable_name = 'testA';
    policyA.id = 1;

    let policyB: AccessPolicyVO = new AccessPolicyVO();
    policyB.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
    policyB.translatable_name = 'testB';
    policyB.id = 2;
    let policies: { [policy_id: number]: AccessPolicyVO } = {
        1: policyA,
        2: policyB
    };

    let dependency: PolicyDependencyVO = new PolicyDependencyVO();
    dependency.id = 1;
    dependency.src_pol_id = policyB.id;
    dependency.depends_on_pol_id = policyA.id;
    dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
    let policies_dependencies: { [src_pol_id: number]: PolicyDependencyVO[] } = {
        [policyB.id]: [dependency]
    };

    let role_policyA: RolePolicyVO = new RolePolicyVO();
    role_policyA.id = 1;
    role_policyA.accpol_id = policyA.id;
    role_policyA.role_id = AccessPolicyServerController.role_logged.id;
    role_policyA.granted = true;

    let role_policyB: RolePolicyVO = new RolePolicyVO();
    role_policyB.id = 2;
    role_policyB.accpol_id = policyB.id;
    role_policyB.role_id = AccessPolicyServerController.role_anonymous.id;
    role_policyB.granted = true;

    let role_policies: { [role_id: number]: { [pol_id: number]: RolePolicyVO } } = {
        [AccessPolicyServerController.role_anonymous.id]: {
            [policyB.id]: role_policyB
        },
        [AccessPolicyServerController.role_logged.id]: {
            [policyA.id]: role_policyA
        }
    };

    // anon ne peut hériter dans ce contexte, et pas de droit anon sur A
    expect(AccessPolicyServerController.checkAccessTo(
        policyA,
        { [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous },
        all_roles,
        role_policies,
        policies,
        policies_dependencies,
        AccessPolicyServerController.role_anonymous
    )).toStrictEqual(false);

    expect(AccessPolicyServerController.checkAccessTo(
        policyA,
        { [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous },
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).toStrictEqual(false);

    // Anon sur B nécessite anon A donc false pour les 2
    expect(AccessPolicyServerController.checkAccessTo(
        policyB,
        { [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous },
        all_roles,
        role_policies,
        policies,
        policies_dependencies,
        AccessPolicyServerController.role_anonymous
    )).toStrictEqual(false);

    expect(AccessPolicyServerController.checkAccessTo(
        policyB,
        { [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous },
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).toStrictEqual(false);

    // logged sur A ok, mais pas hérité
    expect(AccessPolicyServerController.checkAccessTo(
        policyA,
        { [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged },
        all_roles,
        role_policies,
        policies,
        policies_dependencies,
        AccessPolicyServerController.role_logged
    )).toStrictEqual(false);

    expect(AccessPolicyServerController.checkAccessTo(
        policyA,
        { [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged },
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).toStrictEqual(true);

    // logged sur B nécessite A (ok) mais ne peut hériter de B sur anon puisque A anon est invalide
    expect(AccessPolicyServerController.checkAccessTo(
        policyB,
        { [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged },
        all_roles,
        role_policies,
        policies,
        policies_dependencies,
        AccessPolicyServerController.role_logged
    )).toStrictEqual(false);

    expect(AccessPolicyServerController.checkAccessTo(
        policyB,
        { [AccessPolicyServerController.role_logged.id]: AccessPolicyServerController.role_logged },
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).toStrictEqual(false);
});


test('AccessPolicyServer: test dao access - isAccessConfVoType && inherited', () => {
    APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

    AccessPolicyServerController.role_anonymous = new RoleVO();
    AccessPolicyServerController.role_anonymous.parent_role_id = null;
    AccessPolicyServerController.role_anonymous.id = 1;
    AccessPolicyServerController.role_anonymous.translatable_name = 'role_anonymous';

    AccessPolicyServerController.role_logged = new RoleVO();
    AccessPolicyServerController.role_logged.parent_role_id = AccessPolicyServerController.role_anonymous.id;
    AccessPolicyServerController.role_logged.id = 2;
    AccessPolicyServerController.role_logged.translatable_name = 'role_logged';

    AccessPolicyServerController.role_admin = new RoleVO();
    AccessPolicyServerController.role_admin.parent_role_id = AccessPolicyServerController.role_logged.id;
    AccessPolicyServerController.role_admin.id = 3;
    AccessPolicyServerController.role_admin.translatable_name = 'role_admin';

    let all_roles: { [role_id: number]: RoleVO } = {
        1: AccessPolicyServerController.role_anonymous,
        2: AccessPolicyServerController.role_logged,
        3: AccessPolicyServerController.role_admin
    };

    let policy_global_access: AccessPolicyVO = new AccessPolicyVO();
    policy_global_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
    policy_global_access.translatable_name = 'policy_global_access';
    policy_global_access.id = 100;


    let pg_inherited: AccessPolicyGroupVO = new AccessPolicyGroupVO();
    pg_inherited.translatable_name = 'pg_inherited';
    pg_inherited.id = 2;

    let policy_inherited_LIST_LABELS: AccessPolicyVO = DAOServerController.get_dao_policy(
        'isAccessConfVoType_inherited.LIST_LABELS',
        pg_inherited,
        true,
        AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED_TO_ANYONE);
    policy_inherited_LIST_LABELS.id = 11;

    let policy_inherited_READ: AccessPolicyVO = DAOServerController.get_dao_policy(
        'isAccessConfVoType_inherited_READ',
        pg_inherited,
        true,
        AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED_TO_ANYONE);
    policy_inherited_READ.id = 12;

    let policy_inherited_INSERT_OR_UPDATE: AccessPolicyVO = DAOServerController.get_dao_policy(
        'isAccessConfVoType_inherited_INSERT_OR_UPDATE',
        pg_inherited,
        true,
        AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN);
    policy_inherited_INSERT_OR_UPDATE.id = 13;

    let policy_inherited_DELETE: AccessPolicyVO = DAOServerController.get_dao_policy(
        'isAccessConfVoType_inherited_DELETE',
        pg_inherited,
        true,
        AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN);
    policy_inherited_DELETE.id = 14;



    let pg: AccessPolicyGroupVO = new AccessPolicyGroupVO();
    pg.translatable_name = 'pg';
    pg.id = 1;

    let policyLIST_LABELS: AccessPolicyVO = DAOServerController.get_dao_policy(
        'isAccessConfVoType_LIST_LABELS',
        pg,
        true,
        AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED_TO_ANYONE);
    policyLIST_LABELS.id = 1;

    let policyREAD: AccessPolicyVO = DAOServerController.get_dao_policy(
        'isAccessConfVoType_READ',
        pg,
        true,
        AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED_TO_ANYONE);
    policyREAD.id = 2;

    let policyINSERT_OR_UPDATE: AccessPolicyVO = DAOServerController.get_dao_policy(
        'isAccessConfVoType_INSERT_OR_UPDATE',
        pg,
        true,
        AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN);
    policyINSERT_OR_UPDATE.id = 3;

    let policyDELETE: AccessPolicyVO = DAOServerController.get_dao_policy(
        'isAccessConfVoType_DELETE',
        pg,
        true,
        AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN);
    policyDELETE.id = 4;


    let policies: { [policy_id: number]: AccessPolicyVO } = {
        1: policyLIST_LABELS,
        2: policyREAD,
        3: policyINSERT_OR_UPDATE,
        4: policyDELETE,

        11: policy_inherited_LIST_LABELS,
        12: policy_inherited_READ,
        13: policy_inherited_INSERT_OR_UPDATE,
        14: policy_inherited_DELETE
    };


    let dependencyREAD = DAOServerController.get_dao_dependency_default_denied(policyREAD, policyLIST_LABELS);
    let dependencyINSERT_OR_UPDATE = DAOServerController.get_dao_dependency_default_denied(policyINSERT_OR_UPDATE, policyREAD);
    let dependencyDELETE = DAOServerController.get_dao_dependency_default_denied(policyDELETE, policyREAD);

    let global_access_LIST_LABELS = DAOServerController.get_dao_dependency_default_granted(
        policyLIST_LABELS,
        policy_global_access);
    let global_access_READ = DAOServerController.get_dao_dependency_default_granted(
        policyREAD,
        policy_global_access);
    let global_access_INSERT_OR_UPDATE = DAOServerController.get_dao_dependency_default_granted(
        policyINSERT_OR_UPDATE,
        policy_global_access);
    let global_access_DELETE = DAOServerController.get_dao_dependency_default_granted(
        policyDELETE,
        policy_global_access);

    let inherited_LIST_LABELS = DAOServerController.get_dao_dependency_default_granted(
        policyLIST_LABELS,
        policy_inherited_LIST_LABELS);
    let inherited_READ = DAOServerController.get_dao_dependency_default_granted(
        policyREAD,
        policy_inherited_READ);
    let inherited_INSERT_OR_UPDATE = DAOServerController.get_dao_dependency_default_granted(
        policyINSERT_OR_UPDATE,
        policy_inherited_INSERT_OR_UPDATE);
    let inherited_DELETE = DAOServerController.get_dao_dependency_default_granted(
        policyDELETE,
        policy_inherited_DELETE);

    let policies_dependencies: { [src_pol_id: number]: PolicyDependencyVO[] } = {

        [policyLIST_LABELS.id]: [global_access_LIST_LABELS, inherited_LIST_LABELS],
        [policyREAD.id]: [dependencyREAD, global_access_READ, inherited_READ],
        [policyINSERT_OR_UPDATE.id]: [dependencyINSERT_OR_UPDATE, global_access_INSERT_OR_UPDATE, inherited_INSERT_OR_UPDATE],
        [policyDELETE.id]: [dependencyDELETE, global_access_DELETE, inherited_DELETE],
    };

    expect(AccessPolicyServerController.checkAccessTo(
        policyLIST_LABELS,
        { [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous },
        all_roles,
        null,
        policies,
        policies_dependencies,
        AccessPolicyServerController.role_anonymous
    )).toStrictEqual(true);

    expect(AccessPolicyServerController.checkAccessTo(
        policyREAD,
        { [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous },
        all_roles,
        null,
        policies,
        policies_dependencies,
        AccessPolicyServerController.role_anonymous
    )).toStrictEqual(true);

    expect(AccessPolicyServerController.checkAccessTo(
        policyINSERT_OR_UPDATE,
        { [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous },
        all_roles,
        null,
        policies,
        policies_dependencies,
        AccessPolicyServerController.role_anonymous
    )).toStrictEqual(false);

    expect(AccessPolicyServerController.checkAccessTo(
        policyDELETE,
        { [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous },
        all_roles,
        null,
        policies,
        policies_dependencies,
        AccessPolicyServerController.role_anonymous
    )).toStrictEqual(false);
});



test('AccessPolicyServer: test dao access - isAccessConfVoType', () => {
    APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

    AccessPolicyServerController.role_anonymous = new RoleVO();
    AccessPolicyServerController.role_anonymous.parent_role_id = null;
    AccessPolicyServerController.role_anonymous.id = 1;
    AccessPolicyServerController.role_anonymous.translatable_name = 'role_anonymous';

    AccessPolicyServerController.role_logged = new RoleVO();
    AccessPolicyServerController.role_logged.parent_role_id = AccessPolicyServerController.role_anonymous.id;
    AccessPolicyServerController.role_logged.id = 2;
    AccessPolicyServerController.role_logged.translatable_name = 'role_logged';

    AccessPolicyServerController.role_admin = new RoleVO();
    AccessPolicyServerController.role_admin.parent_role_id = AccessPolicyServerController.role_logged.id;
    AccessPolicyServerController.role_admin.id = 3;
    AccessPolicyServerController.role_admin.translatable_name = 'role_admin';

    let all_roles: { [role_id: number]: RoleVO } = {
        1: AccessPolicyServerController.role_anonymous,
        2: AccessPolicyServerController.role_logged,
        3: AccessPolicyServerController.role_admin
    };

    let policy_global_access: AccessPolicyVO = new AccessPolicyVO();
    policy_global_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
    policy_global_access.translatable_name = 'policy_global_access';
    policy_global_access.id = 100;


    let pg: AccessPolicyGroupVO = new AccessPolicyGroupVO();
    pg.translatable_name = 'pg';
    pg.id = 1;

    let policyLIST_LABELS: AccessPolicyVO = DAOServerController.get_dao_policy(
        'isAccessConfVoType_LIST_LABELS',
        pg,
        true,
        AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED_TO_ANYONE);
    policyLIST_LABELS.id = 1;

    let policyREAD: AccessPolicyVO = DAOServerController.get_dao_policy(
        'isAccessConfVoType_READ',
        pg,
        true,
        AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED_TO_ANYONE);
    policyREAD.id = 2;

    let policyINSERT_OR_UPDATE: AccessPolicyVO = DAOServerController.get_dao_policy(
        'isAccessConfVoType_INSERT_OR_UPDATE',
        pg,
        true,
        AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN);
    policyINSERT_OR_UPDATE.id = 3;

    let policyDELETE: AccessPolicyVO = DAOServerController.get_dao_policy(
        'isAccessConfVoType_DELETE',
        pg,
        true,
        AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN);
    policyDELETE.id = 4;


    let policies: { [policy_id: number]: AccessPolicyVO } = {
        1: policyLIST_LABELS,
        2: policyREAD,
        3: policyINSERT_OR_UPDATE,
        4: policyDELETE
    };


    let dependencyREAD = DAOServerController.get_dao_dependency_default_denied(policyREAD, policyLIST_LABELS);
    let dependencyINSERT_OR_UPDATE = DAOServerController.get_dao_dependency_default_denied(policyINSERT_OR_UPDATE, policyREAD);
    let dependencyDELETE = DAOServerController.get_dao_dependency_default_denied(policyDELETE, policyREAD);

    let global_access_LIST_LABELS = DAOServerController.get_dao_dependency_default_granted(
        policyLIST_LABELS,
        policy_global_access);
    let global_access_READ = DAOServerController.get_dao_dependency_default_granted(
        policyREAD,
        policy_global_access);
    let global_access_INSERT_OR_UPDATE = DAOServerController.get_dao_dependency_default_granted(
        policyINSERT_OR_UPDATE,
        policy_global_access);
    let global_access_DELETE = DAOServerController.get_dao_dependency_default_granted(
        policyDELETE,
        policy_global_access);

    let policies_dependencies: { [src_pol_id: number]: PolicyDependencyVO[] } = {

        [policyLIST_LABELS.id]: [global_access_LIST_LABELS],
        [policyREAD.id]: [dependencyREAD, global_access_READ],
        [policyINSERT_OR_UPDATE.id]: [dependencyINSERT_OR_UPDATE, global_access_INSERT_OR_UPDATE],
        [policyDELETE.id]: [dependencyDELETE, global_access_DELETE],
    };

    expect(AccessPolicyServerController.checkAccessTo(
        policyLIST_LABELS,
        { [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous },
        all_roles,
        null,
        policies,
        policies_dependencies,
        AccessPolicyServerController.role_anonymous
    )).toStrictEqual(true);

    expect(AccessPolicyServerController.checkAccessTo(
        policyREAD,
        { [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous },
        all_roles,
        null,
        policies,
        policies_dependencies,
        AccessPolicyServerController.role_anonymous
    )).toStrictEqual(true);

    expect(AccessPolicyServerController.checkAccessTo(
        policyINSERT_OR_UPDATE,
        { [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous },
        all_roles,
        null,
        policies,
        policies_dependencies,
        AccessPolicyServerController.role_anonymous
    )).toStrictEqual(false);

    expect(AccessPolicyServerController.checkAccessTo(
        policyDELETE,
        { [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous },
        all_roles,
        null,
        policies,
        policies_dependencies,
        AccessPolicyServerController.role_anonymous
    )).toStrictEqual(false);
});


test('AccessPolicyServer: test dao access - !isAccessConfVoType && inherited', () => {
    APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

    AccessPolicyServerController.role_anonymous = new RoleVO();
    AccessPolicyServerController.role_anonymous.parent_role_id = null;
    AccessPolicyServerController.role_anonymous.id = 1;
    AccessPolicyServerController.role_anonymous.translatable_name = 'role_anonymous';

    AccessPolicyServerController.role_logged = new RoleVO();
    AccessPolicyServerController.role_logged.parent_role_id = AccessPolicyServerController.role_anonymous.id;
    AccessPolicyServerController.role_logged.id = 2;
    AccessPolicyServerController.role_logged.translatable_name = 'role_logged';

    AccessPolicyServerController.role_admin = new RoleVO();
    AccessPolicyServerController.role_admin.parent_role_id = AccessPolicyServerController.role_logged.id;
    AccessPolicyServerController.role_admin.id = 3;
    AccessPolicyServerController.role_admin.translatable_name = 'role_admin';

    let all_roles: { [role_id: number]: RoleVO } = {
        1: AccessPolicyServerController.role_anonymous,
        2: AccessPolicyServerController.role_logged,
        3: AccessPolicyServerController.role_admin
    };

    let policy_global_access: AccessPolicyVO = new AccessPolicyVO();
    policy_global_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
    policy_global_access.translatable_name = 'policy_global_access';
    policy_global_access.id = 100;


    let pg_inherited: AccessPolicyGroupVO = new AccessPolicyGroupVO();
    pg_inherited.translatable_name = 'pg_inherited';
    pg_inherited.id = 2;

    let policy_inherited_LIST_LABELS: AccessPolicyVO = DAOServerController.get_dao_policy(
        'isAccessConfVoType_inherited.LIST_LABELS',
        pg_inherited,
        false,
        AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED_TO_ANYONE);
    policy_inherited_LIST_LABELS.id = 11;

    let policy_inherited_READ: AccessPolicyVO = DAOServerController.get_dao_policy(
        'isAccessConfVoType_inherited_READ',
        pg_inherited,
        false,
        AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED_TO_ANYONE);
    policy_inherited_READ.id = 12;

    let policy_inherited_INSERT_OR_UPDATE: AccessPolicyVO = DAOServerController.get_dao_policy(
        'isAccessConfVoType_inherited_INSERT_OR_UPDATE',
        pg_inherited,
        false,
        AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN);
    policy_inherited_INSERT_OR_UPDATE.id = 13;

    let policy_inherited_DELETE: AccessPolicyVO = DAOServerController.get_dao_policy(
        'isAccessConfVoType_inherited_DELETE',
        pg_inherited,
        false,
        AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN);
    policy_inherited_DELETE.id = 14;



    let pg: AccessPolicyGroupVO = new AccessPolicyGroupVO();
    pg.translatable_name = 'pg';
    pg.id = 1;

    let policyLIST_LABELS: AccessPolicyVO = DAOServerController.get_dao_policy(
        'isAccessConfVoType_LIST_LABELS',
        pg,
        false,
        AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED_TO_ANYONE);
    policyLIST_LABELS.id = 1;

    let policyREAD: AccessPolicyVO = DAOServerController.get_dao_policy(
        'isAccessConfVoType_READ',
        pg,
        false,
        AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED_TO_ANYONE);
    policyREAD.id = 2;

    let policyINSERT_OR_UPDATE: AccessPolicyVO = DAOServerController.get_dao_policy(
        'isAccessConfVoType_INSERT_OR_UPDATE',
        pg,
        false,
        AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN);
    policyINSERT_OR_UPDATE.id = 3;

    let policyDELETE: AccessPolicyVO = DAOServerController.get_dao_policy(
        'isAccessConfVoType_DELETE',
        pg,
        false,
        AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN);
    policyDELETE.id = 4;


    let policies: { [policy_id: number]: AccessPolicyVO } = {
        1: policyLIST_LABELS,
        2: policyREAD,
        3: policyINSERT_OR_UPDATE,
        4: policyDELETE,

        11: policy_inherited_LIST_LABELS,
        12: policy_inherited_READ,
        13: policy_inherited_INSERT_OR_UPDATE,
        14: policy_inherited_DELETE
    };


    let dependencyREAD = DAOServerController.get_dao_dependency_default_denied(policyREAD, policyLIST_LABELS);
    let dependencyINSERT_OR_UPDATE = DAOServerController.get_dao_dependency_default_denied(policyINSERT_OR_UPDATE, policyREAD);
    let dependencyDELETE = DAOServerController.get_dao_dependency_default_denied(policyDELETE, policyREAD);

    let global_access_LIST_LABELS = DAOServerController.get_dao_dependency_default_granted(
        policyLIST_LABELS,
        policy_global_access);
    let global_access_READ = DAOServerController.get_dao_dependency_default_granted(
        policyREAD,
        policy_global_access);
    let global_access_INSERT_OR_UPDATE = DAOServerController.get_dao_dependency_default_granted(
        policyINSERT_OR_UPDATE,
        policy_global_access);
    let global_access_DELETE = DAOServerController.get_dao_dependency_default_granted(
        policyDELETE,
        policy_global_access);

    let inherited_LIST_LABELS = DAOServerController.get_dao_dependency_default_granted(
        policyLIST_LABELS,
        policy_inherited_LIST_LABELS);
    let inherited_READ = DAOServerController.get_dao_dependency_default_granted(
        policyREAD,
        policy_inherited_READ);
    let inherited_INSERT_OR_UPDATE = DAOServerController.get_dao_dependency_default_granted(
        policyINSERT_OR_UPDATE,
        policy_inherited_INSERT_OR_UPDATE);
    let inherited_DELETE = DAOServerController.get_dao_dependency_default_granted(
        policyDELETE,
        policy_inherited_DELETE);

    let policies_dependencies: { [src_pol_id: number]: PolicyDependencyVO[] } = {

        [policyLIST_LABELS.id]: [global_access_LIST_LABELS, inherited_LIST_LABELS],
        [policyREAD.id]: [dependencyREAD, global_access_READ, inherited_READ],
        [policyINSERT_OR_UPDATE.id]: [dependencyINSERT_OR_UPDATE, global_access_INSERT_OR_UPDATE, inherited_INSERT_OR_UPDATE],
        [policyDELETE.id]: [dependencyDELETE, global_access_DELETE, inherited_DELETE],
    };

    expect(AccessPolicyServerController.checkAccessTo(
        policyLIST_LABELS,
        { [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous },
        all_roles,
        null,
        policies,
        policies_dependencies,
        AccessPolicyServerController.role_anonymous
    )).toStrictEqual(false);

    expect(AccessPolicyServerController.checkAccessTo(
        policyREAD,
        { [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous },
        all_roles,
        null,
        policies,
        policies_dependencies,
        AccessPolicyServerController.role_anonymous
    )).toStrictEqual(false);

    expect(AccessPolicyServerController.checkAccessTo(
        policyINSERT_OR_UPDATE,
        { [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous },
        all_roles,
        null,
        policies,
        policies_dependencies,
        AccessPolicyServerController.role_anonymous
    )).toStrictEqual(false);

    expect(AccessPolicyServerController.checkAccessTo(
        policyDELETE,
        { [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous },
        all_roles,
        null,
        policies,
        policies_dependencies,
        AccessPolicyServerController.role_anonymous
    )).toStrictEqual(false);
});



test('AccessPolicyServer: test dao access - !isAccessConfVoType', () => {
    APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

    AccessPolicyServerController.role_anonymous = new RoleVO();
    AccessPolicyServerController.role_anonymous.parent_role_id = null;
    AccessPolicyServerController.role_anonymous.id = 1;
    AccessPolicyServerController.role_anonymous.translatable_name = 'role_anonymous';

    AccessPolicyServerController.role_logged = new RoleVO();
    AccessPolicyServerController.role_logged.parent_role_id = AccessPolicyServerController.role_anonymous.id;
    AccessPolicyServerController.role_logged.id = 2;
    AccessPolicyServerController.role_logged.translatable_name = 'role_logged';

    AccessPolicyServerController.role_admin = new RoleVO();
    AccessPolicyServerController.role_admin.parent_role_id = AccessPolicyServerController.role_logged.id;
    AccessPolicyServerController.role_admin.id = 3;
    AccessPolicyServerController.role_admin.translatable_name = 'role_admin';

    let all_roles: { [role_id: number]: RoleVO } = {
        1: AccessPolicyServerController.role_anonymous,
        2: AccessPolicyServerController.role_logged,
        3: AccessPolicyServerController.role_admin
    };

    let policy_global_access: AccessPolicyVO = new AccessPolicyVO();
    policy_global_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
    policy_global_access.translatable_name = 'policy_global_access';
    policy_global_access.id = 100;


    let pg: AccessPolicyGroupVO = new AccessPolicyGroupVO();
    pg.translatable_name = 'pg';
    pg.id = 1;

    let policyLIST_LABELS: AccessPolicyVO = DAOServerController.get_dao_policy(
        'isAccessConfVoType_LIST_LABELS',
        pg,
        false,
        AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED_TO_ANYONE);
    policyLIST_LABELS.id = 1;

    let policyREAD: AccessPolicyVO = DAOServerController.get_dao_policy(
        'isAccessConfVoType_READ',
        pg,
        false,
        AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED_TO_ANYONE);
    policyREAD.id = 2;

    let policyINSERT_OR_UPDATE: AccessPolicyVO = DAOServerController.get_dao_policy(
        'isAccessConfVoType_INSERT_OR_UPDATE',
        pg,
        false,
        AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN);
    policyINSERT_OR_UPDATE.id = 3;

    let policyDELETE: AccessPolicyVO = DAOServerController.get_dao_policy(
        'isAccessConfVoType_DELETE',
        pg,
        false,
        AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN);
    policyDELETE.id = 4;


    let policies: { [policy_id: number]: AccessPolicyVO } = {
        1: policyLIST_LABELS,
        2: policyREAD,
        3: policyINSERT_OR_UPDATE,
        4: policyDELETE
    };


    let dependencyREAD = DAOServerController.get_dao_dependency_default_denied(policyREAD, policyLIST_LABELS);
    let dependencyINSERT_OR_UPDATE = DAOServerController.get_dao_dependency_default_denied(policyINSERT_OR_UPDATE, policyREAD);
    let dependencyDELETE = DAOServerController.get_dao_dependency_default_denied(policyDELETE, policyREAD);

    let global_access_LIST_LABELS = DAOServerController.get_dao_dependency_default_granted(
        policyLIST_LABELS,
        policy_global_access);
    let global_access_READ = DAOServerController.get_dao_dependency_default_granted(
        policyREAD,
        policy_global_access);
    let global_access_INSERT_OR_UPDATE = DAOServerController.get_dao_dependency_default_granted(
        policyINSERT_OR_UPDATE,
        policy_global_access);
    let global_access_DELETE = DAOServerController.get_dao_dependency_default_granted(
        policyDELETE,
        policy_global_access);

    let policies_dependencies: { [src_pol_id: number]: PolicyDependencyVO[] } = {

        [policyLIST_LABELS.id]: [global_access_LIST_LABELS],
        [policyREAD.id]: [dependencyREAD, global_access_READ],
        [policyINSERT_OR_UPDATE.id]: [dependencyINSERT_OR_UPDATE, global_access_INSERT_OR_UPDATE],
        [policyDELETE.id]: [dependencyDELETE, global_access_DELETE],
    };

    expect(AccessPolicyServerController.checkAccessTo(
        policyLIST_LABELS,
        { [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous },
        all_roles,
        null,
        policies,
        policies_dependencies,
        AccessPolicyServerController.role_anonymous
    )).toStrictEqual(false);

    expect(AccessPolicyServerController.checkAccessTo(
        policyREAD,
        { [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous },
        all_roles,
        null,
        policies,
        policies_dependencies,
        AccessPolicyServerController.role_anonymous
    )).toStrictEqual(false);

    expect(AccessPolicyServerController.checkAccessTo(
        policyINSERT_OR_UPDATE,
        { [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous },
        all_roles,
        null,
        policies,
        policies_dependencies,
        AccessPolicyServerController.role_anonymous
    )).toStrictEqual(false);

    expect(AccessPolicyServerController.checkAccessTo(
        policyDELETE,
        { [AccessPolicyServerController.role_anonymous.id]: AccessPolicyServerController.role_anonymous },
        all_roles,
        null,
        policies,
        policies_dependencies,
        AccessPolicyServerController.role_anonymous
    )).toStrictEqual(false);
});