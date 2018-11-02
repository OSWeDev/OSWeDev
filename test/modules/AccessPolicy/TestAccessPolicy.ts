import * as chai from 'chai';
import { expect, assert } from 'chai';
import 'mocha';

import ModuleAccessPolicyServer from '../../../src/server/modules/AccessPolicy/ModuleAccessPolicyServer';
import AccessPolicyVO from '../../../src/shared/modules/AccessPolicy/vos/AccessPolicyVO';
import RoleVO from '../../../src/shared/modules/AccessPolicy/vos/RoleVO';
import RolePoliciesVO from '../../../src/shared/modules/AccessPolicy/vos/RolePoliciesVO';
import PolicyDependencyVO from '../../../src/shared/modules/AccessPolicy/vos/PolicyDependencyVO';

ModuleAccessPolicyServer.getInstance().role_anonymous = new RoleVO();
ModuleAccessPolicyServer.getInstance().role_anonymous.parent_role_id = null;
ModuleAccessPolicyServer.getInstance().role_anonymous.id = 1;
ModuleAccessPolicyServer.getInstance().role_anonymous.translatable_name = 'role_anonymous';

ModuleAccessPolicyServer.getInstance().role_logged = new RoleVO();
ModuleAccessPolicyServer.getInstance().role_logged.parent_role_id = ModuleAccessPolicyServer.getInstance().role_anonymous.id;
ModuleAccessPolicyServer.getInstance().role_logged.id = 2;
ModuleAccessPolicyServer.getInstance().role_logged.translatable_name = 'role_logged';

ModuleAccessPolicyServer.getInstance().role_admin = new RoleVO();
ModuleAccessPolicyServer.getInstance().role_admin.parent_role_id = ModuleAccessPolicyServer.getInstance().role_logged.id;
ModuleAccessPolicyServer.getInstance().role_admin.id = 3;
ModuleAccessPolicyServer.getInstance().role_admin.translatable_name = 'role_admin';

let all_roles: { [role_id: number]: RoleVO } = {
    1: ModuleAccessPolicyServer.getInstance().role_anonymous,
    2: ModuleAccessPolicyServer.getInstance().role_logged,
    3: ModuleAccessPolicyServer.getInstance().role_admin
};

it('test check access - denied by default to all but admin', () => {

    expect(ModuleAccessPolicyServer.getInstance().checkAccessTo(
        null,
        null,
        null,
        null,
        null,
        null
    )).to.equal(false);

    expect(ModuleAccessPolicyServer.getInstance().checkAccessTo(
        new AccessPolicyVO(),
        null,
        all_roles,
        null,
        null,
        null
    )).to.equal(false);

    expect(ModuleAccessPolicyServer.getInstance().checkAccessTo(
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
    expect(ModuleAccessPolicyServer.getInstance().checkAccessTo(
        policy,
        null,
        all_roles,
        null,
        policies,
        null
    )).to.equal(false);

    expect(ModuleAccessPolicyServer.getInstance().checkAccessTo(
        policy,
        null,
        all_roles,
        null,
        null,
        null
    )).to.equal(false);

    expect(ModuleAccessPolicyServer.getInstance().checkAccessTo(
        policy,
        [ModuleAccessPolicyServer.getInstance().role_anonymous],
        all_roles,
        null,
        null,
        null
    )).to.equal(false);

    expect(ModuleAccessPolicyServer.getInstance().checkAccessTo(
        policy,
        [ModuleAccessPolicyServer.getInstance().role_logged],
        all_roles,
        null,
        null,
        null
    )).to.equal(false);

    expect(ModuleAccessPolicyServer.getInstance().checkAccessTo(
        policy,
        [ModuleAccessPolicyServer.getInstance().role_admin],
        all_roles,
        null,
        null,
        null
    )).to.equal(true);
});

it('test check access - role inherit : denied by default to all but admin', () => {
    let policy: AccessPolicyVO = new AccessPolicyVO();
    policy.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
    policy.translatable_name = 'test';
    policy.id = 1;
    let policies: { [policy_id: number]: AccessPolicyVO } = {
        1: policy
    };

    let new_role: RoleVO = new RoleVO();
    new_role.parent_role_id = ModuleAccessPolicyServer.getInstance().role_logged.id;
    new_role.translatable_name = 'new_role';
    new_role.id = 1001;

    all_roles[new_role.id] = new_role;
    expect(ModuleAccessPolicyServer.getInstance().checkAccessTo(
        policy,
        [new_role],
        all_roles,
        null,
        policies,
        null
    )).to.equal(false);

    expect(ModuleAccessPolicyServer.getInstance().checkAccessTo(
        policy,
        [new_role, ModuleAccessPolicyServer.getInstance().role_anonymous],
        all_roles,
        null,
        policies,
        null
    )).to.equal(false);

    expect(ModuleAccessPolicyServer.getInstance().checkAccessTo(
        policy,
        [new_role, ModuleAccessPolicyServer.getInstance().role_logged],
        all_roles,
        null,
        policies,
        null
    )).to.equal(false);

    expect(ModuleAccessPolicyServer.getInstance().checkAccessTo(
        policy,
        [ModuleAccessPolicyServer.getInstance().role_anonymous, new_role, ModuleAccessPolicyServer.getInstance().role_logged],
        all_roles,
        null,
        policies,
        null
    )).to.equal(false);

    expect(ModuleAccessPolicyServer.getInstance().checkAccessTo(
        policy,
        [new_role, ModuleAccessPolicyServer.getInstance().role_admin],
        all_roles,
        null,
        policies,
        null
    )).to.equal(true);

    expect(ModuleAccessPolicyServer.getInstance().checkAccessTo(
        policy,
        [ModuleAccessPolicyServer.getInstance().role_admin, new_role],
        all_roles,
        null,
        policies,
        null
    )).to.equal(true);

    expect(ModuleAccessPolicyServer.getInstance().checkAccessTo(
        policy,
        [ModuleAccessPolicyServer.getInstance().role_anonymous, ModuleAccessPolicyServer.getInstance().role_logged, ModuleAccessPolicyServer.getInstance().role_admin, new_role],
        all_roles,
        null,
        policies,
        null
    )).to.equal(true);
    delete all_roles[new_role.id];
});

it('test check access - policy explicit configuration', () => {

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
    role_policy.role_id = ModuleAccessPolicyServer.getInstance().role_logged.id;
    role_policy.granted = false;

    let role_policies: { [role_id: number]: { [pol_id: number]: RolePoliciesVO } } = {
        [ModuleAccessPolicyServer.getInstance().role_logged.id]: {
            [policy.id]: role_policy
        }
    };

    expect(ModuleAccessPolicyServer.getInstance().checkAccessTo(
        policy,
        null,
        all_roles,
        role_policies,
        policies,
        null
    )).to.equal(false);

    expect(ModuleAccessPolicyServer.getInstance().checkAccessTo(
        policy,
        [ModuleAccessPolicyServer.getInstance().role_anonymous],
        all_roles,
        role_policies,
        policies,
        null
    )).to.equal(false);

    expect(ModuleAccessPolicyServer.getInstance().checkAccessTo(
        policy,
        [ModuleAccessPolicyServer.getInstance().role_logged],
        all_roles,
        role_policies,
        policies,
        null
    )).to.equal(false);

    expect(ModuleAccessPolicyServer.getInstance().checkAccessTo(
        policy,
        [ModuleAccessPolicyServer.getInstance().role_admin],
        all_roles,
        role_policies,
        policies,
        null
    )).to.equal(true);


    policy.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ANONYMOUS;
    expect(ModuleAccessPolicyServer.getInstance().checkAccessTo(
        policy,
        [ModuleAccessPolicyServer.getInstance().role_anonymous],
        all_roles,
        role_policies,
        policies,
        null
    )).to.equal(false);

    expect(ModuleAccessPolicyServer.getInstance().checkAccessTo(
        policy,
        [ModuleAccessPolicyServer.getInstance().role_logged],
        all_roles,
        role_policies,
        policies,
        null
    )).to.equal(false);

    expect(ModuleAccessPolicyServer.getInstance().checkAccessTo(
        policy,
        [ModuleAccessPolicyServer.getInstance().role_admin],
        all_roles,
        role_policies,
        policies,
        null
    )).to.equal(true);
});

it('test check access - policy explicit inheritance', () => {

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
    role_policy.role_id = ModuleAccessPolicyServer.getInstance().role_logged.id;
    role_policy.granted = false;

    let role_policies: { [role_id: number]: { [pol_id: number]: RolePoliciesVO } } = {
        [ModuleAccessPolicyServer.getInstance().role_logged.id]: {
            [policy.id]: role_policy
        }
    };

    expect(ModuleAccessPolicyServer.getInstance().checkAccessTo(
        policy,
        [ModuleAccessPolicyServer.getInstance().role_anonymous],
        all_roles,
        role_policies,
        policies,
        null
    )).to.equal(true);

    // ATTENTION : un rôle ne peut pas avoir moins d'accès que son parent
    expect(ModuleAccessPolicyServer.getInstance().checkAccessTo(
        policy,
        [ModuleAccessPolicyServer.getInstance().role_logged],
        all_roles,
        role_policies,
        policies,
        null
    )).to.equal(true);

    expect(ModuleAccessPolicyServer.getInstance().checkAccessTo(
        policy,
        [ModuleAccessPolicyServer.getInstance().role_admin],
        all_roles,
        role_policies,
        policies,
        null
    )).to.equal(true);
});

it('test check access - policy explicit dependency', () => {

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
    role_policyA.role_id = ModuleAccessPolicyServer.getInstance().role_anonymous.id;
    role_policyA.granted = true;

    let role_policies: { [role_id: number]: { [pol_id: number]: RolePoliciesVO } } = {
        [ModuleAccessPolicyServer.getInstance().role_logged.id]: {
            [policyA.id]: role_policyA
        }
    };

    expect(ModuleAccessPolicyServer.getInstance().checkAccessTo(
        policyA,
        [ModuleAccessPolicyServer.getInstance().role_logged],
        all_roles,
        role_policies,
        policies,
        null
    )).to.equal(true);

    expect(ModuleAccessPolicyServer.getInstance().checkAccessTo(
        policyB,
        [ModuleAccessPolicyServer.getInstance().role_logged],
        all_roles,
        role_policies,
        policies,
        null
    )).to.equal(false);

    expect(ModuleAccessPolicyServer.getInstance().checkAccessTo(
        policyB,
        [ModuleAccessPolicyServer.getInstance().role_admin],
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

    expect(ModuleAccessPolicyServer.getInstance().checkAccessTo(
        policyB,
        [ModuleAccessPolicyServer.getInstance().role_logged],
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).to.equal(false);

    expect(ModuleAccessPolicyServer.getInstance().checkAccessTo(
        policyB,
        [ModuleAccessPolicyServer.getInstance().role_admin],
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).to.equal(true);

    expect(ModuleAccessPolicyServer.getInstance().checkAccessTo(
        policyA,
        [ModuleAccessPolicyServer.getInstance().role_logged],
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).to.equal(false);

    // L'admin a juste accès à tout
    expect(ModuleAccessPolicyServer.getInstance().checkAccessTo(
        policyA,
        [ModuleAccessPolicyServer.getInstance().role_admin],
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).to.equal(true);

    dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
    expect(ModuleAccessPolicyServer.getInstance().checkAccessTo(
        policyA,
        [ModuleAccessPolicyServer.getInstance().role_logged],
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).to.equal(false);

    let role_policyB: RolePoliciesVO = new RolePoliciesVO();
    role_policyB.id = 2;
    role_policyB.accpol_id = policyB.id;
    role_policyB.role_id = ModuleAccessPolicyServer.getInstance().role_anonymous.id;
    role_policyB.granted = true;

    role_policies[ModuleAccessPolicyServer.getInstance().role_logged.id][policyB.id] = role_policyB;

    expect(ModuleAccessPolicyServer.getInstance().checkAccessTo(
        policyA,
        [ModuleAccessPolicyServer.getInstance().role_anonymous],
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).to.equal(true);

    expect(ModuleAccessPolicyServer.getInstance().checkAccessTo(
        policyA,
        [ModuleAccessPolicyServer.getInstance().role_logged],
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).to.equal(true);


    expect(ModuleAccessPolicyServer.getInstance().checkAccessTo(
        policyA,
        [ModuleAccessPolicyServer.getInstance().role_admin],
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).to.equal(true);

    role_policyA.granted = false;

    expect(ModuleAccessPolicyServer.getInstance().checkAccessTo(
        policyA,
        [ModuleAccessPolicyServer.getInstance().role_anonymous],
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).to.equal(false);

    expect(ModuleAccessPolicyServer.getInstance().checkAccessTo(
        policyA,
        [ModuleAccessPolicyServer.getInstance().role_logged],
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).to.equal(true);


    expect(ModuleAccessPolicyServer.getInstance().checkAccessTo(
        policyA,
        [ModuleAccessPolicyServer.getInstance().role_admin],
        all_roles,
        role_policies,
        policies,
        policies_dependencies
    )).to.equal(true);
});

it('test getUsersRoles', () => {
    let new_role: RoleVO = new RoleVO();
    new_role.parent_role_id = ModuleAccessPolicyServer.getInstance().role_logged.id;
    new_role.translatable_name = 'new_role';
    new_role.id = 1001;

    all_roles[new_role.id] = new_role;
    expect(ModuleAccessPolicyServer.getInstance().getUsersRoles(false, null, null)).to.deep.equal({
        [ModuleAccessPolicyServer.getInstance().role_anonymous.id]: ModuleAccessPolicyServer.getInstance().role_anonymous
    });

    expect(ModuleAccessPolicyServer.getInstance().getUsersRoles(false, [], all_roles)).to.deep.equal({
        [ModuleAccessPolicyServer.getInstance().role_anonymous.id]: ModuleAccessPolicyServer.getInstance().role_anonymous
    });

    expect(ModuleAccessPolicyServer.getInstance().getUsersRoles(true, [], all_roles)).to.deep.equal({
        [ModuleAccessPolicyServer.getInstance().role_anonymous.id]: ModuleAccessPolicyServer.getInstance().role_anonymous,
        [ModuleAccessPolicyServer.getInstance().role_logged.id]: ModuleAccessPolicyServer.getInstance().role_logged
    });

    expect(ModuleAccessPolicyServer.getInstance().getUsersRoles(true, null, all_roles)).to.deep.equal({
        [ModuleAccessPolicyServer.getInstance().role_anonymous.id]: ModuleAccessPolicyServer.getInstance().role_anonymous,
        [ModuleAccessPolicyServer.getInstance().role_logged.id]: ModuleAccessPolicyServer.getInstance().role_logged
    });

    expect(ModuleAccessPolicyServer.getInstance().getUsersRoles(true, [
        ModuleAccessPolicyServer.getInstance().role_anonymous
    ], all_roles)).to.deep.equal({
        [ModuleAccessPolicyServer.getInstance().role_anonymous.id]: ModuleAccessPolicyServer.getInstance().role_anonymous,
        [ModuleAccessPolicyServer.getInstance().role_logged.id]: ModuleAccessPolicyServer.getInstance().role_logged
    });

    expect(ModuleAccessPolicyServer.getInstance().getUsersRoles(true, [
        ModuleAccessPolicyServer.getInstance().role_anonymous,
        ModuleAccessPolicyServer.getInstance().role_logged
    ], all_roles)).to.deep.equal({
        [ModuleAccessPolicyServer.getInstance().role_logged.id]: ModuleAccessPolicyServer.getInstance().role_logged,
        [ModuleAccessPolicyServer.getInstance().role_anonymous.id]: ModuleAccessPolicyServer.getInstance().role_anonymous
    });

    expect(ModuleAccessPolicyServer.getInstance().getUsersRoles(true, [
        new_role
    ], all_roles)).to.deep.equal({
        [new_role.id]: new_role,
        [ModuleAccessPolicyServer.getInstance().role_logged.id]: ModuleAccessPolicyServer.getInstance().role_logged,
        [ModuleAccessPolicyServer.getInstance().role_anonymous.id]: ModuleAccessPolicyServer.getInstance().role_anonymous
    });

    expect(ModuleAccessPolicyServer.getInstance().getUsersRoles(true, [
        ModuleAccessPolicyServer.getInstance().role_admin
    ], all_roles)).to.deep.equal({
        [ModuleAccessPolicyServer.getInstance().role_admin.id]: ModuleAccessPolicyServer.getInstance().role_admin,
        [ModuleAccessPolicyServer.getInstance().role_logged.id]: ModuleAccessPolicyServer.getInstance().role_logged,
        [ModuleAccessPolicyServer.getInstance().role_anonymous.id]: ModuleAccessPolicyServer.getInstance().role_anonymous
    });

    delete all_roles[new_role.id];
});