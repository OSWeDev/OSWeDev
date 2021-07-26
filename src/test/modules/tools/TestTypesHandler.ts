import ServerAPIController from '../../../server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { expect } from 'chai';
import 'mocha';
import TypesHandler from '../../../shared/tools/TypesHandler';

describe('TypesHandler', () => {
    it('test isMoment', () => {
        const moment = require('moment');
        expect(TypesHandler.getInstance().isMoment(moment())).to.equal(true);
        expect(TypesHandler.getInstance().isMoment("notAMoment")).to.equal(false);
        expect(TypesHandler.getInstance().isMoment(null)).to.equal(null);
    });
    it('test isDuration', () => {
        const moment = require('moment');
        expect(TypesHandler.getInstance().isDuration(moment.duration())).to.equal(true);
        expect(TypesHandler.getInstance().isDuration("notADuration")).to.equal(false);
        expect(TypesHandler.getInstance().isDuration(null)).to.equal(null);
    });
    it('test isBoolean', () => {
        expect(TypesHandler.getInstance().isBoolean(true)).to.equal(true);
        expect(TypesHandler.getInstance().isBoolean("notABoolean")).to.equal(false);
        expect(TypesHandler.getInstance().isBoolean(null)).to.equal(null);
    });
    it('test isString', () => {
        expect(TypesHandler.getInstance().isString("String")).to.equal(true);
        expect(TypesHandler.getInstance().isString(0)).to.equal(false);
        expect(TypesHandler.getInstance().isString(null)).to.equal(null);
    });
    it('test isNumber', () => {
        expect(TypesHandler.getInstance().isNumber(0)).to.equal(true);
        expect(TypesHandler.getInstance().isNumber("notANumber")).to.equal(false);
        expect(TypesHandler.getInstance().isNumber(null)).to.equal(null);
    });
    it('test isArray', () => {
        expect(TypesHandler.getInstance().isArray([])).to.equal(true);
        expect(TypesHandler.getInstance().isArray("notAnArray")).to.equal(false);
        expect(TypesHandler.getInstance().isArray(null)).to.equal(null);
    });
    it('test isNull', () => {
        expect(TypesHandler.getInstance().isNull(null)).to.equal(true);
        expect(TypesHandler.getInstance().isNull("notNull")).to.equal(false);
    });
});