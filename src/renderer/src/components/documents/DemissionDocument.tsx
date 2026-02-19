
interface DemissionProps {
    fullName: string;
    cin: string;
    position: string;
    startDate: string;
    endDate: string;
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
    #demission-doc {
        font-family: "Times New Roman", Times, serif !important;
    }
    #demission-doc * {
        font-family: "Times New Roman", Times, serif !important;
    }
`;

export const DemissionDocument = ({
    fullName,
    cin,
    position,
    startDate,
    endDate,
    gender,
    companyName = "DATA GRID CONNECT SARL"
}: DemissionProps) => {
    const salutation = gender.toLowerCase() === 'female' ? 'Mme.' : 'M.';
    const today = new Date().toLocaleDateString('fr-FR');
    const formattedStartDate = new Date(startDate).toLocaleDateString('fr-FR');
    const formattedEndDate = new Date(endDate).toLocaleDateString('fr-FR');

    return (
        <div id="demission-doc" className="bg-white text-black print:text-black">
            <style>{styles}</style>
            <div className="max-w-[210mm] mx-auto font-serif text-[12pt] leading-[1.6] text-justify p-0">
                <div className="page-container px-[20mm] pt-[40mm] pb-[10mm] min-h-[297mm] flex flex-col">
                    <div className="flex-1 flex flex-col">
                        <div className="text-right mb-16">
                            <p>Fait à Tanger, le {today}</p>
                        </div>

                        <h1 className="text-center text-[22pt] font-extrabold mb-16 uppercase underline tracking-widest">
                            LETTRE DE DÉMISSION
                        </h1>

                        <div className="space-y-10 text-[13pt]">
                            <p>
                                À l'attention de la Direction de la société <strong>{companyName}</strong>.
                            </p>

                            <p>
                                Je soussigné, {salutation} <strong className="uppercase">{fullName}</strong>, titulaire de la CIN N° : <strong>{cin}</strong>,
                                occupant le poste de <strong>{position}</strong> au sein de votre établissement depuis le <strong>{formattedStartDate}</strong>,
                                vous informe par la présente de ma décision de démissionner de mes fonctions.
                            </p>

                            <p>
                                En respectant mon préavis légal, mon contrat prendra fin le <strong>{formattedEndDate}</strong>.
                            </p>

                            <p>
                                Je vous prie d'agréer, Monsieur le Gérant, l'expression de mes salutations distinguées.
                            </p>

                            <div className="pt-24 flex justify-between">
                                <div className="text-center min-w-[200px]">
                                    <p className="font-bold underline mb-16 uppercase tracking-widest text-[11pt]">Signature du Salarié</p>
                                    <div className="w-40 h-20 mx-auto border-2 border-dashed border-gray-100 rounded-lg"></div>
                                </div>
                                <div className="text-center min-w-[200px]">
                                    <p className="font-bold underline mb-16 uppercase tracking-widest text-[11pt]">Accusé de Réception</p>
                                    <div className="w-40 h-20 mx-auto border-2 border-dashed border-gray-100 rounded-lg flex items-center justify-center text-gray-200 uppercase text-[8pt] tracking-tighter text-center">
                                        Cachet & Signature <br /> Entreprise
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
