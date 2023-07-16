var $ = q => document.querySelector(q);
var $$ = q => document.querySelectorAll(q);

window.addEventListener('load', e => {
    // Load links from links.html (ad hoc javascript include)
    const links = $('#links');

    fetch('/links.html')
    .then(resp => resp.text())
    .then(text => {
        links.innerHTML = text;
    })
    .catch(err => console.log(err));
});
