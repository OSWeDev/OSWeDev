import * as chai from 'chai';
import { expect, assert } from 'chai';
import 'mocha';

import AccessPolicyServerController from '../../../src/server/modules/AccessPolicy/AccessPolicyServerController';
import AccessPolicyVO from '../../../src/shared/modules/AccessPolicy/vos/AccessPolicyVO';
import RoleVO from '../../../src/shared/modules/AccessPolicy/vos/RoleVO';
import RolePoliciesVO from '../../../src/shared/modules/AccessPolicy/vos/RolePoliciesVO';
import PolicyDependencyVO from '../../../src/shared/modules/AccessPolicy/vos/PolicyDependencyVO';

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
        [],
        all_roles,
        [],
        [],
        []
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
        [AccessPolicyServerController.getInstance().role_anonymous],
        all_roles,
        null,
        policies,
        null
    )).to.equal(false);

    expect(AccessPolicyServerController.getInstance().checkAccessTo(
        policy,
        [AccessPolicyServerController.getInstance().role_logged],
        all_roles,
        null,
        policies,
        null
    )).to.equal(false);

    expect(AccessPolicyServerController.getInstance().checkAccessTo(
        policy,
        [AccessPolicyServerController.getInstance().role_admin],
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
        [new_role],
        all_roles,
        null,
        policies,
        null
    )).to.equal(false);

    expect(AccessPolicyServerController.getInstance().checkAccessTo(
        policy,
        [new_role, AccessPolicyServerController.getInstance().role_anonymous],
        all_roles,
        null,
        policies,
        null
    )).to.equal(false);

    expect(AccessPolicyServerController.getInstance().checkAccessTo(
        policy,
        [new_role, AccessPolicyServerController.getInstance().role_logged],
        all_roles,
        null,
        policies,
        null
    )).to.equal(false);

    expect(AccessPolicyServerController.getInstance().checkAccessTo(
        policy,
        [AccessPolicyServerController.getInstance().role_anonymous, new_role, AccessPolicyServerController.getInstance().role_logged],
        all_roles,
        null,
        policies,
        null
    )).to.equal(false);

    expect(AccessPolicyServerController.getInstance().checkAccessTo(
        policy,
        [new_role, AccessPolicyServerController.getInstance().role_admin],
        all_roles,
        null,
        policies,
        null
    )).to.equal(true);

    expect(AccessPolicyServerController.getInstance().checkAccessTo(
        policy,
        [AccessPolicyServerController.getInstance().role_admin, new_role],
        all_roles,
        null,
        policies,
        null
    )).to.equal(true);

    expect(AccessPolicyServerController.getInstance().checkAccessTo(
        policy,
        [AccessPolicyServerController.getInstance().role_anonymous, AccessPolicyServerController.getInstance().role_logged, AccessPolicyServerController.getInstance().role_admin, new_role],
        all_roles,
        null,
        policies,
        null
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

    let role_policy: RolePoliciesVO = new RolePoliciesVO();
    role_policy.id = 1;
    role_policy.accpol_id = 1;
    role_policy.role_id = AccessPolicyServerController.getInstance().role_logged.id;
    role_policy.granted = false;

    let role_policies: { [role_id: number]: { [pol_id: number]: RolePoliciesVO } } = {
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
        [AccessPolicyServerController.getInstance().role_anonymous],
        all_roles,
        role_policies,
        policies,
        null
    )).to.equal(false);

    expect(AccessPolicyServerController.getInstance().checkAccessTo(
        policy,
        [AccessPolicyServerController.getInstance().role_logged],
        all_roles,
        role_policies,
        policies,
        null
    )).to.equal(false);

    expect(AccessPolicyServerController.getInstance().checkAccessTo(
        policy,
        [AccessPolicyServerController.getInstance().role_admin],
        all_roles,
        role_policies,
        policies,
        null
    )).to.equal(true);


    policy.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ANONYMOUS;
    expect(AccessPolicyServerController.getInstance().checkAccessTo(
        policy,
        [AccessPolicyServerController.getInstance().role_anonymous],
        all_roles,
        role_policies,
        policies,
        null
    )).to.equal(false);

    expect(AccessPolicyServerController.getInstance().checkAccessTo(
        policy,
        [AccessPolicyServerController.getInstance().role_logged],
        all_roles,
        role_policies,
        policies,
        null
    )).to.equal(false);

    expect(AccessPolicyServerController.getInstance().checkAccessTo(
        policy,
        [AccessPolicyServerController.getInstance().role_admin],
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

    let role_policy: RolePoliciesVO = new RolePoliciesVO();
    role_policy.id = 1;
    role_policy.accpol_id = 1;
    role_policy.role_id = AccessPolicyServerController.getInstance().role_logged.id;
    role_policy.granted = false;

    let role_policies: { [role_id: number]: { [pol_id: number]: RolePoliciesVO } } = {
        [AccessPolicyServerController.getInstance().role_logged.id]: {
            [policy.id]: role_policy
        }
    };

    expect(AccessPolicyServerController.getInstance().checkAccessTo(
        policy,
        [AccessPolicyServerController.getInstance().role_anonymous],
        all_roles,
        role_policies,
        policies,
        null
    )).to.equal(true);

    // ATTENTION : un rôle ne peut pas avoir moins d'accès que son parent
    expect(AccessPolicyServerController.getInstance().checkAccessTo(
        policy,
        [AccessPolicyServerController.getInstance().role_logged],
        all_roles,
        role_policies,
        policies,
        null
    )).to.equal(true);

    expect(AccessPolicyServerController.getInstance().checkAccessTo(
        policy,
        [AccessPolicyServerController.getInstance().role_admin],
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

    let role_policyA: RolePoliciesVO = new RolePoliciesVO();
    role_policyA.id = 1;
    role_policyA.accpol_id = 1;
    role_policyA.role_id = AccessPolicyServerController.getInstance().role_anonymous.id;
    role_policyA.granted = true;

    let role_policies: { [role_id: number]: { [pol_id: number]: RolePoliciesVO } } = {
        [AccessPolicyServerController.getInstance().role_logged.id]: {
            [policyA.id]: role_policyA
        }
    };

    expect(AccessPolicyServerController.getInstance().checkAccessTo(
        policyA,
        [AccessPolicyServerController.getInstance().role_logged],
        all_roles,
        role_policies,
        policies,
        null
    )).to.equal(true);

    expect(AccessPolicyServerController.getInstance().checkAccessTo(
        policyB,
        [AccessPolicyServerController.getInstance().role_logged],
        all_roles,
        role_policies,
        policies,
        null
    )).to.equal(false);

    expect(AccessPolicyServerController.getInstance().checkAccessTo(
        policyB,
        [AccessPolicyServerController.getInstance().role_admin],
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
        [AccessPolicyServerController.getInstance().role_logged],
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).to.equal(false);

    expect(AccessPolicyServerController.getInstance().checkAccessTo(
        policyB,
        [AccessPolicyServerController.getInstance().role_admin],
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).to.equal(true);

    expect(AccessPolicyServerController.getInstance().checkAccessTo(
        policyA,
        [AccessPolicyServerController.getInstance().role_logged],
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).to.equal(false);

    // L'admin a juste accès à tout
    expect(AccessPolicyServerController.getInstance().checkAccessTo(
        policyA,
        [AccessPolicyServerController.getInstance().role_admin],
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).to.equal(true);

    dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
    expect(AccessPolicyServerController.getInstance().checkAccessTo(
        policyA,
        [AccessPolicyServerController.getInstance().role_logged],
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).to.equal(false);

    let role_policyB: RolePoliciesVO = new RolePoliciesVO();
    role_policyB.id = 2;
    role_policyB.accpol_id = policyB.id;
    role_policyB.role_id = AccessPolicyServerController.getInstance().role_anonymous.id;
    role_policyB.granted = true;

    role_policies[AccessPolicyServerController.getInstance().role_anonymous.id] = {};
    role_policies[AccessPolicyServerController.getInstance().role_anonymous.id][policyB.id] = role_policyB;

    expect(AccessPolicyServerController.getInstance().checkAccessTo(
        policyA,
        [AccessPolicyServerController.getInstance().role_anonymous],
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).to.equal(true);

    expect(AccessPolicyServerController.getInstance().checkAccessTo(
        policyA,
        [AccessPolicyServerController.getInstance().role_logged],
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).to.equal(true);


    expect(AccessPolicyServerController.getInstance().checkAccessTo(
        policyA,
        [AccessPolicyServerController.getInstance().role_admin],
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).to.equal(true);

    role_policyB.granted = false;

    expect(AccessPolicyServerController.getInstance().checkAccessTo(
        policyA,
        [AccessPolicyServerController.getInstance().role_anonymous],
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).to.equal(false);

    expect(AccessPolicyServerController.getInstance().checkAccessTo(
        policyA,
        [AccessPolicyServerController.getInstance().role_logged],
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).to.equal(false);


    expect(AccessPolicyServerController.getInstance().checkAccessTo(
        policyA,
        [AccessPolicyServerController.getInstance().role_admin],
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).to.equal(true);

    role_policyA.granted = false;
    role_policyB.granted = true;

    expect(AccessPolicyServerController.getInstance().checkAccessTo(
        policyA,
        [AccessPolicyServerController.getInstance().role_anonymous],
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).to.equal(true);

    expect(AccessPolicyServerController.getInstance().checkAccessTo(
        policyA,
        [AccessPolicyServerController.getInstance().role_logged],
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).to.equal(true);


    expect(AccessPolicyServerController.getInstance().checkAccessTo(
        policyA,
        [AccessPolicyServerController.getInstance().role_admin],
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).to.equal(true);
});

it('test check access - policy multiple dependencies', () => {

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

    let role_policyA: RolePoliciesVO = new RolePoliciesVO();
    role_policyA.id = 1;
    role_policyA.accpol_id = policyA.id;
    role_policyA.role_id = AccessPolicyServerController.getInstance().role_logged.id;
    role_policyA.granted = true;

    let role_policyB: RolePoliciesVO = new RolePoliciesVO();
    role_policyB.id = 2;
    role_policyB.accpol_id = policyB.id;
    role_policyB.role_id = AccessPolicyServerController.getInstance().role_logged.id;
    role_policyB.granted = true;

    let role_policies: { [role_id: number]: { [pol_id: number]: RolePoliciesVO } } = {
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
        [AccessPolicyServerController.getInstance().role_anonymous],
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).to.equal(false);

    expect(AccessPolicyServerController.getInstance().checkAccessTo(
        policyC,
        [AccessPolicyServerController.getInstance().role_admin],
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).to.equal(true);

    expect(AccessPolicyServerController.getInstance().checkAccessTo(
        policyC,
        [AccessPolicyServerController.getInstance().role_logged],
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).to.equal(true);

    role_policyB.granted = false;

    expect(AccessPolicyServerController.getInstance().checkAccessTo(
        policyC,
        [AccessPolicyServerController.getInstance().role_logged],
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).to.equal(false);

    role_policyA.granted = false;

    expect(AccessPolicyServerController.getInstance().checkAccessTo(
        policyC,
        [AccessPolicyServerController.getInstance().role_logged],
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).to.equal(false);

    role_policyB.granted = true;

    expect(AccessPolicyServerController.getInstance().checkAccessTo(
        policyC,
        [AccessPolicyServerController.getInstance().role_logged],
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).to.equal(false);

    role_policyA.granted = true;

    expect(AccessPolicyServerController.getInstance().checkAccessTo(
        policyC,
        [AccessPolicyServerController.getInstance().role_logged],
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
    expect(AccessPolicyServerController.getInstance().getUsersRoles(false, null, null)).to.deep.equal({
        [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous
    });

    expect(AccessPolicyServerController.getInstance().getUsersRoles(false, [], all_roles)).to.deep.equal({
        [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous
    });

    expect(AccessPolicyServerController.getInstance().getUsersRoles(true, [], all_roles)).to.deep.equal({
        [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous,
        [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged
    });

    expect(AccessPolicyServerController.getInstance().getUsersRoles(true, null, all_roles)).to.deep.equal({
        [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous,
        [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged
    });

    expect(AccessPolicyServerController.getInstance().getUsersRoles(true, [
        AccessPolicyServerController.getInstance().role_anonymous
    ], all_roles)).to.deep.equal({
        [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous,
        [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged
    });

    expect(AccessPolicyServerController.getInstance().getUsersRoles(true, [
        AccessPolicyServerController.getInstance().role_anonymous,
        AccessPolicyServerController.getInstance().role_logged
    ], all_roles)).to.deep.equal({
        [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged,
        [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous
    });

    expect(AccessPolicyServerController.getInstance().getUsersRoles(true, [
        new_role
    ], all_roles)).to.deep.equal({
        [new_role.id]: new_role,
        [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged,
        [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous
    });

    expect(AccessPolicyServerController.getInstance().getUsersRoles(true, [
        AccessPolicyServerController.getInstance().role_admin
    ], all_roles)).to.deep.equal({
        [AccessPolicyServerController.getInstance().role_admin.id]: AccessPolicyServerController.getInstance().role_admin,
        [AccessPolicyServerController.getInstance().role_logged.id]: AccessPolicyServerController.getInstance().role_logged,
        [AccessPolicyServerController.getInstance().role_anonymous.id]: AccessPolicyServerController.getInstance().role_anonymous
    });

    delete all_roles[new_role.id];
});