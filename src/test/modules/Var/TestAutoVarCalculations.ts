/* tslint:disable:no-unused-expression */
import { expect } from 'chai';
import 'mocha';
import ServerAPIController from '../../../server/modules/API/ServerAPIController';
import AutoVarServerController from '../../../server/modules/Var/auto/AutoVarServerController';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import Durations from '../../../shared/modules/FormatDatesNombres/Dates/Durations';
import VarConfVO from '../../../shared/modules/Var/vos/VarConfVO';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();


describe('AutoVarServerController.do_calculation', () => {

    it('test AUTO_OPERATEUR_UNITAIRE_VOFIELDREF', async () => {

        expect(AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_UNITAIRE_VOFIELDREF)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_VOFIELDREF)).to.throw();
        expect(AutoVarServerController.do_calculation([null], VarConfVO.AUTO_OPERATEUR_UNITAIRE_VOFIELDREF)).to.equal(null);
        expect(AutoVarServerController.do_calculation([undefined], VarConfVO.AUTO_OPERATEUR_UNITAIRE_VOFIELDREF)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN], VarConfVO.AUTO_OPERATEUR_UNITAIRE_VOFIELDREF)).to.equal(null);
        expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_VOFIELDREF)).to.equal(1);
        expect(AutoVarServerController.do_calculation([1.5], VarConfVO.AUTO_OPERATEUR_UNITAIRE_VOFIELDREF)).to.equal(1.5);
        expect(AutoVarServerController.do_calculation([0], VarConfVO.AUTO_OPERATEUR_UNITAIRE_VOFIELDREF)).to.equal(0);
        expect(AutoVarServerController.do_calculation([-20.123], VarConfVO.AUTO_OPERATEUR_UNITAIRE_VOFIELDREF)).to.equal(-20.123);
    });

    it('test AUTO_OPERATEUR_UNITAIRE_MOINS', async () => {

        expect(AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MOINS)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MOINS)).to.throw();
        expect(AutoVarServerController.do_calculation([null], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MOINS)).to.equal(null);
        expect(AutoVarServerController.do_calculation([undefined], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MOINS)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MOINS)).to.equal(null);
        expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MOINS)).to.equal(-1);
        expect(AutoVarServerController.do_calculation([1.5], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MOINS)).to.equal(-1.5);
        expect(AutoVarServerController.do_calculation([0], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MOINS)).to.equal(0);
        expect(AutoVarServerController.do_calculation([-20.123], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MOINS)).to.equal(20.123);
    });

    it('test AUTO_OPERATEUR_UNITAIRE_NOT', async () => {

        expect(AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_UNITAIRE_NOT)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_NOT)).to.throw();
        expect(AutoVarServerController.do_calculation([null], VarConfVO.AUTO_OPERATEUR_UNITAIRE_NOT)).to.equal(null);
        expect(AutoVarServerController.do_calculation([undefined], VarConfVO.AUTO_OPERATEUR_UNITAIRE_NOT)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN], VarConfVO.AUTO_OPERATEUR_UNITAIRE_NOT)).to.equal(null);
        expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_NOT)).to.equal(0);
        expect(AutoVarServerController.do_calculation([1.5], VarConfVO.AUTO_OPERATEUR_UNITAIRE_NOT)).to.equal(0);
        expect(AutoVarServerController.do_calculation([0], VarConfVO.AUTO_OPERATEUR_UNITAIRE_NOT)).to.equal(1);
        expect(AutoVarServerController.do_calculation([-20.123], VarConfVO.AUTO_OPERATEUR_UNITAIRE_NOT)).to.equal(0);
    });

    it('test AUTO_OPERATEUR_UNITAIRE_ABS', async () => {

        expect(AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ABS)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ABS)).to.throw();
        expect(AutoVarServerController.do_calculation([null], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ABS)).to.equal(null);
        expect(AutoVarServerController.do_calculation([undefined], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ABS)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ABS)).to.equal(null);
        expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ABS)).to.equal(1);
        expect(AutoVarServerController.do_calculation([1.5], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ABS)).to.equal(1.5);
        expect(AutoVarServerController.do_calculation([0], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ABS)).to.equal(0);
        expect(AutoVarServerController.do_calculation([-20.123], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ABS)).to.equal(20.123);
    });

    it('test AUTO_OPERATEUR_UNITAIRE_ISNULL', async () => {

        expect(AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNULL)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNULL)).to.throw();
        expect(AutoVarServerController.do_calculation([null], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNULL)).to.equal(1);
        expect(AutoVarServerController.do_calculation([undefined], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNULL)).to.equal(1);
        expect(AutoVarServerController.do_calculation([NaN], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNULL)).to.equal(1);
        expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNULL)).to.equal(0);
        expect(AutoVarServerController.do_calculation([1.5], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNULL)).to.equal(0);
        expect(AutoVarServerController.do_calculation([0], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNULL)).to.equal(0);
        expect(AutoVarServerController.do_calculation([-20.123], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNULL)).to.equal(0);
    });

    it('test AUTO_OPERATEUR_UNITAIRE_ISNOTNULL', async () => {

        expect(AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNOTNULL)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNOTNULL)).to.throw();
        expect(AutoVarServerController.do_calculation([null], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNOTNULL)).to.equal(0);
        expect(AutoVarServerController.do_calculation([undefined], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNOTNULL)).to.equal(0);
        expect(AutoVarServerController.do_calculation([NaN], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNOTNULL)).to.equal(0);
        expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNOTNULL)).to.equal(1);
        expect(AutoVarServerController.do_calculation([1.5], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNOTNULL)).to.equal(1);
        expect(AutoVarServerController.do_calculation([0], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNOTNULL)).to.equal(1);
        expect(AutoVarServerController.do_calculation([-20.123], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNOTNULL)).to.equal(1);
    });

    it('test AUTO_OPERATEUR_UNITAIRE_FACTORIELLE', async () => {

        expect(AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNOTNULL)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNOTNULL)).to.throw();
        expect(AutoVarServerController.do_calculation([null], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNOTNULL)).to.throw();
        expect(AutoVarServerController.do_calculation([undefined], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNOTNULL)).to.throw();
        expect(AutoVarServerController.do_calculation([NaN], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNOTNULL)).to.throw();
        // Not Implemented
        expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNOTNULL)).to.throw();
        expect(AutoVarServerController.do_calculation([1.5], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNOTNULL)).to.throw();
        expect(AutoVarServerController.do_calculation([0], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNOTNULL)).to.throw();
        expect(AutoVarServerController.do_calculation([-20.123], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNOTNULL)).to.throw();
    });

    it('test AUTO_OPERATEUR_UNITAIRE_LN', async () => {

        expect(AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_UNITAIRE_LN)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_LN)).to.throw();
        expect(AutoVarServerController.do_calculation([null], VarConfVO.AUTO_OPERATEUR_UNITAIRE_LN)).to.equal(null);
        expect(AutoVarServerController.do_calculation([undefined], VarConfVO.AUTO_OPERATEUR_UNITAIRE_LN)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN], VarConfVO.AUTO_OPERATEUR_UNITAIRE_LN)).to.equal(null);
        expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_LN)).to.equal(Math.log(1));
        expect(AutoVarServerController.do_calculation([1.5], VarConfVO.AUTO_OPERATEUR_UNITAIRE_LN)).to.equal(Math.log(1.5));
        expect(AutoVarServerController.do_calculation([0], VarConfVO.AUTO_OPERATEUR_UNITAIRE_LN)).to.equal(Math.log(0));
        expect(AutoVarServerController.do_calculation([-20.123], VarConfVO.AUTO_OPERATEUR_UNITAIRE_LN)).to.equal(Math.log(-20.123));
    });

    it('test AUTO_OPERATEUR_UNITAIRE_RACINE', async () => {

        expect(AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_UNITAIRE_RACINE)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_RACINE)).to.throw();
        expect(AutoVarServerController.do_calculation([null], VarConfVO.AUTO_OPERATEUR_UNITAIRE_RACINE)).to.equal(null);
        expect(AutoVarServerController.do_calculation([undefined], VarConfVO.AUTO_OPERATEUR_UNITAIRE_RACINE)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN], VarConfVO.AUTO_OPERATEUR_UNITAIRE_RACINE)).to.equal(null);
        expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_RACINE)).to.equal(Math.sqrt(1));
        expect(AutoVarServerController.do_calculation([1.5], VarConfVO.AUTO_OPERATEUR_UNITAIRE_RACINE)).to.equal(Math.sqrt(1.5));
        expect(AutoVarServerController.do_calculation([0], VarConfVO.AUTO_OPERATEUR_UNITAIRE_RACINE)).to.equal(Math.sqrt(0));
        expect(AutoVarServerController.do_calculation([-20.123], VarConfVO.AUTO_OPERATEUR_UNITAIRE_RACINE)).to.equal(Math.sqrt(-20.123));
    });

    it('test AUTO_OPERATEUR_UNITAIRE_ANNEE', async () => {

        expect(AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ANNEE)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ANNEE)).to.throw();
        expect(AutoVarServerController.do_calculation([null], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ANNEE)).to.equal(null);
        expect(AutoVarServerController.do_calculation([undefined], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ANNEE)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ANNEE)).to.equal(null);
        expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ANNEE)).to.equal(Dates.year(1));
        expect(AutoVarServerController.do_calculation([1.5], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ANNEE)).to.equal(Dates.year(1.5));
        expect(AutoVarServerController.do_calculation([0], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ANNEE)).to.equal(Dates.year(0));
        expect(AutoVarServerController.do_calculation([-20.123], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ANNEE)).to.equal(Dates.year(-20.123));
        expect(AutoVarServerController.do_calculation([Dates.now()], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ANNEE)).to.equal(Dates.year(Dates.now()));
    });

    it('test AUTO_OPERATEUR_UNITAIRE_MOIS', async () => {

        expect(AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MOIS)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MOIS)).to.throw();
        expect(AutoVarServerController.do_calculation([null], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MOIS)).to.equal(null);
        expect(AutoVarServerController.do_calculation([undefined], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MOIS)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MOIS)).to.equal(null);
        expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MOIS)).to.equal(Dates.month(1));
        expect(AutoVarServerController.do_calculation([1.5], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MOIS)).to.equal(Dates.month(1.5));
        expect(AutoVarServerController.do_calculation([0], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MOIS)).to.equal(Dates.month(0));
        expect(AutoVarServerController.do_calculation([-20.123], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MOIS)).to.equal(Dates.month(-20.123));
        expect(AutoVarServerController.do_calculation([Dates.now()], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MOIS)).to.equal(Dates.month(Dates.now()));
    });

    it('test AUTO_OPERATEUR_UNITAIRE_JOUR_DU_MOIS', async () => {

        expect(AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_UNITAIRE_JOUR_DU_MOIS)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_JOUR_DU_MOIS)).to.throw();
        expect(AutoVarServerController.do_calculation([null], VarConfVO.AUTO_OPERATEUR_UNITAIRE_JOUR_DU_MOIS)).to.equal(null);
        expect(AutoVarServerController.do_calculation([undefined], VarConfVO.AUTO_OPERATEUR_UNITAIRE_JOUR_DU_MOIS)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN], VarConfVO.AUTO_OPERATEUR_UNITAIRE_JOUR_DU_MOIS)).to.equal(null);
        expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_JOUR_DU_MOIS)).to.equal(Dates.date(1));
        expect(AutoVarServerController.do_calculation([1.5], VarConfVO.AUTO_OPERATEUR_UNITAIRE_JOUR_DU_MOIS)).to.equal(Dates.date(1.5));
        expect(AutoVarServerController.do_calculation([0], VarConfVO.AUTO_OPERATEUR_UNITAIRE_JOUR_DU_MOIS)).to.equal(Dates.date(0));
        expect(AutoVarServerController.do_calculation([-20.123], VarConfVO.AUTO_OPERATEUR_UNITAIRE_JOUR_DU_MOIS)).to.equal(Dates.date(-20.123));
        expect(AutoVarServerController.do_calculation([Dates.now()], VarConfVO.AUTO_OPERATEUR_UNITAIRE_JOUR_DU_MOIS)).to.equal(Dates.date(Dates.now()));
    });

    it('test AUTO_OPERATEUR_UNITAIRE_JOUR_DE_LA_SEMAINE', async () => {

        expect(AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_UNITAIRE_JOUR_DE_LA_SEMAINE)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_JOUR_DE_LA_SEMAINE)).to.throw();
        expect(AutoVarServerController.do_calculation([null], VarConfVO.AUTO_OPERATEUR_UNITAIRE_JOUR_DE_LA_SEMAINE)).to.equal(null);
        expect(AutoVarServerController.do_calculation([undefined], VarConfVO.AUTO_OPERATEUR_UNITAIRE_JOUR_DE_LA_SEMAINE)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN], VarConfVO.AUTO_OPERATEUR_UNITAIRE_JOUR_DE_LA_SEMAINE)).to.equal(null);
        expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_JOUR_DE_LA_SEMAINE)).to.equal(Dates.isoWeekday(1));
        expect(AutoVarServerController.do_calculation([1.5], VarConfVO.AUTO_OPERATEUR_UNITAIRE_JOUR_DE_LA_SEMAINE)).to.equal(Dates.isoWeekday(1.5));
        expect(AutoVarServerController.do_calculation([0], VarConfVO.AUTO_OPERATEUR_UNITAIRE_JOUR_DE_LA_SEMAINE)).to.equal(Dates.isoWeekday(0));
        expect(AutoVarServerController.do_calculation([-20.123], VarConfVO.AUTO_OPERATEUR_UNITAIRE_JOUR_DE_LA_SEMAINE)).to.equal(Dates.isoWeekday(-20.123));
        expect(AutoVarServerController.do_calculation([Dates.now()], VarConfVO.AUTO_OPERATEUR_UNITAIRE_JOUR_DE_LA_SEMAINE)).to.equal(Dates.isoWeekday(Dates.now()));
    });

    it('test AUTO_OPERATEUR_UNITAIRE_HEURE', async () => {

        expect(AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_UNITAIRE_HEURE)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_HEURE)).to.throw();
        expect(AutoVarServerController.do_calculation([null], VarConfVO.AUTO_OPERATEUR_UNITAIRE_HEURE)).to.equal(null);
        expect(AutoVarServerController.do_calculation([undefined], VarConfVO.AUTO_OPERATEUR_UNITAIRE_HEURE)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN], VarConfVO.AUTO_OPERATEUR_UNITAIRE_HEURE)).to.equal(null);
        expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_HEURE)).to.equal(Dates.hour(1));
        expect(AutoVarServerController.do_calculation([1.5], VarConfVO.AUTO_OPERATEUR_UNITAIRE_HEURE)).to.equal(Dates.hour(1.5));
        expect(AutoVarServerController.do_calculation([0], VarConfVO.AUTO_OPERATEUR_UNITAIRE_HEURE)).to.equal(Dates.hour(0));
        expect(AutoVarServerController.do_calculation([-20.123], VarConfVO.AUTO_OPERATEUR_UNITAIRE_HEURE)).to.equal(Dates.hour(-20.123));
        expect(AutoVarServerController.do_calculation([Dates.now()], VarConfVO.AUTO_OPERATEUR_UNITAIRE_HEURE)).to.equal(Dates.hour(Dates.now()));
    });

    it('test AUTO_OPERATEUR_UNITAIRE_MINUTE', async () => {

        expect(AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MINUTE)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MINUTE)).to.throw();
        expect(AutoVarServerController.do_calculation([null], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MINUTE)).to.equal(null);
        expect(AutoVarServerController.do_calculation([undefined], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MINUTE)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MINUTE)).to.equal(null);
        expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MINUTE)).to.equal(Dates.minute(1));
        expect(AutoVarServerController.do_calculation([1.5], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MINUTE)).to.equal(Dates.minute(1.5));
        expect(AutoVarServerController.do_calculation([0], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MINUTE)).to.equal(Dates.minute(0));
        expect(AutoVarServerController.do_calculation([-20.123], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MINUTE)).to.equal(Dates.minute(-20.123));
        expect(AutoVarServerController.do_calculation([Dates.now()], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MINUTE)).to.equal(Dates.minute(Dates.now()));
    });

    it('test AUTO_OPERATEUR_UNITAIRE_SECONDE', async () => {

        expect(AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_UNITAIRE_SECONDE)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_SECONDE)).to.throw();
        expect(AutoVarServerController.do_calculation([null], VarConfVO.AUTO_OPERATEUR_UNITAIRE_SECONDE)).to.equal(null);
        expect(AutoVarServerController.do_calculation([undefined], VarConfVO.AUTO_OPERATEUR_UNITAIRE_SECONDE)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN], VarConfVO.AUTO_OPERATEUR_UNITAIRE_SECONDE)).to.equal(null);
        expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_SECONDE)).to.equal(Dates.second(1));
        expect(AutoVarServerController.do_calculation([1.5], VarConfVO.AUTO_OPERATEUR_UNITAIRE_SECONDE)).to.equal(Dates.second(1.5));
        expect(AutoVarServerController.do_calculation([0], VarConfVO.AUTO_OPERATEUR_UNITAIRE_SECONDE)).to.equal(Dates.second(0));
        expect(AutoVarServerController.do_calculation([-20.123], VarConfVO.AUTO_OPERATEUR_UNITAIRE_SECONDE)).to.equal(Dates.second(-20.123));
        expect(AutoVarServerController.do_calculation([Dates.now()], VarConfVO.AUTO_OPERATEUR_UNITAIRE_SECONDE)).to.equal(Dates.second(Dates.now()));
    });

    it('test AUTO_OPERATEUR_UNITAIRE_EN_ANNEES', async () => {

        expect(AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_ANNEES)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_ANNEES)).to.throw();
        expect(AutoVarServerController.do_calculation([null], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_ANNEES)).to.equal(null);
        expect(AutoVarServerController.do_calculation([undefined], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_ANNEES)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_ANNEES)).to.equal(null);
        expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_ANNEES)).to.equal(Durations.as(1, TimeSegment.TYPE_YEAR));
        expect(AutoVarServerController.do_calculation([1.5], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_ANNEES)).to.equal(Durations.as(1.5, TimeSegment.TYPE_YEAR));
        expect(AutoVarServerController.do_calculation([0], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_ANNEES)).to.equal(Durations.as(0, TimeSegment.TYPE_YEAR));
        expect(AutoVarServerController.do_calculation([-20.123], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_ANNEES)).to.equal(Durations.as(-20.123, TimeSegment.TYPE_YEAR));
        expect(AutoVarServerController.do_calculation([Dates.now()], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_ANNEES)).to.equal(Durations.as(Dates.now(), TimeSegment.TYPE_YEAR));
    });

    it('test AUTO_OPERATEUR_UNITAIRE_EN_MOIS', async () => {

        expect(AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_MOIS)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_MOIS)).to.throw();
        expect(AutoVarServerController.do_calculation([null], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_MOIS)).to.equal(null);
        expect(AutoVarServerController.do_calculation([undefined], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_MOIS)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_MOIS)).to.equal(null);
        expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_MOIS)).to.equal(Durations.as(1, TimeSegment.TYPE_MONTH));
        expect(AutoVarServerController.do_calculation([1.5], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_MOIS)).to.equal(Durations.as(1.5, TimeSegment.TYPE_MONTH));
        expect(AutoVarServerController.do_calculation([0], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_MOIS)).to.equal(Durations.as(0, TimeSegment.TYPE_MONTH));
        expect(AutoVarServerController.do_calculation([-20.123], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_MOIS)).to.equal(Durations.as(-20.123, TimeSegment.TYPE_MONTH));
        expect(AutoVarServerController.do_calculation([Dates.now()], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_MOIS)).to.equal(Durations.as(Dates.now(), TimeSegment.TYPE_MONTH));
    });

    it('test AUTO_OPERATEUR_UNITAIRE_EN_SEMAINES', async () => {

        expect(AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_SEMAINES)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_SEMAINES)).to.throw();
        expect(AutoVarServerController.do_calculation([null], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_SEMAINES)).to.equal(null);
        expect(AutoVarServerController.do_calculation([undefined], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_SEMAINES)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_SEMAINES)).to.equal(null);
        expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_SEMAINES)).to.equal(Durations.as(1, TimeSegment.TYPE_WEEK));
        expect(AutoVarServerController.do_calculation([1.5], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_SEMAINES)).to.equal(Durations.as(1.5, TimeSegment.TYPE_WEEK));
        expect(AutoVarServerController.do_calculation([0], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_SEMAINES)).to.equal(Durations.as(0, TimeSegment.TYPE_WEEK));
        expect(AutoVarServerController.do_calculation([-20.123], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_SEMAINES)).to.equal(Durations.as(-20.123, TimeSegment.TYPE_WEEK));
        expect(AutoVarServerController.do_calculation([Dates.now()], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_SEMAINES)).to.equal(Durations.as(Dates.now(), TimeSegment.TYPE_WEEK));
    });

    it('test AUTO_OPERATEUR_UNITAIRE_EN_JOURS', async () => {

        expect(AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_JOURS)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_JOURS)).to.throw();
        expect(AutoVarServerController.do_calculation([null], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_JOURS)).to.equal(null);
        expect(AutoVarServerController.do_calculation([undefined], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_JOURS)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_JOURS)).to.equal(null);
        expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_JOURS)).to.equal(Durations.as(1, TimeSegment.TYPE_DAY));
        expect(AutoVarServerController.do_calculation([1.5], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_JOURS)).to.equal(Durations.as(1.5, TimeSegment.TYPE_DAY));
        expect(AutoVarServerController.do_calculation([0], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_JOURS)).to.equal(Durations.as(0, TimeSegment.TYPE_DAY));
        expect(AutoVarServerController.do_calculation([-20.123], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_JOURS)).to.equal(Durations.as(-20.123, TimeSegment.TYPE_DAY));
        expect(AutoVarServerController.do_calculation([Dates.now()], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_JOURS)).to.equal(Durations.as(Dates.now(), TimeSegment.TYPE_DAY));
    });

    it('test AUTO_OPERATEUR_UNITAIRE_EN_HEURES', async () => {

        expect(AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_HEURES)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_HEURES)).to.throw();
        expect(AutoVarServerController.do_calculation([null], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_HEURES)).to.equal(null);
        expect(AutoVarServerController.do_calculation([undefined], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_HEURES)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_HEURES)).to.equal(null);
        expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_HEURES)).to.equal(Durations.as(1, TimeSegment.TYPE_HOUR));
        expect(AutoVarServerController.do_calculation([1.5], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_HEURES)).to.equal(Durations.as(1.5, TimeSegment.TYPE_HOUR));
        expect(AutoVarServerController.do_calculation([0], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_HEURES)).to.equal(Durations.as(0, TimeSegment.TYPE_HOUR));
        expect(AutoVarServerController.do_calculation([-20.123], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_HEURES)).to.equal(Durations.as(-20.123, TimeSegment.TYPE_HOUR));
        expect(AutoVarServerController.do_calculation([Dates.now()], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_HEURES)).to.equal(Durations.as(Dates.now(), TimeSegment.TYPE_HOUR));
    });

    it('test AUTO_OPERATEUR_UNITAIRE_EN_MINUTES', async () => {

        expect(AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_MINUTES)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_MINUTES)).to.throw();
        expect(AutoVarServerController.do_calculation([null], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_MINUTES)).to.equal(null);
        expect(AutoVarServerController.do_calculation([undefined], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_MINUTES)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_MINUTES)).to.equal(null);
        expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_MINUTES)).to.equal(Durations.as(1, TimeSegment.TYPE_MINUTE));
        expect(AutoVarServerController.do_calculation([1.5], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_MINUTES)).to.equal(Durations.as(1.5, TimeSegment.TYPE_MINUTE));
        expect(AutoVarServerController.do_calculation([0], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_MINUTES)).to.equal(Durations.as(0, TimeSegment.TYPE_MINUTE));
        expect(AutoVarServerController.do_calculation([-20.123], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_MINUTES)).to.equal(Durations.as(-20.123, TimeSegment.TYPE_MINUTE));
        expect(AutoVarServerController.do_calculation([Dates.now()], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_MINUTES)).to.equal(Durations.as(Dates.now(), TimeSegment.TYPE_MINUTE));
    });

    it('test AUTO_OPERATEUR_UNITAIRE_EN_SECONDES', async () => {

        expect(AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_SECONDES)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_SECONDES)).to.throw();
        expect(AutoVarServerController.do_calculation([null], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_SECONDES)).to.equal(null);
        expect(AutoVarServerController.do_calculation([undefined], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_SECONDES)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_SECONDES)).to.equal(null);
        expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_SECONDES)).to.equal(Durations.as(1, TimeSegment.TYPE_SECOND));
        expect(AutoVarServerController.do_calculation([1.5], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_SECONDES)).to.equal(Durations.as(1.5, TimeSegment.TYPE_SECOND));
        expect(AutoVarServerController.do_calculation([0], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_SECONDES)).to.equal(Durations.as(0, TimeSegment.TYPE_SECOND));
        expect(AutoVarServerController.do_calculation([-20.123], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_SECONDES)).to.equal(Durations.as(-20.123, TimeSegment.TYPE_SECOND));
        expect(AutoVarServerController.do_calculation([Dates.now()], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_SECONDES)).to.equal(Durations.as(Dates.now(), TimeSegment.TYPE_SECOND));
    });

    it('test AUTO_OPERATEUR_BINAIRE_PLUS', async () => {

        expect(AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_BINAIRE_PLUS)).to.throw();
        expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_BINAIRE_PLUS)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_PLUS)).to.throw();
        expect(AutoVarServerController.do_calculation([null, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_PLUS)).to.equal(null);
        expect(AutoVarServerController.do_calculation([undefined, undefined], VarConfVO.AUTO_OPERATEUR_BINAIRE_PLUS)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_PLUS)).to.equal(null);
        expect(AutoVarServerController.do_calculation([null, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_PLUS)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_PLUS)).to.equal(null);
        expect(AutoVarServerController.do_calculation([0, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_PLUS)).to.equal(0);
        expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_PLUS)).to.equal(1);
        expect(AutoVarServerController.do_calculation([1, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_PLUS)).to.equal(1);
        expect(AutoVarServerController.do_calculation([1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_PLUS)).to.equal(2);
        expect(AutoVarServerController.do_calculation([1, -1], VarConfVO.AUTO_OPERATEUR_BINAIRE_PLUS)).to.equal(0);
        expect(AutoVarServerController.do_calculation([-1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_PLUS)).to.equal(0);
        expect(AutoVarServerController.do_calculation([1.055, 20], VarConfVO.AUTO_OPERATEUR_BINAIRE_PLUS)).to.equal(21.055);
        expect(AutoVarServerController.do_calculation([-14.123, 23], VarConfVO.AUTO_OPERATEUR_BINAIRE_PLUS)).to.equal(8.877);
    });

    it('test AUTO_OPERATEUR_BINAIRE_MOINS', async () => {

        expect(AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_BINAIRE_MOINS)).to.throw();
        expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MOINS)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_MOINS)).to.throw();
        expect(AutoVarServerController.do_calculation([null, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_MOINS)).to.equal(null);
        expect(AutoVarServerController.do_calculation([undefined, undefined], VarConfVO.AUTO_OPERATEUR_BINAIRE_MOINS)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_MOINS)).to.equal(null);
        expect(AutoVarServerController.do_calculation([null, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_MOINS)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_MOINS)).to.equal(null);
        expect(AutoVarServerController.do_calculation([0, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_MOINS)).to.equal(0);
        expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MOINS)).to.equal(-1);
        expect(AutoVarServerController.do_calculation([1, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_MOINS)).to.equal(1);
        expect(AutoVarServerController.do_calculation([1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MOINS)).to.equal(0);
        expect(AutoVarServerController.do_calculation([1, -1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MOINS)).to.equal(2);
        expect(AutoVarServerController.do_calculation([-1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MOINS)).to.equal(-2);
        expect(AutoVarServerController.do_calculation([1.055, 20], VarConfVO.AUTO_OPERATEUR_BINAIRE_MOINS)).to.equal(-18.945);
        expect(AutoVarServerController.do_calculation([-14.123, 23], VarConfVO.AUTO_OPERATEUR_BINAIRE_MOINS)).to.equal(-37.123);
    });

    it('test AUTO_OPERATEUR_BINAIRE_MULT', async () => {

        expect(AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_BINAIRE_MULT)).to.throw();
        expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MULT)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_MULT)).to.throw();
        expect(AutoVarServerController.do_calculation([null, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_MULT)).to.equal(null);
        expect(AutoVarServerController.do_calculation([undefined, undefined], VarConfVO.AUTO_OPERATEUR_BINAIRE_MULT)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_MULT)).to.equal(null);
        expect(AutoVarServerController.do_calculation([null, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_MULT)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_MULT)).to.equal(null);
        expect(AutoVarServerController.do_calculation([0, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_MULT)).to.equal(0);
        expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MULT)).to.equal(0);
        expect(AutoVarServerController.do_calculation([1, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_MULT)).to.equal(0);
        expect(AutoVarServerController.do_calculation([1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MULT)).to.equal(1);
        expect(AutoVarServerController.do_calculation([1, -1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MULT)).to.equal(-1);
        expect(AutoVarServerController.do_calculation([-1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MULT)).to.equal(-1);
        expect(AutoVarServerController.do_calculation([1.055, 20], VarConfVO.AUTO_OPERATEUR_BINAIRE_MULT)).to.equal(21.1);
        expect(AutoVarServerController.do_calculation([-14.123, 23], VarConfVO.AUTO_OPERATEUR_BINAIRE_MULT)).to.equal(-324.829);
    });

    it('test AUTO_OPERATEUR_BINAIRE_DIV', async () => {

        expect(AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIV)).to.throw();
        expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIV)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIV)).to.throw();
        expect(AutoVarServerController.do_calculation([null, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIV)).to.equal(null);
        expect(AutoVarServerController.do_calculation([undefined, undefined], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIV)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIV)).to.equal(null);
        expect(AutoVarServerController.do_calculation([null, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIV)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIV)).to.equal(null);
        expect(AutoVarServerController.do_calculation([0, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIV)).to.equal(null);
        expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIV)).to.equal(0);
        expect(AutoVarServerController.do_calculation([1, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIV)).to.equal(null);
        expect(AutoVarServerController.do_calculation([1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIV)).to.equal(1);
        expect(AutoVarServerController.do_calculation([1, -1], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIV)).to.equal(-1);
        expect(AutoVarServerController.do_calculation([-1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIV)).to.equal(-1);
        expect(AutoVarServerController.do_calculation([1.055, 20], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIV)).to.equal(0.05275);
        expect(AutoVarServerController.do_calculation([-14.123, 23], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIV)).to.equal(-14.123 / 23);
    });

    it('test AUTO_OPERATEUR_BINAIRE_MODULO', async () => {

        expect(AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_BINAIRE_MODULO)).to.throw();
        expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MODULO)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_MODULO)).to.throw();
        expect(AutoVarServerController.do_calculation([null, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_MODULO)).to.equal(null);
        expect(AutoVarServerController.do_calculation([undefined, undefined], VarConfVO.AUTO_OPERATEUR_BINAIRE_MODULO)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_MODULO)).to.equal(null);
        expect(AutoVarServerController.do_calculation([null, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_MODULO)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_MODULO)).to.equal(null);
        expect(AutoVarServerController.do_calculation([0, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_MODULO)).to.equal(null);
        expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MODULO)).to.equal(0);
        expect(AutoVarServerController.do_calculation([1, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_MODULO)).to.equal(null);
        expect(AutoVarServerController.do_calculation([1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MODULO)).to.equal(0);
        expect(AutoVarServerController.do_calculation([1, -1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MODULO)).to.equal(0);
        expect(AutoVarServerController.do_calculation([-1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MODULO)).to.equal(0);
        expect(AutoVarServerController.do_calculation([1.055, 20], VarConfVO.AUTO_OPERATEUR_BINAIRE_MODULO)).to.equal(1.055);
        expect(AutoVarServerController.do_calculation([-14.123, 23], VarConfVO.AUTO_OPERATEUR_BINAIRE_MODULO)).to.equal(-14.123);
    });

    it('test AUTO_OPERATEUR_BINAIRE_MAX', async () => {

        expect(AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_BINAIRE_MAX)).to.throw();
        expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MAX)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_MAX)).to.throw();
        expect(AutoVarServerController.do_calculation([null, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_MAX)).to.equal(null);
        expect(AutoVarServerController.do_calculation([undefined, undefined], VarConfVO.AUTO_OPERATEUR_BINAIRE_MAX)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_MAX)).to.equal(null);
        expect(AutoVarServerController.do_calculation([null, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_MAX)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_MAX)).to.equal(null);
        expect(AutoVarServerController.do_calculation([0, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_MAX)).to.equal(0);
        expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MAX)).to.equal(1);
        expect(AutoVarServerController.do_calculation([1, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_MAX)).to.equal(1);
        expect(AutoVarServerController.do_calculation([1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MAX)).to.equal(1);
        expect(AutoVarServerController.do_calculation([1, -1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MAX)).to.equal(1);
        expect(AutoVarServerController.do_calculation([-1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MAX)).to.equal(1);
        expect(AutoVarServerController.do_calculation([1.055, 20], VarConfVO.AUTO_OPERATEUR_BINAIRE_MAX)).to.equal(20);
        expect(AutoVarServerController.do_calculation([-14.123, 23], VarConfVO.AUTO_OPERATEUR_BINAIRE_MAX)).to.equal(23);
    });

    it('test AUTO_OPERATEUR_BINAIRE_MIN', async () => {

        expect(AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_BINAIRE_MIN)).to.throw();
        expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MIN)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_MIN)).to.throw();
        expect(AutoVarServerController.do_calculation([null, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_MIN)).to.equal(null);
        expect(AutoVarServerController.do_calculation([undefined, undefined], VarConfVO.AUTO_OPERATEUR_BINAIRE_MIN)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_MIN)).to.equal(null);
        expect(AutoVarServerController.do_calculation([null, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_MIN)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_MIN)).to.equal(null);
        expect(AutoVarServerController.do_calculation([0, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_MIN)).to.equal(0);
        expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MIN)).to.equal(0);
        expect(AutoVarServerController.do_calculation([1, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_MIN)).to.equal(0);
        expect(AutoVarServerController.do_calculation([1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MIN)).to.equal(1);
        expect(AutoVarServerController.do_calculation([1, -1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MIN)).to.equal(-1);
        expect(AutoVarServerController.do_calculation([-1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MIN)).to.equal(-1);
        expect(AutoVarServerController.do_calculation([1.055, 20], VarConfVO.AUTO_OPERATEUR_BINAIRE_MIN)).to.equal(1.055);
        expect(AutoVarServerController.do_calculation([-14.123, 23], VarConfVO.AUTO_OPERATEUR_BINAIRE_MIN)).to.equal(-14.123);
    });

    it('test AUTO_OPERATEUR_BINAIRE_EGAL', async () => {

        expect(AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_BINAIRE_EGAL)).to.throw();
        expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_BINAIRE_EGAL)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_EGAL)).to.throw();
        expect(AutoVarServerController.do_calculation([null, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_EGAL)).to.equal(1);
        expect(AutoVarServerController.do_calculation([undefined, undefined], VarConfVO.AUTO_OPERATEUR_BINAIRE_EGAL)).to.equal(1);
        expect(AutoVarServerController.do_calculation([NaN, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_EGAL)).to.equal(1);
        expect(AutoVarServerController.do_calculation([null, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_EGAL)).to.equal(0);
        expect(AutoVarServerController.do_calculation([NaN, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_EGAL)).to.equal(0);
        expect(AutoVarServerController.do_calculation([0, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_EGAL)).to.equal(1);
        expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_EGAL)).to.equal(0);
        expect(AutoVarServerController.do_calculation([1, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_EGAL)).to.equal(0);
        expect(AutoVarServerController.do_calculation([1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_EGAL)).to.equal(1);
        expect(AutoVarServerController.do_calculation([1, -1], VarConfVO.AUTO_OPERATEUR_BINAIRE_EGAL)).to.equal(0);
        expect(AutoVarServerController.do_calculation([-1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_EGAL)).to.equal(0);
        expect(AutoVarServerController.do_calculation([1.055, 20], VarConfVO.AUTO_OPERATEUR_BINAIRE_EGAL)).to.equal(0);
        expect(AutoVarServerController.do_calculation([-14.123, 23], VarConfVO.AUTO_OPERATEUR_BINAIRE_EGAL)).to.equal(0);
    });

    it('test AUTO_OPERATEUR_BINAIRE_INF', async () => {

        expect(AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_BINAIRE_INF)).to.throw();
        expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_BINAIRE_INF)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_INF)).to.throw();
        expect(AutoVarServerController.do_calculation([null, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_INF)).to.equal(0);
        expect(AutoVarServerController.do_calculation([undefined, undefined], VarConfVO.AUTO_OPERATEUR_BINAIRE_INF)).to.equal(0);
        expect(AutoVarServerController.do_calculation([NaN, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_INF)).to.equal(0);
        expect(AutoVarServerController.do_calculation([null, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_INF)).to.equal(0);
        expect(AutoVarServerController.do_calculation([NaN, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_INF)).to.equal(0);
        expect(AutoVarServerController.do_calculation([0, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_INF)).to.equal(0);
        expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_INF)).to.equal(1);
        expect(AutoVarServerController.do_calculation([1, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_INF)).to.equal(0);
        expect(AutoVarServerController.do_calculation([1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_INF)).to.equal(0);
        expect(AutoVarServerController.do_calculation([1, -1], VarConfVO.AUTO_OPERATEUR_BINAIRE_INF)).to.equal(0);
        expect(AutoVarServerController.do_calculation([-1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_INF)).to.equal(1);
        expect(AutoVarServerController.do_calculation([1.055, 20], VarConfVO.AUTO_OPERATEUR_BINAIRE_INF)).to.equal(1);
        expect(AutoVarServerController.do_calculation([-14.123, 23], VarConfVO.AUTO_OPERATEUR_BINAIRE_INF)).to.equal(1);
    });

    it('test AUTO_OPERATEUR_BINAIRE_SUP', async () => {

        expect(AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUP)).to.throw();
        expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUP)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUP)).to.throw();
        expect(AutoVarServerController.do_calculation([null, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUP)).to.equal(0);
        expect(AutoVarServerController.do_calculation([undefined, undefined], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUP)).to.equal(0);
        expect(AutoVarServerController.do_calculation([NaN, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUP)).to.equal(0);
        expect(AutoVarServerController.do_calculation([null, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUP)).to.equal(0);
        expect(AutoVarServerController.do_calculation([NaN, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUP)).to.equal(0);
        expect(AutoVarServerController.do_calculation([0, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUP)).to.equal(0);
        expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUP)).to.equal(0);
        expect(AutoVarServerController.do_calculation([1, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUP)).to.equal(1);
        expect(AutoVarServerController.do_calculation([1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUP)).to.equal(0);
        expect(AutoVarServerController.do_calculation([1, -1], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUP)).to.equal(1);
        expect(AutoVarServerController.do_calculation([-1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUP)).to.equal(0);
        expect(AutoVarServerController.do_calculation([1.055, 20], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUP)).to.equal(0);
        expect(AutoVarServerController.do_calculation([-14.123, 23], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUP)).to.equal(0);
    });

    it('test AUTO_OPERATEUR_BINAIRE_INFEGAL', async () => {

        expect(AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_BINAIRE_INFEGAL)).to.throw();
        expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_BINAIRE_INFEGAL)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_INFEGAL)).to.throw();
        expect(AutoVarServerController.do_calculation([null, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_INFEGAL)).to.equal(1);
        expect(AutoVarServerController.do_calculation([undefined, undefined], VarConfVO.AUTO_OPERATEUR_BINAIRE_INFEGAL)).to.equal(1);
        expect(AutoVarServerController.do_calculation([NaN, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_INFEGAL)).to.equal(1);
        expect(AutoVarServerController.do_calculation([null, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_INFEGAL)).to.equal(1);
        expect(AutoVarServerController.do_calculation([NaN, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_INFEGAL)).to.equal(1);
        expect(AutoVarServerController.do_calculation([0, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_INFEGAL)).to.equal(1);
        expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_INFEGAL)).to.equal(1);
        expect(AutoVarServerController.do_calculation([1, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_INFEGAL)).to.equal(0);
        expect(AutoVarServerController.do_calculation([1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_INFEGAL)).to.equal(1);
        expect(AutoVarServerController.do_calculation([1, -1], VarConfVO.AUTO_OPERATEUR_BINAIRE_INFEGAL)).to.equal(0);
        expect(AutoVarServerController.do_calculation([-1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_INFEGAL)).to.equal(1);
        expect(AutoVarServerController.do_calculation([1.055, 20], VarConfVO.AUTO_OPERATEUR_BINAIRE_INFEGAL)).to.equal(1);
        expect(AutoVarServerController.do_calculation([-14.123, 23], VarConfVO.AUTO_OPERATEUR_BINAIRE_INFEGAL)).to.equal(1);
    });

    it('test AUTO_OPERATEUR_BINAIRE_SUPEGAL', async () => {

        expect(AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUPEGAL)).to.throw();
        expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUPEGAL)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUPEGAL)).to.throw();
        expect(AutoVarServerController.do_calculation([null, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUPEGAL)).to.equal(1);
        expect(AutoVarServerController.do_calculation([undefined, undefined], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUPEGAL)).to.equal(1);
        expect(AutoVarServerController.do_calculation([NaN, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUPEGAL)).to.equal(1);
        expect(AutoVarServerController.do_calculation([null, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUPEGAL)).to.equal(1);
        expect(AutoVarServerController.do_calculation([NaN, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUPEGAL)).to.equal(1);
        expect(AutoVarServerController.do_calculation([0, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUPEGAL)).to.equal(1);
        expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUPEGAL)).to.equal(0);
        expect(AutoVarServerController.do_calculation([1, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUPEGAL)).to.equal(0);
        expect(AutoVarServerController.do_calculation([1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUPEGAL)).to.equal(1);
        expect(AutoVarServerController.do_calculation([1, -1], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUPEGAL)).to.equal(1);
        expect(AutoVarServerController.do_calculation([-1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUPEGAL)).to.equal(0);
        expect(AutoVarServerController.do_calculation([1.055, 20], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUPEGAL)).to.equal(0);
        expect(AutoVarServerController.do_calculation([-14.123, 23], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUPEGAL)).to.equal(0);
    });

    it('test AUTO_OPERATEUR_BINAIRE_DIFFERENT', async () => {

        expect(AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIFFERENT)).to.throw();
        expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIFFERENT)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIFFERENT)).to.throw();
        expect(AutoVarServerController.do_calculation([null, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIFFERENT)).to.equal(0);
        expect(AutoVarServerController.do_calculation([undefined, undefined], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIFFERENT)).to.equal(0);
        expect(AutoVarServerController.do_calculation([NaN, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIFFERENT)).to.equal(0);
        expect(AutoVarServerController.do_calculation([null, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIFFERENT)).to.equal(0);
        expect(AutoVarServerController.do_calculation([NaN, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIFFERENT)).to.equal(0);
        expect(AutoVarServerController.do_calculation([0, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIFFERENT)).to.equal(0);
        expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIFFERENT)).to.equal(1);
        expect(AutoVarServerController.do_calculation([1, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIFFERENT)).to.equal(1);
        expect(AutoVarServerController.do_calculation([1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIFFERENT)).to.equal(0);
        expect(AutoVarServerController.do_calculation([1, -1], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIFFERENT)).to.equal(1);
        expect(AutoVarServerController.do_calculation([-1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIFFERENT)).to.equal(1);
        expect(AutoVarServerController.do_calculation([1.055, 20], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIFFERENT)).to.equal(1);
        expect(AutoVarServerController.do_calculation([-14.123, 23], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIFFERENT)).to.equal(1);
    });

    it('test AUTO_OPERATEUR_BINAIRE_ET', async () => {

        expect(AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_BINAIRE_ET)).to.throw();
        expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_BINAIRE_ET)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_ET)).to.throw();
        expect(AutoVarServerController.do_calculation([null, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_ET)).to.equal(0);
        expect(AutoVarServerController.do_calculation([undefined, undefined], VarConfVO.AUTO_OPERATEUR_BINAIRE_ET)).to.equal(0);
        expect(AutoVarServerController.do_calculation([NaN, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_ET)).to.equal(0);
        expect(AutoVarServerController.do_calculation([null, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_ET)).to.equal(0);
        expect(AutoVarServerController.do_calculation([NaN, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_ET)).to.equal(0);
        expect(AutoVarServerController.do_calculation([0, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_ET)).to.equal(0);
        expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_ET)).to.equal(0);
        expect(AutoVarServerController.do_calculation([1, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_ET)).to.equal(0);
        expect(AutoVarServerController.do_calculation([1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_ET)).to.equal(1);
        expect(AutoVarServerController.do_calculation([1, -1], VarConfVO.AUTO_OPERATEUR_BINAIRE_ET)).to.equal(1);
        expect(AutoVarServerController.do_calculation([-1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_ET)).to.equal(1);
        expect(AutoVarServerController.do_calculation([1.055, 20], VarConfVO.AUTO_OPERATEUR_BINAIRE_ET)).to.equal(1);
        expect(AutoVarServerController.do_calculation([-14.123, 23], VarConfVO.AUTO_OPERATEUR_BINAIRE_ET)).to.equal(1);
    });

    it('test AUTO_OPERATEUR_BINAIRE_OU', async () => {

        expect(AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_BINAIRE_OU)).to.throw();
        expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_BINAIRE_OU)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_OU)).to.throw();
        expect(AutoVarServerController.do_calculation([null, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_OU)).to.equal(0);
        expect(AutoVarServerController.do_calculation([undefined, undefined], VarConfVO.AUTO_OPERATEUR_BINAIRE_OU)).to.equal(0);
        expect(AutoVarServerController.do_calculation([NaN, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_OU)).to.equal(0);
        expect(AutoVarServerController.do_calculation([null, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_OU)).to.equal(0);
        expect(AutoVarServerController.do_calculation([NaN, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_OU)).to.equal(0);
        expect(AutoVarServerController.do_calculation([0, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_OU)).to.equal(0);
        expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_OU)).to.equal(1);
        expect(AutoVarServerController.do_calculation([1, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_OU)).to.equal(1);
        expect(AutoVarServerController.do_calculation([1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_OU)).to.equal(1);
        expect(AutoVarServerController.do_calculation([1, -1], VarConfVO.AUTO_OPERATEUR_BINAIRE_OU)).to.equal(1);
        expect(AutoVarServerController.do_calculation([-1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_OU)).to.equal(1);
        expect(AutoVarServerController.do_calculation([1.055, 20], VarConfVO.AUTO_OPERATEUR_BINAIRE_OU)).to.equal(1);
        expect(AutoVarServerController.do_calculation([-14.123, 23], VarConfVO.AUTO_OPERATEUR_BINAIRE_OU)).to.equal(1);
    });

    it('test AUTO_OPERATEUR_BINAIRE_XOR', async () => {

        expect(AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_BINAIRE_XOR)).to.throw();
        expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_BINAIRE_XOR)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_XOR)).to.throw();
        expect(AutoVarServerController.do_calculation([null, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_XOR)).to.equal(0);
        expect(AutoVarServerController.do_calculation([undefined, undefined], VarConfVO.AUTO_OPERATEUR_BINAIRE_XOR)).to.equal(0);
        expect(AutoVarServerController.do_calculation([NaN, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_XOR)).to.equal(0);
        expect(AutoVarServerController.do_calculation([null, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_XOR)).to.equal(0);
        expect(AutoVarServerController.do_calculation([NaN, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_XOR)).to.equal(0);
        expect(AutoVarServerController.do_calculation([0, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_XOR)).to.equal(0);
        expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_XOR)).to.equal(1);
        expect(AutoVarServerController.do_calculation([1, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_XOR)).to.equal(1);
        expect(AutoVarServerController.do_calculation([1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_XOR)).to.equal(0);
        expect(AutoVarServerController.do_calculation([1, -1], VarConfVO.AUTO_OPERATEUR_BINAIRE_XOR)).to.equal(0);
        expect(AutoVarServerController.do_calculation([-1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_XOR)).to.equal(0);
        expect(AutoVarServerController.do_calculation([1.055, 20], VarConfVO.AUTO_OPERATEUR_BINAIRE_XOR)).to.equal(0);
        expect(AutoVarServerController.do_calculation([-14.123, 23], VarConfVO.AUTO_OPERATEUR_BINAIRE_XOR)).to.equal(0);
    });

    it('test AUTO_OPERATEUR_BINAIRE_ROUND', async () => {

        expect(AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_BINAIRE_ROUND)).to.throw();
        expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_BINAIRE_ROUND)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_ROUND)).to.throw();
        expect(AutoVarServerController.do_calculation([null, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_ROUND)).to.equal(null);
        expect(AutoVarServerController.do_calculation([undefined, undefined], VarConfVO.AUTO_OPERATEUR_BINAIRE_ROUND)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_ROUND)).to.equal(null);
        expect(AutoVarServerController.do_calculation([null, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_ROUND)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_ROUND)).to.equal(null);
        expect(AutoVarServerController.do_calculation([0, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_ROUND)).to.equal(0);
        expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_ROUND)).to.equal(0);
        expect(AutoVarServerController.do_calculation([1, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_ROUND)).to.equal(1);
        expect(AutoVarServerController.do_calculation([1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_ROUND)).to.equal(1);
        expect(AutoVarServerController.do_calculation([1, -1], VarConfVO.AUTO_OPERATEUR_BINAIRE_ROUND)).to.equal(0);
        expect(AutoVarServerController.do_calculation([-1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_ROUND)).to.equal(-1);
        expect(AutoVarServerController.do_calculation([1.055, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_ROUND)).to.equal(1.06);
        expect(AutoVarServerController.do_calculation([-14.123, 4], VarConfVO.AUTO_OPERATEUR_BINAIRE_ROUND)).to.equal(-14.123);
    });

    it('test AUTO_OPERATEUR_BINAIRE_CEIL', async () => {

        expect(AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_BINAIRE_CEIL)).to.throw();
        expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_BINAIRE_CEIL)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_CEIL)).to.throw();
        expect(AutoVarServerController.do_calculation([null, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_CEIL)).to.equal(null);
        expect(AutoVarServerController.do_calculation([undefined, undefined], VarConfVO.AUTO_OPERATEUR_BINAIRE_CEIL)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_CEIL)).to.equal(null);
        expect(AutoVarServerController.do_calculation([null, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_CEIL)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_CEIL)).to.equal(null);
        expect(AutoVarServerController.do_calculation([0, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_CEIL)).to.equal(0);
        expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_CEIL)).to.equal(0);
        expect(AutoVarServerController.do_calculation([1, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_CEIL)).to.equal(1);
        expect(AutoVarServerController.do_calculation([1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_CEIL)).to.equal(1);
        expect(AutoVarServerController.do_calculation([1, -1], VarConfVO.AUTO_OPERATEUR_BINAIRE_CEIL)).to.equal(10);
        expect(AutoVarServerController.do_calculation([-1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_CEIL)).to.equal(0);
        expect(AutoVarServerController.do_calculation([1.055, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_CEIL)).to.equal(1.06);
        expect(AutoVarServerController.do_calculation([-14.123, 4], VarConfVO.AUTO_OPERATEUR_BINAIRE_CEIL)).to.equal(-14.123);
    });

    it('test AUTO_OPERATEUR_BINAIRE_FLOOR', async () => {

        expect(AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_BINAIRE_FLOOR)).to.throw();
        expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_BINAIRE_FLOOR)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_FLOOR)).to.throw();
        expect(AutoVarServerController.do_calculation([null, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_FLOOR)).to.equal(null);
        expect(AutoVarServerController.do_calculation([undefined, undefined], VarConfVO.AUTO_OPERATEUR_BINAIRE_FLOOR)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_FLOOR)).to.equal(null);
        expect(AutoVarServerController.do_calculation([null, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_FLOOR)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_FLOOR)).to.equal(null);
        expect(AutoVarServerController.do_calculation([0, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_FLOOR)).to.equal(0);
        expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_FLOOR)).to.equal(0);
        expect(AutoVarServerController.do_calculation([1, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_FLOOR)).to.equal(1);
        expect(AutoVarServerController.do_calculation([1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_FLOOR)).to.equal(1);
        expect(AutoVarServerController.do_calculation([1, -1], VarConfVO.AUTO_OPERATEUR_BINAIRE_FLOOR)).to.equal(0);
        expect(AutoVarServerController.do_calculation([-1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_FLOOR)).to.equal(-1);
        expect(AutoVarServerController.do_calculation([1.055, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_FLOOR)).to.equal(1.05);
        expect(AutoVarServerController.do_calculation([-14.123, 4], VarConfVO.AUTO_OPERATEUR_BINAIRE_FLOOR)).to.equal(-14.123);
    });

    it('test AUTO_OPERATEUR_BINAIRE_EXP', async () => {

        expect(AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_BINAIRE_EXP)).to.throw();
        expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_BINAIRE_EXP)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_EXP)).to.throw();
        expect(AutoVarServerController.do_calculation([null, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_EXP)).to.equal(null);
        expect(AutoVarServerController.do_calculation([undefined, undefined], VarConfVO.AUTO_OPERATEUR_BINAIRE_EXP)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_EXP)).to.equal(null);
        expect(AutoVarServerController.do_calculation([null, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_EXP)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_EXP)).to.equal(null);
        expect(AutoVarServerController.do_calculation([0, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_EXP)).to.equal(1);
        expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_EXP)).to.equal(0);
        expect(AutoVarServerController.do_calculation([1, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_EXP)).to.equal(1);
        expect(AutoVarServerController.do_calculation([1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_EXP)).to.equal(1);
        expect(AutoVarServerController.do_calculation([1, -1], VarConfVO.AUTO_OPERATEUR_BINAIRE_EXP)).to.equal(1);
        expect(AutoVarServerController.do_calculation([-1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_EXP)).to.equal(-1);
        expect(AutoVarServerController.do_calculation([1.055, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_EXP)).to.equal(1.113025);
        expect(AutoVarServerController.do_calculation([-14.123, 4], VarConfVO.AUTO_OPERATEUR_BINAIRE_EXP)).to.equal(-39783.944141438641);
    });

    it('test AUTO_OPERATEUR_BINAIRE_LOG', async () => {

        expect(AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_BINAIRE_LOG)).to.throw();
        expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_BINAIRE_LOG)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_LOG)).to.throw();
        expect(AutoVarServerController.do_calculation([null, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_LOG)).to.equal(null);
        expect(AutoVarServerController.do_calculation([undefined, undefined], VarConfVO.AUTO_OPERATEUR_BINAIRE_LOG)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_LOG)).to.equal(null);
        expect(AutoVarServerController.do_calculation([null, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_LOG)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_LOG)).to.equal(null);
        // Not Implemented
        expect(AutoVarServerController.do_calculation([0, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_LOG)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_LOG)).to.throw();
        expect(AutoVarServerController.do_calculation([1, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_LOG)).to.throw();
        expect(AutoVarServerController.do_calculation([1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_LOG)).to.throw();
        expect(AutoVarServerController.do_calculation([1, -1], VarConfVO.AUTO_OPERATEUR_BINAIRE_LOG)).to.throw();
        expect(AutoVarServerController.do_calculation([-1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_LOG)).to.throw();
        expect(AutoVarServerController.do_calculation([1.055, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_LOG)).to.throw();
        expect(AutoVarServerController.do_calculation([-14.123, 4], VarConfVO.AUTO_OPERATEUR_BINAIRE_LOG)).to.throw();
    });

    it('test AUTO_OPERATEUR_BINAIRE_STARTOF', async () => {

        expect(AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_BINAIRE_STARTOF)).to.throw();
        expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_BINAIRE_STARTOF)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_STARTOF)).to.throw();
        expect(AutoVarServerController.do_calculation([null, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_STARTOF)).to.equal(null);
        expect(AutoVarServerController.do_calculation([undefined, undefined], VarConfVO.AUTO_OPERATEUR_BINAIRE_STARTOF)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_STARTOF)).to.equal(null);
        expect(AutoVarServerController.do_calculation([null, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_STARTOF)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_STARTOF)).to.equal(null);
        // TODO TEST Not Implemented
    });

    it('test AUTO_OPERATEUR_TERNAIRE_SI', async () => {

        expect(AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_TERNAIRE_SI)).to.throw();
        expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_TERNAIRE_SI)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_TERNAIRE_SI)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1, 2, 3], VarConfVO.AUTO_OPERATEUR_TERNAIRE_SI)).to.throw();
        expect(AutoVarServerController.do_calculation([null, null, null], VarConfVO.AUTO_OPERATEUR_TERNAIRE_SI)).to.equal(null);
        expect(AutoVarServerController.do_calculation([undefined, undefined, undefined], VarConfVO.AUTO_OPERATEUR_TERNAIRE_SI)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN, NaN, NaN], VarConfVO.AUTO_OPERATEUR_TERNAIRE_SI)).to.equal(null);
        expect(AutoVarServerController.do_calculation([null, NaN, null], VarConfVO.AUTO_OPERATEUR_TERNAIRE_SI)).to.equal(null);
        expect(AutoVarServerController.do_calculation([null, null, NaN], VarConfVO.AUTO_OPERATEUR_TERNAIRE_SI)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN, null, null], VarConfVO.AUTO_OPERATEUR_TERNAIRE_SI)).to.equal(null);
        expect(AutoVarServerController.do_calculation([undefined, null, null], VarConfVO.AUTO_OPERATEUR_TERNAIRE_SI)).to.equal(null);
        expect(AutoVarServerController.do_calculation([null, undefined, null], VarConfVO.AUTO_OPERATEUR_TERNAIRE_SI)).to.equal(null);
        expect(AutoVarServerController.do_calculation([null, null, undefined], VarConfVO.AUTO_OPERATEUR_TERNAIRE_SI)).to.equal(null);
        expect(AutoVarServerController.do_calculation([0, 0, 0], VarConfVO.AUTO_OPERATEUR_TERNAIRE_SI)).to.equal(0);
        expect(AutoVarServerController.do_calculation([0, 0, 1], VarConfVO.AUTO_OPERATEUR_TERNAIRE_SI)).to.equal(1);
        expect(AutoVarServerController.do_calculation([0, 1, 0], VarConfVO.AUTO_OPERATEUR_TERNAIRE_SI)).to.equal(0);
        expect(AutoVarServerController.do_calculation([1, 0, 0], VarConfVO.AUTO_OPERATEUR_TERNAIRE_SI)).to.equal(0);
        expect(AutoVarServerController.do_calculation([0, 1, 1], VarConfVO.AUTO_OPERATEUR_TERNAIRE_SI)).to.equal(1);
        expect(AutoVarServerController.do_calculation([1, 0, 1], VarConfVO.AUTO_OPERATEUR_TERNAIRE_SI)).to.equal(0);
        expect(AutoVarServerController.do_calculation([1, 1, 0], VarConfVO.AUTO_OPERATEUR_TERNAIRE_SI)).to.equal(1);
        expect(AutoVarServerController.do_calculation([1, 1, 1], VarConfVO.AUTO_OPERATEUR_TERNAIRE_SI)).to.equal(1);
    });

    it('test AUTO_OPERATEUR_TERNAIRE_AJOUT_DUREE', async () => {

        expect(AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_TERNAIRE_AJOUT_DUREE)).to.throw();
        expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_TERNAIRE_AJOUT_DUREE)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_TERNAIRE_AJOUT_DUREE)).to.throw();
        expect(AutoVarServerController.do_calculation([0, 1, 2, 3], VarConfVO.AUTO_OPERATEUR_TERNAIRE_AJOUT_DUREE)).to.throw();
        expect(AutoVarServerController.do_calculation([null, null, null], VarConfVO.AUTO_OPERATEUR_TERNAIRE_AJOUT_DUREE)).to.equal(null);
        expect(AutoVarServerController.do_calculation([undefined, undefined, undefined], VarConfVO.AUTO_OPERATEUR_TERNAIRE_AJOUT_DUREE)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN, NaN, NaN], VarConfVO.AUTO_OPERATEUR_TERNAIRE_AJOUT_DUREE)).to.equal(null);
        expect(AutoVarServerController.do_calculation([null, NaN, null], VarConfVO.AUTO_OPERATEUR_TERNAIRE_AJOUT_DUREE)).to.equal(null);
        expect(AutoVarServerController.do_calculation([null, null, NaN], VarConfVO.AUTO_OPERATEUR_TERNAIRE_AJOUT_DUREE)).to.equal(null);
        expect(AutoVarServerController.do_calculation([NaN, null, null], VarConfVO.AUTO_OPERATEUR_TERNAIRE_AJOUT_DUREE)).to.equal(null);
        expect(AutoVarServerController.do_calculation([undefined, null, null], VarConfVO.AUTO_OPERATEUR_TERNAIRE_AJOUT_DUREE)).to.equal(null);
        expect(AutoVarServerController.do_calculation([null, undefined, null], VarConfVO.AUTO_OPERATEUR_TERNAIRE_AJOUT_DUREE)).to.equal(null);
        expect(AutoVarServerController.do_calculation([null, null, undefined], VarConfVO.AUTO_OPERATEUR_TERNAIRE_AJOUT_DUREE)).to.equal(null);
        // TODO TEST Not Implemented
    });
});