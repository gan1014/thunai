import type { LanguageCode, RiskLevel } from '../src/types.ts';

export const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  en: {
    // Navigation
    'nav_ahead': 'The {object} is {distance} meters directly ahead.',
    'nav_left': 'The {object} is {distance} meters to your left.',
    'nav_right': 'The {object} is {distance} meters to your right.',
    'nav_proceed_carefully': 'Please proceed forward with caution.',
    'nav_turn_left': 'Turn left toward the open pathway.',
    'nav_turn_right': 'Turn right toward the destination.',
    'nav_clear_path': 'Path ahead is clear for approximately {distance} meters.',
    'nav_obstacle_ahead': 'Obstacle detected {distance} meters ahead. Step aside to avoid collision.',
    'nav_stairs_descending': 'Caution: Descending flight of stairs {distance} meters ahead.',
    'nav_door_exit': 'Exit doorway located {distance} meters to your {direction}.',

    // Safety & Warnings
    'risk_critical': 'CRITICAL ALERT: Immediate hazard ahead! Stop now.',
    'risk_high': 'HIGH RISK WARNING: {object} detected {distance} meters away. Take caution.',
    'risk_medium': 'Advisory: {object} is in your vicinity ({distance} meters).',
    'risk_low': 'Environment is relatively safe. Minor obstacles noted.',
    'risk_vehicle_moving': 'Vehicle moving across your crossing path. Wait for traffic to stop.',
    'risk_traffic_red': 'Pedestrian signal is RED. Do not cross the street.',
    'risk_traffic_green': 'Pedestrian signal is GREEN. Safe to cross within the crosswalk.',
    'risk_uneven_floor': 'Caution: Surface gradient or step detected immediately ahead.',

    // OCR & Reading
    'ocr_medicine_title': 'Prescription Medication Label: {medicine}.',
    'ocr_medicine_warning': 'Safety Warning: Take as directed. Store away from excessive heat and children.',
    'ocr_sign_exit': 'Emergency Exit sign detected overhead.',
    'ocr_sign_reception': 'Registration and Reception Desk straight ahead.',
    'ocr_bus_route': 'Transit Notice: Bus route {route} arriving at platform.',
    'ocr_price_tag': 'Price indicated: {price}.',
    'ocr_generic_read': 'Text reads: {text}',

    // Identification & Objects
    'id_scene_overview': 'I observe {count} key elements in the current scene: {objects}.',
    'id_person_approaching': 'A person is approaching from {direction}, roughly {distance} meters away.',
    'id_seating_available': 'Empty chair and table detected {distance} meters ahead.',
    'id_handrail_available': 'Support handrail is available along the {direction} wall.',

    // Uncertainty
    'uncertain_detection': 'I may have detected {object} ahead, but visibility is low. Please proceed slowly.',
    'uncertain_general': 'Low confidence reading. Confirming surroundings...',

    // General & Interaction
    'greeting': 'SAHAY-X is online and monitoring your surroundings. How can I assist you?',
    'help_acknowledged': 'Help signal recognized. Immediate assistance routine activated.',
    'agree_acknowledged': 'Understood. Continuing current guidance.',
    'disagree_acknowledged': 'Action cancelled. Awaiting your instruction.',
    'stop_acknowledged': 'Stopped. Standing by in safe hold position.'
  },

  ta: {
    // Navigation
    'nav_ahead': '{object} உங்களுக்கு நேரே {distance} மீட்டர் தொலைவில் உள்ளது.',
    'nav_left': '{object} உங்கள் இடதுபுறத்தில் {distance} மீட்டர் தொலைவில் உள்ளது.',
    'nav_right': '{object} உங்கள் வலதுபுறத்தில் {distance} மீட்டர் தொலைவில் உள்ளது.',
    'nav_proceed_carefully': 'எச்சரிக்கையுடன் மெதுவாக முன்னே செல்லவும்.',
    'nav_turn_left': 'இடதுபுறம் திரும்பி திறந்த வழியில் செல்லவும்.',
    'nav_turn_right': 'வலதுபுறம் திரும்பி உங்கள் இலக்கை நோக்கி செல்லவும்.',
    'nav_clear_path': 'முன்னே உள்ள பாதை சுமார் {distance} மீட்டர் வரை தெளிவாக உள்ளது.',
    'nav_obstacle_ahead': 'முன்னே {distance} மீட்டரில் தடை உள்ளது. மோதலை தவிர்க்க விலகி நடக்கவும்.',
    'nav_stairs_descending': 'எச்சரிக்கை: கீழே இறங்கும் படிக்கட்டுகள் முன்னே {distance} மீட்டரில் உள்ளன.',
    'nav_door_exit': 'வெளியேறும் கதவு உங்கள் {direction} பக்கத்தில் {distance} மீட்டரில் உள்ளது.',

    // Safety & Warnings
    'risk_critical': 'அவசர எச்சரிக்கை: முன்னே உடனடி ஆபத்து! உடனே நில்லுங்கள்.',
    'risk_high': 'உயர் ஆபத்து எச்சரிக்கை: {object} {distance} மீட்டரில் கண்டறியப்பட்டது. ஜாக்கிரதையாக இருக்கவும்.',
    'risk_medium': 'அறிவுறுத்தல்: உங்கள் அருகில் {object} உள்ளது ({distance} மீட்டர்).',
    'risk_low': 'சுற்றுச்சூழல் பாதுகாப்பாக உள்ளது. சிறிய தடைகள் மட்டுமே உள்ளன.',
    'risk_vehicle_moving': 'வாகனம் உங்கள் பாதையில் நகர்கிறது. வாகனம் நிற்கும் வரை காத்திருக்கவும்.',
    'risk_traffic_red': 'பாதசாரி சிக்னல் சிவப்பு நிறத்தில் உள்ளது. சாலையைக் கடக்க வேண்டாம்.',
    'risk_traffic_green': 'பாதசாரி சிக்னல் பச்சை நிறமாக மாறியுள்ளது. இப்போது சாலையைக் கடக்கலாம்.',
    'risk_uneven_floor': 'எச்சரிக்கை: சமமற்ற தரை அல்லது படிக்கட்டு முன்னே உள்ளது.',

    // OCR & Reading
    'ocr_medicine_title': 'மருந்துச் சீட்டு லேபிள்: {medicine}.',
    'ocr_medicine_warning': 'பாதுகாப்பு எச்சரிக்கை: மருத்துவர் பரிந்துரைத்தபடி மட்டுமே உட்கொள்ளவும்.',
    'ocr_sign_exit': 'அவசர வழிக்கான பலகை மேலே கண்டறியப்பட்டது.',
    'ocr_sign_reception': 'வரவேற்பு மற்றும் பதிவு மையம் நேரே உள்ளது.',
    'ocr_bus_route': 'பேருந்து எண் {route} இந்த நடைமேடைக்கு வருகிறது.',
    'ocr_price_tag': 'குறிப்பிடப்பட்ட விலை: {price}.',
    'ocr_generic_read': 'எழுதப்பட்ட உரை: {text}',

    // Identification & Objects
    'id_scene_overview': 'தற்போதைய பகுதியில் {count} முக்கிய பொருட்கள் உள்ளன: {objects}.',
    'id_person_approaching': 'ஒரு நபர் {direction} பக்கத்திலிருந்து சுமார் {distance} மீட்டரில் வருகிறார்.',
    'id_seating_available': 'காலியான இருக்கை மற்றும் மேசை முன்னே {distance} மீட்டரில் உள்ளன.',
    'id_handrail_available': 'ஆதரவு கைப்பிடி {direction} பக்க சுவரில் உள்ளது.',

    // Uncertainty
    'uncertain_detection': 'முன்னே {object} இருக்கலாம், ஆனால் தெளிவு குறைவாக உள்ளது. மெதுவாக செல்லவும்.',
    'uncertain_general': 'குறைந்த தெளிவு. சூழலை மீண்டும் உறுதி செய்கிறது...',

    // General & Interaction
    'greeting': 'சகாய்-எக்ஸ் (SAHAY-X) தயாராக உள்ளது. நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?',
    'help_acknowledged': 'உதவி சைகை அங்கீகரிக்கப்பட்டது. அவசர உதவி முறை செயல்படுத்தப்பட்டுள்ளது.',
    'agree_acknowledged': 'புரிந்து கொள்ளப்பட்டது. வழிகாட்டுதல் தொடர்கிறது.',
    'disagree_acknowledged': 'செயல் ரத்து செய்யப்பட்டது. உங்கள் கட்டளைக்காக காத்திருக்கிறது.',
    'stop_acknowledged': 'நிறுத்தப்பட்டது. பாதுகாப்பான நிலையில் நிற்கிறது.'
  },

  hi: {
    // Navigation
    'nav_ahead': '{object} आपके ठीक सामने {distance} मीटर की दूरी पर है।',
    'nav_left': '{object} आपके बाईं ओर {distance} मीटर की दूरी पर है।',
    'nav_right': '{object} आपके दाईं ओर {distance} मीटर की दूरी पर है।',
    'nav_proceed_carefully': 'कृपया सावधानी से आगे बढ़ें।',
    'nav_turn_left': 'बाईं ओर मुड़ें और खुले रास्ते की ओर बढ़ें।',
    'nav_turn_right': 'दाईं ओर मुड़ें और गंतव्य की ओर बढ़ें।',
    'nav_clear_path': 'आगे का रास्ता लगभग {distance} मीटर तक साफ है।',
    'nav_obstacle_ahead': 'आगे {distance} मीटर पर रुकावट है। टकराने से बचने के लिए बगल से निकलें।',
    'nav_stairs_descending': 'सावधान: आगे {distance} मीटर पर नीचे उतरने वाली सीढ़ियां हैं।',
    'nav_door_exit': 'निकास द्वार आपके {direction} ओर {distance} मीटर पर है।',

    // Safety & Warnings
    'risk_critical': 'गंभीर चेतावनी: आगे तत्काल खतरा! तुरंत रुकें।',
    'risk_high': 'उच्च जोखिम चेतावनी: {object} {distance} मीटर की दूरी पर है। सतर्क रहें।',
    'risk_medium': 'सलाह: आपके समीप {object} स्थित है ({distance} मीटर)।',
    'risk_low': 'आसपास का वातावरण सुरक्षित है। केवल छोटी बाधाएं हैं।',
    'risk_vehicle_moving': 'वाहन आपके रास्ते में आ रहा है। ट्रैफिक रुकने की प्रतीक्षा करें।',
    'risk_traffic_red': 'पैदल यात्री सिग्नल लाल है। सड़क पार न करें।',
    'risk_traffic_green': 'पैदल यात्री सिग्नल हरा है। जेब्रा क्रॉसिंग से सुरक्षित पार करें।',
    'risk_uneven_floor': 'सावधानी: आगे असमान फर्श या सीढ़ी का कदम है।',

    // OCR & Reading
    'ocr_medicine_title': 'दवा की पर्ची का लेबल: {medicine}।',
    'ocr_medicine_warning': 'सुरक्षा चेतावनी: निर्देशानुसार लें। बच्चों की पहुंच से दूर रखें।',
    'ocr_sign_exit': 'आपातकालीन निकास बोर्ड ऊपर दिखाई दे रहा है।',
    'ocr_sign_reception': 'पंजीकरण एवं स्वागत काउंटर ठीक सामने है।',
    'ocr_bus_route': 'यातायात सूचना: बस संख्या {route} प्लेटफॉर्म पर आ रही है।',
    'ocr_price_tag': 'मूल्य अंकित है: {price}।',
    'ocr_generic_read': 'पढ़ा गया पाठ: {text}',

    // Identification & Objects
    'id_scene_overview': 'वर्तमान दृश्य में {count} प्रमुख वस्तुएं हैं: {objects}।',
    'id_person_approaching': 'एक व्यक्ति {direction} ओर से लगभग {distance} मीटर की दूरी पर आ रहा है।',
    'id_seating_available': 'खाली कुर्सी और मेज आगे {distance} मीटर पर उपलब्ध है।',
    'id_handrail_available': 'सहारा रेलिंग {direction} दीवार के सहारे उपलब्ध है।',

    // Uncertainty
    'uncertain_detection': 'संभवतः आगे {object} है, किंतु दृश्यता कम है। कृपया धीरे चलें।',
    'uncertain_general': 'कम स्पष्टता। आसपास की स्थिति जांची जा रही है...',

    // General & Interaction
    'greeting': 'सहाय-एक्स (SAHAY-X) तैयार है। मैं आपकी क्या सहायता कर सकता हूँ?',
    'help_acknowledged': 'मदद का संकेत मिला। तत्काल सहायता मोड सक्रिय कर दिया गया है।',
    'agree_acknowledged': 'समझ गया। मार्गदर्शन जारी है।',
    'disagree_acknowledged': 'कार्य रद्द किया गया। आपके निर्देश की प्रतीक्षा है।',
    'stop_acknowledged': 'रुक गया। सुरक्षित स्थिति में विराम लिया गया है।'
  },

  te: {
    // Navigation (Telugu)
    'nav_ahead': '{object} మీకు నేరుగా ముందు {distance} మీటర్ల దూరంలో ఉంది.',
    'nav_left': '{object} మీ ఎడమవైపున {distance} మీటర్లలో ఉంది.',
    'nav_right': '{object} మీ కుడివైపున {distance} మీటర్లలో ఉంది.',
    'nav_proceed_carefully': 'దయచేసి జాగ్రత్తగా ముందుకు సాగండి.',
    'nav_turn_left': 'ఎడమవైపునకు తిరిగి మార్గంలో వెళ్ళండి.',
    'nav_turn_right': 'కుడివైపునకు తిరగండి.',
    'nav_clear_path': 'ముందున్న మార్గం సుమారు {distance} మీటర్ల వరకు స్పష్టంగా ఉంది.',
    'nav_obstacle_ahead': 'ముందు {distance} మీటర్లలో అడ్డంకి ఉంది. ఢీకొనకుండా పక్కకు జరగండి.',
    'nav_stairs_descending': 'హెచ్చరిక: దిగువ మెట్లు ముందు {distance} మీటర్లలో ఉన్నాయి.',
    'nav_door_exit': 'నిష్క్రమణ ద్వారం మీ {direction} వైపు {distance} మీటర్లలో ఉంది.',
    'risk_critical': 'అత్యవసర హెచ్చరిక: తక్షణ ప్రమాదం! ఇప్పుడే ఆగండి.',
    'risk_high': 'అధిక ప్రమాదం: {object} {distance} మీటర్లలో ఉంది. జాగ్రత్త.',
    'risk_medium': 'సమాచారం: మీ పరిసరాల్లో {object} ఉంది ({distance} మీటర్లు).',
    'risk_low': 'పరిసరాలు సురక్షితంగా ఉన్నాయి. చిన్న అడ్డంకులు మాత్రమే.',
    'risk_vehicle_moving': 'వాహనం మీ మార్గంలో కదులుతోంది. ఆగేవరకు వేచి ఉండండి.',
    'risk_traffic_red': 'సిగ్నల్ ఎరుపు రంగులో ఉంది. రోడ్డు దాటవద్దు.',
    'risk_traffic_green': 'సిగ్నల్ ఆకుపచ్చగా ఉంది. ఇప్పుడు రోడ్డు దాటవచ్చు.',
    'risk_uneven_floor': 'హెచ్చరిక: గతుకుల నేల లేదా మెట్టు ముందు ఉంది.',
    'ocr_medicine_title': 'మందుల చీటీ వివరాలు: {medicine}.',
    'ocr_medicine_warning': 'జాగ్రత్త: వైద్యులు సూచించిన విధంగా మాత్రమే వాడండి.',
    'ocr_sign_exit': 'ఎమర్జెన్సీ ఎగ్జిట్ బోర్డు పైన ఉంది.',
    'ocr_sign_reception': 'రిసెప్షన్ డెస్క్ నేరుగా ముందు ఉంది.',
    'ocr_bus_route': 'బస్సు రూట్ {route} ప్లాట్‌ఫారమ్‌కు వస్తోంది.',
    'ocr_price_tag': 'ధర: {price}.',
    'ocr_generic_read': 'చదివిన టెక్స్ట్: {text}',
    'id_scene_overview': 'పరిసరాల్లో {count} ముఖ్యమైన అంశాలు ఉన్నాయి: {objects}.',
    'id_person_approaching': 'ఒక వ్యక్తి {direction} నుండి సుమారు {distance} మీటర్ల దూరంలో వస్తున్నారు.',
    'id_seating_available': 'ఖాళీ కుర్చీ మరియు బల్ల {distance} మీటర్ల దూరంలో ఉంది.',
    'id_handrail_available': 'ఆధార హ్యాండ్‌రైల్ {direction} గోడకు ఉంది.',
    'uncertain_detection': 'ముందు {object} ఉండే అవకాశం ఉంది, నెమ్మదిగా వెళ్ళండి.',
    'uncertain_general': 'పరిసరాలను నిర్ధారిస్తోంది...',
    'greeting': 'సహాయ్-ఎక్స్ (SAHAY-X) సిద్ధంగా ఉంది. నేను మీకు ఎలా సహాయపడగలను?',
    'help_acknowledged': 'సహాయ సంకేతం అందింది. అత్యవసర మోడ్ ప్రారంభించబడింది.',
    'agree_acknowledged': 'అర్థమైంది. కొనసాగుతోంది.',
    'disagree_acknowledged': 'రద్దు చేయబడింది.',
    'stop_acknowledged': 'ఆగిపోయింది. సురక్షిత స్థితిలో ఉంది.'
  },

  bn: {
    // Navigation (Bengali)
    'nav_ahead': '{object} আপনার সোজা সামনে {distance} মিটার দূরে রয়েছে।',
    'nav_left': '{object} আপনার বাঁদিকে {distance} মিটার দূরে রয়েছে।',
    'nav_right': '{object} আপনার ডানদিকে {distance} মিটার দূরে রয়েছে।',
    'nav_proceed_carefully': 'অনুগ্রহ করে সাবধানে এগিয়ে যান।',
    'nav_turn_left': 'বাঁদিকে ঘুরে খোলা পথে চলুন।',
    'nav_turn_right': 'ডানদিকে ঘুরুন।',
    'nav_clear_path': 'সামনের পথ প্রায় {distance} মিটার পর্যন্ত পরিষ্কার।',
    'nav_obstacle_ahead': 'সামনে {distance} মিটারে বাধা রয়েছে। ধাক্কা এড়াতে পাশে সরুন।',
    'nav_stairs_descending': 'সতর্কতা: নিচের দিকে নামার সিঁড়ি সামনে {distance} মিটারে রয়েছে।',
    'nav_door_exit': 'প্রস্থান দরজা আপনার {direction} পাশে {distance} মিটারে রয়েছে।',
    'risk_critical': 'জরুরি সতর্কতা: সামনে তাৎক্ষণিক বিপদ! এখনই থামুন।',
    'risk_high': 'উচ্চ ঝুঁকি সতর্কতা: {object} {distance} মিটারে শনাক্ত হয়েছে। সাবধান।',
    'risk_medium': 'পরামর্শ: আশেপাশে {object} রয়েছে ({distance} মিটার)।',
    'risk_low': 'পরিবেশ সুরক্ষিত রয়েছে।',
    'risk_vehicle_moving': 'গাড়ি আপনার পথ অতিক্রম করছে। থামার অপেক্ষা করুন।',
    'risk_traffic_red': 'পথচারী সংকেত লাল। রাস্তা পার হবেন না।',
    'risk_traffic_green': 'পথচারী সংকেত সবুজ। রাস্তা পার হওয়া নিরাপদ।',
    'risk_uneven_floor': 'সতর্কতা: অসমান মেঝে বা ধাপ সামনে রয়েছে।',
    'ocr_medicine_title': 'প্রেসক্রিপশন ওষুধের লেবেল: {medicine}।',
    'ocr_medicine_warning': 'নিরাপত্তা সতর্কতা: চিকিৎসকের নির্দেশ মতো সেবন করুন।',
    'ocr_sign_exit': 'জরুরি প্রস্থান সাইন উপরে দেখা যাচ্ছে।',
    'ocr_sign_reception': 'অভ্যর্থনা কেন্দ্র সোজা সামনে।',
    'ocr_bus_route': 'বাস নম্বর {route} প্ল্যাটফর্মে আসছে।',
    'ocr_price_tag': 'মূল্য: {price}।',
    'ocr_generic_read': 'পঠিত পাঠ্য: {text}',
    'id_scene_overview': 'বর্তমান দৃশ্যে {count}টি গুরুত্বপূর্ণ উপাদান রয়েছে: {objects}।',
    'id_person_approaching': 'একজন ব্যক্তি {direction} দিক থেকে প্রায় {distance} মিটারে আসছেন।',
    'id_seating_available': 'খালি চেয়ার ও টেবিল {distance} মিটার সামনে উপলব্ধ।',
    'id_handrail_available': 'হ্যান্ডরেল {direction} দেয়ালে উপলব্ধ।',
    'uncertain_detection': 'সামনে {object} থাকতে পারে, ধীরে চলুন।',
    'uncertain_general': 'চারপাশ নিশ্চিত করা হচ্ছে...',
    'greeting': 'সহায়-এক্স (SAHAY-X) প্রস্তুত। আমি আপনাকে কীভাবে সাহায্য করতে পারি?',
    'help_acknowledged': 'সাহায্যের সংকেত পাওয়া গেছে। জরুরি সহায়তা সক্রিয়।',
    'agree_acknowledged': 'বোঝা গেছে। অব্যাহত রয়েছে।',
    'disagree_acknowledged': 'বাতিল করা হয়েছে।',
    'stop_acknowledged': 'থামানো হয়েছে।'
  },

  mr: {
    // Navigation (Marathi)
    'nav_ahead': '{object} आपल्या सरळ समोर {distance} मीटर अंतरावर आहे.',
    'nav_left': '{object} आपल्या डावीकडे {distance} मीटर अंतरावर आहे.',
    'nav_right': '{object} आपल्या उजवीकडे {distance} मीटर अंतरावर आहे.',
    'nav_proceed_carefully': 'कृपया सावधपणे पुढे जा.',
    'nav_turn_left': 'डावीकडे वळा आणि मोकळ्या मार्गाने जा.',
    'nav_turn_right': 'उजवीकडे वळा.',
    'nav_clear_path': 'पुढील मार्ग सुमारे {distance} मीटरपर्यंत मोकळा आहे.',
    'nav_obstacle_ahead': 'समोर {distance} मीटरवर अडथळा आहे. बाजूला व्हा.',
    'nav_stairs_descending': 'सावधान: खाली उतरणारे जिने पुढे {distance} मीटरवर आहेत.',
    'nav_door_exit': 'बाहेर पडण्याचे दार आपल्या {direction} बाजूला {distance} मीटरवर आहे.',
    'risk_critical': 'तातडीचा इशारा: समोर थेट धोका! त्वरित थांबा.',
    'risk_high': 'उच्च धोका इशारा: {object} {distance} मीटरवर आढळले. काळजी घ्या.',
    'risk_medium': 'सूचना: जवळ {object} आहे ({distance} मीटर).',
    'risk_low': 'परिसर सुरक्षित आहे.',
    'risk_vehicle_moving': 'वाहन आपल्या मार्गातून जात आहे. वाहन थांबेपर्यंत प्रतीक्षा करा.',
    'risk_traffic_red': 'पादचारी सिग्नल लाल आहे. रस्ता ओलांडू नका.',
    'risk_traffic_green': 'पादचारी सिग्नल हिरवा आहे. रस्ता ओलांडणे सुरक्षित आहे.',
    'risk_uneven_floor': 'सावधान: खाचखळगे किंवा पायरी पुढे आहे.',
    'ocr_medicine_title': 'औषध लेबल: {medicine}.',
    'ocr_medicine_warning': 'सावधानता: डॉक्टरांच्या सल्ल्यानुसारच औषध घ्या.',
    'ocr_sign_exit': 'आपत्कालीन बाहेर पडण्याचा फलक वर दिसत आहे.',
    'ocr_sign_reception': 'स्वागत कक्ष थेट समोर आहे.',
    'ocr_bus_route': 'बस मार्ग {route} प्लॅटफॉर्मवर येत आहे.',
    'ocr_price_tag': 'किंमत: {price}.',
    'ocr_generic_read': 'वाचलेला मजकूर: {text}',
    'id_scene_overview': 'सध्याच्या दृश्यात {count} घटक आहेत: {objects}.',
    'id_person_approaching': 'एक व्यक्ती {direction} बाजून सुमारे {distance} मीटर अंतरावर येत आहे.',
    'id_seating_available': 'रिकामी खुर्ची आणि टेबल {distance} मीटरवर उपलब्ध आहे.',
    'id_handrail_available': 'हँडरेल {direction} भिंतीवर उपलब्ध आहे.',
    'uncertain_detection': 'पुढे {object} असू शकते, कृपया हळू चाला.',
    'uncertain_general': 'परिसराची तपासणी केली जात आहे...',
    'greeting': 'सहाय-एक्स (SAHAY-X) तयार आहे. मी आपल्याला कशी मदत करू शकतो?',
    'help_acknowledged': 'मदतीचा संकेत मिळाला. तातडीची मदत सुरू करण्यात आली आहे.',
    'agree_acknowledged': 'समजले. पुढे चालू आहे.',
    'disagree_acknowledged': 'रद्द केले.',
    'stop_acknowledged': 'थांबवले. सुरक्षित स्थितीत आहे.'
  },

  kn: {
    // Navigation (Kannada)
    'nav_ahead': '{object} ನಿಮ್ಮ ನೇರ ಮುಂದೆ {distance} ಮೀಟರ್ ದೂರದಲ್ಲಿದೆ.',
    'nav_left': '{object} ನಿಮ್ಮ ಎಡಭಾಗದಲ್ಲಿ {distance} ಮೀಟರ್ ದೂರದಲ್ಲಿದೆ.',
    'nav_right': '{object} ನಿಮ್ಮ ಬಲಭಾಗದಲ್ಲಿ {distance} ಮೀಟರ್ ದೂರದಲ್ಲಿದೆ.',
    'nav_proceed_carefully': 'ದಯವಿಟ್ಟು ಎಚ್ಚರಿಕೆಯಿಂದ ಮುನ್ನಡೆಯಿರಿ.',
    'nav_turn_left': 'ಎಡಕ್ಕೆ ತಿರುಗಿ ಮುಕ್ತ ಹಾದಿಯಲ್ಲಿ ಸಾಗಿ.',
    'nav_turn_right': 'ಬಲಕ್ಕೆ ತಿರುಗಿ.',
    'nav_clear_path': 'ಮುಂದಿನ ದಾರಿ ಸುಮಾರು {distance} ಮೀಟರ್ ವರೆಗೆ ಸ್ಪಷ್ಟವಾಗಿದೆ.',
    'nav_obstacle_ahead': 'ಮುಂದೆ {distance} ಮೀಟರ್‌ನಲ್ಲಿ ಅಡಚಣೆಯಿದೆ. ಪಕ್ಕಕ್ಕೆ ಸರಿಯಿರಿ.',
    'nav_stairs_descending': 'ಎಚ್ಚರಿಕೆ: ಕೆಳಗಿಳಿಯುವ ಮೆಟ್ಟಿಲುಗಳು ಮುಂದೆ {distance} ಮೀಟರ್‌ನಲ್ಲಿವೆ.',
    'nav_door_exit': 'ಹೊರಹೋಗುವ ಬಾಗಿಲು ನಿಮ್ಮ {direction} ಬದಿಯಲ್ಲಿ {distance} ಮೀಟರ್‌ನಲ್ಲಿದೆ.',
    'risk_critical': 'ತುರ್ತು ಎಚ್ಚರಿಕೆ: ತಕ್ಷಣದ ಅಪಾಯ! ತಕ್ಷಣ ನಿಲ್ಲಿ.',
    'risk_high': 'ಹೆಚ್ಚಿನ ಅಪಾಯ: {object} {distance} ಮೀಟರ್‌ನಲ್ಲಿ ಪತ್ತೆಯಾಗಿದೆ. ಎಚ್ಚರಿಕೆ ಇರಲಿ.',
    'risk_medium': 'ಮಾಹಿತಿ: ನಿಮ್ಮ ಸುತ್ತಮುತ್ತ {object} ಇದೆ ({distance} ಮೀಟರ್).',
    'risk_low': 'ಪರಿಸರವು ಸುರಕ್ಷಿತವಾಗಿದೆ.',
    'risk_vehicle_moving': 'ವಾಹನ ನಿಮ್ಮ ಹಾದಿಯಲ್ಲಿ ಚಲಿಸುತ್ತಿದೆ. ನಿಲ್ಲುವವರೆಗೆ ಕಾಯಿರಿ.',
    'risk_traffic_red': 'ಸಿಗ್ನಲ್ ಕೆಂಪು ಬಣ್ಣದಲ್ಲಿದೆ. ರಸ್ತೆ ದಾಟಬೇಡಿ.',
    'risk_traffic_green': 'ಸಿಗ್ನಲ್ ಹಸಿರು ಬಣ್ಣದಲ್ಲಿದೆ. ರಸ್ತೆ ದಾಟಬಹುದು.',
    'risk_uneven_floor': 'ಎಚ್ಚರಿಕೆ: ಅಸಮ ನೆಲ ಅಥವಾ ಮೆಟ್ಟಿಲು ಮುಂದಿದೆ.',
    'ocr_medicine_title': 'ಔಷಧಿ ಚೀಟಿ ವಿವರ: {medicine}.',
    'ocr_medicine_warning': 'ಸುರಕ್ಷತಾ ಎಚ್ಚರಿಕೆ: ವೈದ್ಯರ ಸಲಹೆಯಂತೆ ಮಾತ್ರ ಸೇವಿಸಿ.',
    'ocr_sign_exit': 'ತುರ್ತು ನಿರ್ಗಮನ ಫಲಕ ಮೇಲ್ಭಾಗದಲ್ಲಿದೆ.',
    'ocr_sign_reception': 'ಸ್ವಾಗತ ಕೌಂಟರ್ ನೇರ ಮುಂದಿದೆ.',
    'ocr_bus_route': 'ಬಸ್ ಮಾರ್ಗ {route} ಪ್ಲಾಟ್‌ಫಾರ್ಮ್‌ಗೆ ಬರುತ್ತಿದೆ.',
    'ocr_price_tag': 'ಬೆಲೆ: {price}.',
    'ocr_generic_read': 'ಓದಲಾದ ಪಠ್ಯ: {text}',
    'id_scene_overview': 'ಪ್ರಸ್ತುತ ಪರಿಸರದಲ್ಲಿ {count} ಪ್ರಮುಖ ವಸ್ತುಗಳಿವೆ: {objects}.',
    'id_person_approaching': 'ಒಬ್ಬ ವ್ಯಕ್ತಿ {direction} ದಿಕ್ಕಿನಿಂದ ಸುಮಾರು {distance} ಮೀಟರ್‌ನಲ್ಲಿ ಬರುತ್ತಿದ್ದಾರೆ.',
    'id_seating_available': 'ಖಾಲಿ ಕುರ್ಚಿ ಮತ್ತು ಮೇಜು {distance} ಮೀಟರ್ ಮುಂದಿದೆ.',
    'id_handrail_available': 'ಹಿಡಿತದ ಕೈಕಂಬಿ {direction} ಗೋಡೆಯಲ್ಲಿದೆ.',
    'uncertain_detection': 'ಮುಂದೆ {object} ಇರುವ ಸಾಧ್ಯತೆಯಿದೆ, ನಿಧಾನವಾಗಿ ಸಾಗಿ.',
    'uncertain_general': 'ಪರಿಸರವನ್ನು ದೃಢೀಕರಿಸಲಾಗುತ್ತಿದೆ...',
    'greeting': 'ಸಹಾಯ್-ಎಕ್ಸ್ (SAHAY-X) ಸಿದ್ಧವಾಗಿದೆ. ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?',
    'help_acknowledged': 'ಸಹಾಯದ ಸಂಕೇತ ಸ್ವೀಕರಿಸಲಾಗಿದೆ. ತುರ್ತು ನೆರವು ಸಕ್ರಿಯಗೊಂಡಿದೆ.',
    'agree_acknowledged': 'ತಿಳಿದಿದೆ. ಮುಂದುವರಿಯುತ್ತಿದೆ.',
    'disagree_acknowledged': 'ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ.',
    'stop_acknowledged': 'ನಿಲ್ಲಿಸಲಾಗಿದೆ.'
  }
};

export function translateTemplate(
  key: string,
  lang: LanguageCode,
  params: Record<string, string | number> = {}
): string {
  const dictionary = TRANSLATIONS[lang] || TRANSLATIONS.en;
  let text = dictionary[key] || TRANSLATIONS.en[key] || key;
  for (const [k, v] of Object.entries(params)) {
    text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  }
  return text;
}

export function getGreeting(lang: LanguageCode): string {
  return translateTemplate('greeting', lang);
}

export function getSafetyPrefix(riskLevel: RiskLevel, lang: LanguageCode): string {
  switch (riskLevel) {
    case 'critical':
      return translateTemplate('risk_critical', lang);
    case 'high':
      return translateTemplate('risk_high', lang, { object: 'hazard', distance: 1.5 });
    case 'medium':
      return translateTemplate('risk_medium', lang, { object: 'object', distance: 2.5 });
    default:
      return '';
  }
}
