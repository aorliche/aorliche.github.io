var $ = q => document.querySelector(q);
var $$ = q => [...document.querySelectorAll(q)];

var nscripts = 0;
var nscriptsloaded = 0;

window.addEventListener('load', e => {
    let nposts = null;
    let nrecvd = 0;
    let posts = [];
    let names = [];

    function nodeScriptClone(node) {
        var script  = document.createElement("script");
        script.text = node.innerHTML;
        
        nscripts += 1;
        script.addEventListener('load', e => {
            nscriptsloaded++;
        });

        var i = -1, attrs = node.attributes, attr;
        while ( ++i < attrs.length ) {
            script.setAttribute( (attr = attrs[i]).name, attr.value );
        }
        node.parentNode.replaceChild(script, node);
    }

    // All posts have been loaded
    function mergePosts() {
        posts.sort((a,b) => b[1]-a[1]);
        posts.forEach(p => {
            $('#posts').appendChild(p[0]);
        });
        // Apply MathJax
        var script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js';
        document.head.appendChild(script);
    }

    function loadPost(url) {
        fetch(url)
        .then(res => res.text())
        .then(text => {
            nrecvd++;
            const div = document.createElement('div');
            div.innerHTML = text;
            div.classList.add('post');
            const title = div.querySelector('.title');
            div.id = title.href.split('?post=')[1];
            // Don't do anything with this yet...
            title.addEventListener('click', e => {
                e.preventDefault();
            });
            // Show/hide post
            div.querySelector('a.pin').addEventListener('click', e => {
                e.preventDefault();
                const body = $(`#${div.id} .body`);
                const pin = div.querySelector('a.pin');
                if (pin.innerText == 'Hide') {
                    pin.innerText = 'Show';
                    body.style.display = 'none';
                } else {
                    pin.innerText = 'Hide';
                    body.style.display = 'block';
                }
            });
            // Need to clone all script tags that were inserted via innerHTML
            div.querySelectorAll('script').forEach(node => nodeScriptClone(node));
            // To sort by date later
            const datestr = div.querySelector('.date').innerText;
            const date = Math.floor(new Date(datestr)/1000);
            posts.push([div, date]);
            // Merge when got all in manifest
            if (nrecvd == nposts) {
                mergePosts();
            }
        })
        .catch(err => {
            // Load whatever posts we can
            nrecvd++;
            console.log(title);
            console.log(err);
        });
    }
    
    // Get posts
    fetch('/posts/manifest.json')
    .then(res => res.json())
    .then(list => {
        names = list.map(obj => obj.name);
        nposts = list.length;

        // Add posts blurbs
        list.slice().reverse().forEach(obj => {
            const div = document.createElement('div');
            const span = document.createElement('span');
            const br = document.createElement('br');
            const a = document.createElement('a');
            a.href = `/?post=${obj.name}`;
            a.innerText = obj.title;
            span.innerText = obj.date;
            div.appendChild(span);
            div.appendChild(br);
            div.appendChild(a);
            $('#post-blurbs').appendChild(div);
        });
        if (nposts > 3) {
            nposts = 3;
        }

        // See if we want a specific post
        const urlParams = new URLSearchParams(window.location.search);
        const name = urlParams.get('post');

        if (names.includes(name)) {
            nposts = 1;
            loadPost(`/posts/${name}.html`);
            return;
        }

        // Load new posts
        list.slice(-nposts).forEach(obj => {
            loadPost(`/posts/${obj.name}.html`);
        });
    })
    .catch(err => {
        console.log(err);
    });
});
