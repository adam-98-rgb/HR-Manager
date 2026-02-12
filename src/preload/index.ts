import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
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
    selectFile: (filters?: any[]) => ipcRenderer.invoke('file:select', { filters }),
    selectAndCopy: () => ipcRenderer.invoke('file:selectAndCopy'),
    getAppPath: () => ipcRenderer.invoke('app:getPath'),
    getUsers: () => ipcRenderer.invoke('db:getUsers'),
    updateUser: (id: number, data: any) => ipcRenderer.invoke('db:updateUser', { id, data }),
    createUser: (user: any) => ipcRenderer.invoke('db:createUser', { user }),
    deleteUser: (id: number) => ipcRenderer.invoke('db:deleteUser', { id }),
    getUserCompanies: (userId: number) => ipcRenderer.invoke('db:getUserCompanies', { userId }),
    updateUserCompanies: (userId: number, companyIds: number[]) => ipcRenderer.invoke('db:updateUserCompanies', { userId, companyIds }),
    updateCompany: (id: number, data: any) => ipcRenderer.invoke('db:updateCompany', { id, data }),
    // Documents
    getCompanyDocuments: (companyId: number) => ipcRenderer.invoke('db:getCompanyDocuments', { companyId }),
    addCompanyDocument: (companyId: number, name: string, path: string) => ipcRenderer.invoke('db:addCompanyDocument', { companyId, name, path }),
    deleteCompanyDocument: (id: number) => ipcRenderer.invoke('db:deleteCompanyDocument', { id }),
    saveCompanyDocument: (companyName: string, filePath: string) => ipcRenderer.invoke('file:saveCompanyDocument', { companyName, filePath }),
    downloadDocument: (path: string) => ipcRenderer.invoke('file:download', { path }),
    
    // Assurance
    getAssuranceCompanies: () => ipcRenderer.invoke('db:getAssuranceCompanies'),
    addAssuranceCompany: (company: any) => ipcRenderer.invoke('db:addAssuranceCompany', company),
    deleteAssuranceCompany: (id: number) => ipcRenderer.invoke('db:deleteAssuranceCompany', { id }),

    openPath: (path: string) => ipcRenderer.invoke('file:openPath', { path })
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
