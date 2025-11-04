/**
 * Philippine Locations Data
 *
 * Comprehensive data for Philippine administrative divisions:
 * - 17 Regions
 * - Provinces
 * - Cities/Municipalities
 * - Barangays (sample data for major cities)
 *
 * Data source: Philippine Statistics Authority (PSA) and PSGC
 * Note: This is a curated subset focusing on major locations.
 * For complete data, integrate with PSGC API or database.
 */

export interface Region {
  code: string;
  name: string;
  longName: string;
}

export interface Province {
  code: string;
  name: string;
  regionCode: string;
}

export interface City {
  code: string;
  name: string;
  provinceCode: string;
  isCapital?: boolean;
}

export interface Barangay {
  code: string;
  name: string;
  cityCode: string;
}

// 17 Regions of the Philippines
export const PHILIPPINE_REGIONS: Region[] = [
  { code: 'NCR', name: 'NCR', longName: 'National Capital Region' },
  { code: 'CAR', name: 'CAR', longName: 'Cordillera Administrative Region' },
  { code: 'I', name: 'Region I', longName: 'Ilocos Region' },
  { code: 'II', name: 'Region II', longName: 'Cagayan Valley' },
  { code: 'III', name: 'Region III', longName: 'Central Luzon' },
  { code: 'IVA', name: 'Region IV-A', longName: 'CALABARZON' },
  { code: 'IVB', name: 'Region IV-B', longName: 'MIMAROPA' },
  { code: 'V', name: 'Region V', longName: 'Bicol Region' },
  { code: 'VI', name: 'Region VI', longName: 'Western Visayas' },
  { code: 'VII', name: 'Region VII', longName: 'Central Visayas' },
  { code: 'VIII', name: 'Region VIII', longName: 'Eastern Visayas' },
  { code: 'IX', name: 'Region IX', longName: 'Zamboanga Peninsula' },
  { code: 'X', name: 'Region X', longName: 'Northern Mindanao' },
  { code: 'XI', name: 'Region XI', longName: 'Davao Region' },
  { code: 'XII', name: 'Region XII', longName: 'SOCCSKSARGEN' },
  { code: 'XIII', name: 'Region XIII', longName: 'Caraga' },
  {
    code: 'BARMM',
    name: 'BARMM',
    longName: 'Bangsamoro Autonomous Region in Muslim Mindanao',
  },
];

// Major Provinces (focusing on NCR and surrounding areas)
export const PHILIPPINE_PROVINCES: Province[] = [
  // NCR (Metropolitan Manila - technically has no provinces, but cities)
  { code: 'MM', name: 'Metro Manila', regionCode: 'NCR' },

  // CALABARZON (Region IV-A)
  { code: 'BTN', name: 'Batangas', regionCode: 'IVA' },
  { code: 'CAV', name: 'Cavite', regionCode: 'IVA' },
  { code: 'LAG', name: 'Laguna', regionCode: 'IVA' },
  { code: 'QUE', name: 'Quezon', regionCode: 'IVA' },
  { code: 'RIZ', name: 'Rizal', regionCode: 'IVA' },

  // Central Luzon (Region III)
  { code: 'BUL', name: 'Bulacan', regionCode: 'III' },
  { code: 'PAM', name: 'Pampanga', regionCode: 'III' },
  { code: 'TAR', name: 'Tarlac', regionCode: 'III' },
  { code: 'NUE', name: 'Nueva Ecija', regionCode: 'III' },

  // Ilocos Region (Region I)
  { code: 'ILN', name: 'Ilocos Norte', regionCode: 'I' },
  { code: 'ILS', name: 'Ilocos Sur', regionCode: 'I' },
  { code: 'LUN', name: 'La Union', regionCode: 'I' },
  { code: 'PAN', name: 'Pangasinan', regionCode: 'I' },

  // Cagayan Valley (Region II)
  { code: 'CAG', name: 'Cagayan', regionCode: 'II' },
  { code: 'ISA', name: 'Isabela', regionCode: 'II' },

  // Central Visayas (Region VII)
  { code: 'CEB', name: 'Cebu', regionCode: 'VII' },
  { code: 'BOH', name: 'Bohol', regionCode: 'VII' },

  // Davao Region (Region XI)
  { code: 'DAV', name: 'Davao del Sur', regionCode: 'XI' },
];

// Major Cities/Municipalities
export const PHILIPPINE_CITIES: City[] = [
  // Metro Manila Cities
  { code: 'MNL', name: 'Manila', provinceCode: 'MM', isCapital: true },
  { code: 'QC', name: 'Quezon City', provinceCode: 'MM' },
  { code: 'CAL', name: 'Caloocan', provinceCode: 'MM' },
  { code: 'LAS', name: 'Las Piñas', provinceCode: 'MM' },
  { code: 'MAK', name: 'Makati', provinceCode: 'MM' },
  { code: 'MAL', name: 'Malabon', provinceCode: 'MM' },
  { code: 'MAN', name: 'Mandaluyong', provinceCode: 'MM' },
  { code: 'MAR', name: 'Marikina', provinceCode: 'MM' },
  { code: 'MUN', name: 'Muntinlupa', provinceCode: 'MM' },
  { code: 'NAV', name: 'Navotas', provinceCode: 'MM' },
  { code: 'PAR', name: 'Parañaque', provinceCode: 'MM' },
  { code: 'PAS', name: 'Pasay', provinceCode: 'MM' },
  { code: 'PIG', name: 'Pasig', provinceCode: 'MM' },
  { code: 'PAT', name: 'Pateros', provinceCode: 'MM' },
  { code: 'SJM', name: 'San Juan', provinceCode: 'MM' },
  { code: 'TAG', name: 'Taguig', provinceCode: 'MM' },
  { code: 'VAL', name: 'Valenzuela', provinceCode: 'MM' },

  // Cavite
  { code: 'DAS', name: 'Dasmariñas', provinceCode: 'CAV' },
  { code: 'BAC', name: 'Bacoor', provinceCode: 'CAV' },
  { code: 'IMU', name: 'Imus', provinceCode: 'CAV', isCapital: true },
  { code: 'CAV-C', name: 'Cavite City', provinceCode: 'CAV' },

  // Laguna
  { code: 'CAL-L', name: 'Calamba', provinceCode: 'LAG' },
  { code: 'STA', name: 'Santa Rosa', provinceCode: 'LAG' },
  { code: 'BIN', name: 'Biñan', provinceCode: 'LAG' },
  { code: 'SPC', name: 'San Pedro', provinceCode: 'LAG' },

  // Rizal
  { code: 'ANT', name: 'Antipolo', provinceCode: 'RIZ', isCapital: true },
  { code: 'CAI', name: 'Cainta', provinceCode: 'RIZ' },
  { code: 'TAY', name: 'Taytay', provinceCode: 'RIZ' },

  // Bulacan
  { code: 'MAL-B', name: 'Malolos', provinceCode: 'BUL', isCapital: true },
  { code: 'MER', name: 'Meycauayan', provinceCode: 'BUL' },

  // Cebu
  { code: 'CEB-C', name: 'Cebu City', provinceCode: 'CEB', isCapital: true },
  { code: 'MAN-C', name: 'Mandaue', provinceCode: 'CEB' },
  { code: 'LAP', name: 'Lapu-Lapu', provinceCode: 'CEB' },

  // Davao
  { code: 'DAV-C', name: 'Davao City', provinceCode: 'DAV', isCapital: true },
];

// Sample Barangays for major cities (focusing on Manila, Quezon City, Taguig)
export const PHILIPPINE_BARANGAYS: Barangay[] = [
  // Manila
  { code: 'MNL-001', name: 'Barangay 1 (Intramuros)', cityCode: 'MNL' },
  { code: 'MNL-002', name: 'Barangay 2 (Intramuros)', cityCode: 'MNL' },
  { code: 'MNL-003', name: 'Barangay 3 (Intramuros)', cityCode: 'MNL' },
  { code: 'MNL-004', name: 'Barangay 4 (Intramuros)', cityCode: 'MNL' },
  { code: 'MNL-ERR', name: 'Ermita', cityCode: 'MNL' },
  { code: 'MNL-MAL', name: 'Malate', cityCode: 'MNL' },
  { code: 'MNL-PAC', name: 'Paco', cityCode: 'MNL' },
  { code: 'MNL-PAN', name: 'Pandacan', cityCode: 'MNL' },
  { code: 'MNL-SAN', name: 'San Miguel', cityCode: 'MNL' },
  { code: 'MNL-STA', name: 'Santa Cruz', cityCode: 'MNL' },
  { code: 'MNL-SAM', name: 'Sampaloc', cityCode: 'MNL' },
  { code: 'MNL-TON', name: 'Tondo', cityCode: 'MNL' },

  // Quezon City
  { code: 'QC-BAT', name: 'Batasan Hills', cityCode: 'QC' },
  { code: 'QC-COM', name: 'Commonwealth', cityCode: 'QC' },
  { code: 'QC-CUB', name: 'Cubao', cityCode: 'QC' },
  { code: 'QC-DIL', name: 'Diliman', cityCode: 'QC' },
  { code: 'QC-FAI', name: 'Fairview', cityCode: 'QC' },
  { code: 'QC-KAM', name: 'Kamias', cityCode: 'QC' },
  { code: 'QC-KAT', name: 'Katipunan', cityCode: 'QC' },
  { code: 'QC-LAT', name: 'La Trinidad', cityCode: 'QC' },
  { code: 'QC-NOV', name: 'Novaliches', cityCode: 'QC' },
  { code: 'QC-PAY', name: 'Payatas', cityCode: 'QC' },
  { code: 'QC-TAT', name: 'Talipapa', cityCode: 'QC' },

  // Taguig
  { code: 'TAG-BGC', name: 'Fort Bonifacio', cityCode: 'TAG' },
  { code: 'TAG-HAG', name: 'Hagonoy', cityCode: 'TAG' },
  { code: 'TAG-LIG', name: 'Ligid-Tipas', cityCode: 'TAG' },
  { code: 'TAG-LOW', name: 'Lower Bicutan', cityCode: 'TAG' },
  { code: 'TAG-MAH', name: 'Maharlika Village', cityCode: 'TAG' },
  { code: 'TAG-NAP', name: 'Napindan', cityCode: 'TAG' },
  { code: 'TAG-PAL', name: 'Palingon', cityCode: 'TAG' },
  { code: 'TAG-PAT', name: 'Pateros', cityCode: 'TAG' },
  { code: 'TAG-SIG', name: 'Signal Village', cityCode: 'TAG' },
  { code: 'TAG-UPP', name: 'Upper Bicutan', cityCode: 'TAG' },
  { code: 'TAG-WAW', name: 'Wawa', cityCode: 'TAG' },
  { code: 'TAG-WES', name: 'Western Bicutan', cityCode: 'TAG' },

  // Makati
  { code: 'MAK-BEL', name: 'Bel-Air', cityCode: 'MAK' },
  { code: 'MAK-DAB', name: 'Dasmariñas', cityCode: 'MAK' },
  { code: 'MAK-FOR', name: 'Forbes Park', cityCode: 'MAK' },
  { code: 'MAK-GUA', name: 'Guadalupe Nuevo', cityCode: 'MAK' },
  { code: 'MAK-LEG', name: 'Legaspi Village', cityCode: 'MAK' },
  { code: 'MAK-PIO', name: 'Pio del Pilar', cityCode: 'MAK' },
  { code: 'MAK-POB', name: 'Poblacion', cityCode: 'MAK' },
  { code: 'MAK-SAN', name: 'San Lorenzo', cityCode: 'MAK' },

  // Pasig
  { code: 'PIG-BAG', name: 'Bagong Ilog', cityCode: 'PIG' },
  { code: 'PIG-KAP', name: 'Kapitolyo', cityCode: 'PIG' },
  { code: 'PIG-ORT', name: 'Ortigas', cityCode: 'PIG' },
  { code: 'PIG-PIN', name: 'Pinagbuhatan', cityCode: 'PIG' },
  { code: 'PIG-ROS', name: 'Rosario', cityCode: 'PIG' },
  { code: 'PIG-UGO', name: 'Ugong', cityCode: 'PIG' },
];

// Utility functions for filtering locations
export const getProvincesByRegion = (regionCode: string): Province[] => {
  return PHILIPPINE_PROVINCES.filter(
    (province) => province.regionCode === regionCode
  );
};

export const getCitiesByProvince = (provinceCode: string): City[] => {
  return PHILIPPINE_CITIES.filter((city) => city.provinceCode === provinceCode);
};

export const getBarangaysByCity = (cityCode: string): Barangay[] => {
  return PHILIPPINE_BARANGAYS.filter(
    (barangay) => barangay.cityCode === cityCode
  );
};

export const getRegionByCode = (code: string): Region | undefined => {
  return PHILIPPINE_REGIONS.find((region) => region.code === code);
};

export const getProvinceByCode = (code: string): Province | undefined => {
  return PHILIPPINE_PROVINCES.find((province) => province.code === code);
};

export const getCityByCode = (code: string): City | undefined => {
  return PHILIPPINE_CITIES.find((city) => city.code === code);
};

export const getBarangayByCode = (code: string): Barangay | undefined => {
  return PHILIPPINE_BARANGAYS.filter((barangay) => barangay.code === code)[0];
};

// Search functions
export const searchCities = (query: string, provinceCode?: string): City[] => {
  const cities = provinceCode
    ? getCitiesByProvince(provinceCode)
    : PHILIPPINE_CITIES;

  return cities.filter((city) =>
    city.name.toLowerCase().includes(query.toLowerCase())
  );
};

export const searchBarangays = (
  query: string,
  cityCode?: string
): Barangay[] => {
  const barangays = cityCode
    ? getBarangaysByCity(cityCode)
    : PHILIPPINE_BARANGAYS;

  return barangays.filter((barangay) =>
    barangay.name.toLowerCase().includes(query.toLowerCase())
  );
};
