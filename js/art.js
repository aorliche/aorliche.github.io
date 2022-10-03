var $ = q => document.querySelector(q);
var $$ = q => [...document.querySelectorAll(q)];

function setImg(thumb) {
    const img = thumb.querySelector('img');
    $('#big img').src = img.src;
    $('#big h2').innerText = img.alt; 
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
});