export interface PayrollCalculations {
    workingDays: number;
    daysWorked: number;
    salaireBaseGain: number;
    congeGain: number;
    feriesGain: number;
    primeAncienneteRate: number;
    primeAncienneteBase: number;
    primeAncienneteGain: number;
    primeRendementGain: number;
    indemnitePanierGain: number;
    
    // Termination Benefits
    preavisDays?: number;
    preavisAmount?: number;
    dommagesDays?: number;
    dommagesAmount?: number;
    licenciementHours?: number;
    licenciementAmount?: number;
    terminationGains?: number;
    motif?: string;

    salaireBrut: number;
    salaireBrutImposable: number;
    cnssAmount: number;
    amoAmount: number;
    totalCotisations: number;
    fraisProfessionnels: number;
    chargeFamille: number;
    netImposable: number;
    igrRaw: number;
    finalIgr: number;
    bonusDays: number;
    netAPayer: number;
    arrondi: number;
}

export const calculateSeniorityRate = (dateAnciennete: string): number => {
    if (!dateAnciennete) return 0;
    const start = new Date(dateAnciennete);
    if (isNaN(start.getTime())) return 0;
    const now = new Date();
    
    // Month-based logic: difference in months + 1 (inclusive)
    const totalMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()) + 1;

    // Thresholds: increase 1 month after anniversary
    // 2 years = 24 months. Month 25 is 2y 1m.
    if (totalMonths < 25) return 0;
    if (totalMonths >= 25 && totalMonths < 61) return 5;
    if (totalMonths >= 61 && totalMonths < 145) return 10;
    if (totalMonths >= 145 && totalMonths < 241) return 15;
    if (totalMonths >= 241) return 20;
    return 0;
};

export const calculateYearsOfService = (dateAnciennete: string): number => {
    if (!dateAnciennete) return 0;
    const start = new Date(dateAnciennete);
    if (isNaN(start.getTime())) return 0;
    const now = new Date();

    const totalMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()) + 1;
    const years = Math.floor(totalMonths / 12);
    
    return Math.max(0, years);
};

export const calculateLicenciementHours = (years: number): number => {
    let hours = 0;
    for (let y = 1; y <= years; y++) {
        if (y <= 5) {
            hours += 96;
        } else if (y >= 6 && y <= 10) {
            hours += 144;
        } else if (y >= 11 && y <= 15) {
            hours += 192;
        } else if (y > 15) {
            hours += 240;
        }
    }
    return hours;
};

export const calculateWorkingDaysForNewRecruit = (dateEmbauche: string, dateSortie?: string): number => {
    console.log('calculateWorkingDaysForNewRecruit called:', { dateEmbauche, dateSortie });
    
    // Handle Sortie employees - calculate from month start to quit date
    if (dateSortie) {
        console.log('Processing Sortie employee with dateSortie:', dateSortie);
        const quitDate = new Date(dateSortie);
        if (!isNaN(quitDate.getTime())) {
            const year = quitDate.getFullYear();
            const month = quitDate.getMonth();
            const lastDayOfWork = quitDate.getDate();
            
            console.log('Quit date details:', { year, month: month + 1, lastDayOfWork });
            
            let workingDays = 0;
            for (let day = 1; day <= lastDayOfWork; day++) {
                const currentDate = new Date(year, month, day);
                if (currentDate.getDay() !== 0) { // Not Sunday
                    workingDays++;
                }
            }
            console.log('Calculated working days for Sortie:', workingDays);
            return workingDays;
        }
    }
    
    // Handle new recruits hired mid-month
    if (!dateEmbauche) return 26;
    
    const hireDate = new Date(dateEmbauche);
    const now = new Date();
    
    if (hireDate.getMonth() !== now.getMonth() || hireDate.getFullYear() !== now.getFullYear()) {
        return 26;
    }
    
    let workingDays = 0;
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    
    for (let day = hireDate.getDate(); day <= lastDay; day++) {
        const d = new Date(now.getFullYear(), now.getMonth(), day);
        if (d.getDay() !== 0) { // Not Sunday
            workingDays++;
        }
    }
    
    return workingDays;
};

export const calculatePayroll = (
    employee: any, 
    variables: { 
        conge: number; 
        absence: number; 
        jf: number; 
        avance: number; 
        primeAncienneteOverride?: number;
        motif?: string;
    }
): PayrollCalculations => {
    const workingDays = calculateWorkingDaysForNewRecruit(employee.dateEmbauche, employee.dateSortie);
    const totalDays = workingDays;
    const absence = Math.abs(variables.absence);
    const conge = variables.conge;
    const jf = variables.jf;
    const motif = variables.motif || 'Démission';
    
    const salaire_base = employee.salaire_base || 0;
    const prime_rendement = employee.prime_rendement || 0;
    const indemnite_panier = employee.indemnite_panier || 0;
    const num_deduction = employee.num_deduction || 0;
    const avance = Math.abs(variables.avance);
    
    
    // Calculate worked days
    // For Sortie employees, workingDays already accounts for actual days from month start to quit date
    // So we only subtract absence, not conge (which is separate)
    const isSortieEmployee = !!employee.dateSortie;
    const joursTravailles = isSortieEmployee 
        ? Math.max(0, totalDays - absence)  // Sortie: only subtract absence
        : Math.max(0, totalDays - (absence + conge));  // Active: subtract both
    
    // Gains
    const salaireBaseGain = salaire_base * joursTravailles;
    const congeGain = salaire_base * conge;
    const feriesGain = salaire_base * jf;
    
    // Termination Benefits Calculation
    let preavisDays = 0, preavisAmount = 0;
    let dommagesDays = 0, dommagesAmount = 0;
    let licenciementHours = 0, licenciementAmount = 0;
    let terminationGains = 0;

    const terminationMotifs = ['Licenciement', 'Licenciement Art41'];
    const isTermination = terminationMotifs.includes(motif) && employee.status === 'Sortie';

    const yearsOfService = calculateYearsOfService(employee.dateAnciennete || employee.dateEmbauche);

    if (isTermination) {
        // Préavis
        if (yearsOfService < 1) {
            preavisDays = 8;
        } else if (yearsOfService >= 1 && yearsOfService < 5) {
            preavisDays = 26;
        } else if (yearsOfService >= 5) {
            preavisDays = 52;
        }
        preavisAmount = preavisDays * salaire_base;

        // Dommages-Intérêts (Only for Art 41 usually, but PHP logic shows it for both if loop logic? 
        // No, PHP: if (showTerminationRows) { ... } so for both Licenciement types based on array check
        // We will follow PHP logic: applied for "Licenciement" and "Licenciement Art41"
        
        // Dommages-Intérêts
        dommagesDays = yearsOfService * 1.5;
        const primeAncienneteRateForDommage = calculateSeniorityRate(employee.dateAnciennete || employee.dateEmbauche);
        
        const baseSalaire26 = salaire_base * 26;
        const basePrimeAnciennete26 = baseSalaire26 * (primeAncienneteRateForDommage / 100);
        const dommagesBase = baseSalaire26 + basePrimeAnciennete26;
        dommagesAmount = dommagesDays * dommagesBase; // Note: PHP used 'dommagesDays' as multiplier of FULL MONTHLY salary + prime? 
        // Wait, PHP: dommagesDays = yearsOfService * 1.5; 
        // dommagesBase = baseSalaire26 + basePrimeAnciennete26;
        // dommagesGain = dommagesDays * dommagesBase;
        // This seems huge if dommagesDays is like 10 days and base is a month. 
        // PHP logic: Check `dommagesDays = yearsOfService * 1.5` -> This is "Mois de salaire" usually in Morocco?
        // Article 41: 1.5 months per year. So 'dommagesDays' in PHP is actually 'dommagesMonths'.
        // Let's keep variable names consistent with PHP to be safe, but logic is Months multiplier.
        
        // Indemnité de Licenciement
        licenciementHours = calculateLicenciementHours(yearsOfService);
        const primeAnciennete26 = baseSalaire26 * (primeAncienneteRateForDommage / 100);
        const baseHeure = (baseSalaire26 + primeAnciennete26) / 191;
        licenciementAmount = licenciementHours * baseHeure;

        terminationGains = preavisAmount + dommagesAmount + licenciementAmount;
    }

    // Seniority
    const primeAncienneteRate = variables.primeAncienneteOverride !== undefined 
        ? variables.primeAncienneteOverride 
        : calculateSeniorityRate(employee.dateAnciennete || employee.dateEmbauche);
        
    // Prime Ancienneté Base Logic
    // Base always includes Jours Fériés for all employees
    let primeAncienneteBase = 0;
    if (motif === 'Démission') {
        primeAncienneteBase = salaireBaseGain + congeGain + feriesGain;
    } else {
        // For termination, base includes preavis and feries
        primeAncienneteBase = salaireBaseGain + congeGain + preavisAmount + feriesGain;
    }
    
    const primeAncienneteGain = primeAncienneteBase * (primeAncienneteRate / 100);
    
    // For Sortie employees: use only working days (no conge)
    // For Active employees: use working days + conge
    const bonusDays = isSortieEmployee ? joursTravailles : (joursTravailles + conge);
    const primeRendementGain = (prime_rendement / 26) * bonusDays;
    const indemnitePanierGain = (indemnite_panier / 26) * bonusDays;
    
    // Gross Salary
    const salaireBrut = salaireBaseGain + congeGain + feriesGain + primeAncienneteGain + primeRendementGain + indemnitePanierGain + terminationGains;
    
    // SBI
    // PHP: salaireBrutImposable = salaireBrut - indemnitePanierGain - gainLicenciement;
    // IF Art41: salaireBrutImposable = salaireBrut - indemnitePanierGain - gainLicenciement - dommagesGain;
    let salaireBrutImposable = salaireBrut - indemnitePanierGain - licenciementAmount;
    if (motif === 'Licenciement Art41') {
        salaireBrutImposable -= dommagesAmount;
    }
    
    // Cotisations
    const cnssBase = Math.min(salaireBrutImposable, 6000);
    const cnssAmount = cnssBase * 0.0448;
    const amoAmount = salaireBrutImposable * 0.0226;
    const totalCotisations = cnssAmount + amoAmount;
    
    // Family charge
    const chargeFamille = (num_deduction > 6) ? 300 : (50 * num_deduction);
    
    // Prof expenses
    let fraisProfessionnels = (salaireBrutImposable < 6500) ? salaireBrutImposable * 0.35 : salaireBrutImposable * 0.25;
    if (fraisProfessionnels > 2916.66) {
        fraisProfessionnels = 2916.66;
    }
    
    // Net Imposable
    const netImposable = Math.max(0, salaireBrutImposable - totalCotisations - fraisProfessionnels);
    
    // IGR
    let igrRaw = 0;
    if (netImposable > 3333 && netImposable <= 5000) {
        igrRaw = (netImposable * 0.10) - 333.33;
    } else if (netImposable > 5000 && netImposable <= 6666) {
        igrRaw = (netImposable * 0.20) - 833.33;
    } else if (netImposable > 6666 && netImposable <= 8333) {
        igrRaw = (netImposable * 0.30) - 1500.00;
    } else if (netImposable > 8333 && netImposable <= 15000) {
        igrRaw = (netImposable * 0.34) - 1833.33;
    } else if (netImposable > 15000) {
        igrRaw = (netImposable * 0.38) - 2433.33; 
    }
    
    const finalIgr = Math.max(0, igrRaw - chargeFamille);
    
    // Final Net
    const rawNetAPayer = salaireBrut - totalCotisations - finalIgr - avance;
    const netAPayer = Math.round(rawNetAPayer);
    const arrondi = rawNetAPayer - netAPayer;
    
    return {
        workingDays,
        daysWorked: joursTravailles,
        salaireBaseGain,
        congeGain,
        feriesGain,
        primeAncienneteRate,
        primeAncienneteBase,
        primeAncienneteGain,
        primeRendementGain,
        indemnitePanierGain,
        preavisDays,
        preavisAmount,
        dommagesDays,
        dommagesAmount,
        licenciementHours,
        licenciementAmount,
        terminationGains,
        motif,
        salaireBrut,
        salaireBrutImposable,
        cnssAmount,
        amoAmount,
        totalCotisations,
        fraisProfessionnels,
        chargeFamille,
        netImposable,
        igrRaw,
        finalIgr,
        bonusDays,
        netAPayer,
        arrondi
    };
};
