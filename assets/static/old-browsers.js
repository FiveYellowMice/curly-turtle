$(document).ready(function() {

	//Internet Explorer
	if ( /MSIE/.test(navigator.userAgent) ) {
		$(".logo, .small-logo").attr("src", $(".logo, .small-logo").attr("src").replace("logo.svg", "favicon-192.png"));
	}

});
