import { expect } from 'chai';
import 'mocha';
import VarsController from '../../../src/shared/modules/Var/VarsController';
import VarConfVOBase from '../../../src/shared/modules/Var/vos/VarConfVOBase';
import SimpleVarConfVO from '../../../src/shared/modules/Var/simple_vars/SimpleVarConfVO';
import FakeDataVO from './fakes/vos/FakeDataVO';
import FakeDataParamController from './fakes/FakeDataParamController';
import FakeVarController from './fakes/FakeVarController';
import FakeDataParamVO from './fakes/vos/FakeDataParamVO';
import ThreadHandler from '../../../src/shared/tools/ThreadHandler';
import PerfMonController from '../../../src/shared/modules/PerfMon/PerfMonController';


describe('VarsController', () => {

    it('registerVar/unregisterVar/getVarConf/getVarConfById/getVarController/getVarControllerById', () => {

        let var_name: string = "varConf";
        let varConf: SimpleVarConfVO = new SimpleVarConfVO();
        varConf.id = 1;
        varConf.json_params = "{}";
        varConf.name = "varConf";
        varConf.var_data_vo_type = FakeDataVO.API_TYPE_ID;


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
        varConf.json_params = "{}";
        varConf.name = "varConf";
        varConf.var_data_vo_type = FakeDataVO.API_TYPE_ID;



        expect(VarsController.getInstance().getIndex(null)).to.equal(null);
        expect(VarsController.getInstance().getIndex(FakeDataParamController.getInstance().getParamFromCompteurName(var_name, 5, '2019-01-01'))).to.equal(null);

        VarsController.getInstance().registerVar(varConf, FakeVarController.getInstance());
        expect(VarsController.getInstance().getIndex(FakeDataParamController.getInstance().getParamFromCompteurName(var_name, 5, '2019-01-01'))).to.equal('1_5_2019-01-01');
        expect(VarsController.getInstance().getIndex(FakeDataParamController.getInstance().getParamFromCompteurName("doesntexist", 5, '2019-01-01'))).to.equal(null);
        expect(VarsController.getInstance().getIndex(FakeDataParamController.getInstance().getParamFromCompteurName(var_name, 15, '2019-01-01'))).to.equal('1_15_2019-01-01');
        expect(VarsController.getInstance().getIndex(FakeDataParamController.getInstance().getParamFromCompteurName(var_name, 5, '2019-01-20'))).to.equal('1_5_2019-01-20');
        expect(VarsController.getInstance().getIndex(FakeDataParamController.getInstance().getParamFromCompteurName(var_name, 15, '2019-01-20'))).to.equal('1_15_2019-01-20');
        VarsController.getInstance().unregisterVar(varConf);
    });

    it('registerDataParam/unregisterDataParam', () => {

        let var_name: string = "varConf";
        let varConf: SimpleVarConfVO = new SimpleVarConfVO();
        varConf.id = 1;
        varConf.json_params = "{}";
        varConf.name = "varConf";
        varConf.var_data_vo_type = FakeDataVO.API_TYPE_ID;


        VarsController.getInstance().registerVar(varConf, FakeVarController.getInstance());
        expect(VarsController.getInstance().registeredDatasParamsIndexes).to.deep.equal({});
        expect(VarsController.getInstance().registeredDatasParams).to.deep.equal({});

        let fakeDataParam: FakeDataParamVO = FakeDataParamController.getInstance().getParamFromCompteurName(var_name, 5, '2019-01-01');
        let fakeDataParamIndex: string = VarsController.getInstance().getIndex(fakeDataParam);

        VarsController.getInstance().registerDataParam(fakeDataParam);
        expect(VarsController.getInstance().registeredDatasParamsIndexes).to.deep.equal({ [fakeDataParamIndex]: 1 });
        expect(VarsController.getInstance().registeredDatasParams).to.deep.equal({ [fakeDataParamIndex]: fakeDataParam });

        VarsController.getInstance().registerDataParam(fakeDataParam);
        expect(VarsController.getInstance().registeredDatasParamsIndexes).to.deep.equal({ [fakeDataParamIndex]: 2 });
        expect(VarsController.getInstance().registeredDatasParams).to.deep.equal({ [fakeDataParamIndex]: fakeDataParam });

        VarsController.getInstance().unregisterDataParam(fakeDataParam);
        expect(VarsController.getInstance().registeredDatasParamsIndexes).to.deep.equal({ [fakeDataParamIndex]: 1 });
        expect(VarsController.getInstance().registeredDatasParams).to.deep.equal({ [fakeDataParamIndex]: fakeDataParam });

        VarsController.getInstance().unregisterDataParam(fakeDataParam);
        expect(VarsController.getInstance().registeredDatasParamsIndexes).to.deep.equal({});
        expect(VarsController.getInstance().registeredDatasParams).to.deep.equal({});

        VarsController.getInstance().unregisterVar(varConf);
    });

    it('stageUpdateData/waitingForUpdate_/debounce_update', async () => {

        let var_name: string = "varConf";
        let varConf: SimpleVarConfVO = new SimpleVarConfVO();
        varConf.id = 1;
        varConf.json_params = "{}";
        varConf.name = "varConf";
        varConf.var_data_vo_type = FakeDataVO.API_TYPE_ID;


        VarsController.getInstance().registerVar(varConf, FakeVarController.getInstance());

        let fakeDataParam: FakeDataParamVO = FakeDataParamController.getInstance().getParamFromCompteurName(var_name, 5, '2019-01-01');
        let fakeDataParamIndex: string = VarsController.getInstance().getIndex(fakeDataParam);

        expect(VarsController.getInstance().updateSemaphore_).to.equal(false);
        VarsController.getInstance().registerDataParam(fakeDataParam);
        expect(VarsController.getInstance().waitingForUpdate_).to.deep.equal({ [fakeDataParamIndex]: fakeDataParam });

        let i: number = 0;
        await ThreadHandler.getInstance().sleep(200);
        while (VarsController.getInstance().updateSemaphore_) {
            await ThreadHandler.getInstance().sleep(50);
            expect(i++).to.be.below(10);
        }
        expect(VarsController.getInstance().updateSemaphore_).to.equal(false);
        expect(VarsController.getInstance().waitingForUpdate_).to.deep.equal({});

        VarsController.getInstance().stageUpdateData(fakeDataParam);
        expect(VarsController.getInstance().waitingForUpdate_).to.deep.equal({ [fakeDataParamIndex]: fakeDataParam });

        // Normalement si on attend 100ms le batch se lance et après 10ms grand max on a le résultat
        i = 0;
        await ThreadHandler.getInstance().sleep(200);
        while (VarsController.getInstance().updateSemaphore_) {
            await ThreadHandler.getInstance().sleep(50);
            expect(i++).to.be.below(10);
        }
        expect(VarsController.getInstance().updateSemaphore_).to.equal(false);
        expect(VarsController.getInstance().waitingForUpdate_).to.deep.equal({});


        let fakeDataParam2: FakeDataParamVO = FakeDataParamController.getInstance().getParamFromCompteurName(var_name, 15, '2019-05-21');
        let fakeDataParamIndex2: string = VarsController.getInstance().getIndex(fakeDataParam);

        expect(VarsController.getInstance().updateSemaphore_).to.equal(false);
        expect(VarsController.getInstance().waitingForUpdate_).to.deep.equal({});
        VarsController.getInstance().stageUpdateData(fakeDataParam);
        expect(VarsController.getInstance().waitingForUpdate_).to.deep.equal({ [fakeDataParamIndex]: fakeDataParam });
        VarsController.getInstance().stageUpdateData(fakeDataParam2);
        expect(VarsController.getInstance().waitingForUpdate_).to.deep.equal({ [fakeDataParamIndex]: fakeDataParam, [fakeDataParamIndex2]: fakeDataParam2 });

        // Normalement si on attend 100ms le batch se lance et après 10ms grand max on a le résultat
        i = 0;
        await ThreadHandler.getInstance().sleep(200);
        while (VarsController.getInstance().updateSemaphore_) {
            await ThreadHandler.getInstance().sleep(50);
            expect(i++).to.be.below(10);
        }
        expect(VarsController.getInstance().updateSemaphore_).to.equal(false);
        expect(VarsController.getInstance().waitingForUpdate_).to.deep.equal({});

        VarsController.getInstance().unregisterVar(varConf);
    });

    it('simple addDepsToBatch + perfs', async () => {
        let var_name: string = "varConf";
        let varConf: SimpleVarConfVO = new SimpleVarConfVO();
        varConf.id = 1;
        varConf.json_params = "{}";
        varConf.name = "varConf";
        varConf.var_data_vo_type = FakeDataVO.API_TYPE_ID;


        VarsController.getInstance().registerVar(varConf, FakeVarController.getInstance());

        let fakeDataParam: FakeDataParamVO = FakeDataParamController.getInstance().getParamFromCompteurName(var_name, 5, '2019-01-01');
        let fakeDataParamIndex: string = VarsController.getInstance().getIndex(fakeDataParam);

        PerfMonController.PERFMON_RUN = true;
        expect(VarsController.getInstance().addDepsToBatch({ [fakeDataParamIndex]: fakeDataParam })).to.deep.equal({
            [fakeDataParamIndex]: fakeDataParam
        });
        expect(PerfMonController.getInstance().getLastPerfMonFuncData("addDepsToBatch").duration.asMilliseconds()).to.be.below(10);

        expect(VarsController.getInstance().addDepsToBatch({ [fakeDataParamIndex]: fakeDataParam })).to.deep.equal({
            [fakeDataParamIndex]: fakeDataParam
        });
        expect(VarsController.getInstance().addDepsToBatch({ [fakeDataParamIndex]: fakeDataParam })).to.deep.equal({
            [fakeDataParamIndex]: fakeDataParam
        });
        expect(VarsController.getInstance().addDepsToBatch({ [fakeDataParamIndex]: fakeDataParam })).to.deep.equal({
            [fakeDataParamIndex]: fakeDataParam
        });
        expect(PerfMonController.getInstance().getPerfMonFuncStat("addDepsToBatch").max_duration.asMilliseconds()).to.be.below(10);
    });


    it('simple hasDependancy + perfs', async () => {
        let var_name: string = "varConf";
        let varConf: SimpleVarConfVO = new SimpleVarConfVO();
        varConf.id = 1;
        varConf.json_params = "{}";
        varConf.name = "varConf";
        varConf.var_data_vo_type = FakeDataVO.API_TYPE_ID;


        VarsController.getInstance().registerVar(varConf, FakeVarController.getInstance());

        let fakeDataParam: FakeDataParamVO = FakeDataParamController.getInstance().getParamFromCompteurName(var_name, 5, '2019-01-01');
        let fakeDataParamIndex: string = VarsController.getInstance().getIndex(fakeDataParam);

        PerfMonController.PERFMON_RUN = true;

        let deps_by_var_id: { [from_var_id: number]: number[] } = {};
        expect(VarsController.getInstance().hasDependancy(1, null)).to.equal(false);
        expect(VarsController.getInstance().hasDependancy(2, deps_by_var_id)).to.equal(false);
        expect(VarsController.getInstance().hasDependancy(1, deps_by_var_id)).to.equal(false);
        expect(PerfMonController.getInstance().getLastPerfMonFuncData("hasDependancy").duration.asMilliseconds()).to.be.below(10);

        deps_by_var_id = { [1]: [2] };
        expect(VarsController.getInstance().hasDependancy(2, deps_by_var_id)).to.equal(true);
        expect(VarsController.getInstance().hasDependancy(1, deps_by_var_id)).to.equal(false);
        expect(PerfMonController.getInstance().getLastPerfMonFuncData("hasDependancy").duration.asMilliseconds()).to.be.below(10);

        expect(VarsController.getInstance().hasDependancy(2, deps_by_var_id)).to.equal(true);
        expect(VarsController.getInstance().hasDependancy(1, deps_by_var_id)).to.equal(false);
        expect(VarsController.getInstance().hasDependancy(2, deps_by_var_id)).to.equal(true);
        expect(VarsController.getInstance().hasDependancy(1, deps_by_var_id)).to.equal(false);
        expect(VarsController.getInstance().hasDependancy(2, deps_by_var_id)).to.equal(true);
        expect(VarsController.getInstance().hasDependancy(1, deps_by_var_id)).to.equal(false);
        expect(VarsController.getInstance().hasDependancy(2, deps_by_var_id)).to.equal(true);
        expect(VarsController.getInstance().hasDependancy(1, deps_by_var_id)).to.equal(false);
        expect(VarsController.getInstance().hasDependancy(2, deps_by_var_id)).to.equal(true);
        expect(VarsController.getInstance().hasDependancy(1, deps_by_var_id)).to.equal(false);
        expect(VarsController.getInstance().hasDependancy(2, deps_by_var_id)).to.equal(true);
        expect(VarsController.getInstance().hasDependancy(1, deps_by_var_id)).to.equal(false);
        expect(PerfMonController.getInstance().getPerfMonFuncStat("hasDependancy").max_duration.asMilliseconds()).to.be.below(10);
    });

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