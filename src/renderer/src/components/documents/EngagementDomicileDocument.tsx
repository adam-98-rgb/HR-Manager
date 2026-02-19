
interface EngagementDomicileProps {
    fullName: string;
    cin: string;
    address: string;
    gender: string;
    companyName?: string;
    companyAddress?: string;
    companyICE?: string;
    companyIF?: string;
    companyRC?: string;
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
    #engagement-document {
        font-family: "Times New Roman", Times, serif !important;
    }
    #engagement-document * {
        font-family: "Times New Roman", Times, serif !important;
    }
`;

export const EngagementDomicileDocument = ({
    fullName,
    cin,
    address,
    gender,
}: EngagementDomicileProps) => {
    // Robust check for female, defaulting to M. (Monsieur)
    const salutation = gender.toLowerCase() === 'female' ? 'Mme.' : 'M.';

    return (
        <div id="engagement-document" className="bg-white text-black print:text-black">
            <style>{styles}</style>
            <div className="max-w-[210mm] mx-auto font-serif text-[12pt] leading-[1.6] text-justify p-0">
                <div className="page-container px-[20mm] pt-[40mm] pb-[10mm] min-h-[297mm] flex flex-col">
                    <div className="flex-1 flex flex-col justify-center">
                        <h1 className="text-center text-[20pt] font-bold mb-16 uppercase underline tracking-wider">
                            DECLARATION D'ELECTION DE DOMICILE
                        </h1>

                        <div className="space-y-8 text-[13pt]">
                            <p>
                                Je soussigné, {salutation} <strong className="uppercase">{fullName}</strong>{' '}
                                titulaire de la CIN N° <strong>{cin}</strong>, déclare par la présente élire mon domicile à l'adresse suivante :
                            </p>

                            <div className="py-8 text-center bg-gray-50/50 rounded-lg">
                                <strong className="text-[15pt]">{address}</strong>
                            </div>

                            <p>
                                Tous les courriers, correspondances, lettres, notifications ou documents officiels me seront envoyés à ladite adresse.
                            </p>

                            <p className="pt-8">
                                Cette déclaration est établie de bonne foi à la date de la légalisation de la signature.
                            </p>

                            <div className="pt-24 flex justify-end pr-12">
                                <div className="text-center min-w-[200px]">
                                    <div className="font-bold underline mb-4 uppercase">L'AGENT</div>
                                    <div className="font-bold mb-16">{salutation} {fullName.toUpperCase()}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};