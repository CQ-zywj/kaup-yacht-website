(function (root) {
  function row(person = {}, index = -1) {
    return `<div class="panel team-editor-row" data-person-index="${index}"><div class="form-grid"><div class="field"><label>${U.tr('teamName')}<input name="team_name" value="${U.e(person.name || '')}" required></label></div><div class="field"><label>${U.tr('position')}<input name="team_position" value="${U.e(person.position || '')}"></label></div><div class="field full"><label>${U.tr('teamIntro')}<textarea name="team_intro">${U.e(person.intro || '')}</textarea></label></div><div class="field"><label>${U.tr('teamPhoto')}<input name="team_photo" type="file" accept=".jpg,.jpeg,.png"></label><small>${U.tr('teamPhotoHint')}</small>${person.photo?.id ? `<img class="team-editor-photo" data-local-file="${U.e(person.photo.id)}" alt="${U.e(person.name || '')}">` : ''}</div></div><button type="button" class="link-button danger" data-remove-person>${U.tr('delete')}</button></div>`;
  }
  function editor(team) {
    return `<section class="panel" id="company-team"><h2>${U.tr('companyTeam')}</h2><div id="team-editor-list">${team.map(row).join('')}</div><button type="button" class="button secondary" id="team-add">+ ${U.tr('addTeamMember')}</button></section>`;
  }
  function bind() {
    const list = document.getElementById('team-editor-list');
    document.getElementById('team-add').onclick = () => { list.insertAdjacentHTML('beforeend',row()); U.translate(); };
    list.onclick = event => { event.target.closest('[data-remove-person]')?.closest('[data-person-index]').remove(); };
    list.onchange = event => {
      if (event.target.name !== 'team_photo') return;
      const file = event.target.files[0]; if (!file) return;
      const previous = event.target.closest('[data-person-index]').querySelector('.team-editor-photo');
      if (previous?.dataset.previewUrl) URL.revokeObjectURL(previous.dataset.previewUrl);
      previous?.remove();
      const image = document.createElement('img'); image.className = 'team-editor-photo'; image.alt = file.name;
      image.src = URL.createObjectURL(file); image.dataset.previewUrl = image.src; event.target.closest('.field').append(image);
    };
  }
  async function collect(form, previous, owner) {
    const rows = [...form.querySelectorAll('[data-person-index]')];
    for (const row of rows) {
      const name = row.querySelector('[name=team_name]').value.trim();
      if (!name) throw Error(U.t('teamNameRequired'));
      for (const file of row.querySelector('[name=team_photo]').files) {
        const key = SupplierData.fileError(file,'team'); if (key) throw Error(U.t(key));
      }
    }
    const team = [];
    for (const row of rows) {
      const files = [...row.querySelector('[name=team_photo]').files];
      team.push({name:row.querySelector('[name=team_name]').value.trim(),position:row.querySelector('[name=team_position]').value.trim(),intro:row.querySelector('[name=team_intro]').value.trim(),photo:files.length ? (await SupplierFiles.putMany(files,owner,'team'))[0] : previous[Number(row.dataset.personIndex)]?.photo || null});
    }
    return team;
  }
  root.CompanyTeam = {editor,bind,collect};
})(window);
