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
            currentSection: 'home'
        };
        
        this.init();
    }
    
    init() {
        this.loadState();
        this.setupEventListeners();
        this.generateYearOptions();
        this.populateUFSelects();
        this.setCurrentYear();
        this.updateProgress();
        this.setupPrintStyles();
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
            
            // Export PDF
            if (e.target.id === 'export-pdf') {
                this.exportPDF();
                return;
            }
            
            // Backup data
            if (e.target.id === 'backup-data') {
                this.backupData();
                return;
            }
            
            // Clear data
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
            
            // Special handling for validation and report sections
            if (section === 'validation') {
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
        const currentYear = new Date().getFullYear();
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
        
        if (this.state.revenues.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhuma receita cadastrada ainda.</div>';
            totalElement.textContent = 'R$ 0,00';
            countElement.textContent = '0';
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
                    <span>${revenue.source}</span>
                    <span>${formattedValue}</span>
                    <span>${typeLabels[revenue.type] || revenue.type}</span>
                    <span>${formattedDate}</span>
                    <span>
                        <button class="delete-btn" data-id="${revenue.id}" data-type="revenue">
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
        countElement.textContent = this.state.revenues.length.toString();
        
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
        
        if (this.state.expenses.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhuma despesa cadastrada ainda.</div>';
            totalElement.textContent = 'R$ 0,00';
            categoryElement.textContent = '-';
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
                    <span>${expense.description}</span>
                    <span>${formattedValue}</span>
                    <span>${categoryLabels[expense.category] || expense.category}</span>
                    <span>${formattedDate}</span>
                    <span>
                        <button class="delete-btn" data-id="${expense.id}" data-type="expense">
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
        
        // Update category summary
        const categoryText = Object.entries(categories)
            .map(([cat, count]) => `${count} ${cat}`)
            .join(', ');
        categoryElement.textContent = categoryText;
        
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
        
        if (this.state.assets.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhum bem cadastrado ainda.</div>';
            totalElement.textContent = 'R$ 0,00';
            professionalElement.textContent = '0 itens';
            return;
        }
        
        let total = 0;
        let professionalCount = 0;
        let html = '';
        
        this.state.assets.forEach(asset => {
            total += asset.value;
            if (asset.use === 'profissional' || asset.use === 'misto') {
                professionalCount++;
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
                    <span>${asset.name}</span>
                    <span>${formattedValue}</span>
                    <span>${useLabels[asset.use] || asset.use}</span>
                    <span>${formattedDate}</span>
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
        professionalElement.textContent = `${professionalCount} itens`;
        
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
        const validations = [
            this.validateRevenueLimit(),
            this.validateRequiredFields(),
            this.validateAddress(),
            this.validateTransactions()
        ];
        
        const resultsList = document.getElementById('validation-results-list');
        resultsList.innerHTML = '';
        
        validations.forEach(validation => {
            const div = document.createElement('div');
            div.className = 'validation-result-item';
            div.innerHTML = `
                <span>${validation.icon} ${validation.title}</span>
                <span style="color: ${validation.color}">${validation.message}</span>
            `;
            resultsList.appendChild(div);
        });
    }
    
    validateRevenueLimit() {
        const totalRevenue = this.state.revenues.reduce((sum, rev) => sum + rev.value, 0);
        const limit = 81000; // MEI limit for 2024
        
        const card = document.getElementById('validation-revenue-limit');
        const status = card.querySelector('.validation-status');
        
        if (totalRevenue > limit) {
            status.textContent = '❌ LIMITE ULTRAPASSADO';
            status.style.color = 'var(--error)';
            return {
                icon: '❌',
                title: 'Limite de Faturamento',
                message: `Ultrapassado! R$ ${totalRevenue.toLocaleString('pt-BR')} de R$ 81.000,00`,
                color: 'var(--error)'
            };
        } else if (totalRevenue > limit * 0.9) {
            status.textContent = '⚠️ PRÓXIMO DO LIMITE';
            status.style.color = 'var(--warning)';
            return {
                icon: '⚠️',
                title: 'Limite de Faturamento',
                message: `Atenção! R$ ${totalRevenue.toLocaleString('pt-BR')} de R$ 81.000,00`,
                color: 'var(--warning)'
            };
        } else {
            status.textContent = '✅ DENTRO DO LIMITE';
            status.style.color = 'var(--success)';
            return {
                icon: '✅',
                title: 'Limite de Faturamento',
                message: `Dentro do limite: R$ ${totalRevenue.toLocaleString('pt-BR')}`,
                color: 'var(--success)'
            };
        }
    }
    
    validateRequiredFields() {
        const missing = [];
        
        if (!this.state.identification.nome) missing.push('Nome');
        if (!this.state.identification.cpf) missing.push('CPF');
        if (!this.state.identification.cnpj) missing.push('CNPJ');
        if (!this.state.identification.anoFiscal) missing.push('Ano Fiscal');
        if (!this.state.identification.dataAbertura) missing.push('Data de Abertura');
        
        const card = document.getElementById('validation-required-fields');
        const status = card.querySelector('.validation-status');
        
        if (missing.length > 0) {
            status.textContent = `❌ ${missing.length} CAMPO(S) FALTANDO`;
            status.style.color = 'var(--error)';
            return {
                icon: '❌',
                title: 'Campos Obrigatórios',
                message: `${missing.length} campo(s) não preenchido(s)`,
                color: 'var(--error)'
            };
        } else {
            status.textContent = '✅ TODOS PREENCHIDOS';
            status.style.color = 'var(--success)';
            return {
                icon: '✅',
                title: 'Campos Obrigatórios',
                message: 'Todos os campos obrigatórios preenchidos',
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
            status.textContent = '✅ ENDEREÇOS COINCIDENTES';
            status.style.color = 'var(--success)';
            return {
                icon: '✅',
                title: 'Endereços',
                message: 'Endereço fiscal coincide com residencial',
                color: 'var(--success)'
            };
        } else {
            const residentialComplete = res && res.logradouro && res.numero && res.cidade && res.uf;
            const fiscalComplete = fis && fis.logradouro && fis.numero && fis.cidade && fis.uf;
            
            if (residentialComplete && fiscalComplete) {
                status.textContent = '✅ ENDEREÇOS COMPLETOS';
                status.style.color = 'var(--success)';
                return {
                    icon: '✅',
                    title: 'Endereços',
                    message: 'Endereços residencial e fiscal completos',
                    color: 'var(--success)'
                };
            } else {
                status.textContent = '⚠️ VERIFIQUE OS ENDEREÇOS';
                status.style.color = 'var(--warning)';
                return {
                    icon: '⚠️',
                    title: 'Endereços',
                    message: 'Verifique a completude dos endereços',
                    color: 'var(--warning)'
                };
            }
        }
    }
    
    validateTransactions() {
        const hasRevenues = this.state.revenues.length > 0;
        const hasExpenses = this.state.expenses.length > 0;
        
        const card = document.getElementById('validation-transactions');
        const status = card.querySelector('.validation-status');
        
        if (hasRevenues && hasExpenses) {
            status.textContent = '✅ MOVIMENTAÇÃO COMPLETA';
            status.style.color = 'var(--success)';
            return {
                icon: '✅',
                title: 'Movimentações',
                message: `${this.state.revenues.length} receitas e ${this.state.expenses.length} despesas`,
                color: 'var(--success)'
            };
        } else if (hasRevenues) {
            status.textContent = '⚠️ SEM DESPESAS';
            status.style.color = 'var(--warning)';
            return {
                icon: '⚠️',
                title: 'Movimentações',
                message: `${this.state.revenues.length} receitas, mas nenhuma despesa`,
                color: 'var(--warning)'
            };
        } else if (hasExpenses) {
            status.textContent = '⚠️ SEM RECEITAS';
            status.style.color = 'var(--warning)';
            return {
                icon: '⚠️',
                title: 'Movimentações',
                message: `${this.state.expenses.length} despesas, mas nenhuma receita`,
                color: 'var(--warning)'
            };
        } else {
            status.textContent = '⚠️ SEM MOVIMENTAÇÃO';
            status.style.color = 'var(--warning)';
            return {
                icon: '⚠️',
                title: 'Movimentações',
                message: 'Nenhuma receita ou despesa informada',
                color: 'var(--warning)'
            };
        }
    }
    
    generateReport() {
        const preview = document.getElementById('report-preview');
        
        // Calculate totals
        const totalRevenue = this.state.revenues.reduce((sum, rev) => sum + rev.value, 0);
        const totalExpenses = this.state.expenses.reduce((sum, exp) => sum + exp.value, 0);
        const totalAssets = this.state.assets.reduce((sum, asset) => sum + asset.value, 0);
        
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
                                <h1>RELATÓRIO FISCAL MEI</h1>
                                <p class="report-subtitle">Organização para Declaração Anual - DASN-SIMEI</p>
                            </div>
                        </div>
                        <div class="header-info">
                            <p><strong>Data:</strong> ${generatedDate}</p>
                            <p><strong>Hora:</strong> ${generatedTime}</p>
                            <p><strong>Página:</strong> 1/1</p>
                        </div>
                    </div>
                    <hr class="header-divider">
                </header>
                
                <div class="report-section">
                    <h2>📋 IDENTIFICAÇÃO DO MEI</h2>
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
                            <strong>Ano Fiscal:</strong>
                            <span>${this.state.identification.anoFiscal || 'Não informado'}</span>
                        </div>
                        <div class="info-item">
                            <strong>Data Abertura:</strong>
                            <span>${this.state.identification.dataAbertura || 'Não informado'}</span>
                        </div>
                        <div class="info-item">
                            <strong>Atividade:</strong>
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
                        <span>Endereço fiscal coincidente com residencial ✓</span>
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
                        <h3>🏠 Endereço Residencial</h3>
                        <div class="info-grid">
                            ${this.generateAddressInfo(this.state.address.residential)}
                        </div>
                    </div>
                    <div class="address-column">
                        <h3>🏢 Endereço Fiscal</h3>
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
                    <h2>💰 RESUMO FINANCEIRO</h2>
                    <div class="financial-summary">
                        <div class="summary-item">
                            <h3>Total de Receitas</h3>
                            <p class="summary-value">${totalRevenue.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>
                            <p class="summary-detail">${this.state.revenues.length} lançamento(s)</p>
                        </div>
                        <div class="summary-item">
                            <h3>Total de Despesas</h3>
                            <p class="summary-value">${totalExpenses.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>
                            <p class="summary-detail">${this.state.expenses.length} lançamento(s)</p>
                        </div>
                        <div class="summary-item">
                            <h3>Saldo Operacional</h3>
                            <p class="summary-value">${(totalRevenue - totalExpenses).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>
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
        `;
        
        // Add observations based on validations
        const validations = [
            this.validateRevenueLimit(),
            this.validateRequiredFields(),
            this.validateAddress(),
            this.validateTransactions()
        ];
        
        validations.forEach(v => {
            html += `<p>${v.icon} ${v.message}</p>`;
        });
        
        html += `
                        <p>📝 Este relatório é um organizador fiscal e não substitui a declaração oficial na Receita Federal.</p>
                        <p>👨‍💼 Recomenda-se consultar um contador profissional para validação final dos dados.</p>
                        <p>📅 Ano de referência: ${this.state.identification.anoFiscal || 'Não informado'}</p>
                        <p>🕒 Gerado em: ${generatedDate} às ${generatedTime}</p>
                    </div>
                </div>
                
                <footer class="report-footer">
                    <p>--- FIM DO RELATÓRIO ---</p>
                    <p class="footer-note">Gerado pelo Assistente Fiscal MEI - Sistema de organização pré-declaração</p>
                    <p class="footer-company">S&Q TECNOLOGIA DA INFORMACAO LTDA | CNPJ: 64.684.955/0001-98</p>
                </footer>
            </div>
        `;
        
        preview.innerHTML = html;
        
        // Add print-specific styles
        const style = document.createElement('style');
        style.textContent = `
            .report-content {
                font-family: 'Segoe UI', Arial, sans-serif;
                color: #333;
                line-height: 1.6;
            }
            
            .report-header {
                margin-bottom: 30px;
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
                margin: 5px 0;
            }
            
            .header-divider {
                border: none;
                border-top: 2px solid #00d4ff;
                margin: 20px 0;
            }
            
            .report-section {
                margin-bottom: 30px;
                page-break-inside: avoid;
            }
            
            .report-section h2 {
                font-size: 18px;
                margin: 0 0 15px 0;
                padding-bottom: 8px;
                border-bottom: 2px solid #00d4ff;
                color: #333;
            }
            
            .info-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 15px;
                margin: 15px 0;
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
                margin: 20px 0;
            }
            
            .address-column h3 {
                font-size: 16px;
                margin: 0 0 15px 0;
                color: #555;
                padding-bottom: 5px;
                border-bottom: 1px solid #ddd;
            }
            
            .financial-summary {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin: 25px 0;
            }
            
            .summary-item {
                text-align: center;
                padding: 20px;
                background: #f5f5f5;
                border-radius: 8px;
                border: 1px solid #ddd;
            }
            
            .summary-item h3 {
                font-size: 16px;
                margin: 0 0 10px 0;
                color: #555;
            }
            
            .summary-value {
                font-size: 24px;
                font-weight: bold;
                color: #00d4ff;
                margin: 10px 0;
            }
            
            .summary-detail {
                font-size: 13px;
                color: #777;
                margin: 5px 0 0 0;
            }
            
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
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
                padding: 20px;
                border-radius: 8px;
                border-left: 4px solid #ffb300;
                margin: 20px 0;
            }
            
            .observations p {
                margin: 8px 0;
                padding-left: 10px;
                position: relative;
            }
            
            .observations p::before {
                content: "•";
                position: absolute;
                left: 0;
                color: #ffb300;
            }
            
            .report-footer {
                text-align: center;
                margin-top: 50px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                color: #888;
                font-size: 12px;
            }
            
            .footer-note {
                margin: 10px 0;
                font-style: italic;
            }
            
            .footer-company {
                margin: 10px 0 0 0;
                color: #666;
                font-weight: 500;
            }
            
            @media (max-width: 768px) {
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
                
                table {
                    display: block;
                    overflow-x: auto;
                }
                
                .report-content {
                    padding: 15px !important;
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
                
                @page {
                    margin: 15mm;
                }
            }
        `;
        
        preview.appendChild(style);
        
        // Update mobile labels for report
        this.setupMobileLabels();
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
                    // Add ESC key listener
                    document.addEventListener('keydown', this.handleEscKey.bind(this));
                } else {
                    fullscreenBtn.innerHTML = '📱 Tela Cheia';
                    // Remove ESC key listener
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
        // Trigger print dialog
        window.print();
    }
    
    backupData() {
        const dataStr = JSON.stringify(this.state, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `backup-mei-${new Date().getTime()}.json`;
        
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
                currentSection: 'home'
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
            this.navigateTo('home');
        }
    }
    
    setupPrintStyles() {
        // Print styles are already in CSS
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
