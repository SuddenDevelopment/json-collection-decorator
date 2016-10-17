//only do the require thing in node, browser needs to include files individually
if (typeof window == 'undefined'){var utils = require('suddenutils');}
var _ = new utils();
var Decorator = function(objConfig){
//validate and clean config
this.config=objConfig;

var self=this;
this.decorate = function(arrData){
	'use strict';
	if(arrData.constructor !== Array){ arrData=[arrData]; }
	var arrResponse=[];
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
			if(fKeep===true && self.config.hasOwnProperty('decorate')){
				_.for(self.config.decorate,function(vDeco,kDeco){
					var fDeco=false;
					//check the condition
					if(objOperands.hasOwnProperty(vDeco.find.op)){
						fDeco=objOperands[vDeco.find.op](vDeco.find.path,vDeco.find.val,vData,{});
					}
					//it passed the condition, perform the action.
					if(fDeco===true){
						if(!vDeco.hasOwnProperty('path')){vDeco.path='';}
						if(!vDeco.hasOwnProperty('val')){vDeco.val='';}
						if(objActions.hasOwnProperty(vDeco.do.act)){
							vData = objActions[vDeco.do.act](vData,vDeco.do.path,vDeco.do.val);
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
//----====|| ACTIONS ||====----\\
	var objActions={};
	objActions.set = function(objData,strPath,varVal){ 
		_.set(objData,strPath,varVal); 
		return objData;
	};
	objActions.stack = function(objData,strPath,varVal){
		var varOld = _.get(objData,strPath);
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
//----====|| OPERANDS ||====----\\
	var objOperands={};
	objOperands.any = function(){ return true; };
	objOperands.empty = function(strPath,strNeedle,objStat,objOptions){ 
		var varVal = _.get(objStat,strPath);
		if(varVal === '' || varVal === null ){ return true;  }
	};
	objOperands.data = function(strPath,strNeedle,objStat,objOptions){ 
		var varVal = _.get(objStat,strPath);
		if(varVal !== '' && varVal !== null ){ return true;}
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
		var intCount = 0; var v=_.get(objStat,strPath);
		if(v){
			if(objOptions && objOptions.hasOwnProperty('path2')){ strNeedle=_.get(objStat,objOptions.path2); }
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
		if(objOptions && objOptions.hasOwnProperty('path2')){ varValue=_.get(objStat,objOptions.path2); }
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
		if(objOptions && typeof objOptions.reverse !== 'undefined' && objOptions.reverse === true){
			if(varValue > _.get(objStat,strPath)){ return true; }else{ return false; }
		}
	};
	//less than
	objOperands.lt =function(strPath,varValue,objStat,objOptions){
		if(objOptions && objOptions.hasOwnProperty('path2')){ varValue=_.get(objStat,objOptions.path2); }
		if(objOptions && typeof objOptions.reverse !== 'undefined' && objOptions.reverse === true){
			if(varValue < _.get(objStat,strPath)){ return true; }else{ return false; }
		}
	};

};
if (typeof module !== 'undefined' && module.exports){module.exports = Decorator;}