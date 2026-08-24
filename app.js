/* ==========================================================================
   Calculadora Impressão 3D Pro - Motor de Cálculo & Lógica Interativa
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // --- Element Selectors ---
  const el = {
    // Inputs: Project & Filament
    projectName: document.getElementById('project-name'),
    filamentWeight: document.getElementById('filament-weight'),
    filamentCost: document.getElementById('filament-cost'),
    printHours: document.getElementById('print-hours'),
    printMinutes: document.getElementById('print-minutes'),

    // Inputs: Energy
    kwhRate: document.getElementById('kwh-rate'),
    printerPower: document.getElementById('printer-power'),
    billTotalValue: document.getElementById('bill-total-value'),
    billTotalKwh: document.getElementById('bill-total-kwh'),
    calculatedKwhBadge: document.getElementById('calculated-kwh-badge'),
    tabTariffDirect: document.getElementById('tab-tariff-direct'),
    tabTariffBill: document.getElementById('tab-tariff-bill'),
    tariffDirectContainer: document.getElementById('tariff-direct-container'),
    tariffBillContainer: document.getElementById('tariff-bill-container'),

    // Inputs: Machine & Labor
    printerPrice: document.getElementById('printer-price'),
    printerLifespan: document.getElementById('printer-lifespan'),
    maintenanceRate: document.getElementById('maintenance-rate'),
    hourlyLaborRate: document.getElementById('hourly-labor-rate'),
    laborPrepTime: document.getElementById('labor-prep-time'),
    laborPostTime: document.getElementById('labor-post-time'),

    // Inputs: Extras & Platform
    extrasCost: document.getElementById('extras-cost'),
    failureRiskPct: document.getElementById('failure-risk-pct'),
    platformPreset: document.getElementById('platform-preset'),
    platformFeePct: document.getElementById('platform-fee-pct'),

    // Strategy & Pricing Controls
    pricingModeLabel: document.getElementById('pricing-mode-label'),
    desiredMarginPct: document.getElementById('desired-margin-pct'),
    marginSlider: document.getElementById('margin-slider'),
    customSellingPrice: document.getElementById('custom-selling-price'),
    strategyMarginInput: document.getElementById('strategy-margin-input'),
    strategyMultiplierInput: document.getElementById('strategy-multiplier-input'),
    strategyFixedInput: document.getElementById('strategy-fixed-input'),

    // Displays: Hero
    finalSellingPrice: document.getElementById('final-selling-price'),
    totalProductionCost: document.getElementById('total-production-cost'),
    netProfitValue: document.getElementById('net-profit-value'),
    netProfitMargin: document.getElementById('net-profit-margin'),
    mobileStickyPrice: document.getElementById('mobile-sticky-price'),

    // Displays: Financial Cents & Monthly Goal
    centsAllocationList: document.getElementById('cents-allocation-list'),
    monthlyIncomeGoal: document.getElementById('monthly-income-goal'),
    goalUnitsMonthly: document.getElementById('goal-units-monthly'),
    goalUnitsDaily: document.getElementById('goal-units-daily'),
    goalGrossRevenue: document.getElementById('goal-gross-revenue'),

    // Finance View Elements
    navTabCalc: document.getElementById('nav-tab-calc'),
    navTabFinance: document.getElementById('nav-tab-finance'),
    viewCalculator: document.getElementById('view-calculator'),
    viewFinance: document.getElementById('view-finance'),
    salesCountBadge: document.getElementById('sales-count-badge'),
    btnRegisterSale: document.getElementById('btn-register-sale'),
    btnClearFinanceHistory: document.getElementById('btn-clear-finance-history'),

    // Finance Metrics Displays
    finTotalCash: document.getElementById('fin-total-cash'),
    finGrossRevenue: document.getElementById('fin-gross-revenue'),
    finNetProfit: document.getElementById('fin-net-profit'),
    finTotalSalesCount: document.getElementById('fin-total-sales-count'),

    // Envelopes Displays
    envFilamentVal: document.getElementById('env-filament-val'),
    envEnergyVal: document.getElementById('env-energy-val'),
    envMachineVal: document.getElementById('env-machine-val'),
    envLaborVal: document.getElementById('env-labor-val'),
    envProfitVal: document.getElementById('env-profit-val'),
    salesHistoryTableBody: document.getElementById('sales-history-table-body'),

    // Displays: Cost Legend & Chart
    summaryWeight: document.getElementById('summary-weight'),
    costFilamentVal: document.getElementById('cost-filament-val'),
    costEnergyVal: document.getElementById('cost-energy-val'),
    costMachineVal: document.getElementById('cost-machine-val'),
    costLaborVal: document.getElementById('cost-labor-val'),
    costExtrasVal: document.getElementById('cost-extras-val'),
    costFeeVal: document.getElementById('cost-fee-val'),
    legendFeeRow: document.getElementById('legend-fee-row'),
    costProfitVal: document.getElementById('cost-profit-val'),
    chartCenterCost: document.getElementById('chart-center-cost'),
    costDonutChart: document.getElementById('cost-donut-chart'),

    // Wholesale Table
    wholesaleTableBody: document.getElementById('wholesale-table-body'),

    // Actions & Modal
    btnLoadPhotoPreset: document.getElementById('btn-load-photo-preset'),
    btnToggleTheme: document.getElementById('btn-toggle-theme'),
    themeIcon: document.getElementById('theme-icon'),
    btnOpenQuoteModal: document.getElementById('btn-open-quote-modal'),
    btnCloseModal: document.getElementById('btn-close-modal'),
    quoteModal: document.getElementById('quote-modal'),
    quoteTextBox: document.getElementById('quote-text-box'),
    btnCopyWhatsapp: document.getElementById('btn-copy-whatsapp'),
    btnPrintPdf: document.getElementById('btnPrintPdf'), // Optional
    btnSaveProject: document.getElementById('btn-save-project'),
    toastNotification: document.getElementById('toast-notification'),
    toastMessage: document.getElementById('toast-message'),
  };

  // --- App State ---
  let state = {
    energyMode: 'direct', // 'direct' | 'bill'
    strategy: 'margin',   // 'margin' | 'multiplier' | 'target-price'
    selectedMultiplier: 3,
    activePreset: 'bambu-a1',
    salesLedger: JSON.parse(localStorage.getItem('calc3d_sales_ledger') || '[]'),
    currentCalculation: null
  };

  // --- Formatting Helpers ---
  const fmtCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const fmtNum = (val, decimals = 2) => {
    return (val || 0).toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  // --- Calculation Engine ---
  function calculateAll() {
    // 1. Inputs Parsing
    const weightG = parseFloat(el.filamentWeight.value) || 0;
    const filamentCostPerKg = parseFloat(el.filamentCost.value) || 0;
    const printH = parseFloat(el.printHours.value) || 0;
    const printM = parseFloat(el.printMinutes.value) || 0;
    const totalPrintHours = printH + (printM / 60);

    // Energy Tariff
    let effectiveKwhRate = 0.973;
    if (state.energyMode === 'bill') {
      const billTotal = parseFloat(el.billTotalValue.value) || 0;
      const billKwh = parseFloat(el.billTotalKwh.value) || 1;
      effectiveKwhRate = billTotal / billKwh;
      el.calculatedKwhBadge.textContent = `${fmtCurrency(effectiveKwhRate)} / kWh`;
      el.kwhRate.value = effectiveKwhRate.toFixed(3);
    } else {
      effectiveKwhRate = parseFloat(el.kwhRate.value) || 0;
    }

    const printerPowerW = parseFloat(el.printerPower.value) || 0;
    const printerPowerKw = printerPowerW / 1000;

    // Machine & Wear
    const pPrice = parseFloat(el.printerPrice.value) || 0;
    const pLifespan = parseFloat(el.printerLifespan.value) || 1;
    const maintenanceRateH = parseFloat(el.maintenanceRate.value) || 0;

    // Labor
    const laborRateH = parseFloat(el.hourlyLaborRate.value) || 0;
    const prepM = parseFloat(el.laborPrepTime.value) || 0;
    const postM = parseFloat(el.laborPostTime.value) || 0;
    const totalLaborHours = (prepM + postM) / 60;

    // Extras & Risk & Fees
    const extras = parseFloat(el.extrasCost.value) || 0;
    const riskPct = parseFloat(el.failureRiskPct.value) || 0;
    const platformFeePct = parseFloat(el.platformFeePct.value) || 0;

    // 2. Component Costs Calculation
    const costFilament = (weightG / 1000) * filamentCostPerKg;
    const costEnergy = printerPowerKw * totalPrintHours * effectiveKwhRate;
    
    const depreciationPerHour = pPrice / pLifespan;
    const costMachineDepreciation = totalPrintHours * depreciationPerHour;
    const costMachineMaintenance = totalPrintHours * maintenanceRateH;
    const costMachineTotal = costMachineDepreciation + costMachineMaintenance;

    const costLabor = totalLaborHours * laborRateH;

    // Direct Cost before risk
    const subtotalDirectCost = costFilament + costEnergy + costMachineTotal + costLabor + extras;
    const costRisk = subtotalDirectCost * (riskPct / 100);

    // Total Base Production Cost
    const totalProductionCost = subtotalDirectCost + costRisk;

    // 3. Selling Price & Net Profit Strategy Calculation
    let sellingPrice = 0;
    let netProfit = 0;
    let netMarginPct = 0;
    let platformFeeValue = 0;

    if (state.strategy === 'margin') {
      const marginTargetPct = parseFloat(el.desiredMarginPct.value) || 0;
      // Formula: Selling Price = (Cost * (1 + Margin%)) / (1 - PlatformFee%)
      const netMultiplier = 1 + (marginTargetPct / 100);
      const feeDenominator = Math.max(0.05, 1 - (platformFeePct / 100));
      sellingPrice = (totalProductionCost * netMultiplier) / feeDenominator;
      platformFeeValue = sellingPrice * (platformFeePct / 100);
      netProfit = sellingPrice - platformFeeValue - totalProductionCost;
      netMarginPct = sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;
      el.pricingModeLabel.textContent = `Margem ${marginTargetPct}%`;
    } 
    else if (state.strategy === 'multiplier') {
      const rawPrice = totalProductionCost * state.selectedMultiplier;
      const feeDenominator = Math.max(0.05, 1 - (platformFeePct / 100));
      sellingPrice = rawPrice / feeDenominator;
      platformFeeValue = sellingPrice * (platformFeePct / 100);
      netProfit = sellingPrice - platformFeeValue - totalProductionCost;
      netMarginPct = sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;
      el.pricingModeLabel.textContent = `Markup ${state.selectedMultiplier}x`;
    } 
    else if (state.strategy === 'target-price') {
      sellingPrice = parseFloat(el.customSellingPrice.value) || 0;
      platformFeeValue = sellingPrice * (platformFeePct / 100);
      netProfit = sellingPrice - platformFeeValue - totalProductionCost;
      netMarginPct = sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;
      el.pricingModeLabel.textContent = `Preço Fixo`;
    }

    // Save current calculation details for sales registration
    state.currentCalculation = {
      name: el.projectName.value || "Peça 3D",
      sellingPrice,
      totalProductionCost,
      netProfit,
      costFilament,
      costEnergy,
      costMachineTotal,
      costLabor,
      costExtras: extras + costRisk,
      platformFeeValue
    };

    // 4. Update Main Displays
    el.finalSellingPrice.textContent = fmtNum(sellingPrice, 2);
    if (el.mobileStickyPrice) el.mobileStickyPrice.textContent = `R$ ${fmtNum(sellingPrice, 2)}`;
    el.totalProductionCost.textContent = fmtCurrency(totalProductionCost);
    el.netProfitValue.textContent = fmtCurrency(netProfit);
    el.netProfitMargin.textContent = `${fmtNum(netMarginPct, 1)}%`;

    // 5. Render Financial Allocation ("Para onde vai cada R$ 1,00")
    renderCentsAllocation({
      costFilament,
      costEnergy,
      costMachineTotal,
      costLabor,
      costExtras: extras + costRisk,
      platformFeeValue,
      netProfit: Math.max(0, netProfit),
      sellingPrice: Math.max(0.01, sellingPrice)
    });

    // 6. Render Monthly Income Goal Simulator
    renderMonthlyGoal(netProfit, sellingPrice);

    // 7. Update Breakdown Legend Values
    el.summaryWeight.textContent = fmtNum(weightG, 1);
    el.costFilamentVal.textContent = fmtCurrency(costFilament);
    el.costEnergyVal.textContent = fmtCurrency(costEnergy);
    el.costMachineVal.textContent = fmtCurrency(costMachineTotal);
    el.costLaborVal.textContent = fmtCurrency(costLabor);
    el.costExtrasVal.textContent = fmtCurrency(extras + costRisk);
    el.costProfitVal.textContent = fmtCurrency(netProfit);
    el.chartCenterCost.textContent = fmtCurrency(totalProductionCost);

    if (platformFeePct > 0) {
      el.legendFeeRow.classList.remove('hidden');
      el.costFeeVal.textContent = fmtCurrency(platformFeeValue);
    } else {
      el.legendFeeRow.classList.add('hidden');
    }

    // 6. Draw Donut Chart SVG
    renderDonutChart({
      costFilament,
      costEnergy,
      costMachineTotal,
      costLabor,
      costExtras: extras + costRisk,
      platformFeeValue,
      netProfit: Math.max(0, netProfit),
      totalPrice: Math.max(0.01, sellingPrice)
    });

    // 7. Update Wholesale Table
    renderWholesaleTable({
      costFilament,
      costEnergy,
      costMachineTotal,
      costLaborOneUnit: costLabor,
      prepMinutes: prepM,
      postMinutes: postM,
      laborRateH,
      extrasUnit: extras,
      riskPct,
      sellingPriceOneUnit: sellingPrice,
      platformFeePct
    });
  }

  // --- Cents Allocation Renderer (Destinação do Dinheiro) ---
  function renderCentsAllocation(data) {
    if (!el.centsAllocationList) return;

    const total = data.sellingPrice;
    if (total <= 0) return;

    const items = [
      { name: '🥩 Filamento (Matéria-Prima)', val: data.costFilament, fillClass: 'fill-filament' },
      { name: '⚡ Energia Elétrica', val: data.costEnergy, fillClass: 'fill-energy' },
      { name: '🛠️ Fundo de Máquina & Bicos', val: data.costMachineTotal, fillClass: 'fill-machine' },
      { name: '👷 Sua Mão de Obra (Pro-labore)', val: data.costLabor, fillClass: 'fill-labor' },
      { name: '📦 Extras & Reserva de Risco', val: data.costExtras, fillClass: 'fill-extras' },
      { name: '🛍️ Taxa da Plataforma', val: data.platformFeeValue, fillClass: 'fill-fee' },
      { name: '🚀 LUCRO LÍQUIDO DA EMPRESA', val: data.netProfit, fillClass: 'fill-profit', highlight: true }
    ];

    let html = '';

    items.forEach(item => {
      if (item.val <= 0) return;
      const pct = (item.val / total) * 100;
      const valPer100 = (pct).toFixed(2); // In R$ per R$ 100 sold

      html += `
        <div class="cents-item">
          <div class="cents-label-row">
            <span class="cents-name">${item.name}</span>
            <span class="cents-val ${item.highlight ? 'text-success' : ''}">
              ${fmtCurrency(item.val)} (${fmtNum(pct, 1)}%)
            </span>
          </div>
          <div class="cents-progress-bg">
            <div class="cents-progress-fill ${item.fillClass}" style="width: ${Math.min(100, Math.max(2, pct))}%"></div>
          </div>
        </div>
      `;
    });

    el.centsAllocationList.innerHTML = html;
  }

  // --- Monthly Goal Simulator ---
  function renderMonthlyGoal(netProfitPerUnit, sellingPricePerUnit) {
    if (!el.monthlyIncomeGoal) return;

    const targetGoal = parseFloat(el.monthlyIncomeGoal.value) || 0;

    if (netProfitPerUnit <= 0 || targetGoal <= 0) {
      el.goalUnitsMonthly.textContent = "0 peças / mês";
      el.goalUnitsDaily.textContent = "0 peças / dia";
      el.goalGrossRevenue.textContent = "R$ 0,00";
      return;
    }

    const unitsMonthly = Math.ceil(targetGoal / netProfitPerUnit);
    const unitsDaily = (unitsMonthly / 30).toFixed(1);
    const grossRevenueMonthly = unitsMonthly * sellingPricePerUnit;

    el.goalUnitsMonthly.textContent = `${unitsMonthly} peças / mês`;
    el.goalUnitsDaily.textContent = `${unitsDaily} peças / dia (~${Math.ceil(unitsDaily)}/dia)`;
    el.goalGrossRevenue.textContent = fmtCurrency(grossRevenueMonthly);
  }

  // --- Donut Chart SVG Renderer ---
  function renderDonutChart(data) {
    const total = data.totalPrice;
    if (total <= 0) return;

    const slices = [
      { name: 'filament', val: data.costFilament, color: 'var(--chart-filament)' },
      { name: 'energy', val: data.costEnergy, color: 'var(--chart-energy)' },
      { name: 'machine', val: data.costMachineTotal, color: 'var(--chart-machine)' },
      { name: 'labor', val: data.costLabor, color: 'var(--chart-labor)' },
      { name: 'extras', val: data.costExtras, color: 'var(--chart-extras)' },
      { name: 'fee', val: data.platformFeeValue, color: 'var(--chart-fee)' },
      { name: 'profit', val: data.netProfit, color: 'var(--chart-profit)' }
    ];

    let cumulativeAngle = 0;
    const cx = 50;
    const cy = 50;
    const r = 38;
    const strokeWidth = 14;
    const circumference = 2 * Math.PI * r;

    let svgHtml = '';

    slices.forEach(slice => {
      if (slice.val <= 0) return;
      const pct = slice.val / total;
      const strokeDasharray = `${pct * circumference} ${circumference}`;
      const strokeDashoffset = -cumulativeAngle * circumference;

      svgHtml += `
        <circle cx="${cx}" cy="${cy}" r="${r}"
                fill="transparent"
                stroke="${slice.color}"
                stroke-width="${strokeWidth}"
                stroke-dasharray="${strokeDasharray}"
                stroke-dashoffset="${strokeDashoffset}"
                transform="rotate(-90 ${cx} ${cy})">
        </circle>
      `;

      cumulativeAngle += pct;
    });

    el.costDonutChart.innerHTML = svgHtml;
  }

  // --- Wholesale Table Renderer ---
  function renderWholesaleTable(data) {
    const quantities = [1, 5, 10, 25, 50];
    let html = '';

    quantities.forEach(qty => {
      // In batch production, prep time (slicing, bed setup) happens once for the batch!
      const batchPrepLaborH = (data.prepMinutes / 60) * data.laborRateH;
      const unitPrepLabor = batchPrepLaborH / qty;
      const unitPostLabor = (data.postMinutes / 60) * data.laborRateH;

      const unitLaborCost = unitPrepLabor + unitPostLabor;

      const directUnitCost = data.costFilament + data.costEnergy + data.costMachineTotal + unitLaborCost + data.extrasUnit;
      const totalUnitCost = directUnitCost * (1 + data.riskPct / 100);

      // Volume discount on profit margin
      let volumeDiscountFactor = 1.0;
      if (qty >= 50) volumeDiscountFactor = 0.75;
      else if (qty >= 25) volumeDiscountFactor = 0.82;
      else if (qty >= 10) volumeDiscountFactor = 0.88;
      else if (qty >= 5) volumeDiscountFactor = 0.93;

      let unitSellingPrice = 0;
      if (state.strategy === 'margin') {
        const targetMargin = (parseFloat(el.desiredMarginPct.value) || 0) * volumeDiscountFactor;
        const netMultiplier = 1 + (targetMargin / 100);
        const feeDenominator = Math.max(0.05, 1 - (data.platformFeePct / 100));
        unitSellingPrice = (totalUnitCost * netMultiplier) / feeDenominator;
      } else {
        unitSellingPrice = data.sellingPriceOneUnit * volumeDiscountFactor;
      }

      const totalBatchPrice = unitSellingPrice * qty;
      const totalBatchCost = totalUnitCost * qty;
      const feeVal = totalBatchPrice * (data.platformFeePct / 100);
      const totalBatchProfit = totalBatchPrice - feeVal - totalBatchCost;

      html += `
        <tr>
          <td><strong>${qty}x</strong></td>
          <td>${fmtCurrency(totalUnitCost)}</td>
          <td><strong class="text-accent">${fmtCurrency(unitSellingPrice)}</strong></td>
          <td>${fmtCurrency(totalBatchPrice)}</td>
          <td><span class="text-success font-bold">${fmtCurrency(totalBatchProfit)}</span></td>
        </tr>
      `;
    });

    el.wholesaleTableBody.innerHTML = html;
  }

  // --- Photo Preset Loader (Bambu A1 + Fatiador + Fatura) ---
  function loadPhotoPreset() {
    el.projectName.value = "Vaso Geométrico Espiral";
    el.filamentWeight.value = "84.30";
    el.filamentCost.value = "100.00";
    el.printHours.value = "1";
    el.printMinutes.value = "51";

    el.printerPower.value = "120"; // Bambu Lab A1 average W
    el.printerPrice.value = "4500.00";
    el.printerLifespan.value = "5000";

    el.billTotalValue.value = "142.04";
    el.billTotalKwh.value = "146.0";
    el.kwhRate.value = "0.973";

    el.laborPrepTime.value = "15";
    el.laborPostTime.value = "10";
    el.hourlyLaborRate.value = "30.00";
    el.extrasCost.value = "3.50";

    showToast("Preset da Foto (Bambu A1 + Conta de Luz) carregado com sucesso!");
    calculateAll();
  }

  // --- Printer Presets ---
  const printerPresets = {
    'bambu-a1': { power: 120, price: 4500, lifespan: 5000 },
    'bambu-mini': { power: 90, price: 2800, lifespan: 5000 },
    'bambu-p1s': { power: 150, price: 6500, lifespan: 6000 },
    'ender-3': { power: 120, price: 1500, lifespan: 3000 },
  };

  function applyPrinterPreset(presetKey) {
    const p = printerPresets[presetKey];
    if (p) {
      el.printerPower.value = p.power;
      el.printerPrice.value = p.price;
      el.printerLifespan.value = p.lifespan;
      state.activePreset = presetKey;

      document.querySelectorAll('.chip-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.preset === presetKey);
      });

      calculateAll();
    }
  }

  // --- WhatsApp Quote Text Generator ---
  function generateQuoteText() {
    const name = el.projectName.value || "Peça 3D Personalizada";
    const weight = el.filamentWeight.value;
    const hours = el.printHours.value;
    const mins = el.printMinutes.value;
    const price = el.finalSellingPrice.textContent;

    const text = `
✨ *ORÇAMENTO DE IMPRESSÃO 3D* ✨
━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 *Produto:* ${name}
🖨️ *Equipamento:* Bambu Lab A1 Combo (Alta Precisão)
⚖️ *Peso aproximado:* ${weight}g
⏱️ *Tempo de Produção:* ${hours}h ${mins}m

💰 *VALOR FINAL:* R$ ${price}
💳 *Formas de Pagamento:* Pix, Cartão ou Boleto
🚚 *Prazo de Produção:* 1 a 2 dias úteis

_Qualidade garantida em filamento premium e acabamento artesanal!_
━━━━━━━━━━━━━━━━━━━━━━━━━━
Dúvidas ou alterações? Responda a esta mensagem!
`.trim();

    el.quoteTextBox.innerText = text;
  }

  // --- Finance & Cash Ledger Manager ---
  function registerCurrentSale() {
    if (!state.currentCalculation) return;

    const sale = {
      id: Date.now(),
      date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      name: state.currentCalculation.name,
      sellingPrice: state.currentCalculation.sellingPrice,
      costPrice: state.currentCalculation.totalProductionCost,
      netProfit: state.currentCalculation.netProfit,
      costFilament: state.currentCalculation.costFilament,
      costEnergy: state.currentCalculation.costEnergy,
      costMachine: state.currentCalculation.costMachineTotal,
      costLabor: state.currentCalculation.costLabor,
    };

    state.salesLedger.unshift(sale);
    localStorage.setItem('calc3d_sales_ledger', JSON.stringify(state.salesLedger));
    
    renderFinanceDashboard();
    showToast(`Venda de "${sale.name}" (${fmtCurrency(sale.sellingPrice)}) registrada no caixa!`);
  }

  function deleteSale(id) {
    state.salesLedger = state.salesLedger.filter(item => item.id !== id);
    localStorage.setItem('calc3d_sales_ledger', JSON.stringify(state.salesLedger));
    renderFinanceDashboard();
    showToast("Venda removida do caixa.");
  }

  function clearFinanceHistory() {
    if (confirm("Tem certeza que deseja limpar todo o histórico de vendas do caixa?")) {
      state.salesLedger = [];
      localStorage.setItem('calc3d_sales_ledger', JSON.stringify(state.salesLedger));
      renderFinanceDashboard();
      showToast("Histórico de caixa zerado.");
    }
  }

  function renderFinanceDashboard() {
    if (!el.finTotalCash) return;

    const count = state.salesLedger.length;
    if (el.salesCountBadge) el.salesCountBadge.textContent = count;
    if (el.finTotalSalesCount) el.finTotalSalesCount.textContent = `${count} ${count === 1 ? 'venda' : 'vendas'}`;

    let totalGross = 0;
    let totalNetProfit = 0;
    let envFilament = 0;
    let envEnergy = 0;
    let envMachine = 0;
    let envLabor = 0;

    state.salesLedger.forEach(item => {
      totalGross += item.sellingPrice || 0;
      totalNetProfit += item.netProfit || 0;
      envFilament += item.costFilament || 0;
      envEnergy += item.costEnergy || 0;
      envMachine += item.costMachine || 0;
      envLabor += item.costLabor || 0;
    });

    el.finTotalCash.textContent = fmtCurrency(totalGross);
    el.finGrossRevenue.textContent = fmtCurrency(totalGross);
    el.finNetProfit.textContent = fmtCurrency(totalNetProfit);

    el.envFilamentVal.textContent = fmtCurrency(envFilament);
    el.envEnergyVal.textContent = fmtCurrency(envEnergy);
    el.envMachineVal.textContent = fmtCurrency(envMachine);
    el.envLaborVal.textContent = fmtCurrency(envLabor);
    el.envProfitVal.textContent = fmtCurrency(totalNetProfit);

    // Render Table
    if (!el.salesHistoryTableBody) return;

    if (count === 0) {
      el.salesHistoryTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--text-dim); padding: 1.5rem;">
            Nenhuma venda registrada ainda. Clique em <strong>"Registrar Venda no Caixa"</strong> na calculadora!
          </td>
        </tr>
      `;
      return;
    }

    let html = '';
    state.salesLedger.forEach(item => {
      html += `
        <tr>
          <td><small class="text-muted">${item.date}</small></td>
          <td><strong>${item.name}</strong></td>
          <td>${fmtCurrency(item.sellingPrice)}</td>
          <td>${fmtCurrency(item.costPrice)}</td>
          <td><span class="text-success font-bold">${fmtCurrency(item.netProfit)}</span></td>
          <td>
            <button class="btn btn-secondary btn-sm btn-delete-sale" data-id="${item.id}" style="padding: 2px 8px; font-weight: bold;">
              &times;
            </button>
          </td>
        </tr>
      `;
    });

    el.salesHistoryTableBody.innerHTML = html;

    // Attach delete listeners
    document.querySelectorAll('.btn-delete-sale').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.target.dataset.id);
        deleteSale(id);
      });
    });
  }

  // --- Main View Tabs Switcher ---
  if (el.navTabCalc && el.navTabFinance) {
    el.navTabCalc.addEventListener('click', () => {
      el.navTabCalc.classList.add('active');
      el.navTabFinance.classList.remove('active');
      el.viewCalculator.classList.remove('hidden');
      el.viewFinance.classList.add('hidden');
    });

    el.navTabFinance.addEventListener('click', () => {
      el.navTabFinance.classList.add('active');
      el.navTabCalc.classList.remove('active');
      el.viewFinance.classList.remove('hidden');
      el.viewCalculator.classList.add('hidden');
      renderFinanceDashboard();
    });
  }

  if (el.btnRegisterSale) {
    el.btnRegisterSale.addEventListener('click', registerCurrentSale);
  }

  if (el.btnClearFinanceHistory) {
    el.btnClearFinanceHistory.addEventListener('click', clearFinanceHistory);
  }

  // --- Toast Notification ---
  function showToast(msg) {
    el.toastMessage.textContent = msg;
    el.toastNotification.classList.remove('hidden');
    setTimeout(() => {
      el.toastNotification.classList.add('hidden');
    }, 3000);
  }

  // --- Event Listeners ---

  // All input changes recalculate in real-time
  const allInputs = [
    el.projectName, el.filamentWeight, el.filamentCost, el.printHours, el.printMinutes,
    el.kwhRate, el.printerPower, el.billTotalValue, el.billTotalKwh,
    el.printerPrice, el.printerLifespan, el.maintenanceRate, el.hourlyLaborRate,
    el.laborPrepTime, el.laborPostTime, el.extrasCost, el.failureRiskPct,
    el.platformFeePct, el.desiredMarginPct, el.customSellingPrice, el.monthlyIncomeGoal
  ];

  allInputs.forEach(input => {
    if (input) {
      input.addEventListener('input', calculateAll);
    }
  });

  // Mobile Sticky Bar Button Event
  const btnMobileWhatsapp = document.getElementById('btn-mobile-whatsapp');
  if (btnMobileWhatsapp) {
    btnMobileWhatsapp.addEventListener('click', () => {
      generateQuoteText();
      el.quoteModal.classList.remove('hidden');
    });
  }

  // Margin Slider Sync
  el.marginSlider.addEventListener('input', (e) => {
    el.desiredMarginPct.value = e.target.value;
    calculateAll();
  });
  el.desiredMarginPct.addEventListener('input', (e) => {
    el.marginSlider.value = e.target.value;
    calculateAll();
  });

  // Tariff Tab Switcher
  el.tabTariffDirect.addEventListener('click', () => {
    state.energyMode = 'direct';
    el.tabTariffDirect.classList.add('active');
    el.tabTariffBill.classList.remove('active');
    el.tariffDirectContainer.classList.remove('hidden');
    el.tariffBillContainer.classList.add('hidden');
    calculateAll();
  });

  el.tabTariffBill.addEventListener('click', () => {
    state.energyMode = 'bill';
    el.tabTariffBill.classList.add('active');
    el.tabTariffDirect.classList.remove('active');
    el.tariffBillContainer.classList.remove('hidden');
    el.tariffDirectContainer.classList.add('hidden');
    calculateAll();
  });

  // Strategy Picker Buttons
  document.querySelectorAll('.strategy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.strategy-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      state.strategy = e.target.dataset.strategy;

      el.strategyMarginInput.classList.toggle('hidden', state.strategy !== 'margin');
      el.strategyMultiplierInput.classList.toggle('hidden', state.strategy !== 'multiplier');
      el.strategyFixedInput.classList.toggle('hidden', state.strategy !== 'target-price');

      calculateAll();
    });
  });

  // Multiplier Chips
  document.querySelectorAll('.chip-mult').forEach(chip => {
    chip.addEventListener('click', (e) => {
      document.querySelectorAll('.chip-mult').forEach(c => c.classList.remove('active'));
      e.target.classList.add('active');
      state.selectedMultiplier = parseFloat(e.target.dataset.mult);
      calculateAll();
    });
  });

  // Printer Preset Chips
  document.querySelectorAll('.chip-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      applyPrinterPreset(e.target.dataset.preset);
    });
  });

  // Platform Preset Select
  el.platformPreset.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val !== 'custom') {
      el.platformFeePct.value = val;
    }
    calculateAll();
  });

  // Photo Preset Loader Button
  el.btnLoadPhotoPreset.addEventListener('click', loadPhotoPreset);

  // Modal Controls
  el.btnOpenQuoteModal.addEventListener('click', () => {
    generateQuoteText();
    el.quoteModal.classList.remove('hidden');
  });

  el.btnCloseModal.addEventListener('click', () => {
    el.quoteModal.classList.add('hidden');
  });

  el.quoteModal.addEventListener('click', (e) => {
    if (e.target === el.quoteModal) {
      el.quoteModal.classList.add('hidden');
    }
  });

  // Copy WhatsApp Text
  el.btnCopyWhatsapp.addEventListener('click', () => {
    const text = el.quoteTextBox.innerText;
    navigator.clipboard.writeText(text).then(() => {
      showToast("Orçamento copiado para a área de transferência!");
    });
  });

  // Print PDF
  const btnPrintPdf = document.getElementById('btn-print-pdf');
  if (btnPrintPdf) {
    btnPrintPdf.addEventListener('click', () => {
      window.print();
    });
  }

  // Save Project to LocalStorage
  el.btnSaveProject.addEventListener('click', () => {
    const projectData = {
      projectName: el.projectName.value,
      filamentWeight: el.filamentWeight.value,
      filamentCost: el.filamentCost.value,
      printHours: el.printHours.value,
      printMinutes: el.printMinutes.value,
      kwhRate: el.kwhRate.value,
      printerPower: el.printerPower.value,
      printerPrice: el.printerPrice.value,
      desiredMarginPct: el.desiredMarginPct.value
    };
    localStorage.setItem('calc3d_saved_project', JSON.stringify(projectData));
    showToast("Projeto salvo localmente no navegador!");
  });

  // Theme Toggle
  el.btnToggleTheme.addEventListener('click', () => {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    
    if (next === 'light') {
      el.themeIcon.setAttribute('data-lucide', 'sun');
    } else {
      el.themeIcon.setAttribute('data-lucide', 'moon');
    }
    if (window.lucide) lucide.createIcons();
  });

  // --- 3MF / Gcode File Parser (Bambu Studio Reader) ---
  const dropzone = document.getElementById('file-dropzone');
  const fileInput = document.getElementById('file-input');

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        parse3MFFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        parse3MFFile(e.target.files[0]);
      }
    });
  }

  async function parse3MFFile(file) {
    const fileName = file.name;
    const cleanName = fileName.replace(/\.(3mf|gcode|gcode\.gz)$/i, '');
    el.projectName.value = cleanName;

    // Reset values to zero before importing new file
    el.filamentWeight.value = '0.00';
    el.printHours.value = '0';
    el.printMinutes.value = '0';

    if (fileName.toLowerCase().endsWith('.3mf') && window.JSZip) {
      try {
        const zip = await JSZip.loadAsync(file);
        let totalWeightG = 0;
        let totalTimeSec = 0;
        let foundData = false;

        // 1. Inspect slice_info.config or any .config / .xml file
        const configFiles = Object.keys(zip.files).filter(path => 
          /slice_info/i.test(path) || /plate_/i.test(path) || /\.config$/i.test(path) || /\.json$/i.test(path)
        );

        for (const filePath of configFiles) {
          const zipObj = zip.file(filePath);
          if (!zipObj) continue;
          const content = await zipObj.async('string');

          // Parse sum of used_g in Bambu Studio XML: <filament id="1" used_g="84.30" />
          const filamentGMatches = [...content.matchAll(/used_g=["']([0-9.]+)["']/gi)];
          if (filamentGMatches.length > 0) {
            const sumG = filamentGMatches.reduce((acc, m) => acc + parseFloat(m[1]), 0);
            if (sumG > 0) {
              totalWeightG = sumG;
              foundData = true;
            }
          }

          // Parse weight attribute: <metadata key="weight" value="84.30"/>
          if (!totalWeightG) {
            const weightAttr = content.match(/key=["']weight["']\s+value=["']([0-9.]+)["']/i) ||
                               content.match(/weight[_\s]*g?["\s:=]+([0-9.]+)/i);
            if (weightAttr) {
              totalWeightG = parseFloat(weightAttr[1]);
              foundData = true;
            }
          }

          // Parse prediction time (seconds): <metadata key="prediction" value="6660"/>
          const predAttr = content.match(/key=["']prediction["']\s+value=["']([0-9.]+)["']/i) ||
                           content.match(/prediction["\s:=]+([0-9.]+)/i);
          if (predAttr) {
            totalTimeSec = parseFloat(predAttr[1]);
            foundData = true;
          }
        }

        // 2. If metadata not found or incomplete, scan G-code files inside the zip
        if (!totalWeightG || !totalTimeSec) {
          const gcodeFiles = Object.keys(zip.files).filter(path => /\.gcode$/i.test(path));
          for (const gPath of gcodeFiles) {
            const gContent = await zip.file(gPath).async('string');
            const parsed = parseGcodeTextContent(gContent);
            if (parsed.weightG) { totalWeightG = parsed.weightG; foundData = true; }
            if (parsed.timeSec) { totalTimeSec = parsed.timeSec; foundData = true; }
          }
        }

        // Apply results to inputs
        el.filamentWeight.value = totalWeightG > 0 ? totalWeightG.toFixed(2) : '0.00';
        if (totalTimeSec > 0) {
          const h = Math.floor(totalTimeSec / 3600);
          const m = Math.round((totalTimeSec % 3600) / 60);
          el.printHours.value = h;
          el.printMinutes.value = m;
        } else {
          el.printHours.value = '0';
          el.printMinutes.value = '0';
        }

        if (foundData) {
          showToast(`Projeto Bambu "${cleanName}" importado!`);
        } else {
          showToast('⚠️ Arquivo 3MF sem fatiamento prévio. Fatie no Bambu Studio e clique em "Exportar fatiado".');
        }
        calculateAll();

      } catch (err) {
        console.error('Erro ao processar 3MF:', err);
        showToast('Erro ao ler o arquivo 3MF. Verifique o formato.');
      }
    } else if (fileName.toLowerCase().endsWith('.gcode')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const parsed = parseGcodeTextContent(e.target.result);
        el.filamentWeight.value = parsed.weightG ? parsed.weightG.toFixed(2) : '0.00';
        if (parsed.timeSec && parsed.timeSec > 0) {
          el.printHours.value = Math.floor(parsed.timeSec / 3600);
          el.printMinutes.value = Math.round((parsed.timeSec % 3600) / 60);
        } else {
          el.printHours.value = '0';
          el.printMinutes.value = '0';
        }
        showToast('G-code importado com sucesso!');
        calculateAll();
      };
      reader.readAsText(file);
    }
  }

  function parseGcodeTextContent(text) {
    let weightG = null;
    let timeSec = null;

    // Line-by-line parsing prevents multiline regex matching errors
    const lines = text.split(/\r?\n/);

    for (const line of lines) {
      const trimmed = line.trim();

      // Extract Filament Weight [g]
      if (weightG === null && /filament weight|filament_used_g|used_g|filament used|total filament weight/i.test(trimmed)) {
        const weightMatch = trimmed.match(/(?:[=:]|\s)\s*([0-9.]+)\s*g?/i);
        if (weightMatch && parseFloat(weightMatch[1]) > 0) {
          weightG = parseFloat(weightMatch[1]);
        }
      }

      // Extract Printing Time (hours and minutes)
      if (timeSec === null && /estimated printing time|model printing time|total printing time|total estimated time/i.test(trimmed)) {
        const hMatch = trimmed.match(/([0-9]+)\s*h/i);
        const mMatch = trimmed.match(/([0-9]+)\s*m/i);
        const sMatch = trimmed.match(/([0-9]+)\s*s/i);

        const h = hMatch ? parseInt(hMatch[1]) : 0;
        const m = mMatch ? parseInt(mMatch[1]) : 0;
        const s = sMatch ? parseInt(sMatch[1]) : 0;

        const totalS = (h * 3600) + (m * 60) + s;
        if (totalS > 0) {
          timeSec = totalS;
        }
      } else if (timeSec === null && /(?:print_time|total_time|prediction|TIME:)\s*[:=]?\s*([0-9]+)/i.test(trimmed)) {
        const secMatch = trimmed.match(/(?:print_time|total_time|prediction|TIME:)\s*[:=]?\s*([0-9]+)/i);
        if (secMatch && parseInt(secMatch[1]) > 0) {
          timeSec = parseInt(secMatch[1]);
        }
      }

      if (weightG !== null && timeSec !== null) break;
    }

    return { weightG, timeSec };
  }

  // --- Initial Run ---
  calculateAll();
  renderFinanceDashboard();
});
