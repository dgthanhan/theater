function test() {
	$subscriptionService.statInstallations(function (statResultCollection) {
		console.log("statResult: ", statResultCollection);
	});
	
	$customerService.searchCustomers("", 0, 10, function (result) {
		console.log("result:", result);
	});
}

window.addEventListener("load", test, false);