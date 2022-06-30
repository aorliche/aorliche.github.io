window.addEventListener('load', e => {
    const categories = document.querySelectorAll('#links .category');
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
                openul.style.transform = 'translateY(-200px)';
            }
            ul.style.transform = 'translateY(0px)';
            openul = ul;
        });
        cat.addEventListener('mouseout', e => {
            if (!cursorInElement(ul, e)) {
                ul.style.transform = 'translateY(-200px)';
                openul = null;
            }
        });
        ul.addEventListener('mouseout', e => {
            // position: absolute takes ul out of flow?
            if (!cursorInElement(cat, e) && !cursorInElement(ul, e)) {
                ul.style.transform = 'translateY(-200px)';
                openul = null;
            }                
        });
    });
});