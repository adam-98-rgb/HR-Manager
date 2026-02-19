import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      db: {
        getStatus: () => Promise<boolean>
        setup: (data: any) => Promise<any>
        login: (credentials: any) => Promise<any>
        recoverAccount: (email: any) => Promise<any>
        getCompanies: () => Promise<any[]>
        addCompany: (company: any) => Promise<any>
        getEmployees: (params: { companyName: string, status: string }) => Promise<any[]>
        saveEmployee: (employee: any) => Promise<any>
        deleteEmployee: (params: { id: string, companyName: string, status: string }) => Promise<any>
        deleteCompany: (params: { id: number, name: string }) => Promise<any>
        selectFile: (params: { filters?: any[] }) => Promise<string | null>
        selectAndCopy: () => Promise<{ originalPath: string, previewPath: string } | null>
        getAppPath: () => Promise<string>
        getUsers: () => Promise<any[]>
        updateUser: (id: number, data: any) => Promise<void>
        createUser: (user: any) => Promise<number>
        deleteUser: (id: number) => Promise<void>
        getUserCompanies: (userId: number) => Promise<number[]>
        updateUserCompanies: (userId: number, companyIds: number[]) => Promise<void>
        updateCompany: (id: number, data: any) => Promise<void>
        // Candidates
        addCandidate: (params: { candidate: any, companyName: string }) => Promise<void>
        getCandidates: (params: { companyName: string }) => Promise<any[]>
        deleteCandidate: (params: { id: string, companyName: string }) => Promise<void>
        validateCandidate: (params: { candidate: any, companyName: string }) => Promise<void>
        getPayrollEmployees: (params: { companyName: string, status: string }) => Promise<any[]>
        updatePayrollData: (params: { id: string, companyName: string, status: string, data: any }) => Promise<void>

        // Employee Documents
        getEmployeeDocuments: (params: { employeeId: string, companyName: string }) => Promise<any[]>
        addEmployeeDocument: (params: { employeeId: string, companyName: string, name: string, path: string }) => Promise<number>
        deleteEmployeeDocument: (params: { id: number }) => Promise<void>

        // Transport
        getTransportEmployees: () => Promise<any[]>
        addTransportEmployee: (emp: any) => Promise<number>
        updateTransportEmployee: (params: { id: number, emp: any }) => Promise<void>
        deleteTransportEmployee: (id: number) => Promise<void>
        getTransportGroups: () => Promise<any[]>
        addTransportGroup: (params: { group: any }) => Promise<number>
        updateTransportGroup: (params: { id: number, group: any }) => Promise<void>
        deleteTransportGroup: (id: number) => Promise<void>

        // Assurance Records
        getAssurances: (params?: { companyName?: string }) => Promise<any[]>
        addAssurance: (record: any) => Promise<number>
        updateAssurance: (id: number, record: any) => Promise<void>
        deleteAssurance: (id: number) => Promise<void>
      }
      file: {
        select: (params: { filters?: any[] }) => Promise<string | null>
        selectAndCopy: () => Promise<{ originalPath: string, previewPath: string } | null>
        saveCandidateDocument: (params: { companyName: string, filePath: string, docType: string, candidateId: string }) => Promise<string>
        saveCompanyDocument: (params: { companyName: string, filePath: string }) => Promise<string>
        saveEmployeeDocument: (params: { companyName: string, employeeId: string, filePath: string }) => Promise<string>
        downloadDocument: (path: string) => Promise<boolean>
        download: (params: { path: string }) => Promise<boolean>
        openPath: (params: { path: string }) => Promise<void>
      }
    }
  }
}
