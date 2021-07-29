import { expect } from 'chai';
import 'mocha';
import ServerAPIController from '../../../server/modules/API/ServerAPIController';
import ImportTypeXLSXHandler from '../../../server/modules/DataImport/ImportTypeHandlers/ImportTypeXLSXHandler';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();



describe('ImportTypeXLSXHandler', () => {

    it('test getMomentFromXLSDateString', () => {
        expect(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString(null)).to.equal(null);
        expect(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('aa')).to.equal(null);

        expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('1/2/19'), 'YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('01/02/19'), 'YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('01/2/19'), 'YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('1/02/19'), 'YYYY-MM-DD')).to.deep.equal('2019-02-01');

        expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('1/2/2019'), 'YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('01/02/2019'), 'YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('01/2/2019'), 'YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('1/02/2019'), 'YYYY-MM-DD')).to.deep.equal('2019-02-01');

        expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('2019-2-1'), 'YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('2019-02-01'), 'YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('2019-2-01'), 'YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('2019-02-1'), 'YYYY-MM-DD')).to.deep.equal('2019-02-01');

        expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('19-2-1'), 'YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('19-02-01'), 'YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('19-2-01'), 'YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('19-02-1'), 'YYYY-MM-DD')).to.deep.equal('2019-02-01');

        expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('20190201'), 'YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('190201'), 'YYYY-MM-DD')).to.deep.equal('2019-02-01');


        expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('1/2/19 10:00:00'), 'YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('01/02/19 10:00:00'), 'YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('01/2/19 10:00:00'), 'YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('1/02/19 10:00:00'), 'YYYY-MM-DD')).to.deep.equal('2019-02-01');

        expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('1/2/2019 10:00:00'), 'YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('01/02/2019 10:00:00'), 'YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('01/2/2019 10:00:00'), 'YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('1/02/2019 10:00:00'), 'YYYY-MM-DD')).to.deep.equal('2019-02-01');

        expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('2019-2-1 10:00:00'), 'YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('2019-02-01 10:00:00'), 'YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('2019-2-01 10:00:00'), 'YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('2019-02-1 10:00:00'), 'YYYY-MM-DD')).to.deep.equal('2019-02-01');

        expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('19-2-1 10:00:00'), 'YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('19-02-01 10:00:00'), 'YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('19-2-01 10:00:00'), 'YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('19-02-1 10:00:00'), 'YYYY-MM-DD')).to.deep.equal('2019-02-01');

        expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('20190201 10:00:00'), 'YYYY-MM-DD')).to.deep.equal('2019-02-01');
        expect(Dates.format(ImportTypeXLSXHandler.getInstance().getMomentFromXLSDateString('190201 10:00:00'), 'YYYY-MM-DD')).to.deep.equal('2019-02-01');
    });
});