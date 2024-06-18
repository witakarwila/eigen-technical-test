
var string = "NEGIE1";
var alphabhet = string.replace(/\d/g, '');
var reversedStr = alphabhet.split('').reverse().join('');
var result = reversedStr + string.match(/\d+/)[0];

console.log(result);