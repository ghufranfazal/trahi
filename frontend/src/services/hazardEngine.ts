export interface SafetyKitItem {
  id: string;
  item: string;
  category: 'Medical' | 'Supplies' | 'Food' | 'Power' | string;
  defaultChecked: boolean;
}

export interface HazardProfile {
  profileId: string;
  regionName: string;
  activeThreat: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  seasonalMonths?: number[];
  temperature?: string;
  airQuality?: string;
  seismicIndex?: string;
  precautionarySteps: string[];
  safetyKitChecklist: SafetyKitItem[];
}

/**
 * Resolves the active regional hazard profile and safety checklist kit
 * based on user GPS coordinates and regional risk matrices.
 */
export const resolveRegionalRisk = async (lat: number, lng: number): Promise<HazardProfile> => {
  // 1. Delhi NCR Coordinates (Approx: 28.3 - 28.9 N, 76.8 - 77.4 E)
  if (lat >= 28.2 && lat <= 29.1 && lng >= 76.6 && lng <= 77.6) {
    return {
      profileId: 'delhi_heatwave',
      regionName: 'Delhi NCR & Northern Plains',
      activeThreat: 'Extreme Heatwave & Severe Smog',
      severity: 'HIGH',
      seasonalMonths: [4, 5, 6, 7, 8, 9],
      temperature: '43.5°C (Feels like 47°C)',
      airQuality: 'AQI 342 (Hazardous Smog)',
      precautionarySteps: [
        'Schedule essential outdoor movement before 10:00 AM or after 5:00 PM.',
        'Carry at least 1.5L of oral rehydration solution (ORS) per person.',
        'Keep battery-operated mini fans or wet cooling cloths accessible.',
        'Ensure power banks are charged in case of peak-load grid power cuts.'
      ],
      safetyKitChecklist: [
        { id: 'del_1', item: 'ORS / Electrolyte Packets (x10)', category: 'Medical', defaultChecked: true },
        { id: 'del_2', item: 'Insulated Thermal Water Jug (2L)', category: 'Supplies', defaultChecked: false },
        { id: 'del_3', item: 'Glucose Powder / Energy Bars', category: 'Food', defaultChecked: false },
        { id: 'del_4', item: 'Power Bank (20,000 mAh)', category: 'Power', defaultChecked: true },
        { id: 'del_5', item: 'N95 Protective Smog Respirator', category: 'Medical', defaultChecked: false }
      ]
    };
  }

  // 2. Nepal / Himalayan Seismic & Flash Flood Zone (Approx: 26.5 - 30.5 N, 80.0 - 88.5 E)
  if (lat >= 26.5 && lat <= 30.5 && lng >= 80.0 && lng <= 88.5) {
    return {
      profileId: 'nepal_seismic_flood',
      regionName: 'Kathmandu Valley / Nepal Himalayan Belt',
      activeThreat: 'Flash Floods & Seismic Activity',
      severity: 'CRITICAL',
      seasonalMonths: [5, 6, 7, 8, 9],
      temperature: '24.2°C (Heavy Cloudburst Alert)',
      seismicIndex: 'Faultline Zone V (High Risk)',
      precautionarySteps: [
        'Identify structural drop-cover-hold zones inside your residence.',
        'Keep emergency document pouch in a waterproof, floatable grab-bag near the main exit.',
        'Establish a high-ground evacuation route plan for sudden flash flood alerts.',
        'Store multi-day canned food and water purification tablets.'
      ],
      safetyKitChecklist: [
        { id: 'nep_1', item: 'Water Purification Tablets (x50)', category: 'Medical', defaultChecked: false },
        { id: 'nep_2', item: 'High-Decibel Signal Whistle & Glowsticks', category: 'Supplies', defaultChecked: true },
        { id: 'nep_3', item: 'Waterproof Sealed Document Pouch', category: 'Supplies', defaultChecked: false },
        { id: 'nep_4', item: 'Solar Powered Flashlight & Dynamo', category: 'Power', defaultChecked: false },
        { id: 'nep_5', item: 'Heavy-Duty Work Gloves & First-Aid Trauma Gauze', category: 'Medical', defaultChecked: false }
      ]
    };
  }

  // 3. Assam / Brahmaputra River Basin (Approx: 25.0 - 28.5 N, 89.5 - 96.0 E)
  if (lat >= 25.0 && lat <= 28.5 && lng >= 89.5 && lng <= 96.0) {
    return {
      profileId: 'assam_flood_monsoon',
      regionName: 'Assam Valley & Brahmaputra Basin',
      activeThreat: 'Severe Riverine Flood & Embankment Overflow',
      severity: 'CRITICAL',
      seasonalMonths: [5, 6, 7, 8, 9, 10],
      temperature: '29.0°C (Torrential Rain)',
      precautionarySteps: [
        'Elevate essential dry food supplies and livestock feed to high stilts/platforms.',
        'Keep inflatable buoyancy tubes or life-jackets accessible near exits.',
        'Monitor central water commission Brahmaputra danger marks regularly.'
      ],
      safetyKitChecklist: [
        { id: 'asm_1', item: 'Chlorine Water Purification Drops (100ml)', category: 'Medical', defaultChecked: true },
        { id: 'asm_2', item: 'Inflatable Life Vest / Buoyancy Ring', category: 'Supplies', defaultChecked: false },
        { id: 'asm_3', item: 'Solar Emergency Alert Radio (FM / NOAA)', category: 'Power', defaultChecked: false },
        { id: 'asm_4', item: 'High-Calorie Ready Rations / Puffed Rice & Jaggery', category: 'Food', defaultChecked: false }
      ]
    };
  }

  // 4. Mumbai / Konkan Coastal Sector (Approx: 18.5 - 20.2 N, 72.5 - 73.5 E)
  if (lat >= 18.5 && lat <= 20.2 && lng >= 72.5 && lng <= 73.5) {
    return {
      profileId: 'mumbai_urban_flood',
      regionName: 'Mumbai & Konkan Coastal Sector',
      activeThreat: 'High Tide & Extreme Urban Waterlogging',
      severity: 'HIGH',
      seasonalMonths: [6, 7, 8, 9],
      temperature: '28.8°C (4.8m High Tide Alert)',
      precautionarySteps: [
        'Avoid low-lying subways and railway culverts during high tide surge windows.',
        'Keep essential medications sealed in double-layer zip pouches.',
        'Unplug ground-level electronics to avoid short circuits.'
      ],
      safetyKitChecklist: [
        { id: 'mum_1', item: 'Waterproof Phone & Document Pouch', category: 'Supplies', defaultChecked: true },
        { id: 'mum_2', item: 'Anti-Slip High-Traction Rain Boots', category: 'Supplies', defaultChecked: false },
        { id: 'mum_3', item: 'Antiseptic Ointment & Bandages', category: 'Medical', defaultChecked: false },
        { id: 'mum_4', item: 'High-Lumen Rechargeable Headlamp', category: 'Power', defaultChecked: false }
      ]
    };
  }

  // 5. Default Regional Fallback
  return {
    profileId: 'general_monsoon',
    regionName: 'General Inland Zone',
    activeThreat: 'Seasonal Monsoon & Heavy Downpour Alert',
    severity: 'MEDIUM',
    seasonalMonths: [6, 7, 8, 9],
    temperature: '30.1°C (Scattered Showers)',
    precautionarySteps: [
      'Keep local emergency helpline numbers (112, 1078) pinned and saved offline.',
      'Inspect household roof drainage and backup lighting kits.',
      'Store at least 3 days of clean drinking water in sealed containers.'
    ],
    safetyKitChecklist: [
      { id: 'gen_1', item: 'Standard First Aid Emergency Kit', category: 'Medical', defaultChecked: true },
      { id: 'gen_2', item: 'Multi-Tool Pocket Knife & Whistle', category: 'Supplies', defaultChecked: false },
      { id: 'gen_3', item: 'Dry Rations & Energy Biscuits', category: 'Food', defaultChecked: false },
      { id: 'gen_4', item: 'LED Emergency Torch with Extra Batteries', category: 'Power', defaultChecked: false }
    ]
  };
};
