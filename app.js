require('dotenv').config({ path: './ns.env' });

document.getElementById('searchButton').addEventListener('click', () => {
    const query = document.getElementById('searchInput').value;
    if (query) {
        searchContent(query);
    }
});

document.getElementById('searchInput').addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        const query = document.getElementById('searchInput').value;
        if (query) {
            searchContent(query);
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const particlesContainer = document.getElementById('particles');
    const numParticles = 100; // Número de partículas

    for (let i = 0; i < numParticles; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.left = `${Math.random() * 100}vw`; // Posición horizontal aleatoria
        particle.style.top = `${Math.random() * 100}vh`; // Posición vertical aleatoria
        particle.style.animationDuration = `${Math.random() * 5 + 3}s`; // Duración aleatoria
        particle.style.animationDelay = `${Math.random() * 2}s`; // Retraso aleatorio
        particlesContainer.appendChild(particle);
    }
});

document.getElementById('prevSeason').addEventListener('click', () => changeSeason(-1));
document.getElementById('nextSeason').addEventListener('click', () => changeSeason(1));
document.getElementById('prevEpisode').addEventListener('click', () => changeEpisode(-1));
document.getElementById('nextEpisode').addEventListener('click', () => changeEpisode(1));

document.getElementById('seasonInput').addEventListener('change', () => updateSeason());
document.getElementById('episodeInput').addEventListener('change', () => updateEpisode());

let currentTmdbId = '';
let currentSeason = 1;
let currentEpisode = 1;

function searchContent(query) {
    const type = document.getElementById('typeSelector').value;
    const apiKey = av.env.API_KEY; // Leer la API Key desde ns.env
    const url = `https://api.themoviedb.org/3/search/${type}?api_key=${apiKey}&query=${encodeURIComponent(query)}`;

    // Ocultar el cuadro del video anterior y limpiar el contenido
    const playerContainer = document.getElementById('player');
    playerContainer.style.display = 'none';
    playerContainer.innerHTML = '';
    document.getElementById('imdbIdDisplay').textContent = '';
    hideEpisodeControls(); // Ocultar controles de episodios

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            if (data.results.length === 0) {
                displayNoResults();
            } else {
                displayResults(data.results);
            }
        })
        .catch(error => console.error('Error:', error));
}


function displayResults(results) {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '';

    results.forEach(result => {
        const resultItem = document.createElement('div');
        resultItem.classList.add('result-item');

        const title = document.createElement('h2');
        title.textContent = result.title || result.name;

        const overview = document.createElement('p');
        overview.textContent = result.overview;

        const poster = document.createElement('img');
        poster.src = result.poster_path ? `https://image.tmdb.org/t/p/w200${result.poster_path}` : 'https://via.placeholder.com/100';
        poster.alt = result.title || result.name;

        poster.dataset.tmdbId = result.id;
        poster.addEventListener('click', () => {
            displayTmdbId(result.id);
            currentTmdbId = result.id;
            const type = document.getElementById('typeSelector').value;
            if (type === 'tv') {
                showEpisodeControls();
                embedTvShow(result.id, 1, 1); // Temporada 1, Episodio 1
            } else {
                hideEpisodeControls();
                embedMovie(result.id);
            }
        });

        resultItem.appendChild(poster);
        resultItem.appendChild(title);
        resultItem.appendChild(overview);
        resultsContainer.appendChild(resultItem);
    });
}

function embedMovie(tmdbId) {
    fetchContentDetails(tmdbId).then(imdbId => {
        if (imdbId) {
            const embedUrl = `https://vidsrc.to/embed/movie/${imdbId}`;
            const playerContainer = document.getElementById('player');
            playerContainer.innerHTML = `<iframe src="${embedUrl}" width="800" height="450" frameborder="0" allowfullscreen></iframe>`;
            playerContainer.style.display = 'block';

            const resultsContainer = document.getElementById('results');
            resultsContainer.innerHTML = '';

            const searchContainer = document.getElementById('searchContainer');
            searchContainer.appendChild(playerContainer);
        } else {
            console.error('No se pudo obtener el ID de IMDb.');
        }
    });
}

function embedTvShow(tmdbId, season, episode) {
    const embedUrl = `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}`;
    const playerContainer = document.getElementById('player');
    playerContainer.innerHTML = `<iframe src="${embedUrl}" width="800" height="450" frameborder="0" allowfullscreen></iframe>`;
    playerContainer.style.display = 'block';

    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '';

    const searchContainer = document.getElementById('searchContainer');
    searchContainer.appendChild(playerContainer);

    // Actualizar la temporada y episodio actuales
    currentSeason = season;
    currentEpisode = episode;
    document.getElementById('seasonInput').value = season;
    document.getElementById('episodeInput').value = episode;
}


function fetchContentDetails(contentId) {
    const type = document.getElementById('typeSelector').value;
    const apiKey = av.env.API_KEY; // Leer la API Key desde ns.env
    const url = `https://api.themoviedb.org/3/${type}/${contentId}?api_key=${apiKey}`;

    return fetch(url)
        .then(response => response.json())
        .then(data => {
            return data.imdb_id ? data.imdb_id : null;
        })
        .catch(error => {
            console.error('Error fetching content details:', error);
            return null;
        });
}

function displayTmdbId(tmdbId) {
    const tmdbIdDisplay = document.getElementById('imdbIdDisplay');
    tmdbIdDisplay.textContent = `TMDB ID: ${tmdbId}`;
}

function displayNoResults() {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '<p>No se encontraron resultados.</p>';
}

function showEpisodeControls() {
    document.getElementById('episodeControls').style.display = 'flex';
}

function hideEpisodeControls() {
    document.getElementById('episodeControls').style.display = 'none';
}

function changeSeason(change) {
    const newSeason = currentSeason + change;
    if (newSeason >= 1) {
        currentSeason = newSeason;
        currentEpisode = 1; // Reset episode to 1 when changing season
        document.getElementById('seasonInput').value = currentSeason;
        document.getElementById('episodeInput').value = currentEpisode;

        embedTvShow(currentTmdbId, currentSeason, currentEpisode);
    }
}

function changeEpisode(change) {
    const newEpisode = currentEpisode + change;
    if (newEpisode >= 1) {
        currentEpisode = newEpisode;
        document.getElementById('episodeInput').value = currentEpisode;
        embedTvShow(currentTmdbId, currentSeason, currentEpisode);
    }
}

function updateSeason() {
    const newSeason = parseInt(document.getElementById('seasonInput').value);
    if (newSeason >= 1) {
        currentSeason = newSeason;
        currentEpisode = 1; // Reset episode to 1 when changing season
        document.getElementById('episodeInput').value = currentEpisode;

        embedTvShow(currentTmdbId, currentSeason, currentEpisode);
    }
}

function updateEpisode() {
    const newEpisode = parseInt(document.getElementById('episodeInput').value);
    if (newEpisode >= 1) {
        currentEpisode = newEpisode;

        embedTvShow(currentTmdbId, currentSeason, currentEpisode);
    }
}
