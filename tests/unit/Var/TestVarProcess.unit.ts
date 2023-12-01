/* tslint:disable:no-unused-expression */
import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { expect, test } from "playwright-test-coverage";
import ConfigurationService from '../../../src/server/env/ConfigurationService';
import CurrentVarDAGHolder from '../../../src/server/modules/Var/CurrentVarDAGHolder';
import VarsProcessCompute from '../../../src/server/modules/Var/bgthreads/processes/VarsProcessCompute';
import VarsProcessDagCleaner from '../../../src/server/modules/Var/bgthreads/processes/VarsProcessDagCleaner';
import VarsProcessDeployDeps from '../../../src/server/modules/Var/bgthreads/processes/VarsProcessDeployDeps';
import VarsProcessLoadDatas from '../../../src/server/modules/Var/bgthreads/processes/VarsProcessLoadDatas';
import VarsProcessNotifyEnd from '../../../src/server/modules/Var/bgthreads/processes/VarsProcessNotifyEnd';
import VarsProcessNotifyStart from '../../../src/server/modules/Var/bgthreads/processes/VarsProcessNotifyStart';
import VarsProcessUpdateDB from '../../../src/server/modules/Var/bgthreads/processes/VarsProcessUpdateDB';
import VarDAG from '../../../src/server/modules/Var/vos/VarDAG';
import VarDAGNode from '../../../src/server/modules/Var/vos/VarDAGNode';
import ConsoleHandler from '../../../src/shared/tools/ConsoleHandler';
import PromisePipeline from '../../../src/shared/tools/PromisePipeline/PromisePipeline';
import FakeTriangularValidDataHandler from './fakes/vars_triangular_dag/FakeTriangularValidDataHandler';
import FakeTriangularVarsInit from './fakes/vars_triangular_dag/FakeTriangularVarsInit';

ConsoleHandler.init();
ConfigurationService.setEnvParams({});
ConfigurationService.IS_UNIT_TEST_MODE = true;

test('DAG: test var process', async () => {

    await FakeTriangularVarsInit.initAll();

    /**
     * exemple :
     *                           A
     *                          / \
     *                         B   C
     *                        / \ / \
     *                       E  F G  H
     *
     * bottom->up to node B => [E, F, B]
     */

    let dag: VarDAG = await FakeTriangularValidDataHandler.get_fake_triangular_dag();
    CurrentVarDAGHolder.current_vardag = dag;
    let node_a = dag.nodes[FakeTriangularValidDataHandler.get_expected_var_data_A_index()];
    let node_b = dag.nodes[FakeTriangularValidDataHandler.get_expected_var_data_B_index()];
    let node_c = dag.nodes[FakeTriangularValidDataHandler.get_expected_var_data_C_index()];
    let node_e = dag.nodes[FakeTriangularValidDataHandler.get_expected_var_data_E_index()];
    let node_f = dag.nodes[FakeTriangularValidDataHandler.get_expected_var_data_F_index()];
    let node_g = dag.nodes[FakeTriangularValidDataHandler.get_expected_var_data_G_index()];
    let node_h = dag.nodes[FakeTriangularValidDataHandler.get_expected_var_data_H_index()];

    expect(node_a.tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: true
    });
    expect(node_b.tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: true
    });
    expect(node_c.tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: true
    });
    expect(node_e.tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: true
    });
    expect(node_f.tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: true
    });
    expect(node_g.tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: true
    });
    expect(node_h.tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: true
    });

    expect(dag.current_step_tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: {
            [node_a.var_data.index]: node_a,
            [node_b.var_data.index]: node_b,
            [node_c.var_data.index]: node_c,
            [node_e.var_data.index]: node_e,
            [node_f.var_data.index]: node_f,
            [node_g.var_data.index]: node_g,
            [node_h.var_data.index]: node_h
        }
    });

    // Si on tente un autre process que le notify_start sur l'arbre, il ne devrait rien se passer pour le moment puisque les noeuds sont pas dans l'état nécessaire)
    let promise_pipeline = new PromisePipeline(10, 'test');
    let did_something = await VarsProcessCompute.getInstance()['handle_individual_worker'](promise_pipeline);
    did_something = did_something || await VarsProcessDagCleaner.getInstance()['handle_individual_worker'](promise_pipeline);
    did_something = did_something || await VarsProcessDeployDeps.getInstance()['handle_individual_worker'](promise_pipeline);
    did_something = did_something || await VarsProcessLoadDatas.getInstance()['handle_individual_worker'](promise_pipeline);
    did_something = did_something || await VarsProcessNotifyEnd.getInstance()['handle_batch_worker']();
    did_something = did_something || await VarsProcessUpdateDB.getInstance()['handle_batch_worker']();
    await promise_pipeline.end();

    expect(did_something).toBeFalsy();

    expect(node_a.tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: true
    });
    expect(node_b.tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: true
    });
    expect(node_c.tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: true
    });
    expect(node_e.tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: true
    });
    expect(node_f.tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: true
    });
    expect(node_g.tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: true
    });
    expect(node_h.tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: true
    });

    expect(dag.current_step_tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: {
            [node_a.var_data.index]: node_a,
            [node_b.var_data.index]: node_b,
            [node_c.var_data.index]: node_c,
            [node_e.var_data.index]: node_e,
            [node_f.var_data.index]: node_f,
            [node_g.var_data.index]: node_g,
            [node_h.var_data.index]: node_h
        }
    });

    // On lance le process de notification de début de traitement
    did_something = await VarsProcessNotifyStart.getInstance()['handle_batch_worker']();
    expect(did_something).toBeTruthy();

    expect(node_a.tags).toStrictEqual({
        [VarDAGNode.TAG_1_NOTIFIED_START]: true
    });
    expect(node_b.tags).toStrictEqual({
        [VarDAGNode.TAG_1_NOTIFIED_START]: true
    });
    expect(node_c.tags).toStrictEqual({
        [VarDAGNode.TAG_1_NOTIFIED_START]: true
    });
    expect(node_e.tags).toStrictEqual({
        [VarDAGNode.TAG_1_NOTIFIED_START]: true
    });
    expect(node_f.tags).toStrictEqual({
        [VarDAGNode.TAG_1_NOTIFIED_START]: true
    });
    expect(node_g.tags).toStrictEqual({
        [VarDAGNode.TAG_1_NOTIFIED_START]: true
    });
    expect(node_h.tags).toStrictEqual({
        [VarDAGNode.TAG_1_NOTIFIED_START]: true
    });

    expect(node_a['current_step']).toStrictEqual(VarDAGNode.STEP_TAGS_INDEXES[VarDAGNode.TAG_1_NOTIFIED_START]);
    expect(node_b['current_step']).toStrictEqual(VarDAGNode.STEP_TAGS_INDEXES[VarDAGNode.TAG_1_NOTIFIED_START]);
    expect(node_c['current_step']).toStrictEqual(VarDAGNode.STEP_TAGS_INDEXES[VarDAGNode.TAG_1_NOTIFIED_START]);
    expect(node_e['current_step']).toStrictEqual(VarDAGNode.STEP_TAGS_INDEXES[VarDAGNode.TAG_1_NOTIFIED_START]);
    expect(node_f['current_step']).toStrictEqual(VarDAGNode.STEP_TAGS_INDEXES[VarDAGNode.TAG_1_NOTIFIED_START]);
    expect(node_g['current_step']).toStrictEqual(VarDAGNode.STEP_TAGS_INDEXES[VarDAGNode.TAG_1_NOTIFIED_START]);
    expect(node_h['current_step']).toStrictEqual(VarDAGNode.STEP_TAGS_INDEXES[VarDAGNode.TAG_1_NOTIFIED_START]);

    expect(dag.current_step_tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: {},
        [VarDAGNode.TAG_1_NOTIFYING_START]: {},
        [VarDAGNode.TAG_1_NOTIFIED_START]: {
            [node_a.var_data.index]: node_a,
            [node_b.var_data.index]: node_b,
            [node_c.var_data.index]: node_c,
            [node_e.var_data.index]: node_e,
            [node_f.var_data.index]: node_f,
            [node_g.var_data.index]: node_g,
            [node_h.var_data.index]: node_h
        }
    });

    // Si on tente un autre process que le DEPLOYING sur l'arbre, il ne devrait rien se passer pour le moment puisque les noeuds sont pas dans l'état nécessaire)
    did_something = await VarsProcessCompute.getInstance()['handle_individual_worker'](promise_pipeline);
    did_something = did_something || await VarsProcessDagCleaner.getInstance()['handle_individual_worker'](promise_pipeline);
    // did_something = did_something || await VarsProcessDeployDeps.getInstance()['handle_individual_worker'](promise_pipeline);
    did_something = did_something || await VarsProcessNotifyStart.getInstance()['handle_batch_worker']();
    did_something = did_something || await VarsProcessLoadDatas.getInstance()['handle_individual_worker'](promise_pipeline);
    did_something = did_something || await VarsProcessNotifyEnd.getInstance()['handle_batch_worker']();
    did_something = did_something || await VarsProcessUpdateDB.getInstance()['handle_batch_worker']();
    await promise_pipeline.end();

    expect(did_something).toBeFalsy();

    expect(node_a.tags).toStrictEqual({
        [VarDAGNode.TAG_1_NOTIFIED_START]: true
    });
    expect(node_b.tags).toStrictEqual({
        [VarDAGNode.TAG_1_NOTIFIED_START]: true
    });
    expect(node_c.tags).toStrictEqual({
        [VarDAGNode.TAG_1_NOTIFIED_START]: true
    });
    expect(node_e.tags).toStrictEqual({
        [VarDAGNode.TAG_1_NOTIFIED_START]: true
    });
    expect(node_f.tags).toStrictEqual({
        [VarDAGNode.TAG_1_NOTIFIED_START]: true
    });
    expect(node_g.tags).toStrictEqual({
        [VarDAGNode.TAG_1_NOTIFIED_START]: true
    });
    expect(node_h.tags).toStrictEqual({
        [VarDAGNode.TAG_1_NOTIFIED_START]: true
    });

    expect(dag.current_step_tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: {},
        [VarDAGNode.TAG_1_NOTIFYING_START]: {},
        [VarDAGNode.TAG_1_NOTIFIED_START]: {
            [node_a.var_data.index]: node_a,
            [node_b.var_data.index]: node_b,
            [node_c.var_data.index]: node_c,
            [node_e.var_data.index]: node_e,
            [node_f.var_data.index]: node_f,
            [node_g.var_data.index]: node_g,
            [node_h.var_data.index]: node_h
        }
    });

    // On lance le process de notification de début de traitement
    did_something = await VarsProcessDeployDeps.getInstance()['handle_individual_worker'](promise_pipeline);
    await promise_pipeline.end();
    expect(did_something).toBeTruthy();

    expect(node_a.tags).toStrictEqual({
        [VarDAGNode.TAG_2_DEPLOYED]: true
    });
    expect(node_b.tags).toStrictEqual({
        [VarDAGNode.TAG_2_DEPLOYED]: true
    });
    expect(node_c.tags).toStrictEqual({
        [VarDAGNode.TAG_2_DEPLOYED]: true
    });
    expect(node_e.tags).toStrictEqual({
        [VarDAGNode.TAG_2_DEPLOYED]: true
    });
    expect(node_f.tags).toStrictEqual({
        [VarDAGNode.TAG_2_DEPLOYED]: true
    });
    expect(node_g.tags).toStrictEqual({
        [VarDAGNode.TAG_2_DEPLOYED]: true
    });
    expect(node_h.tags).toStrictEqual({
        [VarDAGNode.TAG_2_DEPLOYED]: true
    });

    expect(dag.current_step_tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: {},
        [VarDAGNode.TAG_1_NOTIFYING_START]: {},
        [VarDAGNode.TAG_1_NOTIFIED_START]: {},
        [VarDAGNode.TAG_2_DEPLOYING]: {},
        [VarDAGNode.TAG_2_DEPLOYED]: {
            [node_a.var_data.index]: node_a,
            [node_b.var_data.index]: node_b,
            [node_c.var_data.index]: node_c,
            [node_e.var_data.index]: node_e,
            [node_f.var_data.index]: node_f,
            [node_g.var_data.index]: node_g,
            [node_h.var_data.index]: node_h
        }
    });

    // Si on tente un autre process que le DATA_LOADING sur l'arbre, il ne devrait rien se passer pour le moment puisque les noeuds sont pas dans l'état nécessaire)
    did_something = await VarsProcessCompute.getInstance()['handle_individual_worker'](promise_pipeline);
    did_something = did_something || await VarsProcessDagCleaner.getInstance()['handle_individual_worker'](promise_pipeline);
    did_something = did_something || await VarsProcessDeployDeps.getInstance()['handle_individual_worker'](promise_pipeline);
    did_something = did_something || await VarsProcessNotifyStart.getInstance()['handle_batch_worker']();
    // did_something = did_something || await VarsProcessLoadDatas.getInstance()['handle_individual_worker'](promise_pipeline);
    did_something = did_something || await VarsProcessNotifyEnd.getInstance()['handle_batch_worker']();
    did_something = did_something || await VarsProcessUpdateDB.getInstance()['handle_batch_worker']();
    await promise_pipeline.end();

    expect(did_something).toBeFalsy();

    expect(node_a.tags).toStrictEqual({
        [VarDAGNode.TAG_2_DEPLOYED]: true
    });
    expect(node_b.tags).toStrictEqual({
        [VarDAGNode.TAG_2_DEPLOYED]: true
    });
    expect(node_c.tags).toStrictEqual({
        [VarDAGNode.TAG_2_DEPLOYED]: true
    });
    expect(node_e.tags).toStrictEqual({
        [VarDAGNode.TAG_2_DEPLOYED]: true
    });
    expect(node_f.tags).toStrictEqual({
        [VarDAGNode.TAG_2_DEPLOYED]: true
    });
    expect(node_g.tags).toStrictEqual({
        [VarDAGNode.TAG_2_DEPLOYED]: true
    });
    expect(node_h.tags).toStrictEqual({
        [VarDAGNode.TAG_2_DEPLOYED]: true
    });

    expect(dag.current_step_tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: {},
        [VarDAGNode.TAG_1_NOTIFYING_START]: {},
        [VarDAGNode.TAG_1_NOTIFIED_START]: {},
        [VarDAGNode.TAG_2_DEPLOYING]: {},
        [VarDAGNode.TAG_2_DEPLOYED]: {
            [node_a.var_data.index]: node_a,
            [node_b.var_data.index]: node_b,
            [node_c.var_data.index]: node_c,
            [node_e.var_data.index]: node_e,
            [node_f.var_data.index]: node_f,
            [node_g.var_data.index]: node_g,
            [node_h.var_data.index]: node_h
        }
    });

    // On lance le process de notification de début de traitement
    did_something = await VarsProcessLoadDatas.getInstance()['handle_individual_worker'](promise_pipeline);
    await promise_pipeline.end();
    expect(did_something).toBeTruthy();

    expect(node_a.tags).toStrictEqual({
        [VarDAGNode.TAG_3_DATA_LOADED]: true
    });
    expect(node_b.tags).toStrictEqual({
        [VarDAGNode.TAG_3_DATA_LOADED]: true
    });
    expect(node_c.tags).toStrictEqual({
        [VarDAGNode.TAG_3_DATA_LOADED]: true
    });
    expect(node_e.tags).toStrictEqual({
        [VarDAGNode.TAG_4_IS_COMPUTABLE]: true
    });
    expect(node_f.tags).toStrictEqual({
        [VarDAGNode.TAG_4_IS_COMPUTABLE]: true
    });
    expect(node_g.tags).toStrictEqual({
        [VarDAGNode.TAG_4_IS_COMPUTABLE]: true
    });
    expect(node_h.tags).toStrictEqual({
        [VarDAGNode.TAG_4_IS_COMPUTABLE]: true
    });

    expect(dag.current_step_tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: {},
        [VarDAGNode.TAG_1_NOTIFYING_START]: {},
        [VarDAGNode.TAG_1_NOTIFIED_START]: {},
        [VarDAGNode.TAG_2_DEPLOYING]: {},
        [VarDAGNode.TAG_2_DEPLOYED]: {},
        [VarDAGNode.TAG_3_DATA_LOADING]: {},
        [VarDAGNode.TAG_3_DATA_LOADED]: {
            [node_a.var_data.index]: node_a,
            [node_b.var_data.index]: node_b,
            [node_c.var_data.index]: node_c
        },
        [VarDAGNode.TAG_4_IS_COMPUTABLE]: {
            [node_e.var_data.index]: node_e,
            [node_f.var_data.index]: node_f,
            [node_g.var_data.index]: node_g,
            [node_h.var_data.index]: node_h
        }
    });

    // Si on tente un autre process que le COMPUTING sur l'arbre, il ne devrait rien se passer pour le moment puisque les noeuds sont pas dans l'état nécessaire)
    // did_something = await VarsProcessCompute.getInstance()['handle_individual_worker'](promise_pipeline);
    did_something = await VarsProcessDagCleaner.getInstance()['handle_individual_worker'](promise_pipeline);
    did_something = did_something || await VarsProcessDeployDeps.getInstance()['handle_individual_worker'](promise_pipeline);
    did_something = did_something || await VarsProcessNotifyStart.getInstance()['handle_batch_worker']();
    did_something = did_something || await VarsProcessLoadDatas.getInstance()['handle_individual_worker'](promise_pipeline);
    did_something = did_something || await VarsProcessNotifyEnd.getInstance()['handle_batch_worker']();
    did_something = did_something || await VarsProcessUpdateDB.getInstance()['handle_batch_worker']();
    await promise_pipeline.end();

    expect(did_something).toBeFalsy();

    expect(node_a.tags).toStrictEqual({
        [VarDAGNode.TAG_3_DATA_LOADED]: true
    });
    expect(node_b.tags).toStrictEqual({
        [VarDAGNode.TAG_3_DATA_LOADED]: true
    });
    expect(node_c.tags).toStrictEqual({
        [VarDAGNode.TAG_3_DATA_LOADED]: true
    });
    expect(node_e.tags).toStrictEqual({
        [VarDAGNode.TAG_4_IS_COMPUTABLE]: true
    });
    expect(node_f.tags).toStrictEqual({
        [VarDAGNode.TAG_4_IS_COMPUTABLE]: true
    });
    expect(node_g.tags).toStrictEqual({
        [VarDAGNode.TAG_4_IS_COMPUTABLE]: true
    });
    expect(node_h.tags).toStrictEqual({
        [VarDAGNode.TAG_4_IS_COMPUTABLE]: true
    });

    expect(dag.current_step_tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: {},
        [VarDAGNode.TAG_1_NOTIFYING_START]: {},
        [VarDAGNode.TAG_1_NOTIFIED_START]: {},
        [VarDAGNode.TAG_2_DEPLOYING]: {},
        [VarDAGNode.TAG_2_DEPLOYED]: {},
        [VarDAGNode.TAG_3_DATA_LOADING]: {},
        [VarDAGNode.TAG_3_DATA_LOADED]: {
            [node_a.var_data.index]: node_a,
            [node_b.var_data.index]: node_b,
            [node_c.var_data.index]: node_c
        },
        [VarDAGNode.TAG_4_IS_COMPUTABLE]: {
            [node_e.var_data.index]: node_e,
            [node_f.var_data.index]: node_f,
            [node_g.var_data.index]: node_g,
            [node_h.var_data.index]: node_h
        }
    });

    // On lance le process de notification de début de traitement
    did_something = await VarsProcessCompute.getInstance()['handle_individual_worker'](promise_pipeline);
    await promise_pipeline.end();
    expect(did_something).toBeTruthy();

    // On computer le premier étage
    expect(node_a.tags).toStrictEqual({
        [VarDAGNode.TAG_3_DATA_LOADED]: true
    });
    expect(node_b.tags).toStrictEqual({
        [VarDAGNode.TAG_4_IS_COMPUTABLE]: true
    });
    expect(node_c.tags).toStrictEqual({
        [VarDAGNode.TAG_4_IS_COMPUTABLE]: true
    });
    expect(node_e.tags).toStrictEqual({
        [VarDAGNode.TAG_4_COMPUTED]: true
    });
    expect(node_f.tags).toStrictEqual({
        [VarDAGNode.TAG_4_COMPUTED]: true
    });
    expect(node_g.tags).toStrictEqual({
        [VarDAGNode.TAG_4_COMPUTED]: true
    });
    expect(node_h.tags).toStrictEqual({
        [VarDAGNode.TAG_4_COMPUTED]: true
    });

    expect(dag.current_step_tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: {},
        [VarDAGNode.TAG_1_NOTIFYING_START]: {},
        [VarDAGNode.TAG_1_NOTIFIED_START]: {},
        [VarDAGNode.TAG_2_DEPLOYING]: {},
        [VarDAGNode.TAG_2_DEPLOYED]: {},
        [VarDAGNode.TAG_3_DATA_LOADING]: {},
        [VarDAGNode.TAG_3_DATA_LOADED]: {
            [node_a.var_data.index]: node_a
        },
        [VarDAGNode.TAG_4_IS_COMPUTABLE]: {
            [node_b.var_data.index]: node_b,
            [node_c.var_data.index]: node_c
        },
        [VarDAGNode.TAG_4_COMPUTING]: {},
        [VarDAGNode.TAG_4_COMPUTED]: {
            [node_e.var_data.index]: node_e,
            [node_f.var_data.index]: node_f,
            [node_g.var_data.index]: node_g,
            [node_h.var_data.index]: node_h
        }
    });

    // On lance le process de notification de début de traitement
    did_something = await VarsProcessCompute.getInstance()['handle_individual_worker'](promise_pipeline);
    await promise_pipeline.end();
    expect(did_something).toBeTruthy();

    // On computer le second étage
    expect(node_a.tags).toStrictEqual({
        [VarDAGNode.TAG_4_IS_COMPUTABLE]: true
    });
    expect(node_b.tags).toStrictEqual({
        [VarDAGNode.TAG_4_COMPUTED]: true
    });
    expect(node_c.tags).toStrictEqual({
        [VarDAGNode.TAG_4_COMPUTED]: true
    });
    expect(node_e.tags).toStrictEqual({
        [VarDAGNode.TAG_4_COMPUTED]: true
    });
    expect(node_f.tags).toStrictEqual({
        [VarDAGNode.TAG_4_COMPUTED]: true
    });
    expect(node_g.tags).toStrictEqual({
        [VarDAGNode.TAG_4_COMPUTED]: true
    });
    expect(node_h.tags).toStrictEqual({
        [VarDAGNode.TAG_4_COMPUTED]: true
    });

    expect(dag.current_step_tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: {},
        [VarDAGNode.TAG_1_NOTIFYING_START]: {},
        [VarDAGNode.TAG_1_NOTIFIED_START]: {},
        [VarDAGNode.TAG_2_DEPLOYING]: {},
        [VarDAGNode.TAG_2_DEPLOYED]: {},
        [VarDAGNode.TAG_3_DATA_LOADING]: {},
        [VarDAGNode.TAG_3_DATA_LOADED]: {},
        [VarDAGNode.TAG_4_IS_COMPUTABLE]: {
            [node_a.var_data.index]: node_a
        },
        [VarDAGNode.TAG_4_COMPUTING]: {},
        [VarDAGNode.TAG_4_COMPUTED]: {
            [node_b.var_data.index]: node_b,
            [node_c.var_data.index]: node_c,

            [node_e.var_data.index]: node_e,
            [node_f.var_data.index]: node_f,
            [node_g.var_data.index]: node_g,
            [node_h.var_data.index]: node_h
        }
    });

    // On lance le process de notification de début de traitement
    did_something = await VarsProcessCompute.getInstance()['handle_individual_worker'](promise_pipeline);
    await promise_pipeline.end();
    expect(did_something).toBeTruthy();

    // On computer le troisième étage
    expect(node_a.tags).toStrictEqual({
        [VarDAGNode.TAG_4_COMPUTED]: true
    });
    expect(node_b.tags).toStrictEqual({
        [VarDAGNode.TAG_4_COMPUTED]: true
    });
    expect(node_c.tags).toStrictEqual({
        [VarDAGNode.TAG_4_COMPUTED]: true
    });
    expect(node_e.tags).toStrictEqual({
        [VarDAGNode.TAG_4_COMPUTED]: true
    });
    expect(node_f.tags).toStrictEqual({
        [VarDAGNode.TAG_4_COMPUTED]: true
    });
    expect(node_g.tags).toStrictEqual({
        [VarDAGNode.TAG_4_COMPUTED]: true
    });
    expect(node_h.tags).toStrictEqual({
        [VarDAGNode.TAG_4_COMPUTED]: true
    });

    expect(dag.current_step_tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: {},
        [VarDAGNode.TAG_1_NOTIFYING_START]: {},
        [VarDAGNode.TAG_1_NOTIFIED_START]: {},
        [VarDAGNode.TAG_2_DEPLOYING]: {},
        [VarDAGNode.TAG_2_DEPLOYED]: {},
        [VarDAGNode.TAG_3_DATA_LOADING]: {},
        [VarDAGNode.TAG_3_DATA_LOADED]: {},
        [VarDAGNode.TAG_4_IS_COMPUTABLE]: {},
        [VarDAGNode.TAG_4_COMPUTING]: {},
        [VarDAGNode.TAG_4_COMPUTED]: {
            [node_a.var_data.index]: node_a,

            [node_b.var_data.index]: node_b,
            [node_c.var_data.index]: node_c,

            [node_e.var_data.index]: node_e,
            [node_f.var_data.index]: node_f,
            [node_g.var_data.index]: node_g,
            [node_h.var_data.index]: node_h
        }
    });

    // Si on tente un autre process que le NOTIFYING_END sur l'arbre, il ne devrait rien se passer pour le moment puisque les noeuds sont pas dans l'état nécessaire)
    did_something = await VarsProcessCompute.getInstance()['handle_individual_worker'](promise_pipeline);
    did_something = did_something || await VarsProcessDagCleaner.getInstance()['handle_individual_worker'](promise_pipeline);
    did_something = did_something || await VarsProcessDeployDeps.getInstance()['handle_individual_worker'](promise_pipeline);
    did_something = did_something || await VarsProcessNotifyStart.getInstance()['handle_batch_worker']();
    did_something = did_something || await VarsProcessLoadDatas.getInstance()['handle_individual_worker'](promise_pipeline);
    // did_something = did_something || await VarsProcessNotifyEnd.getInstance()['handle_batch_worker']();
    did_something = did_something || await VarsProcessUpdateDB.getInstance()['handle_batch_worker']();
    await promise_pipeline.end();

    expect(did_something).toBeFalsy();

    expect(node_a.tags).toStrictEqual({
        [VarDAGNode.TAG_4_COMPUTED]: true
    });
    expect(node_b.tags).toStrictEqual({
        [VarDAGNode.TAG_4_COMPUTED]: true
    });
    expect(node_c.tags).toStrictEqual({
        [VarDAGNode.TAG_4_COMPUTED]: true
    });
    expect(node_e.tags).toStrictEqual({
        [VarDAGNode.TAG_4_COMPUTED]: true
    });
    expect(node_f.tags).toStrictEqual({
        [VarDAGNode.TAG_4_COMPUTED]: true
    });
    expect(node_g.tags).toStrictEqual({
        [VarDAGNode.TAG_4_COMPUTED]: true
    });
    expect(node_h.tags).toStrictEqual({
        [VarDAGNode.TAG_4_COMPUTED]: true
    });

    expect(dag.current_step_tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: {},
        [VarDAGNode.TAG_1_NOTIFYING_START]: {},
        [VarDAGNode.TAG_1_NOTIFIED_START]: {},
        [VarDAGNode.TAG_2_DEPLOYING]: {},
        [VarDAGNode.TAG_2_DEPLOYED]: {},
        [VarDAGNode.TAG_3_DATA_LOADING]: {},
        [VarDAGNode.TAG_3_DATA_LOADED]: {},
        [VarDAGNode.TAG_4_IS_COMPUTABLE]: {},
        [VarDAGNode.TAG_4_COMPUTING]: {},
        [VarDAGNode.TAG_4_COMPUTED]: {
            [node_a.var_data.index]: node_a,

            [node_b.var_data.index]: node_b,
            [node_c.var_data.index]: node_c,

            [node_e.var_data.index]: node_e,
            [node_f.var_data.index]: node_f,
            [node_g.var_data.index]: node_g,
            [node_h.var_data.index]: node_h
        }
    });

    // On lance le process de notification de début de traitement
    did_something = await VarsProcessNotifyEnd.getInstance()['handle_batch_worker']();
    await promise_pipeline.end();
    expect(did_something).toBeTruthy();

    expect(node_a.tags).toStrictEqual({
        [VarDAGNode.TAG_5_NOTIFIED_END]: true
    });
    expect(node_b.tags).toStrictEqual({
        [VarDAGNode.TAG_5_NOTIFIED_END]: true
    });
    expect(node_c.tags).toStrictEqual({
        [VarDAGNode.TAG_5_NOTIFIED_END]: true
    });
    expect(node_e.tags).toStrictEqual({
        [VarDAGNode.TAG_5_NOTIFIED_END]: true
    });
    expect(node_f.tags).toStrictEqual({
        [VarDAGNode.TAG_5_NOTIFIED_END]: true
    });
    expect(node_g.tags).toStrictEqual({
        [VarDAGNode.TAG_5_NOTIFIED_END]: true
    });
    expect(node_h.tags).toStrictEqual({
        [VarDAGNode.TAG_5_NOTIFIED_END]: true
    });

    expect(dag.current_step_tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: {},
        [VarDAGNode.TAG_1_NOTIFYING_START]: {},
        [VarDAGNode.TAG_1_NOTIFIED_START]: {},
        [VarDAGNode.TAG_2_DEPLOYING]: {},
        [VarDAGNode.TAG_2_DEPLOYED]: {},
        [VarDAGNode.TAG_3_DATA_LOADING]: {},
        [VarDAGNode.TAG_3_DATA_LOADED]: {},
        [VarDAGNode.TAG_4_IS_COMPUTABLE]: {},
        [VarDAGNode.TAG_4_COMPUTING]: {},
        [VarDAGNode.TAG_4_COMPUTED]: {},
        [VarDAGNode.TAG_5_NOTIFYING_END]: {},
        [VarDAGNode.TAG_5_NOTIFIED_END]: {
            [node_a.var_data.index]: node_a,

            [node_b.var_data.index]: node_b,
            [node_c.var_data.index]: node_c,

            [node_e.var_data.index]: node_e,
            [node_f.var_data.index]: node_f,
            [node_g.var_data.index]: node_g,
            [node_h.var_data.index]: node_h
        }
    });

    // Si on tente un autre process que le UPDATING_IN_DB sur l'arbre, il ne devrait rien se passer pour le moment puisque les noeuds sont pas dans l'état nécessaire)
    did_something = await VarsProcessCompute.getInstance()['handle_individual_worker'](promise_pipeline);
    did_something = did_something || await VarsProcessDagCleaner.getInstance()['handle_individual_worker'](promise_pipeline);
    did_something = did_something || await VarsProcessDeployDeps.getInstance()['handle_individual_worker'](promise_pipeline);
    did_something = did_something || await VarsProcessNotifyStart.getInstance()['handle_batch_worker']();
    did_something = did_something || await VarsProcessLoadDatas.getInstance()['handle_individual_worker'](promise_pipeline);
    did_something = did_something || await VarsProcessNotifyEnd.getInstance()['handle_batch_worker']();
    // did_something = did_something || await VarsProcessUpdateDB.getInstance()['handle_batch_worker']();
    await promise_pipeline.end();

    expect(did_something).toBeFalsy();

    expect(node_a.tags).toStrictEqual({
        [VarDAGNode.TAG_5_NOTIFIED_END]: true
    });
    expect(node_b.tags).toStrictEqual({
        [VarDAGNode.TAG_5_NOTIFIED_END]: true
    });
    expect(node_c.tags).toStrictEqual({
        [VarDAGNode.TAG_5_NOTIFIED_END]: true
    });
    expect(node_e.tags).toStrictEqual({
        [VarDAGNode.TAG_5_NOTIFIED_END]: true
    });
    expect(node_f.tags).toStrictEqual({
        [VarDAGNode.TAG_5_NOTIFIED_END]: true
    });
    expect(node_g.tags).toStrictEqual({
        [VarDAGNode.TAG_5_NOTIFIED_END]: true
    });
    expect(node_h.tags).toStrictEqual({
        [VarDAGNode.TAG_5_NOTIFIED_END]: true
    });

    expect(dag.current_step_tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: {},
        [VarDAGNode.TAG_1_NOTIFYING_START]: {},
        [VarDAGNode.TAG_1_NOTIFIED_START]: {},
        [VarDAGNode.TAG_2_DEPLOYING]: {},
        [VarDAGNode.TAG_2_DEPLOYED]: {},
        [VarDAGNode.TAG_3_DATA_LOADING]: {},
        [VarDAGNode.TAG_3_DATA_LOADED]: {},
        [VarDAGNode.TAG_4_IS_COMPUTABLE]: {},
        [VarDAGNode.TAG_4_COMPUTING]: {},
        [VarDAGNode.TAG_4_COMPUTED]: {},
        [VarDAGNode.TAG_5_NOTIFYING_END]: {},
        [VarDAGNode.TAG_5_NOTIFIED_END]: {
            [node_a.var_data.index]: node_a,

            [node_b.var_data.index]: node_b,
            [node_c.var_data.index]: node_c,

            [node_e.var_data.index]: node_e,
            [node_f.var_data.index]: node_f,
            [node_g.var_data.index]: node_g,
            [node_h.var_data.index]: node_h
        }
    });

    // On lance le process de notification de début de traitement
    did_something = await VarsProcessUpdateDB.getInstance()['handle_batch_worker']();
    await promise_pipeline.end();
    expect(did_something).toBeTruthy();

    expect(node_a.tags).toStrictEqual({
        [VarDAGNode.TAG_7_IS_DELETABLE]: true
    });
    expect(node_b.tags).toStrictEqual({
        [VarDAGNode.TAG_6_UPDATED_IN_DB]: true
    });
    expect(node_c.tags).toStrictEqual({
        [VarDAGNode.TAG_6_UPDATED_IN_DB]: true
    });
    expect(node_e.tags).toStrictEqual({
        [VarDAGNode.TAG_6_UPDATED_IN_DB]: true
    });
    expect(node_f.tags).toStrictEqual({
        [VarDAGNode.TAG_6_UPDATED_IN_DB]: true
    });
    expect(node_g.tags).toStrictEqual({
        [VarDAGNode.TAG_6_UPDATED_IN_DB]: true
    });
    expect(node_h.tags).toStrictEqual({
        [VarDAGNode.TAG_6_UPDATED_IN_DB]: true
    });

    expect(dag.current_step_tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: {},
        [VarDAGNode.TAG_1_NOTIFYING_START]: {},
        [VarDAGNode.TAG_1_NOTIFIED_START]: {},
        [VarDAGNode.TAG_2_DEPLOYING]: {},
        [VarDAGNode.TAG_2_DEPLOYED]: {},
        [VarDAGNode.TAG_3_DATA_LOADING]: {},
        [VarDAGNode.TAG_3_DATA_LOADED]: {},
        [VarDAGNode.TAG_4_IS_COMPUTABLE]: {},
        [VarDAGNode.TAG_4_COMPUTING]: {},
        [VarDAGNode.TAG_4_COMPUTED]: {},
        [VarDAGNode.TAG_5_NOTIFYING_END]: {},
        [VarDAGNode.TAG_5_NOTIFIED_END]: {},
        [VarDAGNode.TAG_6_UPDATING_IN_DB]: {},
        [VarDAGNode.TAG_6_UPDATED_IN_DB]: {
            [node_b.var_data.index]: node_b,
            [node_c.var_data.index]: node_c,

            [node_e.var_data.index]: node_e,
            [node_f.var_data.index]: node_f,
            [node_g.var_data.index]: node_g,
            [node_h.var_data.index]: node_h
        },
        [VarDAGNode.TAG_7_IS_DELETABLE]: {
            [node_a.var_data.index]: node_a
        }
    });

    // Si on tente un autre process que le DELETING sur l'arbre, il ne devrait rien se passer pour le moment puisque les noeuds sont pas dans l'état nécessaire)
    did_something = await VarsProcessCompute.getInstance()['handle_individual_worker'](promise_pipeline);
    // did_something = did_something || await VarsProcessDagCleaner.getInstance()['handle_individual_worker'](promise_pipeline);
    did_something = did_something || await VarsProcessDeployDeps.getInstance()['handle_individual_worker'](promise_pipeline);
    did_something = did_something || await VarsProcessNotifyStart.getInstance()['handle_batch_worker']();
    did_something = did_something || await VarsProcessLoadDatas.getInstance()['handle_individual_worker'](promise_pipeline);
    did_something = did_something || await VarsProcessNotifyEnd.getInstance()['handle_batch_worker']();
    did_something = did_something || await VarsProcessUpdateDB.getInstance()['handle_batch_worker']();
    await promise_pipeline.end();

    expect(did_something).toBeFalsy();

    expect(node_a.tags).toStrictEqual({
        [VarDAGNode.TAG_7_IS_DELETABLE]: true
    });
    expect(node_b.tags).toStrictEqual({
        [VarDAGNode.TAG_6_UPDATED_IN_DB]: true
    });
    expect(node_c.tags).toStrictEqual({
        [VarDAGNode.TAG_6_UPDATED_IN_DB]: true
    });
    expect(node_e.tags).toStrictEqual({
        [VarDAGNode.TAG_6_UPDATED_IN_DB]: true
    });
    expect(node_f.tags).toStrictEqual({
        [VarDAGNode.TAG_6_UPDATED_IN_DB]: true
    });
    expect(node_g.tags).toStrictEqual({
        [VarDAGNode.TAG_6_UPDATED_IN_DB]: true
    });
    expect(node_h.tags).toStrictEqual({
        [VarDAGNode.TAG_6_UPDATED_IN_DB]: true
    });

    expect(dag.current_step_tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: {},
        [VarDAGNode.TAG_1_NOTIFYING_START]: {},
        [VarDAGNode.TAG_1_NOTIFIED_START]: {},
        [VarDAGNode.TAG_2_DEPLOYING]: {},
        [VarDAGNode.TAG_2_DEPLOYED]: {},
        [VarDAGNode.TAG_3_DATA_LOADING]: {},
        [VarDAGNode.TAG_3_DATA_LOADED]: {},
        [VarDAGNode.TAG_4_IS_COMPUTABLE]: {},
        [VarDAGNode.TAG_4_COMPUTING]: {},
        [VarDAGNode.TAG_4_COMPUTED]: {},
        [VarDAGNode.TAG_5_NOTIFYING_END]: {},
        [VarDAGNode.TAG_5_NOTIFIED_END]: {},
        [VarDAGNode.TAG_6_UPDATING_IN_DB]: {},
        [VarDAGNode.TAG_6_UPDATED_IN_DB]: {
            [node_b.var_data.index]: node_b,
            [node_c.var_data.index]: node_c,

            [node_e.var_data.index]: node_e,
            [node_f.var_data.index]: node_f,
            [node_g.var_data.index]: node_g,
            [node_h.var_data.index]: node_h
        },
        [VarDAGNode.TAG_7_IS_DELETABLE]: {
            [node_a.var_data.index]: node_a
        }
    });

    // On lance le process de suppression de l'arbre
    did_something = await VarsProcessDagCleaner.getInstance()['handle_batch_worker']();
    await promise_pipeline.end();
    expect(did_something).toBeTruthy();

    // On nettoie le premier niveau de l'arbre
    expect(dag.nodes[node_a.var_data.index]).toBeUndefined();
    expect(dag.nodes[node_b.var_data.index]).toBeDefined();
    expect(dag.nodes[node_c.var_data.index]).toBeDefined();
    expect(dag.nodes[node_e.var_data.index]).toBeDefined();
    expect(dag.nodes[node_f.var_data.index]).toBeDefined();
    expect(dag.nodes[node_g.var_data.index]).toBeDefined();
    expect(dag.nodes[node_h.var_data.index]).toBeDefined();

    expect(dag.current_step_tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: {},
        [VarDAGNode.TAG_1_NOTIFYING_START]: {},
        [VarDAGNode.TAG_1_NOTIFIED_START]: {},
        [VarDAGNode.TAG_2_DEPLOYING]: {},
        [VarDAGNode.TAG_2_DEPLOYED]: {},
        [VarDAGNode.TAG_3_DATA_LOADING]: {},
        [VarDAGNode.TAG_3_DATA_LOADED]: {},
        [VarDAGNode.TAG_4_IS_COMPUTABLE]: {},
        [VarDAGNode.TAG_4_COMPUTING]: {},
        [VarDAGNode.TAG_4_COMPUTED]: {},
        [VarDAGNode.TAG_5_NOTIFYING_END]: {},
        [VarDAGNode.TAG_5_NOTIFIED_END]: {},
        [VarDAGNode.TAG_6_UPDATING_IN_DB]: {},
        [VarDAGNode.TAG_6_UPDATED_IN_DB]: {
            [node_e.var_data.index]: node_e,
            [node_f.var_data.index]: node_f,
            [node_g.var_data.index]: node_g,
            [node_h.var_data.index]: node_h
        },
        [VarDAGNode.TAG_7_IS_DELETABLE]: {
            [node_b.var_data.index]: node_b,
            [node_c.var_data.index]: node_c
        },
        [VarDAGNode.TAG_7_DELETING]: {},
    });

    // On lance le process de suppression de l'arbre
    did_something = await VarsProcessDagCleaner.getInstance()['handle_batch_worker']();
    await promise_pipeline.end();
    expect(did_something).toBeTruthy();

    // On nettoie le premier niveau de l'arbre
    expect(dag.nodes[node_a.var_data.index]).toBeUndefined();
    expect(dag.nodes[node_b.var_data.index]).toBeUndefined();
    expect(dag.nodes[node_c.var_data.index]).toBeUndefined();
    expect(dag.nodes[node_e.var_data.index]).toBeDefined();
    expect(dag.nodes[node_f.var_data.index]).toBeDefined();
    expect(dag.nodes[node_g.var_data.index]).toBeDefined();
    expect(dag.nodes[node_h.var_data.index]).toBeDefined();

    expect(dag.current_step_tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: {},
        [VarDAGNode.TAG_1_NOTIFYING_START]: {},
        [VarDAGNode.TAG_1_NOTIFIED_START]: {},
        [VarDAGNode.TAG_2_DEPLOYING]: {},
        [VarDAGNode.TAG_2_DEPLOYED]: {},
        [VarDAGNode.TAG_3_DATA_LOADING]: {},
        [VarDAGNode.TAG_3_DATA_LOADED]: {},
        [VarDAGNode.TAG_4_IS_COMPUTABLE]: {},
        [VarDAGNode.TAG_4_COMPUTING]: {},
        [VarDAGNode.TAG_4_COMPUTED]: {},
        [VarDAGNode.TAG_5_NOTIFYING_END]: {},
        [VarDAGNode.TAG_5_NOTIFIED_END]: {},
        [VarDAGNode.TAG_6_UPDATING_IN_DB]: {},
        [VarDAGNode.TAG_6_UPDATED_IN_DB]: {},
        [VarDAGNode.TAG_7_IS_DELETABLE]: {
            [node_e.var_data.index]: node_e,
            [node_f.var_data.index]: node_f,
            [node_g.var_data.index]: node_g,
            [node_h.var_data.index]: node_h
        },
        [VarDAGNode.TAG_7_DELETING]: {},
    });


    // On lance le process de suppression de l'arbre
    did_something = await VarsProcessDagCleaner.getInstance()['handle_batch_worker']();
    await promise_pipeline.end();
    expect(did_something).toBeTruthy();

    // On nettoie le premier niveau de l'arbre
    expect(dag.nodes[node_a.var_data.index]).toBeUndefined();
    expect(dag.nodes[node_b.var_data.index]).toBeUndefined();
    expect(dag.nodes[node_c.var_data.index]).toBeUndefined();
    expect(dag.nodes[node_e.var_data.index]).toBeUndefined();
    expect(dag.nodes[node_f.var_data.index]).toBeUndefined();
    expect(dag.nodes[node_g.var_data.index]).toBeUndefined();
    expect(dag.nodes[node_h.var_data.index]).toBeUndefined();

    expect(dag.current_step_tags).toStrictEqual({
        [VarDAGNode.TAG_0_CREATED]: {},
        [VarDAGNode.TAG_1_NOTIFYING_START]: {},
        [VarDAGNode.TAG_1_NOTIFIED_START]: {},
        [VarDAGNode.TAG_2_DEPLOYING]: {},
        [VarDAGNode.TAG_2_DEPLOYED]: {},
        [VarDAGNode.TAG_3_DATA_LOADING]: {},
        [VarDAGNode.TAG_3_DATA_LOADED]: {},
        [VarDAGNode.TAG_4_IS_COMPUTABLE]: {},
        [VarDAGNode.TAG_4_COMPUTING]: {},
        [VarDAGNode.TAG_4_COMPUTED]: {},
        [VarDAGNode.TAG_5_NOTIFYING_END]: {},
        [VarDAGNode.TAG_5_NOTIFIED_END]: {},
        [VarDAGNode.TAG_6_UPDATING_IN_DB]: {},
        [VarDAGNode.TAG_6_UPDATED_IN_DB]: {},
        [VarDAGNode.TAG_7_IS_DELETABLE]: {},
        [VarDAGNode.TAG_7_DELETING]: {},
    });

});