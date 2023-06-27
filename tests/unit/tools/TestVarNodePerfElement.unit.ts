import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { expect, test } from '@playwright/test';
import VarsComputeController from '../../../src/server/modules/Var/VarsComputeController';
import VarsdatasComputerBGThread from '../../../src/server/modules/Var/bgthreads/VarsdatasComputerBGThread';
import VarDAG from '../../../src/shared/modules/Var/graph/VarDAG';
import VarDAGNode from '../../../src/shared/modules/Var/graph/VarDAGNode';
import FakeDataHandler from '../Var/fakes/FakeDataHandler';
import FakeVarsInit from '../Var/fakes/FakeVarsInit';
import FakeDataVO from '../Var/fakes/vos/FakeDataVO';

test('set nb_noeuds_global: updates when adding nodes', async () => {

    await FakeVarsInit.initAll();

    let var_dag: VarDAG = new VarDAG();
    VarsdatasComputerBGThread.getInstance().current_batch_id++;
    VarsdatasComputerBGThread.getInstance().current_batch_vardag = var_dag;
    var_dag.init_perfs(VarsdatasComputerBGThread.getInstance().current_batch_id);

    let var_data_A: FakeDataVO = FakeDataHandler.get_var_data_A();
    let dagnodeA: VarDAGNode = await VarDAGNode.getInstance(var_dag, var_data_A, VarsComputeController, true);

    expect(var_dag.perfs.nb_batch_vars).toStrictEqual(1);

    //global
    //1
    expect(var_dag.perfs.batch_wrapper.nb_noeuds_global).toStrictEqual(16); // no parent

    //2
    expect(var_dag.perfs.computation_wrapper.nb_noeuds_global).toStrictEqual(11); // parent global => batch_wrapper
    //3
    expect(var_dag.perfs.load_nodes_datas.nb_noeuds_global).toStrictEqual(1); // parent global => batch_wrapper
    expect(var_dag.perfs.compute_node_wrapper.nb_noeuds_global).toStrictEqual(1); // parent global => computation_wrapper
    expect(var_dag.perfs.create_tree.nb_noeuds_global).toStrictEqual(6); // parent global => computation_wrapper

    //2
    expect(var_dag.perfs.handle_buffer_varsdatasproxy.nb_noeuds_global).toStrictEqual(0); // parent global => batch_wrapper
    expect(var_dag.perfs.handle_buffer_varsdatasvoupdate.nb_noeuds_global).toStrictEqual(0); // parent global => batch_wrapper
    expect(var_dag.perfs.handle_invalidators.nb_noeuds_global).toStrictEqual(0); // parent global => batch_wrapper
    expect(var_dag.perfs.cache_datas.nb_noeuds_global).toStrictEqual(0); // parent global => computation_wrapper


    //nodeA
    //1
    expect(dagnodeA.perfs.compute_node.nb_noeuds_global).toStrictEqual(0); // parent global => compute_node_wrapper
    //1
    expect(dagnodeA.perfs.ctree_deploy_deps.nb_noeuds_global).toStrictEqual(5); // parent global => create_tree
    //2
    expect(dagnodeA.perfs.ctree_ddeps_get_node_deps.nb_noeuds_global).toStrictEqual(0); // parent nodeA => ctree_deploy_deps
    expect(dagnodeA.perfs.ctree_ddeps_handle_pixellisation.nb_noeuds_global).toStrictEqual(0); // parent nodeA => ctree_deploy_deps
    expect(dagnodeA.perfs.ctree_ddeps_load_imports_and_split_nodes.nb_noeuds_global).toStrictEqual(0); // parent nodeA => ctree_deploy_deps
    expect(dagnodeA.perfs.ctree_ddeps_try_load_cache_complet.nb_noeuds_global).toStrictEqual(0); // parent nodeA => ctree_deploy_deps
    expect(dagnodeA.perfs.ctree_ddeps_try_load_cache_partiel.nb_noeuds_global).toStrictEqual(0); // parent nodeA => ctree_deploy_deps
    //1
    expect(dagnodeA.perfs.load_node_datas.nb_noeuds_global).toStrictEqual(0); // parent global => load_nodes_datas

    let var_data_B: FakeDataVO = FakeDataHandler.get_var_data_B();

    let dagnodeB: VarDAGNode = await VarDAGNode.getInstance(var_dag, var_data_B, VarsComputeController, true);
    dagnodeA.addOutgoingDep("AB", dagnodeB);

    expect(var_dag.perfs.nb_batch_vars).toStrictEqual(2);

    //global
    //1
    expect(var_dag.perfs.batch_wrapper.nb_noeuds_global).toStrictEqual(24); // no parent

    //2
    expect(var_dag.perfs.computation_wrapper.nb_noeuds_global).toStrictEqual(19); // parent global => batch_wrapper
    //3
    expect(var_dag.perfs.load_nodes_datas.nb_noeuds_global).toStrictEqual(2); // parent global => batch_wrapper
    expect(var_dag.perfs.compute_node_wrapper.nb_noeuds_global).toStrictEqual(2); // parent global => computation_wrapper
    expect(var_dag.perfs.create_tree.nb_noeuds_global).toStrictEqual(12); // parent global => computation_wrapper

    //2
    expect(var_dag.perfs.handle_buffer_varsdatasproxy.nb_noeuds_global).toStrictEqual(0); // parent global => batch_wrapper
    expect(var_dag.perfs.handle_buffer_varsdatasvoupdate.nb_noeuds_global).toStrictEqual(0); // parent global => batch_wrapper
    expect(var_dag.perfs.handle_invalidators.nb_noeuds_global).toStrictEqual(0); // parent global => batch_wrapper
    expect(var_dag.perfs.cache_datas.nb_noeuds_global).toStrictEqual(0); // parent global => computation_wrapper


    //nodeA
    //1
    expect(dagnodeA.perfs.compute_node.nb_noeuds_global).toStrictEqual(0); // parent global => compute_node_wrapper
    //1
    expect(dagnodeA.perfs.ctree_deploy_deps.nb_noeuds_global).toStrictEqual(5); // parent global => create_tree
    //2
    expect(dagnodeA.perfs.ctree_ddeps_get_node_deps.nb_noeuds_global).toStrictEqual(0); // parent nodeA => ctree_deploy_deps
    expect(dagnodeA.perfs.ctree_ddeps_handle_pixellisation.nb_noeuds_global).toStrictEqual(0); // parent nodeA => ctree_deploy_deps
    expect(dagnodeA.perfs.ctree_ddeps_load_imports_and_split_nodes.nb_noeuds_global).toStrictEqual(0); // parent nodeA => ctree_deploy_deps
    expect(dagnodeA.perfs.ctree_ddeps_try_load_cache_complet.nb_noeuds_global).toStrictEqual(0); // parent nodeA => ctree_deploy_deps
    expect(dagnodeA.perfs.ctree_ddeps_try_load_cache_partiel.nb_noeuds_global).toStrictEqual(0); // parent nodeA => ctree_deploy_deps
    //1
    expect(dagnodeA.perfs.load_node_datas.nb_noeuds_global).toStrictEqual(0); // parent global => load_nodes_datas

    //nodeB
    //1
    expect(dagnodeB.perfs.compute_node.nb_noeuds_global).toStrictEqual(0); // parent global => compute_node_wrapper
    //1
    expect(dagnodeB.perfs.ctree_deploy_deps.nb_noeuds_global).toStrictEqual(5); // parent global => create_tree
    //2
    expect(dagnodeB.perfs.ctree_ddeps_get_node_deps.nb_noeuds_global).toStrictEqual(0); // parent nodeB => ctree_deploy_deps
    expect(dagnodeB.perfs.ctree_ddeps_handle_pixellisation.nb_noeuds_global).toStrictEqual(0); // parent nodeB => ctree_deploy_deps
    expect(dagnodeB.perfs.ctree_ddeps_load_imports_and_split_nodes.nb_noeuds_global).toStrictEqual(0); // parent nodeB => ctree_deploy_deps
    expect(dagnodeB.perfs.ctree_ddeps_try_load_cache_complet.nb_noeuds_global).toStrictEqual(0); // parent nodeB => ctree_deploy_deps
    expect(dagnodeB.perfs.ctree_ddeps_try_load_cache_partiel.nb_noeuds_global).toStrictEqual(0); // parent nodeB => ctree_deploy_deps
    //1
    expect(dagnodeB.perfs.load_node_datas.nb_noeuds_global).toStrictEqual(0); // parent global => load_nodes_datas
});