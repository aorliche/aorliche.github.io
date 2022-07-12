window.addEventListener('load', e => {
    function displayQuote(list) {
        const div = document.querySelector('#quote');
        const quote = list[Math.floor(list.length*Math.random())];
        div.innerHTML = quote;
    }

    // Get quotes
    fetch('/quotes.json')
        .then(response => response.json())
        .then(list => displayQuote(list))
        .catch(error => {
            console.log(error);
        });
});