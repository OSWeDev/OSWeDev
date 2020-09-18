/* tslint:disable:no-unused-expression */

import { expect } from 'chai';
import 'mocha';
import * as moment from 'moment';
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import VarDAG from '../../../shared/modules/Var/graph/VarDAG';
import VarDAGNode from '../../../shared/modules/Var/graph/VarDAGNode';
import VarDAGNodeDep from '../../../shared/modules/Var/graph/VarDAGNodeDep';
import RangeHandler from '../../../shared/tools/RangeHandler';
import FakeDataHandler from './fakes/FakeDataHandler';
import FakeDataVO from './fakes/vos/FakeDataVO';

describe('DAG', () => {

    it('test add nodes', async () => {

        FakeDataHandler.initializeDayDataRangesVO();
        let dag: VarDAG = new VarDAG();

        let var_data_A: FakeDataVO = new FakeDataVO();
        var_data_A.var_id = 1;
        var_data_A.ts_ranges = [
            RangeHandler.getInstance().create_single_elt_TSRange(moment('2020-01-01').utc(true).startOf('day'), TimeSegment.TYPE_DAY)
        ];

        let dagnodeA: VarDAGNode = VarDAGNode.getInstance(dag, var_data_A);

        expect(dagnodeA.var_data.index).to.equal("1_[[1577836800000,1577923200000)]");
        expect(dagnodeA.aggregated_nodes).to.be.undefined;
        expect(dagnodeA.hasIncoming).to.equal(false);
        expect(dagnodeA.hasOutgoing).to.equal(false);
        expect(dagnodeA.incoming_deps).to.be.undefined;
        expect(dagnodeA.is_aggregator).to.equal(false);
        expect(dagnodeA.outgoing_deps).to.be.undefined;
        expect(dagnodeA.var_data).to.deep.equal(var_data_A);
        expect(dagnodeA.dag).to.deep.equal(dag);

        expect(dag.nb_nodes).to.equal(1);
        expect(dag.nodes).to.deep.equal({ "1_[[1577836800000,1577923200000)]": dagnodeA });
        expect(dag.leafs).to.deep.equal({ "1_[[1577836800000,1577923200000)]": dagnodeA });
        expect(dag.roots).to.deep.equal({ "1_[[1577836800000,1577923200000)]": dagnodeA });

        let var_data_B: FakeDataVO = new FakeDataVO();
        var_data_B.var_id = 2;
        var_data_B.ts_ranges = [
            RangeHandler.getInstance().create_single_elt_TSRange(moment('2020-02-01').utc(true).startOf('day'), TimeSegment.TYPE_MONTH)
        ];

        let dagnodeB: VarDAGNode = VarDAGNode.getInstance(dag, var_data_B);

        expect(dagnodeB.var_data.index).to.equal("2_[[1580515200000,1583020800000)]");
        expect(dagnodeB.aggregated_nodes).to.be.undefined;
        expect(dagnodeB.hasIncoming).to.equal(false);
        expect(dagnodeB.hasOutgoing).to.equal(false);
        expect(dagnodeB.is_aggregator).to.equal(false);
        expect(dagnodeB.incoming_deps).to.be.undefined;
        expect(dagnodeB.outgoing_deps).to.be.undefined;
        expect(dagnodeB.var_data).to.deep.equal(var_data_B);
        expect(dagnodeB.dag).to.deep.equal(dag);

        expect(dag.nb_nodes).to.equal(2);
        expect(dag.nodes).to.deep.equal({ "1_[[1577836800000,1577923200000)]": dagnodeA, "2_[[1580515200000,1583020800000)]": dagnodeB });
        expect(dag.leafs).to.deep.equal({ "1_[[1577836800000,1577923200000)]": dagnodeA, "2_[[1580515200000,1583020800000)]": dagnodeB });
        expect(dag.roots).to.deep.equal({ "1_[[1577836800000,1577923200000)]": dagnodeA, "2_[[1580515200000,1583020800000)]": dagnodeB });

        let dagnodeA_bis: VarDAGNode = VarDAGNode.getInstance(dag, var_data_A);

        expect(dagnodeA_bis).to.equal(dagnodeA);

        expect(dag.nb_nodes).to.equal(2);
        expect(dag.nodes).to.deep.equal({ "1_[[1577836800000,1577923200000)]": dagnodeA, "2_[[1580515200000,1583020800000)]": dagnodeB });
        expect(dag.leafs).to.deep.equal({ "1_[[1577836800000,1577923200000)]": dagnodeA, "2_[[1580515200000,1583020800000)]": dagnodeB });
        expect(dag.roots).to.deep.equal({ "1_[[1577836800000,1577923200000)]": dagnodeA, "2_[[1580515200000,1583020800000)]": dagnodeB });
    });

    it('test add deps', async () => {

        FakeDataHandler.initializeDayDataRangesVO();
        let dag: VarDAG = new VarDAG();

        let var_data_A: FakeDataVO = new FakeDataVO();
        var_data_A.var_id = 1;
        var_data_A.ts_ranges = [
            RangeHandler.getInstance().create_single_elt_TSRange(moment('2020-01-01').utc(true).startOf('day'), TimeSegment.TYPE_DAY)
        ];

        let dagnodeA: VarDAGNode = VarDAGNode.getInstance(dag, var_data_A);

        let var_data_B: FakeDataVO = new FakeDataVO();
        var_data_B.var_id = 2;
        var_data_B.ts_ranges = [
            RangeHandler.getInstance().create_single_elt_TSRange(moment('2020-02-01').utc(true).startOf('day'), TimeSegment.TYPE_MONTH)
        ];

        let dagnodeB: VarDAGNode = VarDAGNode.getInstance(dag, var_data_B);

        expect(dag.nb_nodes).to.equal(2);
        expect(dag.nodes).to.deep.equal({ [var_data_A.index]: dagnodeA, [var_data_B.index]: dagnodeB });
        expect(dag.leafs).to.deep.equal({ [var_data_A.index]: dagnodeA, [var_data_B.index]: dagnodeB });
        expect(dag.roots).to.deep.equal({ [var_data_A.index]: dagnodeA, [var_data_B.index]: dagnodeB });

        expect(dagnodeB.var_data.index).to.equal("2_[[1580515200000,1583020800000)]");
        expect(dagnodeB.aggregated_nodes).to.be.undefined;
        expect(dagnodeB.is_aggregator).to.equal(false);
        expect(dagnodeB.hasIncoming).to.equal(false);
        expect(dagnodeB.hasOutgoing).to.equal(false);
        expect(dagnodeB.incoming_deps).to.be.undefined;
        expect(dagnodeB.outgoing_deps).to.be.undefined;

        expect(dagnodeA.var_data.index).to.equal("1_[[1577836800000,1577923200000)]");
        expect(dagnodeA.aggregated_nodes).to.be.undefined;
        expect(dagnodeA.is_aggregator).to.equal(false);
        expect(dagnodeA.hasIncoming).to.equal(false);
        expect(dagnodeA.hasOutgoing).to.equal(false);
        expect(dagnodeA.incoming_deps).to.be.undefined;
        expect(dagnodeA.outgoing_deps).to.be.undefined;

        dagnodeA.addOutgoingDep("AB", dagnodeB);

        let dep_ab = {
            incoming_node: dagnodeA,
            outgoing_node: dagnodeB,
            dep_name: "AB"
        } as VarDAGNodeDep;

        expect(dag.nb_nodes).to.equal(2);
        expect(dag.nodes).to.deep.equal({ [var_data_A.index]: dagnodeA, [var_data_B.index]: dagnodeB });
        expect(dag.leafs).to.deep.equal({ [var_data_B.index]: dagnodeB });
        expect(dag.roots).to.deep.equal({ [var_data_A.index]: dagnodeA });

        expect(dagnodeB.aggregated_nodes).to.be.undefined;
        expect(dagnodeB.is_aggregator).to.equal(false);
        expect(dagnodeB.hasIncoming).to.equal(true);
        expect(dagnodeB.hasOutgoing).to.equal(false);
        expect(dagnodeB.incoming_deps).to.deep.equal({ AB: dep_ab });
        expect(dagnodeB.outgoing_deps).to.be.undefined;

        expect(dagnodeA.aggregated_nodes).to.be.undefined;
        expect(dagnodeA.is_aggregator).to.equal(false);
        expect(dagnodeA.hasIncoming).to.equal(false);
        expect(dagnodeA.hasOutgoing).to.equal(true);
        expect(dagnodeA.outgoing_deps).to.deep.equal({ AB: dep_ab });
        expect(dagnodeA.incoming_deps).to.be.undefined;
    });

    it('test visit bottom->up to node', async () => {
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
    });

    it('test visit top->bottom from node', async () => {
        /**
         * exemple :
         *                           A
         *                          / \
         *                         B   C
         *                        / \ / \
         *                       E  F G  H
         *
         * top->bottom from node B => [B, E, F]
         */
    });

    it('test visit bottom->up from node', async () => {
        /**
         * exemple :
         *                           A
         *                          / \
         *                         B   C
         *                        / \ / \
         *                       E  F G  H
         *
         * bottom->up from node B => [B, A]
         */
    });

    it('test visit top->bottom to node', async () => {
        /**
         * exemple :
         *                           A
         *                          / \
         *                         B   C
         *                        / \ / \
         *                       E  F G  H
         *
         * top->bottom to node B => [A, B]
         */

    });

    it('test visit bottom->up throught node', async () => {
        /**
         * exemple :
         *                           A
         *                          / \
         *                         B   C
         *                        / \ / \
         *                       E  F G  H
         *
         * bottom->up throught node B => [E, F, B, A]
         */
    });

    it('test visit top->bottom throught node', async () => {
        /**
         * exemple :
         *                           A
         *                          / \
         *                         B   C
         *                        / \ / \
         *                       E  F G  H
         *
         * top->bottom throught node B => [A, B, E, F]
         */

    });
});