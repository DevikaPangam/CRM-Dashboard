import { Client, ClientContact } from '../types/crm';

/**
 * Robust CSV parser that handles quoted strings containing commas and newlines
 */
export function parseCSVRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n
      }
      currentRow.push(currentField.trim());
      if (currentRow.some((field) => field.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((field) => field.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Parse client CSV text into Client objects
 */
export function parseClientsFromCSV(csvText: string, defaultClientType: 'New Client' | 'Existing Client' = 'New Client'): Client[] {
  const rows = parseCSVRows(csvText);
  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

  // Header index mapping helper
  const findColIndex = (keywords: string[]): number => {
    for (const kw of keywords) {
      const idx = headers.findIndex((h) => h.includes(kw));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const codeIdx = findColIndex(['clientcode', 'code', 'cltcode', 'id']);
  const nameIdx = findColIndex(['clientname', 'name', 'company', 'client']);
  const industryIdx = findColIndex(['industry', 'sector', 'business']);
  const segmentIdx = findColIndex(['segment', 'service', 'category']);
  const cityIdx = findColIndex(['city', 'location']);
  const stateIdx = findColIndex(['state', 'province']);
  const regionIdx = findColIndex(['region', 'zone']);
  const tierIdx = findColIndex(['tier', 'classification']);
  const turnoverIdx = findColIndex(['turnover', 'revenue', 'turnovercr']);
  const employeesIdx = findColIndex(['employees', 'headcount', 'size']);
  const statusIdx = findColIndex(['status']);
  const ownerIdx = findColIndex(['accountowner', 'owner', 'bdlead', 'manager']);
  const contactIdx = findColIndex(['primarycontact', 'contactperson', 'contact', 'poc']);
  const emailIdx = findColIndex(['email', 'contactemail']);
  const phoneIdx = findColIndex(['phone', 'mobile', 'telephone']);
  const typeIdx = findColIndex(['clienttype', 'type']);

  const parsedClients: Client[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const name = nameIdx !== -1 && row[nameIdx] ? row[nameIdx].replace(/^["']|["']$/g, '') : `Client ${r}`;
    if (!name || name.trim().length === 0) continue;

    const code = codeIdx !== -1 && row[codeIdx] ? row[codeIdx].replace(/^["']|["']$/g, '') : `CLT-${1000 + r}`;
    const industry = industryIdx !== -1 && row[industryIdx] ? row[industryIdx] : 'Manufacturing & Heavy Industry';
    const segment = segmentIdx !== -1 && row[segmentIdx] ? row[segmentIdx] : 'Employee Transportation';
    const city = cityIdx !== -1 && row[cityIdx] ? row[cityIdx] : 'Mumbai';
    const state = stateIdx !== -1 && row[stateIdx] ? row[stateIdx] : 'Maharashtra';
    const rawRegion = regionIdx !== -1 && row[regionIdx] ? row[regionIdx] : 'West';
    const region = ['North', 'South', 'East', 'West', 'Central'].includes(rawRegion)
      ? (rawRegion as any)
      : 'West';
    const tier = tierIdx !== -1 && row[tierIdx]
      ? (row[tierIdx] as any)
      : 'Tier 1 (Enterprise)';
    const turnoverCr = turnoverIdx !== -1 && row[turnoverIdx] ? parseFloat(row[turnoverIdx].replace(/[^0-9.]/g, '')) || 100 : 100;
    const employees = employeesIdx !== -1 && row[employeesIdx] ? parseInt(row[employeesIdx].replace(/[^0-9]/g, ''), 10) || 500 : 500;
    const status = statusIdx !== -1 && row[statusIdx] ? (row[statusIdx] as any) : 'Active';
    const accountOwner = ownerIdx !== -1 && row[ownerIdx] ? row[ownerIdx] : 'Aditya Patil';
    const contactName = contactIdx !== -1 && row[contactIdx] ? row[contactIdx] : 'Primary Contact';
    const email = emailIdx !== -1 && row[emailIdx] ? row[emailIdx] : `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@corp.demo`;
    const phone = phoneIdx !== -1 && row[phoneIdx] ? row[phoneIdx] : '+91 98000 00000';

    let clientType: 'New Client' | 'Existing Client' = defaultClientType;
    if (typeIdx !== -1 && row[typeIdx]) {
      const val = row[typeIdx].toLowerCase();
      if (val.includes('exist')) clientType = 'Existing Client';
      else if (val.includes('new')) clientType = 'New Client';
    }

    const contacts: ClientContact[] = [
      {
        id: `CON-${r.toString().padStart(2, '0')}`,
        name: contactName,
        designation: 'VP / Procurement Lead',
        email,
        phone,
        isPrimary: true,
      },
    ];

    parsedClients.push({
      id: code,
      code,
      name,
      clientType,
      industry,
      segment,
      city,
      state,
      region,
      tier,
      turnoverCr,
      employees,
      status: status === 'Prospect' || status === 'Dormant' || status === 'Blacklisted' ? status : 'Active',
      accountOwner,
      createdDate: new Date().toISOString().slice(0, 10),
      contacts,
      notes: `Imported via Bulk CSV Uploader on ${new Date().toISOString().slice(0, 10)}`,
    });
  }

  return parsedClients;
}

export const SAMPLE_CLIENTS_CSV = `Client Code,Client Name,Industry,Segment,City,State,Region,Tier,Turnover (Cr),Employees,Status,Account Owner,Primary Contact,Email,Phone
"CLT-1001","ABC Manufacturing Ltd","Manufacturing & Heavy Industry","Employee Transportation","Pune","Maharashtra","West","Tier 1 (Enterprise)",450,3200,"Active","Aditya Patil","Rajesh Kulkarni","rajesh.k@abcmanufacturing.demo","+91 98231 44550"
"CLT-1002","XYZ Automotive Components","Automotive & Engineering","Warehouse Logistics","Gurugram","Haryana","North","Tier 1 (Enterprise)",800,4500,"Active","Pooja Kulkarni","Harsh Vardhan","h.vardhan@xyzauto.demo","+91 98110 77890"
"CLT-1003","Global Foods & Beverages","FMCG & Retail","Cold Chain Logistics","Bengaluru","Karnataka","South","Tier 1 (Enterprise)",1200,5800,"Active","Rajesh Patil","Meera Deshmukh","meera.d@globalfoods.demo","+91 97400 33211"
"CLT-1004","Prime Healthcare Solutions","Healthcare & Pharma","Last Mile Delivery","Hyderabad","Telangana","South","Tier 2 (Mid-Market)",320,1800,"Active","Devika Pangam","Dr. Srinivas Rao","srao@primehealth.demo","+91 98480 12345"
"CLT-1005","Metro Logistics Hub","E-commerce & Logistics","Contract Logistics","Mumbai","Maharashtra","West","Tier 2 (Mid-Market)",210,950,"Active","Suresh Joshi","Amitabh Sen","amitabh.s@metrohub.demo","+91 98200 99887"
"CLT-1006","Sunrise Industries","Manufacturing & Heavy Industry","Fleet Management","Ahmedabad","Gujarat","West","Tier 2 (Mid-Market)",180,800,"Active","Aditya Patil","Bhavin Patel","bhavin.p@sunriseenergy.demo","+91 98980 44321"
"CLT-1007","Apex Tech Solutions","Information Technology & ITES","Corporate Travel","Bengaluru","Karnataka","South","Tier 1 (Enterprise)",1500,7500,"Active","Pooja Kulkarni","Deepa Narayan","deepa.n@apextech.demo","+91 99000 77123"
"CLT-1008","Zenith Retail Warehousing","FMCG & Retail","Warehouse Logistics","Chennai","Tamil Nadu","South","Tier 2 (Mid-Market)",290,1200,"Active","Rajesh Patil","Karthik Subramanian","karthik.s@zenithretail.demo","+91 98401 55667"`;
