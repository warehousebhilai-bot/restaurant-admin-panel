const state = {
  settings: { gst: 5, discount: 0, notifications: 'Enabled' },
  menu: [
    { id: 1, name: 'Paneer Tikka', category: 'Starter', price: 240, modifiers: ['Extra Cheese', 'Spicy'] },
    { id: 2, name: 'Veg Biryani', category: 'Main Course', price: 280, modifiers: ['Raita', 'Extra Rice'] },
    { id: 3, name: 'Masala Dosa', category: 'South Indian', price: 160, modifiers: ['Butter', 'Cheese'] },
    { id: 4, name: 'Cold Coffee', category: 'Beverages', price: 120, modifiers: ['Ice Cream'] },
  ],
  tables: Array.from({ length: 12 }, (_, i) => ({ id: i + 1, occupied: false, orderId: null })),
  customers: [
    { id: 1, name: 'Aarav Sharma', points: 120, visits: 8 },
    { id: 2, name: 'Isha Verma', points: 40, visits: 3 },
    { id: 3, name: 'Kabir Singh', points: 220, visits: 12 },
  ],
  inventory: [
    { id: 1, item: 'Paneer (kg)', stock: 18, threshold: 10 },
    { id: 2, item: 'Rice (kg)', stock: 34, threshold: 20 },
    { id: 3, item: 'Coffee (kg)', stock: 4, threshold: 6 },
    { id: 4, item: 'Tomato (kg)', stock: 6, threshold: 8 },
  ],
  staff: [
    { name: 'Rohit', role: 'Manager', permissions: 'Orders, Billing, Reports, Staff' },
    { name: 'Neha', role: 'Cashier', permissions: 'POS, Billing' },
    { name: 'Arjun', role: 'Chef', permissions: 'Kitchen, Inventory' },
  ],
  branches: [
    { name: 'Bhilai Central', city: 'Bhilai', status: 'Active' },
    { name: 'Durg Plaza', city: 'Durg', status: 'Active' },
    { name: 'Raipur Lakeview', city: 'Raipur', status: 'Pilot' },
  ],
  orders: [],
  billing: [],
  cart: [],
  salesTrend: [12, 18, 15, 22, 20, 24, 28],
  alerts: ['2 low stock alerts', '1 table waiting for billing'],
};

const el = (id) => document.getElementById(id);
const currency = (n) => n.toFixed(2);

function initNav() {
  document.querySelectorAll('.nav-link').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-link').forEach((n) => n.classList.remove('active'));
      btn.classList.add('active');
      const section = btn.dataset.section;
      document.querySelectorAll('.section').forEach((s) => s.classList.remove('active'));
      el(section).classList.add('active');
      el('section-title').textContent = btn.textContent;
    });
  });
}

function renderDashboard() {
  const todaySales = state.billing.reduce((a, t) => a + t.amount, 0);
  const pendingOrders = state.orders.filter((o) => ['Kitchen', 'Ready', 'Payment'].includes(o.status)).length;
  const occupiedTables = state.tables.filter((t) => t.occupied).length;
  const lowStock = state.inventory.filter((i) => i.stock <= i.threshold).length;

  const kpis = [
    ['Today Sales', `₹${currency(todaySales)}`],
    ['Active Orders', pendingOrders],
    ['Occupied Tables', `${occupiedTables}/${state.tables.length}`],
    ['Low Stock Items', lowStock],
  ];

  el('kpi-cards').innerHTML = kpis.map(([label, value]) => `
    <article class="card"><div class="kpi-label">${label}</div><div class="kpi-value">${value}</div></article>
  `).join('');

  const max = Math.max(...state.salesTrend, 1);
  el('sales-chart').innerHTML = state.salesTrend.map(v => `<div class="bar" style="height:${(v / max) * 100}%"></div>`).join('');
  el('alerts-list').innerHTML = state.alerts.map(a => `<li>${a}</li>`).join('');

  const sales = todaySales;
  const cogs = sales * 0.45;
  const gst = sales * (state.settings.gst / 100);
  const profit = sales - cogs;
  const cards = [
    ['Gross Sales', `₹${currency(sales)}`],
    ['Estimated Profit', `₹${currency(profit)}`],
    ['GST Liability', `₹${currency(gst)}`],
  ];
  el('report-cards').innerHTML = cards.map(([k, v]) => `<article class="card"><div class="kpi-label">${k}</div><div class="kpi-value">${v}</div></article>`).join('');
}

function renderPOS() {
  el('pos-menu').innerHTML = state.menu.map(item => `
    <div class="menu-item">
      <strong>${item.name}</strong>
      <div>${item.category}</div>
      <div>₹${item.price}</div>
      <small>${item.modifiers.join(', ')}</small>
      <button class="primary" data-item-id="${item.id}">Add</button>
    </div>
  `).join('');

  document.querySelectorAll('[data-item-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = state.menu.find((m) => m.id === Number(btn.dataset.itemId));
      state.cart.push(item);
      renderCart();
    });
  });

  el('table-select').innerHTML = state.tables.map(t => `<option value="${t.id}">Table ${t.id} ${t.occupied ? '(Occupied)' : ''}</option>`).join('');
  el('customer-select').innerHTML = state.customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

function renderCart() {
  el('cart-list').innerHTML = state.cart.length ? state.cart.map((i, idx) => `<li>${i.name}<span>₹${i.price}</span><button data-remove-cart="${idx}">Remove</button></li>`).join('') : '<li>Cart is empty</li>';
  document.querySelectorAll('[data-remove-cart]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.cart.splice(Number(btn.dataset.removeCart), 1);
      renderCart();
    });
  });
  const subtotal = state.cart.reduce((a, i) => a + i.price, 0);
  const gst = subtotal * (state.settings.gst / 100);
  const discount = subtotal * (state.settings.discount / 100);
  const total = subtotal + gst - discount;
  el('subtotal').textContent = currency(subtotal);
  el('gst-rate-label').textContent = state.settings.gst;
  el('gst-amount').textContent = currency(gst);
  el('grand-total').textContent = currency(total);
}

function placeOrder() {
  if (!state.cart.length) return;
  const tableId = Number(el('table-select').value);
  const customerId = Number(el('customer-select').value);
  const splitCount = Math.max(Number(el('split-count').value) || 1, 1);
  const paymentMethod = el('payment-method').value;

  const subtotal = state.cart.reduce((a, i) => a + i.price, 0);
  const gst = subtotal * (state.settings.gst / 100);
  const discount = subtotal * (state.settings.discount / 100);
  const total = subtotal + gst - discount;

  const order = {
    id: Date.now(),
    items: [...state.cart],
    tableId,
    customerId,
    splitCount,
    paymentMethod,
    subtotal,
    gst,
    total,
    status: 'Kitchen',
    createdAt: new Date(),
  };
  state.orders.unshift(order);
  const table = state.tables.find((t) => t.id === tableId);
  if (table) {
    table.occupied = true;
    table.orderId = order.id;
  }
  state.cart = [];
  state.alerts.unshift(`Order #${order.id.toString().slice(-4)} sent to kitchen`);
  renderAll();
}

function statusTagClass(status) {
  const s = status.toLowerCase();
  if (s.includes('ready')) return 'tag ready';
  if (s.includes('closed')) return 'tag closed';
  if (s.includes('kitchen')) return 'tag kitchen';
  return 'tag pending';
}

function advanceOrder(orderId) {
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) return;
  if (order.status === 'Kitchen') {
    order.status = 'Ready';
  } else if (order.status === 'Ready') {
    order.status = 'Payment';
  } else if (order.status === 'Payment') {
    order.status = 'Closed';
    state.billing.unshift({
      id: `TXN-${order.id}`,
      orderId: order.id,
      method: order.paymentMethod,
      amount: order.total,
      splitCount: order.splitCount,
      createdAt: new Date(),
    });
    const table = state.tables.find((t) => t.id === order.tableId);
    if (table) {
      table.occupied = false;
      table.orderId = null;
    }
    const customer = state.customers.find((c) => c.id === order.customerId);
    if (customer) customer.points += Math.round(order.total / 20);
  }
  renderAll();
}

function renderOrders() {
  el('orders-list').innerHTML = state.orders.length ? state.orders.map((o) => `
    <li>
      <span>#${o.id.toString().slice(-4)} | Table ${o.tableId} | ₹${currency(o.total)}</span>
      <span class="${statusTagClass(o.status)}">${o.status}</span>
      ${o.status === 'Closed' ? '' : `<button class="primary" data-advance-id="${o.id}">Next Step</button>`}
    </li>
  `).join('') : '<li>No orders yet</li>';

  el('kitchen-list').innerHTML = state.orders.filter(o => o.status === 'Kitchen').length
    ? state.orders.filter(o => o.status === 'Kitchen').map((o) => `
      <li>
        <span>#${o.id.toString().slice(-4)} • ${o.items.length} items • Table ${o.tableId}</span>
        <button class="primary" data-advance-id="${o.id}">Mark Ready</button>
      </li>
    `).join('')
    : '<li>No active kitchen orders</li>';

  document.querySelectorAll('[data-advance-id]').forEach((btn) => btn.addEventListener('click', () => advanceOrder(Number(btn.dataset.advanceId))));
}

function renderTables() {
  el('tables-grid').innerHTML = state.tables.map(t => `
    <div class="table-card ${t.occupied ? 'occupied' : ''}">
      <strong>Table ${t.id}</strong>
      <div>${t.occupied ? `Occupied (Order #${String(t.orderId).slice(-4)})` : 'Free'}</div>
    </div>
  `).join('');
}

function renderMenu() {
  const grouped = state.menu.reduce((acc, i) => {
    (acc[i.category] ||= []).push(i);
    return acc;
  }, {});
  el('menu-list').innerHTML = Object.entries(grouped).map(([category, items]) => `
    <li><strong>${category}</strong><span>${items.map(i => `${i.name} (₹${i.price})`).join(', ')}</span></li>
  `).join('');
}

function renderInventory() {
  el('inventory-list').innerHTML = state.inventory.map((i) => `
    <li>
      <span>${i.item}</span>
      <span class="tag ${i.stock <= i.threshold ? 'pending' : 'ready'}">${i.stock} in stock</span>
    </li>
  `).join('');
}

function renderStaff() {
  el('staff-list').innerHTML = state.staff.map((s) => `<li><span>${s.name} — ${s.role}</span><span>${s.permissions}</span></li>`).join('');
}

function renderCustomers() {
  el('customers-list').innerHTML = state.customers.map((c) => `<li><span>${c.name} (${c.visits} visits)</span><span>${c.points} pts</span></li>`).join('');
}

function renderBilling() {
  el('billing-list').innerHTML = state.billing.length
    ? state.billing.map((t) => `<li><span>${t.id} • Order #${String(t.orderId).slice(-4)} • ${t.method}</span><span>₹${currency(t.amount)}${t.splitCount > 1 ? ` • Split ${t.splitCount}` : ''}</span></li>`).join('')
    : '<li>No transactions yet</li>';
}

function renderBranches() {
  el('branches-list').innerHTML = state.branches.map((b) => `<li><span>${b.name} (${b.city})</span><span class="tag">${b.status}</span></li>`).join('');
}

function bindForms() {
  el('place-order-btn').addEventListener('click', placeOrder);
  el('add-menu-item').addEventListener('click', () => {
    const name = el('new-item-name').value.trim();
    const price = Number(el('new-item-price').value);
    const category = el('new-item-category').value.trim() || 'Uncategorized';
    const modifiers = el('new-item-modifiers').value.split(',').map(s => s.trim()).filter(Boolean);
    if (!name || !price) return;
    state.menu.push({ id: Date.now(), name, price, category, modifiers });
    el('new-item-name').value = '';
    el('new-item-price').value = '';
    el('new-item-category').value = '';
    el('new-item-modifiers').value = '';
    renderAll();
  });

  el('save-settings').addEventListener('click', () => {
    state.settings.gst = Math.max(Number(el('setting-gst').value) || 0, 0);
    state.settings.discount = Math.max(Number(el('setting-discount').value) || 0, 0);
    state.settings.notifications = el('setting-notifications').value;
    state.alerts.unshift(`Settings updated: GST ${state.settings.gst}%`);
    renderAll();
  });
}

function renderAll() {
  renderDashboard();
  renderPOS();
  renderCart();
  renderOrders();
  renderTables();
  renderMenu();
  renderInventory();
  renderStaff();
  renderCustomers();
  renderBilling();
  renderBranches();
}

function startRealtimeSimulation() {
  setInterval(() => {
    state.salesTrend.push(Math.floor(10 + Math.random() * 20));
    if (state.salesTrend.length > 10) state.salesTrend.shift();

    state.inventory.forEach((i) => {
      if (Math.random() < 0.25) i.stock = Math.max(i.stock - 1, 0);
    });

    const low = state.inventory.filter((i) => i.stock <= i.threshold).length;
    const kitchenCount = state.orders.filter((o) => o.status === 'Kitchen').length;
    state.alerts = [
      `${low} low stock alerts`,
      `${kitchenCount} orders in kitchen queue`,
      `${state.settings.notifications} notifications`,
    ];

    renderDashboard();
    renderInventory();
    renderOrders();
  }, 5000);
}

function runClock() {
  setInterval(() => {
    el('live-clock').textContent = `Updated: ${new Date().toLocaleString()}`;
  }, 1000);
}

initNav();
bindForms();
renderAll();
runClock();
startRealtimeSimulation();
