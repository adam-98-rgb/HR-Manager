import sqlite3 from 'sqlite3'
import { join } from 'path'

const dbPath = join(process.cwd(), 'db.sqlite')

export const db = new sqlite3.Database(dbPath)

const sanitizeTableName = (name: string): string => {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '_')
}

const createEmployeeTables = (companyName: string): Promise<void> => {
    const baseName = sanitizeTableName(companyName)
    const enCoursTable = `employees_${baseName}_en_cours`
    const sortieTable = `employees_${baseName}_sortie`
    console.log(`Ensuring tables for ${companyName}: ${enCoursTable}, ${sortieTable}`)

    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run(`
                CREATE TABLE IF NOT EXISTS ${enCoursTable} (
                    id TEXT PRIMARY KEY,
                    fullName TEXT NOT NULL,
                    function TEXT,
                    email TEXT,
                    phone TEXT,
                    status TEXT,
                    company TEXT,
                    avatar TEXT,
                    address TEXT,
                    rib TEXT,
                    cin TEXT,
                    cnss TEXT,
                    situation TEXT,
                    dateEmbauche TEXT,
                    dateAnciennete TEXT,
                    gender TEXT,
                    dateNaissance TEXT
                )
            `, (err) => {
                if (err) console.error(`Error creating table ${enCoursTable}:`, err)
            })

            db.run(`
                CREATE TABLE IF NOT EXISTS ${sortieTable} (
                    id TEXT PRIMARY KEY,
                    fullName TEXT NOT NULL,
                    function TEXT,
                    email TEXT,
                    phone TEXT,
                    status TEXT,
                    company TEXT,
                    avatar TEXT,
                    address TEXT,
                    rib TEXT,
                    cin TEXT,
                    cnss TEXT,
                    situation TEXT,
                    dateEmbauche TEXT,
                    dateAnciennete TEXT,
                    gender TEXT,
                    dateNaissance TEXT,
                    dateSortie TEXT,
                    motif TEXT
                )
            `, (err) => {
                if (err) {
                    console.error(`Error creating table ${sortieTable}:`, err)
                    reject(err)
                } else {
                    resolve()
                }
            })
        })
    })
}

export const initDb = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    gender TEXT,
                    picture TEXT,
                    role TEXT DEFAULT 'User',
                    phone TEXT
                )
            `)

            // Migration for existing databases
            db.all("PRAGMA table_info(users)", (err, rows: any[]) => {
                if (!err && rows) {
                    if (!rows.some(r => r.name === 'role')) {
                        db.run("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'User'", (err) => {
                            if (!err) {
                                // Set first user as Admin
                                db.run("UPDATE users SET role = 'Admin' WHERE id = (SELECT id FROM users ORDER BY id ASC LIMIT 1)")
                            }
                        })
                    }
                    if (!rows.some(r => r.name === 'phone')) {
                        db.run("ALTER TABLE users ADD COLUMN phone TEXT", (err) => {
                            if (err) console.error('Failed to add phone column:', err)
                        })
                    }
                }
            })

            db.run(`
                CREATE TABLE IF NOT EXISTS user_companies (
                    user_id INTEGER,
                    company_id INTEGER,
                    PRIMARY KEY (user_id, company_id),
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
                )
            `)

            db.run(`
                CREATE TABLE IF NOT EXISTS company_documents (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    company_id INTEGER,
                    name TEXT NOT NULL,
                    path TEXT NOT NULL,
                    upload_date TEXT,
                    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
                )
            `)

            db.run(`
                CREATE TABLE IF NOT EXISTS assurance_companies (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    logo TEXT,
                    phone TEXT,
                    email TEXT
                )
            `)

            db.run(`
                CREATE TABLE IF NOT EXISTS companies (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    address TEXT,
                    ice TEXT,
                    if_num TEXT,
                    cnss TEXT,
                    representant TEXT,
                    logo TEXT
                )
            `, async (err) => {
                if (err) {
                    reject(err)
                    return
                }
                
                // Ensure tables exist for all current companies
                try {
                    db.all('SELECT name FROM companies', async (_err, rows: any[]) => {
                        if (rows) {
                            for (const row of rows) {
                                await createEmployeeTables(row.name)
                            }
                        }
                        resolve()
                    })
                } catch (e) {
                    resolve()
                }
            })
        })
    })
}

export const checkSetup = (): Promise<boolean> => {
    return new Promise((resolve) => {
        db.get('SELECT COUNT(*) as count FROM users', (err, row: any) => {
            if (err) resolve(false) // Assume no setup if error (e.g. table doesn't exist)
            else resolve(row.count > 0)
        })
    })
}

export const createUser = (user: any): Promise<number> => {
    let picture = user.picture
    let role = user.role || 'User'
    let phone = user.phone || ''

    return new Promise((resolve, reject) => {
        db.run(
            'INSERT INTO users (name, email, password, gender, picture, role, phone) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [user.name, user.email, user.password, user.gender, picture, role, phone],
            function (err) {
                if (err) reject(err)
                else resolve(this.lastID)
            }
        )
    })
}

export const addCompany = (company: any): Promise<number> => {
    return new Promise((resolve, reject) => {
        db.run(
            'INSERT INTO companies (name, address, ice, if_num, cnss, representant, logo) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [company.name, company.address, company.ice, company.if_num, company.cnss, company.representant, company.logo],
            async function (err) {
                if (err) reject(err)
                else {
                    await createEmployeeTables(company.name)
                    resolve(this.lastID)
                }
            }
        )
    })
}

// Assurance Companies
export const getAssuranceCompanies = (): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM assurance_companies', (err, rows) => {
            if (err) reject(err)
            else resolve(rows)
        })
    })
}

export const addAssuranceCompany = (company: { name: string, logo: string, phone: string, email: string }): Promise<number> => {
    return new Promise((resolve, reject) => {
        const { name, logo, phone, email } = company
        db.run(
            'INSERT INTO assurance_companies (name, logo, phone, email) VALUES (?, ?, ?, ?)',
            [name, logo, phone, email],
            function (err) {
                if (err) reject(err)
                else resolve(this.lastID)
            }
        )
    })
}

export const deleteAssuranceCompany = (id: number): Promise<void> => {
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM assurance_companies WHERE id = ?', [id], (err) => {
            if (err) reject(err)
            else resolve()
        })
    })
}

export const getCompanies = (): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM companies', (err, rows) => {
            if (err) reject(err)
            else resolve(rows)
        })
    })
}

// Document Management
export const addCompanyDocument = (companyId: number, name: string, path: string): Promise<number> => {
    return new Promise((resolve, reject) => {
        const uploadDate = new Date().toISOString()
        db.run(
            'INSERT INTO company_documents (company_id, name, path, upload_date) VALUES (?, ?, ?, ?)',
            [companyId, name, path, uploadDate],
            function (err) {
                if (err) reject(err)
                else resolve(this.lastID)
            }
        )
    })
}

export const getCompanyDocuments = (companyId: number): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM company_documents WHERE company_id = ? ORDER BY upload_date DESC', [companyId], (err, rows) => {
            if (err) reject(err)
            else resolve(rows || [])
        })
    })
}

export const deleteCompanyDocument = (id: number): Promise<void> => {
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM company_documents WHERE id = ?', [id], (err) => {
            if (err) reject(err)
            else resolve()
        })
    })
}

export const login = (username: string, password: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT * FROM users WHERE name = ? AND password = ?',
            [username, password],
            (err, row) => {
                if (err) reject(err)
                else resolve(row)
            }
        )
    })
}

export const recoverAccount = (email: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT name, password FROM users WHERE email = ?',
            [email],
            (err, row) => {
                if (err) reject(err)
                else resolve(row)
            }
        )
    })
}

export const getEmployees = (companyName: string, status: string): Promise<any[]> => {
    const baseName = sanitizeTableName(companyName)
    const tableName = status === 'En cours' ? `employees_${baseName}_en_cours` : `employees_${baseName}_sortie`
    
    return new Promise((resolve) => {
        db.all(`SELECT * FROM ${tableName}`, (err, rows) => {
            if (err) {
                console.warn(`Query failed for ${tableName} (it might not exist):`, err.message)
                resolve([]) 
            }
            else resolve(rows)
        })
    })
}

export const saveEmployee = (employee: any, companyName: string): Promise<void> => {
    const baseName = sanitizeTableName(companyName)
    const enCoursTable = `employees_${baseName}_en_cours`
    const sortieTable = `employees_${baseName}_sortie`
    const tableName = employee.status === 'En cours' ? enCoursTable : sortieTable
    const otherTable = employee.status === 'En cours' ? sortieTable : enCoursTable
    
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Delete from other table if it exists (move logic)
            db.run(`DELETE FROM ${otherTable} WHERE id = ?`, [employee.id], (err) => {
                if (err) console.log(`Delete from ${otherTable} failed (not an issue if it didn't exist):`, err)

                let query, params;
                let avatar = employee.avatar || employee.photo
                console.log('Finalizing saveEmployee - tableName:', tableName, 'ID:', employee.id)

                if (employee.status === 'En cours') {
                    query = `
                        INSERT OR REPLACE INTO ${tableName} (id, fullName, function, email, phone, status, company, avatar, address, rib, cin, cnss, situation, dateEmbauche, dateAnciennete, gender, dateNaissance)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `
                    params = [
                        employee.id, employee.fullName, employee.function, employee.email, 
                        employee.phone, employee.status, employee.company, avatar,
                        employee.address, employee.rib, employee.cin, employee.cnss,
                        employee.situation, employee.dateEmbauche, employee.dateAnciennete, employee.gender, employee.dateNaissance
                    ]
                } else {
                    query = `
                        INSERT OR REPLACE INTO ${tableName} (id, fullName, function, email, phone, status, company, avatar, address, rib, cin, cnss, situation, dateEmbauche, dateAnciennete, gender, dateNaissance, dateSortie, motif)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `
                    params = [
                        employee.id, employee.fullName, employee.function, employee.email, 
                        employee.phone, employee.status, employee.company, avatar,
                        employee.address, employee.rib, employee.cin, employee.cnss,
                        employee.situation, employee.dateEmbauche, employee.dateAnciennete, employee.gender, employee.dateNaissance,
                        employee.dateSortie, employee.motif
                    ]
                }

                db.run(query, params, (err) => {
                    if (err) {
                        console.error('Error in db.run saveEmployee:', err)
                        reject(err)
                    } else {
                        console.log('Successfully saved employee to', tableName)
                        resolve()
                    }
                })
            })
        })
    })
}

export const deleteEmployee = (id: string, companyName: string, status: string): Promise<void> => {
    const baseName = sanitizeTableName(companyName)
    const tableName = status === 'En cours' ? `employees_${baseName}_en_cours` : `employees_${baseName}_sortie`
    
    return new Promise((resolve, reject) => {
        db.run(`DELETE FROM ${tableName} WHERE id = ?`, [id], (err) => {
            if (err) reject(err)
            else resolve()
        })
    })
}

export const deleteCompany = (id: number): Promise<void> => {
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM companies WHERE id = ?', [id], (err) => {
            if (err) reject(err)
            else resolve()
        })
    })
}

// User Management Functions
export const getAllUsers = (): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        db.all('SELECT id, name, email, gender, picture, role, phone FROM users', (err, rows) => {
            if (err) reject(err)
            else resolve(rows || [])
        })
    })
}

export const updateUser = (id: number, data: any): Promise<void> => {
    return new Promise((resolve, reject) => {
        let query = 'UPDATE users SET name = ?, email = ?, gender = ?, role = ?'
        let params = [data.name, data.email, data.gender, data.role]

        if (data.password) {
            query += ', password = ?'
            params.push(data.password)
        }
        
        if (data.picture) {
            query += ', picture = ?'
            params.push(data.picture)
        }

        if (data.phone) {
            query += ', phone = ?'
            params.push(data.phone)
        }

        query += ' WHERE id = ?'
        params.push(id)

        db.run(query, params, (err) => {
            if (err) reject(err)
            else resolve()
        })
    })
}

export const deleteUser = (id: number): Promise<void> => {
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM users WHERE id = ?', [id], (err) => {
            if (err) reject(err)
            else resolve()
        })
    })
}

// Company Assignment Functions
export const getUserCompanies = (userId: number): Promise<number[]> => {
    return new Promise((resolve, reject) => {
        db.all('SELECT company_id FROM user_companies WHERE user_id = ?', [userId], (err, rows: any[]) => {
            if (err) reject(err)
            else resolve(rows ? rows.map(r => r.company_id) : [])
        })
    })
}

export const updateUserCompanies = (userId: number, companyIds: number[]): Promise<void> => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // First remove all existing assignments
            db.run('DELETE FROM user_companies WHERE user_id = ?', [userId], (err) => {
                if (err) {
                    reject(err)
                    return
                }
                
                // Then add new ones
                if (companyIds.length > 0) {
                    const placeholders = companyIds.map(() => '(?, ?)').join(',')
                    const params: any[] = []
                    companyIds.forEach(cId => {
                        params.push(userId, cId)
                    })
                    
                    db.run(`INSERT INTO user_companies (user_id, company_id) VALUES ${placeholders}`, params, (err) => {
                        if (err) reject(err)
                        else resolve()
                    })
                } else {
                    resolve()
                }
            })
        })
    })
}

export const updateCompany = (id: number, data: any): Promise<void> => {
    return new Promise((resolve, reject) => {
        const query = `
            UPDATE companies 
            SET name = ?, address = ?, ice = ?, if_num = ?, cnss = ?, representant = ?, logo = ?
            WHERE id = ?
        `
        const params = [
            data.name, data.address, data.ice, data.if_num, 
            data.cnss, data.representant, data.logo, id
        ]
        
        db.run(query, params, (err) => {
            if (err) reject(err)
            else resolve()
        })
    })
}
