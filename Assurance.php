<?php
// Start output buffering and set headers
header('Content-Type: text/html; charset=utf-8');

// Database connection
require_once '../config/database.php';

// Handle AJAX requests for assurés management
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    ob_clean();
    header('Content-Type: application/json');
    
    try {
        $action = $_POST['action'];
        
        switch ($action) {
            case 'get_claims':
                $stmt = $pdo->query("SELECT * FROM claims ORDER BY created_at DESC");
                $claims = $stmt->fetchAll();
                
                // Format data for frontend
                foreach ($claims as &$claim) {
                    $claim['id'] = (int)$claim['id'];
                    $claim['montant'] = (float)$claim['montant'];
                    $claim['montant_rembourse'] = (float)$claim['montant_rembourse'];
                    $claim['taux'] = (float)$claim['taux'];
                    $claim['documentsJoints'] = json_decode($claim['documents_joints'], true) ?: [];
                }
                
                echo json_encode(['success' => true, 'data' => $claims]);
                break;
                
            case 'get_assures':
                $stmt = $pdo->query("SELECT * FROM assures ORDER BY name ASC");
                $assures = $stmt->fetchAll();
                
                // Format data for frontend
                foreach ($assures as &$assure) {
                    $assure['id'] = (int)$assure['id'];
                    $assure['affiliation'] = (int)$assure['affiliation'];
                    $assure['beneficiaires'] = [
                        $assure['conjoint'] ?? '',
                        $assure['kid1'] ?? '',
                        $assure['kid2'] ?? '',
                        $assure['kid3'] ?? ''
                    ];
                }
                
                echo json_encode(['success' => true, 'data' => $assures]);
                break;
                
            case 'add_claim':
              $required = ['assure', 'dateDeclaration', 'dateDepot', 'type'];
              $specialTypes = ['Nv Adh', 'Adh rectificatif', 'Compliment'];
              $isSpecialType = in_array($_POST['type'] ?? '', $specialTypes);

              // For special types, allow empty dossier number and montant
              if (!$isSpecialType) {
                  $required[] = 'dossierNumber';
                  $required[] = 'montant';
              }

              foreach ($required as $field) {
                  if (empty($_POST[$field])) {
                      throw new Exception("Missing required field: $field");
                  }
              }

              $assure = trim($_POST['assure']);
              $beneficiaire = trim($_POST['beneficiaire'] ?? '');
              $societe = trim($_POST['societe'] ?? '');
              $dossierNumber = $isSpecialType && empty(trim($_POST['dossierNumber'] ?? '')) ? '-' : trim($_POST['dossierNumber'] ?? '');
              $dateDeclaration = $_POST['dateDeclaration'];
              $dateDepot = $_POST['dateDepot'];
              $montant = $isSpecialType && empty($_POST['montant']) ? 0 : floatval($_POST['montant'] ?? 0);
              $type = $_POST['type'];
              $dateRemboursement = $_POST['dateRemboursement'] ?? null;
              $montantRembourse = floatval($_POST['montantRembourse'] ?? 0);
              $documentsJoints = json_encode($_POST['documentsJoints'] ?? []);
                              
                // Handle dossier number for special types
                $dossierNumber = trim($_POST['dossierNumber'] ?? '');
                if ($isSpecialType && empty($dossierNumber)) {
                    // Generate unique dossier number for special types
                    $timestamp = time();
                    $randomSuffix = rand(100, 999);
                    $dossierNumber = strtoupper(substr($type, 0, 3)) . '_' . $timestamp . '_' . $randomSuffix;
                }
                
                // Handle montant for special types
                $montant = 0;
                if (!$isSpecialType) {
                    $montant = floatval($_POST['montant'] ?? 0);
                    if ($montant <= 0) {
                        throw new Exception("Montant must be greater than 0 for this type");
                    }
                } else {
                    // For special types, use provided montant or default to 0
                    $montant = floatval($_POST['montant'] ?? 0);
                }
                
                // Calculate taux and status
                $taux = ($montant > 0 && $montantRembourse > 0) ? ($montantRembourse / $montant) * 100 : 0;
                $status = $montantRembourse > 0 ? 'Rembourssé' : 'En Cours';
                
                $sql = "INSERT INTO claims (assure, beneficiaire, societe, dossier_number, date_declaration, date_depot, montant, type, date_remboursement, montant_rembourse, taux, status, documents_joints) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                $stmt = $pdo->prepare($sql);
                $result = $stmt->execute([$assure, $beneficiaire, $societe, $dossierNumber, $dateDeclaration, $dateDepot, $montant, $type, $dateRemboursement, $montantRembourse, $taux, $status, $documentsJoints]);
                
                if ($result) {
                    $newId = $pdo->lastInsertId();
                    echo json_encode(['success' => true, 'message' => 'Claim saved', 'id' => $newId]);
                } else {
                    throw new Exception('Failed to add claim');
                }
                break;
                
            case 'update_claim':
                $required = ['id', 'assure', 'dateDeclaration', 'dateDepot', 'type'];
                $specialTypes = ['Nv Adh', 'Adh rectificatif', 'Compliment'];
                $isSpecialType = in_array($_POST['type'] ?? '', $specialTypes);
                
                // For non-special types, require dossierNumber and montant
                if (!$isSpecialType) {
                    $required[] = 'dossierNumber';
                    $required[] = 'montant';
                }
                
                foreach ($required as $field) {
                    if (empty($_POST[$field])) {
                        throw new Exception("Missing required field: $field");
                    }
                }
                
                $id = intval($_POST['id']);
                $assure = trim($_POST['assure']);
                $beneficiaire = trim($_POST['beneficiaire'] ?? '');
                $societe = trim($_POST['societe'] ?? '');
                $dateDeclaration = $_POST['dateDeclaration'];
                $dateDepot = $_POST['dateDepot'];
                $type = $_POST['type'];
                $dateRemboursement = $_POST['dateRemboursement'] ?? null;
                $montantRembourse = floatval($_POST['montantRembourse'] ?? 0);
                $documentsJoints = json_encode($_POST['documentsJoints'] ?? []);
                
                // Handle dossier number for special types
                $dossierNumber = trim($_POST['dossierNumber'] ?? '');
                if ($isSpecialType && empty($dossierNumber)) {
                    // Keep existing dossier number or generate new one
                    $existingStmt = $pdo->prepare("SELECT dossier_number FROM claims WHERE id = ?");
                    $existingStmt->execute([$id]);
                    $existing = $existingStmt->fetch();
                    
                    if ($existing && !empty($existing['dossier_number'])) {
                        $dossierNumber = $existing['dossier_number'];
                    } else {
                        // Generate unique dossier number
                        $timestamp = time();
                        $randomSuffix = rand(100, 999);
                        $dossierNumber = strtoupper(substr($type, 0, 3)) . '_' . $timestamp . '_' . $randomSuffix;
                    }
                }
                
                // Handle montant for special types
                $montant = 0;
                if (!$isSpecialType) {
                    $montant = floatval($_POST['montant'] ?? 0);
                    if ($montant <= 0) {
                        throw new Exception("Montant must be greater than 0 for this type");
                    }
                } else {
                    // For special types, use provided montant or default to 0
                    $montant = floatval($_POST['montant'] ?? 0);
                }
                
                // Calculate taux and status
                $taux = ($montant > 0 && $montantRembourse > 0) ? ($montantRembourse / $montant) * 100 : 0;
                $status = $montantRembourse > 0 ? 'Rembourssé' : 'En Cours';
                
                $sql = "UPDATE claims SET assure=?, beneficiaire=?, societe=?, dossier_number=?, date_declaration=?, date_depot=?, montant=?, type=?, date_remboursement=?, montant_rembourse=?, taux=?, status=?, documents_joints=?, updated_at=NOW() WHERE id=?";
                $stmt = $pdo->prepare($sql);
                $result = $stmt->execute([$assure, $beneficiaire, $societe, $dossierNumber, $dateDeclaration, $dateDepot, $montant, $type, $dateRemboursement, $montantRembourse, $taux, $status, $documentsJoints, $id]);
                
                if ($result) {
                    echo json_encode(['success' => true, 'message' => 'Claim updated', 'id' => $id]);
                } else {
                    throw new Exception('Failed to update claim');
                }
                break;
                
case 'delete_claim':
    if (empty($_POST['id'])) {
        throw new Exception('Missing claim ID');
    }
    
    $id = intval($_POST['id']);
    
    // Check if claim exists first
    $checkStmt = $pdo->prepare("SELECT id FROM claims WHERE id = ?");
    $checkStmt->execute([$id]);
    if (!$checkStmt->fetch()) {
        throw new Exception('Claim not found');
    }
    
    // Delete the claim
    $stmt = $pdo->prepare("DELETE FROM claims WHERE id = ?");
    $result = $stmt->execute([$id]);
    
    if ($result && $stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'Claim deleted successfully']);
    } else {
        throw new Exception('Failed to delete claim - no rows affected');
    }
    break;
                
            case 'add_assure':
                $required = ['name', 'societe', 'gender'];
                foreach ($required as $field) {
                    if (empty($_POST[$field])) {
                        throw new Exception("Missing required field: $field");
                    }
                }
                
                $name = trim($_POST['name']);
                $societe = trim($_POST['societe']);
                $gender = $_POST['gender'];
                $affiliation = intval($_POST['affiliation']);
                $conjoint = trim($_POST['conjoint'] ?? '');
                $kid1 = trim($_POST['kid1'] ?? '');
                $kid2 = trim($_POST['kid2'] ?? '');
                $kid3 = trim($_POST['kid3'] ?? '');
                
                // Check if name already exists for this societe
                $checkStmt = $pdo->prepare("SELECT id FROM assures WHERE name = ? AND societe = ?");
                $checkStmt->execute([$name, $societe]);
                if ($checkStmt->fetch()) {
                    throw new Exception("Assuré already exists for this company");
                }
                
                $sql = "INSERT INTO assures (name, societe, gender, affiliation, conjoint, kid1, kid2, kid3) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
                $stmt = $pdo->prepare($sql);
                $result = $stmt->execute([$name, $societe, $gender, $affiliation, $conjoint, $kid1, $kid2, $kid3]);
                
                if ($result) {
                    echo json_encode(['success' => true, 'message' => 'Assuré added successfully', 'id' => $pdo->lastInsertId()]);
                } else {
                    throw new Exception('Failed to add assuré');
                }
                break;
                
     case 'update_assure':
    $required = ['id', 'name', 'societe', 'gender', 'affiliation'];
    foreach ($required as $field) {
        if (!isset($_POST[$field]) || $_POST[$field] === '') {
            throw new Exception("Missing required field: $field");
        }
    }

    $id = intval($_POST['id']);
    $name = trim($_POST['name']);
    $societe = trim($_POST['societe']);
    $gender = $_POST['gender'];
    $affiliation = intval($_POST['affiliation']);
    $conjoint = trim($_POST['conjoint'] ?? '');
    $kid1 = trim($_POST['kid1'] ?? '');
    $kid2 = trim($_POST['kid2'] ?? '');
    $kid3 = trim($_POST['kid3'] ?? '');

    // Check if exists
    $checkStmt = $pdo->prepare("SELECT name FROM assures WHERE id = ?");
    $checkStmt->execute([$id]);
    $currentData = $checkStmt->fetch();
    if (!$currentData) {
        throw new Exception("Assuré not found");
    }

    // Check name uniqueness if changed
    if ($currentData['name'] !== $name) {
        $uniqueStmt = $pdo->prepare("SELECT id FROM assures WHERE name = ? AND societe = ? AND id != ?");
        $uniqueStmt->execute([$name, $societe, $id]);
        if ($uniqueStmt->fetch()) {
            throw new Exception("Assuré name already exists for this company");
        }

        // Update related claims
        $updateClaimsStmt = $pdo->prepare("UPDATE claims SET assure = ? WHERE assure = ?");
        $updateClaimsStmt->execute([$name, $currentData['name']]);
    }

    $sql = "UPDATE assures SET name=?, societe=?, gender=?, affiliation=?, conjoint=?, kid1=?, kid2=?, kid3=?, updated_at=NOW() WHERE id=?";
    $stmt = $pdo->prepare($sql);
$result = $stmt->execute([$name, $societe, $gender, $affiliation, $conjoint, $kid1, $kid2, $kid3, $id]);

// Check for PDO error
if ($result === false) {
    error_log('PDO error info: ' . print_r($stmt->errorInfo(), true));
    throw new Exception('Failed to update assuré');
}

// Always treat a successful execute as success
echo json_encode(['success' => true, 'message' => 'Assuré updated successfully']);
                break;
                
            case 'delete_assure':
                if (empty($_POST['id'])) {
                    throw new Exception('Missing assuré ID');
                }
                
                $id = intval($_POST['id']);
                
                // Get assure name
                $stmt = $pdo->prepare("SELECT name FROM assures WHERE id = ?");
                $stmt->execute([$id]);
                $assure = $stmt->fetch();
                if (!$assure) {
                    throw new Exception('Assuré not found');
                }
                
                // Start transaction
                $pdo->beginTransaction();
                
                try {
                    // Delete related claims first
                    $deleteClaimsStmt = $pdo->prepare("DELETE FROM claims WHERE assure = ?");
                    $deleteClaimsStmt->execute([$assure['name']]);
                    
                    // Delete assure
                    $deleteAssureStmt = $pdo->prepare("DELETE FROM assures WHERE id = ?");
                    $deleteAssureStmt->execute([$id]);
                    
                    $pdo->commit();
                    echo json_encode(['success' => true, 'message' => 'Assuré and related claims deleted successfully']);
                } catch (Exception $e) {
                    $pdo->rollback();
                    throw $e;
                }
                break;
                
            default:
                throw new Exception('Invalid action');
        }
        
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

// Get initial data for page load
try {
    $claimsStmt = $pdo->query("SELECT * FROM claims ORDER BY date_declaration ASC");
    $initialClaims = $claimsStmt->fetchAll();
    
    $assuresStmt = $pdo->query("SELECT * FROM assures ORDER BY name ASC");
    $initialAssures = $assuresStmt->fetchAll();
    
    // Format data
    foreach ($initialClaims as &$claim) {
        $claim['id'] = (int)$claim['id'];
        $claim['montant'] = (float)$claim['montant'];
        $claim['montant_rembourse'] = (float)$claim['montant_rembourse'];
        $claim['taux'] = (float)$claim['taux'];
        $claim['documentsJoints'] = json_decode($claim['documents_joints'], true) ?: [];
    }
    
    foreach ($initialAssures as &$assure) {
        $assure['id'] = (int)$assure['id'];
        $assure['affiliation'] = (int)$assure['affiliation'];
        $assure['beneficiaires'] = [
            $assure['conjoint'] ?? '',
            $assure['kid1'] ?? '',
            $assure['kid2'] ?? '',
            $assure['kid3'] ?? ''
        ];
    }
    
} catch (Exception $e) {
    $initialClaims = [];
    $initialAssures = [];
}

ob_end_clean();
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta content="width=device-width, initial-scale=1" name="viewport" />
  <title>Assurance Management - GMS</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

  <style>
    :root {
      --primary-color: #3b82f6;
      --primary-hover: #2563eb;
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
      --sidebar-bg: #1e293b;
      --sidebar-text: #94a3b8;
      --sidebar-hover-bg: rgba(251, 191, 36, 0.05);
      --sidebar-hover-text: var(--secondary-color);
      --sidebar-active-bg: rgba(251, 191, 36, 0.15);
      --sidebar-active-text: var(--secondary-color);
      --sidebar-border-color: rgba(255, 255, 255, 0.1);
      --sidebar-section-label: #64748b;
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
      min-height: 100vh;
      height: 100%;
      position: fixed;
      left: 0;
      z-index: 50;
    }

    main {
      flex-grow: 1;
      padding-top: 90px !important;
      padding: 2rem;
      margin-left: 260px;
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

    .sidebar-submenu {
      display: none;
      flex-direction: column;
      gap: 0;
      padding-left: 0;
      margin-left: 0.75rem;
      margin-right: 0.5rem;
      border-left: 2px solid rgba(251, 191, 36, 0.2);
      margin-top: 0.5rem;
      margin-bottom: 0.5rem;
      overflow: hidden;
      transition: all 0.3s ease;
      max-width: calc(100% - 1.25rem);
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
      padding: 0.6rem 0.75rem 0.6rem 1.25rem;
      border-radius: var(--radius-md);
      position: relative;
      margin-bottom: 0.25rem;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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
      transform: translateX(2px);
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

    .sticky-header {
      position: fixed;
      top: 0;
      left: 260px;
      right: 0;
      z-index: 100;
      background: linear-gradient(135deg, #e0f2f7 0%, #f3f4f6 100%);
      padding: 1rem;
      border-bottom: 1px solid var(--border-light);
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      align-items: center;
      height: 80px;
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: nowrap !important;
      gap: 1.5rem;
      position: relative;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: nowrap !important;
    }

    .search-wrapper {
      position: relative;
      min-width: 200px;
      transition: var(--transition);
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
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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

    .btn-add-new {
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
      color: white;
      font-weight: 600;
      border-radius: var(--radius-xl);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      border: none;
      cursor: pointer;
      transition: var(--transition-fast);
      flex-shrink: 0;
      white-space: nowrap;
      padding: 0.75rem 1rem !important;
    }

    .btn-add-new:hover {
      background: linear-gradient(135deg, var(--primary-hover) 0%, #1d4ed8 100%);
      box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
      transform: translateY(-2px);
    }

    .btn-add-new:active {
      transform: translateY(0);
      transition: var(--transition-fast);
    }

    @media (max-width: 1024px) {
      .sticky-header {
        padding-top: 0.5rem;
        padding-bottom: 0.5rem;
      }
      
      .header-top {
        flex-direction: column;
        align-items: stretch;
        gap: 0.5rem !important;
      }
      
      .header-right {
        width: 100%;
        justify-content: space-between;
      }
      
      .search-wrapper {
        width: 100% !important;
      }
      
      .btn-add-new {
        font-size: 0.8rem !important;
        padding: 0.5rem 0.75rem !important;
      }
    }

    @media (max-width: 768px) {
      .sticky-header {
        left: 80px;
        padding-top: 0.5rem;
        padding-bottom: 0.5rem;
      }
      
      main {
        padding-top: 70px !important;
      }
    }

    @media (max-width: 480px) {
      .sticky-header {
        left: 0;
      }
    }

    .header-right {
      flex-wrap: wrap !important;
    }

    .dashboard-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .dashboard-card {
      background: linear-gradient(135deg, var(--bg-white) 0%, #fefeff 100%);
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
      background: linear-gradient(90deg, var(--primary-color) 0%, var(--secondary-color) 100%);
    }

    .dashboard-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }

    .dashboard-card.success::before {
      background: linear-gradient(90deg, var(--success-color) 0%, #34d399 100%);
    }

    .dashboard-card.warning::before {
      background: linear-gradient(90deg, var(--warning-color) 0%, #fbbf24 100%);
    }

    .dashboard-card.error::before {
      background: linear-gradient(90deg, var(--error-color) 0%, #f87171 100%);
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
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
    }

    .card-icon.success {
      background: linear-gradient(135deg, var(--success-color) 0%, var(--success-hover) 100%);
    }

    .card-icon.warning {
      background: linear-gradient(135deg, var(--warning-color) 0%, var(--warning-hover) 100%);
    }

    .card-icon.error {
      background: linear-gradient(135deg, var(--error-color) 0%, var(--error-hover) 100%);
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

    .filters-section {
      background: var(--bg-white);
      padding: 1rem;
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-md);
      margin-bottom: 1.5rem;
      border: 1px solid var(--border-light);
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

    .filter-select {
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

    .filter-select:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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

    .table-container {
      background: var(--bg-white);
      border-radius: var(--radius-2xl);
      box-shadow: var(--shadow-lg);
      overflow: hidden;
      border: 1px solid var(--border-light);
    }

    .table-wrapper {
      overflow-x: auto;
    }

    .invoice-table {
      width: 100%;
      border-collapse: collapse;
    }

    #assuranceClaimsTable th,
    #assuranceClaimsTable td {
      font-size: 0.72rem !important;
      padding: 0.35rem 0.5rem !important;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 120px;
      text-align: left;
    }

    .invoice-table th,
    .invoice-table td {
      font-size: 0.72rem !important;
      padding: 0.35rem 0.5rem !important;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 120px;
    }

    #assuranceClaimsTable th:nth-child(1),
    #assuranceClaimsTable td:nth-child(1) {
      width: 12%;
      max-width: 120px;
    }
    
    #assuranceClaimsTable th:nth-child(2),
    #assuranceClaimsTable td:nth-child(2) {
      width: 12%;
      max-width: 120px;
    }

    #assuranceClaimsTable th:nth-child(4),
    #assuranceClaimsTable td:nth-child(4) {
      width: 15%;
      max-width: 120px;
    }

    #assuranceClaimsTable th:nth-child(5),
    #assuranceClaimsTable td:nth-child(5) {
      width: 15%;
      max-width: 100px;
    }

    #assuranceClaimsTable th:nth-child(7),
    #assuranceClaimsTable td:nth-child(7) {
      width: 15%;
      max-width: 120px;
    }

    #assuranceClaimsTable th:nth-child(9),
    #assuranceClaimsTable td:nth-child(9) {
      width: 15%;
      max-width: 120px;
    }

    #assuranceClaimsTable th:nth-child(12),
    #assuranceClaimsTable td:nth-child(12) {
      text-align: center;
    }

    #assuranceClaimsTable td:nth-child(12) .status-badge {
      font-size: 0.6rem !important;
      padding: 0.2rem 0.5rem;
    }

    .invoice-table td {
      padding: 0.75rem 1.25rem;
      text-align: left;
      border-bottom: 1px solid var(--border-light);
      font-size: 0.875rem !important;
      white-space: nowrap;
    }

    .invoice-table th {
      padding: 0.75rem 1.25rem;
      text-align: Center;
      border-bottom: 1px solid var(--border-light);
      font-size: 0.875rem !important;
      white-space: nowrap;
    }

    .invoice-table tbody tr {
      transition: var(--transition-fast);
      cursor: pointer;
    }

    .invoice-table tbody tr:hover {
      background: var(--bg-gray-50);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    /* Ultra-fast row highlighting for added/edited items */
    .invoice-table tbody tr.last-added {
      background: linear-gradient(90deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%) !important;
      border-left: 4px solid var(--success-color);
      animation: instantHighlight 1.5s ease-in-out;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
    }

    @keyframes instantHighlight {
      0% {
        background: linear-gradient(90deg, rgba(16, 185, 129, 0.3) 0%, rgba(16, 185, 129, 0.15) 100%);
        transform: scale(1.005);
        box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
      }
      50% {
        background: linear-gradient(90deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%);
      }
      100% {
        background: linear-gradient(90deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%);
        transform: scale(1);
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
      }
    }

    /* Company-specific styling */
    .societe-gm-solution {
      color: #065f46 !important;
      background-color: rgba(16, 185, 129, 0.1) !important;
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-md);
      font-weight: 600;
    }

    .societe-data-grid {
      color: #1e40af !important;
      background-color: rgba(59, 130, 246, 0.1) !important;
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-md);
      font-weight: 600;
    }

    .societe-multivistas {
      color: #c2410c !important;
      background-color: rgba(251, 146, 60, 0.1) !important;
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-md);
      font-weight: 600;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.375rem 0.875rem;
      border-radius: var(--radius-full);
      font-weight: 700;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .status-rembourssé {
      background: rgba(16, 185, 129, 0.1);
      color: var(--success-color);
      border: 1px solid rgba(16, 185, 129, 0.2);
    }

    .status-encours {
      background: rgba(245, 158, 11, 0.1);
      color: var(--warning-color);
      border: 1px solid rgba(245, 158, 11, 0.2);
    }

    .status-rejeté {
      background: rgba(239, 68, 68, 0.1);
      color: var(--error-color);
      border: 1px solid rgba(239, 68, 68, 0.2);
    }

    .amount {
      font-weight: 700;
      color: var(--text-primary);
    }

    .amount.rembourssé {
      color: var(--success-color) !important;
    }

    .amount.rejeté {
      color: var(--error-color) !important;
    }

    .amount.encours {
      color: var(--warning-color) !important;
    }

    .assure-name {
      font-weight: 600;
      color: var(--primary-color);
    }

    .dossier-number {
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
      gap: 0.5rem;
    }

    .action-btn {
      width: 2.25rem;
      height: 2.25rem;
      border: none;
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: var(--transition-fast);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
    }

    .action-btn.edit {
      background: rgba(59, 130, 246, 0.1);
      color: var(--primary-color);
    }

    .action-btn.edit:hover {
      background: var(--primary-color);
      color: white;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
    }

    .action-btn.delete {
      background: rgba(239, 68, 68, 0.1);
      color: var(--error-color);
    }

    .action-btn.delete:hover {
      background: var(--error-color);
      color: white;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
    }

    .modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(12px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      opacity: 0;
      visibility: hidden;
      transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .modal.visible {
      opacity: 1;
      visibility: visible;
    }

    .modal-content {
      background: linear-gradient(120deg, #e0f2f7 0%, #f3f4f6 90%);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-2xl);
      width: 850px;
      max-width: 92vw;
      max-height: 92vh;
      min-height: 540px;
      overflow: visible;
      position: relative;
      border: 2.5px solid #a0dae2;
      padding: 0;
      display: flex;
      flex-direction: column;
      transform: scale(0.95) translateY(20px);
      transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .modal.visible .modal-content {
      transform: scale(1) translateY(0);
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.1rem 2.2rem 0.6rem 2.2rem;
      border-bottom: 2px solid #a0dae2;
      background: linear-gradient(90deg, #e0f2f7 0%, #b2e0e6 100%);
      border-radius: var(--radius-xl) var(--radius-xl) 0 0;
      position: relative;
    }

    .modal-title {
      font-size: 1.4rem;
      font-weight: 800;
      color: #2c5282;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0 auto;
    }

    .modal-close {
      position: absolute;
      top: 14px;
      right: 26px;
      background: #e0f2f7;
      border: 2px solid #a0dae2;
      width: 2.4rem;
      height: 2.4rem;
      border-radius: var(--radius-full);
      color: #2c5282;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
      transition: var(--transition-fast);
      z-index: 10;
    }

    .modal-close:hover {
      background: var(--error-color);
      color: white;
      border-color: var(--error-color);
      transform: rotate(90deg);
    }

    .modal-body {
      padding: 1.5rem 2.2rem;
      background: linear-gradient(120deg, #e0f2f7 0%, #f3f4f6 90%);
      max-height: none;
      overflow: visible;
      min-height: 120px;
      box-sizing: border-box;
    }

    .modal-footer {
      padding: 0.85rem 2.2rem;
      border-top: 2px solid #a0dae2;
      display: flex;
      justify-content: flex-end;
      gap: 1.2rem;
      background: linear-gradient(90deg, #e0f2f7 0%, #b2e0e6 100%);
      border-radius: 0 0 var(--radius-xl) var(--radius-xl);
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      align-items: start;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .form-group.full-width {
      grid-column: 1 / -1;
    }

    .form-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
    }

    .form-input,
    .form-select {
      padding: 0.75rem;
      border: 2px solid var(--border-light);
      border-radius: var(--radius-lg);
      font-size: 0.875rem;
      transition: var(--transition-fast);
      background: var(--bg-white);
      color: var(--text-primary);
      font-weight: 500;
    }

    .form-input:focus,
    .form-select:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-input.error,
    .form-select.error {
      border-color: var(--error-color);
      background: rgba(239, 68, 68, 0.05);
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }

    .section-header {
      color: var(--primary-hover);
      border-bottom: 2px solid #a0dae2;
      background: linear-gradient(90deg, #e0f2f7 0%, #b2e0e6 100%);
      padding-bottom: 0.2rem;
      margin-bottom: 0.8rem;
      margin-top: 0.8rem;
      border-radius: 0.5rem 0.5rem 0 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1rem;
      font-weight: 700;
      padding: 0.5rem 0.75rem;
    }

    .documents-section {
      margin-top: 1rem;
    }

    .document-selector {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .document-select {
      flex: 1;
      padding: 0.5rem 0.75rem;
      border: 2px solid var(--border-light);
      border-radius: var(--radius-lg);
      font-size: 0.875rem;
      background: var(--bg-white);
      color: var(--text-primary);
      font-weight: 500;
      transition: var(--transition-fast);
    }

    .document-select:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .add-document-btn {
      background: linear-gradient(135deg, var(--success-color) 0%, var(--success-hover) 100%);
      color: white;
      border: none;
      border-radius: var(--radius-lg);
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition-fast);
      display: flex;
      align-items: center;
      gap: 0.25rem;
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
    }

    .add-document-btn:hover {
      background: linear-gradient(135deg, var(--success-hover) 0%, #047857 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }

    .add-document-btn:disabled {
      background: var(--bg-gray-100);
      color: var(--text-muted);
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .selected-documents {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      min-height: 2rem;
      padding: 0.5rem;
      border: 2px dashed var(--border-light);
      border-radius: var(--radius-lg);
      background: rgba(59, 130, 246, 0.02);
      transition: var(--transition-fast);
    }

    .selected-documents.has-documents {
      border-color: var(--primary-color);
      background: rgba(59, 130, 246, 0.05);
    }

    .document-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
      color: white;
      padding: 0.375rem 0.75rem;
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 600;
      box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
      transition: var(--transition-fast);
      animation: slideIn 0.15s ease-out;
    }

    .document-tag:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
    }

    .document-tag .remove-btn {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      border-radius: var(--radius-full);
      width: 1.25rem;
      height: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 0.75rem;
      color: white;
      transition: var(--transition-fast);
    }

    .document-tag .remove-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.1);
    }

    .documents-placeholder {
      color: var(--text-muted);
      font-size: 0.875rem;
      font-style: italic;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      min-height: 1rem;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(-10px) scale(0.9);
      }
      to {
        opacity: 1;
        transform: translateX(0) scale(1);
      }
    }

    .btn-secondary {
      background: #e0f2f7;
      color: #2c5282;
      border: 2px solid #a0dae2;
      padding: 0.7rem 1.4rem;
      border-radius: var(--radius-lg);
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition-fast);
      font-size: 0.95rem;
    }

    .btn-secondary:hover {
      background: #a0dae2;
      color: white;
      border-color: #2c5282;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--success-color) 0%, var(--success-hover) 100%);
      color: white;
      border: none;
      padding: 0.7rem 1.4rem;
      border-radius: var(--radius-lg);
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition-fast);
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.95rem;
    }

    .btn-primary:hover {
      background: linear-gradient(135deg, var(--success-hover) 0%, #047857 100%);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      transform: translateY(-1px);
    }

    .btn-primary:disabled {
      background: var(--bg-gray-100);
      color: var(--text-muted);
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .delete-confirmation-dialog {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(15, 23, 42, 0.8);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 3000;
      opacity: 0;
      visibility: hidden;
      transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .delete-confirmation-dialog.visible {
      opacity: 1;
      visibility: visible;
    }

    .delete-confirmation-dialog .dialog-content {
      background: var(--bg-white);
      padding: 2.5rem;
      border-radius: var(--radius-2xl);
      box-shadow: var(--shadow-2xl);
      max-width: 450px;
      width: 90%;
      text-align: center;
      transform: scale(0.95) translateY(20px);
      transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .delete-confirmation-dialog.visible .dialog-content {
      transform: scale(1) translateY(0);
    }

    .delete-icon {
      width: 4rem;
      height: 4rem;
      background: rgba(239, 68, 68, 0.1);
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
      color: var(--error-color);
      font-size: 1.5rem;
    }

    .delete-confirmation-dialog h3 {
      margin-top: 0;
      color: var(--text-primary);
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 1rem;
    }

    .delete-confirmation-dialog p {
      margin-bottom: 2rem;
      color: var(--text-secondary);
      font-size: 0.875rem;
      line-height: 1.6;
    }

    .delete-confirmation-dialog .dialog-buttons {
      display: flex;
      justify-content: center;
      gap: 1rem;
    }

    .delete-confirmation-dialog button {
      padding: 0.75rem 1.5rem;
      border-radius: var(--radius-lg);
      cursor: pointer;
      font-weight: 600;
      transition: var(--transition-fast);
      border: 1px solid;
      font-size: 0.875rem;
    }

    .delete-confirmation-dialog .cancel-btn {
      background: var(--bg-white);
      color: var(--text-secondary);
      border-color: var(--border-light);
    }

    .delete-confirmation-dialog .cancel-btn:hover {
      background: var(--bg-gray-100);
      border-color: var(--border-gray-300);
    }

    .delete-confirmation-dialog .confirm-btn {
      background: var(--error-color);
      color: white;
      border-color: var(--error-color);
    }

    .delete-confirmation-dialog .confirm-btn:hover {
      background: var(--error-hover);
      border-color: var(--error-hover);
      transform: translateY(-1px);
    }

    .alert {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      border-radius: var(--radius-xl);
      font-weight: 600;
      font-size: 0.875rem;
      z-index: 4000;
      box-shadow: var(--shadow-xl);
      animation: slideInRight 0.2s ease forwards;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      max-width: 400px;
      border: 1px solid;
    }
    
    .alert.success {
      background: var(--success-color);
      color: white;
      border-color: var(--success-color);
    }
    
    .alert.error {
      background: var(--error-color);
      color: white;
      border-color: var(--error-color);
    }
    
    .alert.fadeOut {
      animation: slideOutRight 0.2s ease forwards;
    }

    .alert i {
      font-size: 1.25rem;
    }

    @keyframes slideInRight {
      from { opacity: 0; transform: translateX(100%); }
      to { opacity: 1; transform: translateX(0); }
    }
    
    @keyframes slideOutRight {
      from { opacity: 1; transform: translateX(0); }
      to { opacity: 0; transform: translateX(100%); }
    }

    #assureBeneficiairePanel {
      position: fixed;
      top: 0;
      right: 0;
      width: 0;
      height: 100vh;
      background: var(--bg-white);
      box-shadow: -4px 0 15px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      overflow-x: hidden;
      transition: width 0.3s ease-in-out;
      display: flex;
      flex-direction: column;
      padding: 0;
    }

    #assureBeneficiairePanel.visible {
      width: 700px;
    }

    #assureBeneficiairePanel .panel-header {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1.5rem;
      border-bottom: 1px solid var(--border-light);
      background: linear-gradient(90deg, #e0f2f7 0%, #b2e0e6 100%);
      border-radius: var(--radius-xl) 0 0 0;
    }

    #assureBeneficiairePanel .panel-header h3 {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary);
      width: 100%;
      text-align: center;
    }

    #assureBeneficiairePanel .panel-header .controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      gap: 0.5rem;
    }

    #assureBeneficiairePanel .panel-content {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;
    }

    #assureBeneficiairePanel .panel-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
    }

    #assureBeneficiairePanel .panel-table th,
    #assureBeneficiairePanel .panel-table td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid var(--border-light);
      font-size: 0.875rem;
    }

    #assureBeneficiairePanel .panel-table th {
      background: var(--bg-gray-50);
      font-weight: 700;
      color: var(--text-primary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    #assureBeneficiairePanel .panel-table tbody tr:hover {
      background: var(--bg-gray-50);
    }

    #assureBeneficiairePanel .panel-table .action-buttons-cell {
      justify-content: flex-end;
    }

    #rightEdgeTrigger {
      position: fixed;
      top: 0;
      right: 0;
      width: 20px;
      height: 100vh;
      z-index: 1001;
      cursor: pointer;
    }

    #assureBeneficiaireModal .compact-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      align-items: start;
    }

    #assureBeneficiaireModal .action-buttons {
      display: flex;
      justify-content: flex-end;
      align-items: flex-end;
      margin-top: auto;
    }

    #assureBeneficiaireModal .modal-footer {
      display: none;
    }

    #assureBeneficiaireModal .modal-content {
      min-height: auto;
      padding-bottom: 1.5rem;
    }

    #assureBeneficiaireModal .full-width-btn {
      width: 100%;
      padding: 0.75rem;
      justify-content: center;
    }

    #assureBeneficiaireModal .action-buttons {
      grid-column: span 1;
      display: flex;
    }

    #assureBeneficiaireModal .form-group {
      min-width: 0;
    }

    #assureBeneficiaireModal .form-input,
    #assureBeneficiaireModal .form-select,
    #assureBeneficiaireModal .full-width-btn {
      width: 100%;
      box-sizing: border-box;
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
      
      .nav-link span {
        display: none;
      }
      
      .nav-link {
        justify-content: center;
        padding: 0.75rem;
      }
      
      .section-label {
        font-size: 0;
        margin: 1rem 0;
        padding: 0;
        text-align: center;
      }
      
      main {
        max-width: calc(100vw - 80px);
        padding: 1.5rem;
      }
      
      .header-top {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
      }
      
      .header-right {
        width: 100%;
        justify-content: space-between;
      }
      
      .search-wrapper {
        width: 100%;
      }
      
      .filters-grid {
        grid-template-columns: 1fr;
      }

      .dashboard-cards {
        grid-template-columns: 1fr;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }
      
      .invoice-table th,
      .invoice-table td {
        padding: 0.75rem;
        font-size: 0.875rem;
      }

      .modal-content {
        width: 95vw;
        max-height: 90vh;
      }

      .modal-body {
        padding: 1.5rem;
      }

      #assureBeneficiairePanel.visible {
        width: 100%;
      }
      #rightEdgeTrigger {
        display: none;
      }
      #assureBeneficiairePanel .panel-header .controls {
        flex-direction: column;
        align-items: stretch;
      }
      #assureBeneficiairePanel .panel-header .search-wrapper {
        width: 100%;
      }
    }

    .dropdown-container {
      position: relative;
      display: inline-block;
    }

    .dropdown-menu {
      position: absolute;
      top: 100%;
      right: 0;
      background: var(--bg-white);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      z-index: 1000;
      min-width: 250px;
      max-height: 400px;
      overflow-y: auto;
      margin-top: 0.25rem;
    }

    .dropdown-item {
      padding: 0.75rem 1rem;
      cursor: pointer;
      border-bottom: 1px solid var(--border-light);
      transition: var(--transition-fast);
      display: block;
    }

    .dropdown-item:last-child {
      border-bottom: none;
    }

    .dropdown-item:hover {
      background: var(--bg-gray-50);
    }

    .dropdown-menu::-webkit-scrollbar {
      width: 6px;
    }

    .dropdown-menu::-webkit-scrollbar-track {
      background: var(--bg-gray-100);
      border-radius: 3px;
    }

    .dropdown-menu::-webkit-scrollbar-thumb {
      background: var(--border-gray-300);
      border-radius: 3px;
    }

    .dropdown-menu::-webkit-scrollbar-thumb:hover {
      background: var(--text-muted);
    }

    @media (max-width: 768px) {
      .dropdown-menu {
        right: 0;
        left: auto;
        min-width: 200px;
      }
      
      .header-right {
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      
      .dropdown-container {
        order: 2;
      }
    }

    .searchable-dropdown {
      position: relative;
      width: 100%;
    }

    .searchable-dropdown .form-input {
      padding-right: 2.5rem;
    }

    .searchable-dropdown .dropdown-arrow {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      pointer-events: none;
      transition: var(--transition-fast);
    }

    .searchable-dropdown.open .dropdown-arrow {
      transform: translateY(-50%) rotate(180deg);
    }

    .dropdown-results {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: var(--bg-white);
      border: 2px solid var(--border-light);
      border-top: none;
      border-radius: 0 0 var(--radius-lg) var(--radius-lg);
      max-height: 200px;
      overflow-y: auto;
      z-index: 1000;
      display: none;
      box-shadow: var(--shadow-lg);
    }

    .dropdown-results.visible {
      display: block;
    }

    .dropdown-result-item {
      padding: 0.75rem;
      cursor: pointer;
      border-bottom: 1px solid var(--border-light);
      transition: var(--transition-fast);
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .dropdown-result-item:last-child {
      border-bottom: none;
    }

    .dropdown-result-item:hover,
    .dropdown-result-item.highlighted {
      background: var(--bg-gray-50);
    }

    .dropdown-result-item.selected {
      background: rgba(59, 130, 246, 0.1);
      color: var(--primary-color);
      font-weight: 600;
    }

    .dropdown-result-name {
      font-weight: 600;
      color: var(--text-primary);
    }

    .dropdown-result-details {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .calculation-hint {
      position: absolute;
      right: 2.5rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.75rem;
      color: var(--success-color);
      font-weight: 600;
      opacity: 0;
      transition: var(--transition-fast);
      pointer-events: none;
    }

    .calculation-hint.visible {
      opacity: 1;
    }

    .montant-input-wrapper {
      position: relative;
    }

    /* Enhanced success feedback */
    .success-pulse {
      animation: successPulse 0.4s ease-in-out;
    }

    @keyframes successPulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.03); }
      100% { transform: scale(1); }
    }

    /* Instant save button states */
    .btn-instant-save {
      background: linear-gradient(135deg, var(--success-color) 0%, var(--success-hover) 100%);
      transition: all 0.1s ease;
    }

    .btn-instant-save:hover {
      background: linear-gradient(135deg, var(--success-hover) 0%, #047857 100%);
      transform: translateY(-1px);
    }

    .btn-instant-save:active {
      transform: scale(0.98);
      transition: transform 0.05s ease;
    }
  </style>
</head>
<body>
<div id="app">
  <!-- Sidebar -->
  <aside class="sidebar" aria-label="Sidebar Navigation">
    <div class="sidebar-content">
      <h1 class="sidebar-title">
        <i class="fas fa-users-cog"></i> 
        <span>HR Dashboard</span>
      </h1>
      
      <nav class="sidebar-nav" aria-label="Main Navigation">
        <!-- Dashboard -->
        <a href="../dashboard.php" class="nav-link">
          <i class="fas fa-th-large"></i>
          <span>Dashboard</span>
        </a>
        
        <!-- Planification Section -->
        <p class="section-label">Planification</p>
        
        <!-- Transport with Dropdown -->
        <a href="#" class="nav-link" id="transportMenu">
          <i class="fas fa-truck"></i>
          <span>Transport</span>
          <span class="arrow-icon">
            <i class="fas fa-chevron-down"></i>
          </span>
        </a>
        <div class="sidebar-submenu" id="transportSubmenu">
          <a href="../Transport/Transport.php" class="submenu-link">
            <i class="fas fa-shuttle-van"></i>
            <span>Trajet</span>
          </a>
          <a href="../Transport/Export_Trajet.php" class="submenu-link">
            <i class="fas fa-shuttle-van"></i>
            <span>Export_Trajet</span>
          </a>
        </div>
        
        <!-- Calendar -->
        <a href="../Task/Tasks.php" class="nav-link">
          <i class="fas fa-calendar-alt"></i>
          <span>Calendar</span>
        </a>
        
        <!-- Assurance -->
        <a href="#" class="nav-link active">
          <i class="fas fa-shield-alt"></i>
          <span>Assurance</span>
        </a>
        
        <!-- Stock -->
        <a href="../Stock/Stock.php" id="stockNoIconTab" class="nav-link">
          <i class="fas fa-box"></i>
          <span>Stock</span>
        </a>
        
        <!-- Business Units Section -->
        <p class="section-label">Business Units</p>
        
        <!-- Employees with Dropdown -->
        <a href="#" class="nav-link" id="employeesMenu">
          <i class="fas fa-users"></i>
          <span>Employees</span>
          <span class="arrow-icon">
            <i class="fas fa-chevron-down"></i>
          </span>
        </a>
        <div class="sidebar-submenu" id="employeesSubmenu">
          <a href="../GMS/Employees.php" class="submenu-link">
            <i class="fas fa-user-check"></i>
            <span>En Cours</span>
          </a>
          <a href="../GMS/Employees_Sortie.php" class="submenu-link">
            <i class="fas fa-user-times"></i>
            <span>Sorties</span>
          </a>
        </div>

        <!-- Payroll with Dropdown -->
        <a href="#" class="nav-link" id="payrollMenu">
          <i class="fas fa-money-check-alt"></i>
          <span>Paie</span>
          <span class="arrow-icon">
            <i class="fas fa-chevron-down"></i>
          </span>
        </a>
        <div class="sidebar-submenu" id="payrollSubmenu">
          <a href="../GMS/payroll_active.php" class="submenu-link">
            <i class="fas fa-toggle-on"></i>
            <span>Active</span>
          </a>
          <a href="../GMS/payroll_inactive.php" class="submenu-link">
            <i class="fas fa-toggle-off"></i>
            <span>Inactive</span>
          </a>
        </div>
        
        <!-- Recruitment Section -->
        <p class="section-label">Recruitment</p>
        
        <!-- Candidates -->
        <a href="#" class="nav-link">
          <i class="fas fa-user-friends"></i>
          <span>Candidates</span>
        </a>
        
        <!-- Documents Check -->
        <a href="#" class="nav-link">
          <i class="fas fa-file-alt"></i>
          <span>Documents Check</span>
        </a>
        
        <!-- Finance Management Section -->
        <p class="section-label">Finance Management</p>
        
        <!-- Invoices -->
        <a href="../GMS/Factures/Facture.php" class="nav-link">
          <i class="fas fa-file-invoice"></i>
          <span>Invoices</span>
        </a>
      </nav>
    </div>
  </aside>

  <!-- Main content -->
  <main>
    <div class="sticky-header">
      <div class="header-top flex justify-between items-center mb-6 flex-wrap gap-1.5 relative">
        <div class="flex-1 flex justify-center">
          <h1 class="text-2xl font-extrabold text-center w-full whitespace-nowrap" style="color: var(--text-primary); letter-spacing: -0.025em;">
            Assurance Claims Management
          </h1>
        </div>
        <div class="header-right flex items-center gap-1">
          <div class="search-wrapper">
            <input
              type="search"
              placeholder="Search claims..."
              aria-label="Search claims"
              id="searchInput"
              autocomplete="off"
            />
            <i class="fas fa-search"></i>
          </div>
          <button id="addClaimButton" class="btn-add-new">
            <i class="fas fa-plus"></i>
            Add New Claim
          </button>
          <div class="dropdown-container" style="position: relative;">
            <button id="downloadAccuseBtn" class="btn-add-new" style="background: linear-gradient(135deg, var(--secondary-color) 0%, var(--secondary-hover) 100%);">
              <i class="fas fa-download"></i>
              Download Accusé
              <i class="fas fa-chevron-down" style="margin-left: 0.5rem;"></i>
            </button>
            <div id="downloadAccuseDropdown" class="dropdown-menu" style="display: none; position: absolute; top: 100%; right: 0; background: white; border: 1px solid var(--border-light); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); z-index: 1000; min-width: 200px; max-height: 300px; overflow-y: auto;">
              <!-- Dropdown items will be populated by JavaScript -->
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Dashboard Cards -->
    <div class="dashboard-cards">
      <div class="dashboard-card">
        <div class="card-header">
          <div class="card-title">Total Claims</div>
          <div class="card-icon primary">
            <i class="fas fa-file-invoice"></i>
          </div>
        </div>
        <div class="card-value" id="totalClaimsCount">0</div>
        <div class="card-label">Total claims count</div>
        <div class="card-trend neutral">
          <i class="fas fa-equals"></i>
          <span>All claims</span>
        </div>
      </div>

      <div class="dashboard-card success">
        <div class="card-header">
          <div class="card-title">Reimbursed Claims</div>
          <div class="card-icon success">
            <i class="fas fa-check-circle"></i>
          </div>
        </div>
        <div class="card-value" id="reimbursedClaimsCount">0</div>
        <div class="card-label">Fully reimbursed claims</div>
        <div class="card-trend positive">
          <i class="fas fa-arrow-up"></i>
          <span id="reimbursedAmount">0.00 DH</span>
        </div>
      </div>

      <div class="dashboard-card warning">
        <div class="card-header">
          <div class="card-title">Pending Claims</div>
          <div class="card-icon warning">
            <i class="fas fa-clock"></i>
          </div>
        </div>
        <div class="card-value" id="pendingClaimsCount">0</div>
        <div class="card-label">Claims in progress</div>
        <div class="card-trend neutral">
          <i class="fas fa-minus"></i>
          <span id="pendingAmount">0.00 DH</span>
        </div>
      </div>

      <div class="dashboard-card error">
        <div class="card-header">
          <div class="card-title">Rejected Claims</div>
          <div class="card-icon error">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
        </div>
        <div class="card-value" id="rejectedClaimsCount">0</div>
        <div class="card-label">Claims not approved</div>
        <div class="card-trend negative">
          <i class="fas fa-arrow-down"></i>
          <span id="rejectedAmount">0.00 DH</span>
        </div>
      </div>
    </div>

    <!-- Filters Section -->
    <div class="filters-section">
      <form id="filterForm">
        <div class="filters-grid">
          <div class="filter-group">
            <label class="filter-label">Assuré</label>
            <select class="filter-select" name="assure" id="assureFilter">
              <option value="">All Assurés</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label class="filter-label">Type</label>
            <select class="filter-select" name="type" id="typeFilter">
              <option value="">All Types</option>
              <option value="Medical">Medical</option>
              <option value="Dentaire">Dentaire</option>
              <option value="Optique">Optique</option>
              <option value="Devis Dentaire">Devis Dentaire</option>
              <option value="Devis Medical">Devis Medical</option>
              <option value="Prime Naissance">Prime Naissance</option>
              <option value="Nv Adh">Nv Adh</option>
              <option value="Adh rectificatif">Adh rectificatif</option>
              <option value="Compliment">Compliment</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label class="filter-label">Status</label>
            <select class="filter-select" name="status" id="statusFilter">
              <option value="">All Status</option>
              <option value="En Cours">En Cours</option>
              <option value="Rembourssé">Rembourssé</option>
              <option value="Rejeté">Rejeté</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label class="filter-label">Year</label>
            <select class="filter-select" name="year" id="yearFilter">
              <option value="">All Years</option>
            </select>
          </div>
          
          <div class="filter-group">
            <button type="button" class="clear-filters-btn" id="clearFilters">
              <i class="fas fa-times"></i>
              Clear
            </button>
          </div>
        </div>
      </form>
    </div>

    <!-- Assurance Claims Table -->
    <div class="table-container">
      <div class="table-wrapper">
        <table class="invoice-table" id="assuranceClaimsTable">
          <thead>
            <tr>
              <th>Assuré</th>
              <th>Bénéficiaire</th>
              <th>N° dossier</th>
              <th>D.Déclaration</th>
              <th>D.Dépôt</th>
              <th>Montant</th>
              <th>Type</th>
              <th>Société</th>
              <th>D.Remboursement</th>
              <th>M.Remboursé</th>
              <th>Taux</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="assuranceTableBody">
            <!-- Claims will be rendered here by JavaScript -->
          </tbody>
        </table>
      </div>
    </div>
  </main>
</div>

<!-- Add/Edit Assurance Claim Modal -->
<div class="modal" id="assuranceClaimModal">
  <div class="modal-content">
    <div class="modal-header">
      <h2 class="modal-title" id="claimModalTitle">
        <i class="fas fa-plus-circle"></i>
        Add New Claim
      </h2>
      <button class="modal-close" id="claimModalClose">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="modal-body">
      <form id="claimForm">
        <input type="hidden" id="claimId" name="claimId">
        
        <!-- Claim Information Section 1 -->
        <div class="section-header">
          <i class="fas fa-file-invoice"></i>
          Claim Details
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Assuré *</label>
            <div class="searchable-dropdown" id="assureSearchableDropdown">
              <input type="text" class="form-input" id="assureSearchInput" name="assure" placeholder="Search or select Assuré..." autocomplete="off" required>
              <div class="dropdown-results" id="assureDropdownResults"></div>
              <i class="fas fa-chevron-down dropdown-arrow"></i>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Bénéficiaire</label>
            <select class="form-select" id="beneficiaireSelect" name="beneficiaire">
              <option value="">Select Bénéficiaire</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Société</label>
            <input type="text" class="form-input" id="societe" name="societe" readonly>
          </div>
          
          <div class="form-group">
            <label class="form-label">N° Affiliation</label>
            <input type="number" class="form-input" id="affiliation" name="affiliation" readonly>
          </div>
          
          <div class="form-group">
            <label class="form-label">N° dossier</label>
            <input type="text" class="form-input" id="dossierNumber" name="dossierNumber" placeholder="-">
          </div>
          
          <div class="form-group">
            <label class="form-label">Date Déclaration *</label>
            <input type="date" class="form-input" id="dateDeclaration" name="dateDeclaration" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">Date Dépôt *</label>
            <input type="date" class="form-input" id="dateDepot" name="dateDepot" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">Montant (DH)</label>
            <div class="montant-input-wrapper">
              <input 
                type="text" 
                class="form-input" 
                id="montant" 
                name="montant" 
                pattern="[0-9.]*" 
                inputmode="decimal"
                placeholder="-"
              >
              <div class="calculation-hint" id="calculationHint"></div>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Type *</label>
            <select class="form-select" id="type" name="type" required>
              <option value="">Select Type</option>
              <option value="Medical">Medical</option>
              <option value="Dentaire">Dentaire</option>
              <option value="Optique">Optique</option>
              <option value="Devis Dentaire">Devis Dentaire</option>
              <option value="Devis Medical">Devis Medical</option>
              <option value="Prime Naissance">Prime Naissance</option>
              <option value="Nv Adh">Nv Adh</option>
              <option value="Adh rectificatif">Adh rectificatif</option>
              <option value="Compliment">Compliment</option>
            </select>
          </div>

          <!-- Documents joints section -->
          <div class="form-group full-width">
            <div class="section-header">
              <i class="fas fa-paperclip"></i>
              Documents joints
            </div>
            <div class="documents-section">
              <div class="document-selector">
                <select class="document-select" id="documentSelect">
                  <option value="">Select Document Type</option>
<option value="Ordonnance">Ordonnance</option>
<option value="Medicaments">Médicaments</option>
<option value="Echographie">Echographie</option>
<option value="Facture">Facture</option>
<option value="Analyse">Analyse</option>
<option value="Facture d'analyse">Facture d'analyse</option>
<option value="Radiologie">Radiologie</option>
<option value="Facture Radiologie">Facture Radiologie</option>
<option value="Dossier Clinique">Dossier Clinique</option>
<option value="Devis">Devis</option>
                </select>
                <button type="button" class="add-document-btn" id="addDocumentBtn">
                  <i class="fas fa-plus"></i>
                  Add
                </button>
              </div>
              <div class="selected-documents" id="selectedDocuments">
                <div class="documents-placeholder">No documents selected</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Claim Information Section 2 -->
        <div class="section-header">
          <i class="fas fa-credit-card"></i>
          Payment & Status
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Date Remboursement</label>
            <input type="date" class="form-input" id="dateRemboursement" name="dateRemboursement">
          </div>
          
          <div class="form-group">
            <label class="form-label">Montant remboursé (DH)</label>
            <input type="number" class="form-input" id="montantRembourse" name="montantRembourse" step="0.01">
          </div>
          
          <!-- Save button aligned with inputs -->
          <div class="form-group" style="align-self: flex-end;">
            <button class="btn-primary btn-instant-save" id="saveClaimBtn" type="button">
  <i class="fas fa-bolt"></i> Save
</button>

          </div>
        </div>
      </form>
    </div>
    <!-- Modal footer removed -->
  </div>
</div>

<!-- Delete Confirmation Dialog -->
<div class="delete-confirmation-dialog" id="deleteClaimDialog">
  <div class="dialog-content">
    <div class="delete-icon">
      <i class="fas fa-trash-alt"></i>
    </div>
    <h3>Delete Claim</h3>
    <p>Are you sure you want to delete this claim? This action cannot be undone and will permanently remove the claim.</p>
    <div class="dialog-buttons">
      <button class="cancel-btn" id="cancelDeleteClaim">Cancel</button>
      <button class="confirm-btn" id="confirmDeleteClaim">Delete Claim</button>
    </div>
  </div>
</div>

<!-- Assuré/Bénéficiaire Side Panel -->
<div id="rightEdgeTrigger"></div>
<div id="assureBeneficiairePanel">
  <div class="panel-header">
    <h3>Assurés & Bénéficiaires</h3>
    <div class="controls">
      <div class="search-wrapper" style="width: auto; flex-grow: 1;">
        <input 
          type="search"
          placeholder="Search assurés..."
          aria-label="Search assurés"
          id="assurePanelSearchInput" 
          autocomplete="off"
        />
        <i class="fas fa-search"></i>
      </div>
      <button class="btn-add-new" id="addAssureButton" style="background: var(--secondary-color); color: white; padding: 0.5rem 1rem; border-radius: var(--radius-md);">
        <i class="fas fa-plus"></i> Add Assuré
      </button>
    </div>
  </div>
  <div class="panel-content">
    <div class="table-wrapper">
      <table class="panel-table">
        <thead>
          <tr>
            <th>Assuré</th>
            <th>Société</th>
            <th>Gender</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="assureBeneficiaireTableBody">
          <!-- Assurés will be rendered here by JavaScript -->
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- Add/Edit Assuré/Bénéficiaire Modal -->
<div class="modal" id="assureBeneficiaireModal">
  <div class="modal-content">
    <div class="modal-header">
      <h2 class="modal-title" id="assureBeneficiaireModalTitle">
        <i class="fas fa-user-plus"></i>
        Add New Assuré
      </h2>
      <button class="modal-close" id="assureBeneficiaireModalClose">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="modal-body">
      <form id="assureBeneficiaireForm">
        <input type="hidden" id="assureId" name="assureId">
        <div class="form-grid compact-grid">
          <!-- First Row - 3 columns -->
          <div class="form-group">
            <label class="form-label">Assuré Name *</label>
            <input type="text" class="form-input" id="assureName" name="assureName" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">Société *</label>
            <select class="form-select" id="assureSocieteSelect" name="assureSociete" required>
              <option value="">Select Société</option>
              <option value="GM SOLUTION">GM SOLUTION</option>
              <option value="DATA GRID">DATA GRID</option>
              <option value="MULTIVISTAS">MULTIVISTAS</option>
              <option value="GREEN PATH">GREEN PATH</option>
              <option value="HUB SIGNAL">HUB SIGNAL</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Gender *</label>
            <select class="form-select" id="assureGenderSelect" name="assureGender" required>
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          
          <!-- Second Row - 3 columns -->
          <div class="form-group">
            <label class="form-label">N° Affiliation *</label>
            <input type="number" class="form-input" name="affiliation" id="affiliationInput" placeholder="N° Affiliation">
          </div>

          <div class="form-group">
            <label class="form-label">Conjoint(e)</label>
            <input type="text" class="form-input" name="conjoint" id="conjointInput" placeholder="Conjoint(e)">
          </div>

          <div class="form-group">
            <label class="form-label">Kid 1</label>
            <input type="text" class="form-input" name="kid1" id="kid1Input" placeholder="Kid 1">
          </div>

          <div class="form-group">
            <label class="form-label">Kid 2</label>
            <input type="text" class="form-input" name="kid2" id="kid2Input" placeholder="Kid 2">
          </div>

          <div class="form-group">
            <label class="form-label">Kid 3</label>
            <input type="text" class="form-input" name="kid3" id="kid3Input" placeholder="Kid 3">
          </div>
          
          <div class="form-group action-buttons">
            <button class="btn-primary full-width-btn" id="saveAssureBeneficiaireBtn" type="button">
              <i class="fas fa-save"></i> Save
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</div>

<!-- Delete Assuré Confirmation Dialog -->
<div class="delete-confirmation-dialog" id="deleteAssureDialog">
  <div class="dialog-content">
    <div class="delete-icon">
      <i class="fas fa-trash-alt"></i>
    </div>
    <h3>Delete Assuré</h3>
    <p>Are you sure you want to delete this Assuré and all associated Bénéficiaires? This action cannot be undone.</p>
    <div class="dialog-buttons">
      <button class="cancel-btn" id="cancelDeleteAssure">Cancel</button>
      <button class="confirm-btn" id="confirmDeleteAssure">Delete Assuré</button>
    </div>
  </div>
</div>

<script>

  const docMap = {
  "Prescription": "Ordonnance",
  "Invoice": "Facture",
  "Medicaments": "Médicaments",
  "X-Ray": "Radiologie",
  "Report": "Rapport",
  "Receipt": "Facture",
  "Medical Certificate": "Certificat médical",
  "Lab Results": "Résultats de laboratoire",
  "Analyse": "Analyse", // same in both
  "Devis": "Devis", // same in both
  "Echographie": "Echographie", // new French value
  "Facture d'analyse": "Facture d'analyse",
  "Facture Radiologie": "Facture Radiologie"
  // add all needed keys!
};
  // Initialize data from PHP
  let assuranceClaimsData = <?php echo json_encode($initialClaims, JSON_UNESCAPED_UNICODE); ?>;
  let assureBeneficiaireData = <?php echo json_encode($initialAssures, JSON_UNESCAPED_UNICODE); ?>;

  let editingClaimId = null;
  let deleteClaimId = null;
  let editingAssureId = null;
  let deleteAssureId = null;
  let selectedDocuments = [];
  let isSubmitting = false;
  let lastAddedClaimId = null;

  // DOM Elements
  const elements = {
    addClaimButton: document.getElementById('addClaimButton'),
    assuranceClaimModal: document.getElementById('assuranceClaimModal'),
    claimModalClose: document.getElementById('claimModalClose'),
    saveClaimBtn: document.getElementById('saveClaimBtn'),
    claimForm: document.getElementById('claimForm'),
    claimModalTitle: document.getElementById('claimModalTitle'),
    assuranceTableBody: document.getElementById('assuranceTableBody'),
    assureSearchInput: document.getElementById('assureSearchInput'),
    beneficiaireSelect: document.getElementById('beneficiaireSelect'),
    societeInput: document.getElementById('societe'),
    affiliationInput: document.getElementById('affiliation'),
    dossierNumberInput: document.getElementById('dossierNumber'),
    dateDeclarationInput: document.getElementById('dateDeclaration'),
    dateDepotInput: document.getElementById('dateDepot'),
    montantInput: document.getElementById('montant'),
    typeSelect: document.getElementById('type'),
    dateRemboursementInput: document.getElementById('dateRemboursement'),
    montantRembourseInput: document.getElementById('montantRembourse'),
    documentSelect: document.getElementById('documentSelect'),
    addDocumentBtn: document.getElementById('addDocumentBtn'),
    selectedDocumentsContainer: document.getElementById('selectedDocuments'),
    searchInput: document.getElementById('searchInput'),
    assureFilter: document.getElementById('assureFilter'),
    typeFilter: document.getElementById('typeFilter'),
    statusFilter: document.getElementById('statusFilter'),
    yearFilter: document.getElementById('yearFilter'),
    clearFiltersBtn: document.getElementById('clearFilters')
  };

  // Utility functions
function showAlert(message, type = 'success') {
  document.querySelectorAll('.alert').forEach(alert => alert.remove());
  
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
      if (document.body.contains(alert)) document.body.removeChild(alert); 
    }, 300);
  }, 2000); // Reduced from 3000 to 2000
}
  function validateForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    requiredFields.forEach(field => {
      field.classList.remove('error');
      if (!field.value.trim()) {
        field.classList.add('error');
        isValid = false;
      }
    });
    return isValid;
  }

  function clearValidationErrors(form) {
    form.querySelectorAll('.error').forEach(field => field.classList.remove('error'));
  }

  function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    // Check for invalid date
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-GB');
  }

  function debounce(func, delay) {
    let timeout;
    return function(...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), delay);
    };
  }

  // Ultra-fast request handling - NO LOADING STATES
  async function makeRequest(url, data = {}) {
    try {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        const value = data[key];
        if (value === null || value === undefined) {
          formData.append(key, '');
        } else if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      });

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error (${response.status}): ${errorText.substring(0, 200)}`);
      }

      const responseText = await response.text();
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Response text:', responseText);
        throw new Error('Server returned invalid JSON response');
      }
      
      return result;
      
    } catch (error) {
      console.error('Request error:', error);
      return { 
        success: false, 
        message: error.message || 'Request failed. Please check your connection.'
      };
    }
  }

async function makeRequest(url, data = {}) {
  try {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      const value = data[key];
      if (value === null || value === undefined) {
        formData.append(key, '');
      } else if (Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value.toString());
      }
    });

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
'X-Requested-With': 'XMLHttpRequest'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error (${response.status}): ${errorText.substring(0, 200)}`);
    }

    const responseText = await response.text();
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Response text:', responseText);
      throw new Error('Server returned invalid JSON response');
    }
    
    return result;
    
  } catch (error) {
    console.error('Request error:', error);
    return { 
      success: false, 
      message: error.message || 'Request failed. Please check your connection.'
    };
  }
}
  // ULTRA-FAST save claim function - NO LOADING, INSTANT FEEDBACK
  async function saveAssuranceClaimInstant() {
  if (isSubmitting) return;

  const typeValue = elements.typeSelect.value;
  const specialTypes = ['Nv Adh', 'Adh rectificatif', 'Compliment'];
  const isSpecialType = specialTypes.includes(typeValue);

  if (!validateForm(elements.claimForm)) {
    showAlert('Please fill in all required fields', 'error');
    return;
  }

  // For special types, use "-" for empty dossier number and 0 for empty montant
  let montant = 0;
  let dossierNumber = '';

  if (isSpecialType) {
    dossierNumber = elements.dossierNumberInput.value.trim() || '-';
    const montantValue = elements.montantInput.value.trim();
    montant = montantValue ? parseFloat(montantValue) : 0;
    if (montantValue && (isNaN(montant) || montant < 0)) {
      showAlert('Please enter a valid amount', 'error');
      elements.montantInput.classList.add('error');
      return;
    }
  } else {
    dossierNumber = elements.dossierNumberInput.value.trim();
    if (!dossierNumber) {
      showAlert('N° dossier is required', 'error');
      elements.dossierNumberInput.classList.add('error');
      return;
    }
    montant = parseFloat(elements.montantInput.value);
    if (isNaN(montant) || montant <= 0) {
      showAlert('Please enter a valid amount', 'error');
      elements.montantInput.classList.add('error');
      return;
    }
  }

  const montantRembourse = parseFloat(elements.montantRembourseInput.value || 0);

  if (montantRembourse < 0) {
    showAlert('Reimbursed amount cannot be negative', 'error');
    elements.montantRembourseInput.classList.add('error');
    return;
  }

  if (montant > 0 && montantRembourse > montant) {
    showAlert('Reimbursed amount cannot exceed the claim amount', 'error');
    elements.montantRembourseInput.classList.add('error');
    return;
  }

  // ---- PATCH: BENEFICIAIRE DEFAULTING ----
  let beneficiaire = elements.beneficiaireSelect.value.trim();
  if (!beneficiaire) {
    // Find selected assuré from assureBeneficiaireData
    const assureName = elements.assureSearchInput.value.trim();
    const assure = assureBeneficiaireData.find(a => a.name === assureName);
    if (assure) {
      beneficiaire = assure.gender === 'Male' ? 'Lui même' : 'Elle même';
    }
  }
  // ----------------------------------------

  isSubmitting = true;

  elements.saveClaimBtn.innerHTML = '<i class="fas fa-bolt"></i>Save';
  elements.saveClaimBtn.style.background = 'linear-gradient(135deg, var(--success-color) 0%, var(--success-hover) 100%)';

  try {
    const claimData = {
      assure: elements.assureSearchInput.value.trim(),
      beneficiaire: beneficiaire, // <--- always set (not empty)
      societe: elements.societeInput.value.trim(),
      dossierNumber: dossierNumber,
      dateDeclaration: elements.dateDeclarationInput.value,
      dateDepot: elements.dateDepotInput.value,
      montant: montant,
      type: typeValue,
      documentsJoints: selectedDocuments,
      dateRemboursement: elements.dateRemboursementInput.value || null,
      montantRembourse: montantRembourse
    };

    const isEditing = editingClaimId !== null;
    const action = isEditing ? 'update_claim' : 'add_claim';

    if (isEditing) {
      claimData.id = editingClaimId;
    }

    claimData.action = action;

    const result = await makeRequest('Assurance.php', claimData);

    if (result.success) {
      elements.saveClaimBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
      elements.saveClaimBtn.classList.add('success-pulse');

      showAlert(result.message, 'success');

      if (result.id) {
        lastAddedClaimId = result.id;
      } else if (isEditing) {
        lastAddedClaimId = editingClaimId;
      }

      closeClaimModal();

      const claimsResult = await makeRequest('Assurance.php', { action: 'get_claims' });
      if (claimsResult.success) {
        assuranceClaimsData = claimsResult.data;
        renderAssuranceClaimsTable();
        if (lastAddedClaimId) {
          setTimeout(() => {
            const targetRow = document.querySelector(`tr[data-claim-id="${lastAddedClaimId}"]`);
            if (targetRow) {
              targetRow.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
              });
              targetRow.classList.add('success-pulse');
              setTimeout(() => {
                targetRow.classList.remove('success-pulse');
                lastAddedClaimId = null;
              }, 1500);
            }
          }, 50);
        }
      }
    } else {
      showAlert(result.message || 'Failed to save claim', 'error');
    }
  } catch (error) {
    showAlert(`Error: ${error.message}`, 'error');
  } finally {
    isSubmitting = false;
    setTimeout(() => {
      elements.saveClaimBtn.innerHTML = '<i class="fas fa-save"></i> Save Claim';
      elements.saveClaimBtn.style.background = '';
      elements.saveClaimBtn.classList.remove('success-pulse');
    }, 1000);
  }
}

  // Delete claim function with fast feedback
async function handleDeleteClaimConfirmFast() {
  if (!deleteClaimId) return;

  try {
    const result = await makeRequest('Assurance.php', { 
      action: 'delete_claim', 
      id: deleteClaimId 
    });
    
    if (result.success) {
      showAlert(result.message, 'success');
      
      // Instant data reload without loading states
      const claimsResult = await makeRequest('Assurance.php', { action: 'get_claims' });
      if (claimsResult.success) {
        assuranceClaimsData = claimsResult.data;
        renderAssuranceClaimsTable();
        updateDashboardStats();
      }
    } else {
      showAlert(result.message || 'Failed to delete claim', 'error');
    }
  } catch (error) {
    showAlert('Failed to delete claim', 'error');
  } finally {
    closeDeleteClaimDialog();
  }
}

  // Documents Section Functions
  function setupDocumentsSection() {
    if (elements.addDocumentBtn) {
      elements.addDocumentBtn.addEventListener('click', addSelectedDocument);
    }
    if (elements.documentSelect) {
      elements.documentSelect.addEventListener('change', updateAddButtonState);
    }
    updateAddButtonState();
  }

  // Enhanced function to update required fields and placeholders
  function updateRequiredFields() {
    const typeValue = elements.typeSelect?.value;
    const specialTypes = ['Nv Adh', 'Adh rectificatif', 'Compliment'];
    const isSpecialType = typeValue && specialTypes.includes(typeValue);

    if (elements.dossierNumberInput) {
      if (isSpecialType) {
        elements.dossierNumberInput.removeAttribute('required');
        elements.dossierNumberInput.placeholder = '-';
        elements.dossierNumberInput.style.borderColor = 'var(--border-light)';
      } else {
        elements.dossierNumberInput.setAttribute('required', 'required');
        elements.dossierNumberInput.placeholder = 'N° dossier *';
      }
    }

    if (elements.montantInput) {
      if (isSpecialType) {
        elements.montantInput.removeAttribute('required');
        elements.montantInput.placeholder = '-';
        elements.montantInput.style.borderColor = 'var(--border-light)';
      } else {
        elements.montantInput.setAttribute('required', 'required');
        elements.montantInput.placeholder = 'Montant (DH) *';
      }
    }
    
    // Clear any previous error states when switching types
    if (elements.dossierNumberInput) elements.dossierNumberInput.classList.remove('error');
    if (elements.montantInput) elements.montantInput.classList.remove('error');
  }

  function updateAddButtonState() {
    if (!elements.documentSelect || !elements.addDocumentBtn) return;
    
    const selectedValue = elements.documentSelect.value;
    const isAlreadySelected = selectedDocuments.includes(selectedValue);
    elements.addDocumentBtn.disabled = !selectedValue || isAlreadySelected;
  }

  function addSelectedDocument() {
    if (!elements.documentSelect) return;
    
    const selectedValue = elements.documentSelect.value;
    if (selectedValue && !selectedDocuments.includes(selectedValue)) {
      selectedDocuments.push(selectedValue);
      renderSelectedDocuments();
      elements.documentSelect.value = '';
      updateAddButtonState();
    }
  }

  function removeDocument(documentName) {
    selectedDocuments = selectedDocuments.filter(doc => doc !== documentName);
    renderSelectedDocuments();
    updateAddButtonState();
  }

function renderSelectedDocuments() {
  if (!elements.selectedDocumentsContainer) return;
  if (!Array.isArray(selectedDocuments) || selectedDocuments.length === 0) {
    elements.selectedDocumentsContainer.innerHTML = '<div class="documents-placeholder">No documents selected</div>';
    elements.selectedDocumentsContainer.classList.remove('has-documents');
    return;
  }
  elements.selectedDocumentsContainer.classList.add('has-documents');
  elements.selectedDocumentsContainer.innerHTML = selectedDocuments.map(doc => `
    <div class="document-tag">
      <span>${doc}</span>
      <button type="button" class="remove-btn" onclick="removeDocument('${doc}')">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `).join('');
}

  function clearSelectedDocuments() {
    selectedDocuments = [];
    renderSelectedDocuments();
    updateAddButtonState();
  }

  // Get company CSS class
  function getCompanyClass(societe) {
    switch (societe) {
      case 'GM SOLUTION':
        return 'societe-gm-solution';
      case 'DATA GRID':
        return 'societe-data-grid';
      case 'MULTIVISTAS':
        return 'societe-multivistas';
      default:
        return '';
    }
  }

  // Get amount color class based on status
  function getAmountColorClass(status) {
    switch (status) {
      case 'Rembourssé':
        return 'rembourssé';
      case 'Rejeté':
        return 'rejeté';
      case 'En Cours':
        return 'encours';
      default:
        return '';
    }
  }

  // Enhanced table rendering with focus management
  function renderAssuranceClaimsTable() {
    if (!elements.assuranceTableBody) return;
    
    elements.assuranceTableBody.innerHTML = '';
    let filteredClaims = assuranceClaimsData;

    // Sort claims by date_declaration (oldest first)
    filteredClaims.sort((a, b) => {
        const dateA = new Date(a.date_declaration);
        const dateB = new Date(b.date_declaration);
        return dateA - dateB; // Ascending order (oldest first)
    });
    
    // Apply filters
    const searchTerm = elements.searchInput?.value.toLowerCase() || '';
    const selectedAssure = elements.assureFilter?.value || '';
    const selectedType = elements.typeFilter?.value || '';
    const selectedStatus = elements.statusFilter?.value || '';
    const selectedYear = elements.yearFilter?.value || '';

    filteredClaims = filteredClaims.filter(claim => {
      const matchesSearch = !searchTerm || 
                            claim.assure.toLowerCase().includes(searchTerm) ||
                            (claim.beneficiaire && claim.beneficiaire.toLowerCase().includes(searchTerm)) ||
                            claim.dossier_number.toLowerCase().includes(searchTerm) ||
                            claim.societe.toLowerCase().includes(searchTerm);
      const matchesAssure = !selectedAssure || claim.assure === selectedAssure;
      const matchesType = !selectedType ||
  (claim.type && claim.type.toLowerCase() === selectedType.toLowerCase());
      const matchesStatus = !selectedStatus || claim.status === selectedStatus;
      const matchesYear = !selectedYear || (claim.date_declaration && new Date(claim.date_declaration).getFullYear().toString() === selectedYear);

      return matchesSearch && matchesAssure && matchesType && matchesStatus && matchesYear;
    });

    if (filteredClaims.length === 0) {
      elements.assuranceTableBody.innerHTML = `
        <tr>
          <td colspan="13" style="text-align: center; padding: 2rem; color: var(--text-muted);">
            <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
            No claims found matching your criteria
          </td>
        </tr>
      `;
    } else {
      filteredClaims.forEach(claim => {
        const statusClass = {
          'En Cours': 'status-encours',
          'Rembourssé': 'status-rembourssé',
          'Rejeté': 'status-rejeté'
        }[claim.status] || '';

        const companyClass = getCompanyClass(claim.societe);
        const amountColorClass = getAmountColorClass(claim.status);
        const isLastAdded = lastAddedClaimId && claim.id == lastAddedClaimId;

        const row = `
          <tr ${isLastAdded ? 'class="last-added"' : ''} data-claim-id="${claim.id}">
            <td><div class="assure-name">${claim.assure}</div></td>
            <td>${claim.beneficiaire || '-'}</td>
            <td><div class="dossier-number">${claim.dossier_number || '-'}</div></td>
            <td>${formatDate(claim.date_declaration)}</td>
            <td>${formatDate(claim.date_depot)}</td>
            <td><div class="amount">${claim.montant ? claim.montant.toFixed(2) + ' DH' : '-'}</div></td>
            <td>${claim.type}</td>
            <td><span class="${companyClass}">${claim.societe}</span></td>
            <td>${formatDate(claim.date_remboursement)}</td>
            <td><div class="amount ${amountColorClass}">${claim.montant_rembourse.toFixed(2)} DH</div></td>
            <td>${claim.taux !== null ? `${claim.taux.toFixed(2)} %` : '-'}</td>
            <td><span class="status-badge ${statusClass}">${claim.status}</span></td>
            <td>
              <div class="action-buttons-cell">
                <button class="action-btn edit" onclick="editClaim('${claim.id}')" title="Edit">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete" onclick="deleteClaim('${claim.id}')" title="Delete">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
        elements.assuranceTableBody.insertAdjacentHTML('beforeend', row);
      });
    }
    updateDashboardStats(filteredClaims);
  }

  function updateDashboardStats(claims = assuranceClaimsData) {
    const stats = {
      total: claims.length,
      reimbursed: 0,
      reimbursedAmt: 0,
      pending: 0,
      pendingAmt: 0,
      rejected: 0,
      rejectedAmt: 0
    };

    claims.forEach(claim => {
      if (claim.status === 'Rembourssé') {
        stats.reimbursed++;
        stats.reimbursedAmt += parseFloat(claim.montant_rembourse || 0);
      } else if (claim.status === 'En Cours') {
        stats.pending++;
        stats.pendingAmt += parseFloat(claim.montant || 0) - parseFloat(claim.montant_rembourse || 0);
      } else if (claim.status === 'Rejeté') {
        stats.rejected++;
        stats.rejectedAmt += parseFloat(claim.montant || 0);
      }
    });

    const totalClaimsCount = document.getElementById('totalClaimsCount');
    const reimbursedClaimsCount = document.getElementById('reimbursedClaimsCount');
    const reimbursedAmount = document.getElementById('reimbursedAmount');
    const pendingClaimsCount = document.getElementById('pendingClaimsCount');
    const pendingAmount = document.getElementById('pendingAmount');
    const rejectedClaimsCount = document.getElementById('rejectedClaimsCount');
    const rejectedAmount = document.getElementById('rejectedAmount');

    if (totalClaimsCount) totalClaimsCount.textContent = stats.total;
    if (reimbursedClaimsCount) reimbursedClaimsCount.textContent = stats.reimbursed;
    if (reimbursedAmount) reimbursedAmount.textContent = `${stats.reimbursedAmt.toFixed(2)} DH`;
    if (pendingClaimsCount) pendingClaimsCount.textContent = `${stats.pending}`;
    if (pendingAmount) pendingAmount.textContent = `${stats.pendingAmt.toFixed(2)} DH`;
    if (rejectedClaimsCount) rejectedClaimsCount.textContent = stats.rejected;
    if (rejectedAmount) rejectedAmount.textContent = `${stats.rejectedAmt.toFixed(2)} DH`;
  }

  function openAddClaimModal() {
    editingClaimId = null;
    lastAddedClaimId = null;
    if (elements.claimModalTitle) {
      elements.claimModalTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Add New Claim';
    }
    if (elements.claimForm) {
      elements.claimForm.reset();
      clearValidationErrors(elements.claimForm);
    }
    clearSelectedDocuments();
    populateAssureBeneficiaireDropdowns();
    if (elements.societeInput) elements.societeInput.value = '';
    if (elements.affiliationInput) elements.affiliationInput.value = '';
    if (elements.beneficiaireSelect) {
      elements.beneficiaireSelect.innerHTML = '<option value="">Select Bénéficiaire</option>';
    }
    
    // Initialize required fields based on default type
    updateRequiredFields();
    
    if (elements.assuranceClaimModal) {
      elements.assuranceClaimModal.classList.add('visible');
    }
  }
function editClaim(id) {
  editingClaimId = id;
  const claim = assuranceClaimsData.find(c => c.id == id);

  // Ensure you get the raw documents array (no mapping, no translation)
  selectedDocuments = [];
  try {
    // claim.documentsJoints can be array or JSON string, handle both
    if (Array.isArray(claim.documentsJoints)) {
      selectedDocuments = [...claim.documentsJoints];
    } else if (typeof claim.documentsJoints === 'string' && claim.documentsJoints.trim() !== '') {
      selectedDocuments = JSON.parse(claim.documentsJoints);
    }
    // If it's empty or null, it will stay as []
  } catch (e) {
    selectedDocuments = [];
  }
  renderSelectedDocuments(); // Shows tags in modal

  // Fill other form fields
  document.getElementById('claimId').value = claim.id;
  elements.dossierNumberInput.value = claim.dossier_number || '';
  elements.dateDeclarationInput.value = claim.date_declaration || '';
  elements.dateDepotInput.value = claim.date_depot || '';
  elements.montantInput.value = claim.montant || '';
  elements.typeSelect.value = claim.type || '';
  elements.dateRemboursementInput.value = claim.date_remboursement || '';
  elements.montantRembourseInput.value = claim.montant_rembourse || '';

  updateRequiredFields(); // Make fields required/not required based on type
  updateAddButtonState(); // Enable/disable add-document button

  populateAssureBeneficiaireDropdowns(claim.assure, claim.beneficiaire);
  elements.societeInput.value = claim.societe || '';

  clearValidationErrors(elements.claimForm);

  // Show modal
  elements.assuranceClaimModal.classList.add('visible');
} 

  function closeClaimModal() {
    if (elements.assuranceClaimModal) {
      elements.assuranceClaimModal.classList.remove('visible');
    }
    editingClaimId = null;
    if (elements.claimForm) clearValidationErrors(elements.claimForm);
    clearSelectedDocuments();
  }

  function deleteClaim(id) {
    deleteClaimId = id;
    const deleteClaimDialog = document.getElementById('deleteClaimDialog');
    if (deleteClaimDialog) deleteClaimDialog.classList.add('visible');
  }

  function closeDeleteClaimDialog() {
    const deleteClaimDialog = document.getElementById('deleteClaimDialog');
    if (deleteClaimDialog) deleteClaimDialog.classList.remove('visible');
    deleteClaimId = null;
  }

  // Dropdown Population Logic
  function populateAssureBeneficiaireDropdowns(selectedAssureName = '', selectedBeneficiaireName = '') {
    if (!elements.assureFilter) return;
    
    // Update filter dropdown
    elements.assureFilter.innerHTML = '<option value="">All Assurés</option>';
    assureBeneficiaireData.forEach(assure => {
      const filterOption = document.createElement('option');
      filterOption.value = assure.name;
      filterOption.textContent = assure.name;
      elements.assureFilter.appendChild(filterOption);
    });

    // Update searchable dropdown data
    updateSearchableDropdownData();
    
    // Set selected value if provided
    if (selectedAssureName && assureDropdown) {
      assureDropdown.setValue(selectedAssureName, true);
      
      // Set beneficiary if provided
      if (selectedBeneficiaireName && elements.beneficiaireSelect) {
        setTimeout(() => {
          elements.beneficiaireSelect.value = selectedBeneficiaireName;
        }, 100);
      }
    }
  }

  function updateSocieteAffiliationAndBeneficiaires(event, preSelectedAssureName = null, preSelectedBeneficiaireName = null) {
    if (!elements.beneficiaireSelect || !elements.societeInput || !elements.affiliationInput) return;
    
    const currentAssureName = event ? event.target.value : preSelectedAssureName;
    const selectedAssure = assureBeneficiaireData.find(a => a.name === currentAssureName);

    elements.beneficiaireSelect.innerHTML = '<option value="">Select Bénéficiaire</option>';
    elements.societeInput.value = '';
    elements.affiliationInput.value = '';

    if (selectedAssure) {
      elements.societeInput.value = selectedAssure.societe;
      elements.affiliationInput.value = selectedAssure.affiliation || '';

      // Create an array of all family members
      const familyMembers = [
        selectedAssure.conjoint,
        selectedAssure.kid1,
        selectedAssure.kid2,
        selectedAssure.kid3
      ].filter(member => member && member.trim() !== '');

      // Add each family member to the dropdown
      familyMembers.forEach(member => {
        const option = document.createElement('option');
        option.value = member;
        option.textContent = member;
        elements.beneficiaireSelect.appendChild(option);
      });

      // If no beneficiary is selected, default to "Lui même" or "Elle même"
      if (familyMembers.length === 0) {
        const defaultOption = document.createElement('option');
        defaultOption.value = selectedAssure.gender === 'Male' ? 'Lui même' : 'Elle même';
        defaultOption.textContent = selectedAssure.gender === 'Male' ? 'Lui même' : 'Elle même';
        defaultOption.selected = true;
        elements.beneficiaireSelect.appendChild(defaultOption);
      }
    }
  }

  // Filters with debouncing
  function setupFilters() {
    if (elements.searchInput) {
      elements.searchInput.addEventListener('input', debounce(renderAssuranceClaimsTable, 200));
    }

    document.querySelectorAll('.filter-select').forEach(element => {
      element.addEventListener('change', renderAssuranceClaimsTable);
    });

    if (elements.clearFiltersBtn) {
      elements.clearFiltersBtn.addEventListener('click', function() {
        if (elements.searchInput) elements.searchInput.value = '';
        if (elements.assureFilter) elements.assureFilter.value = '';
        if (elements.typeFilter) elements.typeFilter.value = '';
        if (elements.statusFilter) elements.statusFilter.value = '';
        if (elements.yearFilter) elements.yearFilter.value = new Date().getFullYear().toString();
        renderAssuranceClaimsTable();
      });
    }
  }

  function populateYearFilter() {
    if (!elements.yearFilter) return;
    
    const years = new Set();
    assuranceClaimsData.forEach(claim => {
      if (claim.date_declaration) {
        years.add(new Date(claim.date_declaration).getFullYear());
      }
    });
    const sortedYears = Array.from(years).sort((a, b) => a - b);
    const currentYear = new Date().getFullYear();

    elements.yearFilter.innerHTML = '<option value="">All Years</option>';
    
    if (!sortedYears.includes(currentYear)) {
      const option = document.createElement('option');
      option.value = currentYear.toString();
      option.textContent = currentYear.toString();
      elements.yearFilter.appendChild(option);
    }

    sortedYears.forEach(year => {
      const option = document.createElement('option');
      option.value = year.toString();
      option.textContent = year.toString();
      elements.yearFilter.appendChild(option);
    });

    elements.yearFilter.value = currentYear.toString();
  }

  // Assuré/Bénéficiaire Side Panel Logic
  function renderAssureBeneficiaireTable() {
    const assureBeneficiaireTableBody = document.getElementById('assureBeneficiaireTableBody');
    if (!assureBeneficiaireTableBody) return;
    
    assureBeneficiaireTableBody.innerHTML = '';
    let filteredAssures = assureBeneficiaireData;
    
    // Get the current search term from the Assuré panel's search input
    const assureSearchInput = document.getElementById('assurePanelSearchInput');
    const searchTerm = assureSearchInput?.value.toLowerCase() || '';

    if (searchTerm) {
      filteredAssures = filteredAssures.filter(assure => 
        assure.name.toLowerCase().includes(searchTerm) ||
        assure.societe.toLowerCase().includes(searchTerm) ||
        (assure.conjoint && assure.conjoint.toLowerCase().includes(searchTerm)) ||
        (assure.kid1 && assure.kid1.toLowerCase().includes(searchTerm)) ||
        (assure.kid2 && assure.kid2.toLowerCase().includes(searchTerm)) ||
        (assure.kid3 && assure.kid3.toLowerCase().includes(searchTerm))
      );
    }

    if (filteredAssures.length === 0) {
      assureBeneficiaireTableBody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; padding: 1rem; color: var(--text-muted);">
            No Assurés found.
          </td>
        </tr>
      `;
    } else {
      filteredAssures.forEach(assure => {
        const row = `
          <tr>
            <td>${assure.name}</td>
            <td>${assure.societe}</td>
            <td>${assure.gender || '-'}</td>
            <td>
              <div class="action-buttons-cell">
                <button class="action-btn edit" onclick="editAssure('${assure.id}')" title="Edit">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete" onclick="deleteAssure('${assure.id}')" title="Delete">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
        assureBeneficiaireTableBody.insertAdjacentHTML('beforeend', row);
      });
    }
  }

  function openAddAssureModal() {
    editingAssureId = null;
    const assureBeneficiaireModalTitle = document.getElementById('assureBeneficiaireModalTitle');
    if (assureBeneficiaireModalTitle) {
      assureBeneficiaireModalTitle.innerHTML = '<i class="fas fa-user-plus"></i> Add New Assuré';
    }
    const assureBeneficiaireForm = document.getElementById('assureBeneficiaireForm');
    if (assureBeneficiaireForm) {
      assureBeneficiaireForm.reset();
      clearValidationErrors(assureBeneficiaireForm);
    }
    const assureBeneficiaireModal = document.getElementById('assureBeneficiaireModal');
    if (assureBeneficiaireModal) {
      assureBeneficiaireModal.classList.add('visible');
    }
  }

  function editAssure(id) {
    editingAssureId = id;
    const assureBeneficiaireModalTitle = document.getElementById('assureBeneficiaireModalTitle');
    if (assureBeneficiaireModalTitle) {
      assureBeneficiaireModalTitle.innerHTML = '<i class="fas fa-edit"></i> Edit Assuré';
    }
    const assure = assureBeneficiaireData.find(a => a.id == id);

    if (assure) {
      const assureIdInput = document.getElementById('assureId');
      const assureNameInput = document.getElementById('assureName');
      const assureSocieteSelect = document.getElementById('assureSocieteSelect');
      const assureGenderSelect = document.getElementById('assureGenderSelect');
      const affiliationInput = document.getElementById('affiliationInput');
      const conjointInput = document.getElementById('conjointInput');
      const kid1Input = document.getElementById('kid1Input');
      const kid2Input = document.getElementById('kid2Input');
      const kid3Input = document.getElementById('kid3Input');

      if (assureIdInput) assureIdInput.value = assure.id;
      if (assureNameInput) assureNameInput.value = assure.name;
      if (assureSocieteSelect) assureSocieteSelect.value = assure.societe;
      if (assureGenderSelect) assureGenderSelect.value = assure.gender || '';
      if (affiliationInput) affiliationInput.value = assure.affiliation || '';
      if (conjointInput) conjointInput.value = assure.conjoint || '';
      if (kid1Input) kid1Input.value = assure.kid1 || '';
      if (kid2Input) kid2Input.value = assure.kid2 || '';
      if (kid3Input) kid3Input.value = assure.kid3 || '';
      
      const assureBeneficiaireForm = document.getElementById('assureBeneficiaireForm');
      if (assureBeneficiaireForm) clearValidationErrors(assureBeneficiaireForm);
      
      const assureBeneficiaireModal = document.getElementById('assureBeneficiaireModal');
      if (assureBeneficiaireModal) assureBeneficiaireModal.classList.add('visible');
    } else {
      showAlert('Assuré not found for editing.', 'error');
    }
  }

  function closeAssureBeneficiaireModal() {
    const assureBeneficiaireModal = document.getElementById('assureBeneficiaireModal');
    if (assureBeneficiaireModal) assureBeneficiaireModal.classList.remove('visible');
    editingAssureId = null;
    const assureBeneficiaireForm = document.getElementById('assureBeneficiaireForm');
    if (assureBeneficiaireForm) clearValidationErrors(assureBeneficiaireForm);
  }

async function saveAssureBeneficiaire() {
  const assureBeneficiaireForm = document.getElementById('assureBeneficiaireForm');
  if (!validateForm(assureBeneficiaireForm)) {
    showAlert('Please fill in all required fields', 'error');
    return;
  }

  const assureNameInput = document.getElementById('assureName');
  const assureSocieteSelect = document.getElementById('assureSocieteSelect');
  const assureGenderSelect = document.getElementById('assureGenderSelect');
  const affiliationInput = document.getElementById('affiliationInput');
  const conjointInput = document.getElementById('conjointInput');
  const kid1Input = document.getElementById('kid1Input');
  const kid2Input = document.getElementById('kid2Input');
  const kid3Input = document.getElementById('kid3Input');

  const assureData = {
    name: assureNameInput?.value.trim() || '',
    societe: assureSocieteSelect?.value || '',
    gender: assureGenderSelect?.value || '',
    affiliation: parseInt(affiliationInput?.value) || 0,
    conjoint: conjointInput?.value.trim() || '',
    kid1: kid1Input?.value.trim() || '',
    kid2: kid2Input?.value.trim() || '',
    kid3: kid3Input?.value.trim() || ''
  };

  const isEditing = editingAssureId !== null;
  const action = isEditing ? 'update_assure' : 'add_assure';
  
  if (isEditing) {
    assureData.id = editingAssureId;
  }

  assureData.action = action;

  try {
    const result = await makeRequest('Assurance.php', assureData);

    if (result.success) {
      showAlert(result.message || 'Assuré saved!', 'success');
      closeAssureBeneficiaireModal();

      // Fetch latest assures and claims
      const [assuresResult, claimsResult] = await Promise.all([
        makeRequest('Assurance.php', { action: 'get_assures' }),
        makeRequest('Assurance.php', { action: 'get_claims' })
      ]);
      if (assuresResult.success) {
        assureBeneficiaireData = assuresResult.data;
        renderAssureBeneficiaireTable();
        populateAssureBeneficiaireDropdowns();
        updateSearchableDropdownData();
      }
      if (claimsResult.success) {
        assuranceClaimsData = claimsResult.data;
        renderAssuranceClaimsTable();
      }
    } else {
      showAlert(result.message || 'Failed to save assuré', 'error');
    }
  } catch (error) {
    showAlert('Failed to save assuré', 'error');
  }
}

  function deleteAssure(id) {
    deleteAssureId = id;
    const deleteAssureDialog = document.getElementById('deleteAssureDialog');
    if (deleteAssureDialog) deleteAssureDialog.classList.add('visible');
  }

  async function handleDeleteAssureConfirm() {
    if (!deleteAssureId) return;

    try {
      const result = await makeRequest('Assurance.php', { 
        action: 'delete_assure', 
        id: deleteAssureId 
      });
      
      if (result.success) {
        showAlert(result.message, 'success');
        await loadData();
      } else {
        showAlert(result.message || 'Failed to delete assuré', 'error');
      }
    } catch (error) {
      showAlert('Failed to delete assuré', 'error');
    } finally {
      closeDeleteAssureDialog();
    }
  }

  function closeDeleteAssureDialog() {
    const deleteAssureDialog = document.getElementById('deleteAssureDialog');
    if (deleteAssureDialog) deleteAssureDialog.classList.remove('visible');
    deleteAssureId = null;
  }

  // Download Accusé functionality
  function populateDownloadAccuseDropdown() {
    const dropdown = document.getElementById('downloadAccuseDropdown');
    if (!dropdown) return;
    
    // Get unique deposit dates
    const uniqueDates = [...new Set(assuranceClaimsData
      .filter(claim => claim.date_depot)
      .map(claim => claim.date_depot)
    )].sort((a, b) => new Date(b) - new Date(a)); // Sort by newest first
    
    if (uniqueDates.length === 0) {
      dropdown.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--text-muted);">No deposit dates available</div>';
      return;
    }
    
    dropdown.innerHTML = uniqueDates.map(date => {
      const formattedDate = formatDate(date);
      const claimsCount = assuranceClaimsData.filter(claim => claim.date_depot === date).length;
      return `
        <div class="dropdown-item" onclick="downloadAccuse('${date}')" style="padding: 0.75rem 1rem; cursor: pointer; border-bottom: 1px solid var(--border-light); transition: var(--transition-fast);">
          <div style="font-weight: 600; color: var(--text-primary);">${formattedDate}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${claimsCount} claim${claimsCount !== 1 ? 's' : ''}</div>
        </div>
      `;
    }).join('');
    
    // Add hover effects
    dropdown.querySelectorAll('.dropdown-item').forEach(item => {
      item.addEventListener('mouseenter', function() {
        this.style.background = 'var(--bg-gray-50)';
      });
      item.addEventListener('mouseleave', function() {
        this.style.background = 'transparent';
      });
    });
  }
elements.claimForm.addEventListener('submit', function(e) {
  e.preventDefault(); // Prevent default page reload
  saveAssuranceClaimInstant();
});
  function downloadAccuse(dateDepot) {
    // Close the dropdown
    const dropdown = document.getElementById('downloadAccuseDropdown');
    if (dropdown) dropdown.style.display = 'none';
    
    // Navigate to Accusé.html with the selected date
    const url = `Accusé.html?dateDepot=${encodeURIComponent(dateDepot)}`;
    window.open(url, '_blank');
  }

  function toggleDownloadAccuseDropdown() {
    const dropdown = document.getElementById('downloadAccuseDropdown');
    if (!dropdown) return;
    
    if (dropdown.style.display === 'none' || dropdown.style.display === '') {
      populateDownloadAccuseDropdown();
      dropdown.style.display = 'block';
    } else {
      dropdown.style.display = 'none';
    }
  }

  // Close dropdown when clicking outside
  document.addEventListener('click', function(event) {
    const downloadBtn = document.getElementById('downloadAccuseBtn');
    const dropdown = document.getElementById('downloadAccuseDropdown');
    
    if (downloadBtn && dropdown && !downloadBtn.contains(event.target) && !dropdown.contains(event.target)) {
      dropdown.style.display = 'none';
    }
  });

  // Event Listeners Setup
  function setupEventListeners() {
    // Main Claim Modal
    if (elements.addClaimButton) {
      elements.addClaimButton.addEventListener('click', openAddClaimModal);
    }
    if (elements.claimModalClose) {
      elements.claimModalClose.addEventListener('click', closeClaimModal);
    }
// In setupEventListeners function, replace the save button listener
if (elements.saveClaimBtn) {
  elements.saveClaimBtn.addEventListener('click', saveAssuranceClaimInstant);

elements.claimForm.addEventListener('submit', function(e) {
  e.preventDefault(); // prevents page reload
  saveAssuranceClaimInstant();
});
}
    if (elements.assureSearchInput) {
      elements.assureSearchInput.addEventListener('change', updateSocieteAffiliationAndBeneficiaires);
    }
    if (elements.typeSelect) {
      elements.typeSelect.addEventListener('change', updateRequiredFields);
    }

    // Delete Claim Dialog
    const cancelDeleteClaim = document.getElementById('cancelDeleteClaim');
    const confirmDeleteClaim = document.getElementById('confirmDeleteClaim');
    if (cancelDeleteClaim) {
      cancelDeleteClaim.addEventListener('click', closeDeleteClaimDialog);
    }
    if (confirmDeleteClaim) {
      confirmDeleteClaim.addEventListener('click', handleDeleteClaimConfirmFast);
    }

    // Assuré/Bénéficiaire Side Panel & Modal
    const rightEdgeTrigger = document.getElementById('rightEdgeTrigger');
    const assureBeneficiairePanel = document.getElementById('assureBeneficiairePanel');
    const addAssureButton = document.getElementById('addAssureButton');
    const assureBeneficiaireModalClose = document.getElementById('assureBeneficiaireModalClose');
    const saveAssureBeneficiaireBtn = document.getElementById('saveAssureBeneficiaireBtn');
    const assureSearchInput = document.getElementById('assurePanelSearchInput');

    if (rightEdgeTrigger && assureBeneficiairePanel) {
      rightEdgeTrigger.addEventListener('mouseenter', () => assureBeneficiairePanel.classList.add('visible'));
      assureBeneficiairePanel.addEventListener('mouseleave', () => assureBeneficiairePanel.classList.remove('visible'));
    }
    if (addAssureButton) {
      addAssureButton.addEventListener('click', openAddAssureModal);
    }
    if (assureBeneficiaireModalClose) {
      assureBeneficiaireModalClose.addEventListener('click', closeAssureBeneficiaireModal);
    }
    if (saveAssureBeneficiaireBtn) {
      saveAssureBeneficiaireBtn.addEventListener('click', saveAssureBeneficiaire);
    }
    if (assureSearchInput) {
      assureSearchInput.addEventListener('input', debounce(renderAssureBeneficiaireTable, 300));
    }

    // Delete Assure Dialog
    const cancelDeleteAssure = document.getElementById('cancelDeleteAssure');
    const confirmDeleteAssure = document.getElementById('confirmDeleteAssure');
    if (cancelDeleteAssure) {
      cancelDeleteAssure.addEventListener('click', closeDeleteAssureDialog);
    }
    if (confirmDeleteAssure) {
      confirmDeleteAssure.addEventListener('click', handleDeleteAssureConfirm);
    }

    // Close modals when clicking outside
    if (elements.assuranceClaimModal) {
      elements.assuranceClaimModal.addEventListener('click', (e) => { 
        if (e.target === elements.assuranceClaimModal) closeClaimModal(); 
      });
    }
    const assureBeneficiaireModal = document.getElementById('assureBeneficiaireModal');
    if (assureBeneficiaireModal) {
      assureBeneficiaireModal.addEventListener('click', (e) => { 
        if (e.target === assureBeneficiaireModal) closeAssureBeneficiaireModal(); 
      });
    }
    const deleteClaimDialog = document.getElementById('deleteClaimDialog');
    if (deleteClaimDialog) {
      deleteClaimDialog.addEventListener('click', (e) => { 
        if (e.target === deleteClaimDialog) closeDeleteClaimDialog(); 
      });
    }
    const deleteAssureDialog = document.getElementById('deleteAssureDialog');
    if (deleteAssureDialog) {
      deleteAssureDialog.addEventListener('click', (e) => { 
        if (e.target === deleteAssureDialog) closeDeleteAssureDialog(); 
      });
    }

    // Download Accusé dropdown
    const downloadAccuseBtn = document.getElementById('downloadAccuseBtn');
    if (downloadAccuseBtn) {
      downloadAccuseBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleDownloadAccuseDropdown();
      });
    }
  }

  // Searchable Dropdown for Assuré
  class SearchableDropdown {
    constructor(containerId, inputId, resultsId) {
      this.container = document.getElementById(containerId);
      this.input = document.getElementById(inputId);
      this.results = document.getElementById(resultsId);
      this.data = [];
      this.filteredData = [];
      this.selectedIndex = -1;
      this.isOpen = false;
      this.selectedItem = null;
      
      this.setupEventListeners();
    }
    
    setData(data) {
      this.data = data;
    }
    
    setupEventListeners() {
      if (!this.input || !this.results) return;
      
      this.input.addEventListener('input', (e) => {
        this.handleInput(e.target.value);
      });
      
      this.input.addEventListener('focus', () => {
        this.showDropdown();
      });
      
      this.input.addEventListener('keydown', (e) => {
        this.handleKeydown(e);
      });
      
      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!this.container.contains(e.target)) {
          this.hideDropdown();
        }
      });
    }
    
    handleInput(value) {
      this.filterData(value);
      this.renderResults();
      this.showDropdown();
      this.selectedIndex = -1;
      
      // Clear selection if input doesn't match exactly
      if (this.selectedItem && this.selectedItem.name !== value) {
        this.selectedItem = null;
        this.clearRelatedFields();
      }
    }
    
    filterData(searchTerm) {
      if (!searchTerm.trim()) {
        this.filteredData = [...this.data];
      } else {
        const term = searchTerm.toLowerCase();
        this.filteredData = this.data.filter(item => 
          item.name.toLowerCase().includes(term) ||
          item.societe.toLowerCase().includes(term)
        );
      }
    }
    
    renderResults() {
      if (!this.results) return;
      
      if (this.filteredData.length === 0) {
        this.results.innerHTML = '<div class="dropdown-result-item" style="color: var(--text-muted); cursor: default;">No results found</div>';
      } else {
        this.results.innerHTML = this.filteredData.map((item, index) => `
          <div class="dropdown-result-item" data-index="${index}" onclick="assureDropdown.selectItem(${index})">
            <div class="dropdown-result-name">${item.name}</div>
            <div class="dropdown-result-details">${item.societe} • ${item.gender || 'N/A'} • Affiliation: ${item.affiliation || 'N/A'}</div>
          </div>
        `).join('');
      }
    }
    
    selectItem(index) {
      if (index >= 0 && index < this.filteredData.length) {
        this.selectedItem = this.filteredData[index];
        this.input.value = this.selectedItem.name;
        this.updateRelatedFields();
        this.hideDropdown();
        this.selectedIndex = -1;
      }
    }
    
    updateRelatedFields() {
      if (!this.selectedItem) return;
      
      // Update société and affiliation
      if (elements.societeInput) elements.societeInput.value = this.selectedItem.societe;
      if (elements.affiliationInput) elements.affiliationInput.value = this.selectedItem.affiliation || '';
      
      // Update beneficiaires dropdown
      if (elements.beneficiaireSelect) {
        elements.beneficiaireSelect.innerHTML = '<option value="">Select Bénéficiaire</option>';
        
        const familyMembers = [
          this.selectedItem.conjoint,
          this.selectedItem.kid1,
          this.selectedItem.kid2,
          this.selectedItem.kid3
        ].filter(member => member && member.trim() !== '');
        
        familyMembers.forEach(member => {
          const option = document.createElement('option');
          option.value = member;
          option.textContent = member;
          elements.beneficiaireSelect.appendChild(option);
        });
        
        if (familyMembers.length === 0) {
          const defaultOption = document.createElement('option');
          defaultOption.value = this.selectedItem.gender === 'Male' ? 'Lui même' : 'Elle même';
          defaultOption.textContent = this.selectedItem.gender === 'Male' ? 'Lui même' : 'Elle même';
          defaultOption.selected = true;
          elements.beneficiaireSelect.appendChild(defaultOption);
        }
      }
    }
    
    clearRelatedFields() {
      if (elements.societeInput) elements.societeInput.value = '';
      if (elements.affiliationInput) elements.affiliationInput.value = '';
      if (elements.beneficiaireSelect) {
        elements.beneficiaireSelect.innerHTML = '<option value="">Select Bénéficiaire</option>';
      }
    }
    
    handleKeydown(e) {
      if (!this.isOpen) return;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          this.selectedIndex = Math.min(this.selectedIndex + 1, this.filteredData.length - 1);
          this.highlightItem();
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
          this.highlightItem();
          break;
        case 'Enter':
          e.preventDefault();
          if (this.selectedIndex >= 0) {
            this.selectItem(this.selectedIndex);
          }
          break;
        case 'Escape':
          this.hideDropdown();
          break;
      }
    }
    
    highlightItem() {
      const items = this.results.querySelectorAll('.dropdown-result-item');
      items.forEach((item, index) => {
        item.classList.toggle('highlighted', index === this.selectedIndex);
      });
    }
    
    showDropdown() {
      if (this.filteredData.length > 0 || this.input.value.trim()) {
        this.results.classList.add('visible');
        this.container.classList.add('open');
        this.isOpen = true;
      }
    }
    
    hideDropdown() {
      this.results.classList.remove('visible');
      this.container.classList.remove('open');
      this.isOpen = false;
      this.selectedIndex = -1;
    }
    
    setValue(value, updateFields = true) {
      const item = this.data.find(item => item.name === value);
      if (item) {
        this.selectedItem = item;
        this.input.value = value;
        if (updateFields) {
          this.updateRelatedFields();
        }
      }
    }
  }

  // Smart calculation for Montant field
  function setupSmartCalculation() {
    if (!elements.montantInput) return;
    
    // Wrap the montant input in a container for the hint
    const wrapper = document.createElement('div');
    wrapper.className = 'montant-input-wrapper';
    elements.montantInput.parentNode.insertBefore(wrapper, elements.montantInput);
    wrapper.appendChild(elements.montantInput);
    
    // Add calculation hint element
    const hint = document.createElement('div');
    hint.className = 'calculation-hint';
    hint.id = 'calculationHint';
    wrapper.appendChild(hint);
    
    elements.montantInput.addEventListener('input', handleMontantCalculation);
    elements.montantInput.addEventListener('blur', finalizeMontantCalculation);
  }

  function handleMontantCalculation(e) {
    const value = e.target.value.trim();
    const hint = document.getElementById('calculationHint');
    
    if (!hint) return;
    
    // Check if the input contains mathematical operators
    if (/[+\-*/]/.test(value) && value.length > 1) {
      try {
        // Safe evaluation - only allow numbers and basic operators
        const sanitized = value.replace(/[^0-9+\-*/.() ]/g, '');
        if (sanitized !== value) {
          hint.textContent = 'Invalid characters';
          hint.style.color = 'var(--error-color)';
          hint.classList.add('visible');
          return;
        }
        
        // Evaluate the expression
        const result = Function('"use strict"; return (' + sanitized + ')')();
        
        if (isNaN(result) || !isFinite(result)) {
          hint.textContent = 'Invalid expression';
          hint.style.color = 'var(--error-color)';
        } else {
          hint.textContent = `= ${result.toFixed(2)}`;
          hint.style.color = 'var(--success-color)';
        }
        hint.classList.add('visible');
      } catch (error) {
        hint.textContent = 'Invalid expression';
        hint.style.color = 'var(--error-color)';
        hint.classList.add('visible');
      }
    } else {
      hint.classList.remove('visible');
    }
  }

  function finalizeMontantCalculation(e) {
    const value = e.target.value.trim();
    const hint = document.getElementById('calculationHint');
    
    if (!hint) return;
    
    // If there's a valid calculation, replace the input with the result
    if (/[+\-*/]/.test(value) && hint.textContent.startsWith('=')) {
      try {
        const sanitized = value.replace(/[^0-9+\-*/.() ]/g, '');
        const result = Function('"use strict"; return (' + sanitized + ')')();
        
        if (!isNaN(result) && isFinite(result)) {
          e.target.value = result.toFixed(2);
          
          // Show a brief success animation
          hint.textContent = '✓ Calculated';
          hint.style.color = 'var(--success-color)';
          setTimeout(() => {
            hint.classList.remove('visible');
          }, 1000);
        }
      } catch (error) {
        // Keep the original value if calculation fails
      }
    } else {
      hint.classList.remove('visible');
    }
  }

  // Initialize searchable dropdown
  let assureDropdown;

  function initializeSearchableDropdown() {
    assureDropdown = new SearchableDropdown('assureSearchableDropdown', 'assureSearchInput', 'assureDropdownResults');
    assureDropdown.setData(assureBeneficiaireData);
  }

  function updateSearchableDropdownData() {
    if (assureDropdown) {
      assureDropdown.setData(assureBeneficiaireData);
    }
  }

  // Initialize the application
  function init() {
    setupEventListeners();
    setupFilters();
    setupDocumentsSection();
    setupSmartCalculation();
    initializeSearchableDropdown();
    renderAssureBeneficiaireTable();
    renderAssuranceClaimsTable();
    populateAssureBeneficiaireDropdowns();
    updateDashboardStats();
    populateYearFilter();
    populateDownloadAccuseDropdown();
  }

  // Initialize when DOM is loaded
  document.addEventListener('DOMContentLoaded', init);

  // Make functions globally available for onclick handlers
  window.editClaim = editClaim;
  window.deleteClaim = deleteClaim;
  window.editAssure = editAssure;
  window.deleteAssure = deleteAssure;
  window.removeDocument = removeDocument;
  window.downloadAccuse = downloadAccuse;

  class SidebarManager {
    constructor() {
      this.init()
    }

    init() {
      this.setupDropdownMenus()
      this.setupActiveStates()
      this.setupResponsiveHandling()
    }

    setupDropdownMenus() {
      // Transport Menu
      const transportMenu = document.getElementById("transportMenu")
      const transportSubmenu = document.getElementById("transportSubmenu")

      if (transportMenu && transportSubmenu) {
        this.setupDropdown(transportMenu, transportSubmenu, false) // Open by default
      }

      // Employees Menu
      const employeesMenu = document.getElementById("employeesMenu")
      const employeesSubmenu = document.getElementById("employeesSubmenu")

      if (employeesMenu && employeesSubmenu) {
        this.setupDropdown(employeesMenu, employeesSubmenu, false) // Closed by default
      }

      // Payroll Menu
      const payrollMenu = document.getElementById("payrollMenu")
      const payrollSubmenu = document.getElementById("payrollSubmenu")

      if (payrollMenu && payrollSubmenu) {
        this.setupDropdown(payrollMenu, payrollSubmenu, false) // Closed by default
      }
    }

    setupDropdown(menuElement, submenuElement, isOpenByDefault = false) {
      // Set initial state
      if (isOpenByDefault) {
        submenuElement.style.display = "flex"
        submenuElement.classList.add("open")
        menuElement.classList.add("open")
      } else {
        submenuElement.style.display = "none"
        submenuElement.classList.remove("open")
        menuElement.classList.remove("open")
      }

      // Add click event listener
      menuElement.addEventListener("click", (e) => {
        e.preventDefault()
        this.toggleDropdown(menuElement, submenuElement)
      })
    }

    toggleDropdown(menuElement, submenuElement) {
      const isOpen = submenuElement.classList.contains("open")

      if (isOpen) {
        // Close the dropdown
        submenuElement.classList.remove("open")
        submenuElement.classList.add("closing")
        menuElement.classList.remove("open")

        setTimeout(() => {
          submenuElement.style.display = "none"
          submenuElement.classList.remove("closing")
        }, 300)
      } else {
        // Open the dropdown
        submenuElement.style.display = "flex"
        submenuElement.classList.add("opening")
        submenuElement.classList.add("open")
        menuElement.classList.add("open")

        setTimeout(() => {
          submenuElement.classList.remove("opening")
        }, 300)
      }
    }

    setupActiveStates() {
      // Handle navigation link clicks
      const navLinks = document.querySelectorAll(".nav-link:not([id]), .submenu-link")

      navLinks.forEach((link) => {
        link.addEventListener("click", (e) => {
          // Only prevent default if it's a demo link (href="#")
          if (link.getAttribute("href") === "#") {
            e.preventDefault()
          }

          // Remove active class from all links of the same type
          if (link.classList.contains("submenu-link")) {
            document.querySelectorAll(".submenu-link").forEach((l) => l.classList.remove("active"))
          } else {
            document.querySelectorAll(".nav-link:not([id])").forEach((l) => l.classList.remove("active"))
          }

          // Add active class to clicked link
          link.classList.add("active")
        })
      })
    }

    setupResponsiveHandling() {
      // Handle window resize
      window.addEventListener("resize", () => {
        this.handleResponsiveChanges()
      })

      // Initial check
      this.handleResponsiveChanges()
    }

    handleResponsiveChanges() {
      const sidebar = document.querySelector(".sidebar")
      const isMobile = window.innerWidth <= 768

      if (isMobile) {
        // On mobile, close all dropdowns
        const openSubmenus = document.querySelectorAll(".sidebar-submenu.open")
        openSubmenus.forEach((submenu) => {
          submenu.style.display = "none"
          submenu.classList.remove("open")
        })

        const openMenus = document.querySelectorAll(".nav-link.open")
        openMenus.forEach((menu) => {
          menu.classList.remove("open")
        })
      }
    }

    // Public method to set active menu item
    setActiveMenuItem(menuId, submenuId = null) {
      // Remove all active states
      document.querySelectorAll(".nav-link, .submenu-link").forEach((link) => {
        link.classList.remove("active")
      })

      // Set main menu active
      const mainMenu = document.getElementById(menuId)
      if (mainMenu) {
        mainMenu.classList.add("active")
      }

      // Set submenu active if provided
      if (submenuId) {
        const submenu = document.getElementById(submenuId)
        if (submenu) {
          submenu.classList.add("active")
        }
      }
    }

    // Public method to open/close specific dropdown
    toggleSpecificDropdown(menuId) {
      const menuElement = document.getElementById(menuId)
      const submenuElement = document.getElementById(menuId.replace("Menu", "Submenu"))

      if (menuElement && submenuElement) {
        this.toggleDropdown(menuElement, submenuElement)
      }
    }
  }

  // Initialize sidebar when DOM is loaded
  document.addEventListener("DOMContentLoaded", () => {
    window.sidebarManager = new SidebarManager();
  });

  // Export for use in other scripts
  if (typeof module !== "undefined" && module.exports) {
    module.exports = SidebarManager
  }

</script>
</body>
</html>