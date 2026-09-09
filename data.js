/**
 * Corporate Business Development CRM - Data Store & Seed Engine
 */

const CRM_STORAGE_KEY = 'BD_CRM_DATA_STORE_V1';

// Controlled Dropdowns and Master Configs
const CRM_CONFIG = {
  stages: [
    { id: 1, name: 'New Enquiry', defaultProb: 10, category: 'lead' },
    { id: 2, name: 'Initial Contact', defaultProb: 15, category: 'lead' },
    { id: 3, name: 'Requirement Discussion', defaultProb: 25, category: 'discussion' },
    { id: 4, name: 'Meeting Scheduled', defaultProb: 30, category: 'discussion' },
    { id: 5, name: 'Meeting Completed', defaultProb: 40, category: 'discussion' },
    { id: 6, name: 'Requirement Received', defaultProb: 45, category: 'discussion' },
    { id: 7, name: 'Proposal Under Preparation', defaultProb: 50, category: 'proposal' },
    { id: 8, name: 'Internal Approval Pending', defaultProb: 55, category: 'proposal' },
    { id: 9, name: 'Proposal / Commercial Shared', defaultProb: 65, category: 'proposal' },
    { id: 10, name: 'Client Review', defaultProb: 70, category: 'review' },
    { id: 11, name: 'Follow-up', defaultProb: 75, category: 'negotiation' },
    { id: 12, name: 'Commercial Negotiation', defaultProb: 80, category: 'negotiation' },
    { id: 13, name: 'Final Discussion', defaultProb: 90, category: 'negotiation' },
    { id: 14, name: 'Won', defaultProb: 100, category: 'won' },
    { id: 15, name: 'Lost', defaultProb: 0, category: 'lost' },
    { id: 16, name: 'On Hold', defaultProb: 10, category: 'hold' }
  ],
  funnelStages: [
    'New Enquiry',
    'Contacted',
    'Meeting/Discussion',
    'Requirement Received',
    'Proposal Preparation',
    'Proposal Shared',
    'Commercial Discussion',
    'Client Review',
    'Negotiation',
    'Won',
    'Lost'
  ],
  statuses: ['Open', 'In Process', 'Won', 'Lost', 'On Hold', 'Closed'],
  lostReasons: [
    'Competitor Won',
    'Price Issue',
    'Requirement Cancelled',
    'No Response',
    'Budget Issue',
    'Internal Decision Delayed',
    'Technical Scope Mismatch',
    'Other'
  ],
  segments: [
    'Employee Transportation',
    'Warehouse Logistics',
    'Fleet Management',
    'Contract Logistics',
    'Corporate Travel',
    'Supply Chain Solutions',
    'Last Mile Delivery',
    'Cold Chain Logistics'
  ],
  industries: [
    'Automotive & Engineering',
    'Information Technology & ITES',
    'Healthcare & Pharma',
    'FMCG & Retail',
    'Manufacturing & Heavy Industry',
    'E-commerce & Logistics',
    'Banking & Financial Services',
    'Consulting & Professional'
  ],
  leadSources: [
    'Direct Outreach / Cold BD',
    'Referral / Existing Client',
    'Inbound Website Enquiry',
    'Trade Show / Corporate Expo',
    'Management Reference',
    'LinkedIn BD Campaign',
    'Tender / RFP Portal',
    'Partner Channel'
  ],
  executives: [
    { name: 'Aditya Patil', title: 'Senior BD Manager', email: 'aditya.patil@rajmudragroup.com' },
    { name: 'Pooja Kulkarni', title: 'BD Lead - Enterprise', email: 'pooja.kulkarni@rajmudragroup.com' },
    { name: 'Rajesh Patil', title: 'Key Accounts Director', email: 'rajesh.patil@rajmudragroup.com' },
    { name: 'Devika Pangam', title: 'BD Executive - North', email: 'devika.pangam@rajmudragroup.com' },
    { name: 'Suresh Joshi', title: 'BD Executive - West', email: 'suresh.joshi@rajmudragroup.com' }
  ],
  departments: [
    'Operations',
    'Pricing & Commercials',
    'Management',
    'Finance & Accounts',
    'Legal & Compliance',
    'Fleet / Asset Management',
    'Human Resources',
    'IT & Systems'
  ],
  documentTypes: [
    'Commercial Proposal PDF',
    'Email Approval PDF',
    'Commercial Rate Card / Quotation',
    'Signed SLA / Master Contract',
    'Technical Scope / Layout PDF',
    'Presentation Pitch Deck',
    'Minutes of Meeting (MOM)',
    'Client Requirement / RFP Scope',
    'Other Document'
  ],
  activityTypes: [
    'Physical Meeting',
    'Client Visit',
    'Phone Call',
    'Video Meeting',
    'Email',
    'WhatsApp / Message',
    'Proposal Discussion',
    'Commercial Discussion',
    'Follow-up',
    'Presentation',
    'Site Visit',
    'Negotiation',
    'Other'
  ],
  internalCategories: [
    'Internal coordination',
    'Proposal preparation',
    'Pricing discussion',
    'Commercial approval',
    'Management approval',
    'Operations coordination',
    'Finance coordination',
    'Legal review',
    'Fleet/vehicle availability discussion',
    'Vendor coordination',
    'Data collection',
    'Preparing presentations',
    'Tender preparation',
    'Contract review',
    'Other administrative/BD activity'
  ]
};

// Initial Realistic Seed Dataset
const SEED_DATA = {
  currency: 'INR', // 'INR' or 'USD'
  clients: [
    {
      id: 'CLT-1001',
      name: 'ABC Manufacturing Ltd',
      company: 'ABC Manufacturing Enterprises',
      businessGroup: 'ABC Global Group',
      segment: 'Employee Transportation',
      industry: 'Manufacturing & Heavy Industry',
      location: 'Pune, Maharashtra',
      website: 'www.abcmanufacturing.demo',
      clientType: 'Existing',
      contactPerson: 'Rajesh Kulkarni',
      designation: 'VP - Operations & Admin',
      mobile: '+91 98231 44550',
      email: 'rajesh.k@abcmanufacturing.demo',
      leadSource: 'Referral / Existing Client',
      bdOwner: 'Aditya Patil',
      dateAdded: '2025-11-15',
      existingBusiness: 'Yes',
      existingServices: 'Staff Shuttle 15 Buses',
      potentialServices: 'Plant-to-Plant Freight Logistics & EV Fleet',
      priority: 'High',
      relationshipStatus: 'Strategic Partner',
      lastInteractionDate: '2026-09-04',
      nextFollowupDate: '2026-09-08',
      remarks: 'Key client for annual contract renewal & EV expansion.',
      createdBy: 'Aditya Patil',
      lastUpdated: '2026-09-04',
      status: 'Active'
    },
    {
      id: 'CLT-1002',
      name: 'XYZ Automotive Components',
      company: 'XYZ Auto Global India Pvt Ltd',
      businessGroup: 'XYZ Mobility Group',
      segment: 'Warehouse Logistics',
      industry: 'Automotive & Engineering',
      location: 'Gurugram, Haryana',
      website: 'www.xyzauto.demo',
      clientType: 'New',
      contactPerson: 'Harsh Vardhan',
      designation: 'Head of Supply Chain',
      mobile: '+91 98110 77890',
      email: 'h.vardhan@xyzauto.demo',
      leadSource: 'Management Reference',
      bdOwner: 'Pooja Kulkarni',
      dateAdded: '2026-07-20',
      existingBusiness: 'No',
      existingServices: 'None',
      potentialServices: 'Dedicated 50,000 sq.ft Warehouse Management',
      priority: 'High',
      relationshipStatus: 'In Active Discussion',
      lastInteractionDate: '2026-09-05',
      nextFollowupDate: '2026-09-07',
      remarks: 'Commercial proposals shared. Awaiting Board level sign-off.',
      createdBy: 'Pooja Kulkarni',
      lastUpdated: '2026-09-05',
      status: 'Active'
    },
    {
      id: 'CLT-1003',
      name: 'Global Foods & Beverages',
      company: 'Global Agri-Foods India',
      businessGroup: 'Global Conglomerate',
      segment: 'Cold Chain Logistics',
      industry: 'FMCG & Retail',
      location: 'Bengaluru, Karnataka',
      website: 'www.globalfoods.demo',
      clientType: 'New',
      contactPerson: 'Meera Deshmukh',
      designation: 'Procurement Director',
      mobile: '+91 97400 33211',
      email: 'meera.d@globalfoods.demo',
      leadSource: 'Direct Outreach / Cold BD',
      bdOwner: 'Rajesh Patil',
      dateAdded: '2026-08-05',
      existingBusiness: 'No',
      existingServices: 'None',
      potentialServices: 'Refrigerated Fleet for South Region',
      priority: 'High',
      relationshipStatus: 'Under Negotiation',
      lastInteractionDate: '2026-09-03',
      nextFollowupDate: '2026-09-06',
      remarks: 'Pricing revision requested in commercial negotiation round.',
      createdBy: 'Rajesh Patil',
      lastUpdated: '2026-09-03',
      status: 'Active'
    },
    {
      id: 'CLT-1004',
      name: 'Prime Healthcare Solutions',
      company: 'Prime Hospitals & Labs Network',
      businessGroup: 'Prime Care Alliance',
      segment: 'Last Mile Delivery',
      industry: 'Healthcare & Pharma',
      location: 'Hyderabad, Telangana',
      website: 'www.primehealth.demo',
      clientType: 'Existing',
      contactPerson: 'Dr. Srinivas Rao',
      designation: 'Chief Logistics Officer',
      mobile: '+91 98480 12345',
      email: 'srao@primehealth.demo',
      leadSource: 'Trade Show / Corporate Expo',
      bdOwner: 'Devika Pangam',
      dateAdded: '2026-06-10',
      existingBusiness: 'Yes',
      existingServices: 'Diagnostic sample delivery in 3 cities',
      potentialServices: 'Pan-South distribution network',
      priority: 'Medium',
      relationshipStatus: 'Good Standing',
      lastInteractionDate: '2026-08-28',
      nextFollowupDate: '2026-09-10',
      remarks: 'Won Phase 1 contract, reviewing Phase 2 expansion.',
      createdBy: 'Devika Pangam',
      lastUpdated: '2026-08-28',
      status: 'Active'
    },
    {
      id: 'CLT-1005',
      name: 'Metro Logistics Hub',
      company: 'Metro Hub Terminals Pvt Ltd',
      businessGroup: 'Metro Infrastructure',
      segment: 'Contract Logistics',
      industry: 'E-commerce & Logistics',
      location: 'Mumbai, Maharashtra',
      website: 'www.metrohub.demo',
      clientType: 'New',
      contactPerson: 'Amitabh Sen',
      designation: 'AVP - Business Operations',
      mobile: '+91 98200 99887',
      email: 'amitabh.s@metrohub.demo',
      leadSource: 'Inbound Website Enquiry',
      bdOwner: 'Suresh Joshi',
      dateAdded: '2026-08-18',
      existingBusiness: 'No',
      existingServices: 'None',
      potentialServices: 'Yard Management & Cross-docking',
      priority: 'Medium',
      relationshipStatus: 'Proposal Review',
      lastInteractionDate: '2026-09-01',
      nextFollowupDate: '2026-09-09',
      remarks: 'Detailed RFP submitted. Final shortlisted presentation next week.',
      createdBy: 'Suresh Joshi',
      lastUpdated: '2026-09-01',
      status: 'Active'
    },
    {
      id: 'CLT-1006',
      name: 'Sunrise Industries',
      company: 'Sunrise Solar & CleanTech',
      businessGroup: 'Sunrise Energy',
      segment: 'Fleet Management',
      industry: 'Manufacturing & Heavy Industry',
      location: 'Ahmedabad, Gujarat',
      website: 'www.sunriseenergy.demo',
      clientType: 'New',
      contactPerson: 'Bhavin Patel',
      designation: 'General Manager - Admin',
      mobile: '+91 98980 44321',
      email: 'bhavin.p@sunriseenergy.demo',
      leadSource: 'LinkedIn BD Campaign',
      bdOwner: 'Aditya Patil',
      dateAdded: '2026-08-22',
      existingBusiness: 'No',
      existingServices: 'None',
      potentialServices: 'Solar site staff transit fleet (20 tempo travellers)',
      priority: 'Medium',
      relationshipStatus: 'Requirement Discussion',
      lastInteractionDate: '2026-08-30',
      nextFollowupDate: '2026-09-06',
      remarks: 'Route survey completed. Preparing commercial quote.',
      createdBy: 'Aditya Patil',
      lastUpdated: '2026-08-30',
      status: 'Active'
    },
    {
      id: 'CLT-1007',
      name: 'Apex Tech Solutions',
      company: 'Apex Technologies India Ltd',
      businessGroup: 'Apex Global IT',
      segment: 'Corporate Travel',
      industry: 'Information Technology & ITES',
      location: 'Bengaluru, Karnataka',
      website: 'www.apextech.demo',
      clientType: 'Existing',
      contactPerson: 'Deepa Narayan',
      designation: 'VP - Facilities & Real Estate',
      mobile: '+91 99000 77123',
      email: 'deepa.n@apextech.demo',
      leadSource: 'Referral / Existing Client',
      bdOwner: 'Pooja Kulkarni',
      dateAdded: '2025-09-12',
      existingBusiness: 'Yes',
      existingServices: 'Executive Cab Service (30 Cabs)',
      potentialServices: 'Shift transportation for 2000 tech employees',
      priority: 'High',
      relationshipStatus: 'Won Recent RFP',
      lastInteractionDate: '2026-09-02',
      nextFollowupDate: '2026-09-15',
      remarks: 'Won new contract worth 1.44 Cr annual value. Mobilization in progress.',
      createdBy: 'Pooja Kulkarni',
      lastUpdated: '2026-09-02',
      status: 'Active'
    },
    {
      id: 'CLT-1008',
      name: 'Zenith Retail Warehousing',
      company: 'Zenith Hypermarket Logistics',
      businessGroup: 'Zenith Retail',
      segment: 'Warehouse Logistics',
      industry: 'FMCG & Retail',
      location: 'Chennai, Tamil Nadu',
      website: 'www.zenithretail.demo',
      clientType: 'New',
      contactPerson: 'Karthik Subramanian',
      designation: 'Regional Supply Chain Head',
      mobile: '+91 98401 55667',
      email: 'karthik.s@zenithretail.demo',
      leadSource: 'Tender / RFP Portal',
      bdOwner: 'Rajesh Patil',
      dateAdded: '2026-07-10',
      existingBusiness: 'No',
      existingServices: 'None',
      potentialServices: 'Automated Sorting & Distribution Centre',
      priority: 'Low',
      relationshipStatus: 'Lost to Competitor',
      lastInteractionDate: '2026-08-25',
      nextFollowupDate: '2026-11-01',
      remarks: 'Lost on price margin. To re-engage in Q4 for secondary hub.',
      createdBy: 'Rajesh Patil',
      lastUpdated: '2026-08-25',
      status: 'Active'
    }
  ],

  opportunities: [
    {
      id: 'OPP-2026-001',
      clientId: 'CLT-1001',
      clientName: 'ABC Manufacturing Ltd',
      contactPerson: 'Rajesh Kulkarni',
      segment: 'Employee Transportation',
      title: 'Chakan Plant EV Bus Employee Transport',
      description: 'Shift employee shuttle service with 12 electric 32-seater AC buses on 3 shifts.',
      product: 'Electric Bus Staff Commute',
      leadSource: 'Referral / Existing Client',
      leadDate: '2026-08-01',
      bdOwner: 'Aditya Patil',
      estimatedValue: 18000000, // 1.80 Cr (Annual)
      monthlyValue: 1500000,    // 15 Lakhs
      annualValue: 18000000,
      expectedClosureDate: '2026-09-25',
      probability: 80,
      stage: 'Commercial Negotiation',
      status: 'In Process',
      lastActivityDate: '2026-09-04',
      nextAction: 'Submit revised per-km power escalation model to Procurement',
      nextFollowupDate: '2026-09-08',
      competitor: 'Starline Transporters',
      commercialShared: 'Yes',
      proposalShared: 'Yes',
      proposalDate: '2026-08-20',
      clientReviewStatus: 'Commercial Under Review',
      negotiationStatus: 'Round 2 Pricing Discussions',
      managementApprovalRequired: 'Yes',
      managementApprovalStatus: 'Approved',
      remarks: 'Management gave special margin approval. High closing chance before Sep 30.'
    },
    {
      id: 'OPP-2026-002',
      clientId: 'CLT-1002',
      clientName: 'XYZ Automotive Components',
      contactPerson: 'Harsh Vardhan',
      segment: 'Warehouse Logistics',
      title: 'Manesar Central Spares Hub 3PL Operations',
      description: 'End-to-end 3PL warehouse operations, inventory tracking, pallet racks & dispatch.',
      product: '3PL Dedicated Warehousing',
      leadSource: 'Management Reference',
      leadDate: '2026-07-22',
      bdOwner: 'Pooja Kulkarni',
      estimatedValue: 24000000, // 2.4 Cr
      monthlyValue: 2000000,
      annualValue: 24000000,
      expectedClosureDate: '2026-09-18',
      probability: 70,
      stage: 'Client Review',
      status: 'In Process',
      lastActivityDate: '2026-09-05',
      nextAction: 'Facility site inspection with client VP Supply Chain',
      nextFollowupDate: '2026-09-07',
      competitor: 'Pinnacle Logistics',
      commercialShared: 'Yes',
      proposalShared: 'Yes',
      proposalDate: '2026-08-15',
      clientReviewStatus: 'Pending Legal & Tech Clearance',
      negotiationStatus: 'Proposal Submitted',
      managementApprovalRequired: 'Yes',
      managementApprovalStatus: 'Approved',
      remarks: 'Strategic account. Operations team ready with space layout plan.'
    },
    {
      id: 'OPP-2026-003',
      clientId: 'CLT-1003',
      clientName: 'Global Foods & Beverages',
      contactPerson: 'Meera Deshmukh',
      segment: 'Cold Chain Logistics',
      title: 'Reefer Truck Secondary Distribution South',
      description: 'Dedicated fleet of 18 temperature-controlled refrigerated 20ft container trucks.',
      product: 'Reefer Freight Distribution',
      leadSource: 'Direct Outreach / Cold BD',
      leadDate: '2026-08-08',
      bdOwner: 'Rajesh Patil',
      estimatedValue: 14400000, // 1.44 Cr
      monthlyValue: 1200000,
      annualValue: 14400000,
      expectedClosureDate: '2026-09-20',
      probability: 75,
      stage: 'Final Discussion',
      status: 'In Process',
      lastActivityDate: '2026-09-03',
      nextAction: 'Final commercial sign-off meeting with MD & Procurement',
      nextFollowupDate: '2026-09-06',
      competitor: 'Snowman Logistics',
      commercialShared: 'Yes',
      proposalShared: 'Yes',
      proposalDate: '2026-08-25',
      clientReviewStatus: 'Commercial Accepted, SLA Verification',
      negotiationStatus: 'Final Terms Agreed',
      managementApprovalRequired: 'Yes',
      managementApprovalStatus: 'Approved',
      remarks: 'SLA drafted. Awaiting confirmation on contract duration (2 yrs).'
    },
    {
      id: 'OPP-2026-004',
      clientId: 'CLT-1004',
      clientName: 'Prime Healthcare Solutions',
      contactPerson: 'Dr. Srinivas Rao',
      segment: 'Last Mile Delivery',
      title: 'Lab Sample Express Courier - Phase 2 Expansion',
      description: 'Scheduled multi-point temperature-controlled sample pickups across 80 clinics.',
      product: 'Express Diagnostic Logistics',
      leadSource: 'Trade Show / Corporate Expo',
      leadDate: '2026-08-12',
      bdOwner: 'Devika Pangam',
      estimatedValue: 7200000, // 72 Lakhs
      monthlyValue: 600000,
      annualValue: 7200000,
      expectedClosureDate: '2026-10-15',
      probability: 65,
      stage: 'Proposal / Commercial Shared',
      status: 'In Process',
      lastActivityDate: '2026-08-28',
      nextAction: 'Schedule proposal presentation with Medical Director',
      nextFollowupDate: '2026-09-10',
      competitor: 'MedExpress',
      commercialShared: 'Yes',
      proposalShared: 'Yes',
      proposalDate: '2026-08-28',
      clientReviewStatus: 'Awaiting Client Review',
      negotiationStatus: 'Initial Proposal Shared',
      managementApprovalRequired: 'No',
      managementApprovalStatus: 'Not Required',
      remarks: 'Client expanding to 3 new districts in Telangana.'
    },
    {
      id: 'OPP-2026-005',
      clientId: 'CLT-1005',
      clientName: 'Metro Logistics Hub',
      contactPerson: 'Amitabh Sen',
      segment: 'Contract Logistics',
      title: 'Bhiwandi Hub Cross-Docking & Yard Operations',
      description: '24x7 Yard management, dock scheduling, container stuffing and destuffing.',
      product: 'Hub & Yard Management',
      leadSource: 'Inbound Website Enquiry',
      leadDate: '2026-08-20',
      bdOwner: 'Suresh Joshi',
      estimatedValue: 12000000, // 1.2 Cr
      monthlyValue: 1000000,
      annualValue: 12000000,
      expectedClosureDate: '2026-09-30',
      probability: 50,
      stage: 'Internal Approval Pending',
      status: 'In Process',
      lastActivityDate: '2026-09-01',
      nextAction: 'Obtain COO & Finance sign-off on manpower costing model',
      nextFollowupDate: '2026-09-09',
      competitor: 'Western Freight',
      commercialShared: 'No',
      proposalShared: 'No',
      proposalDate: '',
      clientReviewStatus: 'RFP Submitted, Tech Demo Done',
      negotiationStatus: 'Not Started',
      managementApprovalRequired: 'Yes',
      managementApprovalStatus: 'Pending',
      remarks: 'Internal approval needed on weekend shift manpower premiums.'
    },
    {
      id: 'OPP-2026-006',
      clientId: 'CLT-1006',
      clientName: 'Sunrise Industries',
      contactPerson: 'Bhavin Patel',
      segment: 'Fleet Management',
      title: 'Sanand Solar Park Employee Commute (20 Tempo)',
      description: 'Daily transportation for 300 technicians to remote solar project site.',
      product: 'Specialized Rural Commute Fleet',
      leadSource: 'LinkedIn BD Campaign',
      leadDate: '2026-08-24',
      bdOwner: 'Aditya Patil',
      estimatedValue: 9600000, // 96 Lakhs
      monthlyValue: 800000,
      annualValue: 9600000,
      expectedClosureDate: '2026-10-10',
      probability: 30,
      stage: 'Requirement Discussion',
      status: 'Open',
      lastActivityDate: '2026-08-30',
      nextAction: 'Conduct detailed route survey and toll analysis',
      nextFollowupDate: '2026-09-06',
      competitor: 'Gujarat Local Fleet Owners',
      commercialShared: 'No',
      proposalShared: 'No',
      proposalDate: '',
      clientReviewStatus: 'Requirement Gathering',
      negotiationStatus: 'Not Started',
      managementApprovalRequired: 'No',
      managementApprovalStatus: 'Not Required',
      remarks: 'Site is 45km from nearest town; fuel logistics must be factored.'
    },
    {
      id: 'OPP-2026-007',
      clientId: 'CLT-1007',
      clientName: 'Apex Tech Solutions',
      contactPerson: 'Deepa Narayan',
      segment: 'Corporate Travel',
      title: 'Electronic City Tech Campus Shift Fleet',
      description: 'Contract for 25 AC Tempo Travellers + 15 Sedans for nocturnal software team shifts.',
      product: 'Corporate Shift Transportation',
      leadSource: 'Referral / Existing Client',
      leadDate: '2026-07-05',
      bdOwner: 'Pooja Kulkarni',
      estimatedValue: 14400000, // 1.44 Cr
      monthlyValue: 1200000,
      annualValue: 14400000,
      expectedClosureDate: '2026-09-01',
      probability: 100,
      stage: 'Won',
      status: 'Won',
      lastActivityDate: '2026-09-02',
      nextAction: 'Deployment of GPS & safety panic buttons in vehicles',
      nextFollowupDate: '2026-09-15',
      competitor: 'Ola Corporate / Uber Business',
      commercialShared: 'Yes',
      proposalShared: 'Yes',
      proposalDate: '2026-07-28',
      clientReviewStatus: 'Contract Executed',
      negotiationStatus: 'Finalized & Signed',
      managementApprovalRequired: 'Yes',
      managementApprovalStatus: 'Approved',
      wonDate: '2026-09-01',
      finalContractValue: 14400000,
      remarks: 'Master agreement signed for 24 months. Fleet onboarding initiated.'
    },
    {
      id: 'OPP-2026-008',
      clientId: 'CLT-1008',
      clientName: 'Zenith Retail Warehousing',
      contactPerson: 'Karthik Subramanian',
      segment: 'Warehouse Logistics',
      industry: 'FMCG & Retail',
      title: 'Sriperumbudur FMCG Fulfillment Hub 80K Sqft',
      description: 'Complete warehousing and pallet storage for festive inventory surge.',
      product: '3PL Fulfillment Hub',
      leadSource: 'Tender / RFP Portal',
      leadDate: '2026-07-12',
      bdOwner: 'Rajesh Patil',
      estimatedValue: 19200000, // 1.92 Cr
      monthlyValue: 1600000,
      annualValue: 19200000,
      expectedClosureDate: '2026-08-25',
      probability: 0,
      stage: 'Lost',
      status: 'Lost',
      lastActivityDate: '2026-08-25',
      nextAction: 'Touch base with procurement in Q4 for secondary warehouse',
      nextFollowupDate: '2026-11-01',
      competitor: 'TVS Supply Chain',
      commercialShared: 'Yes',
      proposalShared: 'Yes',
      proposalDate: '2026-08-01',
      clientReviewStatus: 'RFP Awarded to Competitor',
      negotiationStatus: 'Failed on Price',
      managementApprovalRequired: 'Yes',
      managementApprovalStatus: 'Approved',
      lostDate: '2026-08-25',
      lostReason: 'Price Issue',
      competitorWon: 'TVS Supply Chain',
      remarks: 'Competitor undercut by 11% using un-racked storage configuration.'
    }
  ],

  activities: [
    {
      id: 'ACT-5001',
      date: '2026-09-05',
      clientId: 'CLT-1002',
      clientName: 'XYZ Automotive Components',
      oppId: 'OPP-2026-002',
      activityType: 'Physical Meeting',
      contactPerson: 'Harsh Vardhan',
      bdMember: 'Pooja Kulkarni',
      purpose: 'Technical Proposal Walkthrough & Layout Review',
      summary: 'Presented our 3D warehouse layout, racking capacity calculations, and WMS software integration capabilities.',
      clientRequirement: 'Client requested guaranteed 4-hour dispatch turnaround for emergency spare parts.',
      commercialDiscussion: 'Reviewed standard monthly management fee + throughput charges model.',
      outcome: 'Technical team thoroughly convinced. Scheduled facility site visit.',
      clientCommitment: 'VP Supply Chain will participate in site visit on 7th Sept.',
      bdCommitment: 'Provide emergency turnaround SOP by 6th Sept evening.',
      nextAction: 'Conduct Gurugram warehouse site walk with Harsh & VP',
      nextActionOwner: 'Pooja Kulkarni',
      nextFollowupDate: '2026-09-07',
      status: 'Completed',
      remarks: 'High potential of closure by end of month.',
      attachment: 'XYZ_Warehouse_Layout_v3.pdf'
    },
    {
      id: 'ACT-5002',
      date: '2026-09-04',
      clientId: 'CLT-1001',
      clientName: 'ABC Manufacturing Ltd',
      oppId: 'OPP-2026-001',
      activityType: 'Commercial Discussion',
      contactPerson: 'Rajesh Kulkarni',
      bdMember: 'Aditya Patil',
      purpose: 'Commercial Negotiation on EV Bus Charging Costs',
      summary: 'Discussed capital expense amortization of fast charging stations vs per-km tariff models.',
      clientRequirement: 'Client requested capping of electricity tariff escalations to State DISCOM rates.',
      commercialDiscussion: 'Agreed on ₹78/km base rate with quarterly power cost true-up.',
      outcome: 'Clause agreed in principle; updated draft to be sent to legal/procurement.',
      clientCommitment: 'Legal review will clear within 3 working days once revised clause is shared.',
      bdCommitment: 'Send revised commercial annexure by Monday morning.',
      nextAction: 'Submit revised per-km power escalation model to Rajesh',
      nextActionOwner: 'Aditya Patil',
      nextFollowupDate: '2026-09-08',
      status: 'Completed',
      remarks: 'Crucial step towards final contract signing.',
      attachment: 'ABC_EV_Commercial_Annexure_B.docx'
    },
    {
      id: 'ACT-5003',
      date: '2026-09-03',
      clientId: 'CLT-1003',
      clientName: 'Global Foods & Beverages',
      oppId: 'OPP-2026-003',
      activityType: 'Negotiation',
      contactPerson: 'Meera Deshmukh',
      bdMember: 'Rajesh Patil',
      purpose: 'Final Price Discount & SLA Penalties Discussion',
      summary: 'Negotiated temp variation penalty clauses and insurance liability limits for frozen meat consignment transit.',
      clientRequirement: 'Client insisted on IoT live temp data stream access via API to their ERP.',
      commercialDiscussion: 'Agreed to waive software API integration fee in exchange for a 2-year firm contract.',
      outcome: 'Commercial terms frozen. Preparing final contract agreement.',
      clientCommitment: 'Will send standard vendor agreement template for sign-off.',
      bdCommitment: 'Provide vehicle calibration certificates & telematics API specs.',
      nextAction: 'Final commercial sign-off meeting with MD & Procurement',
      nextActionOwner: 'Rajesh Patil',
      nextFollowupDate: '2026-09-06',
      status: 'Completed',
      remarks: 'Target closing before 20th September.',
      attachment: 'ColdChain_SLA_Terms_Final.pdf'
    },
    {
      id: 'ACT-5004',
      date: '2026-09-02',
      clientId: 'CLT-1007',
      clientName: 'Apex Tech Solutions',
      oppId: 'OPP-2026-007',
      activityType: 'Physical Meeting',
      contactPerson: 'Deepa Narayan',
      bdMember: 'Pooja Kulkarni',
      purpose: 'Contract Handover & Onboarding Kickoff',
      summary: 'Handed over signed master service agreement and scheduled driver verification camp.',
      clientRequirement: 'Ensure 100% police background verified drivers with female escort security guards for midnight shifts.',
      commercialDiscussion: 'Monthly billing cycle agreed on 30-day credit terms.',
      outcome: 'Contract execution complete. Handover done to Operations Team.',
      clientCommitment: 'Issue security access passes for our dispatch supervisors.',
      bdCommitment: 'Deploy 40 vehicles with GPS tracking by Sept 15.',
      nextAction: 'Deployment of GPS & safety panic buttons in vehicles',
      nextActionOwner: 'Pooja Kulkarni',
      nextFollowupDate: '2026-09-15',
      status: 'Completed',
      remarks: 'Won Deal celebration in monthly review!',
      attachment: 'Apex_Signed_MSA_2026.pdf'
    },
    {
      id: 'ACT-5005',
      date: '2026-09-01',
      clientId: 'CLT-1005',
      clientName: 'Metro Logistics Hub',
      oppId: 'OPP-2026-005',
      activityType: 'Video Meeting',
      contactPerson: 'Amitabh Sen',
      bdMember: 'Suresh Joshi',
      purpose: 'RFP Technical Clarifications & SLA Metrics',
      summary: 'Clarified container turnaround time definitions and crane operator shift schedules.',
      clientRequirement: '24x7 supervisor presence required on dock gates.',
      commercialDiscussion: 'Discussed high weekend overtime wage requirements.',
      outcome: 'Awaiting internal management approval on wage overheads before quoting.',
      clientCommitment: 'Will keep window open until 10th Sept for revised bid.',
      bdCommitment: 'Submit revised commercial bid by 9th Sept.',
      nextAction: 'Obtain COO & Finance sign-off on manpower costing model',
      nextActionOwner: 'Suresh Joshi',
      nextFollowupDate: '2026-09-09',
      status: 'In Process',
      remarks: 'Internal coordination logged in Tab 6.',
      attachment: 'Metro_RFP_Clarifications.pdf'
    },
    {
      id: 'ACT-5006',
      date: '2026-08-30',
      clientId: 'CLT-1006',
      clientName: 'Sunrise Industries',
      oppId: 'OPP-2026-006',
      activityType: 'Client Visit',
      contactPerson: 'Bhavin Patel',
      bdMember: 'Aditya Patil',
      purpose: 'Site Visit & Route Feasibility Study',
      summary: 'Inspected pick-up nodes in Sanand and Viramgam for technician transport.',
      clientRequirement: 'Punctual 7:30 AM arrival at solar facility regardless of monsoon road conditions.',
      commercialDiscussion: 'Preliminary discussions around ₹48,000/vehicle/month pricing benchmark.',
      outcome: 'Route mapped. Route survey report drafted.',
      clientCommitment: 'Provide final employee headcount by residential clusters.',
      bdCommitment: 'Share formal commercial proposal with route schedule.',
      nextAction: 'Conduct detailed route survey and toll analysis',
      nextActionOwner: 'Aditya Patil',
      nextFollowupDate: '2026-09-06',
      status: 'In Process',
      remarks: 'Good initial chemistry with Admin Head.',
      attachment: 'Sanand_Route_Survey_Map.pdf'
    }
  ],

  internalActivities: [
    {
      id: 'INT-3001',
      date: '2026-09-05',
      category: 'Pricing discussion',
      description: 'Cost modeling for emergency 4-hr dispatch turnaround for XYZ Auto spare parts.',
      clientId: 'CLT-1002',
      clientName: 'XYZ Automotive Components',
      oppId: 'OPP-2026-002',
      teamMember: 'Pooja Kulkarni',
      department: 'Operations',
      personCoordinated: 'Manish Rawat (VP - Operations)',
      purpose: 'Determine manpower & dedicated runner vehicle cost for emergency dispatch SLA.',
      actionTaken: 'Simulated 3 dedicated dispatch runners with 2 shifts. Estimated additional cost of ₹85,000/month.',
      approvalRequired: 'Yes',
      approvalFrom: 'Management',
      approvalStatus: 'Approved',
      approvalDate: '2026-09-05',
      output: 'Included ₹1,10,000/month emergency dispatch rider in commercial proposal.',
      nextAction: 'Incorporate into client proposal deck',
      nextActionDate: '2026-09-06',
      status: 'Completed',
      remarks: 'Management approved 25% gross margin on the emergency addon.',
      attachment: 'XYZ_Manpower_Costing_Matrix.xlsx'
    },
    {
      id: 'INT-3002',
      date: '2026-09-04',
      category: 'Commercial approval',
      description: 'Special electricity escalation capping approval for ABC Manufacturing EV contract.',
      clientId: 'CLT-1001',
      clientName: 'ABC Manufacturing Ltd',
      oppId: 'OPP-2026-001',
      teamMember: 'Aditya Patil',
      department: 'Finance & Accounts',
      personCoordinated: 'Sunil Mehta (CFO)',
      purpose: 'Approval to link energy surcharge directly to State DISCOM industrial power tariff.',
      actionTaken: 'Calculated financial risk exposure under 10% power hike scenario. CFO confirmed low risk with 3-year term.',
      approvalRequired: 'Yes',
      approvalFrom: 'Management',
      approvalStatus: 'Approved',
      approvalDate: '2026-09-04',
      output: 'Formal CFO sign-off email obtained.',
      nextAction: 'Update contract annexure',
      nextActionDate: '2026-09-05',
      status: 'Completed',
      remarks: 'Risk capped to maximum 5% operational variance.',
      attachment: 'CFO_Approval_ABC_EV.pdf'
    },
    {
      id: 'INT-3003',
      date: '2026-09-03',
      category: 'Operations coordination',
      description: 'Fleet availability check for 18 Reefer Trucks for Global Foods South expansion.',
      clientId: 'CLT-1003',
      clientName: 'Global Foods & Beverages',
      oppId: 'OPP-2026-003',
      teamMember: 'Rajesh Patil',
      department: 'Fleet / Asset Management',
      personCoordinated: 'Kishore Jha (Fleet Head)',
      purpose: 'Verify vehicle delivery timelines from OEM for 18 refrigerated chassis.',
      actionTaken: 'Fleet team confirmed 10 vehicles ready in Bangalore depot, 8 to be delivered by Oct 5th from OEM.',
      approvalRequired: 'No',
      approvalFrom: 'Operations',
      approvalStatus: 'Approved',
      approvalDate: '2026-09-03',
      output: 'Phased rollout plan (10 in Sept, 8 in Oct) created.',
      nextAction: 'Share phased rollout schedule with client procurement',
      nextActionDate: '2026-09-06',
      status: 'Completed',
      remarks: 'Prevents contractual delay penalty by aligning rollout in two phases.',
      attachment: 'Reefer_Chassis_Availability.pdf'
    },
    {
      id: 'INT-3004',
      date: '2026-09-02',
      category: 'Pricing discussion',
      description: 'Weekend overtime & 24x7 shift cost evaluation for Metro Logistics Bhiwandi Hub.',
      clientId: 'CLT-1005',
      clientName: 'Metro Logistics Hub',
      oppId: 'OPP-2026-005',
      teamMember: 'Suresh Joshi',
      department: 'Operations',
      personCoordinated: 'Manish Rawat & Finance Team',
      purpose: 'Finalize minimum billing rate per container move with 24x7 dock labor.',
      actionTaken: 'Drafted 3-tier pricing model: regular hours, overtime, weekend surge. Pending Director approval.',
      approvalRequired: 'Yes',
      approvalFrom: 'Management',
      approvalStatus: 'Pending',
      approvalDate: '',
      output: 'Cost sheet submitted to Managing Director for review.',
      nextAction: 'Follow up with MD in Monday operational review',
      nextActionDate: '2026-09-08',
      status: 'Pending Approval',
      remarks: 'Critical blocker for sharing commercial proposal with client.',
      attachment: 'Metro_Bhiwandi_Costing_Draft.xlsx'
    },
    {
      id: 'INT-3005',
      date: '2026-08-31',
      category: 'Legal review',
      description: 'Contract terms and indemnification clause review for Apex Tech Solutions MSA.',
      clientId: 'CLT-1007',
      clientName: 'Apex Tech Solutions',
      oppId: 'OPP-2026-007',
      teamMember: 'Pooja Kulkarni',
      department: 'Legal & Compliance',
      personCoordinated: 'Adv. Preeti Chawla (Legal Head)',
      purpose: 'Review data privacy, employee safety liability & 30-day payment term clauses.',
      actionTaken: 'Legal recommended mutual indemnification clause and standard insurance coverage caps.',
      approvalRequired: 'Yes',
      approvalFrom: 'Management',
      approvalStatus: 'Approved',
      approvalDate: '2026-08-31',
      output: 'Approved Master Agreement document returned for execution.',
      nextAction: 'Print and send for client signatures',
      nextActionDate: '2026-09-01',
      status: 'Completed',
      remarks: 'Clean legal signoff enabled deal closure on Sept 1st.',
      attachment: 'Legal_Approval_Apex_Tech.pdf'
    },
    {
      id: 'INT-3006',
      date: '2026-09-02',
      category: 'Commercial approval',
      description: 'Discounted per-km tariff approval request for Sunrise Industries Solar Fleet.',
      clientId: 'CLT-1006',
      clientName: 'Sunrise Industries',
      oppId: 'OPP-2026-006',
      teamMember: 'Aditya Patil',
      department: 'Pricing & Commercials',
      personCoordinated: 'Sunil Mehta (CFO)',
      purpose: 'Request 14% tariff discount to beat local Gujarat unorganized fleet competitors.',
      actionTaken: 'Calculated margin impact. Proposed discount brings gross margin below company threshold of 18%.',
      approvalRequired: 'Yes',
      approvalFrom: 'Management',
      approvalStatus: 'Rejected',
      rejectionReason: 'Unapproved margin erosion. Minimum acceptable gross margin is 18%. Require revised fuel escalation clause instead of flat discount.',
      rejectedDate: '2026-09-02',
      output: 'Returned to BD Executive for pricing model recalculation.',
      nextAction: 'Re-calculate pricing model with power escalation cap',
      nextActionDate: '2026-09-06',
      status: 'Rejected',
      remarks: 'Revise pricing proposal deck before re-submitting for CFO sign-off.'
    }
  ],

  segments: [
    { id: 'SEG-01', name: 'Employee Transportation', code: 'ET-LOG', description: 'Corporate employee commute, cab fleet operations, shuttle buses and green EV transport.', head: 'Aditya Patil', targetRevenue: 120000000, status: 'Active', dateAdded: '2026-01-10' },
    { id: 'SEG-02', name: 'Warehouse Logistics', code: 'WH-LOG', description: 'Grade-A dedicated warehousing, multi-client distribution centers, WMS software and inventory management.', head: 'Pooja Kulkarni', targetRevenue: 100000000, status: 'Active', dateAdded: '2026-01-12' },
    { id: 'SEG-03', name: 'Fleet Management', code: 'FL-MGT', description: 'Enterprise fleet leasing, telematics, maintenance, fuel management and dedicated corporate drivers.', head: 'Devika Pangam', targetRevenue: 80000000, status: 'Active', dateAdded: '2026-01-15' },
    { id: 'SEG-04', name: 'Contract Logistics', code: 'CT-LOG', description: 'End-to-end 3PL / 4PL long-term contracts, supply chain planning, multimodal transport and packaging.', head: 'Suresh Joshi', targetRevenue: 90000000, status: 'Active', dateAdded: '2026-01-20' },
    { id: 'SEG-05', name: 'Corporate Travel', code: 'CP-TRV', description: 'Executive VIP travel, airport transfers, corporate event logistics and spot luxury car rentals.', head: 'Aditya Patil', targetRevenue: 50000000, status: 'Active', dateAdded: '2026-02-01' },
    { id: 'SEG-06', name: 'Supply Chain Solutions', code: 'SC-SOL', description: 'Consulting, network optimization, freight forwarding, customs clearance and port handling.', head: 'Rajesh Patil', targetRevenue: 110000000, status: 'Active', dateAdded: '2026-02-05' },
    { id: 'SEG-07', name: 'Last Mile Delivery', code: 'LM-DEL', description: 'E-commerce intracity delivery, hyper-local courier, dark store dispatches and return logistics.', head: 'Devika Pangam', targetRevenue: 60000000, status: 'Active', dateAdded: '2026-02-10' },
    { id: 'SEG-08', name: 'Cold Chain Logistics', code: 'CC-LOG', description: 'Temperature-controlled reefer trucks, cold storage, perishable pharma & food distribution.', head: 'Rajesh Patil', targetRevenue: 75000000, status: 'Active', dateAdded: '2026-02-15' }
  ],

  teamMembers: [
    { id: 'BD-01', name: 'Aditya Patil', title: 'Senior BD Manager', email: 'aditya.patil@rajmudragroup.com', phone: '+91 98201 22334', region: 'North Region', segment: 'Employee Transportation', target: 50000000, dateAdded: '2026-01-15', status: 'Active' },
    { id: 'BD-02', name: 'Pooja Kulkarni', title: 'BD Lead - Enterprise', email: 'pooja.kulkarni@rajmudragroup.com', phone: '+91 98110 44556', region: 'West Region', segment: 'Warehouse Logistics', target: 60000000, dateAdded: '2026-01-20', status: 'Active' },
    { id: 'BD-03', name: 'Rajesh Patil', title: 'Key Accounts Director', email: 'rajesh.patil@rajmudragroup.com', phone: '+91 99300 77889', region: 'South Region', segment: 'Cold Chain Logistics', target: 80000000, dateAdded: '2026-02-01', status: 'Active' },
    { id: 'BD-04', name: 'Devika Pangam', title: 'BD Executive - North', email: 'devika.pangam@rajmudragroup.com', phone: '+91 98450 11223', region: 'North Region', segment: 'Last Mile Delivery', target: 35000000, dateAdded: '2026-02-10', status: 'Active' },
    { id: 'BD-05', name: 'Suresh Joshi', title: 'BD Executive - West', email: 'suresh.joshi@rajmudragroup.com', phone: '+91 98230 99001', region: 'West Region', segment: 'Contract Logistics', target: 40000000, dateAdded: '2026-02-20', status: 'Active' }
  ],

  users: [
    {
      id: 'USR-001',
      name: 'Devika Pangam',
      email: 'devika.p@rajmudragroup.com',
      role: 'System Administrator',
      status: 'Active',
      allowedTabs: [
        'tab-dashboard', 'tab-clients', 'tab-team', 'tab-segments',
        'tab-opportunities', 'tab-activities', 'tab-followups',
        'tab-internal', 'tab-review', 'tab-users'
      ],
      allowedSegments: ['All'],
      dateCreated: '2026-01-01',
      lastLogin: 'Today'
    },
    {
      id: 'USR-002',
      name: 'Aditya Patil',
      email: 'aditya.patil@rajmudragroup.com',
      role: 'BD Manager',
      status: 'Revoked',
      allowedTabs: [],
      allowedSegments: [],
      dateCreated: '2026-01-15',
      lastLogin: '2026-09-05'
    },
    {
      id: 'USR-003',
      name: 'Pooja Kulkarni',
      email: 'pooja.kulkarni@rajmudragroup.com',
      role: 'BD Executive',
      status: 'Revoked',
      allowedTabs: [],
      allowedSegments: [],
      dateCreated: '2026-01-20',
      lastLogin: '2026-09-05'
    },
    {
      id: 'USR-004',
      name: 'Rajesh Patil',
      email: 'rajesh.patil@rajmudragroup.com',
      role: 'BD Manager',
      status: 'Revoked',
      allowedTabs: [],
      allowedSegments: [],
      dateCreated: '2026-02-01',
      lastLogin: '2026-09-05'
    },
    {
      id: 'USR-005',
      name: 'Executive Board & Management',
      email: 'board.review@corpbd.com',
      role: 'Management Viewer',
      status: 'Revoked',
      allowedTabs: [],
      allowedSegments: [],
      dateCreated: '2026-01-01',
      lastLogin: '2026-09-04'
    }
  ],
  documents: [
    {
      id: 'DOC-101',
      name: 'ABC_EV_Commercial_Proposal_v2.pdf',
      type: 'Commercial Proposal PDF',
      size: 3450000,
      sizeFormatted: '3.45 MB',
      fileExt: 'pdf',
      clientId: 'CLT-1001',
      clientName: 'ABC Manufacturing Ltd',
      oppId: 'OPP-2026-001',
      activityId: 'ACT-5002',
      uploadDate: '2026-09-04',
      uploadedBy: 'Aditya Patil',
      notes: 'Official pricing annexure for 40 dedicated employee electric shuttle buses with power index true-up clause.',
      status: 'Active'
    },
    {
      id: 'DOC-102',
      name: 'ABC_EV_CFO_Email_Approval.pdf',
      type: 'Email Approval PDF',
      size: 1200000,
      sizeFormatted: '1.20 MB',
      fileExt: 'pdf',
      clientId: 'CLT-1001',
      clientName: 'ABC Manufacturing Ltd',
      oppId: 'OPP-2026-001',
      activityId: 'ACT-5002',
      uploadDate: '2026-09-04',
      uploadedBy: 'Aditya Patil',
      notes: 'Client CFO formal email confirmation on 3-year term & index-linked power tariffs.',
      status: 'Active'
    },
    {
      id: 'DOC-103',
      name: 'XYZ_3PL_Warehouse_Technical_Layout_v3.pdf',
      type: 'Technical Scope / Layout PDF',
      size: 5800000,
      sizeFormatted: '5.80 MB',
      fileExt: 'pdf',
      clientId: 'CLT-1002',
      clientName: 'XYZ Automotive Components',
      oppId: 'OPP-2026-002',
      activityId: 'ACT-5001',
      uploadDate: '2026-09-05',
      uploadedBy: 'Pooja Kulkarni',
      notes: '3D warehouse racking layouts and emergency spare parts 4-hour dispatch turnaround SLA.',
      status: 'Active'
    },
    {
      id: 'DOC-104',
      name: 'GlobalFoods_ColdChain_SLA_Agreement_Draft.pdf',
      type: 'Signed SLA / Master Contract',
      size: 2850000,
      sizeFormatted: '2.85 MB',
      fileExt: 'pdf',
      clientId: 'CLT-1003',
      clientName: 'Global Foods & Beverages',
      oppId: 'OPP-2026-003',
      activityId: 'ACT-5003',
      uploadDate: '2026-09-03',
      uploadedBy: 'Rajesh Patil',
      notes: 'Temperature logging IoT telematics specs and 2-year firm vendor agreement draft.',
      status: 'Active'
    },
    {
      id: 'DOC-105',
      name: 'ApexTech_Signed_MSA_Contract_2026.pdf',
      type: 'Signed SLA / Master Contract',
      size: 4100000,
      sizeFormatted: '4.10 MB',
      fileExt: 'pdf',
      clientId: 'CLT-1007',
      clientName: 'Apex Tech Solutions',
      oppId: 'OPP-2026-007',
      activityId: 'ACT-5004',
      uploadDate: '2026-09-02',
      uploadedBy: 'Pooja Kulkarni',
      notes: 'Signed Master Service Agreement and driver safety protocol clearance.',
      status: 'Active'
    },
    {
      id: 'DOC-106',
      name: 'MetroLogistics_Bhiwandi_Commercial_Quotation.pdf',
      type: 'Commercial Proposal PDF',
      size: 1950000,
      sizeFormatted: '1.95 MB',
      fileExt: 'pdf',
      clientId: 'CLT-1005',
      clientName: 'Metro Logistics Hub',
      oppId: 'OPP-2026-005',
      activityId: 'ACT-5005',
      uploadDate: '2026-09-01',
      uploadedBy: 'Suresh Joshi',
      notes: 'Revised container move quotes with 24x7 dock labor pricing matrix.',
      status: 'Active'
    },
    {
      id: 'DOC-107',
      name: 'PrimeHealthcare_Diagnostic_Express_RateCard.xlsx',
      type: 'Commercial Rate Card / Quotation',
      size: 850000,
      sizeFormatted: '850 KB',
      fileExt: 'xlsx',
      clientId: 'CLT-1004',
      clientName: 'Prime Healthcare Solutions',
      oppId: 'OPP-2026-004',
      activityId: '',
      uploadDate: '2026-08-28',
      uploadedBy: 'Devika Pangam',
      notes: 'Per-clinic pickup rate card across 80 diagnostic collection points in Telangana.',
      status: 'Active'
    },
    {
      id: 'DOC-108',
      name: 'TataMotors_EV_Proposal_Signed_Approval.pdf',
      type: 'Email Approval PDF',
      size: 2150000,
      sizeFormatted: '2.15 MB',
      fileExt: 'pdf',
      clientId: 'CLT-1006',
      clientName: 'Tata Motors PVBU',
      oppId: '',
      activityId: '',
      uploadDate: '2026-08-20',
      uploadedBy: 'Aditya Patil',
      notes: 'Procurement email approval for plant internal shuttles.',
      status: 'Active'
    }
  ],
  currentUserId: 'USR-001'
};

// Data Store Class with Reactive State & Auto-Calculations
class CRMDataStore {
  constructor() {
    this.MAX_DOCUMENT_SIZE = 8 * 1024 * 1024; // 8MB Limit (8,388,608 bytes)
    this.data = this.loadFromStorage();
    this.syncConfig();
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem(CRM_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!parsed.segments || !parsed.segments.length) {
          parsed.segments = JSON.parse(JSON.stringify(SEED_DATA.segments));
        }
        if (!parsed.teamMembers || !parsed.teamMembers.length) {
          parsed.teamMembers = JSON.parse(JSON.stringify(SEED_DATA.teamMembers));
        }
        if (!parsed.users || !parsed.users.length) {
          parsed.users = JSON.parse(JSON.stringify(SEED_DATA.users));
        }
        if (!parsed.documents || !parsed.documents.length) {
          parsed.documents = JSON.parse(JSON.stringify(SEED_DATA.documents));
        }
        if (!parsed.currentUserId) {
          parsed.currentUserId = 'USR-001';
        }
        return parsed;
      }
    } catch (e) {
      console.error('Failed to parse CRM storage, using initial seed data', e);
    }
    this.saveToStorage(SEED_DATA);
    return JSON.parse(JSON.stringify(SEED_DATA));
  }

  syncConfig() {
    if (this.data && this.data.segments) {
      CRM_CONFIG.segments = this.data.segments
        .filter(s => s.status === 'Active')
        .map(s => s.name);
    }
    if (this.data && this.data.teamMembers) {
      CRM_CONFIG.executives = this.data.teamMembers
        .filter(m => m.status === 'Active')
        .map(m => ({ name: m.name, title: m.title, email: m.email }));
    }
  }

  saveToStorage(data = this.data) {
    try {
      localStorage.setItem(CRM_STORAGE_KEY, JSON.stringify(data));
      this.syncConfig();
    } catch (e) {
      console.error('Failed to write to localStorage', e);
    }
  }

  resetToDefaults() {
    this.data = JSON.parse(JSON.stringify(SEED_DATA));
    this.saveToStorage();
    this.syncConfig();
    return this.data;
  }

  // --- Auto Calculation Utilities ---

  getDaysBetween(dateString1, dateString2 = new Date()) {
    if (!dateString1) return 0;
    const d1 = new Date(dateString1);
    const d2 = new Date(dateString2);
    const diffTime = d2.getTime() - d1.getTime();
    return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  }

  calculateWeightedValue(value, prob) {
    const v = parseFloat(value) || 0;
    const p = parseFloat(prob) || 0;
    return (v * p) / 100;
  }

  // --- Aggregated Metrics for Dashboard & Monthly Review ---
  getMetrics(filter = {}) {
    const opps = this.filterOpportunities(filter);
    const clients = this.filterClients(filter);
    const activities = this.filterActivities(filter);
    const internal = this.filterInternalActivities(filter);

    const totalClients = clients.length;
    const existingClients = clients.filter(c => c.clientType === 'Existing').length;
    const newClients = clients.filter(c => c.clientType === 'New').length;

    const totalActiveLeads = opps.filter(o => o.status === 'Open' || o.status === 'In Process').length;
    const newEnquiries = opps.filter(o => o.stage === 'New Enquiry').length;
    
    const commercialsShared = opps.filter(o => o.commercialShared === 'Yes').length;
    const proposalsUnderReview = opps.filter(o => o.stage === 'Client Review' || o.stage === 'Proposal / Commercial Shared').length;

    const wonOpps = opps.filter(o => o.status === 'Won');
    const lostOpps = opps.filter(o => o.status === 'Lost');
    const inProcessOpps = opps.filter(o => o.status === 'In Process' || o.status === 'Open');

    const totalPipelineValue = inProcessOpps.reduce((sum, o) => sum + (parseFloat(o.estimatedValue) || 0), 0);
    const wonBusinessValue = wonOpps.reduce((sum, o) => sum + (parseFloat(o.finalContractValue || o.estimatedValue) || 0), 0);
    const lostBusinessValue = lostOpps.reduce((sum, o) => sum + (parseFloat(o.estimatedValue) || 0), 0);
    const weightedPipelineValue = inProcessOpps.reduce((sum, o) => sum + this.calculateWeightedValue(o.estimatedValue, o.probability), 0);
    const totalPotentialValue = totalPipelineValue + wonBusinessValue;

    const totalDecided = wonOpps.length + lostOpps.length;
    const conversionRate = totalDecided > 0 ? ((wonOpps.length / totalDecided) * 100).toFixed(1) : '0.0';

    const meetingsConducted = activities.filter(a => a.activityType.includes('Meeting') || a.activityType.includes('Visit')).length;
    const callsCompleted = activities.filter(a => a.activityType.includes('Call') || a.activityType.includes('WhatsApp')).length;

    const todayStr = new Date().toISOString().split('T')[0];
    let followupsDue = 0;
    let followupsOverdue = 0;

    opps.forEach(o => {
      if (o.status !== 'Won' && o.status !== 'Lost' && o.nextFollowupDate) {
        if (o.nextFollowupDate < todayStr) followupsOverdue++;
        if (o.nextFollowupDate === todayStr) followupsDue++;
      }
    });

    const criticalAttention = [];
    inProcessOpps.forEach(o => {
      const daysSinceContact = this.getDaysBetween(o.lastActivityDate);
      if (daysSinceContact >= 7) {
        criticalAttention.push({
          type: 'Stalled Deal',
          severity: 'high',
          oppId: o.id,
          client: o.clientName,
          value: o.estimatedValue,
          owner: o.bdOwner,
          message: `No client engagement logged for ${daysSinceContact} days.`
        });
      }
      if (o.managementApprovalRequired === 'Yes' && o.managementApprovalStatus === 'Pending') {
        criticalAttention.push({
          type: 'Pending Approval',
          severity: 'urgent',
          oppId: o.id,
          client: o.clientName,
          value: o.estimatedValue,
          owner: o.bdOwner,
          message: 'Internal Management/Pricing approval pending.'
        });
      }
    });

    return {
      totalClients,
      existingClients,
      newClients,
      totalActiveLeads,
      newEnquiries,
      commercialsShared,
      proposalsUnderReview,
      followupsDue,
      followupsOverdue,
      meetingsConducted,
      callsCompleted,
      opportunitiesWon: wonOpps.length,
      opportunitiesLost: lostOpps.length,
      opportunitiesInProcess: inProcessOpps.length,
      totalPotentialBusinessValue: totalPotentialValue,
      wonBusinessValue,
      lostBusinessValue,
      pipelineValue: totalPipelineValue,
      weightedPipelineValue,
      conversionRate,
      criticalAttention,
      wonCount: wonOpps.length,
      lostCount: lostOpps.length,
      inProcessCount: inProcessOpps.length
    };
  }

  // --- Filtering Methods (Enhanced with RBAC Segment Permission Filter) ---

  filterClients(filters = {}) {
    return this.data.clients.filter(c => {
      if (!this.canAccessSegment(c.segment)) return false;

      if (filters.search) {
        const q = filters.search.toLowerCase();
        const match = c.name.toLowerCase().includes(q) ||
                      c.company.toLowerCase().includes(q) ||
                      c.contactPerson.toLowerCase().includes(q) ||
                      c.id.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filters.segment && c.segment !== filters.segment) return false;
      if (filters.clientType && c.clientType !== filters.clientType) return false;
      if (filters.priority && c.priority !== filters.priority) return false;
      if (filters.bdOwner && c.bdOwner !== filters.bdOwner) return false;
      if (filters.status && c.status !== filters.status) return false;
      return true;
    });
  }

  filterOpportunities(filters = {}) {
    return this.data.opportunities.filter(o => {
      if (!this.canAccessSegment(o.segment)) return false;

      if (filters.search) {
        const q = filters.search.toLowerCase();
        const match = o.title.toLowerCase().includes(q) ||
                      o.clientName.toLowerCase().includes(q) ||
                      o.id.toLowerCase().includes(q) ||
                      o.product.toLowerCase().includes(q) ||
                      o.bdOwner.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filters.clientId && o.clientId !== filters.clientId) return false;
      if (filters.segment && o.segment !== filters.segment) return false;
      if (filters.stage && o.stage !== filters.stage) return false;
      if (filters.status && o.status !== filters.status) return false;
      if (filters.bdOwner && o.bdOwner !== filters.bdOwner) return false;
      return true;
    });
  }

  filterActivities(filters = {}) {
    return this.data.activities.filter(a => {
      const client = this.data.clients.find(c => c.id === a.clientId);
      if (client && !this.canAccessSegment(client.segment)) return false;

      if (filters.search) {
        const q = filters.search.toLowerCase();
        const match = a.clientName.toLowerCase().includes(q) ||
                      a.purpose.toLowerCase().includes(q) ||
                      a.summary.toLowerCase().includes(q) ||
                      a.bdMember.toLowerCase().includes(q) ||
                      a.id.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filters.clientId && a.clientId !== filters.clientId) return false;
      if (filters.oppId && a.oppId !== filters.oppId) return false;
      if (filters.activityType && a.activityType !== filters.activityType) return false;
      if (filters.bdOwner && a.bdMember !== filters.bdOwner) return false;
      return true;
    });
  }

  filterInternalActivities(filters = {}) {
    return this.data.internalActivities.filter(i => {
      const client = this.data.clients.find(c => c.id === i.clientId);
      if (client && !this.canAccessSegment(client.segment)) return false;

      if (filters.search) {
        const q = filters.search.toLowerCase();
        const match = i.description.toLowerCase().includes(q) ||
                      i.clientName.toLowerCase().includes(q) ||
                      i.purpose.toLowerCase().includes(q) ||
                      i.teamMember.toLowerCase().includes(q) ||
                      i.id.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filters.clientId && i.clientId !== filters.clientId) return false;
      if (filters.category && i.category !== filters.category) return false;
      if (filters.department && i.department !== filters.department) return false;
      if (filters.approvalStatus && i.approvalStatus !== filters.approvalStatus) return false;
      return true;
    });
  }

  // --- CRUD Operations ---
  addClient(client) {
    const newId = `CLT-${1000 + this.data.clients.length + 1}`;
    const today = new Date().toISOString().split('T')[0];
    const newClient = {
      id: newId,
      dateAdded: today,
      lastUpdated: today,
      status: 'Active',
      ...client
    };
    this.data.clients.unshift(newClient);
    this.saveToStorage();
    return newClient;
  }

  updateClient(id, updates) {
    const idx = this.data.clients.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.data.clients[idx] = {
        ...this.data.clients[idx],
        ...updates,
        lastUpdated: new Date().toISOString().split('T')[0]
      };
      this.saveToStorage();
      return this.data.clients[idx];
    }
    return null;
  }

  deleteClient(id) {
    this.data.clients = this.data.clients.filter(c => c.id !== id);
    this.saveToStorage();
  }

  addOpportunity(opp) {
    const year = new Date().getFullYear();
    const count = String(this.data.opportunities.length + 1).padStart(3, '0');
    const newId = `OPP-${year}-${count}`;
    const today = new Date().toISOString().split('T')[0];

    const newOpp = {
      id: newId,
      leadDate: opp.leadDate || today,
      lastActivityDate: today,
      status: opp.status || 'In Process',
      stage: opp.stage || 'New Enquiry',
      probability: opp.probability !== undefined ? opp.probability : 20,
      ...opp
    };

    if (newOpp.nextFollowupDate) {
      this.updateClient(newOpp.clientId, { nextFollowupDate: newOpp.nextFollowupDate });
    }

    this.data.opportunities.unshift(newOpp);
    this.saveToStorage();
    return newOpp;
  }

  updateOpportunity(id, updates) {
    const idx = this.data.opportunities.findIndex(o => o.id === id);
    if (idx !== -1) {
      this.data.opportunities[idx] = {
        ...this.data.opportunities[idx],
        ...updates,
        lastActivityDate: new Date().toISOString().split('T')[0]
      };

      if (updates.status === 'Won') {
        this.data.opportunities[idx].stage = 'Won';
        this.data.opportunities[idx].probability = 100;
        if (!this.data.opportunities[idx].wonDate) {
          this.data.opportunities[idx].wonDate = new Date().toISOString().split('T')[0];
        }
      } else if (updates.status === 'Lost') {
        this.data.opportunities[idx].stage = 'Lost';
        this.data.opportunities[idx].probability = 0;
        if (!this.data.opportunities[idx].lostDate) {
          this.data.opportunities[idx].lostDate = new Date().toISOString().split('T')[0];
        }
      }

      this.saveToStorage();
      return this.data.opportunities[idx];
    }
    return null;
  }

  deleteOpportunity(id) {
    this.data.opportunities = this.data.opportunities.filter(o => o.id !== id);
    this.saveToStorage();
  }

  addActivity(activity) {
    const newId = `ACT-${5000 + this.data.activities.length + 1}`;
    const today = new Date().toISOString().split('T')[0];
    const newActivity = {
      id: newId,
      date: activity.date || today,
      status: activity.status || 'Completed',
      ...activity
    };

    this.data.activities.unshift(newActivity);

    if (newActivity.clientId) {
      const clientUpdates = { lastInteractionDate: newActivity.date };
      if (newActivity.nextFollowupDate) {
        clientUpdates.nextFollowupDate = newActivity.nextFollowupDate;
      }
      this.updateClient(newActivity.clientId, clientUpdates);
    }

    if (newActivity.oppId) {
      const oppUpdates = { lastActivityDate: newActivity.date };
      if (newActivity.nextAction) {
        oppUpdates.nextAction = newActivity.nextAction;
      }
      if (newActivity.nextFollowupDate) {
        oppUpdates.nextFollowupDate = newActivity.nextFollowupDate;
      }
      this.updateOpportunity(newActivity.oppId, oppUpdates);
    }

    this.saveToStorage();
    return newActivity;
  }

  addInternalActivity(item) {
    const newId = `INT-${3000 + this.data.internalActivities.length + 1}`;
    const today = new Date().toISOString().split('T')[0];
    const newInternal = {
      id: newId,
      date: item.date || today,
      status: item.status || 'Completed',
      ...item
    };

    this.data.internalActivities.unshift(newInternal);
    this.saveToStorage();
    return newInternal;
  }

  updateInternalActivity(id, updates) {
    const idx = this.data.internalActivities.findIndex(i => i.id === id);
    if (idx !== -1) {
      this.data.internalActivities[idx] = {
        ...this.data.internalActivities[idx],
        ...updates
      };
      this.saveToStorage();
      return this.data.internalActivities[idx];
    }
    return null;
  }

  deleteInternalActivity(id) {
    const idx = this.data.internalActivities.findIndex(i => i.id === id);
    if (idx !== -1) {
      this.data.internalActivities.splice(idx, 1);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  // --- BD Team & Account Owners Management ---
  getTeamMembers(filters = {}) {
    if (!this.data.teamMembers) {
      this.data.teamMembers = JSON.parse(JSON.stringify(SEED_DATA.teamMembers));
      this.saveToStorage();
    }

    return this.data.teamMembers.filter(m => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const match = m.name.toLowerCase().includes(q) ||
                      m.title.toLowerCase().includes(q) ||
                      m.email.toLowerCase().includes(q) ||
                      (m.region && m.region.toLowerCase().includes(q)) ||
                      (m.segment && m.segment.toLowerCase().includes(q));
        if (!match) return false;
      }
      if (filters.status && m.status !== filters.status) return false;
      if (filters.region && m.region !== filters.region) return false;
      return true;
    });
  }

  addTeamMember(member) {
    if (!this.data.teamMembers) this.getTeamMembers();
    const count = this.data.teamMembers.length + 1;
    const newId = `BD-${String(count).padStart(2, '0')}`;
    const today = new Date().toISOString().split('T')[0];

    const newMember = {
      id: newId,
      dateAdded: today,
      status: member.status || 'Active',
      target: parseFloat(member.target) || 40000000,
      ...member
    };

    this.data.teamMembers.push(newMember);
    this.saveToStorage();
    return newMember;
  }

  updateTeamMember(id, updates) {
    if (!this.data.teamMembers) this.getTeamMembers();
    const idx = this.data.teamMembers.findIndex(m => m.id === id);
    if (idx !== -1) {
      const oldName = this.data.teamMembers[idx].name;
      this.data.teamMembers[idx] = {
        ...this.data.teamMembers[idx],
        ...updates
      };

      // If name changed, synchronize associated clients, opps, activities
      if (updates.name && updates.name !== oldName) {
        this.data.clients.forEach(c => {
          if (c.bdOwner === oldName) c.bdOwner = updates.name;
        });
        this.data.opportunities.forEach(o => {
          if (o.bdOwner === oldName) o.bdOwner = updates.name;
        });
        this.data.activities.forEach(a => {
          if (a.bdMember === oldName) a.bdMember = updates.name;
        });
        this.data.internalActivities.forEach(i => {
          if (i.teamMember === oldName) i.teamMember = updates.name;
        });
      }

      this.saveToStorage();
      return this.data.teamMembers[idx];
    }
    return null;
  }

  deleteTeamMember(id, reassignToName = null) {
    if (!this.data.teamMembers) this.getTeamMembers();
    const member = this.data.teamMembers.find(m => m.id === id);
    if (!member) return false;

    const oldName = member.name;

    if (reassignToName) {
      this.data.clients.forEach(c => {
        if (c.bdOwner === oldName) c.bdOwner = reassignToName;
      });
      this.data.opportunities.forEach(o => {
        if (o.bdOwner === oldName) o.bdOwner = reassignToName;
      });
      this.data.activities.forEach(a => {
        if (a.bdMember === oldName) a.bdMember = reassignToName;
      });
      this.data.internalActivities.forEach(i => {
        if (i.teamMember === oldName) i.teamMember = reassignToName;
      });
    }

    this.data.teamMembers = this.data.teamMembers.filter(m => m.id !== id);
    this.saveToStorage();
    return true;
  }

  // --- Business Segments Master Management ---
  getSegments(filters = {}) {
    if (!this.data.segments) {
      this.data.segments = JSON.parse(JSON.stringify(SEED_DATA.segments));
      this.saveToStorage();
    }

    return this.data.segments.map(seg => {
      const clientsInSeg = this.data.clients.filter(c => c.segment === seg.name);
      const oppsInSeg = this.data.opportunities.filter(o => o.segment === seg.name);
      const activeOpps = oppsInSeg.filter(o => o.status === 'Open' || o.status === 'In Process');
      const wonOpps = oppsInSeg.filter(o => o.status === 'Won');

      const pipelineValue = activeOpps.reduce((sum, o) => sum + (parseFloat(o.estimatedValue) || 0), 0);
      const wonRevenue = wonOpps.reduce((sum, o) => sum + (parseFloat(o.finalContractValue || o.estimatedValue) || 0), 0);
      const target = parseFloat(seg.targetRevenue) || 0;
      const achievementPct = target > 0 ? ((wonRevenue / target) * 100).toFixed(1) : '0.0';

      return {
        ...seg,
        activeClientsCount: clientsInSeg.length,
        oppsCount: oppsInSeg.length,
        pipelineValue,
        wonRevenue,
        achievementPct
      };
    }).filter(s => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const match = s.name.toLowerCase().includes(q) ||
                      (s.code && s.code.toLowerCase().includes(q)) ||
                      (s.head && s.head.toLowerCase().includes(q)) ||
                      (s.description && s.description.toLowerCase().includes(q));
        if (!match) return false;
      }
      if (filters.status && s.status !== filters.status) return false;
      return true;
    });
  }

  addSegment(segment) {
    if (!this.data.segments) this.data.segments = [];
    const count = this.data.segments.length + 1;
    const newId = `SEG-${String(count).padStart(2, '0')}`;
    const today = new Date().toISOString().split('T')[0];

    const newSeg = {
      id: newId,
      dateAdded: today,
      status: segment.status || 'Active',
      targetRevenue: parseFloat(segment.targetRevenue) || 50000000,
      ...segment
    };

    this.data.segments.push(newSeg);
    this.saveToStorage();
    return newSeg;
  }

  updateSegment(id, updates) {
    if (!this.data.segments) this.getSegments();
    const idx = this.data.segments.findIndex(s => s.id === id);
    if (idx !== -1) {
      const oldName = this.data.segments[idx].name;
      this.data.segments[idx] = {
        ...this.data.segments[idx],
        ...updates
      };

      if (updates.name && updates.name !== oldName) {
        this.data.clients.forEach(c => {
          if (c.segment === oldName) c.segment = updates.name;
        });
        this.data.opportunities.forEach(o => {
          if (o.segment === oldName) o.segment = updates.name;
        });
        this.data.teamMembers.forEach(m => {
          if (m.segment === oldName) m.segment = updates.name;
        });
        this.data.users.forEach(u => {
          if (Array.isArray(u.allowedSegments)) {
            u.allowedSegments = u.allowedSegments.map(s => s === oldName ? updates.name : s);
          }
        });
      }

      this.saveToStorage();
      return this.data.segments[idx];
    }
    return null;
  }

  deleteSegment(id, reassignToName = null) {
    if (!this.data.segments) this.getSegments();
    const seg = this.data.segments.find(s => s.id === id);
    if (!seg) return false;

    const oldName = seg.name;

    if (reassignToName) {
      this.data.clients.forEach(c => {
        if (c.segment === oldName) c.segment = reassignToName;
      });
      this.data.opportunities.forEach(o => {
        if (o.segment === oldName) o.segment = reassignToName;
      });
      this.data.teamMembers.forEach(m => {
        if (m.segment === oldName) m.segment = reassignToName;
      });
      this.data.users.forEach(u => {
        if (Array.isArray(u.allowedSegments)) {
          u.allowedSegments = u.allowedSegments.map(s => s === oldName ? reassignToName : s);
        }
      });
    }

    this.data.segments = this.data.segments.filter(s => s.id !== id);
    this.saveToStorage();
    return true;
  }

  // --- User & RBAC Permission Management (Admin Only) ---
  getUsers(filters = {}) {
    if (!this.data.users) {
      this.data.users = JSON.parse(JSON.stringify(SEED_DATA.users));
      this.saveToStorage();
    }

    return this.data.users.filter(u => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const match = u.name.toLowerCase().includes(q) ||
                      u.email.toLowerCase().includes(q) ||
                      u.role.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filters.role && u.role !== filters.role) return false;
      if (filters.status && u.status !== filters.status) return false;
      return true;
    });
  }

  getCurrentUser() {
    if (!this.data.users || !this.data.users.length) {
      this.data.users = JSON.parse(JSON.stringify(SEED_DATA.users));
    }
    const currentId = this.data.currentUserId || 'USR-001';
    const user = this.data.users.find(u => u.id === currentId);
    return user || this.data.users[0];
  }

  setCurrentUser(userId) {
    const user = this.data.users.find(u => u.id === userId);
    if (user) {
      this.data.currentUserId = userId;
      user.lastLogin = 'Just now';
      this.saveToStorage();
      return user;
    }
    return null;
  }

  isCurrentUserAdmin() {
    const user = this.getCurrentUser();
    return !user || user.role === 'Admin' || user.role === 'System Administrator';
  }

  canAccessTab(tabId) {
    const user = this.getCurrentUser();
    if (!user) return true;
    if (user.role === 'Admin' || user.role === 'System Administrator') return true;
    if (Array.isArray(user.allowedTabs)) {
      return user.allowedTabs.includes(tabId);
    }
    return true;
  }

  canAccessSegment(segmentName) {
    if (!segmentName) return true;
    const user = this.getCurrentUser();
    if (!user) return true;
    if (user.role === 'Admin' || user.role === 'System Administrator') return true;
    if (Array.isArray(user.allowedSegments)) {
      if (user.allowedSegments.includes('All')) return true;
      return user.allowedSegments.includes(segmentName);
    }
    return true;
  }

  addUser(userData) {
    if (!this.data.users) this.getUsers();
    const count = this.data.users.length + 1;
    const newId = `USR-${String(count).padStart(3, '0')}`;
    const today = new Date().toISOString().split('T')[0];

    const newUser = {
      id: newId,
      dateCreated: today,
      lastLogin: 'Never',
      status: userData.status || 'Active',
      allowedTabs: userData.allowedTabs || ['tab-dashboard', 'tab-clients', 'tab-opportunities'],
      allowedSegments: userData.allowedSegments || ['All'],
      ...userData
    };

    this.data.users.push(newUser);
    this.saveToStorage();
    return newUser;
  }

  updateUser(id, updates) {
    if (!this.data.users) this.getUsers();
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      this.data.users[idx] = {
        ...this.data.users[idx],
        ...updates
      };
      this.saveToStorage();
      return this.data.users[idx];
    }
    return null;
  }

  deleteUser(id) {
    if (!this.data.users) this.getUsers();
    const user = this.data.users.find(u => u.id === id);
    if (!user) return false;

    if (user.role === 'Admin') {
      const adminCount = this.data.users.filter(u => u.role === 'Admin').length;
      if (adminCount <= 1) {
        throw new Error('Cannot delete the only remaining Administrator account.');
      }
    }

    this.data.users = this.data.users.filter(u => u.id !== id);
    if (this.data.currentUserId === id) {
      this.data.currentUserId = this.data.users[0]?.id || 'USR-001';
    }
    this.saveToStorage();
    return true;
  }

  checkDuplicateClient(companyName, email, currentId = null) {
    if (!companyName && !email) return null;
    const cleanComp = (companyName || '').toLowerCase().trim();
    const cleanEmail = (email || '').toLowerCase().trim();

    return this.data.clients.find(c => {
      if (currentId && c.id === currentId) return false;
      const cComp = (c.company || c.name || '').toLowerCase().trim();
      const cEmail = (c.email || '').toLowerCase().trim();

      if (cleanEmail && cEmail && cleanEmail === cEmail) return true;
      if (cleanComp && cComp && (cleanComp === cComp || cComp.includes(cleanComp) || cleanComp.includes(cComp))) return true;
      return false;
    });
  }

  // --- Document & Shared Proposal / Approval Attachment Management (8MB Limit) ---
  
  formatFileSize(bytes) {
    if (!bytes || isNaN(bytes)) return '0 KB';
    const num = parseFloat(bytes);
    if (num >= 1024 * 1024) {
      return (num / (1024 * 1024)).toFixed(2) + ' MB';
    }
    return Math.round(num / 1024) + ' KB';
  }

  getDocuments(filters = {}) {
    if (!this.data.documents) {
      this.data.documents = JSON.parse(JSON.stringify(SEED_DATA.documents));
      this.saveToStorage();
    }

    return this.data.documents.filter(doc => {
      // Check segment permission of associated client
      if (doc.clientId) {
        const client = this.data.clients.find(c => c.id === doc.clientId);
        if (client && !this.canAccessSegment(client.segment)) return false;
      }

      if (filters.search) {
        const q = filters.search.toLowerCase();
        const match = (doc.name && doc.name.toLowerCase().includes(q)) ||
                      (doc.clientName && doc.clientName.toLowerCase().includes(q)) ||
                      (doc.type && doc.type.toLowerCase().includes(q)) ||
                      (doc.notes && doc.notes.toLowerCase().includes(q)) ||
                      (doc.uploadedBy && doc.uploadedBy.toLowerCase().includes(q));
        if (!match) return false;
      }

      if (filters.type && doc.type !== filters.type) return false;
      if (filters.clientId && doc.clientId !== filters.clientId) return false;
      if (filters.oppId && doc.oppId !== filters.oppId) return false;
      if (filters.activityId && doc.activityId !== filters.activityId) return false;
      if (filters.uploader && doc.uploadedBy !== filters.uploader) return false;
      return true;
    });
  }

  getDocumentById(id) {
    if (!this.data.documents) this.getDocuments();
    return this.data.documents.find(d => d.id === id);
  }

  addDocument(doc) {
    if (!this.data.documents) this.getDocuments();

    // 8MB Strict Validation (8 * 1024 * 1024 = 8,388,608 bytes)
    const size = parseFloat(doc.size) || 0;
    if (size > this.MAX_DOCUMENT_SIZE) {
      throw new Error(`File "${doc.name}" exceeds the maximum allowed limit of 8MB (${this.formatFileSize(size)}).`);
    }

    const count = this.data.documents.length + 1;
    const newId = `DOC-${100 + count}`;
    const today = new Date().toISOString().split('T')[0];
    const currentUser = this.getCurrentUser();

    // Extract file extension
    let ext = doc.fileExt;
    if (!ext && doc.name) {
      const parts = doc.name.split('.');
      ext = parts.length > 1 ? parts.pop().toLowerCase() : 'pdf';
    }

    const newDoc = {
      id: newId,
      uploadDate: doc.uploadDate || today,
      uploadedBy: doc.uploadedBy || (currentUser ? currentUser.name : 'BD Team'),
      sizeFormatted: this.formatFileSize(size),
      fileExt: ext || 'pdf',
      status: 'Active',
      ...doc,
      size: size
    };

    this.data.documents.unshift(newDoc);
    this.saveToStorage();
    return newDoc;
  }

  deleteDocument(id) {
    if (!this.data.documents) this.getDocuments();
    const idx = this.data.documents.findIndex(d => d.id === id);
    if (idx !== -1) {
      this.data.documents.splice(idx, 1);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  // Delete an activity/interaction log entry
  deleteActivity(id) {
    const idx = this.data.activities.findIndex(a => a.id === id);
    if (idx !== -1) {
      this.data.activities.splice(idx, 1);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  // Action-level permission helpers (based on user.actionPerms array)
  canDoAction(actionKey) {
    const user = this.getCurrentUser();
    if (!user) return false;
    if (user.role === 'Admin') return true; // Admin can always do everything
    if (Array.isArray(user.actionPerms) && user.actionPerms.includes(actionKey)) return true;
    return false;
  }

  // Convenience helpers
  canDeleteActivities()           { return this.canDoAction('delete_activities'); }
  canDeleteInternalActivities()   { return this.canDoAction('delete_internal_activities'); }
  canDeleteDocuments()            { return this.canDoAction('delete_documents'); }
  canDeleteOpportunities()        { return this.canDoAction('delete_opportunities'); }
  canEditAllRecords()             { return this.canDoAction('edit_all_records'); }
  canExportData()                 { return this.canDoAction('export_data'); }
  canManageSegments()             { return this.isCurrentUserAdmin() || this.canDoAction('manage_segments'); }
  canManageTeam()                 { return this.isCurrentUserAdmin() || this.canDoAction('manage_team'); }
}

window.crmStore = new CRMDataStore();


