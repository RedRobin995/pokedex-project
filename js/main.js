// ---------------- ELEMENTOS DOM ----------------

const listaPokemon = document.querySelector("#listaPokemon");
const botonesTipo = document.querySelectorAll(".tipo-btn");
const main = document.querySelector("main");
const shinyBtn = document.querySelector("#toggle-shiny");
const loader = document.querySelector("#loader");

// ---------------- LOADER ----------------

function showLoader() {
  loader.classList.remove("hidden");
}

function hideLoader() {
  loader.classList.add("hidden");
}

async function withLoader(action) {
  showLoader();

  // permitir que el loader se pinte
  await new Promise(resolve => requestAnimationFrame(resolve));

  action();

  // permitir render del contenido
  await new Promise(resolve => requestAnimationFrame(resolve));

  hideLoader();
}

// ---------------- SKELETONS ------------------

function showSkeletons(count = 12) {
  const template = document.querySelector("#skeleton-template");
  listaPokemon.innerHTML = "";

  for (let i = 0; i < count; i++) {
    const clone = template.content.cloneNode(true);
    listaPokemon.appendChild(clone);
  }
}


// ---------------- ESTADO GLOBAL ----------------

let isShiny = false;
let currentFilter = "ver-todos";
let allPokemonData = [];

// ---------------- COLORES POR TIPO ----------------

const typeColors = {
  normal: "var(--type-normal)",
  fire: "var(--type-fire)",
  water: "var(--type-water)",
  grass: "var(--type-grass)",
  electric: "var(--type-electric)",
  ice: "var(--type-ice)",
  fighting: "var(--type-fighting)",
  poison: "var(--type-poison)",
  ground: "var(--type-ground)",
  flying: "var(--type-flying)",
  psychic: "var(--type-psychic)",
  bug: "var(--type-bug)",
  rock: "var(--type-rock)",
  ghost: "var(--type-ghost)",
  dark: "var(--type-dark)",
  dragon: "var(--type-dragon)",
  steel: "var(--type-steel)",
  fairy: "var(--type-fairy)"
};

// ---------------- FETCH OPTIMIZADO ----------------

const LIST_URL = "https://pokeapi.co/api/v2/pokemon?limit=1025";

async function fetchAllPokemon() {
  showLoader();       // Pokébola
  showSkeletons(12);  // Skeleton cards

  try {
    const response = await fetch(LIST_URL);
    const data = await response.json();
    const pokemonList = data.results;

    // Cargar primeros 20
    await fetchPokemonDetails(pokemonList.slice(0, 20));

    hideLoader();

    // Background
    fetchPokemonDetailsInChunks(pokemonList.slice(20));

  } catch (error) {
    hideLoader();
    console.error(error);
  }
}

// ---------------- FETCH DETALLES ----------------

async function fetchPokemonDetails(pokemonList) {
  const promises = pokemonList.map(p =>
    fetch(p.url).then(res => res.json())
  );

  const results = await Promise.all(promises);
  allPokemonData.push(...results);

  aplicarFiltro();
}

//  CARGA EN BACKGROUND
async function fetchPokemonDetailsInChunks(pokemonList, chunkSize = 20) {
  for (let i = 0; i < pokemonList.length; i += chunkSize) {
    const chunk = pokemonList.slice(i, i + chunkSize);

    const promises = chunk.map(p =>
      fetch(p.url).then(res => res.json())
    );

    const results = await Promise.all(promises);
    allPokemonData.push(...results);

    aplicarFiltro();

    // permitir repintado del navegador
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}

// ---------------- FILTRO CENTRAL ----------------

function aplicarFiltro() {
  let pokemonFiltrados;

  if (currentFilter === "ver-todos") {
    pokemonFiltrados = allPokemonData;
    main.style.backgroundColor = "var(--clr-gray)";
  } else {
    pokemonFiltrados = allPokemonData.filter(poke =>
      poke.types.some(type => type.type.name === currentFilter)
    );
    main.style.backgroundColor = typeColors[currentFilter];
  }

  mostrarLista(pokemonFiltrados);
}

// ---------------- RENDER ----------------

function mostrarLista(pokemonArray) {
  listaPokemon.innerHTML = "";
  pokemonArray.forEach(poke => mostrarPokemon(poke));
}

function mostrarPokemon(poke) {
  const tipos = poke.types
    .map(type => `<p class="${type.type.name} tipo">${type.type.name}</p>`)
    .join("");

  const sprite = isShiny
    ? poke.sprites.front_shiny
    : poke.sprites.front_default;

  const pokeId = poke.id.toString().padStart(3, "0");

  listaPokemon.innerHTML += `
    <div class="pokemon">
      <p class="pokemon-id-back">#${pokeId}</p>
      <div class="pokemon-imagen">
        <img src="${sprite}" alt="${poke.name}">
      </div>
      <div class="pokemon-info">
        <div class="nombre-contenedor">
          <p class="pokemon-id">#${pokeId}</p>
          <h2 class="pokemon-nombre">${poke.name}</h2>
        </div>
        <div class="pokemon-tipos">${tipos}</div>
      </div>
    </div>
  `;
}

// ---------------- BOTONES DE TIPO ----------------

botonesTipo.forEach(boton =>
  boton.addEventListener("click", () => {
    withLoader(() => {
      currentFilter = boton.id;
      aplicarFiltro();
    });
  })
);
// ---------------- BOTÓN SHINY ----------------

shinyBtn.addEventListener("click", () => {
  withLoader(() => {
    isShiny = !isShiny;
    shinyBtn.textContent = isShiny ? "Default" : "Shiny";
    aplicarFiltro();
  });
});

// ---------------- INIT ----------------

fetchAllPokemon();
