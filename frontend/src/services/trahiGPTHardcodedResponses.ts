import { TrahiGPTStructuredResponse } from './trahiGPTService.ts';

export interface TrahiGPTResponseResult {
  reply: string;
  structuredData: TrahiGPTStructuredResponse;
}

/**
 * Hardcoded responses for hackathon demo reliability.
 * Covers 4 core emergency topics + 1 default fallback response.
 */

// 1. CPR & Cardiac Arrest Response
export const CPR_RESPONSE: TrahiGPTResponseResult = {
  reply: `### 🩺 CPR & Cardiac Arrest Emergency Protocol\n\n> 🚨 **CALL IMMEDIATELY**: Dial **112** or **108** for an emergency ambulance before starting CPR.\n\n#### **Step-by-Step Hands-Only CPR:**\n1. **Check Unresponsiveness**: Shake shoulders and shout loudly.\n2. **Hand Placement**: Place heel of one hand in center of chest, interlock second hand.\n3. **Chest Compressions**: Push hard and fast at **100-120 compressions per minute**.\n4. **Continue**: Do not stop until paramedics arrive or AED is available.`,
  structuredData: {
    title: 'CPR & Cardiac Response Protocol',
    urgency: 'critical',
    summary:
      'Immediate hands-only CPR is critical for victims of cardiac arrest or non-breathing emergencies. Push hard and fast in the center of the chest to maintain blood circulation until emergency responders arrive.',
    stats: [
      {
        label: 'Compression Rate',
        value: '100 - 120 BPM',
        subtext: "Match rhythm of 'Stayin' Alive'",
      },
      {
        label: 'Compression Depth',
        value: '2 - 2.5 Inches',
        subtext: '5 - 6 cm into chest center',
      },
    ],
    steps: [
      {
        stepNumber: 1,
        icon: 'alert',
        title: 'Check Unresponsiveness & Call 112/108',
        description:
          "Shake shoulders firmly and ask loudly 'Are you OK?'. If unresponsive and not breathing, shout for help and dial **112** or **108** immediately.",
      },
      {
        stepNumber: 2,
        icon: 'user',
        title: 'Position Victim & Hand Placement',
        description:
          'Place victim flat on their back on a firm surface. Place heel of one hand in center of chest, interlock second hand on top with fingers lifted off ribs.',
      },
      {
        stepNumber: 3,
        icon: 'heart',
        title: 'Perform High-Quality Compressions',
        description:
          'Position shoulders directly over hands with arms straight. Press down hard and fast at **100-120 compressions per minute**, allowing chest to fully recoil between pushes.',
      },
      {
        stepNumber: 4,
        icon: 'activity',
        title: 'Continue Until Medical Crew Arrives',
        description:
          'Do not interrupt compressions for more than 10 seconds. Switch compressors every 2 minutes if another person is present to prevent fatigue.',
      },
    ],
    contacts: [
      {
        name: 'National Emergency',
        number: '112',
        category: '24/7 Universal Hotline',
      },
      {
        name: 'Ambulance Response',
        number: '108',
        category: 'Medical Emergency',
      },
    ],
    warnings: [
      'DO NOT delay compressions to check for pulse if you are an untrained lay responder.',
      'DO NOT perform mouth-to-mouth if untrained or without a barrier mask — focus strictly on continuous Hands-Only CPR.',
    ],
    notes:
      'If an Automated External Defibrillator (AED) is available, power it on immediately and follow audio prompt instructions.',
  },
};

// 2. Severe Burn Treatment Response
export const BURN_RESPONSE: TrahiGPTResponseResult = {
  reply: `### 🔥 Severe Burn & Scald First-Aid Protocol\n\n> 🚨 **EMERGENCY WARNING**: Cool thermal burns with running water immediately. Never apply ice or butter.\n\n#### **Action Plan:**\n1. **Stop Burning**: Remove victim from heat or chemical source.\n2. **Cool with Water**: Run cool tap water over burn for 10-20 minutes.\n3. **Protect Burn**: Cover loosely with sterile non-adherent bandage.\n4. **Call Emergency**: Dial **108** or **101** for severe burns.`,
  structuredData: {
    title: 'Severe Burn & Scald First-Aid Protocol',
    urgency: 'high',
    summary:
      'First aid for thermal, chemical, or electrical burns focuses on stopping the burning process, cooling the tissue gently with room-temperature water, preventing infection, and seeking prompt medical evaluation.',
    stats: [
      {
        label: 'Cooling Duration',
        value: '10 - 20 Mins',
        subtext: 'Use cool running tap water',
      },
      {
        label: 'Medical Threshold',
        value: 'Size > Palm',
        subtext: 'Or burns to face/hands/joints',
      },
    ],
    steps: [
      {
        stepNumber: 1,
        icon: 'flame',
        title: 'Ensure Safety & Stop Burning',
        description:
          'Remove victim from heat, flame, or chemical source. For fire, Stop, Drop, and Roll. Turn off power source before touching electrical burn victims.',
      },
      {
        stepNumber: 2,
        icon: 'droplet',
        title: 'Cool with Running Water',
        description:
          'Hold burned area under cool running water (10°C to 25°C) for 10 to 20 minutes. Do **NOT** use ice, ice water, or freezing compresses.',
      },
      {
        stepNumber: 3,
        icon: 'shield',
        title: 'Remove Accessories & Protect Burn',
        description:
          'Gently remove tight clothing, rings, or jewelry before swelling begins. Cover burn loosely with clean, non-adherent sterile gauze or clean plastic wrap.',
      },
      {
        stepNumber: 4,
        icon: 'phone',
        title: 'Seek Medical Attention',
        description:
          "Transport to nearest hospital or call 108 if burn is larger than victim's palm, involves face, hands, feet, groin, or major joints, or appears charred/white.",
      },
    ],
    contacts: [
      {
        name: 'Fire & Rescue Services',
        number: '101',
        category: 'Fire Emergency',
      },
      {
        name: 'Medical Ambulance',
        number: '108',
        category: 'Emergency Transport',
      },
    ],
    warnings: [
      'DO NOT apply ice, butter, toothpaste, oil, or home remedies to open burns.',
      'DO NOT break or pop blisters, as this opens skin to severe bacterial infection.',
      'DO NOT peel off clothing stuck directly to burned flesh — trim around stuck fabric.',
    ],
    notes:
      'Keep victim warm with a dry blanket over uninjured areas to prevent hypothermia during prolonged water cooling.',
  },
};

// 3. Snakebite Emergency Response
export const SNAKEBITE_RESPONSE: TrahiGPTResponseResult = {
  reply: `### 🐍 Snakebite Emergency Triage (India Protocol)\n\n> 🚨 **CRITICAL WARNING**: Treat all snakebites in India as potentially venomous (Cobra, Viper, Krait). Call **108** immediately.\n\n#### **Action Plan:**\n1. **Keep Calm & Still**: Keep bitten limb below heart level.\n2. **Remove Accessories**: Take off tight footwear, rings, and jewelry.\n3. **Clean Lightly**: Wipe gently with clean water. Cover loosely.\n4. **Hospital Transport**: Rush to center with Anti-Snake Venom (ASV).`,
  structuredData: {
    title: 'Snakebite Emergency Triage (India Protocol)',
    urgency: 'critical',
    summary:
      "In India, snakebites from Big Four venomous species (Cobra, Russell's Viper, Saw-scaled Viper, Krait) are medical emergencies requiring immediate anti-snake venom (ASV) at a hospital.",
    stats: [
      {
        label: 'Golden Hour Rule',
        value: '< 60 Minutes',
        subtext: 'Reach hospital with ASV ASAP',
      },
      {
        label: 'Limb Position',
        value: 'Below Heart Level',
        subtext: 'Keep completely immobilized',
      },
    ],
    steps: [
      {
        stepNumber: 1,
        icon: 'shield',
        title: 'Immobilize Victim & Keep Calm',
        description:
          'Keep victim calm and completely still. Anxiety accelerates heart rate and venom distribution. Splint or support bitten limb below heart level.',
      },
      {
        stepNumber: 2,
        icon: 'user',
        title: 'Remove Rings & Tight Items',
        description:
          'Immediately take off rings, anklets, bracelets, watches, and tight footwear before localized tissue swelling increases.',
      },
      {
        stepNumber: 3,
        icon: 'droplet',
        title: 'Clean Gently & Note Appearance',
        description:
          "Wipe bite area gently with water or dry cloth. Note snake's size, color, or markings from a safe distance if possible (do NOT capture snake).",
      },
      {
        stepNumber: 4,
        icon: 'phone',
        title: 'Rapid Transport to ASV Center',
        description:
          'Rush victim to nearest district hospital or primary health center equipped with Polyvalent Anti-Snake Venom (ASV). Call 108 for ambulance.',
      },
    ],
    contacts: [
      {
        name: 'Ambulance / ASV Triage',
        number: '108',
        category: 'National Health Mission',
      },
      {
        name: 'National Emergency Hotline',
        number: '112',
        category: 'All Emergencies',
      },
    ],
    warnings: [
      'DO NOT cut the bite mark or attempt to suck out venom with mouth or suction tools.',
      'DO NOT apply tight tourniquets, arterial bands, or ice packs to the bitten limb.',
      'DO NOT give victim food, alcohol, pain medication, or herbal concoctions.',
    ],
    notes:
      'Most bites are non-venomous or dry bites, but ALL snakebites must be evaluated in a hospital setting for 24-hour observation.',
  },
};

// 4. Bleeding & Pressure Dressing Response
export const BLEEDING_RESPONSE: TrahiGPTResponseResult = {
  reply: `### 🩸 Severe Bleeding & Hemorrhage Control\n\n> 🚨 **EMERGENCY WARNING**: Rapid control of heavy bleeding prevents shock. Apply continuous direct pressure over wound.\n\n#### **Action Plan:**\n1. **Expose Wound**: Remove clothing to locate bleeding source.\n2. **Direct Pressure**: Press firmly with sterile pad for 5-10 mins.\n3. **Pressure Bandage**: Wrap tightly over dressing.\n4. **Call Emergency**: Dial **112** or **108** for heavy blood loss.`,
  structuredData: {
    title: 'Severe Bleeding & Hemorrhage Control',
    urgency: 'high',
    summary:
      'Rapid control of heavy bleeding prevents hemorrhagic shock. Direct pressure applied over the wound with sterile gauze or clean cloth is the primary, most effective line of treatment.',
    stats: [
      {
        label: 'Direct Pressure',
        value: 'Continuous 5-10m',
        subtext: 'Do NOT lift cloth to check',
      },
      {
        label: 'Elevation Level',
        value: 'Above Heart Level',
        subtext: 'If no fracture suspected',
      },
    ],
    steps: [
      {
        stepNumber: 1,
        icon: 'shield',
        title: 'Ensure Safety & Expose Wound',
        description:
          'Put on disposable gloves if available. Remove or cut clothing away from wound to identify exact source of arterial or venous bleeding.',
      },
      {
        stepNumber: 2,
        icon: 'droplet',
        title: 'Apply Direct Firm Pressure',
        description:
          'Place sterile pad, clean cloth, or gloved hands directly over wound. Push down firmly with continuous pressure for at least 5 to 10 minutes.',
      },
      {
        stepNumber: 3,
        icon: 'activity',
        title: 'Apply Pressure Bandage',
        description:
          'Wrap conforming bandage tightly over dressing to maintain pressure. If blood seeps through, **do NOT remove original cloth** — add more pads on top and re-wrap.',
      },
      {
        stepNumber: 4,
        icon: 'phone',
        title: 'Elevate & Seek Emergency Care',
        description:
          'Elevate injured limb above heart level if no bone fracture is suspected. For spurting arterial blood or uncontrolled bleeding, call **112** or **108** immediately.',
      },
    ],
    contacts: [
      {
        name: 'Emergency Ambulance',
        number: '108',
        category: 'Medical Dispatch',
      },
      {
        name: 'National Hotline',
        number: '112',
        category: 'Universal Emergency',
      },
    ],
    warnings: [
      'DO NOT remove soaked dressings or cloths — doing so disrupts early blood clotting.',
      'DO NOT apply improvised tourniquets unless trained and dealing with catastrophic limb amputation.',
      'DO NOT probe inside deep wounds or attempt to push protruding organs back in.',
    ],
    notes:
      'Monitor victim closely for signs of shock (pale clammy skin, rapid breathing, confusion). Keep victim lying down and warm with a blanket.',
  },
};

// 5. Default Fallback Response
export const DEFAULT_FALLBACK_RESPONSE: TrahiGPTResponseResult = {
  reply: `### 🛡️ Trahi Emergency Assistance Protocol\n\n> ℹ️ **GENERAL FIRST-AID GUIDANCE**: Remain calm and assess immediate surroundings for danger.\n\n#### **Core Safety Steps:**\n1. **Assess Safety**: Ensure scene is safe before assisting.\n2. **Call Helplines**: Dial **112**, **100**, or **108**.\n3. **Provide Location**: State landmarks and victim condition.\n4. **Keep Calm**: Follow phone dispatcher instructions.`,
  structuredData: {
    title: 'Trahi Emergency Assistance & First-Aid Protocol',
    urgency: 'info',
    summary:
      'I have received your emergency query. Please remain calm, ensure immediate personal safety, and follow standard emergency response protocols while reaching professional help.',
    stats: [
      {
        label: 'Primary Rule',
        value: 'Stay Calm',
        subtext: 'Assess scene for danger first',
      },
      {
        label: 'Response Time',
        value: 'Immediate',
        subtext: 'Dial hotlines below for dispatch',
      },
    ],
    steps: [
      {
        stepNumber: 1,
        icon: 'shield',
        title: 'Assess Scene Safety',
        description:
          'Before helping others, ensure the environment is safe from fire, electrical hazards, traffic, or collapse risks.',
      },
      {
        stepNumber: 2,
        icon: 'phone',
        title: 'Contact Nearest Emergency Service',
        description:
          'Dial **112** for all emergencies in India, **100** for Police dispatch, or **108** for Ambulance services.',
      },
      {
        stepNumber: 3,
        icon: 'activity',
        title: 'Provide Clear Location & Details',
        description:
          'Stay on the line, state your exact address/landmarks, nature of injury or distress, and number of people involved.',
      },
      {
        stepNumber: 4,
        icon: 'user',
        title: 'Follow First-Aid Guidance',
        description:
          'Keep victim comfortable, warm, and calm. Do not move injured persons unless immediate environmental danger threatens life.',
      },
    ],
    contacts: [
      {
        name: 'National Emergency',
        number: '112',
        category: 'Universal Helpline',
      },
      {
        name: 'Police Dispatch',
        number: '100',
        category: 'Law & Order',
      },
      {
        name: 'Ambulance / Medical',
        number: '108',
        category: 'Medical Triage',
      },
    ],
    warnings: [
      'DO NOT put yourself in danger when responding to emergencies.',
      'DO NOT give food or drink to unconscious or severely injured victims.',
    ],
    notes:
      'For specialized topics (CPR, Severe Burns, Snakebites, Bleeding), type those keywords into TrahiGPT for dedicated step-by-step action plans.',
  },
};

/**
 * Keyword matcher for emergency topics.
 * Returns pre-written structured first-aid guidance based on trigger words.
 */
export function getHardcodedResponse(userPrompt: string): TrahiGPTResponseResult {
  const input = (userPrompt || '').toLowerCase();

  // 1. CPR & Cardiac Arrest triggers
  const cprTriggers = ['cpr', 'cardiac arrest', 'heart stopped', 'not breathing', 'chest compressions'];
  if (cprTriggers.some((trigger) => input.includes(trigger))) {
    return CPR_RESPONSE;
  }

  // 2. Severe Burn Treatment triggers
  const burnTriggers = ['burn', 'burned', 'fire injury', 'scald'];
  if (burnTriggers.some((trigger) => input.includes(trigger))) {
    return BURN_RESPONSE;
  }

  // 3. Snakebite Emergency triggers
  const snakeTriggers = ['snake', 'snakebite', 'bitten by snake'];
  if (snakeTriggers.some((trigger) => input.includes(trigger))) {
    return SNAKEBITE_RESPONSE;
  }

  // 4. Bleeding & Pressure Dressing triggers
  const bleedingTriggers = ['bleeding', 'blood loss', 'deep cut', 'wound', 'hemorrhage'];
  if (bleedingTriggers.some((trigger) => input.includes(trigger))) {
    return BLEEDING_RESPONSE;
  }

  // 5. Default Fallback
  return DEFAULT_FALLBACK_RESPONSE;
}
