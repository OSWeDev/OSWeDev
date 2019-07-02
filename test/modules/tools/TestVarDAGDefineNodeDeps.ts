import { expect } from 'chai';
import 'mocha';
import VarDAGDefineNodeDeps from '../../../src/shared/modules/Var/graph/var/visitors/VarDAGDefineNodeDeps';

describe('VarDAGDefineNodeDeps', () => {

    it('test clear_node_deps', () => {
        expect(VarDAGDefineNodeDeps.clear_node_deps(null)).to.equal(null);
    });

    it('test add_node_deps', () => {
        expect(VarDAGDefineNodeDeps.add_node_deps(null)).to.equal(null);
    });
});