const readline = require('readline');

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

rl.on('line', (input) => {
	console.log('received on event: ' + input);
});

/* rl.question('this will never work ', (answer) => {
	console.log('this is it: ' + answer);
	rl.close();
});
*/
