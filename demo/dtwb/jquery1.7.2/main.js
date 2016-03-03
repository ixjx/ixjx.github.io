var xjx={};
xjx={
	clock:null,  //定时器
	speed:2,	//速度
	state:0,	//状态,0为初始化,1为进行中，2为失败
	init:function(){
		xjx.state=0;
		for(var i=0;i<4;i++){
			xjx.createRow();
		}
	},
	createDiv:function(className){
		var $div=$("<div></div>");
		$div.attr("class",className);
		return $div;
	},
	createRow:function(){
		var $row=xjx.createDiv("row");
		var classes=xjx.createRandom();
		for(var i=0;i<4;i++){
			$row.append(xjx.createDiv(classes[i]));
		}
		
		if(null==$("#contain").children()){
			$("#contain").append($row);
		}else{
			$("#contain").prepend($row);
		}
	},
	createRandom:function(){
		var arr=["cell","cell","cell","cell"];
		var i=Math.floor(Math.random()*4);
		arr[i]="cell black";
		return arr;
	},
	move:function(){
		var top=$("#contain").position().top;
		if(xjx.speed+top>0){
			top=0;
		}else{
			top+=xjx.speed;  
		}
		
		$("#contain").css("top",top);

		if(0==top){
			xjx.createRow();
			$("#contain").css("top",-100);
	
			if(6==$("#contain").children().length){
				$("#contain").children().last().remove();
			}
		}
		if((-100+xjx.speed)==top){
			if(5==$("#contain").children().length && $("#contain").children().last().attr("pass")!=1){
				xjx.stop();
			}
		}
	},
	start:function(){
		clock=window.setInterval("xjx.move()",30);
		$("#contain").click(function(e){
			if(2==xjx.state){
				alert("已失败！");
				return false;
			}
			var $ev=$(e.target);

			if($ev.hasClass("black")){
				$ev.attr("class","cell");

				$ev.parent().attr("pass",1);
				
				xjx.score();
			}else{
				xjx.stop();
			}
			
		});
	},
	score:function(){
		var newscore=parseInt($("#score").text())+1;
		$("#score").text(newscore);
		if(0==newscore%5){
			xjx.jiasu();
		}
	},
	stop:function(){
		xjx.state=2;
		clearInterval(clock);
		alert("失败");
	},
	jiasu:function(){
		xjx.speed+=2;
		if(20==speed){
			alert("通关！");
		}
	}
};

$(function(){
	xjx.init();
	xjx.start();
	$("#re").click(function(){
		window.location.reload();
	});
});