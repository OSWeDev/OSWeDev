import { expect } from 'chai';
import 'mocha';
import TextHandler from '../../../shared/tools/TextHandler';


describe('TextHandler', () => {

    it('TextHandler: standardize_for_comparaison', () => {
        expect(TextHandler.getInstance().standardize_for_comparaison(null)).to.equal(null);
        expect(TextHandler.getInstance().standardize_for_comparaison('a')).to.equal('a');
        expect(TextHandler.getInstance().standardize_for_comparaison('abc')).to.equal('abc');
        expect(TextHandler.getInstance().standardize_for_comparaison('a bc')).to.equal('a bc');
        // charcode 160 à remplacer par 32
        expect(TextHandler.getInstance().standardize_for_comparaison('a bc')).to.equal('a bc');
        expect(TextHandler.getInstance().standardize_for_comparaison('téléphone')).to.equal('telephone');
    });
});