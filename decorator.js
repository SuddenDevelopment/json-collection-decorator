'use strict';
//only do the require thing in node, browser needs to include files individually
if (typeof window == 'undefined'){var utils = require('suddenutils');}
var _ = new utils;
var Decorator = function(objConfig){
//validate and clean config
this.config=objConfig;

var self=this;
this.decorate = function(arrData){
	if(arrData.constructor !== Array){ arrData=[arrData]; }
	var arrResponse=[];
	//loop through the collection
	//console.log(self.config);
	_.for(arrData,function(vData,kData){
		//look at the filters
		if(self.config.hasOwnProperty('filters') && self.config.filters.length > 0){
			var fKeep=true;
			//loop through the filters
			_.for(self.config.filters,function(vFilter,kFilter){
				if(fKeep===true){
					fKeep=objOperands[vFilter.op](vFilter.path,vFilter.val,vData,{});
				}else{}
			});
			//made it past the filter, now decorate
			if(fKeep===true){
				_.for(self.config.decorate,function(vDeco,kDeco){
					var fDeco=false;
					//check the condition
					fDeco=objOperands[vDeco.find.op](vDeco.find.path,vDeco.find.val,vData,{});
					//it passed the condition, perform the action.
					if(fDeco===true){
						objActions[vDeco.do.act](vData,vDeco.do.path,vDeco.do.val);
					}
				});
				//all decorations complete, add to the return collection
				arrResponse.push(vData);
			}
		}
	});
	return arrResponse;
}
//----====|| ACTIONS ||====----\\
	var objActions={};
	objActions.set = function(objData,strPath,varVal){ _.set(objData,strPath,varVal); }
	objActions.stack = function(objData,strPath,varVal){
		var varOld = _.get(objData,strPath);
		//stack is for arrays, if it WAS a string it's an array now :)
		if(varOld.constructor !== Array){ varOld=[varOld]; }
		varOld.push(varVal);
		_.set(objData,strPath,varOld);
	}
	objActions.add = function(objData,strPath,varVal){ 
		var intOld = parseInt(_.get(objData,strPath));
		_.set(objData,strPath,intOld+varVal); 
	}
	objActions.prepend = function(objData,strPath,varVal){ 
		var strOld = _.get(objData,strPath);
		_.set(objData,strPath,varVal+strOld); 
	}
	objActions.append = function(objData,strPath,varVal){ 
		var strOld = _.get(objData,strPath);
		_.set(objData,strPath,strOld+varVal); 
	}
	objActions.remove = function(objData,strPath,varVal){ 
		_.del(objData,strPath); 
	}
	objActions.prioritize = function(objData,intVal){ 
		if(typeof intval === 'undefined'){var intVal=1;}
		if(!objData.hasOwnProperty('_priority')){ obj._priority=parseInt(intVal); }
	}
	objActions.tag = function(objData,varVal){ 
		if(!objData.hasOwnProperty('_tags')){ obj._tags=[varVal]; }
		else{ obj._tags.push(varVal); }
	}
//----====|| OPERANDS ||====----\\
	var objOperands={};
	objOperands.in = function(strPath,strNeedle,objStat,objOptions){ 
		var intCount = 0; var v=_.get(objStat,strPath);
		if(objOptions && objOptions.hasOwnProperty('path2')){ strNeedle=_.get(objStat,objOptions.path2); }
		if(v.constructor === Array){v=v.join()}
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
			if(v.constructor === Array){v=v.join()}
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
	}
	objOperands.ne = function(strPath,varValue,objStat,objOptions){ 
		objOptions.reverse=true;
		return objOperands.eq(strPath,varValue,objStat,objOptions); 
	}
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

}
if (typeof module !== 'undefined' && module.exports){module.exports = Decorator;}