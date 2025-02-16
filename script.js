// Variáveis globais
let channels = [];
let movies = [];
let series = [];
let epgData = [];
const videoPlayer = document.getElementById("video-player");

// Função para verificar se o stream está online
async function isStreamOnline(streamUrl) {
  try {
    const response = await fetch(streamUrl, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error("Erro ao verificar stream:", error);
    return false;
  }
}

// Função para reproduzir um stream
function playStream(streamUrl) {
  if (!streamUrl) {
    alert("URL do stream inválida.");
    return;
  }

  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(streamUrl);
    hls.attachMedia(videoPlayer);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      videoPlayer.play();
    });
  } else if (videoPlayer.canPlayType("application/vnd.apple.mpegurl")) {
    videoPlayer.src = streamUrl;
    videoPlayer.addEventListener("loadedmetadata", () => {
      videoPlayer.play();
    });
  } else {
    alert("Seu navegador não suporta HLS.");
  }
}

// Função para renderizar itens em uma lista
function renderItems(listId, items) {
  const list = document.getElementById(listId);
  list.innerHTML = "";

  items.forEach(item => {
    const itemElement = document.createElement("div");
    itemElement.classList.add("item");
    itemElement.innerHTML = `
      <img src="${item.logo || 'https://via.placeholder.com/150'}" alt="${item.name}">
      <p>${item.name}</p>
    `;
    itemElement.addEventListener("click", async () => {
      const isOnline = await isStreamOnline(item.stream);
      if (isOnline) {
        playStream(item.stream);
      } else {
        alert(`O stream "${item.name}" está offline.`);
      }
    });
    list.appendChild(itemElement);
  });
}

// Processar M3U
async function parseM3U(url) {
  try {
    console.log("Buscando URL M3U:", url);
    const proxyUrl = "https://cors-anywhere.herokuapp.com/";
    const response = await fetch(proxyUrl + url);
    if (!response.ok) throw new Error(`Erro ao carregar M3U: ${response.status}`);
    const text = await response.text();
    console.log("Conteúdo do M3U:", text);

    const lines = text.split("\n");
    const parsedChannels = [];

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith("#EXTINF:")) {
        const name = lines[i].match(/tvg-name="(.*?)"/)?.[1] || lines[i].split(",").pop().trim();
        const logo = lines[i].match(/tvg-logo="(.*?)"/)?.[1] || "";
        const stream = lines[i + 1].trim();
        if (stream) parsedChannels.push({ name, logo, stream });
      }
    }

    channels = parsedChannels;
    renderItems("channels-list", channels);
  } catch (error) {
    console.error("Erro ao processar M3U:", error);
    alert("Falha ao carregar a lista M3U.");
  }
}

// Processar Xtream API
async function fetchXtream(server, username, password) {
  try {
    console.log("Buscando dados Xtream...");
    const liveStreamsResponse = await fetch(`${server}/player_api.php?username=${username}&password=${password}&action=get_live_streams`);
    const liveStreams = await liveStreamsResponse.json();

    const vodResponse = await fetch(`${server}/player_api.php?username=${username}&password=${password}&action=get_vod_streams`);
    const vodStreams = await vodResponse.json();

    const seriesResponse = await fetch(`${server}/player_api.php?username=${username}&password=${password}&action=get_series`);
    const seriesStreams = await seriesResponse.json();

    const epgResponse = await fetch(`${server}/player_api.php?username=${username}&password=${password}&action=get_simple_data_table&stream_id=all`);
    const epg = await epgResponse.json();

    channels = liveStreams.map(channel => ({
      name: channel.name,
      logo: channel.stream_icon,
      stream: `${server}/${channel.stream_id}`,
    }));

    movies = vodStreams.map(movie => ({
      name: movie.name,
      logo: movie.stream_icon,
      stream: `${server}/${movie.stream_id}`,
    }));

    series = seriesStreams.map(serie => ({
      name: serie.name,
      logo: serie.cover,
      stream: `${server}/${serie.stream_id}`,
    }));

    epgData = epg.map(epgItem => ({
      name: epgItem.title,
      description: epgItem.description,
      start: epgItem.start,
      end: epgItem.end,
    }));

    renderItems("channels-list", channels);
    renderItems("movies-list", movies);
    renderItems("series-list", series);
    renderItems("epg-list", epgData);
  } catch (error) {
    console.error("Erro ao processar Xtream:", error);
    alert("Falha ao carregar a lista Xtream.");
  }
}

// Manipula o envio do formulário M3U
document.getElementById("m3u-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const m3uUrl = document.getElementById("m3u-url").value.trim();
  if (m3uUrl) {
    parseM3U(m3uUrl);
    showMainScreen();
  } else {
    alert("Por favor, insira uma URL M3U válida.");
  }
});

// Manipula o envio do formulário Xtream
document.getElementById("xtream-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const xtreamServer = document.getElementById("xtream-server").value.trim();
  const xtreamUsername = document.getElementById("xtream-username").value.trim();
  const xtreamPassword = document.getElementById("xtream-password").value.trim();

  if (xtreamServer && xtreamUsername && xtreamPassword) {
    fetchXtream(xtreamServer, xtreamUsername, xtreamPassword);
    showMainScreen();
  } else {
    alert("Por favor, insira todas as credenciais Xtream.");
  }
