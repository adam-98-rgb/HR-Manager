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
        selectFile: () => Promise<string | null>
        selectAndCopy: () => Promise<{ originalPath: string, previewPath: string } | null>
        getAppPath: () => Promise<string>
        getUsers: () => Promise<any[]>
        updateUser: (id: number, data: any) => Promise<void>
        createUser: (user: any) => Promise<number>
        deleteUser: (id: number) => Promise<void>
        getUserCompanies: (userId: number) => Promise<number[]>
        updateUserCompanies: (userId: number, companyIds: number[]) => Promise<void>
        updateCompany: (id: number, data: any) => Promise<void>
      }
    }
  }
}
