window.addEventListener('load', e => {
    const posts = [];
    const postsDiv = document.querySelector('#posts');
    
    function populatePosts() {
        posts.forEach(post => console.log(post.date));
        posts.forEach(post => post.date = new Date(post.date));
        posts.sort((a,b) => b.date-a.date);
        if (posts.length == 0) {
            postsDiv.innerHTML = "<h2>No posts yet</h2>";
        } else {
            posts.forEach(post => {
                const pdiv = document.createElement('div');
                pdiv.classList.add('post');
                const h2 = document.createElement('h2');
                h2.innerText = post.title;
                const below = document.createElement('div');
                below.innerText = `Posted by ${post.author} on ${post.date.toString()}`;
                const body = document.createElement('div');
                body.innerHTML = post.body;
                pdiv.appendChild(h2);
                pdiv.appendChild(below);
                pdiv.appendChild(body);
                postsDiv.appendChild(pdiv);
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