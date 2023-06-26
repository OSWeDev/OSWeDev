/* tslint:disable:no-unused-expression */
import { expect, test } from '@playwright/test';
import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
import AutoVarServerController from '../../../src/server/modules/Var/auto/AutoVarServerController';
import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';
import TimeSegment from '../../../src/shared/modules/DataRender/vos/TimeSegment';
import Dates from '../../../src/shared/modules/FormatDatesNombres/Dates/Dates';
import Durations from '../../../src/shared/modules/FormatDatesNombres/Dates/Durations';
import VarConfVO from '../../../src/shared/modules/Var/vos/VarConfVO';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

test('AutoVarServerController.do_calculation:test AUTO_OPERATEUR_UNITAIRE_VOFIELDREF', async () => {

    expect(() => AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_UNITAIRE_VOFIELDREF)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_VOFIELDREF)).toThrow();
    expect(AutoVarServerController.do_calculation([null], VarConfVO.AUTO_OPERATEUR_UNITAIRE_VOFIELDREF)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([undefined], VarConfVO.AUTO_OPERATEUR_UNITAIRE_VOFIELDREF)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN], VarConfVO.AUTO_OPERATEUR_UNITAIRE_VOFIELDREF)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_VOFIELDREF)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([1.5], VarConfVO.AUTO_OPERATEUR_UNITAIRE_VOFIELDREF)).toStrictEqual(1.5);
    expect(AutoVarServerController.do_calculation([0], VarConfVO.AUTO_OPERATEUR_UNITAIRE_VOFIELDREF)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([-20.123], VarConfVO.AUTO_OPERATEUR_UNITAIRE_VOFIELDREF)).toStrictEqual(-20.123);
});

test('AutoVarServerController.do_calculation:test AUTO_OPERATEUR_UNITAIRE_MOINS', async () => {

    expect(() => AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MOINS)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MOINS)).toThrow();
    expect(AutoVarServerController.do_calculation([null], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MOINS)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([undefined], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MOINS)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MOINS)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MOINS)).toStrictEqual(-1);
    expect(AutoVarServerController.do_calculation([1.5], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MOINS)).toStrictEqual(-1.5);
    expect(AutoVarServerController.do_calculation([0], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MOINS)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([-20.123], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MOINS)).toStrictEqual(20.123);
});

test('AutoVarServerController.do_calculation:test AUTO_OPERATEUR_UNITAIRE_NOT', async () => {

    expect(() => AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_UNITAIRE_NOT)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_NOT)).toThrow();
    expect(AutoVarServerController.do_calculation([null], VarConfVO.AUTO_OPERATEUR_UNITAIRE_NOT)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([undefined], VarConfVO.AUTO_OPERATEUR_UNITAIRE_NOT)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN], VarConfVO.AUTO_OPERATEUR_UNITAIRE_NOT)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_NOT)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([1.5], VarConfVO.AUTO_OPERATEUR_UNITAIRE_NOT)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([0], VarConfVO.AUTO_OPERATEUR_UNITAIRE_NOT)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([-20.123], VarConfVO.AUTO_OPERATEUR_UNITAIRE_NOT)).toStrictEqual(0);
});

test('AutoVarServerController.do_calculation:test AUTO_OPERATEUR_UNITAIRE_ABS', async () => {

    expect(() => AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ABS)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ABS)).toThrow();
    expect(AutoVarServerController.do_calculation([null], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ABS)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([undefined], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ABS)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ABS)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ABS)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([1.5], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ABS)).toStrictEqual(1.5);
    expect(AutoVarServerController.do_calculation([0], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ABS)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([-20.123], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ABS)).toStrictEqual(20.123);
});

test('AutoVarServerController.do_calculation:test AUTO_OPERATEUR_UNITAIRE_ISNULL', async () => {

    expect(() => AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNULL)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNULL)).toThrow();
    expect(AutoVarServerController.do_calculation([null], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNULL)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([undefined], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNULL)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([NaN], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNULL)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNULL)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([1.5], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNULL)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([0], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNULL)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([-20.123], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNULL)).toStrictEqual(0);
});

test('AutoVarServerController.do_calculation:test AUTO_OPERATEUR_UNITAIRE_ISNOTNULL', async () => {

    expect(() => AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNOTNULL)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNOTNULL)).toThrow();
    expect(AutoVarServerController.do_calculation([null], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNOTNULL)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([undefined], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNOTNULL)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([NaN], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNOTNULL)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNOTNULL)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([1.5], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNOTNULL)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([0], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNOTNULL)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([-20.123], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNOTNULL)).toStrictEqual(1);
});

test('AutoVarServerController.do_calculation:test AUTO_OPERATEUR_UNITAIRE_FACTORIELLE', async () => {

    expect(() => AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_UNITAIRE_FACTORIELLE)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_FACTORIELLE)).toThrow();
    expect(AutoVarServerController.do_calculation([null], VarConfVO.AUTO_OPERATEUR_UNITAIRE_FACTORIELLE)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([undefined], VarConfVO.AUTO_OPERATEUR_UNITAIRE_FACTORIELLE)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN], VarConfVO.AUTO_OPERATEUR_UNITAIRE_FACTORIELLE)).toStrictEqual(null);

    expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_FACTORIELLE)).toStrictEqual(1!);
    expect(AutoVarServerController.do_calculation([1.5], VarConfVO.AUTO_OPERATEUR_UNITAIRE_FACTORIELLE)).toStrictEqual(1.5!);
    expect(AutoVarServerController.do_calculation([0], VarConfVO.AUTO_OPERATEUR_UNITAIRE_FACTORIELLE)).toStrictEqual(0!);
    expect(AutoVarServerController.do_calculation([-20.123], VarConfVO.AUTO_OPERATEUR_UNITAIRE_FACTORIELLE)).toStrictEqual(-20.123!);
});

test('AutoVarServerController.do_calculation:test AUTO_OPERATEUR_UNITAIRE_LN', async () => {

    expect(() => AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_UNITAIRE_LN)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_LN)).toThrow();
    expect(AutoVarServerController.do_calculation([null], VarConfVO.AUTO_OPERATEUR_UNITAIRE_LN)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([undefined], VarConfVO.AUTO_OPERATEUR_UNITAIRE_LN)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN], VarConfVO.AUTO_OPERATEUR_UNITAIRE_LN)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_LN)).toStrictEqual(Math.log(1));
    expect(AutoVarServerController.do_calculation([1.5], VarConfVO.AUTO_OPERATEUR_UNITAIRE_LN)).toStrictEqual(Math.log(1.5));
    expect(AutoVarServerController.do_calculation([0], VarConfVO.AUTO_OPERATEUR_UNITAIRE_LN)).toStrictEqual(Math.log(0));
    expect(AutoVarServerController.do_calculation([-20.123], VarConfVO.AUTO_OPERATEUR_UNITAIRE_LN)).toBeNaN();
});

test('AutoVarServerController.do_calculation:test AUTO_OPERATEUR_UNITAIRE_RACINE', async () => {

    expect(() => AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_UNITAIRE_RACINE)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_RACINE)).toThrow();
    expect(AutoVarServerController.do_calculation([null], VarConfVO.AUTO_OPERATEUR_UNITAIRE_RACINE)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([undefined], VarConfVO.AUTO_OPERATEUR_UNITAIRE_RACINE)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN], VarConfVO.AUTO_OPERATEUR_UNITAIRE_RACINE)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_RACINE)).toStrictEqual(Math.sqrt(1));
    expect(AutoVarServerController.do_calculation([1.5], VarConfVO.AUTO_OPERATEUR_UNITAIRE_RACINE)).toStrictEqual(Math.sqrt(1.5));
    expect(AutoVarServerController.do_calculation([0], VarConfVO.AUTO_OPERATEUR_UNITAIRE_RACINE)).toStrictEqual(Math.sqrt(0));
    expect(AutoVarServerController.do_calculation([-20.123], VarConfVO.AUTO_OPERATEUR_UNITAIRE_RACINE)).toBeNaN();
});

test('AutoVarServerController.do_calculation:test AUTO_OPERATEUR_UNITAIRE_ANNEE', async () => {

    expect(() => AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ANNEE)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ANNEE)).toThrow();
    expect(AutoVarServerController.do_calculation([null], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ANNEE)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([undefined], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ANNEE)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ANNEE)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ANNEE)).toStrictEqual(Dates.year(1));
    expect(AutoVarServerController.do_calculation([1.5], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ANNEE)).toStrictEqual(Dates.year(1.5));
    expect(AutoVarServerController.do_calculation([0], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ANNEE)).toStrictEqual(Dates.year(0));
    expect(AutoVarServerController.do_calculation([-20.123], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ANNEE)).toStrictEqual(Dates.year(-20.123));
    expect(AutoVarServerController.do_calculation([Dates.now()], VarConfVO.AUTO_OPERATEUR_UNITAIRE_ANNEE)).toStrictEqual(Dates.year(Dates.now()));
});

test('AutoVarServerController.do_calculation:test AUTO_OPERATEUR_UNITAIRE_MOIS', async () => {

    expect(() => AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MOIS)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MOIS)).toThrow();
    expect(AutoVarServerController.do_calculation([null], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MOIS)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([undefined], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MOIS)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MOIS)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MOIS)).toStrictEqual(Dates.month(1));
    expect(AutoVarServerController.do_calculation([1.5], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MOIS)).toStrictEqual(Dates.month(1.5));
    expect(AutoVarServerController.do_calculation([0], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MOIS)).toStrictEqual(Dates.month(0));
    expect(AutoVarServerController.do_calculation([-20.123], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MOIS)).toStrictEqual(Dates.month(-20.123));
    expect(AutoVarServerController.do_calculation([Dates.now()], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MOIS)).toStrictEqual(Dates.month(Dates.now()));
});

test('AutoVarServerController.do_calculation:test AUTO_OPERATEUR_UNITAIRE_JOUR_DU_MOIS', async () => {

    expect(() => AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_UNITAIRE_JOUR_DU_MOIS)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_JOUR_DU_MOIS)).toThrow();
    expect(AutoVarServerController.do_calculation([null], VarConfVO.AUTO_OPERATEUR_UNITAIRE_JOUR_DU_MOIS)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([undefined], VarConfVO.AUTO_OPERATEUR_UNITAIRE_JOUR_DU_MOIS)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN], VarConfVO.AUTO_OPERATEUR_UNITAIRE_JOUR_DU_MOIS)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_JOUR_DU_MOIS)).toStrictEqual(Dates.date(1));
    expect(AutoVarServerController.do_calculation([1.5], VarConfVO.AUTO_OPERATEUR_UNITAIRE_JOUR_DU_MOIS)).toStrictEqual(Dates.date(1.5));
    expect(AutoVarServerController.do_calculation([0], VarConfVO.AUTO_OPERATEUR_UNITAIRE_JOUR_DU_MOIS)).toStrictEqual(Dates.date(0));
    expect(AutoVarServerController.do_calculation([-20.123], VarConfVO.AUTO_OPERATEUR_UNITAIRE_JOUR_DU_MOIS)).toStrictEqual(Dates.date(-20.123));
    expect(AutoVarServerController.do_calculation([Dates.now()], VarConfVO.AUTO_OPERATEUR_UNITAIRE_JOUR_DU_MOIS)).toStrictEqual(Dates.date(Dates.now()));
});

test('AutoVarServerController.do_calculation:test AUTO_OPERATEUR_UNITAIRE_JOUR_DE_LA_SEMAINE', async () => {

    expect(() => AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_UNITAIRE_JOUR_DE_LA_SEMAINE)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_JOUR_DE_LA_SEMAINE)).toThrow();
    expect(AutoVarServerController.do_calculation([null], VarConfVO.AUTO_OPERATEUR_UNITAIRE_JOUR_DE_LA_SEMAINE)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([undefined], VarConfVO.AUTO_OPERATEUR_UNITAIRE_JOUR_DE_LA_SEMAINE)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN], VarConfVO.AUTO_OPERATEUR_UNITAIRE_JOUR_DE_LA_SEMAINE)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_JOUR_DE_LA_SEMAINE)).toStrictEqual(Dates.isoWeekday(1));
    expect(AutoVarServerController.do_calculation([1.5], VarConfVO.AUTO_OPERATEUR_UNITAIRE_JOUR_DE_LA_SEMAINE)).toStrictEqual(Dates.isoWeekday(1.5));
    expect(AutoVarServerController.do_calculation([0], VarConfVO.AUTO_OPERATEUR_UNITAIRE_JOUR_DE_LA_SEMAINE)).toStrictEqual(Dates.isoWeekday(0));
    expect(AutoVarServerController.do_calculation([-20.123], VarConfVO.AUTO_OPERATEUR_UNITAIRE_JOUR_DE_LA_SEMAINE)).toStrictEqual(Dates.isoWeekday(-20.123));
    expect(AutoVarServerController.do_calculation([Dates.now()], VarConfVO.AUTO_OPERATEUR_UNITAIRE_JOUR_DE_LA_SEMAINE)).toStrictEqual(Dates.isoWeekday(Dates.now()));
});

test('AutoVarServerController.do_calculation:test AUTO_OPERATEUR_UNITAIRE_HEURE', async () => {

    expect(() => AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_UNITAIRE_HEURE)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_HEURE)).toThrow();
    expect(AutoVarServerController.do_calculation([null], VarConfVO.AUTO_OPERATEUR_UNITAIRE_HEURE)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([undefined], VarConfVO.AUTO_OPERATEUR_UNITAIRE_HEURE)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN], VarConfVO.AUTO_OPERATEUR_UNITAIRE_HEURE)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_HEURE)).toStrictEqual(Dates.hour(1));
    expect(AutoVarServerController.do_calculation([1.5], VarConfVO.AUTO_OPERATEUR_UNITAIRE_HEURE)).toStrictEqual(Dates.hour(1.5));
    expect(AutoVarServerController.do_calculation([0], VarConfVO.AUTO_OPERATEUR_UNITAIRE_HEURE)).toStrictEqual(Dates.hour(0));
    expect(AutoVarServerController.do_calculation([-20.123], VarConfVO.AUTO_OPERATEUR_UNITAIRE_HEURE)).toStrictEqual(Dates.hour(-20.123));
    expect(AutoVarServerController.do_calculation([Dates.now()], VarConfVO.AUTO_OPERATEUR_UNITAIRE_HEURE)).toStrictEqual(Dates.hour(Dates.now()));
});

test('AutoVarServerController.do_calculation:test AUTO_OPERATEUR_UNITAIRE_MINUTE', async () => {

    expect(() => AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MINUTE)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MINUTE)).toThrow();
    expect(AutoVarServerController.do_calculation([null], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MINUTE)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([undefined], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MINUTE)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MINUTE)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MINUTE)).toStrictEqual(Dates.minute(1));
    expect(AutoVarServerController.do_calculation([1.5], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MINUTE)).toStrictEqual(Dates.minute(1.5));
    expect(AutoVarServerController.do_calculation([0], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MINUTE)).toStrictEqual(Dates.minute(0));
    expect(AutoVarServerController.do_calculation([-20.123], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MINUTE)).toStrictEqual(Dates.minute(-20.123));
    expect(AutoVarServerController.do_calculation([Dates.now()], VarConfVO.AUTO_OPERATEUR_UNITAIRE_MINUTE)).toStrictEqual(Dates.minute(Dates.now()));
});

test('AutoVarServerController.do_calculation:test AUTO_OPERATEUR_UNITAIRE_SECONDE', async () => {

    expect(() => AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_UNITAIRE_SECONDE)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_SECONDE)).toThrow();
    expect(AutoVarServerController.do_calculation([null], VarConfVO.AUTO_OPERATEUR_UNITAIRE_SECONDE)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([undefined], VarConfVO.AUTO_OPERATEUR_UNITAIRE_SECONDE)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN], VarConfVO.AUTO_OPERATEUR_UNITAIRE_SECONDE)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_SECONDE)).toStrictEqual(Dates.second(1));
    expect(AutoVarServerController.do_calculation([1.5], VarConfVO.AUTO_OPERATEUR_UNITAIRE_SECONDE)).toStrictEqual(Dates.second(1.5));
    expect(AutoVarServerController.do_calculation([0], VarConfVO.AUTO_OPERATEUR_UNITAIRE_SECONDE)).toStrictEqual(Dates.second(0));
    expect(AutoVarServerController.do_calculation([-20.123], VarConfVO.AUTO_OPERATEUR_UNITAIRE_SECONDE)).toStrictEqual(Dates.second(-20.123));
    expect(AutoVarServerController.do_calculation([Dates.now()], VarConfVO.AUTO_OPERATEUR_UNITAIRE_SECONDE)).toStrictEqual(Dates.second(Dates.now()));
});

test('AutoVarServerController.do_calculation:test AUTO_OPERATEUR_UNITAIRE_EN_ANNEES', async () => {

    expect(() => AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_ANNEES)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_ANNEES)).toThrow();
    expect(AutoVarServerController.do_calculation([null], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_ANNEES)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([undefined], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_ANNEES)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_ANNEES)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_ANNEES)).toStrictEqual(Durations.as(1, TimeSegment.TYPE_YEAR));
    expect(AutoVarServerController.do_calculation([1.5], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_ANNEES)).toStrictEqual(Durations.as(1.5, TimeSegment.TYPE_YEAR));
    expect(AutoVarServerController.do_calculation([0], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_ANNEES)).toStrictEqual(Durations.as(0, TimeSegment.TYPE_YEAR));
    expect(AutoVarServerController.do_calculation([-20.123], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_ANNEES)).toStrictEqual(Durations.as(-20.123, TimeSegment.TYPE_YEAR));
    expect(AutoVarServerController.do_calculation([Dates.now()], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_ANNEES)).toStrictEqual(Durations.as(Dates.now(), TimeSegment.TYPE_YEAR));
});

test('AutoVarServerController.do_calculation:test AUTO_OPERATEUR_UNITAIRE_EN_MOIS', async () => {

    expect(() => AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_MOIS)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_MOIS)).toThrow();
    expect(AutoVarServerController.do_calculation([null], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_MOIS)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([undefined], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_MOIS)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_MOIS)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_MOIS)).toStrictEqual(Durations.as(1, TimeSegment.TYPE_MONTH));
    expect(AutoVarServerController.do_calculation([1.5], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_MOIS)).toStrictEqual(Durations.as(1.5, TimeSegment.TYPE_MONTH));
    expect(AutoVarServerController.do_calculation([0], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_MOIS)).toStrictEqual(Durations.as(0, TimeSegment.TYPE_MONTH));
    expect(AutoVarServerController.do_calculation([-20.123], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_MOIS)).toStrictEqual(Durations.as(-20.123, TimeSegment.TYPE_MONTH));
    expect(AutoVarServerController.do_calculation([Dates.now()], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_MOIS)).toStrictEqual(Durations.as(Dates.now(), TimeSegment.TYPE_MONTH));
});

test('AutoVarServerController.do_calculation:test AUTO_OPERATEUR_UNITAIRE_EN_SEMAINES', async () => {

    expect(() => AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_SEMAINES)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_SEMAINES)).toThrow();
    expect(AutoVarServerController.do_calculation([null], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_SEMAINES)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([undefined], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_SEMAINES)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_SEMAINES)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_SEMAINES)).toStrictEqual(Durations.as(1, TimeSegment.TYPE_WEEK));
    expect(AutoVarServerController.do_calculation([1.5], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_SEMAINES)).toStrictEqual(Durations.as(1.5, TimeSegment.TYPE_WEEK));
    expect(AutoVarServerController.do_calculation([0], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_SEMAINES)).toStrictEqual(Durations.as(0, TimeSegment.TYPE_WEEK));
    expect(AutoVarServerController.do_calculation([-20.123], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_SEMAINES)).toStrictEqual(Durations.as(-20.123, TimeSegment.TYPE_WEEK));
    expect(AutoVarServerController.do_calculation([Dates.now()], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_SEMAINES)).toStrictEqual(Durations.as(Dates.now(), TimeSegment.TYPE_WEEK));
});

test('AutoVarServerController.do_calculation:test AUTO_OPERATEUR_UNITAIRE_EN_JOURS', async () => {

    expect(() => AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_JOURS)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_JOURS)).toThrow();
    expect(AutoVarServerController.do_calculation([null], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_JOURS)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([undefined], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_JOURS)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_JOURS)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_JOURS)).toStrictEqual(Durations.as(1, TimeSegment.TYPE_DAY));
    expect(AutoVarServerController.do_calculation([1.5], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_JOURS)).toStrictEqual(Durations.as(1.5, TimeSegment.TYPE_DAY));
    expect(AutoVarServerController.do_calculation([0], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_JOURS)).toStrictEqual(Durations.as(0, TimeSegment.TYPE_DAY));
    expect(AutoVarServerController.do_calculation([-20.123], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_JOURS)).toStrictEqual(Durations.as(-20.123, TimeSegment.TYPE_DAY));
    expect(AutoVarServerController.do_calculation([Dates.now()], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_JOURS)).toStrictEqual(Durations.as(Dates.now(), TimeSegment.TYPE_DAY));
});

test('AutoVarServerController.do_calculation:test AUTO_OPERATEUR_UNITAIRE_EN_HEURES', async () => {

    expect(() => AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_HEURES)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_HEURES)).toThrow();
    expect(AutoVarServerController.do_calculation([null], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_HEURES)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([undefined], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_HEURES)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_HEURES)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_HEURES)).toStrictEqual(Durations.as(1, TimeSegment.TYPE_HOUR));
    expect(AutoVarServerController.do_calculation([1.5], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_HEURES)).toStrictEqual(Durations.as(1.5, TimeSegment.TYPE_HOUR));
    expect(AutoVarServerController.do_calculation([0], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_HEURES)).toStrictEqual(Durations.as(0, TimeSegment.TYPE_HOUR));
    expect(AutoVarServerController.do_calculation([-20.123], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_HEURES)).toStrictEqual(Durations.as(-20.123, TimeSegment.TYPE_HOUR));
    expect(AutoVarServerController.do_calculation([Dates.now()], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_HEURES)).toStrictEqual(Durations.as(Dates.now(), TimeSegment.TYPE_HOUR));
});

test('AutoVarServerController.do_calculation:test AUTO_OPERATEUR_UNITAIRE_EN_MINUTES', async () => {

    expect(() => AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_MINUTES)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_MINUTES)).toThrow();
    expect(AutoVarServerController.do_calculation([null], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_MINUTES)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([undefined], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_MINUTES)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_MINUTES)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_MINUTES)).toStrictEqual(Durations.as(1, TimeSegment.TYPE_MINUTE));
    expect(AutoVarServerController.do_calculation([1.5], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_MINUTES)).toStrictEqual(Durations.as(1.5, TimeSegment.TYPE_MINUTE));
    expect(AutoVarServerController.do_calculation([0], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_MINUTES)).toStrictEqual(Durations.as(0, TimeSegment.TYPE_MINUTE));
    expect(AutoVarServerController.do_calculation([-20.123], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_MINUTES)).toStrictEqual(Durations.as(-20.123, TimeSegment.TYPE_MINUTE));
    expect(AutoVarServerController.do_calculation([Dates.now()], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_MINUTES)).toStrictEqual(Durations.as(Dates.now(), TimeSegment.TYPE_MINUTE));
});

test('AutoVarServerController.do_calculation:test AUTO_OPERATEUR_UNITAIRE_EN_SECONDES', async () => {

    expect(() => AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_SECONDES)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_SECONDES)).toThrow();
    expect(AutoVarServerController.do_calculation([null], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_SECONDES)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([undefined], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_SECONDES)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_SECONDES)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_SECONDES)).toStrictEqual(Durations.as(1, TimeSegment.TYPE_SECOND));
    expect(AutoVarServerController.do_calculation([1.5], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_SECONDES)).toStrictEqual(Durations.as(1.5, TimeSegment.TYPE_SECOND));
    expect(AutoVarServerController.do_calculation([0], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_SECONDES)).toStrictEqual(Durations.as(0, TimeSegment.TYPE_SECOND));
    expect(AutoVarServerController.do_calculation([-20.123], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_SECONDES)).toStrictEqual(Durations.as(-20.123, TimeSegment.TYPE_SECOND));
    expect(AutoVarServerController.do_calculation([Dates.now()], VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_SECONDES)).toStrictEqual(Durations.as(Dates.now(), TimeSegment.TYPE_SECOND));
});

test('AutoVarServerController.do_calculation:test AUTO_OPERATEUR_BINAIRE_PLUS', async () => {

    expect(() => AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_BINAIRE_PLUS)).toThrow();
    expect(() => AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_BINAIRE_PLUS)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_PLUS)).toThrow();
    expect(AutoVarServerController.do_calculation([null, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_PLUS)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([undefined, undefined], VarConfVO.AUTO_OPERATEUR_BINAIRE_PLUS)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_PLUS)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([null, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_PLUS)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_PLUS)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([0, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_PLUS)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_PLUS)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([1, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_PLUS)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_PLUS)).toStrictEqual(2);
    expect(AutoVarServerController.do_calculation([1, -1], VarConfVO.AUTO_OPERATEUR_BINAIRE_PLUS)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([-1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_PLUS)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([1.055, 20], VarConfVO.AUTO_OPERATEUR_BINAIRE_PLUS)).toStrictEqual(21.055);
    expect(AutoVarServerController.do_calculation([-14.123, 23], VarConfVO.AUTO_OPERATEUR_BINAIRE_PLUS)).toStrictEqual(8.877);
});

test('AutoVarServerController.do_calculation:test AUTO_OPERATEUR_BINAIRE_MOINS', async () => {

    expect(() => AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_BINAIRE_MOINS)).toThrow();
    expect(() => AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MOINS)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_MOINS)).toThrow();
    expect(AutoVarServerController.do_calculation([null, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_MOINS)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([undefined, undefined], VarConfVO.AUTO_OPERATEUR_BINAIRE_MOINS)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_MOINS)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([null, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_MOINS)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_MOINS)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([0, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_MOINS)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MOINS)).toStrictEqual(-1);
    expect(AutoVarServerController.do_calculation([1, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_MOINS)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MOINS)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([1, -1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MOINS)).toStrictEqual(2);
    expect(AutoVarServerController.do_calculation([-1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MOINS)).toStrictEqual(-2);
    expect(AutoVarServerController.do_calculation([1.055, 20], VarConfVO.AUTO_OPERATEUR_BINAIRE_MOINS)).toStrictEqual(-18.945);
    expect(AutoVarServerController.do_calculation([-14.123, 23], VarConfVO.AUTO_OPERATEUR_BINAIRE_MOINS)).toStrictEqual(-37.123);
});

test('AutoVarServerController.do_calculation:test AUTO_OPERATEUR_BINAIRE_MULT', async () => {

    expect(() => AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_BINAIRE_MULT)).toThrow();
    expect(() => AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MULT)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_MULT)).toThrow();
    expect(AutoVarServerController.do_calculation([null, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_MULT)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([undefined, undefined], VarConfVO.AUTO_OPERATEUR_BINAIRE_MULT)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_MULT)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([null, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_MULT)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_MULT)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([0, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_MULT)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MULT)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([1, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_MULT)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MULT)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([1, -1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MULT)).toStrictEqual(-1);
    expect(AutoVarServerController.do_calculation([-1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MULT)).toStrictEqual(-1);
    expect(AutoVarServerController.do_calculation([2.5, 20], VarConfVO.AUTO_OPERATEUR_BINAIRE_MULT)).toStrictEqual(50);
    expect(AutoVarServerController.do_calculation([-14.123, 23], VarConfVO.AUTO_OPERATEUR_BINAIRE_MULT)).toStrictEqual(-324.829);
});

test('AutoVarServerController.do_calculation:test AUTO_OPERATEUR_BINAIRE_DIV', async () => {

    expect(() => AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIV)).toThrow();
    expect(() => AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIV)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIV)).toThrow();
    expect(AutoVarServerController.do_calculation([null, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIV)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([undefined, undefined], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIV)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIV)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([null, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIV)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIV)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([0, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIV)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIV)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([1, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIV)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIV)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([1, -1], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIV)).toStrictEqual(-1);
    expect(AutoVarServerController.do_calculation([-1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIV)).toStrictEqual(-1);
    expect(AutoVarServerController.do_calculation([1.055, 20], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIV)).toStrictEqual(0.05275);
    expect(AutoVarServerController.do_calculation([-14.123, 23], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIV)).toStrictEqual(-14.123 / 23);
});

test('AutoVarServerController.do_calculation:test AUTO_OPERATEUR_BINAIRE_MODULO', async () => {

    expect(() => AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_BINAIRE_MODULO)).toThrow();
    expect(() => AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MODULO)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_MODULO)).toThrow();
    expect(AutoVarServerController.do_calculation([null, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_MODULO)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([undefined, undefined], VarConfVO.AUTO_OPERATEUR_BINAIRE_MODULO)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_MODULO)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([null, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_MODULO)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_MODULO)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([0, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_MODULO)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MODULO)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([1, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_MODULO)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MODULO)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([1, -1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MODULO)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([-1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MODULO)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([1.055, 20], VarConfVO.AUTO_OPERATEUR_BINAIRE_MODULO)).toStrictEqual(1.055);
    expect(AutoVarServerController.do_calculation([-14.123, 23], VarConfVO.AUTO_OPERATEUR_BINAIRE_MODULO)).toStrictEqual(-14.123);
});

test('AutoVarServerController.do_calculation:test AUTO_OPERATEUR_BINAIRE_MAX', async () => {

    expect(() => AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_BINAIRE_MAX)).toThrow();
    expect(() => AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MAX)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_MAX)).toThrow();
    expect(AutoVarServerController.do_calculation([null, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_MAX)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([undefined, undefined], VarConfVO.AUTO_OPERATEUR_BINAIRE_MAX)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_MAX)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([null, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_MAX)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_MAX)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([0, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_MAX)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MAX)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([1, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_MAX)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MAX)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([1, -1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MAX)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([-1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MAX)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([1.055, 20], VarConfVO.AUTO_OPERATEUR_BINAIRE_MAX)).toStrictEqual(20);
    expect(AutoVarServerController.do_calculation([-14.123, 23], VarConfVO.AUTO_OPERATEUR_BINAIRE_MAX)).toStrictEqual(23);
});

test('AutoVarServerController.do_calculation:test AUTO_OPERATEUR_BINAIRE_MIN', async () => {

    expect(() => AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_BINAIRE_MIN)).toThrow();
    expect(() => AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MIN)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_MIN)).toThrow();
    expect(AutoVarServerController.do_calculation([null, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_MIN)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([undefined, undefined], VarConfVO.AUTO_OPERATEUR_BINAIRE_MIN)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_MIN)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([null, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_MIN)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_MIN)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([0, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_MIN)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MIN)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([1, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_MIN)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MIN)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([1, -1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MIN)).toStrictEqual(-1);
    expect(AutoVarServerController.do_calculation([-1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_MIN)).toStrictEqual(-1);
    expect(AutoVarServerController.do_calculation([1.055, 20], VarConfVO.AUTO_OPERATEUR_BINAIRE_MIN)).toStrictEqual(1.055);
    expect(AutoVarServerController.do_calculation([-14.123, 23], VarConfVO.AUTO_OPERATEUR_BINAIRE_MIN)).toStrictEqual(-14.123);
});

test('AutoVarServerController.do_calculation:test AUTO_OPERATEUR_BINAIRE_EGAL', async () => {

    expect(() => AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_BINAIRE_EGAL)).toThrow();
    expect(() => AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_BINAIRE_EGAL)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_EGAL)).toThrow();
    expect(AutoVarServerController.do_calculation([null, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_EGAL)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([undefined, undefined], VarConfVO.AUTO_OPERATEUR_BINAIRE_EGAL)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([NaN, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_EGAL)).toStrictEqual(0); // NaN != NaN
    expect(AutoVarServerController.do_calculation([null, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_EGAL)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([NaN, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_EGAL)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([0, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_EGAL)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_EGAL)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([1, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_EGAL)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_EGAL)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([1, -1], VarConfVO.AUTO_OPERATEUR_BINAIRE_EGAL)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([-1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_EGAL)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([1.055, 20], VarConfVO.AUTO_OPERATEUR_BINAIRE_EGAL)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([-14.123, 23], VarConfVO.AUTO_OPERATEUR_BINAIRE_EGAL)).toStrictEqual(0);
});

test('AutoVarServerController.do_calculation:test AUTO_OPERATEUR_BINAIRE_INF', async () => {

    expect(() => AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_BINAIRE_INF)).toThrow();
    expect(() => AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_BINAIRE_INF)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_INF)).toThrow();
    expect(AutoVarServerController.do_calculation([null, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_INF)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([undefined, undefined], VarConfVO.AUTO_OPERATEUR_BINAIRE_INF)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_INF)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([null, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_INF)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_INF)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([0, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_INF)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_INF)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([1, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_INF)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_INF)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([1, -1], VarConfVO.AUTO_OPERATEUR_BINAIRE_INF)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([-1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_INF)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([1.055, 20], VarConfVO.AUTO_OPERATEUR_BINAIRE_INF)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([-14.123, 23], VarConfVO.AUTO_OPERATEUR_BINAIRE_INF)).toStrictEqual(1);
});

test('AutoVarServerController.do_calculation:test AUTO_OPERATEUR_BINAIRE_SUP', async () => {

    expect(() => AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUP)).toThrow();
    expect(() => AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUP)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUP)).toThrow();
    expect(AutoVarServerController.do_calculation([null, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUP)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([undefined, undefined], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUP)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUP)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([null, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUP)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUP)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([0, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUP)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUP)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([1, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUP)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUP)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([1, -1], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUP)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([-1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUP)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([1.055, 20], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUP)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([-14.123, 23], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUP)).toStrictEqual(0);
});

test('AutoVarServerController.do_calculation:test AUTO_OPERATEUR_BINAIRE_INFEGAL', async () => {

    expect(() => AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_BINAIRE_INFEGAL)).toThrow();
    expect(() => AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_BINAIRE_INFEGAL)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_INFEGAL)).toThrow();
    expect(AutoVarServerController.do_calculation([null, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_INFEGAL)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([undefined, undefined], VarConfVO.AUTO_OPERATEUR_BINAIRE_INFEGAL)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_INFEGAL)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([null, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_INFEGAL)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_INFEGAL)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([0, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_INFEGAL)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_INFEGAL)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([1, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_INFEGAL)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_INFEGAL)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([1, -1], VarConfVO.AUTO_OPERATEUR_BINAIRE_INFEGAL)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([-1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_INFEGAL)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([1.055, 20], VarConfVO.AUTO_OPERATEUR_BINAIRE_INFEGAL)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([-14.123, 23], VarConfVO.AUTO_OPERATEUR_BINAIRE_INFEGAL)).toStrictEqual(1);
});

test('AutoVarServerController.do_calculation:test AUTO_OPERATEUR_BINAIRE_SUPEGAL', async () => {

    expect(() => AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUPEGAL)).toThrow();
    expect(() => AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUPEGAL)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUPEGAL)).toThrow();
    expect(AutoVarServerController.do_calculation([null, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUPEGAL)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([undefined, undefined], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUPEGAL)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUPEGAL)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([null, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUPEGAL)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUPEGAL)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([0, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUPEGAL)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUPEGAL)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([1, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUPEGAL)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUPEGAL)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([1, -1], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUPEGAL)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([-1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUPEGAL)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([1.055, 20], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUPEGAL)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([-14.123, 23], VarConfVO.AUTO_OPERATEUR_BINAIRE_SUPEGAL)).toStrictEqual(0);
});

test('AutoVarServerController.do_calculation:test AUTO_OPERATEUR_BINAIRE_DIFFERENT', async () => {

    expect(() => AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIFFERENT)).toThrow();
    expect(() => AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIFFERENT)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIFFERENT)).toThrow();
    expect(AutoVarServerController.do_calculation([null, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIFFERENT)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([undefined, undefined], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIFFERENT)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([NaN, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIFFERENT)).toStrictEqual(1); // NaN != NaN
    expect(AutoVarServerController.do_calculation([null, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIFFERENT)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([NaN, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIFFERENT)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([0, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIFFERENT)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIFFERENT)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([1, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIFFERENT)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIFFERENT)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([1, -1], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIFFERENT)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([-1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIFFERENT)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([1.055, 20], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIFFERENT)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([-14.123, 23], VarConfVO.AUTO_OPERATEUR_BINAIRE_DIFFERENT)).toStrictEqual(1);
});

test('AutoVarServerController.do_calculation:test AUTO_OPERATEUR_BINAIRE_ET', async () => {

    expect(() => AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_BINAIRE_ET)).toThrow();
    expect(() => AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_BINAIRE_ET)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_ET)).toThrow();
    expect(AutoVarServerController.do_calculation([null, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_ET)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([undefined, undefined], VarConfVO.AUTO_OPERATEUR_BINAIRE_ET)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_ET)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([null, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_ET)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_ET)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([0, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_ET)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_ET)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([1, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_ET)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_ET)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([1, -1], VarConfVO.AUTO_OPERATEUR_BINAIRE_ET)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([-1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_ET)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([1.055, 20], VarConfVO.AUTO_OPERATEUR_BINAIRE_ET)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([-14.123, 23], VarConfVO.AUTO_OPERATEUR_BINAIRE_ET)).toStrictEqual(1);
});

test('AutoVarServerController.do_calculation:test AUTO_OPERATEUR_BINAIRE_OU', async () => {

    expect(() => AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_BINAIRE_OU)).toThrow();
    expect(() => AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_BINAIRE_OU)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_OU)).toThrow();
    expect(AutoVarServerController.do_calculation([null, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_OU)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([undefined, undefined], VarConfVO.AUTO_OPERATEUR_BINAIRE_OU)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_OU)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([null, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_OU)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_OU)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([0, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_OU)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_OU)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([1, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_OU)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_OU)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([1, -1], VarConfVO.AUTO_OPERATEUR_BINAIRE_OU)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([-1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_OU)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([1.055, 20], VarConfVO.AUTO_OPERATEUR_BINAIRE_OU)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([-14.123, 23], VarConfVO.AUTO_OPERATEUR_BINAIRE_OU)).toStrictEqual(1);
});

test('AutoVarServerController.do_calculation:test AUTO_OPERATEUR_BINAIRE_XOR', async () => {

    expect(() => AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_BINAIRE_XOR)).toThrow();
    expect(() => AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_BINAIRE_XOR)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_XOR)).toThrow();
    expect(AutoVarServerController.do_calculation([null, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_XOR)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([undefined, undefined], VarConfVO.AUTO_OPERATEUR_BINAIRE_XOR)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_XOR)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([null, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_XOR)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_XOR)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([0, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_XOR)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_XOR)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([1, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_XOR)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_XOR)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([1, -1], VarConfVO.AUTO_OPERATEUR_BINAIRE_XOR)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([-1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_XOR)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([1.055, 20], VarConfVO.AUTO_OPERATEUR_BINAIRE_XOR)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([-14.123, 23], VarConfVO.AUTO_OPERATEUR_BINAIRE_XOR)).toStrictEqual(0);
});

test('AutoVarServerController.do_calculation:test AUTO_OPERATEUR_BINAIRE_ROUND', async () => {

    expect(() => AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_BINAIRE_ROUND)).toThrow();
    expect(() => AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_BINAIRE_ROUND)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_ROUND)).toThrow();
    expect(AutoVarServerController.do_calculation([null, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_ROUND)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([undefined, undefined], VarConfVO.AUTO_OPERATEUR_BINAIRE_ROUND)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_ROUND)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([null, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_ROUND)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_ROUND)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([0, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_ROUND)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_ROUND)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([1, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_ROUND)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_ROUND)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([1, -1], VarConfVO.AUTO_OPERATEUR_BINAIRE_ROUND)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([-1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_ROUND)).toStrictEqual(-1);
    expect(AutoVarServerController.do_calculation([1.055, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_ROUND)).toStrictEqual(1.06);
    expect(AutoVarServerController.do_calculation([-14.123, 4], VarConfVO.AUTO_OPERATEUR_BINAIRE_ROUND)).toStrictEqual(-14.123);
});

test('AutoVarServerController.do_calculation:test AUTO_OPERATEUR_BINAIRE_CEIL', async () => {

    expect(() => AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_BINAIRE_CEIL)).toThrow();
    expect(() => AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_BINAIRE_CEIL)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_CEIL)).toThrow();
    expect(AutoVarServerController.do_calculation([null, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_CEIL)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([undefined, undefined], VarConfVO.AUTO_OPERATEUR_BINAIRE_CEIL)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_CEIL)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([null, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_CEIL)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_CEIL)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([0, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_CEIL)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_CEIL)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([1, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_CEIL)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_CEIL)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([1, -1], VarConfVO.AUTO_OPERATEUR_BINAIRE_CEIL)).toStrictEqual(10);
    expect(AutoVarServerController.do_calculation([-1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_CEIL)).toStrictEqual(-1);
    expect(AutoVarServerController.do_calculation([1.055, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_CEIL)).toStrictEqual(1.06);
    expect(AutoVarServerController.do_calculation([-14.123, 4], VarConfVO.AUTO_OPERATEUR_BINAIRE_CEIL)).toStrictEqual(-14.123);
});

test('AutoVarServerController.do_calculation:test AUTO_OPERATEUR_BINAIRE_FLOOR', async () => {

    expect(() => AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_BINAIRE_FLOOR)).toThrow();
    expect(() => AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_BINAIRE_FLOOR)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_FLOOR)).toThrow();
    expect(AutoVarServerController.do_calculation([null, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_FLOOR)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([undefined, undefined], VarConfVO.AUTO_OPERATEUR_BINAIRE_FLOOR)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_FLOOR)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([null, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_FLOOR)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_FLOOR)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([0, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_FLOOR)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_FLOOR)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([1, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_FLOOR)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_FLOOR)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([1, -1], VarConfVO.AUTO_OPERATEUR_BINAIRE_FLOOR)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([-1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_FLOOR)).toStrictEqual(-1);
    expect(AutoVarServerController.do_calculation([1.055, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_FLOOR)).toStrictEqual(1.05);
    expect(AutoVarServerController.do_calculation([1.055, 3], VarConfVO.AUTO_OPERATEUR_BINAIRE_FLOOR)).toStrictEqual(1.055);
    expect(AutoVarServerController.do_calculation([-14.123, 4], VarConfVO.AUTO_OPERATEUR_BINAIRE_FLOOR)).toStrictEqual(-14.123);
});

test('AutoVarServerController.do_calculation:test AUTO_OPERATEUR_BINAIRE_EXP', async () => {

    expect(() => AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_BINAIRE_EXP)).toThrow();
    expect(() => AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_BINAIRE_EXP)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_EXP)).toThrow();
    expect(AutoVarServerController.do_calculation([null, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_EXP)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([undefined, undefined], VarConfVO.AUTO_OPERATEUR_BINAIRE_EXP)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_EXP)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([null, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_EXP)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_EXP)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([0, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_EXP)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_EXP)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([1, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_EXP)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_EXP)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([1, -1], VarConfVO.AUTO_OPERATEUR_BINAIRE_EXP)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([-1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_EXP)).toStrictEqual(-1);
    expect(AutoVarServerController.do_calculation([1.055, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_EXP)).toStrictEqual(1.113025);
    expect(AutoVarServerController.do_calculation([-2, 4], VarConfVO.AUTO_OPERATEUR_BINAIRE_EXP)).toStrictEqual(16);
});

test('AutoVarServerController.do_calculation:test AUTO_OPERATEUR_BINAIRE_LOG', async () => {

    expect(() => AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_BINAIRE_LOG)).toThrow();
    expect(() => AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_BINAIRE_LOG)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_LOG)).toThrow();
    expect(() => AutoVarServerController.do_calculation([null, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_LOG)).toThrow();
    expect(() => AutoVarServerController.do_calculation([undefined, undefined], VarConfVO.AUTO_OPERATEUR_BINAIRE_LOG)).toThrow();
    expect(() => AutoVarServerController.do_calculation([NaN, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_LOG)).toThrow();
    expect(() => AutoVarServerController.do_calculation([null, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_LOG)).toThrow();
    expect(() => AutoVarServerController.do_calculation([NaN, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_LOG)).toThrow();
    // Not Implemented
    expect(() => AutoVarServerController.do_calculation([0, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_LOG)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_LOG)).toThrow();
    expect(() => AutoVarServerController.do_calculation([1, 0], VarConfVO.AUTO_OPERATEUR_BINAIRE_LOG)).toThrow();
    expect(() => AutoVarServerController.do_calculation([1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_LOG)).toThrow();
    expect(() => AutoVarServerController.do_calculation([1, -1], VarConfVO.AUTO_OPERATEUR_BINAIRE_LOG)).toThrow();
    expect(() => AutoVarServerController.do_calculation([-1, 1], VarConfVO.AUTO_OPERATEUR_BINAIRE_LOG)).toThrow();
    expect(() => AutoVarServerController.do_calculation([1.055, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_LOG)).toThrow();
    expect(() => AutoVarServerController.do_calculation([-14.123, 4], VarConfVO.AUTO_OPERATEUR_BINAIRE_LOG)).toThrow();
});

test('AutoVarServerController.do_calculation:test AUTO_OPERATEUR_BINAIRE_STARTOF', async () => {

    expect(() => AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_BINAIRE_STARTOF)).toThrow();
    expect(() => AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_BINAIRE_STARTOF)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1, 2], VarConfVO.AUTO_OPERATEUR_BINAIRE_STARTOF)).toThrow();
    expect(AutoVarServerController.do_calculation([null, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_STARTOF)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([undefined, undefined], VarConfVO.AUTO_OPERATEUR_BINAIRE_STARTOF)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_STARTOF)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([null, NaN], VarConfVO.AUTO_OPERATEUR_BINAIRE_STARTOF)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN, null], VarConfVO.AUTO_OPERATEUR_BINAIRE_STARTOF)).toStrictEqual(null);
    // TODO TEST Not Implemented
});

test('AutoVarServerController.do_calculation:test AUTO_OPERATEUR_TERNAIRE_SI', async () => {

    expect(() => AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_TERNAIRE_SI)).toThrow();
    expect(() => AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_TERNAIRE_SI)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_TERNAIRE_SI)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1, 2, 3], VarConfVO.AUTO_OPERATEUR_TERNAIRE_SI)).toThrow();
    expect(AutoVarServerController.do_calculation([null, null, null], VarConfVO.AUTO_OPERATEUR_TERNAIRE_SI)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([undefined, undefined, undefined], VarConfVO.AUTO_OPERATEUR_TERNAIRE_SI)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN, NaN, NaN], VarConfVO.AUTO_OPERATEUR_TERNAIRE_SI)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([null, NaN, null], VarConfVO.AUTO_OPERATEUR_TERNAIRE_SI)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([null, null, NaN], VarConfVO.AUTO_OPERATEUR_TERNAIRE_SI)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN, null, null], VarConfVO.AUTO_OPERATEUR_TERNAIRE_SI)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([undefined, null, null], VarConfVO.AUTO_OPERATEUR_TERNAIRE_SI)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([null, undefined, null], VarConfVO.AUTO_OPERATEUR_TERNAIRE_SI)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([null, null, undefined], VarConfVO.AUTO_OPERATEUR_TERNAIRE_SI)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([0, 0, 0], VarConfVO.AUTO_OPERATEUR_TERNAIRE_SI)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([0, 0, 1], VarConfVO.AUTO_OPERATEUR_TERNAIRE_SI)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([0, 1, 0], VarConfVO.AUTO_OPERATEUR_TERNAIRE_SI)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([1, 0, 0], VarConfVO.AUTO_OPERATEUR_TERNAIRE_SI)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([0, 1, 1], VarConfVO.AUTO_OPERATEUR_TERNAIRE_SI)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([1, 0, 1], VarConfVO.AUTO_OPERATEUR_TERNAIRE_SI)).toStrictEqual(0);
    expect(AutoVarServerController.do_calculation([1, 1, 0], VarConfVO.AUTO_OPERATEUR_TERNAIRE_SI)).toStrictEqual(1);
    expect(AutoVarServerController.do_calculation([1, 1, 1], VarConfVO.AUTO_OPERATEUR_TERNAIRE_SI)).toStrictEqual(1);
});

test('AutoVarServerController.do_calculation:test AUTO_OPERATEUR_TERNAIRE_AJOUT_DUREE', async () => {

    expect(() => AutoVarServerController.do_calculation([], VarConfVO.AUTO_OPERATEUR_TERNAIRE_AJOUT_DUREE)).toThrow();
    expect(() => AutoVarServerController.do_calculation([1], VarConfVO.AUTO_OPERATEUR_TERNAIRE_AJOUT_DUREE)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1], VarConfVO.AUTO_OPERATEUR_TERNAIRE_AJOUT_DUREE)).toThrow();
    expect(() => AutoVarServerController.do_calculation([0, 1, 2, 3], VarConfVO.AUTO_OPERATEUR_TERNAIRE_AJOUT_DUREE)).toThrow();
    expect(AutoVarServerController.do_calculation([null, null, null], VarConfVO.AUTO_OPERATEUR_TERNAIRE_AJOUT_DUREE)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([undefined, undefined, undefined], VarConfVO.AUTO_OPERATEUR_TERNAIRE_AJOUT_DUREE)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN, NaN, NaN], VarConfVO.AUTO_OPERATEUR_TERNAIRE_AJOUT_DUREE)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([null, NaN, null], VarConfVO.AUTO_OPERATEUR_TERNAIRE_AJOUT_DUREE)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([null, null, NaN], VarConfVO.AUTO_OPERATEUR_TERNAIRE_AJOUT_DUREE)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([NaN, null, null], VarConfVO.AUTO_OPERATEUR_TERNAIRE_AJOUT_DUREE)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([undefined, null, null], VarConfVO.AUTO_OPERATEUR_TERNAIRE_AJOUT_DUREE)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([null, undefined, null], VarConfVO.AUTO_OPERATEUR_TERNAIRE_AJOUT_DUREE)).toStrictEqual(null);
    expect(AutoVarServerController.do_calculation([null, null, undefined], VarConfVO.AUTO_OPERATEUR_TERNAIRE_AJOUT_DUREE)).toStrictEqual(null);
    // TODO TEST Not Implemented
});