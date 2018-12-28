import { expect } from 'chai';
import 'mocha';
import * as moment from 'moment';
import TimeHandler from '../../../src/shared/tools/TimeHandler';


it('TimeHandler: formatMinutePrecisionTime', () => {
    expect(TimeHandler.getInstance().formatMinutePrecisionTime(null)).to.equal(null);
    expect(TimeHandler.getInstance().formatMinutePrecisionTime('0')).to.equal('00:00');
    expect(TimeHandler.getInstance().formatMinutePrecisionTime('0h')).to.equal('00:00');
    expect(TimeHandler.getInstance().formatMinutePrecisionTime('0h0')).to.equal('00:00');
    expect(TimeHandler.getInstance().formatMinutePrecisionTime('0:')).to.equal('00:00');
    expect(TimeHandler.getInstance().formatMinutePrecisionTime('0:0')).to.equal('00:00');
    expect(TimeHandler.getInstance().formatMinutePrecisionTime('0H')).to.equal('00:00');
    expect(TimeHandler.getInstance().formatMinutePrecisionTime('0H0')).to.equal('00:00');

    expect(TimeHandler.getInstance().formatMinutePrecisionTime('2')).to.equal('02:00');
    expect(TimeHandler.getInstance().formatMinutePrecisionTime('2h')).to.equal('02:00');
    expect(TimeHandler.getInstance().formatMinutePrecisionTime('2h5')).to.equal('02:05');
    expect(TimeHandler.getInstance().formatMinutePrecisionTime('2:')).to.equal('02:00');
    expect(TimeHandler.getInstance().formatMinutePrecisionTime('2:6')).to.equal('02:06');
    expect(TimeHandler.getInstance().formatMinutePrecisionTime('2H')).to.equal('02:00');
    expect(TimeHandler.getInstance().formatMinutePrecisionTime('2H7')).to.equal('02:07');

    expect(TimeHandler.getInstance().formatMinutePrecisionTime('25')).to.equal(null);
    expect(TimeHandler.getInstance().formatMinutePrecisionTime('-1h')).to.equal(null);
    expect(TimeHandler.getInstance().formatMinutePrecisionTime('2h-5')).to.equal(null);
    expect(TimeHandler.getInstance().formatMinutePrecisionTime('2:0:5')).to.equal('02:00');
    expect(TimeHandler.getInstance().formatMinutePrecisionTime('23:60')).to.equal(null);
    expect(TimeHandler.getInstance().formatMinutePrecisionTime('23H')).to.equal('23:00');
    expect(TimeHandler.getInstance().formatMinutePrecisionTime('12H57')).to.equal('12:57');

    expect(TimeHandler.getInstance().formatMinutePrecisionTime('null')).to.equal(null);
    expect(TimeHandler.getInstance().formatMinutePrecisionTime('1hm')).to.equal(null);
    expect(TimeHandler.getInstance().formatMinutePrecisionTime('13h30')).to.equal('13:30');
    expect(TimeHandler.getInstance().formatMinutePrecisionTime('20H45')).to.equal('20:45');
    expect(TimeHandler.getInstance().formatMinutePrecisionTime('23:0')).to.equal('23:00');
    expect(TimeHandler.getInstance().formatMinutePrecisionTime('03:12')).to.equal('03:12');
});

it('TimeHandler: formatMomentMinutePrecisionTime', () => {
    expect(TimeHandler.getInstance().formatMomentMinutePrecisionTime(null)).to.equal(null);
    expect(TimeHandler.getInstance().formatMomentMinutePrecisionTime(moment('2018-01-01 00:00:05'))).to.equal("00:00");
    expect(TimeHandler.getInstance().formatMomentMinutePrecisionTime(moment('2018-01-01 00:01:05'))).to.equal("00:01");
    expect(TimeHandler.getInstance().formatMomentMinutePrecisionTime(moment('2018-01-01 10:00:05'))).to.equal("10:00");
    expect(TimeHandler.getInstance().formatMomentMinutePrecisionTime(moment('2018-01-01 24:00:00'))).to.equal("00:00");
    expect(TimeHandler.getInstance().formatMomentMinutePrecisionTime(moment('2018-01-01 23:59:59'))).to.equal("23:59");
    expect(TimeHandler.getInstance().formatMomentMinutePrecisionTime(moment('2018-01-01 05:11:05'))).to.equal("05:11");
});
