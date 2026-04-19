# ⚡ QuoteFlow — LED Quotation Manager
### Version 2.0 — Premium Edition

A keyboard-first, premium quotation management system built for LED lighting businesses.
Runs 100% on your local machine — no internet needed after setup.

---

## 🚀 Quick Start (3 Steps)

### Step 1 — Install Node.js
Download from: https://nodejs.org  (choose the **LTS** version)

### Step 2 — Install dependencies
Open terminal / command prompt **inside the `quotation-app` folder** and run:
```bash
cd server && npm install
cd ../client && npm install
```

### Step 3 — Start the app

**Windows:** Double-click `START.bat`

**Mac / Linux:**
```bash
chmod +x start.sh && ./start.sh
```

**Manually (two terminals):**
```bash
# Terminal 1 — Backend API
cd server && node index.js

# Terminal 2 — Frontend
cd client && npm start
```

App opens at → **http://localhost:3000**
API runs at  → **http://localhost:3001**

---

## 📁 Project Structure

```
quotation-app/
├── server/
│   ├── index.js          ← Express API + SQLite + Excel routes
│   ├── quotations.db     ← Auto-created database (SQLite)
│   ├── uploads/          ← Uploaded logos & product images
│   └── package.json
├── client/
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.js         ← Stats & recent activity
│       │   ├── Quotations.js        ← List, search, status management
│       │   ├── QuotationBuilder.js  ← ⭐ MAIN WORKING SCREEN
│       │   ├── ProductLibrary.js    ← Manage products + Excel import/export
│       │   └── Settings.js         ← Full app configuration
│       ├── components/
│       │   ├── Layout.js            ← Sidebar navigation
│       │   └── PrintView.js         ← Print / PDF preview
│       └── context/
│           └── AppContext.js        ← Global state + settings
├── START.bat             ← Windows one-click launcher
├── start.sh              ← Mac/Linux launcher
└── README.md
```

---

## ✨ Features

### 📋 Quotation Builder
- Auto quote number generation (QT-0001, QT-0002...)
- Company logo upload (shown on print)
- Valid Till date — auto-computed and displayed
- Smart product search — type name/code → instant dropdown
- Keyboard-first entry with Enter to move between cells
- Shortcut keys in Shape/Color/Body/Warranty fields
- Auto-row creation as you type
- Per-item discount + overall discount
- GST toggle with configurable rate
- Status management: Draft → Sent → Approved → Rejected

### 🖨️ Print / PDF (Ashok Vidyut Style)
- Company logo + name + address in header
- Quote No, Date, Valid Till in top right
- Customer section with mobile + address
- Dark header product table with alternating rows
- Shape / Color shown as colored tags
- Product images in the table
- Notes + numbered Terms & Conditions
- ALL CAPS lines in T&C → shown in **red bold**
- Grand Total dark bar
- Authorized Signature line at bottom

### 📦 Product Library
- 20 LED products pre-loaded
- Add / Edit / Delete products
- Upload product images
- Category filtering
- **Excel Export** — download all products as .xlsx
- **Excel Import** — bulk import from Excel file

  **Import column format:**
  | name | code | rate | unit | mrp | category |
  |------|------|------|------|-----|----------|

### ⚙️ Settings
- Company name, address, phone (shown on print)
- Currency symbol, validity days, default unit
- GST/tax label and rate
- Accent color picker (8 presets + custom)
- Dark / Light mode toggle
- **Column on/off toggles** — show/hide any column in table + print
- Default Terms & Conditions template
- Fully editable shortcut keys for Shape/Color/Body Color/Warranty

### 📊 Dashboard
- Total quotations count
- Approved revenue total
- This month's quotes
- Top 5 products by revenue
- Recent 5 quotations
- Status breakdown

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Enter` | Move to next cell |
| `Tab` | Move forward |
| `↑ ↓` | Navigate autocomplete suggestions |
| `Escape` | Close dropdown |

### Default Shape Shortcuts
| Type | Result |
|------|--------|
| `R` | Round |
| `S` | Square |
| `RE` | Rectangle |
| `OV` | Oval |

### Default Color Shortcuts
| Type | Result |
|------|--------|
| `W` | White |
| `NW` | Natural White |
| `WW` | Warm White |
| `3` | 3 in 1 |
| `5` | 5000K |
| `RGB` | RGB |

### Default Body Color Shortcuts
| Type | Result |
|------|--------|
| `B` | Black Body |
| `W` | White Body |
| `GB` | Gun Black |
| `RG` | Rose Gold |
| `SS` | Silver |

### Default Warranty Shortcuts
| Type | Result |
|------|--------|
| `NW` | No Warranty |
| `1` | 1 Year |
| `2` | 2 Year |
| `3` | 3 Year |
| `5` | 5 Year |
| `10` | 10 Year |

> ✏️ All shortcuts are fully editable in **Settings → Shortcut Keys**

---

## 🖨️ T&C Highlighting Rules

In Settings → Terms & Conditions, lines written in **ALL CAPS** automatically appear in **red bold** on the printed quotation.

Example:
```
ALL RATES ARE INCLUSIVE OF GST.        ← red bold on print
Goods once sold will not be taken back. ← normal
Warranty as per company policy.         ← normal
ADVANCE PAYMENT ONLY.                   ← red bold on print
```

---

## 📊 Excel Import Tips

1. Go to **Product Library → Export Excel** first to see the correct format
2. Fill in your products in the downloaded file
3. Click **Import Excel** and select your file
4. Column names are flexible — `Name`, `name`, `PRODUCT NAME` all work

---

## 📱 WhatsApp Sharing

In Print Preview, the **WhatsApp** button opens a pre-filled message to the customer's mobile with the quote summary.

---

## 💾 Data Backup

Your data lives in one file: `server/quotations.db`

- **Backup:** Copy `quotations.db` to a safe location
- **Restore:** Replace the file and restart the server
- **Reset:** Delete `quotations.db` — it recreates with sample data on next start

---

## 🔧 Troubleshooting

**Port already in use:**
```bash
# Windows — find and kill process on port 3001
netstat -ano | findstr :3001
taskkill /PID <pid> /F

# Mac/Linux
lsof -ti:3001 | xargs kill
```

**"Cannot find module" error:**
```bash
cd server && npm install
cd ../client && npm install
```

**Logo or image not showing:**
- Make sure the server is running on port 3001
- Images are stored in `server/uploads/`

**Excel import not working:**
- Make sure column headers are in first row
- Use `.xlsx` or `.xls` format only

---

## 🗄️ Pre-loaded LED Products (20 items)

Panel · Spot · Strip · Bulb · Tube · Downlight · Flood · Street · COB · Driver · Batten · Ceiling · Track · Emergency · Solar
# quotation-management-system
# quotation-management-system
