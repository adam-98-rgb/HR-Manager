import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join, extname } from 'path'
import { copyFileSync, mkdirSync, existsSync } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import * as db from './db'


function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Database IPC Handlers
  ipcMain.handle('db:getStatus', async () => {
    return await db.checkSetup()
  })

  ipcMain.handle('db:setup', async (_, { user, companies }) => {
    const storagePath = join(process.cwd(), 'src', 'renderer', 'public', 'storage')
    if (!existsSync(storagePath)) mkdirSync(storagePath, { recursive: true })

    if (user.picture && existsSync(user.picture)) {
      const usersDir = join(storagePath, 'users')
      if (!existsSync(usersDir)) mkdirSync(usersDir, { recursive: true })
      
      const fileName = `${user.name}${extname(user.picture)}`
      const destPath = join(usersDir, fileName)
      
      if (user.picture !== destPath) {
        copyFileSync(user.picture, destPath)
      }
      user.picture = `/storage/users/${fileName}`
    } else {
      // Use default icon based on gender
      user.picture = '' // Let renderer handle default
    }

    await db.createUser(user)

    for (const company of companies) {
      if (company.logo && existsSync(company.logo) && !company.logo.includes('icons')) {
        const companyDir = join(storagePath, company.name.replace(/[^a-z0-9]/gi, '_').toLowerCase())
        if (!existsSync(companyDir)) mkdirSync(companyDir, { recursive: true })
        
        const logoName = `logo${extname(company.logo)}`
        const destPath = join(companyDir, logoName)
        copyFileSync(company.logo, destPath)
        company.logo = `/storage/${company.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}/${logoName}`
      }
      await db.addCompany(company)
    }
    const { password, ...userWithoutPassword } = user
    return userWithoutPassword
  })

  ipcMain.handle('db:login', async (_, { username, password }) => {
    return await db.login(username, password)
  })

  ipcMain.handle('db:recoverAccount', async (_, { email }) => {
    return await db.recoverAccount(email)
  })

  ipcMain.handle('db:getCompanies', async () => {
    return await db.getCompanies()
  })



  ipcMain.handle('db:getEmployees', async (_, params) => {
    const { companyName, status } = params || {}
    if (!companyName) {
      console.warn('db:getEmployees called without companyName')
      return []
    }
    const employees = await db.getEmployees(companyName, status)
    // Map avatar to photo for renderer consistency
    return employees.map(emp => ({
      ...emp,
      photo: emp.photo || emp.avatar
    }))
  })

  ipcMain.handle('db:saveEmployee', async (_, employee) => {
    const storagePath = join(process.cwd(), 'src', 'renderer', 'public', 'storage')
    if (!existsSync(storagePath)) mkdirSync(storagePath, { recursive: true })

    if (employee.photo && existsSync(employee.photo) && !employee.photo.includes('icons') && !employee.photo.startsWith('/storage')) {
      const companyDirName = employee.company.replace(/[^a-z0-9]/gi, '_').toLowerCase()
      const photosDir = join(storagePath, companyDirName, 'employees_photos')
      if (!existsSync(photosDir)) mkdirSync(photosDir, { recursive: true })
      
      const extension = extname(employee.photo) || '.jpg'
      const fileName = `${employee.id}${extension}`
      const destPath = join(photosDir, fileName)
      
      console.log('Copying photo from:', employee.photo, 'to:', destPath)
      
      if (employee.photo !== destPath) {
        copyFileSync(employee.photo, destPath)
      }
      const relativePath = `/storage/${companyDirName}/employees_photos/${fileName}`
      employee.avatar = relativePath 
      employee.photo = relativePath
    } else if (employee.photo && !employee.photo.startsWith('/storage') && !employee.photo.startsWith('http') && !employee.photo.includes('icons')) {
        // Handle cases where photo might be an absolute path but doesn't exist yet or is being updated
        employee.avatar = employee.photo
    }

    // Ensure company name is valid for table selection
    if (!employee.company) {
       console.error('Missing company for employee:', employee.id)
       throw new Error('Company is required to save an employee')
    }

    return await db.saveEmployee(employee, employee.company)
  })

  ipcMain.handle('file:select', async (_, { filters } = {}) => {
    const defaultFilters = [{ name: 'Images', extensions: ['jpg', 'png', 'jpeg', 'webp'] }]
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: filters || defaultFilters
    })
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0]
    }
    return null
  })

  // New handler to immediately copy selected image for preview
  ipcMain.handle('file:selectAndCopy', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['jpg', 'png', 'jpeg', 'webp'] }]
    })
    if (!result.canceled && result.filePaths.length > 0) {
      const sourcePath = result.filePaths[0]
      const storagePath = join(process.cwd(), 'src', 'renderer', 'public', 'storage', 'temp')
      if (!existsSync(storagePath)) mkdirSync(storagePath, { recursive: true })
      
      const fileName = `preview_${Date.now()}${extname(sourcePath)}`
      const destPath = join(storagePath, fileName)
      
      copyFileSync(sourcePath, destPath)
      
      return {
        originalPath: sourcePath,
        previewPath: `/storage/temp/${fileName}`
      }
    }
    return null
  })

  ipcMain.handle('app:getPath', () => process.cwd())
  
  ipcMain.handle('db:deleteEmployee', async (_, { id, companyName, status }) => {
    try {
        const storagePath = join(process.cwd(), 'storage')
        const companyDirName = companyName.replace(/[^a-z0-9]/gi, '_').toLowerCase()
        const photosDir = join(storagePath, companyDirName, 'employees_photos')
        
        if (existsSync(photosDir)) {
            const fs = require('fs')
            const files = fs.readdirSync(photosDir)
            const employeePhoto = files.find(f => f.startsWith(id))
            if (employeePhoto) {
                fs.unlinkSync(join(photosDir, employeePhoto))
            }
        }
    } catch (e) {
        console.error('Failed to delete employee photo:', e)
    }

    return await db.deleteEmployee(id, companyName, status)
  })

  ipcMain.handle('db:deleteCompany', async (_, { id, name }) => {
    try {
        const storagePath = join(process.cwd(), 'storage')
        const companyDirName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
        const companyDir = join(storagePath, companyDirName)
        
        if (existsSync(companyDir)) {
            const fs = require('fs')
            // Recursive deletion of company storage
            fs.rmSync(companyDir, { recursive: true, force: true })
        }
    } catch (e) {
        console.error('Failed to delete company storage:', e)
    }
    return await db.deleteCompany(id)
  })


  ipcMain.handle('db:getUsers', async () => {
    return await db.getAllUsers()
  })

  ipcMain.handle('db:updateUser', async (_, { id, data }) => {
    const storagePath = join(process.cwd(), 'src', 'renderer', 'public', 'storage')
    if (data.picture && existsSync(data.picture) && !data.picture.startsWith('/storage') && !data.picture.includes('icons')) {
        const usersDir = join(storagePath, 'users')
        if (!existsSync(usersDir)) mkdirSync(usersDir, { recursive: true })
        const fileName = `${data.name.replace(/[^a-z0-9]/gi, '_')}_${id}${extname(data.picture)}`
        const destPath = join(usersDir, fileName)
        if (data.picture !== destPath) copyFileSync(data.picture, destPath)
        data.picture = `/storage/users/${fileName}`
    }
    return await db.updateUser(id, data)
  })

  ipcMain.handle('db:deleteUser', async (_, { id }) => {
    return await db.deleteUser(id)
  })

  ipcMain.handle('db:getUserCompanies', async (_, { userId }) => {
    return await db.getUserCompanies(userId)
  })

  ipcMain.handle('db:updateUserCompanies', async (_, { userId, companyIds }) => {
    return await db.updateUserCompanies(userId, companyIds)
  })

  ipcMain.handle('db:updateCompany', async (_, { id, data }) => {
    const storagePath = join(process.cwd(), 'src', 'renderer', 'public', 'storage')
    if (data.logo && existsSync(data.logo) && !data.logo.startsWith('/storage') && !data.logo.includes('icons')) {
        const companyDir = join(storagePath, data.name.replace(/[^a-z0-9]/gi, '_').toLowerCase())
        if (!existsSync(companyDir)) mkdirSync(companyDir, { recursive: true })
        const logoName = `logo_${Date.now()}${extname(data.logo)}`
        const destPath = join(companyDir, logoName)
        copyFileSync(data.logo, destPath)
        data.logo = `/storage/${data.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}/${logoName}`
    }
    return await db.updateCompany(id, data)
  })

  ipcMain.handle('db:createUser', async (_, { user }) => {
     const storagePath = join(process.cwd(), 'src', 'renderer', 'public', 'storage')
     if (user.picture && existsSync(user.picture) && !user.picture.startsWith('/storage') && !user.picture.includes('icons')) {
        const usersDir = join(storagePath, 'users')
        if (!existsSync(usersDir)) mkdirSync(usersDir, { recursive: true })
        // We don't have ID yet, use timestamp or name
        const fileName = `${user.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}${extname(user.picture)}`
        const destPath = join(usersDir, fileName)
        if (user.picture !== destPath) copyFileSync(user.picture, destPath)
        user.picture = `/storage/users/${fileName}`
     }
     return await db.createUser(user)
  })
  
  ipcMain.handle('db:addCompany', async (_, company) => {
    const storagePath = join(process.cwd(), 'src', 'renderer', 'public', 'storage')
    if (company.logo && existsSync(company.logo) && !company.logo.startsWith('/storage') && !company.logo.includes('icons')) {
        const companyDir = join(storagePath, company.name.replace(/[^a-z0-9]/gi, '_').toLowerCase())
        if (!existsSync(companyDir)) mkdirSync(companyDir, { recursive: true })
        const logoName = `logo_${Date.now()}${extname(company.logo)}`
        const destPath = join(companyDir, logoName)
        copyFileSync(company.logo, destPath)
        company.logo = `/storage/${company.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}/${logoName}`
    }
    return await db.addCompany(company)
  })

  // Document Management IPC
  ipcMain.handle('db:getCompanyDocuments', async (_, { companyId }) => {
    return await db.getCompanyDocuments(companyId)
  })

  ipcMain.handle('db:addCompanyDocument', async (_, { companyId, name, path }) => {
    return await db.addCompanyDocument(companyId, name, path)
  })

  ipcMain.handle('db:deleteCompanyDocument', async (_, { id }) => {
    return await db.deleteCompanyDocument(id)
  })

  // Assurance Companies
  ipcMain.handle('db:getAssuranceCompanies', async () => {
    return await db.getAssuranceCompanies()
  })

  ipcMain.handle('db:addAssuranceCompany', async (_, company) => {
    const storagePath = join(process.cwd(), 'src', 'renderer', 'public', 'storage')
    if (company.logo && existsSync(company.logo) && !company.logo.startsWith('/storage')) {
      const assuranceDir = join(storagePath, 'assurance')
      if (!existsSync(assuranceDir)) mkdirSync(assuranceDir, { recursive: true })
      const logoName = `${company.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}${extname(company.logo)}`
      const destPath = join(assuranceDir, logoName)
      copyFileSync(company.logo, destPath)
      company.logo = `/storage/assurance/${logoName}`
    }
    return await db.addAssuranceCompany(company)
  })

  ipcMain.handle('db:deleteAssuranceCompany', async (_, { id }) => {
    return await db.deleteAssuranceCompany(id)
  })

  ipcMain.handle('file:saveCompanyDocument', async (_, { companyName, filePath }) => {
    try {
        if (!existsSync(filePath)) throw new Error('File not found')
        
        const storagePath = join(process.cwd(), 'src', 'renderer', 'public', 'storage')
        const companyDirName = companyName.replace(/[^a-z0-9]/gi, '_').toLowerCase()
        const docsDir = join(storagePath, companyDirName, 'documents')
        
        if (!existsSync(docsDir)) mkdirSync(docsDir, { recursive: true })
        
        const safeOriginalName = filePath.split(/[/\\]/).pop()?.replace(/[^a-z0-9.]/gi, '_') || 'doc'
        const finalFileName = `${Date.now()}_${safeOriginalName}`
        const destPath = join(docsDir, finalFileName)
        
        copyFileSync(filePath, destPath)
        
        return `/storage/${companyDirName}/documents/${finalFileName}`
    } catch (error) {
        console.error('Failed to save company document:', error)
        throw error
    }
  })

  ipcMain.handle('file:download', async (_, { path }) => {
    try {
        // path is relative like /storage/...
        // We need absolute path.
        const absolutePath = join(process.cwd(), 'src', 'renderer', 'public', path.startsWith('/') ? path.slice(1) : path)
        
        if (!existsSync(absolutePath)) throw new Error('File not found')
            
        const result = await dialog.showSaveDialog({
            defaultPath: path.split('/').pop(),
            filters: [{ name: 'Documents', extensions: ['pdf', 'doc', 'docx'] }]
        })

        if (!result.canceled && result.filePath) {
            copyFileSync(absolutePath, result.filePath)
            return true
        }
        return false
    } catch (e) {
        console.error('Failed to download document:', e)
        return false
    }
  })

  ipcMain.handle('file:openPath', async (_, { path }) => {
     // If path starts with /storage, map it to actual file system path
     let fullPath = path
     if (path.startsWith('/storage')) {
         fullPath = join(process.cwd(), 'src', 'renderer', 'public', path)
     }
     shell.openPath(fullPath)
  })

  await db.initDb()
  
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
