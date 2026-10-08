// Lista de 19 países participantes de las Américas
const PAISES_PRINCIPALES = [
  'Argentina',
  'Bolivia',
  'Brazil',
  'Canada',
  'Chile',
  'Colombia',
  'Costa Rica',
  'Cuba',
  'Ecuador',
  'Guatemala',
  'Honduras',
  'Mexico',
  'Nicaragua',
  'Panama',
  'Paraguay',
  'Peru',
  'United States',
  'Uruguay',
  'Venezuela'
];

// Mapeo amigable de nombres (Inglés <-> Español)
const NOMBRES_ESP = {
  'Argentina': 'Argentina',
  'Bolivia': 'Bolivia',
  'Brazil': 'Brasil',
  'Canada': 'Canadá',
  'Chile': 'Chile',
  'Colombia': 'Colombia',
  'Costa Rica': 'Costa Rica',
  'Cuba': 'Cuba',
  'Ecuador': 'Ecuador',
  'Guatemala': 'Guatemala',
  'Honduras': 'Honduras',
  'Mexico': 'México',
  'Nicaragua': 'Nicaragua',
  'Panama': 'Panamá',
  'Paraguay': 'Paraguay',
  'Peru': 'Perú',
  'United States': 'Estados Unidos',
  'United States of America': 'Estados Unidos',
  'Uruguay': 'Uruguay',
  'Venezuela': 'Venezuela'
};

// Datos calculados del Top 5 de transición (2000 vs Último año disponible)
const TOP5_MAYOR = [
  { country: 'Nicaragua', start_year: 2000, end_year: 2024, start_share: 21.5, end_share: 62.4, diff: 40.9 },
  { country: 'Guatemala', start_year: 2000, end_year: 2024, start_share: 50.2, end_share: 68.3, diff: 18.2 },
  { country: 'Venezuela', start_year: 2000, end_year: 2024, start_share: 73.8, end_share: 91.1, diff: 17.4 },
  { country: 'Chile', start_year: 2000, end_year: 2025, start_share: 49.8, end_share: 66.4, diff: 16.5 },
  { country: 'United States', start_year: 2000, end_year: 2025, start_share: 9.2, end_share: 25.6, diff: 16.4 }
];

const TOP5_MENOR = [
  { country: 'Peru', start_year: 2000, end_year: 2025, start_share: 82.0, end_share: 63.6, diff: -18.3 },
  { country: 'Bolivia', start_year: 2000, end_year: 2025, start_share: 51.5, end_share: 36.1, diff: -15.4 },
  { country: 'Honduras', start_year: 2000, end_year: 2024, start_share: 61.8, end_share: 55.4, diff: -6.4 },
  { country: 'Cuba', start_year: 2000, end_year: 2024, start_share: 6.9, end_share: 4.0, diff: -2.8 },
  { country: 'Brazil', start_year: 2000, end_year: 2025, start_share: 89.5, end_share: 86.9, diff: -2.6 }
];

// Estado global de datos y visualización
let energyData = {};
let selectedCountry = null;
let chartAnimationId = null;
let currentMetric = 'gen'; // 'gen' (TWh) o 'share' (%)
let showFossil = true;
let showRenew = true;

// Elementos del DOM
const viewIntro = document.getElementById('view-intro');
const viewCountrySelected = document.getElementById('view-country-selected');
const selectedCountryNameEl = document.getElementById('selected-country-name');
const btnSelectOptions = document.getElementById('btn-select-options');
const optionsPanel = document.getElementById('options-panel');
const checkFossil = document.getElementById('check-fossil');
const checkRenew = document.getElementById('check-renew');
const btnStart = document.getElementById('btn-start');
const btnBackToIntro = document.getElementById('btn-back-to-intro');
const actionFeedback = document.getElementById('action-feedback');
const tooltip = document.getElementById('map-tooltip');

// Top 5 elements
const btnShowTop5 = document.getElementById('btn-show-top5');
const top5Container = document.getElementById('top5-container');
const tabTopMayor = document.getElementById('tab-top-mayor');
const tabTopMenor = document.getElementById('tab-top-menor');
const top5List = document.getElementById('top5-list');

// Chart elements
const chartPlaceholder = document.getElementById('chart-placeholder');
const chartContainer = document.getElementById('chart-container');
const chartPlaybackBar = document.getElementById('chart-playback-bar');
const chartYearBadge = document.getElementById('chart-year-badge');
const playbackProgress = document.getElementById('playback-progress');
const playbackStatus = document.getElementById('playback-status');
const btnReplay = document.getElementById('btn-replay');

// Normalizador de nombres de países
function normalizarNombre(nombre) {
  if (!nombre) return '';
  const n = nombre.trim();
  if (n === 'United States of America' || n === 'USA' || n === 'United States') return 'United States';
  if (n === 'Bolivia, Plurinational State of' || n === 'Bolivia (Plurinational State of)') return 'Bolivia';
  if (n === 'Venezuela, Bolivarian Republic of' || n === 'Venezuela (Bolivarian Republic of)') return 'Venezuela';
  return n;
}

// Cargar dataset exportado
async function loadEnergyData() {
  try {
    const res = await fetch('energy_data.json');
    if (res.ok) {
      energyData = await res.json();
    }
  } catch (err) {
    console.warn('Cargando con fallback interno:', err);
  }
}

// ==========================================
// RENDERIZADO DEL MAPA INTERACTIVO (GLOBO)
// ==========================================
async function renderMap() {
  const container = document.getElementById('map-container');
  const width = container.clientWidth || 800;
  const height = container.clientHeight || 700;

  const initialScale = Math.min(width, height) * 0.45;
  const initialRotation = [75, -10, 0];
  let currentScale = initialScale;

  const projection = d3.geoOrthographic()
    .scale(currentScale)
    .translate([width / 2, height / 2])
    .rotate([...initialRotation])
    .clipAngle(90);

  const pathGenerator = d3.geoPath().projection(projection);

  const svg = d3.select('#map-container')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const defs = svg.append('defs');

  // Gradiente esférico
  const globeGradient = defs.append('radialGradient')
    .attr('id', 'globe-shading')
    .attr('cx', '45%')
    .attr('cy', '40%')
    .attr('r', '60%');
  globeGradient.append('stop').attr('offset', '0%').attr('stop-color', '#172847');
  globeGradient.append('stop').attr('offset', '70%').attr('stop-color', '#091122');
  globeGradient.append('stop').attr('offset', '100%').attr('stop-color', '#050a14');

  const sphereCircle = svg.append('circle')
    .attr('cx', width / 2)
    .attr('cy', height / 2)
    .attr('r', projection.scale())
    .attr('fill', 'url(#globe-shading)')
    .attr('stroke', '#38bdf8')
    .attr('stroke-opacity', 0.25)
    .attr('stroke-width', 1.5);

  const g = svg.append('g').attr('class', 'globe-features');

  const graticule = d3.geoGraticule10();
  const graticulePath = g.append('path')
    .datum(graticule)
    .attr('class', 'graticule')
    .attr('d', pathGenerator)
    .attr('fill', 'none')
    .attr('stroke', 'rgba(255, 255, 255, 0.05)')
    .attr('stroke-width', 0.5);

  let countriesPaths;

  function updateGlobe() {
    sphereCircle.attr('r', projection.scale());
    pathGenerator.projection(projection);
    graticulePath.attr('d', pathGenerator);
    if (countriesPaths) {
      countriesPaths.attr('d', pathGenerator);
    }
  }

  // Interacción de Arrastre 360°
  let dragStartPos = null;
  let dragStartRotation = null;

  const drag = d3.drag()
    .on('start', (event) => {
      dragStartPos = [event.x, event.y];
      dragStartRotation = [...projection.rotate()];
    })
    .on('drag', (event) => {
      if (!dragStartPos) return;
      const dx = event.x - dragStartPos[0];
      const dy = event.y - dragStartPos[1];
      const sensitivity = 0.35;
      const newLambda = dragStartRotation[0] + dx * sensitivity;
      const newPhi = Math.max(-80, Math.min(80, dragStartRotation[1] - dy * sensitivity));
      projection.rotate([newLambda, newPhi, 0]);
      updateGlobe();
    });

  // Zoom
  const zoom = d3.zoom()
    .scaleExtent([0.5, 4.0])
    .on('zoom', (event) => {
      const newScale = initialScale * event.transform.k;
      projection.scale(newScale);
      updateGlobe();
    });

  svg.call(drag);
  svg.call(zoom);

  document.getElementById('btn-zoom-in').addEventListener('click', () => {
    projection.scale(projection.scale() * 1.3);
    updateGlobe();
  });
  document.getElementById('btn-zoom-out').addEventListener('click', () => {
    projection.scale(projection.scale() * 0.77);
    updateGlobe();
  });
  document.getElementById('btn-reset-view').addEventListener('click', () => {
    projection.scale(initialScale);
    projection.rotate([...initialRotation]);
    updateGlobe();
  });

  try {
    const worldData = await d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
    const countries = topojson.feature(worldData, worldData.objects.countries).features;

    countriesPaths = g.selectAll('path.country')
      .data(countries)
      .enter()
      .append('path')
      .attr('class', (d) => {
        const countryName = normalizarNombre(d.properties.name);
        const isEligible = PAISES_PRINCIPALES.includes(countryName);
        return isEligible ? 'country country-eligible' : 'country';
      })
      .attr('d', pathGenerator)
      .attr('data-name', (d) => normalizarNombre(d.properties.name))
      .on('mouseover', function (event, d) {
        const countryName = normalizarNombre(d.properties.name);
        const isEligible = PAISES_PRINCIPALES.includes(countryName);
        const label = NOMBRES_ESP[countryName] || countryName;
        
        tooltip.style.display = 'block';
        tooltip.innerHTML = isEligible 
          ? `<strong>${label}</strong> <br><small style="color:#06b6d4;">✓ Participante (Clic para seleccionar)</small>`
          : `<span>${label}</span>`;
      })
      .on('mousemove', function (event) {
        tooltip.style.left = `${event.pageX}px`;
        tooltip.style.top = `${event.pageY}px`;
      })
      .on('mouseleave', function () {
        tooltip.style.display = 'none';
      })
      .on('click', function (event, d) {
        const countryName = normalizarNombre(d.properties.name);
        if (!PAISES_PRINCIPALES.includes(countryName)) return;
        selectCountry(countryName, this);
      });

  } catch (error) {
    console.error('Error al cargar datos del globo:', error);
    container.innerHTML = `<div style="padding: 40px; color: #ef4444; text-align: center;">Error al cargar mapa.</div>`;
  }
}

// ==========================================
// SELECCIÓN DE PAÍS Y ESTADOS DE INTERFAZ
// ==========================================
function selectCountry(countryName, element) {
  selectedCountry = countryName;

  // Detener animación previa si la hubiera
  if (chartAnimationId) {
    cancelAnimationFrame(chartAnimationId);
    chartAnimationId = null;
  }

  // Resaltado en mapa
  d3.selectAll('.country').classed('country-selected', false);
  if (element) {
    d3.select(element).classed('country-selected', true);
  } else {
    // Si se seleccionó desde el Top 5
    d3.selectAll('.country').filter(function() {
      return d3.select(this).attr('data-name') === countryName;
    }).classed('country-selected', true);
  }

  // Actualizar títulos
  const displayName = NOMBRES_ESP[countryName] || countryName;
  selectedCountryNameEl.textContent = displayName;

  // Estado por defecto: Fuentes Fósil y Renovable activadas
  checkFossil.checked = true;
  checkRenew.checked = true;
  showFossil = true;
  showRenew = true;
  optionsPanel.style.display = 'none';

  // Ocultar información del gráfico hasta que se presione Comenzar
  chartPlaceholder.style.display = 'block';
  chartContainer.style.display = 'none';
  chartPlaybackBar.style.display = 'none';
  chartYearBadge.textContent = 'Año 2000';

  // Cambiar vista del panel
  viewIntro.classList.remove('active');
  viewCountrySelected.classList.add('active');
  actionFeedback.style.display = 'none';
}

// Botón: Volver a la breve explicación
btnBackToIntro.addEventListener('click', () => {
  if (chartAnimationId) {
    cancelAnimationFrame(chartAnimationId);
    chartAnimationId = null;
  }

  selectedCountry = null;
  d3.selectAll('.country').classed('country-selected', false);

  viewCountrySelected.classList.remove('active');
  viewIntro.classList.add('active');
  actionFeedback.style.display = 'none';
});

// Botón: Seleccionar opciones (Toggle menú de filtros)
btnSelectOptions.addEventListener('click', () => {
  const isHidden = optionsPanel.style.display === 'none';
  optionsPanel.style.display = isHidden ? 'flex' : 'none';
});

checkFossil.addEventListener('change', (e) => {
  showFossil = e.target.checked;
  const leg = document.getElementById('legend-fossil');
  if (leg) leg.style.opacity = showFossil ? '1' : '0.3';
});

checkRenew.addEventListener('change', (e) => {
  showRenew = e.target.checked;
  const leg = document.getElementById('legend-renew');
  if (leg) leg.style.opacity = showRenew ? '1' : '0.3';
});

document.querySelectorAll('input[name="metric-type"]').forEach((radio) => {
  radio.addEventListener('change', (e) => {
    currentMetric = e.target.value;
  });
});

// Botón: Comenzar (Inicia la revelación horizontal continua año a año)
btnStart.addEventListener('click', () => {
  startChartRace();
});

btnReplay.addEventListener('click', () => {
  startChartRace();
});

// ==========================================
// GRÁFICO DINÁMICO: REVELACIÓN HORIZONTAL FLUIDA
// ==========================================
function startChartRace() {
  if (!selectedCountry || !energyData[selectedCountry]) {
    alert('No hay datos energéticos disponibles para ' + selectedCountry);
    return;
  }

  const countryData = energyData[selectedCountry];
  const years = countryData.years;
  if (!years || years.length === 0) return;

  // Mostrar contenedor de gráfico y playback bar
  chartPlaceholder.style.display = 'none';
  chartContainer.style.display = 'block';
  chartPlaybackBar.style.display = 'flex';
  optionsPanel.style.display = 'none';

  // Configuración de dimensiones
  const width = chartContainer.clientWidth || 440;
  const height = 220;
  const margin = { top: 20, right: 30, bottom: 35, left: 45 };

  chartContainer.innerHTML = '';

  const svg = d3.select('#chart-container')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  // Escalas
  const minYear = years[0];
  const maxYear = years[years.length - 1];

  const xScale = d3.scaleLinear()
    .domain([minYear, maxYear])
    .range([0, innerW]);

  // Valores máximos para escala Y según métrica
  const fossilVals = currentMetric === 'gen' ? countryData.fossil_gen : countryData.fossil_share;
  const renewVals = currentMetric === 'gen' ? countryData.renew_gen : countryData.renew_share;
  const yMax = currentMetric === 'share' 
    ? 100 
    : Math.max(10, d3.max([...fossilVals, ...renewVals]) * 1.15);

  const yScale = d3.scaleLinear()
    .domain([0, yMax])
    .range([innerH, 0]);

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Ejes
  const xAxis = d3.axisBottom(xScale)
    .ticks(5)
    .tickFormat(d3.format('d'));

  const yAxis = d3.axisLeft(yScale)
    .ticks(5)
    .tickFormat((d) => (currentMetric === 'share' ? `${d}%` : `${d} TWh`));

  g.append('g')
    .attr('class', 'axis axis-x')
    .attr('transform', `translate(0,${innerH})`)
    .call(xAxis)
    .attr('color', '#64748b');

  g.append('g')
    .attr('class', 'axis axis-y')
    .call(yAxis)
    .attr('color', '#64748b');

  // Cuadrícula de fondo
  g.append('g')
    .attr('class', 'grid')
    .call(d3.axisLeft(yScale).ticks(5).tickSize(-innerW).tickFormat(''))
    .attr('stroke', 'rgba(255,255,255,0.05)');

  // Clip Path para revelación horizontal continua
  const clipId = `clip-race-${Date.now()}`;
  svg.append('defs')
    .append('clipPath')
    .attr('id', clipId)
    .append('rect')
    .attr('id', 'clip-rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', 0) // Comienza oculto a la izquierda
    .attr('height', innerH);

  const chartArea = g.append('g')
    .attr('clip-path', `url(#${clipId})`);

  // Generadores de línea
  const fossilLineGen = d3.line()
    .x((d, i) => xScale(years[i]))
    .y((d) => yScale(d))
    .curve(d3.curveMonotoneX);

  const renewLineGen = d3.line()
    .x((d, i) => xScale(years[i]))
    .y((d) => yScale(d))
    .curve(d3.curveMonotoneX);

  // Línea y área Fósil
  if (showFossil) {
    const fossilAreaGen = d3.area()
      .x((d, i) => xScale(years[i]))
      .y0(innerH)
      .y1((d) => yScale(d))
      .curve(d3.curveMonotoneX);

    chartArea.append('path')
      .datum(fossilVals)
      .attr('d', fossilAreaGen)
      .attr('fill', 'rgba(244, 63, 94, 0.12)');

    chartArea.append('path')
      .datum(fossilVals)
      .attr('d', fossilLineGen)
      .attr('fill', 'none')
      .attr('stroke', '#f43f5e')
      .attr('stroke-width', 2.8);
  }

  // Línea y área Renovable
  if (showRenew) {
    const renewAreaGen = d3.area()
      .x((d, i) => xScale(years[i]))
      .y0(innerH)
      .y1((d) => yScale(d))
      .curve(d3.curveMonotoneX);

    chartArea.append('path')
      .datum(renewVals)
      .attr('d', renewAreaGen)
      .attr('fill', 'rgba(16, 185, 129, 0.12)');

    chartArea.append('path')
      .datum(renewVals)
      .attr('d', renewLineGen)
      .attr('fill', 'none')
      .attr('stroke', '#10b981')
      .attr('stroke-width', 2.8);
  }

  // Cursor vertical animado
  const cursorLine = g.append('line')
    .attr('y1', 0)
    .attr('y2', innerH)
    .attr('stroke', '#38bdf8')
    .attr('stroke-width', 1.5)
    .attr('stroke-dasharray', '3 3')
    .attr('x1', 0)
    .attr('x2', 0);

  // Puntos indicadores flotantes en el frente del cursor
  const dotFossil = g.append('circle').attr('r', 5).attr('fill', '#f43f5e').style('display', showFossil ? 'block' : 'none');
  const dotRenew = g.append('circle').attr('r', 5).attr('fill', '#10b981').style('display', showRenew ? 'block' : 'none');

  // Animación continua y fluida horizontal usando requestAnimationFrame
  const duration = 4000; // 4 segundos para recorrer todo el período
  let startTime = null;

  if (chartAnimationId) cancelAnimationFrame(chartAnimationId);

  playbackStatus.textContent = 'Corriendo la carrera...';

  function animate(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Ancho revelado horizontalmente
    const currentX = innerW * progress;
    svg.select('#clip-rect').attr('width', currentX);

    // Año actual correspondiente
    const currentYearVal = minYear + (maxYear - minYear) * progress;
    const displayYear = Math.min(Math.round(currentYearVal), maxYear);
    chartYearBadge.textContent = `Año ${displayYear}`;

    // Mover cursor
    cursorLine.attr('x1', currentX).attr('x2', currentX);

    // Calcular valores interpolados para los puntos guía
    const idx = Math.min(
      Math.floor(progress * (years.length - 1)),
      years.length - 1
    );
    if (showFossil) {
      dotFossil.attr('cx', currentX).attr('cy', yScale(fossilVals[idx]));
    }
    if (showRenew) {
      dotRenew.attr('cx', currentX).attr('cy', yScale(renewVals[idx]));
    }

    // Barra de progreso
    playbackProgress.style.width = `${progress * 100}%`;

    if (progress < 1) {
      chartAnimationId = requestAnimationFrame(animate);
    } else {
      playbackStatus.textContent = 'Carrera completada ✓';
      chartAnimationId = null;
    }
  }

  chartAnimationId = requestAnimationFrame(animate);
}

// ==========================================
// TOP 5 TRANSICIÓN EN PLANO BASE
// ==========================================
function renderTop5(rankingList, isMayor) {
  top5List.innerHTML = '';
  rankingList.forEach((item, index) => {
    const el = document.createElement('div');
    el.className = 'top5-item';
    const espName = NOMBRES_ESP[item.country] || item.country;
    const sign = item.diff > 0 ? '+' : '';
    const diffClass = item.diff >= 0 ? 'diff-positive' : 'diff-negative';

    el.innerHTML = `
      <span class="top5-rank">#${index + 1}</span>
      <span class="top5-name">${espName}</span>
      <span class="top5-diff ${diffClass}">${sign}${item.diff}%</span>
    `;

    // Al hacer clic, selecciona automáticamente el país y lo lleva al plano interactivo
    el.addEventListener('click', () => {
      selectCountry(item.country, null);
    });

    top5List.appendChild(el);
  });
}

btnShowTop5.addEventListener('click', () => {
  const isHidden = top5Container.style.display === 'none';
  top5Container.style.display = isHidden ? 'flex' : 'none';
  if (isHidden) {
    renderTop5(TOP5_MAYOR, true);
    tabTopMayor.classList.add('active');
    tabTopMenor.classList.remove('active');
  }
});

tabTopMayor.addEventListener('click', () => {
  tabTopMayor.classList.add('active');
  tabTopMenor.classList.remove('active');
  renderTop5(TOP5_MAYOR, true);
});

tabTopMenor.addEventListener('click', () => {
  tabTopMenor.classList.add('active');
  tabTopMayor.classList.remove('active');
  renderTop5(TOP5_MENOR, false);
});

// Inicialización
window.addEventListener('DOMContentLoaded', async () => {
  await loadEnergyData();
  await renderMap();
});
