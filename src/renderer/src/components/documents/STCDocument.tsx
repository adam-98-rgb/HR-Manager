
interface STCProps {
    fullName: string;
    cin: string;
    position: string;
    startDate: string;
    endDate: string;
    gender: string;
    companyName?: string;
    totalAmount?: number;
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
    #stc-doc {
        font-family: "Times New Roman", Times, serif !important;
    }
    #stc-doc * {
        font-family: "Times New Roman", Times, serif !important;
    }
`;

export const STCDocument = ({
    fullName,
    cin,
    position,
    startDate,
    endDate,
    gender,
    companyName = "DATA GRID CONNECT SARL",
    totalAmount = 0
}: STCProps) => {
    const salutation = gender.toLowerCase() === 'female' ? 'Mme.' : 'M.';
    const today = new Date().toLocaleDateString('fr-FR');
    const formattedStartDate = new Date(startDate).toLocaleDateString('fr-FR');
    const formattedEndDate = new Date(endDate).toLocaleDateString('fr-FR');

    return (
        <div id="stc-doc" className="bg-white text-black print:text-black">
            <style>{styles}</style>
            <div className="max-w-[210mm] mx-auto font-serif text-[12pt] leading-[1.6] text-justify p-0">
                <div className="page-container px-[20mm] pt-[40mm] pb-[10mm] min-h-[297mm] flex flex-col">
                    <div className="flex-1 flex flex-col">
                        <div className="text-right mb-16">
                            <p>Fait à Tanger, le {today}</p>
                        </div>

                        <h1 className="text-center text-[22pt] font-extrabold mb-16 uppercase underline tracking-widest">
                            REÇU POUR SOLDE DE TOUT COMPTE
                        </h1>

                        <div className="space-y-10 text-[13pt]">
                            <p>
                                Je soussigné, {salutation} <strong className="uppercase">{fullName}</strong>, titulaire de la CIN N° : <strong>{cin}</strong>,
                                ayant occupé le poste de <strong>{position}</strong> au sein de la société <strong>{companyName}</strong> du <strong>{formattedStartDate}</strong> au <strong>{formattedEndDate}</strong>,
                                reconnais avoir reçu de ladite société, à titre de solde de tout compte, la somme de :
                            </p>

                            <div className="py-6 px-10 border-2 border-black bg-gray-50/50 text-center text-[18pt] font-bold">
                                {totalAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} Dirhams
                            </div>

                            <p>
                                Cette somme m'est versée pour solde de tout compte, en règlement de tous salaires, indemnités de toute nature,
                                congés payés et de façon générale, de toutes sommes qui m'étaient dues au titre de l'exécution et de la cessation de mon contrat de travail.
                            </p>

                            <p>
                                Je reconnais n'avoir plus aucun droit, à quelque titre que ce soit, contre la société <strong>{companyName}</strong>,
                                ses représentants et ses préposés.
                            </p>

                            <p className="italic text-[10pt]">
                                "Bon pour pour solde de tout compte et désistement de tout droit ou action" (Mention manuscrite obligatoire)
                            </p>

                            <div className="pt-16 flex justify-end">
                                <div className="text-center min-w-[300px]">
                                    <p className="font-bold underline mb-24 uppercase tracking-widest text-[11pt]">Signature du Salarié (Précédée de la mention manuscrite)</p>
                                    <div className="w-full h-32 border-2 border-dashed border-gray-100 rounded-lg"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
