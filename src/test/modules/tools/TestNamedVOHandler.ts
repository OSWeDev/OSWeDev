import { expect } from 'chai';
import 'mocha';
import NamedVOHandler from '../../../shared/tools/NamedVOHandler';
import INamedVO from '../../../shared/interfaces/INamedVO';


describe('NamedVOHandler', () => {

    it('test getByName', () => {

        expect(NamedVOHandler.getInstance().getByName(null, null)).to.equal(null);
        expect(NamedVOHandler.getInstance().getByName([], null)).to.equal(null);
        expect(NamedVOHandler.getInstance().getByName({}, null)).to.equal(null);
        expect(NamedVOHandler.getInstance().getByName([null], null)).to.equal(null);
        expect(NamedVOHandler.getInstance().getByName({
            0: null
        }, null)).to.equal(null);

        expect(NamedVOHandler.getInstance().getByName(null, "a")).to.equal(null);
        expect(NamedVOHandler.getInstance().getByName([], "a")).to.equal(null);
        expect(NamedVOHandler.getInstance().getByName({}, "a")).to.equal(null);
        expect(NamedVOHandler.getInstance().getByName([null], "a")).to.equal(null);
        expect(NamedVOHandler.getInstance().getByName({
            0: null
        }, "a")).to.equal(null);

        expect(NamedVOHandler.getInstance().getByName([{
            id: 1,
            name: "b",
            _type: "osef"
        }], "a")).to.equal(null);
        expect(NamedVOHandler.getInstance().getByName([{
            id: 1,
            name: null,
            _type: "osef"
        }], "a")).to.equal(null);
        expect(NamedVOHandler.getInstance().getByName([{
            id: 1,
            name: "a",
            _type: "osef"
        }], "a")).to.deep.equal({
            id: 1,
            name: "a",
            _type: "osef"
        });

        expect(NamedVOHandler.getInstance().getByName([{
            id: 1,
            name: "b",
            _type: "osef"
        }, {
            id: 2,
            name: "c",
            _type: "osef"
        }], "a")).to.equal(null);
        expect(NamedVOHandler.getInstance().getByName([{
            id: 1,
            name: null,
            _type: "osef"
        }, {
            id: 2,
            name: "c",
            _type: "osef"
        }], "a")).to.equal(null);
        expect(NamedVOHandler.getInstance().getByName([{
            id: 1,
            name: "a",
            _type: "osef"
        }, {
            id: 2,
            name: "c",
            _type: "osef"
        }], "a")).to.deep.equal({
            id: 1,
            name: "a",
            _type: "osef"
        });

        expect(NamedVOHandler.getInstance().getByName([null, {
            id: 2,
            name: "c",
            _type: "osef"
        }], "a")).to.equal(null);
        expect(NamedVOHandler.getInstance().getByName([null, {
            id: 2,
            name: "c",
            _type: "osef"
        }], "a")).to.equal(null);
        expect(NamedVOHandler.getInstance().getByName([null, {
            id: 2,
            name: "c",
            _type: "osef"
        }], "a")).to.equal(null);

        expect(NamedVOHandler.getInstance().getByName([{
            id: 1,
            name: "b",
            _type: "osef"
        }, null], "a")).to.equal(null);
        expect(NamedVOHandler.getInstance().getByName([{
            id: 1,
            name: null,
            _type: "osef"
        }, null], "a")).to.equal(null);
        expect(NamedVOHandler.getInstance().getByName([{
            id: 1,
            name: "a",
            _type: "osef"
        }, null], "a")).to.deep.equal({
            id: 1,
            name: "a",
            _type: "osef"
        });

        expect(NamedVOHandler.getInstance().getByName([{
            id: 2,
            name: "c",
            _type: "osef"
        }, {
            id: 1,
            name: "b",
            _type: "osef"
        }], "a")).to.equal(null);
        expect(NamedVOHandler.getInstance().getByName([{
            id: 2,
            name: "c",
            _type: "osef"
        }, {
            id: 1,
            name: null,
            _type: "osef"
        }], "a")).to.equal(null);
        expect(NamedVOHandler.getInstance().getByName([{
            id: 2,
            name: "c",
            _type: "osef"
        }, {
            id: 1,
            name: "a",
            _type: "osef"
        }], "a")).to.deep.equal({
            id: 1,
            name: "a",
            _type: "osef"
        });








        expect(NamedVOHandler.getInstance().getByName({
            1: {
                id: 1,
                name: "b",
                _type: "osef"
            }
        }, "a")).to.equal(null);
        expect(NamedVOHandler.getInstance().getByName({
            1: {
                id: 1,
                name: null,
                _type: "osef"
            }
        }, "a")).to.equal(null);
        expect(NamedVOHandler.getInstance().getByName({
            1: {
                id: 1,
                name: "a",
                _type: "osef"
            }
        }, "a")).to.deep.equal({
            id: 1,
            name: "a",
            _type: "osef"
        });

        expect(NamedVOHandler.getInstance().getByName({
            1: {
                id: 1,
                name: "b",
                _type: "osef"
            },
            2: {
                id: 2,
                name: "c",
                _type: "osef"
            }
        }, "a")).to.equal(null);
        expect(NamedVOHandler.getInstance().getByName({
            1: {
                id: 1,
                name: null,
                _type: "osef"
            },
            2: {
                id: 2,
                name: "c",
                _type: "osef"
            }
        }, "a")).to.equal(null);
        expect(NamedVOHandler.getInstance().getByName({
            1: {
                id: 1,
                name: "a",
                _type: "osef"
            },
            2: {
                id: 2,
                name: "c",
                _type: "osef"
            }
        }, "a")).to.deep.equal({
            id: 1,
            name: "a",
            _type: "osef"
        });

        expect(NamedVOHandler.getInstance().getByName({
            1: null,
            2: {
                id: 2,
                name: "c",
                _type: "osef"
            }
        }, "a")).to.equal(null);
        expect(NamedVOHandler.getInstance().getByName({
            1: null,
            2: {
                id: 2,
                name: "c",
                _type: "osef"
            }
        }, "a")).to.equal(null);
        expect(NamedVOHandler.getInstance().getByName({
            1: null,
            2: {
                id: 2,
                name: "c",
                _type: "osef"
            }
        }, "a")).to.equal(null);

        expect(NamedVOHandler.getInstance().getByName({
            1: {
                id: 1,
                name: "b",
                _type: "osef"
            },
            2: null
        }, "a")).to.equal(null);
        expect(NamedVOHandler.getInstance().getByName({
            1: {
                id: 1,
                name: null,
                _type: "osef"
            },
            2: null
        }, "a")).to.equal(null);
        expect(NamedVOHandler.getInstance().getByName({
            1: {
                id: 1,
                name: "a",
                _type: "osef"
            },
            2: null
        }, "a")).to.deep.equal({
            id: 1,
            name: "a",
            _type: "osef"
        });

        expect(NamedVOHandler.getInstance().getByName({
            1: {
                id: 2,
                name: "c",
                _type: "osef"
            },
            2: {
                id: 1,
                name: "b",
                _type: "osef"
            }
        }, "a")).to.equal(null);
        expect(NamedVOHandler.getInstance().getByName({
            1: {
                id: 2,
                name: "c",
                _type: "osef"
            },
            2: {
                id: 1,
                name: null,
                _type: "osef"
            }
        }, "a")).to.equal(null);
        expect(NamedVOHandler.getInstance().getByName({
            1: {
                id: 2,
                name: "c",
                _type: "osef"
            },
            2: {
                id: 1,
                name: "a",
                _type: "osef"
            }
        }, "a")).to.deep.equal({
            id: 1,
            name: "a",
            _type: "osef"
        });
    });
    it('test getNamesList', () => {
        expect(NamedVOHandler.getInstance().getNamesList(null)).to.deep.equal([]);
        expect(NamedVOHandler.getInstance().getNamesList([])).to.deep.equal([]);
        expect(NamedVOHandler.getInstance().getNamesList([null])).to.deep.equal([]);
        expect(NamedVOHandler.getInstance().getNamesList([{
            id: 2,
            name: null,
            _type: "osef"
        }])).to.deep.equal([]);
        expect(NamedVOHandler.getInstance().getNamesList([{
            id: 2,
            name: null,
            _type: "osef"
        }, {
            id: 3,
            name: null,
            _type: "osef"
        }])).to.deep.equal([]);
        expect(NamedVOHandler.getInstance().getNamesList([{
            id: 2,
            name: "o",
            _type: "osef"
        }, {
            id: 3,
            name: null,
            _type: "osef"
        }])).to.deep.equal(['o']);
        expect(NamedVOHandler.getInstance().getNamesList([{
            id: 2,
            name: 'o',
            _type: "osef"
        }, {
            id: 3,
            name: 's',
            _type: "osef"
        }])).to.deep.equal(['o', 's']);
        expect(NamedVOHandler.getInstance().getNamesList([{
            id: 2,
            name: null,
            _type: "osef"
        }, {
            id: 3,
            name: 's',
            _type: "osef"
        }])).to.deep.equal(['s']);
    });


    it('test sortByNames', () => {
        let vos: INamedVO[] = null;
        NamedVOHandler.getInstance().sortByNames(vos);
        expect(vos).to.equal(null);
        vos = null;
        NamedVOHandler.getInstance().sortByNames(vos, (a, b) => ((a.name < b.name) ? -1 : (a.name == b.name) ? 0 : 1));
        expect(vos).to.equal(null);

        vos = [];
        NamedVOHandler.getInstance().sortByNames(vos);
        expect(vos).to.deep.equal([]);
        vos = [];
        NamedVOHandler.getInstance().sortByNames(vos, (a, b) => ((a.name < b.name) ? -1 : (a.name == b.name) ? 0 : 1));
        expect(vos).to.deep.equal([]);

        vos = [{
            id: 2,
            name: null,
            _type: "osef"
        }];
        NamedVOHandler.getInstance().sortByNames(vos);
        expect(vos).to.deep.equal([{
            id: 2,
            name: null,
            _type: "osef"
        }]);
        vos = [{
            id: 2,
            name: null,
            _type: "osef"
        }];
        NamedVOHandler.getInstance().sortByNames(vos, (a, b) => ((a.name < b.name) ? -1 : (a.name == b.name) ? 0 : 1));
        expect(vos).to.deep.equal([{
            id: 2,
            name: null,
            _type: "osef"
        }]);

        vos = [{
            id: 3,
            name: 's',
            _type: "osef"
        }];
        NamedVOHandler.getInstance().sortByNames(vos);
        expect(vos).to.deep.equal([{
            id: 3,
            name: 's',
            _type: "osef"
        }]);
        vos = [{
            id: 3,
            name: 's',
            _type: "osef"
        }];
        NamedVOHandler.getInstance().sortByNames(vos, (a, b) => ((a.name < b.name) ? -1 : (a.name == b.name) ? 0 : 1));
        expect(vos).to.deep.equal([{
            id: 3,
            name: 's',
            _type: "osef"
        }]);

        vos = [
            null, {
                id: 3,
                name: 's',
                _type: "osef"
            }];
        NamedVOHandler.getInstance().sortByNames(vos);
        expect(vos).to.deep.equal([null, {
            id: 3,
            name: 's',
            _type: "osef"
        }]);
        vos = [null,
            {
                id: 3,
                name: 's',
                _type: "osef"
            }];

        vos = [
            {
                id: 2,
                name: 'o',
                _type: "osef"
            }, {
                id: 3,
                name: 's',
                _type: "osef"
            }];
        NamedVOHandler.getInstance().sortByNames(vos);
        expect(vos).to.deep.equal([{
            id: 2,
            name: 'o',
            _type: "osef"
        }, {
            id: 3,
            name: 's',
            _type: "osef"
        }]);
        vos = [
            {
                id: 3,
                name: 's',
                _type: "osef"
            }, {
                id: 2,
                name: 'o',
                _type: "osef"
            }];
        NamedVOHandler.getInstance().sortByNames(vos, (a, b) => ((a.name < b.name) ? -1 : (a.name == b.name) ? 0 : 1));
        expect(vos).to.deep.equal([{
            id: 2,
            name: 'o',
            _type: "osef"
        }, {
            id: 3,
            name: 's',
            _type: "osef"
        }]);
        vos = [
            {
                id: 3,
                name: 's',
                _type: "osef"
            }, {
                id: 2,
                name: 'o',
                _type: "osef"
            }];
        NamedVOHandler.getInstance().sortByNames(vos, (a, b) => ((a.name < b.name) ? 1 : (a.name == b.name) ? 0 : -1));
        expect(vos).to.deep.equal([{
            id: 3,
            name: 's',
            _type: "osef"
        }, {
            id: 2,
            name: 'o',
            _type: "osef"
        }]);
    });
});