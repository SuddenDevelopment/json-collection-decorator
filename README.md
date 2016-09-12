# json-collection-decorator
efficiently run a collection of records by conditions and decorate them when conditions match, return results - filtered items

# Inputs
1. config object
2. collection of jsonobjects

```javascript

var objConfig={
	 filter:[
	 	{ path:"path.to.key",op:"eq",val:"value to match" }
	 ]
	,decorate:[
		{
			find:{ path:"path.to.key",op:"eq",val:"value to match" }
			,do:{ path:"path.to.key",val:"value to set" }
		},{
			,find:{ path:"path.to.key",op:"eq",val:"value to match" }
			,do:{path:"path.to.key",add:"value to add to array" }
		}
	]
}

arrResults = decorate(objConfig,arrCollection);
```

# Action Parameters

1. filter : conditions to meet for filtering out the object from the collection to return
2. decorate: pairs of conditions and decorator actions to perform on each object in the collection
3. decorate.find: the condiion for a decoration
4. decorate.do: the action to perform on hat is matched
5. decorate.do.val: static value to set
6: decorate.do.add: static value to add to an array

# Comparison Parameters

1. path : dot notation path to the field
2. op : operand
3. val : stauc value to compare against
4. path2 : used for comparisons between values instead of setting a static one


# Operands

1. eq : ==
2. ne : !=
3. gt : >
4. lt : <
5. in : found in a string or simple array
6. ni : opposite of in
7. has : more than a count of occurences of in

