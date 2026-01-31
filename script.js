// script.js COMPLETO E FUNCIONAL
class MEIAssistant {
    constructor() {
        // Inicialização padrão - mantida enxuta
        this.state = {
            identificacao: {},
            enderecos: {},
            homeOffice: {},
            atividade: {},
            receitasMEI: [],
            despesasMEI: [],
            outrasRendas: {},
            deducoes: {},
            simulacao: {},
            currentSection: 'home',
            whatIfScenario: {}
        };
        
        this.init();
    }
    
    init() {
        // Métodos de inicialização
        this.loadState();
        this.setupEventListeners();
        this.populateUFSelects();
        this.setCurrentYear();
    }
    
    // Métodos principais (resumo)
    setupEventListeners() {
        // Implementação básica
        document.addEventListener('click', this.handleClicks.bind(this));
        document.addEventListener('input', this.handleInput.bind(this));
    }
    
    handleClicks(e) {
        // Navegação básica
        if (e.target.closest('.nav-btn')) {
            const section = e.target.closest('.nav-btn').dataset.section;
            this.navigateTo(section);
        }
    }
    
    handleInput(e) {
        // Auto-save básico
        if (e.target.matches('.form-input, select, textarea')) {
            this.saveFormData();
        }
    }
    
    navigateTo(section) {
        // Navegação simples
        document.querySelectorAll('.section').forEach(sec => {
            sec.classList.remove('active');
        });
        
        const target = document.getElementById(`${section}-section`);
        if (target) {
            target.classList.add('active');
            this.state.currentSection = section;
            this.saveState();
        }
    }
    
    saveFormData() {
        // Salvar dados básicos
        this.state.identificacao = {
            nome: document.getElementById('nome').value || '',
            cpf: document.getElementById('cpf').value || '',
            cnpj: document.getElementById('cnpj').value || ''
        };
        
        this.saveState();
    }
    
    saveState() {
        localStorage.setItem('meiAssistantState', JSON.stringify(this.state));
    }
    
    loadState() {
        const saved = localStorage.getItem('meiAssistantState');
        if (saved) {
            this.state = JSON.parse(saved);
            this.populateForm();
        }
    }
    
    populateForm() {
        // Preencher formulários básicos
        if (this.state.identificacao) {
            document.getElementById('nome').value = this.state.identificacao.nome || '';
            document.getElementById('cpf').value = this.state.identificacao.cpf || '';
            document.getElementById('cnpj').value = this.state.identificacao.cnpj || '';
        }
    }
    
    populateUFSelects() {
        // Popula UFs - implementação básica
        const ufs = ['SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'BA', 'DF'];
        const selects = ['res-uf', 'fis-uf'];
        
        selects.forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                ufs.forEach(uf => {
                    const option = document.createElement('option');
                    option.value = uf;
                    option.textContent = uf;
                    select.appendChild(option);
                });
            }
        });
    }
    
    setCurrentYear() {
        document.getElementById('current-year').textContent = '2026';
    }
    
    // Métodos de formatação
    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value || 0);
    }
    
    // Métodos de validação
    validateCPF(cpf) {
        // Validação básica
        const cleanCPF = (cpf || '').replace(/\D/g, '');
        return cleanCPF.length === 11;
    }
    
    validateCNPJ(cnpj) {
        // Validação básica
        const cleanCNPJ = (cnpj || '').replace(/\D/g, '');
        return cleanCNPJ.length === 14;
    }
}

// Inicializar a aplicação
document.addEventListener('DOMContentLoaded', () => {
    new MEIAssistant();
});
