import { expect } from 'chai';
import 'mocha';
import GeoPointHandler from '../../../shared/tools/GeoPointHandler';
import GeoPointVO from '../../../shared/modules/GeoPoint/vos/GeoPointVO';

describe('GeoPointHandler', () => {
    it('test: format', () => {
        expect(GeoPointHandler.getInstance().format(null)).to.equal(null);
        var geoPointVOTest = GeoPointVO.createNew(1, 1);
        expect(GeoPointHandler.getInstance().format(geoPointVOTest)).to.equal('(1,1)');
        geoPointVOTest = GeoPointVO.createNew(1, null);
        expect(GeoPointHandler.getInstance().format(geoPointVOTest)).to.equal(null);
        geoPointVOTest = GeoPointVO.createNew(null, 1);
        expect(GeoPointHandler.getInstance().format(geoPointVOTest)).to.equal(null);
        geoPointVOTest = GeoPointVO.createNew(null, null);
        expect(GeoPointHandler.getInstance().format(geoPointVOTest)).to.equal(null);
    });
    it('test: split', () => {
        expect(GeoPointHandler.getInstance().split(null)).to.equal(null);
        var geoPointVOTest = GeoPointVO.createNew(1, 1);
        expect(GeoPointHandler.getInstance().split("(1, 1)")).to.deep.equal(geoPointVOTest);
        var geoPointVOTest = GeoPointVO.createNew(9.5, 14.3);
        expect(GeoPointHandler.getInstance().split("(9.5, 14.3)")).to.deep.equal(geoPointVOTest);
        var geoPointVOTest = GeoPointVO.createNew(0, 0);
        expect(GeoPointHandler.getInstance().split("(0, 0)")).to.deep.equal(geoPointVOTest);
        expect(GeoPointHandler.getInstance().split("(a, b)")).to.equal(null);
        expect(GeoPointHandler.getInstance().split("(, )")).to.equal(null);
        expect(GeoPointHandler.getInstance().split("notAPosition")).to.equal(null);
    });
    it('test: geopoint', () => {
        expect(GeoPointHandler.getInstance().geopoint(null)).to.equal(null);
        expect(GeoPointHandler.getInstance().split("(null, 1)")).to.equal(null);
        expect(GeoPointHandler.getInstance().split("(1, null)")).to.equal(null);
        var geoPointVOTest = GeoPointVO.createNew(1, 1);
        expect(GeoPointHandler.getInstance().geopoint("(1, 1)")).to.deep.equal(geoPointVOTest);
        expect(GeoPointHandler.getInstance().split("notAPosition")).to.equal(null);
    });
    it('test: longitude', () => {
        expect(GeoPointHandler.getInstance().longitude(null)).to.equal(null);
        expect(GeoPointHandler.getInstance().longitude("(null, 2)")).to.equal(null);
        expect(GeoPointHandler.getInstance().longitude("(1, 2)")).to.equal(1);
        expect(GeoPointHandler.getInstance().longitude("notAPosition")).to.equal(null);
    });
    it('test: latitude', () => {
        expect(GeoPointHandler.getInstance().latitude(null)).to.equal(null);
        expect(GeoPointHandler.getInstance().longitude("(1, null)")).to.equal(null);
        expect(GeoPointHandler.getInstance().latitude("(1, 2)")).to.equal(2);
        expect(GeoPointHandler.getInstance().latitude("notAPosition")).to.equal(null);
    });

});