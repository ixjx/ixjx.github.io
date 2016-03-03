$(function(){
	//导航条
	$(".navbar a").click(function(){
		var dom=$(this).attr("href");
		$(this).addClass("active").siblings().removeClass("active");
		$("html,body").animate({
			scrollTop:$(dom).offset().top-$(".navbar").height()
		},500);
		return false;
	});

	//滚动监听
	$(window).scroll(function(){
		var bar=$(window).scrollTop();
		var home=$("#home").offset().top-$(".navbar").height()-100;
		var intro=$("#intro").offset().top-$(".navbar").height()-100;
		var linux=$("#linux").offset().top-$(".navbar").height()-100;
		var editor=$("#editor").offset().top-$(".navbar").height()-100;
		var contact=$("#contact").offset().top-$(".navbar").height()-100;
		var about=$("#about").offset().top-$(".navbar").height()-100;
		if(bar>=0&&bar<intro){
			$("a[href='#home']").addClass("active").siblings().removeClass("active");
		}
		if(bar>=intro&&bar<linux){
			$("a[href='#intro']").addClass("active").siblings().removeClass("active");
		}
		if(bar>=linux&&bar<editor){
			$("a[href='#linux']").addClass("active").siblings().removeClass("active");		
		}
		if(bar>=editor&&bar<contact){
			$("a[href='#editor']").addClass("active").siblings().removeClass("active");
		}
		if(bar>=contact&&bar<about){
			$("a[href='#contact']").addClass("active").siblings().removeClass("active");
		}
		if(bar>=about-20){
			$("a[href='#about']").addClass("active").siblings().removeClass("active");
		}
		return false;
	});

	//浏览器检查
	var sUserAgent = navigator.userAgent.toLowerCase();
    if(sUserAgent.match(/msie/i) == "msie"){
        alert("请使用Chrome 或 Safari等webkit内核浏览器打开\n 你懂的~");
    }
    
});