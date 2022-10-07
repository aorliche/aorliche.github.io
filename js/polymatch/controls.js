
class Control {
    constructor(params) {
        this.pos = params.pos ? {...params.pos} : null;
        this.dim = params.dim ? {...params.dim} : {w: 0, h: 0};
		this.color = params.color ?? '#000';
        this.bgColor = params.bgColor ?? null;
        this.bgAlpha = params.bgAlpha ?? null;
        this.strokeStyle = params.strokeStyle ?? null;
        this.lineWidth = params.lineWidth ?? null;
    }
}

class ImageControl extends Control {
    constructor(params) {
        super(params);
        this.img = params.img;
        this.dim = params.dim ?? null;
    }
    
    draw(ctx) {
        if (this.bgColor) {
            ctx.fillStyle = this.bgColor;
            ctx.fillRect(this.pos.x, this.pos.y, this.dim.w, this.dim.h);
        }
        const dim = this.calcDim();
        ctx.drawImage(this.img, this.pos.x, this.pos.y, dim.w, dim.h);
    }

    calcDim() {
        let [w,h] = this.dim 
            ? scaleImage(this.img.width, this.img.height, this.dim.w, this.dim.h) 
            : [this.img.width, this.img.height];
        return {w: w, h: h};
    }
}

class TextControl extends Control {
	// ctx required for measuring text
	constructor(params) {
		super(params);
		this.text = params.text;
		this.fontFamily = params.fontFamily ?? 'sans-serif';
		this.fontSize = params.fontSize ?? 16;
		this.fontWeight = params.fontWeight ?? '';
		this.ctx = params.ctx;
		this.pack();
	}

	draw(ctx) {
		const p = {x: this.pos.x, y: this.pos.y+this.ascent};
        ctx.save();
		ctx.font = this.font;
		ctx.fillStyle = this.color;
		ctx.fillText(this.text, p.x, p.y);
        ctx.restore();
	}

	get font() {
		return `${this.fontWeight} ${this.fontSize}px ${this.fontFamily}, sans-serif`;
	}

	pack(pass) {
		this.ctx.font = this.font;
		const tm = this.ctx.measureText(this.text);
		this.ascent = tm.actualBoundingBoxAscent;
		this.descent = tm.actualBoundingBoxDescent;
		this.dim.w = tm.width;
		this.dim.h = this.ascent + this.descent;
	}
}

class TextCounterControl extends TextControl {
    constructor(params) {
        super(params);
        this.countPriv = params.count;
        this.textSav = this.text;
        this.count = this.countPriv;
    }

    get count() {
        return this.countPriv;
    }

    set count(count) {
        this.countPriv = count;
        this.text = this.textSav + ' ' + this.countPriv;
        this.pack();
    }
}

// Passed dim is for image, pos is for text, text calculates own dim
class ImageCounterControl extends Control {
    constructor(params) {
        super(params);
        this.text = new TextControl({...params});
        this.img = new ImageControl({...params});
        this.padding = params.padding ?? 2;
        this.count = params.count ?? 0;
    }

    draw(ctx) {
        this.text.draw(ctx);
        let pos = {...this.text.pos};
        const imgdim = this.img.calcDim();
        pos.y += (this.text.dim.h-imgdim.h)/2;
        pos.x += this.text.dim.w+this.padding;
        for (let i=0; i<this.count; i++) {
            this.img.pos = pos;
            this.img.draw(ctx);
            pos.x += imgdim.w+this.padding;
        }
    }
}

class ButtonControl extends Control {
    constructor(params) {
        super(params);
        this.text = new TextControl({...params});
        this.pos = params.pos;
        this.dim = params.dim;
        this.cb = params.cb;
        this.pack();
    }

    click() {
        this.cb();
    }

    // Screen coords
    contains(p) {
        if (p.x > this.pos.x
            && p.x < this.pos.x+this.dim.w
            && p.y > this.pos.y
            && p.y < this.pos.y+this.dim.h) 
            return true;
        else
            return false;
    }

    draw(ctx) {
        if (this.bgColor) {
            if (this.hover) {
                ctx.fillStyle = this.color;
                ctx.fillRect(this.pos.x, this.pos.y, this.dim.w, this.dim.h);
                ctx.strokeStyle = this.bgColor;
                ctx.strokeRect(this.pos.x, this.pos.y, this.dim.w, this.dim.h);
                this.text.color = this.bgColor;
            } else {
                ctx.fillStyle = this.bgColor;
                ctx.fillRect(this.pos.x, this.pos.y, this.dim.w, this.dim.h);
                this.text.color = this.color;
            }
        } 
        this.text.draw(ctx);
    }

    pack() {
        this.text.pack();
        const dw = this.dim.w - this.text.dim.w;
        const dh = this.dim.h - this.text.dim.h;
        this.text.pos.x = this.pos.x+dw/2;
        this.text.pos.y = this.pos.y+dh/2+this.text.descent/2;
    }
}

class BoxControl extends Control {
    constructor(params) {
        super(params);
    }

    draw(ctx) {
        if (this.bgColor) {
            ctx.save();
            if (this.bgAlpha) {
                ctx.globalAlpha = this.bgAlpha;
            }
            ctx.fillStyle = this.bgColor;
            ctx.fillRect(this.pos.x, this.pos.y, this.dim.w, this.dim.h);
            ctx.restore();
        }
    }
}

class Klaxon {
    constructor(grid) {
        this.grid = grid;
        this.active = false;
        this.THRESHOLD = 0.6;
        this.TRIGGER = 60;
        this.RATE = 60;
        // We can get away with double-counting triangles
        this.occupied = {};
        this.grid.centers.forEach(c => {
            this.occupied[c.pairstr] = 0;
        });
        // Screen coords
        this.text = new TextControl({
            pos: point(0,120),
            text: 'Warning!',
            fontSize: 48,
            fontWeight: 'Bold',
            color: '#f00',
            ctx: this.grid.params.ctx
        });
        this.text.pos.x = this.grid.params.dim.w/2-this.text.dim.w/2;
    }

    draw(ctx) {
        if (this.active && this.time%this.RATE < this.RATE/2) {
            this.text.draw(ctx);
        }
    }

    reset() {
        this.active = false;
        this.time = 0;
    }

    // Make sure the same poly is at a center for N ticks
    // before triggering to prevent false klaxons
    tick() {
        // Don't update while paused but keep flashing the warning
        if (!this.grid.paused) 
            this.update();
        if (this.active) {
            this.time++;
            if (this.time < this.RATE) 
                return;
        }
        this.reset();
        const thresh = (this.THRESHOLD-0.5)*this.grid.params.dim.h;
        if (this.level > thresh) {
            this.trigger();
        }
    }

    trigger() {
        this.active = true;
        this.time = 0;
        if (!this.grid.paused) 
            this.grid.audio.play('klaxon');
    }

    update() {
        // Set level for grid
        this.level = -Infinity;
        this.grid.centers.forEach(c => {
            if (c.poly && !c.poly.empty && !c.poly.to) {
                this.occupied[c.pairstr]++;
                if (this.occupied[c.pairstr] > this.TRIGGER && c.y > this.level) 
                    this.level = c.y;
            } else {
                this.occupied[c.pairstr] = 0;
            }
        });
    }

}

class PauseOverlay extends BoxControl {
    constructor(params) {
        super(params);
        this.text = new TextControl(params);
        this.grid = params.grid;
        this.text.pos = point(this.grid.params.dim.w/2-this.text.dim.w/2, this.pos.y+20);
    }

    draw(ctx) {
        if (this.grid.paused) {
            super.draw(ctx);
            this.text.draw(ctx);
        }
    }
}

class LostOverlay extends BoxControl {
    constructor(params) {
        super(params);
        this.grid = params.grid;
        this.button = params.button;
        this.text = new TextControl({...params});
        params.bgColor = null;
        params.bgAlpha = null;
        this.img = new ImageControl(params);
        this.img.dim = params.imgDim ?? null;
        this.pack();
    }

    draw(ctx) {
        if (this.grid.state == 'lost') {
            super.draw(ctx);
            this.img.draw(ctx);
            this.text.draw(ctx);
            this.button.draw(ctx);
        }
    }

    pack() {
        const imgDim = this.img.calcDim();
        this.img.pos = point(this.pos.x+this.dim.w/2-imgDim.w/2, this.pos.y+20);
        this.text.pos = point(this.pos.x+this.dim.w/2-this.text.dim.w/2, this.img.pos.y+this.img.dim.h+10);
        this.button.pos = point(this.pos.x+this.dim.w/2-this.button.dim.w/2, this.text.pos.y+this.text.dim.h+20);
        this.button.pack();
    }
}

class IntroOverlay extends BoxControl {
    constructor(params) {
        super(params);
        this.text = new TextControl({...params});
        params.bgColor = null;
        params.bgAlpha = null;
        this.img = new ImageControl(params);
        this.img.dim = params.imgDim ?? null;
        this.grid = params.grid;
        this.pack();
    }

    draw(ctx) {
        if (this.grid.state == 'intro') {
            super.draw(ctx);
            this.img.draw(ctx);
            this.text.draw(ctx);
        }
    }

    pack() {
        const imgDim = this.img.calcDim();
        this.img.pos = point(this.dim.w/2-imgDim.w/2, this.pos.y+40);
        this.text.pos = point(this.dim.w/2-this.text.dim.w/2, this.img.pos.y+this.img.dim.h+10);
    }
}
