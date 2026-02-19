export interface TransportEmployee {
    id?: number;
    fullName: string;
    address: string;
    phone: string;
    lieu: string;
    isMotorise: boolean;
    isSpecial: boolean;
    specialGroup?: string;
    specialShift?: string; // e.g. '9H', '11H', '15H'
    mon?: boolean;
    tue?: boolean;
    wed?: boolean;
    thu?: boolean;
    fri?: boolean;
    sat?: boolean;
    sun?: boolean;
}

export interface TransportGroup {
    id?: number;
    name: string;
    shift?: string; // e.g. '9H', '11H', '15H'
    mon?: boolean;
    tue?: boolean;
    wed?: boolean;
    thu?: boolean;
    fri?: boolean;
    sat?: boolean;
    sun?: boolean;
}

export interface PlanningItem {
    name: string;
    shifts: (string | null)[]; // 7 days: 0=Mon, 6=Sun
}

export interface TrajetBlock {
    lieu: string;
    day1Name: string;
    day2Name?: string;
    day1Date?: string; // e.g. "17-Feb"
    day2Date?: string;
    employees: Array<{
        id?: number;
        name: string;
        address: string;
        phone: string;
        shift1: string | null;
        shift2: string | null;
        isMotorise: boolean;
        specialGroup?: string;
    }>;
}

export interface TrajetDataRow {
    name: string;
    address: string;
    time: string;
    phone: string;
    lieu: string;
}

export interface TrajetDataBlock {
    title: string;
    rows: TrajetDataRow[];
}

export interface TrajetShiftGroup {
    shiftTime: string;
    trajets: TrajetDataBlock[];
}

export interface TrajetTransformationData {
    mainTitle: string;
    shiftGroups: TrajetShiftGroup[];
}

/**
 * Converts Excel serial date to "DD-MMM" string
 */
export function excelSerialToDate(serial: number): string {
    const date = new Date((serial - 25569) * 86400 * 1000);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()}-${months[date.getMonth()]}`;
}

/**
 * Enhanced parser for Excel-like TSV data
 */
export function parsePlanningData(text: string): { items: PlanningItem[], dates: string[] } {
    const lines = text.split('\n');
    const items: PlanningItem[] = [];
    let dates: string[] = new Array(7).fill('');

    // Try to find the date header line (contains strings like "17-Feb" or "17/02")
    const dateHeaderLine = lines.find(l => {
        const parts = l.split('\t').map(p => p.trim());
        return parts.some(p => /^\d{1,2}[-/]([a-z]{3}|\d{1,2})$/i.test(p));
    });

    if (dateHeaderLine) {
        const parts = dateHeaderLine.split('\t').map(p => p.trim());
        // In the user's structure: Col 0 is Name, Col 1-7 are shifts
        for (let i = 0; i < 7; i++) {
            if (parts[i + 1]) dates[i] = parts[i + 1];
        }
    }
    
    // Skip headers and empty lines
    const dataLines = lines.filter(l => {
        const lower = l.toLowerCase();
        return l.trim() !== '' && 
               !lower.includes('week') && 
               !lower.includes('dim') && 
               !lower.includes('lun') &&
               !/^\d{2}\//.test(l.trim()); 
    });

    dataLines.forEach(line => {
        const parts = line.split('\t').map(p => p.trim());
        if (parts.length < 2) return;

        const name = parts[0]; // First column: Employee Name
        
        // Excel structure as described by user:
        // Column 0: Name
        // Columns 1-7: Monday through Sunday shifts
        const sevenDays: (string | null)[] = new Array(7).fill(null);
        for (let i = 0; i < 7; i++) {
            const part = parts[i + 1]; // Column 1 = Monday, Column 7 = Sunday
            if (part) {
                const m = part.match(/\d+H/i);
                if (m) sevenDays[i] = m[0].toUpperCase();
            }
        }

        // Refined name validation: Must have content and at least one shift
        if (name && name.trim().length > 2 && sevenDays.some(s => s !== null)) {
            items.push({ name: name.trim(), shifts: sevenDays });
        }
    });

    return { items, dates };
}

/**
 * Parser for the transport company's "Trajet DATA" format (hierarchical blocks)
 */
export function parseTrajetData(text: string, dbEmployees: TransportEmployee[]): TrajetTransformationData {
    const lines = text.split('\n');
    const result: TrajetTransformationData = {
        mainTitle: '',
        shiftGroups: []
    };
    
    // Helper to find Area by address or name
    const detectLieu = (name: string, address: string) => {
        const emp = dbEmployees.find(e => 
            (name && e.fullName && e.fullName.toLowerCase() === name.toLowerCase()) || 
            (address && e.address && address.toLowerCase().includes(e.address.toLowerCase()))
        );
        return emp?.lieu || 'Unknown';
    };

    let currentShiftGroup: TrajetShiftGroup | null = null;
    let currentTrajetL: TrajetDataBlock | null = null;
    let currentTrajetR: TrajetDataBlock | null = null;

    lines.forEach((line, index) => {
        const parts = line.split('\t').map(p => p.trim());
        if (parts.length === 0 || parts.every(p => !p)) return;

        // 1. Detect Main Title (usually row 0 or a row with only one populated cell at the start)
        if (index < 5 && parts[0] && parts.slice(1).every(p => !p) && parts[0].includes('DATA')) {
            result.mainTitle = parts[0];
            return;
        }

        // 2. Detect Shift Time (ANY column: allows shifts between trajets)
        const shiftMatch = parts.find(p => p.match(/\d{2}:\d{2}\s*-\s*\d{2}:\d{2}/));
        if (shiftMatch) {
            currentShiftGroup = {
                shiftTime: shiftMatch,
                trajets: []
            };
            result.shiftGroups.push(currentShiftGroup);
            currentTrajetL = null;
            currentTrajetR = null;
            // Usually shift is alone on its line, but if not, we continue to check for Trajet titles
        }

        // 3. Detect Trajet Titles (Flexible column check: 0 and 6 are standard, but could vary)
        const hasTrajetTitle = parts.some(p => p.toLowerCase().includes('trajet'));
        if (hasTrajetTitle && currentShiftGroup) {
            // Check major column zones for trajet titles
            // Left side (usually col 0-2)
            const trajetLTitle = parts.slice(0, 3).find(p => p.toLowerCase().includes('trajet'));
            if (trajetLTitle) {
                currentTrajetL = { title: trajetLTitle, rows: [] };
                currentShiftGroup.trajets.push(currentTrajetL);
            }
            
            // Right side (usually col 6-8)
            const trajetRTitle = parts.slice(6, 9).find(p => p.toLowerCase().includes('trajet'));
            if (trajetRTitle) {
                currentTrajetR = { title: trajetRTitle, rows: [] };
                currentShiftGroup.trajets.push(currentTrajetR);
            }
            return;
        }

        // 4. Skip Labels row (Name, Place, etc.)
        if (parts.some(p => p.toLowerCase().includes('name') || p.toLowerCase().includes('place'))) {
            return;
        }

        // 5. Data Rows
        if (currentShiftGroup) {
            // Left Trajet (Col 0: Name, Col 1: Place, Col 2: Time, Col 4: Phone)
            if (currentTrajetL && parts[0] && parts[0].length > 2 && parts[1]) {
                currentTrajetL.rows.push({
                    name: parts[0],
                    address: parts[1],
                    time: parts[2] || '',
                    phone: parts[4] || '',
                    lieu: detectLieu(parts[0], parts[1])
                });
            }
            // Right Trajet (Col 6: Name, Col 7: Place, Col 8: Time, Col 10: Phone)
            if (currentTrajetR && parts[6] && parts[6].length > 2 && parts[7]) {
                currentTrajetR.rows.push({
                    name: parts[6],
                    address: parts[7],
                    time: parts[8] || '',
                    phone: parts[10] || '',
                    lieu: detectLieu(parts[6], parts[7])
                });
            }
        }
    });

    return result;
}

export function generateTrajet(
    periodIndex: 0 | 1 | 3 | 5, 
    planning: PlanningItem[], 
    dbEmployees: TransportEmployee[],
    groups: TransportGroup[] = [],
    specialSelections: string[] = [],
    dayNames?: string[],
    planningDates?: string[]
): TrajetBlock[] {
    const trajetMap: { [key: string]: TrajetBlock } = {};
    const PERIOD_NAMES = dayNames || ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

    const day1Name = PERIOD_NAMES[periodIndex];
    const isSingleDay = periodIndex === 0;
    const day2Name = isSingleDay ? undefined : PERIOD_NAMES[periodIndex + 1];

    const day1Date = planningDates && planningDates[periodIndex];
    const day2Date = !isSingleDay && planningDates && planningDates[periodIndex + 1];

    // Process Planning Data
    planning.forEach(item => {
        const dbEmp = dbEmployees.find(e => e.fullName.toLowerCase() === item.name.toLowerCase());
        if (!dbEmp) return;

        const shift1 = item.shifts[periodIndex];
        const shift2 = isSingleDay ? null : item.shifts[periodIndex + 1];

        if (shift1 || shift2) {
            if (!trajetMap[dbEmp.lieu]) {
                trajetMap[dbEmp.lieu] = {
                    lieu: dbEmp.lieu,
                    day1Name,
                    day2Name,
                    day1Date: day1Date || undefined,
                    day2Date: day2Date || undefined,
                    employees: []
                };
            }
            trajetMap[dbEmp.lieu].employees.push({
                id: dbEmp.id,
                name: dbEmp.fullName,
                address: dbEmp.address,
                phone: dbEmp.phone,
                shift1,
                shift2,
                isMotorise: !!dbEmp.isMotorise
            });
        }
    });

    // Process Special Employees with new conditional logic
    dbEmployees.forEach(emp => {
        if (!emp.isSpecial) return;

        const id = emp.id?.toString() || '';
        const dayFlags = [emp.mon, emp.tue, emp.wed, emp.thu, emp.fri, emp.sat, emp.sun];
        const isWorkingInPeriod = dayFlags[periodIndex] || (!isSingleDay && dayFlags[periodIndex + 1]);

        let shouldInclude = false;

        if (!emp.specialGroup) {
            // Solo special: Auto-include based on personal day flags
            if (isWorkingInPeriod) {
                shouldInclude = true;
            }
        } else {
            // Has a group: 
            const group = groups.find(g => g.name === emp.specialGroup);
            if (group) {
                const groupDayFlags = [group.mon, group.tue, group.wed, group.thu, group.fri, group.sat, group.sun];
                const groupIsActiveForPeriod = groupDayFlags[periodIndex] || (!isSingleDay && groupDayFlags[periodIndex + 1]);

                if (groupIsActiveForPeriod) {
                    // Current period is a GROUP DAY -> Manual selection required
                    if (specialSelections.includes(id)) {
                        shouldInclude = true;
                    }
                } else {
                    // Current period is NOT a group day -> Auto-include IF it's an individual work day
                    if (isWorkingInPeriod) {
                        shouldInclude = true;
                    }
                }
            } else {
                // Fallback: If group missing, treat as solo
                if (isWorkingInPeriod) {
                    shouldInclude = true;
                }
            }
        }

        if (shouldInclude) {
            // Avoid duplicates if already in via planning
            const alreadyIn = trajetMap[emp.lieu]?.employees.some(e => e.id === emp.id);
            if (!alreadyIn) {
                if (!trajetMap[emp.lieu]) {
                    trajetMap[emp.lieu] = {
                        lieu: emp.lieu,
                        day1Name,
                        day2Name,
                        day1Date: day1Date || undefined,
                        day2Date: day2Date || undefined,
                        employees: []
                    };
                }
                
                const shiftVal = emp.specialShift || '9H';
                
                // If they are in a group and manually selected, force the shift
                // Otherwise use their day flags
                const shift1 = ((emp.specialGroup && specialSelections.includes(id)) || dayFlags[periodIndex]) ? shiftVal : null;
                const shift2 = !isSingleDay && ((emp.specialGroup && specialSelections.includes(id)) || dayFlags[periodIndex + 1]) ? shiftVal : null;
                
                trajetMap[emp.lieu].employees.push({
                    id: emp.id,
                    name: emp.fullName,
                    address: emp.address,
                    phone: emp.phone,
                    shift1,
                    shift2,
                    isMotorise: !!emp.isMotorise,
                    specialGroup: emp.specialGroup
                });
            }
        }
    });

    // Sort employees within each location by shift time (15H > 11H > 9H) then alphabetically
    const shiftPriority: { [key: string]: number } = { '15H': 1, '11H': 2, '9H': 3 };
    
    Object.values(trajetMap).forEach(block => {
        block.employees.sort((a, b) => {
            // Get the primary shift (shift1 or shift2, whichever exists)
            const shiftA = a.shift1 || a.shift2 || '9H';
            const shiftB = b.shift1 || b.shift2 || '9H';
            
            // Compare by shift priority first
            const priorityA = shiftPriority[shiftA] || 99;
            const priorityB = shiftPriority[shiftB] || 99;
            
            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }
            
            // If same shift, sort alphabetically by name
            return a.name.localeCompare(b.name);
        });
    });

    return Object.values(trajetMap).sort((a, b) => a.lieu.localeCompare(b.lieu));
}
