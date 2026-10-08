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

// Paleta cromática semántica para fuentes individuales
const FUENTES_CONFIG = {
  'Renewables': { label: 'Renovables (Total)', color: '#10b981', type: 'macro' },
  'Fossil': { label: 'Fósiles (Total)', color: '#ef4444', type: 'macro' },
  'Solar': { label: 'Solar', color: '#f59e0b', type: 'individual', category: 'ren' },
  'Wind': { label: 'Eólica', color: '#06b6d4', type: 'individual', category: 'ren' },
  'Hydro': { label: 'Hidroeléctrica', color: '#3b82f6', type: 'individual', category: 'ren' },
  'Bioenergy': { label: 'Bioenergía', color: '#84cc16', type: 'individual', category: 'ren' },
  'Other renewables': { label: 'Otras Renovables', color: '#10b981', type: 'individual', category: 'ren' },
  'Coal': { label: 'Carbón', color: '#64748b', type: 'individual', category: 'fos' },
  'Gas': { label: 'Gas Natural', color: '#f97316', type: 'individual', category: 'fos' },
  'Other fossil': { label: 'Otros Fósiles', color: '#e11d48', type: 'individual', category: 'fos' }
};

// Datos del Top 5 de transición
const TOP5_MAYOR = [
  { country: 'Nicaragua', diff: 40.9 },
  { country: 'Guatemala', diff: 18.2 },
  { country: 'Venezuela', diff: 17.4 },
  { country: 'Chile', diff: 16.5 },
  { country: 'United States', diff: 16.4 }
];

const TOP5_MENOR = [
  { country: 'Peru', diff: -18.3 },
  { country: 'Bolivia', diff: -15.4 },
  { country: 'Honduras', diff: -6.4 },
  { country: 'Cuba', diff: -2.8 },
  { country: 'Brazil', diff: -2.6 }
];

// Estado global de datos y visualización
let energyData = {};
let selectedCountry = null;
let chartAnimationId = null;
let currentMetric = 'gen'; // 'gen' (TWh) o 'share' (%)

// Elementos del DOM
const viewIntro = document.getElementById('view-intro');
const viewCountrySelected = document.getElementById('view-country-selected');
const selectedCountryNameEl = document.getElementById('selected-country-name');
const btnSelectOptions = document.getElementById('btn-select-options');
const optionsPanel = document.getElementById('options-panel');
const checkMacroUnified = document.getElementById('check-macro-unified');
const btnStart = document.getElementById('btn-start');
const btnBackToIntro = document.getElementById('btn-back-to-intro');
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
    console.warn('Error cargando energy_data.json:', err);
  }
}

// ==========================================
// RENDERIZADO DEL MAPA (GLOBO COMPACTO 38%)
// ==========================================
async function renderMap() {
  const container = document.getElementById('map-container');
  const width = container.clientWidth || 450;
  const height = container.clientHeight || 650;

  // Escala balanceada para tamaño compacto
  const initialScale = Math.min(width, height) * 0.44;
  const initialRotation = [75, -10, 0];

  const projection = d3.geoOrthographic()
    .scale(initialScale)
    .translate([width / 2, height / 2])
    .rotate([...initialRotation])
    .clipAngle(90);

  const pathGenerator = d3.geoPath().projection(projection);

  const svg = d3.select('#map-container')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const defs = svg.append('defs');

  // Gradiente esférico oceánico
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

  // Giro 360° con drag
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

  const zoom = d3.zoom()
    .scaleExtent([0.6, 4.0])
    .on('zoom', (event) => {
      projection.scale(initialScale * event.transform.k);
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
        return PAISES_PRINCIPALES.includes(countryName) ? 'country country-eligible' : 'country';
      })
      .attr('d', pathGenerator)
      .attr('data-name', (d) => normalizarNombre(d.properties.name))
      .on('mouseover', function (event, d) {
        const countryName = normalizarNombre(d.properties.name);
        const isEligible = PAISES_PRINCIPALES.includes(countryName);
        const label = NOMBRES_ESP[countryName] || countryName;
        
        tooltip.style.display = 'block';
        tooltip.innerHTML = isEligible 
          ? `<strong>${label}</strong> <br><small style="color:#06b6d4;">✓ Participante (Clic para analizar)</small>`
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
    console.error('Error cargando mapa:', error);
  }
}

// ==========================================
// SELECCIÓN DE PAÍS Y GESTIÓN DE OPCIONES
// ==========================================
function selectCountry(countryName, element) {
  selectedCountry = countryName;

  // Detener animación previa si estuviera en ejecución
  if (chartAnimationId) {
    cancelAnimationFrame(chartAnimationId);
    chartAnimationId = null;
  }

  // Resaltar en el globo
  d3.selectAll('.country').classed('country-selected', false);
  if (element) {
    d3.select(element).classed('country-selected', true);
  } else {
    d3.selectAll('.country').filter(function() {
      return d3.select(this).attr('data-name') === countryName;
    }).classed('country-selected', true);
  }

  const displayName = NOMBRES_ESP[countryName] || countryName;
  selectedCountryNameEl.textContent = displayName;

  // Estado por defecto: "Renovables vs Fósiles" activo, fuentes individuales desmarcadas
  checkMacroUnified.checked = true;
  document.querySelectorAll('.source-checkbox').forEach(cb => cb.checked = false);
  optionsPanel.style.display = 'none';

  // Ocultar gráfico y mostrar placeholder hasta presionar 'Comenzar'
  chartPlaceholder.style.display = 'block';
  chartContainer.style.display = 'none';
  chartPlaybackBar.style.display = 'none';
  chartYearBadge.textContent = 'Año 2000';

  // Mostrar panel del país
  viewIntro.classList.remove('active');
  viewCountrySelected.classList.add('active');
}

// Botón Volver a la explicación
btnBackToIntro.addEventListener('click', () => {
  if (chartAnimationId) {
    cancelAnimationFrame(chartAnimationId);
    chartAnimationId = null;
  }

  selectedCountry = null;
  d3.selectAll('.country').classed('country-selected', false);

  viewCountrySelected.classList.remove('active');
  viewIntro.classList.add('active');
});

// Botón Seleccionar Opciones (Toggle menú)
btnSelectOptions.addEventListener('click', () => {
  const isHidden = optionsPanel.style.display === 'none';
  optionsPanel.style.display = isHidden ? 'flex' : 'none';
});

// Manejo de eventos de opciones (SOLO configuran, NO inician la animación automáticamente)
checkMacroUnified.addEventListener('change', () => {
  // Configuración actualizada, esperando clic en Comenzar
});

document.querySelectorAll('.source-checkbox').forEach(cb => {
  cb.addEventListener('change', () => {
    // Si se activa alguna individual, no se fuerza desmarcar la macro a menos que el usuario lo desee
  });
});

document.querySelectorAll('input[name="metric-type"]').forEach((radio) => {
  radio.addEventListener('change', (e) => {
    currentMetric = e.target.value;
  });
});

// Botón Comenzar: ÚNICO detonante de la animación fluida
btnStart.addEventListener('click', () => {
  startChartRace();
});

btnReplay.addEventListener('click', () => {
  startChartRace();
});

// ==========================================
// GRÁFICO DINÁMICO: REVELACIÓN HORIZONTAL
// ==========================================
function startChartRace() {
  if (!selectedCountry || !energyData[selectedCountry]) {
    alert('No se encontraron datos energéticos para ' + selectedCountry);
    return;
  }

  const countryData = energyData[selectedCountry];
  const years = countryData.years;
  if (!years || years.length === 0) return;

  // Preparar series a dibujar según las opciones seleccionadas
  const seriesToDraw = [];

  // 1. Si está marcada la opción macro unificada Renovables vs Fósiles
  if (checkMacroUnified.checked) {
    seriesToDraw.push({
      key: 'Renewables',
      label: '🌱 Renovables',
      color: FUENTES_CONFIG['Renewables'].color,
      values: currentMetric === 'gen' ? countryData.sources['Renewables'].gen : countryData.sources['Renewables'].share,
      isMacro: true
    });
    seriesToDraw.push({
      key: 'Fossil',
      label: '🔥 Fósiles',
      color: FUENTES_CONFIG['Fossil'].color,
      values: currentMetric === 'gen' ? countryData.sources['Fossil'].gen : countryData.sources['Fossil'].share,
      isMacro: true
    });
  }

  // 2. Fuentes individuales marcadas
  document.querySelectorAll('.source-checkbox:checked').forEach(cb => {
    const sKey = cb.getAttribute('data-source');
    if (countryData.sources[sKey]) {
      const cfg = FUENTES_CONFIG[sKey];
      seriesToDraw.push({
        key: sKey,
        label: cfg.label,
        color: cfg.color,
        values: currentMetric === 'gen' ? countryData.sources[sKey].gen : countryData.sources[sKey].share,
        isMacro: false
      });
    }
  });

  if (seriesToDraw.length === 0) {
    alert('Por favor selecciona al menos una opción en "Seleccionar opciones".');
    return;
  }

  // Mostrar gráfico y barra de reproducción
  chartPlaceholder.style.display = 'none';
  chartContainer.style.display = 'block';
  chartPlaybackBar.style.display = 'flex';
  optionsPanel.style.display = 'none';

  // Dimensiones ampliadas para mejor visualización
  const width = chartContainer.clientWidth || 550;
  const height = 280;
  const margin = { top: 20, right: 35, bottom: 35, left: 55 };

  chartContainer.innerHTML = '';

  const svg = d3.select('#chart-container')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const minYear = years[0];
  const maxYear = years[years.length - 1];

  const xScale = d3.scaleLinear()
    .domain([minYear, maxYear])
    .range([0, innerW]);

  // Encontrar valor máximo para el eje Y
  let allVals = [];
  seriesToDraw.forEach(s => {
    allVals = allVals.concat(s.values);
  });
  const maxVal = d3.max(allVals) || 10;
  const yMax = currentMetric === 'share' ? 100 : Math.max(10, maxVal * 1.15);

  const yScale = d3.scaleLinear()
    .domain([0, yMax])
    .range([innerH, 0]);

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Ejes X e Y
  const xAxis = d3.axisBottom(xScale).ticks(6).tickFormat(d3.format('d'));
  const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat((d) => (currentMetric === 'share' ? `${d}%` : `${d} TWh`));

  g.append('g')
    .attr('class', 'axis axis-x')
    .attr('transform', `translate(0,${innerH})`)
    .call(xAxis)
    .attr('color', '#64748b');

  g.append('g')
    .attr('class', 'axis axis-y')
    .call(yAxis)
    .attr('color', '#64748b');

  // Cuadrícula horizontal sutil
  g.append('g')
    .attr('class', 'grid')
    .call(d3.axisLeft(yScale).ticks(5).tickSize(-innerW).tickFormat(''))
    .attr('stroke', 'rgba(255,255,255,0.06)');

  // Clip Path para revelación horizontal
  const clipId = `clip-race-${Date.now()}`;
  svg.append('defs')
    .append('clipPath')
    .attr('id', clipId)
    .append('rect')
    .attr('id', 'clip-rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', 0)
    .attr('height', innerH);

  const chartArea = g.append('g').attr('clip-path', `url(#${clipId})`);

  // Líneas y áreas para cada serie
  seriesToDraw.forEach(s => {
    const lineGen = d3.line()
      .x((d, i) => xScale(years[i]))
      .y((d) => yScale(d))
      .curve(d3.curveMonotoneX);

    if (s.isMacro) {
      const areaGen = d3.area()
        .x((d, i) => xScale(years[i]))
        .y0(innerH)
        .y1((d) => yScale(d))
        .curve(d3.curveMonotoneX);

      chartArea.append('path')
        .datum(s.values)
        .attr('d', areaGen)
        .attr('fill', s.color)
        .attr('fill-opacity', 0.12);
    }

    chartArea.append('path')
      .datum(s.values)
      .attr('d', lineGen)
      .attr('fill', 'none')
      .attr('stroke', s.color)
      .attr('stroke-width', s.isMacro ? 3.0 : 2.2);
  });

  // Cursor vertical animado
  const cursorLine = g.append('line')
    .attr('y1', 0)
    .attr('y2', innerH)
    .attr('stroke', '#38bdf8')
    .attr('stroke-width', 1.5)
    .attr('stroke-dasharray', '3 3')
    .attr('x1', 0)
    .attr('x2', 0);

  // Puntos guía
  const guideDots = seriesToDraw.map(s => {
    return g.append('circle')
      .attr('r', s.isMacro ? 5.5 : 4)
      .attr('fill', s.color)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1);
  });

  // Animación continua y fluida
  const duration = 3800; // ~3.8s para revelar todo el período
  let startTime = null;

  if (chartAnimationId) cancelAnimationFrame(chartAnimationId);
  playbackStatus.textContent = 'Revelando generación año a año...';

  function animate(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const currentX = innerW * progress;
    svg.select('#clip-rect').attr('width', currentX);

    const currentYearVal = minYear + (maxYear - minYear) * progress;
    const displayYear = Math.min(Math.round(currentYearVal), maxYear);
    chartYearBadge.textContent = `Año ${displayYear}`;

    cursorLine.attr('x1', currentX).attr('x2', currentX);

    const idx = Math.min(Math.floor(progress * (years.length - 1)), years.length - 1);
    seriesToDraw.forEach((s, i) => {
      guideDots[i].attr('cx', currentX).attr('cy', yScale(s.values[idx]));
    });

    playbackProgress.style.width = `${progress * 100}%`;

    if (progress < 1) {
      chartAnimationId = requestAnimationFrame(animate);
    } else {
      playbackStatus.textContent = 'Transición completada ✓';
      chartAnimationId = null;
    }
  }

  chartAnimationId = requestAnimationFrame(animate);
}

// ==========================================
// TOP 5 TRANSICIÓN EN PLANO BASE
// ==========================================
function renderTop5(rankingList) {
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
    renderTop5(TOP5_MAYOR);
    tabTopMayor.classList.add('active');
    tabTopMenor.classList.remove('active');
  }
});

tabTopMayor.addEventListener('click', () => {
  tabTopMayor.classList.add('active');
  tabTopMenor.classList.remove('active');
  renderTop5(TOP5_MAYOR);
});

tabTopMenor.addEventListener('click', () => {
  tabTopMenor.classList.add('active');
  tabTopMayor.classList.remove('active');
  renderTop5(TOP5_MENOR);
});

// Inicialización al cargar la ventana
window.addEventListener('DOMContentLoaded', async () => {
  await loadEnergyData();
  await renderMap();
});
