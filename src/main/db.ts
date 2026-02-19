import sqlite3 from 'sqlite3'
import { join } from 'path'

const dbPath = join(process.cwd(), 'db.sqlite')

export const db = new sqlite3.Database(dbPath)

const sanitizeTableName = (name: string): string => {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '_')
}



const ensureColumnExists = (tableName: string, columnName: string, columnType: string): Promise<void> => {
    return new Promise((resolve) => {
        db.all(`PRAGMA table_info(${tableName})`, (err, rows: any[]) => {
            if (!err && rows) {
                if (!rows.some(r => r.name === columnName)) {
                    db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType}`, (err) => {
                        if (err) console.error(`Failed to add column ${columnName} to ${tableName}:`, err)
                        else console.log(`Added column ${columnName} to ${tableName}`)
                        resolve()
                    })
                } else {
                    resolve()
                }
            } else {
                resolve()
            }
        })
    })
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
                    dateNaissance TEXT,
                    contratPath TEXT,
                    engDomicilePath TEXT,
                    conjoint TEXT,
                    child1 TEXT,
                    child2 TEXT,
                    child3 TEXT,
                    child4 TEXT
                )
            `, async (err) => {
                if (err) console.error(`Error creating table ${enCoursTable}:`, err)
                else {
                    await ensureColumnExists(enCoursTable, 'contratPath', 'TEXT')
                    await ensureColumnExists(enCoursTable, 'engDomicilePath', 'TEXT')
                    await ensureColumnExists(enCoursTable, 'conjoint', 'TEXT')
                    await ensureColumnExists(enCoursTable, 'child1', 'TEXT')
                    await ensureColumnExists(enCoursTable, 'child2', 'TEXT')
                    await ensureColumnExists(enCoursTable, 'child3', 'TEXT')
                    await ensureColumnExists(enCoursTable, 'child4', 'TEXT')
                }
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
                    motif TEXT,
                    contratPath TEXT,
                    engDomicilePath TEXT,
                    conjoint TEXT,
                    child1 TEXT,
                    child2 TEXT,
                    child3 TEXT,
                    child4 TEXT
                )
            `, async (err) => {
                if (err) {
                    console.error(`Error creating table ${sortieTable}:`, err)
                    reject(err)
                } else {
                    await ensureColumnExists(sortieTable, 'contratPath', 'TEXT')
                    await ensureColumnExists(sortieTable, 'engDomicilePath', 'TEXT')
                    await ensureColumnExists(sortieTable, 'conjoint', 'TEXT')
                    await ensureColumnExists(sortieTable, 'child1', 'TEXT')
                    await ensureColumnExists(sortieTable, 'child2', 'TEXT')
                    await ensureColumnExists(sortieTable, 'child3', 'TEXT')
                    await ensureColumnExists(sortieTable, 'child4', 'TEXT')
                    resolve()
                }
            })
        })
    })
}

const createCandidateTables = (companyName: string): Promise<void> => {
    const baseName = sanitizeTableName(companyName)
    const candidatesTable = `candidates_${baseName}`
    console.log(`Ensuring table for candidates: ${candidatesTable}`)

    return new Promise((resolve, reject) => {
        db.run(`
            CREATE TABLE IF NOT EXISTS ${candidatesTable} (
                id TEXT PRIMARY KEY,
                fullName TEXT NOT NULL,
                dateNaissance TEXT,
                dateEmbauche TEXT,
                address TEXT,
                cin TEXT,
                cnss TEXT,
                gender TEXT,
                salaireNet TEXT,
                rib TEXT,
                phone TEXT,
                email TEXT,
                contratPath TEXT,
                engDomicilePath TEXT,
                company TEXT,
                function TEXT,
                salaire_base REAL DEFAULT 0,
                prime_rendement REAL DEFAULT 0,
                indemnite_panier REAL DEFAULT 0,
                num_deduction INTEGER DEFAULT 0,
                conge REAL DEFAULT 0,
                absence REAL DEFAULT 0,
                jf REAL DEFAULT 0,
                avance REAL DEFAULT 0
            )
        `, (err) => {
            if (err) {
                console.error(`Error creating table ${candidatesTable}:`, err)
                reject(err)
            } else {
                // Ensure columns exist (migration)
                ensureColumnExists(candidatesTable, 'contratPath', 'TEXT')
                ensureColumnExists(candidatesTable, 'engDomicilePath', 'TEXT')
                ensureColumnExists(candidatesTable, 'function', 'TEXT')
                ensureColumnExists(candidatesTable, 'nom', 'TEXT')
                ensureColumnExists(candidatesTable, 'prenom', 'TEXT')
                resolve()
            }
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
                CREATE TABLE IF NOT EXISTS employee_documents (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    employee_id TEXT NOT NULL,
                    company_name TEXT NOT NULL,
                    name TEXT NOT NULL,
                    path TEXT NOT NULL,
                    upload_date TEXT
                )
            `)

            db.run(`
                CREATE TABLE IF NOT EXISTS transport_groups (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE,
                    shift TEXT DEFAULT '9H',
                    mon INTEGER DEFAULT 0,
                    tue INTEGER DEFAULT 0,
                    wed INTEGER DEFAULT 0,
                    thu INTEGER DEFAULT 0,
                    fri INTEGER DEFAULT 0,
                    sat INTEGER DEFAULT 0,
                    sun INTEGER DEFAULT 0
                )
            `)

            // Migration: Add shift column if it doesn't exist
            db.all("PRAGMA table_info(transport_groups)", [], (err, rows) => {
                if (err) return;
                const columns = rows.map((r: any) => r.name);
                if (!columns.includes('shift')) {
                    db.run("ALTER TABLE transport_groups ADD COLUMN shift TEXT DEFAULT '9H'");
                }
            });

            db.run(`
                CREATE TABLE IF NOT EXISTS transport_employees (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    fullName TEXT NOT NULL,
                    address TEXT,
                    phone TEXT,
                    lieu TEXT,
                    isMotorise INTEGER DEFAULT 0,
                    isSpecial INTEGER DEFAULT 0,
                    specialGroup TEXT,
                    mon INTEGER DEFAULT 0,
                    tue INTEGER DEFAULT 0,
                    wed INTEGER DEFAULT 0,
                    thu INTEGER DEFAULT 0,
                    fri INTEGER DEFAULT 0,
                    sat INTEGER DEFAULT 0,
                    sun INTEGER DEFAULT 0,
                    specialShift TEXT DEFAULT '9H'
                )
            `)

            db.run(`
                CREATE TABLE IF NOT EXISTS assurance_employees (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    employeeId TEXT NOT NULL,
                    fullName TEXT NOT NULL,
                    companyName TEXT NOT NULL,
                    status TEXT,
                    numAffiliation TEXT,
                    conjoint TEXT,
                    child1 TEXT,
                    child2 TEXT,
                    child3 TEXT,
                    child4 TEXT,
                    adhesionStatus TEXT DEFAULT 'Non Adhéré',
                    UNIQUE(employeeId, companyName)
                )
            `, async (err) => {
                if (!err) {
                    await ensureColumnExists('assurance_employees', 'status', 'TEXT')
                    await ensureColumnExists('assurance_employees', 'adhesionStatus', "TEXT DEFAULT 'Non Adhéré'")
                }
            })

            db.run(`
                CREATE TABLE IF NOT EXISTS assurance_records (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    assure TEXT NOT NULL,
                    beneficiaire TEXT,
                    dossier_num TEXT,
                    date_declaration TEXT,
                    date_depot TEXT,
                    montant REAL DEFAULT 0,
                    type TEXT,
                    company TEXT,
                    date_remboursement TEXT,
                    montant_rembourse REAL DEFAULT 0,
                    taux REAL DEFAULT 0,
                    status TEXT DEFAULT 'En cours',
                    numAffiliation TEXT,
                    documents_joints TEXT,
                    employer TEXT
                )
            `, async (err) => {
                if (!err) {
                    await ensureColumnExists('assurance_records', 'numAffiliation', 'TEXT')
                    await ensureColumnExists('assurance_records', 'documents_joints', 'TEXT')
                    await ensureColumnExists('assurance_records', 'employer', 'TEXT')
                    
                    // Healing migration: Populate employer if missing by matching with assurance_employees
                    db.run(`
                        UPDATE assurance_records 
                        SET employer = (
                            SELECT companyName 
                            FROM assurance_employees 
                            WHERE assurance_employees.fullName = assurance_records.assure
                            LIMIT 1
                        )
                        WHERE employer IS NULL OR employer = ''
                    `)
                }
            })

            db.run(`
                CREATE TABLE IF NOT EXISTS assurance_companies (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    logo TEXT,
                    phone TEXT,
                    email TEXT,
                    is_default INTEGER DEFAULT 0
                )
            `)

            // Migration for assurance_companies
            db.all("PRAGMA table_info(assurance_companies)", (err, rows: any[]) => {
                if (!err && rows) {
                    if (!rows.some(r => r.name === 'is_default')) {
                        db.run("ALTER TABLE assurance_companies ADD COLUMN is_default INTEGER DEFAULT 0")
                    }
                }
            })

            db.run(`
                CREATE TABLE IF NOT EXISTS companies (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    address TEXT,
                    ice TEXT,
                    if_num TEXT,
                    cnss TEXT,
                    rc TEXT,
                    representant TEXT,
                    logo TEXT
                )
            `, async (err) => {
                if (err) {
                    reject(err)
                    return
                }

                // Ensure 'rc' column exists for existing tables
                await ensureColumnExists('companies', 'rc', 'TEXT')
                
                // Ensure tables exist for all current companies
                try {
                    db.all('SELECT name FROM companies', async (_err, rows: any[]) => {
                        if (rows) {
                            for (const row of rows) {
                                await createEmployeeTables(row.name)
                                await createCandidateTables(row.name)
                                
                                const baseName = sanitizeTableName(row.name)
                                const tables = [
                                    `employees_${baseName}_en_cours`,
                                    `employees_${baseName}_sortie`,
                                    `candidates_${baseName}`
                                ]
                                
                                const payTables = [
                                    `payroll_${baseName}_en_cours`,
                                    `payroll_${baseName}_sortie`
                                ]
                                
                                for (const table of tables) {
                                    await ensureColumnExists(table, 'salaire_base', 'REAL DEFAULT 0')
                                    await ensureColumnExists(table, 'prime_rendement', 'REAL DEFAULT 0')
                                    await ensureColumnExists(table, 'indemnite_panier', 'REAL DEFAULT 0')
                                    await ensureColumnExists(table, 'num_deduction', 'INTEGER DEFAULT 0')
                                    await ensureColumnExists(table, 'conge', 'REAL DEFAULT 0')
                                    await ensureColumnExists(table, 'absence', 'REAL DEFAULT 0')
                                    await ensureColumnExists(table, 'jf', 'REAL DEFAULT 0')
                                    await ensureColumnExists(table, 'avance', 'REAL DEFAULT 0')
                                }

                                for (const table of payTables) {
                                    await ensureColumnExists(table, 'gender', 'TEXT')
                                }

                                await createPayrollTables(row.name)
                                await syncPayrollData(row.name)
                            }
                        }

                        // Migration for transport_employees
                        await ensureColumnExists('transport_employees', 'isSpecial', 'INTEGER DEFAULT 0')
                        await ensureColumnExists('transport_employees', 'specialGroup', 'TEXT')
                        await ensureColumnExists('transport_employees', 'mon', 'INTEGER DEFAULT 0')
                        await ensureColumnExists('transport_employees', 'tue', 'INTEGER DEFAULT 0')
                        await ensureColumnExists('transport_employees', 'wed', 'INTEGER DEFAULT 0')
                        await ensureColumnExists('transport_employees', 'thu', 'INTEGER DEFAULT 0')
                        await ensureColumnExists('transport_employees', 'fri', 'INTEGER DEFAULT 0')
                        await ensureColumnExists('transport_employees', 'sat', 'INTEGER DEFAULT 0')
                        await ensureColumnExists('transport_employees', 'sun', 'INTEGER DEFAULT 0')
                        await ensureColumnExists('transport_employees', 'specialShift', "TEXT DEFAULT '9H'")

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
            'INSERT INTO companies (name, address, ice, if_num, cnss, rc, representant, logo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [company.name, company.address, company.ice, company.if_num, company.cnss, company.rc, company.representant, company.logo],
            async function (err) {
                if (err) reject(err)
                else {
                    await createEmployeeTables(company.name)
                    await createCandidateTables(company.name)
                    await createPayrollTables(company.name)
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

export const setDefaultAssuranceCompany = (id: number): Promise<void> => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run('BEGIN TRANSACTION')
            // Reset all defaults
            db.run('UPDATE assurance_companies SET is_default = 0', (err) => {
                if (err) {
                    db.run('ROLLBACK')
                    reject(err)
                    return
                }
                // Set new default
                db.run('UPDATE assurance_companies SET is_default = 1 WHERE id = ?', [id], (err) => {
                    if (err) {
                        db.run('ROLLBACK')
                        reject(err)
                    } else {
                        db.run('COMMIT')
                        resolve()
                    }
                })
            })
        })
    })
}

// Assurance Records Methods
export const getAssurances = (companyName?: string): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        let query = 'SELECT * FROM assurance_records'
        let params: any[] = []
        
        if (companyName) {
            query += ' WHERE company = ?'
            params.push(companyName)
        }
        
        query += ' ORDER BY id DESC'

        db.all(query, params, (err, rows) => {
            if (err) reject(err)
            else resolve(rows || [])
        })
    })
}

export const addAssurance = (record: any): Promise<number> => {
    return new Promise((resolve, reject) => {
        const { 
            assure, beneficiaire, dossier_num, date_declaration, date_depot, 
            montant, type, company, date_remboursement, montant_rembourse, taux, status, numAffiliation,
            documents_joints, employer
        } = record

        db.run(
            `INSERT INTO assurance_records (
                assure, beneficiaire, dossier_num, date_declaration, date_depot, 
                montant, type, company, date_remboursement, montant_rembourse, taux, status, numAffiliation,
                documents_joints, employer
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                assure, beneficiaire, dossier_num, date_declaration, date_depot, 
                montant, type, company, date_remboursement, montant_rembourse, taux, status, numAffiliation,
                JSON.stringify(documents_joints || []),
                employer
            ],
            function (err) {
                if (err) reject(err)
                else resolve(this.lastID)
            }
        )
    })
}

export const updateAssurance = (id: number, record: any): Promise<void> => {
    return new Promise((resolve, reject) => {
        const { 
            assure, beneficiaire, dossier_num, date_declaration, date_depot, 
            montant, type, company, date_remboursement, montant_rembourse, taux, status, numAffiliation,
            documents_joints, employer
        } = record

        db.run(
            `UPDATE assurance_records SET 
                assure = ?, beneficiaire = ?, dossier_num = ?, date_declaration = ?, date_depot = ?, 
                montant = ?, type = ?, company = ?, date_remboursement = ?, montant_rembourse = ?, taux = ?, status = ?, numAffiliation = ?,
                documents_joints = ?, employer = ?
            WHERE id = ?`,
            [
                assure, beneficiaire, dossier_num, date_declaration, date_depot, 
                montant, type, company, date_remboursement, montant_rembourse, taux, status, numAffiliation,
                JSON.stringify(documents_joints || []),
                employer,
                id
            ],
            (err) => {
                if (err) reject(err)
                else resolve()
            }
        )
    })
}

export const deleteAssurance = (id: number): Promise<void> => {
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM assurance_records WHERE id = ?', [id], (err) => {
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

// Employee Document Management
export const addEmployeeDocument = (employeeId: string, companyName: string, name: string, path: string): Promise<number> => {
    return new Promise((resolve, reject) => {
        const uploadDate = new Date().toISOString()
        db.run(
            'INSERT INTO employee_documents (employee_id, company_name, name, path, upload_date) VALUES (?, ?, ?, ?, ?)',
            [employeeId, companyName, name, path, uploadDate],
            function (err) {
                if (err) reject(err)
                else resolve(this.lastID)
            }
        )
    })
}

export const getEmployeeDocuments = (employeeId: string, companyName: string): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        db.all(
            'SELECT * FROM employee_documents WHERE employee_id = ? AND company_name = ? ORDER BY upload_date DESC',
            [employeeId, companyName],
            (err, rows) => {
                if (err) reject(err)
                else resolve(rows || [])
            }
        )
    })
}

export const deleteEmployeeDocument = (id: number): Promise<void> => {
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM employee_documents WHERE id = ?', [id], (err) => {
            if (err) reject(err)
            else resolve()
        })
    })
}

export const getAssuranceEmployees = async (): Promise<any[]> => {
    try {
        const companies = await getCompanies()
        let allResults: any[] = []
        
        for (const company of companies) {
            const baseName = sanitizeTableName(company.name)
            const tableName = `employees_${baseName}_en_cours`
            
            const results = await new Promise<any[]>((resolve) => {
                db.all(`
                    SELECT e.*, a.numAffiliation, a.adhesionStatus, 
                           a.conjoint as a_conjoint, a.child1 as a_child1, a.child2 as a_child2, 
                           a.child3 as a_child3, a.child4 as a_child4
                    FROM ${tableName} e
                    LEFT JOIN assurance_employees a ON e.id = a.employeeId AND a.companyName = ?
                `, [company.name], (err, rows: any[]) => {
                    if (err) {
                        console.warn(`Query failed for ${tableName}:`, err.message)
                        resolve([])
                    } else {
                        // Map results and handle overrides from assurance table
                        resolve((rows || []).map((r: any) => ({
                            ...r,
                            companyName: company.name,
                            conjoint: r.a_conjoint || r.conjoint,
                            child1: r.a_child1 || r.child1,
                            child2: r.a_child2 || r.child2,
                            child3: r.a_child3 || r.child3,
                            child4: r.a_child4 || r.child4,
                            adhesionStatus: r.adhesionStatus || 'Non Adhéré'
                        })))
                    }
                })
            })
            allResults = [...allResults, ...results]
        }
        return allResults
    } catch (error) {
        console.error('Error in dynamic getAssuranceEmployees:', error)
        return []
    }
}

export const updateAssuranceEmployee = (employeeId: string, companyName: string, data: any): Promise<void> => {
    return new Promise((resolve, reject) => {
        db.run(`
            INSERT INTO assurance_employees (
                employeeId, companyName, fullName, status,
                numAffiliation, conjoint,
                child1, child2, child3, child4,
                adhesionStatus
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(employeeId, companyName) DO UPDATE SET
                numAffiliation = excluded.numAffiliation,
                conjoint = excluded.conjoint,
                child1 = excluded.child1,
                child2 = excluded.child2,
                child3 = excluded.child3,
                child4 = excluded.child4,
                adhesionStatus = excluded.adhesionStatus
        `, [
            employeeId, companyName, data.fullName || '', 'En cours',
            data.numAffiliation, data.conjoint,
            data.child1, data.child2, data.child3, data.child4,
            data.adhesionStatus
        ], (err) => {
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
                        INSERT OR REPLACE INTO ${tableName} (
                            id, fullName, function, email, phone, status, company, 
                            avatar, address, rib, cin, cnss, situation, 
                            dateEmbauche, dateAnciennete, gender, dateNaissance,
                            contratPath, engDomicilePath,
                            conjoint, child1, child2, child3, child4
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `
                    params = [
                        employee.id, employee.fullName, employee.function, employee.email, 
                        employee.phone, employee.status, employee.company, avatar,
                        employee.address, employee.rib, employee.cin, employee.cnss,
                        employee.situation, employee.dateEmbauche, employee.dateAnciennete, employee.gender, employee.dateNaissance,
                        employee.contratPath, employee.engDomicilePath,
                        employee.conjoint, employee.child1, employee.child2, employee.child3, employee.child4
                    ]
                } else {
                    query = `
                        INSERT OR REPLACE INTO ${tableName} (
                            id, fullName, function, email, phone, status, company, 
                            avatar, address, rib, cin, cnss, situation, 
                            dateEmbauche, dateAnciennete, gender, dateNaissance, dateSortie, motif,
                            contratPath, engDomicilePath,
                            conjoint, child1, child2, child3, child4
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `
                    params = [
                        employee.id, employee.fullName, employee.function, employee.email, 
                        employee.phone, employee.status, employee.company, avatar,
                        employee.address, employee.rib, employee.cin, employee.cnss,
                        employee.situation, employee.dateEmbauche, employee.dateAnciennete, employee.gender, employee.dateNaissance,
                        employee.dateSortie, employee.motif,
                        employee.contratPath, employee.engDomicilePath,
                        employee.conjoint, employee.child1, employee.child2, employee.child3, employee.child4
                    ]
                }

                db.run(query, params, (err) => {
                    if (err) {
                        console.error('Error in db.run saveEmployee:', err)
                        reject(err)
                    } else {
                        console.log('Successfully saved employee to', tableName)
                        
                        // No longer needed to sync here as it's fetched dynamically
                        
                        // Sync to payroll table
                        const payTableName = employee.status === 'En cours' ? `payroll_${baseName}_en_cours` : `payroll_${baseName}_sortie`
                        const payOtherTableName = employee.status === 'En cours' ? `payroll_${baseName}_sortie` : `payroll_${baseName}_en_cours`

                        db.serialize(() => {
                            // Move payroll record if exists in other table
                            db.run(`
                                INSERT OR IGNORE INTO ${payTableName} (id, fullName, function, dateAnciennete)
                                SELECT id, fullName, function, dateAnciennete FROM ${payOtherTableName} WHERE id = ?
                            `, [employee.id])
                            db.run(`DELETE FROM ${payOtherTableName} WHERE id = ?`, [employee.id])
                            
                            // Ensure record exists and update basic info
                            if (employee.status === 'Sortie') {
                                db.run(`
                                    INSERT OR REPLACE INTO ${payTableName} (
                                        id, fullName, function, dateAnciennete, gender, dateSortie,
                                        salaire_base, prime_rendement, indemnite_panier, num_deduction, conge, absence, jf, avance
                                    )
                                    SELECT ?, ?, ?, ?, ?, ?,
                                        COALESCE((SELECT salaire_base FROM ${payTableName} WHERE id = ?), 0),
                                        COALESCE((SELECT prime_rendement FROM ${payTableName} WHERE id = ?), 0),
                                        COALESCE((SELECT indemnite_panier FROM ${payTableName} WHERE id = ?), 0),
                                        COALESCE((SELECT num_deduction FROM ${payTableName} WHERE id = ?), 0),
                                        COALESCE((SELECT conge FROM ${payTableName} WHERE id = ?), 0),
                                        COALESCE((SELECT absence FROM ${payTableName} WHERE id = ?), 0),
                                        COALESCE((SELECT jf FROM ${payTableName} WHERE id = ?), 0),
                                        COALESCE((SELECT avance FROM ${payTableName} WHERE id = ?), 0)
                                `, [
                                    employee.id, employee.fullName, employee.function, employee.dateAnciennete || employee.dateEmbauche,
                                    employee.gender, employee.dateSortie,
                                    employee.id, employee.id, employee.id, employee.id, employee.id, employee.id, employee.id, employee.id
                                ], () => resolve())
                            } else {
                                db.run(`
                                    INSERT OR REPLACE INTO ${payTableName} (
                                        id, fullName, function, dateAnciennete, gender,
                                        salaire_base, prime_rendement, indemnite_panier, num_deduction, conge, absence, jf, avance
                                    )
                                    SELECT ?, ?, ?, ?, ?,
                                        COALESCE((SELECT salaire_base FROM ${payTableName} WHERE id = ?), 0),
                                        COALESCE((SELECT prime_rendement FROM ${payTableName} WHERE id = ?), 0),
                                        COALESCE((SELECT indemnite_panier FROM ${payTableName} WHERE id = ?), 0),
                                        COALESCE((SELECT num_deduction FROM ${payTableName} WHERE id = ?), 0),
                                        COALESCE((SELECT conge FROM ${payTableName} WHERE id = ?), 0),
                                        COALESCE((SELECT absence FROM ${payTableName} WHERE id = ?), 0),
                                        COALESCE((SELECT jf FROM ${payTableName} WHERE id = ?), 0),
                                        COALESCE((SELECT avance FROM ${payTableName} WHERE id = ?), 0)
                                `, [
                                    employee.id, employee.fullName, employee.function, employee.dateAnciennete || employee.dateEmbauche,
                                    employee.gender,
                                    employee.id, employee.id, employee.id, employee.id, employee.id, employee.id, employee.id, employee.id
                                ], () => resolve())
                            }
                        })
                    }
                })
            })
        })
    })
}

export const deleteEmployee = (id: string, companyName: string, status: string): Promise<void> => {
    const baseName = sanitizeTableName(companyName)
    const tableName = status === 'En cours' ? `employees_${baseName}_en_cours` : `employees_${baseName}_sortie`
    const payTableName = status === 'En cours' ? `payroll_${baseName}_en_cours` : `payroll_${baseName}_sortie`
    
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run(`DELETE FROM ${tableName} WHERE id = ?`, [id])
            db.run(`DELETE FROM assurance_employees WHERE employeeId = ? AND companyName = ?`, [id, companyName])
            db.run(`DELETE FROM ${payTableName} WHERE id = ?`, [id], (err) => {
                if (err) reject(err)
                else resolve()
            })
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
            SET name = ?, address = ?, ice = ?, if_num = ?, cnss = ?, rc = ?, representant = ?, logo = ?
            WHERE id = ?
        `
        const params = [
            data.name, data.address, data.ice, data.if_num, 
            data.cnss, data.rc, data.representant, data.logo, id
        ]
        
        db.run(query, params, (err) => {
            if (err) reject(err)
            else resolve()
        })
    })
}

const createPayrollTables = (companyName: string): Promise<void> => {
    const baseName = sanitizeTableName(companyName)
    const enCoursTable = `payroll_${baseName}_en_cours`
    const sortieTable = `payroll_${baseName}_sortie`
    
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run(`
                CREATE TABLE IF NOT EXISTS ${enCoursTable} (
                    id TEXT PRIMARY KEY,
                    fullName TEXT,
                    function TEXT,
                    dateAnciennete TEXT,
                    gender TEXT,
                    salaire_base REAL DEFAULT 0,
                    prime_rendement REAL DEFAULT 0,
                    indemnite_panier REAL DEFAULT 0,
                    num_deduction INTEGER DEFAULT 0,
                    conge REAL DEFAULT 0,
                    absence REAL DEFAULT 0,
                    jf REAL DEFAULT 0,
                    avance REAL DEFAULT 0
                )
            `, async (err) => {
                if (err) console.error(`Error creating table ${enCoursTable}:`, err)
                else {
                    await ensureColumnExists(enCoursTable, 'gender', 'TEXT')
                }
            })

            db.run(`
                CREATE TABLE IF NOT EXISTS ${sortieTable} (
                    id TEXT PRIMARY KEY,
                    fullName TEXT,
                    function TEXT,
                    dateAnciennete TEXT,
                    gender TEXT,
                    salaire_base REAL DEFAULT 0,
                    prime_rendement REAL DEFAULT 0,
                    indemnite_panier REAL DEFAULT 0,
                    num_deduction INTEGER DEFAULT 0,
                    conge REAL DEFAULT 0,
                    absence REAL DEFAULT 0,
                    jf REAL DEFAULT 0,
                    avance REAL DEFAULT 0
                )
            `, async (err) => {
                if (err) {
                    console.error(`Error creating table ${sortieTable}:`, err)
                    reject(err)
                } else {
                    await ensureColumnExists(sortieTable, 'gender', 'TEXT')
                    await ensureColumnExists(sortieTable, 'dateSortie', 'TEXT')
                    resolve()
                }
            })
        })
    })
}

const syncPayrollData = (companyName: string): Promise<void> => {
    const baseName = sanitizeTableName(companyName)
    const empTable = `employees_${baseName}_en_cours`
    const payTable = `payroll_${baseName}_en_cours`
    const empSortieTable = `employees_${baseName}_sortie`
    const paySortieTable = `payroll_${baseName}_sortie`

    return new Promise((resolve) => {
        db.serialize(() => {
            // Sync En cours - include gender
            db.run(`
                INSERT INTO ${payTable} (id, fullName, function, dateAnciennete, gender)
                SELECT id, fullName, function, dateAnciennete, gender FROM ${empTable}
                WHERE id NOT IN (SELECT id FROM ${payTable})
            `)
            // Update existing En cours records to ensure gender/name/function are synced
            db.run(`
                UPDATE ${payTable}
                SET 
                    fullName = (SELECT fullName FROM ${empTable} WHERE ${empTable}.id = ${payTable}.id),
                    function = (SELECT function FROM ${empTable} WHERE ${empTable}.id = ${payTable}.id),
                    dateAnciennete = (SELECT dateAnciennete FROM ${empTable} WHERE ${empTable}.id = ${payTable}.id),
                    gender = (SELECT gender FROM ${empTable} WHERE ${empTable}.id = ${payTable}.id)
                WHERE id IN (SELECT id FROM ${empTable})
            `)

            // Sync Sortie - include gender and dateSortie
            db.run(`
                INSERT INTO ${paySortieTable} (id, fullName, function, dateAnciennete, gender, dateSortie)
                SELECT id, fullName, function, dateAnciennete, gender, dateSortie FROM ${empSortieTable}
                WHERE id NOT IN (SELECT id FROM ${paySortieTable})
            `)
            // Update existing Sortie records to ensure gender/name/function/dateSortie are synced
            db.run(`
                UPDATE ${paySortieTable}
                SET 
                    fullName = (SELECT fullName FROM ${empSortieTable} WHERE ${empSortieTable}.id = ${paySortieTable}.id),
                    function = (SELECT function FROM ${empSortieTable} WHERE ${empSortieTable}.id = ${paySortieTable}.id),
                    dateAnciennete = (SELECT dateAnciennete FROM ${empSortieTable} WHERE ${empSortieTable}.id = ${paySortieTable}.id),
                    gender = (SELECT gender FROM ${empSortieTable} WHERE ${empSortieTable}.id = ${paySortieTable}.id),
                    dateSortie = (SELECT dateSortie FROM ${empSortieTable} WHERE ${empSortieTable}.id = ${paySortieTable}.id)
                WHERE id IN (SELECT id FROM ${empSortieTable})
            `, () => resolve())
        })
    })
}

export const addCandidate = (candidate: any, companyName: string): Promise<void> => {
    const baseName = sanitizeTableName(companyName)
    const tableName = `candidates_${baseName}`
    
    return new Promise((resolve, reject) => {
        db.run(`
            INSERT INTO ${tableName} (
                id, fullName, nom, prenom, dateNaissance, dateEmbauche, address, cin, cnss, 
                gender, salaireNet, rib, phone, email, contratPath, engDomicilePath, company, function
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            candidate.id, candidate.fullName, candidate.nom, candidate.prenom,
            candidate.dateNaissance, candidate.dateEmbauche,
            candidate.address, candidate.cin, candidate.cnss, candidate.gender,
            candidate.salaireNet, candidate.rib, candidate.phone, candidate.email,
            candidate.contratPath, candidate.engDomicilePath, candidate.company, candidate.function
        ], (err) => {
            if (err) reject(err)
            else resolve()
        })
    })
}

export const getCandidates = (companyName: string): Promise<any[]> => {
    const baseName = sanitizeTableName(companyName)
    const tableName = `candidates_${baseName}`
    
    return new Promise((resolve) => {
        db.all(`SELECT * FROM ${tableName}`, (err, rows) => {
            if (err) {
                console.warn(`Query failed for ${tableName}:`, err.message)
                resolve([])
            }
            else resolve(rows)
        })
    })
}

export const deleteCandidate = (id: string, companyName: string): Promise<void> => {
    const baseName = sanitizeTableName(companyName)
    const tableName = `candidates_${baseName}`
    
    return new Promise((resolve, reject) => {
        db.run(`DELETE FROM ${tableName} WHERE id = ?`, [id], (err) => {
            if (err) reject(err)
            else resolve()
        })
    })
}

export const getNextEmployeeId = (companyName: string): Promise<string> => {
    const baseName = sanitizeTableName(companyName)
    const enCoursTable = `employees_${baseName}_en_cours`
    const sortieTable = `employees_${baseName}_sortie`
    
    return new Promise((resolve) => {
        // Find max ID from both tables, with fallback for missing tables
        const query = `
            SELECT MAX(CAST(id AS INTEGER)) as maxId FROM (
                SELECT id FROM ${enCoursTable}
                UNION ALL
                SELECT id FROM ${sortieTable}
            )
        `
        db.get(query, (err, row: any) => {
            if (err) {
                // If UNION failed, it might be because one table doesn't exist. Try them separately.
                db.get(`SELECT MAX(CAST(id AS INTEGER)) as maxId FROM ${enCoursTable}`, (_err1, row1: any) => {
                    db.get(`SELECT MAX(CAST(id AS INTEGER)) as maxId FROM ${sortieTable}`, (_err2, row2: any) => {
                        const m1 = (row1 && row1.maxId) ? parseInt(row1.maxId) : 0
                        const m2 = (row2 && row2.maxId) ? parseInt(row2.maxId) : 0
                        const maxId = Math.max(m1, m2)
                        resolve(maxId > 0 ? (maxId + 1).toString() : '1')
                    })
                })
                return
            }
            const nextId = (row && row.maxId) ? (parseInt(row.maxId) + 1).toString() : '1'
            resolve(nextId)
        })
    })
}

export const transferCandidateToEmployee = (
    candidateId: string, 
    companyName: string, 
    newEmployeeData: any
): Promise<void> => {
    const baseName = sanitizeTableName(companyName)
    const candidateTable = `candidates_${baseName}`
    const employeeTable = `employees_${baseName}_en_cours`

    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run('BEGIN TRANSACTION')

            // Insert into employee table
            const insertQuery = `
                INSERT INTO ${employeeTable} (
                    id, fullName, function, email, phone, status, company, 
                    avatar, address, rib, cin, cnss, situation, 
                    dateEmbauche, dateAnciennete, gender, dateNaissance,
                    contratPath, engDomicilePath,
                    salaire_base, prime_rendement, indemnite_panier, num_deduction, conge, absence, jf, avance
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `
            const params = [
                newEmployeeData.id, newEmployeeData.fullName, newEmployeeData.function || '', 
                newEmployeeData.email, newEmployeeData.phone, 'En cours', companyName,
                newEmployeeData.avatar || '', newEmployeeData.address, newEmployeeData.rib,
                newEmployeeData.cin, newEmployeeData.cnss, 'Single', // Default situation if not in candidate
                newEmployeeData.dateEmbauche, newEmployeeData.dateEmbauche, // Anciennete defaults to embauche
                newEmployeeData.gender, newEmployeeData.dateNaissance,
                newEmployeeData.contratPath, newEmployeeData.engDomicilePath,
                newEmployeeData.salaire_base || 0, newEmployeeData.prime_rendement || 0,
                newEmployeeData.indemnite_panier || 0, newEmployeeData.num_deduction || 0,
                newEmployeeData.conge || 0, newEmployeeData.absence || 0,
                newEmployeeData.jf || 0, newEmployeeData.avance || 0
            ]

            db.run(insertQuery, params, (err) => {
                if (err) {
                    db.run('ROLLBACK')
                    reject(err)
                    return
                }

                // Sync to payroll table
                const payTable = `payroll_${baseName}_en_cours`
                db.run(`
                    INSERT OR REPLACE INTO ${payTable} (id, fullName, function, dateAnciennete, gender, salaire_base)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [
                    newEmployeeData.id, 
                    newEmployeeData.fullName, 
                    newEmployeeData.function || '', 
                    newEmployeeData.dateEmbauche, 
                    newEmployeeData.gender,
                    newEmployeeData.salaire_base || 0
                ])

                // Delete from candidate table
                db.run(`DELETE FROM ${candidateTable} WHERE id = ?`, [candidateId], (err) => {
                    if (err) {
                        db.run('ROLLBACK')
                        reject(err)
                        return
                    }

                    db.run('COMMIT', (err) => {
                        if (err) reject(err)
                        else resolve()
                    })
                })
            })
        })
    })
}

export const updatePayrollData = (
    employeeId: string,
    companyName: string,
    status: string,
    payrollData: any
): Promise<void> => {
    const baseName = sanitizeTableName(companyName)
    const tableName = status === 'En cours' ? `payroll_${baseName}_en_cours` : `payroll_${baseName}_sortie`

    return new Promise((resolve, reject) => {
        const query = `
            UPDATE ${tableName}
            SET salaire_base = ?, prime_rendement = ?, indemnite_panier = ?, 
                num_deduction = ?, conge = ?, absence = ?, jf = ?, avance = ?
            WHERE id = ?
        `
        const params = [
            payrollData.salaire_base || 0,
            payrollData.prime_rendement || 0,
            payrollData.indemnite_panier || 0,
            payrollData.num_deduction || 0,
            payrollData.conge || 0,
            payrollData.absence || 0,
            payrollData.jf || 0,
            payrollData.avance || 0,
            employeeId
        ]

        db.run(query, params, (err) => {
            if (err) reject(err)
            else resolve()
        })
    })
}

export const getPayrollEmployees = (companyName: string, status: string): Promise<any[]> => {
    const baseName = sanitizeTableName(companyName)
    const empTable = status === 'En cours' ? `employees_${baseName}_en_cours` : `employees_${baseName}_sortie`
    const payTable = status === 'En cours' ? `payroll_${baseName}_en_cours` : `payroll_${baseName}_sortie`
    
    return new Promise((resolve) => {
        const query = `
            SELECT 
                p.*, 
                e.avatar as empAvatar, 
                e.gender as empGender,
                e.fullName as empFullName,
                e.function as empFunction,
                e.dateAnciennete as empDateAnciennete,
                ${status === 'Sortie' ? 'e.dateSortie, e.motif,' : ''}
                e.status
            FROM ${payTable} p
            JOIN ${empTable} e ON p.id = e.id
        `
        db.all(query, (err, rows) => {
            if (err) {
                console.warn(`Query failed for JOIN ${payTable}/${empTable}:`, err.message)
                // Fallback to just payroll table if JOIN fails
                db.all(`SELECT * FROM ${payTable}`, (_err2, fallbackRows) => {
                    resolve(fallbackRows || [])
                })
            }
            else resolve(rows || [])
        })
    })
}

// Transport Management
export const getTransportEmployees = (): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM transport_employees ORDER BY fullName ASC", (err, rows) => {
            if (err) reject(err)
            else resolve(rows || [])
        })
    })
}

export const addTransportEmployee = (emp: any): Promise<number> => {
    return new Promise((resolve, reject) => {
        db.run(
            "INSERT INTO transport_employees (fullName, address, phone, lieu, isMotorise, isSpecial, specialGroup, mon, tue, wed, thu, fri, sat, sun, specialShift) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                emp.fullName, 
                emp.address, 
                emp.phone, 
                emp.lieu, 
                emp.isMotorise ? 1 : 0,
                emp.isSpecial ? 1 : 0,
                emp.specialGroup || null,
                emp.mon ? 1 : 0,
                emp.tue ? 1 : 0,
                emp.wed ? 1 : 0,
                emp.thu ? 1 : 0,
                emp.fri ? 1 : 0,
                emp.sat ? 1 : 0,
                emp.sun ? 1 : 0,
                emp.specialShift || '9H'
            ],
            function(err) {
                if (err) reject(err)
                else resolve(this.lastID)
            }
        )
    })
}

export const updateTransportEmployee = (id: number, emp: any): Promise<void> => {
    return new Promise((resolve, reject) => {
        db.run(
            "UPDATE transport_employees SET fullName = ?, address = ?, phone = ?, lieu = ?, isMotorise = ?, isSpecial = ?, specialGroup = ?, mon = ?, tue = ?, wed = ?, thu = ?, fri = ?, sat = ?, sun = ?, specialShift = ? WHERE id = ?",
            [
                emp.fullName, 
                emp.address, 
                emp.phone, 
                emp.lieu, 
                emp.isMotorise ? 1 : 0,
                emp.isSpecial ? 1 : 0,
                emp.specialGroup || null,
                emp.mon ? 1 : 0,
                emp.tue ? 1 : 0,
                emp.wed ? 1 : 0,
                emp.thu ? 1 : 0,
                emp.fri ? 1 : 0,
                emp.sat ? 1 : 0,
                emp.sun ? 1 : 0,
                emp.specialShift || '9H',
                id
            ],
            (err) => {
                if (err) reject(err)
                else resolve()
            }
        )
    })
}

export const deleteTransportEmployee = (id: number): Promise<void> => {
    return new Promise((resolve, reject) => {
        db.run("DELETE FROM transport_employees WHERE id = ?", [id], (err) => {
            if (err) reject(err)
            else resolve()
        })
    })
}

// Transport Group Management
export const getTransportGroups = (): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM transport_groups ORDER BY name ASC", (err, rows) => {
            if (err) reject(err)
            else resolve(rows || [])
        })
    })
}

export const addTransportGroup = (group: any): Promise<number> => {
    return new Promise((resolve, reject) => {
        db.run(
            "INSERT INTO transport_groups (name, shift, mon, tue, wed, thu, fri, sat, sun) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                group.name,
                group.shift || '9H',
                group.mon ? 1 : 0,
                group.tue ? 1 : 0,
                group.wed ? 1 : 0,
                group.thu ? 1 : 0,
                group.fri ? 1 : 0,
                group.sat ? 1 : 0,
                group.sun ? 1 : 0
            ],
            function(err) {
                if (err) reject(err)
                else resolve(this.lastID)
            }
        )
    })
}

export const updateTransportGroup = (id: number, group: any): Promise<void> => {
    return new Promise((resolve, reject) => {
        db.run(
            "UPDATE transport_groups SET name = ?, shift = ?, mon = ?, tue = ?, wed = ?, thu = ?, fri = ?, sat = ?, sun = ? WHERE id = ?",
            [
                group.name,
                group.shift || '9H',
                group.mon ? 1 : 0,
                group.tue ? 1 : 0,
                group.wed ? 1 : 0,
                group.thu ? 1 : 0,
                group.fri ? 1 : 0,
                group.sat ? 1 : 0,
                group.sun ? 1 : 0,
                id
            ],
            (err) => {
                if (err) reject(err)
                else resolve()
            }
        )
    })
}

export const deleteTransportGroup = (id: number): Promise<void> => {
    return new Promise((resolve, reject) => {
        db.get("SELECT name FROM transport_groups WHERE id = ?", [id], (err: any, row: any) => {
            if (err) {
                reject(err)
                return
            }
            if (row) {
                db.run("UPDATE transport_employees SET specialGroup = NULL WHERE specialGroup = ?", [row.name], (err2) => {
                    if (err2) reject(err2)
                    else {
                        db.run("DELETE FROM transport_groups WHERE id = ?", [id], (err3) => {
                            if (err3) reject(err3)
                            else resolve()
                        })
                    }
                })
            } else {
                db.run("DELETE FROM transport_groups WHERE id = ?", [id], (err3) => {
                    if (err3) reject(err3)
                    else resolve()
                })
            }
        })
    })
}
