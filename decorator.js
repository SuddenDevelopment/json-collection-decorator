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
			if(fKeep===true && typeof self.config.decorate !=='undefined' && self.config.decorate.length > 0){
				for(var i=0;i<self.config.decorate.length;i++){
					var vDeco=self.config.decorate[i];
					var intDeco=vDeco.find.length;
					if(intDeco > 0){
						for(var ii=0;ii<vDeco.find.length;ii++){
							var vFind=vDeco.find[ii];
							//check the condition
							if(typeof vFind.op !== 'undefined' && typeof objOperands[vFind.op] !== 'undefined'){ 
								if(objOperands[vFind.op](vFind.path,vFind.val,vData,{"path2":vFind.path2,"val2":vFind.val2}) === true)
									{ 
										//decrement through what needs to be checked
										intDeco--; 
									}
							}
						}
						if(intDeco===0){
							//it passed the condition, perform ALL the actions.
							for(var ii=0;ii<vDeco.do.length;ii++){
								var vDo=vDeco.do[ii];
								if(typeof objActions[vDo.act] !== 'undefined'){
									vData = objActions[vDo.act](vData,vDo.path,vDo.val);
								}
							}
						}
					}
				}
			}
		if(fKeep===true){
			//all decorations complete, add to the return collection
			arrResponse.push(vData);
		}
	});
	return arrResponse;
};

//----====|| Transform Options ||====----\\
var _objTransformOptions = null;
var _arrAvailableOperands = [];
var _arrAvailableActions = [];

/*
These options are used to augment all of the transform options by default.
For example, the "log" action should be available to every data type.
*/
var _objGlobalDataTypeOptions = { ops: ['any', 'data', 'empty'], acts: ['copy', 'log', 'set'] };

/*
NOTE: the order of the sections in this object is important here. "Base" types must be defined before "extended" types.
*/
var _objDataTypeOptionsTemplate = {
	// Base Types Section - these can be used on their own or serve as building blocks for composing more specific types 
	number: { ops: ['eq', 'ne', 'gt', 'lt'], acts: ['add', 'focus'] },
	string: { ops: ['eq', 'ne', 'in', 'ni'], acts: ['append', 'prepend', 'explode', 'focus'] },
	array: { ops: ['find', 'in', 'ni', 'length'], acts: ['implode', 'stack', 'unstack','arrs2objs', 'focus'] },
	object: { ops: [], acts: ['findCopy', 'focus', 'prioritize', 'rand', 'remove', 'rename'] },
	boolean: { ops: ['eq', 'ne'], acts: ['focus'] },

	// Extended Types Section - these are more narrowly-defined data types that build off of base types.
	unixtime: { extends: 'number', ops: [], acts: [] },
	millitime: { extends: 'number', ops: [], acts: [] },
	ip: { extends: 'string', ops: [], acts: ['bigInt'] },
	email: { extends: 'string', ops: [], acts: [] },
	url: { extends: 'string', ops: [], acts: ['parse'] },
	domain: { extends: 'string', ops: [], acts: [] },
	image: { extends: 'string', ops: [], acts: [] },
	md5: { extends: 'string', ops: [], acts: [] },
	sha1: { extends: 'string', ops: [], acts: [] },
	sha256: { extends: 'string', ops: [], acts: [] },
	country_code: { extends: 'string', ops: [], acts: [] }
};

self._loadTransformOptions = function(optionsTemplate) {

	_objTransformOptions = {}
	_arrAvailableOperands = Object.keys(objOperands).sort();
	_arrAvailableActions = Object.keys(objActions).sort();

	function extendOptions(dataType, optionType, availableOptions, excludedOptions) {
		// Adds each available option to the data type's transform options unless it's been explicitly excluded
		availableOptions.forEach(function(option) {
			if (_objTransformOptions[dataType][optionType].indexOf(option) === -1 && excludedOptions.indexOf(option) === -1) {
				_objTransformOptions[dataType][optionType].push(option);
			}
		});
	}

	for (var dataType in optionsTemplate) {

		var transformTemplate = optionsTemplate[dataType]
		  , excludedOperands = transformTemplate.excludesOperands || []
		  , excludedActions = transformTemplate.excludesActions || [];

		_objTransformOptions[dataType] = { ops: [], acts: [] };

		// Start by including the global options
		extendOptions(dataType, 'ops', _objGlobalDataTypeOptions.ops, excludedOperands, true);
		extendOptions(dataType, 'acts', _objGlobalDataTypeOptions.acts, excludedActions, true);

		if (transformTemplate.extends) {
			if (!Array.isArray(transformTemplate.extends)) {
				if (typeof transformTemplate.extends === 'string') {
					// Strings get wrapped by an array so that subsequent handling can assume an array of strings
					transformTemplate.extends = [transformTemplate.extends];
				} else {
					// Anything other than a string or an array should throw an exception
					throw new TypeError('Misconfigured transform: "' + dataType + '" -> "extends" field must be null, an array, or a string.')
				}
			}

			transformTemplate.extends.forEach(function(parentName) {
				var parent = _objTransformOptions[parentName];
				extendOptions(dataType, 'ops', parent.ops, excludedOperands);
				extendOptions(dataType, 'acts', parent.acts, excludedActions);
			});

			// Add additional ops and acts
			extendOptions(dataType, 'ops', optionsTemplate[dataType].ops, excludedOperands);
			extendOptions(dataType, 'acts', optionsTemplate[dataType].acts, excludedActions);
		} else {
			// Ensures that base transform types are cloned from the template to the "instantiation" (i.e. _objTransformOptions)
			extendOptions(dataType, 'ops', optionsTemplate[dataType].ops, excludedOperands);
			extendOptions(dataType, 'acts', optionsTemplate[dataType].acts, excludedActions);
		}

		_objTransformOptions[dataType].ops.sort();
		_objTransformOptions[dataType].acts.sort();
	}
};

self.fnReturnOptions = function(objDataTypeConfig) {
	/*
	Expects an object that contains fields `typ` and `dataTypes`.

	`typ` is expected to be a string representing a common JavaScript data type: string, number, array, object, boolean
	This field will always be present and populated.

	`dataTypes` is expected to be an array of strings representing various specific ("extended") data types, such as: ip, email, unixtime, etc.
	This field will always be present, but may be empty.

	This function should assemble the contents of the `typ` and `dataTypes` fields, determine the available options for each type,
	and then return this as a JavaScript object with the following format:
	{
	type1: { ops: [], acts: [] },
	type2: { ops: [], acts: [] },
	type3: { ops: [], acts: [] }
	}
	*/

	function assembleTargetedDataTypes(dataTypeConfig) {
		var types = [];

		if (dataTypeConfig.typ) {
			types.push(dataTypeConfig.typ);
		}

		if (dataTypeConfig.dataTypes && dataTypeConfig.dataTypes.length > 0) {
			dataTypeConfig.dataTypes.forEach(function(type) {
				if (typeof type === 'string') {
					types.push(type);
				} else if (Array.isArray(type)) {
					type.forEach(function(t) {
						types.push(t);
					});
				}
			});
		}

		return types;
	}

	var objConfigType = typeof objDataTypeConfig;
	if (!objConfigType || objConfigType !== 'object') {
		objDataTypeConfig = {};
	}

	var arrTargetedTypes = assembleTargetedDataTypes(objDataTypeConfig);

	// Return all possible options if no type (or an unknown type) was specified. No need to proceed further.
	if (arrTargetedTypes.length === 0) {
		return {
			all: {
				ops: _arrAvailableOperands,
				acts: _arrAvailableActions
			}
		}
	}
	// Load the transform options if they haven't been already.
	else if (!_objTransformOptions) {
		self._loadTransformOptions(_objDataTypeOptionsTemplate);
	}

	var objResults = {};

	arrTargetedTypes.forEach(function(type) {
		objResults[type] = {
			ops: _objTransformOptions[type].ops,
			acts: _objTransformOptions[type].acts
		};
	});

	return objResults;
};

// Makes certain data accessible to client code. Currently, mostly used for comprehensive unit testing.
self.loadTransformOptions = function(optionsTemplate) { self._loadTransformOptions(optionsTemplate); };
self.getBaseOptionsTemplate = function() { return _objDataTypeOptionsTemplate; };
self.getAllAvailableTransformOptions = function() { return _objTransformOptions; };
self.getAllAvailableGlobalOptions = function() { return _objGlobalDataTypeOptions; };
self.getAllAvailableOperands = function() { return _arrAvailableOperands; };
self.getAllAvailableActions = function() { return _arrAvailableActions; };

//----====|| Validate and Update Config ||====----\\
this.fnUpdateConfig=function(objConfig){ 
	//console.log('fnUpdateConfig',objConfig);
	//consistent format
	if(typeof objConfig.filters === 'undefined'){ objConfig.filters=[]; }
	if(typeof objConfig.decorate === 'undefined'){ objConfig.decorate=[]; }
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
	objActions.parse = function(objData,strPath,varVal){
		//this requires https://github.com/unshiftio/url-parse
		//console.log(objData,strPath,varVal);
		var objUrl = new URL(_.get(objData,strPath));
		_.set(objData,varVal,objUrl);
		return objData;
	};
	objActions.bigInt=function(objData,strPath,varVal){
		//convert a string ip to a bigint

	}
	objActions.arrs2objs=function(objData,strPath,varVal){
		//console.log(strPath,varVal,objData)
		//convert an array of arrays to an array of objects
		var arrOut=[];
		if(objData[strPath].constructor === Array){
			//console.log('arrrs2objs array found where expected');
			for(var i=0;i<objData[strPath].length;i++){
				//for each child array
				if(objData[strPath][i].constructor === Array){
					//console.log('arrrs2objs child array found where expected');
					var objOut={};
					//for each item in that child array
					for(var ii=0;ii<objData[strPath][i].length;ii++){
						objOut[ii]=objData[strPath][i][ii];
					}
					arrOut.push(objOut);
				}
			}
		}
		//console.log(objData,strPath,arrOut);
		_.set(objData,strPath,arrOut);
		
		return objData;
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
	objOperands.length = function(strPath,intNeedle,objStat,objOptions){
		var varVal = _.get(objStat,strPath);
		if(varVal !== null && varVal.constructor === Array){
			if(varVal.length === intNeedle){ return true; }
		}
	};
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
	// NOTE - this seems like an incomplete version of the "in" operand
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

	// Load all possible transform options immediately unless explicitly suppressed by calling code
	if (!objConfig.suppressTransformOptionLoad) {
		self._loadTransformOptions(_objDataTypeOptionsTemplate);
	}
};
if (typeof module !== 'undefined' && module.exports){module.exports = Decorator;}