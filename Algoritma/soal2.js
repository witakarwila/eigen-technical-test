var string = "Saya sangat senang mengerjakan soal algoritma";
var words = string.split(' ');
var longest = '';

for (const word of words) {
  if (word.length > longest.length) {
    longest = word;
  }
}

console.log(`${longest} : ${longest.length} character`);