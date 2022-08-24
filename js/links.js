var $ = q => document.querySelector(q);
var $$ = q => document.querySelectorAll(q);

window.addEventListener('load', e => {
    // Load links from links.html (ad hoc javascript include)
    const links = $('#links');

    fetch('/links.html')
    .then(resp => resp.text())
    .then(text => {
        links.innerHTML = text;
        makeSmartLinks();
    })
    .catch(err => console.log(err));

    function makeSmartLinks() {
        const categories = $$('#links .category');
        let openul = null;
        
        function cursorInElement(elt, e) {
            const r = elt.getBoundingClientRect();
            const x = e.clientX;
            const y = e.clientY;
            return x >= r.x && x <= r.x+r.width && y >= r.y && y <= r.y+r.height;
        }
        
        categories.forEach(cat => {
            const ul = cat.parentNode.querySelector('ul');
            cat.addEventListener('mouseenter', e => {
                if (openul) {
                    openul.style.transform = 'translateY(-140px)';
                }
                ul.style.transform = 'translateY(0px)';
                openul = ul;
            });
            cat.addEventListener('mouseout', e => {
                if (!cursorInElement(ul, e)) {
                    ul.style.transform = 'translateY(-140px)';
                    openul = null;
                }
            });
            ul.addEventListener('mouseout', e => {
                // position: absolute takes ul out of flow?
                if (!cursorInElement(cat, e) && !cursorInElement(ul, e)) {
                    ul.style.transform = 'translateY(-140px)';
                    openul = null;
                }                
            });
        });
    }
});
