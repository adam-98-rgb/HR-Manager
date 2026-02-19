export interface Employee {
  id: string
  fullName: string
  function: string
  gender: 'Male' | 'Female'
  phone: string
  email: string
  dateEmbauche: string
  dateAnciennete: string
  address: string
  cin: string
  cnss: string
  situation: 'Single' | 'Married' | 'Divorced' | 'Widowed'
  status: 'En cours' | 'Sortie' // Updated status type
  company: string
  photo: string
  dateNaissance: string
  rib: string
  dateSortie?: string
  motif?: string
  contratPath?: string
  engDomicilePath?: string
}

export const mockEmployees: Employee[] = [
  {
    id: 'EMP-001',
    fullName: 'Ruben Korsgaard',
    function: 'Frontend Developer',
    gender: 'Male',
    phone: '+1 234 567 890',
    email: 'ruben.k@company.com',
    dateEmbauche: '2023-02-04',
    dateAnciennete: '2023-02-04',
    address: '123 Tech Lane, Silicon Valley, CA',
    cin: 'AB123456',
    cnss: '987654321',
    situation: 'Single',
    status: 'En cours',
    company: 'Tech Corp',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ruben',
    dateNaissance: '1990-05-15',
    rib: '123456789012345678901234'
  },
  {
    id: 'EMP-002',
    fullName: 'Sarah Jenkins',
    function: 'Product Designer',
    gender: 'Female',
    phone: '+1 234 567 891',
    email: 'sarah.j@company.com',
    dateEmbauche: '2022-11-15',
    dateAnciennete: '2022-11-15',
    address: '456 Design Row, New York, NY',
    cin: 'CD789012',
    cnss: '123456789',
    situation: 'Married',
    status: 'En cours',
    company: 'Design Studio',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    dateNaissance: '1992-08-22',
    rib: '987654321098765432109876'
  },
  {
    id: 'EMP-003',
    fullName: 'Michael Chen',
    function: 'Backend Architect',
    gender: 'Male',
    phone: '+1 234 567 892',
    email: 'm.chen@company.com',
    dateEmbauche: '2021-05-20',
    dateAnciennete: '2021-05-20',
    address: '789 Server Road, Austin, TX',
    cin: 'EF345678',
    cnss: '456789123',
    situation: 'Married',
    status: 'En cours',
    company: 'Dev House',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
    dateNaissance: '1988-12-10',
    rib: '456123789045612378904561'
  },
  {
    id: 'EMP-004',
    fullName: 'Alizee Dubois',
    function: 'HR Manager',
    gender: 'Female',
    phone: '+1 234 567 893',
    email: 'a.dubois@company.com',
    dateEmbauche: '2020-01-10',
    dateAnciennete: '2020-01-10',
    address: '321 People Street, Paris, FR',
    cin: 'GH901234',
    cnss: '789123456',
    situation: 'Single',
    status: 'En cours',
    company: 'Tech Corp',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alizee',
    dateNaissance: '1995-03-30',
    rib: '789456123078945612307894'
  },
  {
    id: 'EMP-005',
    fullName: 'James Wilson',
    function: 'QA Engineering',
    gender: 'Male',
    phone: '+1 234 567 894',
    email: 'j.wilson@company.com',
    dateEmbauche: '2023-08-30',
    dateAnciennete: '2023-08-30',
    address: '654 Bug Lane, London, UK',
    cin: 'IJ567890',
    cnss: '321654987',
    situation: 'Single',
    status: 'Sortie',
    company: 'Design Studio',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
    dateNaissance: '1993-07-04',
    rib: '321654987032165498703216'
  },
  {
    id: 'EMP-006',
    fullName: 'Elena Rodriguez',
    function: 'Operations Director',
    gender: 'Female',
    phone: '+1 234 567 895',
    email: 'e.rodriguez@company.com',
    dateEmbauche: '2019-12-01',
    dateAnciennete: '2019-12-01',
    address: '987 Ops Blvd, Madrid, ES',
    cin: 'KL123456',
    cnss: '654789321',
    situation: 'Married',
    status: 'En cours',
    company: 'Dev House',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena',
    dateNaissance: '1985-11-20',
    rib: '654987321065498732106549'
  }
]
