export interface ConstantDef {
  symbol: string;
  name: string;
  value: string;
  unit: string;
  category: 'Math' | 'Physics' | 'Universal';
}

export const EXTENDED_CONSTANTS: ConstantDef[] = [
  { symbol: 'π', name: 'Pi (Archimedes Constant)', value: '3.141592653589793', unit: '', category: 'Math' },
  { symbol: 'e', name: "Euler's Number", value: '2.718281828459045', unit: '', category: 'Math' },
  { symbol: 'φ', name: 'Golden Ratio (Phi)', value: '1.618033988749895', unit: '', category: 'Math' },
  { symbol: 'c', name: 'Speed of Light in Vacuum', value: '299792458', unit: 'm/s', category: 'Physics' },
  { symbol: 'h', name: 'Planck Constant', value: '6.62607015e-34', unit: 'J·s', category: 'Physics' },
  { symbol: 'G', name: 'Gravitational Constant', value: '6.67430e-11', unit: 'm³/(kg·s²)', category: 'Physics' },
  { symbol: 'kB', name: 'Boltzmann Constant', value: '1.380649e-23', unit: 'J/K', category: 'Physics' },
  { symbol: 'NA', name: 'Avogadro Constant', value: '6.02214076e23', unit: 'mol⁻¹', category: 'Physics' },
  { symbol: 'R', name: 'Molar Gas Constant', value: '8.314462618', unit: 'J/(mol·K)', category: 'Physics' },
  { symbol: 'e_charge', name: 'Elementary Charge', value: '1.602176634e-19', unit: 'C', category: 'Physics' },
  { symbol: 'me', name: 'Electron Mass', value: '9.1093837015e-31', unit: 'kg', category: 'Physics' },
  { symbol: 'mp', name: 'Proton Mass', value: '1.67262192369e-27', unit: 'kg', category: 'Physics' },
  { symbol: 'g', name: 'Standard Earth Gravity', value: '9.80665', unit: 'm/s²', category: 'Universal' },
  { symbol: 'atm', name: 'Standard Atmosphere', value: '101325', unit: 'Pa', category: 'Universal' }
];
