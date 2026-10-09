(function () {
    const state = {
        promotorias: [],
        correicoes: [],
        editingId: null,
    };

    const form = document.querySelector('#correicao-form');
    const feedback = document.querySelector('#feedback');
    const body = document.querySelector('#correicoes-body');
    const emptyState = document.querySelector('#empty-state');
    const searchInput = document.querySelector('#search-input');
    const yearFilter = document.querySelector('#year-filter');
    const promotoriaSelect = document.querySelector('#promotoria-id');
    const dateInput = document.querySelector('#data-correcao');
    const formTitle = document.querySelector('#form-title');
    const cancelButton = document.querySelector('#cancel-button');
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    yearFilter.value = new Date().getFullYear();

    function apiData(payload) {
        return payload.results || payload;
    }

    async function apiFetch(url, options) {
        const config = options || {};
        config.credentials = 'same-origin';
        config.headers = Object.assign({ Accept: 'application/json' }, config.headers || {});
        const method = (config.method || 'GET').toUpperCase();
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
            config.headers['X-CSRFToken'] = csrfToken;
        }
        if (config.body) {
            config.headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(url, config);
        if (response.status === 401 || response.status === 403) {
            const error = await response.json().catch(() => ({}));
            const detail = error.detail || 'Sessão expirada ou acesso negado.';
            if (response.status === 401 || /authentication credentials were not provided|credenciais.*não foram fornecidas/i.test(detail)) {
                window.location.href = `/login/?next=${encodeURIComponent(window.location.pathname)}`;
            }
            throw new Error(detail);
        }
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(Object.values(error).flat().join(' ') || 'Não foi possível concluir a operação.');
        }
        return response.status === 204 ? null : response.json();
    }

    async function apiAllPages(url) {
        const items = [];
        while (url) {
            const payload = await apiFetch(url);
            items.push(...apiData(payload));
            if (!payload.next) break;
            const next = new URL(payload.next, window.location.origin);
            url = `${next.pathname}${next.search}`;
        }
        return items;
    }

    function escapeHtml(value) {
        return String(value).replace(/[&<>'"]/g, (character) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;'
        }[character]));
    }

    function formatDate(date) {
        const [year, month, day] = date.split('-');
        return `${day}/${month}/${year}`;
    }

    function showFeedback(message, type) {
        feedback.textContent = message;
        feedback.className = `alert alert-${type}`;
        feedback.hidden = false;
        window.setTimeout(() => { feedback.hidden = true; }, 4500);
    }

    function fillPromotorias() {
        promotoriaSelect.innerHTML = '<option value="">Selecione uma promotoria</option>';
        state.promotorias.forEach((promotoria) => {
            const option = document.createElement('option');
            option.value = promotoria.id;
            option.textContent = promotoria.nome_promotoria;
            promotoriaSelect.appendChild(option);
        });
    }

    function filteredCorreicoes() {
        const year = Number(yearFilter.value);
        const query = searchInput.value.trim().toLocaleLowerCase();
        return state.correicoes
            .filter((item) => Number(item.data_correcao.slice(0, 4)) === year)
            .filter((item) => item.nome_promotoria.toLocaleLowerCase().includes(query))
            .sort((first, second) => (
                first.data_correcao.localeCompare(second.data_correcao)
                || first.nome_promotoria.localeCompare(second.nome_promotoria, 'pt-BR')
            ));
    }

    function renderCorreicoes() {
        const correicoes = filteredCorreicoes();
        body.innerHTML = correicoes.map((item) => `
            <tr>
                <td>${escapeHtml(item.nome_promotoria)}</td>
                <td>${escapeHtml(formatDate(item.data_correcao))}</td>
                <td>${item.confirme_correcao ? 'Sim' : 'Não'}</td>
                <td>
                    <div class="row-actions">
                        <button class="button button-confirm" data-confirm="${item.id}" type="button" ${item.confirme_correcao ? 'disabled' : ''}>
                            ${item.confirme_correcao ? 'Confirmada' : 'Confirmar'}
                        </button>
                        <button class="button button-small" data-edit="${item.id}" type="button">Editar</button>
                        <button class="button button-danger" data-delete="${item.id}" type="button">Excluir</button>
                    </div>
                </td>
            </tr>
        `).join('');
        emptyState.hidden = correicoes.length > 0;
        document.querySelector('#correicao-count').textContent = correicoes.length;
    }

    function resetForm() {
        state.editingId = null;
        form.reset();
        formTitle.textContent = 'Nova correição';
        cancelButton.hidden = true;
        promotoriaSelect.disabled = false;
    }

    async function editCorreicao(id) {
        try {
            const item = await apiFetch(`/api/correicoes/${id}/`);
            state.editingId = id;
            promotoriaSelect.value = item.promotoria_id;
            promotoriaSelect.disabled = true;
            dateInput.value = item.data_correcao;
            formTitle.textContent = 'Editar correição';
            cancelButton.hidden = false;
            form.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch (error) {
            showFeedback(error.message, 'error');
        }
    }

    async function deleteCorreicao(id) {
        if (!window.confirm('Excluir esta correição?')) return;
        try {
            await apiFetch(`/api/correicoes/${id}/`, { method: 'DELETE' });
            state.correicoes = state.correicoes.filter((item) => item.id !== id);
            renderCorreicoes();
            showFeedback('Correição excluída.', 'success');
        } catch (error) {
            showFeedback(error.message, 'error');
        }
    }

    async function confirmCorreicao(id) {
        const item = state.correicoes.find((correicao) => correicao.id === id);
        if (!item || item.confirme_correcao) return;
        if (!window.confirm(`Confirmar que a correição de ${item.nome_promotoria} foi realizada?`)) return;

        try {
            const updated = await apiFetch(`/api/correicoes/${id}/`, {
                method: 'PATCH',
                body: JSON.stringify({ confirme_correcao: true }),
            });
            state.correicoes = state.correicoes.map((existing) => existing.id === updated.id ? updated : existing);
            renderCorreicoes();
            showFeedback('Correição confirmada como realizada.', 'success');
        } catch (error) {
            showFeedback(error.message, 'error');
        }
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const payload = {
            promotoria_id: Number(promotoriaSelect.value),
            data_correcao: dateInput.value,
        };
        const url = state.editingId
            ? `/api/correicoes/${state.editingId}/`
            : '/api/correicoes/';
        try {
            const item = await apiFetch(url, {
                method: state.editingId ? 'PATCH' : 'POST',
                body: JSON.stringify(payload),
            });
            if (state.editingId) {
                state.correicoes = state.correicoes.map((existing) => existing.id === item.id ? item : existing);
            } else {
                state.correicoes.push(item);
            }
            yearFilter.value = Number(item.data_correcao.slice(0, 4));
            renderCorreicoes();
            resetForm();
            showFeedback('Correição salva com sucesso.', 'success');
        } catch (error) {
            showFeedback(error.message, 'error');
        }
    });

    body.addEventListener('click', (event) => {
        const confirmButton = event.target.closest('[data-confirm]');
        const editButton = event.target.closest('[data-edit]');
        const deleteButton = event.target.closest('[data-delete]');
        if (confirmButton) confirmCorreicao(Number(confirmButton.dataset.confirm));
        if (editButton) editCorreicao(Number(editButton.dataset.edit));
        if (deleteButton) deleteCorreicao(Number(deleteButton.dataset.delete));
    });

    yearFilter.addEventListener('input', renderCorreicoes);
    searchInput.addEventListener('input', renderCorreicoes);
    cancelButton.addEventListener('click', resetForm);

    async function loadData() {
        try {
            const [promotorias, correicoes] = await Promise.all([
                apiAllPages('/api/promotorias/?page_size=100'),
                apiAllPages('/api/correicoes/?page_size=600'),
            ]);
            state.promotorias = promotorias;
            state.correicoes = correicoes;
            fillPromotorias();
            renderCorreicoes();
        } catch (error) {
            showFeedback(error.message, 'error');
        }
    }

    loadData();
}());
