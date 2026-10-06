(function () {
    const state = {
        relations: [],
        promotorias: [],
        resolucoes: [],
        currentPage: 1,
        totalPages: 1,
        totalRelations: 0,
        searchResults: null,
        allRelationsPromise: null,
        searchTimer: null,
        searchRequest: 0,
        editingId: null,
    };

    const form = document.querySelector('#relation-form');
    const feedback = document.querySelector('#feedback');
    const body = document.querySelector('#relations-body');
    const emptyState = document.querySelector('#empty-state');
    const searchInput = document.querySelector('#search-input');
    const previousPageButton = document.querySelector('#previous-page');
    const nextPageButton = document.querySelector('#next-page');
    const pageIndicator = document.querySelector('#page-indicator');
    const promotoriaInput = document.querySelector('#promotoria-name');
    const promotoriaOptions = document.querySelector('#promotorias-options');
    const newPromotoriaFields = document.querySelector('#new-promotoria-fields');
    const newPromotoriaEntrancia = document.querySelector('#new-promotoria-entrancia');
    const resolucaoSelect = document.querySelector('#resolucao-id');
    const unidadeInput = document.querySelector('#unidade');
    const formTitle = document.querySelector('#form-title');
    const cancelButton = document.querySelector('#cancel-button');
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    function apiData(payload) {
        return payload.results || payload;
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
        if (response.status === 401) {
            window.location.href = `/login/?next=${encodeURIComponent(window.location.pathname)}`;
            throw new Error('Sessão expirada.');
        }
        if (response.status === 403) {
            let detail = 'Acesso negado.';
            try {
                const error = await response.json();
                detail = error.detail || detail;
            } catch (ignored) {
                // Mantém uma mensagem padrão quando a resposta não é JSON.
            }
            if (/authentication credentials were not provided|credenciais.*não foram fornecidas/i.test(detail)) {
                window.location.href = `/login/?next=${encodeURIComponent(window.location.pathname)}`;
                throw new Error('Sessão expirada.');
            }
            throw new Error(detail);
        }
        if (!response.ok) {
            let detail = 'Não foi possível concluir a operação.';
            try {
                const error = await response.json();
                detail = Object.values(error).flat().join(' ');
            } catch (ignored) {
                // Mantém a mensagem padrão quando a resposta não é JSON.
            }
            throw new Error(detail);
        }
        return response.status === 204 ? null : response.json();
    }

    function showFeedback(message, type) {
        feedback.textContent = message;
        feedback.className = `alert alert-${type}`;
        feedback.hidden = false;
        window.setTimeout(() => { feedback.hidden = true; }, 4500);
    }

    function optionLabel(item, name) {
        return `${item.id} - ${item[name]}`;
    }

    function fillSelect(select, items, name) {
        select.innerHTML = '<option value="">Selecione uma chave</option>';
        items.forEach((item) => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = optionLabel(item, name);
            select.appendChild(option);
        });
    }

    function fillPromotoriaOptions(items) {
        promotoriaOptions.innerHTML = '';
        items.forEach((item) => {
            const option = document.createElement('option');
            option.value = item.nome_promotoria;
            promotoriaOptions.appendChild(option);
        });
    }

    function fillEntranciaOptions(items) {
        newPromotoriaEntrancia.innerHTML = '<option value="">Selecione a entrância</option>';
        const entrancias = [...new Set(items.map((item) => item.entrancia.trim()).filter(Boolean))]
            .sort((first, second) => first.localeCompare(second, 'pt-BR'));
        entrancias.forEach((entrancia) => {
            const option = document.createElement('option');
            option.value = entrancia;
            option.textContent = entrancia;
            newPromotoriaEntrancia.appendChild(option);
        });
    }

    function updatePromotoriaFields() {
        const name = promotoriaInput.value.trim().toLocaleLowerCase();
        const exists = state.promotorias.some((item) => (
            item.nome_promotoria.trim().toLocaleLowerCase() === name
        ));
        const isCreating = Boolean(name) && !exists;
        newPromotoriaFields.hidden = !isCreating;
        newPromotoriaEntrancia.disabled = !isCreating;
        newPromotoriaEntrancia.required = isCreating;
        if (!isCreating) newPromotoriaEntrancia.value = '';
    }

    function renderRelations() {
        const query = searchInput.value.trim().toLowerCase();
        const totalPages = state.searchResults === null
            ? state.totalPages
            : Math.max(1, Math.ceil(state.searchResults.length / 20));
        state.currentPage = Math.min(state.currentPage, totalPages);
        const currentRelations = state.searchResults === null
            ? state.relations
            : state.searchResults.slice((state.currentPage - 1) * 20, state.currentPage * 20);
        const relations = currentRelations.filter((relation) => matchesRelation(relation, query));
        body.innerHTML = relations.map((relation) => `
            <tr>
                <td>${escapeHtml(relation.promotoria?.nome_promotoria || '-')} <small>#${relation.promotoria?.id || '-'}</small></td>
                <td>${escapeHtml(relation.Unidade || '-')}</td>
                <td>${escapeHtml(relation.resolucao?.nome_resolucao || '-')} <small>#${relation.resolucao?.id || '-'}</small></td>
                <td>${escapeHtml(relation.resolucao?.ano_resolucao ?? '-')}</td>
                <td>${escapeHtml(relation.resolucao?.numero_resolucao ?? '-')}</td>
                <td>
                    <div class="row-actions">
                        <button class="button button-small" data-edit="${relation.id}" type="button">Editar</button>
                        <button class="button button-danger" data-delete="${relation.id}" type="button">Excluir</button>
                    </div>
                </td>
            </tr>
        `).join('');
        emptyState.hidden = relations.length > 0;
        document.querySelector('#relation-count').textContent = state.totalRelations;
        pageIndicator.textContent = `Página ${state.currentPage} de ${totalPages}`;
        previousPageButton.disabled = state.currentPage <= 1;
        nextPageButton.disabled = state.currentPage >= totalPages;
    }

    function matchesRelation(relation, query) {
        const text = [
            relation.promotoria?.nome_promotoria,
            relation.resolucao?.nome_resolucao,
            relation.resolucao?.ano_resolucao,
            relation.resolucao?.numero_resolucao,
            relation.Unidade,
            relation.promotoria?.id,
            relation.resolucao?.id,
        ].join(' ').toLowerCase();
        return text.includes(query);
    }

    function loadAllRelations() {
        if (!state.allRelationsPromise) {
            state.allRelationsPromise = (async () => {
                const allRelations = [];
                let url = '/api/promotorias-resolucoes/?page_size=100';
                while (url) {
                    const payload = await apiFetch(url);
                    allRelations.push(...apiData(payload));
                    if (!payload.next) break;
                    const next = new URL(payload.next, window.location.origin);
                    url = `${next.pathname}${next.search}`;
                }
                return allRelations;
            })().catch((error) => {
                state.allRelationsPromise = null;
                throw error;
            });
        }
        return state.allRelationsPromise;
    }

    async function applyRelationSearch() {
        const query = searchInput.value.trim().toLowerCase();
        const requestId = ++state.searchRequest;
        if (!query) {
            state.searchResults = null;
            await loadRelations(1);
            return;
        }
        try {
            const allRelations = await loadAllRelations();
            if (requestId !== state.searchRequest) return;
            state.searchResults = allRelations.filter((relation) => matchesRelation(relation, query));
            state.currentPage = 1;
            renderRelations();
        } catch (error) {
            showFeedback(error.message, 'error');
        }
    }

    async function loadRelations(page) {
        state.searchRequest += 1;
        const payload = await apiFetch(`/api/promotorias-resolucoes/?page=${page}`);
        state.relations = apiData(payload);
        state.currentPage = page;
        state.totalRelations = payload.count ?? state.relations.length;
        state.totalPages = Math.max(1, Math.ceil(state.totalRelations / 20));
        renderRelations();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function escapeHtml(value) {
        return String(value).replace(/[&<>'"]/g, (character) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;'
        }[character]));
    }

    function resetForm() {
        state.editingId = null;
        form.reset();
        updatePromotoriaFields();
        formTitle.textContent = 'Nova relação';
        cancelButton.hidden = true;
    }

    async function editRelation(id) {
        try {
            const relations = state.searchResults === null ? state.relations : state.searchResults;
            const relation = relations.find((item) => item.id === id)
                || await apiFetch(`/api/promotorias-resolucoes/${id}/`);
            state.editingId = id;
            promotoriaInput.value = relation.promotoria.nome_promotoria;
            updatePromotoriaFields();
            resolucaoSelect.value = relation.resolucao.id;
            unidadeInput.value = relation.Unidade || '';
            formTitle.textContent = 'Editar relação';
            cancelButton.hidden = false;
            form.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch (error) {
            showFeedback(error.message, 'error');
        }
    }

    async function removeRelation(id) {
        if (!window.confirm('Excluir esta relação?')) return;
        try {
            await apiFetch(`/api/promotorias-resolucoes/${id}/`, { method: 'DELETE' });
            state.totalRelations = Math.max(0, state.totalRelations - 1);
            state.allRelationsPromise = null;
            if (state.searchResults !== null) {
                await applyRelationSearch();
            } else {
                const lastPage = Math.max(1, Math.ceil(state.totalRelations / 20));
                await loadRelations(Math.min(state.currentPage, lastPage));
            }
            showFeedback('Relação excluída.', 'success');
        } catch (error) {
            showFeedback(error.message, 'error');
        }
    }

    async function loadData() {
        try {
            const [relations, promotorias, resolucoes] = await Promise.all([
                apiFetch('/api/promotorias-resolucoes/'),
                apiAllPages('/api/promotorias/?page_size=100'),
                apiAllPages('/api/resolucoes/?page_size=100'),
            ]);
            state.relations = apiData(relations);
            state.totalRelations = relations.count ?? state.relations.length;
            state.totalPages = Math.max(1, Math.ceil(state.totalRelations / 20));
            state.currentPage = 1;
            state.promotorias = promotorias;
            state.resolucoes = resolucoes;
            fillPromotoriaOptions(state.promotorias);
            fillEntranciaOptions(state.promotorias);
            fillSelect(resolucaoSelect, state.resolucoes, 'nome_resolucao');
            renderRelations();
        } catch (error) {
            showFeedback(error.message, 'error');
        }
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        try {
            const promotoriaName = promotoriaInput.value.trim();
            const existingPromotoria = state.promotorias.find((item) => (
                item.nome_promotoria.trim().toLocaleLowerCase() === promotoriaName.toLocaleLowerCase()
            ));
            let promotoriaId;
            if (existingPromotoria) {
                promotoriaId = existingPromotoria.id;
            } else {
                const promotoria = await apiFetch('/api/promotorias/', {
                    method: 'POST',
                    body: JSON.stringify({
                        nome_promotoria: promotoriaName,
                        entrancia: newPromotoriaEntrancia.value.trim(),
                    }),
                });
                state.promotorias.push(promotoria);
                fillPromotoriaOptions(state.promotorias);
                promotoriaId = promotoria.id;
            }
            const payload = {
                promotoria_id: promotoriaId,
                resolucao_id: Number(resolucaoSelect.value),
                Unidade: unidadeInput.value.trim(),
            };
            const url = state.editingId
                ? `/api/promotorias-resolucoes/${state.editingId}/`
                : '/api/promotorias-resolucoes/';
            const relation = await apiFetch(url, {
                method: state.editingId ? 'PATCH' : 'POST',
                body: JSON.stringify(payload),
            });
            if (state.editingId) {
                state.relations = state.relations.map((item) => item.id === relation.id ? relation : item);
            } else {
                state.relations.unshift(relation);
                state.relations = state.relations.slice(0, 20);
                state.totalRelations += 1;
                state.totalPages = Math.max(1, Math.ceil(state.totalRelations / 20));
            }
            state.allRelationsPromise = null;
            if (state.searchResults !== null) {
                await applyRelationSearch();
            } else {
                renderRelations();
            }
            resetForm();
            showFeedback('Relação salva com sucesso.', 'success');
        } catch (error) {
            showFeedback(error.message, 'error');
        }
    });

    promotoriaInput.addEventListener('input', updatePromotoriaFields);
    body.addEventListener('click', (event) => {
        const editButton = event.target.closest('[data-edit]');
        const deleteButton = event.target.closest('[data-delete]');
        if (editButton) editRelation(Number(editButton.dataset.edit));
        if (deleteButton) removeRelation(Number(deleteButton.dataset.delete));
    });

    cancelButton.addEventListener('click', resetForm);
    searchInput.addEventListener('input', () => {
        window.clearTimeout(state.searchTimer);
        state.searchTimer = window.setTimeout(applyRelationSearch, 250);
    });
    previousPageButton.addEventListener('click', () => {
        if (state.currentPage > 1) {
            if (state.searchResults !== null) {
                state.currentPage -= 1;
                renderRelations();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                loadRelations(state.currentPage - 1).catch((error) => showFeedback(error.message, 'error'));
            }
        }
    });
    nextPageButton.addEventListener('click', () => {
        const totalPages = state.searchResults === null
            ? state.totalPages
            : Math.max(1, Math.ceil(state.searchResults.length / 20));
        if (state.currentPage < totalPages) {
            if (state.searchResults !== null) {
                state.currentPage += 1;
                renderRelations();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                loadRelations(state.currentPage + 1).catch((error) => showFeedback(error.message, 'error'));
            }
        }
    });
    loadData();
})();