const output = document.getElementById('output');
const artistForm = document.getElementById('artist-form');
const songForm = document.getElementById('song-form');
const loadArtistsBtn = document.getElementById('load-artists');
const loadSongsBtn = document.getElementById('load-songs');
const API_PREFIX = '/api';

async function api(path, init) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function print(data) {
  output.textContent = JSON.stringify(data, null, 2);
}

artistForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(artistForm);

  const payload = {
    name: formData.get('name'),
    genre: formData.get('genre'),
    isActive: true,
    profile: {
      country: formData.get('country'),
    },
  };

  try {
    const artist = await api(`${API_PREFIX}/artist`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    print({ createdArtist: artist });
    artistForm.reset();
  } catch (error) {
    print({ error: error.message });
  }
});

songForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(songForm);

  const payload = {
    title: formData.get('title'),
    durationSeconds: Number(formData.get('durationSeconds')),
    artistId: formData.get('artistId'),
    isExplicit: Boolean(formData.get('isExplicit')),
  };

  try {
    const song = await api(`${API_PREFIX}/song`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    print({ createdSong: song });
    songForm.reset();
  } catch (error) {
    print({ error: error.message });
  }
});

loadArtistsBtn.addEventListener('click', async () => {
  try {
    const artists = await api(`${API_PREFIX}/artist`);
    print({ artists });
  } catch (error) {
    print({ error: error.message });
  }
});

loadSongsBtn.addEventListener('click', async () => {
  try {
    const songs = await api(`${API_PREFIX}/song`);
    print({ songs });
  } catch (error) {
    print({ error: error.message });
  }
});
