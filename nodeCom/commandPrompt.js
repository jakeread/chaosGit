var prompt = require('prompt'); // npm module

prompt.start();

module.exports = {
	getCommand: function() {
		console.log("doing function");
		prompt.get('input', function(err, result) {
			console.log("logged this: " + result.input);
		});
	}
}
