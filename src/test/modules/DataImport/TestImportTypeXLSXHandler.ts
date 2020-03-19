import { expect } from 'chai';
import 'mocha';
import * as moment from 'moment';
import ImportTypeXLSXHandler from '../../../server/modules/DataImport/ImportTypeHandlers/ImportTypeXLSXHandler';

describe('ImportTypeXLSXHandler', () => {

    it('test getMomentFromXLSDateString', () => {
        expect(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString(null)).to.equal(null);
        expect(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('aa')).to.equal(null);

        expect(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('1/2/19').format('YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('01/02/19').format('YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('01/2/19').format('YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('1/02/19').format('YYYY-MM-DD')).to.deep.equal('2019-02-01');

        expect(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('1/2/2019').format('YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('01/02/2019').format('YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('01/2/2019').format('YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('1/02/2019').format('YYYY-MM-DD')).to.deep.equal('2019-02-01');

        expect(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('2019-2-1').format('YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('2019-02-01').format('YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('2019-2-01').format('YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('2019-02-1').format('YYYY-MM-DD')).to.deep.equal('2019-02-01');

        expect(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('19-2-1').format('YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('19-02-01').format('YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('19-2-01').format('YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('19-02-1').format('YYYY-MM-DD')).to.deep.equal('2019-02-01');

        expect(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('20190201').format('YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('190201').format('YYYY-MM-DD')).to.deep.equal('2019-02-01');


        expect(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('1/2/19 10:00:00').format('YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('01/02/19 10:00:00').format('YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('01/2/19 10:00:00').format('YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('1/02/19 10:00:00').format('YYYY-MM-DD')).to.deep.equal('2019-02-01');

        expect(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('1/2/2019 10:00:00').format('YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('01/02/2019 10:00:00').format('YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('01/2/2019 10:00:00').format('YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('1/02/2019 10:00:00').format('YYYY-MM-DD')).to.deep.equal('2019-02-01');

        expect(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('2019-2-1 10:00:00').format('YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('2019-02-01 10:00:00').format('YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('2019-2-01 10:00:00').format('YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('2019-02-1 10:00:00').format('YYYY-MM-DD')).to.deep.equal('2019-02-01');

        expect(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('19-2-1 10:00:00').format('YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('19-02-01 10:00:00').format('YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('19-2-01 10:00:00').format('YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('19-02-1 10:00:00').format('YYYY-MM-DD')).to.deep.equal('2019-02-01');

        expect(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('20190201 10:00:00').format('YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('190201 10:00:00').format('YYYY-MM-DD')).to.deep.equal('2019-02-01');
    });
});