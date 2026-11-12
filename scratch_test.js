// Normalizador amigable de países en español
const PAISES_MAP = {
  'argentina': { key: 'Argentina', name: 'Argentina', zone: 'Sudamérica', flag: 'ar' },
  'bolivia': { key: 'Bolivia', name: 'Bolivia', zone: 'Sudamérica', flag: 'bo' },
  'brazil': { key: 'Brazil', name: 'Brasil', zone: 'Sudamérica', flag: 'br' },
  'brasil': { key: 'Brazil', name: 'Brasil', zone: 'Sudamérica', flag: 'br' },
  'canada': { key: 'Canada', name: 'Canadá', zone: 'Norteamérica', flag: 'ca' },
  'chile': { key: 'Chile', name: 'Chile', zone: 'Sudamérica', flag: 'cl' },
  'colombia': { key: 'Colombia', name: 'Colombia', zone: 'Sudamérica', flag: 'co' },
  'costa rica': { key: 'Costa Rica', name: 'Costa Rica', zone: 'Centroamérica y Caribe', flag: 'cr' },
  'cuba': { key: 'Cuba', name: 'Cuba', zone: 'Centroamérica y Caribe', flag: 'cu' },
  'ecuador': { key: 'Ecuador', name: 'Ecuador', zone: 'Sudamérica', flag: 'ec' },
  'guatemala': { key: 'Guatemala', name: 'Guatemala', zone: 'Centroamérica y Caribe', flag: 'gt' },
  'honduras': { key: 'Honduras', name: 'Honduras', zone: 'Centroamérica y Caribe', flag: 'hn' },
  'mexico': { key: 'Mexico', name: 'México', zone: 'Norteamérica', flag: 'mx' },
  'nicaragua': { key: 'Nicaragua', name: 'Nicaragua', zone: 'Centroamérica y Caribe', flag: 'ni' },
  'panama': { key: 'Panama', name: 'Panamá', zone: 'Centroamérica y Caribe', flag: 'pa' },
  'paraguay': { key: 'Paraguay', name: 'Paraguay', zone: 'Sudamérica', flag: 'py' },
  'peru': { key: 'Peru', name: 'Perú', zone: 'Sudamérica', flag: 'pe' },
  'united states': { key: 'United States', name: 'Estados Unidos', zone: 'Norteamérica', flag: 'us' },
  'estados unidos': { key: 'United States', name: 'Estados Unidos', zone: 'Norteamérica', flag: 'us' },
  'uruguay': { key: 'Uruguay', name: 'Uruguay', zone: 'Sudamérica', flag: 'uy' },
  'venezuela': { key: 'Venezuela', name: 'Venezuela', zone: 'Sudamérica', flag: 've' }
};

