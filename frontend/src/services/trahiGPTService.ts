export interface TrahiGPTStep {
  stepNumber: number;
  title: string;
  description: string;
  icon?: string;
}

export interface TrahiGPTContact {
  name: string;
  number: string;
  category?: string;
}

export interface TrahiGPTStat {
  label: string;
  value: string;
  subtext?: string;
}

export interface TrahiGPTStructuredResponse {
  title?: string;
  summary?: string;
  urgency?: 'critical' | 'high' | 'moderate' | 'info';
  steps?: TrahiGPTStep[];
  contacts?: TrahiGPTContact[];
  stats?: TrahiGPTStat[];
  warnings?: string[];
  notes?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
  category?: string;
  structuredData?: TrahiGPTStructuredResponse;
  errorType?: 'CONFIG_MISSING' | 'RATE_LIMIT' | 'GENERAL_ERROR';
  retryPrompt?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface TrahiGPTResponseResult {
  text: string;
  structuredData?: TrahiGPTStructuredResponse;
  errorType?: 'CONFIG_MISSING' | 'RATE_LIMIT' | 'GENERAL_ERROR';
  retryPrompt?: string;
}

const STORAGE_KEY = 'trahigpt_sessions_v1';

// Initial default session if none exists
export function getInitialSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load TrahiGPT sessions from localStorage:', e);
  }

  // Sample initial sessions with structured visual data
  const sampleSessions: ChatSession[] = [
    {
      id: 'session-cpr-guide',
      title: 'CPR & Cardiac Response Guide',
      createdAt: Date.now() - 3600000 * 2,
      updatedAt: Date.now() - 3600000 * 2,
      messages: [
        {
          id: 'msg-1',
          sender: 'user',
          text: 'How do I perform hands-only CPR on an unconscious adult?',
          timestamp: Date.now() - 3600000 * 2,
        },
        {
          id: 'msg-2',
          sender: 'assistant',
          text: 'Emergency CPR & Cardiac Response Protocol',
          timestamp: Date.now() - 3600000 * 2 + 1000,
          structuredData: {
            title: 'Emergency CPR & Cardiac Response Protocol',
            summary: 'Immediate hands-only CPR keeps oxygen flowing to brain and vital organs until professional paramedics arrive.',
            urgency: 'critical',
            steps: [
              {
                stepNumber: 1,
                title: 'Position the Victim',
                description: 'Place the victim flat on their back on a firm, hard surface.',
                icon: 'user',
              },
              {
                stepNumber: 2,
                title: 'Hand Placement',
                description: 'Place the heel of one hand in the center of their chest. Lock second hand over the first with fingers interlaced.',
                icon: 'activity',
              },
              {
                stepNumber: 3,
                title: 'Chest Compressions',
                description: 'Push hard and fast at a rate of 100 to 120 compressions per minute.',
                icon: 'heart',
              },
              {
                stepNumber: 4,
                title: 'Compression Depth',
                description: 'Compress 2 inches (5 cm) deep and allow full chest recoil between compressions.',
                icon: 'check',
              },
            ],
            contacts: [
              { name: 'National Emergency', number: '112', category: 'All-in-One' },
              { name: 'Ambulance & Paramedic', number: '108', category: 'Medical' },
            ],
            stats: [
              { label: 'Compression Rate', value: '100-120 / min', subtext: "Rhythm of 'Stayin' Alive'" },
              { label: 'Compression Depth', value: '2 inches (5 cm)', subtext: 'Allow complete recoil' },
            ],
            warnings: [
              'Do not interrupt compressions for more than 10 seconds.',
              'Do not compress on soft mattresses or pillows.',
            ],
            notes: 'If an Automated External Defibrillator (AED) is available, turn it on immediately and follow its voice instructions.',
          },
        },
      ],
    },
  ];

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleSessions));
  } catch (e) {
    // Ignore quota errors
  }

  return sampleSessions;
}

export function saveSessionsToStorage(sessions: ChatSession[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.warn('Failed to save TrahiGPT sessions to localStorage:', e);
  }
}

export function getSimulatedTrahiGPTResponse(prompt: string): TrahiGPTStructuredResponse {
  const query = prompt.toLowerCase();

  // 1. CPR & Cardiac Response
  if (
    query.includes('cpr') ||
    query.includes('cardiac') ||
    query.includes('heart attack') ||
    query.includes('unconscious') ||
    query.includes('chest compression') ||
    query.includes('resuscitation')
  ) {
    return {
      title: 'Emergency CPR & Cardiac Response Protocol',
      summary: 'Immediate hands-only CPR keeps oxygen flowing to brain and vital organs until professional paramedics arrive.',
      urgency: 'critical',
      steps: [
        {
          stepNumber: 1,
          title: 'Position the Victim',
          description: 'Place the victim flat on their back on a firm, hard surface. Kneel beside their neck and shoulders.',
          icon: 'user',
        },
        {
          stepNumber: 2,
          title: 'Hand Placement',
          description: 'Place the heel of one hand in the center of their chest. Lock second hand over the first with fingers interlaced.',
          icon: 'activity',
        },
        {
          stepNumber: 3,
          title: 'Chest Compressions',
          description: 'Push hard and fast at a rate of **100 to 120 compressions per minute** (rhythm of "Stayin Alive").',
          icon: 'heart',
        },
        {
          stepNumber: 4,
          title: 'Compression Depth & Recoil',
          description: 'Compress **2 inches (5 cm)** deep and allow full chest recoil between compressions.',
          icon: 'check',
        },
        {
          stepNumber: 5,
          title: 'Use AED if Available',
          description: 'If an Automated External Defibrillator (AED) is nearby, turn it on immediately and follow voice instructions.',
          icon: 'alert',
        },
      ],
      contacts: [
        { name: 'National Emergency Helpline', number: '112', category: 'All-in-One Emergency' },
        { name: 'Ambulance & Paramedic', number: '108', category: 'Medical Emergency' },
      ],
      stats: [
        { label: 'Compression Rate', value: '100–120 / min', subtext: "Rhythm of 'Stayin Alive'" },
        { label: 'Target Depth', value: '2 inches (5 cm)', subtext: 'Allow complete recoil' },
      ],
      warnings: [
        'Do NOT interrupt compressions for more than 10 seconds.',
        'Do NOT perform compressions on soft mattresses or pillows.',
      ],
      notes: 'Continue compressions continuously until paramedics take over or victim shows clear signs of life.',
    };
  }

  // 2. Severe Burn Treatment
  if (
    query.includes('burn') ||
    query.includes('scald') ||
    query.includes('fire') ||
    query.includes('thermal') ||
    query.includes('heat') ||
    query.includes('blister')
  ) {
    return {
      title: 'Severe Burn & Thermal Scald First-Aid Protocol',
      summary: 'Immediate cooling with clean running water limits tissue damage and reduces traumatic pain.',
      urgency: 'critical',
      steps: [
        {
          stepNumber: 1,
          title: 'Cool Immediately',
          description: 'Hold burn under cool (not ice-cold) running tap water for **10 to 20 minutes**.',
          icon: 'droplet',
        },
        {
          stepNumber: 2,
          title: 'Remove Constrictions',
          description: 'Gently remove rings, watches, or tight clothes near burn area before swelling starts.',
          icon: 'user',
        },
        {
          stepNumber: 3,
          title: 'Cover Cleanly',
          description: 'Cover burn loosely with sterile non-stick gauze or clean plastic wrap.',
          icon: 'check',
        },
        {
          stepNumber: 4,
          title: 'Elevate Limb',
          description: 'Raise burned arm or leg above heart level to minimize localized swelling.',
          icon: 'activity',
        },
      ],
      contacts: [
        { name: 'National Emergency', number: '112', category: 'All-in-One' },
        { name: 'Fire Helpline', number: '101', category: 'Fire & Rescue' },
        { name: 'Ambulance & Paramedic', number: '108', category: 'Medical' },
      ],
      stats: [
        { label: 'Cooling Duration', value: '10–20 Minutes', subtext: 'Cool tap water (approx 15°C)' },
        { label: 'Dressing Type', value: 'Non-stick Sterile', subtext: 'Cover loosely' },
      ],
      warnings: [
        'NEVER apply ice, butter, toothpaste, turmeric, or oils to burns.',
        'NEVER break or pop burn blisters.',
      ],
      notes: 'Seek immediate emergency hospital care for burns covering face, hands, groin, or major body areas.',
    };
  }

  // 3. Snakebite Emergency
  if (
    query.includes('snake') ||
    query.includes('bite') ||
    query.includes('venom') ||
    query.includes('cobra') ||
    query.includes('viper') ||
    query.includes('krait')
  ) {
    return {
      title: 'Venomous Snakebite First-Aid Triage (India)',
      summary: 'Immobilize victim immediately and stay calm to slow venom distribution through the lymphatic system.',
      urgency: 'critical',
      steps: [
        {
          stepNumber: 1,
          title: 'Stay Calm & Still',
          description: 'Keep victim completely motionless. Any physical movement accelerates venom circulation.',
          icon: 'user',
        },
        {
          stepNumber: 2,
          title: 'Immobilize Limb',
          description: 'Keep bitten limb **BELOW heart level**. Use a rigid splint or cloth sling to restrict movement.',
          icon: 'shield',
        },
        {
          stepNumber: 3,
          title: 'Remove Jewelry & Shoes',
          description: 'Remove tight rings, anklets, and footwear near bite before rapid swelling begins.',
          icon: 'activity',
        },
        {
          stepNumber: 4,
          title: 'Clean & Cover',
          description: 'Wash wound gently with clean water and cover loosely with a dry, clean bandage.',
          icon: 'check',
        },
        {
          stepNumber: 5,
          title: 'Rush to Hospital',
          description: 'Transport victim immediately to nearest hospital stocked with Polyvalent Anti-Snake Venom (ASV).',
          icon: 'phone',
        },
      ],
      contacts: [
        { name: 'National Emergency Helpline', number: '112', category: 'All-in-One' },
        { name: 'Medical Ambulance', number: '108', category: 'Emergency Transport' },
        { name: 'Forest / Wildlife Helpline', number: '1926', category: 'Wildlife Rescue' },
      ],
      stats: [
        { label: 'Medical Cure', value: 'Polyvalent ASV', subtext: 'Available at Government District Hospitals' },
        { label: 'Gold Standard', value: 'Complete Stillness', subtext: 'Slows lymphatic venom absorption' },
      ],
      warnings: [
        'DO NOT cut, suck, or incise the snakebite wound.',
        'DO NOT apply tight tourniquets, ice packs, or herbal pastes.',
      ],
      notes: 'Polyvalent Anti-Snake Venom (ASV) neutralizes bites from Big Four snakes (Cobra, Russell Viper, Saw-scaled Viper, Krait) and is free at all Indian government district hospitals.',
    };
  }

  // 4. Bleeding & Pressure Dressing
  if (
    query.includes('bleed') ||
    query.includes('bleeding') ||
    query.includes('wound') ||
    query.includes('blood') ||
    query.includes('hemorrhage') ||
    query.includes('cut') ||
    query.includes('bandage')
  ) {
    return {
      title: 'Severe Bleeding & Hemorrhage Control Protocol',
      summary: 'Direct firm continuous pressure is the single most effective action to stop life-threatening arterial or venous bleeding.',
      urgency: 'critical',
      steps: [
        {
          stepNumber: 1,
          title: 'Apply Direct Pressure',
          description: 'Press clean cloth or sterile gauze firmly directly onto the bleeding wound site.',
          icon: 'droplet',
        },
        {
          stepNumber: 2,
          title: 'Maintain Constant Force',
          description: 'Maintain continuous heavy pressure with both hands for at least **10 solid minutes** without checking wound.',
          icon: 'heart',
        },
        {
          stepNumber: 3,
          title: 'Elevate Wound',
          description: 'Elevate bleeding arm or leg above heart level if no broken bones are suspected.',
          icon: 'activity',
        },
        {
          stepNumber: 4,
          title: 'Layer Extra Dressings',
          description: 'If blood soaks through, add more pads directly on top. Do NOT remove original dressing.',
          icon: 'check',
        },
      ],
      contacts: [
        { name: 'National Emergency', number: '112', category: 'All-in-One' },
        { name: 'Medical Ambulance', number: '108', category: 'Emergency Medical' },
      ],
      stats: [
        { label: 'Pressure Duration', value: '10 Mins Minimum', subtext: 'Continuous heavy pressure' },
        { label: 'Limb Position', value: 'Above Heart Level', subtext: 'Reduces hydrostatic pressure' },
      ],
      warnings: [
        'DO NOT remove initial soaked gauze; layer fresh pads directly over existing ones.',
        'DO NOT apply tourniquets unless trained and bleeding is uncontrolled on a limb.',
      ],
      notes: 'Keep victim lying down and covered with a warm blanket to prevent hypothermia and shock.',
    };
  }

  // 5. Earthquake & Structural Safety
  if (
    query.includes('earthquake') ||
    query.includes('tremor') ||
    query.includes('shake') ||
    query.includes('quake') ||
    query.includes('building') ||
    query.includes('rubble')
  ) {
    return {
      title: 'Earthquake Survival & Structural Emergency Protocol',
      summary: 'Drop, Cover, and Hold On immediately during seismic shaking to shield head and vital organs from falling debris.',
      urgency: 'high',
      steps: [
        {
          stepNumber: 1,
          title: 'DROP',
          description: 'Drop onto your hands and knees immediately before shaking knocks you down.',
          icon: 'user',
        },
        {
          stepNumber: 2,
          title: 'COVER',
          description: 'Crawl under a sturdy table, desk, or against an interior load-bearing wall. Shield head and neck with arms.',
          icon: 'shield',
        },
        {
          stepNumber: 3,
          title: 'HOLD ON',
          description: 'Hold on to your shelter until all shaking completely stops.',
          icon: 'check',
        },
        {
          stepNumber: 4,
          title: 'Evacuate via Stairs',
          description: 'Evacuate carefully after shaking stops. Watch out for fallen power lines and glass.',
          icon: 'alert',
        },
      ],
      contacts: [
        { name: 'National Emergency', number: '112', category: 'All-in-One' },
        { name: 'NDRF Disaster Control', number: '1078', category: 'Disaster Response' },
        { name: 'Police Helpline', number: '100', category: 'Law & Order' },
      ],
      stats: [
        { label: 'Key Golden Rule', value: 'Drop, Cover & Hold', subtext: 'Shield head & neck' },
        { label: 'Evacuation Route', value: 'Stairs ONLY', subtext: 'Never use elevators' },
      ],
      warnings: [
        'NEVER use elevators during or after an earthquake.',
        'Stay clear of glass windows, mirrors, exterior walls, and heavy overhead light fixtures.',
      ],
      notes: 'Be prepared for secondary aftershocks. If trapped under rubble, tap on pipes or walls rather than shouting to conserve oxygen.',
    };
  }

  // 6. Flood & Submergence
  if (
    query.includes('flood') ||
    query.includes('submerge') ||
    query.includes('water') ||
    query.includes('drowning') ||
    query.includes('evacuate') ||
    query.includes('rain')
  ) {
    return {
      title: 'Flash Flood & Rising Water Rescue Protocol',
      summary: 'Move to high ground immediately. Avoid walking, swimming, or driving through moving floodwaters.',
      urgency: 'high',
      steps: [
        {
          stepNumber: 1,
          title: 'Seek High Ground',
          description: 'Move immediately to upper floors, sturdy roofs, or high ground terrain.',
          icon: 'shield',
        },
        {
          stepNumber: 2,
          title: 'Turn Off Utilities',
          description: 'Shut off main gas, water, and electrical power switches before floodwaters enter structure.',
          icon: 'alert',
        },
        {
          stepNumber: 3,
          title: 'Avoid Moving Water',
          description: 'Never attempt to walk through moving water deeper than **6 inches (15 cm)**.',
          icon: 'droplet',
        },
        {
          stepNumber: 4,
          title: 'Signal for Help',
          description: 'Use bright cloth, flashlights, or whistles from roof to signal NDRF/SDRF rescue boats.',
          icon: 'phone',
        },
      ],
      contacts: [
        { name: 'National Emergency Helpline', number: '112', category: 'All-in-One Emergency' },
        { name: 'NDRF Rescue Control', number: '1078', category: 'Disaster Relief' },
        { name: 'State Disaster Response (SDRF)', number: '1070', category: 'State Disaster Triage' },
      ],
      stats: [
        { label: 'Hazardous Water Depth', value: '6 Inches (15 cm)', subtext: 'Can knock down an adult' },
        { label: 'Vehicle Risk Depth', value: '12 Inches (30 cm)', subtext: 'Sweeps cars away' },
      ],
      warnings: [
        'DO NOT drive into flooded underpasses or submerged roads ("Turn Around, Don\'t Drown").',
        'Beware of submerged live power cables, sewage contamination, and floating debris.',
      ],
      notes: 'Keep mobile phone in battery saver mode and store critical identification documents in waterproof pouches.',
    };
  }

  // 7. Choking & Airway Obstruction
  if (
    query.includes('chok') ||
    query.includes('choking') ||
    query.includes('food stuck') ||
    query.includes('airway') ||
    query.includes('heimlich')
  ) {
    return {
      title: 'Choking & Airway Obstruction First Aid (Heimlich Maneuver)',
      summary: 'Rapid back blows and abdominal thrusts dislodge foreign objects obstructing the trachea.',
      urgency: 'critical',
      steps: [
        {
          stepNumber: 1,
          title: 'Encourage Coughing',
          description: 'If victim can speak or cough loudly, encourage them to keep coughing forcefully.',
          icon: 'user',
        },
        {
          stepNumber: 2,
          title: '5 Sharp Back Blows',
          description: 'Lean victim forward. Give 5 sharp blows between shoulder blades with heel of hand.',
          icon: 'activity',
        },
        {
          stepNumber: 3,
          title: '5 Abdominal Thrusts',
          description: 'Stand behind victim, wrap arms around waist, make a fist above navel, and pull inward & upward 5 times.',
          icon: 'heart',
        },
        {
          stepNumber: 4,
          title: 'Repeat Cycle',
          description: 'Alternate 5 back blows and 5 abdominal thrusts until object is dislodged or victim loses consciousness.',
          icon: 'check',
        },
      ],
      contacts: [
        { name: 'National Emergency', number: '112', category: 'All-in-One' },
        { name: 'Medical Ambulance', number: '108', category: 'Emergency Ambulance' },
      ],
      stats: [
        { label: 'Cycle Ratio', value: '5 Blows : 5 Thrusts', subtext: 'Back blows & Abdominal thrusts' },
        { label: 'Hand Placement', value: 'Above Navel', subtext: 'Below ribcage, inward & upward' },
      ],
      warnings: [
        'DO NOT perform abdominal thrusts on infants under 1 year (use chest thrusts instead).',
        'DO NOT perform blind finger sweeps in victim\'s mouth.',
      ],
      notes: 'If victim becomes unconscious, lower them gently to ground and begin CPR immediately.',
    };
  }

  // 8. Specific Default / Fallback Response for ANY OTHER question
  return {
    title: 'Trahi Emergency & First-Aid Guidance',
    summary: 'Stay calm, evaluate immediate safety, contact emergency hotlines, and follow universal first-aid guidelines.',
    urgency: 'high',
    steps: [
      {
        stepNumber: 1,
        title: 'Ensure Scene Safety',
        description: 'Check for immediate hazards (fire, traffic, live electricity, falling objects) before approaching.',
        icon: 'shield',
      },
      {
        stepNumber: 2,
        title: 'Call Emergency Services',
        description: 'Dial **112** (National Emergency) or **108** (Ambulance) for professional emergency medical dispatch.',
        icon: 'phone',
      },
      {
        stepNumber: 3,
        title: 'Assess Victim State',
        description: 'Check if victim is conscious, breathing normally, and responsive to voice or touch.',
        icon: 'user',
      },
      {
        stepNumber: 4,
        title: 'Provide Supportive First Aid',
        description: 'Keep the victim comfortable, warm, and calm. Do not leave them unattended.',
        icon: 'check',
      },
      {
        stepNumber: 5,
        title: 'Monitor Vitals',
        description: 'Continuously monitor breathing and pulse until emergency paramedics arrive on scene.',
        icon: 'activity',
      },
    ],
    contacts: [
      { name: 'National Emergency Helpline', number: '112', category: 'All-in-One Emergency' },
      { name: 'Ambulance & Paramedic', number: '108', category: 'Medical Response' },
      { name: 'Fire Helpline', number: '101', category: 'Fire & Rescue' },
      { name: 'Police Helpline', number: '100', category: 'Police Control' },
    ],
    stats: [
      { label: 'Emergency Dispatch', value: 'Active 24/7', subtext: 'National Helpline 112' },
      { label: 'Response Protocol', value: 'Triage Ready', subtext: 'NDMA Approved Standards' },
    ],
    warnings: [
      'Do NOT move an injured victim with suspected neck or spine injuries unless in immediate danger.',
      'Do NOT administer food, drink, or oral medication to an unconscious or severely injured person.',
    ],
    notes: 'TrahiGPT provides emergency guidance based on Indian National Disaster Management Authority (NDMA) & Red Cross protocols.',
  };
}

export async function sendTrahiGPTMessage(
  prompt: string,
  history: ChatMessage[] = []
): Promise<TrahiGPTResponseResult> {
  // Simulate AI delay for smooth user experience
  await new Promise((resolve) => setTimeout(resolve, 600));

  try {
    const res = await fetch('/api/trahigpt-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, history }),
    });

    const data = await res.json().catch(() => null);

    if (res.ok && data && data.success === true && data.reply) {
      const rawReply = data.reply;
      let parsedData: TrahiGPTStructuredResponse | undefined = undefined;

      try {
        let cleanJson = rawReply.trim();
        if (cleanJson.startsWith('```json')) {
          cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanJson.startsWith('```')) {
          cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        const parsed = JSON.parse(cleanJson);
        if (typeof parsed === 'object' && parsed !== null && parsed.title) {
          parsedData = {
            title: parsed.title,
            summary: parsed.summary,
            urgency: parsed.urgency || 'info',
            steps: Array.isArray(parsed.steps) ? parsed.steps : [],
            contacts: Array.isArray(parsed.contacts) ? parsed.contacts : [],
            stats: Array.isArray(parsed.stats) ? parsed.stats : [],
            warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
            notes: parsed.notes,
          };
        }
      } catch (e) {
        // Fall back to simulated response if parsing failed
      }

      if (parsedData) {
        return {
          text: rawReply,
          structuredData: parsedData,
        };
      }
    }
  } catch (err) {
    // Ignore backend connection errors and fallback to hardcoded response
  }

  // Fallback / Simulated Response Generator
  const simulated = getSimulatedTrahiGPTResponse(prompt);
  return {
    text: simulated.summary || simulated.title || 'TrahiGPT Response',
    structuredData: simulated,
  };
}

