var $ = q => document.querySelector(q);
var $$ = q => document.querySelectorAll(q);

window.addEventListener('load', e => {
    [...$$('.thumb')].forEach(div => {
        div.addEventListener('click', e2 => {
            location.href = div.querySelector('img').src;
        });
    });
});
