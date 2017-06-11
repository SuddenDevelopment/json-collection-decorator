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

describe('available transforms', function() {

    //----====|| Helper Data ||====----\\
    var allOperands = [
        'any', 'find', 'empty', 'data', 'in', 'has', 'eq', 'ni', 'ne', 'gt', 'lt'
    ]
    .sort();

    var allActions = [
        'log', 'set', 'stack', 'unstack', 'add', 'copy', 'prepend', 'append', 'remove', 'rename',
        'prioritize', 'focus', 'rand', 'implode', 'explode', 'findCopy'
    ]
    .sort();

    //----====|| Helper Functions ||====----\\
    function validateResultsObject(arrResults) {
        arrResults.should.be.an.Object;

        should.exist(arrResults.ops);
        should.exist(arrResults.acts);

        arrResults.ops.should.be.an.Array;
        arrResults.acts.should.be.an.Array;

        arrResults.ops.sort().forEach(function(item, index) {
            item.should.equal(allOperands[index]);
        });

        arrResults.acts.sort().forEach(function(item, index) {
            item.should.equal(allActions[index]);
        });
    }

    function checkArrayEquality(arrGenerated, arrExpected) {
        arrExpected.forEach(function(item, index) {
            item.should.equal(arrGenerated[index]);
        });
    }


    //----====|| TESTS ||====----\\

    it('get all - no objConfig passed', function() {
        var dec = new Decorator();
        var arrResults = dec.fnReturnOptions();
        validateResultsObject(arrResults);
        checkArrayEquality(arrResults.ops.sort(), allOperands);
        checkArrayEquality(arrResults.acts.sort(), allActions);
    });

    it('get all - bad config passed (no targetType field included)', function() {
        var dec = new Decorator();
        var arrResults = dec.fnReturnOptions({ noTargetTypeFieldIncluded: true });
        validateResultsObject(arrResults);
        checkArrayEquality(arrResults.ops.sort(), allOperands);
        checkArrayEquality(arrResults.acts.sort(), allActions);
    });

    it('get all - unrecognized targetType', function() {
        var dec = new Decorator();
        var arrResults = dec.fnReturnOptions({ targetType: 'somethingYouDontEvenKnowAbout' });
        validateResultsObject(arrResults);
        checkArrayEquality(arrResults.ops.sort(), allOperands);
        checkArrayEquality(arrResults.acts.sort(), allActions);
    });

});
