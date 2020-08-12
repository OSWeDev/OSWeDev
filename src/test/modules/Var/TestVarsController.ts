import { expect } from 'chai';
import 'mocha';
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import VarDataBaseVO from '../../../shared/modules/Var/params/VarDataBaseVO';
import SimpleVarConfVO from '../../../shared/modules/Var/simple_vars/SimpleVarConfVO';
import VarsController from '../../../shared/modules/Var/VarsController';
import RangeHandler from '../../../shared/tools/RangeHandler';
import FakeVarController from './fakes/FakeVarController';
import FakeDataVO from './fakes/vos/FakeDataVO';
import moment = require('moment');


describe('VarsController', () => {

    it('registerVar/unregisterVar/getVarConf/getVarConfById/getVarController/getVarControllerById', () => {

        let var_name: string = "varConf";
        let varConf: SimpleVarConfVO = new SimpleVarConfVO();
        varConf.id = 1;
        varConf.name = "varConf";
        varConf.var_data_vo_type = FakeDataVO.API_TYPE_ID;

        VarsController.getInstance().unregisterVar(varConf);

        VarsController.getInstance().registerVar(null, null);
        VarsController.getInstance().registerVar(null, FakeVarController.getInstance());
        VarsController.getInstance().registerVar(varConf, null);

        expect(VarsController.getInstance().getVarConf(null)).to.equal(null);
        expect(VarsController.getInstance().getVarConfById(null)).to.equal(null);
        expect(VarsController.getInstance().getVarController(null)).to.equal(null);
        expect(VarsController.getInstance().getVarControllerById(null)).to.equal(null);

        expect(VarsController.getInstance().getVarConf(var_name)).to.equal(null);
        expect(VarsController.getInstance().getVarConfById(1)).to.equal(null);
        expect(VarsController.getInstance().getVarController(var_name)).to.equal(null);
        expect(VarsController.getInstance().getVarControllerById(1)).to.equal(null);

        VarsController.getInstance().registerVar(varConf, FakeVarController.getInstance());
        expect(VarsController.getInstance().getVarConf(var_name)).to.equal(varConf);
        expect(VarsController.getInstance().getVarConfById(1)).to.equal(varConf);
        expect(VarsController.getInstance().getVarController(var_name)).to.equal(FakeVarController.getInstance());
        expect(VarsController.getInstance().getVarControllerById(1)).to.equal(FakeVarController.getInstance());

        VarsController.getInstance().unregisterVar(varConf);
        expect(VarsController.getInstance().getVarConf(var_name)).to.equal(null);
        expect(VarsController.getInstance().getVarConfById(1)).to.equal(null);
        expect(VarsController.getInstance().getVarController(var_name)).to.equal(null);
        expect(VarsController.getInstance().getVarControllerById(1)).to.equal(null);
    });

    it('getIndex', () => {

        let var_name: string = "varConf";
        let varConf: SimpleVarConfVO = new SimpleVarConfVO();
        varConf.id = 1;
        varConf.name = "varConf";
        varConf.var_data_vo_type = FakeDataVO.API_TYPE_ID;

        let index1: string = "1_2019-01-01_1_1";
        let index2: string = "1_2019-01-02_1_1";
        let index3: string = "1_2019-01-03_1_1";

        let param1: FakeDataVO = VarDataBaseVO.createNew('fake_type', 1, true, [RangeHandler.getInstance().create_single_elt_TSRange(moment("2019-01-01").utc(true), TimeSegment.TYPE_DAY)]);
        let param2: FakeDataVO = VarDataBaseVO.createNew('fake_type', 1, true, [RangeHandler.getInstance().create_single_elt_TSRange(moment("2019-01-02").utc(true), TimeSegment.TYPE_DAY)]);
        let param3: FakeDataVO = VarDataBaseVO.createNew('fake_type', 1, true, [RangeHandler.getInstance().create_single_elt_TSRange(moment("2019-01-03").utc(true), TimeSegment.TYPE_DAY)]);

        VarsController.getInstance().unregisterVar(varConf);

        expect(param1.index).to.equal(null);

        VarsController.getInstance().registerVar(varConf, FakeVarController.getInstance());
        expect(param1.index).to.equal(index1);
        expect(param2.index).to.equal(index2);
        expect(param3.index).to.equal(index3);
        VarsController.getInstance().unregisterVar(varConf);
    });

    // it('registerDataParam/unregisterDataParam', () => {

    //     let var_name: string = "varConf";
    //     let varConf: SimpleVarConfVO = new SimpleVarConfVO();
    //     varConf.id = 1;
    //     varConf.name = "varConf";
    //     varConf.var_data_vo_type = FakeDataVO.API_TYPE_ID;


    //     VarsController.getInstance().registerVar(varConf, FakeVarController.getInstance());
    //     expect(VarsController.getInstance().registeredDatasParamsIndexes).to.deep.equal({});
    //     expect(VarsController.getInstance().registeredDatasParams).to.deep.equal({});

    //     let fakeDataParam: FakeDataVO = FakeDataParamController.getInstance().getParamFromCompteurName(var_name, 5, '2019-01-01');
    //     let fakeDataParamIndex: string = fakeDataParam.index;

    //     VarsController.getInstance().registerDataParam(fakeDataParam);
    //     expect(VarsController.getInstance().registeredDatasParamsIndexes).to.deep.equal({ [fakeDataParamIndex]: 1 });
    //     expect(VarsController.getInstance().registeredDatasParams).to.deep.equal({ [fakeDataParamIndex]: fakeDataParam });

    //     VarsController.getInstance().registerDataParam(fakeDataParam);
    //     expect(VarsController.getInstance().registeredDatasParamsIndexes).to.deep.equal({ [fakeDataParamIndex]: 2 });
    //     expect(VarsController.getInstance().registeredDatasParams).to.deep.equal({ [fakeDataParamIndex]: fakeDataParam });

    //     VarsController.getInstance().unregisterDataParam(fakeDataParam);
    //     expect(VarsController.getInstance().registeredDatasParamsIndexes).to.deep.equal({ [fakeDataParamIndex]: 1 });
    //     expect(VarsController.getInstance().registeredDatasParams).to.deep.equal({ [fakeDataParamIndex]: fakeDataParam });

    //     VarsController.getInstance().unregisterDataParam(fakeDataParam);
    //     expect(VarsController.getInstance().registeredDatasParamsIndexes).to.deep.equal({});
    //     expect(VarsController.getInstance().registeredDatasParams).to.deep.equal({});

    //     VarsController.getInstance().unregisterVar(varConf);
    // });

    // it('stageUpdateData/waitingForUpdate_/debounce_update', async () => {

    //     let var_name: string = "varConf";
    //     let varConf: SimpleVarConfVO = new SimpleVarConfVO();
    //     varConf.id = 1;
    //     varConf.name = "varConf";
    //     varConf.var_data_vo_type = FakeDataVO.API_TYPE_ID;


    //     VarsController.getInstance().registerVar(varConf, FakeVarController.getInstance());

    //     let fakeDataParam: FakeDataVO = FakeDataParamController.getInstance().getParamFromCompteurName(var_name, 5, '2019-01-01');
    //     let fakeDataParamIndex: string = fakeDataParam.index;

    //     expect(VarsController.getInstance().updateSemaphore_).to.equal(false);
    //     VarsController.getInstance().registerDataParam(fakeDataParam);
    //     expect(VarsController.getInstance().waitingForUpdate_).to.deep.equal({ [fakeDataParamIndex]: fakeDataParam });

    //     let i: number = 0;
    //     await ThreadHandler.getInstance().sleep(200);
    //     while (VarsController.getInstance().updateSemaphore_) {
    //         await ThreadHandler.getInstance().sleep(50);
    //         expect(i++).to.be.below(10);
    //     }
    //     expect(VarsController.getInstance().updateSemaphore_).to.equal(false);
    //     expect(VarsController.getInstance().waitingForUpdate_).to.deep.equal({});

    //     VarsController.getInstance().stageUpdateData(fakeDataParam);
    //     expect(VarsController.getInstance().waitingForUpdate_).to.deep.equal({ [fakeDataParamIndex]: fakeDataParam });

    //     // Normalement si on attend 100ms le batch se lance et après 10ms grand max on a le résultat
    //     i = 0;
    //     await ThreadHandler.getInstance().sleep(200);
    //     while (VarsController.getInstance().updateSemaphore_) {
    //         await ThreadHandler.getInstance().sleep(50);
    //         expect(i++).to.be.below(10);
    //     }
    //     expect(VarsController.getInstance().updateSemaphore_).to.equal(false);
    //     expect(VarsController.getInstance().waitingForUpdate_).to.deep.equal({});


    //     let fakeDataParam2: FakeDataVO = FakeDataParamController.getInstance().getParamFromCompteurName(var_name, 15, '2019-05-21');
    //     let fakeDataParamIndex2: string = fakeDataParam.index;

    //     expect(VarsController.getInstance().updateSemaphore_).to.equal(false);
    //     expect(VarsController.getInstance().waitingForUpdate_).to.deep.equal({});
    //     VarsController.getInstance().stageUpdateData(fakeDataParam);
    //     expect(VarsController.getInstance().waitingForUpdate_).to.deep.equal({ [fakeDataParamIndex]: fakeDataParam });
    //     VarsController.getInstance().stageUpdateData(fakeDataParam2);
    //     expect(VarsController.getInstance().waitingForUpdate_).to.deep.equal({ [fakeDataParamIndex]: fakeDataParam, [fakeDataParamIndex2]: fakeDataParam2 });

    //     // Normalement si on attend 100ms le batch se lance et après 10ms grand max on a le résultat
    //     i = 0;
    //     await ThreadHandler.getInstance().sleep(200);
    //     while (VarsController.getInstance().updateSemaphore_) {
    //         await ThreadHandler.getInstance().sleep(50);
    //         expect(i++).to.be.below(10);
    //     }
    //     expect(VarsController.getInstance().updateSemaphore_).to.equal(false);
    //     expect(VarsController.getInstance().waitingForUpdate_).to.deep.equal({});

    //     VarsController.getInstance().unregisterVar(varConf);
    // });

    // it('simple addDepsToBatch + perfs', async () => {
    //     let var_name: string = "varConf";
    //     let varConf: SimpleVarConfVO = new SimpleVarConfVO();
    //     varConf.id = 1;
    //     varConf.name = "varConf";
    //     varConf.var_data_vo_type = FakeDataVO.API_TYPE_ID;


    //     VarsController.getInstance().registerVar(varConf, FakeVarController.getInstance());

    //     let fakeDataParam: FakeDataVO = FakeDataParamController.getInstance().getParamFromCompteurName(var_name, 5, '2019-01-01');
    //     let fakeDataParamIndex: string = fakeDataParam.index;

    //     PerfMonController.PERFMON_RUN = true;
    //     expect(VarsController.getInstance().addDepsToBatch({ [fakeDataParamIndex]: fakeDataParam })).to.deep.equal({
    //         [fakeDataParamIndex]: fakeDataParam
    //     });
    //     expect(PerfMonController.getInstance().getLastPerfMonFuncData("addDepsToBatch").duration.asMilliseconds()).to.be.below(10);

    //     expect(VarsController.getInstance().addDepsToBatch({ [fakeDataParamIndex]: fakeDataParam })).to.deep.equal({
    //         [fakeDataParamIndex]: fakeDataParam
    //     });
    //     expect(VarsController.getInstance().addDepsToBatch({ [fakeDataParamIndex]: fakeDataParam })).to.deep.equal({
    //         [fakeDataParamIndex]: fakeDataParam
    //     });
    //     expect(VarsController.getInstance().addDepsToBatch({ [fakeDataParamIndex]: fakeDataParam })).to.deep.equal({
    //         [fakeDataParamIndex]: fakeDataParam
    //     });
    //     expect(PerfMonController.getInstance().getPerfMonFuncStat("addDepsToBatch").max_duration.asMilliseconds()).to.be.below(10);
    // });


    // it('simple hasDependancy + perfs', async () => {
    //     let var_name: string = "varConf";
    //     let varConf: SimpleVarConfVO = new SimpleVarConfVO();
    //     varConf.id = 1;
    //     varConf.name = "varConf";
    //     varConf.var_data_vo_type = FakeDataVO.API_TYPE_ID;


    //     VarsController.getInstance().registerVar(varConf, FakeVarController.getInstance());

    //     let fakeDataParam: FakeDataVO = FakeDataParamController.getInstance().getParamFromCompteurName(var_name, 5, '2019-01-01');
    //     let fakeDataParamIndex: string = fakeDataParam.index;

    //     PerfMonController.PERFMON_RUN = true;

    //     let deps_by_var_id: { [from_var_id: number]: number[] } = {};
    //     expect(VarsController.getInstance().hasDependancy(1, null)).to.equal(false);
    //     expect(VarsController.getInstance().hasDependancy(2, deps_by_var_id)).to.equal(false);
    //     expect(VarsController.getInstance().hasDependancy(1, deps_by_var_id)).to.equal(false);
    //     expect(PerfMonController.getInstance().getLastPerfMonFuncData("hasDependancy").duration.asMilliseconds()).to.be.below(10);

    //     deps_by_var_id = { [1]: [2] };
    //     expect(VarsController.getInstance().hasDependancy(2, deps_by_var_id)).to.equal(true);
    //     expect(VarsController.getInstance().hasDependancy(1, deps_by_var_id)).to.equal(false);
    //     expect(PerfMonController.getInstance().getLastPerfMonFuncData("hasDependancy").duration.asMilliseconds()).to.be.below(10);

    //     deps_by_var_id = {
    //         [2]: [],
    //         [1]: [2],
    //         [3]: [],
    //         [4]: [],
    //         [5]: [],
    //         [6]: [],
    //         [7]: [],
    //     };
    //     expect(VarsController.getInstance().hasDependancy(2, deps_by_var_id)).to.equal(true);
    //     expect(VarsController.getInstance().hasDependancy(1, deps_by_var_id)).to.equal(false);
    //     expect(VarsController.getInstance().hasDependancy(2, deps_by_var_id)).to.equal(true);
    //     expect(VarsController.getInstance().hasDependancy(1, deps_by_var_id)).to.equal(false);
    //     expect(VarsController.getInstance().hasDependancy(2, deps_by_var_id)).to.equal(true);
    //     expect(VarsController.getInstance().hasDependancy(1, deps_by_var_id)).to.equal(false);
    //     expect(VarsController.getInstance().hasDependancy(2, deps_by_var_id)).to.equal(true);
    //     expect(VarsController.getInstance().hasDependancy(1, deps_by_var_id)).to.equal(false);
    //     expect(VarsController.getInstance().hasDependancy(2, deps_by_var_id)).to.equal(true);
    //     expect(VarsController.getInstance().hasDependancy(1, deps_by_var_id)).to.equal(false);
    //     expect(VarsController.getInstance().hasDependancy(2, deps_by_var_id)).to.equal(true);
    //     expect(VarsController.getInstance().hasDependancy(1, deps_by_var_id)).to.equal(false);
    //     expect(PerfMonController.getInstance().getPerfMonFuncStat("hasDependancy").max_duration.asMilliseconds()).to.be.below(10);
    // });

    it('mergeDeps', async () => {
    });

    it('solveVarsDependencies', async () => {
    });

    it('getDataParamsByVarId', async () => {
    });

    it('sortDataParamsForUpdate', async () => {
    });

    it('loadVarsDatasAndLoadParamsDeps', async () => {
    });
});