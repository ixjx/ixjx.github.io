/**
 * 生日快乐
 *
 * @version 0.0.1
 * @author niko<nikolikegirl@gmail.com>
 * @data 2014-01-23
 */
function randomColor() {
	var c = 'rgb(';
	//c += utils.random(50, 200) + ',' + utils.random(50, 200) + ',' + utils.random(50, 200) + ')';
	c = '#ff6600';
	return c;
}

function drawText(ctx, config) {

	var text = config.text || '生日快乐',
		font = config.font || '900 300px simsun',
		gap = config.gap || 10,
		textLen = text.length,
		size = parseInt(font.match(/([\d]+)px/ig)[0]) || 200;

	//绘画黑底白字，用于获取字的坐标
	ctx.save();
	ctx.fillStyle = '#000000';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.restore();

	ctx.save();
	ctx.fillStyle = '#ffffff';
	ctx.font = font;
	ctx.textBaseline = "middle";
	ctx.fillText(text, (canvas.width - size * textLen) / 2, (canvas.height / 2));
	ctx.restore();

	//根据字体像素，画球
	var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	var len = imgData.data.length;

	//获取坐标需要的变量
	var w = canvas.width,
		h = canvas.height,
		x = 0,
		y = 0,
		pixel = 0,
		row = 0,
		column = 0,
		pos = [];

	//获取坐标
	for (var i = 0; i < len; i = i + 4) {
		pixel = Math.floor(i / 4);
		//在第几行
		column = Math.floor(pixel / w);
		//在第几列
		row = pixel % w;

		if ((column % gap == 0) && (row % gap == 0)) {
			if (imgData.data[i] !== 0) {
				pos.push({
					x: row,
					y: column
				})
			}
		}
	}
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	return pos;
}

function checkBound(ball, bounce) {

	var mw = canvas.width / 2,
		mh = canvas.height / 2;
	var left = -mw,
		right = mw,
		top = -mh,
		bottom = mh,
		back = 200,
		front = -200;

	if (ball.xpos + ball.radius > right) {
		ball.xpos = right - ball.radius;
		ball.vx *= bounce;
	} else if (ball.xpos - ball.radius < left) {
		ball.xpos = left + ball.radius;
		ball.vx *= bounce;
	} else if (ball.ypos + ball.radius > bottom) {
		ball.ypos = bottom - ball.radius;
		ball.vy *= bounce;
	} else if (ball.ypos - ball.radius < top) {
		ball.ypos = top + ball.radius;
		ball.vy *= bounce;
	} else if (ball.zpos + ball.radius > back) {
		ball.zpos = back - ball.radius;
		ball.vz *= bounce;
	} else if (ball.zpos - ball.radius < front) {
		ball.zpos = front + ball.radius;
		ball.vz *= bounce;
	}

}

(function main() {

	var canvas = document.getElementById('canvas'),
		ctx = canvas.getContext('2d');

	if (!ctx) {
		alert('using the fucking chrome');
	}
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	canvas.style.display = 'block';

	var pos = drawText(ctx, {
		text: '生日快乐',
		font: '900 300px simsun',
		gap: 10
	});

	//构建视图
	//物理参数
	var fl = 250,
		vpX = canvas.width / 2,
		vpY = canvas.height / 2,
		floor = 200,
		gravity = 0.2,
		bounce = -0.6,
		spring = 0.2,
		friction = 0.9;

	var isFall = false,
		isFirst = true,
		isCanFall = false;

	//构建球
	var balls = [];
	pos.forEach(function(p) {
		var ball = new Ball(10, randomColor());
		ball.lineWidth = 0;
		ball.x = utils.random(10, canvas.width - 10);
		ball.y = utils.random(10, canvas.height - 10);
		ball.targetX = p.x;
		ball.targetY = p.y;
		ball.px = p.x;
		ball.py = p.y;
		ball.vx = (utils.random(-100, 100) + 1) * 0.1;
		ball.vy = (utils.random(-100, 100) + 1) * 0.1;
		ball.vz = (utils.random(-100, 100) + 1) * 0.1;
		balls.push(ball);
	});

	function initBall(balls) {
		balls.forEach(function(ball) {
			ball.zpos = 0;
			var scale = fl / (fl + ball.zpos);
			ball.scaleX = scale;
			ball.scaleY = scale;
			ball.xpos = (ball.px - vpX) / scale;
			ball.ypos = (ball.py - vpY) / scale;
			ball.vx = (utils.random(-100, 100) + 1) * 0.1;
			ball.vy = (utils.random(-100, 100) + 1) * 0.1;
			ball.vz = (utils.random(-100, 100) + 1) * 0.1;
		});
	}

	//散落
	function fall(balls) {
		balls.forEach(function(ball, index) {
			ball.vy += gravity;
			ball.xpos += ball.vx;
			ball.ypos += ball.vy;
			ball.zpos += ball.vz;

			if (ball.zpos > -fl) {
				var scale = fl / (fl + ball.zpos);
				ball.scaleX = scale;
				ball.scaleY = scale;
				ball.x = vpX + ball.xpos * scale;
				ball.y = vpY + ball.ypos * scale;
				ball.visible = true;
			} else {
				ball.visible = false;
			}

			if (ball.visible) {
				//checkBound(ball, -0.6);
				if (ball.ypos + ball.radius > floor) {
					ball.ypos = floor - ball.radius;
					ball.vy *= bounce;
				}
			}
		});
		balls.sort(function(a, b) {
			return (b.zpos - a.zpos);
		});
	}

	//弹
	function elasticFunc(balls) {
		var dis = 0,
			dx = 0,
			dy = 0,
			deg = 0;
		balls.forEach(function(ball) {
			dx = ball.targetX - ball.x;
			dy = ball.targetY - ball.y;
			deg = Math.atan2(dy, dx);
			dis = Math.sqrt(dx * dx + dy * dy);
			ball.vx = dis * spring * Math.cos(deg);
			ball.vy = dis * spring * Math.sin(deg);
			//ball.vx += ball.ax;
			//ball.vy += ball.ay;
			//ball.vx *= friction;
			//ball.vy *= friction;
			ball.x += ball.vx;
			ball.y += ball.vy;
			ball.visible = true;
			if (Math.abs(ball.vx) < 0.001 &&
				Math.abs(ball.vy) < 0.001 &&
				isFirst) {
				isFirst = false;
				isCanFall = true;
			}
		});
	}

	window.addEventListener('click', function() {
		if (isCanFall) {
			isCanFall = false;
			isFall = true;
			initBall(balls);
		} else {
			if (isFall) {
				initBall(balls);
				isCanFall = true;
				isFall = false;
			}
		}
	}, false);

	//动画运行
	(function drawFrame() {
		window.requestAnimationFrame(drawFrame, canvas);
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		if (isFall) {
			fall(balls);
		} else {
			elasticFunc(balls);
		}
		balls.forEach(function(ball) {
			if (ball.visible) {
				ball.draw(ctx);
			}
		})

	})();

})();