const matrix = [
  [1, 2, 0],
  [4, 5, 6],
  [7, 8, 9]
];
const n = matrix.length;
var diagonal1 = 0, diagonal2 = 0, result;

for (let i = 0; i < n; i++) {
  diagonal1 += matrix[i][i];
  diagonal2 += matrix[i][n - 1 - i];
}

result = Math.abs(diagonal1 - diagonal2);

console.log(`hasilnya adalah ${diagonal1} - ${diagonal2} = ${result}`);