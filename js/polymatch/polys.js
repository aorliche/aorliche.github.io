
class Poly {
    constructor(params) {
        this.params = {...params};
        this.recalcBoundary();
    }

    contains(p) {
        for (let i=0; i<this.points.length; i++) {
            if (ccw(this.points[i], this.points[(i+1)%this.points.length], p) < 0) {
                return false;
            }
        }
        return true;
    }

    drawCoords(ctx, xform) {
        const center = xform(this.params.center);
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#333';
        ctx.fillText(this.params.pairstr, center.x, center.y);
    }

    drawHard(ctx, xform) {
        const center = xform(this.params.center);
        const tm = ctx.measureText(this.hard);
        const ascent = tm.actualBoundingBoxAscent;
        ctx.fillStyle = '#333';
        ctx.fillText(this.hard, center.x-tm.width/2, center.y+ascent/2);
    }

    drawSelected(ctx, xform) {
        this.makePath(ctx, xform);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    // xform is the screen transform (adjust center, flip y about center)
    draw(ctx, xform) {
        if (this.empty) {
            this.drawCoords(ctx, xform);
            return;
        }
        this.makePath(ctx, xform);
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.fill();
        ctx.stroke();
        if (this.hard) {
            this.drawHard(ctx, xform);
        }
        //this.drawCoords(ctx, xform);
    }

    makePath(ctx, xform) {
        ctx.beginPath();
        const start = xform(this.points[0]);
        ctx.moveTo(start.x, start.y);
        this.points.map(p => {
            p = xform(p);
            ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
    }
}

class Tri extends Poly {
    constructor(params) {
        super(params);
    }

    recalcBoundary() {
        this.points = [];
        const c = this.params.center;
        const size = this.params.size/Math.sqrt(3);
        const angle = this.params.angle;
        const invert = this.params.up ? 0 : Math.PI;
        for (let i=0; i<3; i++) {
            this.points.push({
                x: c.x + size*Math.cos(i*2*Math.PI/3+angle+invert+Math.PI/6), 
                y: c.y + size*Math.sin(i*2*Math.PI/3+angle+invert+Math.PI/6)
            });
        }
    }
}

class Hex extends Poly {
    constructor(params) {
        super(params);
    }
    
    recalcBoundary() {
        this.points = [];
        const c = this.params.center;
        const size = this.params.size;
        const angle = this.params.angle;
        for (let i=0; i<6; i++) {
            this.points.push({
                x: c.x + size*Math.cos(i*Math.PI/3+angle+Math.PI/6), 
                y: c.y + size*Math.sin(i*Math.PI/3+angle+Math.PI/6)
            });
        }
    }
}

class Square extends Poly {
    constructor(params) {
        super(params);
    }
    
    recalcBoundary() {
        this.points = [];
        const c = this.params.center;
        const size = this.params.size/Math.sqrt(2);
        const angle = this.params.angle;
        for (let i=0; i<4; i++) {
            this.points.push({
                x: c.x + size*Math.cos(i*Math.PI/2+angle+Math.PI/4), 
                y: c.y + size*Math.sin(i*Math.PI/2+angle+Math.PI/4)
            });
        }
    }
}

