function Ball(radius, color) {
	this.radius = (radius === undefined) ? 40 : radius;
	this.color = color || '#ff0000';
	this.alpha = 1;
	this.x = 0;
	this.y = 0;
	this.z = 0;
	this.xpos = 0;
	this.ypos = 0;
	this.zpos = 0;
	this.vx = 0;
	this.vy = 0;
	this.vz = 0;
	this.mass = 1;
	this.rotation = 0;
	this.scaleX = 1;
	this.scaleY = 1;
	this.lineWidth = 1;
}

Ball.prototype.draw = function(context) {
	context.save();
	context.translate(this.x, this.y);
	context.rotate(this.rotation);
	if ( this.radius > 0 ) {
		context.scale(this.scaleX, this.scaleY);
		context.lineWidth = this.lineWidth;
		context.fillStyle = 'rgba(' + this.parseColor(this.color) + '' + this.alpha + ')';
	}
	context.beginPath();
	context.arc(0, 0, this.radius, 0, (Math.PI * 2), true);
	context.closePath();
	context.fill();
	if (this.lineWidth > 0) {
		context.stroke();
	}
	context.restore();
}

Ball.prototype.parseColor = function(color) {

	var color = color.replace(/\s/ig, '');

	if (/#/ig.test(color)) {

		var a = parseInt(color.substr(1, 2), 16),
			b = parseInt(color.substr(3, 2), 16),
			y = parseInt(color.substr(5, 2), 16);

		return a + ',' + b + ',' + y + ',';

	} else if (/rgba/ig.test(color)) {

		var r = color.replace('rgba(', '');
		r = r.replace(/,\d?\.?\d\)/ig, ',');
		return r;

	} else if (/rgb/ig.test(color)) {

		var r = color.replace('rgb(', '');
		r = r.replace(')', ',');
		return r;

	} else {

		return '0,0,0,';

	}
}

Ball.prototype.getBounds = function() {
	return {
		x: this.x - this.radius,
		y: this.y - this.radius,
		width: this.radius * 2,
		heiget: this.radius * 2
	}
}