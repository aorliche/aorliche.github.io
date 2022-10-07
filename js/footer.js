window.addEventListener('load', e => {
    const footer = document.querySelector('#footer');
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.innerText = 'Contact me';
    a.href = 'https://hunimal.org/Contact.php';
    p.innerHTML = "&#169; 2022 Anton Orlichenko<br>";
    p.appendChild(a);
    footer.appendChild(p);
});
