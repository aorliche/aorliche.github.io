var $ = q => document.querySelector(q);
var $$ = q => [...document.querySelectorAll(q)];

window.addEventListener('load', e => {
    function expand(evt) {
        const thumb = evt.target;
        const src = thumb.src.split('/').slice(-2).join('/');
        const title = $('#big .title');
        const img = $('#big img');
        title.innerText = thumb.alt;
        img.src = `/images/Art/${src}`;
        img.alt = thumb.alt;
        big.classList.remove('hidden');
    }
    function hide(evt) {
       $('#big').classList.add('hidden'); 
    }
    $('#big').addEventListener('click', hide, false);
    const galleries = $('#galleries');
    const artLinks = $('#art-links');
    fetch('/art-manifest.json')
    .then(resp => resp.json())
    .then(json => {
        for (let gname in json) {
            const nospace = gname.replace(' ', ''); 
            const h2 = document.createElement('h2');
            h2.innerText = gname;
            h2.id = gname;
            const gdiv = document.createElement('div');
            gdiv.classList.add('gallery');
            const imgInfos = json[gname];
            console.log(imgInfos);
            for (let i=0; i<imgInfos.length; i++) {
                const info = imgInfos[i];
                const img = document.createElement('img');
                img.src = `/images/Art/thumbs/${nospace}/${info[0]}`;
                img.classList.add('thumb');
                if (info.length > 1) {
                    img.alt = info[1];
                } else {
                    img.alt = info[0]
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/\.\w{3,4}$/, '');
                }
                gdiv.appendChild(img);
                img.addEventListener('click', expand, false);
            }
            galleries.appendChild(h2);
            galleries.appendChild(gdiv);
            const link = document.createElement('a');
            const span = document.createElement('span');
            link.innerText = gname;
            link.href = '#' + gname;
            artLinks.appendChild(link);
            span.innerText = ' | ';
            artLinks.appendChild(span);
        }
        // Remove last separator
        artLinks.removeChild(artLinks.lastChild);
    })
    .catch(err => {
        galleries.innerHTML = "<h2 style='text-align: center; color: red;'>Something went wrong loading images!</h2>";
        console.log(err);
    });

});
