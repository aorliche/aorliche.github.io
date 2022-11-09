var $ = q => document.querySelector(q);
var $$ = q => [...document.querySelectorAll(q)];

function setImg(thumb) {
    const img = thumb.querySelector('img');
    $('#big img').src = img.src;
    $('#big h2').innerText = img.alt; 
    $$('.selected').forEach(sel => sel.classList.remove('selected'));
    thumb.classList.add('selected');
}

window.addEventListener('load', e => {
    [...$$('.thumb')].forEach(thumb => {
        thumb.addEventListener('click', elt => {
            setImg(thumb);
        });
    });
    setImg($('.thumb'));
    
    let storedHash = '#' + $$('.gallery').filter(g => !g.classList.contains('hidden'))[0].id;
    window.addEventListener('hashchange', e => {
        e.preventDefault();
        if (location.hash != storedHash) {
            const newHash = location.hash.split('-')[0];
            $(`${newHash}`).classList.remove('hidden');
            $(`${storedHash}`).classList.add('hidden');
            $('#big img').src = '';
            $('#big h2').innerText = '';
            storedHash = newHash;
        }
    });
    
    let curScroll = 0;
    ['left', 'right'].forEach(side => {
        $(`#scroll-${side}`).addEventListener('mouseover', e => {
            $(`#scroll-${side} img`).src = `images/scroll-${side}-hl.png`;
        });
        $(`#scroll-${side}`).addEventListener('mouseout', e => {
            $(`#scroll-${side} img`).src = `images/scroll-${side}.png`;
        });
        $(`#scroll-${side}`).addEventListener('click', e => {
            e.preventDefault();
            const gallery = $('.gallery:not(.hidden)');
            const sw = gallery.scrollWidth;
            const cw = gallery.clientWidth;
            curScroll = side == 'left' ? curScroll-400 : curScroll+400;
            if (curScroll < 0) curScroll = 0;
            if (curScroll > sw-cw) curScroll = sw-cw;
            gallery.scroll({left: curScroll, behavior: 'smooth'});
        });
    });
});