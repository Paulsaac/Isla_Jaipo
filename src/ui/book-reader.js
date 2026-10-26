// Libro de lectura: contenido en DOM sobre dos hojas, sin otra escena WebGL.
export function createBookReader() {
    const reader=document.createElement('section');
    reader.id='book-reader';reader.hidden=true;
    reader.setAttribute('role','dialog');reader.setAttribute('aria-modal','true');
    reader.setAttribute('aria-label','Libro abierto');
    reader.innerHTML=`<div class="reading-book">
        <article class="book-sheet book-sheet-left"><h2 id="book-reader-title"></h2><div class="book-prose"></div><span class="book-page-number">1</span></article>
        <article class="book-sheet book-sheet-right"><div class="book-prose"></div><span class="book-page-number">2</span></article>
        <span class="book-binding" aria-hidden="true"></span>
    </div><p class="book-reader-hint"></p>`;
    document.body.append(reader);
    const columns=reader.querySelectorAll('.book-prose');
    return {
        get visible(){return !reader.hidden;},
        show(book) {
            const title=reader.querySelector('h2');
            title.textContent=book.title || '';title.hidden=!book.title;
            reader.querySelectorAll('.book-page-number').forEach((number,index)=>{
                number.textContent=(book.firstPage ?? 1)+index;
            });
            columns.forEach(column=>column.replaceChildren());
            book.pages.forEach((text,index)=>{
                const paragraph=document.createElement('p');paragraph.textContent=text;
                columns[index<2?0:1].append(paragraph);
            });
            reader.querySelector('.book-reader-hint').textContent=document.body.classList.contains('touch-mode')
                ? 'Toca la pantalla para cerrar' : '[E] Salir';
            reader.hidden=false;
        },
        hide(){reader.hidden=true;}
    };
}
