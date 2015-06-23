(function($) {
    
    // When to show the scroll link
    // higher number = scroll link appears further down the page    
    var upperLimit = 500; 
        
    // Our scroll link element
    var scrollElem = $('#totop');
    
    // Scroll to top speed
    var scrollSpeed = 500;
    
    // Show and hide the scroll to top link based on scroll position    
    scrollElem.hide();
    $(window).scroll(function () {             
        var scrollTop = $(document).scrollTop();        
        if ( scrollTop > upperLimit ) {
            $(scrollElem).stop().fadeTo(300, 1); // fade back in            
        }else{        
            $(scrollElem).stop().fadeTo(300, 0); // fade out
        }
    });

    // Scroll to top animation on click
    $(scrollElem).click(function(){ 
        $('html, body').animate({scrollTop:0}, scrollSpeed); return false; 
    });

    var sUserAgent = navigator.userAgent.toLowerCase();
    if(sUserAgent.match(/msie/i) == "msie"){
        alert("请使用Chrome 或 Safari等webkit内核浏览器打开\n 你懂的~");
    }

})(jQuery);