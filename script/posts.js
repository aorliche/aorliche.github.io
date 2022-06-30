window.addEventListener('load', e => {
    const posts = [];
    const postsDiv = document.querySelector('#posts');
    
    function populatePosts() {
        let gotFirst = false;
        posts.forEach(post => post.date = new Date(post.date));
        posts.sort((a,b) => b.date-a.date);
        for (let i=0; i<posts.length; i++) {
            posts[i].n = posts.length-i-1;
        }
        if (posts.length == 0) {
            postsDiv.innerHTML = "<h2>No posts yet</h2>";
        } else {
            const pinned = posts.filter(post => post.pinned);
            const unpinned = posts.filter(post => !post.pinned);
            pinned.concat(unpinned).forEach(post => {
                if (!gotFirst && !post.pinned) {
                    const h4 = document.createElement('h4');
                    h4.innerText = 'Recent Posts';
                    postsDiv.appendChild(h4);
                    gotFirst = true;
                }
                const pdiv = document.createElement('div');
                pdiv.classList.add('post');
                const date = document.createElement('span');
                date.classList.add('date');
                date.innerText = post.date.toDateString();
                const h2 = document.createElement('h2');
                h2.innerText = post.title + ' ';
                if (post.pinned) {
                    const pin = document.createElement('span');
                    const img = document.createElement('img');
                    pin.classList.add('pin');
                    pin.innerText = '[Pinned] ';
                    img.src = '/images/pin.png';
                    img.style.height = '14px';
                    img.style.top = '6px';
                    img.style.position = 'relative';
                    //h2.prepend(pin);
                    h2.prepend(img);
                }
                h2.prepend(date);
                //const below = document.createElement('div');
                //below.innerText = `Posted by ${post.author} on ${post.date.toString()}`;
                const showBefore = document.createElement('a');
                showBefore.classList.add('pin');
                showBefore.innerText = 'Show';
                showBefore.href = '#';
                h2.appendChild(showBefore);
                const body = document.createElement('div');
                body.innerHTML = post.body;
                if (!post.pinned) {
                    body.appendChild(document.createElement('hr'));
                    body.prepend(document.createElement('hr'));
                }
                pdiv.appendChild(h2);
                //pdiv.appendChild(below);
                pdiv.appendChild(body);
                postsDiv.appendChild(pdiv);
                if (post.pinned) {
                    showBefore.innerText = 'Hide';
                } else {
                    body.style.display = 'none';
                }
                const hideAfter = document.createElement('a');
                const hideAfterP = document.createElement('p');
                hideAfter.innerText = 'Hide';
                hideAfter.href = '#';
                hideAfterP.appendChild(hideAfter);
                body.appendChild(hideAfterP);
                showBefore.addEventListener('click', e => {
                    e.preventDefault();
                    if (showBefore.innerText == 'Show') {
                        body.style.display = 'block';
                        showBefore.innerText = 'Hide';
                    } else {
                        body.style.display = 'none';
                        showBefore.innerText = 'Show';
                    }
                });
                hideAfterP.addEventListener('click', e => {
                    e.preventDefault();
                    body.style.display = 'none';
                    showBefore.innerText = 'Show';
                });
            });
        }
    }
    
    function getPosts(list) {
        let n = list.length;
        console.log(list);
        function checkFinish() {
            if (--n == 0) {
                console.log(posts);
                populatePosts();
            }
        }
        list.forEach(post => {
            fetch(`/posts/${post}`)
                .then(response => response.json())
                .then(content => {
                    posts.push(content);
                    checkFinish();
                })
                .catch(error => {
                    console.log(error);
                    checkFinish();
                });
        });
    }
    
    // Get posts
    fetch('/posts/AllPosts.json')
        .then(response => response.json())
        .then(list => getPosts(list))
        .catch(error => {
            console.log(error);
        });
});