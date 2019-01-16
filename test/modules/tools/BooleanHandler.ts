import { expect } from 'chai';
import 'mocha';
import BooleanHandler from '../../../src/shared/tools/BooleanHandler';

it('test OR', () => {
    expect(BooleanHandler.getInstance().OR(null)).to.equal(false);
    expect(BooleanHandler.getInstance().OR(null, false)).to.equal(false);
    expect(BooleanHandler.getInstance().OR(null, true)).to.equal(true);
    expect(BooleanHandler.getInstance().OR([], true)).to.equal(true);
    expect(BooleanHandler.getInstance().OR([], false)).to.equal(false);
    expect(BooleanHandler.getInstance().OR([])).to.equal(false);

    expect(BooleanHandler.getInstance().OR([true])).to.equal(true);
    expect(BooleanHandler.getInstance().OR([false])).to.equal(false);

    expect(BooleanHandler.getInstance().OR([true, true])).to.equal(true);
    expect(BooleanHandler.getInstance().OR([true, false])).to.equal(true);
    expect(BooleanHandler.getInstance().OR([false, true])).to.equal(true);
    expect(BooleanHandler.getInstance().OR([false, false])).to.equal(false);

    expect(BooleanHandler.getInstance().OR([true, true, true])).to.equal(true);
    expect(BooleanHandler.getInstance().OR([true, true, false])).to.equal(true);
    expect(BooleanHandler.getInstance().OR([true, false, true])).to.equal(true);
    expect(BooleanHandler.getInstance().OR([true, false, false])).to.equal(true);
    expect(BooleanHandler.getInstance().OR([false, true, true])).to.equal(true);
    expect(BooleanHandler.getInstance().OR([false, true, false])).to.equal(true);
    expect(BooleanHandler.getInstance().OR([false, false, true])).to.equal(true);
    expect(BooleanHandler.getInstance().OR([false, false, false])).to.equal(false);
});

it('test AND', () => {
    expect(BooleanHandler.getInstance().AND(null)).to.equal(false);
    expect(BooleanHandler.getInstance().AND(null, false)).to.equal(false);
    expect(BooleanHandler.getInstance().AND(null, true)).to.equal(true);
    expect(BooleanHandler.getInstance().AND([], true)).to.equal(true);
    expect(BooleanHandler.getInstance().AND([], false)).to.equal(false);
    expect(BooleanHandler.getInstance().AND([])).to.equal(false);

    expect(BooleanHandler.getInstance().AND([true])).to.equal(true);
    expect(BooleanHandler.getInstance().AND([false])).to.equal(false);

    expect(BooleanHandler.getInstance().AND([true, true])).to.equal(true);
    expect(BooleanHandler.getInstance().AND([true, false])).to.equal(false);
    expect(BooleanHandler.getInstance().AND([false, true])).to.equal(false);
    expect(BooleanHandler.getInstance().AND([false, false])).to.equal(false);

    expect(BooleanHandler.getInstance().AND([true, true, true])).to.equal(true);
    expect(BooleanHandler.getInstance().AND([true, true, false])).to.equal(false);
    expect(BooleanHandler.getInstance().AND([true, false, true])).to.equal(false);
    expect(BooleanHandler.getInstance().AND([true, false, false])).to.equal(false);
    expect(BooleanHandler.getInstance().AND([false, true, true])).to.equal(false);
    expect(BooleanHandler.getInstance().AND([false, true, false])).to.equal(false);
    expect(BooleanHandler.getInstance().AND([false, false, true])).to.equal(false);
    expect(BooleanHandler.getInstance().AND([false, false, false])).to.equal(false);
});