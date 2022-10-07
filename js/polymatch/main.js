var $ = e => document.querySelector(e);
var grid, audio;
var images = ['/images/polymatch/blast.png', '/images/polymatch/rotate.png', '/images/polymatch/lost.png', '/images/polymatch/polymatch.png'];
var sounds = ['/sounds/polymatch/clear.mp3', '/sounds/polymatch/swap.mp3', '/sounds/polymatch/plus.mp3', '/sounds/polymatch/blast.mp3', '/sounds/polymatch/klaxon.wav', '/sounds/polymatch/lost.wav', '/sounds/polymatch/whoosh.flac'];
var music = ['/sounds/polymatch/space-loop.wav'];
var assets = {};
var nloaded = 0;

function loadImageCb(dict, src, img) {
   dict[basename(src)] = img;
   if (++nloaded == images.length) {
        startGame();
   }
}

function loadImage(dict, src) {
    const img = new Image();
    img.src = src;
    img.addEventListener('load', () => loadImageCb(dict, src, img));
}

window.addEventListener('load', e => {
    audio = new Sounds();
    images.forEach(src => loadImage(assets, src));
    sounds.forEach(src => audio.load(basename(src), src));
    music.forEach(src => audio.loadMusic(basename(src), src));
});

function startGame() {
    const canvas = $('canvas');
    const ctx = canvas.getContext('2d');
    grid = new Grid({dim: {w: canvas.width, h: canvas.height}, type: 'hex', 
        irange: [-9,9], jrange: [-9,9] ,size: 30, angle: 0, ctx: ctx, assets: assets});
    /*for (let i=0; i<Math.PI/8; i+=Math.PI) {
        grid = new Grid({dim: {w: canvas.width, h: canvas.height}, type: 'hex', 
            irange: [-9,9], jrange: [-9,9] ,size: 30, angle: i, ctx: ctx, assets: assets});
        //grid.draw(ctx, 'red');
    }*/
    const anim = new Animator(grid, ctx, {w: canvas.width, h: canvas.height});
    grid.audio = audio;
    anim.start();
    let dragging = false;
    let prev = null;
    canvas.addEventListener('mousedown', e => {
        dragging = true;
    });
    canvas.addEventListener('mouseup', e => {
        dragging = false;
        prev = null;
    });
    canvas.addEventListener('mouseout', e => {
        /*dragging = false;
        prev = null;*/
        e.preventDefault();
        grid.mouseout();
    });
    // In screen coordinates
    canvas.addEventListener('mousemove', e => {
        e.preventDefault();
        const p = getCursorPosition(e);
        grid.mousemove(p);
        /*if (dragging) {
            const p = getCursorPosition(e);
            if (prev && !eq(p,prev)) {
                const c = point(canvas.width/2, canvas.height/2);
                const d = sub(p, prev);
                const m = sub(p, c);
                const n = sub(prev, c);
                const mm = len(m);
                const nn = len(n);
                const d2 = Math.pow(len(d),2);
                const m2 = Math.pow(mm,2);
                const n2 = Math.pow(nn,2);
                const theta = Math.acos((m2+n2-d2)/2/mm/nn);
                if (ccw(p,c,prev) < 0) { // ccw
                    grid.rotate(theta);
                } else { // cw
                    grid.rotate(-theta);
                }
           }
           prev = p;
        }*/
    });
    // Click, in screen coordinates
    canvas.addEventListener('click', e => {
        e.preventDefault();
        const p = getCursorPosition(e);
        grid.click(p);
    });
    canvas.addEventListener('contextmenu', e => {
        e.preventDefault();
        const p = getCursorPosition(e);
        grid.contextmenu(p);
    });
}
