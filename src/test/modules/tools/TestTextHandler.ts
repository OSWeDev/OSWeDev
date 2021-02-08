import ServerAPIController from '../../../server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { expect } from 'chai';
import 'mocha';
import TextHandler from '../../../shared/tools/TextHandler';


describe('TextHandler', () => {

    it('TextHandler: sanityze', () => {
        expect(TextHandler.getInstance().sanityze(null)).to.deep.equal(null);
        expect(TextHandler.getInstance().sanityze('a')).to.deep.equal('a');
        expect(TextHandler.getInstance().sanityze('abc')).to.deep.equal('abc');

        expect(TextHandler.getInstance().sanityze('a bc')).to.deep.equal('a bc');
        expect(TextHandler.getInstance().sanityze('téléphone')).to.deep.equal('telephone');
    });

    it('TextHandler: sanityze_object', () => {
        expect(TextHandler.getInstance().sanityze_object(null)).to.deep.equal(null);
        let dict = ["éhio", "ty uà", "ùéèç"];
        let dictExpected = ["ehio", "ty ua", "ueec"];
        expect(TextHandler.getInstance().sanityze_object(dict)).to.deep.equal(dictExpected);

        let dict1 = { 1: "éhio", 2: "ty uà", 3: "ùéèç" };
        let dictExpected1 = { 1: "ehio", 2: "ty ua", 3: "ueec" };
        expect(TextHandler.getInstance().sanityze_object(dict1)).to.deep.equal(dictExpected1);
    });

    it('TextHandler: standardize_for_comparaison', () => {
        expect(TextHandler.getInstance().standardize_for_comparaison(null)).to.equal(null);
        expect(TextHandler.getInstance().standardize_for_comparaison('a')).to.equal('a');
        expect(TextHandler.getInstance().standardize_for_comparaison('abc')).to.equal('abc');
        expect(TextHandler.getInstance().standardize_for_comparaison('a bc')).to.equal('a bc');
        // charcode 160 à remplacer par 32
        expect(TextHandler.getInstance().standardize_for_comparaison('a bc')).to.equal('a bc');
        expect(TextHandler.getInstance().standardize_for_comparaison('téléphone')).to.equal('telephone');
    });
    it('TextHandler: capitalize', () => {
        expect(TextHandler.getInstance().capitalize(null)).to.equal(null);
        expect(TextHandler.getInstance().capitalize("test")).to.equal("Test");
        expect(TextHandler.getInstance().capitalize("233")).to.equal("233");
    });
    it('TextHandler: formatTextToID', () => {
        expect(TextHandler.getInstance().formatTextToID(null)).to.equal(null);
        expect(TextHandler.getInstance().formatTextToID("@")).to.equal("_");
        expect(TextHandler.getInstance().formatTextToID("A")).to.equal("a");
        expect(TextHandler.getInstance().formatTextToID("this is a test")).to.equal("this_is_a_test");
    });
});