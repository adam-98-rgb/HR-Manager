<?php
// Ultra-optimized database queries with error handling
require_once '../../config/db_config.php';

// Check database connection
if (!$conn) {
    die("Database connection failed: " . mysqli_connect_error());
}

// Enable query optimization (best-effort)
@mysqli_query($conn, "SET SESSION query_cache_type = ON");
@mysqli_query($conn, "SET SESSION query_cache_size = 67108864");

// Ultra-fast stats query with error handling
$stats_query = "SELECT 
  COUNT(*) as total_invoices,
  SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_invoices,
  SUM(CASE WHEN status = 'partial' THEN 1 ELSE 0 END) as partial_invoices,
  SUM(CASE WHEN status = 'unpaid' THEN 1 ELSE 0 END) as unpaid_invoices,
  SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid_amount,
  SUM(CASE WHEN status = 'partial' THEN paid_amount ELSE 0 END) as partial_amount,
  SUM(CASE WHEN status = 'unpaid' THEN amount ELSE 0 END) as unpaid_amount
FROM invoice_gms";

$stats_result = $conn->query($stats_query);
$stats = ['total_invoices' => 0, 'paid_invoices' => 0, 'partial_invoices' => 0, 'unpaid_invoices' => 0, 'paid_amount' => 0, 'partial_amount' => 0, 'unpaid_amount' => 0];

if ($stats_result) {
    $stats = $stats_result->fetch_assoc();
}

// Ultra-fast filtering with optimized prepared statements
$where_conditions = [];
$params = [];
$types = "";

// Search (invoice_number, supplier name, description)
if (!empty($_GET['search'])) {
  $search = '%' . $_GET['search'] . '%';
  $where_conditions[] = "(i.invoice_number LIKE ? OR f.name LIKE ? OR i.description LIKE ?)";
  $params = array_merge($params, [$search, $search, $search]);
  $types .= "sss";
}

// Supplier filter (use supplier id)
if (!empty($_GET['supplier'])) {
  $supplier_id = intval($_GET['supplier']);
  if ($supplier_id > 0) {
    $where_conditions[] = "f.id = ?";
    $params[] = $supplier_id;
    $types .= "i";
  }
}

// Status filter
if (!empty($_GET['status'])) {
  $where_conditions[] = "i.status = ?";
  $params[] = $_GET['status'];
  $types .= "s";
}

// Year filter (integer)
if (!empty($_GET['year'])) {
  $year = intval($_GET['year']);
  if ($year > 0) {
    $where_conditions[] = "YEAR(i.date) = ?";
    $params[] = $year;
    $types .= "i";
  }
}

// Date from
if (!empty($_GET['date_from'])) {
  $where_conditions[] = "i.date >= ?";
  $params[] = $_GET['date_from'];
  $types .= "s";
}

// Date to
if (!empty($_GET['date_to'])) {
  $where_conditions[] = "i.date <= ?";
  $params[] = $_GET['date_to'];
  $types .= "s";
}

// Ultra-optimized invoice query
$invoices_query = "SELECT i.id, i.invoice_number, i.date, i.description, COALESCE(i.amount,0) as amount, 
  i.payment_date, i.payment_method, COALESCE(i.paid_amount,0) as paid_amount, i.status, i.cheque_number, i.pdf_file,
  COALESCE(f.name, 'Unknown') as supplier_name 
  FROM invoice_gms i
  LEFT JOIN fournisseurs_gms f ON i.fournisseurs_id = f.id";

if (!empty($where_conditions)) {
  $invoices_query .= " WHERE " . implode(" AND ", $where_conditions);
}

$invoices_query .= " ORDER BY i.date DESC LIMIT 500";

$invoices = [];
if (!empty($params) && $types !== "") {
  $stmt = $conn->prepare($invoices_query);
  if ($stmt) {
    // bind_param requires variables; make a reference array if needed
    $refs = [];
    foreach ($params as $key => $value) {
      // ensure proper types: mysqli will coerce strings/ints accordingly
      $refs[$key] = $params[$key];
    }
    // bind dynamically
    $bind_names = [];
    $bind_names[] = $types;
    for ($i = 0; $i < count($refs); $i++) {
      $bind_names[] = &$refs[$i];
    }
    call_user_func_array([$stmt, 'bind_param'], $bind_names);

    $stmt->execute();
    $invoices_result = $stmt->get_result();
    if ($invoices_result) {
      $invoices = $invoices_result->fetch_all(MYSQLI_ASSOC);
    }
    $stmt->close();
  }
} else {
  $invoices_result = $conn->query($invoices_query);
  if ($invoices_result) {
    $invoices = $invoices_result->fetch_all(MYSQLI_ASSOC);
  }
}

// Cached supplier query (use fournisseurs_gms)
$suppliers = [];
$suppliers_result = $conn->query("SELECT id, name FROM fournisseurs_gms ORDER BY name ASC");
if ($suppliers_result) {
  $suppliers = $suppliers_result->fetch_all(MYSQLI_ASSOC);
}

// Fast filtered stats calculation
if (!empty($where_conditions)) {
  $filtered_stats = [
      'total_invoices' => count($invoices),
      'paid_invoices' => 0,
      'partial_invoices' => 0,
      'unpaid_invoices' => 0,
      'paid_amount' => 0,
      'partial_amount' => 0,
      'unpaid_amount' => 0
  ];
  
  foreach ($invoices as $invoice) {
      $amt = (float) ($invoice['amount'] ?? 0);
      $paid = (float) ($invoice['paid_amount'] ?? 0);
      switch($invoice['status']) {
          case 'paid':
              $filtered_stats['paid_invoices']++;
              $filtered_stats['paid_amount'] += $amt;
              break;
          case 'partial':
              $filtered_stats['partial_invoices']++;
              $filtered_stats['partial_amount'] += $paid;
              break;
          default:
              $filtered_stats['unpaid_invoices']++;
              $filtered_stats['unpaid_amount'] += $amt;
      }
  }
  $stats = $filtered_stats;
}

// Optimized year calculation
$oldest_year = date('Y');
$result = $conn->query("SELECT MIN(YEAR(date)) AS oldest_year FROM invoice_gms LIMIT 1");
if ($result && $row = $result->fetch_assoc()) {
  $oldest_year = $row['oldest_year'] ?: date('Y');
}
$current_year = date('Y');
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta content="width=device-width, initial-scale=1" name="viewport" />
<title>Invoice Management - Ultra Fast System</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>

<style>
 :root {
  --primary-color: #34a2ceff;
  --primary-hover: #5dade2;
  --secondary-color: #f59e0b;
  --secondary-hover: #d97706;
  --success-color: #10b981;
  --success-hover: #059669;
  --warning-color: #f59e0b;
  --warning-hover: #d97706;
  --error-color: #ef4444;
  --error-hover: #dc2626;
  --text-primary: #1f2937;
  --text-secondary: #4b5563;
  --text-light: #6b7280;
  --text-muted: #9ca3af;
  --bg-light: #f8fafc;
  --bg-white: #ffffff;
  --bg-gray-50: #f9fafb;
  --bg-gray-100: #f3f4f6;
  --bg-gray-200: #e5e7eb;
  --border-light: #e5e7eb;
  --border-gray-200: #e5e7eb;
  --border-gray-300: #d1d5db;
  --border-focus: #93c5fd;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  --transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-fast: all 0.05s cubic-bezier(0.4, 0, 0.2, 1);
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.5rem;
  --radius-full: 9999px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  font-family: 'Inter', sans-serif;
  background-color: var(--bg-light);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
  scroll-behavior: smooth;
}

#app {
  display: flex;
  min-height: 100vh;
  width: 100vw;
  overflow-x: hidden;
}

/* Sidebar Styles */
   
 .sidebar {
  background-color: #1e293b;
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 2rem 1.5rem;
  color: #94a3b8;
  overflow-y: auto;
  box-shadow: 4px 0 10px rgba(0, 0, 0, 0.1);
  transition: var(--transition);
  top: 0;
  min-height: 100vh;      /* Ensures sidebar stretches at least to viewport height */
  height: 100%;           /* Stretches with content if page is longer */
  position: fixed; /* Changed from sticky to fixed */
  left: 0;
  z-index: 50;
}
 main {
  flex-grow: 1;
  padding-top: 90px !important;
  padding: 2rem;
  margin-left: 260px; /* Match sidebar width */
  max-width: calc(100vw - 260px);
  box-sizing: border-box;
  overflow-x: hidden;
  background: linear-gradient(135deg, #e0f2f7 0%, #f3f4f6 100%);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  transition: var(--transition);
  position: relative;
}
    .sidebar-content {
      flex: 1;
    }

    .sidebar-title {
      color: var(--secondary-color);
      font-weight: 600;
      font-size: 1.3rem;
      margin-bottom: 2.5rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .sidebar-nav {
      display: flex;
      flex-direction: column;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 500;
      font-size: 0.875rem;
      color: #94a3b8;
      text-decoration: none;
      transition: var(--transition);
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md);
      position: relative;
      margin-bottom: 0.5rem;
    }

    .nav-link.active {
      background-color: rgba(251, 191, 36, 0.15);
      color: var(--secondary-color);
      font-weight: 600;
    }

    .nav-link.active::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: linear-gradient(135deg, var(--secondary-color) 0%, var(--secondary-hover) 100%);
      border-radius: 0 4px 4px 0;
      box-shadow: 0 0 8px rgba(251, 191, 36, 0.4);
    }

    .nav-link:not(.active):hover {
      color: var(--secondary-color);
      background-color: rgba(251, 191, 36, 0.05);
      transform: translateX(4px);
    }

    .section-label {
      font-size: 0.75rem;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 1rem 0 0.75rem 0;
      padding: 0 1rem;
      font-weight: 600;
    }

    /* Arrow Icon */
    .arrow-icon {
      margin-left: auto;
      display: flex;
      align-items: center;
    }

    .arrow-icon i {
      transition: transform 0.3s ease;
      transform: rotate(0deg);
    }

    .nav-link.open .arrow-icon i {
      transform: rotate(180deg);
    }

    /* Fixed Sidebar Submenu Styles - Reduced width to stay within sidebar bounds */
    .sidebar-submenu {
      display: none;
      flex-direction: column;
      gap: 0;
      padding-left: 0;
      margin-left: 0.75rem; /* Reduced from 1rem */
      margin-right: 0.5rem; /* Added right margin to ensure containment */
      border-left: 2px solid rgba(251, 191, 36, 0.2);
      margin-top: 0.5rem;
      margin-bottom: 0.5rem;
      overflow: hidden;
      transition: all 0.3s ease;
      max-width: calc(100% - 1.25rem); /* Ensure submenu doesn't exceed sidebar width */
    }

    .sidebar-submenu.open {
      display: flex;
    }

    .submenu-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 500;
      font-size: 0.8rem;
      color: #94a3b8;
      text-decoration: none;
      transition: var(--transition);
      padding: 0.6rem 0.75rem 0.6rem 1.25rem; /* Reduced right padding */
      border-radius: var(--radius-md);
      position: relative;
      margin-bottom: 0.25rem;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      max-width: 100%; /* Ensure submenu links don't exceed container */
      overflow: hidden; /* Hide any overflow */
      text-overflow: ellipsis; /* Add ellipsis for long text */
      white-space: nowrap; /* Prevent text wrapping */
    }

    .submenu-link.active {
      background: linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(251, 191, 36, 0.1) 100%);
      color: var(--secondary-color);
      font-weight: 600;
      border-color: rgba(251, 191, 36, 0.3);
      box-shadow: 0 2px 8px rgba(251, 191, 36, 0.15);
    }

    .submenu-link.active::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: linear-gradient(135deg, var(--secondary-color) 0%, var(--secondary-hover) 100%);
      border-radius: 0 2px 2px 0;
      box-shadow: 0 0 6px rgba(251, 191, 36, 0.5);
    }

    .submenu-link:not(.active):hover {
      color: var(--secondary-color);
      background: rgba(251, 191, 36, 0.08);
      transform: translateX(2px); /* Reduced transform to prevent overflow */
      border-color: rgba(251, 191, 36, 0.2);
    }

    .help-text {
      font-size: 0.75rem;
      color: #64748b;
      text-align: center;
      padding-top: 1.5rem;
      margin-top: 2rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
/* Main Content Area */
main {
  flex-grow: 1;
  margin-left: 260px; /* Match sidebar width */
  padding-top: 0 !important; /* Remove the forced padding */
  padding: 1rem 2rem; /* Adjust padding as needed */
  max-width: calc(120vw - 280px);
  box-sizing: border-box;
  overflow-x: hidden;
  background: #e0f2f7;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  transition: var(--transition-fast);
  position: relative;
}

/* Header Styles */
.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
    margin-bottom: 2rem; /* Reduced from 1.5rem */
  padding-top: 1rem; /* Add small padding instead of margin */
  flex-wrap: wrap;
  gap: 1.5rem;
  position: relative;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-grid {
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: 0.625rem;
  color: var(--text-secondary);
  background: var(--bg-white);
  cursor: pointer;
  transition: var(--transition-fast);
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-sm);
}

.btn-grid:hover {
  color: var(--secondary-color);
  border-color: var(--secondary-color);
  background: #fff8eb;
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.2);
  transform: translateY(-2px);
}

select.company-select {
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: 0.625rem 2.5rem 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  background: var(--bg-white);
  cursor: pointer;
  transition: var(--transition-fast);
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg fill='none' stroke='%234b5563' stroke-width='2' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3e%3cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3e%3c/path%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 1rem 1rem;
  box-shadow: var(--shadow-sm);
}

select.company-select:hover {
  border-color: var(--secondary-color);
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.2);
}

select.company-select:focus {
  outline: none;
  border-color: var(--secondary-color);
  box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.3);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: nowrap;
}

.search-wrapper {
  position: relative;
  width: 280px;
  transition: var(--transition-fast);
  flex-shrink: 0;
}

.search-wrapper input[type="search"] {
  width: 100%;
  border: 2px solid var(--border-light);
  border-radius: var(--radius-xl);
  padding: 0.75rem 1rem 0.75rem 3rem;
  font-size: 0.875rem;
  color: var(--text-primary);
  background: var(--bg-white);
  transition: var(--transition-fast);
  box-shadow: var(--shadow-sm);
  font-weight: 500;
}

.search-wrapper input[type="search"]::placeholder {
  color: var(--text-muted);
}

.search-wrapper input[type="search"]:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(135, 206, 235, 0.1);
}

.search-wrapper i {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
  font-size: 1rem;
}

.btn-export {
  background: var(--bg-white);
  border: 2px solid var(--border-light);
  border-radius: var(--radius-xl);
  padding: 0.75rem 1rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-fast);
  font-size: 0.875rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: var(--shadow-sm);
}

.btn-export:hover {
  color: #0492b9;
  border-color: var(--primary-color);
  background: rgba(135, 206, 235, 0.05);
  box-shadow: 0 4px 12px rgba(135, 206, 235, 0.15);
  transform: translateY(-1px);
}

.btn-add-new {
  background: #00b3e3;
  color: white;
  font-weight: 600;
  border-radius: var(--radius-xl);
  padding: 0.75rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  box-shadow: 0 4px 12px rgba(135, 206, 235, 0.3);
  border: none;
  cursor: pointer;
  transition: var(--transition-fast);
  flex-shrink: 0;
}

.btn-add-new:hover {
  background: #0492b9;
  box-shadow: 0 6px 20px rgba(135, 206, 235, 0.4);
  transform: translateY(-2px);
}

/* Dashboard Cards */
.dashboard-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.dashboard-card {
  background: var(--bg-white);
  border-radius: var(--radius-xl);
  padding: 1rem;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-light);
  transition: var(--transition-fast);
  position: relative;
  overflow: hidden;
  min-height: 100px;
}

.dashboard-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--primary-color);
}

.dashboard-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.dashboard-card.success::before {
  background: var(--success-color);
}

.dashboard-card.warning::before {
  background: var(--warning-color);
}

.dashboard-card.error::before {
  background: var(--error-color);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.card-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.card-icon {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  color: white;
}

.card-icon.primary {
  background: var(--primary-color);
}

.card-icon.success {
  background: var(--success-color);
}

.card-icon.warning {
  background: var(--warning-color);
}

.card-icon.error {
  background: var(--error-color);
}

.card-value {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1;
  margin-bottom: 0.25rem;
}

.card-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
}

.card-trend {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.card-trend.positive {
  color: var(--success-color);
}

.card-trend.negative {
  color: var(--error-color);
}

.card-trend.neutral {
  color: var(--text-muted);
}

/* Filters Section */
.filters-section {
  background: var(--bg-white);
  padding: 1rem;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  margin-bottom: 1.5rem;
  border: 1px solid var(--border-light);
}

.filters-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.filters-header h3 {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-primary);
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  align-items: end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.filter-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-primary);
}

.filter-select,
.filter-input {
  padding: 0.5rem 0.75rem;
  border: 2px solid var(--border-light);
  border-radius: var(--radius-lg);
  font-size: 0.75rem;
  transition: var(--transition-fast);
  background: var(--bg-white);
  font-weight: 500;
  color: var(--text-primary);
  height: 36px;
}

.filter-select:focus,
.filter-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(135, 206, 235, 0.1);
}

.clear-filters-btn {
  background: var(--bg-gray-100);
  border: 2px solid var(--border-light);
  border-radius: var(--radius-lg);
  padding: 0.5rem 1rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-fast);
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  height: 36px;
}

.clear-filters-btn:hover {
  background: var(--error-color);
  color: white;
  border-color: var(--error-color);
  transform: translateY(-1px);
}

/* Table Styles */
.table-container {
  background: var(--bg-white);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  border: 1px solid var(--border-light);
}

.table-header {
  padding: 1.5rem 2rem 1rem;
  border-bottom: 1px solid var(--border-light);
}

.table-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
}

.table-wrapper {
  overflow-x: auto;
}

.invoice-table {
  width: 100%;
  border-collapse: collapse;
}

.invoice-table th,
.invoice-table td {
  padding: 1.25rem;
  text-align: left;
  border-bottom: 1px solid var(--border-light);
}

.invoice-table th {
  background: var(--bg-gray-50);
  font-weight: 700;
  color: var(--text-primary);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  position: sticky;
  top: 0;
  z-index: 10;
}

.invoice-table tbody tr {
  transition: var(--transition-fast);
  cursor: pointer;
}

.invoice-table tbody tr:hover {
  background: var(--bg-gray-50);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.875rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-paid {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success-color);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.status-partial {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning-color);
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.status-unpaid {
  background: rgba(239, 68, 68, 0.1);
  color: var(--error-color);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.amount {
  font-weight: 700;
  color: var(--text-primary);
}

.amount.positive {
  color: var(--success-color);
}

.amount.negative {
  color: var(--error-color);
}

.supplier-name {
  font-weight: 600;
  color: var(--primary-color);
}

.invoice-number {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.875rem;
  background: var(--bg-gray-100);
  padding: 0.375rem 0.75rem;
  border-radius: var(--radius-md);
  font-weight: 600;
}

.action-buttons-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.action-btn {
  width: 2.5rem;
  height: 2.5rem;
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  position: relative;
  overflow: hidden;
}

.action-btn.edit {
  background: rgba(135, 206, 235, 0.1);
  color: var(--primary-color);
  border: 1px solid rgba(135, 206, 235, 0.2);
}

.action-btn.edit:hover {
  background: var(--primary-color);
  color: white;
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 8px 20px rgba(135, 206, 235, 0.3);
}

.action-btn.delete {
  background: rgba(239, 68, 68, 0.1);
  color: var(--error-color);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.action-btn.delete:hover {
  background: var(--error-color);
  color: white;
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 8px 20px rgba(239, 68, 68, 0.3);
}

.action-btn.download {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success-color);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.action-btn.download:hover {
  background: var(--success-color);
  color: white;
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
}

/* ========== MODAL STYLES ========== */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(20px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  opacity: 0;
  visibility: hidden;
  transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal.visible {
  opacity: 1;
  visibility: visible;
}

.modal.visible .modal-content {
  transform: scale(1) translateY(0);
  opacity: 1;
}

/* MAIN INVOICE MODAL - Large Size */
.modal-content {
  background: var(--bg-white);
  border-radius: 16px;
  box-shadow: var(--shadow-2xl);
  width: 800px;
  height: 800px;
  max-width: 90vw;
  max-height: 85vh;
  overflow: hidden;
  position: relative;
  border: 2px solid var(--primary-color);
  display: flex;
  flex-direction: column;
  transform: scale(0.9) translateY(20px);
  opacity: 0;
  transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
}

/* SUPPLIER MODAL - Small Size (Same as Delete Modal) */
.supplier-modal .modal-content {
  width: 400px !important;
  height: 250px !important;
  max-width: 90vw;
  max-height: 300px;
}

/* Modal Header */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 2rem 0.75rem;
  border-bottom: 2px solid var(--primary-color);
  background: #f0f8ff;
  border-radius: 16px 16px 0 0;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--primary-color);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 auto;
}

.modal-close {
  position: absolute;
  top: 12px;
  right: 20px;
  background: #fee2e2;
  border: 2px solid var(--error-color);
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  color: var(--error-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  transition: var(--transition-fast);
  z-index: 10;
}

.modal-close:hover {
  background: var(--error-color);
  color: white;
  transform: rotate(90deg) scale(1.1);
}

/* Modal Body */
.modal-body {
  padding: 1rem 2rem;
  background: var(--bg-white);
  overflow-y: auto;
  flex-grow: 1;
  position: relative;
  display: flex;
  flex-direction: column;
}

/* Modal Footer */
.modal-footer {
  padding: 0.75rem 2rem 1rem;
  border-top: 1px solid var(--border-light);
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  background: #f0f8ff;
  border-radius: 0 0 16px 16px;
  flex-shrink: 0;
}

/* Form Grid - 3 Column Layout */
.form-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group {
  margin-bottom: 0;
  position: relative;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group.half-width {
  grid-column: span 2;
}

/* Form Elements */
.form-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.375rem;
  position: relative;
}

.form-input, .form-select, .form-textarea {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 2px solid var(--border-light);
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  color: var(--text-primary);
  background: white;
  transition: var(--transition-fast);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  position: relative;
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(135, 206, 235, 0.1);
  transform: translateY(-1px);
}

.form-textarea {
  min-height: 60px;
  resize: vertical;
}

/* Section Headers */
.section-header {
  font-size: 1rem;
  font-weight: 700;
  color: var(--primary-color);
  margin: 1rem 0 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
  padding-bottom: 0.5rem;
}

.section-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--primary-color);
  border-radius: var(--radius-full);
}

.section-header i {
  font-size: 1rem;
  color: var(--primary-color);
}

/* Button Styles */
.btn-primary {
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  padding: 0.625rem 1.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 3px 12px rgba(135, 206, 235, 0.3);
}

.btn-primary:hover {
  background: var(--primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(135, 206, 235, 0.4);
}

.btn-secondary {
  background: var(--bg-gray-100);
  color: var(--text-secondary);
  border: 2px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: 0.625rem 1.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.btn-secondary:hover {
  background: var(--bg-gray-200);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* PDF Upload Container - Optimized Size */
.pdf-upload-container {
  border: 2px dashed var(--border-light);
  border-radius: var(--radius-lg);
  padding: 0.75rem;
  min-height: 60px;
  text-align: center;
  cursor: pointer;
  transition: var(--transition-fast);
  position: relative;
  overflow: hidden;
  background: #f0f8ff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.pdf-upload-container:hover {
  border-color: var(--primary-color);
  background: rgba(135, 206, 235, 0.05);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(135, 206, 235, 0.15);
}

.pdf-upload-container.has-file {
  border-color: var(--success-color);
  background: rgba(16, 185, 129, 0.05);
  box-shadow: 0 6px 18px rgba(16, 185, 129, 0.2);
}

.pdf-upload-icon {
  font-size: 1.25rem;
  color: var(--primary-color);
  margin-bottom: 0.25rem;
}

.pdf-upload-text {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.125rem;
  font-size: 0.75rem;
}

.pdf-upload-subtext {
  font-size: 0.625rem;
  color: var(--text-muted);
}

.pdf-file-name {
  font-size: 0.75rem;
  color: var(--success-color);
  margin-top: 0.25rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  background: rgba(16, 185, 129, 0.1);
  border-radius: var(--radius-sm);
  display: inline-block;
}

/* Delete Confirmation Dialog */
.delete-confirmation-dialog {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(15px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  opacity: 0;
  visibility: hidden;
  transition: all 0.1s ease;
}

.delete-confirmation-dialog.visible {
  opacity: 1;
  visibility: visible;
}

.dialog-content {
  background: var(--bg-white);
  border-radius: var(--radius-2xl);
  padding: 2rem 1.5rem;
  text-align: center;
  max-width: 400px;
  width: 90%;
  box-shadow: var(--shadow-2xl);
  border: 2px solid var(--error-color);
  position: relative;
  overflow: hidden;
}

.dialog-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--error-color);
}

.delete-icon {
  font-size: 3rem;
  color: var(--error-color);
  margin-bottom: 1rem;
}

.dialog-content h3 {
  font-size: 1.25rem;
  margin-bottom: 0.75rem;
  color: var(--text-primary);
  font-weight: 700;
}

.dialog-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

.cancel-btn {
  background: var(--bg-gray-100);
  color: var(--text-secondary);
  border: 2px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: 0.625rem 1.25rem;
  cursor: pointer;
  transition: var(--transition-fast);
  font-weight: 600;
  font-size: 0.75rem;
}

.cancel-btn:hover {
  background: var(--bg-gray-200);
  transform: translateY(-1px);
}

.confirm-btn {
  background: var(--error-color);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  padding: 0.625rem 1.25rem;
  cursor: pointer;
  transition: var(--transition-fast);
  font-weight: 600;
  font-size: 0.75rem;
  box-shadow: 0 3px 12px rgba(239, 68, 68, 0.3);
}

.confirm-btn:hover {
  background: var(--error-hover);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
}

/* Loading Overlay */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5000;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.1s ease;
}

.loading-overlay.visible {
  opacity: 1;
  visibility: visible;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: var(--primary-color);
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  box-shadow: 0 4px 15px rgba(135, 206, 235, 0.2);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Alert Styles */
.alert {
  position: fixed;
  top: 2rem;
  right: 2rem;
  padding: 1rem 1.5rem;
  border-radius: var(--radius-lg);
  color: white;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  z-index: 6000;
  min-width: 300px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  animation: slideIn 0.1s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.alert.success {
  background: var(--success-color);
  border-left: 4px solid #059669;
}

.alert.error {
  background: var(--error-color);
  border-left: 4px solid #dc2626;
}

.alert.fadeOut {
  animation: fadeOut 0.1s ease-in forwards;
}

@keyframes fadeOut {
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}

/* Responsive Design */
@media (max-width: 1400px) {
  .form-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 1024px) {
  .modal-content {
    width: 95vw;
    height: 90vh;
  }
  
  .supplier-modal .modal-content {
    width: 90vw !important;
    height: 280px !important;
  }
  
  .form-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
}

@media (max-width: 768px) {
  .sidebar {
    width: 80px;
  }
  
  .sidebar-title {
    font-size: 0;
    justify-content: center;
    margin-bottom: 2rem;
  }
  
  .sidebar-title i {
    font-size: 1.5rem;
  }
  
  .nav-link span,
  .submenu-link span {
    display: none;
  }
  
  .nav-link,
  .submenu-link {
    justify-content: center;
    padding: 0.75rem;
  }
  
  .arrow-icon {
    display: none;
  }
  
  .section-label {
    font-size: 0;
    margin: 1rem 0;
    padding: 0;
    text-align: center;
  }
  
  .help-text {
    font-size: 0;
    padding: 1rem 0;
  }
  
  main {
    margin-left: 80px;
    max-width: calc(100vw - 80px);
    padding: 1.5rem;
  }
  
  .sidebar-submenu {
    margin-left: 0;
    margin-right: 0;
    border-left: none;
    max-width: 100%;
  }

  .modal-content {
    width: 95vw;
    height: 85vh;
  }
  
  .supplier-modal .modal-content {
    width: 95vw !important;
    height: 300px !important;
  }
  
  .modal-header {
    padding: 0.75rem 1.5rem 0.5rem;
  }
  
  .modal-body {
    padding: 0.75rem 1.5rem;
  }
  
  .modal-footer {
    padding: 0.5rem 1.5rem 0.75rem;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .btn-primary, .btn-secondary {
    width: 100%;
    justify-content: center;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .dialog-buttons {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .cancel-btn, .confirm-btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .modal-content {
    width: 98vw;
    height: 90vh;
  }
  
  .supplier-modal .modal-content {
    width: 98vw !important;
    height: 320px !important;
  }
  
  .modal-title {
    font-size: 1.125rem;
  }
  
  .section-header {
    font-size: 0.875rem;
  }
  
  .pdf-upload-container {
    padding: 0.5rem;
    min-height: 50px;
  }
  
  .pdf-upload-icon {
    font-size: 1rem;
  }
  
  .form-input, .form-select, .form-textarea {
    padding: 0.375rem 0.5rem;
    font-size: 0.6875rem;
  }
  
  .form-label {
    font-size: 0.6875rem;
  }
}
.pdf-upload-container.has-file,
.pdf-upload-container.dragover {
  border-color: var(--primary-color);
  background: #e0f7fa;
  box-shadow: 0 0 0 2px var(--primary-color);
}
</style>
</head>
<body>
<div id="app">
  <!-- Sidebar -->
  <aside class="sidebar">
    <div class="sidebar-content">
      <h1 class="sidebar-title">
        <i class="fas fa-users-cog"></i> 
        <span>HR Dashboard</span>
      </h1>
      
      <nav class="sidebar-nav">
        <a href="../../Dashboard.php" class="nav-link">
          <i class="fas fa-th-large"></i>
          <span>Dashboard</span>
        </a>
        
        <p class="section-label">Planification</p>
        
        <a href="#" class="nav-link" id="transportMenu">
          <i class="fas fa-truck"></i>
          <span>Transport</span>
          <span class="arrow-icon">
            <i class="fas fa-chevron-down"></i>
          </span>
        </a>
        <div class="sidebar-submenu" id="transportSubmenu">
          <a href="../../Transport/Transport.php" class="submenu-link">
            <i class="fas fa-shuttle-van"></i>
            <span>Trajet</span>
          </a>
          <a href="../../Transport/Export_Trajet.php" class="submenu-link">
            <i class="fas fa-shuttle-van"></i>
            <span>Export_Trajet</span>
          </a>
        </div>
        
        <a href="../../Task/Tasks.php" class="nav-link">
          <i class="fas fa-calendar-alt"></i>
          <span>Calendar</span>
        </a>
        <a href="../../Assurance/Assurance.php" class="nav-link">
          <i class="fas fa-shield-alt"></i>
          <span>Assurance</span>
        </a>
        <a href="../../Stock/Stock.php" class="nav-link">
          <i class="fas fa-box"></i>
          <span>Stock</span>
        </a>
        
        <p class="section-label">Business Units</p>
        
        <a href="#" class="nav-link" id="employeesMenu">
          <i class="fas fa-users"></i>
          <span>Employees</span>
          <span class="arrow-icon">
            <i class="fas fa-chevron-down"></i>
          </span>
        </a>
        <div class="sidebar-submenu" id="employeesSubmenu">
          <a href="../Employees.php" class="submenu-link">
            <i class="fas fa-user-check"></i>
            <span>En Cours</span>
          </a>
          <a href="../Employees_Sortie.php" class="submenu-link">
            <i class="fas fa-user-times"></i>
            <span>Sorties</span>
          </a>
        </div>

        <a href="#" class="nav-link" id="payrollMenu">
          <i class="fas fa-money-check-alt"></i>
          <span>Paie</span>
          <span class="arrow-icon">
            <i class="fas fa-chevron-down"></i>
          </span>
        </a>
        <div class="sidebar-submenu" id="payrollSubmenu">
          <a href="../payroll_active.php" class="submenu-link">
            <i class="fas fa-toggle-on"></i>
            <span>Active</span>
          </a>
          <a href="../payroll_inactive.php" class="submenu-link">
            <i class="fas fa-toggle-off"></i>
            <span>Inactive</span>
          </a>
        </div>
        
        <p class="section-label">Recruitment</p>
        
        <a href="../Candidates.php" class="nav-link">
          <i class="fas fa-user-friends"></i>
          <span>Candidates</span>
        </a>
        
        <a href="../Documents_Check.php" class="nav-link">
          <i class="fas fa-file-alt"></i>
          <span>Documents Check</span>
        </a>
        
        <p class="section-label">Finance Management</p>
        
        <a href="#" class="nav-link active">
          <i class="fas fa-file-invoice"></i>
          <span>Invoices</span>
        </a>
      </nav>
    </div>
  </aside>

  <!-- Main content -->
  <main>
    <div class="header-top">
      <div class="header-left">
        <button class="btn-grid" type="button">
          <i class="fas fa-th-large"></i>
        </button>
        <select class="company-select" name="company" id="companySelect">
          <option value="#">GM SOLUTION</option>
          <option value="../../DATA/Factures/Facture.php">DATA GRID</option>
          <option value=".../../MULTI/Factures/Facture.php">MULTIVISTAS</option>
          <option value="../../GPM/Factures/Facture.php">GREEN PATH</option>
          <option value="../../HUB/Factures/Facture.php">HUB SIGNAL</option>
        </select>
      </div>
      <div style="flex: 1; display: flex; justify-content: center;">
        <h1 style="font-size: 1.5rem; font-weight: 800; text-align: center;">
          Invoice Management - Ultra Fast
        </h1>
      </div>
      <div class="header-right">
        <div class="search-wrapper">
          <input type="search" placeholder="Search invoices..." id="searchInput" autocomplete="off" value="<?= htmlspecialchars($_GET['search'] ?? '') ?>">
          <i class="fas fa-search"></i>
        </div>
        <button class="btn-export" id="exportBtn">
          <i class="fas fa-download"></i>
          Export
        </button>
        <button id="addInvoiceButton" class="btn-add-new">
          <i class="fas fa-plus"></i>
          Add New
        </button>
        <button id="addSupplierButton" class="btn-add-new" style="background: #f59e0b;">
          <i class="fas fa-user-plus"></i>
          Add Supplier
        </button>
      </div>
    </div>

    <!-- Add Supplier Modal - SMALL SIZE -->
    <div class="modal supplier-modal" id="supplierModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title">
            <i class="fas fa-user-plus"></i>
            Add New Supplier
          </h2>
          <button class="modal-close" id="modalSupplierClose">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <form id="supplierForm">
            <div class="form-group full-width">
              <label class="form-label">Supplier Name</label>
              <input type="text" class="form-input" id="supplierName" required placeholder="Enter supplier name">
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" id="cancelSupplierBtn">Cancel</button>
          <button class="btn-primary" id="saveSupplierBtn">
            <i class="fas fa-save"></i>
            Save Supplier
          </button>
        </div>
      </div>
    </div>

    <!-- Dashboard Cards -->
    <div class="dashboard-cards">
      <div class="dashboard-card">
        <div class="card-header">
          <div class="card-title">Total Invoices</div>
          <div class="card-icon primary">
            <i class="fas fa-file-invoice"></i>
          </div>
        </div>
        <div class="card-value"><?= $stats['total_invoices'] ?></div>
        <div class="card-label">Total invoice count</div>
        <div class="card-trend neutral">
          <i class="fas fa-equals"></i>
          <span>All invoices</span>
        </div>
      </div>

      <div class="dashboard-card success">
        <div class="card-header">
          <div class="card-title">Paid Invoices</div>
          <div class="card-icon success">
            <i class="fas fa-check-circle"></i>
          </div>
        </div>
        <div class="card-value"><?= $stats['paid_invoices'] ?></div>
        <div class="card-label">Fully paid invoices</div>
        <div class="card-trend positive">
          <i class="fas fa-arrow-up"></i>
          <span><?= number_format($stats['paid_amount'], 2) ?> $</span>
        </div>
      </div>

      <div class="dashboard-card warning">
        <div class="card-header">
          <div class="card-title">Partial Payments</div>
          <div class="card-icon warning">
            <i class="fas fa-clock"></i>
          </div>
        </div>
        <div class="card-value"><?= $stats['partial_invoices'] ?></div>
        <div class="card-label">Partially paid invoices</div>
        <div class="card-trend neutral">
          <i class="fas fa-minus"></i>
          <span><?= number_format($stats['partial_amount'], 2) ?> $</span>
        </div>
      </div>

      <div class="dashboard-card error">
        <div class="card-header">
          <div class="card-title">Unpaid Invoices</div>
          <div class="card-icon error">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
        </div>
        <div class="card-value"><?= $stats['unpaid_invoices'] ?></div>
        <div class="card-label">Outstanding invoices</div>
        <div class="card-trend negative">
          <i class="fas fa-arrow-down"></i>
          <span><?= number_format($stats['unpaid_amount'], 2) ?> $</span>
        </div>
      </div>
    </div>

    <!-- Filters Section -->
    <div class="filters-section">
      <div class="filters-header">
        <i class="fas fa-filter"></i>
        <h3>Filter Invoices</h3>
      </div>
      <form method="GET" id="filterForm">
        <div class="filters-grid">
          <div class="filter-group">
            <label class="filter-label">Supplier</label>
            <select class="filter-select" name="supplier" id="supplierFilter">
              <option value="">All Suppliers</option>
              <?php foreach($suppliers as $supplier): ?>
                <option value="<?= htmlspecialchars($supplier['name']) ?>" <?= (($_GET['supplier'] ?? '') == $supplier['name']) ? 'selected' : '' ?>>
                  <?= htmlspecialchars($supplier['name']) ?>
                </option>
              <?php endforeach; ?>
            </select>
          </div>
          
          <div class="filter-group">
            <label class="filter-label">Status</label>
            <select class="filter-select" name="status" id="statusFilter">
              <option value="">All Status</option>
              <option value="paid" <?= (($_GET['status'] ?? '') == 'paid') ? 'selected' : '' ?>>Paid</option>
              <option value="partial" <?= (($_GET['status'] ?? '') == 'partial') ? 'selected' : '' ?>>Partial</option>
              <option value="unpaid" <?= (($_GET['status'] ?? '') == 'unpaid') ? 'selected' : '' ?>>Unpaid</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label class="filter-label">Year</label>
            <select class="filter-select" name="year" id="yearFilter">
              <option value="">All Years</option>
              <?php
                $selectedYear = $_GET['year'] ?? $current_year;
                for ($y = $oldest_year; $y <= $current_year; $y++) {
                  $selected = ($selectedYear == $y) ? 'selected' : '';
                  echo "<option value=\"$y\" $selected>$y</option>";
                }
              ?>
            </select>
          </div>
          
          <div class="filter-group">
            <label class="filter-label">From Date</label>
            <input type="date" class="filter-input" name="date_from" id="dateFrom" value="<?= htmlspecialchars($_GET['date_from'] ?? '') ?>">
          </div>
          
          <div class="filter-group">
            <label class="filter-label">To Date</label>
            <input type="date" class="filter-input" name="date_to" id="dateTo" value="<?= htmlspecialchars($_GET['date_to'] ?? '') ?>">
          </div>
          
          <div class="filter-group">
            <button type="button" class="clear-filters-btn" id="clearFilters">
              <i class="fas fa-times"></i>
              Clear
            </button>
          </div>
        </div>
        <input type="hidden" name="search" id="hiddenSearch" value="<?= htmlspecialchars($_GET['search'] ?? '') ?>">
      </form>
    </div>

    <!-- Invoice Table -->
    <div class="table-container">
      <div class="table-header">
        <h3>Invoice List (<?= count($invoices) ?> invoices)</h3>
      </div>
      <div class="table-wrapper">
        <table class="invoice-table" id="invoiceTable">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Supplier</th>
              <th>Date</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Payment Date</th>
              <th>Payment Method</th>
              <th>Paid Amount</th>
              <th>Balance</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="invoiceTableBody">
            <?php if (empty($invoices)): ?>
            <tr>
              <td colspan="11" style="text-align: center; padding: 2rem;">
                <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                No invoices found matching your criteria
              </td>
            </tr>
            <?php else: ?>
            <?php foreach($invoices as $invoice): 
              $balance = $invoice['amount'] - $invoice['paid_amount'];
            ?>
            <tr>
              <td>
                <div class="invoice-number"><?= htmlspecialchars($invoice['invoice_number']) ?></div>
              </td>
              <td>
                <div class="supplier-name"><?= htmlspecialchars($invoice['supplier_name']) ?></div>
              </td>
              <td><?= date('d/m/Y', strtotime($invoice['date'])) ?></td>
              <td><?= htmlspecialchars($invoice['description']) ?></td>
              <td>
                <div class="amount"><?= number_format($invoice['amount'], 2) ?> $</div>
              </td>
              <td><?= $invoice['payment_date'] ? date('d/m/Y', strtotime($invoice['payment_date'])) : '-' ?></td>
              <td><?= htmlspecialchars($invoice['payment_method']) ?: '-' ?></td>
              <td>
                <div class="amount <?= $invoice['paid_amount'] > 0 ? 'positive' : '' ?>">
                  <?= number_format($invoice['paid_amount'], 2) ?> $
                </div>
              </td>
              <td>
                <div class="amount <?= $balance > 0 ? 'negative' : ($balance < 0 ? 'positive' : '') ?>">
                  <?= number_format($balance, 2) ?> $
                </div>
              </td>
              <td>
                <span class="status-badge status-<?= $invoice['status'] ?>">
                  <?= ucfirst($invoice['status']) ?>
                </span>
              </td>
              <td>
                <div class="action-buttons-cell">
                  <button class="action-btn edit" onclick="editInvoice(<?= $invoice['id'] ?>)" title="Edit">
                    <i class="fas fa-edit"></i>
                  </button>
                  <?php if($invoice['pdf_file']): ?>
                  <button class="action-btn download" onclick="downloadInvoice(<?= $invoice['id'] ?>)" title="Download">
                    <i class="fas fa-download"></i>
                  </button>
                  <?php endif; ?>
                  <button class="action-btn delete" onclick="deleteInvoice(<?= $invoice['id'] ?>)" title="Delete">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
            <?php endforeach; ?>
            <?php endif; ?>
          </tbody>
        </table>
      </div>
    </div>
  </main>
</div>

<!-- Add/Edit Invoice Modal -->
<div class="modal" id="invoiceModal">
  <div class="modal-content">
    <div class="modal-header">
      <h2 class="modal-title" id="modalTitle">
        <i class="fas fa-plus-circle"></i>
        Add New Invoice
      </h2>
      <button class="modal-close" id="modalClose">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="modal-body">
      <form id="invoiceForm" enctype="multipart/form-data">
        <input type="hidden" id="invoiceId" name="invoiceId">
        
        <!-- PDF Document Section -->
        <div class="section-header">
          <i class="fas fa-file-pdf"></i>
          PDF Document
        </div>
        <div class="form-grid">
          <div class="form-group full-width">
            <label class="form-label">Upload Invoice PDF</label>
            <div class="pdf-upload-container" id="pdfUploadContainer">
              <div class="pdf-upload-icon">
                <i class="fas fa-file-pdf"></i>
              </div>
              <div class="pdf-upload-text">Click to upload</div>
              <div class="pdf-upload-subtext">PDF only, max 10MB</div>
              <div class="pdf-file-name" id="pdfFileName" style="display: none;"></div>
              <input type="file" id="pdfFileInput" name="pdfFile" accept=".pdf" style="display: none;">
            </div>
          </div>
        </div>

        <!-- Invoice Information Section -->
        <div class="section-header">
          <i class="fas fa-file-invoice"></i>
          Invoice Information
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Invoice Number *</label>
            <input type="text" class="form-input" id="invoiceNumber" name="invoiceNumber" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">Supplier *</label>
            <select class="form-select" id="supplier" name="supplier" required>
              <option value="">Select Supplier</option>
              <?php foreach($suppliers as $supplier): ?>
                <option value="<?= $supplier['id'] ?>">
                  <?= htmlspecialchars($supplier['name']) ?>
                </option>
              <?php endforeach; ?>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Invoice Date *</label>
            <input type="date" class="form-input" id="invoiceDate" name="invoiceDate" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">Amount ($) *</label>
            <input type="number" class="form-input" id="amount" name="amount" step="0.01" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">Status *</label>
            <select class="form-select" id="status" name="status" required>
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">N° Chéque</label>
            <input type="text" class="form-input" id="chequeNumber" name="chequeNumber">
          </div>
          
          <div class="form-group full-width">
            <label class="form-label">Description *</label>
            <textarea class="form-textarea" id="description" name="description" required></textarea>
          </div>
        </div>

        <!-- Payment Information Section -->
        <div class="section-header">
          <i class="fas fa-credit-card"></i>
          Payment Information
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Payment Date</label>
            <input type="date" class="form-input" id="paymentDate" name="paymentDate">
          </div>
          
          <div class="form-group">
            <label class="form-label">Payment Method</label>
            <select class="form-select" id="paymentMethod" name="paymentMethod">
              <option value="">Select Method</option>
              <option value="Bank Transfer">Virement</option>
              <option value="prelevement">Prélèvement</option>
              <option value="Check">Chéque</option>
              <option value="Credit Card">Carte Bancaire</option>
              <option value="Cash">Espéce</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Paid Amount ($)</label>
            <input type="number" class="form-input" id="paidAmount" name="paidAmount" step="0.01">
          </div>
        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" id="cancelBtn">Cancel</button>
      <button class="btn-primary" id="saveBtn">
        <i class="fas fa-save"></i>
        Save Invoice
      </button>
    </div>
  </div>
</div>

<!-- Delete Confirmation Dialog -->
<div class="delete-confirmation-dialog" id="deleteDialog">
  <div class="dialog-content">
    <div class="delete-icon">
      <i class="fas fa-trash-alt"></i>
    </div>
    <h3>Delete Invoice</h3>
    <div class="dialog-buttons">
      <button class="cancel-btn" id="cancelDelete">Cancel</button>
      <button class="confirm-btn" id="confirmDelete">Delete Invoice</button>
    </div>
  </div>
</div>

<!-- Loading Overlay -->
<div class="loading-overlay" id="loadingOverlay">
  <div class="spinner"></div>
</div>

<script>
// Ultra-optimized JavaScript with maximum performance
const app = {
  // Cached DOM elements for lightning-fast access
  elements: {},
  data: {
    editingInvoiceId: null,
    deleteInvoiceId: null,
    searchTimeout: null,
    requestController: null
  },

  // Initialize app with ultra-fast setup
  init() {
    this.cacheElements();
    this.bindEvents();
    this.setupSidebar();
    this.preloadData();
  },

  // Cache all DOM elements for maximum performance
  cacheElements() {
    const ids = [
      'invoiceModal', 'addInvoiceButton', 'modalClose', 'cancelBtn', 'saveBtn',
      'invoiceForm', 'modalTitle', 'deleteDialog', 'cancelDelete', 'confirmDelete',
      'pdfUploadContainer', 'pdfFileInput', 'pdfFileName', 'addSupplierButton',
      'supplierModal', 'modalSupplierClose', 'cancelSupplierBtn', 'saveSupplierBtn',
      'supplierForm', 'supplierName', 'searchInput', 'filterForm', 'clearFilters',
      'hiddenSearch', 'loadingOverlay', 'exportBtn', 'companySelect'
    ];
    
    ids.forEach(id => {
      this.elements[id] = document.getElementById(id);
    });

    // Cache frequently accessed containers
    this.elements.dashboardCards = document.querySelector('.dashboard-cards');
    this.elements.invoiceTableBody = document.getElementById('invoiceTableBody');
    this.elements.invoiceListHeader = document.querySelector('.table-header h3');
    this.elements.filterElements = document.querySelectorAll('.filter-select, .filter-input');
  },

  // Bind all events with optimized handlers
  bindEvents() {
    const e = this.elements;
    
    // Modal events with ultra-fast handlers
    e.addInvoiceButton.onclick = () => this.openAddModal();
    e.modalClose.onclick = () => this.closeModal();
    e.cancelBtn.onclick = () => this.closeModal();
    e.saveBtn.onclick = () => this.saveInvoice();
    
    // Delete dialog events
    e.cancelDelete.onclick = () => this.closeDeleteDialog();
    e.confirmDelete.onclick = () => this.handleDeleteConfirm();

    // Supplier modal events
    e.addSupplierButton.onclick = () => this.openSupplierModal();
    e.modalSupplierClose.onclick = () => this.closeSupplierModal();
    e.cancelSupplierBtn.onclick = () => this.closeSupplierModal();
    e.saveSupplierBtn.onclick = () => this.saveSupplier();

    // PDF upload events
    e.pdfUploadContainer.onclick = () => e.pdfFileInput.click();
    e.pdfFileInput.onchange = (event) => this.handlePdfFile(event.target.files[0]);

    // Ultra-fast search with optimized debounce (50ms for instant response)
    e.searchInput.oninput = (event) => {
      clearTimeout(this.data.searchTimeout);
      this.data.searchTimeout = setTimeout(() => {
        e.hiddenSearch.value = event.target.value;
        this.fetchData();
      }, 50);
    };

    // Filter events with immediate response
    this.elements.filterElements.forEach(element => {
      element.onchange = () => this.fetchData();
    });

    // Clear filters
    e.clearFilters.onclick = () => this.clearFilters();

    // Export and company select
    e.exportBtn.onclick = () => this.exportToExcel();
    e.companySelect.onchange = (event) => {
      const url = event.target.value;
      if (url && !location.pathname.endsWith(url.replace('../',''))) {
        location.href = url;
      }
    };

    

// Inside app.bindEvents(), after PDF upload events
const pdfDropArea = this.elements.pdfUploadContainer;
if (pdfDropArea) {
  // Prevent default drag behaviors
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    pdfDropArea.addEventListener(eventName, e => {
      e.preventDefault();
      e.stopPropagation();
    });
  });

  // Highlight on dragover
  pdfDropArea.addEventListener('dragover', () => {
    pdfDropArea.classList.add('has-file');
    pdfDropArea.querySelector('.pdf-upload-text').textContent = 'Drop PDF here';
  });

  // Remove highlight on dragleave
  pdfDropArea.addEventListener('dragleave', () => {
    if (!this.elements.pdfFileInput.files.length) {
      pdfDropArea.classList.remove('has-file');
      pdfDropArea.querySelector('.pdf-upload-text').textContent = 'Click to upload';
    }
  });

  // Handle drop
  pdfDropArea.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      // Create a DataTransfer to assign the file to the input
      const dt = new DataTransfer();
      dt.items.add(file);
      this.elements.pdfFileInput.files = dt.files;
      this.handlePdfFile(file);
    } else {
      this.showAlert('Please drop a valid PDF file', 'error');
    }
  });
}


    // Modal outside click with instant response
    e.invoiceModal.onclick = (event) => {
      if (event.target === e.invoiceModal) this.closeModal();
    };
    e.supplierModal.onclick = (event) => {
      if (event.target === e.supplierModal) this.closeSupplierModal();
    };
    e.deleteDialog.onclick = (event) => {
      if (event.target === e.deleteDialog) this.closeDeleteDialog();
    };

    // Keyboard shortcuts for power users
    document.onkeydown = (event) => {
      if (event.ctrlKey || event.metaKey) {
        switch(event.key) {
          case 'n':
            event.preventDefault();
            this.openAddModal();
            break;
          case 's':
            if (this.elements.invoiceModal.classList.contains('visible')) {
              event.preventDefault();
              this.saveInvoice();
            }
            break;
        }
      }
      if (event.key === 'Escape') {
        this.closeModal();
        this.closeSupplierModal();
        this.closeDeleteDialog();
      }
    };
  },

  // Preload data for instant access
  preloadData() {
    // Preload supplier data
    this.preloadSuppliers();
  },

  preloadSuppliers() {
    // Cache supplier data for instant dropdown population
    const supplierOptions = Array.from(document.querySelectorAll('#supplier option'));
    this.data.suppliers = supplierOptions.map(option => ({
      id: option.value,
      name: option.textContent
    }));
  },

  // Ultra-fast data fetching with request cancellation
  async fetchData() {
    // Cancel previous request if still pending
    if (this.data.requestController) {
        this.data.requestController.abort();
    }
    
    this.data.requestController = new AbortController();
    
    try {
        const formData = new FormData(this.elements.filterForm);
        const params = new URLSearchParams(formData);
        
        const response = await fetch(`${location.pathname}?${params}`, {
            signal: this.data.requestController.signal
        });
        
        if (!response.ok) throw new Error('Network response was not ok');
        
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Ultra-fast DOM updates with batch processing
        this.batchUpdateDOM(doc);

        // Update URL without page reload
        history.pushState(null, '', `${location.pathname}?${params}`);
    } catch (error) {
        if (error.name !== 'AbortError') {
            this.showAlert('Error loading data', 'error');
        }
    } finally {
        this.data.requestController = null;
    }
},

  // Batch DOM updates for maximum performance
  batchUpdateDOM(doc) {
    requestAnimationFrame(() => {
      const newCards = doc.querySelector('.dashboard-cards');
      if (newCards) this.elements.dashboardCards.innerHTML = newCards.innerHTML;

      const newTableBody = doc.getElementById('invoiceTableBody');
      if (newTableBody) this.elements.invoiceTableBody.innerHTML = newTableBody.innerHTML;

      const newHeader = doc.querySelector('.table-header h3');
      if (newHeader) this.elements.invoiceListHeader.textContent = newHeader.textContent;
    });
  },

  // Ultra-fast modal operations
  openAddModal() {
    this.data.editingInvoiceId = null;
    this.elements.modalTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Add New Invoice';
    this.elements.invoiceForm.reset();
    this.resetPdfUpload();
    this.elements.invoiceModal.classList.add('visible');
    
    // Auto-focus first input
    setTimeout(() => {
      const firstInput = this.elements.invoiceForm.querySelector('input:not([type="hidden"])');
      if (firstInput) firstInput.focus();
    }, 50);
  },

  closeModal() {
    this.elements.invoiceModal.classList.remove('visible');
    this.data.editingInvoiceId = null;
    this.resetPdfUpload();
  },

  openSupplierModal() {
    this.elements.supplierForm.reset();
    this.elements.supplierModal.classList.add('visible');
    setTimeout(() => this.elements.supplierName.focus(), 25);
  },

  closeSupplierModal() {
    this.elements.supplierModal.classList.remove('visible');
  },

  closeDeleteDialog() {
    this.elements.deleteDialog.classList.remove('visible');
    this.data.deleteInvoiceId = null;
  },

  // Ultra-fast save operations with optimistic updates
  async saveInvoice() {
    if (!this.validateForm(this.elements.invoiceForm)) {
        this.showAlert('Please fill required fields', 'error');
        return;
    }
    
    const formData = new FormData(this.elements.invoiceForm);
    const url = this.data.editingInvoiceId ? 'Update_Invoice.php' : 'Add_Invoice.php';
    
    this.elements.saveBtn.disabled = true;
    this.elements.saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    this.showLoading();
    
    try {
        const response = await fetch(url, { 
            method: 'POST', 
            body: formData 
        });
        const data = await response.json();
        
        if (data.success) {
            this.hideLoading(); // Hide loading before showing alert
            this.showAlert(data.message, 'success');
            this.closeModal();
            this.fetchData();
        } else {
            this.hideLoading(); // Hide loading on error too
            this.showAlert(data.message || 'Error saving', 'error');
        }
    } catch (error) {
        this.hideLoading();
        this.showAlert('Error saving invoice', 'error');
    } finally {
        this.elements.saveBtn.disabled = false;
        this.elements.saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Invoice';
    }
},

  async saveSupplier() {
    const name = this.elements.supplierName.value.trim();
    if (!name) {
      this.showAlert('Please enter supplier name', 'error');
      return;
    }
    
    this.elements.saveSupplierBtn.disabled = true;
    this.elements.saveSupplierBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    
    try {
      const response = await fetch('Add_Fournisseur.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const data = await response.json();
      
      if (data.success) {
        this.showAlert('Supplier added successfully', 'success');
        
        // Instantly update dropdowns
        this.updateSupplierDropdowns(data.supplier_id, name);
        
        this.closeSupplierModal();
        this.fetchData();
      } else {
        this.showAlert(data.message || 'Error adding supplier', 'error');
      }
    } catch (error) {
      this.showAlert('Error adding supplier', 'error');
    } finally {
      this.elements.saveSupplierBtn.disabled = false;
      this.elements.saveSupplierBtn.innerHTML = '<i class="fas fa-save"></i> Save Supplier';
    }
  },

  // Instantly update supplier dropdowns
  updateSupplierDropdowns(id, name) {
    const supplierSelects = document.querySelectorAll('#supplierFilter, #supplier');
    supplierSelects.forEach(select => {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = name;
      select.appendChild(option);
    });
  },

  async handleDeleteConfirm() {
    if (!this.data.deleteInvoiceId) return;
    
    this.elements.confirmDelete.disabled = true;
    this.elements.confirmDelete.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
    this.showLoading();
    
    try {
        const response = await fetch('Delete_Invoice.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: this.data.deleteInvoiceId })
        });
        const data = await response.json();
        
        if (data.success) {
            this.hideLoading(); // Hide loading before showing alert
            this.showAlert('Invoice deleted successfully', 'success');
            this.closeDeleteDialog();
            this.fetchData();
        } else {
            this.hideLoading();
            this.showAlert(data.message || 'Error deleting', 'error');
        }
    } catch (error) {
        this.hideLoading();
        this.showAlert('Error deleting invoice', 'error');
    } finally {
        this.elements.confirmDelete.disabled = false;
        this.elements.confirmDelete.innerHTML = 'Delete Invoice';
    }
},

  // Ultra-fast edit function with caching
  async editInvoice(id) {
    this.data.editingInvoiceId = id;
    this.elements.modalTitle.innerHTML = '<i class="fas fa-edit"></i> Edit Invoice';
    
    this.elements.saveBtn.disabled = true;
    this.elements.saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    
    try {
      const response = await fetch(`get_invoice.php?id=${id}`);
      const data = await response.json();
      
      if (data.success) {
        const invoice = data.invoice;
        
        // Batch form population for speed
        this.populateForm(invoice);
        
        this.elements.invoiceModal.classList.add('visible');
      } else {
        this.showAlert('Error loading invoice', 'error');
      }
    } catch (error) {
      this.showAlert('Error loading invoice', 'error');
    } finally {
      this.elements.saveBtn.disabled = false;
      this.elements.saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Invoice';
    }
  },

  // Batch form population for maximum speed
  populateForm(invoice) {
    const fields = {
      'invoiceId': invoice.id,
      'invoiceNumber': invoice.invoice_number,
      'supplier': invoice.fournisseurs_id,
      'invoiceDate': invoice.date,
      'amount': invoice.amount,
      'description': invoice.description,
      'paymentDate': invoice.payment_date || '',
      'paymentMethod': invoice.payment_method || '',
      'paidAmount': invoice.paid_amount,
      'status': invoice.status,
      'chequeNumber': invoice.cheque_number || ''
    };

    // Batch update all fields
    Object.entries(fields).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.value = value;
    });

    // Handle PDF file display
    if (invoice.pdf_file) {
      this.elements.pdfFileName.textContent = invoice.pdf_file;
      this.elements.pdfFileName.style.display = 'block';
      this.elements.pdfUploadContainer.classList.add('has-file');
      this.elements.pdfUploadContainer.querySelector('.pdf-upload-text').textContent = 'PDF uploaded';
    }
  },

  deleteInvoice(id) {
    this.data.deleteInvoiceId = id;
    this.elements.deleteDialog.classList.add('visible');
  },

  downloadInvoice(id) {
    window.open(`download_invoice.php?id=${id}`, '_blank');
  },

  // Utility functions optimized for speed
  handlePdfFile(file) {
    if (file && file.type === 'application/pdf') {
      this.elements.pdfFileName.textContent = file.name;
      this.elements.pdfFileName.style.display = 'block';
      this.elements.pdfUploadContainer.classList.add('has-file');
      this.elements.pdfUploadContainer.querySelector('.pdf-upload-text').textContent = 'PDF uploaded';
    } else if (file) {
      this.showAlert('Please select a valid PDF file', 'error');
      this.elements.pdfFileInput.value = '';
      this.resetPdfUpload();
    }
  },

  resetPdfUpload() {
    this.elements.pdfFileInput.value = '';
    this.elements.pdfFileName.style.display = 'none';
    this.elements.pdfUploadContainer.classList.remove('has-file');
    this.elements.pdfUploadContainer.querySelector('.pdf-upload-text').textContent = 'Click to upload';
  },

  validateForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    return Array.from(requiredFields).every(field => field.value.trim());
  },

  clearFilters() {
    const currentYear = new Date().getFullYear().toString();
    this.elements.filterElements.forEach(element => {
      if (element.type === 'date' || element.type === 'text') {
        element.value = '';
      } else if (element.tagName === 'SELECT') {
        if (element.id === 'yearFilter') {
          const option = Array.from(element.options).find(opt => opt.value === currentYear);
          element.selectedIndex = option ? option.index : 0;
        } else {
          element.selectedIndex = 0;
        }
      }
    });
    this.elements.searchInput.value = '';
    this.elements.hiddenSearch.value = '';
    this.fetchData();
  },

  exportToExcel() {
    const params = new URLSearchParams(location.search);
    const exportUrl = params.toString() ? `export_invoices.php?${params}` : 'export_invoices.php';
    window.open(exportUrl, '_blank');
  },

  showLoading() {
    this.elements.loadingOverlay.classList.add('visible');
  },

  hideLoading() {
    this.elements.loadingOverlay.classList.remove('visible');
  },

  showAlert(message, type = 'success') {
    const alert = document.createElement('div');
    alert.className = `alert ${type}`;
    alert.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
      <span>${message}</span>
    `;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
      alert.classList.add('fadeOut');
      setTimeout(() => {
        if (document.body.contains(alert)) {
          document.body.removeChild(alert);
        }
      }, 100);
    }, 1000); // Reduced display time for faster UX
  },

  setupSidebar() {
    const menus = [
      {menu: "transportMenu", submenu: "transportSubmenu"},
      {menu: "payrollMenu", submenu: "payrollSubmenu"},
      {menu: "employeesMenu", submenu: "employeesSubmenu"}
    ];

    menus.forEach(({menu, submenu}) => {
      const menuEl = document.getElementById(menu);
      const submenuEl = document.getElementById(submenu);
      
      if (menuEl && submenuEl) {
        submenuEl.style.display = "none";
        menuEl.onclick = (e) => {
          e.preventDefault();
          const isOpen = submenuEl.style.display === "flex";
          submenuEl.style.display = isOpen ? "none" : "flex";
          submenuEl.classList.toggle("open", !isOpen);
          menuEl.classList.toggle("open", !isOpen);
          menuEl.classList.toggle("active", !isOpen);
        };
      }
    });
  }
};

// Global functions for onclick handlers (ultra-fast access)
window.editInvoice = (id) => app.editInvoice(id);
window.deleteInvoice = (id) => app.deleteInvoice(id);
window.downloadInvoice = (id) => app.downloadInvoice(id);

// Ultra-fast initialization with performance monitoring
document.addEventListener('DOMContentLoaded', () => {
  const startTime = performance.now();
  app.init();
  const endTime = performance.now();
  console.log(`App initialized in ${(endTime - startTime).toFixed(2)}ms`);
});

// Service Worker for caching (optional performance boost)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {
    // Silent fail - service worker is optional
  });
}



document.addEventListener('dragover', function(e) {
  e.preventDefault();
  e.stopPropagation();
});
document.addEventListener('drop', function(e) {
  // Prevent file from being opened in browser
  if (!e.target.closest('.pdf-upload-container')) {
    e.preventDefault();
    e.stopPropagation();
  }
});
</script>
</body>
</html>