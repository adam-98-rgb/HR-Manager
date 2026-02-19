
interface CertificatTravailProps {
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
    #certificat-travail {
        font-family: "Times New Roman", Times, serif !important;
    }
    #certificat-travail * {
        font-family: "Times New Roman", Times, serif !important;
    }
`;

export const CertificatTravailDocument = ({
    fullName,
    cin,
    position,
    startDate,
    endDate,
    gender,
    companyName = "DATA GRID CONNECT SARL"
}: CertificatTravailProps) => {
    const salutation = gender.toLowerCase() === 'female' ? 'Mme.' : 'M.';
    const today = new Date().toLocaleDateString('fr-FR');
    const formattedStartDate = new Date(startDate).toLocaleDateString('fr-FR');
    const formattedEndDate = new Date(endDate).toLocaleDateString('fr-FR');

    return (
        <div id="certificat-travail" className="bg-white text-black print:text-black">
            <style>{styles}</style>
            <div className="max-w-[210mm] mx-auto font-serif text-[12pt] leading-[1.6] text-justify p-0">
                <div className="page-container px-[20mm] pt-[40mm] pb-[10mm] min-h-[297mm] flex flex-col">
                    <div className="flex-1 flex flex-col">
                        <div className="text-right mb-16">
                            <p>Fait à Tanger, le {today}</p>
                        </div>

                        <h1 className="text-center text-[22pt] font-extrabold mb-16 uppercase underline tracking-widest">
                            CERTIFICAT DE TRAVAIL
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
                                <p>
                                    A été employé(e) au sein de notre société en qualité de <strong>{position}</strong> du <strong>{formattedStartDate}</strong> au <strong>{formattedEndDate}</strong>.
                                </p>
                            </div>

                            <p>
                                {salutation} <strong className="uppercase">{fullName}</strong> nous quitte à ce jour libre de tout engagement.
                            </p>

                            <p>
                                En foi de quoi, ce certificat lui est délivré pour servir et valoir ce que de droit.
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
