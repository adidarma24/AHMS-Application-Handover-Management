import type { Application, AppState, ChecklistItem, MasterPIC, MasterVendor, MasterEnvironment, User } from '../types'

export const INITIAL_APPS: Application[] = [
  {
    id: 'app-001', name: 'SCADA Integration Platform v2',
    description: 'Platform integrasi SCADA untuk monitoring real-time seluruh fasilitas produksi migas.',
    criticality: 'Critical', businessOwner: 'Budi Santoso', pic: 'Andi Pratama',
    picOM: 'Sari Dewi',
    goLiveDate: '2024-03-15', technology: 'Python, InfluxDB, Grafana', environment: 'Production',
    status: 'Handover Accepted', submittedDate: '2024-01-10', targetHandoverDate: '2024-03-01',
    category: 'Operations', vendor: 'Schlumberger Indonesia',
    reviewers: [
      { role: 'Reviewer Teknis', name: 'Reza Firmansyah', status: 'approved', reviewedAt: '2024-02-10' },
      { role: 'O&M Application Support', name: 'Sari Dewi', status: 'approved', reviewedAt: '2024-02-12' },
      { role: 'Business Owner', name: 'Budi Santoso', status: 'approved', reviewedAt: '2024-02-15' },
    ],
    actionItems: [
      { id: 'ai-001', title: 'Finalisasi dokumentasi API', assignee: 'Andi Pratama', dueDate: '2024-02-20', status: 'completed', priority: 'high' },
      { id: 'ai-002', title: 'Training O&M team', assignee: 'Sari Dewi', dueDate: '2024-02-28', status: 'completed', priority: 'medium' },
    ],
    documents: [
      { id: 'd001', name: 'Technical Specification', type: 'SRS', uploaded: true, required: true, uploadedAt: '2024-01-15' },
      { id: 'd002', name: 'Deployment Manual', type: 'Manual', uploaded: true, required: true, uploadedAt: '2024-01-16' },
      { id: 'd003', name: 'User Manual', type: 'Manual', uploaded: true, required: true, uploadedAt: '2024-01-17' },
    ],
    history: [
      { id: 'h001', timestamp: '2024-01-10 09:00', user: 'Andi Pratama', action: 'Pengajuan dibuat', notes: 'Initial submission' },
      { id: 'h002', timestamp: '2024-02-10 14:00', user: 'Reza Firmansyah', action: 'Teknis disetujui' },
      { id: 'h003', timestamp: '2024-03-01 10:00', user: 'Manager O&M', action: 'Final approval diberikan' },
    ],
    riskScore: 12,
  },
  {
    id: 'app-002', name: 'Well Management System (WMS)',
    description: 'Sistem manajemen sumur terintegrasi untuk tracking produksi, injeksi, dan surveillance.',
    criticality: 'Critical', businessOwner: 'Hendra Kusuma', pic: 'Dewi Rahmawati',
    picOM: 'Yanto Prasetyo',
    goLiveDate: '2024-06-01', technology: 'Java Spring Boot, Oracle DB', environment: 'Production',
    status: 'Under Technical Review', submittedDate: '2024-03-05', targetHandoverDate: '2024-05-15',
    category: 'Upstream', vendor: 'Halliburton Indonesia',
    reviewers: [
      { role: 'Reviewer Teknis', name: 'Reza Firmansyah', status: 'pending' },
      { role: 'O&M Application Support', name: 'Yanto Prasetyo', status: 'approved', reviewedAt: '2024-03-20' },
      { role: 'Business Owner', name: 'Hendra Kusuma', status: 'pending' },
    ],
    actionItems: [
      { id: 'ai-010', title: 'Revisi arsitektur database', assignee: 'Dewi Rahmawati', dueDate: '2024-03-25', status: 'overdue', priority: 'high' },
      { id: 'ai-011', title: 'Performance testing production env', assignee: 'Reza Firmansyah', dueDate: '2024-04-01', status: 'open', priority: 'high' },
      { id: 'ai-012', title: 'Dokumentasi API endpoint', assignee: 'Dewi Rahmawati', dueDate: '2024-04-05', status: 'open', priority: 'medium' },
    ],
    documents: [
      { id: 'd010', name: 'SRS Document', type: 'SRS', uploaded: true, required: true, uploadedAt: '2024-03-06' },
      { id: 'd011', name: 'Security Assessment', type: 'Security', uploaded: false, required: true },
      { id: 'd012', name: 'DRP Document', type: 'DRP', uploaded: false, required: true },
    ],
    history: [
      { id: 'h010', timestamp: '2024-03-05 10:00', user: 'Dewi Rahmawati', action: 'Pengajuan dibuat' },
      { id: 'h011', timestamp: '2024-03-20 09:00', user: 'Sari Dewi', action: 'O&M review disetujui' },
    ],
    riskScore: 72,
  },
  {
    id: 'app-003', name: 'Pipeline Integrity Management (PIMS)',
    description: 'Sistem manajemen integritas pipa untuk deteksi korosi dan perencanaan maintenance.',
    criticality: 'High', businessOwner: 'Rina Marlina', pic: 'Bagus Wicaksono',
    picOM: 'Maya Anggraini',
    goLiveDate: '2024-04-10', technology: '.NET Core, SQL Server, PowerBI', environment: 'Production',
    status: 'Approved', submittedDate: '2024-01-20', targetHandoverDate: '2024-03-30',
    category: 'Integrity', vendor: 'Baker Hughes Indonesia',
    reviewers: [
      { role: 'Reviewer Teknis', name: 'Reza Firmansyah', status: 'approved', reviewedAt: '2024-02-25' },
      { role: 'O&M Application Support', name: 'Maya Anggraini', status: 'approved', reviewedAt: '2024-02-28' },
      { role: 'Business Owner', name: 'Rina Marlina', status: 'approved', reviewedAt: '2024-03-01' },
    ],
    actionItems: [
      { id: 'ai-020', title: 'Setup monitoring alerts', assignee: 'Bagus Wicaksono', dueDate: '2024-03-15', status: 'completed', priority: 'high' },
    ],
    documents: [
      { id: 'd020', name: 'Technical Design', type: 'SRS', uploaded: true, required: true, uploadedAt: '2024-01-25' },
      { id: 'd021', name: 'User Guide', type: 'Manual', uploaded: true, required: true, uploadedAt: '2024-01-26' },
      { id: 'd022', name: 'SLA Agreement', type: 'SLA', uploaded: true, required: true, uploadedAt: '2024-01-27' },
    ],
    history: [
      { id: 'h020', timestamp: '2024-01-20 08:00', user: 'Bagus Wicaksono', action: 'Pengajuan dibuat' },
      { id: 'h021', timestamp: '2024-03-01 11:00', user: 'Manager O&M', action: 'Semua reviewer telah approve' },
    ],
    riskScore: 25,
  },
  {
    id: 'app-004', name: 'Production Allocation System (PAS)',
    description: 'Sistem alokasi produksi minyak dan gas bumi dari sumur ke fasilitas penyimpanan.',
    criticality: 'Critical', businessOwner: 'Wahyu Hidayat', pic: 'Nina Susanti',
    picOM: 'Fikri Ramadhan',
    goLiveDate: '2024-07-01', technology: 'React, Node.js, PostgreSQL', environment: 'Production',
    status: 'Waiting for O&M Review', submittedDate: '2024-04-01', targetHandoverDate: '2024-06-15',
    category: 'Production', vendor: 'Accenture Indonesia',
    reviewers: [
      { role: 'Reviewer Teknis', name: 'Reza Firmansyah', status: 'pending' },
      { role: 'O&M Application Support', name: 'Fikri Ramadhan', status: 'pending' },
      { role: 'Business Owner', name: 'Wahyu Hidayat', status: 'pending' },
    ],
    actionItems: [
      { id: 'ai-030', title: 'Load testing 10.000 concurrent users', assignee: 'Nina Susanti', dueDate: '2024-04-20', status: 'overdue', priority: 'high' },
    ],
    documents: [
      { id: 'd030', name: 'BRD Document', type: 'BRD', uploaded: true, required: true, uploadedAt: '2024-04-02' },
      { id: 'd031', name: 'Architecture Diagram', type: 'Technical', uploaded: true, required: true, uploadedAt: '2024-04-03' },
    ],
    history: [
      { id: 'h030', timestamp: '2024-04-01 09:00', user: 'Nina Susanti', action: 'Pengajuan dikirim ke O&M' },
    ],
    riskScore: 65,
  },
  {
    id: 'app-005', name: 'Environmental Monitoring Dashboard',
    description: 'Dashboard monitoring parameter lingkungan real-time untuk kepatuhan regulasi.',
    criticality: 'Medium', businessOwner: 'Agus Salim', pic: 'Citra Lestari',
    picOM: 'Sari Dewi',
    goLiveDate: '2024-05-15', technology: 'Vue.js, InfluxDB, Kafka', environment: 'Production',
    status: 'Draft', submittedDate: '2024-04-10', targetHandoverDate: '2024-05-01',
    category: 'HSE', vendor: 'Telkom Indonesia',
    reviewers: [],
    actionItems: [
      { id: 'ai-040', title: 'Konfigurasi sensor IoT', assignee: 'Citra Lestari', dueDate: '2024-04-25', status: 'open', priority: 'medium' },
    ],
    documents: [
      { id: 'd040', name: 'Spesifikasi Teknis', type: 'SRS', uploaded: false, required: true },
    ],
    history: [
      { id: 'h040', timestamp: '2024-04-10 14:00', user: 'Citra Lestari', action: 'Draft dibuat' },
    ],
    riskScore: 30,
  },
  {
    id: 'app-006', name: 'HSE Incident Reporting System',
    description: 'Sistem pelaporan insiden keselamatan dan kesehatan kerja terintegrasi.',
    criticality: 'High', businessOwner: 'Bambang Sutrisno', pic: 'Yudi Hartono',
    picOM: 'Yanto Prasetyo',
    goLiveDate: '2024-02-01', technology: 'Angular, .NET, SQL Server', environment: 'Production',
    status: 'Handover Accepted', submittedDate: '2023-11-01', targetHandoverDate: '2024-01-20',
    category: 'HSE', vendor: 'SAP Indonesia',
    reviewers: [
      { role: 'Reviewer Teknis', name: 'Reza Firmansyah', status: 'approved', reviewedAt: '2023-12-15' },
      { role: 'O&M Application Support', name: 'Yanto Prasetyo', status: 'approved', reviewedAt: '2023-12-18' },
      { role: 'Business Owner', name: 'Bambang Sutrisno', status: 'approved', reviewedAt: '2023-12-20' },
    ],
    actionItems: [
      { id: 'ai-050', title: 'Integrasi dengan HR system', assignee: 'Yudi Hartono', dueDate: '2024-01-15', status: 'completed', priority: 'medium' },
    ],
    documents: [
      { id: 'd050', name: 'System Design Document', type: 'SRS', uploaded: true, required: true },
      { id: 'd051', name: 'User Manual', type: 'Manual', uploaded: true, required: true },
    ],
    history: [
      { id: 'h050', timestamp: '2023-11-01 09:00', user: 'Yudi Hartono', action: 'Pengajuan dibuat' },
      { id: 'h051', timestamp: '2024-01-20 10:00', user: 'Manager O&M', action: 'Handover diterima' },
    ],
    riskScore: 8,
  },
  {
    id: 'app-007', name: 'Upstream Data Analytics Platform',
    description: 'Platform analytics data upstream dengan kemampuan machine learning untuk prediksi produksi.',
    criticality: 'High', businessOwner: 'Slamet Riyadi', pic: 'Anisa Putri',
    picOM: 'Maya Anggraini',
    goLiveDate: '2024-08-01', technology: 'Python, Spark, Databricks, Azure ML', environment: 'Cloud',
    status: 'Under Technical Review', submittedDate: '2024-03-15', targetHandoverDate: '2024-07-15',
    category: 'Analytics', vendor: 'Microsoft Indonesia',
    reviewers: [
      { role: 'Reviewer Teknis', name: 'Reza Firmansyah', status: 'approved_with_condition', notes: 'Perlu penanganan data sensitivity', reviewedAt: '2024-04-05' },
      { role: 'O&M Application Support', name: 'Maya Anggraini', status: 'pending' },
      { role: 'Business Owner', name: 'Slamet Riyadi', status: 'pending' },
    ],
    actionItems: [
      { id: 'ai-060', title: 'Data classification review', assignee: 'Anisa Putri', dueDate: '2024-04-10', status: 'overdue', priority: 'high' },
      { id: 'ai-061', title: 'Security pentest environment cloud', assignee: 'Reza Firmansyah', dueDate: '2024-04-15', status: 'open', priority: 'high' },
    ],
    documents: [
      { id: 'd060', name: 'Architecture Design', type: 'Technical', uploaded: true, required: true },
      { id: 'd061', name: 'Data Privacy Assessment', type: 'Security', uploaded: false, required: true },
    ],
    history: [
      { id: 'h060', timestamp: '2024-03-15 10:00', user: 'Anisa Putri', action: 'Pengajuan dibuat' },
      { id: 'h061', timestamp: '2024-04-05 09:00', user: 'Reza Firmansyah', action: 'Review teknis: Approve with condition' },
    ],
    riskScore: 68,
  },
  {
    id: 'app-008', name: 'Contract Management System (CMS)',
    description: 'Sistem manajemen kontrak vendor dan supplier terintegrasi dengan procurement.',
    criticality: 'Medium', businessOwner: 'Lina Wahyuni', pic: 'Doni Setiawan',
    picOM: 'Fikri Ramadhan',
    goLiveDate: '2024-03-20', technology: 'SAP Ariba, ABAP', environment: 'Production',
    status: 'Handover Accepted', submittedDate: '2023-12-01', targetHandoverDate: '2024-03-01',
    category: 'Procurement', vendor: 'SAP Indonesia',
    reviewers: [
      { role: 'Reviewer Teknis', name: 'Reza Firmansyah', status: 'approved', reviewedAt: '2024-02-01' },
      { role: 'O&M Application Support', name: 'Fikri Ramadhan', status: 'approved', reviewedAt: '2024-02-03' },
      { role: 'Business Owner', name: 'Lina Wahyuni', status: 'approved', reviewedAt: '2024-02-05' },
    ],
    actionItems: [],
    documents: [
      { id: 'd070', name: 'Functional Spec', type: 'SRS', uploaded: true, required: true },
      { id: 'd071', name: 'Integration Guide', type: 'Technical', uploaded: true, required: true },
    ],
    history: [
      { id: 'h070', timestamp: '2023-12-01 09:00', user: 'Doni Setiawan', action: 'Pengajuan dibuat' },
      { id: 'h071', timestamp: '2024-03-01 11:00', user: 'Manager O&M', action: 'Final approval diberikan' },
    ],
    riskScore: 10,
  },
  {
    id: 'app-009', name: 'Enterprise Asset Management (EAM)',
    description: 'Sistem manajemen aset enterprise untuk peralatan dan infrastruktur lapangan.',
    criticality: 'High', businessOwner: 'Taufik Hidayatullah', pic: 'Ratna Sari',
    picOM: 'Sari Dewi',
    goLiveDate: '2024-09-01', technology: 'Maximo, IBM WebSphere', environment: 'On-Premise',
    status: 'Waiting for O&M Review', submittedDate: '2024-04-15', targetHandoverDate: '2024-08-15',
    category: 'Asset', vendor: 'IBM Indonesia',
    reviewers: [
      { role: 'Reviewer Teknis', name: 'Reza Firmansyah', status: 'pending' },
      { role: 'O&M Application Support', name: 'Sari Dewi', status: 'pending' },
      { role: 'Business Owner', name: 'Taufik Hidayatullah', status: 'pending' },
    ],
    actionItems: [
      { id: 'ai-080', title: 'Migrasi data dari sistem legacy', assignee: 'Ratna Sari', dueDate: '2024-05-01', status: 'open', priority: 'high' },
      { id: 'ai-081', title: 'Konfigurasi workflow approval', assignee: 'Ratna Sari', dueDate: '2024-05-10', status: 'open', priority: 'medium' },
    ],
    documents: [
      { id: 'd080', name: 'BRD Document', type: 'BRD', uploaded: true, required: true },
      { id: 'd081', name: 'Migration Plan', type: 'Technical', uploaded: false, required: true },
    ],
    history: [
      { id: 'h080', timestamp: '2024-04-15 09:00', user: 'Ratna Sari', action: 'Pengajuan dikirim ke O&M' },
    ],
    riskScore: 45,
  },
  {
    id: 'app-010', name: 'Refinery Process Control System',
    description: 'Sistem kontrol proses kilang minyak dengan DCS dan supervisory control.',
    criticality: 'Critical', businessOwner: 'Hariyanto Susilo', pic: 'Eko Prasetyo',
    picOM: 'Yanto Prasetyo',
    goLiveDate: '2024-10-01', technology: 'Honeywell DCS, OPC UA, SCADA', environment: 'OT Network',
    status: 'Draft', submittedDate: '2024-04-20', targetHandoverDate: '2024-09-15',
    category: 'Operations', vendor: 'Honeywell Indonesia',
    reviewers: [],
    actionItems: [
      { id: 'ai-090', title: 'OT security assessment', assignee: 'Eko Prasetyo', dueDate: '2024-05-15', status: 'open', priority: 'high' },
    ],
    documents: [],
    history: [
      { id: 'h090', timestamp: '2024-04-20 08:00', user: 'Eko Prasetyo', action: 'Draft dibuat' },
    ],
    riskScore: 55,
  },
  {
    id: 'app-011', name: 'Financial Reporting Module',
    description: 'Modul pelaporan keuangan terintegrasi dengan SAP ERP untuk konsolidasi laporan bulanan.',
    criticality: 'High', businessOwner: 'Sri Mulyani', pic: 'Fajar Nugroho',
    picOM: 'Maya Anggraini',
    goLiveDate: '2024-04-30', technology: 'SAP BW, Crystal Reports, SAP HANA', environment: 'Production',
    status: 'Approved', submittedDate: '2024-01-15', targetHandoverDate: '2024-04-15',
    category: 'Finance', vendor: 'SAP Indonesia',
    reviewers: [
      { role: 'Reviewer Teknis', name: 'Reza Firmansyah', status: 'approved', reviewedAt: '2024-03-10' },
      { role: 'O&M Application Support', name: 'Maya Anggraini', status: 'approved', reviewedAt: '2024-03-12' },
      { role: 'Business Owner', name: 'Sri Mulyani', status: 'approved', reviewedAt: '2024-03-15' },
    ],
    actionItems: [],
    documents: [
      { id: 'd100', name: 'Functional Design Doc', type: 'SRS', uploaded: true, required: true },
      { id: 'd101', name: 'User Acceptance Test', type: 'UAT', uploaded: true, required: true },
    ],
    history: [
      { id: 'h100', timestamp: '2024-01-15 09:00', user: 'Fajar Nugroho', action: 'Pengajuan dibuat' },
      { id: 'h101', timestamp: '2024-03-15 11:00', user: 'Manager O&M', action: 'Semua reviewer approve' },
    ],
    riskScore: 18,
  },
  {
    id: 'app-012', name: 'Geospatial Data Platform (GeoPlat)',
    description: 'Platform data geospasial untuk pemetaan blok migas, sumur, dan infrastruktur pipa.',
    criticality: 'Medium', businessOwner: 'Dian Pertiwi', pic: 'Rizky Maulana',
    picOM: 'Fikri Ramadhan',
    goLiveDate: '2024-06-15', technology: 'ArcGIS Enterprise, PostGIS, Python', environment: 'Cloud',
    status: 'Under Technical Review', submittedDate: '2024-03-01', targetHandoverDate: '2024-06-01',
    category: 'Geospatial', vendor: 'Esri Indonesia',
    reviewers: [
      { role: 'Reviewer Teknis', name: 'Reza Firmansyah', status: 'pending' },
      { role: 'O&M Application Support', name: 'Fikri Ramadhan', status: 'approved_with_condition', notes: 'Perlu SLA khusus untuk cloud service', reviewedAt: '2024-03-25' },
      { role: 'Business Owner', name: 'Dian Pertiwi', status: 'pending' },
    ],
    actionItems: [
      { id: 'ai-110', title: 'Review SLA cloud service provider', assignee: 'Rizky Maulana', dueDate: '2024-04-01', status: 'overdue', priority: 'medium' },
    ],
    documents: [
      { id: 'd110', name: 'Architecture Document', type: 'Technical', uploaded: true, required: true },
      { id: 'd111', name: 'Cloud SLA Agreement', type: 'SLA', uploaded: false, required: true },
    ],
    history: [
      { id: 'h110', timestamp: '2024-03-01 09:00', user: 'Rizky Maulana', action: 'Pengajuan dibuat' },
    ],
    riskScore: 48,
  },
  {
    id: 'app-013', name: 'Maintenance Work Order System',
    description: 'Sistem work order maintenance terpusat dengan mobile app untuk teknisi lapangan.',
    criticality: 'Medium', businessOwner: 'Surya Darma', pic: 'Maya Indah',
    picOM: 'Sari Dewi',
    goLiveDate: '2024-02-15', technology: 'React Native, Node.js, MongoDB', environment: 'Hybrid',
    status: 'Handover Accepted', submittedDate: '2023-10-15', targetHandoverDate: '2024-02-01',
    category: 'Maintenance', vendor: 'Lokal - Internal IT',
    reviewers: [
      { role: 'Reviewer Teknis', name: 'Reza Firmansyah', status: 'approved', reviewedAt: '2023-12-20' },
      { role: 'O&M Application Support', name: 'Sari Dewi', status: 'approved', reviewedAt: '2023-12-22' },
      { role: 'Business Owner', name: 'Surya Darma', status: 'approved', reviewedAt: '2023-12-24' },
    ],
    actionItems: [],
    documents: [
      { id: 'd120', name: 'SRS Document', type: 'SRS', uploaded: true, required: true },
      { id: 'd121', name: 'Mobile App User Guide', type: 'Manual', uploaded: true, required: true },
    ],
    history: [
      { id: 'h120', timestamp: '2023-10-15 09:00', user: 'Maya Indah', action: 'Pengajuan dibuat' },
      { id: 'h121', timestamp: '2024-02-01 10:00', user: 'Manager O&M', action: 'Handover diterima' },
    ],
    riskScore: 5,
  },
  {
    id: 'app-014', name: 'Safety Permit System (e-Permit)',
    description: 'Sistem permit kerja elektronik untuk pengendalian pekerjaan berbahaya di lapangan.',
    criticality: 'Critical', businessOwner: 'Agung Nugroho', pic: 'Dita Maharani',
    picOM: 'Yanto Prasetyo',
    goLiveDate: '2024-07-15', technology: 'Angular, .NET Core, SQL Server', environment: 'Production',
    status: 'Rejected', submittedDate: '2024-02-15', targetHandoverDate: '2024-06-30',
    category: 'HSE', vendor: 'Innovasi Digital Indonesia',
    reviewers: [
      { role: 'Reviewer Teknis', name: 'Reza Firmansyah', status: 'rejected', notes: 'Terdapat kelemahan keamanan kritis pada modul autentikasi. Diperlukan penetration test ulang.', reviewedAt: '2024-03-10' },
      { role: 'O&M Application Support', name: 'Yanto Prasetyo', status: 'approved', reviewedAt: '2024-03-08' },
      { role: 'Business Owner', name: 'Agung Nugroho', status: 'pending' },
    ],
    actionItems: [
      { id: 'ai-130', title: 'Perbaikan vulnerability autentikasi', assignee: 'Dita Maharani', dueDate: '2024-03-30', status: 'overdue', priority: 'high' },
      { id: 'ai-131', title: 'Penetration test ulang', assignee: 'Reza Firmansyah', dueDate: '2024-04-15', status: 'open', priority: 'high' },
    ],
    documents: [
      { id: 'd130', name: 'Security Assessment', type: 'Security', uploaded: true, required: true },
      { id: 'd131', name: 'Pen Test Report', type: 'Security', uploaded: true, required: true },
    ],
    history: [
      { id: 'h130', timestamp: '2024-02-15 09:00', user: 'Dita Maharani', action: 'Pengajuan dibuat' },
      { id: 'h131', timestamp: '2024-03-10 14:00', user: 'Reza Firmansyah', action: 'Review ditolak: kelemahan keamanan kritis' },
    ],
    riskScore: 88,
  },
  {
    id: 'app-015', name: 'Energy Trading Platform',
    description: 'Platform trading energi real-time dengan integrasi ke bursa komoditas nasional.',
    criticality: 'Critical', businessOwner: 'Prasetyo Nugroho', pic: 'Galuh Aditya',
    picOM: 'Maya Anggraini',
    goLiveDate: '2024-11-01', technology: 'Java, Kafka, Redis, Oracle', environment: 'Production',
    status: 'Draft', submittedDate: '2024-04-25', targetHandoverDate: '2024-10-15',
    category: 'Trading', vendor: 'Finastra Indonesia',
    reviewers: [],
    actionItems: [],
    documents: [],
    history: [
      { id: 'h140', timestamp: '2024-04-25 09:00', user: 'Galuh Aditya', action: 'Draft dibuat' },
    ],
    riskScore: 40,
  },
  {
    id: 'app-016', name: 'Subsurface Data Repository',
    description: 'Repositori data bawah permukaan terpusat untuk seismik, log sumur, dan core data.',
    criticality: 'High', businessOwner: 'Hendrik Purnama', pic: 'Septia Wulandari',
    picOM: 'Fikri Ramadhan',
    goLiveDate: '2024-05-01', technology: 'Petrel Studio, OpenWorks, Python', environment: 'On-Premise',
    status: 'Waiting for O&M Review', submittedDate: '2024-03-20', targetHandoverDate: '2024-04-25',
    category: 'Geoscience', vendor: 'Schlumberger Indonesia',
    reviewers: [
      { role: 'Reviewer Teknis', name: 'Reza Firmansyah', status: 'pending' },
      { role: 'O&M Application Support', name: 'Fikri Ramadhan', status: 'pending' },
      { role: 'Business Owner', name: 'Hendrik Purnama', status: 'pending' },
    ],
    actionItems: [
      { id: 'ai-150', title: 'Konfigurasi backup otomatis 3-2-1', assignee: 'Septia Wulandari', dueDate: '2024-04-10', status: 'overdue', priority: 'high' },
    ],
    documents: [
      { id: 'd150', name: 'Data Architecture', type: 'Technical', uploaded: true, required: true },
      { id: 'd151', name: 'Backup & Recovery Plan', type: 'DRP', uploaded: false, required: true },
    ],
    history: [
      { id: 'h150', timestamp: '2024-03-20 09:00', user: 'Septia Wulandari', action: 'Pengajuan dikirim ke O&M' },
    ],
    riskScore: 62,
  },
  {
    id: 'app-017', name: 'LIMS - Laboratory Information Mgmt',
    description: 'Sistem informasi laboratorium untuk tracking sampel, analisis, dan hasil uji kualitas.',
    criticality: 'Medium', businessOwner: 'Rini Astuti', pic: 'Bowo Setiabudi',
    picOM: 'Sari Dewi',
    goLiveDate: '2024-03-01', technology: 'LABWARE LIMS, Oracle, Python', environment: 'Production',
    status: 'Handover Accepted', submittedDate: '2023-11-15', targetHandoverDate: '2024-02-15',
    category: 'Laboratory', vendor: 'LabWare APAC',
    reviewers: [
      { role: 'Reviewer Teknis', name: 'Reza Firmansyah', status: 'approved', reviewedAt: '2024-01-15' },
      { role: 'O&M Application Support', name: 'Sari Dewi', status: 'approved', reviewedAt: '2024-01-17' },
      { role: 'Business Owner', name: 'Rini Astuti', status: 'approved', reviewedAt: '2024-01-20' },
    ],
    actionItems: [],
    documents: [
      { id: 'd160', name: 'LIMS Configuration Guide', type: 'Manual', uploaded: true, required: true },
    ],
    history: [
      { id: 'h160', timestamp: '2023-11-15 09:00', user: 'Bowo Setiabudi', action: 'Pengajuan dibuat' },
      { id: 'h161', timestamp: '2024-02-15 10:00', user: 'Manager O&M', action: 'Handover diterima' },
    ],
    riskScore: 7,
  },
  {
    id: 'app-018', name: 'Drilling Operations Dashboard',
    description: 'Dashboard operasional pengeboran real-time dengan integrasi MWD/LWD data.',
    criticality: 'High', businessOwner: 'Guntur Santosa', pic: 'Nurul Hidayah',
    picOM: 'Yanto Prasetyo',
    goLiveDate: '2024-08-15', technology: 'React, Python, TimescaleDB', environment: 'Cloud',
    status: 'Under Technical Review', submittedDate: '2024-03-25', targetHandoverDate: '2024-07-30',
    category: 'Drilling', vendor: 'Weatherford Indonesia',
    reviewers: [
      { role: 'Reviewer Teknis', name: 'Reza Firmansyah', status: 'approved_with_condition', notes: 'Perlu validasi integrasi data MWD dengan format WITSML', reviewedAt: '2024-04-15' },
      { role: 'O&M Application Support', name: 'Yanto Prasetyo', status: 'pending' },
      { role: 'Business Owner', name: 'Guntur Santosa', status: 'pending' },
    ],
    actionItems: [
      { id: 'ai-170', title: 'Validasi format WITSML data feed', assignee: 'Nurul Hidayah', dueDate: '2024-04-20', status: 'open', priority: 'high' },
    ],
    documents: [
      { id: 'd170', name: 'Integration Spec WITSML', type: 'Technical', uploaded: true, required: true },
    ],
    history: [
      { id: 'h170', timestamp: '2024-03-25 09:00', user: 'Nurul Hidayah', action: 'Pengajuan dibuat' },
    ],
    riskScore: 52,
  },
  {
    id: 'app-019', name: 'Vendor Portal',
    description: 'Portal kolaborasi vendor untuk submission invoice, dokumen, dan status kontrak.',
    criticality: 'Low', businessOwner: 'Endang Susilowati', pic: 'Hadi Prabowo',
    picOM: 'Maya Anggraini',
    goLiveDate: '2024-04-01', technology: 'Next.js, Supabase, Tailwind', environment: 'Cloud',
    status: 'Approved', submittedDate: '2024-01-25', targetHandoverDate: '2024-03-25',
    category: 'Procurement', vendor: 'Lokal - Internal IT',
    reviewers: [
      { role: 'Reviewer Teknis', name: 'Reza Firmansyah', status: 'approved', reviewedAt: '2024-03-05' },
      { role: 'O&M Application Support', name: 'Maya Anggraini', status: 'approved', reviewedAt: '2024-03-07' },
      { role: 'Business Owner', name: 'Endang Susilowati', status: 'approved', reviewedAt: '2024-03-10' },
    ],
    actionItems: [],
    documents: [
      { id: 'd180', name: 'User Guide Vendor', type: 'Manual', uploaded: true, required: true },
    ],
    history: [
      { id: 'h180', timestamp: '2024-01-25 09:00', user: 'Hadi Prabowo', action: 'Pengajuan dibuat' },
      { id: 'h181', timestamp: '2024-03-10 11:00', user: 'Manager O&M', action: 'Semua reviewer approve' },
    ],
    riskScore: 15,
  },
  {
    id: 'app-020', name: 'Regulatory Compliance Tracker',
    description: 'Tracker kepatuhan regulasi SKK Migas, ESDM, dan regulasi K3 untuk seluruh operasi.',
    criticality: 'High', businessOwner: 'Widodo Prasetyo', pic: 'Yeni Rahayu',
    picOM: 'Fikri Ramadhan',
    goLiveDate: '2024-06-30', technology: 'React, Django, PostgreSQL', environment: 'On-Premise',
    status: 'Waiting for O&M Review', submittedDate: '2024-04-05', targetHandoverDate: '2024-06-15',
    category: 'Compliance', vendor: 'Lokal - Internal IT',
    reviewers: [
      { role: 'Reviewer Teknis', name: 'Reza Firmansyah', status: 'pending' },
      { role: 'O&M Application Support', name: 'Fikri Ramadhan', status: 'pending' },
      { role: 'Business Owner', name: 'Widodo Prasetyo', status: 'pending' },
    ],
    actionItems: [
      { id: 'ai-190', title: 'Mapping regulasi SKK Migas terbaru', assignee: 'Yeni Rahayu', dueDate: '2024-04-20', status: 'open', priority: 'medium' },
    ],
    documents: [
      { id: 'd190', name: 'Compliance Matrix', type: 'BRD', uploaded: true, required: true },
    ],
    history: [
      { id: 'h190', timestamp: '2024-04-05 09:00', user: 'Yeni Rahayu', action: 'Pengajuan dikirim ke O&M' },
    ],
    riskScore: 42,
  },
  {
    id: 'app-021', name: 'Field Operations Mobile App',
    description: 'Aplikasi mobile offline-first untuk teknisi lapangan, daily report, dan survei.',
    criticality: 'Medium', businessOwner: 'Arif Wibawa', pic: 'Sinta Dewi',
    picOM: 'Sari Dewi',
    goLiveDate: '2024-05-30', technology: 'Flutter, Firebase, SQLite', environment: 'Mobile',
    status: 'Under Technical Review', submittedDate: '2024-03-10', targetHandoverDate: '2024-05-15',
    category: 'Operations', vendor: 'Lokal - Internal IT',
    reviewers: [
      { role: 'Reviewer Teknis', name: 'Reza Firmansyah', status: 'pending' },
      { role: 'O&M Application Support', name: 'Sari Dewi', status: 'approved', reviewedAt: '2024-04-01' },
      { role: 'Business Owner', name: 'Arif Wibawa', status: 'approved', reviewedAt: '2024-04-03' },
    ],
    actionItems: [
      { id: 'ai-200', title: 'UAT di lapangan Madura', assignee: 'Sinta Dewi', dueDate: '2024-04-15', status: 'open', priority: 'medium' },
    ],
    documents: [
      { id: 'd200', name: 'Mobile App Design', type: 'Technical', uploaded: true, required: true },
      { id: 'd201', name: 'Offline Sync Architecture', type: 'Technical', uploaded: true, required: true },
    ],
    history: [
      { id: 'h200', timestamp: '2024-03-10 09:00', user: 'Sinta Dewi', action: 'Pengajuan dibuat' },
    ],
    riskScore: 35,
  },
  {
    id: 'app-022', name: 'Real-Time Production Dashboard',
    description: 'Dashboard produksi real-time dengan integrasi PI System dan OSIsoft.',
    criticality: 'Critical', businessOwner: 'Basuki Rahmad', pic: 'Wulandari Sari',
    picOM: 'Yanto Prasetyo',
    goLiveDate: '2024-04-20', technology: 'OSIsoft PI, Power BI Embedded, React', environment: 'On-Premise',
    status: 'Rejected', submittedDate: '2024-01-30', targetHandoverDate: '2024-04-01',
    category: 'Operations', vendor: 'OSIsoft Asia',
    reviewers: [
      { role: 'Reviewer Teknis', name: 'Reza Firmansyah', status: 'approved', reviewedAt: '2024-03-01' },
      { role: 'O&M Application Support', name: 'Yanto Prasetyo', status: 'rejected', notes: 'Konfigurasi HA/DR belum memenuhi standar RTO < 4 jam. Perlu redesign arsitektur.', reviewedAt: '2024-03-05' },
      { role: 'Business Owner', name: 'Basuki Rahmad', status: 'pending' },
    ],
    actionItems: [
      { id: 'ai-210', title: 'Redesign arsitektur HA/DR', assignee: 'Wulandari Sari', dueDate: '2024-03-25', status: 'overdue', priority: 'high' },
    ],
    documents: [
      { id: 'd210', name: 'HA/DR Architecture', type: 'DRP', uploaded: true, required: true },
    ],
    history: [
      { id: 'h210', timestamp: '2024-01-30 09:00', user: 'Wulandari Sari', action: 'Pengajuan dibuat' },
      { id: 'h211', timestamp: '2024-03-05 14:00', user: 'Sari Dewi', action: 'Review ditolak: HA/DR tidak memenuhi standar' },
    ],
    riskScore: 80,
  },
  {
    id: 'app-023', name: 'Supply Chain Optimization Tool',
    description: 'Tools optimasi rantai pasok material drilling dan produksi berbasis ML.',
    criticality: 'Medium', businessOwner: 'Dewanto Haryono', pic: 'Larasati Putri',
    picOM: 'Maya Anggraini',
    goLiveDate: '2024-07-30', technology: 'Python, scikit-learn, FastAPI, React', environment: 'Cloud',
    status: 'Draft', submittedDate: '2024-04-22', targetHandoverDate: '2024-07-15',
    category: 'Supply Chain', vendor: 'Lokal - Internal IT',
    reviewers: [],
    actionItems: [],
    documents: [
      { id: 'd220', name: 'Feasibility Study', type: 'BRD', uploaded: true, required: false },
    ],
    history: [
      { id: 'h220', timestamp: '2024-04-22 10:00', user: 'Larasati Putri', action: 'Draft dibuat' },
    ],
    riskScore: 22,
  },
  {
    id: 'app-024', name: 'HR Self-Service Portal',
    description: 'Portal mandiri karyawan untuk cuti, payslip, reimbursement, dan pengembangan karir.',
    criticality: 'Low', businessOwner: 'Imas Rosyidah', pic: 'Gilang Permana',
    picOM: 'Fikri Ramadhan',
    goLiveDate: '2024-01-15', technology: 'SAP SuccessFactors, Fiori', environment: 'Cloud',
    status: 'Handover Accepted', submittedDate: '2023-09-01', targetHandoverDate: '2024-01-01',
    category: 'HR', vendor: 'SAP Indonesia',
    reviewers: [
      { role: 'Reviewer Teknis', name: 'Reza Firmansyah', status: 'approved', reviewedAt: '2023-11-20' },
      { role: 'O&M Application Support', name: 'Fikri Ramadhan', status: 'approved', reviewedAt: '2023-11-22' },
      { role: 'Business Owner', name: 'Imas Rosyidah', status: 'approved', reviewedAt: '2023-11-25' },
    ],
    actionItems: [],
    documents: [
      { id: 'd230', name: 'Employee User Guide', type: 'Manual', uploaded: true, required: true },
    ],
    history: [
      { id: 'h230', timestamp: '2023-09-01 09:00', user: 'Gilang Permana', action: 'Pengajuan dibuat' },
      { id: 'h231', timestamp: '2024-01-01 10:00', user: 'Manager O&M', action: 'Handover diterima' },
    ],
    riskScore: 3,
  },
  {
    id: 'app-025', name: 'Document Management System (eDMS)',
    description: 'Sistem manajemen dokumen elektronik perusahaan dengan versioning dan approval workflow.',
    criticality: 'Medium', businessOwner: 'Suparno Wibowo', pic: 'Ratih Kusumawati',
    picOM: 'Sari Dewi',
    goLiveDate: '2024-06-01', technology: 'OpenText, SharePoint, MS365', environment: 'Hybrid',
    status: 'Waiting for O&M Review', submittedDate: '2024-03-28', targetHandoverDate: '2024-05-20',
    category: 'Document', vendor: 'OpenText Indonesia',
    reviewers: [
      { role: 'Reviewer Teknis', name: 'Reza Firmansyah', status: 'pending' },
      { role: 'O&M Application Support', name: 'Sari Dewi', status: 'pending' },
      { role: 'Business Owner', name: 'Suparno Wibowo', status: 'pending' },
    ],
    actionItems: [
      { id: 'ai-240', title: 'Klasifikasi dokumen sensitif', assignee: 'Ratih Kusumawati', dueDate: '2024-04-15', status: 'open', priority: 'medium' },
    ],
    documents: [
      { id: 'd240', name: 'System Architecture', type: 'Technical', uploaded: true, required: true },
      { id: 'd241', name: 'Document Classification Policy', type: 'BRD', uploaded: false, required: true },
    ],
    history: [
      { id: 'h240', timestamp: '2024-03-28 09:00', user: 'Ratih Kusumawati', action: 'Pengajuan dikirim ke O&M' },
    ],
    riskScore: 38,
  },
]

export const INITIAL_CHECKLIST_ITEMS: ChecklistItem[] = [
  { id: 'cl-001', text: 'Dokumentasi arsitektur sistem telah lengkap', criticality: ['Critical', 'High', 'Medium', 'Low'], required: true },
  { id: 'cl-002', text: 'User manual tersedia dan sudah divalidasi pengguna', criticality: ['Critical', 'High', 'Medium', 'Low'], required: true },
  { id: 'cl-003', text: 'Semua defect severity 1 (critical) sudah ditutup', criticality: ['Critical', 'High', 'Medium', 'Low'], required: true },
  { id: 'cl-004', text: 'Training O&M team telah dilaksanakan', criticality: ['Critical', 'High', 'Medium', 'Low'], required: true },
  { id: 'cl-005', text: 'SLA agreement sudah ditandatangani', criticality: ['Critical', 'High', 'Medium'], required: true },
  { id: 'cl-006', text: 'Monitoring dan alerting sudah dikonfigurasi', criticality: ['Critical', 'High', 'Medium'], required: true },
  { id: 'cl-007', text: 'Disaster Recovery Plan (DRP) sudah diuji', criticality: ['Critical', 'High'], required: true },
  { id: 'cl-008', text: 'Security assessment sudah dilakukan', criticality: ['Critical', 'High'], required: true },
  { id: 'cl-009', text: 'Penetration testing sudah selesai dan laporan tersedia', criticality: ['Critical', 'High'], required: true },
  { id: 'cl-010', text: 'Data backup & recovery prosedur sudah diverifikasi', criticality: ['Critical', 'High'], required: true },
  { id: 'cl-011', text: 'High Availability (HA) konfigurasi sudah divalidasi', criticality: ['Critical'], required: true },
  { id: 'cl-012', text: 'Runbook operasional sudah dibuat dan diverifikasi O&M', criticality: ['Critical'], required: true },
  { id: 'cl-013', text: 'Load testing dengan minimum 2x kapasitas peak sudah dilakukan', criticality: ['Critical'], required: true },
  { id: 'cl-014', text: 'Security hardening checklist (CIS Benchmark) sudah diterapkan', criticality: ['Critical'], required: true },
  { id: 'cl-015', text: 'RTO & RPO sudah diuji dan didokumentasikan', criticality: ['Critical'], required: true },
  { id: 'cl-016', text: 'Integrasi sistem sudah diuji end-to-end', criticality: ['Critical', 'High', 'Medium'], required: false },
  { id: 'cl-017', text: 'Semua defect severity 2 (high) sudah ditangani', criticality: ['Critical', 'High'], required: false },
  { id: 'cl-018', text: 'Change management plan sudah disiapkan', criticality: ['Critical', 'High', 'Medium', 'Low'], required: false },
  // Item khusus per kategori/jenis aplikasi — melengkapi item generik di atas,
  // sesuai kebutuhan fungsional #3: checklist dibedakan berdasarkan jenis & criticality.
  { id: 'cl-019', text: 'Kesiapan integrasi dan monitoring SCADA/OT sudah diverifikasi', criticality: ['Critical', 'High', 'Medium', 'Low'], category: ['Operations', 'Upstream', 'Production', 'Drilling', 'Integrity'], required: true },
  { id: 'cl-020', text: 'Rekonsiliasi dan validasi data keuangan sudah dilakukan', criticality: ['Critical', 'High', 'Medium', 'Low'], category: ['Finance', 'Procurement', 'Supply Chain', 'Trading'], required: true },
  { id: 'cl-021', text: 'Kepatuhan terhadap regulasi HSE sudah divalidasi', criticality: ['Critical', 'High', 'Medium', 'Low'], category: ['HSE'], required: true },
  { id: 'cl-022', text: 'Perlindungan data pribadi (PII) karyawan sudah diverifikasi', criticality: ['Critical', 'High', 'Medium', 'Low'], category: ['HR'], required: true },
  { id: 'cl-023', text: 'Validasi akurasi data geospasial/pemetaan sudah dilakukan', criticality: ['Critical', 'High', 'Medium', 'Low'], category: ['Geospatial', 'Geoscience'], required: false },
]

export const INITIAL_USERS: User[] = [
  { id: 'u-001', name: 'Andi Pratama', role: 'Project Manager', email: 'andi.pratama@energi.co.id', active: true },
  { id: 'u-002', name: 'Sari Dewi', role: 'O&M Application Support', email: 'sari.dewi@energi.co.id', active: true },
  { id: 'u-009', name: 'Yanto Prasetyo', role: 'O&M Application Support', email: 'yanto.p@energi.co.id', active: true },
  { id: 'u-010', name: 'Maya Anggraini', role: 'O&M Application Support', email: 'maya.a@energi.co.id', active: true },
  { id: 'u-011', name: 'Fikri Ramadhan', role: 'O&M Application Support', email: 'fikri.r@energi.co.id', active: true },
  { id: 'u-003', name: 'Reza Firmansyah', role: 'Reviewer Teknis', email: 'reza.f@energi.co.id', active: true },
  { id: 'u-004', name: 'Budi Santoso', role: 'Business Owner', email: 'budi.s@energi.co.id', active: true },
  { id: 'u-005', name: 'Pak Haryanto', role: 'Manager O&M', email: 'haryanto@energi.co.id', active: true },
  { id: 'u-006', name: 'Admin Sistem', role: 'System Administrator', email: 'admin@energi.co.id', active: true },
  { id: 'u-007', name: 'Dewi Rahmawati', role: 'Project Manager', email: 'dewi.r@energi.co.id', active: true },
  { id: 'u-008', name: 'Nina Susanti', role: 'Project Manager', email: 'nina.s@energi.co.id', active: false },
]

export const INITIAL_PIC_LIST: MasterPIC[] = [
  { id: 'p-001', name: 'Andi Pratama', email: 'andi.pratama@energi.co.id', department: 'IT Project', phone: '0812-1111-0001' },
  { id: 'p-002', name: 'Dewi Rahmawati', email: 'dewi.r@energi.co.id', department: 'IT Project', phone: '0812-1111-0002' },
  { id: 'p-003', name: 'Nina Susanti', email: 'nina.s@energi.co.id', department: 'Production IT', phone: '0812-1111-0003' },
  { id: 'p-004', name: 'Bagus Wicaksono', email: 'bagus.w@energi.co.id', department: 'Integrity IT', phone: '0812-1111-0004' },
  { id: 'p-005', name: 'Citra Lestari', email: 'citra.l@energi.co.id', department: 'HSE IT', phone: '0812-1111-0005' },
  { id: 'p-006', name: 'Yudi Hartono', email: 'yudi.h@energi.co.id', department: 'HSE IT', phone: '0812-1111-0006' },
]

export const INITIAL_VENDORS: MasterVendor[] = [
  { id: 'v-001', name: 'Schlumberger Indonesia', contact: 'John Smith', email: 'john.s@slb.com', category: 'Oilfield Services' },
  { id: 'v-002', name: 'Halliburton Indonesia', contact: 'Maria Chen', email: 'maria.c@hal.com', category: 'Oilfield Services' },
  { id: 'v-003', name: 'SAP Indonesia', contact: 'Ari Wibowo', email: 'ari.w@sap.com', category: 'ERP' },
  { id: 'v-004', name: 'IBM Indonesia', contact: 'Robert Tan', email: 'r.tan@ibm.com', category: 'IT Infrastructure' },
  { id: 'v-005', name: 'Lokal - Internal IT', contact: 'Tim IT Internal', email: 'it@energi.co.id', category: 'Internal' },
  { id: 'v-006', name: 'Microsoft Indonesia', contact: 'James Lee', email: 'j.lee@microsoft.com', category: 'Cloud' },
]

export const INITIAL_ENVIRONMENTS: MasterEnvironment[] = [
  { id: 'e-001', name: 'Production', description: 'Environment produksi utama', server: 'prod-svr-01.energi.co.id' },
  { id: 'e-002', name: 'Cloud', description: 'Cloud environment (Azure/AWS)', server: 'azure.energi.co.id' },
  { id: 'e-003', name: 'On-Premise', description: 'Server on-premise datacenter', server: 'dc-svr-01.energi.co.id' },
  { id: 'e-004', name: 'Hybrid', description: 'Kombinasi cloud dan on-premise', server: 'hybrid.energi.co.id' },
  { id: 'e-005', name: 'OT Network', description: 'Operational Technology network', server: 'ot-svr-01.energi.co.id' },
  { id: 'e-006', name: 'Mobile', description: 'Mobile app distribution', server: 'Play Store / App Store' },
]

export const INITIAL_STATE: AppState = {
  applications: INITIAL_APPS,
  users: INITIAL_USERS,
  checklistItems: INITIAL_CHECKLIST_ITEMS,
  picList: INITIAL_PIC_LIST,
  vendors: INITIAL_VENDORS,
  environments: INITIAL_ENVIRONMENTS,
}

export function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'Draft': return 'badge-draft'
    case 'Waiting for O&M Review': return 'badge-waiting'
    case 'Under Technical Review': return 'badge-review'
    case 'Rejected': return 'badge-rejected'
    case 'Approved': return 'badge-approved'
    case 'Handover Accepted': return 'badge-accepted'
    default: return 'badge-draft'
  }
}

export function calcRiskScore(app: Application): number {
  let score = 0
  const overdueItems = app.actionItems.filter(a => a.status === 'overdue').length
  score += overdueItems * 15
  const rejectedReviewers = app.reviewers.filter(r => r.status === 'rejected').length
  score += rejectedReviewers * 20
  if (app.status === 'Rejected') score += 30
  const daysSinceSubmit = Math.floor((Date.now() - new Date(app.submittedDate).getTime()) / (1000 * 60 * 60 * 24))
  if (daysSinceSubmit > 60) score += 20
  else if (daysSinceSubmit > 30) score += 10
  if (app.criticality === 'Critical') score += 10
  return Math.min(score, 100)
}