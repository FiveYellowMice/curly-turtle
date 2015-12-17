$(document).ready(function() {

	//SVG in img
	if ( /MSIE [2-8]|Android 2.[0-3]/.test(navigator.userAgent) ) {
		$(".logo, .small-logo").attr("src", $(".logo, .small-logo").attr("src").replace("logo.svg", "favicon-192.png"));
	}

});
