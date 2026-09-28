import { Transaction } from '../types';

export interface ParseResult {
  transactions: Transaction[];
  totalRows: number;
  successCount: number;
  errorCount: number;
  detectedDelimiter: string;
  detectedFormat: string;
}

// Convert "17/08/2026" or "2026-08-17" or "08/17/2026" to "YYYY-MM-DD"
export function normalizeDate(rawDateStr: string): string {
  if (!rawDateStr) return new Date().toISOString().split('T')[0];
  const cleaned = rawDateStr.trim().replace(/"/g, '');

  // Format DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = cleaned.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Format YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = cleaned.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Fallback try Date.parse
  const timestamp = Date.parse(cleaned);
  if (!isNaN(timestamp)) {
    return new Date(timestamp).toISOString().split('T')[0];
  }

  return new Date().toISOString().split('T')[0];
}

// Convert "-470,00" or "570.46" or "1 250,50 €" to number
export function normalizeAmount(rawAmount: string | number): number {
  if (typeof rawAmount === 'number') return rawAmount;
  if (!rawAmount) return 0;

  let str = String(rawAmount).trim();
  // Remove currency signs and spaces
  str = str.replace(/[€$£\s\u00A0]/g, '');
  // Replace comma with dot if it's decimal separator
  // If there is both dot and comma (e.g. 1.250,50), remove dots and replace comma with dot
  if (str.includes('.') && str.includes(',')) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes(',')) {
    str = str.replace(',', '.');
  }

  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

// Smart automatic categorization fallback if category is blank or unclear
export function guessCategory(label: string, rawDescription: string = ''): { category: string; subCategory?: string } {
  const text = `${label} ${rawDescription}`.toLowerCase();

  if (text.includes('caf') || text.includes('allocations')) {
    return { category: 'Allocations', subCategory: 'Allocations familiales' };
  }
  if (text.includes('vir recu') || text.includes('salaire') || text.includes('paie') || text.includes('remboursement') || text.includes('rembt')) {
    return { category: 'Virements reçus', subCategory: 'Virement entrant' };
  }
  if (text.includes('vir emis') || text.includes('virement emis')) {
    return { category: 'Virements émis', subCategory: 'Virement sortant' };
  }
  if (text.includes('leroy merlin') || text.includes('castorama') || text.includes('bricolage') || text.includes('brico') || text.includes('outillage') || text.includes('peinture') || text.includes('travaux') || text.includes('bricomarche') || text.includes('point p') || text.includes('saint maclou')) {
    return { category: 'Travaux', subCategory: 'Bricolage & Matériaux' };
  }
  if (text.includes('auchan') || text.includes('carrefour') || text.includes('lidl') || text.includes('leclerc') || text.includes('monoprix') || text.includes('boucher') || text.includes('boulangerie') || text.includes('market') || text.includes('primeur') || text.includes('meat')) {
    return { category: 'Vie quotidienne', subCategory: 'Alimentation' };
  }
  if (text.includes('relais') || text.includes('total') || text.includes('carburant') || text.includes('station') || text.includes('essence') || text.includes('dorez')) {
    return { category: 'Auto et Moto', subCategory: 'Carburant' };
  }
  if (text.includes('stationnem') || text.includes('horod') || text.includes('parking') || text.includes('effia') || text.includes('park chu')) {
    return { category: 'Auto et Moto', subCategory: 'Parking' };
  }
  if (text.includes('amende') || text.includes('contravention') || text.includes('web amende')) {
    return { category: 'Auto et Moto', subCategory: 'Contraventions' };
  }
  if (text.includes('norauto') || text.includes('garage') || text.includes('calinauto') || text.includes('control tech') || text.includes('reparation')) {
    return { category: 'Auto et Moto', subCategory: 'Entretien - Réparation' };
  }
  if (text.includes('sfr') || text.includes('orange') || text.includes('free mobile') || text.includes('bouygues') || text.includes('telephonie') || text.includes('netflix') || text.includes('spotify')) {
    return { category: 'Abonnements et téléphonie', subCategory: 'Téléphonie (fixe et mobile)' };
  }
  if (text.includes('cotisation') || text.includes('tenue de compte') || text.includes('frais') || text.includes('agios') || text.includes('banque')) {
    return { category: 'Services financiers / professionnels', subCategory: 'Frais bancaires' };
  }
  if (text.includes('retrait') || text.includes('dab') || text.includes('cash services') || text.includes('distributeur')) {
    return { category: 'Retraits', subCategory: 'Retrait espèces' };
  }
  if (text.includes('restaurant') || text.includes('boualem') || text.includes('la place') || text.includes('fdl') || text.includes('artisan') || text.includes('bar') || text.includes('uber eats')) {
    return { category: 'Loisirs', subCategory: 'Restaurants & Sorties' };
  }
  if (text.includes('docto') || text.includes('pharmacie') || text.includes('laboratoire') || text.includes('medecin') || text.includes('dentiste') || text.includes('hopital')) {
    return { category: 'Santé', subCategory: 'Santé & Pharmacie' };
  }
  if (text.includes('tunisair') || text.includes('air france') || text.includes('nouvelair') || text.includes('opodo') || text.includes('sncf') || text.includes('vol') || text.includes('hotel') || text.includes('voyage')) {
    return { category: 'Voyages et Transports', subCategory: 'Transports longue distance' };
  }
  if (text.includes('travaux') || text.includes('loyer') || text.includes('edf') || text.includes('engie')) {
    return { category: 'Logement', subCategory: 'Travaux et logement' };
  }

  return { category: 'Autres dépenses', subCategory: '' };
}

// Parse Raw Statement Text (Handles French Bank exports & standard CSVs)
export function parseBankStatement(csvText: string): ParseResult {
  if (!csvText || !csvText.trim()) {
    return { transactions: [], totalRows: 0, successCount: 0, errorCount: 0, detectedDelimiter: ';', detectedFormat: 'Empty' };
  }

  // Detect delimiter
  const firstLines = csvText.trim().split(/\r?\n/).slice(0, 5).join('\n');
  const semicolonCount = (firstLines.match(/;/g) || []).length;
  const commaCount = (firstLines.match(/,/g) || []).length;
  const tabCount = (firstLines.match(/\t/g) || []).length;

  let delimiter = ';';
  if (commaCount > semicolonCount && commaCount > tabCount) {
    delimiter = ',';
  } else if (tabCount > semicolonCount && tabCount > commaCount) {
    delimiter = '\t';
  }

  const lines = csvText.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) {
    return { transactions: [], totalRows: 0, successCount: 0, errorCount: 0, detectedDelimiter: delimiter, detectedFormat: 'Empty' };
  }

  // Analyze header line
  const headerCells = lines[0].split(delimiter).map(c => c.trim().toLowerCase().replace(/"/g, ''));
  
  let dateIdx = -1;
  let bookingDateIdx = -1;
  let labelIdx = -1;
  let rawDescIdx = -1;
  let categoryIdx = -1;
  let subCategoryIdx = -1;
  let amountIdx = -1;
  let debitIdx = -1;
  let creditIdx = -1;
  let pointedIdx = -1;
  let accountNumIdx = -1;
  let accountLabelIdx = -1;

  headerCells.forEach((header, idx) => {
    if (header.includes('date transaction') || (header.includes('date') && dateIdx === -1 && !header.includes('compta') && !header.includes('valeur'))) {
      dateIdx = idx;
    } else if (header.includes('date comptabilisation') || header.includes('date valeur') || header.includes('booking date')) {
      bookingDateIdx = idx;
    } else if (header.includes('libell') && (header.includes('op') || header.includes('court') || header.includes('trans')) || header.includes('description') || header.includes('payee') || header.includes('merchant')) {
      if (labelIdx === -1) labelIdx = idx;
    } else if (header.includes('libell') && (header.includes('complet') || header.includes('detail')) || header.includes('memo') || header.includes('note')) {
      rawDescIdx = idx;
    } else if (header.includes('cat') && !header.includes('sous')) {
      categoryIdx = idx;
    } else if (header.includes('sous-cat') || header.includes('sub-cat') || header.includes('sous cat')) {
      subCategoryIdx = idx;
    } else if (header.includes('montant') || header.includes('amount') || header.includes('solde')) {
      amountIdx = idx;
    } else if (header.includes('debit') || header.includes('dépense') || header.includes('depense')) {
      debitIdx = idx;
    } else if (header.includes('credit') || header.includes('recette') || header.includes('revenu')) {
      creditIdx = idx;
    } else if (header.includes('point') || header.includes('status') || header.includes('reconciled') || header.includes('rapproch')) {
      pointedIdx = idx;
    } else if (header.includes('num compte') || header.includes('account number') || header.includes('compte') && !header.includes('libell')) {
      accountNumIdx = idx;
    } else if (header.includes('libell') && header.includes('compte')) {
      accountLabelIdx = idx;
    }
  });

  // Fallbacks if no matching header keywords found
  if (dateIdx === -1) dateIdx = 0;
  if (labelIdx === -1) labelIdx = headerCells.length > 4 ? 4 : (headerCells.length > 1 ? 1 : 0);
  if (amountIdx === -1 && debitIdx === -1 && creditIdx === -1) {
    amountIdx = headerCells.length > 8 ? 8 : headerCells.length - 1;
  }

  const transactions: Transaction[] = [];
  let successCount = 0;
  let errorCount = 0;

  // Process data lines (start at index 1 if header exists)
  const startIndex = 1;

  for (let i = startIndex; i < lines.length; i++) {
    const rawLine = lines[i];
    if (!rawLine.trim()) continue;

    // Split line respecting quotes or simple delimiter
    let cells: string[] = [];
    if (rawLine.includes('"')) {
      // Basic regex for CSV with quoted strings
      const match = rawLine.match(/(?:[^\s;,\t"]+|"[^"]*")+/g);
      cells = match ? match.map(m => m.replace(/^"|"$/g, '').trim()) : rawLine.split(delimiter);
    } else {
      cells = rawLine.split(delimiter).map(c => c.trim());
    }

    if (cells.length < 2) {
      errorCount++;
      continue;
    }

    try {
      const rawDate = cells[dateIdx] || '';
      const rawBookingDate = bookingDateIdx !== -1 ? cells[bookingDateIdx] : undefined;
      const rawLabel = cells[labelIdx] || cells[0] || 'Transaction';
      const rawDesc = rawDescIdx !== -1 ? cells[rawDescIdx] : undefined;
      let rawCat = categoryIdx !== -1 ? cells[categoryIdx] : '';
      let rawSubCat = subCategoryIdx !== -1 ? cells[subCategoryIdx] : '';
      
      // Calculate amount
      let amount = 0;
      if (amountIdx !== -1 && cells[amountIdx] !== undefined) {
        amount = normalizeAmount(cells[amountIdx]);
      } else if (debitIdx !== -1 || creditIdx !== -1) {
        const debit = debitIdx !== -1 ? normalizeAmount(cells[debitIdx] || '0') : 0;
        const credit = creditIdx !== -1 ? normalizeAmount(cells[creditIdx] || '0') : 0;
        amount = credit > 0 ? credit : -Math.abs(debit);
      }

      // Reconciled status
      const rawPointed = pointedIdx !== -1 ? (cells[pointedIdx] || '').toLowerCase() : '';
      const isPointed = rawPointed === 'oui' || rawPointed === 'yes' || rawPointed === 'true' || rawPointed === '1' || rawPointed === 'x';

      // Clean category if corrupted or blank
      if (!rawCat || rawCat.trim() === '' || rawCat.includes('\uFFFD')) {
        const guessed = guessCategory(rawLabel, rawDesc);
        rawCat = guessed.category;
        if (!rawSubCat) rawSubCat = guessed.subCategory || '';
      }

      // Clean corrupted encoding characters like '\uFFFD'
      let cleanLabel = rawLabel.replace(/\uFFFD/g, 'é').replace(/\s+/g, ' ').trim();
      let cleanCat = rawCat.replace(/\uFFFD/g, 'é').trim();
      let cleanSubCat = rawSubCat ? rawSubCat.replace(/\uFFFD/g, 'é').trim() : undefined;
      let cleanDesc = rawDesc ? rawDesc.replace(/\uFFFD/g, 'é').trim() : undefined;

      // Migrate bricolage/leroy merlin bank default sub-categories to Travaux
      const checkText = `${cleanLabel} ${cleanDesc || ''} ${cleanSubCat || ''}`.toLowerCase();
      if (
        cleanCat === 'Vie quotidienne' &&
        (cleanSubCat?.toLowerCase().includes('bricolage') ||
          checkText.includes('leroy merlin') ||
          checkText.includes('castorama') ||
          checkText.includes('brico'))
      ) {
        cleanCat = 'Travaux';
        cleanSubCat = 'Bricolage & Matériaux';
      } else if (cleanCat === 'Logement' && checkText.includes('travaux')) {
        cleanCat = 'Travaux';
        cleanSubCat = 'Rénovation & Aménagement';
      }

      const date = normalizeDate(rawDate);
      const bookingDate = rawBookingDate ? normalizeDate(rawBookingDate) : undefined;

      // Unique synthetic ID
      const id = `tx-${date}-${Math.abs(amount).toFixed(2)}-${i}-${Math.random().toString(36).substring(2, 7)}`;

      transactions.push({
        id,
        date,
        bookingDate,
        accountNumber: accountNumIdx !== -1 ? cells[accountNumIdx] : undefined,
        accountLabel: accountLabelIdx !== -1 ? cells[accountLabelIdx] : undefined,
        label: cleanLabel,
        rawDescription: cleanDesc,
        category: cleanCat || 'Autres dépenses',
        subCategory: cleanSubCat,
        amount,
        isPointed,
        currency: 'EUR',
      });

      successCount++;
    } catch {
      errorCount++;
    }
  }

  // Sort by date descending
  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    transactions,
    totalRows: lines.length - 1,
    successCount,
    errorCount,
    detectedDelimiter: delimiter,
    detectedFormat: delimiter === ';' ? 'French Bank Statement (Semicolon)' : 'Standard CSV Format',
  };
}
