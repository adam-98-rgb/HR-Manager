import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
console.log('Preload script initializing...');

const api = {
  db: {
    getStatus: () => ipcRenderer.invoke('db:getStatus'),
    setup: (data: any) => ipcRenderer.invoke('db:setup', data),
    login: (credentials: any) => ipcRenderer.invoke('db:login', credentials),
    recoverAccount: (email: any) => ipcRenderer.invoke('db:recoverAccount', email),
    getCompanies: () => ipcRenderer.invoke('db:getCompanies'),
    addCompany: (company: any) => ipcRenderer.invoke('db:addCompany', company),
    getEmployees: (params: { companyName: string, status: string }) => ipcRenderer.invoke('db:getEmployees', params),
    saveEmployee: (employee: any) => ipcRenderer.invoke('db:saveEmployee', employee),
    deleteEmployee: (params: { id: string, companyName: string, status: string }) => ipcRenderer.invoke('db:deleteEmployee', params),
    deleteCompany: (params: { id: number, name: string }) => ipcRenderer.invoke('db:deleteCompany', params),
    selectFile: (params: { filters?: any[] }) => ipcRenderer.invoke('file:select', params),
    selectAndCopy: () => ipcRenderer.invoke('file:selectAndCopy'),
    getAppPath: () => ipcRenderer.invoke('app:getPath'),
    getUsers: () => ipcRenderer.invoke('db:getUsers'),
    updateUser: (id: number, data: any) => ipcRenderer.invoke('db:updateUser', { id, data }),
    createUser: (user: any) => ipcRenderer.invoke('db:createUser', { user }),
    deleteUser: (id: number) => ipcRenderer.invoke('db:deleteUser', { id }),
    getUserCompanies: (userId: number) => ipcRenderer.invoke('db:getUserCompanies', { userId }),
    updateUserCompanies: (userId: number, companyIds: number[]) => ipcRenderer.invoke('db:updateUserCompanies', { userId, companyIds }),
    updateCompany: (id: number, data: any) => ipcRenderer.invoke('db:updateCompany', { id, data }),
    getCompanyDocuments: (companyId: number) => ipcRenderer.invoke('db:getCompanyDocuments', { companyId }),
    addCompanyDocument: (companyId: number, name: string, path: string) => ipcRenderer.invoke('db:addCompanyDocument', { companyId, name, path }),
    deleteCompanyDocument: (id: number) => ipcRenderer.invoke('db:deleteCompanyDocument', { id }),
    saveCompanyDocument: (companyName: string, filePath: string) => ipcRenderer.invoke('file:saveCompanyDocument', { companyName, filePath }),
    downloadDocument: (path: string) => ipcRenderer.invoke('file:download', { path }),
    getEmployeeDocuments: (params: { employeeId: string, companyName: string }) => ipcRenderer.invoke('db:getEmployeeDocuments', params),
    addEmployeeDocument: (params: { employeeId: string, companyName: string, name: string, path: string }) => ipcRenderer.invoke('db:addEmployeeDocument', params),
    deleteEmployeeDocument: (params: { id: number }) => ipcRenderer.invoke('db:deleteEmployeeDocument', params),
    getAssuranceCompanies: () => ipcRenderer.invoke('db:getAssuranceCompanies'),
    addAssuranceCompany: (company: any) => ipcRenderer.invoke('db:addAssuranceCompany', company),
    deleteAssuranceCompany: (id: number) => ipcRenderer.invoke('db:deleteAssuranceCompany', { id }),
    setDefaultAssuranceCompany: (params: { id: number }) => ipcRenderer.invoke('db:setDefaultAssuranceCompany', params),
    // Assurance Records
    getAssurances: (params?: { companyName?: string }) => ipcRenderer.invoke('db:getAssurances', params),
    addAssurance: (record: any) => ipcRenderer.invoke('db:addAssurance', { record }),
    updateAssurance: (id: number, record: any) => ipcRenderer.invoke('db:updateAssurance', { id, record }),
    deleteAssurance: (id: number) => ipcRenderer.invoke('db:deleteAssurance', { id }),
    getAssuranceEmployees: () => ipcRenderer.invoke('db:getAssuranceEmployees'),
    updateAssuranceEmployee: (params: { id: string, companyName: string, data: any }) => ipcRenderer.invoke('db:updateAssuranceEmployee', params),
    addCandidate: (params: { candidate: any, companyName: string }) => ipcRenderer.invoke('db:addCandidate', params),
    getCandidates: (params: { companyName: string }) => ipcRenderer.invoke('db:getCandidates', params),
    deleteCandidate: (params: { id: string, companyName: string }) => ipcRenderer.invoke('db:deleteCandidate', params),
    validateCandidate: (params: { candidate: any, companyName: string }) => ipcRenderer.invoke('db:validateCandidate', params),
    getPayrollEmployees: (params: { companyName: string, status: string }) => ipcRenderer.invoke('db:getPayrollEmployees', params),
    updatePayrollData: (params: { id: string, companyName: string, status: string, data: any }) => ipcRenderer.invoke('db:updatePayrollData', params),
    openPath: (path: string) => ipcRenderer.invoke('file:openPath', { path }),
    // Transport
    getTransportEmployees: () => ipcRenderer.invoke('db:getTransportEmployees'),
    addTransportEmployee: (emp: any) => ipcRenderer.invoke('db:addTransportEmployee', { emp }),
    updateTransportEmployee: (params: { id: number, emp: any }) => ipcRenderer.invoke('db:updateTransportEmployee', params),
    deleteTransportEmployee: (id: number) => ipcRenderer.invoke('db:deleteTransportEmployee', { id }),
    getTransportGroups: () => ipcRenderer.invoke('db:getTransportGroups'),
    addTransportGroup: (params: { group: any }) => ipcRenderer.invoke('db:addTransportGroup', params),
    updateTransportGroup: (params: { id: number, group: any }) => ipcRenderer.invoke('db:updateTransportGroup', params),
    deleteTransportGroup: (id: number) => ipcRenderer.invoke('db:deleteTransportGroup', { id }),
    openPrint: (params: { html: string }) => ipcRenderer.invoke('window:openPrint', params)
  },
  file: {
    select: (params: { filters?: any[] }) => ipcRenderer.invoke('file:select', params),
    selectAndCopy: () => ipcRenderer.invoke('file:selectAndCopy'),
    saveCandidateDocument: (params: { companyName: string, filePath: string, docType: string, candidateId: string }) => ipcRenderer.invoke('file:saveCandidateDocument', params),
    saveCompanyDocument: (params: { companyName: string, filePath: string }) => ipcRenderer.invoke('file:saveCompanyDocument', params),
    saveEmployeeDocument: (params: { companyName: string, employeeId: string, filePath: string }) => ipcRenderer.invoke('file:saveEmployeeDocument', params),
    downloadDocument: (path: string) => ipcRenderer.invoke('file:download', { path }),
    download: (params: { path: string }) => ipcRenderer.invoke('file:download', params),
    openPath: (params: { path: string }) => ipcRenderer.invoke('file:openPath', params),
    printToPDF: (params: { filename: string }) => ipcRenderer.invoke('app:printToPDF', params),
    openPrint: (params: { html: string }) => ipcRenderer.invoke('window:openPrint', params)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    console.log('API exposed successfully via contextBridge');
  } catch (error) {
    console.error('Failed to expose API via contextBridge:', error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
  console.log('API exposed successfully via window object');
}
