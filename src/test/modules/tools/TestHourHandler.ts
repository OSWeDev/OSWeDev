import { expect } from 'chai';
import 'mocha';
import * as moment from 'moment';
import HourHandler from '../../../shared/tools/HourHandler';

describe('HourHandler', () => {
    it('test: formatHourForIHM', () => {
        expect(HourHandler.getInstance().formatHourForIHM(null, null)).to.equal(null);
        expect(HourHandler.getInstance().formatHourForIHM(null, 2)).to.equal('');
        var duration = moment.duration(2.2555, 'hours');
        expect(HourHandler.getInstance().formatHourForIHM(duration, 0)).to.equal("02h");
        expect(HourHandler.getInstance().formatHourForIHM(duration, 1)).to.equal("02:15");
        expect(HourHandler.getInstance().formatHourForIHM(duration, 2)).to.equal("02:15:19");
        expect(HourHandler.getInstance().formatHourForIHM(duration, 3)).to.equal("02:15:19.800");
        expect(HourHandler.getInstance().formatHourForIHM(duration, 4)).to.equal(null);
    });
    it('test: formatHourFromIHM', () => {
        var duration = moment.duration(5, 'hours');
        expect(HourHandler.getInstance().formatHourFromIHM('[5]', 0)).to.deep.equal(duration);
    });
});
