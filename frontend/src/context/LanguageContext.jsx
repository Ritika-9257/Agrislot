'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const TRANSLATIONS = {
  en: {
    // Navigation & Global
    inboundTerminal: 'INBOUND TERMINAL 02',
    clearanceDesk: 'Weighbridge Clearance Desk',
    navClearance: 'Clearance Desk',
    navBookSlot: 'Book Mandi Slot',
    navVerifyPass: 'Verify Gate-Pass',
    navAdminDesk: 'Mandi Officer Desk',
    navUserMgmt: 'User Roles & Access',
    navMyBookings: 'My Bookings & Slots',
    adminPortalTitle: 'Administrative Command & Management',
    userPortalTitle: 'Farmer & Producer Portal',
    navAnalytics: 'Market Analytics',
    liveServices: '⚡ LIVE SERVICES',
    liveTicker: 'APMC MANDI SERVICES • GUARANTEED TIME-SLOT BOOKING • INSTANT GATE-PASS TOKENS • DIRECT UPI BANK SETTLEMENT • ZERO TRUCK CONGESTION',
    signIn: 'Sign In',
    register: 'Register',
    signOut: 'Sign Out',
    eNamSync: 'e-NAM SYNC ACTIVE',

    // Clearance Rig (Home)
    heroBadge: 'FAST-TRACK ARRIVAL VERIFY',
    heroTitlePart1: 'Instant Inbound',
    heroTitlePart2: 'Clearance Rig',
    heroSubtitle: 'Live ANPR plate camera match, automated chassis tare load calculation, and instant unloading bay allocation for APMC arrivals.',
    scaleStatusLabel: 'Scale Cell Status',
    scaleStatusVal: 'RIGID & CALIBRATED',
    recommendedBayLabel: 'Recommended Bay',
    recommendedBayVal: 'BAY-04 UNLOADING',
    scanTokenTitle: 'Scan Token or Enter Farmer Mandi ID',
    scanPlaceholder: 'e.g. AG-T001',
    scanBtn: 'Scan Ticket',
    pullLedgerBtn: 'Pull Ledger Record',
    pulling: 'Pulling...',

    // Weighbridge
    loadCellsTitle: 'Real-Time Load Cells',
    stationPlatform: 'STATION PLATFORM #02 // HIGH ACCURACY',
    activeSensors: 'ACTIVE SENSORS',
    netPayloadLabel: 'Calculated Net Produce Payload',
    declaredProduce: 'DECLARED PRODUCE',
    scaleMatch: '100% SCALE MATCH',
    grossWeight: 'Gross Scale Weight',
    tareWeight: 'Registered Tare Deduction',
    moistureGauge: 'Ultrasonic Moisture Gauge',
    optimalGrade: 'GRADE A OPTIMAL',
    targetBayLabel: 'Target Unloading Ramp / Bay Assignment',
    autoSync: 'Auto-Sync e-NAM Transaction Ledger',
    printRfid: 'Print RFID Pass Tag',
    printPassSlip: 'Print Pass Slip',
    dispute: 'Dispute',
    approveCheckIn: 'Approve & Check-In',
    viewSmsNotification: 'View SMS / WhatsApp Alert',

    // Yard Map
    yardAllocationBadge: 'TERMINAL YARD ALLOCATION',
    yardMapTitle: 'Mandi Discharge Bays & Yard Map',
    yardMapSubtitle: 'Live automated dock assignment • Click any bay to route the active inbound vehicle',
    baysOnline: '6 / 6 BAYS ONLINE',
    avgDockTime: 'AVG DOCK TIME: 16 MIN',

    // Queue
    queueTitle: 'Gate 02 Physical Vehicle Queue',
    queueSubtitle: 'Real-time dynamic slot sequencing pipeline (Click any card to inspect)',
    bookNewSlot: 'Book New Slot',

    // Services
    servicesBadge: 'APMC FARMER & TRADER SERVICES',
    servicesTitle: 'Services We Provide',
    servicesSubtitle: 'Guaranteed APMC market access, transparent digital weighment, and instant bank settlements',
    bookYourSlot: 'Book Your Slot',
    service1Title: 'Advance Slot Booking',
    service1Desc: 'Reserve your arrival date and time window online before leaving the village. Guarantees priority yard entry and eliminates 6–8 hour traffic delays.',
    service2Title: 'Digital Gate-Pass Token',
    service2Desc: 'Instant collision-proof token slip with SMS notification and printable QR barcode. Simply show your SMS or printed pass at Gate 02.',
    service3Title: 'Certified Weighbridge',
    service3Desc: 'Electronic load cell sensors measure gross vehicle and tare deduction in under 2 minutes. Digital readout prevents weight discrepancies.',
    service4Title: 'Quality Inspection',
    service4Desc: 'Objective moisture meters and purity grading ensure your produce receives fair auction prices based on real commodity quality.',
    service5Title: 'Direct UPI Payouts',
    service5Desc: 'Sale revenue is released straight to your registered UPI ID or Bank Account immediately after auction. Zero unapproved middleman commissions.',
    service6Title: 'Depot Storage Allotment',
    service6Desc: 'Safe storage in ventilated tuber ramps, bulk grain silos, or cold logistics vaults for unsold produce or future auction releases.',

    // Farmer Portal & Forms
    farmerPortalTitle: 'Farmer Slot Reservation',
    farmerPortalSubtitle: 'Reserve guaranteed arrival time-slots with concurrency-safe gate token allocation.',
    tabReserveSlot: 'Reserve Slot',
    tabMyPasses: 'My Passes',
    selectMandi: 'Select APMC Mandi',
    selectProduce: 'Select Crop / Commodity',
    selectSlot: 'Select Time Window',
    estWeightTons: 'Estimated Weight (Tons)',
    bookSlotBtn: 'Reserve Mandi Slot Now',
    registerProducer: 'New Producer Registration',
    myPassesLookup: 'Lookup Passes by Token or Farmer ID',
    cancelBookingBtn: 'Cancel Slot',
    gatePassSlipTitle: 'Official Mandi Gate-Pass Slip',
    printGatePass: 'Print Pass Slip',
    downloadCsvBtn: 'Export CSV Report',
    notificationsTitle: 'Mandi In-App Alerts',
    markAllRead: 'Mark All Read',
    noNotifications: 'No new notifications',

    // Status Values
    statusConfirmed: 'Confirmed',
    statusCheckedIn: 'Checked-In',
    statusCompleted: 'Completed',
    statusCancelled: 'Cancelled',
    statusPending: 'Pending',
    statusReleased: 'Released',
    statusFailed: 'Failed'
  },
  hi: {
    // Navigation & Global
    inboundTerminal: 'इनबाउंड टर्मिनल 02',
    clearanceDesk: 'वेब्रिज क्लीयरेंस डेस्क',
    navClearance: 'क्लीयरेंस डेस्क',
    navBookSlot: 'मंडी स्लॉट बुक करें',
    navVerifyPass: 'गेट-पास सत्यापन',
    navAdminDesk: 'मंडी अधिकारी डेस्क',
    navUserMgmt: 'उपयोगकर्ता भूमिका और नियंत्रण',
    navMyBookings: 'मेरी बुकिंग और स्लॉट',
    adminPortalTitle: 'प्रशासनिक नियंत्रण और प्रबंधन',
    userPortalTitle: 'किसान और उत्पादक पोर्टल',
    navAnalytics: 'मार्केट एनालिटिक्स',
    liveServices: '⚡ लाइव सेवाएं',
    liveTicker: 'एपीएमसी मंडी सेवाएं • समय-स्लॉट अग्रिम बुकिंग • तत्काल गेट-पास टोकन • सीधे बैंक खाते में भुगतान • जाम से मुक्ति',
    signIn: 'लॉग इन करें',
    register: 'पंजीकरण',
    signOut: 'लॉग आउट',
    eNamSync: 'ई-नाम सिंक सक्रिय',

    // Clearance Rig (Home)
    heroBadge: 'त्वरित आगमन सत्यापन',
    heroTitlePart1: 'त्वरित इनबाउंड',
    heroTitlePart2: 'क्लीयरेंस डेस्क',
    heroSubtitle: 'स्वचालित नंबर प्लेट पहचान, सटीक वजन गणना, और तत्काल अनलोडिंग बे आवंटन।',
    scaleStatusLabel: 'कांटा स्थिति',
    scaleStatusVal: 'सटीक एवं प्रमाणित',
    recommendedBayLabel: 'अनुशंसित बे',
    recommendedBayVal: 'बे-04 अनलोडिंग',
    scanTokenTitle: 'टोकन स्कैन करें या किसान मंडी आईडी दर्ज करें',
    scanPlaceholder: 'उदा. AG-T001',
    scanBtn: 'टिकट स्कैन',
    pullLedgerBtn: 'रिकॉर्ड देखें',
    pulling: 'खोज रहे हैं...',

    // Weighbridge
    loadCellsTitle: 'सजीव वजन सेल सेंसर',
    stationPlatform: 'प्लेटफॉर्म #02 // उच्च सटीकता',
    activeSensors: 'सक्रिय सेंसर',
    netPayloadLabel: 'शुद्ध फसल वजन',
    declaredProduce: 'घोषित फसल वजन',
    scaleMatch: '100% वजन मिलान',
    grossWeight: 'सकल वाहन वजन',
    tareWeight: 'खाली वाहन (टेयर) वजन',
    moistureGauge: 'अल्ट्रासोनिक नमी मीटर',
    optimalGrade: 'ग्रेड ए इष्टतम',
    targetBayLabel: 'अनलोडिंग बे आवंटन',
    autoSync: 'ई-नाम लेजर ऑटो सिंक',
    printRfid: 'आरएफआईडी पास प्रिंट',
    printPassSlip: 'पास पर्ची प्रिंट करें',
    dispute: 'विवाद दर्ज करें',
    approveCheckIn: 'स्वीकृत करें और चेक-इन दें',
    viewSmsNotification: 'एसएमएस / व्हाट्सएप संदेश देखें',

    // Yard Map
    yardAllocationBadge: 'टर्मिनल यार्ड आवंटन',
    yardMapTitle: 'मंडी अनलोडिंग बे एवं यार्ड मानचित्र',
    yardMapSubtitle: 'स्वचालित डॉक आवंटन • वाहन को दूसरे बे पर भेजने के लिए क्लिक करें',
    baysOnline: '6 / 6 बे ऑनलाइन',
    avgDockTime: 'औसत समय: 16 मिनट',

    // Queue
    queueTitle: 'गेट 02 वाहन कतार',
    queueSubtitle: 'वाहनों की रीयल-टाइम कतार (विवरण देखने के लिए किसी भी कार्ड पर क्लिक करें)',
    bookNewSlot: 'नया स्लॉट बुक करें',

    // Services
    servicesBadge: 'किसान एवं व्यापारी सेवाएं',
    servicesTitle: 'हमारी प्रमुख सेवाएं',
    servicesSubtitle: 'निश्चित मंडी पहुंच, पारदर्शी वजन मापन और बैंक खाते में सीधा भुगतान',
    bookYourSlot: 'अपना स्लॉट बुक करें',
    service1Title: 'अग्रिम स्लॉट बुकिंग',
    service1Desc: 'गांव से निकलने से पहले ही स्लॉट बुक करें। यार्ड में सीधा प्राथमिकता से प्रवेश और 6-8 घंटे का ट्रैफिक जाम समाप्त।',
    service2Title: 'डिजिटल गेट-पास टोकन',
    service2Desc: 'क्यूआर कोड एवं एसएमएस युक्त टोकन पर्ची। गेट 02 पर केवल एसएमएस दिखाकर त्वरित प्रवेश पाएं।',
    service3Title: 'प्रमाणित इलेक्ट्रॉनिक कांटा',
    service3Desc: 'इलेक्ट्रॉनिक लोड सेल से 2 मिनट में सकल व खाली वजन की सटीक माप। वजन में हेराफेरी बिल्कुल असंभव।',
    service4Title: 'गुणवत्ता जांच',
    service4Desc: 'डिजिटल नमी मीटर एवं पारदर्शी ग्रेडिंग से आपकी उपज को गुणवत्ता अनुसार उचित नीलामी मूल्य मिलता है।',
    service5Title: 'सीधा यूपीआई भुगतान',
    service5Desc: 'नीलामी समाप्त होते ही बिक्री की राशि सीधे आपके बैंक खाते या यूपीआई आईडी में बिना किसी बिचौलिये के जमा।',
    service6Title: 'गोदाम एवं कोल्ड स्टोरेज',
    service6Desc: 'अविक्रीत उपज को सुरक्षित रखने के लिए हवादार शेड, अनाज साइलो एवं कोल्ड स्टोरेज की सुविधा।',

    // Farmer Portal & Forms
    farmerPortalTitle: 'किसान स्लॉट आरक्षण',
    farmerPortalSubtitle: 'मंडी आगमन के लिए समय-स्लॉट अग्रिम रूप से आरक्षित करें और तत्काल टोकन पाएं।',
    tabReserveSlot: 'स्लॉट बुक करें',
    tabMyPasses: 'मेरे गेट-पास',
    selectMandi: 'एपीएमसी मंडी चुनें',
    selectProduce: 'फसल / जिंस चुनें',
    selectSlot: 'आगमन समय चुनें',
    estWeightTons: 'अनुमानित वजन (टन)',
    bookSlotBtn: 'मंडी स्लॉट अभी आरक्षित करें',
    registerProducer: 'नया किसान पंजीकरण',
    myPassesLookup: 'टोकन या किसान आईडी से पास खोजें',
    cancelBookingBtn: 'स्लॉट रद्द करें',
    gatePassSlipTitle: 'आधिकारिक मंडी गेट-पास पर्ची',
    printGatePass: 'पास पर्ची प्रिंट करें',
    downloadCsvBtn: 'सीएसवी रिपोर्ट डाउनलोड करें',
    notificationsTitle: 'मंडी अलर्ट एवं सूचनाएं',
    markAllRead: 'सभी पढ़े हुए मार्क करें',
    noNotifications: 'कोई नई सूचना नहीं है',

    // Status Values
    statusConfirmed: 'पुष्ट (Confirmed)',
    statusCheckedIn: 'प्रवेश स्वीकृत (Checked-In)',
    statusCompleted: 'सम्पन्न (Completed)',
    statusCancelled: 'रद्द (Cancelled)',
    statusPending: 'लंबित (Pending)',
    statusReleased: 'भुगतान जारी (Released)',
    statusFailed: 'विफल (Failed)'
  },
  gu: {
    // Navigation & Global
    inboundTerminal: 'ઇનબાઉન્ડ ટર્મિનલ 02',
    clearanceDesk: 'વેબ્રિજ ક્લિયરન્સ ડેસ્ક',
    navClearance: 'ક્લિયરન્સ ડેસ્ક',
    navBookSlot: 'મંડી સ્લોટ બુક કરો',
    navVerifyPass: 'ગેટ-પાસ ચકાસણી',
    navAdminDesk: 'મંડી અધિકારી ડેસ્ક',
    navUserMgmt: 'વપરાશકર્તા ભૂમિકા અને નિયંત્રણ',
    navMyBookings: 'મારી બુકિંગ અને સ્લોટ',
    adminPortalTitle: 'વહીવટી નિયંત્રણ અને વ્યવસ્થાપન',
    userPortalTitle: 'ખેડૂત અને ઉત્પાદક પોર્ટલ',
    navAnalytics: 'બજાર વિશ્લેષણ',
    liveServices: '⚡ લાઈવ સેવાઓ',
    liveTicker: 'એપીએમસી મંડી સેવાઓ • સમય-સ્લોટ અગાઉથી બુકિંગ • ડિજિટલ ગેટ-પાસ ટોકન • સીધા બેંક ખાતામાં ચૂકવણી • ટ્રાફિક મુક્ત વ્યવસ્થા',
    signIn: 'લૉગ ઇન',
    register: 'નોંધણી કરો',
    signOut: 'લૉગ આઉટ',
    eNamSync: 'ઈ-નામ સિંક સક્રિય',

    // Clearance Rig (Home)
    heroBadge: 'ઝડપી આગમન ચકાસણી',
    heroTitlePart1: 'ત્વરિત ઇનબાઉન્ડ',
    heroTitlePart2: 'ક્લિયરન્સ ડેસ્ક',
    heroSubtitle: 'ઓટોમેટિક નંબર પ્લેટ સ્કેન, સચોટ વજન ગણતરી અને અનલોડિંગ બે ફાળવણી.',
    scaleStatusLabel: 'કાંટા સ્થિતિ',
    scaleStatusVal: 'સચોટ અને પ્રમાણિત',
    recommendedBayLabel: 'ભલામણ કરેલ બે',
    recommendedBayVal: 'બે-04 અનલોડિંગ',
    scanTokenTitle: 'ટોકન સ્કેન કરો અથવા કિસાન મંડી આઈડી દાખલ કરો',
    scanPlaceholder: 'દા.ત. AG-T001',
    scanBtn: 'ટિકિટ સ્કેન',
    pullLedgerBtn: 'વિગતો જુઓ',
    pulling: 'શોધી રહ્યું છે...',

    // Weighbridge
    loadCellsTitle: 'લાઈવ લોડ સેલ સેન્સર',
    stationPlatform: 'પ્લેટફોર્મ #02 // ઉચ્ચ ચોકસાઈ',
    activeSensors: 'સક્રિય સેન્સર્સ',
    netPayloadLabel: 'ચોખ્ખું પાકનું વજન',
    declaredProduce: 'જાહેર કરેલ પાક વજન',
    scaleMatch: '100% વજન મેળ',
    grossWeight: 'કુલ વાહન વજન',
    tareWeight: 'ખાલી વાહન (ટેર) વજન',
    moistureGauge: 'ભેજ માપક યંત્ર',
    optimalGrade: 'ગ્રેડ એ ઉત્તમ',
    targetBayLabel: 'અનલોડિંગ બે ફાળવણી',
    autoSync: 'ઈ-નામ ખાતાવહીમાં ઓટો સિંક',
    printRfid: 'આરએફઆઈડી પાસ પ્રિન્ટ',
    printPassSlip: 'પાસ સ્લિપ પ્રિન્ટ કરો',
    dispute: 'વાંધો નોંધાવો',
    approveCheckIn: 'મંજૂર કરો અને પ્રવેશ આપો',
    viewSmsNotification: 'એસએમએસ / વોટ્સએપ મેસેજ જુઓ',

    // Yard Map
    yardAllocationBadge: 'યાર્ડ ફાળવણી',
    yardMapTitle: 'મંડી અનલોડિંગ બે અને યાર્ડ નકશો',
    yardMapSubtitle: 'ઓટોમેટિક ડોક ફાળવણી • વાહન બીજા બે પર મોકલવા ક્લિક કરો',
    baysOnline: '6 / 6 બે ઓનલાઇન',
    avgDockTime: 'સરેરાશ સમય: 16 મિનિટ',

    // Queue
    queueTitle: 'ગેટ 02 વાહન લાઇન',
    queueSubtitle: 'વાહનોની રીઅલ-ટાઇમ લાઇન (વિગતો જોવા માટે કોઈપણ કાર્ડ પર ક્લિક કરો)',
    bookNewSlot: 'નવો સ્લોટ બુક કરો',

    // Services
    servicesBadge: 'ખેડૂત અને વેપારી સેવાઓ',
    servicesTitle: 'અમારી મુખ્ય સેવાઓ',
    servicesSubtitle: 'ચોક્કસ સમય ફાળવણી, પારદર્શક વજન માપણી અને સીધા બેંક ખાતામાં ચૂકવણી',
    bookYourSlot: 'તમારો સ્લોટ બુક કરો',
    service1Title: 'એડવાન્સ સ્લોટ બુકિંગ',
    service1Desc: 'ગામડેથી નીકળતા પહેલા જ સ્લોટ બુક કરો. યાર્ડમાં સીધો પ્રાથમિક પ્રવેશ અને 6-8 કલાકનો ટ્રાફિક વિલંબ દૂર.',
    service2Title: 'ડિજિટલ ગેટ-પાસ ટોકન',
    service2Desc: 'ક્યૂઆર કોડ અને એસએમએસ યુક્ત પાસ. ગેટ નંબર 02 પર ફક્ત એસએમએસ બતાવી ઝડપી પ્રવેશ મેળવો.',
    service3Title: 'ઈલેક્ટ્રોનિક વજન કાંટો',
    service3Desc: 'ઇલેક્ટ્રોનિક લોડ સેલ વડે 2 મિનિટમાં કુલ અને ખાલી વજનની સચોટ ગણતરી. વજનમાં કોઈ ગેરરીતિ શક્ય નથી.',
    service4Title: 'ગુણવત્તા ચકાસણી',
    service4Desc: 'ડિજિટલ ભેજ માપક અને સચોટ ગ્રેડિંગથી તમારા પાકને ગુણવત્તા પ્રમાણે પૂરા અને યોગ્ય ભાવ મળે છે.',
    service5Title: 'સીધા ખાતામાં ચૂકવણી',
    service5Desc: 'હરાજી પૂરી થતાં જ વેચાણની રકમ સીધી તમારા બેંક ખાતામાં અથવા યુપીઆઈમાં જમા થાય છે.',
    service6Title: 'ગોડાઉન અને કોલ્ડ સ્ટોરેજ',
    service6Desc: 'વેચાયા વિનાના પાકને સુરક્ષિત રાખવા માટે હવાઉજાસવાળા ગોડાઉન અને કોલ્ડ સ્ટોરેજ સુવિધા.',

    // Farmer Portal & Forms
    farmerPortalTitle: 'ખેડૂત સ્લોટ આરક્ષણ',
    farmerPortalSubtitle: 'મંડી આગમન માટે ખાતરીપૂર્વકનો સમય-સ્લોટ આરક્ષિત કરો અને તુરંત ગેટ ટોકન મેળવો.',
    tabReserveSlot: 'સ્લોટ બુક કરો',
    tabMyPasses: 'મારા ગેટ-પાસ',
    selectMandi: 'એપીએમસી મંડી પસંદ કરો',
    selectProduce: 'પાક / ઉપજ પસંદ કરો',
    selectSlot: 'આગમન સમય પસંદ કરો',
    estWeightTons: 'અંદાજિત વજન (ટન)',
    bookSlotBtn: 'મંડી સ્લોટ હમણાં જ બુક કરો',
    registerProducer: 'નવા ખેડૂતની નોંધણી',
    myPassesLookup: 'ટોકન અથવા ખેડૂત નંબરથી પાસ શોધો',
    cancelBookingBtn: 'સ્લોટ રદ કરો',
    gatePassSlipTitle: 'સત્તાવાર મંડી ગેટ-પાસ પાવતી',
    printGatePass: 'પાસ પાવતી પ્રિન્ટ કરો',
    downloadCsvBtn: 'સીએસવી રિપોર્ટ ડાઉનલોડ કરો',
    notificationsTitle: 'મંડી એલર્ટ અને સૂચનાઓ',
    markAllRead: 'બધા વંચાયેલ તરીકે ચિહ્નિત કરો',
    noNotifications: 'કોઈ નવી સૂચના નથી',

    // Status Values
    statusConfirmed: 'ખાતરી થયેલ (Confirmed)',
    statusCheckedIn: 'યાર્ડમાં પ્રવેશેલ (Checked-In)',
    statusCompleted: 'પૂર્ણ થયેલ (Completed)',
    statusCancelled: 'રદ થયેલ (Cancelled)',
    statusPending: 'બાકી (Pending)',
    statusReleased: 'નાણાં જમા થયેલ (Released)',
    statusFailed: 'નિષ્ફળ (Failed)'
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('agrislot_lang');
      if (saved && (saved === 'en' || saved === 'hi' || saved === 'gu')) {
        setLanguageState(saved);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const setLanguage = (lang) => {
    if (lang === 'en' || lang === 'hi' || lang === 'gu') {
      setLanguageState(lang);
      try {
        localStorage.setItem('agrislot_lang', lang);
      } catch {}
    }
  };

  const t = (key) => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
    return dict[key] || TRANSLATIONS.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: 'en',
      setLanguage: () => {},
      t: (key) => TRANSLATIONS.en[key] || key,
    };
  }
  return context;
}
