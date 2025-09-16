//======================================================================
//--- CONSTANTES Y VARIABLES GLOBALES ---
//======================================================================

// En app.js, reemplaza la vieja constante "apiKey"
const apiKey = TMDB_API_KEY; // Usa la variable global del archivo config.js
let currentTmdbId = '';
let currentTitle = '';
let currentSeason = 1;
let currentEpisode = 1;
let currentTotalSeasons = 0;


//======================================================================
//--- INICIALIZACIÓN Y EVENT LISTENERS ---
//======================================================================

/**
 * Se ejecuta cuando el contenido del DOM ha sido cargado.
 */
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

/**
 * Configura los event listeners para los elementos de la UI.
 */
function setupEventListeners() {
    document.getElementById('searchButton').addEventListener('click', handleSearch);
    document.getElementById('searchInput').addEventListener('keypress', handleKeyPressSearch);
    
    document.getElementById('prevSeason').addEventListener('click', () => changeSeason(-1));
    document.getElementById('nextSeason').addEventListener('click', () => changeSeason(1));
    document.getElementById('prevEpisode').addEventListener('click', () => changeEpisode(-1));
    
    document.getElementById('seasonInput').addEventListener('change', updateSeason);
    document.getElementById('episodeInput').addEventListener('change', updateEpisode);

    document.getElementById('playNextButton').addEventListener('click', playNext);
}

/**
 * Función principal de inicialización de la aplicación.
 */
function initializeApp() {
    createParticles();
    actualizarTituloPagina();
    setupEventListeners();
}


//======================================================================
//--- MANEJADORES DE EVENTOS (Handlers) ---
//======================================================================

/**
 * Maneja el evento de clic en el botón de búsqueda.
 */
function handleSearch() {
    const query = document.getElementById('searchInput').value;
    if (query) {
        searchContent(query);
    }
}

/**
 * Maneja el evento de presionar 'Enter' en el campo de búsqueda.
 */
function handleKeyPressSearch(event) {
    if (event.key === 'Enter') {
        handleSearch();
    }
}


//======================================================================
//--- FUNCIONES DE LA API (FETCH) ---
//======================================================================

/**
 * Busca películas o series usando la API de TMDB.
 * @param {string} query - El término de búsqueda.
 */
function searchContent(query) {
    const type = document.getElementById('typeSelector').value;
    const url = `https://api.themoviedb.org/3/search/${type}?api_key=${apiKey}&query=${encodeURIComponent(query)}`;

    // Limpia la UI antes de una nueva búsqueda
    resetPlayerAndResults();

    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            if (data.results.length === 0) {
                displayNoResults();
            } else {
                displayResults(data.results);
            }
        })
        .catch(error => console.error('Error en la búsqueda:', error));
}

/**
 * Obtiene los detalles de una serie para saber el número total de temporadas.
 * @param {string} tmdbId - El ID de la serie en TMDB.
 */
function fetchTvShowDetails(tmdbId) {
    const url = `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${apiKey}`;
    return fetch(url)
        .then(response => response.json())
        .then(data => {
            currentTotalSeasons = data.number_of_seasons;
        })
        .catch(error => console.error('Error al obtener detalles de la serie:', error));
}

/**
 * Actualiza el título H1 de la página con una cita filosófica.
 */
async function actualizarTituloPagina() {
    try {
        const response = await fetch('https://api.quotable.io/random?tags=philosophy');
        if (!response.ok) throw new Error('No se pudo obtener la frase');
        const data = await response.json();
        document.querySelector('h1').textContent = `${data.content} - ${data.author}`;
    } catch (error) {
        console.error('Error al obtener la frase:', error);
        document.querySelector('h1').textContent = "Buscador de Películas y Series";
    }
}


//======================================================================
//--- LÓGICA DE NAVEGACIÓN DE EPISODIOS ---
//======================================================================

/**
 * Reproduce el siguiente episodio de la serie.
 */
function playNext() {
    if (!currentTmdbId) return;

    const seasonDetailsUrl = `https://api.themoviedb.org/3/tv/${currentTmdbId}/season/${currentSeason}?api_key=${apiKey}`;

    fetch(seasonDetailsUrl)
        .then(response => response.json())
        .then(data => {
            const episodesInSeason = data.episodes.length;

            if (currentEpisode < episodesInSeason) {
                // Hay más episodios en la temporada actual
                currentEpisode++;
                embedTvShow(currentTmdbId, currentSeason, currentEpisode);
            } else if (currentSeason < currentTotalSeasons) {
                // Es el último episodio, pero hay más temporadas
                currentSeason++;
                currentEpisode = 1;
                embedTvShow(currentTmdbId, currentSeason, currentEpisode);
            } else {
                // Es el último episodio de la última temporada
                alert("¡Felicidades! Has terminado la serie.");
            }
        })
        .catch(error => console.error('Error al obtener detalles de la temporada:', error));
}

/**
 * Cambia la temporada actual.
 * @param {number} change - El cambio a aplicar (+1 o -1).
 */
function changeSeason(change) {
    const newSeason = currentSeason + change;
    if (newSeason >= 1 && newSeason <= currentTotalSeasons) {
        currentSeason = newSeason;
        currentEpisode = 1; // Reiniciar al primer episodio
        embedTvShow(currentTmdbId, currentSeason, currentEpisode);
    }
}

/**
 * Cambia el episodio actual.
 * @param {number} change - El cambio a aplicar (+1 o -1).
 */
function changeEpisode(change) {
    const newEpisode = currentEpisode + change;
    if (newEpisode >= 1) { // No hay límite superior aquí, playNext se encargará
        currentEpisode = newEpisode;
        embedTvShow(currentTmdbId, currentSeason, currentEpisode);
    }
}

/**
 * Actualiza la temporada desde el input numérico.
 */
function updateSeason() {
    const newSeason = parseInt(document.getElementById('seasonInput').value, 10);
    if (newSeason >= 1 && newSeason <= currentTotalSeasons) {
        currentSeason = newSeason;
        currentEpisode = 1;
        embedTvShow(currentTmdbId, currentSeason, currentEpisode);
    }
}

/**
 * Actualiza el episodio desde el input numérico.
 */
function updateEpisode() {
    const newEpisode = parseInt(document.getElementById('episodeInput').value, 10);
    if (newEpisode >= 1) {
        currentEpisode = newEpisode;
        embedTvShow(currentTmdbId, currentSeason, currentEpisode);
    }
}


//======================================================================
//--- MANIPULACIÓN DEL DOM Y UI ---
//======================================================================

/**
 * Muestra los resultados de la búsqueda en la página.
 * @param {Array} results - Un array de resultados de la API.
 */
function displayResults(results) {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '';

    results.forEach(result => {
        // ... (el código para crear resultItem, poster, title sigue igual)
        const resultItem = document.createElement('div');
        resultItem.classList.add('result-item');

        const poster = document.createElement('img');
        poster.src = result.poster_path ? `https://image.tmdb.org/t/p/w200${result.poster_path}` : 'https://via.placeholder.com/200x300';
        poster.alt = result.title || result.name;

        const title = document.createElement('h2');
        title.textContent = result.title || result.name;

        // MODIFICADO: El event listener del póster
        poster.addEventListener('click', async () => {
            const type = document.getElementById('typeSelector').value;
            currentTitle = result.title || result.name;
            currentTmdbId = result.id;

            resultsContainer.innerHTML = ''; 

            if (type === 'tv') {
                await fetchTvShowDetails(result.id);
                
                // NUEVO: Lógica para cargar el progreso
                const savedProgress = loadProgress(result.id);
                let startSeason = 1;
                let startEpisode = 1;

                if (savedProgress) {
                    console.log(`Continuando desde S${savedProgress.season}E${savedProgress.episode}`);
                    startSeason = savedProgress.season;
                    startEpisode = savedProgress.episode;
                }
                
                showEpisodeControls();
                embedTvShow(result.id, startSeason, startEpisode); // Usamos las variables de inicio

            } else {
                hideEpisodeControls();
                embedMovie(result.id);
            }
        });

        resultItem.appendChild(poster);
        resultItem.appendChild(title);
        resultsContainer.appendChild(resultItem);
    });
}

/**
 * Incrusta el reproductor para una película.
 * @param {string} tmdbId - El ID de la película en TMDB.
 */
function embedMovie(tmdbId) {
    const embedUrl = `https://vidsrc.to/embed/movie/${tmdbId}`;
    const playerContainer = document.getElementById('player');
    playerContainer.innerHTML = `<iframe src="${embedUrl}" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>`;
    playerContainer.style.display = 'block';
    displayContentTitle(currentTitle);
}

/**
 * Incrusta el reproductor para una serie.
 * @param {string} tmdbId - El ID de la serie.
 * @param {number} season - El número de temporada.
 * @param {number} episode - El número de episodio.
 */
function embedTvShow(tmdbId, season, episode) {
    const embedUrl = `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}`;
    const playerContainer = document.getElementById('player');
    playerContainer.innerHTML = `<iframe src="${embedUrl}" width="100%" height="100%" frameborder="0" allow="autoplay" allowfullscreen></iframe>`;
    playerContainer.style.display = 'block';
    
    // Actualiza el estado global y los inputs
    currentSeason = season;
    currentEpisode = episode;
    document.getElementById('seasonInput').value = season;
    document.getElementById('episodeInput').value = episode;

    displayContentTitle(currentTitle, season, episode);

    // NUEVO: Guardar el progreso cada vez que se carga un episodio.
    saveProgress(tmdbId, season, episode, currentTitle);
}

/**
 * Muestra el título del contenido que se está reproduciendo.
 */
function displayContentTitle(title, season = null, episode = null) {
    const displayElement = document.getElementById('imdbIdDisplay');
    if (season && episode) {
        displayElement.textContent = `Viendo: ${title} - T${season}:E${episode}`;
    } else {
        displayElement.textContent = `Viendo: ${title}`;
    }
}

/**
 * Muestra u oculta los controles de episodios.
 */
function showEpisodeControls() {
    document.getElementById('episodeControls').style.display = 'flex';
}

function hideEpisodeControls() {
    document.getElementById('episodeControls').style.display = 'none';
}

/**
 * Muestra un mensaje de que no se encontraron resultados.
 */
function displayNoResults() {
    document.getElementById('results').innerHTML = '<p>No se encontraron resultados.</p>';
}

/**
 * Limpia el reproductor y los resultados, útil para nuevas búsquedas.
 */
function resetPlayerAndResults() {
    const playerContainer = document.getElementById('player');
    playerContainer.style.display = 'none';
    playerContainer.innerHTML = '';
    document.getElementById('results').innerHTML = '';
    document.getElementById('imdbIdDisplay').textContent = '';
    hideEpisodeControls();
}

/**
 * Guarda el progreso de una serie en localStorage.
 * @param {string} tmdbId - El ID de la serie.
 * @param {number} season - La temporada actual.
 * @param {number} episode - El episodio actual.
 * @param {string} title - El título de la serie.
 */
function saveProgress(tmdbId, season, episode, title) {
    // Obtenemos el historial existente o creamos un objeto vacío
    const history = JSON.parse(localStorage.getItem('watchingHistory')) || {};
    // Actualizamos la entrada para esta serie
    history[tmdbId] = { season, episode, title };
    // Guardamos el historial actualizado
    localStorage.setItem('watchingHistory', JSON.stringify(history));
}

/**
 * Carga el progreso de una serie desde localStorage.
 * @param {string} tmdbId - El ID de la serie.
 * @returns {object|null} - El objeto con el progreso o null si no existe.
 */
function loadProgress(tmdbId) {
    const history = JSON.parse(localStorage.getItem('watchingHistory')) || {};
    return history[tmdbId] || null;
}

/**
 * Crea las partículas animadas del fondo.
 */
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    const numParticles = 100;

    for (let i = 0; i < numParticles; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.left = `${Math.random() * 100}vw`;
        particle.style.top = `${Math.random() * 100}vh`;
        particle.style.animationDuration = `${Math.random() * 5 + 3}s`;
        particle.style.animationDelay = `${Math.random() * 2}s`;
        particlesContainer.appendChild(particle);
    }
}




