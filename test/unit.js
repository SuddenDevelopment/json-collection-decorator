var assert        = require("assert");
var should        = require("should");
var Decorator   = require("../decorator");

describe('simplest test', function () {
 it('filter a value, set a value', function (done) {
    //test
    var objConfig={
    	filters:[{path:'name',op:'ne',val:'anthony'}]
    	,decorate:[{
    		find:{path:'name',op:'eq',val:'sam'}
    		,do:{path:'hobby',act:'set',val:'cats'}
    	   
        },{
                find:{path:"name",op:"any"}
                ,do:{path:"name",act:"rename",val:"_nick"}
            }]
    }
    var arrData=[
    	 {name:'anthony',hobby:'this'}
    	,{name:'sam',hobby:'dogs'}
    ];

    var objBelt = new Decorator(objConfig);
    var arrResults = objBelt.decorate(arrData);
    //check
    console.log(arrResults);
   (arrResults[0].hobby).should.be.exactly('cats');
   done();
 });
});

describe('Available Transforms', function() {

    //----====|| Helper Functions ||====----\\

    function validateResultsObject(objResults, expectedOperands, expectedActions) {
        objResults.should.be.an.Object;

        should.exist(objResults.ops);
        should.exist(objResults.acts);

        objResults.ops.should.be.an.Array;
        objResults.acts.should.be.an.Array;

        objResults.ops.length.should.equal(expectedOperands.length);
        objResults.acts.length.should.equal(expectedActions.length);

        checkArrayEquality(objResults.ops, expectedOperands);
        checkArrayEquality(objResults.acts, expectedActions);
    }

    function checkArrayEquality(arrGenerated, arrExpected) {

        arrExpected.forEach(function(item, index) {
            item.should.equal(arrGenerated[index]);
        });

        arrGenerated.forEach(function(item, index) {
            item.should.equal(arrExpected[index]);
        });
    }

    //----====|| TESTS ||====----\\

    it('returns all possible options in the absence of a config', function() {
        var objDec = new Decorator();
        var objTransformOptions = objDec.fnReturnOptions();
        objTransformOptions.should.be.an.Object;
        should.exist(objTransformOptions.all);
        validateResultsObject(objTransformOptions.all, objDec.getAllAvailableOperands(), objDec.getAllAvailableActions());
    });

    it('returns all possible options for configs that don\'t specify the data type field', function() {
        var objDec = new Decorator();
        var objTransformOptions = objDec.fnReturnOptions({ noTypeFieldIncluded: true });
        objTransformOptions.should.be.an.Object;
        should.exist(objTransformOptions.all);
        validateResultsObject(objTransformOptions.all, objDec.getAllAvailableOperands(), objDec.getAllAvailableActions());
    });

    it('suppresses the loading of transform options at instantiation', function() {
        var objDec = new Decorator({ filters: [], decorate: [], suppressTransformOptionLoad: true });
        assert.equal(objDec.getAllAvailableTransformOptions(), null);
    });

    it('triggers the loading of transform options at instantiation', function() {
        var objDec1 = new Decorator({ filters: [], decorate: [] })
          , objDec2 = new Decorator({ filters: [], decorate: [], suppressTransformOptionLoad: false });

        objDec1.getAllAvailableTransformOptions().should.be.an.Object;
        objDec2.getAllAvailableTransformOptions().should.be.an.Object;
    });

    it('gets options for the array data type in isolation', function() {
        var objDec = new Decorator({ filters: [], decorate: [], suppressTransformOptionLoad: true });
        var objTemplate = {
            array: { ops: ['in', 'has'], acts: ['implode'] }
        };

        objDec._loadTransformOptions(objTemplate)

        var objTransformOptions = objDec.fnReturnOptions({ typ: 'array' });
        validateResultsObject(objTransformOptions.array, ['has', 'in'], ['implode', 'log']);
    });

    it('gets options for the ip data type which inherits from the string data type', function() {
        var objDec = new Decorator({ filters: [], decorate: [], suppressTransformOptionLoad: true });
        var objTemplate = {
            string: { ops: ['ne', 'eq'], acts: ['prepend', 'append'] },
            ip: { extends: 'string', ops: [], acts: [], excludesActions: ['prepend', 'log'] }
        };

        objDec._loadTransformOptions(objTemplate)

        var objTransformOptions = objDec.fnReturnOptions({ typ: 'ip' });
        validateResultsObject(objTransformOptions.ip, ['eq', 'ne'], ['append']);
    });

});
