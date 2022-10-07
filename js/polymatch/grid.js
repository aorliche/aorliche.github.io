
var colors = ['#f77','#7f7','#77f','#cc7','#7cc','#c7c'];//,'#a00','#0a0','#00a'];

class Timer {
    constructor(params) {
        this.t = params.t0;
        this.paused = params.paused ?? false;
        this.params = {...params};
    }

    reset() {
        this.t = this.params.t0;
    }

    tick() {
        if (this.paused) 
            return;
        if (this.params.tickcb) {
            this.params.tickcb(this.t);
        }
        if (this.t === this.params.tf)  {
            this.params.endcb(this.t);
        }
        this.t += this.params.dt;
    }
}

// Space Weather
class Weather {
    constructor(time, npoly, type) {
        this.time = time;
        this.npoly = npoly;
        this.type = type;
        this.systems = [this];
    }

    add(time, npoly, type) {
        this.systems.push(new Weather(time, npoly, type));
        return this;
    }
}

class DifficultyRamp {
    constructor(grid) {
        this.grid = grid;
    }

    dump(lvl) {
        if (lvl % 3 == 0) {
            const w = randomChoice(this.grid.weather.systems.filter(w => w.type == 'dump'));
            if (w.time == Infinity) 
                w.time = 1000;
            else
                w.time = Math.ceil(w.time*0.95);
            w.npoly += 2;
            return true; // found
        }
        return false; // not found
    }

    hard(lvl) {
        if (lvl % 5 == 0) {
            this.grid.hardval++;
            this.grid.hardrat *= 1.1;
            return true; // found
        }
        return false; // not found
    }

    point(lvl) {
        if (lvl % 3 == 2) {
            const w = randomChoice(this.grid.weather.systems.filter(w => w.type == 'point'));
            if (w.time == Infinity) 
                w.time = 600;
            else
                w.time = Math.ceil(w.time*0.95);
            w.npoly += 1;
            return true; // found
        }
        return false; // not found
    }

    ramp(lvl) {
        let found = false;
        [
            lvl => this.special(lvl), 
            lvl => this.hard(lvl),
            lvl => this.single(lvl), 
            lvl => this.point(lvl), 
            lvl => this.dump(lvl)
        ].forEach(fn => {
            if (!found) found = fn(lvl);
        });
    }

    single(lvl) {
        if (lvl % 3 == 1) {
            const w = randomChoice(this.grid.weather.systems.filter(w => w.type == 'single'));
            w.time = Math.ceil(w.time*0.95);
            return true; // found
        }
        return false; // not found
    }

    special(lvl) {
        switch(lvl) {
            case 10: colors.push('#a73'); break;
            case 20: colors.push('#f0f'); break;
            case 30: colors.push('#f33'); break;
            default: return false; // not found
        }
        return true; // found
    }
}

class Grid {
    constructor(params) {
        this.center = point(params.dim.w/2, params.dim.h/2);
        this.params = {...params};
        this.EMPTYTOP = -300;
        this.TOPPADDING = 200;
        this.MAXBLASTS = 9;
        this.ramp = new DifficultyRamp(this);
        switch (params.type) {
            case 'tri': this.initTri(); this.kls = Tri; break;
            case 'square': this.initSquare(); this.kls = Square; break;
            case 'hex': this.initHex(); this.kls = Hex; break;
        }
        this.blasts = new ImageCounterControl({
            pos: {x: 20, y: 30},
            dim: {w: 30, h: 30},
            fontSize: 20,
            text: 'Blasts:',
            count: 1,
            padding: 2,
            ctx: this.params.ctx,
            img: this.params.assets['blast']
        });
        this.survive = new TextControl({
            pos: {x: this.params.dim.w-120, y: 30},
            fontSize: 20,
            text: 'Time:',
            ctx: this.params.ctx
        });
        this.pause = new ButtonControl({
            pos: {x: this.params.dim.w-115, y: 85},
            dim: {w: 100, h: 30},
            fontSize: 16,
            text: 'Pause',
            bgColor: '#77f',
            color: '#fff',
            ctx: this.params.ctx,
            cb: () => {
                this.paused = !this.paused;
                this.pause.text.text = (this.paused) ? 'Unpause': 'Pause';
                this.pause.pack();
                this.audio.gain = (this.paused) ? 0 : 1;
            }
        });
        this.timers = {
            survive: new Timer({
                t0: 1000,
                dt: -1,
                tf: 0,
                tickcb: t => {
                    const ttxt = new Date(t/60*1000).toISOString().substr(14,5);
                    this.survive.text = 'Time: ' + ttxt;
                    this.survive.pack();
                },
                endcb: t => {
                    this.anim.message('You did it!');
                    this.ramp.ramp(this.level.count);
                    this.level.count++;
                    this.timers.survive.reset();
                }
            })
        };
        this.boxes = {
            blasts: new BoxControl({
                pos: point(0,15), 
                dim: dimension(this.params.dim.w, 40), 
                bgColor: '#333', 
                bgAlpha: 0.3
            }),
            pause: new PauseOverlay({
                pos: point(0,58),
                dim: dimension(this.params.dim.w, 65),
                bgColor: '#77f',
                bgAlpha: 0.3,
                text: 'Paused',
                fontSize: 28,
                fontWeight: '',
                ctx: this.params.ctx,
                grid: this
            }),
            lost: new LostOverlay({
                pos: point(0,150),
                dim: dimension(this.params.dim.w, 175),
                bgColor: '#f55',
                bgAlpha: 0.7,
                color: '#fff',
                text: 'You lost!',
                fontSize: 28,
                fontWeight: '',
                img: this.params.assets['lost'],
                imgDim: dimension(50,50),
                button: new ButtonControl({
                    text: 'Play again',
                    pos: point(0,0),
                    dim: dimension(120,30),
                    fontSize: 16,
                    bgColor: '#77f',
                    color: '#fff',
                    ctx: this.params.ctx,
                    cb: () => {
                        this.state = 'intro';
                        this.reset();
                    }
                }),
                ctx: this.params.ctx,
                grid: this
            }),
            intro: new IntroOverlay({
                pos: point(0,150),
                dim: dimension(this.params.dim.w, 200),
                img: this.params.assets['polymatch'],
                imgDim: dimension(300, 80),
                text: 'Click to start',
                fontSize: 28,
                color: '#000',
                bgColor: '#f55',
                bgAlpha: 0.5,
                ctx: this.params.ctx,
                grid: this
            })
        };
        this.level = new TextCounterControl({
            pos: point(this.params.dim.w-90, 63),
            text: 'Level',
            fontSize: 16,
            count: 1,
            ctx: this.params.ctx
        });
        this.klaxon = new Klaxon(this);
        this.reset();
    }

    assignColors() {
        // Offscreen get no colors
        const centers = this.centers.filter(c => !c.poly.empty);
        centers.sort((a,b) => {
            const [ai,aj] = strpair(a.pairstr);
            const [bi,bj] = strpair(b.pairstr);
            if (ai-bi != 0) return ai-bi;
            if (aj-bj != 0) return aj-bj;
            return -1;
        });
        centers.forEach(c => {
            const taken = c.neighbors.map(n => n.poly.color);
            const start = randint(0,colors.length);
            for (let i=0; i<colors.length; i++) {
                const cidx = (start+i)%colors.length;
                if (!taken.includes(colors[cidx])) {
                    c.poly.color = colors[cidx];
                    return;
                }
            }
            console.log('bad color assign');
            color = '#000';
        });
    }

    cacheNeighbors() {
        this.centers.forEach(c => {
            c.neighbors = this.findNeighbors(c);
        });
    }

    // Each anchor contains either 1 (square, hex) or 2 (tri) centers
    get centers() {
        const cs = [];
        for (const pairstr in this.map) {
            this.map[pairstr].forEach(c => {
                cs.push(c);
            });
        }
        return cs;
    }

    clear() {
        let found = false;
        this.matched.forEach(grp => {
            let bonus = grp.length-3;
            if (this.blasts.count+bonus > this.MAXBLASTS) 
                bonus = this.MAXBLASTS-this.blasts.count;
            if (bonus) {
                this.audio.play('plus');
                this.anim.message(`+${bonus} Blasts!`);
            }
            this.blasts.count += bonus;
            grp.forEach(c => {
                this.clearCenter(c);
            });
            found = true;
        });
        if (found) {
            audio.play('clear');
        }
    }

    clearCenter(c, blast) {
        if (!blast && c.poly.hard) {
            c.poly.hard--;
            return;
        }
        c.poly.empty = true;
        // This avoids major problems with grid getting confused
        if (c.poly.to) {
            c.poly.params.center = c.poly.to;
            c.poly.to = null;
        }
        if (c.poly == this.selected) this.selected = null;
        this.anim.clear(c.poly);
    }

    click(p) {
        // Start the game
        if (this.state == 'intro') {
            this.state = 'playing';
            this.anim.clearing = [];
            this.time = 0;
            this.schedule(() => this.anim.message('Click neighboring polys to swap', 400), 0);
            this.schedule(() => this.anim.message('Get 3 in a row to clear', 400), 420);
            this.schedule(() => this.anim.message('Right click to blast!', 400), 840);
            this.audio.playMusic('space-loop');
        }
        // Buttons in screen coords
        if (this.state == 'playing' && this.pause.contains(p)) {
            this.pause.click();
            return;
        }
        if (this.state == 'lost' && this.boxes.lost.button.contains(p)) {
            this.boxes.lost.button.click();
            return;
        }
        if (this.paused)
            return;
        // Game in game coords
        p = this.xforminv(p);
        let found = false;
        this.centers.forEach(c => {
            if (!found && c.poly && c.poly.contains(p) && !c.poly.to) {
                if (this.selected) {
                    c.neighbors.forEach(n => {
                        if (!found && n.poly == this.selected) {
                            this.swapPolys(c, n);
                            this.audio.play('swap');
                            this.selected = c.poly;
                            found = true;
                        }
                    });
                }
                if (!found) {
                    this.selected = (!c.poly.empty) ? c.poly : null;
                    found = true;
                }
            }
        });
    }

    // Game coordinates
    contains(p) {
        if (p.x > -this.params.dim.w/2 
            && p.x < this.params.dim.w/2 
            && p.y > -this.params.dim.h/2
            && p.y < this.params.dim.h/2) 
            return true;
        else
            return false;
    }

    // Game coordinates
    containsBucket(p, dy) {
        if (!dy) dy = 0;
        if (p.x > -this.params.dim.w/2 
            && p.x < this.params.dim.w/2 
            && p.y > -this.params.dim.h/2
            && p.y < this.params.dim.h/2+dy)
            return true;
        else
            return false;
    }

    // Right click
    contextmenu(p) {
        if (this.paused) 
            return;
        if (this.blasts.count < 1) 
            return;
        p = this.xforminv(p);
        let found = false;
        this.centers.forEach(c => {
            if (!found && c.poly && !c.poly.empty && c.poly.contains(p)) {
                this.audio.play('blast');
                this.audio.play('clear');
                c.neighbors.forEach(n => this.clearCenter(n));
                this.clearCenter(c, true);
                this.blasts.count--;
                found = true;
            }
        });
    }

    draw(ctx, color) {
        this.centers.forEach(c => {
            //fillCircle(ctx, this.xform(c), 2, color);
            if (c.poly && !c.poly.empty) 
                c.poly.draw(ctx, p => this.xform(p));
        });
        if (this.state == 'playing') {
            if (this.selected) 
                this.selected.drawSelected(ctx, p => this.xform(p));
            if (this.hover) {
                if (this.hover.poly && !this.hover.poly.empty && !this.hover.poly.to) {
                    this.hover.poly.drawSelected(ctx, p => this.xform(p));
                }
            }
        }
        this.drawClearing(ctx);
    }

    drawClearing(ctx) {
        this.anim.clearing.forEach(p => {
            p.draw(ctx, p => this.xform(p));
        });
    }

    // Called from animator
    drawOverlay(ctx) {
        for (const name in this.boxes) {
            this.boxes[name].draw(ctx);
        }
        this.blasts.draw(ctx);
        this.survive.draw(ctx);
        this.pause.draw(ctx);
        this.level.draw(ctx);
        if (this.state == 'playing') {
            this.klaxon.draw(ctx);
        }
    }

    fall() {
        const cs = this.centers;
        // Empty locations pull in polys from above them
        cs.sort((a,b) => {
            const d = a.y - b.y;
            if (Math.abs(d) < 10) return Math.random()-0.5;
            else return d;
        });
        cs.forEach(c => {
            if (!c.poly.empty) return;
            if (!this.containsBucket(c, this.TOPPADDING)) return;
            // Clear takes care of setting .to to null, and anim removes null .tos
            // Only true for empty polys!
            console.assert(!c.poly.to);
            // Shuffle order
            shuffle(c.neighbors);
            // No double filling for a single hole
            let filled = false;
            c.neighbors.forEach(n => {
                // Check that we haven't already filled hole
                if (!filled && !n.poly.empty && n.poly != this.selected && n.y > c.y && !n.poly.to) {
                    this.swapPolys(c, n, true);
                    filled = true;
                }
            });
        });
    }

    // For centers, not polys, meaning we don't have to recalculate on every modification
    findNeighbors(c) {
        const [i,j] = strpair(c.pairstr);
        const ns = [];
        for (let ii=i-1; ii<=i+1; ii++) {
            for (let jj=j-1; jj<=j+1; jj++) {
                try { // Some indices are outside of grid
                    this.map[pairstr([ii,jj])].forEach(cc => {
                        const d = len(sub(c,cc));
                        // Like this for triangles, which can be in the same map group
                        if (d < this.neighborDistance && d > 1) {
                            ns.push(cc);
                        }
                    });
                } catch (e) {}
            }
        }
        return ns;
    }

    initHex() {
        this.map = {};
        for (let i=this.params.irange[0]; i<=this.params.irange[1]; i++) {
            for (let j=this.params.jrange[0]; j<=this.params.jrange[1]; j++) {
                const s = this.params.size*Math.sqrt(3);
                const x = (i+j/2)*s;
                const y = j*s*Math.sqrt(3)/2;
                const c = rotate(point(x, y), this.params.angle);
                const str = pairstr([i,j]);
                c.pairstr = str;
                this.map[str] = [c];
            }
        }
    }

    initSquare() {
        this.map = {};
        for (let i=this.params.irange[0]; i<=this.params.irange[1]; i++) {
            for (let j=this.params.jrange[0]; j<=this.params.jrange[1]; j++) {
                const s = this.params.size;
                const x = i*s;
                const y = j*s;
                const c = rotate(point(x, y), this.params.angle);
                const str = pairstr([i,j]);
                c.pairstr = str;
                this.map[str] = [c];
            }
        }
    }

    initTri() {
        this.map = {};
        for (let i=this.params.irange[0]; i<=this.params.irange[1]; i++) {
            for (let j=this.params.jrange[0]; j<=this.params.jrange[1]; j++) {
                const s = this.params.size;
                const x = (i+j/2)*s;
                const y = j*s*Math.sqrt(3)/2;
                const c1 = rotate(point(x+s/2, y+s/2/Math.sqrt(3)), this.params.angle);
                const c2 = rotate(point(x+s, y+s/Math.sqrt(3)), this.params.angle);
                const str = pairstr([i,j]);
                c1.up = false;
                c2.up = true;
                c1.pairstr = str;
                c2.pairstr = str;
                this.map[str] = [c1,c2];
            }
        }
    }

    makePolys() {
        this.centers.forEach(c => {
            const p = new this.kls({center: {...c}, size: this.params.size, angle: this.params.angle, 
                up: c.up, pairstr: c.pairstr});
            c.poly = p;
            if (!this.containsBucket(c, this.EMPTYTOP)) c.poly.empty = true;
        });
    }

    // Get each astron type individually
    get matched() {
        function growGroupTri(group, visited) {
            group.at(-1).neighbors.forEach(n => {
                if (!n.poly.empty && group.at(-1).poly.color == n.poly.color && !visited.includes(n)) {
                    group.push(n);
                    visited.push(n);
                    growGroupTri(group, visited);
                }
            });
        }
        function growGroup(group, c, i, j, di, dj) {
            const [ii,jj] = [i+di,j+dj];
            const npairstr = pairstr([ii,jj]);
            c.neighbors.forEach(n => {
                if (!n.poly.empty && c.poly.color == n.poly.color && n.pairstr == npairstr) {
                    group.push(n);
                    growGroup(group, n, ii, jj, di, dj);
                }
            });
        }
        // TODO Selected should be astrons types
        //const selected = this.centers.filter(c => c.poly && c.poly.selected);
        const groups = [];
        const visited = [];
        this.centers.forEach(s => {
            if (!s.poly.empty && !visited.includes(s)) {
                if (this.params.type == 'tri') {
                    groups.push([s]);
                    visited.push(s);
                    growGroupTri(groups.at(-1), visited);
                } else if (this.params.type == 'square') {
                    const [i,j] = strpair(s.pairstr);
                    groups.push([s]);
                    growGroup(groups.at(-1), s, i, j, 0, 1);
                    growGroup(groups.at(-1), s, i, j, 0, -1);
                    groups.push([s]);
                    growGroup(groups.at(-1), s, i, j, 1, 0);
                    growGroup(groups.at(-1), s, i, j, -1, 0);
                } else if (this.params.type == 'hex') {
                    const [i,j] = strpair(s.pairstr);
                    groups.push([s]);
                    growGroup(groups.at(-1), s, i, j, 0, 1);
                    growGroup(groups.at(-1), s, i, j, 0, -1);
                    groups.push([s]);
                    growGroup(groups.at(-1), s, i, j, 1, 0);
                    growGroup(groups.at(-1), s, i, j, -1, 0);
                    groups.push([s]);
                    growGroup(groups.at(-1), s, i, j, 1, -1);
                    growGroup(groups.at(-1), s, i, j, -1, 1);
                }
            }
        });
        // Find only matches of 3 or greater and remove duplicates
        return groups
            .filter(g => g.length > 2)
            .map(g => new Set(g))
            .filter((g, idx, grps) => {
                for (let i=0; i<grps.length; i++) {
                    let equal = true;
                    g.forEach(c => {
                        if (!grps[i].has(c)) equal = false;
                    });
                    if (equal) {
                        return i == idx;
                    } 
                }
            })
            .map(g => [...g]);
    }

    mousemove(p) {
        // Buttons in screen coords
        this.pause.hover = this.state == 'playing' && this.pause.contains(p);
        this.boxes.lost.button.hover = this.boxes.lost.button.contains(p);
        if (this.paused) {
            this.hover = null;
            return;
        }
        // Assets in game coords
        p = this.xforminv(p);
        this.hover = null;
        this.centers.forEach(c => {
            if (c.poly && c.poly.contains(p)) {
                this.hover = c;
            }
        });
    }

    mouseout() {
        this.pause.hover = false;
        this.boxes.lost.button.hover = false;
        this.hover = null;
    }

    get neighborDistance() {
        const tol = 1;
        switch(this.params.type) {
            case 'tri': return this.params.size/Math.sqrt(3)+tol;
            case 'square': return this.params.size+tol;
            case 'hex': return this.params.size*Math.sqrt(3)+tol;
        }
    }

    reset() {
        colors = colors.slice(0,6);
        this.state = 'intro';
        this.weather = new Weather(180, 1, 'single').add(Infinity, 2, 'point').add(Infinity, 10, 'dump');
        this.makePolys();
        this.cacheNeighbors();
        this.assignColors();
        this.time = 0;
        this.level.count = 1;
        this.blasts.count = 1;
        this.hardrat = 0.1;
        this.hardval = 0;
        this.klaxon.reset();
        this.timers.survive.reset();
    }

    rotate(theta) {
        this.centers.forEach(c => {
            const upd = rotate(c, theta);
            c.x = upd.x;
            c.y = upd.y;
            if (c.poly) {
                const updPoly = rotate(c.poly.params.center, theta);
                c.poly.params.center = updPoly;
                c.poly.params.angle += theta;
                c.poly.recalcBoundary();
                if (c.poly.to) {
                    const updTo = rotate(c.poly.to, theta);
                    c.poly.to = updTo;
                }
            }
        });
    }

    schedule(cb, time) {
        let maxidx = 0;
        for (const name in this.timers) {
            if (name.substr(0,6) == 'sched-') {
                const idx = parseInt(name.split('-')[1]);
                if (idx > maxidx) 
                    maxidx = idx;
            }
        }
        const name = 'sched-' + (maxidx+1);
        this.timers[name] = new Timer({
            t0: time,
            dt: -1,
            tf: 0,
            endcb: () => {
                cb();
                delete this.timers[name];
            }
        }); 
    }

    shower() {
        if (this.time <= 0) 
            return;
        const above = this.centers
            .filter(c => this.containsBucket(c, this.TOPPADDING))
            .filter(c => !this.contains(c));
        this.weather.systems
            .filter(w => this.time % w.time == 0).forEach(w => {
                let aboveCopy = [...above];
                let idcs;
                if (w.type == 'point') {
                    const pc = aboveCopy[Math.floor(Math.random()*aboveCopy.length)];
                    aboveCopy.sort((a,b) => len(sub(a,pc)) < len(sub(b,pc)));
                    idcs = [...Array(w.npoly).keys()];
                } else {
                    const maxy = aboveCopy.reduce((prev, c) => (c.y > prev) ? c.y : prev, 0);
                    aboveCopy = aboveCopy.filter(c => maxy-c.y > 50);
                    idcs = [...Array(aboveCopy.length).keys()];
                    shuffle(idcs);
                }
                idcs.slice(0,w.npoly).forEach(i => {
                    const c = aboveCopy[i];
                    c.poly.empty = false;
                    c.poly.hard = Math.random() > (1-this.hardrat) ? this.hardval : 0;
                    c.poly.color = randomChoice(colors);
                });
                this.audio.play('whoosh');
            });
    }

    // Randomly spawn several polys to fall from the sky
    showerIntro() {
        if (this.time <= 0) 
            return;
        if (!this.nextIntro) 
            this.nextIntro = randint(40,60);
        if (this.time % this.nextIntro != 0) 
            return;
        const topy = this.params.dim.h/2 + 2*this.params.size;
        const above = this.centers
            .filter(c => this.containsBucket(c, this.TOPPADDING))
            .filter(c => c.y > topy);
        const chosen = new Set();
        do {
            chosen.add(above[randint(0,above.length)]);
        } while (Math.random() < 0.3);
        [...chosen].forEach(c => {
            c.poly.empty = false;
            c.poly.color = randomChoice(colors);
            this.clearCenter(c);
        });
        this.nextIntro = 0;
        this.time = 0;
    }

    swapPolys(c1, c2, fall) {
        const cTo = {...c1.poly.params.center};
        const cFrom = {...c2.poly.params.center};
        [c1.poly.params, c2.poly.params] 
            = [{...c2.poly.params}, {...c1.poly.params}];
        c1.poly.params.center = cFrom;
        c2.poly.params.center = cTo;
        if (fall) {
            c2.poly.params.center = {...cFrom};
            this.anim.fall(c2.poly, cTo);
        }
        c1.poly.recalcBoundary();
        c2.poly.recalcBoundary();
        [c1.poly, c2.poly] = [c2.poly, c1.poly];
    }

    tick() {
        if (this.paused) {
            this.klaxon.tick();
            return;
        }
        this.time++;
        if (this.state == 'intro') {
            this.showerIntro();
            return;
        }
        if (this.state == 'lost') {
            return;
        }
        this.shower();
        this.fall();
        this.clear();
        for (const name in this.timers) 
            this.timers[name].tick();
        this.klaxon.tick();
        if (this.klaxon.level > this.params.dim.h/2) {
            this.state = 'lost';
            this.audio.stopMusic('space-loop');
            this.audio.play('lost');
        }
    }

    // Add center and flip y about center y
    xform(p) {
        const pp = add(p, this.center);
        pp.y = 2*this.center.y-pp.y;
        return pp;
    }

    // From screen coordinates to world coordinates
    xforminv(p) {
        const pp = sub(p, this.center);
        pp.y = -pp.y;
        return pp;
    }
}
