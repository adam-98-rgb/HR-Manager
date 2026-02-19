interface ContratDocumentProps {
    employeeName: string;
    employeeFirstName: string;
    cin: string;
    dateOfBirth: string;
    address: string;
    position: string;
    startDate: string;
    salary: string;
    companyName?: string;
    companyAddress?: string;
    companyRC?: string;
    companyICE?: string;
    companyIF?: string;
    companyRepresentative?: string;
    companyLogo?: string;
}

const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
};

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

const PageFooter = ({ page, companyName, ice, ifNum, rc, address }: { page: number, companyName: string, ice: string, ifNum: string, rc: string, address: string }) => (
    <div className="mt-auto pt-4 pb-4 border-t border-black/10">
        <div className="flex items-start">
            <div className="flex-1 text-center">
                <div className="text-[9pt] font-bold text-black/70">
                    {companyName} | ICE : {ice} | IF : {ifNum} | RC : {rc}
                </div>
                <div className="text-[8pt] text-black/50 uppercase tracking-tight mt-0.5">
                    {address}
                </div>
            </div>
            <div className="text-[8pt] text-black/40 font-medium whitespace-nowrap ml-4">
                Page {page} / 5
            </div>
        </div>
    </div>
);

export default function ContratDocument({
    companyName = 'DATA GRID CONNECT SARL',
    companyAddress = 'LOT 159 ZONE LOGISTIQUE, TFZ Tanger- Maroc',
    companyRC = '102667',
    companyRepresentative = 'M. Larbi Alaoui Ismaili',
    companyLogo,
    companyICE = '',
    companyIF = '',
    employeeName,
    employeeFirstName,
    cin,
    dateOfBirth,
    address,
    position,
    salary,
    startDate
}: ContratDocumentProps): JSX.Element {
    const fullName = `${employeeName} ${employeeFirstName}`;
    const formattedSalary = salary;
    const salaryInWords = numberToWordsFR(salary);
    const formattedStartDate = formatDate(startDate);
    const formattedDateOfBirth = formatDate(dateOfBirth);

    return (
        <div id="contract-document" className="bg-white text-black print:text-black">
            <style>{styles}</style>
            <div className="max-w-[210mm] mx-auto font-serif text-[10.5pt] leading-[1.5] text-justify">
                {/* PAGE 1 */}
                <div id="page-1" className="page-container px-[20mm] pt-[15mm] pb-[10mm] min-h-[297mm] flex flex-col print:break-after-page">
                    <div className="flex-1">
                        {/* Logo */}
                        {companyLogo ? (
                            <div className="mb-4 text-left">
                                <img src={companyLogo} alt={companyName} className="h-12 object-contain" />
                            </div>
                        ) : (
                            <div className="mb-4 h-12" />
                        )}

                        <h1 className="text-center text-[16pt] font-bold mb-4 uppercase tracking-wider">CONTRAT DE TRAVAIL</h1>

                        <p className="mb-3">
                            La société <strong>{companyName}</strong>, dont le siège social est à{' '}
                            <strong>{companyAddress}</strong>, immatriculée au registre de commerce de Tanger{' '}
                            <strong>{companyRC}</strong>, et représentée au présent contrat par {companyRepresentative}, Fondé de Pouvoirs.
                            Dans le cadre du développement de son activité, la société <strong>{companyName}</strong> engage :
                        </p>

                        <table className="mb-3 ml-4 text-[10.5pt]">
                            <tbody>
                                <tr><td className="font-bold pr-8 py-0.5">Nom</td><td className="py-0.5">: {employeeName}</td></tr>
                                <tr><td className="font-bold pr-8 py-0.5">Prénom</td><td className="py-0.5">: {employeeFirstName}</td></tr>
                                <tr><td className="font-bold pr-8 py-0.5">CIN</td><td className="py-0.5">: {cin}</td></tr>
                                <tr><td className="font-bold pr-8 py-0.5">Date de naissance</td><td className="py-0.5">: {formattedDateOfBirth}</td></tr>
                                <tr><td className="font-bold pr-8 py-0.5">Adresse</td><td className="py-0.5">: {address}</td></tr>
                            </tbody>
                        </table>

                        <p className="mb-3">
                            Ci-dessus nommé employé « AGENT »<br />
                            Les deux parties ont convenu ce qui suit :
                        </p>

                        <h2 className="font-bold text-[10.5pt] mb-1.5 uppercase text-slate-900 font-serif">ARTICLE 1 : EMBAUCHE ET AFFECTATION</h2>
                        <p className="mb-3">
                            D'un commun accord, vous êtes recruté en qualité de <strong>{position}</strong> à partir du{' '}
                            <strong>{formattedStartDate}</strong>.<br />
                            <strong>M. {fullName}</strong> exercera ses fonctions sous l'autorité et selon les directives du
                            responsable auquel rendra compte de son activité.
                        </p>

                        <h2 className="font-bold text-[10.5pt] mb-1.5 uppercase text-slate-900 font-serif">ARTICLE 2 : HORAIRES DE TRAVAIL</h2>
                        <p className="mb-3">
                            L'AGENT travaillera 26 jours par mois.<br />
                            Il est expressément convenu par les parties et accepté de manière définitive et irrévocable par L'AGENT que
                            durant le mois de ramadan, aucun changement d'horaires ne sera opéré.
                        </p>

                        <h2 className="font-bold text-[10.5pt] mb-1.5 uppercase text-slate-900 font-serif">ARTICLE 3 : REMUNERATION ET AVANTAGES</h2>
                        <p className="mb-1.5">
                            <strong>4.1</strong> La rémunération de <strong>M. {fullName}</strong> se compose d'une
                            rémunération fixe nette mensuelle de {formattedSalary} Dirhams ({salaryInWords} Dirhams) ;
                        </p>
                        <p className="mb-3">
                            <strong>4.2</strong> L'AGENT bénéficiera de tous les avantages sociaux dispensés par l'Assurance Maladie
                            Obligatoire et par la Caisse Nationale de Sécurité Sociale (CNSS).
                        </p>

                        <h2 className="font-bold text-[10.5pt] mb-1.5 uppercase text-slate-900 font-serif">ARTICLE 4 : IMPOTS</h2>
                        <p className="mb-3">
                            Les impôts (IR) à votre charge seront déduits du montant brut de vos rémunérations mensuelles acquises. Le
                            net des appointements, des primes et indemnités constituant le salaire net total, sera versé mensuellement
                            sur le compte bancaire dont le RIB a été fourni par vos soins.
                        </p>
                    </div>
                    <PageFooter page={1} companyName={companyName} ice={companyICE} ifNum={companyIF} rc={companyRC} address={companyAddress} />
                </div>

                {/* PAGE 2 */}
                <div id="page-2" className="page-container px-[20mm] pt-[15mm] pb-[10mm] min-h-[297mm] flex flex-col print:break-after-page">
                    <div className="flex-1">
                        <h2 className="font-bold text-[10.5pt] mb-1.5 uppercase text-slate-900 font-serif">ARTICLE 5 : PERIODE D'ESSAI</h2>
                        <p className="mb-3">
                            Votre période d'essai sera de un mois et demi renouvelables une seule fois pour une période identique ou
                            moindre. Sauf notification de confirmation par écrit à l'issue de la première période, ladite période
                            d'essai est automatiquement renouvelée pour une période identique. Au cours de cette période, vous devrez
                            faire la preuve de votre aptitude à assurer les fonctions qui vous sont confiées. Durant la période d'essai,
                            qu'il s'agisse de la période initiale ou de celle qui la proroge, chacune des parties peut rompre le contrat
                            moyennant un préavis de 8 (Huit) jours et sans indemnité.
                        </p>

                        <h2 className="font-bold text-[10.5pt] mb-1.5 uppercase text-slate-900 font-serif">ARTICLE 6 : TRANSFERT ET MOBILITE</h2>
                        <p className="mb-3">
                            Vous pourrez éventuellement être amené à occuper un autre emploi que celui que vous occupiez initialement ou
                            être affecté à l'exécution d'autres tâches suivant les besoins du service et suivant vos qualifications.
                            Compte tenu des activités de la société {companyName}, vous pourrez être conduit à vous voir
                            proposer tout changement de lieu de travail nécessité par l'intérêt du fonctionnement de l'entreprise sur
                            l'ensemble du territoire marocain. Vous ne pourriez refuser une telle mutation qui vous sera signifiée par
                            tout moyen. Cette mutation se fera avec maintien des mêmes droits acquis sauf accord sur des avantages plus
                            favorables pour vous et ce, conformément aux dispositions de l'article 19 de la loi 65-99 relative au Code
                            du Travail Marocain.
                        </p>

                        <h2 className="font-bold text-[10.5pt] mb-1.5 uppercase text-slate-900 font-serif">ARTICLE 7 : ABSENCE ET INDISPONIBILITE</h2>
                        <p className="mb-3">
                            En cas d'absence pour maladie ou accident, L'AGENT devra immédiatement en aviser l'employeur ou le justifier
                            par la production d'un certificat médical dans les 24 heures.
                        </p>

                        <h2 className="font-bold text-[10.5pt] mb-1.5 uppercase text-slate-900 font-serif">ARTICLE 8 : CONGES</h2>
                        <p className="mb-3">
                            Les congés annuels seront calculés à raison de un jour et demi (1.5 jour) par mois travaillé ou 18 jours par
                            année de travail qui ne pourra cependant en aucun cas et en aucun moment dépasser 60 (Soixante) jours
                            conformément à la législation du travail en vigueur. Ce congé sera accordé par L'EMPLOYEUR en considération
                            des nécessités du service afin de ne pas entraver la bonne marche de L'EMPLOYEUR.
                        </p>

                        <h2 className="font-bold text-[10.5pt] mb-1.5 uppercase text-slate-900 font-serif">ARTICLE 9 : DUREE DU CONTRAT ET PREAVIS</h2>
                        <p className="mb-3">
                            Le présent contrat est conclu pour une durée indéterminée. Ce contrat peut prendre fin moyennant un préavis
                            d'un mois de la part de l'employé ou de l'employeur.
                        </p>
                    </div>
                    <PageFooter page={2} companyName={companyName} ice={companyICE} ifNum={companyIF} rc={companyRC} address={companyAddress} />
                </div>

                {/* PAGE 3 */}
                <div id="page-3" className="page-container px-[20mm] pt-[15mm] pb-[10mm] min-h-[297mm] flex flex-col print:break-after-page">
                    <div className="flex-1">
                        <p className="mb-3">
                            L'employé pourra se libérer de son mois de préavis moyennant le paiement d'un mois de son salaire. Ce
                            contrat prendra fin dans le cas de faute grave, lourde, ou cas de force majeur conformément à la législation
                            en vigueur.
                        </p>
                        <p className="mb-3">
                            Le présent contrat prendra fin le premier jour du trimestre civil suivant le soixantième anniversaire de
                            l'agent, date à laquelle l'agent sera amené à faire valoir ses droits à la retraite.
                        </p>

                        <h2 className="font-bold text-[10.5pt] mb-1.5 uppercase text-slate-900 font-serif">ARTICLE 10 : PRESTATION DE TRAVAIL</h2>
                        <p className="mb-1.5">
                            <strong>10.1</strong> L'AGENT s'engage à fournir avec conscience et dévouement sa prestation de travail
                            ainsi que toutes les fonctions qui lui seront confiées dans le cadre de ses compétences.
                        </p>
                        <p className="mb-1.5">
                            <strong>10.2</strong> Il s'oblige à observer le secret professionnel absolu sur toutes les informations
                            portées à sa connaissance et, même avoir quitté son poste auprès L'EMPLOYEUR.
                        </p>
                        <p className="mb-1.5">
                            <strong>10.3</strong> L'AGENT sera considéré comme démissionnaire dans le cas où il se livrerait pendant la
                            durée du présent contrat à toute autre activité lucrative de quelque nature que ce soit, sans avoir requis et
                            obtenu à cet effet l'autorisation préalable et expresse de L'EMPLOYEUR.
                        </p>
                        <p className="mb-1">
                            <strong>10.4</strong> L'AGENT s'engage à :
                        </p>
                        <ul className="list-disc ml-8 mb-3">
                            <li>Respecter le règlement interne de L'EMPLOYEUR les conditions de travail et toute prescription à caractère général ou particulier.</li>
                            <li>Se conformer à l'organisation du travail établie par L'EMPLOYEUR et notamment l'organisation du temps de travail et le respect de la durée du travail.</li>
                        </ul>

                        <h2 className="font-bold text-[10.5pt] mb-1.5 uppercase text-slate-900 font-serif">ARTICLE 11 : OBLIGATION DE CONFIDENTIALITE</h2>
                        <p className="mb-1.5">
                            <strong>11.1</strong> L'AGENT s'engage à garder une réserve absolue de toutes les données obtenues lors de
                            son travail pour le compte de L'EMPLOYEUR and garantira une confidentialité absolue, and ceci même après la
                            fin de la présente relation contractuelle.
                        </p>
                        <p className="mb-1.5 text-[10pt]">
                            L'AGENT s'engage expressément au secret professionnel and à garder une réserve maximale ainsi que la
                            confidentialité des données auxquelles il aura accès or qu'il aurait déjà utilisé au niveau de son poste de
                            travail, and s'engage à ne pas les divulguer, à ne pas les publier ni d'aucune forme que ce soit, qu'elle
                            soit directe ou indirecte, or à les mettre à la disposition de tiers, sauf en cas d'autorisation expresse and
                            écrite de la part de L'EMPLOYEUR.
                        </p>
                        <p className="mb-1.5 text-[10pt]">
                            De la même manière, L'AGENT s'engage à ne pas garder de copie de donnée, ni de tout autre matériel,
                            information or de documentation dérivée des services cités or de n'importe quelle activité à laquelle un
                            accès lui a été octroyé, pour l'exécution du présent contrat, il devra aussi respecter toutes les mesures de
                            sécurité que L'EMPLOYEUR aura mis en place pour garantir la confidentialité de l'information.
                        </p>
                        <p className="mb-3 text-[10pt]">
                            La durée des obligations établies dans cette clause a un caractère indéfini and restera aussi en vigueur même
                            en cas de départ de L'EMPLOYÉ de L'EMPLOYEUR.
                        </p>
                    </div>
                    <PageFooter page={3} companyName={companyName} ice={companyICE} ifNum={companyIF} rc={companyRC} address={companyAddress} />
                </div>

                {/* PAGE 4 */}
                <div id="page-4" className="page-container px-[20mm] pt-[15mm] pb-[10mm] min-h-[297mm] flex flex-col print:break-after-page">
                    <div className="flex-1">
                        <p className="mb-1.5">
                            <strong>11.2</strong> L'AGENT s'engage, au terme de son contrat de travail, à restituer à L'EMPLOYEUR tous
                            les supports reçus, quelle que soit leur nature, notamment tout média contenant des informations, des
                            fichiers, etc., utilisés mis à sa disposition or constitués dans le cadre or à l'occasion de ses fonctions.
                        </p>
                        <p className="mb-1.5">
                            <strong>11.3</strong> L'AGENT s'engage à s'acquitter pleinement de son devoir de confidentialité, ainsi que
                            pour le stockage de l'information and de son traitement. Il respectera les règles mises en place ainsi que
                            l'organisation nécessaire à caractère technique afin d'éviter toute altération, perte, traitement or accès
                            non autorisé. Dans le cas où cette clause ne serait pas respectée, L'EMPLOYEUR utilisera tous les moyens
                            qu'il jugera utile afin de demander réparation pour tout préjudice causé délibérément by le salarié en
                            terme de confidentialité and de protection de données.
                        </p>
                        <p className="mb-3">
                            <strong>11.4</strong> L'EMPLOYEUR reste exclusively titulaire des droits d'exploitation correspondant à
                            tout genre de création, d'application informatique, des bases de données, d'invention ainsi que de n'importe
                            quelle expression écrite or graphique or de projet que L'AGENT pourrait développer à l'occasion de la
                            relation de travail. De ce fait, L'EMPLOYE renonce in cet acte à n'importe quel droit patrimonial on les
                            dits travaux.
                        </p>

                        <h2 className="font-bold text-[10.5pt] mb-1.5 uppercase text-slate-900 font-serif">ARTICLE 12 : CLAUSE D'EXCLUSIVITE</h2>
                        <p className="mb-3">
                            L'AGENT s'engage à travailler uniquement and exclusively for le compte de la Société {companyName}, and de ce fait, il s'engage à ne se livrer, pendant la durée du présent contrat, à aucune autre
                            activité lucrative de quelque nature que ce soit, without avoir requis and obtenu à cet effet l'autorisation
                            préalable and expresse de L'EMPLOYEUR.
                        </p>

                        <h2 className="font-bold text-[10.5pt] mb-1.5 uppercase text-slate-900 font-serif">ARTICLE 13 : EXTINCTION</h2>
                        <p className="mb-1.5">
                            Le présent contrat pourra être résilié à tout moment by L'EMPLOYEUR in cas de faute grave and ce, without
                            indemnité ni préavis, conformément aux dispositions de l'article 61 du Code de Travail. Il pourra également
                            s'éteindre by la volonté de l'une or l'autre des parties qui n'aura pas à justifier sa décision by un
                            motif quelconque, and ce moyennant un préavis d'un mois donné by lettre recommandée with accusé de
                            réception.
                        </p>
                        <p className="mb-3">
                            Il pourra enfin s'éteindre by la volonté commune des parties à tout moment with or without observation d'un
                            délai de préavis. Quel que soit le motif de l'extinction, L'AGENT s'engage à restituer à L'EMPLOYEUR tous
                            documents and autres effets mis à sa disposition for les besoins de ses fonctions and ce without délai and sous
                            peine d'une astreinte journalière de 500,00 Dhs par jour de retard in the restitution de l'un des effets
                            dont il s'agit. L'astreinte prendra effet du jour de l'extinction du contrat without besoins d'aucune mise en
                            demeure.
                        </p>
                    </div>
                    <PageFooter page={4} companyName={companyName} ice={companyICE} ifNum={companyIF} rc={companyRC} address={companyAddress} />
                </div>

                {/* PAGE 5 */}
                <div id="page-5" className="page-container px-[20mm] pt-[15mm] pb-[10mm] min-h-[297mm] flex flex-col">
                    <div className="flex-1">
                        <h2 className="font-bold text-[10.5pt] mb-1.5 uppercase text-slate-900 font-serif">ARTICLE 14 : SITUATION PERSONNELLE</h2>
                        <p className="mb-3">
                            L'AGENT s'engage à transmettre without délai à la société toute modification pouvant intervenir in sa
                            situation personnelle notamment in matière d'état civil, de situation de famille or d'adresse.
                        </p>

                        <h2 className="font-bold text-[10.5pt] mb-1.5 uppercase text-slate-900 font-serif">ARTICLE 15 : LITIGES ET COMPETENCE</h2>
                        <p className="mb-4">
                            Tous les litiges pouvant naître à l'occasion de l'interprétation or de l'exécution des présentes seront
                            soumis aux tribunaux du siège social de la société.
                        </p>

                        <p className="mb-1.5">
                            Fait in trois exemplaires dont un for chacune des parties. Au niveau de L'AGENT la signature sera précédée
                            de la mention « Bon pour accord ».
                        </p>
                        <p className="mb-6">Fait à Tanger in deux exemplaires originaux, Le {formattedStartDate}.</p>

                        <div className="flex justify-between items-start mt-12 mb-20 px-12">
                            <div className="text-center">
                                <div className="font-bold underline mb-4">L'EMPLOYEUR</div>
                                <div className="font-bold mb-12">{companyName}</div>
                            </div>
                            <div className="text-center">
                                <div className="font-bold underline mb-4">L'AGENT</div>
                                <div className="font-bold mb-12">M. {fullName}</div>
                            </div>
                        </div>
                    </div>
                    <PageFooter page={5} companyName={companyName} ice={companyICE} ifNum={companyIF} rc={companyRC} address={companyAddress} />
                </div>
            </div>
        </div>
    );
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
    #contract-document {
        font-family: "Times New Roman", Times, serif !important;
    }
    #contract-document * {
        font-family: "Times New Roman", Times, serif !important;
    }
`;
