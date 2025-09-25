// testpermalink.js

function buildPermalink(item) {
  const parts = [];

  // Brand
  if (item.brand) {
    parts.push(item.brand.toLowerCase().replace(/\s+/g, '-'));
  }

  // Family root (es. "Daytona", "Speedmaster")
  if (item.family_root) {
    parts.push(item.family_root.toLowerCase().replace(/\s+/g, '-'));
  }

  // Reference → punti convertiti in trattini
  if (item.reference) {
    parts.push(item.reference.replace(/\./g, '-'));
  }

  // ❌ Rimosso "aka"

  return `/model/${parts.join('-')}`;
}

// --- Test di esempio ---
const examples = [
  { brand: 'Rolex', family_root: 'Daytona', reference: '116523' },
  { brand: 'Rolex', reference: '116523' },
  {
    brand: 'Omega',
    family_root: 'Speedmaster',
    reference: '311.30.42.30.01.005'
  },
  { brand: 'Tudor', name: 'Black Bay Fifty-Eight' }
];

examples.forEach(item => {
  console.log(item, '→', buildPermalink(item));
});