/* tslint:disable:no-unused-expression */
import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { expect, test } from "playwright-test-coverage";
import VarDAG from '../../../src/server/modules/Var/vos/VarDAG';
import VarDAGNode from '../../../src/server/modules/Var/vos/VarDAGNode';
import VarDAGNodeDep from '../../../src/server/modules/Var/vos/VarDAGNodeDep';
import FakeDataHandler from './fakes/FakeDataHandler';
import FakeVarsInit from './fakes/FakeVarsInit';
import FakeDataVO from './fakes/vos/FakeDataVO';
import ConsoleHandler from '../../../src/shared/tools/ConsoleHandler';
import ConfigurationService from '../../../src/server/env/ConfigurationService';

ConsoleHandler.init();
ConfigurationService.setEnvParams({});
ConfigurationService.IS_UNIT_TEST_MODE = true;

test('DAG: test isDeletable', async () => {

    await FakeVarsInit.initAll();

    const dag: VarDAG = await FakeDataHandler.get_fake_triangular_dag();

    const var_data_A: FakeDataVO = FakeDataHandler.get_var_data_A();
    const node_A = dag.nodes[var_data_A.index];
    // Pas de incoming deps, donc peut être supprimé
    expect(node_A.tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: true
    });
    expect(node_A.is_deletable).toStrictEqual(true);


    node_A.remove_tag(VarDAGNode.TAG_0_CREATED);
    node_A.add_tag(VarDAGNode.TAG_6_UPDATING_IN_DB);
    expect(node_A.tags).toStrictEqual({
        [VarDAGNode.TAG_6_UPDATING_IN_DB]: true
    });
    expect(node_A.is_deletable).toStrictEqual(true);


    node_A.remove_tag(VarDAGNode.TAG_6_UPDATING_IN_DB);
    node_A.add_tag(VarDAGNode.TAG_6_UPDATED_IN_DB);
    expect(node_A.tags).toStrictEqual({
        [VarDAGNode.TAG_7_IS_DELETABLE]: true
    });
    expect(node_A.is_deletable).toStrictEqual(true);


    node_A.remove_tag(VarDAGNode.TAG_7_IS_DELETABLE);
    node_A.add_tag(VarDAGNode.TAG_7_DELETING);
    expect(node_A.tags).toStrictEqual({
        [VarDAGNode.TAG_7_DELETING]: true
    });
    expect(node_A.is_deletable).toStrictEqual(true);

    const var_data_B: FakeDataVO = FakeDataHandler.get_var_data_B();
    const node_B = dag.nodes[var_data_B.index];
    // Pas de tag updated_db, donc pas de suppression
    expect(node_B.tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: true
    });
    expect(node_B.is_deletable).toStrictEqual(false);

    // des incoming deps, donc pas de suppression
    node_B.remove_tag(VarDAGNode.TAG_0_CREATED);
    node_B.add_tag(VarDAGNode.TAG_7_DELETING);
    expect(node_B.tags).toStrictEqual({
        [VarDAGNode.TAG_7_DELETING]: true
    });
    expect(node_B.is_deletable).toStrictEqual(false);
});

test('DAG: test isComputable', async () => {

    await FakeVarsInit.initAll();

    const dag: VarDAG = await FakeDataHandler.get_fake_triangular_dag();

    const var_data_A: FakeDataVO = FakeDataHandler.get_var_data_A();
    const node_A = dag.nodes[var_data_A.index];

    const var_data_B: FakeDataVO = FakeDataHandler.get_var_data_B();
    const node_B = dag.nodes[var_data_B.index];

    const var_data_C: FakeDataVO = FakeDataHandler.get_var_data_C();
    const node_C = dag.nodes[var_data_C.index];

    const var_data_E: FakeDataVO = FakeDataHandler.get_var_data_E();
    const node_E = dag.nodes[var_data_E.index];

    const var_data_F: FakeDataVO = FakeDataHandler.get_var_data_F();
    const node_F = dag.nodes[var_data_F.index];

    const var_data_G: FakeDataVO = FakeDataHandler.get_var_data_G();
    const node_G = dag.nodes[var_data_G.index];

    const var_data_H: FakeDataVO = FakeDataHandler.get_var_data_H();
    const node_H = dag.nodes[var_data_H.index];

    // Pas de TAG_4_COMPUTING, donc pas de calcul
    expect(node_A.tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: true
    });
    expect(node_A.is_computable).toStrictEqual(false);
    expect(node_A['current_step']).toStrictEqual(VarDAGNode.STEP_TAGS_INDEXES[VarDAGNode.TAG_0_CREATED]);
    expect(dag.current_step_tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: {
            [var_data_A.index]: node_A,
            [var_data_B.index]: node_B,
            [var_data_C.index]: node_C,
            [var_data_E.index]: node_E,
            [var_data_F.index]: node_F,
            [var_data_G.index]: node_G,
            [var_data_H.index]: node_H
        }
    });

    // des outgoing deps qui ne sont pas calculées, donc pas de calcul
    node_A.remove_tag(VarDAGNode.TAG_0_CREATED);
    expect(node_A['current_step']).toBeNull();
    expect(dag.current_step_tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: {
            [var_data_B.index]: node_B,
            [var_data_C.index]: node_C,
            [var_data_E.index]: node_E,
            [var_data_F.index]: node_F,
            [var_data_G.index]: node_G,
            [var_data_H.index]: node_H
        }
    });

    node_A.add_tag(VarDAGNode.TAG_4_COMPUTING);
    expect(node_A.tags).toStrictEqual({
        [VarDAGNode.TAG_4_COMPUTING]: true
    });
    expect(node_A.is_computable).toStrictEqual(false);
    expect(node_A['current_step']).toStrictEqual(VarDAGNode.STEP_TAGS_INDEXES[VarDAGNode.TAG_4_COMPUTING]);
    expect(dag.current_step_tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: {
            [var_data_B.index]: node_B,
            [var_data_C.index]: node_C,
            [var_data_E.index]: node_E,
            [var_data_F.index]: node_F,
            [var_data_G.index]: node_G,
            [var_data_H.index]: node_H
        },
        [VarDAGNode.TAG_4_COMPUTING]: {
            [var_data_A.index]: node_A
        }
    });


    // Pas de deps computed, donc pas computable
    expect(node_B.tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: true
    });
    expect(node_B.is_computable).toStrictEqual(false);

    // Pas de deps, donc computable
    // DEBUG => Si on a pas fini de déployer les deps, on peut pas encore savoir si on est computable
    expect(node_E.tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: true
    });
    expect(node_E.is_computable).toStrictEqual(false);

    // Pas de deps, donc computable
    // DEBUG => Si on a pas fini de déployer les deps, on peut pas encore savoir si on est computable
    expect(node_F.tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: true
    });
    expect(node_F.is_computable).toStrictEqual(false);

    node_E.remove_tag(VarDAGNode.TAG_0_CREATED);
    node_E.add_tag(VarDAGNode.TAG_4_COMPUTING);
    expect(node_A.is_computable).toStrictEqual(false);
    expect(node_B.is_computable).toStrictEqual(false);
    expect(node_E.is_computable).toStrictEqual(true);
    expect(node_F.is_computable).toStrictEqual(false);

    node_E.remove_tag(VarDAGNode.TAG_4_COMPUTING);
    node_E.add_tag(VarDAGNode.TAG_3_DATA_LOADED);
    expect(node_A.is_computable).toStrictEqual(false);
    expect(node_B.is_computable).toStrictEqual(false);
    expect(node_E.is_computable).toStrictEqual(true);
    expect(node_F.is_computable).toStrictEqual(false);

    node_F.remove_tag(VarDAGNode.TAG_0_CREATED);
    node_F.add_tag(VarDAGNode.TAG_4_COMPUTING);
    node_B.remove_tag(VarDAGNode.TAG_0_CREATED);
    node_B.add_tag(VarDAGNode.TAG_4_COMPUTING);
    node_A.remove_tag(VarDAGNode.TAG_0_CREATED);
    node_A.add_tag(VarDAGNode.TAG_4_COMPUTING);
    expect(node_A.is_computable).toStrictEqual(false);
    expect(node_B.is_computable).toStrictEqual(false);
    expect(node_E.is_computable).toStrictEqual(true);
    expect(node_F.is_computable).toStrictEqual(true);

    node_E.remove_tag(VarDAGNode.TAG_4_IS_COMPUTABLE);
    node_E.add_tag(VarDAGNode.TAG_4_COMPUTED);
    node_F.remove_tag(VarDAGNode.TAG_4_COMPUTING);
    node_F.add_tag(VarDAGNode.TAG_4_COMPUTED);
    expect(node_A.is_computable).toStrictEqual(false);
    expect(node_B.is_computable).toStrictEqual(true);
    expect(node_E.is_computable).toStrictEqual(true);
    expect(node_F.is_computable).toStrictEqual(true);

    node_B.remove_tag(VarDAGNode.TAG_4_COMPUTING);
    node_B.add_tag(VarDAGNode.TAG_4_COMPUTED);
    expect(node_A.is_computable).toStrictEqual(false);
    expect(node_B.is_computable).toStrictEqual(true);
    expect(node_E.is_computable).toStrictEqual(true);
    expect(node_F.is_computable).toStrictEqual(true);

    node_C.remove_tag(VarDAGNode.TAG_0_CREATED);
    node_C.add_tag(VarDAGNode.TAG_4_COMPUTED);
    expect(node_A.is_computable).toStrictEqual(true);
    expect(node_B.is_computable).toStrictEqual(true);
    expect(node_E.is_computable).toStrictEqual(true);
    expect(node_F.is_computable).toStrictEqual(true);

});

test('DAG: test addTag', async () => {

    await FakeVarsInit.initAll();

    const dag: VarDAG = new VarDAG();
    expect(dag.current_step_tags[VarDAGNode.TAG_0_CREATED]).toBeUndefined();
    expect(dag.tags[VarDAGNode.TAG_0_CREATED]).toBeUndefined();

    const var_data_A: FakeDataVO = FakeDataHandler.get_var_data_A();
    const node_A: VarDAGNode = await VarDAGNode.getInstance(dag, var_data_A, true);

    expect(node_A.tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: true
    });
    expect(node_A['current_step']).toStrictEqual(VarDAGNode.STEP_TAGS_INDEXES[VarDAGNode.TAG_0_CREATED]);
    expect(dag.current_step_tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: {
            [var_data_A.index]: node_A
        }
    });
    expect(dag.tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: {
            [var_data_A.index]: node_A
        }
    });

    node_A.remove_tag(VarDAGNode.TAG_0_CREATED);

    expect(node_A.tags).toStrictEqual({});
    expect(node_A['current_step']).toStrictEqual(null);
    expect(dag.current_step_tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: {}
    });
    expect(dag.tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: {}
    });

    node_A.add_tag(VarDAGNode.TAG_0_CREATED);
    node_A.add_tag(VarDAGNode.TAG_7_DELETING);
    expect(node_A.tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: true,
        [VarDAGNode.TAG_7_DELETING]: true
    });
    expect(node_A['current_step']).toStrictEqual(VarDAGNode.STEP_TAGS_INDEXES[VarDAGNode.TAG_0_CREATED]);
    expect(dag.current_step_tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: {
            [var_data_A.index]: node_A
        }
    });
    expect(dag.tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: {
            [var_data_A.index]: node_A
        },
        [VarDAGNode.TAG_7_DELETING]: {
            [var_data_A.index]: node_A
        }
    });

    node_A.remove_tag(VarDAGNode.TAG_0_CREATED);
    expect(node_A.tags).toStrictEqual({
        [VarDAGNode.TAG_7_DELETING]: true
    });
    expect(node_A['current_step']).toStrictEqual(VarDAGNode.STEP_TAGS_INDEXES[VarDAGNode.TAG_7_DELETING]);
    expect(dag.current_step_tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: {},
        [VarDAGNode.TAG_7_DELETING]: {
            [var_data_A.index]: node_A
        }
    });
    expect(dag.tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: {},
        [VarDAGNode.TAG_7_DELETING]: {
            [var_data_A.index]: node_A
        }
    });

    // On ne peut pas ajouter un tag < au current_step
    expect(node_A.add_tag(VarDAGNode.TAG_0_CREATED)).toStrictEqual(false);
    expect(node_A.tags).toStrictEqual({
        [VarDAGNode.TAG_7_DELETING]: true
    });
    expect(node_A['current_step']).toStrictEqual(VarDAGNode.STEP_TAGS_INDEXES[VarDAGNode.TAG_7_DELETING]);
    expect(dag.current_step_tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: {},
        [VarDAGNode.TAG_7_DELETING]: {
            [var_data_A.index]: node_A
        }
    });
    expect(dag.tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: {},
        [VarDAGNode.TAG_7_DELETING]: {
            [var_data_A.index]: node_A
        }
    });

    node_A.remove_tag(VarDAGNode.TAG_7_DELETING);

    expect(node_A.tags).toStrictEqual({});
    expect(node_A['current_step']).toStrictEqual(null);
    expect(dag.current_step_tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: {},
        [VarDAGNode.TAG_7_DELETING]: {}
    });
    expect(dag.tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: {},
        [VarDAGNode.TAG_7_DELETING]: {}
    });

    // si l'arbre n'est pas def on doit return true sans s'inquiéter des var_dag.tags
    node_A.var_dag = null;
    expect(node_A.add_tag(VarDAGNode.TAG_0_CREATED)).toStrictEqual(true);
    expect(node_A.tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: true
    });
    expect(node_A['current_step']).toStrictEqual(VarDAGNode.STEP_TAGS_INDEXES[VarDAGNode.TAG_0_CREATED]);
    expect(dag.current_step_tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: {},
        [VarDAGNode.TAG_7_DELETING]: {}
    });
    expect(dag.tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: {},
        [VarDAGNode.TAG_7_DELETING]: {}
    });

    node_A.remove_tag(VarDAGNode.TAG_0_CREATED);
});

test('DAG: test addOutgoingDep', async () => {

    await FakeVarsInit.initAll();

    const dag: VarDAG = new VarDAG();
    expect(dag.current_step_tags[VarDAGNode.TAG_0_CREATED]).toBeUndefined();
    expect(dag.tags[VarDAGNode.TAG_0_CREATED]).toBeUndefined();

    const var_data_A: FakeDataVO = FakeDataHandler.get_var_data_A();
    const node_A: VarDAGNode = await VarDAGNode.getInstance(dag, var_data_A, true);

    const var_data_B: FakeDataVO = FakeDataHandler.get_var_data_B();
    const node_B: VarDAGNode = await VarDAGNode.getInstance(dag, var_data_B, true);

    node_A.addOutgoingDep('DEP:A>B', node_B);

    expect(node_A.outgoing_deps).toStrictEqual({
        'DEP:A>B': new VarDAGNodeDep('DEP:A>B', node_A, node_B)
    });
    expect(node_B.incoming_deps).toStrictEqual({
        'DEP:A>B': [new VarDAGNodeDep('DEP:A>B', node_A, node_B)]
    });

    node_A.addOutgoingDep('DEP:A>B', node_B);

    expect(node_A.outgoing_deps).toStrictEqual({
        'DEP:A>B': new VarDAGNodeDep('DEP:A>B', node_A, node_B)
    });
    expect(node_B.incoming_deps).toStrictEqual({
        'DEP:A>B': [new VarDAGNodeDep('DEP:A>B', node_A, node_B)]
    });
});

test('DAG: test unlinkFromDAG', async () => {

    await FakeVarsInit.initAll();

    const dag: VarDAG = await FakeDataHandler.get_fake_triangular_dag();
    const node_A: VarDAGNode = dag.nodes[FakeDataHandler.get_var_data_A().index];
    const node_B: VarDAGNode = dag.nodes[FakeDataHandler.get_var_data_B().index];
    const node_C: VarDAGNode = dag.nodes[FakeDataHandler.get_var_data_C().index];
    const node_E: VarDAGNode = dag.nodes[FakeDataHandler.get_var_data_E().index];
    const node_F: VarDAGNode = dag.nodes[FakeDataHandler.get_var_data_F().index];
    const node_G: VarDAGNode = dag.nodes[FakeDataHandler.get_var_data_G().index];
    const node_H: VarDAGNode = dag.nodes[FakeDataHandler.get_var_data_H().index];

    expect(dag.nb_nodes).toStrictEqual(7);
    expect(dag.current_step_tags[VarDAGNode.TAG_0_CREATED]).toStrictEqual({
        [FakeDataHandler.get_var_data_A().index]: node_A,
        [FakeDataHandler.get_var_data_B().index]: node_B,
        [FakeDataHandler.get_var_data_C().index]: node_C,
        [FakeDataHandler.get_var_data_E().index]: node_E,
        [FakeDataHandler.get_var_data_F().index]: node_F,
        [FakeDataHandler.get_var_data_G().index]: node_G,
        [FakeDataHandler.get_var_data_H().index]: node_H
    });
    expect(dag.nodes[FakeDataHandler.get_var_data_A().index]).toStrictEqual(node_A);
    expect(dag.nodes[FakeDataHandler.get_var_data_B().index]).toStrictEqual(node_B);
    expect(dag.nodes[FakeDataHandler.get_var_data_C().index]).toStrictEqual(node_C);
    expect(dag.nodes[FakeDataHandler.get_var_data_E().index]).toStrictEqual(node_E);
    expect(dag.nodes[FakeDataHandler.get_var_data_F().index]).toStrictEqual(node_F);
    expect(dag.nodes[FakeDataHandler.get_var_data_G().index]).toStrictEqual(node_G);
    expect(dag.nodes[FakeDataHandler.get_var_data_H().index]).toStrictEqual(node_H);

    expect(dag.roots).toStrictEqual({
        [FakeDataHandler.get_var_data_A().index]: node_A
    });
    expect(dag.leafs).toStrictEqual({
        [FakeDataHandler.get_var_data_E().index]: node_E,
        [FakeDataHandler.get_var_data_F().index]: node_F,
        [FakeDataHandler.get_var_data_G().index]: node_G,
        [FakeDataHandler.get_var_data_H().index]: node_H
    });

    expect(node_A.outgoing_deps).toStrictEqual({
        AB: new VarDAGNodeDep('AB', node_A, node_B),
        AC: new VarDAGNodeDep('AC', node_A, node_C)
    });
    expect(node_A.incoming_deps).toStrictEqual({});

    expect(node_B.outgoing_deps).toStrictEqual({
        BE: new VarDAGNodeDep('BE', node_B, node_E),
        BF: new VarDAGNodeDep('BF', node_B, node_F)
    });
    expect(node_B.incoming_deps).toStrictEqual({
        AB: [new VarDAGNodeDep('AB', node_A, node_B)]
    });

    expect(node_C.outgoing_deps).toStrictEqual({
        CG: new VarDAGNodeDep('CG', node_C, node_G),
        CH: new VarDAGNodeDep('CH', node_C, node_H)
    });
    expect(node_C.incoming_deps).toStrictEqual({
        AC: [new VarDAGNodeDep('AC', node_A, node_C)]
    });

    expect(node_E.outgoing_deps).toStrictEqual({});
    expect(node_E.incoming_deps).toStrictEqual({
        BE: [new VarDAGNodeDep('BE', node_B, node_E)]
    });

    expect(node_F.outgoing_deps).toStrictEqual({});
    expect(node_F.incoming_deps).toStrictEqual({
        BF: [new VarDAGNodeDep('BF', node_B, node_F)]
    });

    expect(node_G.outgoing_deps).toStrictEqual({});
    expect(node_G.incoming_deps).toStrictEqual({
        CG: [new VarDAGNodeDep('CG', node_C, node_G)]
    });

    expect(node_H.outgoing_deps).toStrictEqual({});
    expect(node_H.incoming_deps).toStrictEqual({
        CH: [new VarDAGNodeDep('CH', node_C, node_H)]
    });

    node_A.unlinkFromDAG();

    expect(dag.nb_nodes).toStrictEqual(6);
    expect(dag.current_step_tags[VarDAGNode.TAG_0_CREATED]).toStrictEqual({
        [FakeDataHandler.get_var_data_B().index]: node_B,
        [FakeDataHandler.get_var_data_C().index]: node_C,
        [FakeDataHandler.get_var_data_E().index]: node_E,
        [FakeDataHandler.get_var_data_F().index]: node_F,
        [FakeDataHandler.get_var_data_G().index]: node_G,
        [FakeDataHandler.get_var_data_H().index]: node_H
    });

    expect(dag.tags[VarDAGNode.TAG_0_CREATED]).toStrictEqual({
        [FakeDataHandler.get_var_data_B().index]: node_B,
        [FakeDataHandler.get_var_data_C().index]: node_C,
        [FakeDataHandler.get_var_data_E().index]: node_E,
        [FakeDataHandler.get_var_data_F().index]: node_F,
        [FakeDataHandler.get_var_data_G().index]: node_G,
        [FakeDataHandler.get_var_data_H().index]: node_H
    });

    expect(dag.nodes[FakeDataHandler.get_var_data_A().index]).toBeUndefined();
    expect(dag.nodes[FakeDataHandler.get_var_data_B().index]).toStrictEqual(node_B);
    expect(dag.nodes[FakeDataHandler.get_var_data_C().index]).toStrictEqual(node_C);
    expect(dag.nodes[FakeDataHandler.get_var_data_E().index]).toStrictEqual(node_E);
    expect(dag.nodes[FakeDataHandler.get_var_data_F().index]).toStrictEqual(node_F);
    expect(dag.nodes[FakeDataHandler.get_var_data_G().index]).toStrictEqual(node_G);
    expect(dag.nodes[FakeDataHandler.get_var_data_H().index]).toStrictEqual(node_H);

    expect(dag.roots).toStrictEqual({
        [FakeDataHandler.get_var_data_B().index]: node_B,
        [FakeDataHandler.get_var_data_C().index]: node_C
    });
    expect(dag.leafs).toStrictEqual({
        [FakeDataHandler.get_var_data_E().index]: node_E,
        [FakeDataHandler.get_var_data_F().index]: node_F,
        [FakeDataHandler.get_var_data_G().index]: node_G,
        [FakeDataHandler.get_var_data_H().index]: node_H
    });

    expect(node_B.outgoing_deps).toStrictEqual({
        BE: new VarDAGNodeDep('BE', node_B, node_E),
        BF: new VarDAGNodeDep('BF', node_B, node_F)
    });
    expect(node_B.incoming_deps).toStrictEqual({});

    expect(node_C.outgoing_deps).toStrictEqual({
        CG: new VarDAGNodeDep('CG', node_C, node_G),
        CH: new VarDAGNodeDep('CH', node_C, node_H)
    });
    expect(node_C.incoming_deps).toStrictEqual({});

    expect(node_E.outgoing_deps).toStrictEqual({});
    expect(node_E.incoming_deps).toStrictEqual({
        BE: [new VarDAGNodeDep('BE', node_B, node_E)]
    });

    expect(node_F.outgoing_deps).toStrictEqual({});
    expect(node_F.incoming_deps).toStrictEqual({
        BF: [new VarDAGNodeDep('BF', node_B, node_F)]
    });

    expect(node_G.outgoing_deps).toStrictEqual({});
    expect(node_G.incoming_deps).toStrictEqual({
        CG: [new VarDAGNodeDep('CG', node_C, node_G)]
    });

    expect(node_H.outgoing_deps).toStrictEqual({});
    expect(node_H.incoming_deps).toStrictEqual({
        CH: [new VarDAGNodeDep('CH', node_C, node_H)]
    });

    // On peut pas supprimer un noeud qui a des incoming deps
    node_E.unlinkFromDAG();

    expect(dag.nb_nodes).toStrictEqual(6);
    expect(dag.current_step_tags[VarDAGNode.TAG_0_CREATED]).toStrictEqual({
        [FakeDataHandler.get_var_data_B().index]: node_B,
        [FakeDataHandler.get_var_data_C().index]: node_C,
        [FakeDataHandler.get_var_data_E().index]: node_E,
        [FakeDataHandler.get_var_data_F().index]: node_F,
        [FakeDataHandler.get_var_data_G().index]: node_G,
        [FakeDataHandler.get_var_data_H().index]: node_H
    });

    expect(dag.tags[VarDAGNode.TAG_0_CREATED]).toStrictEqual({
        [FakeDataHandler.get_var_data_B().index]: node_B,
        [FakeDataHandler.get_var_data_C().index]: node_C,
        [FakeDataHandler.get_var_data_E().index]: node_E,
        [FakeDataHandler.get_var_data_F().index]: node_F,
        [FakeDataHandler.get_var_data_G().index]: node_G,
        [FakeDataHandler.get_var_data_H().index]: node_H
    });

    expect(dag.nodes[FakeDataHandler.get_var_data_A().index]).toBeUndefined();
    expect(dag.nodes[FakeDataHandler.get_var_data_B().index]).toStrictEqual(node_B);
    expect(dag.nodes[FakeDataHandler.get_var_data_C().index]).toStrictEqual(node_C);
    expect(dag.nodes[FakeDataHandler.get_var_data_E().index]).toStrictEqual(node_E);
    expect(dag.nodes[FakeDataHandler.get_var_data_F().index]).toStrictEqual(node_F);
    expect(dag.nodes[FakeDataHandler.get_var_data_G().index]).toStrictEqual(node_G);
    expect(dag.nodes[FakeDataHandler.get_var_data_H().index]).toStrictEqual(node_H);

    expect(dag.roots).toStrictEqual({
        [FakeDataHandler.get_var_data_B().index]: node_B,
        [FakeDataHandler.get_var_data_C().index]: node_C
    });
    expect(dag.leafs).toStrictEqual({
        [FakeDataHandler.get_var_data_E().index]: node_E,
        [FakeDataHandler.get_var_data_F().index]: node_F,
        [FakeDataHandler.get_var_data_G().index]: node_G,
        [FakeDataHandler.get_var_data_H().index]: node_H
    });

    expect(node_B.outgoing_deps).toStrictEqual({
        BE: new VarDAGNodeDep('BE', node_B, node_E),
        BF: new VarDAGNodeDep('BF', node_B, node_F)
    });
    expect(node_B.incoming_deps).toStrictEqual({});

    expect(node_C.outgoing_deps).toStrictEqual({
        CG: new VarDAGNodeDep('CG', node_C, node_G),
        CH: new VarDAGNodeDep('CH', node_C, node_H)
    });
    expect(node_C.incoming_deps).toStrictEqual({});

    expect(node_E.outgoing_deps).toStrictEqual({});
    expect(node_E.incoming_deps).toStrictEqual({
        BE: [new VarDAGNodeDep('BE', node_B, node_E)]
    });

    expect(node_F.outgoing_deps).toStrictEqual({});
    expect(node_F.incoming_deps).toStrictEqual({
        BF: [new VarDAGNodeDep('BF', node_B, node_F)]
    });

    expect(node_G.outgoing_deps).toStrictEqual({});
    expect(node_G.incoming_deps).toStrictEqual({
        CG: [new VarDAGNodeDep('CG', node_C, node_G)]
    });

    expect(node_H.outgoing_deps).toStrictEqual({});
    expect(node_H.incoming_deps).toStrictEqual({
        CH: [new VarDAGNodeDep('CH', node_C, node_H)]
    });
});