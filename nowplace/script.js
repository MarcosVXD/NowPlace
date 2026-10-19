const API = "https://api.jsonplaceholder.dev";
const CHAVE_USUARIO = "nowplace_usuario";
const CHAVE_NOWS = "nowplace_publicacoes";
const CHAVE_ULTIMA_PUBLICACAO = "nowplace_ultima_publicacao";

const entrada = document.getElementById("entrada");
const app = document.getElementById("app");
const formUsuario = document.getElementById("formUsuario");
const nomeUsuario = document.getElementById("nomeUsuario");
const usuarioTopo = document.getElementById("usuarioTopo");
const descricao = document.getElementById("descricao");
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const cameraPlaceholder = document.getElementById("cameraPlaceholder");
const passoCamera = document.getElementById("passoCamera");
const instrucaoCamera = document.getElementById("instrucaoCamera");
const mensagem = document.getElementById("mensagem");
const iniciarCamera = document.getElementById("iniciarCamera");
const capturar = document.getElementById("capturar");
const publicar = document.getElementById("publicar");
const previews = document.getElementById("previews");
const fotoAmbiente = document.getElementById("fotoAmbiente");
const fotoSelfie = document.getElementById("fotoSelfie");
const obterLocal = document.getElementById("obterLocal");
const nomeLocal = document.getElementById("nomeLocal");
const coordenadas = document.getElementById("coordenadas");
const raio = document.getElementById("raio");
const avisoFeed = document.getElementById("avisoFeed");
const feed = document.getElementById("feed");

let nomeAtual = "";
let stream = null;
let etapa = 0;
let imagemAmbiente = "";
let imagemSelfie = "";
let localAtual = null;

function mostrarMensagem(texto) {
  mensagem.textContent = texto;
}

function chaveUltimaPublicacao() {
  return CHAVE_ULTIMA_PUBLICACAO + "_" + nomeAtual.trim().toLowerCase();
}

function lerNows() {
  try {
    const dados = JSON.parse(localStorage.getItem(CHAVE_NOWS));
    return Array.isArray(dados) ? dados : [];
  } catch {
    return [];
  }
}

function salvarNows(nows) {
  localStorage.setItem(CHAVE_NOWS, JSON.stringify(nows));
}

function iniciarAplicacao(nome) {
  nomeAtual = nome.trim();
  localStorage.setItem(CHAVE_USUARIO, nomeAtual);

  usuarioTopo.textContent = "Olá, " + nomeAtual;
  entrada.hidden = true;
  app.hidden = false;

  atualizarFeed();
}

formUsuario.addEventListener("submit", (evento) => {
  evento.preventDefault();

  const nome = nomeUsuario.value.trim();

  if (!nome) {
    mostrarMensagem("Digite seu nome para continuar.");
    return;
  }

  iniciarAplicacao(nome);
});

async function ligarCamera(modo) {
  desligarCamera();

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    mostrarMensagem("Câmera indisponível. Abra o site em localhost ou HTTPS.");
    return;
  }

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: modo },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    });

    video.srcObject = stream;
    video.hidden = false;
    cameraPlaceholder.hidden = true;

    await video.play();

    capturar.disabled = false;
  } catch (erro) {
    desligarCamera();

    mostrarMensagem(
      "Não foi possível abrir a câmera. Verifique a permissão do navegador."
    );

    cameraPlaceholder.hidden = false;
    passoCamera.textContent = "Câmera indisponível";
    instrucaoCamera.textContent =
      "Permita o acesso à câmera e tente novamente.";

    console.error("Erro na câmera:", erro);
  }
}

function desligarCamera() {
  if (stream) {
    stream.getTracks().forEach((faixa) => faixa.stop());
    stream = null;
  }

  video.srcObject = null;
  video.hidden = true;
}

iniciarCamera.addEventListener("click", async () => {
  etapa = 0;
  imagemAmbiente = "";
  imagemSelfie = "";

  previews.hidden = true;
  publicar.disabled = true;
  capturar.disabled = true;
  iniciarCamera.disabled = true;

  capturar.textContent = "Capturar ambiente";
  passoCamera.textContent = "Preparando câmera...";
  instrucaoCamera.textContent = "";

  await ligarCamera("environment");

  if (stream) {
    passoCamera.textContent = "Enquadre o ambiente";
    instrucaoCamera.textContent =
      "A primeira foto será do lugar onde você está.";

    iniciarCamera.textContent = "Reiniciar captura";
    mostrarMensagem("Câmera ligada. Capture primeiro o ambiente.");
  }

  iniciarCamera.disabled = false;
});

capturar.addEventListener("click", async () => {
  if (!stream || !video.videoWidth || !video.videoHeight) {
    mostrarMensagem("Aguarde a câmera carregar antes de capturar.");
    return;
  }

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const contexto = canvas.getContext("2d");

  contexto.drawImage(
    video,
    0,
    0,
    canvas.width,
    canvas.height
  );

  const foto = canvas.toDataURL("image/jpeg", 0.8);

  if (etapa === 0) {
    imagemAmbiente = foto;
    fotoAmbiente.src = foto;

    etapa = 1;
    capturar.disabled = true;

    mostrarMensagem("Ambiente capturado. Abrindo a câmera frontal...");

    passoCamera.textContent = "Agora tire uma selfie";
    instrucaoCamera.textContent =
      "A primeira foto foi concluída.";

    await ligarCamera("user");

    if (stream) {
      capturar.textContent = "Capturar selfie";
      mostrarMensagem("Agora capture sua selfie.");
    } else {
      etapa = 0;
      imagemAmbiente = "";
      mostrarMensagem("Não foi possível abrir a câmera frontal. Tente novamente.");
    }

    return;
  }

  if (etapa === 1) {
    imagemSelfie = foto;
    fotoSelfie.src = foto;

    previews.hidden = false;
    etapa = 2;

    desligarCamera();

    capturar.disabled = true;
    capturar.textContent = "Fotos capturadas";
    publicar.disabled = false;

    cameraPlaceholder.hidden = false;
    passoCamera.textContent = "Fotos prontas";
    instrucaoCamera.textContent =
      "Confira as duas imagens antes de publicar.";

    mostrarMensagem("Fotos capturadas. A câmera foi desligada.");
  }
});

obterLocal.addEventListener("click", obterGeolocalizacao);

async function consultarEndereco(latitude, longitude) {
  const url =
    "https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=" +
    encodeURIComponent(latitude) +
    "&lon=" +
    encodeURIComponent(longitude) +
    "&zoom=18&addressdetails=1";

  const resposta = await fetch(url);

  if (!resposta.ok) {
    throw new Error("Não foi possível consultar o endereço.");
  }

  const dados = await resposta.json();
  const endereco = dados.address || {};

  const bairro =
    endereco.neighbourhood ||
    endereco.residential ||
    endereco.quarter ||
    endereco.suburb ||
    endereco.city_district ||
    endereco.hamlet;

  const cidade =
    endereco.city ||
    endereco.town ||
    endereco.village ||
    endereco.municipality;

  const partes = [
    bairro,
    cidade,
    endereco.state,
    endereco.country
  ].filter(Boolean);

  return partes.join(", ") || dados.display_name || "";
}

function obterGeolocalizacao() {
  if (!navigator.geolocation) {
    mostrarMensagem("Este navegador não oferece geolocalização.");
    return;
  }

  obterLocal.disabled = true;
  nomeLocal.textContent = "Obtendo localização...";
  coordenadas.textContent = "";

  navigator.geolocation.getCurrentPosition(
    async (posicao) => {
      const latitude = posicao.coords.latitude;
      const longitude = posicao.coords.longitude;
      const precisao = posicao.coords.accuracy;

      console.log("Latitude:", latitude);
      console.log("Longitude:", longitude);
      console.log("Margem de erro em metros:", precisao);

      if (precisao > 1000) {
        localAtual = null;

        nomeLocal.textContent = "Localização imprecisa";
        coordenadas.textContent =
          "Margem de erro: " + Math.round(precisao) + " metros";

        mostrarMensagem(
          "Localização muito imprecisa. Verifique as configurações do dispositivo e tente novamente."
        );

        obterLocal.disabled = false;
        atualizarFeed();
        return;
      }

      localAtual = {
        latitude,
        longitude,
        precisao,
        endereco: ""
      };

      coordenadas.textContent =
        latitude.toFixed(6) +
        ", " +
        longitude.toFixed(6) +
        " · precisão aproximada de " +
        Math.round(precisao) +
        " m";

      nomeLocal.textContent = "Buscando endereço...";

      try {
        const endereco = await consultarEndereco(latitude, longitude);

        if (!endereco) {
          throw new Error("A API não retornou um endereço.");
        }

        localAtual.endereco = endereco;
        nomeLocal.textContent = endereco;

        mostrarMensagem("Localização obtida com sucesso.");
      } catch (erro) {
        nomeLocal.textContent = "Endereço indisponível";

        mostrarMensagem(
          "Coordenadas obtidas, mas não foi possível identificar o endereço. Tente novamente."
        );

        console.error("Erro ao consultar endereço:", erro);
      }

      obterLocal.disabled = false;
      atualizarFeed();
    },
    (erro) => {
      localAtual = null;
      nomeLocal.textContent = "Localização não disponível";
      coordenadas.textContent = "";

      if (erro.code === 1) {
        mostrarMensagem(
          "Permita o acesso à localização nas configurações do navegador."
        );
      } else if (erro.code === 2) {
        mostrarMensagem(
          "O dispositivo não conseguiu determinar sua localização."
        );
      } else if (erro.code === 3) {
        mostrarMensagem(
          "A localização demorou demais. Tente novamente."
        );
      } else {
        mostrarMensagem("Não foi possível obter a localização.");
      }

      obterLocal.disabled = false;
      atualizarFeed();

      console.error("Erro de geolocalização:", erro);
    },
    {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0
    }
  );
}

publicar.addEventListener("click", publicarNow);

async function publicarNow() {
  const texto = descricao.value.trim();

  if (!texto) {
    mostrarMensagem("Escreva o que você está fazendo agora.");
    descricao.focus();
    return;
  }

  if (!imagemAmbiente || !imagemSelfie) {
    mostrarMensagem("Capture as duas fotos antes de publicar.");
    return;
  }

  if (!localAtual || !localAtual.endereco) {
    mostrarMensagem("Obtenha uma localização válida antes de publicar.");
    return;
  }

  publicar.disabled = true;
  mostrarMensagem("Salvando seu Now...");

  const now = {
    id: Date.now(),
    usuario: nomeAtual,
    descricao: texto,
    ambiente: imagemAmbiente,
    selfie: imagemSelfie,
    latitude: localAtual.latitude,
    longitude: localAtual.longitude,
    precisao: localAtual.precisao,
    endereco: localAtual.endereco,
    criadoEm: new Date().toISOString()
  };

  const nows = lerNows();

  try {
    nows.unshift(now);
    salvarNows(nows);

    localStorage.setItem(
      chaveUltimaPublicacao(),
      now.criadoEm
    );
  } catch (erro) {
    publicar.disabled = false;

    mostrarMensagem(
      "Não foi possível salvar as fotos. O armazenamento do navegador pode estar cheio."
    );

    console.error("Erro ao salvar publicação:", erro);
    return;
  }

  let mensagemFinal =
    "Now salvo neste navegador. ";

  try {
    const resposta = await fetch(API + "/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: 1,
        title: nomeAtual + " publicou um Now",
        body: JSON.stringify({
          usuario: nomeAtual,
          descricao: texto,
          endereco: now.endereco,
          latitude: now.latitude,
          longitude: now.longitude,
          criadoEm: now.criadoEm
        })
      })
    });

    if (!resposta.ok) {
      throw new Error("A API retornou o status " + resposta.status);
    }

    await resposta.json();

    mensagemFinal +=
      "Texto enviado à API. As fotos continuam salvas apenas neste navegador.";
  } catch (erro) {
    mensagemFinal +=
      "Não foi possível comunicar com a API; a publicação local foi mantida.";

    console.error("Erro na API:", erro);
  }

  descricao.value = "";
  imagemAmbiente = "";
  imagemSelfie = "";
  etapa = 0;

  previews.hidden = true;
  publicar.disabled = true;

  capturar.disabled = true;
  capturar.textContent = "Capturar ambiente";
  iniciarCamera.textContent = "Iniciar câmera";

  passoCamera.textContent = "Sua câmera está desligada";
  instrucaoCamera.textContent =
    "Inicie a captura para fotografar o ambiente e depois tirar uma selfie.";

  cameraPlaceholder.hidden = false;

  mostrarMensagem(mensagemFinal);
  atualizarFeed();
}

function distanciaKm(lat1, lon1, lat2, lon2) {
  const rad = (graus) => graus * Math.PI / 180;

  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) *
    Math.cos(rad(lat2)) *
    Math.sin(dLon / 2) ** 2;

  return 6371 * 2 * Math.atan2(
    Math.sqrt(a),
    Math.sqrt(1 - a)
  );
}

function tempoDecorrido(data) {
  const minutos = Math.max(
    0,
    Math.floor((Date.now() - new Date(data).getTime()) / 60000)
  );

  if (minutos < 1) return "agora";
  if (minutos < 60) return "há " + minutos + " min";

  const horas = Math.floor(minutos / 60);

  if (horas < 24) return "há " + horas + " h";

  return "há " + Math.floor(horas / 24) + " d";
}

function atualizarFeed() {
  feed.innerHTML = "";

  if (!nomeAtual) {
    avisoFeed.textContent = "Entre para acessar o feed.";
    return;
  }

  const ultimaPublicacao = localStorage.getItem(
    chaveUltimaPublicacao()
  );

  const tempoUltimaPublicacao = ultimaPublicacao
    ? Date.now() - new Date(ultimaPublicacao).getTime()
    : Infinity;

  const liberado =
    Number.isFinite(tempoUltimaPublicacao) &&
    tempoUltimaPublicacao >= 0 &&
    tempoUltimaPublicacao < 24 * 60 * 60 * 1000;

  if (!liberado) {
    avisoFeed.textContent =
      "O feed está bloqueado. Publique um Now para liberar o acesso pelas próximas 24 horas.";

    feed.innerHTML =
      '<div class="vazio">Publique um Now para liberar o feed.</div>';

    return;
  }

  if (!localAtual) {
    avisoFeed.textContent =
      "Feed liberado. Obtenha sua localização para buscar Nows próximos.";

    feed.innerHTML =
      '<div class="vazio">Clique em “Obter localização” para filtrar as publicações por distância.</div>';

    return;
  }

  const limite = Number(raio.value);

  const nowsProximos = lerNows()
    .filter((now) => {
      return (
        Number.isFinite(Number(now.latitude)) &&
        Number.isFinite(Number(now.longitude)) &&
        now.ambiente &&
        now.selfie
      );
    })
    .map((now) => ({
      ...now,
      distancia: distanciaKm(
        localAtual.latitude,
        localAtual.longitude,
        Number(now.latitude),
        Number(now.longitude)
      )
    }))
    .filter((now) => now.distancia <= limite)
    .sort(
      (a, b) =>
        new Date(b.criadoEm) - new Date(a.criadoEm)
    );

  avisoFeed.textContent =
    "Feed liberado · raio de " +
    limite +
    " km · " +
    nowsProximos.length +
    " Now(s) encontrado(s) neste navegador.";

  if (!nowsProximos.length) {
    feed.innerHTML =
      '<div class="vazio">Nenhum Now encontrado neste raio. Aumente o raio ou publique um Now próximo.</div>';

    return;
  }

  nowsProximos.forEach((now) => {
    feed.appendChild(criarCard(now));
  });
}

function criarCard(now) {
  const card = document.createElement("article");
  card.className = "card-now";

  const iniciais = now.usuario.trim().slice(0, 1).toUpperCase();

  card.innerHTML = `
    <div class="card-topo">
      <div class="avatar"></div>
      <div class="identidade">
        <strong></strong>
        <small></small>
      </div>
      <span class="distancia"></span>
    </div>
    <div class="fotos-card">
      <img class="foto-principal" alt="Foto do ambiente">
      <img class="foto-secundaria" alt="Selfie" draggable="true" title="Arraste ou toque para trocar as fotos">
      <span class="dica-arraste">Arraste ou toque na foto menor para trocar</span>
    </div>
    <div class="card-texto">
      <p></p>
      <small></small>
    </div>
  `;

  card.querySelector(".avatar").textContent = iniciais;
  card.querySelector(".identidade strong").textContent = now.usuario;
  card.querySelector(".identidade small").textContent =
    tempoDecorrido(now.criadoEm);
  card.querySelector(".distancia").textContent =
    now.distancia.toFixed(1) + " km";

  const principal = card.querySelector(".foto-principal");
  const secundaria = card.querySelector(".foto-secundaria");

  principal.src = now.ambiente;
  secundaria.src = now.selfie;

  card.querySelector(".card-texto p").textContent = now.descricao;
  card.querySelector(".card-texto small").textContent =
    "⌖ " + now.endereco;

  function trocarFotos() {
    const fotoTemporaria = principal.src;
    principal.src = secundaria.src;
    secundaria.src = fotoTemporaria;
  }

  secundaria.addEventListener("dragstart", (evento) => {
    evento.dataTransfer.setData("text/plain", "trocar");
    evento.dataTransfer.effectAllowed = "move";
  });

  principal.addEventListener("dragover", (evento) => {
    evento.preventDefault();
  });

  principal.addEventListener("drop", (evento) => {
    evento.preventDefault();
    trocarFotos();
  });

  secundaria.addEventListener("click", trocarFotos);

  return card;
}

raio.addEventListener("change", atualizarFeed);

window.addEventListener("beforeunload", desligarCamera);

const usuarioSalvo = localStorage.getItem(CHAVE_USUARIO);

if (usuarioSalvo) {
  iniciarAplicacao(usuarioSalvo);
}