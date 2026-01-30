// script.js
class MEIAssistant {
    constructor() {
        this.state = {
            identification: {},
            address: {},
            activity: {},
            revenues: [],
            expenses: [],
            assets: [],
            simulation: {
                taxableIncome: 0,
                taxDue: 0,
                effectiveRate: 0,
                brackets: [],
                status: "Não tributável",
                declarationRequired: false
            },
            currentSection: 'home',
            whatIfScenario: {
                active: false,
                additionalRevenue: 0,
                additionalExpenses: 0
            }
        };
        
        // IRPF 2026 brackets
        this.taxBrackets = [
            { max: 22847.76, rate: 0.00, deductible: 0 },
            { max: 33919.80, rate: 0.075, deductible: 1713.58 },
            { max: 45012.60, rate: 0.15, deductible: 4257.57 },
            { max: 55976.16, rate: 0.225, deductible: 7633.51 },
            { max: Infinity, rate: 0.275, deductible: 10432.32 }
        ];
        
        this.init();
    }
    
    init() {
        this.loadState();
        this.setupEventListeners();
        this.generateYearOptions();
        this.populateUFSelects();
        this.setCurrentYear();
        this.updateProgress();
        this.setupMobileLabels();
    }
    
    setupEventListeners() {
        // Navigation
        document.addEventListener('click', (e) => {
            const navBtn = e.target.closest('.nav-btn');
            if (navBtn) {
                const section = navBtn.dataset.section;
                this.navigateTo(section);
                return;
            }
            
            const formActionBtn = e.target.closest('[data-section]');
            if (formActionBtn && formActionBtn.dataset.section) {
                this.navigateTo(formActionBtn.dataset.section);
                return;
            }
            
            // Add revenue
            if (e.target.id === 'add-revenue') {
                this.addRevenue();
                return;
            }
            
            // Add expense
            if (e.target.id === 'add-expense') {
                this.addExpense();
                return;
            }
            
            // Add asset
            if (e.target.id === 'add-asset') {
                this.addAsset();
                return;
            }
            
            // Delete items
            if (e.target.classList.contains('delete-btn')) {
                const itemId = e.target.dataset.id;
                const type = e.target.dataset.type;
                this.deleteItem(itemId, type);
                return;
            }
            
            // Simulation controls
            if (e.target.id === 'run-simulation') {
                this.runTaxSimulation();
                return;
            }
            
            if (e.target.id === 'what-if-btn') {
                this.toggleWhatIfScenario();
                return;
            }
            
            if (e.target.id === 'apply-what-if') {
                this.applyWhatIfScenario();
                return;
            }
            
            if (e.target.id === 'reset-what-if') {
                this.resetWhatIfScenario();
                return;
            }
            
            // Export buttons
            if (e.target.id === 'export-pdf') {
                this.exportPDF();
                return;
            }
            
            if (e.target.id === 'export-simulation') {
                this.exportSimulationData();
                return;
            }
            
            if (e.target.id === 'backup-data') {
                this.backupData();
                return;
            }
            
            if (e.target.id === 'clear-data') {
                if (confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
                    this.clearData();
                }
                return;
            }
        });
        
        // Form input auto-save
        document.addEventListener('input', (e) => {
            if (e.target.matches('.form-input, select, textarea')) {
                this.saveFormData();
                if (e.target.id === 'what-if-revenue' || e.target.id === 'what-if-expenses') {
                    this.applyWhatIfScenario();
                }
            }
        });
        
        // Same address toggle
        document.getElementById('same-address-toggle').addEventListener('change', (e) => {
            this.toggleSameAddress(e.target.checked);
        });
        
        // Format CPF/CNPJ
        document.getElementById('cpf').addEventListener('input', (e) => {
            this.formatCPF(e.target);
        });
        
        document.getElementById('cnpj').addEventListener('input', (e) => {
            this.formatCNPJ(e.target);
        });
        
        // CEP formatting
        document.getElementById('res-cep').addEventListener('input', (e) => {
            this.formatCEP(e.target);
            if (document.getElementById('same-address-toggle').checked) {
                this.syncAddressFields();
            }
        });
        
        document.getElementById('fis-cep').addEventListener('input', (e) => {
            this.formatCEP(e.target);
        });
        
        // Setup fullscreen and print buttons
        this.setupReportControls();
    }
    
    navigateTo(section) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.section === section) {
                btn.classList.add('active');
            }
        });
        
        // Update indicator
        const activeBtn = document.querySelector(`.nav-btn[data-section="${section}"]`);
        if (activeBtn) {
            const navIndicator = document.querySelector('.nav-indicator');
            const btnRect = activeBtn.getBoundingClientRect();
            const navRect = document.querySelector('.navigation').getBoundingClientRect();
            
            navIndicator.style.left = `${btnRect.left - navRect.left}px`;
            navIndicator.style.width = `${btnRect.width}px`;
        }
        
        // Update sections
        document.querySelectorAll('.section').forEach(sec => {
            sec.classList.remove('active');
        });
        
        const targetSection = document.getElementById(`${section}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
            this.state.currentSection = section;
            this.saveState();
            
            // Special handling for sections
            if (section === 'simulation') {
                this.runTaxSimulation();
            } else if (section === 'validation') {
                this.runValidations();
            } else if (section === 'report') {
                this.generateReport();
            }
        }
        
        // Update mobile labels
        this.setupMobileLabels();
    }
    
    generateYearOptions() {
        const select = document.getElementById('ano-fiscal');
        const currentYear = new Date().getFullYear();
        
        // Clear existing options except first
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        for (let year = currentYear; year >= 2020; year--) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            select.appendChild(option);
        }
    }
    
    populateUFSelects() {
        const ufs = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
        
        ['res-uf', 'fis-uf'].forEach(id => {
            const select = document.getElementById(id);
            // Clear existing options except first
            while (select.options.length > 1) {
                select.remove(1);
            }
            
            ufs.forEach(uf => {
                const option = document.createElement('option');
                option.value = uf;
                option.textContent = uf;
                select.appendChild(option);
            });
        });
    }
    
    setCurrentYear() {
        const currentYear = 2026; // Fixed for simulation consistency
        document.getElementById('current-year').textContent = currentYear;
    }
    
    formatCPF(input) {
        let value = input.value.replace(/\D/g, '');
        if (value.length > 11) value = value.substring(0, 11);
        
        if (value.length <= 11) {
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        }
        
        input.value = value;
        this.validateCPF(value);
    }
    
    validateCPF(cpf) {
        const validation = document.getElementById('cpf-validation');
        const cleanCPF = cpf.replace(/\D/g, '');
        
        if (cleanCPF.length === 0) {
            validation.textContent = '';
            validation.style.color = '';
            return;
        }
        
        if (cleanCPF.length !== 11) {
            validation.textContent = 'CPF deve ter 11 dígitos';
            validation.style.color = 'var(--error)';
            return;
        }
        
        // Basic validation
        validation.textContent = '✓ Formato válido';
        validation.style.color = 'var(--success)';
    }
    
    formatCNPJ(input) {
        let value = input.value.replace(/\D/g, '');
        if (value.length > 14) value = value.substring(0, 14);
        
        if (value.length <= 14) {
            value = value.replace(/(\d{2})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d)/, '$1/$2');
            value = value.replace(/(\d{4})(\d{1,2})$/, '$1-$2');
        }
        
        input.value = value;
        this.validateCNPJ(value);
    }
    
    validateCNPJ(cnpj) {
        const validation = document.getElementById('cnpj-validation');
        const cleanCNPJ = cnpj.replace(/\D/g, '');
        
        if (cleanCNPJ.length === 0) {
            validation.textContent = '';
            validation.style.color = '';
            return;
        }
        
        if (cleanCNPJ.length !== 14) {
            validation.textContent = 'CNPJ deve ter 14 dígitos';
            validation.style.color = 'var(--error)';
            return;
        }
        
        validation.textContent = '✓ Formato válido';
        validation.style.color = 'var(--success)';
    }
    
    formatCEP(input) {
        let value = input.value.replace(/\D/g, '');
        if (value.length > 8) value = value.substring(0, 8);
        
        if (value.length > 5) {
            value = value.replace(/(\d{5})(\d)/, '$1-$2');
        }
        
        input.value = value;
    }
    
    toggleSameAddress(checked) {
        const fiscalFields = [
            'fis-cep', 'fis-logradouro', 'fis-numero',
            'fis-complemento', 'fis-bairro', 'fis-cidade', 'fis-uf'
        ];
        
        fiscalFields.forEach(id => {
            const field = document.getElementById(id);
            field.disabled = checked;
            
            if (checked) {
                field.classList.add('disabled');
            } else {
                field.classList.remove('disabled');
            }
        });
        
        if (checked) {
            this.syncAddressFields();
        }
    }
    
    syncAddressFields() {
        const residentialFields = [
            'res-cep', 'res-logradouro', 'res-numero',
            'res-complemento', 'res-bairro', 'res-cidade', 'res-uf'
        ];
        
        const fiscalFields = [
            'fis-cep', 'fis-logradouro', 'fis-numero',
            'fis-complemento', 'fis-bairro', 'fis-cidade', 'fis-uf'
        ];
        
        residentialFields.forEach((resId, index) => {
            const fisId = fiscalFields[index];
            const resField = document.getElementById(resId);
            const fisField = document.getElementById(fisId);
            
            if (resField && fisField) {
                fisField.value = resField.value;
            }
        });
    }
    
    addRevenue() {
        const source = document.getElementById('revenue-source').value.trim();
        const value = parseFloat(document.getElementById('revenue-value').value);
        const type = document.getElementById('revenue-type').value;
        const date = document.getElementById('revenue-date').value;
        
        if (!source || isNaN(value) || !date) {
            alert('Preencha todos os campos obrigatórios da receita.');
            return;
        }
        
        const revenue = {
            id: Date.now(),
            source,
            value,
            type,
            date
        };
        
        this.state.revenues.push(revenue);
        this.saveState();
        this.updateRevenuesList();
        this.clearRevenueForm();
        this.runTaxSimulation();
    }
    
    clearRevenueForm() {
        document.getElementById('revenue-source').value = '';
        document.getElementById('revenue-value').value = '';
        document.getElementById('revenue-date').value = '';
    }
    
    updateRevenuesList() {
        const container = document.getElementById('revenue-items');
        const totalElement = document.getElementById('total-revenue');
        const countElement = document.getElementById('revenue-count');
        const averageElement = document.getElementById('monthly-average');
        
        if (this.state.revenues.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhuma receita cadastrada ainda.</div>';
            totalElement.textContent = 'R$ 0,00';
            countElement.textContent = '0';
            averageElement.textContent = 'R$ 0,00';
            return;
        }
        
        let total = 0;
        let html = '';
        
        this.state.revenues.forEach(revenue => {
            total += revenue.value;
            
            const formattedDate = new Date(revenue.date).toLocaleDateString('pt-BR');
            const formattedValue = revenue.value.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });
            
            const typeLabels = {
                'servico': 'Serviço',
                'comercio': 'Comércio',
                'misto': 'Misto',
                'outro': 'Outro'
            };
            
            html += `
                <div class="list-item">
                    <span data-label="Fonte:">${revenue.source}</span>
                    <span data-label="Valor:">${formattedValue}</span>
                    <span data-label="Tipo:">${typeLabels[revenue.type] || revenue.type}</span>
                    <span data-label="Data:">${formattedDate}</span>
                    <span>
                        <button class="delete-btn" data-id="${revenue.id}" data-type="revenue">
                            Excluir
                        </button>
                    </span>
                </div>
            `;
        });
        
        container.innerHTML = html;
        const formattedTotal = total.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
        totalElement.textContent = formattedTotal;
        countElement.textContent = this.state.revenues.length.toString();
        
        // Calculate monthly average
        const monthlyAverage = total / 12;
        averageElement.textContent = monthlyAverage.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
        
        // Update mobile labels
        this.setupMobileLabels();
    }
    
    addExpense() {
        const description = document.getElementById('expense-description').value.trim();
        const value = parseFloat(document.getElementById('expense-value').value);
        const category = document.getElementById('expense-category').value;
        const date = document.getElementById('expense-date').value;
        const note = document.getElementById('expense-note').value.trim();
        
        if (!description || isNaN(value) || !date) {
            alert('Preencha todos os campos obrigatórios da despesa.');
            return;
        }
        
        const expense = {
            id: Date.now(),
            description,
            value,
            category,
            date,
            note
        };
        
        this.state.expenses.push(expense);
        this.saveState();
        this.updateExpensesList();
        this.clearExpenseForm();
        this.runTaxSimulation();
    }
    
    clearExpenseForm() {
        document.getElementById('expense-description').value = '';
        document.getElementById('expense-value').value = '';
        document.getElementById('expense-date').value = '';
        document.getElementById('expense-note').value = '';
    }
    
    updateExpensesList() {
        const container = document.getElementById('expense-items');
        const totalElement = document.getElementById('total-expenses');
        const categoryElement = document.getElementById('expenses-by-category');
        const profitElement = document.getElementById('estimated-profit');
        
        if (this.state.expenses.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhuma despesa cadastrada ainda.</div>';
            totalElement.textContent = 'R$ 0,00';
            categoryElement.textContent = '-';
            profitElement.textContent = 'R$ 0,00';
            return;
        }
        
        let total = 0;
        let html = '';
        const categories = {};
        
        this.state.expenses.forEach(expense => {
            total += expense.value;
            
            // Count by category
            categories[expense.category] = (categories[expense.category] || 0) + 1;
            
            const formattedDate = new Date(expense.date).toLocaleDateString('pt-BR');
            const formattedValue = expense.value.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });
            
            const categoryLabels = {
                'operacional': 'Operacional',
                'transporte': 'Transporte',
                'equipamentos': 'Equipamentos',
                'tributos': 'Tributos',
                'outros': 'Outros'
            };
            
            html += `
                <div class="list-item">
                    <span data-label="Descrição:">${expense.description}</span>
                    <span data-label="Valor:">${formattedValue}</span>
                    <span data-label="Categoria:">${categoryLabels[expense.category] || expense.category}</span>
                    <span data-label="Data:">${formattedDate}</span>
                    <span data-label="Nota:">${expense.note || '-'}</span>
                    <span>
                        <button class="delete-btn" data-id="${expense.id}" data-type="expense">
                            Excluir
                        </button>
                    </span>
                </div>
            `;
        });
        
        container.innerHTML = html;
        const formattedTotal = total.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
        totalElement.textContent = formattedTotal;
        
        // Update category summary
        const categoryText = Object.entries(categories)
            .map(([cat, count]) => `${count} ${cat}`)
            .join(', ');
        categoryElement.textContent = categoryText;
        
        // Calculate estimated profit
        const totalRevenue = this.state.revenues.reduce((sum, rev) => sum + rev.value, 0);
        const estimatedProfit = totalRevenue - total;
        profitElement.textContent = estimatedProfit.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
        
        // Update mobile labels
        this.setupMobileLabels();
    }
    
    addAsset() {
        const name = document.getElementById('asset-name').value.trim();
        const value = parseFloat(document.getElementById('asset-value').value);
        const date = document.getElementById('asset-date').value;
        const use = document.getElementById('asset-use').value;
        
        if (!name || isNaN(value) || !date || !use) {
            alert('Preencha todos os campos obrigatórios do bem.');
            return;
        }
        
        const asset = {
            id: Date.now(),
            name,
            value,
            date,
            use
        };
        
        this.state.assets.push(asset);
        this.saveState();
        this.updateAssetsList();
        this.clearAssetForm();
    }
    
    clearAssetForm() {
        document.getElementById('asset-name').value = '';
        document.getElementById('asset-value').value = '';
        document.getElementById('asset-date').value = '';
    }
    
    updateAssetsList() {
        const container = document.getElementById('asset-items');
        const totalElement = document.getElementById('total-assets');
        const professionalElement = document.getElementById('professional-assets');
        const personalElement = document.getElementById('personal-assets');
        
        if (this.state.assets.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhum bem cadastrado ainda.</div>';
            totalElement.textContent = 'R$ 0,00';
            professionalElement.textContent = '0 itens';
            personalElement.textContent = '0 itens';
            return;
        }
        
        let total = 0;
        let professionalCount = 0;
        let personalCount = 0;
        let html = '';
        
        this.state.assets.forEach(asset => {
            total += asset.value;
            if (asset.use === 'profissional') {
                professionalCount++;
            } else if (asset.use === 'pessoal') {
                personalCount++;
            } else if (asset.use === 'misto') {
                professionalCount += 0.5;
                personalCount += 0.5;
            }
            
            const formattedDate = new Date(asset.date).toLocaleDateString('pt-BR');
            const formattedValue = asset.value.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });
            
            const useLabels = {
                'profissional': 'Profissional',
                'pessoal': 'Pessoal',
                'misto': 'Misto'
            };
            
            html += `
                <div class="list-item">
                    <span data-label="Nome:">${asset.name}</span>
                    <span data-label="Valor:">${formattedValue}</span>
                    <span data-label="Uso:">${useLabels[asset.use] || asset.use}</span>
                    <span data-label="Aquisição:">${formattedDate}</span>
                    <span>
                        <button class="delete-btn" data-id="${asset.id}" data-type="asset">
                            Excluir
                        </button>
                    </span>
                </div>
            `;
        });
        
        container.innerHTML = html;
        totalElement.textContent = total.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
        professionalElement.textContent = `${Math.round(professionalCount)} itens`;
        personalElement.textContent = `${Math.round(personalCount)} itens`;
        
        // Update mobile labels
        this.setupMobileLabels();
    }
    
    deleteItem(id, type) {
        const itemId = parseInt(id);
        
        switch(type) {
            case 'revenue':
                this.state.revenues = this.state.revenues.filter(item => item.id !== itemId);
                this.updateRevenuesList();
                break;
            case 'expense':
                this.state.expenses = this.state.expenses.filter(item => item.id !== itemId);
                this.updateExpensesList();
                break;
            case 'asset':
                this.state.assets = this.state.assets.filter(item => item.id !== itemId);
                this.updateAssetsList();
                break;
        }
        
        this.saveState();
        this.runTaxSimulation();
    }
    
    runTaxSimulation() {
        // Calculate total revenue and expenses
        let totalRevenue = this.state.revenues.reduce((sum, rev) => sum + rev.value, 0);
        let totalExpenses = this.state.expenses.reduce((sum, exp) => sum + exp.value, 0);
        
        // Apply what-if scenario if active
        if (this.state.whatIfScenario.active) {
            totalRevenue += this.state.whatIfScenario.additionalRevenue;
            totalExpenses += this.state.whatIfScenario.additionalExpenses;
        }
        
        // Calculate taxable income (revenue - deductible expenses)
        // For MEI, we consider operational expenses as deductible
        const deductibleExpenses = totalExpenses * 0.8; // Assume 80% of expenses are deductible
        const taxableIncome = Math.max(0, totalRevenue - deductibleExpenses);
        
        // Apply standard deduction (R$ 2.275,08 annual for 2026)
        const standardDeduction = 2275.08;
        const taxBase = Math.max(0, taxableIncome - standardDeduction);
        
        // Calculate tax using progressive brackets
        let taxDue = 0;
        let bracketsCalculation = [];
        let remainingIncome = taxBase;
        
        for (let i = 0; i < this.taxBrackets.length; i++) {
            const bracket = this.taxBrackets[i];
            const prevBracket = i > 0 ? this.taxBrackets[i - 1] : { max: 0 };
            
            let bracketIncome = 0;
            if (remainingIncome > 0) {
                if (taxBase <= bracket.max) {
                    bracketIncome = taxBase - prevBracket.max;
                } else {
                    bracketIncome = bracket.max - prevBracket.max;
                }
                
                if (bracketIncome > 0) {
                    const bracketTax = bracketIncome * bracket.rate;
                    taxDue += bracketTax;
                    
                    bracketsCalculation.push({
                        max: bracket.max,
                        rate: bracket.rate * 100,
                        income: bracketIncome,
                        tax: bracketTax
                    });
                }
                remainingIncome -= bracketIncome;
            } else {
                bracketsCalculation.push({
                    max: bracket.max,
                    rate: bracket.rate * 100,
                    income: 0,
                    tax: 0
                });
            }
        }
        
        // Determine tax status
        let status = "Não tributável";
        let declarationRequired = false;
        
        if (taxableIncome > 28559.70) { // IRPF exemption limit for 2026
            declarationRequired = true;
            if (taxDue > 0) {
                status = "Tributável";
            } else {
                status = "Isento";
            }
        }
        
        // Calculate effective tax rate
        const effectiveRate = totalRevenue > 0 ? (taxDue / totalRevenue) * 100 : 0;
        
        // Update simulation state
        this.state.simulation = {
            taxableIncome,
            taxDue,
            effectiveRate,
            brackets: bracketsCalculation,
            status,
            declarationRequired,
            totalRevenue,
            totalExpenses,
            taxBase
        };
        
        // Update UI
        this.updateSimulationUI();
        this.saveState();
    }
    
    updateSimulationUI() {
        const sim = this.state.simulation;
        
        // Update summary
        document.getElementById('sim-revenue').textContent = 
            sim.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        document.getElementById('sim-expenses').textContent = 
            sim.totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        document.getElementById('sim-taxable-income').textContent = 
            sim.taxableIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        document.getElementById('sim-tax-base').textContent = 
            sim.taxBase.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        // Update brackets
        for (let i = 0; i < 5; i++) {
            const bracket = sim.brackets[i] || { income: 0, tax: 0 };
            document.getElementById(`bracket-${i}`).textContent = 
                bracket.tax.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }
        
        // Update results
        document.getElementById('sim-tax-due').textContent = 
            sim.taxDue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        document.getElementById('sim-effective-rate').textContent = 
            sim.effectiveRate.toFixed(2) + '%';
        document.getElementById('sim-tax-status').textContent = sim.status;
        document.getElementById('sim-tax-status').style.color = 
            sim.status === "Não tributável" ? "var(--success)" : 
            sim.status === "Isento" ? "var(--warning)" : "var(--error)";
        document.getElementById('sim-declaration').textContent = 
            sim.declarationRequired ? "Obrigatória" : "Não obrigatória";
        document.getElementById('sim-declaration').style.color = 
            sim.declarationRequired ? "var(--warning)" : "var(--success)";
    }
    
    toggleWhatIfScenario() {
        const panel = document.getElementById('what-if-panel');
        const btn = document.getElementById('what-if-btn');
        
        if (panel.style.display === 'none' || !panel.style.display) {
            panel.style.display = 'block';
            btn.innerHTML = '🎯 Fechar Cenário';
            this.state.whatIfScenario.active = true;
        } else {
            panel.style.display = 'none';
            btn.innerHTML = '🎯 Cenário "E Se"';
            this.state.whatIfScenario.active = false;
            this.resetWhatIfScenario();
        }
    }
    
    applyWhatIfScenario() {
        const additionalRevenue = parseFloat(document.getElementById('what-if-revenue').value) || 0;
        const additionalExpenses = parseFloat(document.getElementById('what-if-expenses').value) || 0;
        
        this.state.whatIfScenario = {
            active: true,
            additionalRevenue,
            additionalExpenses
        };
        
        this.runTaxSimulation();
    }
    
    resetWhatIfScenario() {
        document.getElementById('what-if-revenue').value = 0;
        document.getElementById('what-if-expenses').value = 0;
        
        this.state.whatIfScenario = {
            active: false,
            additionalRevenue: 0,
            additionalExpenses: 0
        };
        
        this.runTaxSimulation();
    }
    
    saveFormData() {
        // Save identification
        this.state.identification = {
            nome: document.getElementById('nome').value,
            cpf: document.getElementById('cpf').value,
            cnpj: document.getElementById('cnpj').value,
            anoFiscal: document.getElementById('ano-fiscal').value,
            atividade: document.getElementById('atividade').value,
            dataAbertura: document.getElementById('data-abertura').value
        };
        
        // Save addresses
        const sameAddress = document.getElementById('same-address-toggle').checked;
        
        this.state.address = {
            sameAddress,
            residential: {
                cep: document.getElementById('res-cep').value,
                logradouro: document.getElementById('res-logradouro').value,
                numero: document.getElementById('res-numero').value,
                complemento: document.getElementById('res-complemento').value,
                bairro: document.getElementById('res-bairro').value,
                cidade: document.getElementById('res-cidade').value,
                uf: document.getElementById('res-uf').value
            },
            fiscal: sameAddress ? null : {
                cep: document.getElementById('fis-cep').value,
                logradouro: document.getElementById('fis-logradouro').value,
                numero: document.getElementById('fis-numero').value,
                complemento: document.getElementById('fis-complemento').value,
                bairro: document.getElementById('fis-bairro').value,
                cidade: document.getElementById('fis-cidade').value,
                uf: document.getElementById('fis-uf').value
            }
        };
        
        // Save activity
        this.state.activity = {
            cnae: document.getElementById('cnae').value,
            descricao: document.getElementById('descricao-atividade').value
        };
        
        this.saveState();
        this.updateProgress();
        this.runTaxSimulation();
    }
    
    saveState() {
        localStorage.setItem('meiAssistantState', JSON.stringify(this.state));
    }
    
    loadState() {
        const saved = localStorage.getItem('meiAssistantState');
        if (saved) {
            this.state = JSON.parse(saved);
            this.populateForm();
            this.updateRevenuesList();
            this.updateExpensesList();
            this.updateAssetsList();
            
            // Navigate to saved section
            if (this.state.currentSection) {
                setTimeout(() => {
                    this.navigateTo(this.state.currentSection);
                }, 100);
            }
        }
    }
    
    populateForm() {
        // Identification
        if (this.state.identification) {
            document.getElementById('nome').value = this.state.identification.nome || '';
            document.getElementById('cpf').value = this.state.identification.cpf || '';
            document.getElementById('cnpj').value = this.state.identification.cnpj || '';
            document.getElementById('ano-fiscal').value = this.state.identification.anoFiscal || '';
            document.getElementById('atividade').value = this.state.identification.atividade || '';
            document.getElementById('data-abertura').value = this.state.identification.dataAbertura || '';
        }
        
        // Address
        if (this.state.address) {
            document.getElementById('same-address-toggle').checked = this.state.address.sameAddress || false;
            this.toggleSameAddress(this.state.address.sameAddress);
            
            const res = this.state.address.residential || {};
            document.getElementById('res-cep').value = res.cep || '';
            document.getElementById('res-logradouro').value = res.logradouro || '';
            document.getElementById('res-numero').value = res.numero || '';
            document.getElementById('res-complemento').value = res.complemento || '';
            document.getElementById('res-bairro').value = res.bairro || '';
            document.getElementById('res-cidade').value = res.cidade || '';
            document.getElementById('res-uf').value = res.uf || '';
            
            if (!this.state.address.sameAddress && this.state.address.fiscal) {
                const fis = this.state.address.fiscal;
                document.getElementById('fis-cep').value = fis.cep || '';
                document.getElementById('fis-logradouro').value = fis.logradouro || '';
                document.getElementById('fis-numero').value = fis.numero || '';
                document.getElementById('fis-complemento').value = fis.complemento || '';
                document.getElementById('fis-bairro').value = fis.bairro || '';
                document.getElementById('fis-cidade').value = fis.cidade || '';
                document.getElementById('fis-uf').value = fis.uf || '';
            }
        }
        
        // Activity
        if (this.state.activity) {
            document.getElementById('cnae').value = this.state.activity.cnae || '';
            document.getElementById('descricao-atividade').value = this.state.activity.descricao || '';
        }
        
        // What-if scenario
        if (this.state.whatIfScenario) {
            document.getElementById('what-if-revenue').value = this.state.whatIfScenario.additionalRevenue || 0;
            document.getElementById('what-if-expenses').value = this.state.whatIfScenario.additionalExpenses || 0;
        }
    }
    
    updateProgress() {
        let filled = 0;
        let total = 0;
        
        // Check required fields
        const requiredFields = [
            '#nome', '#cpf', '#cnpj', '#ano-fiscal', '#atividade', '#data-abertura',
            '#res-logradouro', '#res-numero', '#res-bairro', '#res-cidade', '#res-uf',
            '#descricao-atividade'
        ];
        
        if (!this.state.address.sameAddress) {
            requiredFields.push('#fis-logradouro', '#fis-numero', '#fis-bairro', '#fis-cidade', '#fis-uf');
        }
        
        requiredFields.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                total++;
                if (element.value.trim()) filled++;
            }
        });
        
        const progress = total > 0 ? (filled / total) * 100 : 0;
        document.getElementById('saved-progress').textContent = `${Math.round(progress)}%`;
        document.querySelector('.progress-fill').style.width = `${progress}%`;
    }
    
    runValidations() {
        this.validateRevenueLimit();
        this.validateIRPF();
        this.validateAddress();
        this.validateDocuments();
        
        this.updateValidationResults();
    }
    
    validateRevenueLimit() {
        const totalRevenue = this.state.revenues.reduce((sum, rev) => sum + rev.value, 0);
        const limit = 81000;
        
        const card = document.getElementById('validation-revenue-limit');
        const status = card.querySelector('.validation-status');
        
        if (totalRevenue > limit) {
            status.textContent = '❌ LIMITE ULTRAPASSADO';
            status.style.color = 'var(--error)';
            return {
                icon: '❌',
                title: 'Limite MEI',
                message: `Ultrapassou R$ ${limit.toLocaleString('pt-BR')}`,
                color: 'var(--error)'
            };
        } else if (totalRevenue > limit * 0.9) {
            status.textContent = '⚠️ PRÓXIMO DO LIMITE';
            status.style.color = 'var(--warning)';
            return {
                icon: '⚠️',
                title: 'Limite MEI',
                message: `R$ ${totalRevenue.toLocaleString('pt-BR')} de R$ ${limit.toLocaleString('pt-BR')}`,
                color: 'var(--warning)'
            };
        } else {
            status.textContent = '✅ DENTRO DO LIMITE';
            status.style.color = 'var(--success)';
            return {
                icon: '✅',
                title: 'Limite MEI',
                message: `Dentro do limite`,
                color: 'var(--success)'
            };
        }
    }
    
    validateIRPF() {
        const sim = this.state.simulation;
        
        const card = document.getElementById('validation-irpf');
        const status = card.querySelector('.validation-status');
        
        if (sim.declarationRequired) {
            if (sim.taxDue > 0) {
                status.textContent = '💰 IMPOSTO DEVIDO';
                status.style.color = 'var(--warning)';
                return {
                    icon: '💰',
                    title: 'IRPF',
                    message: `Devido: R$ ${sim.taxDue.toLocaleString('pt-BR')}`,
                    color: 'var(--warning)'
                };
            } else {
                status.textContent = '📋 DECLARAÇÃO OBRIGATÓRIA';
                status.style.color = 'var(--warning)';
                return {
                    icon: '📋',
                    title: 'IRPF',
                    message: 'Declaração obrigatória (isento)',
                    color: 'var(--warning)'
                };
            }
        } else {
            status.textContent = '✅ ISENTO';
            status.style.color = 'var(--success)';
            return {
                icon: '✅',
                title: 'IRPF',
                message: 'Não tributável',
                color: 'var(--success)'
            };
        }
    }
    
    validateAddress() {
        const sameAddress = this.state.address.sameAddress;
        const res = this.state.address.residential;
        const fis = this.state.address.fiscal;
        
        const card = document.getElementById('validation-address');
        const status = card.querySelector('.validation-status');
        
        if (sameAddress) {
            status.textContent = '📍 ENDEREÇOS COINCIDENTES';
            status.style.color = 'var(--success)';
            return {
                icon: '📍',
                title: 'Endereços',
                message: 'PF/PJ no mesmo endereço',
                color: 'var(--success)'
            };
        } else {
            const residentialComplete = res && res.logradouro && res.numero && res.cidade && res.uf;
            const fiscalComplete = fis && fis.logradouro && fis.numero && fis.cidade && fis.uf;
            
            if (residentialComplete && fiscalComplete) {
                status.textContent = '✅ ENDEREÇOS SEPARADOS';
                status.style.color = 'var(--success)';
                return {
                    icon: '✅',
                    title: 'Endereços',
                    message: 'PF e PJ separados corretamente',
                    color: 'var(--success)'
                };
            } else {
                status.textContent = '⚠️ VERIFIQUE OS ENDEREÇOS';
                status.style.color = 'var(--warning)';
                return {
                    icon: '⚠️',
                    title: 'Endereços',
                    message: 'Complete ambos os endereços',
                    color: 'var(--warning)'
                };
            }
        }
    }
    
    validateDocuments() {
        const cpf = this.state.identification.cpf || '';
        const cnpj = this.state.identification.cnpj || '';
        const cpfValid = cpf.replace(/\D/g, '').length === 11;
        const cnpjValid = cnpj.replace(/\D/g, '').length === 14;
        
        const card = document.getElementById('validation-documents');
        const status = card.querySelector('.validation-status');
        
        if (cpfValid && cnpjValid) {
            status.textContent = '✅ DOCUMENTOS VÁLIDOS';
            status.style.color = 'var(--success)';
            return {
                icon: '✅',
                title: 'Documentos',
                message: 'CPF e CNPJ válidos',
                color: 'var(--success)'
            };
        } else if (!cpfValid && !cnpjValid) {
            status.textContent = '❌ DOCUMENTOS INVÁLIDOS';
            status.style.color = 'var(--error)';
            return {
                icon: '❌',
                title: 'Documentos',
                message: 'CPF e CNPJ inválidos',
                color: 'var(--error)'
            };
        } else if (!cpfValid) {
            status.textContent = '❌ CPF INVÁLIDO';
            status.style.color = 'var(--error)';
            return {
                icon: '❌',
                title: 'Documentos',
                message: 'CPF inválido',
                color: 'var(--error)'
            };
        } else {
            status.textContent = '❌ CNPJ INVÁLIDO';
            status.style.color = 'var(--error)';
            return {
                icon: '❌',
                title: 'Documentos',
                message: 'CNPJ inválido',
                color: 'var(--error)'
            };
        }
    }
    
    updateValidationResults() {
        const resultsList = document.getElementById('validation-results-list');
        const alertsList = document.getElementById('validation-alerts-list');
        
        const validations = [
            this.validateRevenueLimit(),
            this.validateIRPF(),
            this.validateAddress(),
            this.validateDocuments()
        ];
        
        resultsList.innerHTML = '';
        alertsList.innerHTML = '';
        
        validations.forEach(validation => {
            const div = document.createElement('div');
            div.className = 'validation-result-item';
            div.innerHTML = `
                <span>${validation.icon} ${validation.title}</span>
                <span style="color: ${validation.color}">${validation.message}</span>
            `;
            resultsList.appendChild(div);
            
            // Add to alerts if warning or error
            if (validation.color.includes('warning') || validation.color.includes('error')) {
                const alertDiv = document.createElement('div');
                alertDiv.className = 'validation-result-item';
                alertDiv.style.borderLeft = `4px solid ${validation.color}`;
                alertDiv.innerHTML = `
                    <span>${validation.icon} ${validation.title}</span>
                    <span style="color: ${validation.color}">${validation.message}</span>
                `;
                alertsList.appendChild(alertDiv);
            }
        });
        
        // Add additional alerts based on simulation
        const sim = this.state.simulation;
        if (sim.declarationRequired && sim.taxDue > 0) {
            const alertDiv = document.createElement('div');
            alertDiv.className = 'validation-result-item';
            alertDiv.style.borderLeft = '4px solid var(--warning)';
            alertDiv.innerHTML = `
                <span>💰 IRPF Devido</span>
                <span style="color: var(--warning)">Imposto devido: R$ ${sim.taxDue.toLocaleString('pt-BR')}</span>
            `;
            alertsList.appendChild(alertDiv);
        }
        
        if (this.state.revenues.length === 0) {
            const alertDiv = document.createElement('div');
            alertDiv.className = 'validation-result-item';
            alertDiv.style.borderLeft = '4px solid var(--warning)';
            alertDiv.innerHTML = `
                <span>📊 Sem Receitas</span>
                <span style="color: var(--warning)">Nenhuma receita informada</span>
            `;
            alertsList.appendChild(alertDiv);
        }
    }
    
    generateReport() {
        const preview = document.getElementById('report-preview');
        const sim = this.state.simulation;
        
        // Format dates
        const now = new Date();
        const generatedDate = now.toLocaleDateString('pt-BR');
        const generatedTime = now.toLocaleTimeString('pt-BR');
        
        let html = `
            <div class="report-content">
                <header class="report-header">
                    <div class="header-grid">
                        <div class="header-logo">
                            <div class="logo-symbol">📊</div>
                            <div>
                                <h1>RELATÓRIO FISCAL COMPLETO - MEI</h1>
                                <p class="report-subtitle">Simulação de Impostos e Organização para Declaração</p>
                            </div>
                        </div>
                        <div class="header-info">
                            <p><strong>Data:</strong> ${generatedDate}</p>
                            <p><strong>Hora:</strong> ${generatedTime}</p>
                            <p><strong>Ano Fiscal:</strong> ${this.state.identification.anoFiscal || 'Não informado'}</p>
                            <p><strong>Página:</strong> 1/1</p>
                        </div>
                    </div>
                    <hr class="header-divider">
                </header>
                
                <div class="report-section">
                    <h2>📋 IDENTIFICAÇÃO DO CONTRIBUINTE</h2>
                    <div class="info-grid">
                        <div class="info-item">
                            <strong>Nome:</strong>
                            <span>${this.state.identification.nome || 'Não informado'}</span>
                        </div>
                        <div class="info-item">
                            <strong>CPF:</strong>
                            <span>${this.state.identification.cpf || 'Não informado'}</span>
                        </div>
                        <div class="info-item">
                            <strong>CNPJ MEI:</strong>
                            <span>${this.state.identification.cnpj || 'Não informado'}</span>
                        </div>
                        <div class="info-item">
                            <strong>Data de Abertura:</strong>
                            <span>${this.state.identification.dataAbertura || 'Não informado'}</span>
                        </div>
                        <div class="info-item">
                            <strong>Tipo de Atividade:</strong>
                            <span>${this.state.identification.atividade || 'Não informado'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="report-section">
                    <h2>📍 ENDEREÇOS</h2>
        `;
        
        if (this.state.address.sameAddress) {
            html += `
                <div class="info-grid">
                    <div class="info-item full-width">
                        <strong>Status:</strong>
                        <span>Endereço fiscal coincidente com residencial (PF/PJ mesmo local)</span>
                    </div>
                    <div class="info-item">
                        <strong>Logradouro:</strong>
                        <span>${this.state.address.residential?.logradouro || 'Não informado'}</span>
                    </div>
                    <div class="info-item">
                        <strong>Número:</strong>
                        <span>${this.state.address.residential?.numero || 'Não informado'}</span>
                    </div>
                    <div class="info-item">
                        <strong>Complemento:</strong>
                        <span>${this.state.address.residential?.complemento || 'Não informado'}</span>
                    </div>
                    <div class="info-item">
                        <strong>Bairro:</strong>
                        <span>${this.state.address.residential?.bairro || 'Não informado'}</span>
                    </div>
                    <div class="info-item">
                        <strong>Cidade/UF:</strong>
                        <span>${this.state.address.residential?.cidade || 'Não informado'}/${this.state.address.residential?.uf || 'Não informado'}</span>
                    </div>
                    <div class="info-item">
                        <strong>CEP:</strong>
                        <span>${this.state.address.residential?.cep || 'Não informado'}</span>
                    </div>
                </div>
            `;
        } else {
            html += `
                <div class="address-grid">
                    <div class="address-column">
                        <h3>🏠 Endereço Residencial (PF)</h3>
                        <div class="info-grid">
                            ${this.generateAddressInfo(this.state.address.residential)}
                        </div>
                    </div>
                    <div class="address-column">
                        <h3>🏢 Endereço Fiscal (PJ)</h3>
                        <div class="info-grid">
                            ${this.generateAddressInfo(this.state.address.fiscal)}
                        </div>
                    </div>
                </div>
            `;
        }
        
        html += `
                </div>
                
                <div class="report-section">
                    <h2>🏢 ATIVIDADE ECONÔMICA</h2>
                    <div class="info-grid">
                        <div class="info-item">
                            <strong>CNAE:</strong>
                            <span>${this.state.activity.cnae || 'Não informado'}</span>
                        </div>
                        <div class="info-item full-width">
                            <strong>Descrição:</strong>
                            <span>${this.state.activity.descricao || 'Não informado'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="report-section">
                    <h2>💰 SIMULAÇÃO DE IMPOSTO DE RENDA</h2>
                    <div class="simulation-report">
                        <div class="simulation-summary">
                            <div class="sim-item">
                                <span class="sim-label">Receita Bruta Anual:</span>
                                <span class="sim-value">${sim.totalRevenue.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span>
                            </div>
                            <div class="sim-item">
                                <span class="sim-label">Despesas Dedutíveis:</span>
                                <span class="sim-value">${(sim.totalExpenses * 0.8).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span>
                            </div>
                            <div class="sim-item">
                                <span class="sim-label">Renda Tributável:</span>
                                <span class="sim-value">${sim.taxableIncome.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span>
                            </div>
                            <div class="sim-item">
                                <span class="sim-label">Dedução Padrão:</span>
                                <span class="sim-value">R$ 2.275,08</span>
                            </div>
                            <div class="sim-item total">
                                <span class="sim-label">Base de Cálculo IRPF:</span>
                                <span class="sim-value">${sim.taxBase.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span>
                            </div>
                        </div>
                        
                        <h3>📈 Cálculo por Faixas</h3>
                        <table class="tax-table">
                            <thead>
                                <tr>
                                    <th>Faixa de Renda</th>
                                    <th>Alíquota</th>
                                    <th>Valor na Faixa</th>
                                    <th>Imposto</th>
                                </tr>
                            </thead>
                            <tbody>
        `;
        
        // Add tax brackets
        for (let i = 0; i < sim.brackets.length; i++) {
            const bracket = sim.brackets[i];
            const prevMax = i > 0 ? sim.brackets[i-1].max : 0;
            const range = i === 0 ? `Até R$ 22.847,76` : 
                         `R$ ${prevMax.toLocaleString('pt-BR')} a R$ ${bracket.max.toLocaleString('pt-BR')}`;
            
            html += `
                <tr>
                    <td>${range}</td>
                    <td>${bracket.rate}%</td>
                    <td>${bracket.income.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</td>
                    <td>${bracket.tax.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</td>
                </tr>
            `;
        }
        
        html += `
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="3"><strong>Imposto Total Devido:</strong></td>
                                    <td><strong>${sim.taxDue.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</strong></td>
                                </tr>
                            </tfoot>
                        </table>
                        
                        <div class="simulation-results-final">
                            <div class="result-item">
                                <span class="result-label">Situação Fiscal:</span>
                                <span class="result-value">${sim.status}</span>
                            </div>
                            <div class="result-item">
                                <span class="result-label">Declaração IRPF:</span>
                                <span class="result-value">${sim.declarationRequired ? 'OBRIGATÓRIA' : 'NÃO OBRIGATÓRIA'}</span>
                            </div>
                            <div class="result-item">
                                <span class="result-label">Alíquota Efetiva:</span>
                                <span class="result-value">${sim.effectiveRate.toFixed(2)}%</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="report-section">
                    <h2>📊 RESUMO FINANCEIRO</h2>
                    <div class="financial-summary">
                        <div class="summary-item">
                            <h3>Total de Receitas</h3>
                            <p class="summary-value">${sim.totalRevenue.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>
                            <p class="summary-detail">${this.state.revenues.length} lançamento(s)</p>
                        </div>
                        <div class="summary-item">
                            <h3>Total de Despesas</h3>
                            <p class="summary-value">${sim.totalExpenses.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>
                            <p class="summary-detail">${this.state.expenses.length} lançamento(s)</p>
                        </div>
                        <div class="summary-item">
                            <h3>Lucro Estimado</h3>
                            <p class="summary-value">${(sim.totalRevenue - sim.totalExpenses).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>
                            <p class="summary-detail">Receitas - Despesas</p>
                        </div>
                    </div>
                </div>
        `;
        
        if (this.state.revenues.length > 0) {
            html += `
                <div class="report-section">
                    <h2>📈 RECEITAS DETALHADAS</h2>
                    <table class="report-table detailed">
                        <thead>
                            <tr>
                                <th>Fonte</th>
                                <th>Valor</th>
                                <th>Tipo</th>
                                <th>Data</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            this.state.revenues.forEach(revenue => {
                const date = new Date(revenue.date).toLocaleDateString('pt-BR');
                const typeLabels = {
                    'servico': 'Serviço',
                    'comercio': 'Comércio',
                    'misto': 'Misto',
                    'outro': 'Outro'
                };
                
                html += `
                    <tr>
                        <td>${revenue.source}</td>
                        <td>${revenue.value.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</td>
                        <td>${typeLabels[revenue.type] || revenue.type}</td>
                        <td>${date}</td>
                    </tr>
                `;
            });
            
            html += `
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        if (this.state.expenses.length > 0) {
            html += `
                <div class="report-section">
                    <h2>📉 DESPESAS DETALHADAS</h2>
                    <table class="report-table detailed">
                        <thead>
                            <tr>
                                <th>Descrição</th>
                                <th>Valor</th>
                                <th>Categoria</th>
                                <th>Data</th>
                                <th>Nota</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            this.state.expenses.forEach(expense => {
                const date = new Date(expense.date).toLocaleDateString('pt-BR');
                const categoryLabels = {
                    'operacional': 'Operacional',
                    'transporte': 'Transporte',
                    'equipamentos': 'Equipamentos',
                    'tributos': 'Tributos',
                    'outros': 'Outros'
                };
                
                html += `
                    <tr>
                        <td>${expense.description}</td>
                        <td>${expense.value.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</td>
                        <td>${categoryLabels[expense.category] || expense.category}</td>
                        <td>${date}</td>
                        <td>${expense.note || '-'}</td>
                    </tr>
                `;
            });
            
            html += `
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        if (this.state.assets.length > 0) {
            const totalAssets = this.state.assets.reduce((sum, asset) => sum + asset.value, 0);
            
            html += `
                <div class="report-section">
                    <h2>🏠 BENS E PATRIMÔNIO</h2>
                    <p><strong>Valor total estimado:</strong> ${totalAssets.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>
                    <table class="report-table detailed">
                        <thead>
                            <tr>
                                <th>Bem</th>
                                <th>Valor</th>
                                <th>Uso</th>
                                <th>Aquisição</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            this.state.assets.forEach(asset => {
                const date = new Date(asset.date).toLocaleDateString('pt-BR');
                const useLabels = {
                    'profissional': 'Profissional',
                    'pessoal': 'Pessoal',
                    'misto': 'Misto'
                };
                
                html += `
                    <tr>
                        <td>${asset.name}</td>
                        <td>${asset.value.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</td>
                        <td>${useLabels[asset.use] || asset.use}</td>
                        <td>${date}</td>
                    </tr>
                `;
            });
            
            html += `
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        html += `
                <div class="report-section">
                    <h2>⚖️ OBSERVAÇÕES FISCAIS</h2>
                    <div class="observations">
                        <p>📝 <strong>Este relatório é um simulador e organizador fiscal.</strong> Não substitui a declaração oficial.</p>
                        <p>💰 <strong>MEI é isento de IRPJ</strong> (Imposto de Renda Pessoa Jurídica).</p>
                        <p>📋 <strong>IRPF é devido</strong> apenas se renda tributável ultrapassar R$ 28.559,70/ano.</p>
                        <p>⚠️ <strong>Limite MEI:</strong> R$ 81.000,00 de faturamento anual.</p>
                        <p>👨‍💼 <strong>Consulte um contador</strong> para validação final e declaração.</p>
                        <p>📅 <strong>Ano de referência:</strong> ${this.state.identification.anoFiscal || 'Não informado'}</p>
                        <p>🕒 <strong>Gerado em:</strong> ${generatedDate} às ${generatedTime}</p>
                    </div>
                </div>
                
                <footer class="report-footer">
                    <p>--- FIM DO RELATÓRIO ---</p>
                    <p class="footer-note">Gerado pelo Assistente Fiscal MEI - Simulador Completo de Impostos</p>
                    <p class="footer-company">S&Q TECNOLOGIA DA INFORMACAO LTDA | CNPJ: 64.684.955/0001-98</p>
                </footer>
            </div>
        `;
        
        preview.innerHTML = html;
        
        // Add report styles
        const style = document.createElement('style');
        style.textContent = `
            .report-content {
                font-family: 'Segoe UI', Arial, sans-serif;
                color: #333;
                line-height: 1.6;
                max-width: 1000px;
                margin: 0 auto;
            }
            
            .report-header {
                margin-bottom: 40px;
            }
            
            .header-grid {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                flex-wrap: wrap;
                gap: 20px;
                margin-bottom: 20px;
            }
            
            .header-logo {
                display: flex;
                align-items: center;
                gap: 15px;
                flex: 1;
            }
            
            .logo-symbol {
                font-size: 40px;
            }
            
            .header-logo h1 {
                font-size: 24px;
                margin: 0;
                color: #222;
            }
            
            .report-subtitle {
                font-size: 14px;
                color: #666;
                margin: 5px 0 0 0;
            }
            
            .header-info {
                text-align: right;
                font-size: 14px;
                color: #555;
            }
            
            .header-info p {
                margin: 3px 0;
            }
            
            .header-divider {
                border: none;
                border-top: 2px solid #00d4ff;
                margin: 20px 0;
            }
            
            .report-section {
                margin-bottom: 40px;
                page-break-inside: avoid;
            }
            
            .report-section h2 {
                font-size: 18px;
                margin: 0 0 20px 0;
                padding-bottom: 8px;
                border-bottom: 2px solid #00d4ff;
                color: #333;
            }
            
            .report-section h3 {
                font-size: 16px;
                margin: 25px 0 15px 0;
                color: #555;
            }
            
            .info-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 15px;
                margin: 20px 0;
            }
            
            .info-item {
                display: flex;
                flex-direction: column;
                padding: 12px;
                background: #f9f9f9;
                border-radius: 6px;
                border-left: 4px solid #9d4edd;
            }
            
            .info-item.full-width {
                grid-column: 1 / -1;
            }
            
            .info-item strong {
                color: #666;
                font-size: 13px;
                margin-bottom: 5px;
                font-weight: 600;
            }
            
            .info-item span {
                color: #333;
                font-size: 14px;
            }
            
            .address-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 30px;
                margin: 25px 0;
            }
            
            .address-column h3 {
                font-size: 16px;
                margin: 0 0 15px 0;
                color: #555;
                padding-bottom: 5px;
                border-bottom: 1px solid #ddd;
            }
            
            .simulation-report {
                background: #f8f9fa;
                border-radius: 10px;
                padding: 25px;
                margin: 20px 0;
            }
            
            .simulation-summary {
                display: flex;
                flex-direction: column;
                gap: 15px;
                margin-bottom: 25px;
            }
            
            .sim-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 0;
                border-bottom: 1px solid #e9ecef;
            }
            
            .sim-item.total {
                border-top: 2px solid #00d4ff;
                border-bottom: none;
                margin-top: 10px;
                padding-top: 20px;
                font-weight: 600;
                font-size: 16px;
            }
            
            .sim-label {
                color: #666;
                font-size: 14px;
            }
            
            .sim-value {
                color: #333;
                font-weight: 600;
                font-size: 15px;
            }
            
            .tax-table {
                width: 100%;
                border-collapse: collapse;
                margin: 25px 0;
                font-size: 13px;
            }
            
            .tax-table th {
                background: #f0f0f0;
                padding: 12px 10px;
                text-align: left;
                font-weight: 600;
                border-bottom: 2px solid #ddd;
                color: #555;
            }
            
            .tax-table td {
                padding: 10px;
                border-bottom: 1px solid #eee;
                color: #444;
            }
            
            .tax-table tfoot {
                background: #f8f9fa;
                font-weight: 600;
            }
            
            .tax-table tfoot td {
                padding: 15px 10px;
                border-top: 2px solid #ddd;
            }
            
            .simulation-results-final {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-top: 30px;
                padding: 20px;
                background: #fff;
                border-radius: 10px;
                border: 2px solid #00d4ff;
            }
            
            .result-item {
                display: flex;
                flex-direction: column;
                gap: 8px;
                text-align: center;
            }
            
            .result-label {
                color: #666;
                font-size: 14px;
                font-weight: 600;
            }
            
            .result-value {
                color: #333;
                font-size: 18px;
                font-weight: 700;
            }
            
            .financial-summary {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 25px;
                margin: 30px 0;
            }
            
            .summary-item {
                text-align: center;
                padding: 25px;
                background: #f5f5f5;
                border-radius: 10px;
                border: 1px solid #ddd;
            }
            
            .summary-item h3 {
                font-size: 16px;
                margin: 0 0 15px 0;
                color: #555;
            }
            
            .summary-value {
                font-size: 28px;
                font-weight: bold;
                color: #00d4ff;
                margin: 10px 0;
            }
            
            .summary-detail {
                font-size: 14px;
                color: #777;
                margin: 5px 0 0 0;
            }
            
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 25px 0;
                font-size: 13px;
            }
            
            th {
                background: #f0f0f0;
                padding: 12px 10px;
                text-align: left;
                font-weight: 600;
                border-bottom: 2px solid #ddd;
                color: #555;
            }
            
            td {
                padding: 10px;
                border-bottom: 1px solid #eee;
                color: #444;
            }
            
            tr:hover {
                background: #f9f9f9;
            }
            
            .observations {
                background: #fff8e1;
                padding: 25px;
                border-radius: 10px;
                border-left: 4px solid #ffb300;
                margin: 25px 0;
            }
            
            .observations p {
                margin: 10px 0;
                padding-left: 15px;
                position: relative;
                line-height: 1.6;
            }
            
            .observations p::before {
                content: "•";
                position: absolute;
                left: 0;
                color: #ffb300;
                font-size: 20px;
            }
            
            .report-footer {
                text-align: center;
                margin-top: 60px;
                padding-top: 30px;
                border-top: 2px solid #ddd;
                color: #888;
                font-size: 12px;
            }
            
            .footer-note {
                margin: 10px 0;
                font-style: italic;
                color: #666;
            }
            
            .footer-company {
                margin: 15px 0 0 0;
                color: #555;
                font-weight: 500;
            }
            
            @media (max-width: 768px) {
                .report-content {
                    padding: 10px !important;
                }
                
                .header-grid {
                    flex-direction: column;
                }
                
                .header-info {
                    text-align: left;
                }
                
                .info-grid {
                    grid-template-columns: 1fr;
                }
                
                .address-grid {
                    grid-template-columns: 1fr;
                    gap: 20px;
                }
                
                .financial-summary {
                    grid-template-columns: 1fr;
                    gap: 15px;
                }
                
                .simulation-results-final {
                    grid-template-columns: 1fr;
                }
                
                table {
                    display: block;
                    overflow-x: auto;
                }
                
                .summary-value {
                    font-size: 24px;
                }
            }
            
            @media print {
                .info-item {
                    background: #fff !important;
                    border: 1px solid #ddd !important;
                    border-left: 4px solid #9d4edd !important;
                }
                
                .summary-item {
                    background: #fff !important;
                    border: 1px solid #ddd !important;
                }
                
                .observations {
                    background: #fff !important;
                    border: 1px solid #ddd !important;
                    border-left: 4px solid #ffb300 !important;
                }
                
                .simulation-report {
                    background: #fff !important;
                    border: 1px solid #ddd !important;
                }
                
                .simulation-results-final {
                    background: #fff !important;
                    border: 2px solid #00d4ff !important;
                }
                
                @page {
                    margin: 15mm;
                }
            }
        `;
        
        preview.appendChild(style);
    }
    
    generateAddressInfo(address) {
        if (!address) {
            return `
                <div class="info-item full-width">
                    <strong>Endereço:</strong>
                    <span>Não informado</span>
                </div>
            `;
        }
        
        return `
            <div class="info-item"><strong>Logradouro:</strong><span>${address.logradouro || '-'}</span></div>
            <div class="info-item"><strong>Número:</strong><span>${address.numero || '-'}</span></div>
            <div class="info-item"><strong>Complemento:</strong><span>${address.complemento || '-'}</span></div>
            <div class="info-item"><strong>Bairro:</strong><span>${address.bairro || '-'}</span></div>
            <div class="info-item"><strong>Cidade/UF:</strong><span>${address.cidade || '-'}/${address.uf || '-'}</span></div>
            <div class="info-item"><strong>CEP:</strong><span>${address.cep || '-'}</span></div>
        `;
    }
    
    setupReportControls() {
        const fullscreenBtn = document.getElementById('fullscreen-btn');
        const printBtn = document.getElementById('print-btn');
        const reportPreview = document.getElementById('report-preview');
        
        if (fullscreenBtn && reportPreview) {
            fullscreenBtn.addEventListener('click', () => {
                const isFullscreen = reportPreview.classList.toggle('fullscreen');
                if (isFullscreen) {
                    fullscreenBtn.innerHTML = '📱 Sair Tela Cheia';
                    document.addEventListener('keydown', this.handleEscKey.bind(this));
                } else {
                    fullscreenBtn.innerHTML = '📱 Tela Cheia';
                    document.removeEventListener('keydown', this.handleEscKey.bind(this));
                }
            });
        }
        
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                this.exportPDF();
            });
        }
    }
    
    handleEscKey(e) {
        if (e.key === 'Escape') {
            const reportPreview = document.getElementById('report-preview');
            const fullscreenBtn = document.getElementById('fullscreen-btn');
            
            if (reportPreview && reportPreview.classList.contains('fullscreen')) {
                reportPreview.classList.remove('fullscreen');
                if (fullscreenBtn) {
                    fullscreenBtn.innerHTML = '📱 Tela Cheia';
                }
                document.removeEventListener('keydown', this.handleEscKey.bind(this));
            }
        }
    }
    
    exportPDF() {
        window.print();
    }
    
    exportSimulationData() {
        const simulationData = {
            identification: this.state.identification,
            simulation: this.state.simulation,
            summary: {
                totalRevenue: this.state.simulation.totalRevenue,
                totalExpenses: this.state.simulation.totalExpenses,
                taxableIncome: this.state.simulation.taxableIncome,
                taxDue: this.state.simulation.taxDue,
                effectiveRate: this.state.simulation.effectiveRate,
                status: this.state.simulation.status,
                declarationRequired: this.state.simulation.declarationRequired
            },
            generated: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(simulationData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `simulacao-ir-mei-${new Date().getTime()}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }
    
    backupData() {
        const dataStr = JSON.stringify(this.state, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `backup-completo-mei-${new Date().getTime()}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }
    
    clearData() {
        if (confirm('Esta ação irá remover TODOS os dados salvos. Continuar?')) {
            localStorage.removeItem('meiAssistantState');
            this.state = {
                identification: {},
                address: {},
                activity: {},
                revenues: [],
                expenses: [],
                assets: [],
                simulation: {
                    taxableIncome: 0,
                    taxDue: 0,
                    effectiveRate: 0,
                    brackets: [],
                    status: "Não tributável",
                    declarationRequired: false
                },
                currentSection: 'home',
                whatIfScenario: {
                    active: false,
                    additionalRevenue: 0,
                    additionalExpenses: 0
                }
            };
            
            // Clear form
            document.querySelectorAll('.form-input').forEach(input => {
                if (input.type !== 'button' && input.type !== 'submit') {
                    input.value = '';
                }
            });
            
            document.querySelectorAll('select').forEach(select => {
                select.selectedIndex = 0;
            });
            
            document.getElementById('same-address-toggle').checked = false;
            this.toggleSameAddress(false);
            
            this.updateRevenuesList();
            this.updateExpensesList();
            this.updateAssetsList();
            this.updateProgress();
            this.runTaxSimulation();
            this.navigateTo('home');
        }
    }
    
    setupMobileLabels() {
        if (window.innerWidth <= 768) {
            // Setup labels for revenue items
            const revenueItems = document.querySelectorAll('#revenue-items .list-item');
            revenueItems.forEach(item => {
                const spans = item.querySelectorAll('span');
                if (spans.length >= 4) {
                    spans[0].setAttribute('data-label', 'Fonte:');
                    spans[1].setAttribute('data-label', 'Valor:');
                    spans[2].setAttribute('data-label', 'Tipo:');
                    spans[3].setAttribute('data-label', 'Data:');
                }
            });
            
            // Setup labels for expense items
            const expenseItems = document.querySelectorAll('#expense-items .list-item');
            expenseItems.forEach(item => {
                const spans = item.querySelectorAll('span');
                if (spans.length >= 5) {
                    spans[0].setAttribute('data-label', 'Descrição:');
                    spans[1].setAttribute('data-label', 'Valor:');
                    spans[2].setAttribute('data-label', 'Categoria:');
                    spans[3].setAttribute('data-label', 'Data:');
                    spans[4].setAttribute('data-label', 'Nota:');
                }
            });
            
            // Setup labels for asset items
            const assetItems = document.querySelectorAll('#asset-items .list-item');
            assetItems.forEach(item => {
                const spans = item.querySelectorAll('span');
                if (spans.length >= 4) {
                    spans[0].setAttribute('data-label', 'Nome:');
                    spans[1].setAttribute('data-label', 'Valor:');
                    spans[2].setAttribute('data-label', 'Uso:');
                    spans[3].setAttribute('data-label', 'Aquisição:');
                }
            });
        }
        
        // Update on resize
        window.addEventListener('resize', () => {
            setTimeout(() => this.setupMobileLabels(), 100);
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MEIAssistant();
});
