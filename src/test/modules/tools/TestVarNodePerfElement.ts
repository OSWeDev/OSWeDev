import ServerAPIController from '../../../server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { expect } from 'chai';
import 'mocha';
import VarNodePerfElementVO from '../../../shared/modules/Var/vos/VarNodePerfElementVO';
import VarDAG from '../../../shared/modules/Var/graph/VarDAG';
import VarDAGNode from '../../../shared/modules/Var/graph/VarDAGNode';
import VarsServerController from '../../../server/modules/Var/VarsServerController';
import FakeVarControllerDeps from '../Var/fakes/FakeVarControllerDeps';
import FakeVarControllerDsEmpDistant from '../Var/fakes/FakeVarControllerDsEmpDistant';
import FakeVarControllerDsDistant from '../Var/fakes/FakeVarControllerDsDistant';
import FakeDistantHandler from '../Var/fakes/FakeDistantHandler';
import FakeDataHandler from '../Var/fakes/FakeDataHandler';
import ModuleVar from '../../../shared/modules/Var/ModuleVar';
import VarsController from '../../../shared/modules/Var/VarsController';
import FakeDataVO from '../Var/fakes/vos/FakeDataVO';
import VarsComputeController from '../../../server/modules/Var/VarsComputeController';
import VarsdatasComputerBGThread from '../../../server/modules/Var/bgthreads/VarsdatasComputerBGThread';

describe('set nb_noeuds_global', () => {
    it('updates when adding nodes', async () => {

        FakeDataHandler.initializeFakeDataVO();
        FakeDistantHandler.initializeFakeDistantVO();
        await ModuleVar.getInstance().initializeasync({
            [FakeVarControllerDsDistant.getInstance().varConf.id]: FakeVarControllerDsDistant.getInstance().varConf,
            [FakeVarControllerDsEmpDistant.getInstance().varConf.id]: FakeVarControllerDsEmpDistant.getInstance().varConf,
            [FakeVarControllerDeps.getInstance().varConf.id]: FakeVarControllerDeps.getInstance().varConf
        });
        await FakeVarControllerDsDistant.getInstance().initialize();
        await FakeVarControllerDsEmpDistant.getInstance().initialize();
        await FakeVarControllerDeps.getInstance().initialize();
        await VarsController.getInstance().initializeasync({
            [FakeVarControllerDsDistant.getInstance().varConf.id]: FakeVarControllerDsDistant.getInstance().varConf,
            [FakeVarControllerDsEmpDistant.getInstance().varConf.id]: FakeVarControllerDsEmpDistant.getInstance().varConf,
            [FakeVarControllerDeps.getInstance().varConf.id]: FakeVarControllerDeps.getInstance().varConf
        });
        VarsServerController.getInstance().init_varcontrollers_dag();

        let var_dag: VarDAG = new VarDAG();
        VarsdatasComputerBGThread.getInstance().current_batch_id++;
        VarsdatasComputerBGThread.getInstance().current_batch_vardag = var_dag;
        var_dag.init_perfs(VarsdatasComputerBGThread.getInstance().current_batch_id);

        let var_data_A: FakeDataVO = FakeDataHandler.get_var_data_A();
        let dagnodeA: VarDAGNode = await VarDAGNode.getInstance(var_dag, var_data_A, VarsComputeController, true);

        expect(var_dag.perfs.nb_batch_vars).to.equal(1);

        //global
        //1
        expect(var_dag.perfs.batch_wrapper.nb_noeuds_global).to.equal(16); // no parent

        //2
        expect(var_dag.perfs.computation_wrapper.nb_noeuds_global).to.equal(11); // parent global => batch_wrapper
        //3
        expect(var_dag.perfs.load_nodes_datas.nb_noeuds_global).to.equal(1); // parent global => batch_wrapper
        expect(var_dag.perfs.compute_node_wrapper.nb_noeuds_global).to.equal(1); // parent global => computation_wrapper
        expect(var_dag.perfs.create_tree.nb_noeuds_global).to.equal(6); // parent global => computation_wrapper

        //2
        expect(var_dag.perfs.handle_buffer_varsdatasproxy.nb_noeuds_global).to.equal(0); // parent global => batch_wrapper
        expect(var_dag.perfs.handle_buffer_varsdatasvoupdate.nb_noeuds_global).to.equal(0); // parent global => batch_wrapper
        expect(var_dag.perfs.handle_invalidators.nb_noeuds_global).to.equal(0); // parent global => batch_wrapper
        expect(var_dag.perfs.cache_datas.nb_noeuds_global).to.equal(0); // parent global => computation_wrapper


        //nodeA
        //1
        expect(dagnodeA.perfs.compute_node.nb_noeuds_global).to.equal(0); // parent global => compute_node_wrapper
        //1
        expect(dagnodeA.perfs.ctree_deploy_deps.nb_noeuds_global).to.equal(5); // parent global => create_tree
        //2
        expect(dagnodeA.perfs.ctree_ddeps_get_node_deps.nb_noeuds_global).to.equal(0); // parent nodeA => ctree_deploy_deps
        expect(dagnodeA.perfs.ctree_ddeps_handle_pixellisation.nb_noeuds_global).to.equal(0); // parent nodeA => ctree_deploy_deps
        expect(dagnodeA.perfs.ctree_ddeps_load_imports_and_split_nodes.nb_noeuds_global).to.equal(0); // parent nodeA => ctree_deploy_deps
        expect(dagnodeA.perfs.ctree_ddeps_try_load_cache_complet.nb_noeuds_global).to.equal(0); // parent nodeA => ctree_deploy_deps
        expect(dagnodeA.perfs.ctree_ddeps_try_load_cache_partiel.nb_noeuds_global).to.equal(0); // parent nodeA => ctree_deploy_deps
        //1
        expect(dagnodeA.perfs.load_node_datas.nb_noeuds_global).to.equal(0); // parent global => load_nodes_datas

        let var_data_B: FakeDataVO = FakeDataHandler.get_var_data_B();

        let dagnodeB: VarDAGNode = await VarDAGNode.getInstance(var_dag, var_data_B, VarsComputeController, true);
        dagnodeA.addOutgoingDep("AB", dagnodeB);

        expect(var_dag.perfs.nb_batch_vars).to.equal(2);

        //global
        //1
        expect(var_dag.perfs.batch_wrapper.nb_noeuds_global).to.equal(24); // no parent

        //2
        expect(var_dag.perfs.computation_wrapper.nb_noeuds_global).to.equal(19); // parent global => batch_wrapper
        //3
        expect(var_dag.perfs.load_nodes_datas.nb_noeuds_global).to.equal(2); // parent global => batch_wrapper
        expect(var_dag.perfs.compute_node_wrapper.nb_noeuds_global).to.equal(2); // parent global => computation_wrapper
        expect(var_dag.perfs.create_tree.nb_noeuds_global).to.equal(12); // parent global => computation_wrapper

        //2
        expect(var_dag.perfs.handle_buffer_varsdatasproxy.nb_noeuds_global).to.equal(0); // parent global => batch_wrapper
        expect(var_dag.perfs.handle_buffer_varsdatasvoupdate.nb_noeuds_global).to.equal(0); // parent global => batch_wrapper
        expect(var_dag.perfs.handle_invalidators.nb_noeuds_global).to.equal(0); // parent global => batch_wrapper
        expect(var_dag.perfs.cache_datas.nb_noeuds_global).to.equal(0); // parent global => computation_wrapper


        //nodeA
        //1
        expect(dagnodeA.perfs.compute_node.nb_noeuds_global).to.equal(0); // parent global => compute_node_wrapper
        //1
        expect(dagnodeA.perfs.ctree_deploy_deps.nb_noeuds_global).to.equal(5); // parent global => create_tree
        //2
        expect(dagnodeA.perfs.ctree_ddeps_get_node_deps.nb_noeuds_global).to.equal(0); // parent nodeA => ctree_deploy_deps
        expect(dagnodeA.perfs.ctree_ddeps_handle_pixellisation.nb_noeuds_global).to.equal(0); // parent nodeA => ctree_deploy_deps
        expect(dagnodeA.perfs.ctree_ddeps_load_imports_and_split_nodes.nb_noeuds_global).to.equal(0); // parent nodeA => ctree_deploy_deps
        expect(dagnodeA.perfs.ctree_ddeps_try_load_cache_complet.nb_noeuds_global).to.equal(0); // parent nodeA => ctree_deploy_deps
        expect(dagnodeA.perfs.ctree_ddeps_try_load_cache_partiel.nb_noeuds_global).to.equal(0); // parent nodeA => ctree_deploy_deps
        //1
        expect(dagnodeA.perfs.load_node_datas.nb_noeuds_global).to.equal(0); // parent global => load_nodes_datas

        //nodeB
        //1
        expect(dagnodeB.perfs.compute_node.nb_noeuds_global).to.equal(0); // parent global => compute_node_wrapper
        //1
        expect(dagnodeB.perfs.ctree_deploy_deps.nb_noeuds_global).to.equal(5); // parent global => create_tree
        //2
        expect(dagnodeB.perfs.ctree_ddeps_get_node_deps.nb_noeuds_global).to.equal(0); // parent nodeB => ctree_deploy_deps
        expect(dagnodeB.perfs.ctree_ddeps_handle_pixellisation.nb_noeuds_global).to.equal(0); // parent nodeB => ctree_deploy_deps
        expect(dagnodeB.perfs.ctree_ddeps_load_imports_and_split_nodes.nb_noeuds_global).to.equal(0); // parent nodeB => ctree_deploy_deps
        expect(dagnodeB.perfs.ctree_ddeps_try_load_cache_complet.nb_noeuds_global).to.equal(0); // parent nodeB => ctree_deploy_deps
        expect(dagnodeB.perfs.ctree_ddeps_try_load_cache_partiel.nb_noeuds_global).to.equal(0); // parent nodeB => ctree_deploy_deps
        //1
        expect(dagnodeB.perfs.load_node_datas.nb_noeuds_global).to.equal(0); // parent global => load_nodes_datas
    });
});