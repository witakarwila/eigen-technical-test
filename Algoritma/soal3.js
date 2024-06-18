var input = ['xc', 'dz', 'bbb', 'dz'];
var query = ['bbb', 'ac', 'dz'];

var result = query.map(q => input.filter(input => input === q).length);
var explanation = query.map((query, index) => 
	`kata '${query}' ${result[index] > 0 ? `terdapat ${result[index]} pada INPUT` : 'tidak ada pada INPUT'}`
);

console.log(`OUTPUT = [${result.join(', ')}] karena ${explanation.join(', ')}`);

