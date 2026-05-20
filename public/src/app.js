const SERVICE_OPTIONS = [
  'Flyer Design',
  'Banner Design',
  'Logo Design',
  'T-shirt Design',
  'Social Media Post',
  'Business Card',
  'Poster',
  'Custom Request'
];

const OWNER_EMAIL = 'lutherkingmultimedia@gmail.com';
const OWNER_PHONE = '0559627349';
const OWNER_PASSCODE = 'lkg-owner-2026';
const DESIGNER_PASSCODE = 'lkg-designer-2026';

const portfolioItems = [
  { title: 'Gold Rush Night Flyer', type: 'Flyer', tone: 'Event campaign', color: '#d9a928' },
  { title: 'Legacy Apparel Tee', type: 'T-shirt', tone: 'Streetwear graphic', color: '#f2f2f2' },
  { title: 'Royal Crest Logo', type: 'Logo', tone: 'Brand identity', color: '#121212' },
  { title: 'Launch Week Banner', type: 'Banner', tone: 'Promo artwork', color: '#c49b30' },
  { title: 'Market Day Social Set', type: 'Social', tone: 'Instagram pack', color: '#ffffff' },
  { title: 'Founder Business Card', type: 'Print', tone: 'Premium stationery', color: '#111111' }
];

const initialOrders = [
  {
    id: 'LKG-1024',
    customer: 'Ama Boateng',
    email: 'ama@example.com',
    whatsapp: '+233 24 000 1212',
    service: 'Flyer Design',
    details: 'Birthday party flyer with black and gold luxury theme.',
    status: 'Preview ready',
    price: 250,
    paid: false,
    createdAt: '2026-05-16',
    preview: null,
    finalName: 'birthday-flyer-final.png',
    designer: 'Unassigned'
  },
  {
    id: 'LKG-1025',
    customer: 'Kwame Mensah',
    email: 'kwame@example.com',
    whatsapp: '+233 55 112 3000',
    service: 'Logo Design',
    details: 'Minimal logo for barber shop.',
    status: 'Paid',
    price: 500,
    paid: true,
    createdAt: '2026-05-18',
    preview: null,
    finalName: 'barber-logo-final.png',
    designer: 'LutherKing Studio'
  }
];

let orders = readOrders();
let activeView = initialView();
let mobileOpen = false;
let currentUser = {
  name: 'Demo Customer',
  email: 'customer@example.com',
  role: 'customer'
};
let paymentNotice = '';
let ownerUnlocked = sessionStorage.getItem('lkg-owner-unlocked') === 'true';
let designerUnlocked = sessionStorage.getItem('lkg-designer-unlocked') === 'true';

const root = document.getElementById('root');

function initialView() {
  const page = window.location.pathname.toLowerCase();
  if (page.endsWith('/client.html') || page.endsWith('/client')) return 'customer';
  if (page.endsWith('/designer.html') || page.endsWith('/designer')) return 'designer';
  if (page.endsWith('/owner-admin.html') || page.endsWith('/owner-admin')) return 'owner';
  return 'home';
}

function readOrders() {
  try {
    return JSON.parse(localStorage.getItem('lkg-orders')) || initialOrders;
  } catch {
    return initialOrders;
  }
}

function saveOrders() {
  localStorage.setItem('lkg-orders', JSON.stringify(orders));
}

function icon(name) {
  const map = {
    arrow: '->',
    badge: 'OK',
    bank: 'GHS',
    bell: '!',
    brush: '*',
    check: 'OK',
    download: 'DL',
    eye: 'View',
    file: 'File',
    filter: 'Filter',
    image: '+',
    lock: 'Lock',
    menu: 'Menu',
    message: 'Call',
    search: 'Search',
    shield: 'Safe',
    spark: '*',
    upload: 'Up',
    user: 'User',
    x: 'X'
  };
  return `<span class="ui-icon" aria-hidden="true">${map[name] || '*'}</span>`;
}

function money(amount) {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    maximumFractionDigits: 0
  }).format(amount);
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function makePreviewDataUrl(label = 'LutherKing Graphics') {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 800;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 1200, 800);
  gradient.addColorStop(0, '#070707');
  gradient.addColorStop(0.5, '#2f2611');
  gradient.addColorStop(1, '#f0c75b');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 800);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  for (let i = 0; i < 9; i += 1) {
    ctx.beginPath();
    ctx.arc(150 + i * 130, 170 + (i % 3) * 120, 70, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 72px Arial';
  ctx.fillText(label, 90, 360);
  ctx.fillStyle = '#f3c74f';
  ctx.font = 'bold 38px Arial';
  ctx.fillText('Completed Design Preview', 94, 430);
  ctx.save();
  ctx.translate(600, 420);
  ctx.rotate(-0.55);
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.font = 'bold 54px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('LutherKing Graphics - Preview Only', 0, 0);
  ctx.restore();
  return canvas.toDataURL('image/png');
}

function go(view) {
  activeView = view;
  mobileOpen = false;
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateOrder(id, patch) {
  orders = orders.map((order) => (order.id === id ? { ...order, ...patch } : order));
  saveOrders();
  render();
}

async function startPayment(orderId) {
  const order = orders.find((item) => item.id === orderId);
  if (!order) return;

  if (!order.price || order.price <= 0) {
    alert('This order needs a price first. The designer or owner must set the price.');
    return;
  }

  try {
    paymentNotice = 'Opening secure Paystack checkout...';
    render();

    const response = await fetch('/api/paystack/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: order.id,
        email: order.email,
        amount: order.price
      })
    });
    const result = await response.json();

    if (!response.ok) throw new Error(result.message || 'Could not start Paystack payment.');

    sessionStorage.setItem('lkg-pending-payment-order', order.id);
    sessionStorage.setItem('lkg-pending-payment-reference', result.reference);
    window.location.href = result.authorizationUrl;
  } catch (error) {
    paymentNotice = '';
    render();
    alert(error.message || 'Payment could not start. Please try again.');
  }
}

async function verifyPaymentFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const reference = params.get('reference') || sessionStorage.getItem('lkg-pending-payment-reference');
  const orderId = params.get('order') || sessionStorage.getItem('lkg-pending-payment-order');

  if (params.get('payment') !== 'verify' && !reference) return;

  activeView = 'customer';
  paymentNotice = 'Verifying Paystack payment...';
  render();

  try {
    const response = await fetch(`/api/paystack/verify?reference=${encodeURIComponent(reference)}`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Could not verify payment.');

    if (result.paid && orderId) {
      orders = orders.map((order) => (order.id === orderId ? { ...order, paid: true, status: 'Paid' } : order));
      saveOrders();
      paymentNotice = 'Payment verified. Your final download is unlocked.';
    } else {
      paymentNotice = `Payment status: ${result.status || 'not successful'}.`;
    }
  } catch (error) {
    paymentNotice = error.message || 'Payment verification failed.';
  } finally {
    sessionStorage.removeItem('lkg-pending-payment-order');
    sessionStorage.removeItem('lkg-pending-payment-reference');
    window.history.replaceState({}, document.title, window.location.pathname);
    render();
  }
}

function statusBadge(order) {
  return `<span class="status ${order.paid ? 'paid' : ''}">${order.paid ? 'Paid' : escapeHtml(order.status)}</span>`;
}

function renderHeader() {
  const publicNav = [
    ['home', 'Home'],
    ['services', 'Services'],
    ['portfolio', 'Portfolio'],
    ['order', 'Order Now'],
    ['contact', 'Contact']
  ];
  const isPortal = ['customer', 'designer', 'owner'].includes(activeView);
  const nav = isPortal ? [] : publicNav;

  return `
    <header class="site-header">
      <a class="brand" href="./index.html" aria-label="LutherKing Graphics home">
        <span class="brand-mark">LK</span>
        <span><strong>LutherKing</strong><small>Graphics</small></span>
      </a>
      <nav class="desktop-nav">
        ${nav.map(([id, label]) => `<button data-go="${id}" class="${activeView === id ? 'active' : ''}">${label}</button>`).join('')}
      </nav>
      <div class="header-actions">
        <a class="ghost small" href="./client.html">${icon('file')} Client Portal</a>
        <button class="icon-button mobile-menu" data-menu aria-label="Open menu">${mobileOpen ? icon('x') : icon('menu')}</button>
      </div>
      ${
        mobileOpen
          ? `<nav class="mobile-nav">
              ${nav.map(([id, label]) => `<button data-go="${id}" class="${activeView === id ? 'active' : ''}">${label}</button>`).join('')}
              <a href="./client.html">Client Portal</a>
            </nav>`
          : ''
      }
    </header>`;
}

function renderHome() {
  const latestOrder = orders.at(-1);
  return `
    <section class="hero section">
      <div class="hero-copy">
        <span class="eyebrow">${icon('spark')} Premium design orders with protected previews</span>
        <h1>LutherKing Graphics</h1>
        <p>Custom flyers, banners, logos, t-shirt art, and social media graphics delivered through a clean order, preview, payment, and download workflow.</p>
        <div class="hero-actions">
          <button class="gold" data-go="order">Order Now ${icon('arrow')}</button>
          <a class="ghost" href="./client.html">${icon('eye')} Client Portal</a>
        </div>
      </div>
      <div class="hero-board" aria-label="Design service preview">
        <div class="art-card large"><span>Flyer</span><strong>Black Gold Night</strong><small>Event campaign</small></div>
        <div class="art-card light"><span>Logo</span><strong>Royal Crest</strong><small>Brand identity</small></div>
        <div class="order-ticket">${icon('badge')}<div><strong>${latestOrder?.id || 'LKG-1001'}</strong><small>${latestOrder?.status || 'Preview ready'}</small></div></div>
      </div>
    </section>
    <section class="section trust-strip">
      <div>${icon('shield')} <span>Watermarked previews before payment</span></div>
      <div>${icon('bank')} <span>Paystack checkout with owner split support</span></div>
      <div>${icon('download')} <span>Final download unlocks after payment</span></div>
    </section>
    <section class="section split">
      <div><span class="eyebrow">How it works</span><h2>From design brief to secure delivery.</h2></div>
      <div class="steps">
        ${['Client submits request', 'Designer uploads protected preview', 'Client pays securely', 'Client downloads the clean final file']
          .map((step, index) => `<div class="step"><span>${index + 1}</span><p>${step}</p></div>`)
          .join('')}
      </div>
    </section>`;
}

function renderServices() {
  const services = [
    ['Flyer Design', 'Events, promos, birthdays, church programs, and launches.', 150],
    ['Banner Design', 'Digital and print banners for campaigns and announcements.', 220],
    ['Logo Design', 'Distinctive brand marks with premium presentation files.', 450],
    ['T-shirt Design', 'Print-ready apparel graphics for brands and events.', 180],
    ['Social Media Post', 'Polished Instagram, Facebook, and WhatsApp status designs.', 80],
    ['Business Card', 'Sharp personal and business card layouts.', 120]
  ];
  return `
    <section class="section page-section">
      <div class="section-heading"><span class="eyebrow">Services</span><h2>Design work customers can order online.</h2></div>
      <div class="service-grid">
        ${services
          .map(
            ([name, description, price]) => `
          <article class="service-card">
            ${icon('brush')}<h3>${name}</h3><p>${description}</p>
            <div><span>From ${money(price)}</span><button class="icon-button" data-go="order" aria-label="Order ${name}">${icon('arrow')}</button></div>
          </article>`
          )
          .join('')}
      </div>
    </section>`;
}

function renderPortfolio() {
  return `
    <section class="section page-section">
      <div class="section-heading row-heading">
        <div><span class="eyebrow">Portfolio</span><h2>Recent creative directions.</h2></div>
        <label class="filter-control">${icon('filter')}<select id="portfolio-filter"><option>All</option>${[...new Set(portfolioItems.map((item) => item.type))]
          .map((type) => `<option>${type}</option>`)
          .join('')}</select></label>
      </div>
      <div class="portfolio-grid" id="portfolio-grid">${portfolioCards(portfolioItems)}</div>
    </section>`;
}

function portfolioCards(items) {
  return items
    .map(
      (item) => `
      <article class="portfolio-item">
        <div class="portfolio-art" style="--accent: ${item.color}"><span>${item.type}</span><strong>${item.title}</strong></div>
        <h3>${item.title}</h3><p>${item.tone}</p>
      </article>`
    )
    .join('');
}

function renderOrderForm() {
  return `
    <section class="section form-page">
      <div class="form-intro">
        <span class="eyebrow">Order Now</span>
        <h2>Tell LutherKing Graphics what you need.</h2>
        <p>Submit a clear brief, attach references, and track your order from preview to final download.</p>
      </div>
      <form class="order-form" id="order-form">
        <label>Full name<input name="customer" required /></label>
        <label>Email<input name="email" type="email" required /></label>
        <label>WhatsApp number<input name="whatsapp" required /></label>
        <label>Service type<select name="service">${SERVICE_OPTIONS.map((service) => `<option>${service}</option>`).join('')}</select></label>
        <label>Preferred deadline<input name="deadline" type="date" /></label>
        <label class="full">Design description/details<textarea name="details" required rows="6" placeholder="Describe colors, text, size, audience, mood, and anything that must appear in the design."></textarea></label>
        <label class="upload-box full">${icon('image')}<span id="file-label">Upload reference file</span><input name="reference" type="file" accept="image/*,.pdf" /></label>
        <button class="gold full" type="submit">Submit Order ${icon('arrow')}</button>
      </form>
    </section>`;
}

function renderCustomer() {
  const customerOrders = orders.filter((order) => order.email === currentUser.email || currentUser.email === 'customer@example.com');
  return `
    <section class="section dashboard">
      ${dashboardTop('Client Portal', 'Track orders, preview files, make payment, and download final files.')}
      ${paymentNotice ? `<div class="notice">${escapeHtml(paymentNotice)}</div>` : ''}
      <div class="dashboard-grid">
        <aside class="side-panel">${icon('user')}<strong>${escapeHtml(currentUser.name)}</strong><span>${escapeHtml(currentUser.email)}</span><button class="ghost" data-go="order">${icon('file')} New Order</button></aside>
        <div class="order-list">${customerOrders.map(customerCard).join('')}</div>
      </div>
    </section>`;
}

function customerCard(order) {
  const preview = order.preview || makePreviewDataUrl(order.service);
  return `
    <article class="dashboard-card">
      <div class="card-head"><div><strong>${order.id}</strong><span>${escapeHtml(order.service)} by ${escapeHtml(order.designer || 'Unassigned')}</span></div>${statusBadge(order)}</div>
      <p>${escapeHtml(order.details)}</p>
      <div class="preview-frame" oncontextmenu="return false"><img src="${preview}" alt="${order.id} watermarked preview" draggable="false" /><span class="watermark-note">${icon('lock')} Preview protected</span></div>
      <div class="card-actions">
        ${
          order.paid
            ? `<a class="gold" href="${preview}" download="${order.finalName || `${order.id}-final.png`}">${icon('download')} Download Final</a>`
            : `<button class="gold" data-pay="${order.id}">${icon('bank')} Pay ${order.price ? money(order.price) : 'After Quote'}</button>`
        }
        <a class="ghost" href="https://wa.me/233559627349" target="_blank" rel="noreferrer">${icon('message')} WhatsApp Support</a>
      </div>
    </article>`;
}

function renderDesigner() {
  if (!designerUnlocked) return renderPortalGate('Designer Interface', 'Enter designer passcode to upload previews and update jobs.', 'designer');

  return `
    <section class="section dashboard">
      ${dashboardTop('Designer Interface', 'Upload previews, set prices, and move design jobs through production.')}
      <div class="admin-toolbar">
        <label class="search-box">${icon('search')}<input id="admin-search" placeholder="Search design jobs" /></label>
        <input id="admin-upload" type="file" accept="image/*" hidden />
      </div>
      <div class="admin-table" id="admin-table">${orders.map(designerRow).join('')}</div>
    </section>`;
}

function designerRow(order) {
  return `
    <article class="admin-row" data-row="${order.id}">
      <div><strong>${order.id}</strong><span>${escapeHtml(order.customer)}</span></div>
      <div><strong>${escapeHtml(order.service)}</strong><span>${escapeHtml(order.details)}</span></div>
      ${statusBadge(order)}
      <div class="admin-actions">
        <select data-status="${order.id}">
          ${['Pending', 'In progress', 'Preview ready', 'Awaiting payment', 'Completed']
            .map((status) => `<option ${status === order.status ? 'selected' : ''}>${status}</option>`)
            .join('')}
        </select>
        <input class="price-input" type="number" min="1" value="${order.price || ''}" placeholder="Price" data-price="${order.id}" />
        <button class="ghost" data-upload="${order.id}">${icon('upload')} Upload Preview</button>
      </div>
    </article>`;
}

function renderOwner() {
  if (!ownerUnlocked) return renderPortalGate('Owner Admin', 'Private owner page for payments, customers, designers, and order control.', 'owner');

  const paidTotal = orders.filter((order) => order.paid).reduce((total, order) => total + Number(order.price || 0), 0);
  const ownerShare = paidTotal * 0.3;
  const designerShare = paidTotal * 0.7;

  return `
    <section class="section dashboard">
      ${dashboardTop('Owner Admin', 'Private owner dashboard for all orders, payments, and designer activity.')}
      <div class="stats-grid">
        <div class="metric-card"><strong>${orders.length}</strong><span>Total orders</span></div>
        <div class="metric-card"><strong>${money(paidTotal)}</strong><span>Paid revenue</span></div>
        <div class="metric-card"><strong>${money(ownerShare)}</strong><span>Your 30% owner share</span></div>
        <div class="metric-card"><strong>${money(designerShare)}</strong><span>Designer/client 70% share</span></div>
      </div>
      <div class="admin-toolbar">
        <label class="search-box">${icon('search')}<input id="admin-search" placeholder="Search all orders" /></label>
        <input id="admin-upload" type="file" accept="image/*" hidden />
      </div>
      <div class="admin-table" id="admin-table">${orders.map(adminRow).join('')}</div>
    </section>`;
}

function adminRow(order) {
  return `
    <article class="admin-row" data-row="${order.id}">
      <div><strong>${order.id}</strong><span>${escapeHtml(order.customer)} | ${escapeHtml(order.whatsapp)}</span></div>
      <div><strong>${escapeHtml(order.service)}</strong><span>${escapeHtml(order.email)}</span></div>
      ${statusBadge(order)}
      <div class="admin-actions">
        <select data-status="${order.id}">
          ${['Pending', 'In progress', 'Preview ready', 'Awaiting payment', 'Paid', 'Completed']
            .map((status) => `<option ${status === order.status ? 'selected' : ''}>${status}</option>`)
            .join('')}
        </select>
        <input class="price-input" type="number" min="1" value="${order.price || ''}" placeholder="Price" data-price="${order.id}" />
        <input class="designer-input" value="${escapeHtml(order.designer || '')}" placeholder="Designer" data-designer="${order.id}" />
        <button class="ghost" data-upload="${order.id}">${icon('upload')} Upload</button>
        <button class="${order.paid ? 'ghost' : 'gold'}" data-toggle-paid="${order.id}">${icon('check')} ${order.paid ? 'Mark Unpaid' : 'Mark Paid'}</button>
      </div>
    </article>`;
}

function renderPortalGate(title, subtitle, type) {
  return `
    <section class="section form-page portal-gate">
      <div class="form-intro">
        <span class="eyebrow">${icon('lock')} Private portal</span>
        <h2>${title}</h2>
        <p>${subtitle}</p>
      </div>
      <form class="order-form" id="portal-gate-form" data-gate="${type}">
        <label class="full">Passcode<input name="passcode" type="password" required autocomplete="current-password" /></label>
        <button class="gold full" type="submit">Enter Portal ${icon('arrow')}</button>
      </form>
    </section>`;
}

function dashboardTop(title, subtitle) {
  return `
    <div class="dashboard-top">
      <div><span class="eyebrow">${icon('bell')} Secure order workflow</span><h2>${title}</h2><p>${subtitle}</p></div>
      <div class="metric-card"><strong>30%</strong><span>Owner share via Paystack split when subaccount is configured</span></div>
    </div>`;
}

function renderContact() {
  return `
    <section class="section contact-page">
      <div><span class="eyebrow">Contact</span><h2>Ready for a design that looks serious?</h2><p>Send the brief through the order form or reach LutherKing Graphics on WhatsApp for quick clarification.</p><button class="gold" data-go="order">Start an Order ${icon('arrow')}</button></div>
      <div class="contact-list">
        <p>${icon('message')} WhatsApp: ${OWNER_PHONE}</p>
        <p>${icon('user')} Email: ${OWNER_EMAIL}</p>
        <p>${icon('shield')} Protected previews and paid final delivery</p>
      </div>
    </section>`;
}

function renderFooter() {
  return `
    <footer class="footer">
      <a class="brand" href="./index.html"><span class="brand-mark">LK</span><span><strong>LutherKing</strong><small>Graphics</small></span></a>
      <p>${OWNER_EMAIL} | ${OWNER_PHONE}</p>
    </footer>`;
}

function renderMain() {
  if (activeView === 'services') return renderServices();
  if (activeView === 'portfolio') return renderPortfolio();
  if (activeView === 'order') return renderOrderForm();
  if (activeView === 'customer') return renderCustomer();
  if (activeView === 'designer') return renderDesigner();
  if (activeView === 'owner') return renderOwner();
  if (activeView === 'contact') return renderContact();
  return renderHome();
}

function render() {
  root.innerHTML = `<div class="app">${renderHeader()}<main>${renderMain()}</main>${renderFooter()}</div>`;
  bindEvents();
}

function bindEvents() {
  document.querySelectorAll('[data-go]').forEach((button) => {
    button.addEventListener('click', () => go(button.dataset.go));
  });

  document.querySelector('[data-menu]')?.addEventListener('click', () => {
    mobileOpen = !mobileOpen;
    render();
  });

  const gateForm = document.getElementById('portal-gate-form');
  if (gateForm) {
    gateForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const passcode = gateForm.passcode.value;
      if (gateForm.dataset.gate === 'owner' && passcode === OWNER_PASSCODE) {
        ownerUnlocked = true;
        sessionStorage.setItem('lkg-owner-unlocked', 'true');
        render();
        return;
      }
      if (gateForm.dataset.gate === 'designer' && passcode === DESIGNER_PASSCODE) {
        designerUnlocked = true;
        sessionStorage.setItem('lkg-designer-unlocked', 'true');
        render();
        return;
      }
      alert('Wrong passcode.');
    });
  }

  const orderForm = document.getElementById('order-form');
  if (orderForm) {
    orderForm.reference.addEventListener('change', () => {
      document.getElementById('file-label').textContent = orderForm.reference.files[0]?.name || 'Upload reference file';
    });
    orderForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(orderForm);
      const order = {
        id: `LKG-${Math.floor(2000 + Math.random() * 7000)}`,
        customer: data.get('customer'),
        email: data.get('email'),
        whatsapp: data.get('whatsapp'),
        service: data.get('service'),
        details: data.get('details'),
        deadline: data.get('deadline'),
        fileName: orderForm.reference.files[0]?.name || '',
        status: 'Pending',
        price: 0,
        paid: false,
        createdAt: new Date().toISOString().slice(0, 10),
        preview: null,
        finalName: '',
        designer: 'Unassigned'
      };
      orders = [...orders, order];
      currentUser = { name: order.customer, email: order.email, role: 'customer' };
      saveOrders();
      go('customer');
    });
  }

  const portfolioFilter = document.getElementById('portfolio-filter');
  if (portfolioFilter) {
    portfolioFilter.addEventListener('change', () => {
      const value = portfolioFilter.value;
      const visible = value === 'All' ? portfolioItems : portfolioItems.filter((item) => item.type === value);
      document.getElementById('portfolio-grid').innerHTML = portfolioCards(visible);
    });
  }

  document.querySelectorAll('[data-pay]').forEach((button) => {
    button.addEventListener('click', () => startPayment(button.dataset.pay));
  });

  document.querySelectorAll('[data-status]').forEach((select) => {
    select.addEventListener('change', () => updateOrder(select.dataset.status, { status: select.value }));
  });

  document.querySelectorAll('[data-price]').forEach((input) => {
    input.addEventListener('change', () => updateOrder(input.dataset.price, { price: Number(input.value) || 0 }));
  });

  document.querySelectorAll('[data-designer]').forEach((input) => {
    input.addEventListener('change', () => updateOrder(input.dataset.designer, { designer: input.value || 'Unassigned' }));
  });

  document.querySelectorAll('[data-toggle-paid]').forEach((button) => {
    button.addEventListener('click', () => {
      const order = orders.find((item) => item.id === button.dataset.togglePaid);
      updateOrder(order.id, { paid: !order.paid, status: !order.paid ? 'Paid' : order.status });
    });
  });

  let uploadingId = '';
  const adminUpload = document.getElementById('admin-upload');
  document.querySelectorAll('[data-upload]').forEach((button) => {
    button.addEventListener('click', () => {
      uploadingId = button.dataset.upload;
      adminUpload?.click();
    });
  });
  adminUpload?.addEventListener('change', () => {
    const file = adminUpload.files[0];
    if (!file || !uploadingId) return;
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-0.52);
        ctx.fillStyle = 'rgba(255,255,255,0.38)';
        ctx.font = `bold ${Math.max(24, Math.round(canvas.width / 22))}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('LutherKing Graphics - Preview Only', 0, 0);
        ctx.restore();
        updateOrder(uploadingId, {
          preview: canvas.toDataURL('image/png'),
          finalName: file.name,
          status: 'Preview ready',
          price: orders.find((order) => order.id === uploadingId)?.price || 300
        });
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
    adminUpload.value = '';
  });

  const adminSearch = document.getElementById('admin-search');
  adminSearch?.addEventListener('input', () => {
    const query = adminSearch.value.toLowerCase();
    const renderer = activeView === 'owner' ? adminRow : designerRow;
    document.getElementById('admin-table').innerHTML = orders
      .filter((order) => `${order.id} ${order.customer} ${order.service} ${order.email}`.toLowerCase().includes(query))
      .map(renderer)
      .join('');
    bindEvents();
  });
}

render();
verifyPaymentFromUrl();
