window.addEventListener('load', e => {
    const footer = document.querySelector('#footer');
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.innerText = 'Contact me';
    a.href = 'https://hunimal.org/Contact.php';
    p.innerHTML = "&#169; 2022 Anton Orlichenko<br><iframe src='https://hunimal.org/aorliche/counter.php' title='Counter' style='border: none; width: 50px; height: 12px;'></iframe> visitors since June 2022<br>";
    p.appendChild(a);
    footer.appendChild(p);
});
