/* Dashboard de análise de vendas — sem dependências de backend. */
const CURRENCY = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const NUMBER = new Intl.NumberFormat("pt-BR");
const DATE = new Intl.DateTimeFormat("pt-BR");
const REQUIRED_COLUMNS = ["id_venda", "data", "produto", "categoria", "regiao", "quantidade", "preco_unitario"];
const PRODUCTS = [
  ["Classic Burger", "Hambúrgueres", 28.9], ["Cheddar Bacon", "Hambúrgueres", 34.9],
  ["Veggie Burger", "Hambúrgueres", 31.9], ["Batata P", "Acompanhamentos", 12.9],
  ["Batata Cheddar", "Acompanhamentos", 18.9], ["Onion Rings", "Acompanhamentos", 16.9],
  ["Refrigerante Lata", "Bebidas", 6.5], ["Suco Natural", "Bebidas", 9.9],
  ["Milk-shake", "Bebidas", 15.9], ["Brownie", "Sobremesas", 13.9]
];
const REGIONS = ["Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul"];
let allRows = createDemoData();
let filteredRows = [];
let sortState = { key: "data", direction: "descending" };
let charts = {};

function createDemoData() {
  return Array.from({ length: 200 }, (_, index) => {
    const i = index + 1;
    const month = ((i - 1) % 12) + 1;
    const day = ((i * 7) % 27) + 1;
    const product = PRODUCTS[(i * 3 + Math.floor(i / 12)) % PRODUCTS.length];
    return {
      id_venda: "V" + String(i).padStart(4, "0"),
      data: `2025-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      produto: product[0],
      categoria: product[1],
      regiao: REGIONS[(i * 2 + Math.floor(i / 25)) % REGIONS.length],
      quantidade: 1 + ((i * 5 + month) % 5),
      preco_unitario: Number((product[2] + (((i * 7) % 4) * 0.5)).toFixed(2))
    };
  });
}

function $(id) { return document.getElementById(id); }
function formatCurrency(value) { return CURRENCY.format(Number(value) || 0); }
function formatDate(value) {
  const date = parseDate(value);
  return date ? DATE.format(date) : "—";
}
function parseDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(value + "T00:00:00");
  const [year, month, day] = value.split("-").map(Number);
  const isRealDate = date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day;
  return Number.isNaN(date.getTime()) || !isRealDate ? null : date;
}
function parseNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
  const normalized = String(value ?? "").trim().replace(/\s/g, "").replace(",", ".");
  return normalized === "" ? NaN : Number(normalized);
}
function normalizeRows(rows) {
  const valid = [];
  let discarded = 0;
  rows.forEach((raw) => {
    const row = {};
    REQUIRED_COLUMNS.forEach((column) => { row[column] = String(raw[column] ?? "").trim(); });
    const quantity = parseNumber(row.quantidade);
    const price = parseNumber(row.preco_unitario);
    const validDate = parseDate(row.data);
    if (!row.id_venda || !row.produto || !row.categoria || !row.regiao || !validDate ||
        !Number.isFinite(quantity) || quantity < 0 || !Number.isFinite(price) || price < 0) {
      discarded += 1;
      return;
    }
    valid.push({ ...row, quantidade: quantity, preco_unitario: price });
  });
  return { rows: valid, discarded };
}
function revenue(row) { return row.quantidade * row.preco_unitario; }
function getFilteredRows() {
  const start = $("startDate").value;
  const end = $("endDate").value;
  const category = $("categoryFilter").value;
  const region = $("regionFilter").value;
  const search = $("tableSearch").value.trim().toLocaleLowerCase("pt-BR");
  return allRows.filter((row) => {
    const matchesDate = (!start || row.data >= start) && (!end || row.data <= end);
    const searchable = [row.id_venda, row.produto, row.categoria, row.regiao, row.data].join(" ").toLocaleLowerCase("pt-BR");
    return matchesDate && (!category || row.categoria === category) && (!region || row.regiao === region) &&
      (!search || searchable.includes(search));
  });
}
function uniqueSorted(key) {
  return [...new Set(allRows.map((row) => row[key]))].sort((a, b) => a.localeCompare(b, "pt-BR"));
}
function populateFilters() {
  ["categoryFilter", "regionFilter"].forEach((id) => {
    const key = id === "categoryFilter" ? "categoria" : "regiao";
    const select = $(id);
    const current = select.value;
    select.innerHTML = '<option value="">Todas as opções</option>';
    uniqueSorted(key).forEach((value) => select.add(new Option(value, value)));
    select.value = [...select.options].some((option) => option.value === current) ? current : "";
  });
}
function calculateMetrics(rows) {
  const total = rows.reduce((sum, row) => sum + revenue(row), 0);
  const units = rows.reduce((sum, row) => sum + row.quantidade, 0);
  const uniqueSales = new Set(rows.map((row) => row.id_venda)).size;
  return { total, units, uniqueSales, ticket: uniqueSales ? total / uniqueSales : 0 };
}
function groupRevenue(rows, key) {
  return rows.reduce((groups, row) => {
    groups[row[key]] = (groups[row[key]] || 0) + revenue(row);
    return groups;
  }, {});
}
function monthlyRevenue(rows) {
  const groups = groupRevenue(rows.map((row) => ({ ...row, mes: row.data.slice(0, 7) })), "mes");
  return Object.keys(groups).sort().map((month) => ({ month, value: groups[month] }));
}
function chartOptions(isHorizontal = false) {
  return {
    responsive: true, maintainAspectRatio: false,
    interaction: { intersect: false, mode: "index" },
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (context) => " " + formatCurrency(context.parsed.y ?? context.parsed.x) } } },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#d0b9a4", font: { family: "DM Sans", size: 11 } } },
      y: { beginAtZero: true, grid: { color: "#513028" }, ticks: { color: "#d0b9a4", font: { family: "DM Sans", size: 10 }, callback: (value) => formatCurrency(value) } }
    }
  };
}
function buildCharts(rows) {
  const monthly = monthlyRevenue(rows);
  const categories = groupRevenue(rows, "categoria");
  const regions = groupRevenue(rows, "regiao");
  const palette = ["#d92332", "#ffc72c", "#e47d35", "#2f9b61", "#f08a72"];
  Object.values(charts).forEach((chart) => chart.destroy());
  charts.monthly = new Chart($("monthlyChart"), {
    type: "line",
    data: { labels: monthly.map((item) => {
      const [year, month] = item.month.split("-");
      return new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" }).format(new Date(Number(year), Number(month) - 1, 1));
    }), datasets: [{ label: "Faturamento", data: monthly.map((item) => item.value), borderColor: "#d92332", backgroundColor: "rgba(217,35,50,.14)", fill: true, tension: .35, pointRadius: 3, pointBackgroundColor: "#fff8ed", pointBorderWidth: 2 }] },
    options: chartOptions()
  });
  charts.category = new Chart($("categoryChart"), {
    type: "bar",
    data: { labels: Object.keys(categories), datasets: [{ label: "Faturamento", data: Object.values(categories), backgroundColor: palette, borderRadius: 5, maxBarThickness: 34 }] },
    options: { ...chartOptions(), plugins: { ...chartOptions().plugins, tooltip: { callbacks: { label: (context) => " " + formatCurrency(context.parsed.y) } } } }
  });
  charts.region = new Chart($("regionChart"), {
    type: "bar",
    data: { labels: Object.keys(regions), datasets: [{ label: "Faturamento", data: Object.values(regions), backgroundColor: "#ffc72c", borderRadius: 5, maxBarThickness: 34 }] },
    options: { ...chartOptions(), plugins: { ...chartOptions().plugins, tooltip: { callbacks: { label: (context) => " " + formatCurrency(context.parsed.y) } } } }
  });
}
function updateMetrics(rows) {
  const metrics = calculateMetrics(rows);
  $("totalRevenue").textContent = formatCurrency(metrics.total);
  $("salesCount").textContent = NUMBER.format(metrics.uniqueSales);
  $("unitsSold").textContent = NUMBER.format(metrics.units);
  $("averageTicket").textContent = formatCurrency(metrics.ticket);
}
function compareValues(a, b, key) {
  const first = key === "faturamento" ? revenue(a) : a[key];
  const second = key === "faturamento" ? revenue(b) : b[key];
  if (key === "quantidade" || key === "preco_unitario" || key === "faturamento") return first - second;
  return String(first).localeCompare(String(second), "pt-BR", { numeric: true });
}
function renderTable(rows) {
  const body = $("salesTableBody");
  const sorted = [...rows].sort((a, b) => compareValues(a, b, sortState.key) * (sortState.direction === "ascending" ? 1 : -1));
  body.innerHTML = sorted.map((row) => `
    <tr><td>${escapeHtml(row.id_venda)}</td><td>${formatDate(row.data)}</td><td>${escapeHtml(row.produto)}</td>
    <td>${escapeHtml(row.categoria)}</td><td>${escapeHtml(row.regiao)}</td><td class="numeric">${NUMBER.format(row.quantidade)}</td>
    <td class="numeric">${formatCurrency(row.preco_unitario)}</td><td class="numeric"><strong>${formatCurrency(revenue(row))}</strong></td></tr>`).join("");
  $("tableFooter").textContent = sorted.length ? `Exibindo ${NUMBER.format(sorted.length)} registro(s) • Ordenado por ${sortState.key.replace("_", " ")}` : "";
  $("emptyState").hidden = sorted.length !== 0;
  $("salesTable").style.display = sorted.length ? "table" : "none";
  document.querySelectorAll(".sort-button").forEach((button) => {
    button.setAttribute("aria-sort", button.dataset.sort === sortState.key ? sortState.direction : "none");
  });
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}
function render() {
  filteredRows = getFilteredRows();
  updateMetrics(filteredRows);
  renderTable(filteredRows);
  buildCharts(filteredRows);
  $("filterSummary").textContent = `${NUMBER.format(filteredRows.length)} registro(s) exibido(s) de ${NUMBER.format(allRows.length)}`;
}
function setValidationMessage(message) { $("validationSummary").textContent = message || ""; }
function loadRows(rows, sourceLabel) {
  const result = normalizeRows(rows);
  if (!result.rows.length) {
    setValidationMessage("Nenhuma linha válida foi encontrada.");
    return;
  }
  allRows = result.rows;
  populateFilters();
  $("dataStatusText").textContent = sourceLabel;
  setValidationMessage(result.discarded ? `${NUMBER.format(result.discarded)} registro(s) descartado(s) por dados inválidos.` : `${NUMBER.format(allRows.length)} registros válidos.`);
  render();
}
function exportFilteredCsv() {
  if (!filteredRows.length) return;
  const exportRows = filteredRows.map((row) => ({ ...row, faturamento: revenue(row).toFixed(2) }));
  const csv = Papa.unparse(exportRows, { newline: "\r\n" });
  const blob = new Blob(["\\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = "vendas-filtradas.csv"; link.click();
  URL.revokeObjectURL(url);
}
function setupEvents() {
  ["startDate", "endDate", "categoryFilter", "regionFilter", "tableSearch"].forEach((id) => $(id).addEventListener("input", render));
  $("clearFilters").addEventListener("click", () => {
    ["startDate", "endDate", "categoryFilter", "regionFilter", "tableSearch"].forEach((id) => $(id).value = "");
    setValidationMessage("");
    render();
  });
  $("exportCsv").addEventListener("click", exportFilteredCsv);
  $("logoutButton").addEventListener("click", () => window.location.reload());
  $("csvFile").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;
    Papa.parse(file, { header: true, skipEmptyLines: true, complete: (result) => {
      loadRows(result.data, `Arquivo importado: ${file.name}`);
      if (result.errors.length) setValidationMessage(`${result.errors.length} aviso(s) de leitura; linhas válidas foram mantidas.`);
    }, error: () => setValidationMessage("Não foi possível ler o arquivo CSV.") });
  });
  document.querySelectorAll(".sort-button").forEach((button) => button.addEventListener("click", () => {
    sortState = { key: button.dataset.sort, direction: sortState.key === button.dataset.sort && sortState.direction === "ascending" ? "descending" : "ascending" };
    renderTable(filteredRows);
  }));
}
function startDashboard() {
  populateFilters();
  const initial = normalizeRows(allRows);
  setValidationMessage(`${NUMBER.format(initial.rows.length)} registros demonstrativos válidos.`);
  render();
}
function showDashboard() {
  $("loginScreen").hidden = true;
  $("loginScreen").setAttribute("aria-hidden", "true");
  $("dashboardApp").hidden = false;
  $("dashboardApp").removeAttribute("aria-hidden");
  startDashboard();
  $("clearFilters").focus();
}
function setupWelcome() {
  const welcome = $("loginScreen");
  welcome.querySelector(".eyebrow").textContent = "Bem-vindo à casa";
  $("loginTitle").textContent = "Seu painel de sabores.";
  welcome.querySelector(".login-text").textContent = "Explore seus dados e acompanhe os indicadores mais importantes.";
  welcome.querySelectorAll(".field, .login-error").forEach((element) => { element.hidden = true; });
  const form = $("welcomeForm");
  const button = form.querySelector("button");
  button.textContent = "Conheça nosso dashboard";
  const foods = document.createElement("div");
  foods.className = "welcome-foods";
  foods.setAttribute("aria-label", "Hambúrgueres em destaque");
  foods.innerHTML = `
    <figure><img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=85" alt="Hambúrguer clássico com queijo"><figcaption>Big Mac</figcaption></figure>
    <figure><img src="https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=500&q=85" alt="Hambúrguer com queijo e bacon"><figcaption>Quarterão</figcaption></figure>
    <figure><img src="https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=500&q=85" alt="Hambúrguer de frango"><figcaption>McChicken</figcaption></figure>`;
  form.before(foods);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    window.location.href = "dashboard.html";
  });
}
function setupLogin() {
  $("loginForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const username = $("loginUser").value.trim();
    const password = $("loginPassword").value;
    if (username === "timas" && password === "timas") {
      showDashboard();
      return;
    }
    $("loginError").textContent = "Usuário ou senha incorretos.";
    $("loginPassword").select();
  });
}
setupEvents();
setupLogin();

