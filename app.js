// Basic "real-time" bank simulation using only front-end + localStorage

const seedState = () => ({
  customers: [
    {
      id: "C001",
      name: "Amit Sharma",
      email: "amit.sharma@example.com",
      phone: "9876543210",
      accountNo: "1002003001",
      balance: 56000.75,
      type: "Savings",
    },
    {
      id: "C002",
      name: "Priya Patil",
      email: "priya.patil@example.com",
      phone: "9876500012",
      accountNo: "1002003002",
      balance: 12500.0,
      type: "Current",
    },
    {
      id: "C003",
      name: "Mohit Mahajan",
      email: "mohit.mahajan@example.com",
      phone: "9876512312",
      accountNo: "1002003003",
      balance: 78500.9,
      type: "Savings",
    },
  ],
  transactions: [
    {
      id: "T001",
      accountNo: "1002003001",
      type: "Credit",
      amount: 25000.0,
      balanceAfter: 56000.75,
      note: "Salary credit",
      date: new Date().toISOString(),
    },
    {
      id: "T002",
      accountNo: "1002003002",
      type: "Debit",
      amount: 1500.0,
      balanceAfter: 12500.0,
      note: "ATM withdrawal",
      date: new Date().toISOString(),
    },
    {
      id: "T003",
      accountNo: "1002003003",
      type: "Debit",
      amount: 2500.0,
      balanceAfter: 78500.9,
      note: "UPI payment",
      date: new Date().toISOString(),
    },
  ],
  loans: [
    {
      id: "L001",
      customerId: "C001",
      type: "Home",
      amount: 1200000,
      emi: 14500,
      status: "Active",
    },
    {
      id: "L002",
      customerId: "C003",
      type: "Vehicle",
      amount: 450000,
      emi: 9000,
      status: "Pending",
    },
  ],
});

let state = seedState();

function loadState() {
  const raw = localStorage.getItem("realbank-state");
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      state = {
        customers: parsed.customers || [],
        transactions: parsed.transactions || [],
        loans: parsed.loans || [],
      };
    }
  } catch (e) {
    console.warn("Failed to parse state, using defaults", e);
  }
}

function saveState() {
  localStorage.setItem("realbank-state", JSON.stringify(state));
}

function resetToSeed() {
  state = seedState();
  saveState();
}

// Helpers
const formatCurrency = (n) =>
  "₹" +
  Number(n || 0)
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const byId = (id) => document.getElementById(id);

// Common layout handlers
function initSidebarToggle() {
  const sidebar = document.querySelector(".sidebar");
  const toggle = byId("menu-toggle");
  if (!sidebar || !toggle) return;
  toggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });
}

function initLogout() {
  const btn = byId("logout-btn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    // For demo just go back to login page
    window.location.href = "index.html";
  });
}

function setRolePill() {
  const pill = byId("user-role-pill");
  if (!pill) return;
  const isAdmin = sessionStorage.getItem("realbank-role") === "admin";
  pill.textContent = isAdmin ? "Admin" : "Customer";
}

// LOGIN PAGE
function initLoginPage() {
  const form = byId("login-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = byId("username").value.trim();
    const password = byId("password").value.trim();
    const role = byId("role").value;

    if (role === "admin") {
      if (username === "admin" && password === "admin123") {
        sessionStorage.setItem("realbank-role", "admin");
        window.location.href = "admin.html";
      } else {
        alert("Invalid admin credentials");
      }
    } else {
      sessionStorage.setItem("realbank-role", "customer");
      window.location.href = "dashboard.html";
    }
  });
}

// DASHBOARD PAGE
function initDashboardPage() {
  const totalCustEl = byId("total-customers");
  if (!totalCustEl) return; // not on dashboard

  const totalBalanceEl = byId("total-balance");
  const totalLoansEl = byId("total-loans");
  const todayTxEl = byId("today-transactions");
  const recentTbody = byId("recent-transactions-body");
  const loansTbody = byId("dashboard-loans-body");

  const totalCustomers = state.customers.length;
  const totalBalance = state.customers.reduce(
    (sum, c) => sum + Number(c.balance || 0),
    0
  );
  const totalLoans = state.loans.reduce(
    (sum, l) => sum + Number(l.amount || 0),
    0
  );

  const todayStr = new Date().toISOString().slice(0, 10);
  const todaysTx = state.transactions.filter((t) =>
    (t.date || "").startsWith(todayStr)
  );

  totalCustEl.textContent = totalCustomers;
  totalBalanceEl.textContent = formatCurrency(totalBalance);
  totalLoansEl.textContent = formatCurrency(totalLoans);
  todayTxEl.textContent = todaysTx.length;

  recentTbody.innerHTML = "";
  [...state.transactions]
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .slice(0, 8)
    .forEach((t) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${t.id}</td>
        <td>${t.accountNo}</td>
        <td>${t.type}</td>
        <td>${formatCurrency(t.amount)}</td>
        <td>${(t.date || "").slice(0, 10)}</td>
      `;
      recentTbody.appendChild(tr);
    });

  loansTbody.innerHTML = "";
  state.loans
    .filter((l) => l.status !== "Closed")
    .slice(0, 6)
    .forEach((l) => {
      const cust = state.customers.find((c) => c.id === l.customerId);
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${l.id}</td>
        <td>${cust ? cust.name : l.customerId}</td>
        <td>${l.type}</td>
        <td>${formatCurrency(l.emi)}</td>
        <td>${l.status}</td>
      `;
      loansTbody.appendChild(tr);
    });
}

// CUSTOMERS PAGE
function openModal(modal) {
  if (!modal) return;
  modal.classList.add("open");
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove("open");
}

function initCustomersPage() {
  const tbody = byId("customers-table-body");
  if (!tbody) return;

  const searchInput = byId("customer-search");
  const modal = document.getElementById("customer-modal");
  const openBtn = byId("add-customer-open");
  const form = byId("customer-form");

  function renderCustomers(filter = "") {
    const query = filter.toLowerCase();
    tbody.innerHTML = "";
    state.customers
      .filter((c) => {
        if (!query) return true;
        return (
          c.name.toLowerCase().includes(query) ||
          (c.accountNo || "").toLowerCase().includes(query) ||
          (c.phone || "").toLowerCase().includes(query)
        );
      })
      .forEach((c) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${c.id}</td>
          <td>${c.name}</td>
          <td>${c.accountNo}</td>
          <td>${c.type}</td>
          <td>${formatCurrency(c.balance)}</td>
          <td>${c.phone || "-"}</td>
          <td>${c.email || "-"}</td>
        `;
        tbody.appendChild(tr);
      });
  }

  renderCustomers();

  searchInput &&
    searchInput.addEventListener("input", (e) => {
      renderCustomers(e.target.value);
    });

  // Modal open / close
  openBtn &&
    openBtn.addEventListener("click", () => {
      form.reset();
      openModal(modal);
    });

  modal &&
    modal.addEventListener("click", (e) => {
      if (e.target.dataset.closeModal !== undefined) {
        closeModal(modal);
      }
    });

  form &&
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("cust-name").value.trim();
      const type = document.getElementById("cust-type").value;
      const email = document.getElementById("cust-email").value.trim();
      const phone = document.getElementById("cust-phone").value.trim();
      const balance = parseFloat(
        document.getElementById("cust-balance").value || "0"
      );

      if (!name) return;

      const id = "C" + String(state.customers.length + 1).padStart(3, "0");
      const accountNo = "1002003" + String(100 + state.customers.length);

      state.customers.push({
        id,
        name,
        email,
        phone,
        accountNo,
        balance,
        type,
      });
      saveState();
      renderCustomers(searchInput ? searchInput.value : "");
      closeModal(modal);
    });
}

// TRANSACTIONS PAGE
function initTransactionsPage() {
  const tbody = byId("transactions-table-body");
  if (!tbody) return;

  const filterAcc = byId("tx-account-filter");
  const filterType = byId("tx-type-filter");
  const form = byId("tx-form");
  const accSelect = byId("tx-account");

  // Populate account dropdowns
  function fillAccountOptions(select) {
    if (!select) return;
    select.innerHTML = "";
    state.customers.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.accountNo;
      opt.textContent = `${c.accountNo} · ${c.name}`;
      select.appendChild(opt);
    });
  }

  fillAccountOptions(filterAcc);
  fillAccountOptions(accSelect);

  function renderTransactions() {
    const acc = filterAcc ? filterAcc.value : "";
    const type = filterType ? filterType.value : "";

    tbody.innerHTML = "";
    [...state.transactions]
      .filter((t) => (acc ? t.accountNo === acc : true))
      .filter((t) => (type ? t.type === type : true))
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
      .forEach((t) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${t.id}</td>
          <td>${t.accountNo}</td>
          <td>${t.type}</td>
          <td>${formatCurrency(t.amount)}</td>
          <td>${formatCurrency(t.balanceAfter)}</td>
          <td>${(t.date || "").slice(0, 19).replace("T", " ")}</td>
        `;
        tbody.appendChild(tr);
      });
  }

  renderTransactions();

  filterAcc &&
    filterAcc.addEventListener("change", () => {
      renderTransactions();
    });
  filterType &&
    filterType.addEventListener("change", () => {
      renderTransactions();
    });

  form &&
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const accNo = accSelect.value;
      const type = document.getElementById("tx-type").value;
      const amount = parseFloat(
        document.getElementById("tx-amount").value || "0"
      );
      const note = document.getElementById("tx-note").value.trim();

      if (!accNo || !amount || amount <= 0) {
        alert("Enter valid account and amount");
        return;
      }

      const customer = state.customers.find((c) => c.accountNo === accNo);
      if (!customer) {
        alert("Customer not found");
        return;
      }

      let newBalance = Number(customer.balance || 0);
      if (type === "Debit") {
        if (amount > newBalance) {
          alert("Insufficient balance for debit");
          return;
        }
        newBalance -= amount;
      } else {
        newBalance += amount;
      }

      customer.balance = newBalance;

      const id =
        "T" + String(state.transactions.length + 1).padStart(3, "0");
      const tx = {
        id,
        accountNo: accNo,
        type,
        amount,
        balanceAfter: newBalance,
        note,
        date: new Date().toISOString(),
      };
      state.transactions.push(tx);
      saveState();
      renderTransactions();
      form.reset();
      fillAccountOptions(filterAcc);
      fillAccountOptions(accSelect);
      alert("Transaction posted successfully");
    });
}

// LOANS PAGE
function calculateEMI(amount, rate, months) {
  const monthlyRate = rate / (12 * 100);
  if (monthlyRate === 0) return amount / months;
  const factor = Math.pow(1 + monthlyRate, months);
  return (amount * monthlyRate * factor) / (factor - 1);
}

function initLoansPage() {
  const tbody = byId("loans-table-body");
  if (!tbody) return;

  const statusFilter = byId("loan-status-filter");
  const customerSelect = byId("loan-customer");
  const form = byId("loan-form");
  const amountEl = byId("loan-amount");
  const tenureEl = byId("loan-tenure");
  const rateEl = byId("loan-rate");
  const emiPreview = byId("loan-emi-preview");

  // Fill customers
  customerSelect.innerHTML = "";
  state.customers.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = `${c.name} · ${c.accountNo}`;
    customerSelect.appendChild(opt);
  });

  function renderLoans() {
    const status = statusFilter ? statusFilter.value : "";
    tbody.innerHTML = "";
    state.loans
      .filter((l) => (status ? l.status === status : true))
      .forEach((l) => {
        const cust = state.customers.find((c) => c.id === l.customerId);
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${l.id}</td>
          <td>${cust ? cust.name : l.customerId}</td>
          <td>${l.type}</td>
          <td>${formatCurrency(l.amount)}</td>
          <td>${formatCurrency(l.emi)}</td>
          <td>${l.status}</td>
        `;
        tbody.appendChild(tr);
      });
  }

  renderLoans();

  statusFilter &&
    statusFilter.addEventListener("change", () => {
      renderLoans();
    });

  function updateEmiPreview() {
    const amount = parseFloat(amountEl.value || "0");
    const tenure = parseInt(tenureEl.value || "0", 10);
    const rate = parseFloat(rateEl.value || "0");
    if (!amount || !tenure) {
      emiPreview.textContent = "EMI: –";
      return;
    }
    const emi = calculateEMI(amount, rate, tenure);
    emiPreview.textContent = "Approx. EMI: " + formatCurrency(emi);
  }

  amountEl.addEventListener("input", updateEmiPreview);
  tenureEl.addEventListener("input", updateEmiPreview);
  rateEl.addEventListener("input", updateEmiPreview);
  updateEmiPreview();

  form &&
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const customerId = customerSelect.value;
      const type = document.getElementById("loan-type").value;
      const amount = parseFloat(amountEl.value || "0");
      const tenure = parseInt(tenureEl.value || "0", 10);
      const rate = parseFloat(rateEl.value || "0");

      if (!customerId || !amount || !tenure) {
        alert("Fill all loan fields");
        return;
      }

      const emi = calculateEMI(amount, rate, tenure);

      const id = "L" + String(state.loans.length + 1).padStart(3, "0");
      state.loans.push({
        id,
        customerId,
        type,
        amount,
        emi: Math.round(emi),
        status: "Pending",
      });
      saveState();
      renderLoans();
      form.reset();
      updateEmiPreview();
      alert("Loan request created");
    });
}

// PROFILE PAGE
function initProfilePage() {
  const container = document.getElementById("all-profiles");
  const search = document.getElementById("profile-search");
  if (!container) return;

  function renderProfiles(filter = "") {
    const q = filter.toLowerCase();
    container.innerHTML = "";

    state.customers
      .filter(user =>
        user.name.toLowerCase().includes(q) ||
        user.id.toLowerCase().includes(q) ||
        user.accountNo.toLowerCase().includes(q) ||
        (user.email || "").toLowerCase().includes(q) ||
        (user.phone || "").toLowerCase().includes(q)
      )
      .forEach((user) => {
        const card = document.createElement("div");
        card.className = "profile-box";

        card.innerHTML = `
          <div class="profile-row">
            <h3>${user.name}</h3>
            <p><strong>Customer ID:</strong> ${user.id}</p>
            <p><strong>Account No:</strong> ${user.accountNo}</p>
            <p><strong>Account Type:</strong> ${user.type}</p>
            <p><strong>Balance:</strong> ${formatCurrency(user.balance)}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Phone:</strong> ${user.phone}</p>
          </div>
        `;

        container.appendChild(card);
      });
  }

  // First load
  renderProfiles();

  // Search filter
  if (search) {
    search.addEventListener("input", (e) => {
      renderProfiles(e.target.value);
    });
  }
}



// ADMIN PAGE
function initAdminPage() {
  const totalCustEl = byId("admin-total-customers");
  if (!totalCustEl) return;

  const totalBalEl = byId("admin-total-balance");
  const totalLoansEl = byId("admin-total-loans");
  const totalTxEl = byId("admin-total-transactions");
  const customersBody = byId("admin-customers-body");
  const seedBtn = byId("seed-demo-data-btn");
  const clearBtn = byId("clear-data-btn");

  const totalCustomers = state.customers.length;
  const totalBalance = state.customers.reduce(
    (sum, c) => sum + Number(c.balance || 0),
    0
  );
  const totalLoans = state.loans.reduce(
    (sum, l) => sum + Number(l.amount || 0),
    0
  );
  const totalTx = state.transactions.length;

  totalCustEl.textContent = totalCustomers;
  totalBalEl.textContent = formatCurrency(totalBalance);
  totalLoansEl.textContent = formatCurrency(totalLoans);
  totalTxEl.textContent = totalTx;

  customersBody.innerHTML = "";
  state.customers.forEach((c) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${c.id}</td>
      <td>${c.name}</td>
      <td>${c.accountNo}</td>
      <td>${formatCurrency(c.balance)}</td>
      <td><span class="pill">Active</span></td>
    `;
    customersBody.appendChild(tr);
  });

  seedBtn &&
    seedBtn.addEventListener("click", () => {
      if (confirm("Reset demo data to default?")) {
        resetToSeed();
        window.location.reload();
      }
    });

  clearBtn &&
    clearBtn.addEventListener("click", () => {
      if (confirm("Clear all data stored for RealBank in this browser?")) {
        localStorage.removeItem("realbank-state");
        resetToSeed();
        window.location.reload();
      }
    });
}

// MAIN BOOTSTRAP
document.addEventListener("DOMContentLoaded", () => {
  loadState();

  const page = document.body.dataset.page;

  switch (page) {
    case "login":
      initLoginPage();
      break;
    case "dashboard":
      setRolePill();
      initDashboardPage();
      initSidebarToggle();
      initLogout();
      break;
    case "customers":
      setRolePill();
      initCustomersPage();
      initSidebarToggle();
      initLogout();
      break;
    case "transactions":
      setRolePill();
      initTransactionsPage();
      initSidebarToggle();
      initLogout();
      break;
    case "loans":
      setRolePill();
      initLoansPage();
      initSidebarToggle();
      initLogout();
      break;
    case "profile":
      setRolePill();
      initProfilePage();
      initSidebarToggle();
      initLogout();
      break;
    case "admin":
      setRolePill();
      initAdminPage();
      initSidebarToggle();
      initLogout();
      break;
  }
});
