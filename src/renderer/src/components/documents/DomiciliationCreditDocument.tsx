
interface DomiciliationCreditProps {
    fullName: string;
    cin: string;
    rib: string;
    gender: string;
    companyName?: string;
    companyAddress?: string;
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
    #domiciliation-credit {
        font-family: "Times New Roman", Times, serif !important;
    }
    #domiciliation-credit * {
        font-family: "Times New Roman", Times, serif !important;
    }
`;

export const DomiciliationCreditDocument = ({
    fullName,
    cin,
    rib,
    gender,
    companyName = "DATA GRID CONNECT SARL"
}: DomiciliationCreditProps) => {
    const salutation = gender.toLowerCase() === 'female' ? 'Mme.' : 'M.';
    const today = new Date().toLocaleDateString('fr-FR');

    return (
        <div id="domiciliation-credit" className="bg-white text-black print:text-black">
            <style>{styles}</style>
            <div className="max-w-[210mm] mx-auto font-serif text-[12pt] leading-[1.6] text-justify p-0">
                <div className="page-container px-[20mm] pt-[40mm] pb-[10mm] min-h-[297mm] flex flex-col">
                    <div className="flex-1 flex flex-col">
                        <div className="text-right mb-16">
                            <p>Fait à Tanger, le {today}</p>
                        </div>

                        <h1 className="text-center text-[20pt] font-extrabold mb-16 uppercase underline tracking-widest">
                            ATTESTATION DE DOMICILIATION DE SALAIRE
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
                                <p className="mb-6">
                                    Est notre salarié(e) et perçoit ses émoluments mensuels par virement bancaire sur son compte ouvert auprès de sa banque sous le RIB N° :
                                </p>
                                <div className="p-4 bg-white border border-black/10 rounded font-mono text-[14pt] text-center tracking-wider">
                                    {rib}
                                </div>
                            </div>

                            <p>
                                La présente attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit, notamment pour la constitution d'un dossier de crédit.
                            </p>

                            <p className="font-bold">
                                Par la présente, la société s'engage à ne procéder à aucun changement de domiciliation de salaire sans l'accord préalable écrit de la banque créancière.
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
