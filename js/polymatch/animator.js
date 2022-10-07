 
 class Animator {
    constructor(grid, ctx, dim) {
        this.grid = grid;
        this.grid.anim = this;
        this.ctx = ctx;
        this.ctx.font = '10px Sans-serif';
        this.dim = {...dim};
        this.running = false;
        this.polys = [];
        this.clearing = [];
        this.messages = [];
        this.FALLSPEED = 5;
        this.CLEARSPEED = 8;
        this.INTROCLEARSPEED = 2;
        this.CLEARREMOVE = 200;
        this.MSGSTART = dim.h/7;
        this.MSGSPACE = 15;
        this.prevts = null;
    }

    animate(ts) {
        if (this.prevts && ts-this.prevts < 1000/60-1) {
            this.prevts = ts;
            if (this.running) 
                requestAnimationFrame(e => this.animate());
            return;
        }
        this.prevts = ts;
        const clearspeed = this.grid.state == 'intro' ? this.INTROCLEARSPEED : this.CLEARSPEED;
        this.polys = this.polys.filter(p => {
            // params.center can be set to .to and .to can be set to null in clear()
            if (!p.to) return false;
            const r = sub(p.to, p.params.center);
            const rmag = len(r);
            if (rmag < this.FALLSPEED) {
                p.params.center = {...p.to};
                p.recalcBoundary();
                p.to = null;
                return false;
            } else {
                p.params.center = add(p.params.center, mul(r, this.FALLSPEED/rmag));
                p.recalcBoundary();
                return true;
            }
        });
        this.clearing = this.clearing.filter(p => {
            p.params.center.y -= clearspeed;
            if (p.params.center.y < -this.grid.params.dim.h/2-this.CLEARREMOVE)
                return false;
            else {
                p.recalcBoundary();
                return true;
            }
        });
        this.messages = this.messages.filter(msg => {
            msg.tick();
            return msg.time >= 0;
        });
        this.grid.tick();
        this.repaint();
        if (this.running) 
            requestAnimationFrame(e => this.animate(e));
    }

    calcMessagePositions() {
        let msgy = this.MSGSTART;
        for (let i=0; i<this.messages.length; i++) {
            this.messages[i].pos.y = msgy;
            msgy += this.messages[i].dim.h + this.MSGSPACE;
        }
    }

    clear(poly) {
        this.clearing.push(new this.grid.kls(poly.params));
        this.clearing.at(-1).params.center = {...poly.params.center};
        this.clearing.at(-1).color = poly.color;
        this.clearing.at(-1).empty = false;
    }

    fall(poly, to) {
        poly.to = {...to};
        this.polys.push(poly);
    }

    // Grid coordinates
    // Position is also calculated in animate
    message(text, time) {
        const msg = new Message({
            text: text, 
            pos: {x: 0, y: 0}, 
            fontSize: '24',
            fontWeight: '',
            time: time ?? null,
            ctx: this.ctx, 
            xform: p => this.grid.xform(p)});
        this.messages.push(msg);
        this.calcMessagePositions();
    }

    start() {
        if (this.running) return;
        this.running = true;
        requestAnimationFrame(e => this.animate());
    }

    stop() {
        this.running = false;
    }
    
    repaint() {
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0,0,this.dim.w,this.dim.h);
        if (this.grid.state == 'intro') {
            this.grid.drawClearing(this.ctx);
            this.grid.boxes.intro.draw(this.ctx);
        } else {
            this.grid.draw(this.ctx, 'red');
            this.messages.forEach(msg => msg.draw(this.ctx));
            this.grid.drawOverlay(this.ctx);
        }
    }
}

class Message {
    constructor(params) {
        console.assert(params.ctx);
        console.assert(params.pos);
        this.params = params;
        this.pos = params.pos;
        this.dim = null;
        this.time = params.time ?? 120;
        this.text = params.text ?? 'empty';
        this.color = params.color ?? '#000';
        this.fontFamily = params.fontFamily ?? 'Sans';
        this.fontSize = params.fontSize ?? 16;
        this.fontWeight = params.fontWeight ?? '';
        this.ctx = params.ctx;
        this.xform = params.xform ?? null;
        this.pack();
    }

    draw(ctx) {
        ctx.save();
        if (this.alpha || this.alpha === 0) ctx.globalAlpha = this.alpha;
        let p = {x: this.pos.x, y: this.pos.y-this.ascent};
        if (this.xform) p = this.xform(p);
        ctx.font = this.font;
        ctx.fillStyle = this.color;
        ctx.fillText(this.text, p.x, p.y);
        ctx.restore();
    }

    get font() {
        return `${this.fontWeight} ${this.fontSize}px ${this.fontFamily}, sans-serif`;
    }

    pack() {
        this.ctx.save();
        this.ctx.font = this.font;
        const tm = this.ctx.measureText(this.text);
        this.ascent = tm.actualBoundingBoxAscent;
        this.descent = tm.actualBoundingBoxDescent;
        this.pos.x = this.pos.x-tm.width/2;
        this.dim = {w: tm.width, h: this.ascent+this.descent};
        this.ctx.restore();
    }

    tick() {
        this.time--;
    }
}
