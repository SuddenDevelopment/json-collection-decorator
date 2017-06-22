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
            array: { ops: ['find', 'in', 'ni'], acts: ['implode', 'stack', 'unstack'] }
        };

        /*
        !!! OPTIONAL !!!
        The loadTransformOptions() function allows for calling code to specify an options template, instead of using default definitions.
        We only call loadTransformOptions() here in order to explicitly test the assembly of various transform options.
        Unless calling code WANTS to define its own matrix of transform options, then loadTransformOptions() doesn't need to be called at all.
        */
        objDec.loadTransformOptions(objTemplate)

        // Retrieve available transform options for the specified type, which in this case is just "array".
        var objTransformOptions = objDec.fnReturnOptions({ typ: 'array' });

        // These are the operands and actions we expect to be returned for the specified types, which in this case is just "ip".
        var arrExpectedOperandsForType_Array = ['any', 'data', 'empty', 'find', 'in', 'ni']
          , arrExpectedActionsForType_Array = ['copy', 'implode', 'log', 'set', 'stack', 'unstack'];

        validateResultsObject(objTransformOptions.array, arrExpectedOperandsForType_Array, arrExpectedActionsForType_Array);
    });

    it('gets options for the ip data type which inherits from the string data type', function() {
        var objDec = new Decorator({ filters: [], decorate: [], suppressTransformOptionLoad: true });
        var objTemplate = {
            string: { ops: ['ne', 'eq'], acts: ['prepend', 'append'] },
            ip: { extends: 'string', ops: [], acts: ['bigInt'], excludesActions: ['prepend', 'log'] }
        };

        /*
        !!! OPTIONAL !!!
        The loadTransformOptions() function allows for calling code to specify an options template, instead of using default definitions.
        We only call loadTransformOptions() here in order to explicitly test the assembly of various transform options.
        Unless calling code WANTS to define its own matrix of transform options, then loadTransformOptions() doesn't need to be called at all.
        */
        objDec.loadTransformOptions(objTemplate)

        // Retrieve available transform options for the specified type, which in this case is just "ip".
        var objTransformOptions = objDec.fnReturnOptions({ typ: 'ip' });

        // These are the operands and actions we expect to be returned for the specified types, which in this case is just "ip".
        var arrExpectedOperandsForType_Ip = ['any', 'data', 'empty', 'eq', 'ne']
          , arrExpectedActionsForType_Ip = ['append', 'bigInt', 'copy', 'set'];

        validateResultsObject(objTransformOptions.ip, arrExpectedOperandsForType_Ip, arrExpectedActionsForType_Ip);
    });

    it('gets options for the multiple types', function() {
        var objDec = new Decorator({ filters: [], decorate: [], suppressTransformOptionLoad: true });
        var objTemplate = {
            number: { ops: ['eq', 'ne', 'gt', 'lt'], acts: ['add'] }, // No options for this data type will be returned from fnReturnOptions(), since "number" is not present in any of the "type" fields in the object that's passed to fnReturnOptions()
            string: { ops: ['eq', 'ne', 'in', 'ni'], acts: ['append', 'prepend', 'explode'] },
            ip: { extends: 'string', ops: [], acts: ['bigInt'], excludesActions: ['prepend', 'log'] },
            url: { extends: 'string', ops: [], acts: ['parse'], excludesActions: ['append', 'explode'] }
        };

        /*
        !!! OPTIONAL !!!
        The loadTransformOptions() function allows for calling code to specify an options template, instead of using default definitions.
        We only call loadTransformOptions() here in order to explicitly test the assembly of various transform options.
        Unless calling code WANTS to define its own matrix of transform options, then loadTransformOptions() doesn't need to be called at all.
        */
        objDec.loadTransformOptions(objTemplate)

        // Retrieve available transform options for the specified types, which in this case includes: string, ip, url
        var objTransformOptions = objDec.fnReturnOptions({ typ: 'string', dataTypes: ['ip', 'url'] });

        // These are the operands and actions that we expect to be returned for the "string" data type.
        var arrExpectedOperandsForType_String = ['any', 'data', 'empty', 'eq', 'in', 'ne', 'ni']
          , arrExpectedActionsForType_String = ['append', 'copy', 'explode', 'log', 'prepend', 'set'];

        // These are the operands and actions that we expect to be returned for the "ip" data type.
        var arrExpectedOperandsForType_Ip = ['any', 'data', 'empty', 'eq', 'in', 'ne', 'ni']
          , arrExpectedActionsForType_Ip = ['append', 'bigInt', 'copy', 'explode', 'set'];

        // These are the operands and actions that we expect to be returned for the "url" data type.
        var arrExpectedOperandsForType_Url = ['any', 'data', 'empty', 'eq', 'in', 'ne', 'ni']
          , arrExpectedActionsForType_Url = ['copy', 'log', 'parse', 'prepend', 'set'];

        /*
        Options are returned for types "string", "ip", and "url"
        ...since those types were declared in the "typ" and "dataTypes" fields in the argument object that was passed to fnReturnOptions() above
        */
        validateResultsObject(objTransformOptions.string, arrExpectedOperandsForType_String, arrExpectedActionsForType_String);
        validateResultsObject(objTransformOptions.ip, arrExpectedOperandsForType_Ip, arrExpectedActionsForType_Ip);
        validateResultsObject(objTransformOptions.url, arrExpectedOperandsForType_Url, arrExpectedActionsForType_Url);
    });

});
