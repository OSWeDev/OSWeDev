import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { expect, test } from '@playwright/test';
import NamedVOHandler from '../../../src/shared/tools/NamedVOHandler';
import INamedVO from '../../../src/shared/interfaces/INamedVO';

test('NamedVOHandler: test getByName', () => {

    expect(NamedVOHandler.getInstance().getByName(null, null)).toStrictEqual(null);
    expect(NamedVOHandler.getInstance().getByName([], null)).toStrictEqual(null);
    expect(NamedVOHandler.getInstance().getByName({}, null)).toStrictEqual(null);
    expect(NamedVOHandler.getInstance().getByName([null], null)).toStrictEqual(null);
    expect(NamedVOHandler.getInstance().getByName({
        0: null
    }, null)).toStrictEqual(null);

    expect(NamedVOHandler.getInstance().getByName(null, "a")).toStrictEqual(null);
    expect(NamedVOHandler.getInstance().getByName([], "a")).toStrictEqual(null);
    expect(NamedVOHandler.getInstance().getByName({}, "a")).toStrictEqual(null);
    expect(NamedVOHandler.getInstance().getByName([null], "a")).toStrictEqual(null);
    expect(NamedVOHandler.getInstance().getByName({
        0: null
    }, "a")).toStrictEqual(null);

    expect(NamedVOHandler.getInstance().getByName([{
        id: 1,
        name: "b",
        _type: "osef"
    }], "a")).toStrictEqual(null);
    expect(NamedVOHandler.getInstance().getByName([{
        id: 1,
        name: null,
        _type: "osef"
    }], "a")).toStrictEqual(null);
    expect(NamedVOHandler.getInstance().getByName([{
        id: 1,
        name: "a",
        _type: "osef"
    }], "a")).toStrictEqual({
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
    }], "a")).toStrictEqual(null);
    expect(NamedVOHandler.getInstance().getByName([{
        id: 1,
        name: null,
        _type: "osef"
    }, {
        id: 2,
        name: "c",
        _type: "osef"
    }], "a")).toStrictEqual(null);
    expect(NamedVOHandler.getInstance().getByName([{
        id: 1,
        name: "a",
        _type: "osef"
    }, {
        id: 2,
        name: "c",
        _type: "osef"
    }], "a")).toStrictEqual({
        id: 1,
        name: "a",
        _type: "osef"
    });

    expect(NamedVOHandler.getInstance().getByName([null, {
        id: 2,
        name: "c",
        _type: "osef"
    }], "a")).toStrictEqual(null);
    expect(NamedVOHandler.getInstance().getByName([null, {
        id: 2,
        name: "c",
        _type: "osef"
    }], "a")).toStrictEqual(null);
    expect(NamedVOHandler.getInstance().getByName([null, {
        id: 2,
        name: "c",
        _type: "osef"
    }], "a")).toStrictEqual(null);

    expect(NamedVOHandler.getInstance().getByName([{
        id: 1,
        name: "b",
        _type: "osef"
    }, null], "a")).toStrictEqual(null);
    expect(NamedVOHandler.getInstance().getByName([{
        id: 1,
        name: null,
        _type: "osef"
    }, null], "a")).toStrictEqual(null);
    expect(NamedVOHandler.getInstance().getByName([{
        id: 1,
        name: "a",
        _type: "osef"
    }, null], "a")).toStrictEqual({
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
    }], "a")).toStrictEqual(null);
    expect(NamedVOHandler.getInstance().getByName([{
        id: 2,
        name: "c",
        _type: "osef"
    }, {
        id: 1,
        name: null,
        _type: "osef"
    }], "a")).toStrictEqual(null);
    expect(NamedVOHandler.getInstance().getByName([{
        id: 2,
        name: "c",
        _type: "osef"
    }, {
        id: 1,
        name: "a",
        _type: "osef"
    }], "a")).toStrictEqual({
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
    }, "a")).toStrictEqual(null);
    expect(NamedVOHandler.getInstance().getByName({
        1: {
            id: 1,
            name: null,
            _type: "osef"
        }
    }, "a")).toStrictEqual(null);
    expect(NamedVOHandler.getInstance().getByName({
        1: {
            id: 1,
            name: "a",
            _type: "osef"
        }
    }, "a")).toStrictEqual({
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
    }, "a")).toStrictEqual(null);
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
    }, "a")).toStrictEqual(null);
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
    }, "a")).toStrictEqual({
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
    }, "a")).toStrictEqual(null);
    expect(NamedVOHandler.getInstance().getByName({
        1: null,
        2: {
            id: 2,
            name: "c",
            _type: "osef"
        }
    }, "a")).toStrictEqual(null);
    expect(NamedVOHandler.getInstance().getByName({
        1: null,
        2: {
            id: 2,
            name: "c",
            _type: "osef"
        }
    }, "a")).toStrictEqual(null);

    expect(NamedVOHandler.getInstance().getByName({
        1: {
            id: 1,
            name: "b",
            _type: "osef"
        },
        2: null
    }, "a")).toStrictEqual(null);
    expect(NamedVOHandler.getInstance().getByName({
        1: {
            id: 1,
            name: null,
            _type: "osef"
        },
        2: null
    }, "a")).toStrictEqual(null);
    expect(NamedVOHandler.getInstance().getByName({
        1: {
            id: 1,
            name: "a",
            _type: "osef"
        },
        2: null
    }, "a")).toStrictEqual({
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
    }, "a")).toStrictEqual(null);
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
    }, "a")).toStrictEqual(null);
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
    }, "a")).toStrictEqual({
        id: 1,
        name: "a",
        _type: "osef"
    });
});
test('NamedVOHandler: test getNamesList', () => {
    expect(NamedVOHandler.getInstance().getNamesList(null)).toStrictEqual([]);
    expect(NamedVOHandler.getInstance().getNamesList([])).toStrictEqual([]);
    expect(NamedVOHandler.getInstance().getNamesList([null])).toStrictEqual([]);
    expect(NamedVOHandler.getInstance().getNamesList([{
        id: 2,
        name: null,
        _type: "osef"
    }])).toStrictEqual([]);
    expect(NamedVOHandler.getInstance().getNamesList([{
        id: 2,
        name: null,
        _type: "osef"
    }, {
        id: 3,
        name: null,
        _type: "osef"
    }])).toStrictEqual([]);
    expect(NamedVOHandler.getInstance().getNamesList([{
        id: 2,
        name: "o",
        _type: "osef"
    }, {
        id: 3,
        name: null,
        _type: "osef"
    }])).toStrictEqual(['o']);
    expect(NamedVOHandler.getInstance().getNamesList([{
        id: 2,
        name: 'o',
        _type: "osef"
    }, {
        id: 3,
        name: 's',
        _type: "osef"
    }])).toStrictEqual(['o', 's']);
    expect(NamedVOHandler.getInstance().getNamesList([{
        id: 2,
        name: null,
        _type: "osef"
    }, {
        id: 3,
        name: 's',
        _type: "osef"
    }])).toStrictEqual(['s']);
});


test('NamedVOHandler: test sortByNames', () => {
    let vos: INamedVO[] = null;
    NamedVOHandler.getInstance().sortByNames(vos);
    expect(vos).toStrictEqual(null);
    vos = null;
    NamedVOHandler.getInstance().sortByNames(vos, (a, b) => ((a.name < b.name) ? -1 : (a.name == b.name) ? 0 : 1));
    expect(vos).toStrictEqual(null);

    vos = [];
    NamedVOHandler.getInstance().sortByNames(vos);
    expect(vos).toStrictEqual([]);
    vos = [];
    NamedVOHandler.getInstance().sortByNames(vos, (a, b) => ((a.name < b.name) ? -1 : (a.name == b.name) ? 0 : 1));
    expect(vos).toStrictEqual([]);

    vos = [{
        id: 2,
        name: null,
        _type: "osef"
    }];
    NamedVOHandler.getInstance().sortByNames(vos);
    expect(vos).toStrictEqual([{
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
    expect(vos).toStrictEqual([{
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
    expect(vos).toStrictEqual([{
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
    expect(vos).toStrictEqual([{
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
    expect(vos).toStrictEqual([null, {
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
    expect(vos).toStrictEqual([{
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
    expect(vos).toStrictEqual([{
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
    expect(vos).toStrictEqual([{
        id: 3,
        name: 's',
        _type: "osef"
    }, {
        id: 2,
        name: 'o',
        _type: "osef"
    }]);
});