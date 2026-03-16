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
		const galleriesJs = []; 
        for (let gname in json) {
            const nospace = gname.replace(/ /g, ''); 
            const h2 = document.createElement('h2');
			const hr = document.createElement('hr');
            h2.innerText = gname;
            h2.id = gname;
            const gdiv = document.createElement('div');
            gdiv.classList.add('gallery');
			galleriesJs.push({h2, hr, gdiv});
            const imgInfos = json[gname];
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
            galleries.appendChild(hr);
            galleries.appendChild(gdiv);
            const link = document.createElement('a');
            const span = document.createElement('span');
            link.innerText = gname;
            link.href = '#' + gname;
            artLinks.appendChild(link);
            span.innerText = ' | ';
            artLinks.appendChild(span);
			// Click link: hide everything then unhide the desired gallery
			link.addEventListener('click', e => {
				for (let i=0; i<galleriesJs.length; i++) {
					galleriesJs[i].h2.classList.add('hidden');
					galleriesJs[i].hr.classList.add('hidden');
					galleriesJs[i].gdiv.classList.add('hidden');
				}
				h2.classList.remove('hidden');
				hr.classList.remove('hidden');
				gdiv.classList.remove('hidden');
			});
        }
        // Remove last separator
        artLinks.removeChild(artLinks.lastChild);
		// Hide everything but the first gallery
		for (let i=1; i<galleriesJs.length; i++) {
			galleriesJs[i].h2.classList.add('hidden');
			galleriesJs[i].hr.classList.add('hidden');
			galleriesJs[i].gdiv.classList.add('hidden');
		}
    })
    .catch(err => {
        galleries.innerHTML = "<h2 style='text-align: center; color: red;'>Something went wrong loading images!</h2>";
        console.log(err);
    });

});
