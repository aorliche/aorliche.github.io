window.addEventListener('load', e => {
    const posts = [];
    const postsDiv = document.querySelector('#posts');
    
    function populatePosts() {
        let gotFirstUnpinned = false;
        let gotFirstPinned = false;
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
                /*if (!gotFirstPinned && post.pinned) {
                    const h4 = document.createElement('h4');
                    h4.innerText = `Pinned Posts (${pinned.length})`;
                    h4.classList.add('recent');
                    postsDiv.appendChild(h4);
                    gotFirstPinned = true;
                }*/
                /*if (!gotFirstUnpinned && !post.pinned) {
					// Make last hr disappear
					if (postsDiv.lastChild && postsDiv.lastChild.classList.contains('post')) {
						postsDiv.lastChild.lastChild.style.display = 'none';
					}
                    const h4 = document.createElement('h4');
                    h4.innerText = `Recent Posts (${unpinned.length})`;
                    h4.classList.add('recent');
                    postsDiv.appendChild(h4);
                    gotFirstUnpinned = true;
                }*/
                const pdiv = document.createElement('div');
                pdiv.classList.add('post');
                pdiv.id = encodeURIComponent(post.href);
                const date = document.createElement('span');
                date.classList.add('date');
                date.innerText = post.date.toDateString();
                const h2 = document.createElement('h2');
                const title = document.createElement('a');
                title.classList.add('title');
                title.href = `#${pdiv.id}`;
                title.innerText = post.title;
                h2.appendChild(title);
                /*if (post.pinned) {
                    const img = document.createElement('img');
                    img.src = '/images/pin.png';
                    img.style.height = '14px';
                    img.style.top = '6px';
                    img.style.position = 'relative';
                    h2.prepend(img);
                }*/
                h2.prepend(date);
                const showBefore = document.createElement('a');
                showBefore.classList.add('pin');
                showBefore.innerText = 'Show';
                showBefore.href = '#';
                h2.appendChild(showBefore);
                const body = document.createElement('div');
                body.innerHTML = post.body;
                body.classList.add('body');
                pdiv.appendChild(h2);
                pdiv.appendChild(body);
				/*const hr = document.createElement('hr');
				pdiv.appendChild(hr);*/
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
                title.addEventListener('click', e => {
                    e.preventDefault();
                    body.style.display = 'block';
                    showBefore.innerText = 'Hide';
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
        function checkFinish() {
            if (--n == 0) {
                populatePosts();
            }
        }
        list.forEach(post => {
            fetch(`/posts/${post}`)
                .then(response => response.json())
                .then(content => {
                    content.href = post.replace(/\.[^/.]+$/, "");
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
