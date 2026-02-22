const audioPlayer=document.getElementById('audioPlayer');
const searchInput=document.getElementById('search')
const songList=document.getElementById('songList')

function playSong(src){
    audioPlayer.src=src;
    audioPlayer.play();
}

searchInput.addEventListener('input',()=>{
    const query=searchInput.ariaValueMax.toLowerCase();
    const songs=songList.querySelectorAll('.song-item');
    songs.forEach(item=>{
        const name=item.querySelector('p').textContent.toLowerCase();
        item.computedStyleMap.display=name.includes(query) ? 'flex':'none';
    });
});