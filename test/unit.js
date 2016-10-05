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