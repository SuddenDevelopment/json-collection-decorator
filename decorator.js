//only do the require thing in node, browser needs to include files individually
if (typeof window === 'undefined'){var utils = require('suddenutils'); }
//var URL = require('url-parse');}
var _ = new utils();
var Decorator = function(objConfig){
var self=this;
this.decorate = function(arrData){
	'use strict';
	if(arrData.constructor !== Array){ arrData=[arrData]; }
	var arrResponse=[];
	var objOptions ={};
	//loop through the collection
	//console.log(self.config);
	_.for(arrData,function(vData,kData){
		//look at the filters
		var fKeep=true;
		if(self.config.hasOwnProperty('filters') && self.config.filters.length > 0){
			//loop through the filters
			_.for(self.config.filters,function(vFilter,kFilter){
				if(fKeep===true){
					if(!vFilter.hasOwnProperty('val')){vFilter.val='';}
					//quick value check for security and cleanliness
					if(objOperands.hasOwnProperty(vFilter.op)){
						fKeep=objOperands[vFilter.op](vFilter.path,vFilter.val,vData,{});
					}
				}else{}
			});
		}
			//made it past the filter, now decorate
			if(fKeep===true && self.config.hasOwnProperty('decorate') && self.config.decorate.length > 0){
				_.for(self.config.decorate,function(vDeco,kDeco){
					var intDeco=vDeco.find.length;
					if(intDeco > 0){
						_.for(vDeco.find,function(vFind,kFind){
						//console.log(vFind);
						//check the condition
							if(vFind.hasOwnProperty('op') && objOperands.hasOwnProperty(vFind.op)){ 
								if(objOperands[vFind.op](vFind.path,vFind.val,vData,{"path2":vFind.path2,"val2":vFind.val2}) === true)
									{ intDeco--; }
							}
						});
						if(intDeco===0){
							//it passed the condition, perform ALL the actions.
							_.for(vDeco.do,function(vDo,kDo){
								if(objActions.hasOwnProperty(vDo.act)){
									vData = objActions[vDo.act](vData,vDo.path,vDo.val);
								}
							});
						}
					}
				});
			}
		if(fKeep===true){
			//all decorations complete, add to the return collection
			arrResponse.push(vData);
		}
	});
	return arrResponse;
};

//----====|| Get Options ||====----\\
this.fnReturnOptions=function(objConfig){
	/*
	this object is a subset of what is in suddenschema, it has a lot more values that can be ignored.
	data types come from the library datatypetester https://github.com/SuddenDevelopment/dataTypeTester
	{
		 typ: "string"
		,dataTypes:["ip"]
		,min: 15
		,max: 15
	}
	*/
	//objConfig is expected to be an ovject with shce info filled in for a data field, probably from suddenschema
	//the more data returned the narrower the results can be
	var objResults={
		 "ops":[]
		,"acts":[]
	};
	//populate the operands that make sense

	//populate the actions that make sense

	//for now return ALL
	objResults.ops=objOperands.keys;
	objResults.acts=objActions.keys;

	return objResults;
};
//----====|| Validate and Update Config ||====----\\
this.fnUpdateConfig=function(objConfig){ 
	//console.log('fnUpdateConfig',objConfig);
	//consistent format
	if(objConfig.filters.constructor !== Array){ objConfig.filters=[objConfig.filters]; }
	if(objConfig.decorate.constructor !== Array){ objConfig.decorate=[objConfig.decorate]; }
	var fOk=true;
	//check the filters
	for(var i=0; i<objConfig.filters.length;i++){
		if(fOk===true){ fOk = fnValidFilter(objConfig.filters[i]); }
	}
	//check the decorators
	for(var i=0; i<objConfig.decorate.length;i++){
		//set the decorator parts to arrays
		if(objConfig.decorate[i].find.constructor !== Array){ objConfig.decorate[i].find=[objConfig.decorate[i].find]; }
		if(objConfig.decorate[i].do.constructor !== Array){ objConfig.decorate[i].do=[objConfig.decorate[i].do]; }
		//console.log(objConfig.decorate[i].find,objConfig.decorate[i].do);
		//set defaults
		for(var ii=0;ii<objConfig.decorate[i].do.length;ii++){
			if(typeof objConfig.decorate[i].do[ii].path === 'undefined'){objConfig.decorate[i].do[ii].path='';}
			if(typeof objConfig.decorate[i].do[ii].val === 'undefined'){objConfig.decorate[i].do[ii].val='';}
		}
		if(fOk===true){ fOk = fnValidDecorator(objConfig.decorate[i]); }
	}
	if(fOk===true){ 
		self.config=objConfig;
		return true; 
	}
	else{ return false; }
}

var fnValidFilter=function(objFilter){
	//dont worry about the keys, if it doesnt exist, it doesnt apply. no big deal
	//check Operands
	return fnValidOperand(objFilter.op);
};
var fnValidDecorator=function(objDecorator){
	var fOk=true;
	//dont worry about the key/field existing
	//each decorator can have multiple filters ".find" and multiple actions ".do"
	//make sure the filter operands and values check out
	for(var i=0;i<objDecorator.find.length;i++){
		if(fOk===true){
			fOk=fnValidFilter(objDecorator.find[i]);
		}
	}
	//make sure the actions mentioned exist and any values given to actions are valid
	for(var i=0;i<objDecorator.do;i++){
		if(fOk===true && typeof objActions[objDecorator.do[i].act] !== 'undefined')
			{ return true; }else{ return false; }
	}
	return fOk;
};

var fnValidOperand=function(strOperand,strValue){
	if(typeof objOperands[strOperand] !== 'undefined'){ return true; }else{ return false; }
};

//----====|| ACTIONS ||====----\\
	var objActions={};
	objActions.log = function(objData,strPath,varVal){
		console.log(objData,strPath,varVal);
	}
	objActions.set = function(objData,strPath,varVal){
		console.log('set: ',objData,strPath,varVal);
		_.set(objData,strPath,varVal); 
		return objData;
	};
	objActions.stack = function(objData,strPath,varVal){
		var varOld = _.get(objData,strPath);
		if(varOld===null){varOld=[];}
		//stack is for arrays, if it WAS a string it's an array now :)
		if(varOld.constructor !== Array){ varOld=[varOld]; }
		varOld.push(varVal);
		_.set(objData,strPath,varOld);
		return objData;
	};
	objActions.unstack = function(objData,strPath,varVal){
		var varOld = _.get(objData,strPath);
		var intIndex = -1;
		//stack is for arrays, if it WAS a string it's an array now :)
		if(varOld.constructor !== Array){ _.set(objData,strPath,[]); }
		else{
			//find matching value
			_.for(varOld,function(v,k){ if(v===varVal){ intIndex=k; } });
			//remove it from the array
			if(intIndex !== -1){ varOld.splice(strCompKey,1); }
			_.set(objData,strPath,varOld);
			return objData;
		}
	};
	objActions.add = function(objData,strPath,varVal){
		var intOld = parseInt(_.get(objData,strPath));
		_.set(objData,strPath,intOld+varVal); 
		return objData;
	};
	objActions.copy = function(objData,strPath,varVal){
		_.set(objData,strPath,_.get(objData,varVal)); 
		return objData;
	};
	objActions.prepend = function(objData,strPath,varVal){
		var strOld = _.get(objData,strPath);
		_.set(objData,strPath,varVal+strOld);
		return objData;
	};
	objActions.append = function(objData,strPath,varVal){
		var strOld = _.get(objData,strPath);
		_.set(objData,strPath,strOld+varVal);
		return objData;
	};
	objActions.remove = function(objData,strPath,varVal){
		_.del(objData,strPath);
		return objData;
	};
	objActions.rename = function(objData,strPath,varVal){
		_.set(objData,varVal,_.get(objData,strPath));
		_.del(objData,strPath);
		return objData;
	};
	objActions.prioritize = function(objData,strPath,intVal){
		if(typeof intval === 'undefined'){intVal=1;}
		if(!objData.hasOwnProperty('_priority')){ obj._priority=parseInt(intVal); }
		return objData;
	};
	objActions.focus = function(objData,arrPath,varVal){
		//if it's not listed in the arrPath array, don't keep it.
		//TODO quickly and dynamically determine if it's faster to create a new object or remove unwanted fields
		var newObject = {};
		if(arrPath.constructor !== Array){ arrPath=[arrPath]; }
		_.for(arrPath,function(strPath,k){
			_.set(newObject,strPath,_.get(objData,strPath));
		});
		return newObject;
	};
	objActions.rand = function(objData,strPath,varVal){
		//set a random integer value given a min and max from varVal as [min,max]
		var intRandom = Math.random() * (varVal[1] - varVal[0]) + varVal[0];
		_.set(objData,strPath,intRandom);
		return objData;
	};
	objActions.implode = function(objData,strPath,varVal){
		if(objData[strPath].constructor === Array){ objData[strPath].toString(); }
		return objData;
	};
	objActions.explode = function(objData,strPath,varVal){
		if(varVal===''){varVal=',';}
		objData[strPath] = objData[strPath].split(varVal); 
		return objData;
	};
	objActions.findCopy = function(objData,strPath,varVal){
		//get the array mentioned in path
		var fKeep=false;
		var arrHaystack = _.get(objData,varVal.path);
		if(arrHaystack !== null && arrHaystack.constructor === Array && arrHaystack.length > 0){
			_.for(arrHaystack,function(v,k){
				if(fKeep===false && fKeep !== null){ fKeep = _.get(v,varVal.path2); }
			});
		}
		_.set(objData,strPath,fKeep);
		//console.log(fKeep);
		return objData;
	};
//----====|| DATA TYPE ACTIONS ||====----\\
objTypeActions.url.parse = function(objData,strPath,varVal){
		//this requires https://github.com/unshiftio/url-parse
		//console.log(objData,strPath,varVal);
		var objUrl = new URL(_.get(objData,strPath));
		_.set(objData,varVal,objUrl);
		return objData;
	};
objTypeActions.ip.bigint=function(){
	//convert a string ip to a bigint
}
//----====|| OPERANDS ||====----\\
	var objOperands={};
	objOperands.any = function(){ return true; };
	objOperands.find=function(strPath,objFind,objStat,objOptions){ 
		//this expects an array to exist, and the nested comparison to be on objects beneath it
		var fKeep=false;
		var arrHaystack = _.get(objStat,strPath);
		if(arrHaystack !== null && arrHaystack.constructor === Array && arrHaystack.length > 0){
			_.for(arrHaystack,function(v,k){
				if(fKeep===false){ fKeep = objOperands[objFind.op](objFind.path,objFind.val,v,{}); }
			});
			return fKeep;
		}

	}
	objOperands.empty = function(strPath,strNeedle,objStat,objOptions){
		var varVal = _.get(objStat,strPath);
		if(varVal === '' || varVal === null ){ return true;  }
	};
	objOperands.data = function(strPath,strNeedle,objStat,objOptions){ 
		var varVal = _.get(objStat,strPath);
		if(varVal !== '' && varVal !== null && typeof varVal !== 'undefined'){ return true; }
	};
	objOperands.in = function(strPath,strNeedle,objStat,objOptions){ 
		var intCount = 0; var v=_.get(objStat,strPath);
		if(objOptions && objOptions.hasOwnProperty('path2')){ strNeedle=_.get(objStat,objOptions.path2); }
		if(v.constructor === Array){v=v.join();}
		intCount = _.strCount(strNeedle,v);
		if(objOptions.reverse === true){  
			//filter out objects that match
			if(intCount===0){ return true; }else{return false;}
		}else{
			//filter out objects that dont match
			if(intCount>0){ return true; }else{return false;}
		}
	};
	objOperands.has = function(strPath,strNeedle,objStat,objOptions){ 
		//{path:"user",op:"has",val:".",val2:3}
		var intCount = 0; var v=_.get(objStat,strPath);
		if(v){
			if(objOptions && objOptions.hasOwnProperty('path2')){ strNeedle=_.get(objOptions.path2); }
			if(v.constructor === Array){v=v.join();}
			intCount = _.strCount(strNeedle,v);
			if(objOptions.reverse === true){  
				//filter out objects that match
				if(intCount!==objOptions.val2){ return true; }else{return false;}
			}else{
				//filter out objects that dont match
				if(intCount===objOptions.val2){ return true; }else{return false;}
			}
			//add in a little error logging when something defined for stats is not found.
		}else{ console.log('path: ',strPath, ' not found in: ' ,objStat); }
	};
	objOperands.eq = function(strPath,varValue,objStat,objOptions){
		//console.log(strPath,varValue,objStat,objOptions);
		if(typeof objOptions.path2 !== 'undefined'){  varValue=_.get(objStat,objOptions.path2); }
		if(objOptions && typeof objOptions.reverse !== 'undefined' && objOptions.reverse === true){
			//filter out what does match
			if(varValue !== _.get(objStat,strPath)){ return true; }else{ return false; }
		}else{
		//filter out what doesnt match
			//console.log('val:',varValue,'path:',strPath,'stat:',objStat,'result:',_.get(objStat,strPath));
			if(varValue === _.get(objStat,strPath)){ return true; }else{ return false; }
		}
	};
	objOperands.ni = function(strPath,varValue,objStat,objOptions){ 
		objOptions.reverse=true;
		return objOperands.in(strPath,varValue,objStat,objOptions); 
	};
	objOperands.ne = function(strPath,varValue,objStat,objOptions){ 
		objOptions.reverse=true;
		return objOperands.eq(strPath,varValue,objStat,objOptions); 
	};

	//greater than
	objOperands.gt =function(strPath,varValue,objStat,objOptions){
		if(objOptions && objOptions.hasOwnProperty('path2')){ varValue=_.get(objStat,objOptions.path2); }
		if(varValue > _.get(objStat,strPath)){ return true; }else{ return false; }
	};
	//less than
	objOperands.lt =function(strPath,varValue,objStat,objOptions){
		if(objOptions && objOptions.hasOwnProperty('path2')){ varValue=_.get(objStat,objOptions.path2); }
		if(varValue < _.get(objStat,strPath)){ return true; }else{ return false; }
		
	};

	//----====|| INIT ||====----\\
	if(typeof objConfig === 'undefined'){objConfig={filters:[],decorate:[]}}
	//validate and clean config
	self.fnUpdateConfig(objConfig);
};
if (typeof module !== 'undefined' && module.exports){module.exports = Decorator;}