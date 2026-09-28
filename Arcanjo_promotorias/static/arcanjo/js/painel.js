(function () {
    const state = {
        relations: [],
        promotorias: [],
        resolucoes: [],
        editingId: null,
    };

    const form = document.querySelector('#relation-form');
    const feedback = document.querySelector('#feedback');
    const body = document.querySelector('#relations-body');
    const emptyState = document.querySelector('#empty-state');
    const searchInput = document.querySelector('#search-input');
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
        const relations = state.relations.filter((relation) => {
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
        });
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
        document.querySelector('#relation-count').textContent = state.relations.length;
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

    function editRelation(id) {
        const relation = state.relations.find((item) => item.id === id);
        if (!relation) return;
        state.editingId = id;
        promotoriaInput.value = relation.promotoria.nome_promotoria;
        updatePromotoriaFields();
        resolucaoSelect.value = relation.resolucao.id;
        unidadeInput.value = relation.Unidade || '';
        formTitle.textContent = 'Editar relação';
        cancelButton.hidden = false;
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    async function removeRelation(id) {
        if (!window.confirm('Excluir esta relação?')) return;
        try {
            await apiFetch(`/api/promotorias-resolucoes/${id}/`, { method: 'DELETE' });
            state.relations = state.relations.filter((item) => item.id !== id);
            renderRelations();
            showFeedback('Relação excluída.', 'success');
        } catch (error) {
            showFeedback(error.message, 'error');
        }
    }

    async function loadData() {
        try {
            const [relations, promotorias, resolucoes] = await Promise.all([
                apiFetch('/api/promotorias-resolucoes/'),
                apiFetch('/api/promotorias/'),
                apiFetch('/api/resolucoes/'),
            ]);
            state.relations = apiData(relations);
            state.promotorias = apiData(promotorias);
            state.resolucoes = apiData(resolucoes);
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
            }
            renderRelations();
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
    searchInput.addEventListener('input', renderRelations);
    loadData();
})();