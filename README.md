# json-collection-decorator
efficiently run a collection of records by conditions and decorate them when conditions match, return results - filtered items

# Inputs
1. config object
2. collection of jsonobjects

```javascript

var objConfig={
	 filters:[
	 	{ path:"path.to.key",op:"eq",val:"value to match" }
	 ]
	,decorate:[
		{
			find:{ path:"path.to.key",op:"eq",val:"value to match" }
			,do:{ path:"path.to.key",act:"set",val:"value to set" }
		},{
			,find:{ path:"path.to.key",op:"eq",val:"value to match" }
			,do:{path:"path.to.key",act:"stack",val:"value to add to array" }
		}
	]
}

arrResults = decorate(objConfig,arrCollection);
```

# Action Parameters

1. filter : conditions to meet for filtering out the object from the collection to return
2. decorate: pairs of conditions and decorator actions to perform on each object in the collection
3. decorate.find: the condiion for a decoration
4. decorate.act: the action to perform on hat is matched

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
8. any: doesnt matter

# Actions

5. set: static value to set
6. stack: static value to add to an array
7. add: numeric value to add, this will also convert existing values to a number
8. append: string to append
9. prepend: string to append
10. remove: remove the field from the object
10. rename: rename a field of an object
12. prioritize: adds 1 to existings _priority, unless a different number is specified
13: tag: adds a tag to the stack

