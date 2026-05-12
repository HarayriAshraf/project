import { ForecastRecord, ForecastStatus } from '../types';

const CLIENTS = ['Alpha Corp', 'Beta Industries', 'Gamma Logistics', 'Delta Foods', 'Epsilon Trading'];
const PRODUCTS = ['Steel Coils', 'Aluminum Sheets', 'Copper Wire', 'Plastic Resins', 'Chemical Compounds'];
const SECTIONS = ['Trade', 'Broker'];
const SUBSIDIARIES = ['Group A', 'Group B', 'Global'];
const CATEGORIES = ['Raw Materials', 'Semi-Finished', 'Chemicals', 'Packaging'];
const COUNTRIES = ['USA', 'UK', 'UAE', 'Germany', 'France'];

const SALES_REPS = [
  { name: 'John Doe', email: 'sales@company.com' },
  { name: 'Jane Smith', email: 'jane.smith@company.com' },
  { name: 'Bob Johnson', email: 'bob.johnson@company.com' },
];

export const generateMockData = (): ForecastRecord[] => {
  const data: ForecastRecord[] = [];
  const currentYear = new Date().getFullYear();
  let idCounter = 1;

  CLIENTS.forEach((client, clientIdx) => {
    PRODUCTS.forEach((product, productIdx) => {
      const rep = SALES_REPS[clientIdx % SALES_REPS.length];
      const subsidiary = SUBSIDIARIES[clientIdx % SUBSIDIARIES.length];
      const section = SECTIONS[productIdx % SECTIONS.length];
      const category = CATEGORIES[productIdx % CATEGORIES.length];
      const country = COUNTRIES[clientIdx % COUNTRIES.length];
      const pricePerUnit = 100 + (productIdx * 20) + (clientIdx * 10);
      const gpMargin = 0.18 + (productIdx * 0.02);

      for (let month = 1; month <= 12; month++) {
        const baseQty = 50 + Math.floor((clientIdx * 17 + productIdx * 13 + month * 7) % 150);

        // Budget version
        data.push({
          id: `rec-${idCounter++}`,
          section,
          client,
          country,
          product,
          category,
          month,
          year: currentYear,
          version: 'Budget',
          qty: baseQty,
          sales: Math.round(baseQty * pricePerUnit),
          gp: Math.round(baseQty * pricePerUnit * gpMargin),
          salesPerson: rep.name,
          salesPersonEmail: rep.email,
          status: 'Draft',
          workflowStatus: ForecastStatus.APPROVED,
          subsidiary,
        });

        // S&OP version (editable)
        const sopQty = Math.round(baseQty * (0.85 + (month * 0.02)));
        data.push({
          id: `rec-${idCounter++}`,
          section,
          client,
          country,
          product,
          category,
          month,
          year: currentYear,
          version: 'S&OP1',
          qty: sopQty,
          sales: Math.round(sopQty * pricePerUnit),
          gp: Math.round(sopQty * pricePerUnit * gpMargin),
          salesPerson: rep.name,
          salesPersonEmail: rep.email,
          status: month < new Date().getMonth() + 1 ? 'Booked' : 'Draft',
          workflowStatus: month < new Date().getMonth() + 1 ? ForecastStatus.APPROVED : ForecastStatus.DRAFT,
          subsidiary,
          invoicingMonth: month < new Date().getMonth() + 1 ? month : undefined,
          invoicingYear: month < new Date().getMonth() + 1 ? currentYear : undefined,
        });
      }
    });
  });

  return data;
};
