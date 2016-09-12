# json-collection-decorator
efficiently run a collection of records by conditions and decorate them when conditions match, return results - filtered items

# Inputs
1. config object
2. collection of jsonobjects

'''javascript

var objConfig={
	 filter:{}
	,decorate:[
		{
			find:{
				path:"path.to.key",op:"eq",val:"disallow"
			},set:{
				path:"path.to.key",val:"value to set"
			},find:{
				path:"path.to.key",op:"eq",val:"disallow"
			},set:{
				path:"path.to.key",add:"value to add to array"
			}
		}
	]
}

arrResults = decorate(objConfig,arrCollection);

'''
