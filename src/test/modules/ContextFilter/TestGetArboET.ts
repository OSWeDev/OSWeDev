import { expect } from "chai";
import ContextFilterVO from "../../../shared/modules/ContextFilter/vos/ContextFilterVO";
import ContextQueryServerController from "../../../server/modules/ContextFilter/ContextQueryServerController";

describe('get_arbo_ET', () => {

    let instance: ContextQueryServerController;

    beforeEach(() => {
        instance = ContextQueryServerController.getInstance();
    });

    it('should return null when filter type is not TYPE_FILTER_AND', () => {
        const filter = new ContextFilterVO();
        filter.filter_type = ContextFilterVO.TYPE_DATE_DOW;
        const result = instance['get_arbo_ET'](filter);
        expect(result).to.be.null('any');
    });

    it('should return path when left_hook returns a valid path', () => {
        const filter = new ContextFilterVO();
        filter.filter_type = ContextFilterVO.TYPE_FILTER_AND;
        const leftHook = new ContextFilterVO();
        leftHook.filter_type = ContextFilterVO.TYPE_DATE_DOW;
        filter.left_hook = leftHook;
        const result = instance['get_arbo_ET'](filter);
        expect(result).to.eql([true]);
    });

    it('should return path when right_hook returns a valid path', () => {
        const filter = new ContextFilterVO();
        filter.filter_type = ContextFilterVO.TYPE_FILTER_AND;
        const rightHook = new ContextFilterVO();
        rightHook.filter_type = ContextFilterVO.TYPE_DATE_DOW;
        filter.right_hook = rightHook;
        const result = instance['get_arbo_ET'](filter);
        expect(result).to.eql([false]);
    });

    // Vous pouvez ajouter plus de tests ici pour couvrir d'autres scénarios
});
