
interface AttestationSalaireProps {
    fullName: string;
    cin: string;
    position: string;
    salary: number;
    gender: string;
    companyName?: string;
}

const styles = `
    @media print {
        @page {
            size: A4;
            margin: 0;
        }
        body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
        }
    }
    #attestation-salaire {
        font-family: "Times New Roman", Times, serif !important;
    }
    #attestation-salaire * {
        font-family: "Times New Roman", Times, serif !important;
    }
`;

const numberToWordsFR = (n: number | string): string => {
    const numValue = typeof n === 'string' ? parseFloat(n.replace(/[^0-9.]/g, '')) : n;
    if (isNaN(numValue)) return '';

    const ones = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
    const tens = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingts', 'quatre-vingt-dix'];
    const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];

    if (numValue === 0) return 'zéro';

    const convert = (num: number): string => {
        if (num < 10) return ones[num];
        if (num >= 10 && num < 20) return teens[num - 10];
        if (num >= 20 && num < 70) {
            const ten = Math.floor(num / 10);
            const unit = num % 10;
            return tens[ten] + (unit === 1 ? ' et un' : (unit > 0 ? '-' + ones[unit] : ''));
        }
        if (num >= 70 && num < 80) {
            const unit = num % 10;
            return 'soixante-' + teens[unit];
        }
        if (num >= 80 && num < 90) {
            const unit = num % 10;
            return 'quatre-vingt' + (unit > 0 ? '-' + ones[unit] : 's');
        }
        if (num >= 90 && num < 100) {
            const unit = num % 10;
            return 'quatre-vingt-' + teens[unit];
        }
        if (num >= 100 && num < 1000) {
            const hundred = Math.floor(num / 100);
            const rest = num % 100;
            const hundredStr = hundred === 1 ? 'cent' : ones[hundred] + ' cents';
            return hundredStr + (rest > 0 ? ' ' + convert(rest) : '');
        }
        if (num >= 1000 && num < 1000000) {
            const thousand = Math.floor(num / 1000);
            const rest = num % 1000;
            const thousandStr = thousand === 1 ? 'mille' : convert(thousand) + ' mille';
            return thousandStr + (rest > 0 ? ' ' + convert(rest) : '');
        }
        return num.toString();
    };

    const words = convert(Math.floor(numValue));
    return words.charAt(0).toUpperCase() + words.slice(1);
};

export const AttestationSalaireDocument = ({
    fullName,
    cin,
    position,
    salary,
    gender,
    companyName = "DATA GRID CONNECT SARL"
}: AttestationSalaireProps) => {
    const salutation = gender.toLowerCase() === 'female' ? 'Mme.' : 'M.';
    const today = new Date().toLocaleDateString('fr-FR');
    const salaryInWords = numberToWordsFR(salary);

    return (
        <div id="attestation-salaire" className="bg-white text-black print:text-black">
            <style>{styles}</style>
            <div className="max-w-[210mm] mx-auto font-serif text-[12pt] leading-[1.6] text-justify p-0">
                <div className="page-container px-[20mm] pt-[40mm] pb-[10mm] min-h-[297mm] flex flex-col">
                    <div className="flex-1 flex flex-col">
                        <div className="text-right mb-16">
                            <p>Fait à Tanger, le {today}</p>
                        </div>

                        <h1 className="text-center text-[22pt] font-extrabold mb-16 uppercase underline tracking-widest">
                            ATTESTATION DE SALAIRE
                        </h1>

                        <div className="space-y-10 text-[13pt]">
                            <p>
                                Je soussigné, le Gérant de la société <strong>{companyName}</strong>, certifie par la présente que :
                            </p>

                            <div className="py-6 px-10 border-l-4 border-black/10 bg-gray-50/30">
                                <p className="mb-4">
                                    {salutation} <strong className="uppercase">{fullName}</strong>
                                </p>
                                <p className="mb-4">
                                    Titulaire de la CIN N° : <strong>{cin}</strong>
                                </p>
                                <p className="mb-4">
                                    Occupe le poste de <strong>{position}</strong> au sein de notre établissement.
                                </p>
                                <p>
                                    Perçoit une rémunération mensuelle nette de <strong>{salary.toFixed(2)} Dirhams</strong> ({salaryInWords} Dirhams).
                                </p>
                            </div>

                            <p>
                                Cette attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit.
                            </p>

                            <div className="pt-24 flex justify-end">
                                <div className="text-center min-w-[250px]">
                                    <p className="font-bold underline mb-16 uppercase tracking-widest text-[11pt]">P/ La Direction</p>
                                    <div className="w-40 h-20 mx-auto border-2 border-dashed border-gray-100 rounded-lg flex items-center justify-center text-gray-200 uppercase text-[8pt] tracking-tighter">
                                        Cachet & Signature
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
