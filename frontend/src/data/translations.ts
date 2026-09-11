export type Language = 'en' | 'hi' | 'as';

export const TRANSLATIONS: Record<Language, {
  highRiskAlert: { title: string; message: string; recommendation: string };
  blockedAlert: { title: string; message: string; recommendation: string };
  rerouteAlert: { title: string; message: string; recommendation: string };
  explainTitle: string;
  riskProbability: string;
  whyRisky: string;
  recommendation: string;
  cargoMedical: string;
  cargoFood: string;
  cargoConstruction: string;
  cargoGeneral: string;
  offlineQueued: string;
  onlineSynced: string;
}> = {
  en: {
    highRiskAlert: {
      title: 'High Disruption Risk',
      message: 'High disruption risk detected on current route corridor.',
      recommendation: 'Switch to SAFEST route to avoid landslide & flood hazards.'
    },
    blockedAlert: {
      title: 'Road Blocked Warning',
      message: 'Primary highway segment impassable due to structural hazard.',
      recommendation: 'Reroute immediately using safe bypass corridor.'
    },
    rerouteAlert: {
      title: 'Safer Route Available',
      message: 'SURAKSHA AI recommends switching to the SAFEST corridor.',
      recommendation: 'Click USE SAFEST ROUTE to update mission navigation.'
    },
    explainTitle: 'SURAKSHA AI ASSESSMENT',
    riskProbability: 'Risk Probability',
    whyRisky: 'WHY THIS ROUTE IS RISKY',
    recommendation: 'RECOMMENDATION',
    cargoMedical: 'Medical Supplies (Safety Prioritized)',
    cargoFood: 'Food & Essentials (Balanced Safety/ETA)',
    cargoConstruction: 'Construction Material (Efficiency Prioritized)',
    cargoGeneral: 'General Cargo (Standard Policy)',
    offlineQueued: 'Network offline. Incident saved locally in pending queue.',
    onlineSynced: 'Network online. Incident synchronized to central command.'
  },
  hi: {
    highRiskAlert: {
      title: 'उच्च व्यवधान जोखिम',
      message: 'वर्तमान मार्ग गलियारे पर उच्च व्यवधान जोखिम पाया गया है।',
      recommendation: 'भूस्खलन और बाढ़ के खतरों से बचने के लिए सबसे सुरक्षित मार्ग पर स्विच करें।'
    },
    blockedAlert: {
      title: 'सड़क बंद की चेतावनी',
      message: 'संरचनात्मक खतरे के कारण मुख्य मार्ग अवरुद्ध है।',
      recommendation: 'सुरक्षित बाईपास का उपयोग करके तुरंत मार्ग बदलें।'
    },
    rerouteAlert: {
      title: 'सुरक्षित मार्ग उपलब्ध',
      message: 'सुरक्षा AI सबसे सुरक्षित गलियारे पर स्विच करने की सिफारिश करता है।',
      recommendation: 'मिशन नेविगेशन अपडेट करने के लिए सुरक्षित मार्ग चुनें।'
    },
    explainTitle: 'सुरक्षा AI आकलन',
    riskProbability: 'जोखिम प्रायिकता',
    whyRisky: 'यह मार्ग जोखिम भरा क्यों है',
    recommendation: 'सिफारिश',
    cargoMedical: 'चिकित्सा आपूर्ति (सुरक्षा प्राथमिकता)',
    cargoFood: 'खाद्य और आवश्यक वस्तुएं (संतुलित)',
    cargoConstruction: 'निर्माण सामग्री (दक्षता प्राथमिकता)',
    cargoGeneral: 'सामान्य माल (मानक नीति)',
    offlineQueued: 'नेटवर्क ऑफलाइन। घटना स्थानीय रूप से सहेजी गई।',
    onlineSynced: 'नेटवर्क ऑनलाइन। घटना केंद्रीय कमांड में सिंक हो गई।'
  },
  as: {
    highRiskAlert: {
      title: 'উচ্চ খণ্ডনৰ আশংকা',
      message: 'বৰ্তমান পথত ভূমিস্খলনৰ উচ্চ আশংকা ধৰা পৰিছে।',
      recommendation: 'ভূমিস্খলন আৰু বানপানীৰ পৰা বাচিবলৈ আটাইতকৈ সুৰক্ষিত পথ ব্যৱহাৰ কৰক।'
    },
    blockedAlert: {
      title: 'পথ অৱৰোধৰ সকীয়ানী',
      message: 'বিপদৰ বাবে মুখ্য পথ সম্পূৰ্ণৰূপে অৱৰুদ্ধ হৈ পৰিছে।',
      recommendation: 'বিকল্প সুৰক্ষিত পথ ব্যৱহাৰ কৰি যাত্ৰা সলনি কৰক।'
    },
    rerouteAlert: {
      title: 'সুৰক্ষিত বিকল্প পথ উপলব্ধ',
      message: 'সুৰক্ষা AI ৰ দ্বাৰা আটাইতকৈ সুৰক্ষিত পথত যোৱাৰ পৰামৰ্শ দিয়া হৈছে।',
      recommendation: 'সুৰক্ষিত পথ বুটামত টিপি নেভিগেশ্যন সলনি কৰক।'
    },
    explainTitle: 'সুৰক্ষা AI মূল্যায়ন',
    riskProbability: 'আশংকাৰ সম্ভাৱনা',
    whyRisky: 'এই পথটো কিয় ঝুঁকিপূৰ্ণ',
    recommendation: 'পৰামৰ্শ',
    cargoMedical: 'চিকিৎসা সামগ্ৰী (সুৰক্ষা অগ্ৰাধিকাৰ)',
    cargoFood: 'খাদ্য আৰু অত্যাৱশ্যকীয় (সমতুল্য)',
    cargoConstruction: 'নিৰ্মাণ সামগ্ৰী (দক্ষতা অগ্ৰাধিকাৰ)',
    cargoGeneral: 'সাধাৰণ সামগ্ৰী (মানক নীতি)',
    offlineQueued: 'নেটৱৰ্ক অফলাইন। ঘটনাটো স্থানীয়ভাৱে সংৰক্ষিত হৈছে।',
    onlineSynced: 'নেটৱৰ্ক অনলাইন। ঘটনাটো কেন্দ্ৰীয় কমাণ্ডত সিংক কৰা হৈছে।'
  }
};
