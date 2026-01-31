// script.js - Assistente Fiscal MEI 2026
// Desenvolvido com base na legislação tributária brasileira vigente
// Autor: Especialista em Contabilidade para MEI

class MEIAssistant {
    constructor() {
        // Estado inicial com todas as variáveis necessárias
        this.state = {
            // Identificação do contribuinte
            identification: {
                nome: '',
                cpf: '',
                dataNascimento: '',
                tituloEleitor: '',
                cnpj: '',
                dataAbertura: ''
            },
            
            // Endereços
            address: {
                sameAddress: true,
                residential: {
                    cep: '',
                    logradouro: '',
                    numero: '',
                    complemento: '',
                    bairro: '',
                    cidade: '',
                    uf: ''
                },
                fiscal: null,
                homeOffice: {
                    areaTotal: 0,
                    areaEscritorio: 0,
                    aluguelMensal: 0,
                    condominioMensal: 0,
                    iptuAnual: 0,
                    energiaMensal: 0,
                    internetMensal: 0
                }
            },
            
            // Atividade MEI
            activity: {
                cnae: '',
                tipoAtividade: '',
                aliquotaDAS: 0,
                descricaoAtividade: ''
            },
            
            // Receitas MEI
            revenues: [],
            totalRevenueMEI: 0,
            DASAnual: 0,
            
            // Despesas MEI
            expenses: [],
            totalExpensesMEI: 0,
            depreciacoes: [],
            
            // Outras rendas PF
            otherIncome: {
                salario: {
                    mensal: 0,
                    meses: 13,
                    anual: 0
                },
                alugueis: {
                    mensal: 0,
                    meses: 12,
                    anual: 0,
                    despesas: 0
                },
                investimentos: {
                    dividendos: 0,
                    jurosCapital: 0,
                    rendimentosAcoes: 0,
                    rendimentosFIIs: 0
                },
                outrasRendas: {
                    pensaoRecebida: 0,
                    doacoesRecebidas: 0,
                    outrosRendimentos: 0
                }
            },
            totalOtherIncome: 0,
            
            // Deduções IRPF
            deductions: {
                dependentes: {
                    quantidade: 0,
                    menores: 0,
                    universitarios: 0,
                    total: 0
                },
                saude: {
                    medicos: 0,
                    medicamentos: 0,
                    plano: 0,
                    orteses: 0,
                    total: 0
                },
                educacao: {
                    faculdade: 0,
                    escola: 0,
                    cursos: 0,
                    material: 0,
                    total: 0
                },
                previdenciaDoacoes: {
                    previdenciaOficial: 0,
                    previdenciaPrivada: 0,
                    doacoesDedutiveis: 0,
                    pensaoAlimenticia: 0,
                    total: 0
                },
                homeOffice: 0,
                totalDeducoes: 0
            },
            
            // Simulação IRPF
            simulation: {
                rendaBrutaTotal: 0,
                deducoesTotais: 0,
                baseCalculo: 0,
                impostoDevido: 0,
                aliquotaEfetiva: 0,
                situacaoFiscal: "Não tributável",
                declaracaoObrigatoria: false,
                detalhesCalculo: '',
                brackets: []
            },
            
            // Estado da aplicação
            currentSection: 'home',
            progress: 0,
            whatIfScenario: {
                active: false,
                receitaAdicional: 0,
                despesaAdicional: 0,
                dependentesAdicionais: 0,
                previdenciaAdicional: 0
            }
        };
        
        // CONSTANTES FISCAIS 2026
        this.CONSTANTS = {
            // Limites MEI
            LIMITE_FATURAMENTO_MEI: 81000.00, // R$ 81.000,00/ano
            DAS_MENSAL: {
                '5': 71.10,    // Comércio e Indústria
                '6': 85.32,    // Serviços e Transporte
                '5.5': 78.21   // Misto
            },
            
            // IRPF 2026
            LIMITE_ISENCAO_IRPF: 28559.70, // R$ 28.559,70/ano
            DEDUCAO_POR_DEPENDENTE: 2275.08, // R$ 2.275,08
            DEDUCAO_PADRAO: 2275.08, // R$ 2.275,08
            LIMITE_DEDUCAO_EDUCACAO: 3561.50, // R$ 3.561,50 por pessoa
            LIMITE_PREVIDENCIA_PRIVADA: 0.12, // 12% da renda tributável
            
            // Faixas IRPF 2026
            TAX_BRACKETS: [
                { max: 22847.76, rate: 0.00, deductible: 0 },
                { max: 33919.80, rate: 0.075, deductible: 1713.58 },
                { max: 45012.60, rate: 0.15, deductible: 4257.57 },
                { max: 55976.16, rate: 0.225, deductible: 7633.51 },
                { max: Infinity, rate: 0.275, deductible: 10432.32 }
            ],
            
            // Depreciação
            DEPRECIATION_RATES: {
                '5': 0.20,   // 20% ao ano (5 anos)
                '10': 0.10,  // 10% ao ano (10 anos)
                '20': 0.05,  // 5% ao ano (20 anos)
                '25': 0.04   // 4% ao ano (25 anos)
            },
            
            // Home Office
            PERCENTUAL_HOME_OFFICE: 0.15 // Até 15% das despesas
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
        this.setupMobileLabels();
        this.calculateAll();
    }
    
    setupEventListeners() {
        // Navegação
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
            
            // Botões de adicionar
            if (e.target.id === 'add-revenue') {
                this.addRevenue();
                return;
            }
            
            if (e.target.id === 'add-expense') {
                this.addExpense();
                return;
            }
            
            // Botões de deletar
            if (e.target.classList.contains('delete-btn')) {
                const itemId = e.target.dataset.id;
                const type = e.target.dataset.type;
                this.deleteItem(itemId, type);
                return;
            }
            
            // Controles de simulação
            if (e.target.id === 'run-simulation') {
                this.calculateAll();
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
            
            // Exportação
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
        
        // Auto-salvar
        document.addEventListener('input', (e) => {
            if (e.target.matches('.form-input, select, textarea')) {
                this.saveFormData();
                
                // Cálculos em tempo real
                if (e.target.id === 'salario-mensal' || e.target.id === 'salario-meses') {
                    this.calculateOtherIncome();
                }
                
                if (e.target.id === 'aluguel-mensal-pf' || e.target.id === 'aluguel-meses') {
                    this.calculateOtherIncome();
                }
                
                if (e.target.id === 'dependentes') {
                    this.calculateDeductions();
                }
                
                if (e.target.id === 'area-total' || e.target.id === 'area-escritorio') {
                    this.calculateHomeOffice();
                }
                
                // What-if scenario
                if (e.target.id.includes('what-if')) {
                    this.applyWhatIfScenario();
                }
            }
        });
        
        // Formatação de campos
        document.getElementById('cpf').addEventListener('input', (e) => {
            this.formatCPF(e.target);
        });
        
        document.getElementById('cnpj').addEventListener('input', (e) => {
            this.formatCNPJ(e.target);
        });
        
        document.getElementById('res-cep').addEventListener('input', (e) => {
            this.formatCEP(e.target);
        });
        
        document.getElementById('fis-cep').addEventListener('input', (e) => {
            this.formatCEP(e.target);
        });
        
        // Toggle endereço
        document.getElementById('same-address-toggle').addEventListener('change', (e) => {
            this.toggleSameAddress(e.target.checked);
        });
        
        // Controles de relatório
        this.setupReportControls();
    }
    
    navigateTo(section) {
        // Atualizar navegação
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.section === section) {
                btn.classList.add('active');
            }
        });
        
        // Atualizar indicador
        const activeBtn = document.querySelector(`.nav-btn[data-section="${section}"]`);
        if (activeBtn) {
            const navIndicator = document.querySelector('.nav-indicator');
            const btnRect = activeBtn.getBoundingClientRect();
            const navRect = document.querySelector('.navigation').getBoundingClientRect();
            
            navIndicator.style.left = `${btnRect.left - navRect.left}px`;
            navIndicator.style.width = `${btnRect.width}px`;
        }
        
        // Atualizar seções
        document.querySelectorAll('.section').forEach(sec => {
            sec.classList.remove('active');
        });
        
        const targetSection = document.getElementById(`${section}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
            this.state.currentSection = section;
            this.saveState();
            
            // Ações específicas por seção
            if (section === 'simulation') {
                this.calculateAll();
            } else if (section === 'validation') {
                this.runValidations();
            } else if (section === 'report') {
                this.generateReport();
            }
        }
        
        // Atualizar labels mobile
        this.setupMobileLabels();
    }
    
    generateYearOptions() {
        const currentYear = new Date().getFullYear();
        document.getElementById('current-year').textContent = currentYear;
    }
    
    populateUFSelects() {
        const ufs = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
        
        ['res-uf', 'fis-uf'].forEach(id => {
            const select = document.getElementById(id);
            // Limpar opções exceto a primeira
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
        const currentYear = 2026;
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
        
        // Validação dos dígitos verificadores
        let soma = 0;
        let resto;
        
        // Primeiro dígito verificador
        for (let i = 1; i <= 9; i++) {
            soma += parseInt(cleanCPF.substring(i-1, i)) * (11 - i);
        }
        
        resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cleanCPF.substring(9, 10))) {
            validation.textContent = 'CPF inválido';
            validation.style.color = 'var(--error)';
            return;
        }
        
        // Segundo dígito verificador
        soma = 0;
        for (let i = 1; i <= 10; i++) {
            soma += parseInt(cleanCPF.substring(i-1, i)) * (12 - i);
        }
        
        resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cleanCPF.substring(10, 11))) {
            validation.textContent = 'CPF inválido';
            validation.style.color = 'var(--error)';
            return;
        }
        
        validation.textContent = '✓ CPF válido';
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
        
        // Validação dos dígitos verificadores
        let tamanho = cleanCNPJ.length - 2;
        let numeros = cleanCNPJ.substring(0, tamanho);
        let digitos = cleanCNPJ.substring(tamanho);
        let soma = 0;
        let pos = tamanho - 7;
        
        // Primeiro dígito verificador
        for (let i = tamanho; i >= 1; i--) {
            soma += numeros.charAt(tamanho - i) * pos--;
            if (pos < 2) pos = 9;
        }
        
        let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
        if (resultado !== parseInt(digitos.charAt(0))) {
            validation.textContent = 'CNPJ inválido';
            validation.style.color = 'var(--error)';
            return;
        }
        
        // Segundo dígito verificador
        tamanho = tamanho + 1;
        numeros = cleanCNPJ.substring(0, tamanho);
        soma = 0;
        pos = tamanho - 7;
        
        for (let i = tamanho; i >= 1; i--) {
            soma += numeros.charAt(tamanho - i) * pos--;
            if (pos < 2) pos = 9;
        }
        
        resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
        if (resultado !== parseInt(digitos.charAt(1))) {
            validation.textContent = 'CNPJ inválido';
            validation.style.color = 'var(--error)';
            return;
        }
        
        validation.textContent = '✓ CNPJ válido';
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
                field.value = document.getElementById(id.replace('fis-', 'res-')).value;
            } else {
                field.classList.remove('disabled');
            }
        });
        
        this.saveFormData();
    }
    
    addRevenue() {
        const source = document.getElementById('revenue-source').value.trim();
        const value = parseFloat(document.getElementById('revenue-value').value) || 0;
        const type = document.getElementById('revenue-type').value;
        const date = document.getElementById('revenue-date').value;
        const nota = document.getElementById('revenue-nota').value.trim();
        
        if (!source || !date || value <= 0) {
            alert('Preencha todos os campos obrigatórios da receita com valores válidos.');
            return;
        }
        
        const revenue = {
            id: Date.now(),
            source,
            value,
            type,
            date,
            nota
        };
        
        this.state.revenues.push(revenue);
        this.calculateRevenueMEI();
        this.saveState();
        this.updateRevenuesList();
        this.clearRevenueForm();
        this.calculateAll();
    }
    
    clearRevenueForm() {
        document.getElementById('revenue-source').value = '';
        document.getElementById('revenue-value').value = '';
        document.getElementById('revenue-date').value = '';
        document.getElementById('revenue-nota').value = '';
    }
    
    calculateRevenueMEI() {
        let total = 0;
        this.state.revenues.forEach(revenue => {
            total += revenue.value;
        });
        
        this.state.totalRevenueMEI = total;
        
        // Calcular DAS anual baseado na alíquota
        const aliquota = this.state.activity.aliquotaDas;
        if (aliquota && this.CONSTANTS.DAS_MENSAL[aliquota]) {
            this.state.DASAnual = this.CONSTANTS.DAS_MENSAL[aliquota] * 12;
        } else {
            this.state.DASAnual = 0;
        }
        
        // Atualizar UI
        document.getElementById('total-revenue').textContent = 
            this.formatCurrency(total);
        document.getElementById('revenue-count').textContent = 
            this.state.revenues.length;
        
        const monthlyAverage = total / 12;
        document.getElementById('monthly-average').textContent = 
            this.formatCurrency(monthlyAverage);
        document.getElementById('das-anual').textContent = 
            this.formatCurrency(this.state.DASAnual);
    }
    
    updateRevenuesList() {
        const container = document.getElementById('revenue-items');
        if (!container) return;
        
        if (this.state.revenues.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhuma receita cadastrada ainda.</div>';
            return;
        }
        
        let html = '';
        this.state.revenues.forEach(revenue => {
            const date = new Date(revenue.date).toLocaleDateString('pt-BR');
            const typeLabels = {
                'servico': 'Serviço Prestado',
                'venda': 'Venda de Produtos',
                'projeto': 'Projeto/Contrato',
                'outro': 'Outro'
            };
            
            html += `
                <div class="list-item">
                    <span data-label="Cliente/Projeto:">${revenue.source}</span>
                    <span data-label="Valor:">${this.formatCurrency(revenue.value)}</span>
                    <span data-label="Tipo:">${typeLabels[revenue.type] || revenue.type}</span>
                    <span data-label="Data:">${date}</span>
                    <span data-label="Nota Fiscal:">${revenue.nota || '-'}</span>
                    <span>
                        <button class="delete-btn" data-id="${revenue.id}" data-type="revenue">
                            Excluir
                        </button>
                    </span>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    addExpense() {
        const description = document.getElementById('expense-description').value.trim();
        const value = parseFloat(document.getElementById('expense-value').value) || 0;
        const category = document.getElementById('expense-category').value;
        const date = document.getElementById('expense-date').value;
        const nota = document.getElementById('expense-nota').value.trim();
        const depreciacao = document.getElementById('expense-depreciacao').value;
        
        if (!description || !date || value <= 0) {
            alert('Preencha todos os campos obrigatórios da despesa com valores válidos.');
            return;
        }
        
        const expense = {
            id: Date.now(),
            description,
            value,
            category,
            date,
            nota,
            depreciacao: parseInt(depreciacao)
        };
        
        this.state.expenses.push(expense);
        
        // Calcular depreciação se aplicável
        if (depreciacao > 0) {
            this.calculateDepreciation(expense);
        }
        
        this.calculateExpensesMEI();
        this.saveState();
        this.updateExpensesList();
        this.clearExpenseForm();
        this.calculateAll();
    }
    
    calculateDepreciation(expense) {
        const depreciavel = expense.value;
        const anos = expense.depreciacao;
        const taxa = this.CONSTANTS.DEPRECIATION_RATES[anos] || 0;
        
        if (taxa > 0) {
            const depreciacaoAnual = depreciavel * taxa;
            
            this.state.depreciacoes.push({
                id: expense.id,
                descricao: expense.description,
                valor: depreciavel,
                depreciacaoAnual,
                anosRestantes: anos - 1
            });
        }
    }
    
    calculateExpensesMEI() {
        let total = 0;
        let porCategoria = {};
        
        this.state.expenses.forEach(expense => {
            total += expense.value;
            
            // Agrupar por categoria
            if (!porCategoria[expense.category]) {
                porCategoria[expense.category] = 0;
            }
            porCategoria[expense.category] += expense.value;
        });
        
        this.state.totalExpensesMEI = total;
        
        // Calcular despesas depreciáveis
        let totalDepreciacao = 0;
        this.state.depreciacoes.forEach(dep => {
            totalDepreciacao += dep.depreciacaoAnual;
        });
        
        // Atualizar UI
        document.getElementById('total-expenses').textContent = 
            this.formatCurrency(total);
        
        const categoriasText = Object.entries(porCategoria)
            .map(([cat, valor]) => `${cat}: ${this.formatCurrency(valor)}`)
            .join(', ');
        document.getElementById('expenses-by-category').textContent = 
            categoriasText || '-';
        
        const lucroOperacional = this.state.totalRevenueMEI - total;
        document.getElementById('estimated-profit').textContent = 
            this.formatCurrency(lucroOperacional);
        
        const porcentagem = total > 0 ? (total / this.state.totalRevenueMEI * 100) : 0;
        document.getElementById('expenses-percentage').textContent = 
            `${porcentagem.toFixed(1)}%`;
    }
    
    updateExpensesList() {
        const container = document.getElementById('expense-items');
        if (!container) return;
        
        if (this.state.expenses.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhuma despesa cadastrada ainda.</div>';
            return;
        }
        
        let html = '';
        this.state.expenses.forEach(expense => {
            const date = new Date(expense.date).toLocaleDateString('pt-BR');
            const categoryLabels = {
                'material': 'Material/Consumo',
                'servico': 'Serviços Terceirizados',
                'equipamento': 'Equipamentos',
                'veiculo': 'Veículo/Transporte',
                'homeoffice': 'Home Office',
                'tributos': 'Tributos/Taxas',
                'outros': 'Outros'
            };
            
            const depreciacaoText = expense.depreciacao > 0 ? 
                `${expense.depreciacao} anos` : 'Não depreciável';
            
            html += `
                <div class="list-item">
                    <span data-label="Descrição:">${expense.description}</span>
                    <span data-label="Valor:">${this.formatCurrency(expense.value)}</span>
                    <span data-label="Categoria:">${categoryLabels[expense.category] || expense.category}</span>
                    <span data-label="Data:">${date}</span>
                    <span data-label="Nota Fiscal:">${expense.nota || '-'}</span>
                    <span data-label="Depreciação:">${depreciacaoText}</span>
                    <span>
                        <button class="delete-btn" data-id="${expense.id}" data-type="expense">
                            Excluir
                        </button>
                    </span>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    clearExpenseForm() {
        document.getElementById('expense-description').value = '';
        document.getElementById('expense-value').value = '';
        document.getElementById('expense-date').value = '';
        document.getElementById('expense-nota').value = '';
        document.getElementById('expense-depreciacao').value = '0';
    }
    
    calculateOtherIncome() {
        // Salário/Pró-labore
        const salarioMensal = parseFloat(document.getElementById('salario-mensal').value) || 0;
        const salarioMeses = parseInt(document.getElementById('salario-meses').value) || 13;
        const salarioAnual = salarioMensal * salarioMeses;
        
        this.state.otherIncome.salario = {
            mensal: salarioMensal,
            meses: salarioMeses,
            anual: salarioAnual
        };
        
        // Aluguéis
        const aluguelMensal = parseFloat(document.getElementById('aluguel-mensal-pf').value) || 0;
        const aluguelMeses = parseInt(document.getElementById('aluguel-meses').value) || 12;
        const aluguelAnual = aluguelMensal * aluguelMeses;
        const despesasAluguel = parseFloat(document.getElementById('despesas-aluguel').value) || 0;
        
        this.state.otherIncome.alugueis = {
            mensal: aluguelMensal,
            meses: aluguelMeses,
            anual: aluguelAnual,
            despesas: despesasAluguel
        };
        
        // Investimentos
        this.state.otherIncome.investimentos = {
            dividendos: parseFloat(document.getElementById('dividendos').value) || 0,
            jurosCapital: parseFloat(document.getElementById('juros-capital').value) || 0,
            rendimentosAcoes: parseFloat(document.getElementById('rendimentos-acoes').value) || 0,
            rendimentosFIIs: parseFloat(document.getElementById('rendimentos-fiis').value) || 0
        };
        
        // Outras rendas
        this.state.otherIncome.outrasRendas = {
            pensaoRecebida: parseFloat(document.getElementById('pensao-recebida').value) || 0,
            doacoesRecebidas: parseFloat(document.getElementById('doacoes-recebidas').value) || 0,
            outrosRendimentos: parseFloat(document.getElementById('outros-rendimentos').value) || 0
        };
        
        // Calcular total
        let total = salarioAnual + aluguelAnual;
        total += this.state.otherIncome.investimentos.jurosCapital + 
                this.state.otherIncome.investimentos.rendimentosAcoes +
                this.state.otherIncome.investimentos.rendimentosFIIs +
                this.state.otherIncome.outrasRendas.outrosRendimentos;
        
        this.state.totalOtherIncome = total;
        
        // Atualizar UI
        document.getElementById('total-salarios').textContent = 
            this.formatCurrency(salarioAnual);
        document.getElementById('salario-anual').textContent = 
            this.formatCurrency(salarioAnual);
        
        document.getElementById('total-alugueis').textContent = 
            this.formatCurrency(aluguelAnual);
        document.getElementById('aluguel-anual').textContent = 
            this.formatCurrency(aluguelAnual);
        
        document.getElementById('total-investimentos').textContent = 
            this.formatCurrency(
                this.state.otherIncome.investimentos.jurosCapital +
                this.state.otherIncome.investimentos.rendimentosAcoes +
                this.state.otherIncome.investimentos.rendimentosFIIs
            );
        
        document.getElementById('total-outras-rendas').textContent = 
            this.formatCurrency(
                this.state.otherIncome.outrasRendas.outrosRendimentos
            );
    }
    
    calculateDeductions() {
        // Dependentes
        const dependentes = parseInt(document.getElementById('dependentes').value) || 0;
        const dependentesMenores = parseInt(document.getElementById('dependentes-menores').value) || 0;
        const dependentesUniversitarios = parseInt(document.getElementById('dependentes-universitarios').value) || 0;
        
        const deducaoDependentes = dependentes * this.CONSTANTS.DEDUCAO_POR_DEPENDENTE;
        
        this.state.deductions.dependentes = {
            quantidade: dependentes,
            menores: dependentesMenores,
            universitarios: dependentesUniversitarios,
            total: deducaoDependentes
        };
        
        // Saúde
        const gastosMedicos = parseFloat(document.getElementById('gastos-medicos').value) || 0;
        const gastosMedicamentos = parseFloat(document.getElementById('gastos-medicamentos').value) || 0;
        const gastosPlano = parseFloat(document.getElementById('gastos-plano').value) || 0;
        const gastosOrteses = parseFloat(document.getElementById('gastos-orteses').value) || 0;
        
        const deducaoSaude = gastosMedicos + gastosMedicamentos + gastosPlano + gastosOrteses;
        
        this.state.deductions.saude = {
            medicos: gastosMedicos,
            medicamentos: gastosMedicamentos,
            plano: gastosPlano,
            orteses: gastosOrteses,
            total: deducaoSaude
        };
        
        // Educação
        const gastosFaculdade = parseFloat(document.getElementById('gastos-faculdade').value) || 0;
        const gastosEscola = parseFloat(document.getElementById('gastos-escola').value) || 0;
        const gastosCursos = parseFloat(document.getElementById('gastos-cursos').value) || 0;
        const gastosMaterial = parseFloat(document.getElementById('gastos-material').value) || 0;
        
        // Aplicar limite por pessoa
        const pessoasEducacao = Math.max(1, dependentesUniversitarios + 1); // Titular + universitários
        const limiteTotalEducacao = pessoasEducacao * this.CONSTANTS.LIMITE_DEDUCAO_EDUCACAO;
        const gastosEducacao = gastosFaculdade + gastosEscola + gastosCursos + gastosMaterial;
        const deducaoEducacao = Math.min(gastosEducacao, limiteTotalEducacao);
        
        this.state.deductions.educacao = {
            faculdade: gastosFaculdade,
            escola: gastosEscola,
            cursos: gastosCursos,
            material: gastosMaterial,
            total: deducaoEducacao
        };
        
        // Previdência e Doações
        const previdenciaOficial = parseFloat(document.getElementById('previdencia-oficial').value) || 0;
        const previdenciaPrivada = parseFloat(document.getElementById('previdencia-privada').value) || 0;
        const doacoesDedutiveis = parseFloat(document.getElementById('doacoes-dedutiveis').value) || 0;
        const pensaoAlimenticia = parseFloat(document.getElementById('pensao-alimenticia').value) || 0;
        
        const deducaoPrevidencia = previdenciaOficial + previdenciaPrivada + doacoesDedutiveis + pensaoAlimenticia;
        
        this.state.deductions.previdenciaDoacoes = {
            previdenciaOficial,
            previdenciaPrivada,
            doacoesDedutiveis,
            pensaoAlimenticia,
            total: deducaoPrevidencia
        };
        
        // Calcular total
        let total = deducaoDependentes + deducaoSaude + deducaoEducacao + deducaoPrevidencia;
        total += this.state.deductions.homeOffice;
        
        this.state.deductions.totalDeducoes = total;
        
        // Atualizar UI
        document.getElementById('deducao-dependentes').textContent = 
            this.formatCurrency(deducaoDependentes);
        document.getElementById('deducao-saude').textContent = 
            this.formatCurrency(deducaoSaude);
        document.getElementById('deducao-educacao').textContent = 
            this.formatCurrency(deducaoEducacao);
        document.getElementById('deducao-previdencia').textContent = 
            this.formatCurrency(deducaoPrevidencia);
        
        // Resumo
        document.getElementById('resumo-dependentes').textContent = 
            this.formatCurrency(deducaoDependentes);
        document.getElementById('resumo-saude').textContent = 
            this.formatCurrency(deducaoSaude);
        document.getElementById('resumo-educacao').textContent = 
            this.formatCurrency(deducaoEducacao);
        document.getElementById('resumo-previdencia').textContent = 
            this.formatCurrency(deducaoPrevidencia);
        document.getElementById('resumo-total-deducoes').textContent = 
            this.formatCurrency(total);
    }
    
    calculateHomeOffice() {
        const areaTotal = parseFloat(document.getElementById('area-total').value) || 0;
        const areaEscritorio = parseFloat(document.getElementById('area-escritorio').value) || 0;
        const aluguelMensal = parseFloat(document.getElementById('aluguel-mensal').value) || 0;
        const condominioMensal = parseFloat(document.getElementById('condominio-mensal').value) || 0;
        const iptuAnual = parseFloat(document.getElementById('iptu-anual').value) || 0;
        const energiaMensal = parseFloat(document.getElementById('energia-mensal').value) || 0;
        const internetMensal = parseFloat(document.getElementById('internet-mensal').value) || 0;
        
        this.state.address.homeOffice = {
            areaTotal,
            areaEscritorio,
            aluguelMensal,
            condominioMensal,
            iptuAnual,
            energiaMensal,
            internetMensal
        };
        
        // Calcular dedução
        if (areaTotal > 0 && areaEscritorio > 0) {
            const percentual = areaEscritorio / areaTotal;
            const percentualLimitado = Math.min(percentual, this.CONSTANTS.PERCENTUAL_HOME_OFFICE);
            
            const aluguelAnual = aluguelMensal * 12;
            const condominioAnual = condominioMensal * 12;
            const energiaAnual = energiaMensal * 12;
            const internetAnual = internetMensal * 12;
            
            const deducao = (aluguelAnual + condominioAnual + iptuAnual + energiaAnual + internetAnual) * percentualLimitado;
            
            this.state.deductions.homeOffice = deducao;
            
            // Atualizar preview
            document.getElementById('home-office-deduction-preview').textContent = 
                this.formatCurrency(deducao);
        } else {
            this.state.deductions.homeOffice = 0;
            document.getElementById('home-office-deduction-preview').textContent = 
                'R$ 0,00';
        }
        
        this.calculateDeductions();
    }
    
    calculateAll() {
        // 1. Calcular receitas MEI
        this.calculateRevenueMEI();
        
        // 2. Calcular despesas MEI
        this.calculateExpensesMEI();
        
        // 3. Calcular outras rendas
        this.calculateOtherIncome();
        
        // 4. Calcular deduções
        this.calculateDeductions();
        
        // 5. Calcular Home Office
        this.calculateHomeOffice();
        
        // 6. Executar simulação IRPF
        this.runTaxSimulation();
        
        // 7. Atualizar progresso
        this.updateProgress();
        
        // 8. Salvar estado
        this.saveState();
    }
    
    runTaxSimulation() {
        // 1. Calcular Renda Bruta Total
        const lucroMEI = Math.max(0, this.state.totalRevenueMEI - this.state.totalExpensesMEI);
        const rendaBrutaTotal = lucroMEI + this.state.totalOtherIncome;
        
        // 2. Aplicar cenário "E Se" se ativo
        let rendaBrutaSimulada = rendaBrutaTotal;
        let deducoesSimuladas = this.state.deductions.totalDeducoes;
        
        if (this.state.whatIfScenario.active) {
            rendaBrutaSimulada += this.state.whatIfScenario.receitaAdicional;
            deducoesSimuladas += (this.state.whatIfScenario.dependentesAdicionais * this.CONSTANTS.DEDUCAO_POR_DEPENDENTE);
            deducoesSimuladas += this.state.whatIfScenario.previdenciaAdicional;
        }
        
        // 3. Calcular Base de Cálculo
        const baseCalculo = Math.max(0, rendaBrutaSimulada - deducoesSimuladas);
        
        // 4. Aplicar Dedução Padrão
        const baseCalculoComDeducao = Math.max(0, baseCalculo - this.CONSTANTS.DEDUCAO_PADRAO);
        
        // 5. Calcular Imposto pelas Faixas
        let impostoDevido = 0;
        let bracketsCalculation = [];
        let remainingIncome = baseCalculoComDeducao;
        
        for (let i = 0; i < this.CONSTANTS.TAX_BRACKETS.length; i++) {
            const bracket = this.CONSTANTS.TAX_BRACKETS[i];
            const prevBracket = i > 0 ? this.CONSTANTS.TAX_BRACKETS[i - 1] : { max: 0 };
            
            let bracketIncome = 0;
            if (remainingIncome > 0) {
                if (baseCalculoComDeducao <= bracket.max) {
                    bracketIncome = baseCalculoComDeducao - prevBracket.max;
                } else {
                    bracketIncome = bracket.max - prevBracket.max;
                }
                
                if (bracketIncome > 0) {
                    const bracketTax = bracketIncome * bracket.rate;
                    impostoDevido += bracketTax;
                    
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
        
        // 6. Determinar situação fiscal
        let situacaoFiscal = "Não tributável";
        let declaracaoObrigatoria = false;
        
        if (baseCalculo > this.CONSTANTS.LIMITE_ISENCAO_IRPF) {
            declaracaoObrigatoria = true;
            if (impostoDevido > 0) {
                situacaoFiscal = "Tributável";
            } else {
                situacaoFiscal = "Isento";
            }
        }
        
        // 7. Calcular alíquota efetiva
        const aliquotaEfetiva = rendaBrutaSimulada > 0 ? (impostoDevido / rendaBrutaSimulada) * 100 : 0;
        
        // 8. Atualizar estado
        this.state.simulation = {
            rendaBrutaTotal: rendaBrutaSimulada,
            deducoesTotais: deducoesSimuladas,
            baseCalculo: baseCalculoComDeducao,
            impostoDevido,
            aliquotaEfetiva,
            situacaoFiscal,
            declaracaoObrigatoria,
            brackets: bracketsCalculation
        };
        
        // 9. Atualizar UI
        this.updateSimulationUI();
        
        // 10. Gerar detalhes do cálculo
        this.generateCalculationDetails();
    }
    
    updateSimulationUI() {
        const sim = this.state.simulation;
        const lucroMEI = Math.max(0, this.state.totalRevenueMEI - this.state.totalExpensesMEI);
        
        // Atualizar cards de simulação
        document.getElementById('sim-receitas-mei').textContent = 
            this.formatCurrency(this.state.totalRevenueMEI);
        document.getElementById('sim-despesas-mei').textContent = 
            this.formatCurrency(this.state.totalExpensesMEI);
        document.getElementById('sim-lucro-mei').textContent = 
            this.formatCurrency(lucroMEI);
        document.getElementById('sim-outras-rendas').textContent = 
            this.formatCurrency(this.state.totalOtherIncome);
        document.getElementById('sim-renda-bruta').textContent = 
            this.formatCurrency(sim.rendaBrutaTotal);
        document.getElementById('sim-renda-bruta-2').textContent = 
            this.formatCurrency(sim.rendaBrutaTotal);
        
        // Deduções
        document.getElementById('sim-home-office').textContent = 
            this.formatCurrency(this.state.deductions.homeOffice);
        document.getElementById('sim-dependentes').textContent = 
            this.formatCurrency(this.state.deductions.dependentes.total);
        document.getElementById('sim-saude').textContent = 
            this.formatCurrency(this.state.deductions.saude.total);
        document.getElementById('sim-educacao').textContent = 
            this.formatCurrency(this.state.deductions.educacao.total);
        document.getElementById('sim-previdencia').textContent = 
            this.formatCurrency(this.state.deductions.previdenciaDoacoes.total);
        document.getElementById('sim-total-deducoes').textContent = 
            this.formatCurrency(sim.deducoesTotais);
        document.getElementById('sim-total-deducoes-2').textContent = 
            this.formatCurrency(sim.deducoesTotais);
        
        // Base de cálculo
        document.getElementById('sim-base-calculo').textContent = 
            this.formatCurrency(sim.baseCalculo);
        
        // Faixas
        for (let i = 0; i < 5; i++) {
            const bracket = sim.brackets[i] || { tax: 0 };
            document.getElementById(`bracket-${i}`).textContent = 
                this.formatCurrency(bracket.tax);
        }
        
        // Resultado final
        document.getElementById('sim-imposto-devido').textContent = 
            this.formatCurrency(sim.impostoDevido);
        document.getElementById('sim-aliquota-efetiva').textContent = 
            `${sim.aliquotaEfetiva.toFixed(2)}%`;
        document.getElementById('sim-situacao-fiscal').textContent = 
            sim.situacaoFiscal;
        document.getElementById('sim-declaracao-obrigatoria').textContent = 
            sim.declaracaoObrigatoria ? "OBRIGATÓRIA" : "Não obrigatória";
        
        // Estilos condicionais
        const situacaoElement = document.getElementById('sim-situacao-fiscal');
        const declaracaoElement = document.getElementById('sim-declaracao-obrigatoria');
        
        if (sim.situacaoFiscal === "Não tributável") {
            situacaoElement.style.color = "var(--success)";
        } else if (sim.situacaoFiscal === "Isento") {
            situacaoElement.style.color = "var(--warning)";
        } else {
            situacaoElement.style.color = "var(--error)";
        }
        
        declaracaoElement.style.color = sim.declaracaoObrigatoria ? 
            "var(--warning)" : "var(--success)";
    }
    
    generateCalculationDetails() {
        const sim = this.state.simulation;
        const container = document.getElementById('simulation-details-content');
        
        let html = `
            <p><strong>Cálculo da Base de Cálculo:</strong></p>
            <p>Renda Bruta Total: ${this.formatCurrency(sim.rendaBrutaTotal)}</p>
            <p>(-) Total de Deduções: ${this.formatCurrency(sim.deducoesTotais)}</p>
            <p>(-) Dedução Padrão: ${this.formatCurrency(this.CONSTANTS.DEDUCAO_PADRAO)}</p>
            <p><strong>= Base de Cálculo IRPF: ${this.formatCurrency(sim.baseCalculo)}</strong></p>
            <br>
            <p><strong>Faixas de Incidência (2026):</strong></p>
        `;
        
        sim.brackets.forEach((bracket, index) => {
            const prevMax = index > 0 ? sim.brackets[index-1].max : 0;
            const range = index === 0 ? `Até ${this.formatCurrency(bracket.max)}` : 
                         `${this.formatCurrency(prevMax)} a ${this.formatCurrency(bracket.max)}`;
            
            html += `
                <p>${range}: ${bracket.rate}% sobre ${this.formatCurrency(bracket.income)} = ${this.formatCurrency(bracket.tax)}</p>
            `;
        });
        
        html += `
            <br>
            <p><strong>Total do Imposto Devido: ${this.formatCurrency(sim.impostoDevido)}</strong></p>
            <p><strong>Alíquota Efetiva: ${sim.aliquotaEfetiva.toFixed(2)}%</strong></p>
            <br>
            <p><strong>Legislação Aplicada:</strong></p>
            <ul>
                <li>Lei 9.250/1995 - Imposto de Renda Pessoa Física</li>
                <li>Instrução Normativa RFB 1.520/2014 - MEI</li>
                <li>Lei Complementar 123/2006 - Simples Nacional</li>
                <li>Instrução Normativa RFB 1.999/2022 - Declaração Anual</li>
            </ul>
        `;
        
        container.innerHTML = html;
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
        const receitaAdicional = parseFloat(document.getElementById('what-if-receita-adicional').value) || 0;
        const despesaAdicional = parseFloat(document.getElementById('what-if-despesa-adicional').value) || 0;
        const dependentesAdicionais = parseInt(document.getElementById('what-if-dependentes').value) || 0;
        const previdenciaAdicional = parseFloat(document.getElementById('what-if-previdencia').value) || 0;
        
        this.state.whatIfScenario = {
            active: true,
            receitaAdicional,
            despesaAdicional,
            dependentesAdicionais,
            previdenciaAdicional
        };
        
        this.calculateAll();
    }
    
    resetWhatIfScenario() {
        document.getElementById('what-if-receita-adicional').value = 0;
        document.getElementById('what-if-despesa-adicional').value = 0;
        document.getElementById('what-if-dependentes').value = 0;
        document.getElementById('what-if-previdencia').value = 0;
        
        this.state.whatIfScenario = {
            active: false,
            receitaAdicional: 0,
            despesaAdicional: 0,
            dependentesAdicionais: 0,
            previdenciaAdicional: 0
        };
        
        this.calculateAll();
    }
    
    deleteItem(id, type) {
        const itemId = parseInt(id);
        
        switch(type) {
            case 'revenue':
                this.state.revenues = this.state.revenues.filter(item => item.id !== itemId);
                this.calculateRevenueMEI();
                this.updateRevenuesList();
                break;
            case 'expense':
                this.state.expenses = this.state.expenses.filter(item => item.id !== itemId);
                this.state.depreciacoes = this.state.depreciacoes.filter(dep => dep.id !== itemId);
                this.calculateExpensesMEI();
                this.updateExpensesList();
                break;
        }
        
        this.saveState();
        this.calculateAll();
    }
    
    saveFormData() {
        // Identificação
        this.state.identification = {
            nome: document.getElementById('nome').value,
            cpf: document.getElementById('cpf').value,
            dataNascimento: document.getElementById('data-nascimento').value,
            tituloEleitor: document.getElementById('titulo-eleitor').value,
            cnpj: document.getElementById('cnpj').value,
            dataAbertura: document.getElementById('data-abertura').value
        };
        
        // Endereço
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
        
        // Atividade
        this.state.activity = {
            cnae: document.getElementById('cnae').value,
            tipoAtividade: document.getElementById('atividade').value,
            aliquotaDas: document.getElementById('aliquota-das').value,
            descricaoAtividade: document.getElementById('descricao-atividade').value
        };
        
        this.saveState();
        this.updateProgress();
        this.calculateAll();
    }
    
    saveState() {
        try {
            localStorage.setItem('meiAssistantState', JSON.stringify(this.state));
        } catch (e) {
            console.error('Erro ao salvar estado:', e);
        }
    }
    
    loadState() {
        try {
            const saved = localStorage.getItem('meiAssistantState');
            if (saved) {
                const parsed = JSON.parse(saved);
                
                // Mesclar estado preservando métodos
                Object.assign(this.state, parsed);
                
                // Preencher formulários
                this.populateForm();
                
                // Atualizar listas
                this.updateRevenuesList();
                this.updateExpensesList();
                
                // Navegar para seção salva
                if (this.state.currentSection) {
                    setTimeout(() => {
                        this.navigateTo(this.state.currentSection);
                    }, 100);
                }
            }
        } catch (e) {
            console.error('Erro ao carregar estado:', e);
        }
    }
    
    populateForm() {
        // Identificação
        if (this.state.identification) {
            document.getElementById('nome').value = this.state.identification.nome || '';
            document.getElementById('cpf').value = this.state.identification.cpf || '';
            document.getElementById('data-nascimento').value = this.state.identification.dataNascimento || '';
            document.getElementById('titulo-eleitor').value = this.state.identification.tituloEleitor || '';
            document.getElementById('cnpj').value = this.state.identification.cnpj || '';
            document.getElementById('data-abertura').value = this.state.identification.dataAbertura || '';
        }
        
        // Endereço
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
        
        // Atividade
        if (this.state.activity) {
            document.getElementById('cnae').value = this.state.activity.cnae || '';
            document.getElementById('atividade').value = this.state.activity.tipoAtividade || '';
            document.getElementById('aliquota-das').value = this.state.activity.aliquotaDas || '';
            document.getElementById('descricao-atividade').value = this.state.activity.descricaoAtividade || '';
        }
        
        // Home Office
        if (this.state.address.homeOffice) {
            const ho = this.state.address.homeOffice;
            document.getElementById('area-total').value = ho.areaTotal || 0;
            document.getElementById('area-escritorio').value = ho.areaEscritorio || 0;
            document.getElementById('aluguel-mensal').value = ho.aluguelMensal || 0;
            document.getElementById('condominio-mensal').value = ho.condominioMensal || 0;
            document.getElementById('iptu-anual').value = ho.iptuAnual || 0;
            document.getElementById('energia-mensal').value = ho.energiaMensal || 0;
            document.getElementById('internet-mensal').value = ho.internetMensal || 0;
        }
        
        // Outras Rendas
        if (this.state.otherIncome) {
            const oi = this.state.otherIncome;
            document.getElementById('salario-mensal').value = oi.salario?.mensal || 0;
            document.getElementById('salario-meses').value = oi.salario?.meses || 13;
            document.getElementById('aluguel-mensal-pf').value = oi.alugueis?.mensal || 0;
            document.getElementById('aluguel-meses').value = oi.alugueis?.meses || 12;
            document.getElementById('despesas-aluguel').value = oi.alugueis?.despesas || 0;
            document.getElementById('dividendos').value = oi.investimentos?.dividendos || 0;
            document.getElementById('juros-capital').value = oi.investimentos?.jurosCapital || 0;
            document.getElementById('rendimentos-acoes').value = oi.investimentos?.rendimentosAcoes || 0;
            document.getElementById('rendimentos-fiis').value = oi.investimentos?.rendimentosFIIs || 0;
            document.getElementById('pensao-recebida').value = oi.outrasRendas?.pensaoRecebida || 0;
            document.getElementById('doacoes-recebidas').value = oi.outrasRendas?.doacoesRecebidas || 0;
            document.getElementById('outros-rendimentos').value = oi.outrasRendas?.outrosRendimentos || 0;
        }
        
        // Deduções
        if (this.state.deductions) {
            const ded = this.state.deductions;
            document.getElementById('dependentes').value = ded.dependentes?.quantidade || 0;
            document.getElementById('dependentes-menores').value = ded.dependentes?.menores || 0;
            document.getElementById('dependentes-universitarios').value = ded.dependentes?.universitarios || 0;
            document.getElementById('gastos-medicos').value = ded.saude?.medicos || 0;
            document.getElementById('gastos-medicamentos').value = ded.saude?.medicamentos || 0;
            document.getElementById('gastos-plano').value = ded.saude?.plano || 0;
            document.getElementById('gastos-orteses').value = ded.saude?.orteses || 0;
            document.getElementById('gastos-faculdade').value = ded.educacao?.faculdade || 0;
            document.getElementById('gastos-escola').value = ded.educacao?.escola || 0;
            document.getElementById('gastos-cursos').value = ded.educacao?.cursos || 0;
            document.getElementById('gastos-material').value = ded.educacao?.material || 0;
            document.getElementById('previdencia-oficial').value = ded.previdenciaDoacoes?.previdenciaOficial || 0;
            document.getElementById('previdencia-privada').value = ded.previdenciaDoacoes?.previdenciaPrivada || 0;
            document.getElementById('doacoes-dedutiveis').value = ded.previdenciaDoacoes?.doacoesDedutiveis || 0;
            document.getElementById('pensao-alimenticia').value = ded.previdenciaDoacoes?.pensaoAlimenticia || 0;
        }
    }
    
    updateProgress() {
        let filled = 0;
        let total = 0;
        
        // Campos obrigatórios
        const requiredFields = [
            '#nome', '#cpf', '#cnpj', '#data-abertura',
            '#res-logradouro', '#res-numero', '#res-bairro', '#res-cidade', '#res-uf',
            '#atividade', '#aliquota-das', '#descricao-atividade'
        ];
        
        requiredFields.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                total++;
                if (element.value && element.value.trim()) filled++;
            }
        });
        
        // Campos numéricos básicos
        const numericFields = ['#salario-mensal', '#dependentes'];
        numericFields.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                total++;
                if (parseFloat(element.value) > 0) filled++;
            }
        });
        
        const progress = total > 0 ? (filled / total) * 100 : 0;
        const progressElement = document.getElementById('saved-progress');
        const progressFill = document.querySelector('.progress-fill');
        
        if (progressElement) {
            progressElement.textContent = `${Math.round(progress)}%`;
        }
        
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }
        
        this.state.progress = progress;
    }
    
    runValidations() {
        this.validateRevenueLimit();
        this.validateIRPF();
        this.validateDocuments();
        this.validateDeductions();
        
        this.updateValidationResults();
    }
    
    validateRevenueLimit() {
        const card = document.getElementById('validation-revenue-limit');
        const status = card.querySelector('.validation-status');
        
        const totalRevenue = this.state.totalRevenueMEI;
        const limit = this.CONSTANTS.LIMITE_FATURAMENTO_MEI;
        
        if (totalRevenue > limit) {
            status.textContent = '❌ LIMITE ULTRAPASSADO';
            status.style.color = 'var(--error)';
            return {
                icon: '❌',
                title: 'Limite MEI',
                message: `R$ ${this.formatNumber(totalRevenue)} de R$ ${this.formatNumber(limit)}`,
                color: 'var(--error)',
                severity: 'error'
            };
        } else if (totalRevenue > limit * 0.9) {
            status.textContent = '⚠️ PRÓXIMO DO LIMITE';
            status.style.color = 'var(--warning)';
            return {
                icon: '⚠️',
                title: 'Limite MEI',
                message: `R$ ${this.formatNumber(totalRevenue)} de R$ ${this.formatNumber(limit)}`,
                color: 'var(--warning)',
                severity: 'warning'
            };
        } else {
            status.textContent = '✅ DENTRO DO LIMITE';
            status.style.color = 'var(--success)';
            return {
                icon: '✅',
                title: 'Limite MEI',
                message: `R$ ${this.formatNumber(totalRevenue)} de R$ ${this.formatNumber(limit)}`,
                color: 'var(--success)',
                severity: 'success'
            };
        }
    }
    
    validateIRPF() {
        const card = document.getElementById('validation-irpf');
        const status = card.querySelector('.validation-status');
        const sim = this.state.simulation;
        
        if (sim.declaracaoObrigatoria) {
            if (sim.impostoDevido > 0) {
                status.textContent = '💰 IMPOSTO DEVIDO';
                status.style.color = 'var(--warning)';
                return {
                    icon: '💰',
                    title: 'IRPF',
                    message: `Devido: ${this.formatCurrency(sim.impostoDevido)}`,
                    color: 'var(--warning)',
                    severity: 'warning'
                };
            } else {
                status.textContent = '📋 DECLARAÇÃO OBRIGATÓRIA';
                status.style.color = 'var(--warning)';
                return {
                    icon: '📋',
                    title: 'IRPF',
                    message: 'Declaração obrigatória (isento)',
                    color: 'var(--warning)',
                    severity: 'warning'
                };
            }
        } else {
            status.textContent = '✅ ISENTO';
            status.style.color = 'var(--success)';
            return {
                icon: '✅',
                title: 'IRPF',
                message: 'Não tributável',
                color: 'var(--success)',
                severity: 'success'
            };
        }
    }
    
    validateDocuments() {
        const card = document.getElementById('validation-documents');
        const status = card.querySelector('.validation-status');
        
        const cpf = this.state.identification.cpf || '';
        const cnpj = this.state.identification.cnpj || '';
        const cpfValid = cpf.replace(/\D/g, '').length === 11;
        const cnpjValid = cnpj.replace(/\D/g, '').length === 14;
        
        if (cpfValid && cnpjValid) {
            status.textContent = '✅ DOCUMENTOS VÁLIDOS';
            status.style.color = 'var(--success)';
            return {
                icon: '✅',
                title: 'Documentos',
                message: 'CPF e CNPJ válidos',
                color: 'var(--success)',
                severity: 'success'
            };
        } else if (!cpfValid && !cnpjValid) {
            status.textContent = '❌ DOCUMENTOS INVÁLIDOS';
            status.style.color = 'var(--error)';
            return {
                icon: '❌',
                title: 'Documentos',
                message: 'CPF e CNPJ inválidos',
                color: 'var(--error)',
                severity: 'error'
            };
        } else if (!cpfValid) {
            status.textContent = '❌ CPF INVÁLIDO';
            status.style.color = 'var(--error)';
            return {
                icon: '❌',
                title: 'Documentos',
                message: 'CPF inválido',
                color: 'var(--error)',
                severity: 'error'
            };
        } else {
            status.textContent = '❌ CNPJ INVÁLIDO';
            status.style.color = 'var(--error)';
            return {
                icon: '❌',
                title: 'Documentos',
                message: 'CNPJ inválido',
                color: 'var(--error)',
                severity: 'error'
            };
        }
    }
    
    validateDeductions() {
        const card = document.getElementById('validation-deductions');
        const status = card.querySelector('.validation-status');
        const ded = this.state.deductions;
        
        // Verificar se há deduções acima dos limites
        let warnings = [];
        
        // Verificar limite de educação
        const pessoasEducacao = Math.max(1, ded.dependentes.universitarios + 1);
        const limiteEducacao = pessoasEducacao * this.CONSTANTS.LIMITE_DEDUCAO_EDUCACAO;
        if (ded.educacao.total > limiteEducacao) {
            warnings.push(`Educação: limite de ${this.formatCurrency(limiteEducacao)} excedido`);
        }
        
        // Verificar limite previdência privada
        const limitePrevidencia = this.state.simulation.baseCalculo * this.CONSTANTS.LIMITE_PREVIDENCIA_PRIVADA;
        if (ded.previdenciaDoacoes.previdenciaPrivada > limitePrevidencia) {
            warnings.push(`Previdência privada: limite de ${this.formatCurrency(limitePrevidencia)} excedido`);
        }
        
        if (warnings.length > 0) {
            status.textContent = '⚠️ LIMITES EXCEDIDOS';
            status.style.color = 'var(--warning)';
            return {
                icon: '⚠️',
                title: 'Deduções',
                message: `${warnings.length} limite(s) excedido(s)`,
                color: 'var(--warning)',
                severity: 'warning',
                warnings: warnings
            };
        } else {
            status.textContent = '✅ DEDUÇÕES VÁLIDAS';
            status.style.color = 'var(--success)';
            return {
                icon: '✅',
                title: 'Deduções',
                message: 'Dentro dos limites legais',
                color: 'var(--success)',
                severity: 'success'
            };
        }
    }
    
    updateValidationResults() {
        const resultsList = document.getElementById('validation-results-list');
        const alertsList = document.getElementById('validation-alerts-list');
        
        if (!resultsList || !alertsList) return;
        
        const validations = [
            this.validateRevenueLimit(),
            this.validateIRPF(),
            this.validateDocuments(),
            this.validateDeductions()
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
            
            // Adicionar alertas se houver
            if (validation.severity === 'warning' || validation.severity === 'error') {
                const alertDiv = document.createElement('div');
                alertDiv.className = 'validation-result-item';
                alertDiv.style.borderLeft = `4px solid ${validation.color}`;
                alertDiv.innerHTML = `
                    <span>${validation.icon} ${validation.title}</span>
                    <span style="color: ${validation.color}">${validation.message}</span>
                `;
                alertsList.appendChild(alertDiv);
                
                // Adicionar warnings detalhados
                if (validation.warnings) {
                    validation.warnings.forEach(warning => {
                        const warningDiv = document.createElement('div');
                        warningDiv.className = 'validation-result-item';
                        warningDiv.style.paddingLeft = '30px';
                        warningDiv.style.fontSize = '0.9em';
                        warningDiv.innerHTML = `
                            <span style="color: ${validation.color}">⚠️ ${warning}</span>
                        `;
                        alertsList.appendChild(warningDiv);
                    });
                }
            }
        });
        
        // Alertas adicionais baseados na simulação
        const sim = this.state.simulation;
        if (sim.declaracaoObrigatoria && sim.impostoDevido > 0) {
            const alertDiv = document.createElement('div');
            alertDiv.className = 'validation-result-item';
            alertDiv.style.borderLeft = '4px solid var(--warning)';
            alertDiv.innerHTML = `
                <span>💰 IRPF Devido</span>
                <span style="color: var(--warning)">Imposto devido: ${this.formatCurrency(sim.impostoDevido)}</span>
            `;
            alertsList.appendChild(alertDiv);
        }
        
        if (this.state.revenues.length === 0) {
            const alertDiv = document.createElement('div');
            alertDiv.className = 'validation-result-item';
            alertDiv.style.borderLeft = '4px solid var(--warning)';
            alertDiv.innerHTML = `
                <span>📊 Sem Receitas</span>
                <span style="color: var(--warning)">Nenhuma receita MEI informada</span>
            `;
            alertsList.appendChild(alertDiv);
        }
        
        // Verificar faturamento próximo ao limite
        const faturamento = this.state.totalRevenueMEI;
        const limite = this.CONSTANTS.LIMITE_FATURAMENTO_MEI;
        if (faturamento > 0 && faturamento / limite > 0.8) {
            const alertDiv = document.createElement('div');
            alertDiv.className = 'validation-result-item';
            alertDiv.style.borderLeft = '4px solid var(--warning)';
            alertDiv.innerHTML = `
                <span>💰 Faturamento Alto</span>
                <span style="color: var(--warning)">${Math.round(faturamento/limite*100)}% do limite MEI</span>
            `;
            alertsList.appendChild(alertDiv);
        }
    }
    
    generateReport() {
        const preview = document.getElementById('report-preview');
        if (!preview) return;
        
        const now = new Date();
        const generatedDate = now.toLocaleDateString('pt-BR');
        const generatedTime = now.toLocaleTimeString('pt-BR');
        const sim = this.state.simulation;
        const lucroMEI = Math.max(0, this.state.totalRevenueMEI - this.state.totalExpensesMEI);
        
        let html = `
            <div class="report-content">
                <header class="report-header">
                    <div class="header-grid">
                        <div class="header-logo">
                            <div class="logo-symbol">📊</div>
                            <div>
                                <h1>RELATÓRIO FISCAL COMPLETO - MEI</h1>
                                <p class="report-subtitle">Simulação IRPF ${new Date().getFullYear()} - Microempreendedor Individual</p>
                            </div>
                        </div>
                        <div class="header-info">
                            <p><strong>Data:</strong> ${generatedDate}</p>
                            <p><strong>Hora:</strong> ${generatedTime}</p>
                            <p><strong>Página:</strong> 1/1</p>
                            <p><strong>Versão:</strong> 1.0</p>
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
                            <strong>Data Nascimento:</strong>
                            <span>${this.formatDate(this.state.identification.dataNascimento) || 'Não informado'}</span>
                        </div>
                        <div class="info-item">
                            <strong>CNPJ MEI:</strong>
                            <span>${this.state.identification.cnpj || 'Não informado'}</span>
                        </div>
                        <div class="info-item">
                            <strong>Data Abertura MEI:</strong>
                            <span>${this.formatDate(this.state.identification.dataAbertura) || 'Não informado'}</span>
                        </div>
                        <div class="info-item">
                            <strong>Título de Eleitor:</strong>
                            <span>${this.state.identification.tituloEleitor || 'Não informado'}</span>
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
                        <span>Home Office - Endereço fiscal coincidente com residencial</span>
                    </div>
                    ${this.generateAddressInfo(this.state.address.residential)}
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
                        <h3>🏢 Endereço Fiscal (PJ - MEI)</h3>
                        <div class="info-grid">
                            ${this.generateAddressInfo(this.state.address.fiscal)}
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Home Office
        if (this.state.address.homeOffice && this.state.address.homeOffice.areaTotal > 0) {
            const ho = this.state.address.homeOffice;
            const percentual = ho.areaEscritorio / ho.areaTotal;
            const percentualLimitado = Math.min(percentual, this.CONSTANTS.PERCENTUAL_HOME_OFFICE);
            
            html += `
                <div class="report-section">
                    <h2>🏠 HOME OFFICE - DETALHES</h2>
                    <div class="info-grid">
                        <div class="info-item">
                            <strong>Área Total:</strong>
                            <span>${ho.areaTotal} m²</span>
                        </div>
                        <div class="info-item">
                            <strong>Área Escritório:</strong>
                            <span>${ho.areaEscritorio} m²</span>
                        </div>
                        <div class="info-item">
                            <strong>Percentual:</strong>
                            <span>${(percentual * 100).toFixed(1)}%</span>
                        </div>
                        <div class="info-item">
                            <strong>Percentual Dedutível:</strong>
                            <span>${(percentualLimitado * 100).toFixed(1)}%</span>
                        </div>
                        <div class="info-item">
                            <strong>Dedução Anual:</strong>
                            <span>${this.formatCurrency(this.state.deductions.homeOffice)}</span>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Atividade MEI
        html += `
            <div class="report-section">
                <h2>🏢 ATIVIDADE ECONÔMICA MEI</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <strong>CNAE:</strong>
                        <span>${this.state.activity.cnae || 'Não informado'}</span>
                    </div>
                    <div class="info-item">
                        <strong>Tipo de Atividade:</strong>
                        <span>${this.state.activity.tipoAtividade || 'Não informado'}</span>
                    </div>
                    <div class="info-item">
                        <strong>Alíquota DAS:</strong>
                        <span>${this.state.activity.aliquotaDas || '0'}%</span>
                    </div>
                    <div class="info-item full-width">
                        <strong>Descrição:</strong>
                        <span>${this.state.activity.descricaoAtividade || 'Não informado'}</span>
                    </div>
                </div>
            </div>
        `;
        
        // Receitas MEI
        html += `
            <div class="report-section">
                <h2>💰 RECEITAS MEI - RESUMO</h2>
                <div class="financial-summary">
                    <div class="summary-item">
                        <h3>Total Receitas</h3>
                        <p class="summary-value">${this.formatCurrency(this.state.totalRevenueMEI)}</p>
                        <p class="summary-detail">${this.state.revenues.length} lançamento(s)</p>
                    </div>
                    <div class="summary-item">
                        <h3>Total Despesas</h3>
                        <p class="summary-value">${this.formatCurrency(this.state.totalExpensesMEI)}</p>
                        <p class="summary-detail">${this.state.expenses.length} lançamento(s)</p>
                    </div>
                    <div class="summary-item">
                        <h3>Lucro MEI</h3>
                        <p class="summary-value">${this.formatCurrency(lucroMEI)}</p>
                        <p class="summary-detail">Receitas - Despesas</p>
                    </div>
                    <div class="summary-item">
                        <h3>DAS Anual</h3>
                        <p class="summary-value">${this.formatCurrency(this.state.DASAnual)}</p>
                        <p class="summary-detail">12 × ${this.formatCurrency(this.state.DASAnual / 12)}</p>
                    </div>
                </div>
            </div>
        `;
        
        // Outras Rendas
        html += `
            <div class="report-section">
                <h2>💼 OUTRAS FONTES DE RENDA</h2>
                <div class="financial-summary">
                    <div class="summary-item">
                        <h3>Salário/Pró-labore</h3>
                        <p class="summary-value">${this.formatCurrency(this.state.otherIncome.salario.anual)}</p>
                        <p class="summary-detail">${this.state.otherIncome.salario.meses} meses</p>
                    </div>
                    <div class="summary-item">
                        <h3>Aluguéis</h3>
                        <p class="summary-value">${this.formatCurrency(this.state.otherIncome.alugueis.anual)}</p>
                        <p class="summary-detail">${this.state.otherIncome.alugueis.meses} meses</p>
                    </div>
                    <div class="summary-item">
                        <h3>Investimentos</h3>
                        <p class="summary-value">${this.formatCurrency(
                            this.state.otherIncome.investimentos.jurosCapital +
                            this.state.otherIncome.investimentos.rendimentosAcoes +
                            this.state.otherIncome.investimentos.rendimentosFIIs
                        )}</p>
                        <p class="summary-detail">Juros, ações e FIIs</p>
                    </div>
                    <div class="summary-item">
                        <h3>Total Outras Rendas</h3>
                        <p class="summary-value">${this.formatCurrency(this.state.totalOtherIncome)}</p>
                        <p class="summary-detail">Soma de todas as fontes</p>
                    </div>
                </div>
            </div>
        `;
        
        // Deduções
        html += `
            <div class="report-section">
                <h2>🧾 DEDUÇÕES IRPF - RESUMO</h2>
                <div class="financial-summary">
                    <div class="summary-item">
                        <h3>Dependentes</h3>
                        <p class="summary-value">${this.formatCurrency(this.state.deductions.dependentes.total)}</p>
                        <p class="summary-detail">${this.state.deductions.dependentes.quantidade} dependente(s)</p>
                    </div>
                    <div class="summary-item">
                        <h3>Saúde</h3>
                        <p class="summary-value">${this.formatCurrency(this.state.deductions.saude.total)}</p>
                        <p class="summary-detail">Médicos, medicamentos, plano</p>
                    </div>
                    <div class="summary-item">
                        <h3>Educação</h3>
                        <p class="summary-value">${this.formatCurrency(this.state.deductions.educacao.total)}</p>
                        <p class="summary-detail">Faculdade, escola, cursos</p>
                    </div>
                    <div class="summary-item">
                        <h3>Previdência/Doações</h3>
                        <p class="summary-value">${this.formatCurrency(this.state.deductions.previdenciaDoacoes.total)}</p>
                        <p class="summary-detail">INSS, PGBL, doações, pensão</p>
                    </div>
                </div>
            </div>
        `;
        
        // Simulação IRPF
        html += `
            <div class="report-section">
                <h2>📈 SIMULAÇÃO IRPF COMPLETA</h2>
                <div class="simulation-report">
                    <div class="simulation-summary">
                        <div class="sim-item">
                            <span class="sim-label">Lucro MEI:</span>
                            <span class="sim-value">${this.formatCurrency(lucroMEI)}</span>
                        </div>
                        <div class="sim-item">
                            <span class="sim-label">(+) Outras Rendas:</span>
                            <span class="sim-value">${this.formatCurrency(this.state.totalOtherIncome)}</span>
                        </div>
                        <div class="sim-item total">
                            <span class="sim-label">(=) Renda Bruta Total:</span>
                            <span class="sim-value">${this.formatCurrency(sim.rendaBrutaTotal)}</span>
                        </div>
                        <div class="sim-item">
                            <span class="sim-label">(-) Deduções Totais:</span>
                            <span class="sim-value">${this.formatCurrency(sim.deducoesTotais)}</span>
                        </div>
                        <div class="sim-item">
                            <span class="sim-label">(-) Dedução Padrão:</span>
                            <span class="sim-value">${this.formatCurrency(this.CONSTANTS.DEDUCAO_PADRAO)}</span>
                        </div>
                        <div class="sim-item total">
                            <span class="sim-label">(=) Base de Cálculo IRPF:</span>
                            <span class="sim-value">${this.formatCurrency(sim.baseCalculo)}</span>
                        </div>
                    </div>
                    
                    <h3>📊 Cálculo por Faixas IRPF 2026</h3>
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
        
        // Adicionar faixas
        for (let i = 0; i < sim.brackets.length; i++) {
            const bracket = sim.brackets[i];
            const prevMax = i > 0 ? sim.brackets[i-1].max : 0;
            const range = i === 0 ? `Até ${this.formatCurrency(bracket.max)}` : 
                         `${this.formatCurrency(prevMax)} a ${this.formatCurrency(bracket.max)}`;
            
            html += `
                <tr>
                    <td>${range}</td>
                    <td>${bracket.rate}%</td>
                    <td>${this.formatCurrency(bracket.income)}</td>
                    <td>${this.formatCurrency(bracket.tax)}</td>
                </tr>
            `;
        }
        
        html += `
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="3"><strong>Imposto Total Devido:</strong></td>
                                <td><strong>${this.formatCurrency(sim.impostoDevido)}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                    
                    <div class="simulation-results-final">
                        <div class="result-item">
                            <span class="result-label">Situação Fiscal:</span>
                            <span class="result-value">${sim.situacaoFiscal}</span>
                        </div>
                        <div class="result-item">
                            <span class="result-label">Declaração IRPF:</span>
                            <span class="result-value">${sim.declaracaoObrigatoria ? 'OBRIGATÓRIA' : 'NÃO OBRIGATÓRIA'}</span>
                        </div>
                        <div class="result-item">
                            <span class="result-label">Alíquota Efetiva:</span>
                            <span class="result-value">${sim.aliquotaEfetiva.toFixed(2)}%</span>
                        </div>
                        <div class="result-item">
                            <span class="result-label">Base de Cálculo:</span>
                            <span class="result-value">${this.formatCurrency(sim.baseCalculo)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Observações Fiscais
        html += `
            <div class="report-section">
                <h2>⚖️ OBSERVAÇÕES FISCAIS IMPORTANTES</h2>
                <div class="observations">
                    <p>📝 <strong>Este é um relatório de simulação fiscal.</strong> Não substitui a declaração oficial nem o trabalho de um contador.</p>
                    <p>💰 <strong>MEI é isento de IRPJ</strong> (Imposto de Renda Pessoa Jurídica) pelo Simples Nacional.</p>
                    <p>📋 <strong>IRPF é devido</strong> apenas se a renda tributável ultrapassar R$ ${this.formatNumber(this.CONSTANTS.LIMITE_ISENCAO_IRPF)}/ano.</p>
                    <p>⚠️ <strong>Limite MEI:</strong> R$ ${this.formatNumber(this.CONSTANTS.LIMITE_FATURAMENTO_MEI)} de faturamento anual.</p>
                    <p>🏠 <strong>Home Office:</strong> Até ${(this.CONSTANTS.PERCENTUAL_HOME_OFFICE * 100)}% das despesas podem ser deduzidas.</p>
                    <p>👨‍💼 <strong>Consulte um contador</strong> para validação final, declaração e orientações específicas.</p>
                    <p>📅 <strong>Ano de referência:</strong> ${new Date().getFullYear()}</p>
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
        
        // Adicionar estilos específicos do relatório
        this.addReportStyles();
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
    
    addReportStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .report-content {
                font-family: 'Segoe UI', Arial, sans-serif;
                color: #333;
                line-height: 1.6;
                max-width: 1000px;
                margin: 0 auto;
                background: white;
                padding: 20px;
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
            
            @media print {
                .report-content {
                    padding: 0 !important;
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
        
        const preview = document.getElementById('report-preview');
        if (preview) {
            preview.appendChild(style);
        }
    }
    
    setupReportControls() {
        const fullscreenBtn = document.getElementById('fullscreen-btn');
        const printBtn = document.getElementById('print-btn');
        
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                const preview = document.getElementById('report-preview');
                if (preview) {
                    preview.classList.toggle('fullscreen');
                    if (preview.classList.contains('fullscreen')) {
                        fullscreenBtn.innerHTML = '📱 Sair Tela Cheia';
                        document.addEventListener('keydown', this.handleEscKey.bind(this));
                    } else {
                        fullscreenBtn.innerHTML = '📱 Tela Cheia';
                        document.removeEventListener('keydown', this.handleEscKey.bind(this));
                    }
                }
            });
        }
        
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                window.print();
            });
        }
    }
    
    handleEscKey(e) {
        if (e.key === 'Escape') {
            const preview = document.getElementById('report-preview');
            const fullscreenBtn = document.getElementById('fullscreen-btn');
            
            if (preview && preview.classList.contains('fullscreen')) {
                preview.classList.remove('fullscreen');
                if (fullscreenBtn) {
                    fullscreenBtn.innerHTML = '📱 Tela Cheia';
                }
                document.removeEventListener('keydown', this.handleEscKey.bind(this));
            }
        }
    }
    
    exportPDF() {
        // Criar uma janela temporária para gerar o PDF
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Permita pop-ups para gerar o PDF.');
            return;
        }

        const now = new Date();
        const generatedDate = now.toLocaleDateString('pt-BR');
        const generatedTime = now.toLocaleTimeString('pt-BR');
        const sim = this.state.simulation;
        const lucroMEI = Math.max(0, this.state.totalRevenueMEI - this.state.totalExpensesMEI);

        // Gerar conteúdo HTML otimizado para PDF
        let html = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Relatório Fiscal MEI - ${generatedDate}</title>
            <style>
                /* Estilos otimizados para PDF */
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Arial', sans-serif;
                    color: #333;
                    line-height: 1.4;
                    font-size: 12pt;
                    padding: 20px;
                    background: white;
                }
                
                .pdf-container {
                    max-width: 210mm;
                    margin: 0 auto;
                }
                
                /* Cabeçalho */
                .pdf-header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 3px solid #0066cc;
                }
                
                .pdf-header h1 {
                    color: #0066cc;
                    font-size: 24px;
                    margin-bottom: 10px;
                    font-weight: bold;
                }
                
                .pdf-subtitle {
                    color: #666;
                    font-size: 14px;
                    margin-bottom: 15px;
                }
                
                .header-info {
                    display: flex;
                    justify-content: space-between;
                    font-size: 11px;
                    color: #555;
                    margin-top: 20px;
                    padding-top: 10px;
                    border-top: 1px solid #ddd;
                }
                
                /* Seções */
                .pdf-section {
                    margin-bottom: 25px;
                    page-break-inside: avoid;
                }
                
                .pdf-section h2 {
                    color: #0066cc;
                    font-size: 16px;
                    margin-bottom: 15px;
                    padding-bottom: 5px;
                    border-bottom: 2px solid #0066cc;
                    font-weight: bold;
                }
                
                /* Grid de informações */
                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 10px;
                    margin: 15px 0;
                }
                
                .info-item {
                    padding: 8px;
                    background: #f8f9fa;
                    border-radius: 4px;
                    border-left: 3px solid #0066cc;
                }
                
                .info-item strong {
                    display: block;
                    color: #555;
                    font-size: 11px;
                    margin-bottom: 3px;
                }
                
                .info-item span {
                    color: #222;
                    font-size: 12px;
                }
                
                /* Tabelas */
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 15px 0;
                    font-size: 11px;
                }
                
                th {
                    background: #0066cc;
                    color: white;
                    padding: 8px;
                    text-align: left;
                    font-weight: bold;
                    border: 1px solid #0055aa;
                }
                
                td {
                    padding: 8px;
                    border: 1px solid #ddd;
                }
                
                tr:nth-child(even) {
                    background: #f9f9f9;
                }
                
                /* Sumários financeiros */
                .financial-summary {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 15px;
                    margin: 20px 0;
                }
                
                .summary-item {
                    text-align: center;
                    padding: 15px;
                    background: #f8f9fa;
                    border-radius: 8px;
                    border: 1px solid #ddd;
                }
                
                .summary-item h3 {
                    font-size: 12px;
                    color: #555;
                    margin-bottom: 10px;
                }
                
                .summary-value {
                    font-size: 20px;
                    font-weight: bold;
                    color: #0066cc;
                    margin: 10px 0;
                }
                
                .summary-detail {
                    font-size: 10px;
                    color: #777;
                }
                
                /* Simulação */
                .simulation-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                    border-bottom: 1px solid #eee;
                }
                
                .simulation-item.total {
                    border-top: 2px solid #0066cc;
                    border-bottom: none;
                    margin-top: 10px;
                    padding-top: 15px;
                    font-weight: bold;
                }
                
                .sim-label {
                    color: #555;
                }
                
                .sim-value {
                    color: #222;
                    font-weight: 500;
                }
                
                /* Observações */
                .observations {
                    background: #fff8e1;
                    padding: 20px;
                    border-radius: 8px;
                    border-left: 4px solid #ff9800;
                    margin: 25px 0;
                    font-size: 11px;
                }
                
                .observations p {
                    margin: 8px 0;
                    padding-left: 15px;
                    position: relative;
                }
                
                .observations p::before {
                    content: "•";
                    position: absolute;
                    left: 0;
                    color: #ff9800;
                    font-size: 16px;
                }
                
                /* Rodapé */
                .pdf-footer {
                    text-align: center;
                    margin-top: 50px;
                    padding-top: 20px;
                    border-top: 2px solid #ddd;
                    color: #777;
                    font-size: 10px;
                }
                
                .footer-note {
                    font-style: italic;
                    margin: 10px 0;
                }
                
                .footer-company {
                    margin-top: 15px;
                    color: #555;
                    font-weight: 500;
                }
                
                /* Quebras de página */
                @media print {
                    body {
                        padding: 15mm;
                    }
                    
                    .page-break {
                        page-break-before: always;
                    }
                    
                    .no-print {
                        display: none;
                    }
                    
                    .pdf-section {
                        page-break-inside: avoid;
                        page-break-after: auto;
                    }
                    
                    table {
                        page-break-inside: avoid;
                    }
                }
                
                /* Utilitários */
                .text-center {
                    text-align: center;
                }
                
                .text-right {
                    text-align: right;
                }
                
                .mt-20 {
                    margin-top: 20px;
                }
                
                .mb-20 {
                    margin-bottom: 20px;
                }
                
                .color-success {
                    color: #28a745;
                }
                
                .color-warning {
                    color: #ffc107;
                }
                
                .color-error {
                    color: #dc3545;
                }
            </style>
        </head>
        <body>
            <div class="pdf-container">
                <header class="pdf-header">
                    <h1>RELATÓRIO FISCAL COMPLETO - MEI</h1>
                    <p class="pdf-subtitle">Simulação IRPF ${new Date().getFullYear()} - Microempreendedor Individual</p>
                    <div class="header-info">
                        <div>
                            <strong>Data:</strong> ${generatedDate}<br>
                            <strong>Hora:</strong> ${generatedTime}
                        </div>
                        <div>
                            <strong>Página:</strong> 1<br>
                            <strong>Versão:</strong> 1.0
                        </div>
                    </div>
                </header>
                
                <div class="pdf-section">
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
                            <strong>Data Nascimento:</strong>
                            <span>${this.formatDate(this.state.identification.dataNascimento) || 'Não informado'}</span>
                        </div>
                        <div class="info-item">
                            <strong>CNPJ MEI:</strong>
                            <span>${this.state.identification.cnpj || 'Não informado'}</span>
                        </div>
                        <div class="info-item">
                            <strong>Data Abertura MEI:</strong>
                            <span>${this.formatDate(this.state.identification.dataAbertura) || 'Não informado'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="pdf-section">
                    <h2>📍 ENDEREÇO</h2>
        `;
        
        // Endereço
        if (this.state.address.sameAddress) {
            html += `
                    <div class="info-grid">
                        <div class="info-item">
                            <strong>Status:</strong>
                            <span>Home Office</span>
                        </div>
                        ${this.generatePDFAddressInfo(this.state.address.residential)}
                    </div>
            `;
        } else {
            html += `
                    <div class="info-grid">
                        ${this.generatePDFAddressInfo(this.state.address.residential, 'Residencial')}
                    </div>
                    <div class="info-grid mt-20">
                        ${this.generatePDFAddressInfo(this.state.address.fiscal, 'Fiscal')}
                    </div>
            `;
        }
        
        // Home Office
        if (this.state.address.homeOffice && this.state.address.homeOffice.areaTotal > 0) {
            const ho = this.state.address.homeOffice;
            const percentual = ho.areaEscritorio / ho.areaTotal;
            const percentualLimitado = Math.min(percentual, this.CONSTANTS.PERCENTUAL_HOME_OFFICE);
            
            html += `
                <div class="pdf-section">
                    <h2>🏠 HOME OFFICE</h2>
                    <div class="info-grid">
                        <div class="info-item">
                            <strong>Área Total:</strong>
                            <span>${ho.areaTotal} m²</span>
                        </div>
                        <div class="info-item">
                            <strong>Área Escritório:</strong>
                            <span>${ho.areaEscritorio} m²</span>
                        </div>
                        <div class="info-item">
                            <strong>Percentual:</strong>
                            <span>${(percentual * 100).toFixed(1)}%</span>
                        </div>
                        <div class="info-item">
                            <strong>Dedução Anual:</strong>
                            <span>${this.formatCurrency(this.state.deductions.homeOffice)}</span>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Atividade MEI
        html += `
                <div class="pdf-section">
                    <h2>🏢 ATIVIDADE ECONÔMICA MEI</h2>
                    <div class="info-grid">
                        <div class="info-item">
                            <strong>CNAE:</strong>
                            <span>${this.state.activity.cnae || 'Não informado'}</span>
                        </div>
                        <div class="info-item">
                            <strong>Tipo de Atividade:</strong>
                            <span>${this.state.activity.tipoAtividade || 'Não informado'}</span>
                        </div>
                        <div class="info-item">
                            <strong>Alíquota DAS:</strong>
                            <span>${this.state.activity.aliquotaDas || '0'}%</span>
                        </div>
                        <div class="info-item" style="grid-column: span 2;">
                            <strong>Descrição:</strong>
                            <span>${this.state.activity.descricaoAtividade || 'Não informado'}</span>
                        </div>
                    </div>
                </div>
        `;
        
        // Resumo Financeiro
        html += `
                <div class="pdf-section">
                    <h2>💰 RESUMO FINANCEIRO</h2>
                    <div class="financial-summary">
                        <div class="summary-item">
                            <h3>Receitas MEI</h3>
                            <p class="summary-value">${this.formatCurrency(this.state.totalRevenueMEI)}</p>
                            <p class="summary-detail">${this.state.revenues.length} lançamentos</p>
                        </div>
                        <div class="summary-item">
                            <h3>Despesas MEI</h3>
                            <p class="summary-value">${this.formatCurrency(this.state.totalExpensesMEI)}</p>
                            <p class="summary-detail">${this.state.expenses.length} lançamentos</p>
                        </div>
                        <div class="summary-item">
                            <h3>Lucro MEI</h3>
                            <p class="summary-value">${this.formatCurrency(lucroMEI)}</p>
                            <p class="summary-detail">Receitas - Despesas</p>
                        </div>
                        <div class="summary-item">
                            <h3>DAS Anual</h3>
                            <p class="summary-value">${this.formatCurrency(this.state.DASAnual)}</p>
                            <p class="summary-detail">Pagamento mensal</p>
                        </div>
                    </div>
                </div>
        `;
        
        // Outras Rendas
        html += `
                <div class="pdf-section">
                    <h2>💼 OUTRAS FONTES DE RENDA</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Tipo</th>
                                <th>Valor Anual</th>
                                <th>Detalhes</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Salário/Pró-labore</td>
                                <td>${this.formatCurrency(this.state.otherIncome.salario.anual)}</td>
                                <td>${this.state.otherIncome.salario.meses} meses</td>
                            </tr>
                            <tr>
                                <td>Aluguéis</td>
                                <td>${this.formatCurrency(this.state.otherIncome.alugueis.anual)}</td>
                                <td>${this.state.otherIncome.alugueis.meses} meses</td>
                            </tr>
                            <tr>
                                <td>Investimentos</td>
                                <td>${this.formatCurrency(
                                    this.state.otherIncome.investimentos.jurosCapital +
                                    this.state.otherIncome.investimentos.rendimentosAcoes +
                                    this.state.otherIncome.investimentos.rendimentosFIIs
                                )}</td>
                                <td>Juros, ações e FIIs</td>
                            </tr>
                            <tr style="font-weight: bold; background: #e8f4ff;">
                                <td>TOTAL</td>
                                <td>${this.formatCurrency(this.state.totalOtherIncome)}</td>
                                <td>Soma de todas as fontes</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
        `;
        
        // Deduções
        html += `
                <div class="pdf-section">
                    <h2>🧾 DEDUÇÕES IRPF</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Categoria</th>
                                <th>Valor</th>
                                <th>Detalhes</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Dependentes</td>
                                <td>${this.formatCurrency(this.state.deductions.dependentes.total)}</td>
                                <td>${this.state.deductions.dependentes.quantidade} dependente(s)</td>
                            </tr>
                            <tr>
                                <td>Saúde</td>
                                <td>${this.formatCurrency(this.state.deductions.saude.total)}</td>
                                <td>Médicos, medicamentos, plano</td>
                            </tr>
                            <tr>
                                <td>Educação</td>
                                <td>${this.formatCurrency(this.state.deductions.educacao.total)}</td>
                                <td>Faculdade, escola, cursos</td>
                            </tr>
                            <tr>
                                <td>Previdência/Doações</td>
                                <td>${this.formatCurrency(this.state.deductions.previdenciaDoacoes.total)}</td>
                                <td>INSS, PGBL, doações, pensão</td>
                            </tr>
                            <tr>
                                <td>Home Office</td>
                                <td>${this.formatCurrency(this.state.deductions.homeOffice)}</td>
                                <td>Dedução proporcional</td>
                            </tr>
                            <tr style="font-weight: bold; background: #e8f4ff;">
                                <td>TOTAL DEDUÇÕES</td>
                                <td>${this.formatCurrency(this.state.deductions.totalDeducoes)}</td>
                                <td>Soma de todas as deduções</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
        `;
        
        // Simulação IRPF
        html += `
                <div class="pdf-section">
                    <h2>📈 SIMULAÇÃO IRPF 2026</h2>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <div class="simulation-item">
                            <span class="sim-label">Lucro MEI:</span>
                            <span class="sim-value">${this.formatCurrency(lucroMEI)}</span>
                        </div>
                        <div class="simulation-item">
                            <span class="sim-label">(+) Outras Rendas:</span>
                            <span class="sim-value">${this.formatCurrency(this.state.totalOtherIncome)}</span>
                        </div>
                        <div class="simulation-item total">
                            <span class="sim-label">(=) Renda Bruta Total:</span>
                            <span class="sim-value">${this.formatCurrency(sim.rendaBrutaTotal)}</span>
                        </div>
                        <div class="simulation-item">
                            <span class="sim-label">(-) Deduções Totais:</span>
                            <span class="sim-value">${this.formatCurrency(sim.deducoesTotais)}</span>
                        </div>
                        <div class="simulation-item">
                            <span class="sim-label">(-) Dedução Padrão:</span>
                            <span class="sim-value">${this.formatCurrency(this.CONSTANTS.DEDUCAO_PADRAO)}</span>
                        </div>
                        <div class="simulation-item total">
                            <span class="sim-label">(=) Base de Cálculo IRPF:</span>
                            <span class="sim-value">${this.formatCurrency(sim.baseCalculo)}</span>
                        </div>
                    </div>
                    
                    <h3 style="font-size: 14px; margin: 20px 0 10px 0;">Cálculo por Faixas</h3>
                    <table>
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
        
        // Adicionar faixas
        for (let i = 0; i < sim.brackets.length; i++) {
            const bracket = sim.brackets[i];
            const prevMax = i > 0 ? sim.brackets[i-1].max : 0;
            const range = i === 0 ? `Até ${this.formatCurrency(bracket.max)}` : 
                         `${this.formatCurrency(prevMax)} a ${this.formatCurrency(bracket.max)}`;
            
            html += `
                            <tr>
                                <td>${range}</td>
                                <td>${bracket.rate}%</td>
                                <td>${this.formatCurrency(bracket.income)}</td>
                                <td>${this.formatCurrency(bracket.tax)}</td>
                            </tr>
            `;
        }
        
        html += `
                        </tbody>
                        <tfoot>
                            <tr style="font-weight: bold; background: #d4edda;">
                                <td colspan="3">IMPOSTO TOTAL DEVIDO:</td>
                                <td>${this.formatCurrency(sim.impostoDevido)}</td>
                            </tr>
                        </tfoot>
                    </table>
                    
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0;">
                        <div style="padding: 15px; background: #e8f4ff; border-radius: 8px;">
                            <div style="font-size: 11px; color: #555; margin-bottom: 5px;">Situação Fiscal</div>
                            <div style="font-size: 16px; font-weight: bold; color: #0066cc;">${sim.situacaoFiscal}</div>
                        </div>
                        <div style="padding: 15px; background: #e8f4ff; border-radius: 8px;">
                            <div style="font-size: 11px; color: #555; margin-bottom: 5px;">Declaração IRPF</div>
                            <div style="font-size: 16px; font-weight: bold; color: ${sim.declaracaoObrigatoria ? '#ff9800' : '#28a745'};">${sim.declaracaoObrigatoria ? 'OBRIGATÓRIA' : 'NÃO OBRIGATÓRIA'}</div>
                        </div>
                        <div style="padding: 15px; background: #e8f4ff; border-radius: 8px;">
                            <div style="font-size: 11px; color: #555; margin-bottom: 5px;">Alíquota Efetiva</div>
                            <div style="font-size: 16px; font-weight: bold; color: #0066cc;">${sim.aliquotaEfetiva.toFixed(2)}%</div>
                        </div>
                        <div style="padding: 15px; background: #e8f4ff; border-radius: 8px;">
                            <div style="font-size: 11px; color: #555; margin-bottom: 5px;">Base de Cálculo</div>
                            <div style="font-size: 16px; font-weight: bold; color: #0066cc;">${this.formatCurrency(sim.baseCalculo)}</div>
                        </div>
                    </div>
                </div>
        `;
        
        // Observações
        html += `
                <div class="pdf-section">
                    <h2>⚖️ OBSERVAÇÕES FISCAIS</h2>
                    <div class="observations">
                        <p><strong>Este é um relatório de simulação fiscal.</strong> Não substitui a declaração oficial nem o trabalho de um contador.</p>
                        <p><strong>MEI é isento de IRPJ</strong> (Imposto de Renda Pessoa Jurídica) pelo Simples Nacional.</p>
                        <p><strong>IRPF é devido</strong> apenas se a renda tributável ultrapassar R$ ${this.formatNumber(this.CONSTANTS.LIMITE_ISENCAO_IRPF)}/ano.</p>
                        <p><strong>Limite MEI:</strong> R$ ${this.formatNumber(this.CONSTANTS.LIMITE_FATURAMENTO_MEI)} de faturamento anual.</p>
                        <p><strong>Home Office:</strong> Até ${(this.CONSTANTS.PERCENTUAL_HOME_OFFICE * 100)}% das despesas podem ser deduzidas.</p>
                        <p><strong>Consulte um contador</strong> para validação final, declaração e orientações específicas.</p>
                    </div>
                </div>
                
                <footer class="pdf-footer">
                    <p>--- FIM DO RELATÓRIO ---</p>
                    <p class="footer-note">Gerado pelo Assistente Fiscal MEI - Simulador Completo de Impostos</p>
                    <p class="footer-company">S&Q TECNOLOGIA DA INFORMACAO LTDA | CNPJ: 64.684.955/0001-98</p>
                    <p>Gerado em: ${generatedDate} às ${generatedTime}</p>
                </footer>
            </div>
        </body>
        </html>
        `;

        // Escrever no documento da nova janela
        printWindow.document.write(html);
        printWindow.document.close();

        // Aguardar o conteúdo carregar e imprimir
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    }
    
    // Adicione esta função auxiliar para gerar endereços no PDF
    generatePDFAddressInfo(address, tipo = '') {
        if (!address) return '';
        
        let prefix = tipo ? `${tipo}: ` : '';
        
        return `
            <div class="info-item">
                <strong>${prefix}Logradouro</strong>
                <span>${address.logradouro || '-'}</span>
            </div>
            <div class="info-item">
                <strong>${prefix}Número</strong>
                <span>${address.numero || '-'}</span>
            </div>
            <div class="info-item">
                <strong>${prefix}Complemento</strong>
                <span>${address.complemento || '-'}</span>
            </div>
            <div class="info-item">
                <strong>${prefix}Bairro</strong>
                <span>${address.bairro || '-'}</span>
            </div>
            <div class="info-item">
                <strong>${prefix}Cidade/UF</strong>
                <span>${address.cidade || '-'}/${address.uf || '-'}</span>
            </div>
            <div class="info-item">
                <strong>${prefix}CEP</strong>
                <span>${address.cep || '-'}</span>
            </div>
        `;
    }
    
    // Funções auxiliares de formatação (certifique-se de que existam)
    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value || 0);
    }
    
    formatNumber(value) {
        return new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value || 0);
    }
    
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }
    
    exportSimulationData() {
        const simulationData = {
            identificacao: this.state.identification,
            simulacao: this.state.simulation,
            resumo: {
                receitasMEI: this.state.totalRevenueMEI,
                despesasMEI: this.state.totalExpensesMEI,
                outrasRendas: this.state.totalOtherIncome,
                deducoesTotais: this.state.deductions.totalDeducoes,
                baseCalculo: this.state.simulation.baseCalculo,
                impostoDevido: this.state.simulation.impostoDevido,
                aliquotaEfetiva: this.state.simulation.aliquotaEfetiva,
                situacaoFiscal: this.state.simulation.situacaoFiscal,
                declaracaoObrigatoria: this.state.simulation.declaracaoObrigatoria
            },
            geradoEm: new Date().toISOString(),
            versao: '1.0',
            legislacao: 'Baseado na legislação tributária brasileira vigente para 2026'
        };
        
        const dataStr = JSON.stringify(simulationData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `simulacao-irpf-mei-${new Date().getTime()}.json`;
        
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
        if (confirm('Tem certeza que deseja limpar TODOS os dados? Esta ação não pode ser desfeita.')) {
            localStorage.removeItem('meiAssistantState');
            
            // Resetar estado
            this.state = {
                identification: {
                    nome: '',
                    cpf: '',
                    dataNascimento: '',
                    tituloEleitor: '',
                    cnpj: '',
                    dataAbertura: ''
                },
                address: {
                    sameAddress: true,
                    residential: {
                        cep: '',
                        logradouro: '',
                        numero: '',
                        complemento: '',
                        bairro: '',
                        cidade: '',
                        uf: ''
                    },
                    fiscal: null,
                    homeOffice: {
                        areaTotal: 0,
                        areaEscritorio: 0,
                        aluguelMensal: 0,
                        condominioMensal: 0,
                        iptuAnual: 0,
                        energiaMensal: 0,
                        internetMensal: 0
                    }
                },
                activity: {
                    cnae: '',
                    tipoAtividade: '',
                    aliquotaDas: 0,
                    descricaoAtividade: ''
                },
                revenues: [],
                totalRevenueMEI: 0,
                DASAnual: 0,
                expenses: [],
                totalExpensesMEI: 0,
                depreciacoes: [],
                otherIncome: {
                    salario: {
                        mensal: 0,
                        meses: 13,
                        anual: 0
                    },
                    alugueis: {
                        mensal: 0,
                        meses: 12,
                        anual: 0,
                        despesas: 0
                    },
                    investimentos: {
                        dividendos: 0,
                        jurosCapital: 0,
                        rendimentosAcoes: 0,
                        rendimentosFIIs: 0
                    },
                    outrasRendas: {
                        pensaoRecebida: 0,
                        doacoesRecebidas: 0,
                        outrosRendimentos: 0
                    }
                },
                totalOtherIncome: 0,
                deductions: {
                    dependentes: {
                        quantidade: 0,
                        menores: 0,
                        universitarios: 0,
                        total: 0
                    },
                    saude: {
                        medicos: 0,
                        medicamentos: 0,
                        plano: 0,
                        orteses: 0,
                        total: 0
                    },
                    educacao: {
                        faculdade: 0,
                        escola: 0,
                        cursos: 0,
                        material: 0,
                        total: 0
                    },
                    previdenciaDoacoes: {
                        previdenciaOficial: 0,
                        previdenciaPrivada: 0,
                        doacoesDedutiveis: 0,
                        pensaoAlimenticia: 0,
                        total: 0
                    },
                    homeOffice: 0,
                    totalDeducoes: 0
                },
                simulation: {
                    rendaBrutaTotal: 0,
                    deducoesTotais: 0,
                    baseCalculo: 0,
                    impostoDevido: 0,
                    aliquotaEfetiva: 0,
                    situacaoFiscal: "Não tributável",
                    declaracaoObrigatoria: false,
                    detalhesCalculo: '',
                    brackets: []
                },
                currentSection: 'home',
                progress: 0,
                whatIfScenario: {
                    active: false,
                    receitaAdicional: 0,
                    despesaAdicional: 0,
                    dependentesAdicionais: 0,
                    previdenciaAdicional: 0
                }
            };
            
            // Limpar formulários
            document.querySelectorAll('input, select, textarea').forEach(element => {
                if (element.type !== 'button' && element.type !== 'submit') {
                    element.value = '';
                }
                if (element.type === 'checkbox') {
                    element.checked = false;
                }
            });
            
            document.querySelectorAll('select').forEach(select => {
                select.selectedIndex = 0;
            });
            
            // Resetar toggle
            document.getElementById('same-address-toggle').checked = false;
            this.toggleSameAddress(false);
            
            // Atualizar listas
            this.updateRevenuesList();
            this.updateExpensesList();
            
            // Recalcular
            this.calculateAll();
            
            // Navegar para início
            this.navigateTo('home');
            
            alert('Todos os dados foram limpos com sucesso.');
        }
    }
    
    setupMobileLabels() {
        if (window.innerWidth <= 768) {
            // Configurar labels para itens de receita
            const revenueItems = document.querySelectorAll('#revenue-items .list-item');
            revenueItems.forEach(item => {
                const spans = item.querySelectorAll('span');
                if (spans.length >= 6) {
                    spans[0].setAttribute('data-label', 'Cliente/Projeto:');
                    spans[1].setAttribute('data-label', 'Valor:');
                    spans[2].setAttribute('data-label', 'Tipo:');
                    spans[3].setAttribute('data-label', 'Data:');
                    spans[4].setAttribute('data-label', 'Nota Fiscal:');
                }
            });
            
            // Configurar labels para itens de despesa
            const expenseItems = document.querySelectorAll('#expense-items .list-item');
            expenseItems.forEach(item => {
                const spans = item.querySelectorAll('span');
                if (spans.length >= 7) {
                    spans[0].setAttribute('data-label', 'Descrição:');
                    spans[1].setAttribute('data-label', 'Valor:');
                    spans[2].setAttribute('data-label', 'Categoria:');
                    spans[3].setAttribute('data-label', 'Data:');
                    spans[4].setAttribute('data-label', 'Nota Fiscal:');
                    spans[5].setAttribute('data-label', 'Depreciação:');
                }
            });
        }
        
        // Atualizar no resize
        window.addEventListener('resize', () => {
            setTimeout(() => this.setupMobileLabels(), 100);
        });
    }
    
    // Utilitários
    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value || 0);
    }
    
    formatNumber(value) {
        return new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value || 0);
    }
    
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }
}

// Inicializar aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    const assistant = new MEIAssistant();
    window.meiAssistant = assistant; // Para debug
});

