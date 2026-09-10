/**
 * THUNAI Voice Intent Normalization & Classification Engine
 * 
 * Accurately parses natural language queries in English, Tamil, and Tanglish,
 * normalizing them into structured system intents.
 */

export type VoiceIntentType =
  | 'CAMERA_OPEN'
  | 'CAMERA_CLOSE'
  | 'FIND_EXIT'
  | 'FIND_DOOR'
  | 'CHECK_OBSTACLES'
  | 'CHECK_PATH_CLEAR'
  | 'CHECK_DIRECTION'
  | 'DISTANCE_QUERY'
  | 'DESCRIBE_SURROUNDINGS'
  | 'STOP_SPEECH'
  | 'REPEAT'
  | 'EMERGENCY'
  | 'CANCEL_SOS'
  | 'CONFIRM_CANCEL_SOS'
  | 'GREETING'
  | 'GENERAL_QUERY';

export interface ClassifiedVoiceIntent {
  intent: VoiceIntentType;
  confidence: number;
  originalText: string;
  normalizedText: string;
  targetObject?: string;
  targetDirection?: 'left' | 'right' | 'ahead' | 'behind';
  language: 'en' | 'ta' | 'te' | 'hi';
  isVisualCommand: boolean;
  requiresCamera: boolean;
}

interface IntentPattern {
  intent: VoiceIntentType;
  patterns: RegExp[];
  targetObject?: string;
  targetDirection?: 'left' | 'right' | 'ahead' | 'behind';
  requiresCamera: boolean;
}

const INTENT_PATTERNS: IntentPattern[] = [
  // 1. Camera Control
  {
    intent: 'CAMERA_OPEN',
    patterns: [
      /\b(open|start|turn on|activate|enable|show)\s+(the\s+)?camera\b/i,
      /\bcamera\s+(open|start|on|activate)\b/i,
      /\bcamera\s+(open\s+pannunga|start\s+pannunga|on\s+pannunga)\b/i,
      /\b(look around|turn on vision)\b/i,
      /\b(கேமரா\s*திற|கேமராவை\s*ஆன்\s*செய்)\b/i,
      /\b(కెమెరా\s*ఆన్\s*చేయి|కెమెరా\s*తెరవండి)\b/i,
    ],
    requiresCamera: true,
  },
  {
    intent: 'CAMERA_CLOSE',
    patterns: [
      /\b(close|stop|turn off|disable|shut)\s+(the\s+)?camera\b/i,
      /\bcamera\s+(close|stop|off)\b/i,
      /\bcamera\s+(close\s+pannunga|stop\s+pannunga|off\s+pannunga)\b/i,
      /\b(stop vision|pause camera)\b/i,
      /\b(கேமராவை\s*மூடு|கேமராவை\s*நிறுத்து)\b/i,
      /\b(కెమెరా\s*ఆపు|కెమెరా\s*మూసివేయి)\b/i,
    ],
    requiresCamera: false,
  },

  // 2. Interruption / Stop Speech
  {
    intent: 'STOP_SPEECH',
    patterns: [
      /^(stop|be quiet|stop talking|stop speaking|cancel|hush|shut up|silence|pause)$/i,
      /\b(be quiet|stop talking|stop speaking|quiet please)\b/i,
      /\b(பேசாதே|நிறுத்து|அமைதியாக இரு|போதும்)\b/i,
      /\b(మాట్లాడకు|ఆపు|నిశ్శబ్దంగా ఉండు|చాలు)\b/i,
      /\b(chup|chup raho|ruk jao|band karo)\b/i,
    ],
    requiresCamera: false,
  },

  // 3. Exit Finding & Guidance
  {
    intent: 'FIND_EXIT',
    patterns: [
      /\b(where is|locate|find|show me|how to reach|guide me to)\s+(the\s+)?(exit|emergency exit|way out)\b/i,
      /\b(exit|way out)\s+(enga|engae|where|evide)\b/i,
      /\bexit\s+enga\s+irukku\b/i,
      /\b(வெளியேறும்\s*வழி\s*எங்கே|வெளியேறும்\s*கதவு|எக்ஸிட்\s*எங்கே)\b/i,
      /\b(బయటికి\s*వెళ్లే\s*మార్గం\s*ఎక్కడ|ఎగ్జిట్\s*ఎక్కడ|నిష్క్రమణ\s*ద్వారం\s*ఎక్కడ)\b/i,
      /\b(निकास\s*कहाँ\s*है|बाहर\s*जाने\s*का\s*रास्ता)\b/i,
      /\bwhere\s+is\s+the\s+exit\b/i,
    ],
    targetObject: 'exit',
    requiresCamera: true,
  },

  // 4. Door Finding
  {
    intent: 'FIND_DOOR',
    patterns: [
      /\b(where is|locate|find|show me)\s+(the\s+)?(door|doorway|entrance|gate)\b/i,
      /\b(door|doorway|kadhavu)\s+(enga|where)\b/i,
      /\bdoor\s+enga\b/i,
      /\b(கதவு\s*எங்கே|நுழைவாயில்\s*எங்கே)\b/i,
      /\b(తలుపు\s*ఎక్కడ|ద్వారం\s*ఎక్కడ|ప్రవేశ\s*ద్వారం\s*ఎక్కడ)\b/i,
      /\b(दरवाजा\s*कहाँ\s*है)\b/i,
    ],
    targetObject: 'door',
    requiresCamera: true,
  },

  // 5. Path Clearance
  {
    intent: 'CHECK_PATH_CLEAR',
    patterns: [
      /\b(is\s+the\s+path\s+clear|is\s+it\s+safe\s+to\s+walk|can\s+i\s+walk|can\s+i\s+go|is\s+it\s+clear)\b/i,
      /\b(path\s+clear|pathway\s+clear|route\s+clear)\b/i,
      /\b(vali\s+clear-a|path\s+clear-a|pogalama)\b/i,
      /\b(பாதை\s*தெளிவாக\s*உள்ளதா|நான்\s*முன்னேறிச்\s*செல்லலாமா)\b/i,
      /\b(మార్గం\s*స్పష్టంగా\s*ఉందా|నేను\s*ముందుకు\s*వెళ్లవచ్చా)\b/i,
      /\b(क्या\s*रास्ता\s*साफ\s*है|क्या\s*मैं\s*आगे\s*बढ़\s*सकता\s*हूँ)\b/i,
    ],
    requiresCamera: true,
  },

  // 6. Obstacle Checking
  {
    intent: 'CHECK_OBSTACLES',
    patterns: [
      /\b(is there anything|are there any obstacles|what is in front|what is ahead|any obstacle|anything blocking)\b/i,
      /\b(en\s+munnadi\s+obstacle\s+irukka|obstacle\s+irukka|munnadi\s+enna\s+irukku)\b/i,
      /\b(முன்னால்\s*ஏதேனும்\s*தடை\s*உள்ளதா|முன்னால்\s*என்ன\s*உள்ளது)\b/i,
      /\b(ముందు\s*ఏదైనా\s*అడ్డంకి\s*ఉందా|నా\s*ముందు\s*ఏముంది)\b/i,
      /\b(क्या\s*आगे\s*कोई\s*बाधा\s*है|सामने\s*क्या\s*है)\b/i,
      /\bis\s+anything\s+blocking\s+my\s+path\b/i,
    ],
    requiresCamera: true,
  },

  // 7. Directional Queries
  {
    intent: 'CHECK_DIRECTION',
    patterns: [
      /\b(what is on my left|what is to the left|what's on my left|look left|left side)\b/i,
      /\b(enakku\s+left\s+side-la\s+enna\s+irukku|left-la\s+enna\s+irukku)\b/i,
      /\b(இடதுபுறம்\s*என்ன\s*உள்ளது|இடப்பக்கம்\s*பார்)\b/i,
      /\b(నా\s*ఎడమ\s*వైపున\s*ఏముంది|ఎడమ\s*వైపు\s*చూడు)\b/i,
      /\b(बाईं\s*ओर\s*क्या\s*है)\b/i,
    ],
    targetDirection: 'left',
    requiresCamera: true,
  },
  {
    intent: 'CHECK_DIRECTION',
    patterns: [
      /\b(what is on my right|what is to the right|what's on my right|look right|right side)\b/i,
      /\b(enakku\s+right\s+side-la\s+enna\s+irukku|right-la\s+enna\s+irukku)\b/i,
      /\b(வலதுபுறம்\s*என்ன\s*உள்ளது|வலப்பக்கம்\s*பார்)\b/i,
      /\b(నా\s*కుడి\s*వైపున\s*ఏముంది|కుడి\s*వైపు\s*చూడు)\b/i,
      /\b(दाईं\s*ओर\s*क्या\s*है)\b/i,
    ],
    targetDirection: 'right',
    requiresCamera: true,
  },

  // 8. Distance Queries (Conversational Referencing)
  {
    intent: 'DISTANCE_QUERY',
    patterns: [
      /\b(how far is it|how far|what is the distance|how many meters|how far is the obstacle|how far is the door|how far is the exit)\b/i,
      /\b(evvalavu\s+thooram|thooram\s+enna|distance\s+evlo)\b/i,
      /\b(எவ்வளவு\s*தொலைவு|எவ்வளவு\s*தூரம்)\b/i,
      /\b(ఎంత\s*దూరం|దూరం\s*ఎంత)\b/i,
      /\b(कितनी\s*दूरी\s*पर\s*है|दूरी\s*कितनी\s*है)\b/i,
    ],
    requiresCamera: true,
  },

  // 9. Describe Surroundings
  {
    intent: 'DESCRIBE_SURROUNDINGS',
    patterns: [
      /\b(describe\s+(my\s+)?surroundings|what\s+do\s+you\s+see|tell\s+me\s+what\s+you\s+see|look\s+around|describe\s+scene)\b/i,
      /\b(suththi\s+enna\s+irukku|surroundings\s+solla|scene\s+describe\s+pannunga)\b/i,
      /\b(சுற்றுப்புறத்தை\s*விவரி|சுற்றிலும்\s*என்ன\s*காண்கிறாய்)\b/i,
      /\b(పరిసరాలను\s*వివరించండి|చుట్టూ\s*ఏం\s*కనిపిస్తోంది)\b/i,
      /\b(आसपास\s*का\s*वर्णन\s*करें|चारों\s*तरफ\s*क्या\s*है)\b/i,
    ],
    requiresCamera: true,
  },

  // 10. Repeat Speech
  {
    intent: 'REPEAT',
    patterns: [
      /\b(repeat that|say that again|repeat|marupadiyum sollunga|thirumba sollunga)\b/i,
      /\b(மீண்டும்\s*சொல்|மறுபடியும்\s*கூறு)\b/i,
      /\b(మళ్లీ\s*చెప్పండి|మరోసారి\s*చెప్పు)\b/i,
      /\b(फिर\s*से\s*बताएं|दोहराएं)\b/i,
    ],
    requiresCamera: false,
  },

  // 11. Emergency Activation
  {
    intent: 'EMERGENCY',
    patterns: [
      /\b(emergency|help me|send sos|call emergency contact|i need help|urgent help|danger)\b/i,
      /thunai[,\s]+.*(i need help|help me|emergency|sos)/i,
      /\b(sos|call 112|emergency alert|activate sos)\b/i,
      /(உதவி\s*செய்|ஆபத்து|அவசரம்|காப்பாத்துங்க|எமர்ஜென்சி)/i,
      /(సహాయం\s*చేయండి|ఆపద|అత్యవసరం|కాపాడండి|ఎమర్జెన్సీ)/i,
      /(मदद\s*चाहिए|आपातकाल|बचाओ|मदद\s*करो)/i,
    ],
    requiresCamera: false,
  },

  // 12. Cancel SOS / Safe State
  {
    intent: 'CANCEL_SOS',
    patterns: [
      /\b(cancel sos|cancel emergency|i'?m safe|stop emergency alert|stop sos|i am safe|false alarm|safe now)\b/i,
      /(அவசரத்தை\s*ரத்து\s*செய்|ரத்து\s*செய்|நான்\s*பாதுகாப்பாக\s*இருக்கிறேன்)/i,
      /(రద్దు\s*చేయి|నేను\s*సురక్షితంగా\s*ఉన్నాను)/i,
      /(आपातकाल\s*रद्द\s*करें|रद्द\s*करें|मैं\s*सुरक्षित\s*हूँ)/i,
    ],
    requiresCamera: false,
  },

  // 13. Confirm Cancel SOS
  {
    intent: 'CONFIRM_CANCEL_SOS',
    patterns: [
      /\b(confirm cancel|confirm cancellation|yes cancel|yes i am safe|confirm safe|yes confirm)\b/i,
      /(ஆம்\s*ரத்து\s*செய்|உறுதிப்படுத்து|ஆம்\s*பாதுகாப்பாக\s*உள்ளேன்)/i,
      /(అవును\s*రద్దు\s*చేయి|ధృవీకరించు|నేను\s*సురక్షితం)/i,
      /(हाँ\s*रद्द\s*करें|पुष्टि\s*करें|हाँ\s*सुरक्षित\s*हूँ)/i,
    ],
    requiresCamera: false,
  },

  // 14. Greeting
  {
    intent: 'GREETING',
    patterns: [
      /\b(hello|hi|namaste|vanakkam|good morning|good afternoon|good evening|hey thunai|thunai)\b/i,
      /\b(வணக்கம்|நமஸ்தே)\b/i,
      /\b(నమస్కారం|నమస్తే)\b/i,
      /\b(नमस्ते|प्रणाम)\b/i,
    ],
    requiresCamera: false,
  },
];

export class VoiceIntentEngine {
  classify(text: string, contextTarget?: string): ClassifiedVoiceIntent {
    const raw = (text || '').trim();
    const lower = raw.toLowerCase();

    // Detect language
    const lang = this.detectLanguage(raw);

    // Scan patterns
    for (const item of INTENT_PATTERNS) {
      for (const pattern of item.patterns) {
        if (pattern.test(lower) || pattern.test(raw)) {
          let target = item.targetObject;
          if (!target && item.intent === 'DISTANCE_QUERY') {
            if (lower.includes('door') || lower.includes('கதவு') || lower.includes('తలుపు') || lower.includes('दरवाजा')) {
              target = 'door';
            } else if (lower.includes('exit') || lower.includes('வெளியேறும்') || lower.includes('నిష్క్రమణ') || lower.includes('బయటికి')) {
              target = 'exit';
            } else if (lower.includes('obstacle') || lower.includes('தடை') || lower.includes('అడ్డంకి')) {
              target = 'obstacle';
            } else {
              target = contextTarget || 'nearest_object';
            }
          }

          return {
            intent: item.intent,
            confidence: 0.95,
            originalText: raw,
            normalizedText: lower,
            targetObject: target,
            targetDirection: item.targetDirection,
            language: lang,
            isVisualCommand: item.requiresCamera,
            requiresCamera: item.requiresCamera,
          };
        }
      }
    }

    // Fallback: general query
    const isVisual = lower.includes('see') || lower.includes('look') || lower.includes('ahead') || lower.includes('front');
    return {
      intent: 'GENERAL_QUERY',
      confidence: 0.70,
      originalText: raw,
      normalizedText: lower,
      targetObject: contextTarget,
      language: lang,
      isVisualCommand: isVisual,
      requiresCamera: isVisual,
    };
  }

  private detectLanguage(text: string): 'en' | 'ta' | 'te' | 'hi' {
    // Check Tamil unicode range 0B80-0BFF
    if (/[\u0B80-\u0BFF]/.test(text)) return 'ta';
    // Check Telugu unicode range 0C00-0C7F
    if (/[\u0C00-\u0C7F]/.test(text)) return 'te';
    // Check Devanagari unicode range 0900-097F
    if (/[\u0900-\u097F]/.test(text)) return 'hi';
    // Check Tanglish indicators
    const lower = text.toLowerCase();
    if (
      lower.includes('enga') ||
      lower.includes('pannunga') ||
      lower.includes('irukku') ||
      lower.includes('munnadi') ||
      lower.includes('enakku') ||
      lower.includes('sollunga') ||
      lower.includes('kaapathunga')
    ) {
      return 'ta';
    }
    return 'en';
  }
}

export const voiceIntentEngine = new VoiceIntentEngine();
