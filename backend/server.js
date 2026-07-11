const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Use environment variable for PORT, fallback to 5001
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fleet_database';
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.log('❌ MongoDB connection error:', err));

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// ============ SCHEMAS ============

// Vessel Schema
const vesselSchema = new mongoose.Schema({
  name: { type: String, required: true },
  imoNumber: { type: String, default: '' },
  indType: String,
  flag: String,
  year: Number,
  grt: Number,
  speed: String,
  totalSeat: Number,
  documents: [{
    name: String,
    filePath: String,
    uploadDate: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

// Client Schema
const clientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contactPerson: String,
  email: String,
  phone: String,
  address: String,
  createdAt: { type: Date, default: Date.now }
});

// Contract Schema
const contractSchema = new mongoose.Schema({
  contractTitle: { type: String, default: '' },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  vessel: { type: mongoose.Schema.Types.ObjectId, ref: 'Vessel', required: true },
  commencementDate: { type: Date, required: true },
  duration: { type: Number, required: true },
  dcr: { type: Number, required: true },
  mob: { type: Number, default: 0 },
  demob: { type: Number, default: 0 },
  contractValue: { type: Number, default: 0 },
  remarks: String,
  status: { 
    type: String, 
    enum: ['Active', 'Completed', 'Pending'], 
    default: 'Active' 
  },
  createdAt: { type: Date, default: Date.now }
});

// Tender Schema
const tenderSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  projectDetails: { type: String, default: '' },
  proposedVessels: [{
    vessel: { type: mongoose.Schema.Types.ObjectId, ref: 'Vessel' },
    proposedRate: { type: Number, default: 0 }
  }],
  commencementDate: { type: Date, required: true },
  duration: { type: Number, required: true },
  completionDate: { type: Date },
  location: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['Pending Submission', 'Submitted', 'Under Review', 'Awarded', 'Decline', 'Unsuccessful', 'Aborted'], 
    default: 'Pending Submission' 
  },
  chances: { type: String, default: '' },
  remarks: { type: String, default: '' },
  submittedDate: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

// Invoice Schema
const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, default: '' },
  billingMonth: { type: String, required: true },
  billingYear: { type: Number, required: true },
  contract: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract' },
  vessel: { type: mongoose.Schema.Types.ObjectId, ref: 'Vessel', required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  dcr: { type: Number, required: true },
  duration: { type: Number, required: true },
  mob: { type: Number, default: 0 },
  demob: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  submissionDate: { type: Date, required: true },
  expectedPaymentDate: { type: Date },
  paymentStatus: { 
    type: String, 
    enum: ['Pending', 'Paid', 'Overdue', 'Submitted'], 
    default: 'Pending' 
  },
  remarks: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

// Utilization Schema
const utilizationSchema = new mongoose.Schema({
  vessel: { type: mongoose.Schema.Types.ObjectId, ref: 'Vessel', required: true },
  month: { type: String, required: true },
  year: { type: Number, required: true },
  budgetDays: { type: Number, required: true },
  actualDays: { type: Number, required: true },
  remarks: String,
  createdAt: { type: Date, default: Date.now }
});

// Budget Schema
const budgetSchema = new mongoose.Schema({
  month: { type: String, required: true },
  year: { type: Number, required: true },
  budgetedSale: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

// ============ MODELS ============

const Vessel = mongoose.model('Vessel', vesselSchema);
const Client = mongoose.model('Client', clientSchema);
const Contract = mongoose.model('Contract', contractSchema);
const Tender = mongoose.model('Tender', tenderSchema);
const Invoice = mongoose.model('Invoice', invoiceSchema);
const Utilization = mongoose.model('Utilization', utilizationSchema);
const Budget = mongoose.model('Budget', budgetSchema);

// ============ API ROUTES ============

// ---------- TEST ROUTE ----------
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// ---------- VESSEL ROUTES ----------
app.get('/api/vessels', async (req, res) => {
  try {
    const vessels = await Vessel.find().sort({ name: 1 });
    res.json(vessels);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/vessels', async (req, res) => {
  try {
    const vessel = new Vessel(req.body);
    await vessel.save();
    res.status(201).json(vessel);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/vessels/:id', async (req, res) => {
  try {
    const vessel = await Vessel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!vessel) return res.status(404).json({ error: 'Vessel not found' });
    res.json(vessel);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/vessels/:id', async (req, res) => {
  try {
    const vessel = await Vessel.findByIdAndDelete(req.params.id);
    if (!vessel) return res.status(404).json({ error: 'Vessel not found' });
    res.json({ message: 'Vessel deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/vessels/:id/documents', upload.single('document'), async (req, res) => {
  try {
    const vessel = await Vessel.findById(req.params.id);
    if (!vessel) return res.status(404).json({ error: 'Vessel not found' });
    
    vessel.documents.push({
      name: req.body.name || req.file.originalname,
      filePath: req.file.path
    });
    await vessel.save();
    res.json(vessel);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- CLIENT ROUTES ----------
app.get('/api/clients', async (req, res) => {
  try {
    const clients = await Client.find().sort({ name: 1 });
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/clients', async (req, res) => {
  try {
    const client = new Client(req.body);
    await client.save();
    res.status(201).json(client);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/clients/:id', async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.json(client);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/clients/:id', async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.json({ message: 'Client deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- CONTRACT ROUTES ----------
app.get('/api/contracts', async (req, res) => {
  try {
    const contracts = await Contract.find()
      .populate('client')
      .populate('vessel')
      .sort({ createdAt: -1 });
    res.json(contracts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/contracts', async (req, res) => {
  try {
    const contractData = {
      contractTitle: req.body.contractTitle || '',
      client: req.body.client,
      vessel: req.body.vessel,
      commencementDate: req.body.commencementDate,
      duration: req.body.duration,
      dcr: req.body.dcr,
      mob: req.body.mob || 0,
      demob: req.body.demob || 0,
      contractValue: req.body.contractValue,
      remarks: req.body.remarks || '',
      status: req.body.status || 'Active',
    };

    const contract = new Contract(contractData);
    await contract.save();
    
    const populatedContract = await Contract.findById(contract._id)
      .populate('client')
      .populate('vessel');
    
    res.status(201).json(populatedContract);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/contracts/:id', async (req, res) => {
  try {
    const contract = await Contract.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    )
      .populate('client')
      .populate('vessel');
    if (!contract) return res.status(404).json({ error: 'Contract not found' });
    res.json(contract);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/contracts/:id', async (req, res) => {
  try {
    const contract = await Contract.findByIdAndDelete(req.params.id);
    if (!contract) return res.status(404).json({ error: 'Contract not found' });
    res.json({ message: 'Contract deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- TENDER ROUTES ----------
app.get('/api/tenders', async (req, res) => {
  try {
    const tenders = await Tender.find()
      .populate('client')
      .populate('proposedVessels.vessel')
      .sort({ createdAt: -1 });
    res.json(tenders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tenders', async (req, res) => {
  try {
    let completionDate = null;
    if (req.body.commencementDate && req.body.duration) {
      const date = new Date(req.body.commencementDate);
      date.setDate(date.getDate() + parseInt(req.body.duration));
      completionDate = date;
    }

    const tenderData = {
      client: req.body.client,
      projectDetails: req.body.projectDetails || '',
      proposedVessels: req.body.proposedVessels || [],
      commencementDate: req.body.commencementDate,
      duration: parseFloat(req.body.duration),
      completionDate: completionDate,
      location: req.body.location || '',
      status: req.body.status || 'Pending Submission',
      chances: req.body.chances || '',
      remarks: req.body.remarks || '',
      submittedDate: req.body.submittedDate || new Date(),
    };

    const tender = new Tender(tenderData);
    await tender.save();
    
    const populatedTender = await Tender.findById(tender._id)
      .populate('client')
      .populate('proposedVessels.vessel');
    
    res.status(201).json(populatedTender);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tenders/:id', async (req, res) => {
  try {
    let completionDate = null;
    if (req.body.commencementDate && req.body.duration) {
      const date = new Date(req.body.commencementDate);
      date.setDate(date.getDate() + parseInt(req.body.duration));
      completionDate = date;
    }

    const updateData = {
      ...req.body,
      completionDate: completionDate,
    };

    const tender = await Tender.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true, runValidators: true }
    )
      .populate('client')
      .populate('proposedVessels.vessel');
    
    if (!tender) return res.status(404).json({ error: 'Tender not found' });
    res.json(tender);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tenders/:id', async (req, res) => {
  try {
    const tender = await Tender.findByIdAndDelete(req.params.id);
    if (!tender) return res.status(404).json({ error: 'Tender not found' });
    res.json({ message: 'Tender deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- INVOICE ROUTES ----------
app.get('/api/invoices', async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate('contract')
      .populate('vessel')
      .populate('client')
      .sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/invoices', async (req, res) => {
  try {
    console.log('📝 Creating invoice:', req.body);
    
    const invoiceData = {
      invoiceNumber: req.body.invoiceNumber || `INV-${Date.now()}`,
      billingMonth: req.body.billingMonth,
      billingYear: req.body.billingYear,
      contract: req.body.contract || null,
      vessel: req.body.vessel,
      client: req.body.client,
      dcr: req.body.dcr,
      duration: req.body.duration,
      mob: req.body.mob || 0,
      demob: req.body.demob || 0,
      totalAmount: req.body.totalAmount,
      submissionDate: req.body.submissionDate,
      expectedPaymentDate: req.body.expectedPaymentDate,
      paymentStatus: req.body.paymentStatus || 'Pending',
      remarks: req.body.remarks || '',
    };

    const invoice = new Invoice(invoiceData);
    await invoice.save();
    
    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('contract')
      .populate('vessel')
      .populate('client');
    
    console.log('✅ Invoice created:', populatedInvoice);
    res.status(201).json(populatedInvoice);
  } catch (err) {
    console.error('❌ Error creating invoice:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/invoices/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    )
      .populate('contract')
      .populate('vessel')
      .populate('client');
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    console.error('❌ Error updating invoice:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/invoices/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ message: 'Invoice deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- UTILIZATION ROUTES ----------
app.get('/api/utilizations', async (req, res) => {
  try {
    const utilizations = await Utilization.find()
      .populate('vessel')
      .sort({ year: -1, month: 1 });
    res.json(utilizations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/utilizations', async (req, res) => {
  try {
    console.log('📝 Creating utilization:', req.body);
    
    const utilizationData = {
      vessel: req.body.vessel,
      month: req.body.month,
      year: req.body.year,
      budgetDays: req.body.budgetDays,
      actualDays: req.body.actualDays,
      remarks: req.body.remarks || '',
    };

    const utilization = new Utilization(utilizationData);
    await utilization.save();
    
    const populatedUtilization = await Utilization.findById(utilization._id)
      .populate('vessel');
    
    console.log('✅ Utilization created:', populatedUtilization);
    res.status(201).json(populatedUtilization);
  } catch (err) {
    console.error('❌ Error creating utilization:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/utilizations/:id', async (req, res) => {
  try {
    const utilization = await Utilization.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    )
      .populate('vessel');
    if (!utilization) return res.status(404).json({ error: 'Utilization record not found' });
    res.json(utilization);
  } catch (err) {
    console.error('❌ Error updating utilization:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/utilizations/:id', async (req, res) => {
  try {
    const utilization = await Utilization.findByIdAndDelete(req.params.id);
    if (!utilization) return res.status(404).json({ error: 'Utilization record not found' });
    res.json({ message: 'Utilization record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- BUDGET ROUTES ----------
app.get('/api/budgets', async (req, res) => {
  try {
    const budgets = await Budget.find().sort({ year: -1, month: 1 });
    res.json(budgets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/budgets', async (req, res) => {
  try {
    const budget = new Budget(req.body);
    await budget.save();
    res.status(201).json(budget);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/budgets/:id', async (req, res) => {
  try {
    const budget = await Budget.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!budget) return res.status(404).json({ error: 'Budget not found' });
    res.json(budget);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/budgets/:id', async (req, res) => {
  try {
    const budget = await Budget.findByIdAndDelete(req.params.id);
    if (!budget) return res.status(404).json({ error: 'Budget not found' });
    res.json({ message: 'Budget deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- DASHBOARD ROUTE ----------
app.get('/api/dashboard', async (req, res) => {
  try {
    const totalVessels = await Vessel.countDocuments();
    const totalClients = await Client.countDocuments();
    const activeContracts = await Contract.countDocuments({ status: 'Active' });
    const totalInvoices = await Invoice.countDocuments();
    
    const invoices = await Invoice.find();
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    
    const pendingInvoices = await Invoice.countDocuments({ paymentStatus: 'Pending' });
    const overdueInvoices = await Invoice.countDocuments({ paymentStatus: 'Overdue' });
    
    res.json({
      totalVessels,
      totalClients,
      activeContracts,
      totalInvoices,
      totalRevenue,
      pendingInvoices,
      overdueInvoices
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ START SERVER ============
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Uploads folder: ${path.join(__dirname, '../uploads')}`);
  console.log(`📊 MongoDB: fleet_database`);
});