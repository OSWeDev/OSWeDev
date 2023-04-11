import ServerAPIController from '../../../server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import * as chai from 'chai';
import { expect, assert } from 'chai';
import 'mocha';

import AccessPolicyServerController from '../../../server/modules/AccessPolicy/AccessPolicyServerController';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import RoleVO from '../../../shared/modules/AccessPolicy/vos/RoleVO';
import RolePolicyVO from '../../../shared/modules/AccessPolicy/vos/RolePolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import DAOServerController from '../../../server/modules/DAO/DAOServerController';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';

ConsoleHandler.init();

describe('AccessPolicyServer', () => {

    it('test check access - denied by default to all but admin', () => {

        AccessPolicyServerController.getInstance().role_anonymous = new RoleVO();
        AccessPolicyServerController.getInstance().role_anonymous.parent_role_id = null;
        AccessPolicyServerController.getInstance().role_anonymous.id = 1;
        AccessPolicyServerController.getInstance().role_anonymous.translatable_name = 'role_anonymous';

        AccessPolicyServerController.getInstance().role_logged = new RoleVO();
        AccessPolicyServerController.getInstance().role_logged.parent_role_id = AccessPolicyServerController.getInstance().role_anonymous.id;
        AccessPolicyServerController.getInstance().role_logged.id = 2;
        AccessPolicyServerController.getInstance().role_logged.translatable_name = 'role_logged';

        AccessPolicyServerController.getInstance().role_admin = new RoleVO();
        AccessPolicyServerController.getInstance().role_admin.parent_role_id = AccessPolicyServerController.getInstance().role_logged.id;
        AccessPolicyServerController.getInstance().role_admin.id = 3;
        AccessPolicyServerController.getInstance().role_admin.translatable_name = 'role_admin';

        let all_roles: { [role_id: number]: RoleVO } = {
            1: AccessPolicyServerController.getInstance().role_anonymous,
            2: AccessPolicyServerController.getInstance().role_logged,
            3: AccessPolicyServerController.getInstance().role_admin
        };

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            null,
            null,
            null,
            null,
            null,
            null
        )).to.equal(false);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            new AccessPolicyVO(),
            null,
            all_roles,
            null,
            null,
            null
        )).to.equal(false);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            new AccessPolicyVO(),
            {},
            all_roles,
            {},
            {},
            {}
        )).to.equal(false);

        let policy: AccessPolicyVO = new AccessPolicyVO();
        policy.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        policy.translatable_name = 'test';
        policy.id = 1;
        let policies: { [policy_id: number]: AccessPolicyVO } = {
            1: policy
        };
        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policy,
            null,
            all_roles,
            null,
            policies,
            null
        )).to.equal(false);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policy,
            null,
            all_roles,
            null,
            policies,
            null
        )).to.equal(false);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policy,
            { [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous },
            all_roles,
            null,
            policies,
            null
        )).to.equal(false);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policy,
            { [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged },
            all_roles,
            null,
            policies,
            null
        )).to.equal(false);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policy,
            { [AccessPolicyServerController.getInstance().role_admin.id]: AccessPolicyServerController.getInstance().role_admin },
            all_roles,
            null,
            policies,
            null
        )).to.equal(true);
    });

    it('test check access - role inherit : denied by default to all but admin', () => {
        AccessPolicyServerController.getInstance().role_anonymous = new RoleVO();
        AccessPolicyServerController.getInstance().role_anonymous.parent_role_id = null;
        AccessPolicyServerController.getInstance().role_anonymous.id = 1;
        AccessPolicyServerController.getInstance().role_anonymous.translatable_name = 'role_anonymous';

        AccessPolicyServerController.getInstance().role_logged = new RoleVO();
        AccessPolicyServerController.getInstance().role_logged.parent_role_id = AccessPolicyServerController.getInstance().role_anonymous.id;
        AccessPolicyServerController.getInstance().role_logged.id = 2;
        AccessPolicyServerController.getInstance().role_logged.translatable_name = 'role_logged';

        AccessPolicyServerController.getInstance().role_admin = new RoleVO();
        AccessPolicyServerController.getInstance().role_admin.parent_role_id = AccessPolicyServerController.getInstance().role_logged.id;
        AccessPolicyServerController.getInstance().role_admin.id = 3;
        AccessPolicyServerController.getInstance().role_admin.translatable_name = 'role_admin';

        let all_roles: { [role_id: number]: RoleVO } = {
            1: AccessPolicyServerController.getInstance().role_anonymous,
            2: AccessPolicyServerController.getInstance().role_logged,
            3: AccessPolicyServerController.getInstance().role_admin
        };



        let policy: AccessPolicyVO = new AccessPolicyVO();
        policy.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        policy.translatable_name = 'test';
        policy.id = 1;
        let policies: { [policy_id: number]: AccessPolicyVO } = {
            1: policy
        };

        let new_role: RoleVO = new RoleVO();
        new_role.parent_role_id = AccessPolicyServerController.getInstance().role_logged.id;
        new_role.translatable_name = 'new_role';
        new_role.id = 1001;

        all_roles[new_role.id] = new_role;
        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policy,
            { [new_role.id]: new_role },
            all_roles,
            null,
            policies,
            null
        )).to.equal(false);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policy,
            {
                [new_role.id]: new_role,
                [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous
            },
            all_roles,
            null,
            policies,
            null
        )).to.equal(false);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policy,
            {
                [new_role.id]: new_role,
                [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged
            },
            all_roles,
            null,
            policies,
            null
        )).to.equal(false);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policy,
            {
                [new_role.id]: new_role,
                [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged,
                [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous
            },
            all_roles,
            null,
            policies,
            null
        )).to.equal(false);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policy,
            {
                [new_role.id]: new_role,
                [AccessPolicyServerController.getInstance().role_admin.id]: AccessPolicyServerController.getInstance().role_admin
            },
            all_roles,
            null,
            policies,
            null
        )).to.equal(true);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policy,
            {
                [AccessPolicyServerController.getInstance().role_admin.id]: AccessPolicyServerController.getInstance().role_admin,
                [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged,
                [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous
            },
            all_roles,
            null,
            policies,
            null
        )).to.equal(true);
        delete all_roles[new_role.id];
    });

    it('test check access - inheritance test (ignore explicit policies) - no rp', () => {
        AccessPolicyServerController.getInstance().role_anonymous = new RoleVO();
        AccessPolicyServerController.getInstance().role_anonymous.parent_role_id = null;
        AccessPolicyServerController.getInstance().role_anonymous.id = 1;
        AccessPolicyServerController.getInstance().role_anonymous.translatable_name = 'role_anonymous';

        AccessPolicyServerController.getInstance().role_logged = new RoleVO();
        AccessPolicyServerController.getInstance().role_logged.parent_role_id = AccessPolicyServerController.getInstance().role_anonymous.id;
        AccessPolicyServerController.getInstance().role_logged.id = 2;
        AccessPolicyServerController.getInstance().role_logged.translatable_name = 'role_logged';

        AccessPolicyServerController.getInstance().role_admin = new RoleVO();
        AccessPolicyServerController.getInstance().role_admin.parent_role_id = AccessPolicyServerController.getInstance().role_logged.id;
        AccessPolicyServerController.getInstance().role_admin.id = 3;
        AccessPolicyServerController.getInstance().role_admin.translatable_name = 'role_admin';

        let all_roles: { [role_id: number]: RoleVO } = {
            1: AccessPolicyServerController.getInstance().role_anonymous,
            2: AccessPolicyServerController.getInstance().role_logged,
            3: AccessPolicyServerController.getInstance().role_admin
        };



        let policyA: AccessPolicyVO = new AccessPolicyVO();
        policyA.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        policyA.translatable_name = 'test';
        policyA.id = 1;
        let policies: { [policy_id: number]: AccessPolicyVO } = {
            1: policyA
        };

        let new_role: RoleVO = new RoleVO();
        new_role.parent_role_id = AccessPolicyServerController.getInstance().role_logged.id;
        new_role.translatable_name = 'new_role';
        new_role.id = 1001;

        all_roles[new_role.id] = new_role;

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyA,
            { [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous },
            all_roles,
            null,
            policies,
            null,
            AccessPolicyServerController.getInstance().role_anonymous
        )).to.equal(false);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyA,
            { [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged },
            all_roles,
            null,
            policies,
            null,
            AccessPolicyServerController.getInstance().role_logged
        )).to.equal(false);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyA,
            { [new_role.id]: new_role },
            all_roles,
            null,
            policies,
            null,
            new_role
        )).to.equal(false);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyA,
            { [AccessPolicyServerController.getInstance().role_admin.id]: AccessPolicyServerController.getInstance().role_admin },
            all_roles,
            null,
            policies,
            null,
            AccessPolicyServerController.getInstance().role_admin
        )).to.equal(true);

        delete all_roles[new_role.id];
    });

    it('test check access - inheritance test (ignore explicit policies) - rp anon', () => {
        AccessPolicyServerController.getInstance().role_anonymous = new RoleVO();
        AccessPolicyServerController.getInstance().role_anonymous.parent_role_id = null;
        AccessPolicyServerController.getInstance().role_anonymous.id = 1;
        AccessPolicyServerController.getInstance().role_anonymous.translatable_name = 'role_anonymous';

        AccessPolicyServerController.getInstance().role_logged = new RoleVO();
        AccessPolicyServerController.getInstance().role_logged.parent_role_id = AccessPolicyServerController.getInstance().role_anonymous.id;
        AccessPolicyServerController.getInstance().role_logged.id = 2;
        AccessPolicyServerController.getInstance().role_logged.translatable_name = 'role_logged';

        AccessPolicyServerController.getInstance().role_admin = new RoleVO();
        AccessPolicyServerController.getInstance().role_admin.parent_role_id = AccessPolicyServerController.getInstance().role_logged.id;
        AccessPolicyServerController.getInstance().role_admin.id = 3;
        AccessPolicyServerController.getInstance().role_admin.translatable_name = 'role_admin';

        let all_roles: { [role_id: number]: RoleVO } = {
            1: AccessPolicyServerController.getInstance().role_anonymous,
            2: AccessPolicyServerController.getInstance().role_logged,
            3: AccessPolicyServerController.getInstance().role_admin
        };



        let policyA: AccessPolicyVO = new AccessPolicyVO();
        policyA.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        policyA.translatable_name = 'test';
        policyA.id = 1;
        let policies: { [policy_id: number]: AccessPolicyVO } = {
            1: policyA
        };

        let new_role: RoleVO = new RoleVO();
        new_role.parent_role_id = AccessPolicyServerController.getInstance().role_logged.id;
        new_role.translatable_name = 'new_role';
        new_role.id = 1001;

        all_roles[new_role.id] = new_role;

        let role_policyA: RolePolicyVO = new RolePolicyVO();
        role_policyA.id = 1;
        role_policyA.accpol_id = policyA.id;
        role_policyA.role_id = AccessPolicyServerController.getInstance().role_anonymous.id;
        role_policyA.granted = true;

        let role_policies: { [role_id: number]: { [pol_id: number]: RolePolicyVO } } = {
            [AccessPolicyServerController.getInstance().role_anonymous.id]: {
                [policyA.id]: role_policyA
            }
        };

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyA,
            { [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous },
            all_roles,
            role_policies,
            policies,
            null,
            AccessPolicyServerController.getInstance().role_anonymous
        )).to.equal(false);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyA,
            { [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged },
            all_roles,
            role_policies,
            policies,
            null,
            AccessPolicyServerController.getInstance().role_logged
        )).to.equal(true);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyA,
            {
                [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous,
                [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged
            },
            all_roles,
            role_policies,
            policies,
            null,
            AccessPolicyServerController.getInstance().role_logged
        )).to.equal(true);


        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyA,
            { [new_role.id]: new_role },
            all_roles,
            role_policies,
            policies,
            null,
            new_role
        )).to.equal(true);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyA,
            {
                [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous,
                [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged,
                [new_role.id]: new_role
            },
            all_roles,
            role_policies,
            policies,
            null,
            new_role
        )).to.equal(true);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyA,
            { [AccessPolicyServerController.getInstance().role_admin.id]: AccessPolicyServerController.getInstance().role_admin },
            all_roles,
            role_policies,
            policies,
            null,
            AccessPolicyServerController.getInstance().role_admin
        )).to.equal(true);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyA,
            {
                [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous,
                [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged,
                [AccessPolicyServerController.getInstance().role_admin.id]: AccessPolicyServerController.getInstance().role_admin
            },
            all_roles,
            role_policies,
            policies,
            null,
            AccessPolicyServerController.getInstance().role_admin
        )).to.equal(true);

        delete all_roles[new_role.id];
    });

    it('test check access - inheritance test (ignore explicit policies) - rp logged', () => {
        AccessPolicyServerController.getInstance().role_anonymous = new RoleVO();
        AccessPolicyServerController.getInstance().role_anonymous.parent_role_id = null;
        AccessPolicyServerController.getInstance().role_anonymous.id = 1;
        AccessPolicyServerController.getInstance().role_anonymous.translatable_name = 'role_anonymous';

        AccessPolicyServerController.getInstance().role_logged = new RoleVO();
        AccessPolicyServerController.getInstance().role_logged.parent_role_id = AccessPolicyServerController.getInstance().role_anonymous.id;
        AccessPolicyServerController.getInstance().role_logged.id = 2;
        AccessPolicyServerController.getInstance().role_logged.translatable_name = 'role_logged';

        AccessPolicyServerController.getInstance().role_admin = new RoleVO();
        AccessPolicyServerController.getInstance().role_admin.parent_role_id = AccessPolicyServerController.getInstance().role_logged.id;
        AccessPolicyServerController.getInstance().role_admin.id = 3;
        AccessPolicyServerController.getInstance().role_admin.translatable_name = 'role_admin';

        let all_roles: { [role_id: number]: RoleVO } = {
            1: AccessPolicyServerController.getInstance().role_anonymous,
            2: AccessPolicyServerController.getInstance().role_logged,
            3: AccessPolicyServerController.getInstance().role_admin
        };



        let policyA: AccessPolicyVO = new AccessPolicyVO();
        policyA.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        policyA.translatable_name = 'test';
        policyA.id = 1;
        let policies: { [policy_id: number]: AccessPolicyVO } = {
            1: policyA
        };

        let new_role: RoleVO = new RoleVO();
        new_role.parent_role_id = AccessPolicyServerController.getInstance().role_logged.id;
        new_role.translatable_name = 'new_role';
        new_role.id = 1001;

        all_roles[new_role.id] = new_role;

        let role_policyA: RolePolicyVO = new RolePolicyVO();
        role_policyA.id = 1;
        role_policyA.accpol_id = policyA.id;
        role_policyA.role_id = AccessPolicyServerController.getInstance().role_logged.id;
        role_policyA.granted = true;

        let role_policies: { [role_id: number]: { [pol_id: number]: RolePolicyVO } } = {
            [AccessPolicyServerController.getInstance().role_logged.id]: {
                [policyA.id]: role_policyA
            }
        };

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyA,
            { [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous },
            all_roles,
            role_policies,
            policies,
            null,
            AccessPolicyServerController.getInstance().role_anonymous
        )).to.equal(false);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyA,
            { [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged },
            all_roles,
            role_policies,
            policies,
            null,
            AccessPolicyServerController.getInstance().role_logged
        )).to.equal(false);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyA,
            { [new_role.id]: new_role },
            all_roles,
            role_policies,
            policies,
            null,
            new_role
        )).to.equal(true);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyA,
            { [AccessPolicyServerController.getInstance().role_admin.id]: AccessPolicyServerController.getInstance().role_admin },
            all_roles,
            role_policies,
            policies,
            null,
            AccessPolicyServerController.getInstance().role_admin
        )).to.equal(true);

        delete all_roles[new_role.id];
    });

    it('test check access - inheritance test (ignore explicit policies) - rp inherit logged', () => {
        AccessPolicyServerController.getInstance().role_anonymous = new RoleVO();
        AccessPolicyServerController.getInstance().role_anonymous.parent_role_id = null;
        AccessPolicyServerController.getInstance().role_anonymous.id = 1;
        AccessPolicyServerController.getInstance().role_anonymous.translatable_name = 'role_anonymous';

        AccessPolicyServerController.getInstance().role_logged = new RoleVO();
        AccessPolicyServerController.getInstance().role_logged.parent_role_id = AccessPolicyServerController.getInstance().role_anonymous.id;
        AccessPolicyServerController.getInstance().role_logged.id = 2;
        AccessPolicyServerController.getInstance().role_logged.translatable_name = 'role_logged';

        AccessPolicyServerController.getInstance().role_admin = new RoleVO();
        AccessPolicyServerController.getInstance().role_admin.parent_role_id = AccessPolicyServerController.getInstance().role_logged.id;
        AccessPolicyServerController.getInstance().role_admin.id = 3;
        AccessPolicyServerController.getInstance().role_admin.translatable_name = 'role_admin';

        let all_roles: { [role_id: number]: RoleVO } = {
            1: AccessPolicyServerController.getInstance().role_anonymous,
            2: AccessPolicyServerController.getInstance().role_logged,
            3: AccessPolicyServerController.getInstance().role_admin
        };



        let policyA: AccessPolicyVO = new AccessPolicyVO();
        policyA.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        policyA.translatable_name = 'test';
        policyA.id = 1;
        let policies: { [policy_id: number]: AccessPolicyVO } = {
            1: policyA
        };

        let new_role: RoleVO = new RoleVO();
        new_role.parent_role_id = AccessPolicyServerController.getInstance().role_logged.id;
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

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyA,
            { [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous },
            all_roles,
            role_policies,
            policies,
            null,
            AccessPolicyServerController.getInstance().role_anonymous
        )).to.equal(false);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyA,
            { [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged },
            all_roles,
            role_policies,
            policies,
            null,
            AccessPolicyServerController.getInstance().role_logged
        )).to.equal(false);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyA,
            { [new_role.id]: new_role },
            all_roles,
            role_policies,
            policies,
            null,
            new_role
        )).to.equal(false);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyA,
            { [AccessPolicyServerController.getInstance().role_admin.id]: AccessPolicyServerController.getInstance().role_admin },
            all_roles,
            role_policies,
            policies,
            null,
            AccessPolicyServerController.getInstance().role_admin
        )).to.equal(true);

        delete all_roles[new_role.id];
    });

    it('test check access - inheritance test (ignore explicit policies) - dp granted', () => {
        AccessPolicyServerController.getInstance().role_anonymous = new RoleVO();
        AccessPolicyServerController.getInstance().role_anonymous.parent_role_id = null;
        AccessPolicyServerController.getInstance().role_anonymous.id = 1;
        AccessPolicyServerController.getInstance().role_anonymous.translatable_name = 'role_anonymous';

        AccessPolicyServerController.getInstance().role_logged = new RoleVO();
        AccessPolicyServerController.getInstance().role_logged.parent_role_id = AccessPolicyServerController.getInstance().role_anonymous.id;
        AccessPolicyServerController.getInstance().role_logged.id = 2;
        AccessPolicyServerController.getInstance().role_logged.translatable_name = 'role_logged';

        AccessPolicyServerController.getInstance().role_admin = new RoleVO();
        AccessPolicyServerController.getInstance().role_admin.parent_role_id = AccessPolicyServerController.getInstance().role_logged.id;
        AccessPolicyServerController.getInstance().role_admin.id = 3;
        AccessPolicyServerController.getInstance().role_admin.translatable_name = 'role_admin';

        let all_roles: { [role_id: number]: RoleVO } = {
            1: AccessPolicyServerController.getInstance().role_anonymous,
            2: AccessPolicyServerController.getInstance().role_logged,
            3: AccessPolicyServerController.getInstance().role_admin
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
        new_role.parent_role_id = AccessPolicyServerController.getInstance().role_logged.id;
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

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyA,
            { [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous },
            all_roles,
            null,
            policies,
            policies_dependencies,
            AccessPolicyServerController.getInstance().role_anonymous
        )).to.equal(false);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyA,
            { [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged },
            all_roles,
            null,
            policies,
            policies_dependencies,
            AccessPolicyServerController.getInstance().role_logged
        )).to.equal(true);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyA,
            { [new_role.id]: new_role },
            all_roles,
            null,
            policies,
            policies_dependencies,
            new_role
        )).to.equal(true);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyA,
            { [AccessPolicyServerController.getInstance().role_admin.id]: AccessPolicyServerController.getInstance().role_admin },
            all_roles,
            null,
            policies,
            policies_dependencies,
            AccessPolicyServerController.getInstance().role_admin
        )).to.equal(true);

        delete all_roles[new_role.id];
    });

    it('test check access - inheritance test (ignore explicit policies) - dp denied', () => {
        AccessPolicyServerController.getInstance().role_anonymous = new RoleVO();
        AccessPolicyServerController.getInstance().role_anonymous.parent_role_id = null;
        AccessPolicyServerController.getInstance().role_anonymous.id = 1;
        AccessPolicyServerController.getInstance().role_anonymous.translatable_name = 'role_anonymous';

        AccessPolicyServerController.getInstance().role_logged = new RoleVO();
        AccessPolicyServerController.getInstance().role_logged.parent_role_id = AccessPolicyServerController.getInstance().role_anonymous.id;
        AccessPolicyServerController.getInstance().role_logged.id = 2;
        AccessPolicyServerController.getInstance().role_logged.translatable_name = 'role_logged';

        AccessPolicyServerController.getInstance().role_admin = new RoleVO();
        AccessPolicyServerController.getInstance().role_admin.parent_role_id = AccessPolicyServerController.getInstance().role_logged.id;
        AccessPolicyServerController.getInstance().role_admin.id = 3;
        AccessPolicyServerController.getInstance().role_admin.translatable_name = 'role_admin';

        let all_roles: { [role_id: number]: RoleVO } = {
            1: AccessPolicyServerController.getInstance().role_anonymous,
            2: AccessPolicyServerController.getInstance().role_logged,
            3: AccessPolicyServerController.getInstance().role_admin
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
        new_role.parent_role_id = AccessPolicyServerController.getInstance().role_logged.id;
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

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyA,
            { [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous },
            all_roles,
            null,
            policies,
            policies_dependencies,
            AccessPolicyServerController.getInstance().role_anonymous
        )).to.equal(false);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyA,
            { [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged },
            all_roles,
            null,
            policies,
            policies_dependencies,
            AccessPolicyServerController.getInstance().role_logged
        )).to.equal(false);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyA,
            { [new_role.id]: new_role },
            all_roles,
            null,
            policies,
            policies_dependencies,
            new_role
        )).to.equal(false);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyA,
            { [AccessPolicyServerController.getInstance().role_admin.id]: AccessPolicyServerController.getInstance().role_admin },
            all_roles,
            null,
            policies,
            policies_dependencies,
            AccessPolicyServerController.getInstance().role_admin
        )).to.equal(true);

        delete all_roles[new_role.id];
    });

    it('test check access - policy explicit configuration', () => {

        AccessPolicyServerController.getInstance().role_anonymous = new RoleVO();
        AccessPolicyServerController.getInstance().role_anonymous.parent_role_id = null;
        AccessPolicyServerController.getInstance().role_anonymous.id = 1;
        AccessPolicyServerController.getInstance().role_anonymous.translatable_name = 'role_anonymous';

        AccessPolicyServerController.getInstance().role_logged = new RoleVO();
        AccessPolicyServerController.getInstance().role_logged.parent_role_id = AccessPolicyServerController.getInstance().role_anonymous.id;
        AccessPolicyServerController.getInstance().role_logged.id = 2;
        AccessPolicyServerController.getInstance().role_logged.translatable_name = 'role_logged';

        AccessPolicyServerController.getInstance().role_admin = new RoleVO();
        AccessPolicyServerController.getInstance().role_admin.parent_role_id = AccessPolicyServerController.getInstance().role_logged.id;
        AccessPolicyServerController.getInstance().role_admin.id = 3;
        AccessPolicyServerController.getInstance().role_admin.translatable_name = 'role_admin';

        let all_roles: { [role_id: number]: RoleVO } = {
            1: AccessPolicyServerController.getInstance().role_anonymous,
            2: AccessPolicyServerController.getInstance().role_logged,
            3: AccessPolicyServerController.getInstance().role_admin
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
        role_policy.role_id = AccessPolicyServerController.getInstance().role_logged.id;
        role_policy.granted = false;

        let role_policies: { [role_id: number]: { [pol_id: number]: RolePolicyVO } } = {
            [AccessPolicyServerController.getInstance().role_logged.id]: {
                [policy.id]: role_policy
            }
        };

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policy,
            null,
            all_roles,
            role_policies,
            policies,
            null
        )).to.equal(false);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policy,
            { [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous },
            all_roles,
            role_policies,
            policies,
            null
        )).to.equal(false);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policy,
            { [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged },
            all_roles,
            role_policies,
            policies,
            null
        )).to.equal(false);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policy,
            { [AccessPolicyServerController.getInstance().role_admin.id]: AccessPolicyServerController.getInstance().role_admin },
            all_roles,
            role_policies,
            policies,
            null
        )).to.equal(true);


        policy.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ANONYMOUS;
        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policy,
            { [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous },
            all_roles,
            role_policies,
            policies,
            null
        )).to.equal(false);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policy,
            { [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged },
            all_roles,
            role_policies,
            policies,
            null
        )).to.equal(false);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policy,
            { [AccessPolicyServerController.getInstance().role_admin.id]: AccessPolicyServerController.getInstance().role_admin },
            all_roles,
            role_policies,
            policies,
            null
        )).to.equal(true);
    });

    it('test check access - policy explicit inheritance', () => {

        AccessPolicyServerController.getInstance().role_anonymous = new RoleVO();
        AccessPolicyServerController.getInstance().role_anonymous.parent_role_id = null;
        AccessPolicyServerController.getInstance().role_anonymous.id = 1;
        AccessPolicyServerController.getInstance().role_anonymous.translatable_name = 'role_anonymous';

        AccessPolicyServerController.getInstance().role_logged = new RoleVO();
        AccessPolicyServerController.getInstance().role_logged.parent_role_id = AccessPolicyServerController.getInstance().role_anonymous.id;
        AccessPolicyServerController.getInstance().role_logged.id = 2;
        AccessPolicyServerController.getInstance().role_logged.translatable_name = 'role_logged';

        AccessPolicyServerController.getInstance().role_admin = new RoleVO();
        AccessPolicyServerController.getInstance().role_admin.parent_role_id = AccessPolicyServerController.getInstance().role_logged.id;
        AccessPolicyServerController.getInstance().role_admin.id = 3;
        AccessPolicyServerController.getInstance().role_admin.translatable_name = 'role_admin';

        let all_roles: { [role_id: number]: RoleVO } = {
            1: AccessPolicyServerController.getInstance().role_anonymous,
            2: AccessPolicyServerController.getInstance().role_logged,
            3: AccessPolicyServerController.getInstance().role_admin
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
        role_policy.role_id = AccessPolicyServerController.getInstance().role_logged.id;
        role_policy.granted = false;

        let role_policies: { [role_id: number]: { [pol_id: number]: RolePolicyVO } } = {
            [AccessPolicyServerController.getInstance().role_logged.id]: {
                [policy.id]: role_policy
            }
        };

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policy,
            { [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous },
            all_roles,
            role_policies,
            policies,
            null
        )).to.equal(true);

        // ATTENTION : un rôle ne peut pas avoir moins d'accès que son parent
        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policy,
            { [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged },
            all_roles,
            role_policies,
            policies,
            null
        )).to.equal(true);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policy,
            { [AccessPolicyServerController.getInstance().role_admin.id]: AccessPolicyServerController.getInstance().role_admin },
            all_roles,
            role_policies,
            policies,
            null
        )).to.equal(true);
    });

    it('test check access - policy explicit dependency', () => {

        AccessPolicyServerController.getInstance().role_anonymous = new RoleVO();
        AccessPolicyServerController.getInstance().role_anonymous.parent_role_id = null;
        AccessPolicyServerController.getInstance().role_anonymous.id = 1;
        AccessPolicyServerController.getInstance().role_anonymous.translatable_name = 'role_anonymous';

        AccessPolicyServerController.getInstance().role_logged = new RoleVO();
        AccessPolicyServerController.getInstance().role_logged.parent_role_id = AccessPolicyServerController.getInstance().role_anonymous.id;
        AccessPolicyServerController.getInstance().role_logged.id = 2;
        AccessPolicyServerController.getInstance().role_logged.translatable_name = 'role_logged';

        AccessPolicyServerController.getInstance().role_admin = new RoleVO();
        AccessPolicyServerController.getInstance().role_admin.parent_role_id = AccessPolicyServerController.getInstance().role_logged.id;
        AccessPolicyServerController.getInstance().role_admin.id = 3;
        AccessPolicyServerController.getInstance().role_admin.translatable_name = 'role_admin';

        let all_roles: { [role_id: number]: RoleVO } = {
            1: AccessPolicyServerController.getInstance().role_anonymous,
            2: AccessPolicyServerController.getInstance().role_logged,
            3: AccessPolicyServerController.getInstance().role_admin
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
        role_policyA.role_id = AccessPolicyServerController.getInstance().role_anonymous.id;
        role_policyA.granted = true;

        let role_policies: { [role_id: number]: { [pol_id: number]: RolePolicyVO } } = {
            [AccessPolicyServerController.getInstance().role_logged.id]: {
                [policyA.id]: role_policyA
            }
        };

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyA,
            { [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged },
            all_roles,
            role_policies,
            policies,
            null
        )).to.equal(true);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyB,
            { [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged },
            all_roles,
            role_policies,
            policies,
            null
        )).to.equal(false);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyB,
            { [AccessPolicyServerController.getInstance().role_admin.id]: AccessPolicyServerController.getInstance().role_admin },
            all_roles,
            role_policies,
            policies,
            null
        )).to.equal(true);


        let dependency: PolicyDependencyVO = new PolicyDependencyVO();
        dependency.id = 1;
        dependency.src_pol_id = policyA.id;
        dependency.depends_on_pol_id = policyB.id;
        dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED;
        let policies_dependencies: { [src_pol_id: number]: PolicyDependencyVO[] } = {
            [policyA.id]: [dependency]
        };

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyB,
            { [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged },
            all_roles,
            role_policies,
            policies,
            policies_dependencies
        )).to.equal(false);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyB,
            { [AccessPolicyServerController.getInstance().role_admin.id]: AccessPolicyServerController.getInstance().role_admin },
            all_roles,
            role_policies,
            policies,
            policies_dependencies
        )).to.equal(true);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyA,
            { [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged },
            all_roles,
            role_policies,
            policies,
            policies_dependencies
        )).to.equal(true);

        // L'admin a juste accès à tout
        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyA,
            { [AccessPolicyServerController.getInstance().role_admin.id]: AccessPolicyServerController.getInstance().role_admin },
            all_roles,
            role_policies,
            policies,
            policies_dependencies
        )).to.equal(true);

        dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyA,
            { [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged },
            all_roles,
            role_policies,
            policies,
            policies_dependencies
        )).to.equal(false);

        let role_policyB: RolePolicyVO = new RolePolicyVO();
        role_policyB.id = 2;
        role_policyB.accpol_id = policyB.id;
        role_policyB.role_id = AccessPolicyServerController.getInstance().role_anonymous.id;
        role_policyB.granted = true;

        role_policies[AccessPolicyServerController.getInstance().role_anonymous.id] = {};
        role_policies[AccessPolicyServerController.getInstance().role_anonymous.id][policyB.id] = role_policyB;

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyA,
            { [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous },
            all_roles,
            role_policies,
            policies,
            policies_dependencies
        )).to.equal(true);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyA,
            { [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged },
            all_roles,
            role_policies,
            policies,
            policies_dependencies
        )).to.equal(true);


        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyA,
            { [AccessPolicyServerController.getInstance().role_admin.id]: AccessPolicyServerController.getInstance().role_admin },
            all_roles,
            role_policies,
            policies,
            policies_dependencies
        )).to.equal(true);

        role_policyB.granted = false;

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyA,
            { [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous },
            all_roles,
            role_policies,
            policies,
            policies_dependencies
        )).to.equal(false);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyA,
            { [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged },
            all_roles,
            role_policies,
            policies,
            policies_dependencies
        )).to.equal(false);


        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyA,
            { [AccessPolicyServerController.getInstance().role_admin.id]: AccessPolicyServerController.getInstance().role_admin },
            all_roles,
            role_policies,
            policies,
            policies_dependencies
        )).to.equal(true);

        role_policyA.granted = false;
        role_policyB.granted = true;

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyA,
            { [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous },
            all_roles,
            role_policies,
            policies,
            policies_dependencies
        )).to.equal(true);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyA,
            { [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged },
            all_roles,
            role_policies,
            policies,
            policies_dependencies
        )).to.equal(true);


        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyA,
            { [AccessPolicyServerController.getInstance().role_admin.id]: AccessPolicyServerController.getInstance().role_admin },
            all_roles,
            role_policies,
            policies,
            policies_dependencies
        )).to.equal(true);
    });

    it('test check access - policy multiple dependencies defaults GRANTED', () => {

        AccessPolicyServerController.getInstance().role_anonymous = new RoleVO();
        AccessPolicyServerController.getInstance().role_anonymous.parent_role_id = null;
        AccessPolicyServerController.getInstance().role_anonymous.id = 1;
        AccessPolicyServerController.getInstance().role_anonymous.translatable_name = 'role_anonymous';

        AccessPolicyServerController.getInstance().role_logged = new RoleVO();
        AccessPolicyServerController.getInstance().role_logged.parent_role_id = AccessPolicyServerController.getInstance().role_anonymous.id;
        AccessPolicyServerController.getInstance().role_logged.id = 2;
        AccessPolicyServerController.getInstance().role_logged.translatable_name = 'role_logged';

        AccessPolicyServerController.getInstance().role_admin = new RoleVO();
        AccessPolicyServerController.getInstance().role_admin.parent_role_id = AccessPolicyServerController.getInstance().role_logged.id;
        AccessPolicyServerController.getInstance().role_admin.id = 3;
        AccessPolicyServerController.getInstance().role_admin.translatable_name = 'role_admin';

        let all_roles: { [role_id: number]: RoleVO } = {
            1: AccessPolicyServerController.getInstance().role_anonymous,
            2: AccessPolicyServerController.getInstance().role_logged,
            3: AccessPolicyServerController.getInstance().role_admin
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
        role_policyA.role_id = AccessPolicyServerController.getInstance().role_logged.id;
        role_policyA.granted = true;

        let role_policyB: RolePolicyVO = new RolePolicyVO();
        role_policyB.id = 2;
        role_policyB.accpol_id = policyB.id;
        role_policyB.role_id = AccessPolicyServerController.getInstance().role_logged.id;
        role_policyB.granted = true;

        let role_policies: { [role_id: number]: { [pol_id: number]: RolePolicyVO } } = {
            [AccessPolicyServerController.getInstance().role_logged.id]: {
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

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyC,
            { [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous },
            all_roles,
            role_policies,
            policies,
            policies_dependencies
        )).to.equal(false);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyC,
            { [AccessPolicyServerController.getInstance().role_admin.id]: AccessPolicyServerController.getInstance().role_admin },
            all_roles,
            role_policies,
            policies,
            policies_dependencies
        )).to.equal(true);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyC,
            { [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged },
            all_roles,
            role_policies,
            policies,
            policies_dependencies
        )).to.equal(true);

        role_policyB.granted = false;

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyC,
            { [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged },
            all_roles,
            role_policies,
            policies,
            policies_dependencies
        )).to.equal(true);

        role_policyA.granted = false;

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyC,
            { [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged },
            all_roles,
            role_policies,
            policies,
            policies_dependencies
        )).to.equal(false);

        role_policyB.granted = true;

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyC,
            { [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged },
            all_roles,
            role_policies,
            policies,
            policies_dependencies
        )).to.equal(true);

        role_policyA.granted = true;

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyC,
            { [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged },
            all_roles,
            role_policies,
            policies,
            policies_dependencies
        )).to.equal(true);
    });

    it('test check access - policy multiple dependencies defaults DENIED', () => {

        AccessPolicyServerController.getInstance().role_anonymous = new RoleVO();
        AccessPolicyServerController.getInstance().role_anonymous.parent_role_id = null;
        AccessPolicyServerController.getInstance().role_anonymous.id = 1;
        AccessPolicyServerController.getInstance().role_anonymous.translatable_name = 'role_anonymous';

        AccessPolicyServerController.getInstance().role_logged = new RoleVO();
        AccessPolicyServerController.getInstance().role_logged.parent_role_id = AccessPolicyServerController.getInstance().role_anonymous.id;
        AccessPolicyServerController.getInstance().role_logged.id = 2;
        AccessPolicyServerController.getInstance().role_logged.translatable_name = 'role_logged';

        AccessPolicyServerController.getInstance().role_admin = new RoleVO();
        AccessPolicyServerController.getInstance().role_admin.parent_role_id = AccessPolicyServerController.getInstance().role_logged.id;
        AccessPolicyServerController.getInstance().role_admin.id = 3;
        AccessPolicyServerController.getInstance().role_admin.translatable_name = 'role_admin';

        let all_roles: { [role_id: number]: RoleVO } = {
            1: AccessPolicyServerController.getInstance().role_anonymous,
            2: AccessPolicyServerController.getInstance().role_logged,
            3: AccessPolicyServerController.getInstance().role_admin
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
        role_policyA.role_id = AccessPolicyServerController.getInstance().role_logged.id;
        role_policyA.granted = true;

        let role_policyB: RolePolicyVO = new RolePolicyVO();
        role_policyB.id = 2;
        role_policyB.accpol_id = policyB.id;
        role_policyB.role_id = AccessPolicyServerController.getInstance().role_logged.id;
        role_policyB.granted = true;

        let role_policies: { [role_id: number]: { [pol_id: number]: RolePolicyVO } } = {
            [AccessPolicyServerController.getInstance().role_logged.id]: {
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

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyC,
            { [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous },
            all_roles,
            role_policies,
            policies,
            policies_dependencies
        )).to.equal(false);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyC,
            { [AccessPolicyServerController.getInstance().role_admin.id]: AccessPolicyServerController.getInstance().role_admin },
            all_roles,
            role_policies,
            policies,
            policies_dependencies
        )).to.equal(true);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyC,
            { [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged },
            all_roles,
            role_policies,
            policies,
            policies_dependencies
        )).to.equal(false);

        role_policyB.granted = false;

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyC,
            { [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged },
            all_roles,
            role_policies,
            policies,
            policies_dependencies
        )).to.equal(false);

        role_policyA.granted = false;

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyC,
            { [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged },
            all_roles,
            role_policies,
            policies,
            policies_dependencies
        )).to.equal(false);

        role_policyB.granted = true;

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyC,
            { [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged },
            all_roles,
            role_policies,
            policies,
            policies_dependencies
        )).to.equal(false);

        role_policyA.granted = true;

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyC,
            { [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged },
            all_roles,
            role_policies,
            policies,
            policies_dependencies
        )).to.equal(false);
    });

    it('test check access - policy multiple dependencies different defaults', () => {

        AccessPolicyServerController.getInstance().role_anonymous = new RoleVO();
        AccessPolicyServerController.getInstance().role_anonymous.parent_role_id = null;
        AccessPolicyServerController.getInstance().role_anonymous.id = 1;
        AccessPolicyServerController.getInstance().role_anonymous.translatable_name = 'role_anonymous';

        AccessPolicyServerController.getInstance().role_logged = new RoleVO();
        AccessPolicyServerController.getInstance().role_logged.parent_role_id = AccessPolicyServerController.getInstance().role_anonymous.id;
        AccessPolicyServerController.getInstance().role_logged.id = 2;
        AccessPolicyServerController.getInstance().role_logged.translatable_name = 'role_logged';

        AccessPolicyServerController.getInstance().role_admin = new RoleVO();
        AccessPolicyServerController.getInstance().role_admin.parent_role_id = AccessPolicyServerController.getInstance().role_logged.id;
        AccessPolicyServerController.getInstance().role_admin.id = 3;
        AccessPolicyServerController.getInstance().role_admin.translatable_name = 'role_admin';

        let all_roles: { [role_id: number]: RoleVO } = {
            1: AccessPolicyServerController.getInstance().role_anonymous,
            2: AccessPolicyServerController.getInstance().role_logged,
            3: AccessPolicyServerController.getInstance().role_admin
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
        role_policyA.role_id = AccessPolicyServerController.getInstance().role_logged.id;
        role_policyA.granted = true;

        let role_policyB: RolePolicyVO = new RolePolicyVO();
        role_policyB.id = 2;
        role_policyB.accpol_id = policyB.id;
        role_policyB.role_id = AccessPolicyServerController.getInstance().role_logged.id;
        role_policyB.granted = true;

        let role_policies: { [role_id: number]: { [pol_id: number]: RolePolicyVO } } = {
            [AccessPolicyServerController.getInstance().role_logged.id]: {
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

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyC,
            { [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous },
            all_roles,
            role_policies,
            policies,
            policies_dependencies
        )).to.equal(false);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyC,
            { [AccessPolicyServerController.getInstance().role_admin.id]: AccessPolicyServerController.getInstance().role_admin },
            all_roles,
            role_policies,
            policies,
            policies_dependencies
        )).to.equal(true);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyC,
            { [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged },
            all_roles,
            role_policies,
            policies,
            policies_dependencies
        )).to.equal(true);

        role_policyB.granted = false;

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyC,
            { [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged },
            all_roles,
            role_policies,
            policies,
            policies_dependencies
        )).to.equal(false);

        role_policyA.granted = false;

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyC,
            { [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged },
            all_roles,
            role_policies,
            policies,
            policies_dependencies
        )).to.equal(false);

        role_policyB.granted = true;

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyC,
            { [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged },
            all_roles,
            role_policies,
            policies,
            policies_dependencies
        )).to.equal(false);

        role_policyA.granted = true;

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyC,
            { [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged },
            all_roles,
            role_policies,
            policies,
            policies_dependencies
        )).to.equal(true);
    });

    it('test getUsersRoles', () => {

        AccessPolicyServerController.getInstance().role_anonymous = new RoleVO();
        AccessPolicyServerController.getInstance().role_anonymous.parent_role_id = null;
        AccessPolicyServerController.getInstance().role_anonymous.id = 1;
        AccessPolicyServerController.getInstance().role_anonymous.translatable_name = 'role_anonymous';

        AccessPolicyServerController.getInstance().role_logged = new RoleVO();
        AccessPolicyServerController.getInstance().role_logged.parent_role_id = AccessPolicyServerController.getInstance().role_anonymous.id;
        AccessPolicyServerController.getInstance().role_logged.id = 2;
        AccessPolicyServerController.getInstance().role_logged.translatable_name = 'role_logged';

        AccessPolicyServerController.getInstance().role_admin = new RoleVO();
        AccessPolicyServerController.getInstance().role_admin.parent_role_id = AccessPolicyServerController.getInstance().role_logged.id;
        AccessPolicyServerController.getInstance().role_admin.id = 3;
        AccessPolicyServerController.getInstance().role_admin.translatable_name = 'role_admin';

        let all_roles: { [role_id: number]: RoleVO } = {
            1: AccessPolicyServerController.getInstance().role_anonymous,
            2: AccessPolicyServerController.getInstance().role_logged,
            3: AccessPolicyServerController.getInstance().role_admin
        };



        let new_role: RoleVO = new RoleVO();
        new_role.parent_role_id = AccessPolicyServerController.getInstance().role_logged.id;
        new_role.translatable_name = 'new_role';
        new_role.id = 1001;

        all_roles[new_role.id] = new_role;
        expect(AccessPolicyServerController.getInstance().getUsersRoles(false, null, null, null)).to.deep.equal({
            [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous
        });

        expect(AccessPolicyServerController.getInstance().getUsersRoles(false, null, [], all_roles)).to.deep.equal({
            [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous
        });

        expect(AccessPolicyServerController.getInstance().getUsersRoles(true, null, [], all_roles)).to.deep.equal({
            [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous,
            [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged
        });

        expect(AccessPolicyServerController.getInstance().getUsersRoles(true, null, null, all_roles)).to.deep.equal({
            [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous,
            [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged
        });

        expect(AccessPolicyServerController.getInstance().getUsersRoles(true, null, [
            AccessPolicyServerController.getInstance().role_anonymous
        ], all_roles)).to.deep.equal({
            [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous,
            [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged
        });

        expect(AccessPolicyServerController.getInstance().getUsersRoles(true, null, [
            AccessPolicyServerController.getInstance().role_anonymous,
            AccessPolicyServerController.getInstance().role_logged
        ], all_roles)).to.deep.equal({
            [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged,
            [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous
        });

        expect(AccessPolicyServerController.getInstance().getUsersRoles(true, null, [
            new_role
        ], all_roles)).to.deep.equal({
            [new_role.id]: new_role,
            [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged,
            [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous
        });

        expect(AccessPolicyServerController.getInstance().getUsersRoles(true, null, [
            AccessPolicyServerController.getInstance().role_admin
        ], all_roles)).to.deep.equal({
            [AccessPolicyServerController.getInstance().role_admin.id]: AccessPolicyServerController.getInstance().role_admin,
            [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged,
            [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous
        });

        delete all_roles[new_role.id];
    });

    it('test check access - inheritance test - complex - dont inherit role policy when dependency not validated', () => {
        AccessPolicyServerController.getInstance().role_anonymous = new RoleVO();
        AccessPolicyServerController.getInstance().role_anonymous.parent_role_id = null;
        AccessPolicyServerController.getInstance().role_anonymous.id = 1;
        AccessPolicyServerController.getInstance().role_anonymous.translatable_name = 'role_anonymous';

        AccessPolicyServerController.getInstance().role_logged = new RoleVO();
        AccessPolicyServerController.getInstance().role_logged.parent_role_id = AccessPolicyServerController.getInstance().role_anonymous.id;
        AccessPolicyServerController.getInstance().role_logged.id = 2;
        AccessPolicyServerController.getInstance().role_logged.translatable_name = 'role_logged';

        AccessPolicyServerController.getInstance().role_admin = new RoleVO();
        AccessPolicyServerController.getInstance().role_admin.parent_role_id = AccessPolicyServerController.getInstance().role_logged.id;
        AccessPolicyServerController.getInstance().role_admin.id = 3;
        AccessPolicyServerController.getInstance().role_admin.translatable_name = 'role_admin';

        let all_roles: { [role_id: number]: RoleVO } = {
            1: AccessPolicyServerController.getInstance().role_anonymous,
            2: AccessPolicyServerController.getInstance().role_logged,
            3: AccessPolicyServerController.getInstance().role_admin
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
        role_policyA.role_id = AccessPolicyServerController.getInstance().role_logged.id;
        role_policyA.granted = true;

        let role_policyB: RolePolicyVO = new RolePolicyVO();
        role_policyB.id = 2;
        role_policyB.accpol_id = policyB.id;
        role_policyB.role_id = AccessPolicyServerController.getInstance().role_anonymous.id;
        role_policyB.granted = true;

        let role_policies: { [role_id: number]: { [pol_id: number]: RolePolicyVO } } = {
            [AccessPolicyServerController.getInstance().role_anonymous.id]: {
                [policyB.id]: role_policyB
            },
            [AccessPolicyServerController.getInstance().role_logged.id]: {
                [policyA.id]: role_policyA
            }
        };

        // anon ne peut hériter dans ce contexte, et pas de droit anon sur A
        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyA,
            { [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous },
            all_roles,
            role_policies,
            policies,
            policies_dependencies,
            AccessPolicyServerController.getInstance().role_anonymous
        )).to.equal(false);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyA,
            { [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous },
            all_roles,
            role_policies,
            policies,
            policies_dependencies
        )).to.equal(false);

        // Anon sur B nécessite anon A donc false pour les 2
        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyB,
            { [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous },
            all_roles,
            role_policies,
            policies,
            policies_dependencies,
            AccessPolicyServerController.getInstance().role_anonymous
        )).to.equal(false);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyB,
            { [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous },
            all_roles,
            role_policies,
            policies,
            policies_dependencies
        )).to.equal(false);

        // logged sur A ok, mais pas hérité
        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyA,
            { [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged },
            all_roles,
            role_policies,
            policies,
            policies_dependencies,
            AccessPolicyServerController.getInstance().role_logged
        )).to.equal(false);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyA,
            { [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged },
            all_roles,
            role_policies,
            policies,
            policies_dependencies
        )).to.equal(true);

        // logged sur B nécessite A (ok) mais ne peut hériter de B sur anon puisque A anon est invalide
        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyB,
            { [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged },
            all_roles,
            role_policies,
            policies,
            policies_dependencies,
            AccessPolicyServerController.getInstance().role_logged
        )).to.equal(false);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyB,
            { [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged },
            all_roles,
            role_policies,
            policies,
            policies_dependencies
        )).to.equal(false);
    });


    it('test dao access - isAccessConfVoType && inherited', () => {
        AccessPolicyServerController.getInstance().role_anonymous = new RoleVO();
        AccessPolicyServerController.getInstance().role_anonymous.parent_role_id = null;
        AccessPolicyServerController.getInstance().role_anonymous.id = 1;
        AccessPolicyServerController.getInstance().role_anonymous.translatable_name = 'role_anonymous';

        AccessPolicyServerController.getInstance().role_logged = new RoleVO();
        AccessPolicyServerController.getInstance().role_logged.parent_role_id = AccessPolicyServerController.getInstance().role_anonymous.id;
        AccessPolicyServerController.getInstance().role_logged.id = 2;
        AccessPolicyServerController.getInstance().role_logged.translatable_name = 'role_logged';

        AccessPolicyServerController.getInstance().role_admin = new RoleVO();
        AccessPolicyServerController.getInstance().role_admin.parent_role_id = AccessPolicyServerController.getInstance().role_logged.id;
        AccessPolicyServerController.getInstance().role_admin.id = 3;
        AccessPolicyServerController.getInstance().role_admin.translatable_name = 'role_admin';

        let all_roles: { [role_id: number]: RoleVO } = {
            1: AccessPolicyServerController.getInstance().role_anonymous,
            2: AccessPolicyServerController.getInstance().role_logged,
            3: AccessPolicyServerController.getInstance().role_admin
        };

        let policy_global_access: AccessPolicyVO = new AccessPolicyVO();
        policy_global_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        policy_global_access.translatable_name = 'policy_global_access';
        policy_global_access.id = 100;


        let pg_inherited: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        pg_inherited.translatable_name = 'pg_inherited';
        pg_inherited.id = 2;

        let policy_inherited_LIST_LABELS: AccessPolicyVO = DAOServerController.getInstance().get_dao_policy(
            'isAccessConfVoType_inherited.LIST_LABELS',
            pg_inherited,
            true,
            AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED_TO_ANYONE);
        policy_inherited_LIST_LABELS.id = 11;

        let policy_inherited_READ: AccessPolicyVO = DAOServerController.getInstance().get_dao_policy(
            'isAccessConfVoType_inherited_READ',
            pg_inherited,
            true,
            AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED_TO_ANYONE);
        policy_inherited_READ.id = 12;

        let policy_inherited_INSERT_OR_UPDATE: AccessPolicyVO = DAOServerController.getInstance().get_dao_policy(
            'isAccessConfVoType_inherited_INSERT_OR_UPDATE',
            pg_inherited,
            true,
            AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN);
        policy_inherited_INSERT_OR_UPDATE.id = 13;

        let policy_inherited_DELETE: AccessPolicyVO = DAOServerController.getInstance().get_dao_policy(
            'isAccessConfVoType_inherited_DELETE',
            pg_inherited,
            true,
            AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN);
        policy_inherited_DELETE.id = 14;



        let pg: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        pg.translatable_name = 'pg';
        pg.id = 1;

        let policyLIST_LABELS: AccessPolicyVO = DAOServerController.getInstance().get_dao_policy(
            'isAccessConfVoType_LIST_LABELS',
            pg,
            true,
            AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED_TO_ANYONE);
        policyLIST_LABELS.id = 1;

        let policyREAD: AccessPolicyVO = DAOServerController.getInstance().get_dao_policy(
            'isAccessConfVoType_READ',
            pg,
            true,
            AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED_TO_ANYONE);
        policyREAD.id = 2;

        let policyINSERT_OR_UPDATE: AccessPolicyVO = DAOServerController.getInstance().get_dao_policy(
            'isAccessConfVoType_INSERT_OR_UPDATE',
            pg,
            true,
            AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN);
        policyINSERT_OR_UPDATE.id = 3;

        let policyDELETE: AccessPolicyVO = DAOServerController.getInstance().get_dao_policy(
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


        let dependencyREAD = DAOServerController.getInstance().get_dao_dependency_default_denied(policyREAD, policyLIST_LABELS);
        let dependencyINSERT_OR_UPDATE = DAOServerController.getInstance().get_dao_dependency_default_denied(policyINSERT_OR_UPDATE, policyREAD);
        let dependencyDELETE = DAOServerController.getInstance().get_dao_dependency_default_denied(policyDELETE, policyREAD);

        let global_access_LIST_LABELS = DAOServerController.getInstance().get_dao_dependency_default_granted(
            policyLIST_LABELS,
            policy_global_access);
        let global_access_READ = DAOServerController.getInstance().get_dao_dependency_default_granted(
            policyREAD,
            policy_global_access);
        let global_access_INSERT_OR_UPDATE = DAOServerController.getInstance().get_dao_dependency_default_granted(
            policyINSERT_OR_UPDATE,
            policy_global_access);
        let global_access_DELETE = DAOServerController.getInstance().get_dao_dependency_default_granted(
            policyDELETE,
            policy_global_access);

        let inherited_LIST_LABELS = DAOServerController.getInstance().get_dao_dependency_default_granted(
            policyLIST_LABELS,
            policy_inherited_LIST_LABELS);
        let inherited_READ = DAOServerController.getInstance().get_dao_dependency_default_granted(
            policyREAD,
            policy_inherited_READ);
        let inherited_INSERT_OR_UPDATE = DAOServerController.getInstance().get_dao_dependency_default_granted(
            policyINSERT_OR_UPDATE,
            policy_inherited_INSERT_OR_UPDATE);
        let inherited_DELETE = DAOServerController.getInstance().get_dao_dependency_default_granted(
            policyDELETE,
            policy_inherited_DELETE);

        let policies_dependencies: { [src_pol_id: number]: PolicyDependencyVO[] } = {

            [policyLIST_LABELS.id]: [global_access_LIST_LABELS, inherited_LIST_LABELS],
            [policyREAD.id]: [dependencyREAD, global_access_READ, inherited_READ],
            [policyINSERT_OR_UPDATE.id]: [dependencyINSERT_OR_UPDATE, global_access_INSERT_OR_UPDATE, inherited_INSERT_OR_UPDATE],
            [policyDELETE.id]: [dependencyDELETE, global_access_DELETE, inherited_DELETE],
        };

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyLIST_LABELS,
            { [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous },
            all_roles,
            null,
            policies,
            policies_dependencies,
            AccessPolicyServerController.getInstance().role_anonymous
        )).to.equal(true);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyREAD,
            { [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous },
            all_roles,
            null,
            policies,
            policies_dependencies,
            AccessPolicyServerController.getInstance().role_anonymous
        )).to.equal(true);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyINSERT_OR_UPDATE,
            { [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous },
            all_roles,
            null,
            policies,
            policies_dependencies,
            AccessPolicyServerController.getInstance().role_anonymous
        )).to.equal(false);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyDELETE,
            { [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous },
            all_roles,
            null,
            policies,
            policies_dependencies,
            AccessPolicyServerController.getInstance().role_anonymous
        )).to.equal(false);
    });



    it('test dao access - isAccessConfVoType', () => {
        AccessPolicyServerController.getInstance().role_anonymous = new RoleVO();
        AccessPolicyServerController.getInstance().role_anonymous.parent_role_id = null;
        AccessPolicyServerController.getInstance().role_anonymous.id = 1;
        AccessPolicyServerController.getInstance().role_anonymous.translatable_name = 'role_anonymous';

        AccessPolicyServerController.getInstance().role_logged = new RoleVO();
        AccessPolicyServerController.getInstance().role_logged.parent_role_id = AccessPolicyServerController.getInstance().role_anonymous.id;
        AccessPolicyServerController.getInstance().role_logged.id = 2;
        AccessPolicyServerController.getInstance().role_logged.translatable_name = 'role_logged';

        AccessPolicyServerController.getInstance().role_admin = new RoleVO();
        AccessPolicyServerController.getInstance().role_admin.parent_role_id = AccessPolicyServerController.getInstance().role_logged.id;
        AccessPolicyServerController.getInstance().role_admin.id = 3;
        AccessPolicyServerController.getInstance().role_admin.translatable_name = 'role_admin';

        let all_roles: { [role_id: number]: RoleVO } = {
            1: AccessPolicyServerController.getInstance().role_anonymous,
            2: AccessPolicyServerController.getInstance().role_logged,
            3: AccessPolicyServerController.getInstance().role_admin
        };

        let policy_global_access: AccessPolicyVO = new AccessPolicyVO();
        policy_global_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        policy_global_access.translatable_name = 'policy_global_access';
        policy_global_access.id = 100;


        let pg: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        pg.translatable_name = 'pg';
        pg.id = 1;

        let policyLIST_LABELS: AccessPolicyVO = DAOServerController.getInstance().get_dao_policy(
            'isAccessConfVoType_LIST_LABELS',
            pg,
            true,
            AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED_TO_ANYONE);
        policyLIST_LABELS.id = 1;

        let policyREAD: AccessPolicyVO = DAOServerController.getInstance().get_dao_policy(
            'isAccessConfVoType_READ',
            pg,
            true,
            AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED_TO_ANYONE);
        policyREAD.id = 2;

        let policyINSERT_OR_UPDATE: AccessPolicyVO = DAOServerController.getInstance().get_dao_policy(
            'isAccessConfVoType_INSERT_OR_UPDATE',
            pg,
            true,
            AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN);
        policyINSERT_OR_UPDATE.id = 3;

        let policyDELETE: AccessPolicyVO = DAOServerController.getInstance().get_dao_policy(
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


        let dependencyREAD = DAOServerController.getInstance().get_dao_dependency_default_denied(policyREAD, policyLIST_LABELS);
        let dependencyINSERT_OR_UPDATE = DAOServerController.getInstance().get_dao_dependency_default_denied(policyINSERT_OR_UPDATE, policyREAD);
        let dependencyDELETE = DAOServerController.getInstance().get_dao_dependency_default_denied(policyDELETE, policyREAD);

        let global_access_LIST_LABELS = DAOServerController.getInstance().get_dao_dependency_default_granted(
            policyLIST_LABELS,
            policy_global_access);
        let global_access_READ = DAOServerController.getInstance().get_dao_dependency_default_granted(
            policyREAD,
            policy_global_access);
        let global_access_INSERT_OR_UPDATE = DAOServerController.getInstance().get_dao_dependency_default_granted(
            policyINSERT_OR_UPDATE,
            policy_global_access);
        let global_access_DELETE = DAOServerController.getInstance().get_dao_dependency_default_granted(
            policyDELETE,
            policy_global_access);

        let policies_dependencies: { [src_pol_id: number]: PolicyDependencyVO[] } = {

            [policyLIST_LABELS.id]: [global_access_LIST_LABELS],
            [policyREAD.id]: [dependencyREAD, global_access_READ],
            [policyINSERT_OR_UPDATE.id]: [dependencyINSERT_OR_UPDATE, global_access_INSERT_OR_UPDATE],
            [policyDELETE.id]: [dependencyDELETE, global_access_DELETE],
        };

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyLIST_LABELS,
            { [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous },
            all_roles,
            null,
            policies,
            policies_dependencies,
            AccessPolicyServerController.getInstance().role_anonymous
        )).to.equal(true);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyREAD,
            { [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous },
            all_roles,
            null,
            policies,
            policies_dependencies,
            AccessPolicyServerController.getInstance().role_anonymous
        )).to.equal(true);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyINSERT_OR_UPDATE,
            { [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous },
            all_roles,
            null,
            policies,
            policies_dependencies,
            AccessPolicyServerController.getInstance().role_anonymous
        )).to.equal(false);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyDELETE,
            { [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous },
            all_roles,
            null,
            policies,
            policies_dependencies,
            AccessPolicyServerController.getInstance().role_anonymous
        )).to.equal(false);
    });


    it('test dao access - !isAccessConfVoType && inherited', () => {
        AccessPolicyServerController.getInstance().role_anonymous = new RoleVO();
        AccessPolicyServerController.getInstance().role_anonymous.parent_role_id = null;
        AccessPolicyServerController.getInstance().role_anonymous.id = 1;
        AccessPolicyServerController.getInstance().role_anonymous.translatable_name = 'role_anonymous';

        AccessPolicyServerController.getInstance().role_logged = new RoleVO();
        AccessPolicyServerController.getInstance().role_logged.parent_role_id = AccessPolicyServerController.getInstance().role_anonymous.id;
        AccessPolicyServerController.getInstance().role_logged.id = 2;
        AccessPolicyServerController.getInstance().role_logged.translatable_name = 'role_logged';

        AccessPolicyServerController.getInstance().role_admin = new RoleVO();
        AccessPolicyServerController.getInstance().role_admin.parent_role_id = AccessPolicyServerController.getInstance().role_logged.id;
        AccessPolicyServerController.getInstance().role_admin.id = 3;
        AccessPolicyServerController.getInstance().role_admin.translatable_name = 'role_admin';

        let all_roles: { [role_id: number]: RoleVO } = {
            1: AccessPolicyServerController.getInstance().role_anonymous,
            2: AccessPolicyServerController.getInstance().role_logged,
            3: AccessPolicyServerController.getInstance().role_admin
        };

        let policy_global_access: AccessPolicyVO = new AccessPolicyVO();
        policy_global_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        policy_global_access.translatable_name = 'policy_global_access';
        policy_global_access.id = 100;


        let pg_inherited: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        pg_inherited.translatable_name = 'pg_inherited';
        pg_inherited.id = 2;

        let policy_inherited_LIST_LABELS: AccessPolicyVO = DAOServerController.getInstance().get_dao_policy(
            'isAccessConfVoType_inherited.LIST_LABELS',
            pg_inherited,
            false,
            AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED_TO_ANYONE);
        policy_inherited_LIST_LABELS.id = 11;

        let policy_inherited_READ: AccessPolicyVO = DAOServerController.getInstance().get_dao_policy(
            'isAccessConfVoType_inherited_READ',
            pg_inherited,
            false,
            AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED_TO_ANYONE);
        policy_inherited_READ.id = 12;

        let policy_inherited_INSERT_OR_UPDATE: AccessPolicyVO = DAOServerController.getInstance().get_dao_policy(
            'isAccessConfVoType_inherited_INSERT_OR_UPDATE',
            pg_inherited,
            false,
            AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN);
        policy_inherited_INSERT_OR_UPDATE.id = 13;

        let policy_inherited_DELETE: AccessPolicyVO = DAOServerController.getInstance().get_dao_policy(
            'isAccessConfVoType_inherited_DELETE',
            pg_inherited,
            false,
            AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN);
        policy_inherited_DELETE.id = 14;



        let pg: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        pg.translatable_name = 'pg';
        pg.id = 1;

        let policyLIST_LABELS: AccessPolicyVO = DAOServerController.getInstance().get_dao_policy(
            'isAccessConfVoType_LIST_LABELS',
            pg,
            false,
            AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED_TO_ANYONE);
        policyLIST_LABELS.id = 1;

        let policyREAD: AccessPolicyVO = DAOServerController.getInstance().get_dao_policy(
            'isAccessConfVoType_READ',
            pg,
            false,
            AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED_TO_ANYONE);
        policyREAD.id = 2;

        let policyINSERT_OR_UPDATE: AccessPolicyVO = DAOServerController.getInstance().get_dao_policy(
            'isAccessConfVoType_INSERT_OR_UPDATE',
            pg,
            false,
            AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN);
        policyINSERT_OR_UPDATE.id = 3;

        let policyDELETE: AccessPolicyVO = DAOServerController.getInstance().get_dao_policy(
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


        let dependencyREAD = DAOServerController.getInstance().get_dao_dependency_default_denied(policyREAD, policyLIST_LABELS);
        let dependencyINSERT_OR_UPDATE = DAOServerController.getInstance().get_dao_dependency_default_denied(policyINSERT_OR_UPDATE, policyREAD);
        let dependencyDELETE = DAOServerController.getInstance().get_dao_dependency_default_denied(policyDELETE, policyREAD);

        let global_access_LIST_LABELS = DAOServerController.getInstance().get_dao_dependency_default_granted(
            policyLIST_LABELS,
            policy_global_access);
        let global_access_READ = DAOServerController.getInstance().get_dao_dependency_default_granted(
            policyREAD,
            policy_global_access);
        let global_access_INSERT_OR_UPDATE = DAOServerController.getInstance().get_dao_dependency_default_granted(
            policyINSERT_OR_UPDATE,
            policy_global_access);
        let global_access_DELETE = DAOServerController.getInstance().get_dao_dependency_default_granted(
            policyDELETE,
            policy_global_access);

        let inherited_LIST_LABELS = DAOServerController.getInstance().get_dao_dependency_default_granted(
            policyLIST_LABELS,
            policy_inherited_LIST_LABELS);
        let inherited_READ = DAOServerController.getInstance().get_dao_dependency_default_granted(
            policyREAD,
            policy_inherited_READ);
        let inherited_INSERT_OR_UPDATE = DAOServerController.getInstance().get_dao_dependency_default_granted(
            policyINSERT_OR_UPDATE,
            policy_inherited_INSERT_OR_UPDATE);
        let inherited_DELETE = DAOServerController.getInstance().get_dao_dependency_default_granted(
            policyDELETE,
            policy_inherited_DELETE);

        let policies_dependencies: { [src_pol_id: number]: PolicyDependencyVO[] } = {

            [policyLIST_LABELS.id]: [global_access_LIST_LABELS, inherited_LIST_LABELS],
            [policyREAD.id]: [dependencyREAD, global_access_READ, inherited_READ],
            [policyINSERT_OR_UPDATE.id]: [dependencyINSERT_OR_UPDATE, global_access_INSERT_OR_UPDATE, inherited_INSERT_OR_UPDATE],
            [policyDELETE.id]: [dependencyDELETE, global_access_DELETE, inherited_DELETE],
        };

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyLIST_LABELS,
            { [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous },
            all_roles,
            null,
            policies,
            policies_dependencies,
            AccessPolicyServerController.getInstance().role_anonymous
        )).to.equal(false);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyREAD,
            { [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous },
            all_roles,
            null,
            policies,
            policies_dependencies,
            AccessPolicyServerController.getInstance().role_anonymous
        )).to.equal(false);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyINSERT_OR_UPDATE,
            { [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous },
            all_roles,
            null,
            policies,
            policies_dependencies,
            AccessPolicyServerController.getInstance().role_anonymous
        )).to.equal(false);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyDELETE,
            { [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous },
            all_roles,
            null,
            policies,
            policies_dependencies,
            AccessPolicyServerController.getInstance().role_anonymous
        )).to.equal(false);
    });



    it('test dao access - !isAccessConfVoType', () => {
        AccessPolicyServerController.getInstance().role_anonymous = new RoleVO();
        AccessPolicyServerController.getInstance().role_anonymous.parent_role_id = null;
        AccessPolicyServerController.getInstance().role_anonymous.id = 1;
        AccessPolicyServerController.getInstance().role_anonymous.translatable_name = 'role_anonymous';

        AccessPolicyServerController.getInstance().role_logged = new RoleVO();
        AccessPolicyServerController.getInstance().role_logged.parent_role_id = AccessPolicyServerController.getInstance().role_anonymous.id;
        AccessPolicyServerController.getInstance().role_logged.id = 2;
        AccessPolicyServerController.getInstance().role_logged.translatable_name = 'role_logged';

        AccessPolicyServerController.getInstance().role_admin = new RoleVO();
        AccessPolicyServerController.getInstance().role_admin.parent_role_id = AccessPolicyServerController.getInstance().role_logged.id;
        AccessPolicyServerController.getInstance().role_admin.id = 3;
        AccessPolicyServerController.getInstance().role_admin.translatable_name = 'role_admin';

        let all_roles: { [role_id: number]: RoleVO } = {
            1: AccessPolicyServerController.getInstance().role_anonymous,
            2: AccessPolicyServerController.getInstance().role_logged,
            3: AccessPolicyServerController.getInstance().role_admin
        };

        let policy_global_access: AccessPolicyVO = new AccessPolicyVO();
        policy_global_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        policy_global_access.translatable_name = 'policy_global_access';
        policy_global_access.id = 100;


        let pg: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        pg.translatable_name = 'pg';
        pg.id = 1;

        let policyLIST_LABELS: AccessPolicyVO = DAOServerController.getInstance().get_dao_policy(
            'isAccessConfVoType_LIST_LABELS',
            pg,
            false,
            AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED_TO_ANYONE);
        policyLIST_LABELS.id = 1;

        let policyREAD: AccessPolicyVO = DAOServerController.getInstance().get_dao_policy(
            'isAccessConfVoType_READ',
            pg,
            false,
            AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED_TO_ANYONE);
        policyREAD.id = 2;

        let policyINSERT_OR_UPDATE: AccessPolicyVO = DAOServerController.getInstance().get_dao_policy(
            'isAccessConfVoType_INSERT_OR_UPDATE',
            pg,
            false,
            AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN);
        policyINSERT_OR_UPDATE.id = 3;

        let policyDELETE: AccessPolicyVO = DAOServerController.getInstance().get_dao_policy(
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


        let dependencyREAD = DAOServerController.getInstance().get_dao_dependency_default_denied(policyREAD, policyLIST_LABELS);
        let dependencyINSERT_OR_UPDATE = DAOServerController.getInstance().get_dao_dependency_default_denied(policyINSERT_OR_UPDATE, policyREAD);
        let dependencyDELETE = DAOServerController.getInstance().get_dao_dependency_default_denied(policyDELETE, policyREAD);

        let global_access_LIST_LABELS = DAOServerController.getInstance().get_dao_dependency_default_granted(
            policyLIST_LABELS,
            policy_global_access);
        let global_access_READ = DAOServerController.getInstance().get_dao_dependency_default_granted(
            policyREAD,
            policy_global_access);
        let global_access_INSERT_OR_UPDATE = DAOServerController.getInstance().get_dao_dependency_default_granted(
            policyINSERT_OR_UPDATE,
            policy_global_access);
        let global_access_DELETE = DAOServerController.getInstance().get_dao_dependency_default_granted(
            policyDELETE,
            policy_global_access);

        let policies_dependencies: { [src_pol_id: number]: PolicyDependencyVO[] } = {

            [policyLIST_LABELS.id]: [global_access_LIST_LABELS],
            [policyREAD.id]: [dependencyREAD, global_access_READ],
            [policyINSERT_OR_UPDATE.id]: [dependencyINSERT_OR_UPDATE, global_access_INSERT_OR_UPDATE],
            [policyDELETE.id]: [dependencyDELETE, global_access_DELETE],
        };

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyLIST_LABELS,
            { [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous },
            all_roles,
            null,
            policies,
            policies_dependencies,
            AccessPolicyServerController.getInstance().role_anonymous
        )).to.equal(false);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyREAD,
            { [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous },
            all_roles,
            null,
            policies,
            policies_dependencies,
            AccessPolicyServerController.getInstance().role_anonymous
        )).to.equal(false);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyINSERT_OR_UPDATE,
            { [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous },
            all_roles,
            null,
            policies,
            policies_dependencies,
            AccessPolicyServerController.getInstance().role_anonymous
        )).to.equal(false);

        expect(AccessPolicyServerController.getInstance().checkAccessTo(
            policyDELETE,
            { [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous },
            all_roles,
            null,
            policies,
            policies_dependencies,
            AccessPolicyServerController.getInstance().role_anonymous
        )).to.equal(false);
    });
});