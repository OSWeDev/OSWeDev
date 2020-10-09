/* tslint:disable:no-unused-expression */

import { expect } from 'chai';
import 'mocha';
import VarsImportsHandler from '../../../server/modules/Var/VarsImportsHandler';
import FakeDataHandler from './fakes/FakeDataHandler';
import FakeDataVO from './fakes/vos/FakeDataVO';

describe('VarsImportsHandler', () => {

    it('test sort_matroids_per_cardinal_desc', async () => {

        FakeDataHandler.initializeDayDataRangesVO();

        let var_data_A: FakeDataVO = FakeDataHandler.get_var_data_A();
        let var_data_B: FakeDataVO = FakeDataHandler.get_var_data_B();
        let var_data_C: FakeDataVO = FakeDataHandler.get_var_data_C();

        expect(VarsImportsHandler.getInstance().sort_matroids_per_cardinal_desc(var_data_A, var_data_B)).to.equal(1);
        expect(VarsImportsHandler.getInstance().sort_matroids_per_cardinal_desc(var_data_A, var_data_A)).to.equal(0);
        expect(VarsImportsHandler.getInstance().sort_matroids_per_cardinal_desc(var_data_B, var_data_A)).to.equal(-1);
        expect(VarsImportsHandler.getInstance().sort_matroids_per_cardinal_desc(var_data_A, var_data_C)).to.equal(1);
        expect(VarsImportsHandler.getInstance().sort_matroids_per_cardinal_desc(var_data_C, var_data_A)).to.equal(-1);
        expect(VarsImportsHandler.getInstance().sort_matroids_per_cardinal_desc(var_data_B, var_data_C)).to.equal(1);
        expect(VarsImportsHandler.getInstance().sort_matroids_per_cardinal_desc(var_data_C, var_data_B)).to.equal(-1);
    });

    it('test get_selection_imports', async () => {

        FakeDataHandler.initializeDayDataRangesVO();

        /**
         * E dans B
         * B dans F
         * C dans F et indépendant de E et B
         * card C > card B
         */
        let var_data_B: FakeDataVO = FakeDataHandler.get_var_data_B();
        let var_data_E: FakeDataVO = FakeDataHandler.get_var_data_E();
        let var_data_F: FakeDataVO = FakeDataHandler.get_var_data_F();
        let var_data_C: FakeDataVO = FakeDataHandler.get_var_data_C();



        expect(VarsImportsHandler.getInstance().get_selection_imports([var_data_B, var_data_E], var_data_B)).to.deep.equal([var_data_B]);
        expect(VarsImportsHandler.getInstance().get_selection_imports([var_data_E], var_data_B)).to.deep.equal([var_data_E]);
        expect(VarsImportsHandler.getInstance().get_selection_imports([var_data_B], var_data_B)).to.deep.equal([var_data_B]);
        expect(VarsImportsHandler.getInstance().get_selection_imports([var_data_B], var_data_F)).to.deep.equal([var_data_B]);
        expect(VarsImportsHandler.getInstance().get_selection_imports([var_data_F, var_data_B], var_data_F)).to.deep.equal([var_data_F]);
        expect(VarsImportsHandler.getInstance().get_selection_imports([var_data_F], var_data_F)).to.deep.equal([var_data_F]);
        expect(VarsImportsHandler.getInstance().get_selection_imports([var_data_B, var_data_E], var_data_F)).to.deep.equal([var_data_B]);
        expect(VarsImportsHandler.getInstance().get_selection_imports([var_data_F, var_data_B, var_data_E], var_data_F)).to.deep.equal([var_data_F]);
        expect(VarsImportsHandler.getInstance().get_selection_imports([var_data_C, var_data_B, var_data_E], var_data_F)).to.deep.equal([var_data_C, var_data_B]);
        expect(VarsImportsHandler.getInstance().get_selection_imports([var_data_F, var_data_C, var_data_B, var_data_E], var_data_F)).to.deep.equal([var_data_F]);
        expect(VarsImportsHandler.getInstance().get_selection_imports([var_data_C, var_data_B], var_data_F)).to.deep.equal([var_data_C, var_data_B]);
    });
});