import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { test, expect } from "playwright-test-coverage";
import TextHandler from '../../../src/shared/tools/TextHandler';

test('TextHandler: sanityze', () => {
    expect(TextHandler.getInstance().sanityze(null)).toStrictEqual(null);
    expect(TextHandler.getInstance().sanityze('a')).toStrictEqual('a');
    expect(TextHandler.getInstance().sanityze('abc')).toStrictEqual('abc');

    expect(TextHandler.getInstance().sanityze('a bc')).toStrictEqual('a bc');
    expect(TextHandler.getInstance().sanityze('téléphone')).toStrictEqual('telephone');
});

test('TextHandler: sanityze_object', () => {
    expect(TextHandler.getInstance().sanityze_object(null)).toStrictEqual(null);
    const dict = ["éhio", "ty uà", "ùéèç"];
    const dictExpected = ["ehio", "ty ua", "ueec"];
    expect(TextHandler.getInstance().sanityze_object(dict)).toStrictEqual(dictExpected);

    const dict1 = { 1: "éhio", 2: "ty uà", 3: "ùéèç" };
    const dictExpected1 = { 1: "ehio", 2: "ty ua", 3: "ueec" };
    expect(TextHandler.getInstance().sanityze_object(dict1)).toStrictEqual(dictExpected1);
});

test('TextHandler: standardize_for_comparaison', () => {
    expect(TextHandler.getInstance().standardize_for_comparaison(null)).toStrictEqual(null);
    expect(TextHandler.getInstance().standardize_for_comparaison('a')).toStrictEqual('a');
    expect(TextHandler.getInstance().standardize_for_comparaison('abc')).toStrictEqual('abc');
    expect(TextHandler.getInstance().standardize_for_comparaison('a bc')).toStrictEqual('a bc');
    // charcode 160 à remplacer par 32
    expect(TextHandler.getInstance().standardize_for_comparaison('a bc')).toStrictEqual('a bc');
    expect(TextHandler.getInstance().standardize_for_comparaison('téléphone')).toStrictEqual('telephone');
});
test('TextHandler: capitalize', () => {
    expect(TextHandler.getInstance().capitalize(null)).toStrictEqual(null);
    expect(TextHandler.getInstance().capitalize("test")).toStrictEqual("Test");
    expect(TextHandler.getInstance().capitalize("233")).toStrictEqual("233");
});
test('TextHandler: formatTextToID', () => {
    expect(TextHandler.getInstance().formatTextToID(null)).toStrictEqual(null);
    expect(TextHandler.getInstance().formatTextToID("@")).toStrictEqual("_");
    expect(TextHandler.getInstance().formatTextToID("A")).toStrictEqual("a");
    expect(TextHandler.getInstance().formatTextToID("this is a test")).toStrictEqual("this_is_a_test");
});

test('TextHandler: generateChallenge', () => {

    const charL = TextHandler.Challenge_Cars;

    // special characters of regex that needs to be escaped
    const speChars = '^*$\\.-+|()[]{},?/';

    //  the final regex that will be built
    let chars = '';

    for (const char of charL) {

        // if a special character is found, add a backslash to escape it in the regex
        if (speChars.includes(char)) {
            chars = chars + "\\" + char;
        } else {
            chars += char;
        }
    }

    const regexp = new RegExp("^[" + chars + "]{8}$");

    expect(regexp.test(TextHandler.getInstance().generateChallenge())).toStrictEqual(true);
    expect(regexp.test(TextHandler.getInstance().generateChallenge())).toStrictEqual(true);
    expect(regexp.test(TextHandler.getInstance().generateChallenge())).toStrictEqual(true);
    expect(regexp.test(TextHandler.getInstance().generateChallenge())).toStrictEqual(true);
    expect(regexp.test(TextHandler.getInstance().generateChallenge())).toStrictEqual(true);
    expect(regexp.test(TextHandler.getInstance().generateChallenge())).toStrictEqual(true);
    expect(regexp.test(TextHandler.getInstance().generateChallenge())).toStrictEqual(true);
});

test('TextHandler: generatePassword', () => {
    const charL = TextHandler.Password_Cars;
    const speChars = '^*$\\.-+|()[]{},?/';
    let chars = '';

    for (const char of charL) {
        if (speChars.includes(char)) {
            chars = chars + "\\" + char;
        } else {
            chars += char;
        }
    }

    const regexp = new RegExp("^[" + chars + "]{12}$");

    expect(regexp.test(TextHandler.getInstance().generatePassword())).toStrictEqual(true);
    expect(regexp.test(TextHandler.getInstance().generatePassword())).toStrictEqual(true);
    expect(regexp.test(TextHandler.getInstance().generatePassword())).toStrictEqual(true);
    expect(regexp.test(TextHandler.getInstance().generatePassword())).toStrictEqual(true);
    expect(regexp.test(TextHandler.getInstance().generatePassword())).toStrictEqual(true);
    expect(regexp.test(TextHandler.getInstance().generatePassword())).toStrictEqual(true);
    expect(regexp.test(TextHandler.getInstance().generatePassword())).toStrictEqual(true);
});